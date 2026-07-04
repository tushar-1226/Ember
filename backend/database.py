import os
import redis
from sqlalchemy import create_engine, Column, String, Float, DateTime, JSON, Boolean, Text, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
from pgvector.sqlalchemy import Vector

# URLs
POSTGRES_URL = os.environ["POSTGRES_URL"]
REDIS_URL = os.environ["REDIS_URL"]

# SQLAlchemy setup
engine = create_engine(POSTGRES_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class SemanticFact(Base):
    __tablename__ = "semantic_facts"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float)
    fact = Column(String)
    category = Column(String)
    entity = Column(String)
    strength = Column(Float, default=1.0)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    decay_rate = Column(Float, default=0.05)

class ProceduralWorkflow(Base):
    __tablename__ = "procedural_workflows"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float)
    name = Column(String)
    description = Column(String)
    steps = Column(JSON)  # List of strings
    enabled = Column(Boolean, default=True)

class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    model_key = Column(String, index=True)
    tokens_in = Column(Float)
    tokens_out = Column(Float)

class UserProfile(Base):
    __tablename__ = "user_profile"

    id = Column(String, primary_key=True, index=True)
    preferred_language = Column(String)
    asking_tone = Column(String)
    user_style = Column(String)
    last_updated = Column(DateTime, default=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, index=True, nullable=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    description = Column(String, nullable=True)
    instructions = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    role = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    filename = Column(String)
    file_type = Column(String)
    extracted_text = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class MemoryEmbedding(Base):
    """Vector embeddings for semantic/procedural memories, enabling similarity search."""
    __tablename__ = "memory_embeddings"
    id = Column(String, primary_key=True, index=True)
    memory_type = Column(String, index=True)  # "semantic" or "procedural"
    memory_id = Column(String, index=True)     # FK to semantic_facts or procedural_workflows
    content = Column(Text)                     # The text that was embedded
    embedding = Column(Vector(1024))           # NVIDIA NV-Embed dimension
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentChunk(Base):
    """Chunked document segments with vector embeddings for RAG retrieval."""
    __tablename__ = "document_chunks"
    id = Column(String, primary_key=True, index=True)
    file_id = Column(String, index=True)
    session_id = Column(String, index=True)
    chunk_index = Column(Integer)
    text = Column(Text)
    embedding = Column(Vector(1024))
    created_at = Column(DateTime, default=datetime.utcnow)

class Resurfacing(Base):
    """
    A proactively surfaced memory — the "I remembered this…" moment.

    The scoring engine (agent/resurfacing.py) picks the right memory at the right
    time and records it here so the same page load shows a stable nudge, repeats
    are de-duplicated, and the user's reaction can reinforce or release the source
    memory (feeding the strength/decay pipeline).
    """
    __tablename__ = "resurfacing_events"
    id = Column(String, primary_key=True, index=True)
    memory_id = Column(String, index=True)     # FK to the source memory
    memory_type = Column(String)               # "semantic" | "procedural"
    message = Column(Text)                      # the crafted nudge shown to the user
    provenance = Column(String)                 # human-readable source, e.g. "from our conversation on May 3rd"
    score = Column(Float)                       # engine score at surfacing time
    status = Column(String, default="pending", index=True)  # pending | acted | dismissed | forgotten
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    reacted_at = Column(DateTime, nullable=True)

class UserConnection(Base):
    __tablename__ = "user_connections"
    id = Column(String, primary_key=True, index=True)
    provider = Column(String, index=True)
    access_token = Column(String)
    refresh_token = Column(String)
    status = Column(String, default="connected")
    last_synced = Column(DateTime, default=datetime.utcnow)

class AmbientEvent(Base):
    __tablename__ = "ambient_events"
    id = Column(String, primary_key=True, index=True)
    provider = Column(String, index=True)
    event_summary = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class FlowerSettings(Base):
    __tablename__ = "flower_settings"
    id = Column(String, primary_key=True, index=True)
    allow_notifications = Column(Boolean, default=True)
    morning_window = Column(Boolean, default=True)
    afternoon_window = Column(Boolean, default=False)
    evening_window = Column(Boolean, default=True)
    delivery_method = Column(String, default="desktop")

# Initialize Redis client
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

from sqlalchemy import text

def init_db():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
