"""Generate Mon_Songlap_AI_Training_Colab.ipynb for Google Colab."""
import json
from pathlib import Path

cells = []

def md(source: str):
    cells.append({"cell_type": "markdown", "metadata": {}, "source": source})

def code(source: str):
    cells.append(
        {
            "cell_type": "code",
            "metadata": {},
            "source": source,
            "outputs": [],
            "execution_count": None,
        }
    )

md(
    """# Mon-Songlap AI Training & Insights (Google Colab)

Train mental-health text models on **all 8 datasets** and export artifacts to improve your **Gemini** chat in Mon-Songlap.

## Datasets used
| File | ~Rows | Purpose |
|------|-------|---------|
| Anxiety.csv | 2,028 | Bangladesh student GAD-style survey |
| Depression.csv | 2,028 | PHQ-style depression survey |
| Stress.csv | 2,028 | PSS-style stress survey |
| Processed.csv | 2,028 | Combined survey scores |
| Raw Dataset.csv | 2,028 | Raw survey responses |
| mental_health.csv | 27,977 | Text + binary label |
| depression_dataset_reddit_cleaned.csv | 7,731 | Reddit text + depression |
| Combined Data.csv | 53,043 | Multi-class statements |

## How to run
1. **Runtime → Change runtime type → GPU** (optional, speeds up DistilBERT)
2. Upload your `Dataset` folder as zip, or mount Google Drive
3. **Runtime → Run all**
4. Download `mon_songlap_ai_outputs.zip`
5. Apply outputs in Laravel: `GeminiService.php` + `ChatService.php`

> Your live app uses **Gemini API**. This notebook trains **support classifiers** and exports **prompt/keyword files** for the backend."""
)

code(
    """# Install dependencies
!pip install -q pandas numpy scikit-learn matplotlib seaborn transformers datasets accelerate torch joblib tqdm"""
)

code(
    """import json
import re
import shutil
import warnings
import zipfile
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

warnings.filterwarnings("ignore")
sns.set_theme(style="whitegrid")
plt.rcParams["figure.figsize"] = (10, 5)
print("Libraries ready")"""
)

code(
    """# --- Locate Dataset folder ---
from google.colab import files

DATASET_DIR = Path("/content/Dataset")

if not DATASET_DIR.exists():
    print("Upload mon_songlap_dataset.zip (zip your Dataset folder)")
    uploaded = files.upload()
    for name in uploaded:
        p = Path("/content") / name
        if name.endswith(".zip"):
            with zipfile.ZipFile(p, "r") as z:
                z.extractall("/content")
            print("Extracted zip to /content")
        elif name.endswith(".csv"):
            DATASET_DIR.mkdir(parents=True, exist_ok=True)
            shutil.move(str(p), str(DATASET_DIR / name))

# Google Drive option (uncomment if needed):
# from google.colab import drive
# drive.mount("/content/drive")
# DATASET_DIR = Path("/content/drive/MyDrive/Mon-Songlap/Dataset")

if not DATASET_DIR.exists():
    raise FileNotFoundError("Dataset folder not found. Upload zip or set DATASET_DIR.")

csv_files = sorted(DATASET_DIR.glob("*.csv"))
print("Found CSV files:", [f.name for f in csv_files])
assert len(csv_files) == 8, f"Expected 8 CSV files, found {len(csv_files)}"""
)

code(
    """# Load ALL 8 datasets
dfs = {}

dfs["anxiety"] = pd.read_csv(DATASET_DIR / "Anxiety.csv")
dfs["depression_survey"] = pd.read_csv(DATASET_DIR / "Depression.csv")
dfs["stress"] = pd.read_csv(DATASET_DIR / "Stress.csv")
dfs["processed"] = pd.read_csv(DATASET_DIR / "Processed.csv")
dfs["raw"] = pd.read_csv(DATASET_DIR / "Raw Dataset.csv")
dfs["mental_health"] = pd.read_csv(DATASET_DIR / "mental_health.csv")
dfs["reddit"] = pd.read_csv(DATASET_DIR / "depression_dataset_reddit_cleaned.csv")
dfs["combined"] = pd.read_csv(DATASET_DIR / "Combined Data.csv")

summary = []
for name, df in dfs.items():
    summary.append({"dataset": name, "rows": len(df), "columns": len(df.columns)})
pd.DataFrame(summary)"""
)

