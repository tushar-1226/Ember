"""
Model registry — the single source of truth for every model Ember can use.

Both the backend (agent/graph.py) and the frontend dropdown (via GET /models)
read from here, so the picker can never drift out of sync with what's actually
wired again. Each entry declares the model's *special ability* and the generation
settings that unlock it, so selecting a model genuinely changes behavior.
"""

import os
from typing import Any, Dict, List

DEFAULT_MODEL_KEY = "nemotron"  # fastest + reliable — also the fallback target
_NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Ordered — this is also the dropdown order. Each model is tuned for its strength.
_REGISTRY: Dict[str, Dict[str, Any]] = {
    "nemotron": {
        "label": "Ember Reasoning",
        "ability": "Deep reasoning",
        "description": "550B thinking model. Best for hard, multi-step problems and careful analysis.",
        "kind": "chat",
        "env_key": "NEMOTRON_API_KEY",
        "env_model": "NEMOTRON_MODEL",
        "default_model": "nvidia/nemotron-3-ultra-550b-a55b",
        "temperature": 0.6,
        "top_p": 0.95,
        "extra_body": {"chat_template_kwargs": {"enable_thinking": True}, "reasoning_budget": 16384},
        "persona_hint": "Think step by step and reason carefully before answering.",
    },
    "deepseek": {
        "label": "Ember Code",
        "ability": "Code & logic",
        "description": "Precise coding, math, and rigorous logic. Lowest temperature for exactness.",
        "kind": "chat",
        "env_key": "DEEPSEEK_API_KEY",
        "env_model": "DEEPSEEK_MODEL",
        "default_model": "deepseek-ai/deepseek-v4-pro",
        "temperature": 0.2,
        "top_p": 0.9,
        "extra_body": {},
        "persona_hint": "Prioritize correct, well-structured code and rigorous, verifiable logic.",
    },
    "mistral": {
        "label": "Ember Chat",
        "ability": "Fast & balanced",
        "description": "Quick, well-rounded replies. The best everyday default for conversation.",
        "kind": "chat",
        "env_key": "MISTRAL_API_KEY",
        "env_model": "MISTRAL_MODEL",
        "default_model": "mistralai/mistral-large-3-675b-instruct-2512",
        "temperature": 0.7,
        "top_p": 0.95,
        "extra_body": {},
        "persona_hint": "Be warm, natural, and concise.",
    },
    "gemma": {
        "label": "Ember Lite",
        "ability": "Light & efficient",
        "description": "Snappy, low-latency answers for quick questions and everyday chat.",
        "kind": "chat",
        "env_key": "GEMMA_API_KEY",
        "env_model": "GEMMA_MODEL",
        "default_model": "google/gemma-4-31b-it",
        "temperature": 0.7,
        "top_p": 0.95,
        "extra_body": {},
        "persona_hint": "Answer briefly and directly.",
    },
    "nvidia": {
        "label": "Ember Vision",
        "ability": "Image generation",
        "description": "Turns your prompt into an image instead of a text reply.",
        "kind": "image",
        "env_key": "NVIDIA_API_KEY",
        "env_model": "NVIDIA_MODEL",
        "default_model": "black-forest-labs/flux.1-dev",
        "temperature": 0.0,
        "top_p": 1.0,
        "extra_body": {},
        "persona_hint": "",
    },
    "qwen": {
        "label": "Ember Global",
        "ability": "Multilingual & long-context",
        "description": "Strong across languages with a large context window for long documents.",
        "kind": "chat",
        "env_key": "QWEN_API_KEY",
        "env_model": "QWEN_MODEL",
        "default_model": "qwen/qwen3.5-122b-a10b",
        "temperature": 0.7,
        "top_p": 0.95,
        "extra_body": {},
        "persona_hint": "Reply fluently in the user's language and handle long context well.",
    },
    "glm": {
        "label": "Ember Agent",
        "ability": "Agentic & versatile",
        "description": "Strong all-rounder with excellent tool use and instruction following.",
        "kind": "chat",
        "env_key": "GLM_API_KEY",
        "env_model": "GLM_MODEL",
        "default_model": "z-ai/glm-5.2",
        "temperature": 0.7,
        "top_p": 0.95,
        "extra_body": {},
        "persona_hint": "Follow instructions precisely and use tools when they help.",
    },
    "kimi": {
        "label": "Ember Context",
        "ability": "Long-context agent",
        "description": "Huge context window — great for long documents and multi-step agent tasks.",
        "kind": "chat",
        "env_key": "KIMI_API_KEY",
        "env_model": "KIMI_MODEL",
        "default_model": "moonshotai/kimi-k2.6",
        "temperature": 0.7,
        "top_p": 0.95,
        "extra_body": {},
        "persona_hint": "Make full use of the long context; keep track of details across the whole conversation.",
    },
    "indian": {
        "label": "Ember Indian",
        "ability": "Hinglish & Indic languages",
        "description": "Natively optimized for Hinglish and Indian languages.",
        "kind": "chat",
        "env_key": "INDIAN_API_KEY",
        "env_model": "INDIAN_MODEL",
        "default_model": "sarvamai/sarvam-m",
        "temperature": 0.5,
        "top_p": 1.0,
        "extra_body": {},
        "persona_hint": "Reply natively in Hinglish or the requested Indic language.",
    },
}


def list_models() -> List[Dict[str, Any]]:
    """Public metadata for the frontend dropdown (no keys/params leaked)."""
    return [
        {
            "key": key,
            "label": m["label"],
            "ability": m["ability"],
            "description": m["description"],
            "kind": m["kind"],
        }
        for key, m in _REGISTRY.items()
    ]


def get_model(key: str) -> Dict[str, Any]:
    """Resolve a model key to a runnable config (model id + key from the env)."""
    m = _REGISTRY.get(key) or _REGISTRY[DEFAULT_MODEL_KEY]
    return {
        "key": key if key in _REGISTRY else DEFAULT_MODEL_KEY,
        "model": os.getenv(m["env_model"], m["default_model"]),
        "api_key": os.getenv(m["env_key"]) or os.getenv("NEMOTRON_API_KEY"),
        "base_url": _NIM_BASE_URL,
        "temperature": m["temperature"],
        "top_p": m["top_p"],
        "extra_body": m["extra_body"],
        "persona_hint": m["persona_hint"],
        "kind": m["kind"],
        "label": m["label"],
    }
