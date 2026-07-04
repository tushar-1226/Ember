"""
Proactive Resurfacing — the "magic moment" engine.

Ember's whole pitch (see docs/product-plan.md §4) hinges on one experience:
it resurfaces something you forgot you told it, *at the right time*, with visible
provenance — and never feels noisy or creepy. This module is that engine.

For each stored memory we compute a score from five signals:

    emotional_weight  — how much the memory matters (category + keyword heuristic)
    relevance         — similarity to what's been on the user's mind lately (pgvector)
    timing            — does *now* fit? (day-of-week echo of when it was shared)
    staleness         — old enough to feel "remembered", not so fresh it's obvious
    strength          — the memory's own confidence (reinforced ↑, decayed ↓)

The top memory becomes a gently crafted nudge. We hard-gate frequency (≈one per
day) and de-duplicate recent repeats so the moment stays precious.
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from database import (
    SessionLocal,
    SemanticFact,
    ChatMessage,
    Resurfacing,
    redis_client,
)
from agent.memory import MemoryStore

# --- Tunables ---------------------------------------------------------------
# At most one proactive nudge per this window (Redis gate). ~20h ≈ once a day
# without pinning to a fixed clock time.
GATE_KEY = "resurfacing:last_shown"
GATE_SECONDS = int(os.getenv("RESURFACING_GATE_SECONDS", str(20 * 3600)))

# Don't resurface the *same* memory again within this many days.
REPEAT_COOLDOWN_DAYS = int(os.getenv("RESURFACING_REPEAT_DAYS", "14"))

# Staleness sweet spot: a memory ~this old feels rediscovered, not just-said.
IDEAL_AGE_DAYS = float(os.getenv("RESURFACING_IDEAL_AGE_DAYS", "21"))

# Below this, a memory is too weak/uncertain to surface confidently.
MIN_CONFIDENCE = float(os.getenv("RESURFACING_MIN_CONFIDENCE", "0.25"))

# A candidate must beat this to be worth interrupting the user.
MIN_SCORE = float(os.getenv("RESURFACING_MIN_SCORE", "0.35"))

# Signal weights (sum to 1.0 before the freshness gate multiplier).
_WEIGHTS = {
    "emotional": 0.30,
    "relevance": 0.25,
    "timing": 0.20,
    "staleness": 0.15,
    "strength": 0.10,
}

# Words that signal a memory carries emotional weight (the ones worth resurfacing).
_EMOTION_WORDS = {
    "anxious", "anxiety", "spiral", "spiraling", "afraid", "fear", "scared",
    "stress", "stressed", "overwhelmed", "burnout", "burned out", "sad", "lonely",
    "alone", "hurt", "angry", "frustrated", "tired", "exhausted", "guilty", "ashamed",
    "excited", "proud", "hopeful", "hope", "dream", "goal", "grateful", "love", "loved",
    "miss", "grief", "regret", "worry", "worried", "nervous", "doubt", "insecure",
    "happy", "joy", "relief", "calm", "peace", "grow", "growth", "change",
}
# Categories that tend to matter for reflection.
_CATEGORY_WEIGHT = {
    "personal": 1.0,
    "emotion": 1.0,
    "emotional": 1.0,
    "goal": 0.9,
    "relationship": 0.9,
    "fear": 1.0,
    "preference": 0.5,
    "environment": 0.3,
}


def _ordinal(n: int) -> str:
    suffix = "th" if 11 <= (n % 100) <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def _provenance_str(ts: Optional[datetime]) -> str:
    if not ts:
        return "from something you shared earlier"
    return f"from our conversation on {ts.strftime('%B')} {_ordinal(ts.day)}"


def _time_of_day(now: datetime) -> str:
    h = now.hour
    if h < 5:
        return "late night"
    if h < 12:
        return "morning"
    if h < 17:
        return "afternoon"
    if h < 21:
        return "evening"
    return "night"


def _emotional_weight(fact: str, category: Optional[str]) -> float:
    cat_w = _CATEGORY_WEIGHT.get((category or "").strip().lower(), 0.4)
    text = (fact or "").lower()
    hits = sum(1 for w in _EMOTION_WORDS if w in text)
    kw_w = min(1.0, 0.3 + 0.35 * hits)  # 0 hits → 0.3, 2+ hits → ~1.0
    return max(cat_w, kw_w)


def _staleness(age_days: float) -> float:
    """Gaussian bump peaking at IDEAL_AGE_DAYS — recent *and* ancient both fade."""
    sigma = IDEAL_AGE_DAYS  # wide, forgiving curve
    return 2.718281828 ** (-((age_days - IDEAL_AGE_DAYS) ** 2) / (2 * sigma * sigma))


def _freshness_gate(age_days: float) -> float:
    """Suppress memories the user basically just said — that's not a 'remember when'."""
    if age_days < 1:
        return 0.1
    if age_days < 3:
        return 0.5
    return 1.0


