import json
import os
import re
from datetime import datetime

from dotenv import load_dotenv
from groq import Groq

from .classifier import classify

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, "backend", ".env"))

ROLES = ["JUDGE", "ADVOCATE", "WITNESS", "CLERK", "ACCUSED", "OTHER", "UNKNOWN"]
TYPES = ["ORDER", "TESTIMONY", "OBJECTION", "QUESTION", "PROCEDURAL", "EVIDENCE", "STATEMENT"]


def _seconds_to_clock(seconds: float) -> str:
    seconds = max(0, int(seconds))
    return f"{seconds // 3600:02d}:{(seconds % 3600) // 60:02d}:{seconds % 60:02d}"


def _split_utterances(text: str) -> list[str]:
    text = " ".join((text or "").split())
    if not text:
        return []

    # Keep complete spoken lines by default. Splitting is only applied to very long blocks.
    if len(text) <= 260:
        return [text]

    # Sentence-aware split for large blocks. Avoid common legal abbreviations.
    sentence_parts = re.split(
        r"(?<!\bMr)(?<!\bMrs)(?<!\bMs)(?<!\bDr)(?<!\bAdv)(?<=[.!?])\s+",
        text,
    )

    chunks: list[str] = []
    for part in sentence_parts:
        part = part.strip(" ,")
        if not part:
            continue

        # If sentence is still too long, split at softer boundaries.
        if len(part) > 320:
            sub_parts = re.split(r";\s+|,\s+(?=(?:that|which|where|and|but)\b)", part)
            for sub in sub_parts:
                sub = sub.strip(" ,")
                if sub:
                    chunks.append(sub)
            continue

        chunks.append(part)

    if not chunks:
        return [text]

    # Merge tiny fragments back into the previous sentence to prevent over-fragmentation.
    merged: list[str] = []
    for chunk in chunks:
        if merged and len(chunk) < 45:
            merged[-1] = f"{merged[-1]} {chunk}".strip()
        else:
            merged.append(chunk)

    return merged


def _expand_segments(segments: list[dict]) -> list[dict]:
    expanded = []
    for segment in segments:
        text = (segment.get("text") or "").strip()
        if not text:
            continue

        start = float(segment.get("start", 0.0) or 0.0)
        end = float(segment.get("end", start) or start)
        pieces = _split_utterances(text)
        if not pieces:
            continue

        duration = max(0.0, end - start)
        step = duration / max(1, len(pieces))
        for idx, piece in enumerate(pieces):
            piece_start = start + (idx * step)
            expanded.append({
                "text": piece,
                "start": piece_start,
                "end": piece_start + step,
            })

    return expanded


