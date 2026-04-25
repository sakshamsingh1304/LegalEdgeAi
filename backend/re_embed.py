import os
import faiss
import pickle
import numpy as np
from google import genai
from pathlib import Path
from dotenv import load_dotenv
import time

# Load env vars
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

client = genai.Client(api_key=API_KEY)

ROOT_DIR = Path(__file__).resolve().parent
METADATA_PATH = ROOT_DIR / "metadata.pkl"
NEW_INDEX_PATH = ROOT_DIR / "vector_index.faiss"

# Load metadata
print("Loading metadata...")
try:
    with open(METADATA_PATH, "rb") as f:
        data = pickle.load(f)
        texts = data["texts"]
        metadata = data["metadata"]
except Exception as e:
    print(f"Error loading metadata: {e}")
    exit(1)

print(f"Total chunks to re-embed: {len(texts)}")

# text-embedding-004 dimension is 768
dimension = 768
index = faiss.IndexFlatL2(dimension)

batch_size = 100
total_batches = (len(texts) + batch_size - 1) // batch_size
all_embeddings = []

print("Starting generation. This will take a few minutes due to rate limits...")

for i in range(0, len(texts), batch_size):
    batch = texts[i:i+batch_size]
    
    success = False
    retries = 3
    while not success and retries > 0:
        try:
            # New api syntax for google.genai
            # Ensure proper handling for batch list of strings
            result = client.models.embed_content(
                model="gemini-embedding-001", 
                contents=batch,
                config={"task_type": "RETRIEVAL_DOCUMENT"}
            )
            # Result contains a list of embeddings
            embeddings = [emb.values for emb in result.embeddings]
            all_embeddings.extend(embeddings)
            success = True
            print(f"Processed batch {i//batch_size + 1}/{total_batches} ({min(i+batch_size, len(texts))}/{len(texts)})")
        except Exception as e:
            print(f"Error on batch: {e}. Retrying in 10 seconds...")
            time.sleep(10)
            retries -= 1
            
    if not success:
        print("Failed to embed batch after retries. Exiting.")
        exit(1)
        
    time.sleep(4) 

print("Adding embeddings to FAISS index...")
np_embeddings = np.array(all_embeddings).astype("float32")
index.add(np_embeddings)

print("Saving new vector index...")
faiss.write_index(index, str(NEW_INDEX_PATH))
print("Done! The vector index has been successfully migrated to Gemini embeddings.")
