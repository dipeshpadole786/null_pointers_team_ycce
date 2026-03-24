# VaakShastra

Zero-cost hackathon scaffold with FastAPI backend and ML processing modules.

## Hour 0-1 Prototype Target
- Upload audio file from frontend
- Get color-ready utterances: role, timestamp, type, text
- Export a legal-style DOCX from the same session

## Hour 1-7 Full Build Target
- Improve role assignment or plug in real diarization
- Add live recording on frontend
- Add stats and demo rehearsal flow

## Backend Setup
1. Open terminal in backend folder
2. Create venv: python -m venv venv
3. Activate (Windows): venv\Scripts\activate
4. Install deps: pip install -r requirements.txt
5. Set key in backend/.env
6. Run server: uvicorn main:app --reload --port 8000

## API Contract
- POST /transcribe (FormData key: audio)
- GET /stats
- GET /session
- GET /export
- GET /

## Frontend Integration Notes
- Use API base URL: http://localhost:8000
- Use role labels: JUDGE, ADVOCATE, WITNESS
- Use type labels: ORDER, TESTIMONY, OBJECTION, QUESTION, PROCEDURAL, STATEMENT

## Cost Model
- Uses Groq Whisper API key
- No paid local model hosting required
