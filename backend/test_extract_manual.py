import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
from agent.extractor import extract_memories_background

async def main():
    await extract_memories_background("My name is Tushar and my favorite language is Python. Whenever I ask you to deploy, I want you to first run pytest, then build the docker image.")

asyncio.run(main())
