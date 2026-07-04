import os
import json
import uuid
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime

from sqlalchemy import func
from database import SessionLocal, SemanticFact, ProceduralWorkflow, MemoryEmbedding, DocumentChunk, redis_client

# Embedding configuration
EMBED_API_KEY = os.getenv("NEMOTRON_API_KEY", "")
EMBED_BASE_URL = "https://integrate.api.nvidia.com/v1"
EMBED_MODEL = "nvidia/nv-embedqa-e5-v5"  # 1024-dim embedding model on NIM


def get_embedding(text: str) -> Optional[List[float]]:
    """Get embedding vector from NVIDIA NIM embedding API."""
    if not text or not text.strip():
        return None
        
    try:
        headers = {
            "Authorization": f"Bearer {EMBED_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": EMBED_MODEL,
            "input": [text[:1500]],  # Truncate to avoid token limits
            "input_type": "passage",
            "encoding_format": "float",
        }
        resp = requests.post(
            f"{EMBED_BASE_URL}/embeddings",
            headers=headers,
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if "data" in data and len(data["data"]) > 0:
            return data["data"][0]["embedding"]
    except requests.exceptions.RequestException as e:
        error_details = e.response.text if e.response is not None else str(e)
        print(f"⚠️  Embedding API error: {e}. Details: {error_details}")
    except Exception as e:
        print(f"⚠️  Embedding API error: {e}")
    return None


def get_query_embedding(text: str) -> Optional[List[float]]:
    """Get embedding vector optimized for query (retrieval) use case."""
    if not text or not text.strip():
        return None
        
    try:
        headers = {
            "Authorization": f"Bearer {EMBED_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": EMBED_MODEL,
            "input": [text[:1500]],
            "input_type": "query",
            "encoding_format": "float",
        }
        resp = requests.post(
            f"{EMBED_BASE_URL}/embeddings",
            headers=headers,
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        if "data" in data and len(data["data"]) > 0:
            return data["data"][0]["embedding"]
    except Exception as e:
        print(f"⚠️  Query embedding API error: {e}")
    return None


class MemoryStore:
    # ------------------------------------------------------------------------
    # SENSORY BUFFER (Redis)
    # ------------------------------------------------------------------------
    @staticmethod
    def add_to_sensory_buffer(session_id: str, data: dict, ttl_seconds: int = 3600):
        """Stores short-term sensory data in Redis with a TTL."""
        key = f"sensory:{session_id}"
        # Append to a Redis list
        redis_client.rpush(key, json.dumps(data))
        redis_client.expire(key, ttl_seconds)

    @staticmethod
    def get_sensory_buffer(session_id: str) -> List[dict]:
        """Retrieves short-term sensory data from Redis."""
        key = f"sensory:{session_id}"
        items = redis_client.lrange(key, 0, -1)
        return [json.loads(item) for item in items]

    # ------------------------------------------------------------------------
    # EMBEDDING HELPERS
    # ------------------------------------------------------------------------
    @staticmethod
    def embed_and_store(memory_id: str, memory_type: str, content: str) -> None:
        """Embed a memory and store its vector in the database."""
        embedding = get_embedding(content)
        if embedding is None:
            print(f"⚠️  Skipping embedding for {memory_type}:{memory_id} — API unavailable")
            return

        with SessionLocal() as db:
            emb = MemoryEmbedding(
                id=str(uuid.uuid4()),
                memory_type=memory_type,
                memory_id=memory_id,
                content=content,
                embedding=embedding,
                created_at=datetime.utcnow(),
            )
            db.add(emb)
            db.commit()
            print(f"✅ Embedded {memory_type} memory: {content[:60]}...")

    # ------------------------------------------------------------------------
    # SEMANTIC MEMORY (Postgres)
    # ------------------------------------------------------------------------
    @staticmethod
    def get_semantic() -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            facts = db.query(SemanticFact).all()
            return [
                {
                    "id": f.id,
                    "timestamp": f.timestamp.isoformat() if f.timestamp else None,
                    "confidence": f.confidence,
                    "fact": f.fact,
                    "category": f.category,
                    "entity": f.entity
                }
                for f in facts
            ]

    @staticmethod
    def add_semantic(fact: str, category: str, entity: str, confidence: float = 1.0) -> None:
        with SessionLocal() as db:
            # Dedup: the extractor runs on every message, so the same fact
            # ("The user's name is Tushar") is re-derived constantly. If we
            # already know it, just refresh its recency and skip re-embedding.
            existing = db.query(SemanticFact).filter(
                func.lower(SemanticFact.fact) == fact.strip().lower(),
                SemanticFact.entity == entity,
            ).first()
            if existing:
                existing.timestamp = datetime.utcnow()
                existing.confidence = max(existing.confidence or 0.0, confidence)
                db.commit()
                return

            fact_id = str(uuid.uuid4())
            new_fact = SemanticFact(
                id=fact_id,
                fact=fact,
                category=category,
                entity=entity,
                confidence=confidence,
                timestamp=datetime.utcnow()
            )
            db.add(new_fact)
            db.commit()

        # Embed asynchronously (fire-and-forget in background)
        MemoryStore.embed_and_store(fact_id, "semantic", f"{entity}: {fact} (category: {category})")

    # ------------------------------------------------------------------------
    # PROCEDURAL MEMORY (Postgres)
    # ------------------------------------------------------------------------
    @staticmethod
    def get_procedural() -> List[Dict[str, Any]]:
        with SessionLocal() as db:
            workflows = db.query(ProceduralWorkflow).all()
            return [
                {
                    "id": w.id,
                    "timestamp": w.timestamp.isoformat() if w.timestamp else None,
                    "confidence": w.confidence,
                    "name": w.name,
                    "description": w.description,
                    "steps": w.steps,
                    "enabled": w.enabled
                }
                for w in workflows
            ]

    @staticmethod
    def add_procedural(name: str, description: str, steps: List[str], confidence: float = 1.0) -> None:
        workflow_id = str(uuid.uuid4())
        with SessionLocal() as db:
            new_workflow = ProceduralWorkflow(
                id=workflow_id,
                name=name,
                description=description,
                steps=steps,
                confidence=confidence,
                timestamp=datetime.utcnow(),
                enabled=True
            )
            db.add(new_workflow)
            db.commit()

        # Embed the workflow
        steps_text = " → ".join(steps) if steps else ""
        MemoryStore.embed_and_store(workflow_id, "procedural", f"{name}: {description}. Steps: {steps_text}")

    # ------------------------------------------------------------------------
    # MEMORY SEARCH (Vector Similarity via pgvector)
    # ------------------------------------------------------------------------
    @staticmethod
    def search_memories(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search memories by semantic similarity using pgvector cosine distance."""
        query_emb = get_query_embedding(query)
        if query_emb is None:
            return []

        results = []
        with SessionLocal() as db:
            # Use pgvector cosine distance operator <=>
            rows = db.query(MemoryEmbedding).order_by(
                MemoryEmbedding.embedding.cosine_distance(query_emb)
            ).limit(top_k).all()

            for row in rows:
                # Fetch the source memory for confidence info
                confidence = 1.0
                if row.memory_type == "semantic":
                    source = db.query(SemanticFact).filter(SemanticFact.id == row.memory_id).first()
                    if source:
                        confidence = source.confidence or 1.0
                elif row.memory_type == "procedural":
                    source = db.query(ProceduralWorkflow).filter(ProceduralWorkflow.id == row.memory_id).first()
                    if source:
                        confidence = source.confidence or 1.0

                results.append({
                    "id": row.id,
                    "memory_type": row.memory_type,
                    "memory_id": row.memory_id,
                    "content": row.content,
                    "confidence": confidence,
                })

        return results

    # ------------------------------------------------------------------------
    # DOCUMENT CHUNK SEARCH (Vector Similarity for uploaded files)
    # ------------------------------------------------------------------------
    @staticmethod
    def search_document_chunks(query: str, session_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search document chunks by semantic similarity, scoped to a session."""
        if not query or not query.strip():
            with SessionLocal() as db:
                rows = db.query(DocumentChunk).filter(
                    DocumentChunk.session_id == session_id
                ).order_by(DocumentChunk.chunk_index).limit(top_k).all()
                return [
                    {"file_id": r.file_id, "chunk_index": r.chunk_index, "text": r.text}
                    for r in rows
                ]
                
        query_emb = get_query_embedding(query)
        if query_emb is None:
            return []

        with SessionLocal() as db:
            rows = db.query(DocumentChunk).filter(
                DocumentChunk.session_id == session_id
            ).order_by(
                DocumentChunk.embedding.cosine_distance(query_emb)
            ).limit(top_k).all()

            return [
                {"file_id": r.file_id, "chunk_index": r.chunk_index, "text": r.text}
                for r in rows
            ]

    # ------------------------------------------------------------------------
    # MEMORY CORRECTION
    # ------------------------------------------------------------------------
    @staticmethod
    def correct_memory(memory_id: str, correction: str):
        """Apply a user correction to an existing memory record."""
        with SessionLocal() as db:
            # Try semantic fact first
            fact = db.query(SemanticFact).filter(SemanticFact.id == memory_id).first()
            if fact:
                fact.fact = correction
                fact.confidence = 0.9  # User-corrected confidence
                fact.timestamp = datetime.utcnow()
                db.commit()
                # Re-embed the corrected memory
                emb = db.query(MemoryEmbedding).filter(MemoryEmbedding.memory_id == memory_id).first()
                if emb:
                    db.delete(emb)
                    db.commit()
                MemoryStore.embed_and_store(memory_id, "semantic", f"{fact.entity}: {correction} (category: {fact.category})")
                print(f"✅ Semantic fact {memory_id} corrected.")
                return

            # Try procedural workflow
            workflow = db.query(ProceduralWorkflow).filter(ProceduralWorkflow.id == memory_id).first()
            if workflow:
                workflow.description = correction
                workflow.confidence = 0.9
                workflow.timestamp = datetime.utcnow()
                db.commit()
                emb = db.query(MemoryEmbedding).filter(MemoryEmbedding.memory_id == memory_id).first()
                if emb:
                    db.delete(emb)
                    db.commit()
                steps_text = " → ".join(workflow.steps) if workflow.steps else ""
                MemoryStore.embed_and_store(memory_id, "procedural", f"{workflow.name}: {correction}. Steps: {steps_text}")
                print(f"✅ Procedural workflow {memory_id} corrected.")
                return

            print(f"⚠️  Memory {memory_id} not found for correction.")
