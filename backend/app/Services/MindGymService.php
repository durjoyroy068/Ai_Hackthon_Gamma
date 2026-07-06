<?php

namespace App\Services;

use App\Models\MindGymChoice;
use App\Models\MindGymScenario;
use App\Models\MindGymSession;
use App\Models\MindGymSessionEvent;
use App\Models\MindGymUserProgress;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MindGymService
{
    public function __construct(
        private AiConfigService $aiConfig,
        private GeminiService $gemini,
    ) {}

    /** @return array<int, array<string, mixed>> */
    public function listScenarios(User $user): array
    {
        $scenarios = MindGymScenario::where('is_active', true)->orderBy('category')->get();
        $recommendedCategory = $this->recommendedCategory($user);

        return $scenarios->map(function (MindGymScenario $s) use ($recommendedCategory, $user) {
            $tags = array_map('trim', explode(',', $s->intake_tags ?? ''));
            $recommended = $s->category === $recommendedCategory
                || in_array($recommendedCategory, $tags, true);

            return [
                'id' => (string) $s->id,
                'code' => $s->code,
                'titleBn' => $s->title_bn,
                'titleEn' => $s->title_en,
                'category' => $s->category,
                'difficulty' => $s->difficulty,
                'durationMinutes' => $s->duration_minutes,
                'recommended' => $recommended,
                'settingBn' => $s->setting_description_bn,
                'settingEn' => $s->setting_description_en,
            ];
        })->values()->all();
    }

    /** @return array<int, array<string, mixed>> */
    public function userProgress(User $user): array
    {
        return MindGymUserProgress::where('user_id', $user->id)
            ->get()
            ->map(fn ($p) => [
                'category' => $p->category,
                'currentLevel' => $p->current_level,
                'xp' => $p->xp,
                'sessionsCompleted' => $p->sessions_completed,
                'avgScore' => (float) $p->avg_score,
                'unlockedScenarios' => $p->unlocked_scenarios ?? [],
            ])
            ->values()
            ->all();
    }

    public function startSession(User $user, int $scenarioId, ?int $moodBefore = null): array
    {
        $scenario = MindGymScenario::findOrFail($scenarioId);

        $session = MindGymSession::create([
            'user_id' => $user->id,
            'scenario_id' => $scenario->id,
            'current_node_id' => 'N1',
            'difficulty_level' => $scenario->difficulty,
            'status' => 'active',
            'mood_before' => $moodBefore,
            'started_at' => now(),
        ]);

        return $this->sessionState($session->fresh(['scenario']));
    }

    public function makeChoice(MindGymSession $session, int $choiceId): array
    {
        $this->assertActive($session);

        $choice = MindGymChoice::where('scenario_id', $session->scenario_id)
            ->where('id', $choiceId)
            ->firstOrFail();

        $impact = $choice->score_impact ?? [];
        $session->coping_score += (int) ($impact['coping'] ?? 0);
        $session->avoidance_score += (int) ($impact['avoidance'] ?? 0);
        $session->clarity_score += (int) ($impact['clarity'] ?? 0);
        $session->coping_score += (int) ($impact['help_seeking'] ?? 0);
        $session->coping_score += (int) ($impact['empathy'] ?? 0);
        $session->avoidance_score += (int) ($impact['conflict'] ?? 0);

        MindGymSessionEvent::create([
            'session_id' => $session->id,
            'event_type' => 'choice',
            'payload' => [
                'choiceId' => $choice->id,
                'nodeId' => $choice->node_id,
                'nextNodeId' => $choice->next_node_id,
                'impact' => $impact,
            ],
        ]);

        $next = $choice->next_node_id;
        $session->current_node_id = $next;

        if (str_starts_with($next, 'END_')) {
            $session->status = str_contains($next, 'OK') ? 'completed' : 'failed';
            $session->ended_at = now();
            $session->overall_score = $this->computeOverallScore($session);
            $session->save();
            $this->updateUserProgress($session);

            return $this->sessionState($session->fresh(['scenario']));
        }

        $session->save();

        return $this->sessionState($session->fresh(['scenario']));
    }

    public function completeWithReflection(MindGymSession $session, string $reflection, ?int $moodAfter = null): array
    {
        if ($session->status === 'active') {
            $session->status = 'completed';
            $session->ended_at = now();
            $session->overall_score = $this->computeOverallScore($session);
        }

        $session->mood_after = $moodAfter;
        $session->feedback_text = $this->generateFeedback($session, $reflection);
        $session->save();

        MindGymSessionEvent::create([
            'session_id' => $session->id,
            'event_type' => 'reflection',
            'payload' => ['text' => $reflection],
        ]);

        $this->updateUserProgress($session);

        return $this->sessionState($session->fresh(['scenario']));
    }

    public function sessionState(MindGymSession $session): array
    {
        $session->loadMissing(['scenario', 'user']);
        $scenario = $session->scenario;
        $user = $session->user;
        $useBn = ($user->language ?? 'bn') !== 'en';

        $choices = [];
        if ($session->status === 'active' && ! str_starts_with($session->current_node_id, 'END_')) {
            $choices = MindGymChoice::where('scenario_id', $scenario->id)
                ->where('node_id', $session->current_node_id)
                ->get()
                ->map(fn (MindGymChoice $c) => [
                    'id' => (string) $c->id,
                    'text' => $useBn ? $c->choice_text_bn : $c->choice_text_en,
                ])
                ->values()
                ->all();
        }

        $sceneText = $session->current_node_id === 'N1'
            ? ($useBn ? $scenario->opening_scene_bn : $scenario->opening_scene_en)
            : null;

        return [
            'sessionId' => (string) $session->id,
            'status' => $session->status,
            'currentNodeId' => $session->current_node_id,
            'scenario' => [
                'id' => (string) $scenario->id,
                'code' => $scenario->code,
                'title' => $useBn ? $scenario->title_bn : $scenario->title_en,
                'setting' => $useBn ? $scenario->setting_description_bn : $scenario->setting_description_en,
                'category' => $scenario->category,
                'difficulty' => $scenario->difficulty,
            ],
            'sceneText' => $sceneText,
            'choices' => $choices,
            'scores' => [
                'coping' => $session->coping_score,
                'avoidance' => $session->avoidance_score,
                'clarity' => $session->clarity_score,
                'overall' => $session->overall_score,
            ],
            'feedback' => $session->feedback_text,
            'isComplete' => in_array($session->status, ['completed', 'failed'], true),
        ];
    }

    private function recommendedCategory(User $user): string
    {
        $map = [
            'Anxiety' => 'exam',
            'Depression' => 'social',
            'Stress' => 'academic_stress',
            'Suicidal' => 'exam',
            'Bipolar' => 'social',
        ];

        $latestAssessment = $user->assessmentResults()->latest()->first();
        if ($latestAssessment && $latestAssessment->risk_level === 'high') {
            return 'social';
        }

        return 'exam';
    }

    private function computeOverallScore(MindGymSession $session): float
    {
        $raw = ($session->coping_score * 2 + $session->clarity_score - $session->avoidance_score) / 3.0;
        $normalized = 5 + $raw;
        if ($session->status === 'failed') {
            $normalized -= 2;
        }

        return round(max(1, min(10, $normalized)), 1);
    }

    private function updateUserProgress(MindGymSession $session): void
    {
        $session->loadMissing('scenario');
        $category = $session->scenario->category;
        $score = (float) ($session->overall_score ?? 5);

        $progress = MindGymUserProgress::firstOrCreate(
            ['user_id' => $session->user_id, 'category' => $category],
            ['current_level' => 1, 'xp' => 0, 'sessions_completed' => 0, 'avg_score' => 0, 'unlocked_scenarios' => []]
        );

        $completed = $progress->sessions_completed + 1;
        $avg = (($progress->avg_score * $progress->sessions_completed) + $score) / $completed;
        $xp = $progress->xp + (int) round($score * 10);
        $level = min(5, 1 + intdiv($xp, 200));

        $unlocked = $progress->unlocked_scenarios ?? [];
        if (! in_array($session->scenario->code, $unlocked, true)) {
            $unlocked[] = $session->scenario->code;
        }

        $progress->update([
            'sessions_completed' => $completed,
            'avg_score' => round($avg, 1),
            'xp' => $xp,
            'current_level' => $level,
            'unlocked_scenarios' => $unlocked,
        ]);
    }

    private function generateFeedback(MindGymSession $session, string $reflection): string
    {
        $session->loadMissing(['scenario', 'user']);
        $user = $session->user;
        $scenario = $session->scenario;
        $lang = $user->language === 'en' ? 'English' : 'Bengali';

        if ($this->gemini->isConfigured()) {
            $prompt = <<<PROMPT
You are Mon-Songlap Mind Gym coach. Give brief supportive feedback in {$lang} (2-3 sentences).
Scenario: {$scenario->title_en}
User reflection: {$reflection}
Coping score: {$session->coping_score}, Avoidance: {$session->avoidance_score}, Overall: {$session->overall_score}/10
Do not diagnose. Encourage one small next step.
PROMPT;

            try {
                $response = Http::withHeaders([
                    'x-goog-api-key' => config('services.gemini.api_key'),
                    'Content-Type' => 'application/json',
                ])->timeout(30)->post(
                    rtrim(config('services.gemini.base_url'), '/').'/models/'.config('services.gemini.model').':generateContent',
                    [
                        'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['temperature' => 0.6, 'maxOutputTokens' => 200],
                    ]
                );

                if ($response->successful()) {
                    $text = $response->json('candidates.0.content.parts.0.text');
                    if (filled($text)) {
                        return trim($text);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Mind Gym Gemini feedback failed', ['message' => $e->getMessage()]);
            }
        }

        if ($session->overall_score >= 7) {
            return $user->language === 'en'
                ? 'Great practice session. You chose helpful coping steps — keep building on this.'
                : 'দারুণ অনুশীলন! তুমি সহায়ক পদক্ষেপ নিয়েছ — এভাবে চালিয়ে যাও।';
        }

        return $user->language === 'en'
            ? 'Thank you for trying. Next time, try naming your feeling and one small step you can take.'
            : 'চেষ্টা করার জন্য ধন্যবাদ। পরের বার অনুভূতিটা নাম করে একটা ছোট পদক্ষেপ ভাবো।';
    }

    private function assertActive(MindGymSession $session): void
    {
        abort_if($session->status !== 'active', 422, 'Session is not active');
    }
}