code(
    """# EDA: survey label distributions
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
for ax, col, title in zip(
    axes,
    ["Anxiety Label", "Depression Label", "Stress Label"],
    ["Anxiety (GAD-style)", "Depression (PHQ-style)", "Stress (PSS-style)"],
):
    if col in dfs["processed"].columns:
        dfs["processed"][col].value_counts().plot(kind="bar", ax=ax, color="teal")
        ax.set_title(title)
        ax.tick_params(axis="x", rotation=45)
plt.tight_layout()
plt.show()

status_counts = dfs["combined"]["status"].value_counts()
plt.figure(figsize=(10, 4))
status_counts.plot(kind="bar", color="coral")
plt.title("Combined Data — mental health status distribution")
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.show()
print(status_counts)"""
)

code(
    """# Build unified TEXT training dataframe


def clean_text(t):
    if pd.isna(t):
        return ""
    t = str(t).lower().strip()
    t = re.sub(r"http\\S+", "", t)
    t = re.sub(r"[^a-z0-9\\s\\u0980-\\u09FF]", " ", t)
    t = re.sub(r"\\s+", " ", t)
    return t.strip()


text_frames = []

c = dfs["combined"][["statement", "status"]].copy()
c["text"] = c["statement"].map(clean_text)
c["label"] = c["status"]
c["source"] = "combined"
text_frames.append(c[["text", "label", "source"]])

m = dfs["mental_health"][["text", "label"]].copy()
m["text"] = m["text"].map(clean_text)
m["label"] = m["label"].map({0: "Normal", 1: "Depression"})
m["source"] = "mental_health"
text_frames.append(m[["text", "label", "source"]])

r = dfs["reddit"][["clean_text", "is_depression"]].copy()
r["text"] = r["clean_text"].map(clean_text)
r["label"] = r["is_depression"].map({0: "Normal", 1: "Depression"})
r["source"] = "reddit"
text_frames.append(r[["text", "label", "source"]])

text_df = pd.concat(text_frames, ignore_index=True)
text_df = text_df[text_df["text"].str.len() >= 15].drop_duplicates(subset=["text"])
print("Unified text rows:", len(text_df))
print(text_df["label"].value_counts())
text_df.head(3)"""
)

code(
    """# Survey insights (Bangladesh student data)
proc = dfs["processed"]
survey_insights = {
    "total_students": int(len(proc)),
    "anxiety_distribution": proc["Anxiety Label"].value_counts().to_dict()
    if "Anxiety Label" in proc.columns
    else {},
    "depression_distribution": proc["Depression Label"].value_counts().to_dict()
    if "Depression Label" in proc.columns
    else {},
    "stress_distribution": proc["Stress Label"].value_counts().to_dict()
    if "Stress Label" in proc.columns
    else {},
}

if "University" in proc.columns and "Anxiety Label" in proc.columns:
    severe = proc[proc["Anxiety Label"].str.contains("Severe", na=False)]
    survey_insights["top_universities_severe_anxiety"] = (
        severe["University"].value_counts().head(5).to_dict()
    )

print(json.dumps(survey_insights, indent=2, ensure_ascii=False))"""
)

