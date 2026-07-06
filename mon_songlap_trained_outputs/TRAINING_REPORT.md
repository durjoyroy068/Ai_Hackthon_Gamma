# Mon-Songlap AI Training Report
Generated: 2026-07-06T17:03:08.291145+00:00

## Datasets used

## Model results

## Baseline vs ML

## Recommendations for Laravel backend
1. Replace `GeminiService::systemPrompt()` with `improved_system_prompt.txt`
2. Load `safety_keywords.json` in `ChatService::detectSafetyLevel()`
3. Use `multiclass` model to route Mind Gym scenarios (optional PHP/Python microservice)
4. Use `suicidal_risk` model as pre-check before Gemini response
5. Retrain `session_scorer` when real Mind Gym session logs are available

## Current vs improved
| Aspect | Current (website) | After update |
|--------|-------------------|--------------|
| Chat AI | Gemini API only | Gemini + data-tuned prompt |
| Safety | ~6 keywords | ML + expanded keywords |
| Routing | None | Multi-class distress detector |
| Mind Gym | Not built | Session scorer + response quality model |