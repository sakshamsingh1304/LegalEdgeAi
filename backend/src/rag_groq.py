import faiss
import pickle
import numpy as np
import os
import time
from pathlib import Path
import requests
from groq import Groq
from dotenv import load_dotenv
import google.generativeai as genai

# Load env vars - .env is in the project root (two levels up from src/)
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# CONFIG
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Gemini fallback when Groq is rate-limited
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Gemini fallback configured successfully.")
else:
    print("Warning: GEMINI_API_KEY not set. No fallback LLM available.")

# Model fallback chain — updated to currently available Groq models (Oct 2026)
MODEL_CHAIN = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
]

# Embedding model using HF Inference API
HF_API_KEY = os.getenv("HF_API_KEY")
HF_API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"

def get_embedding(text):
    if not HF_API_KEY:
        print("HF_API_KEY missing - search will fail.")
        return [0.0] * 384
    try:
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        res = requests.post(HF_API_URL, headers=headers, json={"inputs": [text]})
        if res.status_code == 200:
            result = res.json()
            if isinstance(result, list) and len(result) > 0:
                return result[0] if isinstance(result[0], list) else result
        print(f"HF API Error: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"HF request failed: {e}")
    return [0.0] * 384

# Paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent # Assuming src/rag_groq.py, data is in parent/data or same dir?
# Original structure had data/ and src/ as siblings.
# When copied, they are unchanged.
# Listing showed:
# backend/data/
# backend/src/rag_groq.py
# backend/vector_index.faiss (root)
# backend/metadata.pkl (root)

# Correct paths based on original structure in root:
ROOT_DIR = Path(__file__).resolve().parent.parent

INDEX_PATH = ROOT_DIR / "vector_index.faiss"
METADATA_PATH = ROOT_DIR / "metadata.pkl"

if not INDEX_PATH.exists():
    print(f"Warning: Index not found at {INDEX_PATH}")
    # Handle error or fallback

# Load FAISS index
try:
    index = faiss.read_index(str(INDEX_PATH))
except Exception as e:
    print(f"Error loading FAISS index: {e}")
    index = None

# Load metadata
try:
    with open(METADATA_PATH, "rb") as f:
        data = pickle.load(f)
        texts = data["texts"]
        metadata = data["metadata"]
except Exception as e:
    print(f"Error loading metadata: {e}")
    texts = []
    metadata = []


#  RETRIEVAL 
def retrieve(query, top_k=10):
    if index is None:
        return []
        
    # Use API instead of local heavy model
    query_embedding = [get_embedding(query)]
    distances, indices = index.search(np.array(query_embedding), top_k)

    results = []
    for rank, idx in enumerate(indices[0]):
        if 0 <= idx < len(texts):
            results.append({
                "text": texts[idx],
                "metadata": metadata[idx] if idx < len(metadata) else {},
                "rank": rank + 1,
            })

    return results


def _call_gemini_fallback(prompt_text, temperature=0.2):
    """Fallback to Google Gemini when Groq is rate-limited."""
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY not configured — cannot fall back.")
    
    gemini_models = ["gemini-3.8-flash", "gemini-2.5-flash"]
    last_err = None
    for model_name in gemini_models:
        try:
            print(f"Falling back to Gemini model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt_text,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                ),
            )
            if response and response.text:
                print(f"Gemini ({model_name}) responded successfully.")
                return response.text
            else:
                raise Exception(f"Gemini returned empty response (model={model_name})")
        except Exception as e:
            last_err = e
            print(f"Gemini {model_name} failed: {e}")
            continue
    raise Exception(f"All Gemini models also failed. Last error: {last_err}")


def _call_groq_with_fallback(messages, temperature=0.2, max_retries=2):
    """Try each model in the chain. On rate-limit (429), retry with backoff."""
    last_error = None
    for model_id in MODEL_CHAIN:
        for attempt in range(max_retries + 1):
            try:
                print(f"Trying model: {model_id} (attempt {attempt + 1})")
                response = client.chat.completions.create(
                    model=model_id,
                    messages=messages,
                    temperature=temperature,
                )
                return response.choices[0].message.content
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                # Rate limit — wait and retry same model
                if "429" in str(e) or "rate" in err_str or "quota" in err_str:
                    wait = 2 ** (attempt + 1)
                    print(f"Rate limited on {model_id}, waiting {wait}s...")
                    time.sleep(wait)
                    continue
                # Model not found / deprecated — try next model
                if "model" in err_str and ("not found" in err_str or "decommission" in err_str or "deprecat" in err_str or "does not exist" in err_str):
                    print(f"Model {model_id} unavailable: {e}")
                    break  # Skip retries, go to next model
                # Other error — try next model
                print(f"Error with {model_id}: {e}")
                break
    raise Exception(f"All Groq models failed. Last error: {last_error}")


# RAG PROMPT
def generate_answer(query, conversation_history=None):
    """
    Generate an answer using RAG.
    conversation_history: optional list of {"role": "user"|"assistant", "content": str}
    """
    retrieved_items = retrieve(query)
    chunks = [item["text"] for item in retrieved_items]
    
    # Extract sources for returning alongside answer
    sources = [item["metadata"] for item in retrieved_items]

    # Build numbered context with source references
    context_parts = []
    source_map = {}  # source_number -> metadata
    source_counter = 0
    seen_sources = set()
    
    for item in retrieved_items:
        source_name = item["metadata"].get("source", "Unknown")
        if source_name not in seen_sources:
            source_counter += 1
            seen_sources.add(source_name)
            source_map[source_counter] = item["metadata"]
        
        # Find the source number for this chunk
        src_num = list(seen_sources).index(source_name) + 1
        context_parts.append(f"[Source {src_num}: {source_name}]\n{item['text']}")
    
    context = "\n\n---\n\n".join(context_parts)
    
    # Build source legend for the prompt
    source_legend = "\n".join([
        f"  [{num}] {meta.get('source', 'Unknown Document')}" 
        for num, meta in source_map.items()
    ])

    # Build conversation history section for context continuity
    history_section = ""
    if conversation_history and len(conversation_history) > 0:
        # Keep last 6 messages (3 exchanges) to stay within token limits
        recent = conversation_history[-6:]
        history_lines = []
        for msg in recent:
            role_label = "User" if msg["role"] == "user" else "Assistant"
            # Truncate long assistant responses to save tokens
            content = msg["content"]
            if msg["role"] == "assistant" and len(content) > 500:
                content = content[:500] + "..."
            history_lines.append(f"{role_label}: {content}")
        history_section = "\n\nConversation History (for context on follow-up questions):\n" + "\n".join(history_lines) + "\n"

    prompt = f"""You are a legal compliance assistant. Answer ONLY based on the provided context documents.
If the answer is not in context, say: "Information not found in provided documents."

IMPORTANT: You MUST include inline citations in your response using the format [1], [2], etc. 
to reference the source documents listed below. Place citations at the end of sentences or 
paragraphs where you used information from that source. This is critical for legal accuracy.
{history_section}
Available Sources:
{source_legend}

Context:
{context}

Question:
{query}

Give a clear, accurate, well-structured legal answer with inline citations [1], [2], etc. 
Use paragraphs and bullet points when appropriate for readability."""

    try:
        text_response = _call_groq_with_fallback(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
    except Exception as groq_err:
        print(f"Groq failed (all models exhausted): {groq_err}")
        print("Attempting Gemini fallback...")
        try:
            text_response = _call_gemini_fallback(prompt, temperature=0.2)
        except Exception as gemini_err:
            print(f"Gemini fallback also failed: {gemini_err}")
            text_response = "I am currently unable to generate a detailed text response due to high API traffic (Quota Limit). However, I have successfully retrieved the relevant official documents below for you to review."

    return text_response, sources


# CHAT LOOP 
if __name__ == "__main__":
    print("LegalEdgeAI (Groq) Ready")

    while True:
        question = input("\nAsk a legal question: ")
        answer, sources = generate_answer(question)
        print("\nAnswer:\n", answer)
        print("\nSources:", sources)
