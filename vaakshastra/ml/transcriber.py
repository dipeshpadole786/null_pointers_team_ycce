import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR / "backend" / ".env")


def _client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it in vaakshastra/.env or vaakshastra/backend/.env"
        )
    return Groq(api_key=api_key)


def _as_dict(response: object) -> dict:
    if hasattr(response, "model_dump"):
        return response.model_dump()
    if isinstance(response, dict):
        return response
    return {}


def _extract_segments(response: object) -> list[dict]:
    response_data = _as_dict(response)
    segments = []
    raw_segments = getattr(response, "segments", None)
    if raw_segments is None:
        raw_segments = response_data.get("segments", [])

    for segment in raw_segments or []:
        text = (getattr(segment, "text", None) if not isinstance(segment, dict) else segment.get("text")) or ""
        text = text.strip()
        if not text:
            continue

        if isinstance(segment, dict):
            start = float(segment.get("start", 0.0) or 0.0)
            end = float(segment.get("end", start) or start)
        else:
            start = float(getattr(segment, "start", 0.0) or 0.0)
            end = float(getattr(segment, "end", start) or start)

        segments.append({"start": start, "end": end, "text": text})

    if not segments:
        full_text = (getattr(response, "text", None) or response_data.get("text") or "").strip()
        if full_text:
            segments.append({"start": 0.0, "end": 0.0, "text": full_text})

    return segments


def _call_transcription(client: Groq, audio_path: str, filename: str, language: str | None) -> list[dict]:
    with open(audio_path, "rb") as audio_file:
        payload = {
            "file": (filename, audio_file),
            "model": "whisper-large-v3",
            "response_format": "verbose_json",
            "timestamp_granularities": ["segment"],
        }
        if language:
            payload["language"] = language

        response = client.audio.transcriptions.create(**payload)

    return _extract_segments(response)


def transcribe_file(audio_path: str, language: str | None = None) -> list[dict]:
    client = _client()
    filename = Path(audio_path).name

    if language:
        return _call_transcription(client, audio_path, filename, language)

    for retry_language in [None, "hi", "en"]:
        segments = _call_transcription(client, audio_path, filename, retry_language)
        if segments:
            return segments

    return []


def transcribe_bytes(audio_bytes: bytes, language: str | None = None) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments = transcribe_file(tmp_path, language=language)
        return " ".join(segment["text"] for segment in segments).strip()
    finally:
        os.unlink(tmp_path)
