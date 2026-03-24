# null_pointers_team_ycce

# CourtScribe ⚖️

AI-powered court transcription assistant for Indian legal proceedings.

## Overview
CourtScribe helps digitize court proceedings by converting audio into structured legal documents. 
It performs speech-to-text transcription, detects speaker roles, and generates formatted court records automatically.

## Features

- 🎙️ Audio-to-text transcription (Whisper)
- 🏷️ Speaker role tagging (Judge, Advocate, Witness)
- 📄 Structured legal document generation
- 🧠 Automatic summary generation
- 🌐 Hinglish (Hindi-English) support
- 📥 Export as text file

## Tech Stack

- Backend: FastAPI (Python)
- AI Model: Faster-Whisper
- NLP: Rule-based tagging
- Frontend: HTML, JavaScript
## Folder Structure

## Architecture

Audio Input → Whisper → Text  
→ Speaker Tagging → Formatter → Summary  
→ Output (Legal Document)

## Setup Instructions

1. Clone the repo:
   git clone https://github.com/dipeshpadole786/null_pointers_team_ycce.git

2. Navigate:
   cd null_pointers_team_ycce

3. Install dependencies:
   pip install -r requirements.txt

4. Run server:
   uvicorn backend.main:app --reload

5. Open frontend:
   Open index.html in browser

## Usage

1. Upload an audio file (.wav/.mp3)
2. Click "Transcribe"
3. View:
   - Raw transcript
   - Speaker-tagged output
   - Structured legal document
   - Summary
## Sample Output

[Judge]: Order! The court is now in session.  
[Advocate]: My Lord, I would like to present evidence.  
[Witness]: I saw the incident clearly.  

Summary:
- Court session started
- Evidence presented
- Witness testimony recorded

## Limitations

- Speaker detection is rule-based (not ML)
- Accuracy depends on audio quality
- Real-time transcription not implemented

## Future Work

- Real-time transcription
- Advanced speaker diarization
- PDF export
- Multi-language expansion

## Contributors

- Dipesh Padole - Web Development, Backend
- Omkar Jadhao - AI Integration, NLP
- Raunak Pantawane - ML Model,Documentation
- Chinmay Aghashe - Presentation
