import asyncio
from database import SessionLocal, UserConnection
import httpx
import sys

async def test():
    db = SessionLocal()
    connection = db.query(UserConnection).filter_by(provider="notion", status="connected").first()
    if not connection or not connection.access_token:
        print("No connection")
        return

    headers = {
        "Authorization": f"Bearer {connection.access_token}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.notion.com/v1/search",
            headers=headers,
            json={
                "sort": {"direction": "descending", "timestamp": "last_edited_time"},
                "page_size": 1
            }
        )
        print("Status", response.status_code)
        print(response.json())

asyncio.run(test())
