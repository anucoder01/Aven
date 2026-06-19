"""
FastAPI Router — /classify
Runs the RoBERTa distortion classifier on individual messages.
Falls back to rule-based mock if model checkpoint not loaded.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os

router = APIRouter()

# Lazy model loading
_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        checkpoint = os.environ.get("MODEL_CHECKPOINT", "./ml/checkpoints/v1/best_model.pt")
        if os.path.exists(checkpoint):
            from ml.model import AvenInference
            _classifier = AvenInference(checkpoint)
        else:
            _classifier = "mock"
    return _classifier


class ClassifyRequest(BaseModel):
    text: str
    session_id: Optional[str] = None
    threshold: float = 0.45
    temperature: float = 1.0


class DistortionResult(BaseModel):
    key: str
    label: str
    confidence: float
    severity: int  # 1–5


class ClassifyResponse(BaseModel):
    text: str
    distortions: List[DistortionResult]
    avoidance_signals: List[dict]
    model_used: str


def mock_classify(text: str) -> List[dict]:
    """Rule-based fallback classifier for development."""
    distortions = []
    lower = text.lower()
    rules = [
        ("catastrophizing", ["ruin", "disaster", "worst", "everything falls", "all over"]),
        ("mind_reading", ["he thinks", "she thinks", "they think", "he knows", "she knows"]),
        ("fortune_telling", ["will never", "going to fail", "won't work", "no point", "gonna be bad"]),
        ("all_or_nothing", ["always", "never", "everyone", "nobody", "every time"]),
        ("personalization", ["my fault", "because of me", "i caused", "blame myself"]),
        ("should_statements", ["should", "must", "have to", "supposed to", "ought to"]),
        ("emotional_reasoning", ["feel like it means", "i feel so it is", "my anxiety means"]),
        ("labeling", ["i'm a failure", "i'm an idiot", "i'm useless", "such a loser", "i am a", "such a"]),
        ("magnification", ["way too big", "huge deal", "so much worse"]),
        ("minimization", ["not a big deal", "doesn't matter that i", "just a small"]),
        ("mental_filtering", ["all i can see is", "only focused on", "can't stop thinking about the one bad"]),
        ("disqualifying_positive", ["only because", "was just luck", "anyone could", "doesn't count"]),
        ("jumping_to_conclusions", ["obviously means", "therefore i am", "it must mean"]),
        ("blame", ["your fault", "their fault", "you made me", "they made me"]),
        ("overgeneralization", ["this always happens", "typical", "every single time"]),
    ]
    import random
    for key, keywords in rules:
        if any(kw in lower for kw in keywords):
            distortions.append({
                "key": key,
                "label": key.replace("_", " ").title(),
                "confidence": round(0.7 + random.random() * 0.25, 4),
                "severity": random.randint(2, 5),
            })
    return distortions


@router.post("/", response_model=ClassifyResponse)
async def classify_message(req: ClassifyRequest):
    classifier = get_classifier()
    model_used = "roberta-base-finetuned"

    if classifier == "mock":
        distortions = mock_classify(req.text)
        model_used = "rule-based-mock"
    else:
        distortions = classifier.classify(req.text, threshold=req.threshold, temperature=req.temperature)

    # Avoidance detection
    avoidance_signals = []
    lower = req.text.lower()
    if any(p in lower for p in ["i don't know", "maybe", "i'm not sure"]):
        avoidance_signals.append({"type": "deflection", "phrase": req.text[:50]})
    if req.text.lower().count("sorry") >= 2:
        avoidance_signals.append({"type": "over_apologizing", "phrase": req.text[:50]})
    if len(req.text.strip()) < 12:
        avoidance_signals.append({"type": "minimal_response", "phrase": req.text})

    return ClassifyResponse(
        text=req.text,
        distortions=distortions,
        avoidance_signals=avoidance_signals,
        model_used=model_used,
    )
