import os
import numpy as np
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import faiss
import pickle

DATA_PATH = "data"

model = SentenceTransformer("all-MiniLM-L6-v2")

texts = []
metadata = []

def extract_text(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        content = page.extract_text()
        if content:
            text += content
    return text

def chunk_text(text, chunk_size=800, overlap=100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

print("Reading PDFs...")

for file in os.listdir(DATA_PATH):
    if file.endswith(".pdf"):
        path = os.path.join(DATA_PATH, file)
        print(f"Processing: {file}")
        
        text = extract_text(path)
        chunks = chunk_text(text)

        for chunk in chunks:
            texts.append(chunk)
            metadata.append({"source": file})

print(f"Total chunks: {len(texts)}")

print("Creating embeddings...")
embeddings = model.encode(texts)

dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

faiss.write_index(index, "vector_index.faiss")

with open("metadata.pkl", "wb") as f:
    pickle.dump({"texts": texts, "metadata": metadata}, f)

print("Ingestion completed successfully!")
