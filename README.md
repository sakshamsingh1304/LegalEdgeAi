# Startup Legal & Finance Assistant

An intelligent, RAG-powered platform designed to simplify Indian startup compliance, legal regulations, and financial management.

## 🚀 Features

- **AI Compliance Assistant**: A Gemini-powered chat interface grounded in verified government PDFs (MCA, GST, SEBI).
- **Compliance Calendar**: Interactive calendar that syncs manual tasks with official government document release dates.
- **Regulations Library**: Direct access to categorized and searchable legal documents for Indian founders.
- **Smart Notifications**: Real-time alerts for AI responses and upcoming deadlines.
- **Dynamic UI**: Fluid theme support (Light/Dark/Dim) and responsive glassmorphism design.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: FastAPI (Python), RAG with Gemini Flash 1.5.
- **Data**: Vector storage for PDF indexing and keyword-based retrieval.

## 📦 Setup & Installation

### Frontend
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Set environment variable: `VITE_API_URL=http://localhost:8000`
4. Run locally: `npm run dev`

### Backend
1. Navigate to `backend/`
2. Install requirements: `pip install -r requirements.txt`
3. Run with uvicorn: `python main.py`

## 🔄 Dynamic GitHub Sync

To keep your GitHub repository updated with your latest changes:

1. Create a new repository on GitHub named `LegalFinanceApp`.
2. Right-click `sync-project.ps1` in this folder and select **Run with PowerShell**.
3. The script will automatically initialize Git, stage all changes, and push them to your profile.

## 🔗 Author
Developed by [eshwar2005](https://github.com/eshwar2005).
