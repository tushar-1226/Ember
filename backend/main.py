import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional

# Load environment variables FIRST before importing other local modules
load_dotenv()

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg_pool import AsyncConnectionPool

from database import init_db, POSTGRES_URL, SessionLocal, TokenUsage, UserProfile, ChatSession, ChatMessage, UploadedFile, DocumentChunk, Project
from sqlalchemy import func, cast, Date
import uuid
from datetime import datetime
from agent.memory import MemoryStore, get_embedding
from agent.graph import workflow
from agent.extractor import extract_memories_background
from agent.consolidation import consolidate_sensory_to_episodic, decay_low_confidence_memories
from agent import resurfacing
from fastapi.responses import PlainTextResponse
from fastapi import Depends
from agent.auth import get_current_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLAlchemy tables
    init_db()
    
    # Start flower background task
    from agent.flower import flower_background_task
    app.state.flower_task = asyncio.create_task(flower_background_task())

    # Start TTL cleanup background task
    from agent.cleanup import cleanup_background_task
    app.state.cleanup_task = asyncio.create_task(cleanup_background_task())

    # Initialize async pool and checkpointer
    app.state.pool = AsyncConnectionPool(conninfo=POSTGRES_URL, max_size=20, kwargs={"autocommit": True}, open=False)
    await app.state.pool.open()
    
    app.state.checkpointer = AsyncPostgresSaver(app.state.pool)
    await app.state.checkpointer.setup()
    
    # Compile the graph with the Postgres checkpointer
    app.state.graph = workflow.compile(checkpointer=app.state.checkpointer)
    yield
    await app.state.pool.close()

app = FastAPI(title="Memory Agent API", lifespan=lifespan)

# Add CORS middleware for Next.js frontend
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default_thread"
    model_key: str = "nemotron"
    temporary: bool = False  # temporary chats aren't persisted or mined for memory
    project_id: Optional[str] = None
    enable_web_search: bool = True

@app.get("/models")
async def list_models():
    """The models Ember can use, with each one's special ability. Source of truth
    for the frontend dropdown so it never drifts out of sync with the backend."""
    from agent.models import list_models as _list
    return _list()

# ---- Ember Code: browse a session's sandboxed workspace ----
@app.get("/code/files")
async def code_files(thread_id: str):
    """List the files/dirs in a coding session's workspace."""
    from agent.coding_tools import list_tree
    return list_tree(thread_id)

@app.get("/code/file")
async def code_file(thread_id: str, path: str):
    """Read one file from a coding session's workspace."""
    from agent.coding_tools import read_workspace_file
    return {"path": path, "content": read_workspace_file(thread_id, path)}

@app.get("/memory/episodic")
async def get_episodic_memories(request: Request):
    """
    Returns actual episodic memories derived from LangGraph checkpoints.
    """
    memories = []
    try:
        async with request.app.state.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT thread_id, MAX(checkpoint->>'ts') as last_updated FROM checkpoints GROUP BY thread_id ORDER BY last_updated DESC;")
                rows = await cur.fetchall()
                for row in rows:
                    thread_id = row[0]
                    last_updated = row[1]
                    memories.append({
                        "id": thread_id,
                        "timestamp": last_updated,
                        "confidence": 1.0,
                        "summary": f"Conversation Thread: {thread_id}",
                        "participants": ["User", "Agent"],
                        "relevanceScore": 1.0,
                        "sourceConversationId": thread_id,
                        "tags": ["conversation"]
                    })
    except Exception as e:
        print(f"Error fetching episodic memories: {e}")
        
    return memories

@app.get("/memory/semantic")
async def get_semantic_memories():
    return MemoryStore.get_semantic()

@app.get("/memory/procedural")
async def get_procedural_memories():
    return MemoryStore.get_procedural()

@app.get("/tokens/stats")
async def get_token_stats():
    with SessionLocal() as db:
        stats = db.query(
            TokenUsage.model_key,
            func.sum(TokenUsage.tokens_in).label('total_in'),
            func.sum(TokenUsage.tokens_out).label('total_out')
        ).group_by(TokenUsage.model_key).all()
        return [{"model": s[0], "tokens_in": s[1] or 0, "tokens_out": s[2] or 0} for s in stats]

@app.get("/dashboard/profile")
async def get_user_profile():
    with SessionLocal() as db:
        profile = db.query(UserProfile).filter(UserProfile.id == "default_user").first()
        if profile:
            return {
                "preferred_language": profile.preferred_language,
                "asking_tone": profile.asking_tone,
                "user_style": profile.user_style,
                "last_updated": profile.last_updated.isoformat() if profile.last_updated else None
            }
        return {"preferred_language": "Unknown", "asking_tone": "Unknown", "user_style": "Unknown"}

