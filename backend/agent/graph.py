import os
from typing import Annotated
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.prebuilt import ToolNode
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_core.tools import Tool

# Setup Google Search tool using Serper API
_serper_key = os.getenv("SERPER_API_KEY", "")
tools = []

# --- URL Scraping Tool (always available) ---
def scrape_url(url: str) -> str:
    """Scrape and extract the main text content from a URL."""
    import requests
    from bs4 import BeautifulSoup
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (compatible; HorizonAI/1.0)'}
        resp = requests.get(url.strip(), headers=headers, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Remove scripts, styles, nav, footer
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            tag.decompose()
        text = soup.get_text(separator='\n', strip=True)
        # Truncate to ~4000 chars to fit in context
        return text[:4000] if len(text) > 4000 else text
    except Exception as e:
        return f"Error scraping URL: {str(e)}"

scrape_tool = Tool(
    name="scrape_url",
    description="Scrape and extract text content from a given URL. Use this when the user shares a link or asks you to read a webpage.",
    func=scrape_url,
)
tools.append(scrape_tool)
print("✅ URL Scraping tool enabled")

def generate_image(prompt: str) -> str:
    """Generate an image based on a prompt. Use this when the user asks you to create or generate a picture or image."""
    import requests
    # Prefer a dedicated image key (the flux key is faster: ~8s vs ~60s).
    api_key = (os.getenv("FLUX_API_KEY") or os.getenv("flux_key")
               or os.getenv("NVIDIA_API_KEY") or os.getenv("NEMOTRON_API_KEY"))
    # NVIDIA serves hosted image models on the genai host (NOT /v1/images/generations).
    model = os.getenv("IMAGE_MODEL") or os.getenv("NVIDIA_MODEL", "black-forest-labs/flux.1-dev")
    if not api_key:
        return "⚠️ Image generation is unavailable — no NVIDIA API key is configured."

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    try:
        resp = requests.post(
            f"https://ai.api.nvidia.com/v1/genai/{model}",
            headers=headers,
            json={"prompt": prompt},
            timeout=150,  # cold starts can be slow; the flux key is usually ~8s
        )
        if resp.status_code == 200:
            data = resp.json()
            # FLUX/NVIDIA genai returns artifacts[].base64 (JPEG); tolerate OpenAI shape too.
            arts = data.get("artifacts") or []
            if arts and arts[0].get("base64"):
                return f"![Generated Image](data:image/jpeg;base64,{arts[0]['base64']})"
            if data.get("data") and data["data"][0].get("b64_json"):
                return f"![Generated Image](data:image/png;base64,{data['data'][0]['b64_json']})"
            return "⚠️ The image service returned an unexpected response."

        return (
            f"⚠️ Image generation failed (HTTP {resp.status_code}) for model `{model}`. "
            f"{str(resp.text)[:180]}"
        )
    except Exception as e:
        return f"⚠️ Couldn't reach the image service: {e}"

image_tool = Tool(
    name="generate_image",
    description="Generate an image based on a text prompt. Output is returned as a markdown image string.",
    func=generate_image,
)
tools.append(image_tool)
print("✅ Image Generation tool enabled")

if _serper_key and _serper_key != "missing_key":
    search = GoogleSerperAPIWrapper(serper_api_key=_serper_key)
    search_tool = Tool(
        name="google_search",
        description="Search Google for recent results.",
        func=search.run,
    )
    tools.append(search_tool)
    print("✅ Google Search tool enabled")
else:
    print("⚠️  SERPER_API_KEY not set — web search disabled")

# --- Ember Code: filesystem + shell tools, scoped to a per-session workspace ---
from agent.coding_tools import CODING_TOOLS
tools.extend(CODING_TOOLS)
print("✅ Ember Code tools enabled (read/write/edit/list/run)")

tool_node = ToolNode(tools) if tools else None

class State(TypedDict):
    messages: Annotated[list, add_messages]

# Some NIM models (e.g. Mistral Medium) have high first-token latency — a trivial
# prompt can take ~10s, and a real answer far more. A short timeout guillotines
# valid-but-slow models and forces a needless fallback, so keep it generous.
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "120"))


def _build_llm(spec: dict):
    """Instantiate a ChatOpenAI (NVIDIA NIM) tuned with a model's special settings."""
    return ChatOpenAI(
        model=spec["model"],
        api_key=spec["api_key"],
        base_url=spec["base_url"],
        temperature=spec["temperature"],
        top_p=spec["top_p"],
        streaming=True,
        timeout=LLM_TIMEOUT,
        max_retries=0,  # we handle fallback ourselves; don't silently retry a slow call
        extra_body=spec.get("extra_body", {}),
    )


