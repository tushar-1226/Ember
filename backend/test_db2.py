import asyncio
from psycopg_pool import AsyncConnectionPool
from database import POSTGRES_URL

async def main():
    pool = AsyncConnectionPool(conninfo=POSTGRES_URL, kwargs={"autocommit": True})
    await pool.open()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT thread_id, MAX(checkpoint->>'ts') as last_updated FROM checkpoints GROUP BY thread_id ORDER BY last_updated DESC;")
            res = await cur.fetchall()
            print("Threads:", res)
    await pool.close()

asyncio.run(main())
