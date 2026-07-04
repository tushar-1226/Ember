import asyncio
from psycopg_pool import AsyncConnectionPool
from database import POSTGRES_URL

async def main():
    pool = AsyncConnectionPool(conninfo=POSTGRES_URL, kwargs={"autocommit": True})
    await pool.open()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT fact, category, entity FROM semantic_facts")
            print("Semantic Facts:", await cur.fetchall())
            
            await cur.execute("SELECT name, steps FROM procedural_workflows")
            print("Procedural Workflows:", await cur.fetchall())
    await pool.close()

asyncio.run(main())