code(
    """# Model 1: Multi-class classifier (Combined Data)
combined_train = dfs["combined"][["statement", "status"]].copy()
combined_train["text"] = combined_train["statement"].map(clean_text)
combined_train = combined_train[combined_train["text"].str.len() >= 10]

X_mc = combined_train["text"]
y_mc = combined_train["status"]

MIN_SAMPLES = 200
counts = y_mc.value_counts()
rare = counts[counts < MIN_SAMPLES].index
y_mc_grouped = y_mc.replace({c: "Other" for c in rare})

X_train, X_test, y_train, y_test = train_test_split(
    X_mc, y_mc_grouped, test_size=0.15, random_state=42, stratify=y_mc_grouped
)

mc_pipeline = Pipeline(
    [
        ("tfidf", TfidfVectorizer(max_features=25000, ngram_range=(1, 2), min_df=3)),
        ("clf", LogisticRegression(max_iter=300, class_weight="balanced", n_jobs=-1)),
    ]
)
mc_pipeline.fit(X_train, y_train)
y_pred = mc_pipeline.predict(X_test)

print("Multi-class accuracy:", round(accuracy_score(y_test, y_pred), 4))
print("Multi-class F1 (macro):", round(f1_score(y_test, y_pred, average="macro"), 4))
print(classification_report(y_test, y_pred))"""
)

code(
    """# Model 2: Binary depression detector
binary_df = text_df[text_df["label"].isin(["Normal", "Depression"])].copy()
Xb_train, Xb_test, yb_train, yb_test = train_test_split(
    binary_df["text"],
    binary_df["label"],
    test_size=0.15,
    random_state=42,
    stratify=binary_df["label"],
)

binary_pipeline = Pipeline(
    [
        ("tfidf", TfidfVectorizer(max_features=20000, ngram_range=(1, 2), min_df=2)),
        ("clf", LogisticRegression(max_iter=200, class_weight="balanced", n_jobs=-1)),
    ]
)
binary_pipeline.fit(Xb_train, yb_train)
yb_pred = binary_pipeline.predict(Xb_test)

print("Binary accuracy:", round(accuracy_score(yb_test, yb_pred), 4))
print(classification_report(yb_test, yb_pred))"""
)

code(
    """# Optional DistilBERT fine-tune (GPU recommended)
USE_BERT = True
bert_metrics = {}

try:
    import torch
    from datasets import Dataset as HFDataset
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )

    if not torch.cuda.is_available():
        print("No GPU — skipping BERT. TF-IDF models are still exported.")
        USE_BERT = False
except Exception as exc:
    print("Transformers issue:", exc)
    USE_BERT = False

if USE_BERT:
    MODEL_NAME = "distilbert-base-uncased"
    sample_size = min(12000, len(binary_df))
    bert_df = binary_df.sample(sample_size, random_state=42)
    label2id = {"Normal": 0, "Depression": 1}
    bert_df = bert_df.assign(label_id=bert_df["label"].map(label2id))

    tr, te = train_test_split(
        bert_df, test_size=0.15, random_state=42, stratify=bert_df["label"]
    )
    tok = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        return tok(batch["text"], truncation=True, padding="max_length", max_length=128)

    train_ds = HFDataset.from_pandas(tr[["text", "label_id"]]).rename_column(
        "label_id", "labels"
    )
    test_ds = HFDataset.from_pandas(te[["text", "label_id"]]).rename_column(
        "label_id", "labels"
    )
    train_ds = train_ds.map(tokenize, batched=True)
    test_ds = test_ds.map(tokenize, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)

    args = TrainingArguments(
        output_dir="/content/bert_out",
        per_device_train_batch_size=16,
        per_device_eval_batch_size=32,
        num_train_epochs=2,
        evaluation_strategy="epoch",
        save_strategy="no",
        logging_steps=100,
        report_to="none",
    )

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {
            "accuracy": accuracy_score(labels, preds),
            "f1": f1_score(labels, preds, average="macro"),
        }

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=test_ds,
        tokenizer=tok,
        compute_metrics=compute_metrics,
    )
    trainer.train()
    bert_metrics = trainer.evaluate()
    print("DistilBERT metrics:", bert_metrics)
    model.save_pretrained("/content/bert_depression_model")
    tok.save_pretrained("/content/bert_depression_model")
else:
    print("Skipped BERT fine-tune")"""
)

