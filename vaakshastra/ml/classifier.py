import re

PATTERNS = {
    "ORDER": [
        r"order", r"adjourned", r"next date", r"bail",
        r"stay", r"dismissed", r"tareekh", r"order sheet",
        r"next hearing", r"matter adjourned", r"hereby"
    ],
    "TESTIMONY": [
        r"i saw", r"i was", r"maine dekha", r"mujhe pata",
        r"i heard", r"maine suna", r"i did not", r"maine nahi",
        r"deponent", r"i am", r"main hun"
    ],
    "OBJECTION": [
        r"objection", r"not relevant", r"leading", r"hearsay",
        r"aapatii", r"i object", r"irrelevant", r"inadmissible"
    ],
    "QUESTION": [
        r"\?", r"kya aap", r"where were you", r"explain",
        r"can you tell", r"did you", r"were you",
        r"batao", r"aap ne kya", r"what did you"
    ],
    "PROCEDURAL": [
        r"vakalatnama", r"exhibit", r"case number",
        r"oath", r"swear", r"on record", r"filed", r"marked"
    ],
    "EVIDENCE": [
        r"evidence", r"exhibit\s+[a-z0-9]+", r"cctv", r"forensic",
        r"medical report", r"fingerprint", r"seizure", r"recovery"
    ]
}


def classify(text: str) -> str:
    text_lower = text.lower()
    for category, patterns in PATTERNS.items():
        if any(re.search(pattern, text_lower) for pattern in patterns):
            return category
    return "STATEMENT"


def format_for_legal_doc(role: str, text: str, timestamp: str) -> dict:
    return {
        "role": role,
        "text": text,
        "timestamp": timestamp,
        "type": classify(text),
    }
