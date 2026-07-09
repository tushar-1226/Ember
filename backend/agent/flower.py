import uuid
import asyncio
import os
import time
import httpx
from datetime import datetime
from database import SessionLocal, UserConnection, AmbientEvent

# Each sync function is handed an already-fetched UserConnection row (one user's
# credential for one provider) rather than looking one up itself — the caller
# (either the per-user /flower/sync route or the background loop below) is
# responsible for scoping to the right user.

async def sync_spotify_real(connection: UserConnection):
    if not connection.access_token or connection.access_token == "mock_token":
        return

    headers = {"Authorization": f"Bearer {connection.access_token}"}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://api.spotify.com/v1/me/player/recently-played?limit=1", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data.get("items"):
                    track = data["items"][0]["track"]
                    track_name = track.get("name", "Unknown Track")
                    artist_name = track["artists"][0]["name"] if track.get("artists") else "Unknown Artist"
                    event_summary = f"Listened to '{track_name}' by {artist_name}"

                    with SessionLocal() as db:
                        db.add(AmbientEvent(
                            id=str(uuid.uuid4()),
                            user_id=connection.user_id,
                            provider="spotify",
                            event_summary=event_summary,
                            timestamp=datetime.utcnow()
                        ))
                        db.commit()
                    print(f"[Ember Flower] Spotify Sync: {event_summary}")
    except Exception as e:
        print(f"[Ember Flower] Spotify Sync Error: {e}")

    with SessionLocal() as db:
        db.query(UserConnection).filter(UserConnection.id == connection.id).update({"last_synced": datetime.utcnow()})
        db.commit()

async def sync_notion_real(connection: UserConnection):
    if not connection.access_token or connection.access_token == "mock_token":
        return

    headers = {
        "Authorization": f"Bearer {connection.access_token}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.notion.com/v1/search",
                headers=headers,
                json={
                    "sort": {"direction": "descending", "timestamp": "last_edited_time"},
                    "page_size": 1
                }
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("results"):
                    latest_page = data["results"][0]
                    title = "Unknown Page"
                    if "properties" in latest_page:
                        for prop_name, prop_data in latest_page["properties"].items():
                            if prop_data.get("type") == "title":
                                title_arr = prop_data.get("title", [])
                                if title_arr:
                                    title = title_arr[0].get("plain_text", title)
                                break
                    event_summary = f"Updated Notion page '{title}'"

                    with SessionLocal() as db:
                        db.add(AmbientEvent(
                            id=str(uuid.uuid4()),
                            user_id=connection.user_id,
                            provider="notion",
                            event_summary=event_summary,
                            timestamp=datetime.utcnow()
                        ))
                        db.commit()
                    print(f"[Ember Flower] Notion Sync: {event_summary}")
    except Exception as e:
        print(f"[Ember Flower] Notion Sync Error: {e}")

    with SessionLocal() as db:
        db.query(UserConnection).filter(UserConnection.id == connection.id).update({"last_synced": datetime.utcnow()})
        db.commit()

async def sync_obsidian_real(connection: UserConnection):
    vault_path = connection.access_token
    if not vault_path or not os.path.isdir(vault_path):
        print(f"[Ember Flower] Obsidian Sync Error: Invalid vault path '{vault_path}'")
        return

    # Check for files modified in last 5 minutes
    five_mins_ago = time.time() - 300

    try:
        for root, dirs, files in os.walk(vault_path):
            # Ignore hidden directories like .obsidian
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                if file.endswith(".md"):
                    filepath = os.path.join(root, file)
                    try:
                        mtime = os.path.getmtime(filepath)
                        if mtime > five_mins_ago:
                            event_summary = f"Updated Obsidian note '{file}'"
                            with SessionLocal() as db:
                                db.add(AmbientEvent(
                                    id=str(uuid.uuid4()),
                                    user_id=connection.user_id,
                                    provider="obsidian",
                                    event_summary=event_summary,
                                    timestamp=datetime.utcnow()
                                ))
                                db.commit()
                            print(f"[Ember Flower] Obsidian Sync: {event_summary}")
                    except OSError:
                        pass
    except Exception as e:
        print(f"[Ember Flower] Obsidian Sync Error: {e}")

    with SessionLocal() as db:
        db.query(UserConnection).filter(UserConnection.id == connection.id).update({"last_synced": datetime.utcnow()})
        db.commit()


_SYNC_BY_PROVIDER = {
    "spotify": sync_spotify_real,
    "notion": sync_notion_real,
    "obsidian": sync_obsidian_real,
}


async def sync_user_connections(user_id: str):
    """Sync every connected provider for one user (used by the manual /flower/sync route)."""
    with SessionLocal() as db:
        connections = db.query(UserConnection).filter_by(user_id=user_id, status="connected").all()
        connections = [(c.id, c.provider) for c in connections]
    for conn_id, provider in connections:
        sync_fn = _SYNC_BY_PROVIDER.get(provider)
        if not sync_fn:
            continue
        with SessionLocal() as db:
            connection = db.query(UserConnection).filter(UserConnection.id == conn_id).first()
        if connection:
            await sync_fn(connection)


async def flower_background_task():
    """A background loop that periodically syncs every connected service, for every user."""
    while True:
        try:
            with SessionLocal() as db:
                connections = db.query(UserConnection).filter_by(status="connected").all()
                connections = [(c.id, c.provider) for c in connections]
            for conn_id, provider in connections:
                sync_fn = _SYNC_BY_PROVIDER.get(provider)
                if not sync_fn:
                    continue
                with SessionLocal() as db:
                    connection = db.query(UserConnection).filter(UserConnection.id == conn_id).first()
                if connection:
                    await sync_fn(connection)
        except Exception as e:
            print(f"[Ember Flower] Background Sync Error: {e}")

        # Run every 5 minutes
        await asyncio.sleep(300)