code(
    """# Keywords per category (for ChatService)
vectorizer = mc_pipeline.named_steps["tfidf"]
clf = mc_pipeline.named_steps["clf"]
feature_names = vectorizer.get_feature_names_out()
classes = clf.classes_

keywords_by_category = {}
for i, cls in enumerate(classes):
    coef = clf.coef_[i]
    top_idx = coef.argsort()[-30:][::-1]
    keywords_by_category[cls] = [feature_names[j] for j in top_idx]

suicidal_df = dfs["combined"][dfs["combined"]["status"] == "Suicidal"]
suicidal_vec = TfidfVectorizer(max_features=50, stop_words="english")
if len(suicidal_df) > 50:
    suicidal_vec.fit(suicidal_df["statement"].astype(str))
    safety_keywords = suicidal_vec.get_feature_names_out().tolist()
else:
    safety_keywords = ["suicide", "kill", "die", "worthless", "end it", "hurt myself"]

print("Sample suicidal keywords:", safety_keywords[:15])"""
)

code(
    """# Gemini fine-tuning JSONL
SYSTEM = (
    "You are Mon-Songlap, a compassionate mental wellness companion for young people in Bangladesh. "
    "Respond in simple English or Bengali. You are not a doctor. Encourage professional help when needed. "
    "For crisis: helplines 1098, Kaan Pete Roi (+8809604445555)."
)


def supportive_reply(status):
    replies = {
        "Anxiety": "I hear that you're feeling anxious. That's a heavy load. Try naming one small thing you can control right now.",
        "Depression": "Thank you for sharing this — it takes courage. What's been the hardest part lately?",
        "Stress": "Academic and life stress can pile up fast. Let's break this into one manageable step.",
        "Suicidal": "I'm really glad you said something. Your life matters. Please call 1098 or Kaan Pete Roi +8809604445555.",
        "Normal": "Thanks for checking in. How has your day been?",
        "Bipolar": "Mood swings can feel confusing. A mental health professional can support you well.",
        "Personality disorder": "Relationships and emotions can feel intense. Support exists — you're not alone.",
        "Other": "I'm here with you. Would you like to share a bit more?",
    }
    return replies.get(status, replies["Other"])


finetune_rows = []
for status in dfs["combined"]["status"].dropna().unique():
    n = min(400, int((dfs["combined"]["status"] == status).sum()))
    subset = dfs["combined"][dfs["combined"]["status"] == status].sample(n, random_state=42)
    for _, row in subset.iterrows():
        finetune_rows.append(
            {
                "systemInstruction": {"parts": [{"text": SYSTEM}]},
                "contents": [
                    {"role": "user", "parts": [{"text": str(row["statement"])[:500]}]},
                    {
                        "role": "model",
                        "parts": [{"text": supportive_reply(status)}],
                    },
                ],
            }
        )

with open("/content/gemini_finetune.jsonl", "w", encoding="utf-8") as f:
    for row in finetune_rows:
        f.write(json.dumps(row, ensure_ascii=False) + "\\n")
print("Gemini JSONL examples:", len(finetune_rows))"""
)

code(
    """# Improved system prompt for GeminiService.php
severe_anxiety_pct = 0.0
if survey_insights.get("anxiety_distribution"):
    total = sum(survey_insights["anxiety_distribution"].values())
    severe = survey_insights["anxiety_distribution"].get("Severe Anxiety", 0)
    severe_anxiety_pct = round(100 * severe / total, 1) if total else 0.0

top_themes = ", ".join(status_counts.head(5).index.tolist())

improved_prompt = f'''You are Mon-Songlap, a compassionate mental wellness companion for young people in Bangladesh (especially university students).

CONTEXT FROM TRAINING DATA:
- Student surveys show high academic stress/anxiety (~{severe_anxiety_pct}% severe anxiety in sample).
- Common user themes: {top_themes}.
- Many users express exam pressure, sleep trouble, hopelessness, and isolation.

STYLE:
- Warm, non-judgmental, culturally aware (Bangladesh).
- Respond primarily in the user's language (Bengali or English).
- 2-4 short paragraphs max. Simple words.

SAFETY (CRITICAL):
- You are NOT a doctor or therapist. Never diagnose.
- If suicidal/self-harm cues appear, respond with empathy first, then encourage immediate help:
  * National Mental Health Helpline: 1098
  * Kaan Pete Roi: +8809604445555
- Ask if they are safe right now when risk is high.

SUPPORT APPROACH:
- Validate feelings before giving advice.
- Suggest small, doable coping steps (breathing, one task, talking to trusted person).
- For academic stress: normalize struggle, suggest breaks, campus counseling if available.
- Encourage professional help for persistent depression/anxiety — without shame.

Avoid: clinical labels, long lectures, dismissing feelings, toxic positivity.'''

with open("/content/improved_system_prompt.txt", "w", encoding="utf-8") as f:
    f.write(improved_prompt)
print(improved_prompt[:900])"""
)