def _score_roles(
    text: str,
    utterance_type: str,
    previous_role: str | None,
    previous_type: str | None,
) -> dict[str, float]:
    lower = f" {text.lower()} "
    scores: dict[str, float] = {
        "JUDGE": 0.1,
        "ADVOCATE": 0.1,
        "WITNESS": 0.1,
        "CLERK": 0.1,
        "ACCUSED": 0.1,
        "OTHER": 0.08,
        "UNKNOWN": 0.05,
    }

    # Strong lexical courtroom cues
    if re.search(r"\b(order|adjourned|listed|pronounced|granted|rejected)\b", lower):
        scores["JUDGE"] += 1.1
    if re.search(r"\b(court|bench|recorded|let the record show)\b", lower):
        scores["JUDGE"] += 0.6

    if re.search(r"\b(your honour|your honor|my lord|learned counsel)\b", lower):
        scores["ADVOCATE"] += 1.0
    if re.search(r"\b(objection|submission|permission|cross.?examination|defence|defense)\b", lower):
        scores["ADVOCATE"] += 0.8

    if re.search(r"\b(i saw|i was|i heard|i did not|i don't|maine|mujhe|main|mene|mujh)\b", lower):
        scores["WITNESS"] += 0.9
    if re.search(r"\b(witness|deponent|statement)\b", lower):
        scores["WITNESS"] += 0.5

    if re.search(r"\b(i deny|i admit|i was not there|i am innocent|mujhe fasaya|maine nahi kiya|galat ilzam|accused)\b", lower):
        scores["ACCUSED"] += 1.0
    if re.search(r"\b(culprit|crime|weapon|motive|confession)\b", lower):
        scores["ACCUSED"] += 0.35

    if re.search(r"\b(public|spectator|police constable|interpreter|unknown person|bystander)\b", lower):
        scores["OTHER"] += 0.9

    # Clerk/court staff markers
    if re.search(r"\b(clerk|court master|reader|nazir|stenographer)\b", lower):
        scores["CLERK"] += 1.0
    if re.search(r"\b(witness\s+is\s+sworn|sworn in|exhibit\s+marked|mark\s+exhibit|call\s+the\s+matter)\b", lower):
        scores["CLERK"] += 0.8

    # Type priors from classifier
    if utterance_type in {"ORDER", "PROCEDURAL"}:
        scores["JUDGE"] += 0.65
    if utterance_type in {"QUESTION", "OBJECTION"}:
        scores["ADVOCATE"] += 0.65
    if utterance_type == "TESTIMONY":
        scores["WITNESS"] += 0.7
        scores["ACCUSED"] += 0.25
    if utterance_type == "EVIDENCE":
        scores["ADVOCATE"] += 0.35
        scores["CLERK"] += 0.2

    # Dialog flow model (turn-taking priors)
    if previous_role == "JUDGE":
        scores["JUDGE"] -= 0.2
        scores["ADVOCATE"] += 0.2
        scores["WITNESS"] += 0.1
        scores["CLERK"] += 0.1
        scores["ACCUSED"] += 0.05
        scores["OTHER"] += 0.05
    elif previous_role == "ADVOCATE":
        scores["ADVOCATE"] -= 0.1
        scores["WITNESS"] += 0.2
        scores["JUDGE"] += 0.1
        scores["CLERK"] += 0.05
        scores["ACCUSED"] += 0.1
    elif previous_role == "WITNESS":
        scores["WITNESS"] -= 0.15
        scores["ADVOCATE"] += 0.25
        scores["JUDGE"] += 0.05
        scores["CLERK"] += 0.05
        scores["ACCUSED"] += 0.1
    elif previous_role == "CLERK":
        scores["CLERK"] -= 0.1
        scores["JUDGE"] += 0.15
        scores["ADVOCATE"] += 0.1
    elif previous_role == "ACCUSED":
        scores["ACCUSED"] -= 0.1
        scores["ADVOCATE"] += 0.15
        scores["JUDGE"] += 0.1
    elif previous_role == "OTHER":
        scores["OTHER"] -= 0.05
        scores["ADVOCATE"] += 0.1
        scores["JUDGE"] += 0.1

    # Question -> likely answer transition boost
    if previous_type == "QUESTION" and utterance_type in {"STATEMENT", "TESTIMONY"}:
        scores["WITNESS"] += 0.35

    # Long imperative/legal order tends to judge
    if len(text) > 80 and utterance_type in {"ORDER", "PROCEDURAL"}:
        scores["JUDGE"] += 0.15

    # Prevent negative drift
    for key in list(scores.keys()):
        scores[key] = max(scores[key], 0.0)

    return scores


def _heuristic_role(
    text: str,
    utterance_type: str,
    previous_role: str | None,
    previous_type: str | None,
) -> tuple[str, float]:
    scores = _score_roles(text, utterance_type, previous_role, previous_type)
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    best_role, best_score = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0

    # Confidence based on margin and absolute score
    margin = max(0.0, best_score - second_score)
    confidence = min(0.95, 0.35 + (margin * 0.45) + (min(best_score, 1.6) * 0.15))

    if best_score < 0.25:
        return "UNKNOWN", 0.25

    return best_role, round(confidence, 3)


def _smooth_role_sequence(utterances: list[dict]) -> list[dict]:
    if len(utterances) < 3:
        return utterances

    adjusted = [dict(u) for u in utterances]
    for idx in range(1, len(adjusted) - 1):
        prev_role = adjusted[idx - 1]["role"]
        cur_role = adjusted[idx]["role"]
        next_role = adjusted[idx + 1]["role"]
        cur_type = adjusted[idx]["type"]

        # If one low-confidence odd role sits between two equal roles, snap to neighbors.
        if prev_role == next_role and cur_role != prev_role and adjusted[idx].get("speaker_confidence", 0) < 0.55:
            adjusted[idx]["role"] = prev_role
            adjusted[idx]["speaker_confidence"] = max(0.55, float(adjusted[idx].get("speaker_confidence", 0.4)))

        # Question/objection utterances are rarely witness lines unless confidence is high.
        if cur_type in {"QUESTION", "OBJECTION"} and cur_role in {"WITNESS", "CLERK", "ACCUSED", "OTHER"} and adjusted[idx].get("speaker_confidence", 0) < 0.75:
            adjusted[idx]["role"] = "ADVOCATE"
            adjusted[idx]["speaker_confidence"] = 0.62

        # Short procedural lines are often clerk-operated callouts.
        if cur_type == "PROCEDURAL" and len((adjusted[idx].get("text") or "").split()) <= 10:
            if adjusted[idx].get("speaker_confidence", 0) < 0.65 and cur_role not in {"JUDGE", "CLERK"}:
                adjusted[idx]["role"] = "CLERK"
                adjusted[idx]["speaker_confidence"] = 0.61

    return adjusted


