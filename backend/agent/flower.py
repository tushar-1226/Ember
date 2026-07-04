import uuid
import asyncio
from datetime import datetime
from database import SessionLocal, UserConnection, AmbientEvent

# Mock Data Generation
MOCK_SPOTIFY_EVENTS = [
    "Listened to 'Weightless' by Marconi Union",
    "Listened to 'Lofi Beats' Playlist",
    "Skipped 3 songs in a row on 'Focus' playlist",
]

MOCK_NOTION_EVENTS = [
    "Updated 'Q3 Goals & OKRs'",
    "Created new page 'Project Phoenix Launch Plan'",
    "Checked off 5 items in 'Weekly To-Do'",
]

async def mock_sync_spotify():
    """Mock fetching data from Spotify and storing as an Ambient Event."""
    import random
    with SessionLocal() as db:
        connection = db.query(UserConnection).filter_by(provider="spotify", status="connected").first()
        if not connection:
            return

        event_summary = random.choice(MOCK_SPOTIFY_EVENTS)
        event = AmbientEvent(
            id=str(uuid.uuid4()),
            provider="spotify",
            event_summary=event_summary,
            timestamp=datetime.utcnow()
        )
        db.add(event)
        
        # Update last synced
        connection.last_synced = datetime.utcnow()
        
        db.commit()
        print(f"[Ember Flower] Mock Spotify Sync: {event_summary}")

async def mock_sync_notion():
    """Mock fetching data from Notion and storing as an Ambient Event."""
    import random
    with SessionLocal() as db:
        connection = db.query(UserConnection).filter_by(provider="notion", status="connected").first()
        if not connection:
            return

        event_summary = random.choice(MOCK_NOTION_EVENTS)
        event = AmbientEvent(
            id=str(uuid.uuid4()),
            provider="notion",
            event_summary=event_summary,
            timestamp=datetime.utcnow()
        )
        db.add(event)
        
        # Update last synced
        connection.last_synced = datetime.utcnow()
        
        db.commit()
        print(f"[Ember Flower] Mock Notion Sync: {event_summary}")

async def flower_background_task():
    """A background loop that periodically 'syncs' connected services."""
    while True:
        try:
            await mock_sync_spotify()
            await mock_sync_notion()
        except Exception as e:
            print(f"[Ember Flower] Background Sync Error: {e}")
        
        # Run every 5 minutes in mock environment
        await asyncio.sleep(300)
