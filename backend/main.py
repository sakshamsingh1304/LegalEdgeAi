import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (one level up from backend/)
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Add src to path so we can import rag_groq
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

# Lazy-load RAG module — sentence-transformers takes minutes to load,
# which causes Render to timeout waiting for port binding.
# The model will load on first /api/chat request instead.
_generate_answer = None

def get_generate_answer():
    global _generate_answer
    if _generate_answer is None:
        try:
            print("Loading RAG module (first request — this may take a minute)...")
            from rag_groq import generate_answer
            _generate_answer = generate_answer
            print("RAG module loaded successfully!")
        except ImportError as e:
            print(f"Error importing rag_groq: {e}")
            _generate_answer = None
    return _generate_answer

import pickle
METADATA_PATH = os.path.join(os.path.dirname(__file__), "metadata.pkl")

class SearchResult(BaseModel):
    id: str
    title: str
    tag: str
    meta: str
    description: str
    image: str
    url: str
    file_name: str
    upload_date: str
    match_count: int

app = FastAPI(title="LegalFinanceApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None

class Source(BaseModel):
    title: str
    authority: str
    preview: str
    confidence: float
    url: str

class ChatResponse(BaseModel):
    content: str
    sources: List[Source]


from fastapi.staticfiles import StaticFiles
import glob

# Mount the data directory to serve PDF files statically
# Ensure the directory exists
os.makedirs("data", exist_ok=True)
app.mount("/data", StaticFiles(directory="data"), name="data")

# --- Neon PostgreSQL Connection ---
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_db():
    """Get a database connection. Neon auto-wakes in ~400ms if sleeping."""
    if not DATABASE_URL:
        return None
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_db():
    """Create tables if they don't exist (runs on startup)."""
    conn = get_db()
    if not conn:
        print("Warning: DATABASE_URL not set. Chat history will not be persisted.")
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL,
                title TEXT DEFAULT 'New Chat',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sources JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);")
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Database init error: {e}")
    finally:
        conn.close()

# Initialize DB on startup
init_db()

# --- Conversation & Message Endpoints ---

class CreateConversationRequest(BaseModel):
    user_id: str
    title: str = "New Chat"

class CreateMessageRequest(BaseModel):
    role: str
    content: str
    sources: Optional[List[Any]] = None

class UpdateConversationRequest(BaseModel):
    title: str

