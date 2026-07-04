import os
import asyncio
from dotenv import load_dotenv
load_dotenv()
from langchain_openai import ChatOpenAI

async def main():
    llm = ChatOpenAI(
        model=os.getenv("GEMMA_MODEL"),
        api_key=os.getenv("GEMMA_API_KEY"),
        base_url="https://integrate.api.nvidia.com/v1",
        timeout=30,
        max_retries=0
    )
    try:
        print("Calling LLM...")
        res = await llm.ainvoke([("user", "Hello!")])
        print(res.content)
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
