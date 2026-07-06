<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class AiConfigService
{
    private const AI_DIR = 'ai';

    private const HIGH_PRECISION_RISK = [
        'suicide', 'suicidal', 'kill myself', 'killing myself', 'want to die', 'to die',
        'end my life', 'end it all', 'hurt myself', 'self harm', 'better off dead',
        'no reason to live', 'overdose', 'goodbye cruel', 'মরতে', 'আত্মহত্যা', 'মর',
        'বাঁচতে চাই না', 'নিজেকে ক্ষতি', 'হত্যা',
    ];

    private const HIGH_RISK = [
        'suicide', 'suicidal', 'kill myself', 'killing myself', 'want to die',
        'end my life', 'hurt myself', 'overdose', 'মরতে', 'আত্মহত্যা',
    ];

    public function systemPromptTemplate(): string
    {
        return Cache::remember('ai.system_prompt', 3600, function () {
            $path = storage_path('app/'.self::AI_DIR.'/improved_system_prompt.txt');

            if (File::exists($path)) {
                return File::get($path);
            }

            return $this->defaultPromptTemplate();
        });
    }

    public function buildSystemPrompt(string $language, string $tone): string
    {
        $template = $this->systemPromptTemplate();
        $langLabel = $language === 'en' ? 'English' : 'Bengali';

        $prompt = str_replace('{tone}', $tone, $template);
        $prompt .= "\nRespond primarily in {$langLabel}.";

        return $prompt;
    }

    /** @return array<int, string> */
    public function moderateRiskKeywords(): array
    {
        return Cache::remember('ai.moderate_keywords', 3600, function () {
            $fromFile = $this->loadKeywordList('moderate');
            $merged = array_unique(array_merge(self::HIGH_PRECISION_RISK, $fromFile));

            return array_values(array_filter($merged, fn ($kw) => $this->isUsefulKeyword($kw)));
        });
    }

    /** @return array<int, string> */
    public function highRiskKeywords(): array
    {
        return Cache::remember('ai.high_keywords', 3600, function () {
            $fromFile = $this->loadKeywordList('high');

            return array_values(array_unique(array_merge(self::HIGH_RISK, $fromFile)));
        });
    }

    /** @return array<string, mixed>|null */
    public function trainingMetrics(): ?array
    {
        $path = storage_path('app/'.self::AI_DIR.'/training_metrics.json');

        if (! File::exists($path)) {
            return null;
        }

        return json_decode(File::get($path), true);
    }

    public function detectSafetyLevel(string $content): string
    {
        $lower = mb_strtolower($content);

        foreach ($this->highRiskKeywords() as $keyword) {
            if ($this->containsKeyword($lower, $keyword)) {
                return 'high';
            }
        }

        foreach ($this->moderateRiskKeywords() as $keyword) {
            if ($this->containsKeyword($lower, $keyword)) {
                return 'moderate';
            }
        }

        return 'none';
    }

    public function detectDistressCategory(string $content): ?string
    {
        $config = $this->loadSafetyConfig();
        $categories = $config['keywords_by_category'] ?? [];
        $lower = mb_strtolower($content);
        $scores = [];

        foreach ($categories as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                if (strlen($keyword) < 4) {
                    continue;
                }
                if ($this->containsKeyword($lower, mb_strtolower($keyword))) {
                    $score++;
                }
            }
            if ($score > 0) {
                $scores[$category] = $score;
            }
        }

        if ($scores === []) {
            return null;
        }

        arsort($scores);

        return array_key_first($scores);
    }

    public function clearCache(): void
    {
        Cache::forget('ai.system_prompt');
        Cache::forget('ai.moderate_keywords');
        Cache::forget('ai.high_keywords');
    }

    private function defaultPromptTemplate(): string
    {
        return <<<'PROMPT'
You are Mon-Songlap, a compassionate mental wellness companion for young people in Bangladesh.
Use a {tone}, supportive, non-judgmental tone.
You are not a doctor or therapist. Do not diagnose.
If the user mentions self-harm or suicide, respond with empathy and encourage helplines 1098, Kaan Pete Roi +8809604445555.
Keep replies concise (2-4 short paragraphs max).
PROMPT;
    }

    /** @return array<string, mixed> */
    private function loadSafetyConfig(): array
    {
        $path = storage_path('app/'.self::AI_DIR.'/safety_keywords.json');

        if (! File::exists($path)) {
            return [];
        }

        return json_decode(File::get($path), true) ?? [];
    }

    /** @return array<int, string> */
    private function loadKeywordList(string $key): array
    {
        $config = $this->loadSafetyConfig();

        return is_array($config[$key] ?? null) ? $config[$key] : [];
    }

    private function isUsefulKeyword(string $keyword): bool
    {
        $keyword = trim(mb_strtolower($keyword));
        $stop = ['not', 'have', 'has', 'had', 'will', 'would', 'its', 'you', 'all', 'did', 'do', 'can', 'cannot', 'is', 'are', 'was', 'the', 'and', 'for'];

        if (in_array($keyword, $stop, true)) {
            return false;
        }

        if (mb_strlen($keyword) < 3) {
            return false;
        }

        return true;
    }

    private function containsKeyword(string $haystack, string $keyword): bool
    {
        $keyword = mb_strtolower(trim($keyword));

        if ($keyword === '') {
            return false;
        }

        return mb_stripos($haystack, $keyword) !== false;
    }
}
