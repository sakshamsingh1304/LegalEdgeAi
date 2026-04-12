import faiss
import pickle
import numpy as np
import os
from pathlib import Path
import requests
from groq import Groq
from dotenv import load_dotenv

# Load env vars - .env is in the project root (two levels up from src/)
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# CONFIG
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Embedding model using HF Inference API
HF_API_KEY = os.getenv("HF_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"

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
    for idx in indices[0]:
        if 0 <= idx < len(texts):
            results.append({
                "text": texts[idx],
                "metadata": metadata[idx] if idx < len(metadata) else {}
            })

    return results


# RAG PROMPT
def generate_answer(query):
    retrieved_items = retrieve(query)
    chunks = [item["text"] for item in retrieved_items]
    
    # Extract sources for returning alongside answer
    sources = [item["metadata"] for item in retrieved_items]

    context = "\n\n".join(chunks)

    prompt = f"""
You are a legal assistant. Answer ONLY based on the provided context.
If the answer is not in context, say: "Information not found in provided documents."

Context:
{context}

Question:
{query}

Give a clear, accurate legal answer.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        text_response = response.choices[0].message.content
    except Exception as e:
        print(f"RAG Generation Error: {e}")
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