@app.get("/api/conversations")
async def list_conversations(user_id: str):
    conn = get_db()
    if not conn:
        return []
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, user_id, title, created_at, updated_at FROM conversations WHERE user_id = %s ORDER BY updated_at DESC",
            (user_id,)
        )
        rows = cur.fetchall()
        return [
            {
                "id": str(row["id"]),
                "user_id": row["user_id"],
                "title": row["title"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
            }
            for row in rows
        ]
    except Exception as e:
        print(f"Error listing conversations: {e}")
        return []
    finally:
        conn.close()

@app.post("/api/conversations")
async def create_conversation(req: CreateConversationRequest):
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO conversations (user_id, title) VALUES (%s, %s) RETURNING id, user_id, title, created_at, updated_at",
            (req.user_id, req.title)
        )
        row = cur.fetchone()
        return {
            "id": str(row["id"]),
            "user_id": row["user_id"],
            "title": row["title"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
        }
    except Exception as e:
        print(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    conn = get_db()
    if not conn:
        return []
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, conversation_id, role, content, sources, created_at FROM messages WHERE conversation_id = %s::uuid ORDER BY created_at ASC",
            (conversation_id,)
        )
        rows = cur.fetchall()
        return [
            {
                "id": str(row["id"]),
                "conversation_id": str(row["conversation_id"]),
                "role": row["role"],
                "content": row["content"],
                "sources": row["sources"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            }
            for row in rows
        ]
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return []
    finally:
        conn.close()

@app.post("/api/conversations/{conversation_id}/messages")
async def add_message(conversation_id: str, req: CreateMessageRequest):
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        import json
        cur = conn.cursor()
        sources_json = json.dumps(req.sources) if req.sources else None
        cur.execute(
            "INSERT INTO messages (conversation_id, role, content, sources) VALUES (%s::uuid, %s, %s, %s::jsonb) RETURNING id, conversation_id, role, content, sources, created_at",
            (conversation_id, req.role, req.content, sources_json)
        )
        row = cur.fetchone()

        # Update conversation's updated_at
        cur.execute(
            "UPDATE conversations SET updated_at = NOW() WHERE id = %s::uuid",
            (conversation_id,)
        )

        return {
            "id": str(row["id"]),
            "conversation_id": str(row["conversation_id"]),
            "role": row["role"],
            "content": row["content"],
            "sources": row["sources"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
    except Exception as e:
        print(f"Error saving message: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/conversations/{conversation_id}")
async def remove_conversation(conversation_id: str):
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM conversations WHERE id = %s::uuid", (conversation_id,))
        return {"status": "deleted"}
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.patch("/api/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, req: UpdateConversationRequest):
    conn = get_db()
    if not conn:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE conversations SET title = %s, updated_at = NOW() WHERE id = %s::uuid",
            (req.title, conversation_id)
        )
        return {"status": "updated"}
    except Exception as e:
        print(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# --- Existing Endpoints ---

@app.get("/")
async def root():
    return {"message": "LegalFinanceApp API is running", "docs": "/docs"}

@app.get("/health")
async def health():
    """Health check endpoint for keep-alive pings."""
    return {"status": "ok"}

@app.get("/api/documents")
async def get_documents():
    """
    Lists all PDF documents in the backend/data directory with robust error handling.
    """
    try:
        # Get absolute path to data directory
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, "data")
        
        print(f"Scanning directory: {data_dir}")

        if not os.path.exists(data_dir):
            print(f"Data directory not found: {data_dir}")
            return []

        # List all PDF files
        files = os.listdir(data_dir)
        pdf_files = [f for f in files if f.lower().endswith('.pdf')]
        
        print(f"Found {len(pdf_files)} PDF files: {pdf_files}")

        documents = []
        for idx, filename in enumerate(pdf_files):
            try:
                # Create a simple document object
                title = filename.replace(".pdf", "").replace("_", " ").replace("-", " ")
                
                # Simple heuristic for tags based on filename
                tag = "Legal"
                if "act" in title.lower():
                    tag = "Act"
                elif "rule" in title.lower():
                    tag = "Rules"
                elif "form" in title.lower():
                    tag = "Form"
                elif "guid" in title.lower():
                    tag = "Guide"
                
                # Construct URL - use env var for production
                api_url = os.getenv("API_BASE_URL", "http://localhost:8000")
                doc_url = f"{api_url}/data/{filename}"

                # Get file stats for date
                file_path = os.path.join(data_dir, filename)
                mtime = os.path.getmtime(file_path)
                from datetime import datetime
                upload_date = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")

                doc = {
                    "id": str(idx + 1),
                    "title": title,
                    "tag": tag,
                    "meta": f"PDF • {upload_date}",
                    "description": f"Official legal document: {title}",
                    "image": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop",
                    "url": doc_url,
                    "file_name": filename,
                    "upload_date": upload_date
                }
                documents.append(doc)
            except Exception as e:
                print(f"Error processing file {filename}: {e}")
                continue
                
        return documents

    except Exception as e:
        print(f"Critical error in get_documents: {e}")
        # Return empty list instead of 500 to avoid breaking frontend loop
        return []

@app.get("/api/search", response_model=List[SearchResult])
async def search_documents(q: str):
    """
    Search within document contents for keyword frequency.
    """
    if not q:
        return []
    
    try:
        if not os.path.exists(METADATA_PATH):
            print(f"Metadata file not found: {METADATA_PATH}")
            return []
            
        with open(METADATA_PATH, "rb") as f:
            data = pickle.load(f)
            texts = data.get("texts", [])
            metadata = data.get("metadata", [])
            
        # Strategy: Aggregate match counts per filename
        match_counts = {} # filename -> count
        q_lower = q.lower()
        
        for text, meta in zip(texts, metadata):
            count = text.lower().count(q_lower)
            if count > 0:
                filename = meta.get("source")
                if filename:
                    match_counts[filename] = match_counts.get(filename, 0) + count
        
        # Now get the actual document objects and attach match_count
        all_docs = await get_documents()
        results = []
        
        for doc in all_docs:
            count = match_counts.get(doc["file_name"], 0)
            if count > 0:
                results.append({**doc, "match_count": count})
            elif q_lower in doc["title"].lower() or q_lower in doc["description"].lower():
                # Even if no text match, if title/desc matches, include with count 0 (or 1 as heuristic)
                results.append({**doc, "match_count": 0})
        
        # Sort by match_count descending
        results.sort(key=lambda x: x["match_count"], reverse=True)
        return results
        
    except Exception as e:
        print(f"Search error: {e}")
        return []

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    gen_answer = get_generate_answer()
    if gen_answer is None:
        raise HTTPException(status_code=500, detail="Backend RAG module not loaded correctly")
        
    try:
        # Get answer from RAG
        answer, sources_raw = gen_answer(request.query)
        
        mapped_sources = []
        seen_sources = set()
        
        for s in sources_raw:
            # Construct a unique key to avoid duplicates
            source_name = s.get("source", "Unknown Source")
            if source_name in seen_sources:
                continue
            seen_sources.add(source_name)
            
            title = source_name
            authority = "Legal Documents" # Default
            if "act" in title.lower():
                authority = "Government Act"
            elif "rule" in title.lower():
                authority = "Rules"
                
            api_url = os.getenv("API_BASE_URL", "http://localhost:8000")
            mapped_sources.append(Source(
                title=title,
                authority=authority,
                preview=f"Referenced in {source_name}",
                confidence=0.9, # Placeholder
                url=f"{api_url}/data/{source_name}"
            ))
            
        return ChatResponse(content=answer, sources=mapped_sources)
    except Exception as e:
        print(f"Error in chat_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Task Persistence ---
import json

TASKS_FILE = os.path.join(os.path.dirname(__file__), "data", "tasks.json")

class CalendarEvent(BaseModel):
    id: str
    date: int
    month: str
    year: int
    title: str
    desc: str
    urgency: str
    type: str

def load_tasks():
    if not os.path.exists(TASKS_FILE):
        return []
    try:
        with open(TASKS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_tasks(tasks):
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f, indent=2)

@app.get("/api/tasks", response_model=List[CalendarEvent])
async def get_tasks():
    return load_tasks()

@app.post("/api/tasks", response_model=List[CalendarEvent])
async def save_task(task: CalendarEvent):
    tasks = load_tasks()
    # Remove existing task with same ID if it exists (update scenario)
    tasks = [t for t in tasks if t.get("id") != task.id]
    tasks.append(task.dict())
    save_tasks(tasks)
    return tasks

@app.delete("/api/tasks/{task_id}", response_model=List[CalendarEvent])
async def delete_task(task_id: str):
    tasks = load_tasks()
    tasks = [t for t in tasks if t.get("id") != task_id]
    save_tasks(tasks)
    return tasks


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
