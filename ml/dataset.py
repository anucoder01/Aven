import json
import torch
from torch.utils.data import Dataset
from transformers import RobertaTokenizer
from model import DISTORTION_LABELS, NUM_LABELS

class DistortionDataset(Dataset):
    def __init__(self, jsonl_path, max_length=128):
        self.data = []
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    self.data.append(json.loads(line))
        
        self.tokenizer = RobertaTokenizer.from_pretrained('roberta-base')
        self.max_length = max_length

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        text = item['text']
        
        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        # Parse labels and severities based on the canonical DISTORTION_LABELS list
        labels_tensor = torch.zeros(NUM_LABELS, dtype=torch.float)
        severities_tensor = torch.zeros(NUM_LABELS, dtype=torch.long)
        
        raw_labels = item.get('labels', {})
        raw_sevs = item.get('severities', {})
        
        for i, label_key in enumerate(DISTORTION_LABELS):
            if raw_labels.get(label_key, 0) == 1:
                labels_tensor[i] = 1.0
                # Severities in data are 1-5, model expects 0-4
                sev = raw_sevs.get(label_key, 1)
                severities_tensor[i] = max(0, min(4, sev - 1))
            else:
                labels_tensor[i] = 0.0
                severities_tensor[i] = 0

        return {
            'input_ids': encoding['input_ids'].squeeze(0),
            'attention_mask': encoding['attention_mask'].squeeze(0),
            'labels': labels_tensor,
            'severities': severities_tensor,
            'text': text
        }
