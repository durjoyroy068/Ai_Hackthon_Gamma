"""Generate Mon_Songlap_Full_AI_Training_Colab.ipynb — all Dataset + MindGym files."""
import json
from pathlib import Path

cells = []

def md(s):
    cells.append({"cell_type": "markdown", "metadata": {}, "source": s})

def code(s):
    cells.append({
        "cell_type": "code", "metadata": {}, "source": s,
        "outputs": [], "execution_count": None,
    })

md("""# Mon-Songlap — Full AI Training & Improvement Report

Train **all datasets** in your `Dataset/` folder (original 8 + MindGym 6 + downloaded 5) to improve:
- **Gemini system prompt** & safety keywords
- **Mental-health text classifiers** (routing, risk, Mind Gym scoring)
- **Exportable models** for Laravel backend

### Your website today
- Chat AI: **Google Gemini** (`gemini-2.5-flash`) via `GeminiService.php`
- Safety: keyword rules in `ChatService.php`

### After this notebook
Download `mon_songlap_trained_outputs.zip` and update Laravel files.

---

## How to run
1. Zip your entire **`Dataset`** folder (must include `MindGym/` subfolder)
2. **Runtime → Change runtime type → T4 GPU** (recommended)
3. **Runtime → Run all**
4. Upload `Dataset.zip` when prompted
5. Download output zip at the end""")

code("""!pip install -q pandas numpy scikit-learn matplotlib seaborn wordcloud joblib tqdm""")

code("""import json, re, zipfile, shutil, warnings
from datetime import datetime
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    f1_score, precision_score, recall_score, mean_absolute_error, r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.multiclass import OneVsRestClassifier

warnings.filterwarnings('ignore')
sns.set_theme(style='whitegrid')
REPORT = {}
print('Ready:', datetime.utcnow().isoformat())""")

code("""# ── Load Dataset folder ──────────────────────────────────────
from google.colab import files

DATASET_ROOT = Path('/content/Dataset')

if not DATASET_ROOT.exists():
    print('Upload Dataset.zip (entire Dataset folder including MindGym/)')
    up = files.upload()
    for name in up:
        p = Path('/content') / name
        if name.endswith('.zip'):
            with zipfile.ZipFile(p, 'r') as z:
                z.extractall('/content')
        elif name.endswith('.csv'):
            DATASET_ROOT.mkdir(parents=True, exist_ok=True)
            shutil.move(str(p), str(DATASET_ROOT / name))

assert DATASET_ROOT.exists(), 'Dataset folder not found!'
all_csv = sorted(DATASET_ROOT.rglob('*.csv'))
print(f'Found {len(all_csv)} CSV files')
for f in all_csv:
    print(' ', f.relative_to(DATASET_ROOT.parent))""")

code("""# ── Auto-load every CSV ─────────────────────────────────────
def clean_text(t):
    if pd.isna(t): return ''
    t = str(t).lower().strip()
    t = re.sub(r'http\\S+', '', t)
    t = re.sub(r'[^a-z0-9\\s\\u0980-\\u09FF]', ' ', t)
    return re.sub(r'\\s+', ' ', t).strip()

STORE = {}
meta_rows = []
for fp in all_csv:
    key = str(fp.relative_to(DATASET_ROOT)).replace('\\\\', '/').replace('/', '__')
    try:
        df = pd.read_csv(fp, on_bad_lines='skip', low_memory=False)
        STORE[key] = df
        meta_rows.append({'file': str(fp.relative_to(DATASET_ROOT)), 'key': key, 'rows': len(df), 'cols': len(df.columns)})
    except Exception as e:
        meta_rows.append({'file': str(fp.relative_to(DATASET_ROOT)), 'key': key, 'rows': 0, 'error': str(e)})

meta_df = pd.DataFrame(meta_rows)
display(meta_df)""")

