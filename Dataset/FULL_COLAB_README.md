# Mon-Songlap Full AI Training (Google Colab)

## File
`Mon_Songlap_Full_AI_Training_Colab.ipynb`

## What it does
- Auto-loads **all CSV files** in `Dataset/` (original 8 + MindGym 6 + downloaded 5)
- Trains **6 models** with full metrics
- Compares **baseline keywords vs ML**
- Exports zip for Laravel update

## Models trained
| Model | Dataset | Metrics |
|-------|---------|---------|
| M1 Multiclass | Combined Data.csv | accuracy, precision, recall, F1 |
| M2 Binary depression | mental_health + reddit | accuracy, precision, recall, F1 |
| M3 Suicidal risk | Combined Data.csv | accuracy, precision, recall, F1 |
| M4 Emotion | dair_ai + setfit emotion | accuracy, precision, recall, F1 |
| M5 Response quality | MindGym 05_good_bad | accuracy, precision, recall, F1 |
| M6 Session scorer | MindGym 04_session_scores | MAE, R2 |

## How to run
1. Zip entire `Dataset` folder → `Dataset.zip`
2. Upload notebook to Google Colab
3. Runtime → GPU → Run all
4. Upload zip when prompted
5. Download `mon_songlap_trained_outputs.zip`

## Output files
- `TRAINING_REPORT.md` — full analysis
- `training_metrics.json` — all metrics
- `improved_system_prompt.txt` — for GeminiService.php
- `safety_keywords.json` — for ChatService.php
- `model_*.joblib` — trained classifiers
- `gemini_finetune.jsonl` — optional Gemini tuning
- `laravel_integration.txt` — update guide