@app.get("/chats")
async def get_chats(project_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    with SessionLocal() as db:
        query = db.query(ChatSession).filter(ChatSession.user_id == user_id)
        if project_id:
            query = query.filter(ChatSession.project_id == project_id)
        else:
            query = query.filter(ChatSession.project_id.is_(None))
        chats = query.order_by(ChatSession.updated_at.desc()).all()
        return [{"id": c.id, "title": c.title, "updated_at": c.updated_at.isoformat()} for c in chats]

@app.get("/chats/{session_id}")
async def get_chat_history(session_id: str):
    with SessionLocal() as db:
        messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp.asc()).all()
        return [{"id": m.id, "role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()} for m in messages]

@app.delete("/chats/{session_id}")
async def delete_chat(session_id: str, user_id: str = Depends(get_current_user)):
    with SessionLocal() as db:
        # Optional: Verify ownership first
        db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
        db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).delete()
        db.commit()
    return {"status": "success"}

# ---- Projects ----
class ProjectCreateRequest(BaseModel):
    title: str
    description: str = ""

class ProjectUpdateRequest(BaseModel):
    title: str = None
    description: str = None
    instructions: str = None

@app.get("/projects")
async def get_projects(user_id: str = Depends(get_current_user)):
    with SessionLocal() as db:
        projects = db.query(Project).filter(Project.user_id == user_id).order_by(Project.updated_at.desc()).all()
        return [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "instructions": p.instructions,
                "updated_at": p.updated_at.isoformat() if p.updated_at else p.created_at.isoformat()
            }
            for p in projects
        ]

@app.post("/projects")
async def create_project(req: ProjectCreateRequest, user_id: str = Depends(get_current_user)):
    project_id = f"p-{uuid.uuid4().hex[:8]}"
    with SessionLocal() as db:
        new_proj = Project(
            id=project_id,
            user_id=user_id,
            title=req.title,
            description=req.description,
            instructions=""
        )
        db.add(new_proj)
        db.commit()
        return {"id": project_id, "title": new_proj.title, "description": new_proj.description}

@app.get("/projects/{project_id}")
async def get_project(project_id: str, user_id: str = Depends(get_current_user)):
    with SessionLocal() as db:
        p = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
        if not p:
            return {"error": "Project not found"}
        return {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "instructions": p.instructions,
            "updated_at": p.updated_at.isoformat() if p.updated_at else p.created_at.isoformat()
        }

@app.put("/projects/{project_id}")
async def update_project(project_id: str, req: ProjectUpdateRequest):
    with SessionLocal() as db:
        p = db.query(Project).filter(Project.id == project_id).first()
        if not p:
            return {"error": "Project not found"}
        
        if req.title is not None:
            p.title = req.title
        if req.description is not None:
            p.description = req.description
        if req.instructions is not None:
            p.instructions = req.instructions
            
        db.commit()
        return {"status": "success"}

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, user_id: str = Depends(get_current_user)):
    with SessionLocal() as db:
        chats = db.query(ChatSession).filter(ChatSession.project_id == project_id, ChatSession.user_id == user_id).all()
        chat_ids = [c.id for c in chats]
        if chat_ids:
            db.query(ChatMessage).filter(ChatMessage.session_id.in_(chat_ids)).delete(synchronize_session=False)
            db.query(ChatSession).filter(ChatSession.project_id == project_id, ChatSession.user_id == user_id).delete(synchronize_session=False)
        db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).delete(synchronize_session=False)
        db.commit()
    return {"status": "success"}

class CorrectionRequest(BaseModel):
    correction: str

@app.post("/memory/{memory_id}/correct")
async def correct_memory(memory_id: str, payload: CorrectionRequest):
    MemoryStore.correct_memory(memory_id, payload.correction)
    return {"status": "success"}

# ---- Regenerate & Edit ----
class RegenerateRequest(BaseModel):
    thread_id: str

