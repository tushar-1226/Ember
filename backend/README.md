# Ember Backend

The backend of the Ember AI conversational agent, built with **FastAPI** and **LangGraph**. It features a supervisor agent architecture, persistent memory with time-decay mechanisms, and project-scoped sessions.

## Key Features

- **Supervisor Agent Architecture**: Utilizes LangGraph to structure the agent into a supervisor that orchestrates specialized AI models and tasks (`graph.py`, `flower.py`).
- **Memory Management**: Features time-decay and resurfacing mechanisms to ensure the agent remembers relevant context without getting overwhelmed by stale data (`cleanup.py`, `resurfacing.py`).
- **Project-Scoped Sessions**: Database models designed to support project-centric workspaces, keeping memory and context isolated per project.
- **Persistent Storage**: Utilizes PostgreSQL with `pgvector` for long-term semantic and episodic memory, and Redis for a short-term "sensory buffer".
- **Multi-Model Routing**: Powered by NVIDIA NIM and OpenAI-compatible endpoints to dynamically route tasks to the best model (e.g., DeepSeek, Mistral, FLUX).
- **Document Intelligence (RAG)**: Built-in support for parsing and embedding PDFs, CSVs, and Excel files.

## Installation & Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in your actual API keys in `.env`.
3. Set up a Python virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Start the backend services (FastAPI, PostgreSQL, Redis):
   ```bash
   ./start_backend.sh
   ```

The FastAPI server will start on `http://localhost:8080`.

## Project Structure
- `agent/`: Contains the LangGraph implementation, including the supervisor architecture and memory lifecycle scripts (decay/resurfacing).
- `database.py`: PostgreSQL and Redis connection setup and schema models.
- `main.py`: The FastAPI application entry point, routing, and API definitions.
