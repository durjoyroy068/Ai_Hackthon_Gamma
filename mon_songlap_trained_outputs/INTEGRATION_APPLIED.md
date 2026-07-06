# Mon-Songlap AI Integration — Applied

Integrated on: 2026-07-06

## Note on Colab export
Your `mon_songlap_trained_outputs` folder had **empty training** (0 datasets loaded in Colab).
Config was **regenerated locally** from `Dataset/` and saved to `backend/storage/app/ai/`.

## Training metrics (local)
| Model | Accuracy | F1 (macro) |
|-------|----------|------------|
| Multiclass (Combined Data) | 76.0% | 71.0% |
| Suicidal risk | 86.0% | 80.8% |

## Files integrated
| File | Location |
|------|----------|
| improved_system_prompt.txt | backend/storage/app/ai/ |
| safety_keywords.json | backend/storage/app/ai/ |
| training_metrics.json | backend/storage/app/ai/ |

## Laravel changes
- `AiConfigService.php` — loads prompt + keywords from storage
- `GeminiService.php` — uses trained system prompt
- `ChatService.php` — ML-expanded safety + distress category detection
- `ChatPage.tsx` — safety level from API response

## Refresh after new training
1. Copy new files to `backend/storage/app/ai/`
2. Run: `php artisan cache:clear`
