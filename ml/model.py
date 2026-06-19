"""
RoBERTa Multi-label + Severity Cognitive Distortion Classifier

Architecture:
- Base: roberta-base (125M params)
- Multi-label head: Linear(768 → 15) + Sigmoid  (binary presence of each distortion)
- Severity head: Linear(768 → 15) × 5-class softmax (severity 1–5 per distortion)

This is the novel research contribution: simultaneous multi-label + severity scoring
for conversational (not clinical notes) CBT context.
"""

import torch
import torch.nn as nn
from transformers import RobertaModel, RobertaTokenizer
from typing import List, Dict


DISTORTION_LABELS = [
    "catastrophizing",
    "mind_reading",
    "fortune_telling",
    "all_or_nothing",
    "personalization",
    "should_statements",
    "emotional_reasoning",
    "labeling",
    "magnification",
    "minimization",
    "mental_filtering",
    "disqualifying_positive",
    "jumping_to_conclusions",
    "blame",
    "overgeneralization",
]

NUM_LABELS = len(DISTORTION_LABELS)
SEVERITY_LEVELS = 5


class AvenClassifier(nn.Module):
    """
    RoBERTa-base with dual-head for multi-label classification and severity scoring.

    Forward pass returns:
        label_logits: (batch, 15) — binary sigmoid outputs for each distortion
        severity_logits: (batch, 15, 5) — severity level logits per distortion
    """

    def __init__(self, dropout: float = 0.1):
        super().__init__()
        self.roberta = RobertaModel.from_pretrained("roberta-base")
        hidden = self.roberta.config.hidden_size  # 768

        # Multi-label binary head (sigmoid)
        self.label_head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden, 256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, NUM_LABELS),
        )

        # Severity per-distortion head (softmax over 5 levels)
        self.severity_head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden, 256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, NUM_LABELS * SEVERITY_LEVELS),
        )

    def forward(self, input_ids, attention_mask, token_type_ids=None):
        outputs = self.roberta(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )
        # Use [CLS] token representation
        cls = outputs.last_hidden_state[:, 0, :]  # (batch, 768)

        label_logits = self.label_head(cls)  # (batch, 15)
        severity_raw = self.severity_head(cls)  # (batch, 75)
        severity_logits = severity_raw.view(-1, NUM_LABELS, SEVERITY_LEVELS)  # (batch, 15, 5)

        return label_logits, severity_logits


class AvenClassifierLoss(nn.Module):
    """
    Combined loss for multi-label + severity:
    loss = w1 * BCE(label) + w2 * CrossEntropy(severity)

    BCE is applied only where label is present.
    Severity CE is masked to only active labels.
    """

    def __init__(self, label_weight: float = 1.0, severity_weight: float = 0.5):
        super().__init__()
        self.label_weight = label_weight
        self.severity_weight = severity_weight
        self.bce = nn.BCEWithLogitsLoss()
        self.ce = nn.CrossEntropyLoss(reduction="none")

    def forward(self, label_logits, severity_logits, label_targets, severity_targets):
        """
        Args:
            label_logits: (batch, 15)
            severity_logits: (batch, 15, 5)
            label_targets: (batch, 15) — binary
            severity_targets: (batch, 15) — severity 0–4 (1–5 minus 1)
        """
        # BCE loss for binary labels
        label_loss = self.bce(label_logits, label_targets.float())

        # CE loss for severity, masked to active labels only
        batch, n_labels, n_sev = severity_logits.shape
        sev_loss = self.ce(
            severity_logits.view(batch * n_labels, n_sev),
            severity_targets.view(-1),
        ).view(batch, n_labels)

        # Only penalize severity where label is active
        mask = label_targets.bool()
        if mask.sum() > 0:
            severity_loss = (sev_loss * mask.float()).sum() / mask.float().sum()
        else:
            severity_loss = torch.tensor(0.0)

        return self.label_weight * label_loss + self.severity_weight * severity_loss


class AvenInference:
    """
    Inference wrapper — loads model from checkpoint, classifies a message.
    """

    def __init__(self, checkpoint_path: str, device: str = "cpu"):
        self.device = torch.device(device)
        self.tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
        self.model = AvenClassifier()
        self.model.load_state_dict(torch.load(checkpoint_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()

    def classify(self, text: str, threshold: float = 0.45, temperature: float = 1.0) -> List[Dict]:
        """
        Returns list of detected distortions with severity.
        Each entry: { key, label, confidence, severity }
        """
        inputs = self.tokenizer(
            text, return_tensors="pt", max_length=128,
            truncation=True, padding=True
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            label_logits, severity_logits = self.model(**inputs)

        probs = torch.sigmoid(label_logits / temperature).squeeze(0)
        sev_probs = torch.softmax(severity_logits / temperature, dim=-1).squeeze(0)

        results = []
        for i, distortion in enumerate(DISTORTION_LABELS):
            confidence = probs[i].item()
            if confidence >= threshold:
                severity = int(sev_probs[i].argmax().item()) + 1  # 1–5
                results.append({
                    "key": distortion,
                    "label": distortion.replace("_", " ").title(),
                    "confidence": round(confidence, 4),
                    "severity": severity,
                })

        return sorted(results, key=lambda x: x["confidence"], reverse=True)
