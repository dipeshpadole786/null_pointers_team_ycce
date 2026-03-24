import os
import re
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv
from docx import Document
from groq import Groq

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR / "backend" / ".env")

_STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "of", "in", "on", "at", "for", "is", "are", "was", "were",
    "this", "that", "with", "as", "by", "be", "it", "from", "my", "your", "our", "their", "me", "we",
    "i", "you", "he", "she", "they", "have", "has", "had", "do", "did", "does", "can", "could", "would",
}


def _tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9]+", (text or "").lower())
    return [w for w in words if w not in _STOPWORDS and len(w) > 2]


def _safe_client() -> Groq | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception:
        return None


def _extract_docx_text(docx_path: str) -> str:
    if not docx_path or not Path(docx_path).exists():
        return ""
    try:
        doc = Document(docx_path)
    except Exception:
        return ""

    lines = []
    for para in doc.paragraphs:
        text = (para.text or "").strip()
        if text:
            lines.append(text)
    return "\n".join(lines)


def generate_structured_summary(utterances: list[dict]) -> dict:
    total = len(utterances)
    by_role = Counter(u.get("role", "UNKNOWN") for u in utterances)
    by_type = Counter(u.get("type", "STATEMENT") for u in utterances)

    key_orders = [
        u.get("text", "")
        for u in utterances
        if u.get("type") in {"ORDER", "PROCEDURAL"} and u.get("role") in {"JUDGE", "CLERK"}
    ][:5]

    key_evidence = [
        u.get("text", "")
        for u in utterances
        if u.get("type") == "EVIDENCE"
    ][:5]

    # Deterministic fallback summary
    fallback_summary = (
        f"Total utterances: {total}. "
        f"Primary speakers: {', '.join(f'{k}({v})' for k, v in by_role.most_common(4))}. "
        f"Dominant dialogue types: {', '.join(f'{k}({v})' for k, v in by_type.most_common(4))}."
    )

    narrative = fallback_summary
    client = _safe_client()
    if client and utterances:
        sample_lines = [
            {
                "role": u.get("role", "UNKNOWN"),
                "type": u.get("type", "STATEMENT"),
                "text": u.get("text", "")[:220],
            }
            for u in utterances[:80]
        ]

        prompt = (
            "You are a legal clerk assistant. Create a concise hearing summary for court usage. "
            "Return plain text only in 5-8 bullet points with neutral legal tone.\n\n"
            f"DATA:\n{sample_lines}"
        )
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                temperature=0.1,
                messages=[
                    {"role": "system", "content": "Return plain text only."},
                    {"role": "user", "content": prompt},
                ],
            )
            content = (completion.choices[0].message.content or "").strip()
            if content:
                narrative = content
        except Exception:
            pass

    return {
        "summary": narrative,
        "total": total,
        "by_role": dict(by_role),
        "by_type": dict(by_type),
        "key_orders": key_orders,
        "key_evidence": key_evidence,
    }


def answer_question_on_record(question: str, utterances: list[dict], docx_path: str | None = None) -> dict:
    question = (question or "").strip()
    if not question:
        return {"answer": "Please provide a question.", "citations": []}

    if not utterances:
        return {"answer": "No hearing record available. Please transcribe audio first.", "citations": []}

    q_tokens = set(_tokenize(question))

    scored: list[tuple[int, dict]] = []
    for u in utterances:
        text = u.get("text", "")
        u_tokens = set(_tokenize(text))
        score = len(q_tokens.intersection(u_tokens))
        if score > 0:
            scored.append((score, u))

    scored.sort(key=lambda item: item[0], reverse=True)
    top = [u for _, u in scored[:8]]

    citations = [
        {
            "timestamp": u.get("timestamp", ""),
            "role": u.get("role", "UNKNOWN"),
            "text": u.get("text", ""),
        }
        for u in top
    ]

    client = _safe_client()
    if client and utterances:
        try:
            # Build comprehensive context with all utterances or top matches
            if citations:
                context_text = "\n\n".join([
                    f"[{c['role']}] {c['text']}"
                    for c in citations
                ])
            else:
                # If no token match, include all utterances for full context
                context_text = "\n\n".join([
                    f"[{u.get('role', 'UNKNOWN')}] {u.get('text', '')}"
                    for u in utterances[:100]
                ])

            prompt = (
                "You are a legal court hearing QA assistant with access to a complete hearing record. "
                "Answer the user's question based ONLY on the provided hearing record. "
                "Provide specific, direct answers referencing speakers and statements when available. "
                "If the answer cannot be found in the record, state what information is available instead of refusing.\n\n"
                f"QUESTION: {question}\n\n"
                f"HEARING RECORD:\n{context_text}"
            )
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                temperature=0.2,
                messages=[
                    {
                        "role": "system",
                        "content": "You have access to a complete hearing record. Answer questions directly from it."
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            answer = (completion.choices[0].message.content or "").strip()
            if answer:
                return {"answer": answer, "citations": citations if citations else [{"text": "Full hearing record referenced"}]}
        except Exception as e:
            pass

    # Fallback: if LLM fails or unavailable, use best-effort search results
    if citations:
        stitched = " ".join(c["text"] for c in citations[:4])
        return {
            "answer": f"From the hearing record: {stitched}",
            "citations": citations,
        }

    # Final fallback: at least tell user what we have
    all_speakers = list(set([u.get("role", "UNKNOWN") for u in utterances]))
    all_text = " ".join([u.get("text", "") for u in utterances[:50]])[:500]
    
    return {
        "answer": f"Hearing record contains statements from: {', '.join(all_speakers)}. Record excerpt: {all_text}... Ask for specific details about speakers, statements, or orders.",
        "citations": [{"text": f"Total record length: {len(utterances)} statements"}],
    }