code("""# ── Build unified training pools ─────────────────────────────

def get_df(name_part):
    for k, v in STORE.items():
        if name_part.lower() in k.lower():
            return v
    return None

text_pool = []

# Combined Data (multi-class)
comb = get_df('Combined Data')
if comb is not None:
    c = comb.rename(columns={comb.columns[0]: 'idx'} if 'statement' not in comb.columns else {})
    c = comb[['statement', 'status']].copy()
    c['text'] = c['statement'].map(clean_text)
    c['label'] = c['status']
    c['task'] = 'multiclass'
    text_pool.append(c[['text', 'label', 'task']])

# mental_health binary
mh = get_df('mental_health.csv')
if mh is not None and 'text' in mh.columns:
    m = mh[['text', 'label']].copy()
    m['text'] = m['text'].map(clean_text)
    m['label'] = m['label'].map({0: 'Normal', 1: 'Depression'})
    m['task'] = 'binary_depression'
    text_pool.append(m[['text', 'label', 'task']])

# reddit
rd = get_df('reddit_cleaned')
if rd is not None:
    r = rd.copy()
    txt_col = 'clean_text' if 'clean_text' in r.columns else r.columns[0]
    r['text'] = r[txt_col].map(clean_text)
    r['label'] = r['is_depression'].map({0: 'Normal', 1: 'Depression'})
    r['task'] = 'binary_depression'
    text_pool.append(r[['text', 'label', 'task']])

# counseling downloads
for part in ['mental_health_counseling', 'student_mental_health', 'counseling_pretrain']:
    df = get_df(part)
    if df is None: continue
    cols = df.columns.tolist()
    q = next((c for c in cols if c.lower() in ('question','context','input','text')), cols[0])
    a = next((c for c in cols if c.lower() in ('answer','response','output')), cols[-1])
    tmp = pd.DataFrame({'text': df[q].map(clean_text), 'label': 'Counseling', 'task': 'counseling_corpus'})
    text_pool.append(tmp)

# emotion datasets
for part in ['dair_ai_emotion', 'setfit_emotion']:
    df = get_df(part)
    if df is None: continue
    txt = 'text' if 'text' in df.columns else df.columns[0]
    lbl = 'label' if 'label' in df.columns else df.columns[-1]
    e = df[[txt, lbl]].copy()
    e.columns = ['text', 'label']
    e['text'] = e['text'].map(clean_text)
    e['task'] = 'emotion'
    text_pool.append(e[['text', 'label', 'task']])

# MindGym good/bad
gb = get_df('05_good_bad')
if gb is not None:
  g = gb.copy()
  good = g[g['label'].astype(str).str.lower() == 'good'].copy()
  good['text'] = (good['situation'].astype(str) + ' ' + good['good_response_bn'].astype(str)).map(clean_text)
  good['label'] = 'good'
  good['task'] = 'response_quality'
  bad = g[g['label'].astype(str).str.lower() == 'bad'].copy()
  bad['text'] = (bad['situation'].astype(str) + ' ' + bad['bad_response_bn'].astype(str)).map(clean_text)
  bad['label'] = 'bad'
  bad['task'] = 'response_quality'
  text_pool.append(good[['text','label','task']])
  text_pool.append(bad[['text','label','task']])

unified = pd.concat(text_pool, ignore_index=True)
unified = unified[unified['text'].str.len() >= 12].drop_duplicates(subset=['text','task'])
print('Unified pool:', len(unified), 'rows')
print(unified.groupby('task').size())""")

code("""# ── Survey EDA (Bangladesh student data) ────────────────────
proc = get_df('Processed.csv')
if proc is not None:
    fig, ax = plt.subplots(1, 3, figsize=(14, 4))
    for i, col in enumerate(['Anxiety Label', 'Depression Label', 'Stress Label']):
        if col in proc.columns:
            proc[col].value_counts().head(6).plot(kind='bar', ax=ax[i], color='teal')
            ax[i].set_title(col)
            ax[i].tick_params(axis='x', rotation=45)
    plt.tight_layout(); plt.show()

if comb is not None:
    comb['status'].value_counts().plot(kind='bar', figsize=(10,4), color='coral')
    plt.title('Combined Data — status distribution'); plt.xticks(rotation=30); plt.show()""")