@app.post("/chat/regenerate")
async def regenerate_chat(req: RegenerateRequest, request: Request):
    from langchain_core.messages import RemoveMessage
    with SessionLocal() as db:
        messages = db.query(ChatMessage).filter(ChatMessage.session_id == req.thread_id).order_by(ChatMessage.timestamp.desc()).all()
        if not messages or len(messages) < 2:
            return {"error": "Not enough messages"}
            
        last_ast = messages[0]
        last_usr = messages[1]
        
        if last_ast.role != 'assistant' or last_usr.role != 'user':
            return {"error": "Invalid state"}
            
        config = {"configurable": {"thread_id": req.thread_id}}
        state = await request.app.state.graph.aget_state(config)
        lg_messages = state.values.get("messages", [])
        
        delete_idx = -1
        for i in range(len(lg_messages)-1, -1, -1):
            m = lg_messages[i]
            if m.type == "human" and (last_usr.content in m.content or m.content.endswith(last_usr.content)):
                delete_idx = i
                break
                
        if delete_idx != -1:
            to_remove = [RemoveMessage(id=m.id) for m in lg_messages[delete_idx:]]
            await request.app.state.graph.aupdate_state(config, {"messages": to_remove})
            
        db.delete(last_ast)
        db.delete(last_usr)
        db.commit()
        
        return {"message": last_usr.content}

class EditMessageRequest(BaseModel):
    thread_id: str
    message_id: str
    new_content: str

@app.post("/chat/edit")
async def edit_message(req: EditMessageRequest, request: Request):
    from langchain_core.messages import RemoveMessage
    with SessionLocal() as db:
        target_msg = db.query(ChatMessage).filter(ChatMessage.id == req.message_id).first()
        if not target_msg or target_msg.role != 'user':
            return {"error": "Invalid message"}
            
        target_content = target_msg.content
        
        msgs_to_delete = db.query(ChatMessage).filter(
            ChatMessage.session_id == req.thread_id,
            ChatMessage.timestamp >= target_msg.timestamp
        ).all()
        
        for m in msgs_to_delete:
            db.delete(m)
        db.commit()
        
        config = {"configurable": {"thread_id": req.thread_id}}
        state = await request.app.state.graph.aget_state(config)
        lg_messages = state.values.get("messages", [])
        
        delete_idx = -1
        for i in range(len(lg_messages)-1, -1, -1):
            m = lg_messages[i]
            if m.type == "human" and (target_content in m.content or m.content.endswith(target_content)):
                delete_idx = i
                break
                
        if delete_idx != -1:
            to_remove = [RemoveMessage(id=m.id) for m in lg_messages[delete_idx:]]
            await request.app.state.graph.aupdate_state(config, {"messages": to_remove})
            
        return {"status": "success"}

# ---- Suggestions & Execution Sandbox ----
@app.get("/chats/{thread_id}/suggestions")
async def get_chat_suggestions(thread_id: str):
    with SessionLocal() as db:
        messages = db.query(ChatMessage).filter(ChatMessage.session_id == thread_id).order_by(ChatMessage.timestamp).all()
        if not messages:
            return {"suggestions": []}
            
    recent = messages[-5:]
    history = "\n".join([f"{m.role}: {m.content[:500]}" for m in recent])
    
    prompt = f"Based on this chat history, suggest 3 short, insightful follow-up questions the user could ask. Never use emojis. Return ONLY a valid JSON array of 3 strings. Example: [\"Question 1?\", \"Question 2?\", \"Question 3?\"]\n\nHistory:\n{history}"
    
    try:
        from langchain_openai import ChatOpenAI
        import json
        import re
        llm = ChatOpenAI(
            model=os.getenv("MISTRAL_MODEL", "mistralai/mistral-medium-3.5-128b"),
            api_key=os.getenv("MISTRAL_API_KEY"),
            base_url="https://integrate.api.nvidia.com/v1",
            temperature=0.3
        )
        resp = llm.invoke(prompt)
        match = re.search(r'\[.*\]', resp.content, re.DOTALL)
        if match:
            sugs = json.loads(match.group(0))
            return {"suggestions": sugs[:3]}
        return {"suggestions": []}
    except Exception as e:
        print(f"Suggestions error: {e}")
        return {"suggestions": []}

