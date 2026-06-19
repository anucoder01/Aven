import asyncio
import httpx
import json

async def main():
    async with httpx.AsyncClient() as client:
        req = {
            "system_prompt": "test",
            "messages": [{"role": "user", "content": "hello"}],
            "difficulty_level": 1
        }
        print("Sending request...")
        try:
            async with client.stream("POST", "http://localhost:8000/llm/character", json=req, timeout=10.0) as response:
                print(f"Status: {response.status_code}")
                async for line in response.aiter_lines():
                    print("Line:", line)
        except Exception as e:
            print("Error:", e)

asyncio.run(main())
