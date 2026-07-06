<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    public function __construct(private AiConfigService $aiConfig) {}

    public function isConfigured(): bool
    {
        return filled(config('services.gemini.api_key'));
    }

    public function generateChatResponse(Conversation $conversation, string $userMessage, User $user): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $contents = [];

        foreach ($conversation->messages()->orderBy('created_at')->get() as $message) {
            if ($message->role === 'system') {
                continue;
            }

            $contents[] = [
                'role' => $message->role === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $message->content]],
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]],
        ];

        $model = config('services.gemini.model');
        $baseUrl = rtrim(config('services.gemini.base_url'), '/');
        $url = "{$baseUrl}/models/{$model}:generateContent";

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => config('services.gemini.api_key'),
                'Content-Type' => 'application/json',
            ])
                ->timeout(60)
                ->post($url, [
                    'systemInstruction' => [
                        'parts' => [['text' => $this->systemPrompt($user)]],
                    ],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 1024,
                    ],
                ]);

            if (! $response->successful()) {
                Log::warning('Gemini API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $text = $response->json('candidates.0.content.parts.0.text');

            return filled($text) ? trim($text) : null;
        } catch (\Throwable $e) {
            Log::error('Gemini API exception', ['message' => $e->getMessage()]);

            return null;
        }
    }

    private function systemPrompt(User $user): string
    {
        $language = $user->language ?? 'bn';
        $tone = $user->settings?->ai_tone ?? 'warm';

        return $this->aiConfig->buildSystemPrompt($language, $tone);
    }
}
