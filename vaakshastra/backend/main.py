from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from backend.routers import document, transcription

app = FastAPI(title="VaakShastra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcription.router)
app.include_router(document.router)


@app.get("/")
def health():
    return {
        "status": "VaakShastra running",
        "mode": "zero-cost prototype",
        "frontend": "http://localhost:5173",
        "backend": "http://localhost:8000",
    }
