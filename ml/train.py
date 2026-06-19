"""
Aven Training Script — Fine-tune RoBERTa for cognitive distortion multi-label + severity classification

Training data sources:
  - EmpatheticDialogues (Facebook Research)
  - DailyDialog
  - Reddit r/anxiety posts (scraped + curated)
  - CBT workbook examples (manually annotated)
  - GPT-4 generated + human-verified sentences (~1000)

Target: macro-F1 > 0.72 across all 8 distortion classes

Run:
  python train.py --data data/labeled_distortions.jsonl --output checkpoints/v1 --epochs 5
"""

import argparse
import json
import torch
from torch.utils.data import DataLoader, random_split
from transformers import get_linear_schedule_with_warmup
from sklearn.metrics import f1_score
import numpy as np
from tqdm import tqdm

from model import AvenClassifier, AvenClassifierLoss, DISTORTION_LABELS
from dataset import DistortionDataset


def compute_metrics(preds_labels, preds_severity, true_labels, true_severity):
    """Compute macro-F1 per class and overall."""
    # Binary labels
    pred_bin = (preds_labels > 0.45).astype(int)

    f1_per_class = {}
    for i, label in enumerate(DISTORTION_LABELS):
        f1 = f1_score(true_labels[:, i], pred_bin[:, i], zero_division=0)
        f1_per_class[label] = round(f1, 4)

    macro_f1 = float(np.mean(list(f1_per_class.values())))

    return {
        "macro_f1": round(macro_f1, 4),
        "per_class_f1": f1_per_class,
    }


def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")

    # Load dataset
    dataset = DistortionDataset(args.data)
    train_size = int(0.85 * len(dataset))
    val_size = len(dataset) - train_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=0)

    model = AvenClassifier(dropout=0.1).to(device)
    criterion = AvenClassifierLoss(label_weight=1.0, severity_weight=0.5)
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)

    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer, num_warmup_steps=int(total_steps * 0.06),
        num_training_steps=total_steps
    )

    best_f1 = 0.0
    history = []

    for epoch in range(args.epochs):
        # ─── Training ───
        model.train()
        train_losses = []

        for batch in tqdm(train_loader, desc=f"Epoch {epoch+1}/{args.epochs}"):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            label_targets = batch["labels"].to(device)
            severity_targets = batch["severities"].to(device)

            optimizer.zero_grad()
            label_logits, severity_logits = model(input_ids, attention_mask)
            loss = criterion(label_logits, severity_logits, label_targets, severity_targets)
            loss.backward()

            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            train_losses.append(loss.item())

        # ─── Validation ───
        model.eval()
        all_preds_labels, all_preds_sev, all_true_labels, all_true_sev = [], [], [], []

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                label_logits, severity_logits = model(input_ids, attention_mask)

                preds_prob = torch.sigmoid(label_logits).cpu().numpy()
                preds_sev = severity_logits.argmax(-1).cpu().numpy()

                all_preds_labels.append(preds_prob)
                all_preds_sev.append(preds_sev)
                all_true_labels.append(batch["labels"].numpy())
                all_true_sev.append(batch["severities"].numpy())

        all_preds_labels = np.concatenate(all_preds_labels)
        all_true_labels = np.concatenate(all_true_labels)
        all_preds_sev = np.concatenate(all_preds_sev)
        all_true_sev = np.concatenate(all_true_sev)

        metrics = compute_metrics(all_preds_labels, all_preds_sev, all_true_labels, all_true_sev)
        avg_train_loss = float(np.mean(train_losses))

        print(f"\n{'─'*60}")
        print(f"Epoch {epoch+1} — Loss: {avg_train_loss:.4f} | Macro-F1: {metrics['macro_f1']:.4f}")
        for label, f1 in metrics["per_class_f1"].items():
            bar = "█" * int(f1 * 20) + "░" * (20 - int(f1 * 20))
            print(f"  {label:<25} [{bar}] {f1:.4f}")

        history.append({"epoch": epoch+1, "loss": avg_train_loss, **metrics})

        # Save best checkpoint
        if metrics["macro_f1"] > best_f1:
            best_f1 = metrics["macro_f1"]
            torch.save(model.state_dict(), f"{args.output}/best_model.pt")
            print(f"  ✓ New best saved (F1={best_f1:.4f})")

        # Save last epoch always
        torch.save(model.state_dict(), f"{args.output}/last_model.pt")

    # Save training history
    with open(f"{args.output}/training_history.json", "w") as f:
        json.dump({"best_macro_f1": best_f1, "epochs": history}, f, indent=2)

    print(f"\n{'═'*60}")
    print(f"Training complete. Best macro-F1: {best_f1:.4f}")
    if best_f1 >= 0.72:
        print("✓ Target F1 > 0.72 achieved!")
    else:
        print(f"⚠ Target F1 not yet met. Consider: more data, class weighting, longer training.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/labeled_distortions.jsonl")
    parser.add_argument("--output", default="checkpoints/v1")
    parser.add_argument("--epochs", type=int, default=5)
    args = parser.parse_args()
    train(args)
