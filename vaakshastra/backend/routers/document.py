from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ml.audit_logger import get_session_hash
from backend.services.document_generator import generate_docx
from backend.services.session_manager import get_session_manager

router = APIRouter()


@router.get("/export")
def export_document():
    session = get_session_manager()
    utterances = session.get_all()

    if not utterances:
        raise HTTPException(status_code=400, detail="No session data. Transcribe audio first.")

    file_path = generate_docx(utterances, session_hash=get_session_hash())
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="VaakShastra_Record.docx",
    )
