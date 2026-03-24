import hashlib
import json
import os
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
LOG_FILE = BASE_DIR / "backend" / "database" / "audit_log.jsonl"


def clear_log() -> None:
    if LOG_FILE.exists():
        LOG_FILE.unlink()


def log_utterance(utterance: dict) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    entry = {
        **utterance,
        "logged_at": datetime.utcnow().isoformat(),
    }
    content_str = json.dumps(entry, sort_keys=True, ensure_ascii=False)
    entry["hash"] = hashlib.sha256(content_str.encode()).hexdigest()[:16]

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def get_session_hash() -> str:
    if not os.path.exists(LOG_FILE):
        return "NO_SESSION"
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    return hashlib.sha256(content.encode()).hexdigest()[:16]