code("""# ── Training helper ─────────────────────────────────────────

def train_classifier(X, y, name, min_class=30):
    vc = y.value_counts()
    keep = vc[vc >= min_class].index
    mask = y.isin(keep)
    X, y = X[mask], y[mask]
    if len(y.unique()) < 2 or len(y) < 100:
        return None, {'model': name, 'status': 'skipped', 'reason': 'insufficient data'}

    # merge rare
    if len(y.unique()) > 8:
        top = y.value_counts().head(7).index
        y = y.where(y.isin(top), 'Other')

    vc = y.value_counts()
    if vc.min() < 2:
        return None, {'model': name, 'status': 'skipped', 'reason': 'class with <2 samples'}

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)

    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=30000, ngram_range=(1,2), min_df=2)),
        ('clf', LogisticRegression(max_iter=400, class_weight='balanced', n_jobs=-1)),
    ])
    pipe.fit(X_tr, y_tr)
    pred = pipe.predict(X_te)

    metrics = {
        'model': name,
        'status': 'ok',
        'samples': int(len(y)),
        'classes': int(len(y.unique())),
        'accuracy': float(accuracy_score(y_te, pred)),
        'precision_macro': float(precision_score(y_te, pred, average='macro', zero_division=0)),
        'recall_macro': float(recall_score(y_te, pred, average='macro', zero_division=0)),
        'f1_macro': float(f1_score(y_te, pred, average='macro', zero_division=0)),
        'f1_weighted': float(f1_score(y_te, pred, average='weighted', zero_division=0)),
    }

    fig, ax = plt.subplots(figsize=(8,6))
    cm = confusion_matrix(y_te, pred, labels=pipe.classes_)
    sns.heatmap(cm, annot=True, fmt='d', xticklabels=pipe.classes_, yticklabels=pipe.classes_, ax=ax)
    ax.set_title(f'Confusion Matrix — {name}')
    plt.xticks(rotation=45, ha='right'); plt.tight_layout(); plt.show()

    print(classification_report(y_te, pred, zero_division=0))
    return pipe, metrics

MODELS = {}
METRICS = []""")

code("""# MODEL 1 — Multi-class mental health (Combined Data)
if comb is not None:
    X = comb['statement'].map(clean_text)
    y = comb['status']
    m, met = train_classifier(X, y, 'M1_multiclass_combined')
    if m: MODELS['multiclass'] = m
    if met: METRICS.append(met)""")

code("""# MODEL 2 — Binary depression (mental_health + reddit)
dep_frames = []
if mh is not None:
    dep_frames.append(mh.assign(text=mh['text'].map(clean_text), label=mh['label'].map({0:'Normal',1:'Depression'})))
if rd is not None:
    dep_frames.append(rd.assign(text=rd['clean_text'].map(clean_text), label=rd['is_depression'].map({0:'Normal',1:'Depression'})))
if dep_frames:
    dep = pd.concat(dep_frames)[['text','label']].drop_duplicates()
    dep = dep[dep['text'].str.len() >= 12]
    m, met = train_classifier(dep['text'], dep['label'], 'M2_binary_depression')
    if m: MODELS['binary_depression'] = m
    if met: METRICS.append(met)""")

code("""# MODEL 3 — Suicidal risk (binary from Combined Data)
if comb is not None:
    y = comb['status'].apply(lambda s: 'risk' if str(s).lower() == 'suicidal' else 'normal')
    m, met = train_classifier(comb['statement'].map(clean_text), y, 'M3_suicidal_risk', min_class=50)
    if m: MODELS['suicidal_risk'] = m
    if met: METRICS.append(met)""")

code("""# MODEL 4 — Emotion classifier
emo = unified[unified['task'] == 'emotion']
if len(emo) > 200:
    m, met = train_classifier(emo['text'], emo['label'].astype(str), 'M4_emotion', min_class=100)
    if m: MODELS['emotion'] = m
    if met: METRICS.append(met)""")

