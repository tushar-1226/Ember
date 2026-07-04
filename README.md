# Ember / Memory Agent 🔥

Ember is a full-stack, proactive AI conversational agent designed to retain long-term context across multiple sessions. Unlike traditional stateless chatbots, Ember "remembers." It features a persistent semantic and episodic memory system that dynamically consolidates short-term context from a sensory buffer into long-term vector embeddings.

The agent can autonomously recall past interactions, proactively nudge you with context ("I remembered this..."), and seamlessly route tasks to specialized AI models.

## 🚀 Key Features

- 🏗️ **Supervisor Agent Architecture**: A robust LangGraph-based backend orchestrating specialized AI tasks and dynamic routing.
- 🗂️ **Project-Centric Workspace**: Fully scoped chat sessions with dynamic frontend routing for managing separate projects.
- 🎨 **Interactive Memory Dashboard**: A visual Canvas-based workspace with `react-force-graph-2d` for real-time knowledge map visualization.
- ⏳ **Memory Decay & Resurfacing**: An advanced memory lifecycle system that naturally decays old information while autonomously scoring and surfacing relevant past memories.
- 🧠 **Persistent Memory System**: Utilizes a Redis "sensory buffer" that dynamically consolidates into long-term episodic and semantic memory using PostgreSQL and `pgvector`.
- 🔀 **Multi-Model Routing**: Powered by NVIDIA NIM, dynamically utilizing specific models for specific tasks (e.g., DeepSeek for logic, FLUX for image generation, Mistral for fast chat, Gemma, Qwen, GLM, Kimi).
- 📄 **Document Intelligence (RAG)**: Upload PDFs, CSVs, and Excel files. The system automatically chunks, embeds, and performs semantic search to answer questions accurately based on your documents.
- 💻 **Code Sandboxing**: Built-in tools for the agent to safely read, write, and execute code in isolated workspace environments (Ember Code tools).
- ✨ **UI & Animations**: A premium frontend experience featuring Framer Motion for custom entry effects, micro-animations, and dynamic feedback.

## 🏗️ Architecture

- **Frontend**: Next.js (React), TailwindCSS, Framer Motion, React Force Graph
- **Backend**: FastAPI (Python), LangGraph
- **Database**: PostgreSQL (with `pgvector` for embeddings), Redis (for caching and sensory buffer)
- **AI/LLMs**: NVIDIA NIM endpoints (Mistral, DeepSeek, Llama, FLUX, etc.), OpenAI (fallback compatibility)

## 🛠️ Prerequisites

- **Docker** and **Docker Compose** (for running PostgreSQL and Redis)
- **Python 3.10+** (for the FastAPI backend)
- **Node.js 18+** and **pnpm** (for the Next.js frontend)
- NVIDIA NIM API Keys (or alternative OpenAI-compatible endpoints)

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/tushar-1226/Ember.git
cd Ember
```

### 2. Backend Setup
Navigate to the backend directory and set up your environment variables:
```bash
cd backend
cp .env.example .env
```
Open `.env` and fill in your actual API keys (e.g., `FLUX_API_KEY`, `NEMOTRON_API_KEY`, `MISTRAL_API_KEY`, etc.).

Set up the Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Start the backend (this will automatically spin up the required Postgres and Redis Docker containers and launch the FastAPI server on port 8080):
```bash
./start_backend.sh
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
pnpm install
```

Make sure your frontend environment variables are set. `frontend/.env.local` should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Start the development server:
```bash
pnpm run dev
```

Visit `http://localhost:3000` in your browser to start chatting with Ember!

## 🔐 Security Note

Make sure you **never commit your `.env` files** containing real API keys to version control. The repository is pre-configured with a `.gitignore` to prevent this, but always be mindful of where your credentials are stored.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you'd like to improve the memory algorithms, add new tool capabilities, or refine the UI.
