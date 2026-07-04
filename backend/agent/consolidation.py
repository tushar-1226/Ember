"""
Memory Consolidation Pipeline
- Sensory → Episodic summarization
- Memory decay (reduce confidence over time, prune low-confidence)
"""

import os
import json
from datetime import datetime, timedelta
from database import SessionLocal, SemanticFact, ProceduralWorkflow, MemoryEmbedding, redis_client


async def consolidate_sensory_to_episodic():
    """
    Read all sensory buffers from Redis, summarize them into episodic snapshots,
    and store as system summaries in the chat history.
    """
    try:
        # Find all sensory buffer keys
        keys = redis_client.keys("sensory:*")
        if not keys:
            print("📭 No sensory buffers to consolidate.")
            return 0

        consolidated_count = 0
        for key in keys:
            items = redis_client.lrange(key, 0, -1)
            if len(items) < 3:
                continue  # Not enough data to consolidate

            # Parse the buffer items
            messages = [json.loads(item) for item in items]
            session_id = key.replace("sensory:", "") if isinstance(key, str) else key.decode().replace("sensory:", "")

            # Summarize using a lightweight LLM call
            history_text = "\n".join([
                f"{m.get('role', 'unknown')}: {m.get('message', '')[:200]}"
                for m in messages[-10:]  # Last 10 entries
            ])

            summary = await _generate_summary(history_text)
            if summary:
                # Store as a system-level episodic snapshot
                from database import ChatMessage
                import uuid
                with SessionLocal() as db:
                    snapshot = ChatMessage(
                        id=str(uuid.uuid4()),
                        session_id=session_id,
                        role="system_summary",
                        content=f"[Episodic Snapshot] {summary}",
                        timestamp=datetime.utcnow()
                    )
                    db.add(snapshot)
                    db.commit()
                consolidated_count += 1

            # Clear the consumed buffer entries (keep last 2 for continuity)
            redis_client.ltrim(key, -2, -1)

        print(f"✅ Consolidated {consolidated_count} sensory buffers into episodic snapshots.")
        return consolidated_count

    except Exception as e:
        print(f"⚠️  Consolidation error: {e}")
        return 0


async def decay_low_confidence_memories():
    """
    Apply memory decay:
    1. Reduce all memory confidence by a small factor (0.99x)
    2. Delete memories with confidence below 0.2 and older than 7 days
    """
    try:
        with SessionLocal() as db:
            # Decay all semantic facts
            facts = db.query(SemanticFact).all()
            decayed = 0
            pruned = 0

            for fact in facts:
                if fact.confidence is None:
                    fact.confidence = 1.0

                fact.confidence *= 0.99  # Gradual decay

                # Prune very low confidence old memories
                age = datetime.utcnow() - (fact.timestamp or datetime.utcnow())
                if fact.confidence < 0.2 and age > timedelta(days=7):
                    # Also delete associated embedding
                    db.query(MemoryEmbedding).filter(
                        MemoryEmbedding.memory_id == fact.id
                    ).delete()
                    db.delete(fact)
                    pruned += 1
                else:
                    decayed += 1

            # Decay procedural workflows
            workflows = db.query(ProceduralWorkflow).all()
            for wf in workflows:
                if wf.confidence is None:
                    wf.confidence = 1.0
                wf.confidence *= 0.995  # Slower decay for procedural memories

                age = datetime.utcnow() - (wf.timestamp or datetime.utcnow())
                if wf.confidence < 0.1 and age > timedelta(days=14):
                    db.query(MemoryEmbedding).filter(
                        MemoryEmbedding.memory_id == wf.id
                    ).delete()
                    db.delete(wf)
                    pruned += 1
                else:
                    decayed += 1

            db.commit()
            print(f"✅ Memory decay applied: {decayed} decayed, {pruned} pruned.")
            return {"decayed": decayed, "pruned": pruned}

    except Exception as e:
        print(f"⚠️  Memory decay error: {e}")
        return {"decayed": 0, "pruned": 0}


async def _generate_summary(history_text: str) -> str:
    """Use a lightweight LLM to summarize a conversation segment."""
    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model=os.getenv("MISTRAL_MODEL", "mistralai/mistral-medium-3.5-128b"),
            api_key=os.getenv("MISTRAL_API_KEY"),
            base_url="https://integrate.api.nvidia.com/v1",
            temperature=0.2,
        )
        response = await llm.ainvoke(
            f"Summarize this conversation in 1-2 sentences, focusing on key facts and decisions:\n\n{history_text}"
        )
        return response.content.strip()
    except Exception as e:
        print(f"⚠️  Summary generation failed: {e}")
        return ""
