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
        return $this->hasGroqKeys() || filled(config('services.gemini.api_key'));
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

        $systemPrompt = $this->systemPrompt($user);

        if ($this->hasGroqKeys()) {
            $groqResponse = $this->generateViaGroq($conversation, $userMessage, $systemPrompt);
            if (filled($groqResponse)) {
                return $groqResponse;
            }
        }

        try {
            $response = $this->generateViaGemini($contents, $systemPrompt);

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

    private function hasGroqKeys(): bool
    {
        return count($this->groqApiKeys()) > 0;
    }

    /** @return array<int, string> */
    private function groqApiKeys(): array
    {
        $keys = config('services.groq.api_keys', []);

        return array_values(array_filter($keys, static fn ($k) => filled($k)));
    }

    private function generateViaGroq(Conversation $conversation, string $userMessage, string $systemPrompt): ?string
    {
        $messages = [['role' => 'system', 'content' => $systemPrompt]];

        foreach ($conversation->messages()->orderBy('created_at')->get() as $message) {
            if ($message->role === 'system') {
                continue;
            }

            $messages[] = [
                'role' => $message->role === 'assistant' ? 'assistant' : 'user',
                'content' => $message->content,
            ];
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $model = config('services.groq.model');
        $url = rtrim(config('services.groq.base_url'), '/').'/chat/completions';

        foreach ($this->groqApiKeys() as $index => $key) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$key,
                    'Content-Type' => 'application/json',
                ])->timeout(60)->post($url, [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.7,
                    'max_tokens' => 1024,
                ]);

                if ($response->successful()) {
                    $text = $response->json('choices.0.message.content');

                    return filled($text) ? trim($text) : null;
                }

                Log::warning('Groq API key failed', [
                    'key_index' => $index + 1,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Groq API exception for key', [
                    'key_index' => $index + 1,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return null;
    }

    private function generateViaGemini(array $contents, string $systemPrompt)
    {
        $model = config('services.gemini.model');
        $baseUrl = rtrim(config('services.gemini.base_url'), '/');
        $url = "{$baseUrl}/models/{$model}:generateContent";

        return Http::withHeaders([
            'x-goog-api-key' => config('services.gemini.api_key'),
            'Content-Type' => 'application/json',
        ])
            ->timeout(60)
            ->post($url, [
                'systemInstruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 1024,
                ],
            ]);
    }
}
