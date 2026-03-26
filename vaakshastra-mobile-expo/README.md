# Vaakshastra Mobile (Expo)

Mobile client for the Vaakshastra courtroom intelligence platform, built with Expo and React Native. The app connects to the existing Vaakshastra FastAPI backend for speech transcription, session analytics, legal summary generation, Q&A, and DOCX export.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Core Capabilities](#core-capabilities)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Run Commands](#run-commands)
- [Backend Integration](#backend-integration)
- [API Endpoints Used by Mobile App](#api-endpoints-used-by-mobile-app)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Overview

Vaakshastra Mobile is designed for courtroom and legal workflow scenarios where users need to:

- Upload or record audio evidence
- Generate AI transcription
- Review session timeline and statistics
- Produce structured legal summaries
- Ask contextual questions on the transcript
- Export legal draft output as DOCX

## Tech Stack

### Mobile App

- Expo SDK 54
- React 19
- React Native 0.81
- Expo AV (audio recording)
- Expo Document Picker (audio file upload)
- Expo Constants and Linking
- React Native Safe Area Context

### Backend (Connected Service)

- Python + FastAPI
- Uvicorn (ASGI server)
- python-multipart
- python-docx
- python-dotenv
- Groq (transcription/AI integration)

## Core Capabilities

- Audio file upload and transcription
- In-app microphone recording and transcription
- Session transcript timeline retrieval
- Session statistics retrieval
- Structured legal summary generation
- Q&A on the current session record
- DOCX export via backend endpoint
- Auto backend discovery for LAN-based Expo sessions

## Architecture

The mobile app runs on Expo Go and communicates with the backend over HTTP on port `8000`.

1. App attempts automatic backend discovery from Expo host metadata.
2. If discovered host is valid, app uses `http://<host>:8000`.
3. User can manually override backend URL in the app UI.
4. Mobile app calls backend endpoints for transcription, stats, summary, and export.

## Prerequisites

Install the following before running:

- Node.js 18+ (LTS recommended)
- npm 9+
- Expo Go on Android or iOS device
- Python environment with Vaakshastra backend dependencies
- Both laptop and mobile device on the same Wi-Fi network

## Getting Started

### 1) Install mobile dependencies

```powershell
cd D:\null\vaakshastra-mobile-expo
npm install
```

### 2) Start Vaakshastra backend

```powershell
cd D:\null\null_pointers_team_ycce\vaakshastra
D:\null\null_pointers_team_ycce\vaakshastra\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --app-dir D:\null\null_pointers_team_ycce\vaakshastra --host 0.0.0.0 --port 8000 --reload
```

### 3) Start Expo app

```powershell
cd D:\null\vaakshastra-mobile-expo
npx expo start --lan -c
```

Scan the QR code using Expo Go.

## Run Commands

- Start dev server: `npm run start`
- Launch Android flow: `npm run android`
- Launch iOS flow: `npm run ios`
- Launch web preview: `npm run web`

## Backend Integration

Important networking rules for physical devices:

- Do not use `localhost` or `127.0.0.1` in mobile backend URL
- Use laptop LAN IP when manual entry is needed
- Default backend port is `8000`

Manual fallback example:

`http://192.168.1.23:8000`

## API Endpoints Used by Mobile App

- `GET /` - backend health/probe used by auto-connect
- `POST /transcribe?pro_mode=true` - upload/recorded audio transcription
- `GET /session` - transcript session data
- `GET /stats` - session statistics
- `GET /summary` - structured summary generation
- `POST /qa` - question answering on session context
- `GET /export` - DOCX export endpoint

## Troubleshooting

### App cannot connect to backend

- Ensure backend is running on `0.0.0.0:8000`
- Ensure phone and laptop are on the same Wi-Fi
- Check firewall permissions for Python/Uvicorn
- Enter manual LAN URL in app if auto-connect fails

### "Network request failed"

- Verify backend URL is LAN IP, not localhost
- Confirm backend endpoint responds from browser: `http://<LAN-IP>:8000/`
- Restart Expo with cache clear: `npx expo start --lan -c`

### Recording/upload issues

- Grant microphone permissions in Expo Go
- Use supported audio files for upload (`audio/*`)

## Project Structure

```text
vaakshastra-mobile-expo/
	App.js
	package.json
	app.json
	babel.config.js
	README.md
```

---

For backend-level setup and platform details, refer to the parent Vaakshastra backend project documentation.
