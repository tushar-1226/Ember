import asyncio
from datetime import datetime, timedelta
from database import (
    SessionLocal, 
    ChatSession, 
    ChatMessage, 
    Project,
    UploadedFile,
    DocumentChunk,
    SemanticFact,
    ProceduralWorkflow,
    MemoryEmbedding,
    Resurfacing,
    AmbientEvent
)

async def cleanup_background_task():
    """A background loop that periodically deletes data older than 7 days."""
    while True:
        try:
            cutoff = datetime.utcnow() - timedelta(days=7)
            with SessionLocal() as db:
                # Delete old projects
                projects_deleted = db.query(Project).filter(Project.updated_at < cutoff).delete()
                
                # Delete old chat sessions
                sessions_deleted = db.query(ChatSession).filter(ChatSession.updated_at < cutoff).delete()
                
                # Delete old messages
                messages_deleted = db.query(ChatMessage).filter(ChatMessage.timestamp < cutoff).delete()
                
                # Delete old uploaded files
                files_deleted = db.query(UploadedFile).filter(UploadedFile.uploaded_at < cutoff).delete()
                
                # Delete old document chunks
                chunks_deleted = db.query(DocumentChunk).filter(DocumentChunk.created_at < cutoff).delete()
                
                # Decay old semantic facts instead of hard-deleting by timestamp
                facts = db.query(SemanticFact).all()
                decay_count = 0
                delete_count = 0
                now = datetime.utcnow()
                for fact in facts:
                    days_since_access = (now - fact.last_accessed).days
                    if days_since_access > 0:
                        # apply decay once a day
                        fact.strength = max(0.0, fact.strength - (fact.decay_rate * days_since_access))
                        fact.last_accessed = now # reset to prevent multiple decays on same day
                        decay_count += 1
                        if fact.strength < 0.1:
                            db.delete(fact)
                            delete_count += 1

                # Delete old procedural workflows (keep for now as TTL)
                workflows_deleted = db.query(ProceduralWorkflow).filter(ProceduralWorkflow.timestamp < cutoff).delete()
                
                # Delete embeddings that no longer have a parent
                # Clean up orphaned embeddings will happen implicitly or we can just leave it as is.
                # Actually let's just delete embeddings older than cutoff if they are not semantic/procedural.
                embeddings_deleted = db.query(MemoryEmbedding).filter(MemoryEmbedding.created_at < cutoff).delete()
                
                # Delete old resurfacings
                resurfacings_deleted = db.query(Resurfacing).filter(Resurfacing.created_at < cutoff).delete()
                
                # Delete old ambient events
                ambient_deleted = db.query(AmbientEvent).filter(AmbientEvent.timestamp < cutoff).delete()

                db.commit()
                
                total = (projects_deleted + sessions_deleted + messages_deleted + 
                        files_deleted + chunks_deleted + 
                        workflows_deleted + embeddings_deleted + resurfacings_deleted + 
                        ambient_deleted)
                
                if total > 0 or decay_count > 0:
                    print(f"[Ember Cleanup] Deleted {total} records older than 7 days. Decayed {decay_count} memories. Deleted {delete_count} weak memories.")
        
        except Exception as e:
            print(f"[Ember Cleanup] Error: {e}")
            
        # Run once every hour (3600 seconds)
        await asyncio.sleep(3600)
