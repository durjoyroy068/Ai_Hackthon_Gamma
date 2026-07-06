<?php

namespace App\Services;

use App\Models\ChatResponseTemplate;
use App\Models\Conversation;
use App\Models\ChatMessage;
use App\Models\User;

class ChatService
{
    public function __construct(
        private GeminiService $gemini,
        private AiConfigService $aiConfig,
    ) {}

    public function detectSafetyLevel(string $content): string
    {
        return $this->aiConfig->detectSafetyLevel($content);
    }

    public function generateResponse(string $prompt, User $user, ?Conversation $conversation = null): string
    {
        if ($conversation) {
            $conversation->loadMissing('user.settings');
            $aiResponse = $this->gemini->generateChatResponse($conversation, $prompt, $user);
            if (filled($aiResponse)) {
                return $aiResponse;
            }
        }

        return $this->fallbackResponse($prompt, $user);
    }

    private function fallbackResponse(string $prompt, User $user): string
    {
        $templates = ChatResponseTemplate::query()
            ->where('is_active', true)
            ->get();

        $matched = $templates->filter(function (ChatResponseTemplate $template) use ($prompt) {
            $keywords = $template->keywords ?? [];
            foreach ($keywords as $keyword) {
                if (stripos($prompt, $keyword) !== false) {
                    return true;
                }
            }

            return false;
        });

        $pool = $matched->isNotEmpty()
            ? $matched
            : $templates->where('category', 'default');

        if ($pool->isEmpty()) {
            return $user->language === 'bn'
                ? 'তোমার কথা শুনছি। একটু বিস্তারিত বলতে পারো?'
                : 'I hear you. Would you like to share a bit more?';
        }

        return $pool->random()->content;
    }

    public function sendMessage(Conversation $conversation, string $content): array
    {
        $conversation->load('user.settings');

        $responseText = $this->generateResponse($content, $conversation->user, $conversation);

        $safetyLevel = $this->detectSafetyLevel($content);
        if ($safetyLevel === 'none') {
            $distress = $this->aiConfig->detectDistressCategory($content);
            if ($distress === 'Suicidal') {
                $safetyLevel = 'high';
            } elseif (in_array($distress, ['Depression', 'Anxiety', 'Stress', 'Bipolar'], true)) {
                $safetyLevel = 'moderate';
            }
        }

        $userMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $content,
            'safety_level' => $safetyLevel,
        ]);

        $assistantMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $responseText,
            'safety_level' => 'none',
        ]);

        if ($conversation->messages()->count() <= 2 && $conversation->title === 'New Chat') {
            $conversation->update(['title' => mb_substr($content, 0, 40)]);
        }

        $conversation->touch();

        return [
            'userMessage' => $userMessage,
            'assistantMessage' => $assistantMessage,
            'responseText' => $responseText,
        ];
    }
}
