# VaakShastra Workspace

End-to-end AI court transcription workspace with two active projects:

- Backend and ML pipeline: [vaakshastra](vaakshastra)
- Frontend application: [court-companion-ai-main](court-companion-ai-main)

## Workspace Structure

- [vaakshastra](vaakshastra): FastAPI backend, transcription pipeline, role attribution, audit hash, DOCX export
- [court-companion-ai-main](court-companion-ai-main): React UI with live microphone recording, transcript view, stats, export modal

## Integrated Flow

1. Frontend records courtroom audio from browser microphone.
2. Frontend uploads audio to backend endpoint `POST /transcribe?pro_mode=true`.
3. Backend transcribes audio and labels speaker roles and legal utterance types.
4. Frontend renders transcript, speaker blocks, and session stats.
5. Export action downloads court-ready DOCX from `GET /export`.

## Tech Stack

### Frontend ([court-companion-ai-main](court-companion-ai-main))

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI
- React Router
- Browser MediaRecorder API

### Backend and ML ([vaakshastra](vaakshastra))

- Python 3
- FastAPI
- Uvicorn
- python-dotenv
- python-docx
- Groq API (Whisper large-v3 transcription)
- Custom role attribution pipeline with heuristic plus LLM refinement
- Rule-based legal utterance classifier
- JSONL audit log plus SHA-256 session hash

## API Endpoints

- `POST /transcribe?pro_mode=true`
- `GET /stats`
- `GET /session`
- `GET /export`
- `GET /`

## How To Run

### 1) Start backend

```powershell
cd D:\null\null_pointers_team_ycce\vaakshastra
.\backend\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

### 2) Start frontend

```powershell
cd D:\null\null_pointers_team_ycce\court-companion-ai-main
npm install
npm run dev
```

### 3) Open app

- Frontend: http://127.0.0.1:5173
- Backend docs: http://127.0.0.1:8000/docs

## Environment Variables

### Backend

Set in [vaakshastra/.env](vaakshastra/.env) or [vaakshastra/backend/.env](vaakshastra/backend/.env):

```env
GROQ_API_KEY=your_key_here
```

### Frontend (optional)

Set in [court-companion-ai-main/.env](court-companion-ai-main/.env) if backend port or host differs:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Contributors

- Dipesh Padole - Web Development, Backend
- Omkar Jadhao - AI Integration, NLP
- Raunak Pantawane - ML Model,Documentation
- Chinmay Aghashe - Presentation
