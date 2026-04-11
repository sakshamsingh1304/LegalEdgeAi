import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Load FAISS index
index = faiss.read_index("vector_index.faiss")

# Load metadata
with open("metadata.pkl", "rb") as f:
    data = pickle.load(f)

texts = data["texts"]
metadata = data["metadata"]

def search(query, top_k=5):
    query_embedding = model.encode([query])
    distances, indices = index.search(np.array(query_embedding), top_k)
    
    results = []
    for idx in indices[0]:
        results.append(texts[idx])
    
    return results


if __name__ == "__main__":
    while True:
        q = input("\nAsk a legal question: ")
        results = search(q)
        
        print("\nTop Results:\n")
        for r in results:
            print(r)
            print("----")