def _extract_json_array(content: str) -> list[dict] | None:
    if not content:
        return None

    start = content.find("[")
    end = content.rfind("]")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        parsed = json.loads(content[start : end + 1])
    except json.JSONDecodeError:
        return None

    if isinstance(parsed, list):
        return parsed
    return None


def _llm_refine_labels(utterances: list[dict]) -> list[dict]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not utterances:
        return utterances

    lines = []
    for idx, utterance in enumerate(utterances):
        lines.append(
            {
                "index": idx,
                "text": utterance["text"],
                "type": utterance["type"],
                "hint_role": utterance["role"],
            }
        )

    prompt = (
        "You are assigning courtroom speaker roles and legal utterance types.\n"
        "Valid roles: JUDGE, ADVOCATE, WITNESS, CLERK, ACCUSED, OTHER, UNKNOWN.\n"
        "Valid types: ORDER, TESTIMONY, OBJECTION, QUESTION, PROCEDURAL, EVIDENCE, STATEMENT.\n"
        "Input is chronological utterances from one hearing.\n"
        "Return ONLY a JSON array where each item is:\n"
        "{\"index\": <int>, \"role\": <ROLE>, \"type\": <TYPE>, \"confidence\": <0-1 number>}\n"
        "Keep the same number of items and same indexes.\n\n"
        f"INPUT:\n{json.dumps(lines, ensure_ascii=False)}"
    )

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.1,
            messages=[
                {"role": "system", "content": "Return strict JSON only."},
                {"role": "user", "content": prompt},
            ],
        )
        content = completion.choices[0].message.content or ""
        parsed = _extract_json_array(content)
        if not parsed:
            return utterances

        by_index = {item.get("index"): item for item in parsed if isinstance(item, dict)}
        refined = []
        for idx, utterance in enumerate(utterances):
            item = by_index.get(idx, {})
            role = str(item.get("role", utterance["role"])).upper()
            if role not in ROLES:
                role = utterance["role"]

            utterance_type = str(item.get("type", utterance["type"])).upper()
            if utterance_type not in TYPES:
                utterance_type = utterance["type"]

            try:
                confidence = float(item.get("confidence", utterance.get("speaker_confidence", 0.4)))
            except (TypeError, ValueError):
                confidence = float(utterance.get("speaker_confidence", 0.4))

            utterance_copy = dict(utterance)
            utterance_copy["role"] = role
            utterance_copy["type"] = utterance_type
            utterance_copy["speaker_confidence"] = max(0.0, min(1.0, confidence))
            refined.append(utterance_copy)

        return refined
    except Exception:
        return utterances


def assign_roles_from_segments(segments: list[dict], use_llm_refiner: bool = True) -> list[dict]:
    utterances = []
    previous_role = None
    previous_type = None

    for segment in _expand_segments(segments):
        text = (segment.get("text") or "").strip()
        if not text:
            continue

        utterance_type = classify(text)
        role, confidence = _heuristic_role(text, utterance_type, previous_role, previous_type)
        previous_role = role
        previous_type = utterance_type

        utterances.append(
            {
                "role": role,
                "text": text,
                "timestamp": _seconds_to_clock(float(segment.get("start", 0.0))),
                "type": utterance_type,
                "speaker_confidence": confidence,
            }
        )

    utterances = _smooth_role_sequence(utterances)

    if use_llm_refiner:
        utterances = _llm_refine_labels(utterances)
        utterances = _smooth_role_sequence(utterances)

    if not utterances:
        utterances.append(
            {
                "role": "UNKNOWN",
                "text": "No speech could be transcribed from this audio.",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "type": "STATEMENT",
                "speaker_confidence": 0.0,
            }
        )

    return utterances
