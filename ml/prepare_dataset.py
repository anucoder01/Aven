"""
Dataset Preparation & Mapping Script for Aven Cognitive Distortion Classifier

Downloads / processes the Therapist Q&A Dataset (Shreevastava & Foltz, 2021),
maps the 10 source distortion categories to Aven's 15 DISTORTION_LABELS,
and generates weak heuristic-derived severity ratings (1–5).

Output: ml/data/labeled_distortions.jsonl
"""

import json
import os
import re
import argparse
import pandas as pd
from typing import Dict, List, Tuple

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

# Source dataset string to Aven distortion key mapping
CATEGORY_MAPPING = {
    "all-or-nothing thinking": "all_or_nothing",
    "splitting": "all_or_nothing",
    "overgeneralization": "overgeneralization",
    "mental filter": "mental_filtering",
    "disqualifying the positive": "disqualifying_positive",
    "jumping to conclusions": "jumping_to_conclusions",
    "magnification": "magnification",
    "catastrophizing": "catastrophizing",
    "magnification/catastrophizing": "catastrophizing",
    "emotional reasoning": "emotional_reasoning",
    "should statements": "should_statements",
    "labeling and mislabeling": "labeling",
    "labeling": "labeling",
    "personalization": "personalization",
}

# Heuristic severity calculation (Option B)
EXTREME_WORDS = {
    "always", "never", "ruined", "disaster", "worst", "impossible",
    "completely", "horrible", "terrible", "hate", "nobody", "everyone",
    "every single", "hopeless", "worthless", "failed"
}
HEDGE_WORDS = {"maybe", "kind of", "sort of", "a bit", "sometimes", "slightly"}


def compute_heuristic_severity(text: str) -> int:
    """
    Computes a weak, heuristic-derived severity score (1–5).
    NOTE: Heuristic-derived for model pre-training only, NOT clinically validated.
    """
    text_lower = text.lower()
    score = 2  # Base severity for active distortion

    # Check for extreme words
    words = re.findall(r'\b\w+\b', text_lower)
    extreme_count = sum(1 for w in words if w in EXTREME_WORDS)
    if extreme_count >= 1:
        score += 1
    if extreme_count >= 3:
        score += 1

    # Check for punctuation / capitalization intensity
    if "!" in text or text.isupper():
        score += 1

    # Check for hedging
    if any(h in text_lower for h in HEDGE_WORDS):
        score -= 1

    return max(1, min(5, score))


def process_dataset(csv_path: str, output_path: str):
    print(f"Loading dataset from: {csv_path}")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Input file not found: {csv_path}")

    df = pd.read_csv(csv_path)
    print(f"Raw dataset loaded. Total rows: {len(df)}")

    # Columns expected: 'text' (or 'question'/'patient_query') and 'distortion' (or 'label')
    text_col = None
    for candidate in ['text', 'question', 'patient_query', 'post', 'utterance', 'Question']:
        if candidate in df.columns:
            text_col = candidate
            break

    label_col = None
    for candidate in ['distortion', 'label', 'category', 'Cognitive Distortion', 'Distortion']:
        if candidate in df.columns:
            label_col = candidate
            break

    if not text_col or not label_col:
        print(f"Available columns: {list(df.columns)}")
        raise KeyError("Could not automatically identify text and distortion label columns in CSV.")

    processed_count = 0
    with open(output_path, 'w', encoding='utf-8') as out_f:
        for idx, row in df.iterrows():
            text = str(row[text_col]).strip()
            raw_label = str(row[label_col]).strip().lower()

            if not text or text.lower() == 'nan':
                continue

            labels_dict = {key: 0 for key in DISTORTION_LABELS}
            severities_dict = {key: 0 for key in DISTORTION_LABELS}

            mapped_key = CATEGORY_MAPPING.get(raw_label)
            if mapped_key and mapped_key in labels_dict:
                labels_dict[mapped_key] = 1
                severities_dict[mapped_key] = compute_heuristic_severity(text)

            # Sub-cue seeding for mind_reading & fortune_telling from jumping_to_conclusions
            if mapped_key == "jumping_to_conclusions":
                lower_text = text.lower()
                if any(phrase in lower_text for phrase in ["he thinks", "she thinks", "they think", "he knows", "she knows"]):
                    labels_dict["mind_reading"] = 1
                    severities_dict["mind_reading"] = compute_heuristic_severity(text)
                if any(phrase in lower_text for phrase in ["will never", "going to fail", "won't work", "gonna be bad"]):
                    labels_dict["fortune_telling"] = 1
                    severities_dict["fortune_telling"] = compute_heuristic_severity(text)

            example = {
                "text": text,
                "labels": labels_dict,
                "severities": severities_dict,
                "source": "shreevastava_foltz_2021",
                "original_label": raw_label
            }

            out_f.write(json.dumps(example) + "\n")
            processed_count += 1

    print(f"Processing complete! Written {processed_count} examples to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_csv", default="ml/data/therapist_qa.csv")
    parser.add_argument("--output_jsonl", default="ml/data/labeled_distortions.jsonl")
    args = parser.parse_args()
    process_dataset(args.input_csv, args.output_jsonl)
