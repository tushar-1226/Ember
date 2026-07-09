import os
from typing import List
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from agent.memory import MemoryStore

class SemanticExtraction(BaseModel):
    fact: str = Field(description="The extracted fact or user preference.")
    category: str = Field(description="Category of the fact (e.g., 'preference', 'personal', 'environment').")
    entity: str = Field(description="The main entity the fact is about (e.g., 'User', 'Project').")

class ProceduralExtraction(BaseModel):
    name: str = Field(description="Name of the workflow or process.")
    description: str = Field(description="A brief description of what the workflow accomplishes.")
    steps: List[str] = Field(description="A sequential list of steps in the workflow.")

class UserProfileExtraction(BaseModel):
    preferred_language: str = Field(description="The primary language the user prefers.", default="English")
    asking_tone: str = Field(description="The user's typical tone (e.g., 'direct', 'polite', 'casual', 'formal').", default="direct")
    user_style: str = Field(description="The user's query style (e.g., 'concise', 'detailed', 'code-heavy').", default="concise")

class MemoryExtractionResult(BaseModel):
    semantic_facts: List[SemanticExtraction] = Field(description="List of extracted semantic facts.", default_factory=list)
    procedural_workflows: List[ProceduralExtraction] = Field(description="List of extracted procedural workflows.", default_factory=list)
    user_profile: UserProfileExtraction = Field(description="Assessment of the user's conversational profile.", default_factory=UserProfileExtraction)

async def extract_memories_background(message: str, user_id: str):
    """
    Background task to extract memories from a user message and store them in the database.
    """
    try:
        llm = ChatOpenAI(
            model=os.getenv("MISTRAL_MODEL", "mistralai/mistral-medium-3.5-128b"),
            api_key=os.getenv("MISTRAL_API_KEY"),
            base_url="https://integrate.api.nvidia.com/v1",
            temperature=0.0
        )
        
        system_msg = SystemMessage(
            content=(
                "You are a memory extraction assistant. Analyze the user's message and extract "
                "any new semantic facts (e.g., user preferences, explicit facts) or procedural workflows "
                "(step-by-step instructions the user wants you to learn). Also, assess the user's conversational profile (tone, style, language). "
                "Only extract information that is explicitly stated as a fact or rule. "
                "Output ONLY a valid JSON object matching this schema exactly (do not wrap in markdown): "
                '{"semantic_facts": [{"fact": "str", "category": "str", "entity": "str"}], "procedural_workflows": [{"name": "str", "description": "str", "steps": ["str"]}], "user_profile": {"preferred_language": "str", "asking_tone": "str", "user_style": "str"}}'
            )
        )
        
        response = await llm.ainvoke([system_msg, HumanMessage(content=message)])
        raw_output = response.content.strip()
        
        # Clean markdown if present
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]
            
        import json
        data = json.loads(raw_output.strip())
        result = MemoryExtractionResult(**data)
        
        for fact in result.semantic_facts:
            MemoryStore.add_semantic(fact.fact, fact.category, fact.entity, user_id=user_id)
        for workflow in result.procedural_workflows:
            MemoryStore.add_procedural(workflow.name, workflow.description, workflow.steps, user_id=user_id)

        # Update user profile
        from database import SessionLocal, UserProfile
        from datetime import datetime
        with SessionLocal() as db:
            profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
            if not profile:
                profile = UserProfile(id=user_id)
                db.add(profile)
            
            profile.preferred_language = result.user_profile.preferred_language
            profile.asking_tone = result.user_profile.asking_tone
            profile.user_style = result.user_profile.user_style
            profile.last_updated = datetime.utcnow()
            db.commit()
                
    except Exception as e:
        print(f"Background memory extraction failed: {e}")
