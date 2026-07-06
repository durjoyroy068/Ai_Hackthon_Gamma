# Mon-Songlap AI Training (Google Colab)

## Quick start

1. Open [Google Colab](https://colab.research.google.com/)
2. **File → Upload notebook** → choose `Mon_Songlap_AI_Training_Colab.ipynb`
3. **Runtime → Change runtime type → T4 GPU** (recommended)
4. Zip this `Dataset` folder (all 8 CSV files must be inside)
5. Run the notebook — when prompted, upload `Dataset.zip` or the zip of this folder
6. Wait for **Run all** to finish (~10–25 min with GPU)
7. Download `mon_songlap_ai_outputs.zip`

## All 8 datasets used

- `Anxiety.csv`
- `Depression.csv`
- `Stress.csv`
- `Processed.csv`
- `Raw Dataset.csv`
- `mental_health.csv`
- `depression_dataset_reddit_cleaned.csv`
- `Combined Data.csv`

## What you get after training

| File | Use in Mon-Songlap |
|------|-------------------|
| `improved_system_prompt.txt` | Paste into `backend/app/Services/GeminiService.php` |
| `safety_keywords.json` | Expand `ChatService::detectSafetyLevel()` keywords |
| `gemini_finetune.jsonl` | Optional Gemini tuning in Google AI Studio |
| `training_insights.json` | Review accuracy & data findings |
| `multiclass_tfidf_model.joblib` | Route messages (Anxiety/Stress/Suicidal/etc.) |
| `binary_depression_model.joblib` | Depression vs normal detection |

## Note

Your website uses **Gemini API** live. Colab trains **helper models** and generates **prompt/keyword updates** — not a replacement for Gemini unless you fine-tune via Google AI Studio.