code("""# MODEL 5 — Response quality (MindGym good vs bad)
rq = unified[unified['task'] == 'response_quality']
rq = rq[rq['label'].isin(['good', 'bad'])]
if len(rq) > 50 and rq['label'].value_counts().min() >= 2:
    m, met = train_classifier(rq['text'], rq['label'], 'M5_response_quality', min_class=2)
    if m: MODELS['response_quality'] = m
    if met: METRICS.append(met)""")

code("""# MODEL 6 — Session score regressor (MindGym 04)
sess = get_df('04_response_session')
if sess is not None and 'user_response' in sess.columns:
    s = sess.dropna(subset=['user_response','overall_score'])
    s['text'] = s['user_response'].map(clean_text)
    s = s[s['text'].str.len() >= 2]
    X_tr, X_te, y_tr, y_te = train_test_split(s['text'], s['overall_score'], test_size=0.2, random_state=42)
    reg = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1,2))),
        ('reg', Ridge(alpha=1.0)),
    ])
    reg.fit(X_tr, y_tr)
    pred = reg.predict(X_te)
    met = {
        'model': 'M6_session_score_regressor',
        'status': 'ok',
        'samples': int(len(s)),
        'mae': float(mean_absolute_error(y_te, pred)),
        'r2': float(r2_score(y_te, pred)),
        'note': 'Trained on synthetic demo sessions — retrain with real logs',
    }
    MODELS['session_scorer'] = reg
    METRICS.append(met)
    print('Session scorer MAE:', met['mae'], 'R2:', met['r2'])""")

code("""# ── Baseline vs ML comparison ───────────────────────────────
# Baseline: keyword rules (current ChatService style)
RISK_KW = ['suicide','kill','die','hurt myself','মরতে','আত্মহত্যা','মর']
DEP_KW = ['depress','hopeless','worthless','empty','হতাশ','মরিয়া']

def baseline_predict(text):
    t = text.lower()
    if any(k in t for k in RISK_KW): return 'Suicidal'
    if any(k in t for k in DEP_KW): return 'Depression'
    return 'Normal'

if comb is not None and 'multiclass' in MODELS:
    sample = comb.sample(min(2000, len(comb)), random_state=42)
    texts = sample['statement'].map(clean_text)
    true = sample['status']
    base_pred = texts.map(baseline_predict)
    ml_pred = MODELS['multiclass'].predict(texts)

    # compare on collapsed labels
    def collapse(s):
        s = str(s)
        if s == 'Suicidal': return 'risk'
        if s in ('Depression','Anxiety','Stress','Bipolar'): return 'distress'
        return 'ok'
    yt = true.map(collapse)
    yb = base_pred.map(collapse)
    ym = pd.Series(ml_pred).map(collapse)

    comparison = pd.DataFrame([
        {'method': 'Baseline (keywords)', 'accuracy': accuracy_score(yt, yb), 'f1_macro': f1_score(yt, yb, average='macro', zero_division=0)},
        {'method': 'ML (TF-IDF+LR)', 'accuracy': accuracy_score(yt, ym), 'f1_macro': f1_score(yt, ym, average='macro', zero_division=0)},
    ])
    display(comparison)
    REPORT['baseline_vs_ml'] = comparison.to_dict('records')
    improvement = comparison.iloc[1]['f1_macro'] - comparison.iloc[0]['f1_macro']
    print(f'F1 improvement over baseline: {improvement:+.3f}')""")

code("""# ── Metrics summary table ───────────────────────────────────
metrics_df = pd.DataFrame(METRICS)
display(metrics_df)

fig, ax = plt.subplots(figsize=(10, 5))
plot_df = metrics_df[metrics_df['status']=='ok'].dropna(subset=['f1_macro'])
if len(plot_df):
    plot_df.plot(x='model', y=['accuracy','precision_macro','recall_macro','f1_macro'], kind='bar', ax=ax)
    plt.title('Model Performance Summary'); plt.xticks(rotation=30, ha='right'); plt.ylim(0,1); plt.tight_layout(); plt.show()

REPORT['metrics'] = metrics_df.to_dict('records')""")

