import os
import sys
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from ml.pipeline import process_audio_file
from ml.audit_logger import get_session_hash
from backend.services.session_manager import get_session_manager

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    pro_mode: bool = Query(True, description="Enable advanced speaker role refinement"),
):
    suffix = os.path.splitext(audio.filename or "audio.wav")[-1] or ".wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        result = process_audio_file(tmp_path, pro_mode=pro_mode)
        session = get_session_manager()
        combined = session.get_all() + result["utterances"]
        session.set_session(combined)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        os.unlink(tmp_path)


@router.get("/stats")
def get_stats():
    session = get_session_manager()
    stats = session.stats()
    stats["session_hash"] = get_session_hash()
    return stats


@router.get("/session")
def get_session():
    session = get_session_manager()
    return {
        "utterances": session.get_all(),
        "total": len(session.get_all()),
        "session_hash": get_session_hash(),
    }
