import asyncio
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

async def main():
    pool = AsyncConnectionPool(conninfo="postgresql://user:password@localhost:5432/memoryagent", kwargs={"autocommit": True})
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()
    print("Setup success")
    await pool.close()

asyncio.run(main())