code("""# ── Extract safety keywords from trained models ─────────────
keywords_export = {'moderate': list(RISK_KW), 'keywords_by_category': {}}

if 'multiclass' in MODELS:
    vec = MODELS['multiclass'].named_steps['tfidf']
    clf = MODELS['multiclass'].named_steps['clf']
    feats = vec.get_feature_names_out()
    for i, cls in enumerate(clf.classes_):
        idx = clf.coef_[i].argsort()[-25:][::-1]
        keywords_export['keywords_by_category'][str(cls)] = [feats[j] for j in idx]

if 'suicidal_risk' in MODELS:
    vec = MODELS['suicidal_risk'].named_steps['tfidf']
    clf = MODELS['suicidal_risk'].named_steps['clf']
    feats = vec.get_feature_names_out()
    ri = list(clf.classes_).index('risk') if 'risk' in clf.classes_ else 0
    idx = clf.coef_[ri].argsort()[-30:][::-1]
    keywords_export['moderate'] = list(set(keywords_export['moderate'] + [feats[j] for j in idx]))

print('Top suicidal-risk keywords:', keywords_export['moderate'][:20])""")

code("""# ── Improved Gemini system prompt ───────────────────────────
severe_pct = 0.0
if proc is not None and 'Anxiety Label' in proc.columns:
    vc = proc['Anxiety Label'].value_counts()
    severe_pct = round(100 * vc.get('Severe Anxiety', 0) / vc.sum(), 1)

top_themes = comb['status'].value_counts().head(5).index.tolist() if comb is not None else []

best_f1 = metrics_df['f1_macro'].max() if 'f1_macro' in metrics_df.columns and metrics_df['f1_macro'].notna().any() else 0

improved_prompt = f'''You are Mon-Songlap, a compassionate mental wellness companion for young people in Bangladesh.

DATA-DRIVEN CONTEXT (trained on {len(all_csv)} datasets):
- Top user themes: {', '.join(top_themes)}
- ~{severe_pct}% severe anxiety in Bangladesh student survey sample
- ML classifier F1 (macro): {best_f1:.2f} on held-out data

STYLE: Warm, non-judgmental. Bengali or English per user. 2-4 short paragraphs.

SAFETY: Not a doctor. Never diagnose. For self-harm/suicide cues:
- Empathy first, then helplines: 1098, Kaan Pete Roi +8809604445555
- Ask if user is safe right now

MIND GYM: For academic stress, suggest small bounded practice steps (breathing, one task, talk to someone).

Avoid: toxic positivity, clinical labels, long lectures.'''

with open('/content/improved_system_prompt.txt', 'w', encoding='utf-8') as f:
    f.write(improved_prompt)
print(improved_prompt[:700])""")

code("""# ── Improvement analysis report ─────────────────────────────
report_md = ['# Mon-Songlap AI Training Report', f'Generated: {datetime.utcnow().isoformat()}', '']

report_md.append('## Datasets used')
for _, r in meta_df.iterrows():
    report_md.append(f"- **{r['file']}**: {r.get('rows',0)} rows")

report_md.append('\\n## Model results')
if len(metrics_df):
    report_md.append(metrics_df.to_markdown(index=False))

report_md.append('\\n## Baseline vs ML')
if 'baseline_vs_ml' in REPORT:
    report_md.append(pd.DataFrame(REPORT['baseline_vs_ml']).to_markdown(index=False))

report_md.append('\\n## Recommendations for Laravel backend')
report_md.append('1. Replace `GeminiService::systemPrompt()` with `improved_system_prompt.txt`')
report_md.append('2. Load `safety_keywords.json` in `ChatService::detectSafetyLevel()`')
report_md.append('3. Use `multiclass` model to route Mind Gym scenarios (optional PHP/Python microservice)')
report_md.append('4. Use `suicidal_risk` model as pre-check before Gemini response')
report_md.append('5. Retrain `session_scorer` when real Mind Gym session logs are available')

report_md.append('\\n## Current vs improved')
report_md.append('| Aspect | Current (website) | After update |')
report_md.append('|--------|-------------------|--------------|')
report_md.append('| Chat AI | Gemini API only | Gemini + data-tuned prompt |')
report_md.append('| Safety | ~6 keywords | ML + expanded keywords |')
report_md.append('| Routing | None | Multi-class distress detector |')
report_md.append('| Mind Gym | Not built | Session scorer + response quality model |')

report_text = '\\n'.join(report_md)
with open('/content/TRAINING_REPORT.md', 'w', encoding='utf-8') as f:
    f.write(report_text)
print(report_text[:2000])""")