# ---- File Upload with Chunking + Embedding ----
def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """Split text into overlapping chunks by word count."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), session_id: str = Form("default")):
    """Upload a file for analysis. Supports PDF, CSV, TXT, and code files. Chunks and embeds for RAG."""
    content = await file.read()
    filename = file.filename or "unknown"
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'txt'
    
    extracted = ""
    if ext == 'pdf':
        try:
            from PyPDF2 import PdfReader
            import io
            reader = PdfReader(io.BytesIO(content))
            extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            extracted = f"Error reading PDF: {e}"
    elif ext == 'csv':
        try:
            import pandas as pd
            import io
            df = pd.read_csv(io.BytesIO(content))
            extracted = f"CSV with {len(df)} rows and {len(df.columns)} columns.\nColumns: {', '.join(df.columns)}\n\nFirst 20 rows:\n{df.head(20).to_string()}"
        except Exception as e:
            extracted = f"Error reading CSV: {e}"
    elif ext in ('xlsx', 'xls'):
        try:
            import pandas as pd
            import io
            engine = 'openpyxl' if ext == 'xlsx' else None
            sheets = pd.read_excel(io.BytesIO(content), sheet_name=None, engine=engine)
            parts = []
            for name, df in sheets.items():
                parts.append(
                    f"Sheet '{name}' — {len(df)} rows × {len(df.columns)} columns.\n"
                    f"Columns: {', '.join(str(c) for c in df.columns)}\n\n"
                    f"First 20 rows:\n{df.head(20).to_string()}"
                )
            extracted = "\n\n".join(parts) if parts else "Empty spreadsheet."
        except Exception as e:
            extracted = f"Error reading Excel file: {e}"
    elif ext in ('png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'):
        # Images have no extractable text; record a placeholder so the file is
        # tracked and shown as an attachment. (Vision OCR could slot in here.)
        extracted = f"[Image file: {filename} — {len(content)} bytes. No text extracted.]"
    else:
        try:
            extracted = content.decode('utf-8', errors='replace')
        except:
            extracted = "Binary file - could not extract text."
    
    file_id = str(uuid.uuid4())
    with SessionLocal() as db:
        upload = UploadedFile(
            id=file_id,
            session_id=session_id,
            filename=filename,
            file_type=ext,
            extracted_text=extracted
        )
        db.add(upload)
        db.commit()
    
    # Chunk and embed in background
    async def _chunk_and_embed():
        try:
            chunks = _chunk_text(extracted)
            for i, chunk_text in enumerate(chunks):
                emb = get_embedding(chunk_text)
                if emb:
                    with SessionLocal() as db:
                        dc = DocumentChunk(
                            id=str(uuid.uuid4()),
                            file_id=file_id,
                            session_id=session_id,
                            chunk_index=i,
                            text=chunk_text,
                            embedding=emb,
                        )
                        db.add(dc)
                        db.commit()
            print(f"✅ Embedded {len(chunks)} chunks for {filename}")
        except Exception as e:
            print(f"⚠️  Chunk embedding failed for {filename}: {e}")
    asyncio.create_task(_chunk_and_embed())
    
    return {"id": file_id, "filename": filename, "type": ext, "chars": len(extracted)}

@app.get("/uploads/{session_id}")
async def get_uploads(session_id: str):
    with SessionLocal() as db:
        files = db.query(UploadedFile).filter(UploadedFile.session_id == session_id).all()
        return [{"id": f.id, "filename": f.filename, "type": f.file_type, "chars": len(f.extracted_text or "")} for f in files]

# ---- Enhanced Analytics ----
@app.get("/tokens/timeseries")
async def get_token_timeseries():
    with SessionLocal() as db:
        rows = db.query(
            cast(TokenUsage.timestamp, Date).label('date'),
            TokenUsage.model_key,
            func.sum(TokenUsage.tokens_in).label('total_in'),
            func.sum(TokenUsage.tokens_out).label('total_out')
        ).group_by('date', TokenUsage.model_key).order_by('date').all()
        return [{"date": str(r[0]), "model": r[1], "tokens_in": r[2] or 0, "tokens_out": r[3] or 0} for r in rows]

@app.get("/dashboard/analytics")
async def get_dashboard_analytics():
    with SessionLocal() as db:
        # Chat frequency (last 30 days)
        chat_freq = db.query(
            cast(ChatMessage.timestamp, Date).label('date'),
            func.count(ChatMessage.id).label('count')
        ).filter(ChatMessage.role == 'user').group_by('date').order_by('date').all()
        
        # Model usage distribution
        model_dist = db.query(
            TokenUsage.model_key,
            func.count(TokenUsage.id).label('count')
        ).group_by(TokenUsage.model_key).all()
        
        # Total stats
        total_chats = db.query(func.count(ChatSession.id)).scalar() or 0
        total_messages = db.query(func.count(ChatMessage.id)).scalar() or 0
        
        return {
            "chat_frequency": [{"date": str(r[0]), "count": r[1]} for r in chat_freq],
            "model_distribution": [{"model": r[0], "count": r[1]} for r in model_dist],
            "total_chats": total_chats,
            "total_messages": total_messages
        }

@app.post("/chat/stream")
async def chat_stream(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user)):
    config = {"configurable": {"thread_id": body.thread_id, "model_key": body.model_key, "enable_web_search": body.enable_web_search}}

    # Point Ember Code's file/shell tools at this session's sandboxed workspace.
    from agent.coding_tools import set_workspace
    set_workspace(body.thread_id)

    # Temporary chats leave no trace: no sensory buffer, no memory extraction,
    # no persisted session/messages.
    if not body.temporary:
        # Push to sensory buffer (Redis)
        MemoryStore.add_to_sensory_buffer(body.thread_id, {"role": "user", "message": body.message})

        # Spawn background task for memory extraction (with error logging)
        async def _safe_extract():
            try:
                await extract_memories_background(body.message)
            except Exception as e:
                print(f"⚠️  Background memory extraction failed: {e}")
        asyncio.create_task(_safe_extract())

        with SessionLocal() as db:
            session = db.query(ChatSession).filter(ChatSession.id == body.thread_id).first()
            if not session:
                title = body.message[:30] + ("..." if len(body.message) > 30 else "")
                session = ChatSession(id=body.thread_id, user_id=user_id, title=title, project_id=body.project_id)
                db.add(session)
            else:
                session.updated_at = datetime.utcnow()

            user_msg = ChatMessage(id=str(uuid.uuid4()), session_id=body.thread_id, role="user", content=body.message)
            db.add(user_msg)
            db.commit()

    async def event_generator():
        tokens_out_approx = 0
        tokens_in_approx = len(body.message.split()) * 1.3
        assistant_content = ""

        # Image model: it can't hold a conversation, so route the prompt straight
        # to image generation and stream back the resulting markdown image.
        from agent.models import get_model
        from agent.graph import generate_image
        if get_model(body.model_key).get("kind") == "image":
            prompt = body.message.strip() or "a single ember glowing in the dark"
            yield {"data": json.dumps({"tool_start": "generate_image"})}
            img_md = await asyncio.to_thread(generate_image, prompt)
            yield {"data": json.dumps({"tool_end": "generate_image"})}
            assistant_content = img_md
            yield {"data": json.dumps({"text": img_md})}
            yield {"data": json.dumps({"done": True, "tokens_in": int(tokens_in_approx), "tokens_out": 0})}
            if not body.temporary:
                with SessionLocal() as db:
                    db.add(ChatMessage(id=str(uuid.uuid4()), session_id=body.thread_id, role="assistant", content=assistant_content))
                    db.commit()
            return

        # RAG-based file context: retrieve relevant chunks instead of brute-force injection
        file_context = ""
        with SessionLocal() as db:
            has_files = db.query(UploadedFile).filter(UploadedFile.session_id == body.thread_id).first()
            if has_files:
                relevant_chunks = MemoryStore.search_document_chunks(body.message, body.thread_id, top_k=5)
                if relevant_chunks:
                    file_context = "\n\n--- RELEVANT DOCUMENT CONTEXT ---\n"
                    for chunk in relevant_chunks:
                        file_context += f"\n{chunk['text']}\n"
                    file_context += "--- END DOCUMENT CONTEXT ---\n\n"
        
        message_with_context = body.message
        if file_context:
            user_msg = body.message if body.message.strip() else "Please summarize this document."
            message_with_context = file_context + "User question: " + user_msg
        elif not message_with_context.strip():
            # Fallback if somehow there's no context and no message
            message_with_context = "Hello!"
        try:
            async for event in request.app.state.graph.astream_events(
                {"messages": [("user", message_with_context)]}, 
                config, 
                version="v2"
            ):
                if await request.is_disconnected():
                    break
                
                if event["event"] == "on_tool_start":
                    # Include the tool input so the UI can show the target
                    # (e.g. which file was read/edited, which command ran).
                    yield {"data": json.dumps({"tool_start": event["name"], "tool_input": event["data"].get("input")})}

                elif event["event"] == "on_tool_end":
                    yield {"data": json.dumps({"tool_end": event["name"]})}
                    
                elif event["event"] == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    # Handle both string and list content
                    content_str = chunk.content if isinstance(chunk.content, str) else str(chunk.content)
                    if content_str and content_str != "[]":
                        assistant_content += content_str
                        tokens_out_approx += len(content_str.split()) * 1.3
                        yield {"data": json.dumps({"text": content_str})}
                
                elif event["event"] == "on_chat_model_end":
                    output = event["data"]["output"]
                    # Try to get accurate token counts from usage_metadata
                    if hasattr(output, 'usage_metadata') and output.usage_metadata:
                        um = output.usage_metadata
                        tokens_in_approx = um.get('input_tokens', tokens_in_approx)
                        tokens_out_approx = um.get('output_tokens', tokens_out_approx)
                    # If we didn't stream anything, send the final output
                    if not assistant_content and output.content:
                        content_str = output.content if isinstance(output.content, str) else str(output.content)
                        if content_str and content_str != "[]":
                            assistant_content = content_str
                            yield {"data": json.dumps({"text": content_str})}
            
            yield {"data": json.dumps({"done": True, "tokens_in": int(tokens_in_approx), "tokens_out": int(tokens_out_approx)})}

            if not body.temporary:
                with SessionLocal() as db:
                    ast_msg = ChatMessage(id=str(uuid.uuid4()), session_id=body.thread_id, role="assistant", content=assistant_content)
                    db.add(ast_msg)

                    usage = TokenUsage(
                        id=str(uuid.uuid4()),
                        model_key=body.model_key,
                        tokens_in=tokens_in_approx,
                        tokens_out=tokens_out_approx
                    )
                    db.add(usage)
                    db.commit()
            
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            error_msg = "⚠️ The AI model is currently degraded or unreachable. Please select a different model or try again."
            if not body.temporary:
                with SessionLocal() as db:
                    ast_msg = ChatMessage(id=str(uuid.uuid4()), session_id=body.thread_id, role="assistant", content=error_msg)
                    db.add(ast_msg)
                    db.commit()
            yield {"data": json.dumps({"error": tb})}
            yield {"data": json.dumps({"done": True})}

    return EventSourceResponse(event_generator())

# ---- Memory Search & Stats ----
@app.get("/memory/search")
async def search_memories(q: str, top_k: int = 5):
    """Semantic search across all stored memories."""
    results = MemoryStore.search_memories(q, top_k=top_k)
    return results

@app.get("/memory/stats")
async def get_memory_stats():
    """Get memory statistics for the dashboard."""
    from database import SemanticFact, ProceduralWorkflow
    with SessionLocal() as db:
        semantic_count = db.query(func.count(SemanticFact.id)).scalar() or 0
        procedural_count = db.query(func.count(ProceduralWorkflow.id)).scalar() or 0
        
        oldest = db.query(func.min(SemanticFact.timestamp)).scalar()
        newest = db.query(func.max(SemanticFact.timestamp)).scalar()
        avg_conf = db.query(func.avg(SemanticFact.confidence)).scalar()
        
        return {
            "semantic_count": semantic_count,
            "procedural_count": procedural_count,
            "oldest_memory": oldest.isoformat() if oldest else None,
            "newest_memory": newest.isoformat() if newest else None,
            "avg_confidence": round(avg_conf, 3) if avg_conf else None
        }

@app.get("/memory/graph")
async def get_memory_graph():
    """Returns semantic facts formatted for a force-directed graph visualization."""
    from database import SemanticFact
    with SessionLocal() as db:
        facts = db.query(SemanticFact).all()
        
        nodes = []
        links = []
        categories = set()
        
        for fact in facts:
            nodes.append({
                "id": fact.id,
                "label": fact.fact,
                "category": fact.category,
                "val": fact.strength or 1.0,
                "group": "fact"
            })
            if fact.category:
                categories.add(fact.category)
                links.append({
                    "source": fact.id,
                    "target": f"cat_{fact.category}",
                    "value": fact.confidence or 1.0
                })
                
        for cat in categories:
            nodes.append({
                "id": f"cat_{cat}",
                "label": cat,
                "category": "category",
                "val": 2.0,
                "group": "category"
            })
            
        return {"nodes": nodes, "links": links}

@app.get("/memory/facts")
async def list_semantic_facts(skip: int = 0, limit: int = 100):
    """List semantic facts for the dashboard."""
    from database import SemanticFact
    with SessionLocal() as db:
        facts = db.query(SemanticFact).order_by(SemanticFact.timestamp.desc()).offset(skip).limit(limit).all()
        return [
            {
                "id": f.id,
                "fact": f.fact,
                "category": f.category,
                "entity": f.entity,
                "confidence": f.confidence,
                "strength": f.strength,
                "last_accessed": f.last_accessed.isoformat() if f.last_accessed else None,
                "timestamp": f.timestamp.isoformat() if f.timestamp else None
            }
            for f in facts
        ]

@app.delete("/memory/facts/{fact_id}")
async def delete_semantic_fact(fact_id: str):
    """Delete a semantic memory explicitly."""
    from database import SemanticFact, MemoryEmbedding
    with SessionLocal() as db:
        db.query(MemoryEmbedding).filter(MemoryEmbedding.memory_id == fact_id).delete()
        db.query(SemanticFact).filter(SemanticFact.id == fact_id).delete()
        db.commit()
    return {"status": "success"}

# ---- Chat Export ----
@app.get("/chats/{session_id}/export")
async def export_chat(session_id: str, format: str = "md"):
    """Export chat history as markdown or JSON."""
    with SessionLocal() as db:
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.timestamp.asc()).all()
        
        if format == "json":
            return [
                {"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()}
                for m in messages
            ]
        
        # Markdown format
        md = f"# Chat Export\n\nThread: `{session_id}`\nExported: {datetime.utcnow().isoformat()}\n\n---\n\n"
        for m in messages:
            role_label = "🧑 User" if m.role == "user" else "🤖 Assistant"
            ts = m.timestamp.strftime("%Y-%m-%d %H:%M") if m.timestamp else ""
            md += f"### {role_label}\n*{ts}*\n\n{m.content}\n\n---\n\n"
        
        return PlainTextResponse(
            content=md,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="chat_{session_id[:8]}.md"'}
        )

# ---- Memory Consolidation ----
@app.post("/admin/consolidate")
async def trigger_consolidation():
    """Trigger memory consolidation: sensory→episodic + decay."""
    consolidated = await consolidate_sensory_to_episodic()
    decay_result = await decay_low_confidence_memories()
    return {
        "consolidated_sessions": consolidated,
        "decay": decay_result
    }

# ---- Proactive Resurfacing (the "I remembered this…" moment) ----
@app.get("/resurfacing/pending")
async def resurfacing_pending():
    """
    The current proactive nudge for the user. Returns an existing un-reacted nudge
    if one is waiting; otherwise generates one when the frequency gate is open.
    Returns {"nudge": null} when there's nothing worth surfacing right now.
    """
    existing = resurfacing.get_pending()
    if existing:
        return {"nudge": existing}
    nudge = await resurfacing.generate_resurfacing(force=False)
    return {"nudge": nudge}


class ResurfacingGenerateRequest(BaseModel):
    force: bool = True


@app.post("/resurfacing/generate")
async def resurfacing_generate(body: ResurfacingGenerateRequest = ResurfacingGenerateRequest()):
    """Manually generate a nudge (bypasses the once-a-day gate when force=true)."""
    nudge = await resurfacing.generate_resurfacing(force=body.force)
    return {"nudge": nudge}


class ResurfacingReactRequest(BaseModel):
    reaction: str  # "helpful" | "not_now" | "forget"


@app.post("/resurfacing/{event_id}/react")
async def resurfacing_react(event_id: str, body: ResurfacingReactRequest):
    """Record the user's response; reinforces or releases the source memory."""
    return resurfacing.react(event_id, body.reaction)


