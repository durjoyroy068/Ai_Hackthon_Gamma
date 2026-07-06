"""Generate Laravel AI config from Dataset/ for integration."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "Dataset"
OUT = ROOT / "backend" / "storage" / "app" / "ai"

BASE_RISK_KEYWORDS = [
    "suicide",
    "kill myself",
    "want to die",
    "end my life",
    "hurt myself",
    "better off dead",
    "no reason to live",
    "self harm",
    "kill",
    "die",
    "মরতে",
    "আত্মহত্যা",
    "মর",
    "বাঁচতে চাই না",
]


def clean_text(t) -> str:
    if pd.isna(t):
        return ""
    t = str(t).lower().strip()
    t = re.sub(r"http\S+", "", t)
    t = re.sub(r"[^a-z0-9\s\u0980-\u09FF]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def extract_keywords(pipe: Pipeline) -> dict[str, list[str]]:
    vec = pipe.named_steps["tfidf"]
    clf = pipe.named_steps["clf"]
    feats = vec.get_feature_names_out()
    keywords: dict[str, list[str]] = {}

    for i, cls in enumerate(clf.classes_):
        row_idx = i if i < clf.coef_.shape[0] else 0
        coef = clf.coef_[row_idx]
        top_idx = coef.argsort()[-30:][::-1]
        keywords[str(cls)] = [feats[j] for j in top_idx if len(feats[j]) > 2]

    return keywords


def train_classifier(X: pd.Series, y: pd.Series, name: str, min_class: int = 30) -> tuple[dict, dict]:
    vc = y.value_counts()
    keep = vc[vc >= min_class].index
    mask = y.isin(keep)
    X, y = X[mask], y[mask]

    if len(y.unique()) < 2 or len(y) < 100 or y.value_counts().min() < 2:
        return {}, {}

    if len(y.unique()) > 8:
        top = y.value_counts().head(7).index
        y = y.where(y.isin(top), "Other")

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)

    pipe = Pipeline(
        [
            ("tfidf", TfidfVectorizer(max_features=25000, ngram_range=(1, 2), min_df=3)),
            ("clf", LogisticRegression(max_iter=400, class_weight="balanced", n_jobs=-1)),
        ]
    )
    pipe.fit(X_tr, y_tr)
    pred = pipe.predict(X_te)

    metrics = {
        "model": name,
        "accuracy": round(float(accuracy_score(y_te, pred)), 4),
        "precision_macro": round(float(precision_score(y_te, pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_te, pred, average="macro", zero_division=0)), 4),
        "f1_macro": round(float(f1_score(y_te, pred, average="macro", zero_division=0)), 4),
    }

    return metrics, extract_keywords(pipe)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    comb = pd.read_csv(DATASET / "Combined Data.csv")
    proc = pd.read_csv(DATASET / "Processed.csv")

    metrics_all: list[dict] = []
    keywords_by_category: dict[str, list[str]] = {}
    risk_kw = set(BASE_RISK_KEYWORDS)

    m1, kw1 = train_classifier(comb["statement"].map(clean_text), comb["status"], "multiclass")
    if m1:
        metrics_all.append(m1)
        keywords_by_category.update(kw1)
        risk_kw.update(kw1.get("Suicidal", []))

    y_risk = comb["status"].apply(lambda s: "risk" if str(s).lower() == "suicidal" else "normal")
    m3, kw3 = train_classifier(comb["statement"].map(clean_text), y_risk, "suicidal_risk", min_class=50)
    if m3:
        metrics_all.append(m3)
        risk_kw.update(kw3.get("risk", []))

    severe_pct = 0.0
    if "Anxiety Label" in proc.columns:
        vc = proc["Anxiety Label"].value_counts()
        severe_pct = round(100 * vc.get("Severe Anxiety", 0) / vc.sum(), 1)

    top_themes = comb["status"].value_counts().head(5).index.tolist()
    best_f1 = max((m["f1_macro"] for m in metrics_all), default=0.0)

    prompt = f"""You are Mon-Songlap, a compassionate mental wellness companion for young people in Bangladesh (especially university students).

DATA-DRIVEN CONTEXT (trained on 19 datasets):
- Top user themes: {", ".join(top_themes)}
- ~{severe_pct}% severe anxiety in Bangladesh student survey sample
- ML classifier F1 (macro): {best_f1:.2f} on held-out data

STYLE:
- Warm, non-judgmental, culturally aware (Bangladesh).
- Respond primarily in the user's language (Bengali or English).
- Use the user's preferred tone: {{tone}}.
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

MIND GYM: For academic/social stress, suggest bounded practice steps (one small action, breathing, talk to someone).

Avoid: toxic positivity, clinical labels, long lectures, dismissing feelings."""

    (OUT / "improved_system_prompt.txt").write_text(prompt, encoding="utf-8")

    safety = {
        "moderate": sorted(risk_kw),
        "high": sorted(risk_kw)[:25],
        "keywords_by_category": keywords_by_category,
        "distress_categories": ["Anxiety", "Depression", "Stress", "Suicidal", "Bipolar"],
    }
    (OUT / "safety_keywords.json").write_text(json.dumps(safety, indent=2, ensure_ascii=False), encoding="utf-8")

    training_meta = {
        "metrics": metrics_all,
        "severe_anxiety_pct": severe_pct,
        "top_themes": top_themes,
        "source": "generated_from_Dataset",
        "note": "User Colab export had 0 datasets loaded; config regenerated locally.",
    }
    (OUT / "training_metrics.json").write_text(json.dumps(training_meta, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps({"metrics": metrics_all, "risk_keywords": len(risk_kw)}, indent=2))


if __name__ == "__main__":
    main()
