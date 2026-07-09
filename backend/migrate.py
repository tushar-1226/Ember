import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
url = os.getenv("POSTGRES_URL")
engine = create_engine(url)

commands = [
    "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS project_id VARCHAR;",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    # Tenancy: every table that can return user-specific data needs a user_id
    # column so routes can filter by owner instead of returning everyone's data.
    "ALTER TABLE semantic_facts ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE procedural_workflows ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE token_usage ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE memory_embeddings ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE resurfacing_events ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE user_connections ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE ambient_events ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "ALTER TABLE flower_settings ADD COLUMN IF NOT EXISTS user_id VARCHAR;",
    "CREATE INDEX IF NOT EXISTS ix_semantic_facts_user_id ON semantic_facts (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_procedural_workflows_user_id ON procedural_workflows (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_token_usage_user_id ON token_usage (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_uploaded_files_user_id ON uploaded_files (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_memory_embeddings_user_id ON memory_embeddings (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_document_chunks_user_id ON document_chunks (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_resurfacing_events_user_id ON resurfacing_events (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_user_connections_user_id ON user_connections (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_ambient_events_user_id ON ambient_events (user_id);",
    "CREATE INDEX IF NOT EXISTS ix_flower_settings_user_id ON flower_settings (user_id);",
]

with engine.connect() as conn:
    for cmd in commands:
        try:
            conn.execute(text(cmd))
        except Exception as e:
            print(f"Error: {e}")
    conn.commit()

print("Migration completed.")
