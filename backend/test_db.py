import asyncio
from psycopg_pool import AsyncConnectionPool
from database import POSTGRES_URL

async def main():
    pool = AsyncConnectionPool(conninfo=POSTGRES_URL, kwargs={"autocommit": True})
    await pool.open()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'checkpoints'")
            cols = await cur.fetchall()
            print("Columns:", cols)
    await pool.close()

asyncio.run(main())
