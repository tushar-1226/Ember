import uuid
import asyncio
import os
import time
import httpx
from datetime import datetime
from database import SessionLocal, UserConnection, AmbientEvent

async def sync_spotify_real():
    with SessionLocal() as db:
        connection = db.query(UserConnection).filter_by(provider="spotify", status="connected").first()
        if not connection or not connection.access_token or connection.access_token == "mock_token":
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
                        
                        # Add event
                        event = AmbientEvent(
                            id=str(uuid.uuid4()),
                            provider="spotify",
                            event_summary=event_summary,
                            timestamp=datetime.utcnow()
                        )
                        db.add(event)
                        print(f"[Ember Flower] Spotify Sync: {event_summary}")
        except Exception as e:
            print(f"[Ember Flower] Spotify Sync Error: {e}")

        connection.last_synced = datetime.utcnow()
        db.commit()

async def sync_notion_real():
    with SessionLocal() as db:
        connection = db.query(UserConnection).filter_by(provider="notion", status="connected").first()
        if not connection or not connection.access_token or connection.access_token == "mock_token":
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
                        
                        event = AmbientEvent(
                            id=str(uuid.uuid4()),
                            provider="notion",
                            event_summary=event_summary,
                            timestamp=datetime.utcnow()
                        )
                        db.add(event)
                        print(f"[Ember Flower] Notion Sync: {event_summary}")
        except Exception as e:
            print(f"[Ember Flower] Notion Sync Error: {e}")
            
        connection.last_synced = datetime.utcnow()
        db.commit()

async def sync_obsidian_real():
    with SessionLocal() as db:
        connection = db.query(UserConnection).filter_by(provider="obsidian", status="connected").first()
        if not connection or not connection.access_token or connection.access_token == "mock_token":
            return
            
        vault_path = connection.access_token
        if not os.path.isdir(vault_path):
            print(f"[Ember Flower] Obsidian Sync Error: Invalid vault path '{vault_path}'")
            return

        # Check for files modified in last 5 minutes
        five_mins_ago = time.time() - 300
        events_added = 0
        
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
                                event = AmbientEvent(
                                    id=str(uuid.uuid4()),
                                    provider="obsidian",
                                    event_summary=event_summary,
                                    timestamp=datetime.utcnow()
                                )
                                db.add(event)
                                events_added += 1
                                print(f"[Ember Flower] Obsidian Sync: {event_summary}")
                        except OSError:
                            pass
        except Exception as e:
            print(f"[Ember Flower] Obsidian Sync Error: {e}")

        connection.last_synced = datetime.utcnow()
        db.commit()


async def flower_background_task():
    """A background loop that periodically 'syncs' connected services."""
    while True:
        try:
            await sync_spotify_real()
            await sync_notion_real()
            await sync_obsidian_real()
            # We are omitting Slack/Read since they weren't explicitly requested to be real
            # but you can add them back as mocks or implement real versions similarly.
        except Exception as e:
            print(f"[Ember Flower] Background Sync Error: {e}")
        
        # Run every 5 minutes
        await asyncio.sleep(300)