code(
    """# Export artifacts for Mon-Songlap Laravel backend
OUT = Path("/content/mon_songlap_ai_outputs")
OUT.mkdir(exist_ok=True)

joblib.dump(mc_pipeline, OUT / "multiclass_tfidf_model.joblib")
joblib.dump(binary_pipeline, OUT / "binary_depression_model.joblib")

with open(OUT / "safety_keywords.json", "w", encoding="utf-8") as f:
    json.dump(
        {
            "moderate": list(
                set(
                    safety_keywords
                    + [
                        "suicide",
                        "kill myself",
                        "want to die",
                        "end my life",
                        "hurt myself",
                        "better off dead",
                        "no reason to live",
                        "মরতে",
                        "আত্মহত্যা",
                        "মর",
                        "বাঁচতে চাই না",
                    ]
                )
            ),
            "keywords_by_category": keywords_by_category,
        },
        f,
        indent=2,
        ensure_ascii=False,
    )

with open(OUT / "training_insights.json", "w", encoding="utf-8") as f:
    json.dump(
        {
            "survey_insights": survey_insights,
            "combined_status_distribution": status_counts.to_dict(),
            "multiclass_accuracy": float(accuracy_score(y_test, y_pred)),
            "binary_accuracy": float(accuracy_score(yb_test, yb_pred)),
            "bert_metrics": bert_metrics,
            "datasets_used": [f.name for f in csv_files],
        },
        f,
        indent=2,
        ensure_ascii=False,
    )

shutil.copy("/content/improved_system_prompt.txt", OUT / "improved_system_prompt.txt")
shutil.copy("/content/gemini_finetune.jsonl", OUT / "gemini_finetune.jsonl")

with open(OUT / "laravel_integration_notes.txt", "w", encoding="utf-8") as f:
    f.write(
        "1. Copy improved_system_prompt.txt into backend/app/Services/GeminiService.php systemPrompt()\\n"
        "2. Copy safety_keywords.json to backend/storage/app/ and load in ChatService::detectSafetyLevel()\\n"
        "3. Use gemini_finetune.jsonl in Google AI Studio for optional Gemini tuning\\n"
    )

if Path("/content/bert_depression_model").exists():
    shutil.copytree(
        "/content/bert_depression_model",
        OUT / "bert_depression_model",
        dirs_exist_ok=True,
    )

shutil.make_archive("/content/mon_songlap_ai_outputs", "zip", OUT)
print("Exported: /content/mon_songlap_ai_outputs.zip")
files.download("/content/mon_songlap_ai_outputs.zip")"""
)

code(
    """# Test routing on sample messages
samples = [
    "I cannot sleep and my heart races before every exam",
    "I feel worthless and think everyone would be better without me",
    "Had a good day today, feeling okay",
    "So stressed about assignments I cannot cope",
]
for s in samples:
    pred = mc_pipeline.predict([clean_text(s)])[0]
    prob = mc_pipeline.predict_proba([clean_text(s)])[0].max()
    print(f"[{pred} | {prob:.2f}] {s}")"""
)

nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "colab": {"provenance": [], "gpuType": "T4"},
        "accelerator": "GPU",
    },
    "cells": cells,
}

out = Path(__file__).resolve().parents[1] / "Dataset" / "Mon_Songlap_AI_Training_Colab.ipynb"
out.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"Wrote {out}")
