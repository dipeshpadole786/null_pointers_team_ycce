from datetime import datetime

from .audit_logger import clear_log, get_session_hash, log_utterance
from .diarizer import assign_roles_from_segments
from .transcriber import transcribe_bytes, transcribe_file


def process_audio_file(audio_path: str, pro_mode: bool = True) -> dict:
    segments = transcribe_file(audio_path)
    utterances = assign_roles_from_segments(segments, use_llm_refiner=pro_mode)

    clear_log()
    for utterance in utterances:
        log_utterance(utterance)

    avg_conf = 0.0
    if utterances:
        avg_conf = sum(float(u.get("speaker_confidence", 0.0)) for u in utterances) / len(utterances)

    return {
        "utterances": utterances,
        "total": len(utterances),
        "session_hash": get_session_hash(),
        "diagnostics": {
            "pro_mode": pro_mode,
            "segments_detected": len(segments),
            "average_speaker_confidence": round(avg_conf, 3),
        },
    }


def process_audio_chunk(audio_bytes: bytes, speaker_id: str = "SPEAKER_00") -> dict | None:
    del speaker_id
    text = transcribe_bytes(audio_bytes)
    if not text:
        return None

    utterance = {
        "role": "UNKNOWN",
        "text": text,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "type": "STATEMENT",
    }
    log_utterance(utterance)
    return utterance
