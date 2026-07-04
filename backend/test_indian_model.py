import os
import asyncio
from dotenv import load_dotenv

# Force load .env from the current directory
load_dotenv(override=True)

from langchain_openai import ChatOpenAI

async def main():
    api_key = os.getenv("INDIAN_API_KEY")
    model_name = os.getenv("INDIAN_MODEL", "sarvamai/sarvam-m")
    
    print(f"Testing model: {model_name}")
    print(f"API Key loaded: {'Yes' if api_key else 'No'}")
    
    llm = ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url="https://integrate.api.nvidia.com/v1",
        timeout=30,
        max_retries=0
    )
    
    queries = [
        "Namaste! Aap kaise ho?",
        "Tell me a short story about a smart agent in Hinglish.",
        "What is the weather usually like in Delhi during monsoon?"
    ]
    
    for q in queries:
        print(f"\n--- Query: {q} ---")
        try:
            res = await llm.ainvoke([("user", q)])
            print("Response:")
            print(res.content)
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(main())
