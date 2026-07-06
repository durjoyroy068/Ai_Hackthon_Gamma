# Mind Gym Datasets

Prepared for **Mon-Songlap Mind Gym** feature.

## Core files (ready to use)

| File | Rows | Source |
|------|------|--------|
| `01_intake_profiles.csv` | 2,028 | Derived from your `Processed.csv` survey |
| `02_scenario_templates.csv` | 10 | Generated — Bangladesh student scenarios (BN+EN) |
| `03_branching_choices.csv` | 45 | Generated — choice trees per scenario |
| `04_response_session_scores.csv` | 500 | Synthetic demo sessions (replace with real app logs) |
| `05_good_bad_response_examples.csv` | 1,104 | Your Combined Data + counseling downloads |
| `06_skill_tree_progress.csv` | 200 | Synthetic demo progress data |

## Downloaded public datasets (`downloaded/`)

| File | Rows | Source |
|------|------|--------|
| `student_mental_health_counseling.csv` | 52,254 | HuggingFace: arafatanam/Student-Mental-Health-Counseling-EN |
| `mental_health_counseling.csv` | 3,512 | HuggingFace: Amod/mental_health_counseling_conversations |
| `counseling_pretrain_train.csv` | ~3,500 | HuggingFace: Felladrin/pretrain-mental-health-counseling-conversations |
| `dair_ai_emotion.csv` | 16,000 | HuggingFace: dair-ai/emotion |
| `setfit_emotion.csv` | 16,000 | HuggingFace: SetFit/emotion |

## Original datasets (parent `Dataset/` folder)

Your 8 original CSV files are unchanged and still used for chat AI training.

## Next steps

1. Use `02` + `03` to build Mind Gym scenario engine
2. Use `05` to train/improve AI feedback
3. Replace `04` and `06` with **real user session logs** from Mon-Songlap beta

## Re-download

```powershell
python scripts/download_mindgym_datasets.py
```