# ---- PDF Export ----
class PdfExportRequest(BaseModel):
    title: str = "Ember conversation"
    messages: list[dict] = []


@app.post("/export/pdf")
async def export_pdf(req: PdfExportRequest):
    """Render a conversation to a downloadable PDF."""
    from fastapi import Response
    from pdf_export import build_chat_pdf
    data = build_chat_pdf(req.title, req.messages)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="ember-conversation.pdf"'},
    )


# ---- Ember Flower API ----
from database import UserConnection, AmbientEvent, FlowerSettings

@app.get("/flower/connections")
async def get_flower_connections():
    with SessionLocal() as db:
        conns = db.query(UserConnection).all()
        return [{"provider": c.provider, "status": c.status, "last_synced": c.last_synced.isoformat() if c.last_synced else None} for c in conns]

class ConnectRequest(BaseModel):
    provider: str
    token: str | None = None

@app.post("/flower/connect")
async def connect_flower_service(req: ConnectRequest):
    """Endpoint to save connection data."""
    with SessionLocal() as db:
        existing = db.query(UserConnection).filter_by(provider=req.provider).first()
        token = req.token or "mock_token"
        if existing:
            existing.status = "connected"
            if req.token:
                existing.access_token = token
            existing.last_synced = datetime.utcnow()
        else:
            conn = UserConnection(
                id=str(uuid.uuid4()),
                provider=req.provider,
                access_token=token,
                status="connected"
            )
            db.add(conn)
        db.commit()
    return {"status": "success", "provider": req.provider}

