# Vaakshastra - an AI-powered legal transcription workspace

Vaakshastra is an AI-powered legal transcription workspace that converts courtroom/deposition audio into structured legal records with speaker-role tagging, hearing summary, Q&A on record, and DOCX export.

## Project Title and Description


### Project Title

Vaakshastra

### Description

An AI court transcription assistant that accepts legal audio input, transcribes it, identifies speaker roles, classifies legal utterances, and formats output into a structured legal document for faster and more accurate court record preparation.

## Problem Statement

Indian district courts still use longhand transcription, causing delays and errors in FIRs and hearing records. Build an AI court transcription assistant that accepts audio input of a legal deposition, transcribes it in real-time, auto-tags speaker roles (judge, advocate, witness), and formats output into a structured legal document.

## Features and Functionality

- Audio transcription from live microphone recording.
- Audio transcription from uploaded legal audio files.
- Automatic speaker-role tagging (JUDGE, ADVOCATE, WITNESS, ACCUSED, OTHER, UNKNOWN).
- Legal utterance type detection (ORDER, TESTIMONY, OBJECTION, QUESTION, PROCEDURAL, STATEMENT).
- Persistent transcript history across multiple recordings/uploads.
- Structured hearing summary generation.
- Ask On Record legal Q&A from hearing context.
- Structured legal DOCX export.
- Session statistics and hearing metadata.

## Tech Stack Used

### Web Frontend (court-companion-ai-main)

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- Browser MediaRecorder API

### Mobile Frontend (vaakshastra-mobile-expo)

- Expo SDK 54
- React 19
- React Native 0.81
- expo-av (recording)
- expo-document-picker (audio upload)
- expo-constants, expo-linking

### Backend and AI Pipeline (vaakshastra)

- Python 3
- FastAPI
- Uvicorn
- Pydantic
- python-multipart
- python-dotenv
- Groq API (transcription + LLM reasoning)
- Custom diarization and role-attribution logic
- Rule/heuristic legal utterance classifier
- python-docx (structured document generation)

## Setup/Installation Instructions

### 1) Start Backend

```powershell
cd D:\null\null_pointers_team_ycce\vaakshastra
.\backend\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend Docs: http://127.0.0.1:8000/docs

### 2) Start Web Frontend

```powershell
cd D:\null\null_pointers_team_ycce\court-companion-ai-main
npm install
npm run dev
```

Frontend URL: Vite prints the active URL (commonly http://127.0.0.1:5173 or next available port).

### 3) Start Mobile App (Expo)

```powershell
cd D:\null\null_pointers_team_ycce\vaakshastra-mobile-expo
npm install
npx expo start --lan -c
```

Scan the QR code from Expo Go.

Mobile app note:

- This mobile application is based on the web version workflow and uses the same backend APIs.
- Do not use localhost/127.0.0.1 from a physical phone.
- Use your laptop LAN IP, example: http://192.168.1.23:8000

### 4) Environment Variables

Backend `.env` (`vaakshastra/.env` or `vaakshastra/backend/.env`):

```env
GROQ_API_KEY=your_key_here
```

Frontend optional `.env` (`court-companion-ai-main/.env`):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Team Details

- Dipesh Padole - Web Development, Backend
- Omkar Jadhao - AI Integration, NLP
- Raunak Pantawane - ML Model, Documentation
- Chinmay Aghashe - Presentation

## Future Scope

- Multi-language legal transcription (Marathi, Hindi, English).
- Advanced diarization with voice embeddings and speaker profiles.
- Real-time streaming transcript with legal evidence markers.
- Secure case-wise archival and searchable legal record dashboard.
- Integration with district-level court management systems.
- Domain-specific templates for civil/criminal/family court proceedings.

## One-Line Project Feature
AI court transcription assistant that converts legal audio into structured, speaker-tagged, exportable legal documents with summaries and Q&A.

## Repository Modules

- court-companion-ai-main: Web application (React + TypeScript + Vite)
- vaakshastra: FastAPI backend and ML pipeline
- vaakshastra-mobile-expo: Expo React Native mobile client built on the same backend workflow as the web app
