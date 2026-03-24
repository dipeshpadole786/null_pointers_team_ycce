# VaakShastra Frontend

This frontend is connected to the VaakShastra backend API and supports:

- Live microphone recording
- Backend transcription (`/transcribe`)
- Session stats and transcript rendering
- Document export (`/export`)

## Prerequisites

- Node.js 18+
- Backend running from:
	- `D:\null\null_pointers_team_ycce\vaakshastra`

## Backend Start Command

Run this in a separate terminal:

```powershell
cd D:\null\null_pointers_team_ycce\vaakshastra
.\backend\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

## Frontend Setup

```powershell
cd D:\null\null_pointers_team_ycce\court-companion-ai-main
npm install
npm run dev
```

Frontend default URL: `http://127.0.0.1:5173`

## Optional API Base URL Override

Create `.env` in this frontend folder if backend is on a different host/port:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Connected API Endpoints

- `POST /transcribe?pro_mode=true`
- `GET /stats`
- `GET /session`
- `GET /export`
- `GET /`

## Usage Flow

1. Click the record button to start microphone capture.
2. Click again to stop recording.
3. Frontend uploads audio to backend for transcription.
4. Transcript and speaker roles are displayed in the main panel.
5. Open Export modal and click Download to get `.docx`.
