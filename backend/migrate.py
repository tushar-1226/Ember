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
]

with engine.connect() as conn:
    for cmd in commands:
        try:
            conn.execute(text(cmd))
        except Exception as e:
            print(f"Error: {e}")
    conn.commit()

print("Migration completed.")