code("""# ── Gemini fine-tune JSONL (from counseling + good examples) ─
SYSTEM = improved_prompt[:500]
finetune = []
if gb is not None:
    for _, row in gb[gb['label'].astype(str).str.lower()=='good'].head(800).iterrows():
        u = str(row.get('situation',''))[:400]
        a = str(row.get('good_response_bn',''))[:500]
        if len(u)<10 or len(a)<10: continue
        finetune.append({
            'systemInstruction': {'parts': [{'text': SYSTEM}]},
            'contents': [
                {'role':'user','parts':[{'text':u}]},
                {'role':'model','parts':[{'text':a}]},
            ]
        })
with open('/content/gemini_finetune.jsonl', 'w', encoding='utf-8') as f:
    for row in finetune:
        f.write(json.dumps(row, ensure_ascii=False)+'\\n')
print('Fine-tune examples:', len(finetune))""")

code("""# ── Export everything ─────────────────────────────────────
OUT = Path('/content/mon_songlap_trained_outputs')
OUT.mkdir(exist_ok=True)

for name, model in MODELS.items():
    joblib.dump(model, OUT / f'model_{name}.joblib')

with open(OUT / 'safety_keywords.json', 'w', encoding='utf-8') as f:
    json.dump(keywords_export, f, indent=2, ensure_ascii=False)

with open(OUT / 'training_metrics.json', 'w', encoding='utf-8') as f:
    json.dump({'metrics': METRICS, 'baseline_vs_ml': REPORT.get('baseline_vs_ml', [])}, f, indent=2)

shutil.copy('/content/improved_system_prompt.txt', OUT / 'improved_system_prompt.txt')
shutil.copy('/content/TRAINING_REPORT.md', OUT / 'TRAINING_REPORT.md')
shutil.copy('/content/gemini_finetune.jsonl', OUT / 'gemini_finetune.jsonl')

with open(OUT / 'laravel_integration.txt', 'w', encoding='utf-8') as f:
    f.write('''MON-SONGLAP LARAVEL UPDATE GUIDE
================================
1. GeminiService.php -> paste improved_system_prompt.txt into systemPrompt()
2. ChatService.php -> load safety_keywords.json for detectSafetyLevel()
3. storage/app/ai/ -> place model_*.joblib (use Python microservice OR reimplement rules from keywords)
4. Optional: Google AI Studio -> upload gemini_finetune.jsonl for Gemini tuning
5. Re-run this notebook after collecting real Mind Gym session logs
''')

shutil.make_archive('/content/mon_songlap_trained_outputs', 'zip', OUT)
files.download('/content/mon_songlap_trained_outputs.zip')
print('Done! Download started.')""")

# Fix indentation error in train_classifier cell - I had a typo with extra space before fig
for c in cells:
    if c['cell_type']=='code' and '  fig, ax = plt.subplots' in c['source']:
        c['source'] = c['source'].replace('  fig, ax', '    fig, ax')

nb = {
    'nbformat': 4, 'nbformat_minor': 5,
    'metadata': {
        'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'},
        'colab': {'provenance': [], 'gpuType': 'T4'},
        'accelerator': 'GPU',
    },
    'cells': cells,
}

out = Path(__file__).resolve().parents[1] / 'Dataset' / 'Mon_Songlap_Full_AI_Training_Colab.ipynb'
out.write_text(json.dumps(nb, indent=1, ensure_ascii=False), encoding='utf-8')
print('Wrote', out, '| cells:', len(cells))