def _recent_context(limit: int = 12) -> str:
    """What's been on the user's mind lately — for the relevance signal."""
    with SessionLocal() as db:
        rows = (
            db.query(ChatMessage)
            .filter(ChatMessage.role.in_(["user", "system_summary"]))
            .order_by(ChatMessage.timestamp.desc())
            .limit(limit)
            .all()
        )
    # Oldest→newest, trimmed.
    return " ".join(r.content[:200] for r in reversed(rows) if r.content).strip()


def _recently_surfaced_ids() -> set:
    cutoff = datetime.utcnow() - timedelta(days=REPEAT_COOLDOWN_DAYS)
    with SessionLocal() as db:
        rows = (
            db.query(Resurfacing.memory_id)
            .filter(Resurfacing.created_at >= cutoff)
            .all()
        )
    return {r[0] for r in rows}


def _score_candidates(context: str, now: datetime) -> List[Dict[str, Any]]:
    """Score every eligible semantic memory; return sorted best-first."""
    skip_ids = _recently_surfaced_ids()

    # Relevance via existing pgvector path: rank of the memory in a similarity
    # search over recent context. Degrades gracefully if the embedder is down.
    relevance_by_id: Dict[str, float] = {}
    if context:
        try:
            hits = MemoryStore.search_memories(context, top_k=20)
            for rank, h in enumerate(hits):
                # 1.0 for the closest match, easing down to ~0.5.
                relevance_by_id[h["memory_id"]] = 1.0 - 0.5 * (rank / max(1, len(hits)))
        except Exception as e:
            print(f"⚠️  Resurfacing relevance lookup failed: {e}")

    scored: List[Dict[str, Any]] = []
    with SessionLocal() as db:
        facts = (
            db.query(SemanticFact)
            .filter((SemanticFact.confidence == None) | (SemanticFact.confidence >= MIN_CONFIDENCE))  # noqa: E711
            .all()
        )
        for f in facts:
            if f.id in skip_ids:
                continue
            ts = f.timestamp or now
            age_days = max(0.0, (now - ts).total_seconds() / 86400.0)

            strength = min(1.0, max(0.0, f.confidence if f.confidence is not None else 1.0))
            emotional = _emotional_weight(f.fact, f.category)
            relevance = relevance_by_id.get(f.id, 0.45)  # neutral if not in the top matches
            timing = 1.0 if ts.weekday() == now.weekday() else 0.6
            staleness = _staleness(age_days)

            base = (
                _WEIGHTS["emotional"] * emotional
                + _WEIGHTS["relevance"] * relevance
                + _WEIGHTS["timing"] * timing
                + _WEIGHTS["staleness"] * staleness
                + _WEIGHTS["strength"] * strength
            )
            score = round(base * _freshness_gate(age_days), 4)

            scored.append({
                "memory_id": f.id,
                "memory_type": "semantic",
                "fact": f.fact,
                "category": f.category,
                "timestamp": ts,
                "score": score,
                "signals": {
                    "emotional": round(emotional, 3),
                    "relevance": round(relevance, 3),
                    "timing": round(timing, 3),
                    "staleness": round(staleness, 3),
                    "strength": round(strength, 3),
                },
            })

    scored.sort(key=lambda c: c["score"], reverse=True)
    return scored