@app.post("/flower/sync")
async def force_sync_flower():
    """Manually force sync all connected services."""
    from agent.flower import sync_spotify_real, sync_notion_real, sync_obsidian_real
    await sync_spotify_real()
    await sync_notion_real()
    await sync_obsidian_real()
    return {"status": "success"}

@app.get("/flower/feed")
async def get_flower_feed():
    with SessionLocal() as db:
        events = db.query(AmbientEvent).order_by(AmbientEvent.timestamp.desc()).limit(20).all()
        return [
            {
                "id": e.id,
                "provider": e.provider,
                "summary": e.event_summary,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None
            } for e in events
        ]

@app.get("/flower/notion/dashboard")
async def get_notion_dashboard():
    with SessionLocal() as db:
        connection = db.query(UserConnection).filter_by(provider="notion", status="connected").first()
        if not connection or not connection.access_token:
            return {"error": "Notion not connected"}
            
        import httpx
        headers = {
            "Authorization": f"Bearer {connection.access_token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.notion.com/v1/search",
                headers=headers,
                json={
                    "sort": {"direction": "descending", "timestamp": "last_edited_time"},
                    "page_size": 20
                }
            )
            
            if res.status_code != 200:
                return {"error": "Failed to fetch from Notion API", "details": res.text}
                
            data = res.json()
            
            databases = []
            pages = []
            
            for item in data.get("results", []):
                obj_type = item.get("object")
                title = "Untitled"
                
                if "properties" in item:
                    for prop_name, prop_data in item["properties"].items():
                        if prop_data.get("type") == "title":
                            title_arr = prop_data.get("title", [])
                            if title_arr:
                                title = title_arr[0].get("plain_text", title)
                            break
                elif "title" in item:
                    title_arr = item.get("title", [])
                    if title_arr:
                        title = title_arr[0].get("plain_text", title)
                
                url = item.get("url", "")
                last_edited = item.get("last_edited_time")
                
                entry = {
                    "id": item.get("id"),
                    "title": title,
                    "url": url,
                    "last_edited": last_edited
                }
                
                if obj_type == "database":
                    databases.append(entry)
                elif obj_type == "page":
                    pages.append(entry)
            
            return {
                "status": "success",
                "databases": databases,
                "recent_pages": pages
            }

