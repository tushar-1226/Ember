import os
import sqlalchemy
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

POSTGRES_URL = os.environ["POSTGRES_URL"]
engine = sqlalchemy.create_engine(POSTGRES_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE semantic_facts ADD COLUMN strength FLOAT DEFAULT 1.0;"))
        conn.execute(text("ALTER TABLE semantic_facts ADD COLUMN last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
        conn.execute(text("ALTER TABLE semantic_facts ADD COLUMN decay_rate FLOAT DEFAULT 0.05;"))
        conn.commit()
        print("Successfully added time-decay memory columns.")
    except Exception as e:
        print(f"Error (maybe already exists?): {e}")