def call_model(state: State, config: RunnableConfig):
    from agent.models import get_model, get_model as _gm, DEFAULT_MODEL_KEY

    model_key = config.get("configurable", {}).get("model_key", DEFAULT_MODEL_KEY)
    spec = get_model(model_key)

    # Initialize the LLM using Nvidia NIM via the OpenAI-compatible ChatOpenAI class,
    # applying this model's tuned temperature / top_p / reasoning settings.
    llm = _build_llm(spec)

    # --- MEMORY RETRIEVAL (RAG) ---
    # Extract the latest user message to use as the search query
    memory_context = ""
    try:
        user_messages = [m for m in state["messages"] if m.type == "human"]
        if user_messages:
            latest_query = user_messages[-1].content
            if isinstance(latest_query, str) and len(latest_query) > 5:
                from agent.memory import MemoryStore
                memories = MemoryStore.search_memories(latest_query, top_k=5)
                if memories:
                    memory_lines = []
                    for i, mem in enumerate(memories, 1):
                        label = "Semantic" if mem["memory_type"] == "semantic" else "Procedural"
                        conf = f"{mem['confidence']:.0%}" if mem.get("confidence") else "N/A"
                        memory_lines.append(f"  {i}. [{label}] {mem['content']} (confidence: {conf})")
                    memory_context = (
                        "\n\n--- RELEVANT MEMORIES ABOUT THIS USER ---\n"
                        + "\n".join(memory_lines)
                        + "\n--- END MEMORIES ---\n"
                        + "Use these memories to personalize your response when relevant. "
                        + "Do not mention the memory system to the user unless asked.\n"
                    )
    except Exception as e:
        print(f"⚠️  Memory retrieval failed (non-fatal): {e}")
    
    # We prepend a system message instructing the agent on its persona
    system_msg = SystemMessage(
        content="You are Horizon AI, an advanced agentic AI system with a multi-layer memory architecture. "
                "You assist the user with tasks and can draw on episodic, semantic, and procedural memories. "
                "You have access to tools: web search (google_search), URL scraping (scrape_url), and image generation (generate_image). "
                "If the user asks for current events or facts you're unsure about, use google_search. "
                "If the user shares a URL or asks you to read a webpage, use scrape_url. "
                "If the user asks to generate, create, or draw an image/picture, use generate_image and output the resulting markdown exactly as returned by the tool. "
                "For coding tasks you have a sandboxed project workspace and these tools: list_dir, read_file, write_file, edit_file, and run_command. "
                "Always list_dir and read_file to understand the current state before writing or editing. "
                "Use edit_file for small changes (match the existing text exactly) and write_file to create files or fully replace them. "
                "Use run_command to run or test code. All paths are relative to the workspace root; you cannot access files outside it. "
                "If the user has uploaded files, their content will be provided in the conversation context. "
                "When writing code, use markdown code blocks with the language specified. "
                "Be helpful, concise, and accurate. "
                "NEVER use emojis, emoticons, or decorative Unicode symbols anywhere in your output — "
                "not in prose, headings, bullet points, tables, code, code comments, or example/terminal output. "
                "Use plain text only. This applies even if the user's files or prior messages contain emojis. "
                + (spec.get("persona_hint") or "")
                + memory_context
    )

    messages = [system_msg] + state["messages"]

    # Bind the tools to the LLM so it knows they are available
    llm_with_tools = llm.bind_tools(tools)

    try:
        response = llm_with_tools.invoke(messages)
    except Exception as e:
        # A model id the account can't access shouldn't break the chat — fall back
        # to the reliable default so the user still gets a reply.
        print(f"⚠️  Model '{model_key}' failed ({e}); falling back to '{DEFAULT_MODEL_KEY}'.")
        fallback = _gm(DEFAULT_MODEL_KEY)
        response = _build_llm(fallback).bind_tools(tools).invoke(messages)
    return {"messages": [response]}

def should_continue(state: State):
    messages = state["messages"]
    last_message = messages[-1]
    # If the LLM makes a tool call and we have tools, route to tools node
    if tools and hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"
    # Otherwise, stop
    return END

# Build the LangGraph
workflow = StateGraph(State)

# Add the nodes
workflow.add_node("agent", call_model)

# Define edges
workflow.add_edge(START, "agent")

if tool_node:
    workflow.add_node("tools", tool_node)
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {"tools": "tools", END: END}
    )
    workflow.add_edge("tools", "agent")
else:
    workflow.add_edge("agent", END)

# Export the workflow to be compiled with checkpointer in main.py

