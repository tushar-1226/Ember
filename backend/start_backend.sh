#!/bin/bash
# Start Postgres and Redis using Docker

# Load environment variables from .env if it exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Set fallback values if not provided in .env
POSTGRES_USER=${POSTGRES_USER:-user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}
POSTGRES_DB=${POSTGRES_DB:-memoryagent}

echo "Starting Docker containers..."
sudo docker rm -f memoryagent_postgres memoryagent_redis 2>/dev/null || true
sudo docker run -d --name memoryagent_postgres -p 5432:5432 -e POSTGRES_USER=$POSTGRES_USER -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -e POSTGRES_DB=$POSTGRES_DB -v postgres_data:/var/lib/postgresql/data pgvector/pgvector:pg16
sudo docker run -d --name memoryagent_redis -p 6379:6379 redis:alpine

echo "Waiting for PostgreSQL and Redis to start..."
sleep 5

# Function to run on exit
cleanup() {
    echo "Shutting down FastAPI and Docker containers..."
    sudo docker stop memoryagent_postgres memoryagent_redis
    sudo docker rm memoryagent_postgres memoryagent_redis
    exit 0
}

# Trap EXIT to run cleanup on any script termination
trap cleanup EXIT

# Activate virtual environment
source venv/bin/activate

# Start the backend server
echo "Starting FastAPI backend..."
uvicorn main:app --reload --port 8080