async def _craft_message(fact: str, category: Optional[str], now: datetime, context: str) -> str:
    """Turn the winning memory into a warm, well-timed nudge (LLM, with fallback)."""
    fallback = f'A while back you mentioned this: "{fact}". Want to sit with it for a moment?'
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage

        llm = ChatOpenAI(
            model=os.getenv("MISTRAL_MODEL", "mistralai/mistral-medium-3.5-128b"),
            api_key=os.getenv("MISTRAL_API_KEY"),
            base_url="https://integrate.api.nvidia.com/v1",
            temperature=0.6,
        )
        sys = SystemMessage(content=(
            "You are Ember, a warm, quiet reflection companion. Write ONE short message "
            "(max 45 words) that gently resurfaces a memory the user shared, at a fitting "
            "moment. Be specific and human, never clinical or creepy. End by inviting a small "
            "reflection or a light action. Do NOT state the date (the UI shows it separately). "
            "Do not invent anything beyond the given memory. Never use emojis or emoticons. "
            "Return only the message text."
        ))
        human = HumanMessage(content=(
            f"It is currently {_time_of_day(now)} on a {now.strftime('%A')}. "
            f"Memory to resurface [category: {category or 'general'}]: \"{fact}\". "
            f"Lately the user has been thinking about: {context[:400] or 'nothing in particular'}."
        ))
        resp = await llm.ainvoke([sys, human])
        text = (resp.content or "").strip().strip('"')
        return text or fallback
    except Exception as e:
        print(f"⚠️  Resurfacing message craft failed, using fallback: {e}")
        return fallback


async def generate_resurfacing(force: bool = False) -> Optional[Dict[str, Any]]:
    """
    Produce (and persist) the next proactive nudge, or None if nothing fits or the
    frequency gate is closed. `force=True` bypasses the gate (for testing / manual).
    """
    now = datetime.utcnow()

    if not force and redis_client.get(GATE_KEY):
        return None

    context = _recent_context()
    candidates = _score_candidates(context, now)
    if not candidates or candidates[0]["score"] < MIN_SCORE:
        return None

    top = candidates[0]
    provenance = _provenance_str(top["timestamp"])
    message = await _craft_message(top["fact"], top["category"], now, context)

    event = Resurfacing(
        id=str(uuid.uuid4()),
        memory_id=top["memory_id"],
        memory_type=top["memory_type"],
        message=message,
        provenance=provenance,
        score=top["score"],
        status="pending",
        created_at=now,
    )
    with SessionLocal() as db:
        db.add(event)
        db.commit()

    # Close the gate so we don't nudge again too soon.
    redis_client.setex(GATE_KEY, GATE_SECONDS, event.id)

    return _serialize(event, signals=top["signals"])


def get_pending() -> Optional[Dict[str, Any]]:
    """The current un-reacted nudge, if any (stable across page loads)."""
    with SessionLocal() as db:
        event = (
            db.query(Resurfacing)
            .filter(Resurfacing.status == "pending")
            .order_by(Resurfacing.created_at.desc())
            .first()
        )
        return _serialize(event) if event else None


def react(event_id: str, reaction: str) -> Dict[str, Any]:
    """
    Record the user's response and let it feed the strength/decay pipeline:

        helpful  → the memory landed: reinforce it (confidence ↑, recency refreshed)
        not_now  → fine, just dismiss the nudge (memory untouched)
        forget   → release it: drop confidence so decay prunes it soon
    """
    reaction = (reaction or "").strip().lower()
    status = {"helpful": "acted", "not_now": "dismissed", "forget": "forgotten"}.get(
        reaction, "dismissed"
    )
    with SessionLocal() as db:
        event = db.query(Resurfacing).filter(Resurfacing.id == event_id).first()
        if not event:
            return {"status": "not_found"}
        event.status = status
        event.reacted_at = datetime.utcnow()

        if event.memory_type == "semantic":
            fact = db.query(SemanticFact).filter(SemanticFact.id == event.memory_id).first()
            if fact:
                if reaction == "helpful":
                    fact.confidence = min(1.0, (fact.confidence or 0.5) + 0.15)
                    fact.timestamp = datetime.utcnow()  # reinforcement resets the decay clock
                elif reaction == "forget":
                    fact.confidence = (fact.confidence or 0.5) * 0.3
        db.commit()
    return {"status": status}


def _serialize(event: "Resurfacing", signals: Optional[dict] = None) -> Dict[str, Any]:
    return {
        "id": event.id,
        "memory_id": event.memory_id,
        "memory_type": event.memory_type,
        "message": event.message,
        "provenance": event.provenance,
        "score": event.score,
        "status": event.status,
        "created_at": event.created_at.isoformat() if event.created_at else None,
        "signals": signals,
    }
