from collections import Counter
from datetime import datetime


class SessionManager:
    def __init__(self):
        self.utterances = []
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    def set_session(self, utterances: list[dict]) -> None:
        self.utterances = list(utterances)
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    def add_utterance(self, utterance: dict) -> None:
        self.utterances.append(utterance)

    def get_all(self) -> list[dict]:
        return self.utterances

    def clear(self) -> None:
        self.utterances = []

    def stats(self) -> dict:
        if not self.utterances:
            return {"total": 0, "by_role": {}, "by_type": {}, "orders": []}

        by_role = Counter(u.get("role", "UNKNOWN") for u in self.utterances)
        by_type = Counter(u.get("type", "STATEMENT") for u in self.utterances)
        orders = [u.get("text", "") for u in self.utterances if u.get("type") == "ORDER"]

        return {
            "total": len(self.utterances),
            "by_role": dict(by_role),
            "by_type": dict(by_type),
            "orders": orders,
        }


SESSION = SessionManager()


def get_session_manager() -> SessionManager:
    return SESSION