@app.get("/auth/spotify/login")
async def spotify_login():
    import os, urllib.parse
    from fastapi.responses import RedirectResponse
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    redirect_uri = "http://localhost:8000/auth/spotify/callback"
    if not client_id:
        return {"error": "SPOTIFY_CLIENT_ID not set in .env"}
    
    scope = "user-read-recently-played"
    query = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": client_id,
        "scope": scope,
        "redirect_uri": redirect_uri
    })
    return RedirectResponse(f"https://accounts.spotify.com/authorize?{query}")

@app.get("/auth/spotify/callback")
async def spotify_callback(code: str):
    import os, base64, httpx
    from fastapi.responses import RedirectResponse
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    redirect_uri = "http://localhost:8000/auth/spotify/callback"
    
    auth_str = f"{client_id}:{client_secret}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()
    
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri
            },
            headers={
                "Authorization": f"Basic {b64_auth_str}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        if res.status_code == 200:
            token_data = res.json()
            access_token = token_data.get("access_token")
            with SessionLocal() as db:
                existing = db.query(UserConnection).filter_by(provider="spotify").first()
                if existing:
                    existing.status = "connected"
                    existing.access_token = access_token
                    existing.last_synced = datetime.utcnow()
                else:
                    conn = UserConnection(
                        id=str(uuid.uuid4()),
                        provider="spotify",
                        access_token=access_token,
                        status="connected"
                    )
                    db.add(conn)
                db.commit()
            return RedirectResponse("http://localhost:3000/flower/dashboard")
        return {"error": "Failed to get token", "details": res.text}

class SettingsRequest(BaseModel):
    allow_notifications: bool
    morning_window: bool
    afternoon_window: bool
    evening_window: bool
    delivery_method: str

@app.get("/flower/settings")
async def get_flower_settings():
    with SessionLocal() as db:
        settings = db.query(FlowerSettings).first()
        if not settings:
            settings = FlowerSettings(id="default")
            db.add(settings)
            db.commit()
        return {
            "allow_notifications": settings.allow_notifications,
            "morning_window": settings.morning_window,
            "afternoon_window": settings.afternoon_window,
            "evening_window": settings.evening_window,
            "delivery_method": settings.delivery_method
        }

@app.post("/flower/settings")
async def update_flower_settings(req: SettingsRequest):
    with SessionLocal() as db:
        settings = db.query(FlowerSettings).first()
        if not settings:
            settings = FlowerSettings(id="default")
            db.add(settings)
            
        settings.allow_notifications = req.allow_notifications
        settings.morning_window = req.morning_window
        settings.afternoon_window = req.afternoon_window
        settings.evening_window = req.evening_window
        settings.delivery_method = req.delivery_method
        db.commit()
    return {"status": "success"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
