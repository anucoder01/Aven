# Aven RoBERTa Classifier Implementation Log & Failure Tracker

This document records the complete implementation log, caught failures, root causes, and fixes while fine-tuning and integrating the RoBERTa Cognitive Distortion Classifier (`AvenClassifier`) into Aven.

---

## 📌 Strict Project Rule
**Never overclaim, always verify before stating something as fact.**  
Every issue below was identified by inspecting full empirical logs rather than assuming code worked because it ran without red syntax errors.

---

## 🚨 Log of Failures & Fixes

### Fail 1: Silent Training on Fake Auto-Generated Data
- **What Happened**: The first training run completed successfully without throwing any errors, but it trained on fake placeholder data.
- **Root Cause**: The dataset CSV path was not found in the Colab session. The notebook had a fallback script that silently generated 340 fake dummy text rows (`"Sample text 0 demonstrating..."`) and trained on them.
- **How it was Caught**: Caught by reading the text output in Step 3 (*"File synthetic_distortion_dataset.csv not found locally..."*) rather than just checking if the cell turned green.
- **Fix**: Uploaded the real `synthetic_distortion_dataset.csv` directly into the Colab environment before running Step 3.

---

### Fail 2: Zero Evaluation Metrics (0.0000 Precision, Recall, & F1)
- **What Happened**: The model loaded the real CSV file, but after training, every single category returned `0.0000` for Precision, Recall, and F1.
- **Root Cause**: Label string mismatch between the CSV file and the model's target labels.
  - CSV contained title case with spaces: `"All or Nothing"`, `"Mind Reading"`, `"Jumping to Conclusions"`.
  - Model target keys in code were lowercase with underscores: `"all_or_nothing"`, `"mind_reading"`, `"jumping_to_conclusions"`.
  - Because no string matched, `0` positive labels were registered during dataset parsing.
- **Fix**: Added a `normalize_label()` function in the dataset parser to convert all label strings to lowercase and replace spaces/hyphens with underscores. Verified that `300 positive labels` were correctly parsed across 289 train and 51 validation rows.

---

### Fail 3: Model Predicts "ALL Distortions Active" Everywhere (Macro-F1 = 0.1041)
- **What Happened**: After fixing the label names, the model ran for 5 epochs and stopped with:
  - **Recall = 1.0000** for almost every category.
  - **Precision = 0.0588** ($\approx 1/17$) for almost every category.
  - **Macro-F1 = 0.1041**.
- **Root Cause**: Excessive positive class weighting (`pos_weight = 10.0` in `BCEWithLogitsLoss`).
  - Out of 15 distortion categories per sentence, only 1 is typically positive (93% of the target matrix is `0`).
  - The script automatically set `pos_weight = 10.0`, telling PyTorch that missing a positive label was 10x more costly than making a false positive.
  - To minimize loss, the model learned the shortcut of outputting high probabilities for **all 15 distortions on every sentence**.
  - Since it predicted `1` for all 15 categories on every sample, Recall was 100% (it never missed a label), but Precision crashed to 5.88% ($1 \text{ correct} / 15 \text{ or } 17 \text{ predicted}$).
- **Fix**:
  1. Change `pos_weight` in `Step 6` to `None` (or a mild `1.5`) so the model isn't forced to guess positive on everything.
  2. Unfreeze RoBERTa layers 6–11 in `Step 5` (instead of freezing up to layer 8) so the model has enough capacity to differentiate distortion patterns.
  3. Set evaluation threshold to `0.50` (instead of `0.45`).

### Fail 4: Sigmoid Probabilities Under-Shooting High Threshold (Macro-F1 = 0.0370)
- **What Happened**: Setting `pos_weight = None` and evaluating at `threshold = 0.50` caused Macro-F1 to drop to `0.0370`, with 10 out of 15 categories returning `0.0000` Precision/Recall/F1.
- **Root Cause**:
  1. **Step Under-Fitting**: With a low learning rate `2e-5` on only 289 training examples (19 steps/epoch × 5 epochs = only 95 gradient steps total), unweighted sigmoid output probabilities for true positive targets hovered around `0.25` to `0.40` and never crossed the high `0.50` threshold.
  2. **Zero Positive Predictions**: Because `probs < 0.50` for all 51 validation samples across 10 categories, the model predicted `0` everywhere for those categories, yielding `0.0000` recall/precision.
  3. **Extreme Unweighted Class Imbalance**: With 1 positive vs 14 negatives per sample, removing `pos_weight` entirely made the network optimize by staying near 0 logits.
- **The Correct Balanced Fix**:
  1. Set a moderate class weight `pos_weight = 4.0` in `Step 6` (instead of 10.0 or None):
     `pos_weight_tensor = torch.tensor([4.0] * NUM_LABELS, dtype=torch.float).to(device)`
  2. Use a slightly higher learning rate for top layers/heads: `lr = 1e-4` in `Step 6` (or train for 12 epochs without early stopping at epoch 5).
  3. Set evaluation threshold to `0.35` in `Step 7 & 8`:
     `probs >= 0.35`

---

## 🎯 Current Status & Next Execution Steps

1. **Colab Action**: In `Aven_RoBERTa_Training.ipynb`:
   - **Step 6**: Set `pos_weight_tensor = torch.tensor([4.0] * NUM_LABELS).to(device)`, `lr = 1e-4`, `max_epochs = 12`.
   - **Step 7 & 8**: Set `probs >= 0.35`.
2. **Re-run**: Execute Steps 5 through 9 in Colab.
3. **Verify Metrics**: Confirm Step 8 displays balanced non-zero Precision and Recall values across all categories.
4. **Deploy**: Download `best_model.pt` and place it in `backend/ml/checkpoints/v1/best_model.pt`.
5. **Verify Endpoint**: Start backend (`uvicorn main:app --reload`) and test POST `/classify/` to ensure `model_used` returns `"roberta-base-finetuned"`.

