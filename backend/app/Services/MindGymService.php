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
    public function listScenarios(User $user, ?array $intake = null): array
    {
        $scenarios = MindGymScenario::where('is_active', true)->orderBy('category')->get();
        $recommendedCategory = $this->recommendedCategoryFromIntake($intake)
            ?? $this->recommendedCategory($user);
        $preferredDifficulty = $this->preferredDifficultyFromIntake($intake);

        return $scenarios->map(function (MindGymScenario $s) use ($recommendedCategory, $preferredDifficulty) {
            $tags = array_map('trim', explode(',', $s->intake_tags ?? ''));
            $recommended = $s->category === $recommendedCategory
                || in_array($recommendedCategory, $tags, true);
            if ($preferredDifficulty && $s->difficulty === $preferredDifficulty) {
                $recommended = true;
            }

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
        })->sortByDesc(fn ($s) => $s['recommended'])->values()->all();
    }

    /**
     * Psychologist-style intake used to choose which simulator to show.
     *
     * @return array{intro: string, questions: array<int, array<string, mixed>>}
     */
    public function intakeQuestionnaire(User $user): array
    {
        $useBn = $this->prefersBangla($user);

        return [
            'welcomeBn' => 'আজ আপনি কোন ধরনের পরিস্থিতির অনুশীলন করতে চান?',
            'welcomeEn' => 'Which situation do you want to practice today?',
            'intro' => $useBn
                ? '১–২ মিনিটের ছোট প্রশ্ন — এগুলো থেকে আপনার Scenario Profile তৈরি হবে। কোনো উত্তরই ভুল নয়।'
                : 'A 1–2 minute intake — we build your Scenario Profile from these answers. No answer is wrong.',
            'questions' => [
                [
                    'id' => 'problem',
                    'promptBn' => 'আপনার বর্তমান সমস্যা কী?',
                    'promptEn' => 'What is your current problem?',
                    'options' => [
                        ['id' => 'exam', 'labelBn' => 'Exam Stress', 'labelEn' => 'Exam Stress'],
                        ['id' => 'presentation', 'labelBn' => 'Presentation Fear', 'labelEn' => 'Presentation Fear'],
                        ['id' => 'social', 'labelBn' => 'Social Anxiety', 'labelEn' => 'Social Anxiety'],
                        ['id' => 'interview', 'labelBn' => 'Interview Anxiety', 'labelEn' => 'Interview Anxiety'],
                        ['id' => 'conflict', 'labelBn' => 'Conflict Management', 'labelEn' => 'Conflict Management'],
                        ['id' => 'academic_stress', 'labelBn' => 'Time Management', 'labelEn' => 'Time Management'],
                        ['id' => 'confidence', 'labelBn' => 'Self Confidence', 'labelEn' => 'Self Confidence'],
                    ],
                ],
                [
                    'id' => 'intensity',
                    'promptBn' => 'এটি কতটা তীব্র? (১–৫)',
                    'promptEn' => 'How intense is it? (1–5)',
                    'options' => [
                        ['id' => '1', 'labelBn' => '⭐', 'labelEn' => '⭐'],
                        ['id' => '2', 'labelBn' => '⭐⭐', 'labelEn' => '⭐⭐'],
                        ['id' => '3', 'labelBn' => '⭐⭐⭐', 'labelEn' => '⭐⭐⭐'],
                        ['id' => '4', 'labelBn' => '⭐⭐⭐⭐', 'labelEn' => '⭐⭐⭐⭐'],
                        ['id' => '5', 'labelBn' => '⭐⭐⭐⭐⭐', 'labelEn' => '⭐⭐⭐⭐⭐'],
                    ],
                ],
                [
                    'id' => 'prior_experience',
                    'promptBn' => 'আগে কি এমন পরিস্থিতির মুখোমুখি হয়েছেন?',
                    'promptEn' => 'Have you faced this kind of situation before?',
                    'options' => [
                        ['id' => 'yes', 'labelBn' => 'Yes', 'labelEn' => 'Yes'],
                        ['id' => 'no', 'labelBn' => 'No', 'labelEn' => 'No'],
                    ],
                ],
                [
                    'id' => 'goal',
                    'promptBn' => 'আপনার লক্ষ্য কী?',
                    'promptEn' => 'What is your goal?',
                    'options' => [
                        ['id' => 'confidence', 'labelBn' => 'Confidence বাড়ানো', 'labelEn' => 'Increase Confidence'],
                        ['id' => 'calm', 'labelBn' => 'Calm থাকা', 'labelEn' => 'Stay Calm'],
                        ['id' => 'communication', 'labelBn' => 'Better Communication', 'labelEn' => 'Better Communication'],
                        ['id' => 'decision', 'labelBn' => 'Better Decision Making', 'labelEn' => 'Better Decision Making'],
                    ],
                ],
            ],
            'safeNoteBn' => 'যেকোনো সময় থামতে পারো। আত্মক্ষতি বা আত্মহত্যার চিন্তা থাকলে এখনই ১০৯৮ বা +8809604445555-এ যোগাযোগ করো।',
            'safeNoteEn' => 'You can stop anytime. If you have thoughts of self-harm or suicide, contact 1098 or +8809604445555 now.',
        ];
    }
    /**
     * @param  array<string, string>  $answers
     * @return array<string, mixed>
     */
    public function recommendFromIntake(User $user, array $answers): array
    {
        $useBn = $this->prefersBangla($user);
        $category = $this->recommendedCategoryFromIntake($answers) ?? 'exam';
        $difficulty = $this->preferredDifficultyFromIntake($answers) ?? 'easy';

        $scenario = MindGymScenario::where('is_active', true)
            ->where('category', $category)
            ->orderByRaw("CASE difficulty WHEN ? THEN 0 WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END", [$difficulty])
            ->first();

        if (! $scenario) {
            $scenario = MindGymScenario::where('is_active', true)->orderBy('id')->firstOrFail();
        }

        $why = $useBn
            ? $this->intakeRationaleBn($answers, $scenario)
            : $this->intakeRationaleEn($answers, $scenario);

        $profile = $this->buildScenarioProfile($answers, $scenario, $useBn);
        $opening = $this->openingStoryBeat($scenario, $useBn);

        return [
            'scenarioId' => (string) $scenario->id,
            'category' => $scenario->category,
            'difficulty' => $difficulty,
            'title' => $useBn ? $scenario->title_bn : $scenario->title_en,
            'setting' => $useBn ? $scenario->setting_description_bn : $scenario->setting_description_en,
            'rationale' => $why,
            'profile' => $profile,
            'openingBeat' => $opening,
            'scenario' => $this->scenarioContract($scenario),
            'scenarios' => $this->listScenarios($user, $answers),
        ];
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

    public function startSession(User $user, int $scenarioId, ?int $moodBefore = null, ?string $language = null): array
    {
        $scenario = MindGymScenario::findOrFail($scenarioId);
        $useBn = $this->prefersBangla($user, $language);
        $opening = $this->openingStoryBeat($scenario, $useBn);

        $session = MindGymSession::create([
            'user_id' => $user->id,
            'scenario_id' => $scenario->id,
            'current_node_id' => 'REFLECT_0',
            'difficulty_level' => $scenario->difficulty,
            'scenario_json' => $this->scenarioContract($scenario),
            'status' => 'active',
            'mood_before' => $moodBefore,
            'started_at' => now(),
            'transcript_json' => [[
                't' => now()->toIso8601String(),
                'type' => 'opening',
                'payload' => $opening,
            ]],
        ]);

        $state = $this->sessionState($session->fresh(['scenario']));
        $state['storyBeat'] = $opening;

        return $state;
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
        // help_seeking / empathy / conflict are tracked in events and applied in rubric scoring
        if (isset($impact['help_seeking'])) {
            $session->coping_score += (int) $impact['help_seeking'];
        }
        if (isset($impact['empathy'])) {
            $session->clarity_score += (int) $impact['empathy'];
        }
        if (isset($impact['conflict'])) {
            $session->avoidance_score += (int) $impact['conflict'];
        }

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
            $session->scores_json = $this->scoreBreakdown($session);
            $session->transcript_json = $this->normalizedTranscript($session);
            $session->confidence_signal = $this->confidenceSignal($session);
            $session->save();
            $this->updateUserProgress($session);

            $state = $this->sessionState($session->fresh(['scenario']));
            $state['choiceFeedback'] = $this->psychologistChoiceFeedback($session, $choice, $impact);

            return $state;
        }

        $session->save();
        $session->transcript_json = $this->normalizedTranscript($session);
        $session->save();
        $state = $this->sessionState($session->fresh(['scenario']));
        $state['choiceFeedback'] = $this->psychologistChoiceFeedback($session, $choice, $impact);

        return $state;
    }

    public function completeWithReflection(MindGymSession $session, string $reflection, ?int $moodAfter = null): array
    {
        $isReflective = is_array($session->scores_json)
            && (($session->scores_json['mode'] ?? '') === 'reflective');
        $isReflective = $isReflective
            || str_starts_with((string) $session->current_node_id, 'REFLECT_')
            || MindGymSessionEvent::where('session_id', $session->id)->where('event_type', 'story')->exists();

        if ($session->status === 'active') {
            $session->status = 'completed';
            $session->ended_at = now();
            $session->overall_score = $this->computeOverallScore($session);
        }

        $safetyLevel = $this->aiConfig->detectSafetyLevel($reflection);

        $session->mood_after = $moodAfter;
        $session->feedback_text = $this->generateFeedback($session, $reflection, $safetyLevel);
        if ($isReflective) {
            $questionCount = MindGymSessionEvent::where('session_id', $session->id)
                ->where('event_type', 'story')
                ->count();
            $session->scores_json = [
                'mode' => 'reflective',
                'questionCount' => $questionCount,
            ];
            $session->confidence_signal = null;
        } else {
            $session->scores_json = $this->scoreBreakdown($session);
            $session->confidence_signal = $this->confidenceSignal($session);
        }
        $session->transcript_json = $this->normalizedTranscript($session);
        $session->save();

        MindGymSessionEvent::create([
            'session_id' => $session->id,
            'event_type' => 'reflection',
            'payload' => [
                'text' => $reflection,
                'safetyLevel' => $safetyLevel,
            ],
        ]);

        if (! $isReflective) {
            $this->updateUserProgress($session);
        }

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
                ->map(function (MindGymChoice $c) use ($useBn) {
                    $impact = $c->score_impact ?? [];
                    $quality = $this->choiceQuality($impact);

                    return [
                        'id' => (string) $c->id,
                        'text' => $useBn ? $c->choice_text_bn : $c->choice_text_en,
                        'quality' => $quality,
                        'safetyHint' => $useBn
                            ? 'সব অপশন নিরাপদ অনুশীলনের জন্য — কিছু দক্ষতা শেখায়, কিছু দেখায় এড়ানো কেমন হয়।'
                            : 'All options are safe to practice — some teach skills, some show how avoidance feels.',
                    ];
                })
                ->values()
                ->all();
        }

        $sceneText = $session->current_node_id === 'N1'
            ? ($useBn ? $scenario->opening_scene_bn : $scenario->opening_scene_en)
            : null;

        $safetyLevel = $this->latestReflectionSafetyLevel($session);
        $dimensions = $session->scores_json ?: $this->scoreBreakdown($session);
        $isReflective = is_array($dimensions) && (($dimensions['mode'] ?? '') === 'reflective');
        $coach = null;
        if (! $isReflective && in_array($session->status, ['completed', 'failed'], true)) {
            $coach = $this->buildCoachSummary($session, $useBn);
        }

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
                // Reflective sessions do not surface a performance grade in the client.
                'overall' => $isReflective ? null : $session->overall_score,
                'dimensions' => $dimensions,
            ],
            'scenarioContract' => $session->scenario_json,
            'transcript' => $session->transcript_json ?? [],
            'confidenceSignal' => $isReflective ? null : $session->confidence_signal,
            'feedback' => $session->feedback_text,
            'safetyLevel' => $safetyLevel,
            'coachSummary' => $coach,
            'choiceFeedback' => null,
            'isComplete' => in_array($session->status, ['completed', 'failed'], true),
        ];
    }

    /** @param array<string, int> $impact */
    private function choiceQuality(array $impact): string
    {
        $score = ((int) ($impact['coping'] ?? 0)) * 2
            + ((int) ($impact['clarity'] ?? 0))
            + ((int) ($impact['help_seeking'] ?? 0))
            + ((int) ($impact['empathy'] ?? 0))
            - ((int) ($impact['avoidance'] ?? 0)) * 2
            - ((int) ($impact['conflict'] ?? 0));

        if ($score >= 3) {
            return 'helpful';
        }
        if ($score <= -2) {
            return 'unhelpful';
        }

        return 'mixed';
    }

    /** @param array<string, int> $impact @return array<string, mixed> */
    private function psychologistChoiceFeedback(MindGymSession $session, MindGymChoice $choice, array $impact): array
    {
        $session->loadMissing('user');
        $useBn = ($session->user->language ?? 'bn') !== 'en';
        $quality = $this->choiceQuality($impact);

        if ($quality === 'helpful') {
            return [
                'quality' => $quality,
                'title' => $useBn ? 'ভালো দক্ষতার দিকে যাচ্ছ' : 'Moving toward a helpful skill',
                'message' => $useBn
                    ? 'এই পছন্দটা চাপের মধ্যেও নিজেকে স্থিতিশীল রাখার / সাহায্য নেওয়ার দিকে নিয়ে যায়। বাস্তবেও ছোট করে এভাবে অনুশীলন করা যায়।'
                    : 'This choice moves you toward steadiness or help-seeking under pressure. You can practice the same small step in real life.',
                'betterAlternative' => null,
            ];
        }

        if ($quality === 'unhelpful') {
            $better = MindGymChoice::where('scenario_id', $choice->scenario_id)
                ->where('node_id', $choice->node_id)
                ->get()
                ->sortByDesc(fn ($c) => $this->choiceQualityScore($c->score_impact ?? []))
                ->first();

            return [
                'quality' => $quality,
                'title' => $useBn ? 'এটাও শেখার সুযোগ' : 'This is also a learning moment',
                'message' => $useBn
                    ? 'এই পছন্দটা প্রায়ই চাপ এড়ানোর মতো কাজ করে। ভুল নয় — অনেকেরই প্রথম প্রতিক্রিয়া এমন হয়। শুধু লক্ষ্য করো: এড়ালে স্বস্তি সাময়িক, দক্ষতা বাড়ে কম।'
                    : 'This choice often works like avoidance. It’s not “bad” — many first reactions look like this. Notice: relief is brief, skill growth is slower.',
                'betterAlternative' => $better && $better->id !== $choice->id
                    ? ($useBn
                        ? 'এমন ভাবলেও ভালো হতে পারত: “'.$better->choice_text_bn.'”'
                        : 'A stronger alternative could be: “'.$better->choice_text_en.'”')
                    : null,
            ];
        }

        return [
            'quality' => $quality,
            'title' => $useBn ? 'মিশ্র পদক্ষেপ' : 'A mixed step',
            'message' => $useBn
                ? 'কিছুটা সহায়ক, কিছুটা সতর্কতা। পরের ধাপে অনুভূতিটা নাম করে একটা ছোট স্পষ্ট পদক্ষেপ বেছে নিলে আরও শক্তিশালী হবে।'
                : 'Partly helpful, partly cautious. Next, name the feeling and pick one clearer small step to strengthen the practice.',
            'betterAlternative' => null,
        ];
    }

    /** @param array<string, int> $impact */
    private function choiceQualityScore(array $impact): int
    {
        return ((int) ($impact['coping'] ?? 0)) * 2
            + ((int) ($impact['clarity'] ?? 0))
            + ((int) ($impact['help_seeking'] ?? 0))
            + ((int) ($impact['empathy'] ?? 0))
            - ((int) ($impact['avoidance'] ?? 0)) * 2
            - ((int) ($impact['conflict'] ?? 0));
    }

    /** @param array<string, string>|null $intake */
    private function recommendedCategoryFromIntake(?array $intake): ?string
    {
        if (! $intake) {
            return null;
        }

        $type = $intake['problem'] ?? $intake['stress_type'] ?? 'exam';

        return match ($type) {
            'exam', 'confidence' => 'exam',
            'presentation', 'interview' => 'presentation',
            'conflict' => 'conflict',
            'social' => 'social',
            'academic_stress' => 'academic_stress',
            default => 'exam',
        };
    }

    /** @param array<string, string>|null $intake */
    private function preferredDifficultyFromIntake(?array $intake): ?string
    {
        if (! $intake) {
            return null;
        }
        $intensity = (int) ($intake['intensity'] ?? 3);
        $prior = $intake['prior_experience'] ?? 'no';

        if ($intensity >= 4 || $prior === 'no') {
            return 'easy';
        }
        if ($intensity <= 2 && $prior === 'yes') {
            return 'medium';
        }

        return 'easy';
    }

    /** @param array<string, string> $answers */
    private function intakeRationaleBn(array $answers, MindGymScenario $scenario): string
    {
        $map = [
            'exam' => 'পরীক্ষা/রিজাল্টের চাপ',
            'presentation' => 'কথা বলা/প্রেজেন্টেশনের চাপ',
            'conflict' => 'সম্পর্কের টেনশন',
            'social' => 'সামাজিক একাকিত্ব/লজ্জা',
            'academic_stress' => 'ডেডলাইন চাপ',
        ];
        $label = $map[$scenario->category] ?? 'চাপের পরিস্থিতি';

        return "তোমার উত্তর অনুযায়ী এখন “{$label}” নিয়ে নিরাপদ অনুশীলন উপযোগী। সিমুলেটর: {$scenario->title_bn}। মনে রেখো — এখানে ভুল উত্তর নেই; প্রতিটি পছন্দ থেকে আমরা শিখি।";
    }

    /** @param array<string, string> $answers */
    private function intakeRationaleEn(array $answers, MindGymScenario $scenario): string
    {
        return "Based on your answers, practicing “{$scenario->category}” in a safe space fits best right now. Simulator: {$scenario->title_en}. Remember — there are no wrong answers; every choice is material to learn from.";
    }

    /** @return array<string, mixed> */
    private function buildCoachSummary(MindGymSession $session, bool $useBn): array
    {
        $choiceEvents = MindGymSessionEvent::where('session_id', $session->id)
            ->where('event_type', 'choice')
            ->orderBy('id')
            ->get();

        $choiceCount = $choiceEvents->count();
        $seconds = ($session->started_at && $session->ended_at)
            ? max(1, $session->started_at->diffInSeconds($session->ended_at))
            : null;
        $pacingSec = $choiceCount > 0 && $seconds ? round($seconds / max(1, $choiceCount), 1) : null;

        $strength = $session->coping_score >= $session->clarity_score
            ? ($useBn ? 'মোকাবিলা (coping)' : 'Coping')
            : ($useBn ? 'স্বচ্ছতা (clarity)' : 'Clarity');

        $focus = $session->avoidance_score >= 3
            ? ($useBn ? 'এড়িয়ে যাওয়া কমাও' : 'Reduce avoidance')
            : ($useBn ? 'ছোট পরবর্তী পদক্ষেপ' : 'One small next step');

        $pacingTip = $useBn
            ? 'চাপের মুহূর্তে একটা শ্বাস + একটা পদক্ষেপ — তাড়াহুড়ো করো না।'
            : 'In stress: one breath + one step — don’t rush decisions.';

        if ($pacingSec !== null && $pacingSec < 4) {
            $pacingTip = $useBn
                ? 'এই সেশনে সিদ্ধান্ত দ্রুত ছিল। পরের বারে এক মুহূর্ত থেমে অনুভূতি নাম করো।'
                : 'You decided quickly. Next time pause one beat and name the feeling.';
        } elseif ($pacingSec !== null && $pacingSec > 25) {
            $pacingTip = $useBn
                ? 'সতর্ক চিন্তা ভালো — তবে লম্বা দ্বিধা এড়াতে একটা ছোট নির্ধারিত পদ্ধতি অনুসরণ করো।'
                : 'Careful thinking is good — use a small decision script to avoid long freeze.';
        }

        $nextDifficulty = $session->overall_score !== null && $session->overall_score >= 7.5
            ? 'hard'
            : (($session->overall_score !== null && $session->overall_score < 4.5) ? 'easy' : 'medium');

        return [
            'strength' => $strength,
            'focusArea' => $focus,
            'pacingSecondsPerChoice' => $pacingSec,
            'pacingTip' => $pacingTip,
            'choiceCount' => $choiceCount,
            'suggestedNextDifficulty' => $nextDifficulty,
            'xpEarned' => (int) round(((float) ($session->overall_score ?? 5)) * 10),
        ];
    }

    private function latestReflectionSafetyLevel(MindGymSession $session): string
    {
        $event = MindGymSessionEvent::where('session_id', $session->id)
            ->where('event_type', 'reflection')
            ->latest()
            ->first();

        return $event?->payload['safetyLevel'] ?? 'none';
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

    public function computeOverallScore(MindGymSession $session): float
    {
        $rubric = $this->loadRubric();
        $weights = $rubric['scoring']['weights'] ?? [
            'coping' => 2.0,
            'clarity' => 1.0,
            'avoidance' => -1.0,
            'help_seeking' => 0.5,
            'empathy' => 0.5,
            'conflict' => -0.5,
        ];

        $totals = [
            'coping' => 0,
            'clarity' => 0,
            'avoidance' => 0,
            'help_seeking' => 0,
            'empathy' => 0,
            'conflict' => 0,
        ];

        $events = MindGymSessionEvent::where('session_id', $session->id)
            ->where('event_type', 'choice')
            ->get();

        foreach ($events as $event) {
            $impact = $event->payload['impact'] ?? [];
            foreach ($totals as $key => $_) {
                $totals[$key] += (int) ($impact[$key] ?? 0);
            }
        }

        // Fallback to session counters if no events yet
        if ($events->isEmpty()) {
            $totals['coping'] = (int) $session->coping_score;
            $totals['clarity'] = (int) $session->clarity_score;
            $totals['avoidance'] = (int) $session->avoidance_score;
        }

        $weighted = 0.0;
        foreach ($weights as $key => $weight) {
            $weighted += ((float) $weight) * ((float) ($totals[$key] ?? 0));
        }

        $normalized = 5 + ($weighted / 3.0);
        $penalty = (float) ($rubric['scoring']['failed_session_penalty'] ?? -2);
        if ($session->status === 'failed') {
            $normalized += $penalty;
        }

        return round(max(1, min(10, $normalized)), 1);
    }

    /** @return array<string, mixed> */
    private function loadRubric(): array
    {
        $path = storage_path('app/ai/mind_gym_clinical_rubric_v1.json');
        if (! is_file($path)) {
            return [];
        }

        return json_decode((string) file_get_contents($path), true) ?: [];
    }

    public function rubricMeta(): array
    {
        $rubric = $this->loadRubric();

        return [
            'version' => $rubric['version'] ?? 'unknown',
            'status' => $rubric['status'] ?? 'missing',
            'effectiveFrom' => $rubric['effective_from'] ?? null,
            'disclaimer' => $rubric['disclaimer'] ?? null,
        ];
    }

    /** @return array<string, mixed> */
    public function betaAnalytics(): array
    {
        $sessions = MindGymSession::query()
            ->whereIn('status', ['completed', 'failed'])
            ->with('scenario')
            ->get();

        $byCategory = [];
        foreach ($sessions as $session) {
            $cat = $session->scenario?->category ?? 'unknown';
            if (! isset($byCategory[$cat])) {
                $byCategory[$cat] = ['sessions' => 0, 'scoreSum' => 0.0, 'completed' => 0];
            }
            $byCategory[$cat]['sessions']++;
            $byCategory[$cat]['scoreSum'] += (float) ($session->overall_score ?? 0);
            if ($session->status === 'completed') {
                $byCategory[$cat]['completed']++;
            }
        }

        $categoryStats = [];
        foreach ($byCategory as $cat => $row) {
            $categoryStats[] = [
                'category' => $cat,
                'sessions' => $row['sessions'],
                'avgScore' => $row['sessions'] > 0 ? round($row['scoreSum'] / $row['sessions'], 1) : 0,
                'completionRate' => $row['sessions'] > 0
                    ? round(100 * $row['completed'] / $row['sessions'], 1)
                    : 0,
            ];
        }

        $feedbackCount = \App\Models\FeedbackSubmission::query()
            ->where('message', 'like', '%[Mind Gym Beta]%')
            ->count();

        $dimKeys = ['tone_control', 'clarity', 'decision_quality', 'pacing', 'confidence_signal'];
        $dimSums = array_fill_keys($dimKeys, 0.0);
        $dimN = 0;
        foreach ($sessions as $session) {
            if (! is_array($session->scores_json)) {
                continue;
            }
            foreach ($dimKeys as $key) {
                $dimSums[$key] += (float) ($session->scores_json[$key] ?? 0);
            }
            $dimN++;
        }
        $dimAvg = [];
        foreach ($dimKeys as $key) {
            $dimAvg[$key] = $dimN > 0 ? round($dimSums[$key] / $dimN, 1) : 0;
        }

        return [
            'protocol' => $this->rubricMeta(),
            'totalSessions' => $sessions->count(),
            'uniqueUsers' => $sessions->pluck('user_id')->unique()->count(),
            'avgOverallScore' => $sessions->count() > 0
                ? round((float) $sessions->avg('overall_score'), 1)
                : 0,
            'completionRate' => $sessions->count() > 0
                ? round(100 * $sessions->where('status', 'completed')->count() / $sessions->count(), 1)
                : 0,
            'betaFeedbackCount' => $feedbackCount,
            'dimensionAverages' => $dimAvg,
            'byCategory' => $categoryStats,
            'corpusNote' => 'Includes pathway-valid proxy pilot sessions until replaced by consented student beta.',
        ];
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
        foreach ($this->milestoneUnlocks($category, $level) as $code) {
            if (! in_array($code, $unlocked, true)) {
                $unlocked[] = $code;
            }
        }

        $progress->update([
            'sessions_completed' => $completed,
            'avg_score' => round($avg, 1),
            'xp' => $xp,
            'current_level' => $level,
            'unlocked_scenarios' => $unlocked,
        ]);
    }

    /** @return array<int, string> */
    private function milestoneUnlocks(string $category, int $level): array
    {
        $map = [
            'presentation' => [3 => ['SCN_010'], 4 => ['SCN_002']],
            'exam' => [3 => ['SCN_006'], 4 => ['SCN_001']],
            'conflict' => [3 => ['SCN_009'], 4 => ['SCN_003']],
            'social' => [3 => ['SCN_005', 'SCN_007']],
            'academic_stress' => [3 => ['SCN_004'], 4 => ['SCN_008']],
        ];
        $result = [];
        foreach (($map[$category] ?? []) as $minLevel => $codes) {
            if ($level >= $minLevel) {
                $result = array_merge($result, $codes);
            }
        }

        return array_values(array_unique($result));
    }

    private function generateFeedback(MindGymSession $session, string $reflection, string $safetyLevel = 'none'): string
    {
        $session->loadMissing(['scenario', 'user']);
        $user = $session->user;
        $useBn = ($user->language ?? 'bn') !== 'en';

        if (in_array($safetyLevel, ['high', 'moderate'], true)) {
            return $useBn
                ? 'তোমার কথা শেয়ার করার জন্য ধন্যবাদ। তুমি একা নও। এখনই ১০৯৮ বা কান পেতে রই (+8809604445555) নম্বরে যোগাযোগ করো। একজন কাউন্সেলর তোমাকে সাহায্য করতে পারে। এই সেশন রোগ নির্ণয় বা থেরাপি নয়।'
                : 'Thank you for sharing. You are not alone. Please reach out now — 1098 or Kaan Pete Roi +8809604445555. A counselor can support you. This session is not diagnosis or therapy.';
        }

        $scenario = $session->scenario;
        $storyTrail = $this->storyTranscriptForPrompt($session);
        $lang = $useBn ? 'Bengali' : 'English';
        $languageLock = $useBn
            ? 'Write the entire summary in Bangla (Bengali script). Do not write English paragraphs.'
            : 'Write the entire summary in English only.';
        $prompt = <<<PROMPT
You are a calm reflective facilitator for Mind Gym (not a licensed clinician, not a diagnostic tool).
Write a professional reflective summary in {$lang} (7-10 short paragraphs or dense sentences).
{$languageLock}
Tone: clear, grounded, supportive — not poetic sermon, not mystical jargon.

Hard rules:
- Never diagnose, label a disorder, score, grade, rank, or say answers were right/wrong.
- Never claim to be a psychiatrist/psychologist/therapist.
- Base the summary ONLY on the session conversation.
- Tone: supportive, balanced, curious, non-judgmental, meaningfully reflective.

Include:
1) Themes that appeared in the user's responses
2) Strengths in their thinking/communication
3) Areas that may benefit from further reflection (gentle)
4) Alternative viewpoints they may not have considered
5) Practical strategies for similar real-life situations
6) Clear disclaimer: this is for self-reflection and skill development, not diagnosis or therapy
7) Gentle note that if distress is persistent they may consider speaking with a qualified professional (AI cannot determine whether that is needed)

Scenario: {$scenario->title_en} ({$scenario->category})
Optional closing note from user: {$reflection}

Conversation:
{$storyTrail}
PROMPT;

        $groqKeys = config('services.groq.api_keys', []);
        if (is_array($groqKeys) && count($groqKeys) > 0) {
            try {
                $url = rtrim(config('services.groq.base_url'), '/').'/chat/completions';
                $resp = Http::withToken($groqKeys[0])->timeout(50)->post($url, [
                    'model' => config('services.groq.model'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Reflective facilitator only. No diagnosis, no therapy claims, no scoring. '
                                .($useBn ? 'Respond entirely in Bengali script.' : 'Respond entirely in English.'),
                        ],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.5,
                    'max_tokens' => 700,
                ]);
                $text = $resp->json('choices.0.message.content');
                if (filled($text)) {
                    $summary = trim($text);
                    if ($useBn && ! $this->looksLikeBangla($summary)) {
                        return $this->fallbackReflectiveSummary($session, $reflection, true);
                    }

                    return $summary;
                }
            } catch (\Throwable $e) {
                Log::warning('Mind Gym reflective summary Groq failed', ['message' => $e->getMessage()]);
            }
        }

        return $this->fallbackReflectiveSummary($session, $reflection, $useBn);
    }

    /** @return array<string, mixed> */
    private function scenarioContract(MindGymScenario $scenario): array
    {
        $roles = array_values(array_filter(array_map('trim', explode(',', (string) $scenario->npc_roles))));
        $difficulty = match ($scenario->difficulty) {
            'easy' => 3,
            'hard' => 8,
            default => 5,
        };

        return [
            'schemaVersion' => 'mindgym.scenario.v1',
            'scenario_id' => $scenario->code,
            'title' => $scenario->title_en,
            'environment' => $scenario->category,
            'difficulty' => $difficulty,
            'npcs' => array_map(fn ($r, $i) => [
                'id' => 'npc_'.($i + 1),
                'role' => $r,
                'personality' => 'supportive',
                'initial_tone' => 'neutral',
            ], $roles, array_keys($roles)),
            'opening_situation' => $scenario->opening_scene_en,
            'objective' => 'Practice one calm and clear response under pressure.',
            'success_criteria' => [
                'Names feeling or stress clearly',
                'Takes one coping/help-seeking action',
                'Avoids escalation or withdrawal where possible',
            ],
            'time_limit_seconds' => max(120, (int) $scenario->duration_minutes * 60),
        ];
    }

    /** @return array<string, mixed> */
    private function scoreBreakdown(MindGymSession $session): array
    {
        $seconds = ($session->started_at && $session->ended_at)
            ? max(1, $session->started_at->diffInSeconds($session->ended_at))
            : 0;
        $choiceCount = max(1, MindGymSessionEvent::where('session_id', $session->id)->where('event_type', 'choice')->count());
        $paceSec = $seconds > 0 ? $seconds / $choiceCount : 0;

        $toneControl = (int) max(0, min(100, 50 + (($session->coping_score - $session->avoidance_score) * 8)));
        $clarity = (int) max(0, min(100, 45 + ($session->clarity_score * 10)));
        $decisionQuality = (int) max(0, min(100, 50 + (($session->coping_score * 8) - ($session->avoidance_score * 7))));
        $pacing = (int) max(0, min(100, $paceSec === 0 ? 60 : (100 - min(80, abs(12 - $paceSec) * 4))));
        $confidenceSignal = (int) max(0, min(100, 40 + (($session->coping_score + $session->clarity_score) * 7)));

        return [
            'tone_control' => $toneControl,
            'clarity' => $clarity,
            'decision_quality' => $decisionQuality,
            'pacing' => $pacing,
            'confidence_signal' => $confidenceSignal,
            'overall_weighted' => (float) ($session->overall_score ?? 0),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function normalizedTranscript(MindGymSession $session): array
    {
        $rows = [];
        foreach ($session->transcript_json ?? [] as $row) {
            if (is_array($row) && ($row['type'] ?? '') === 'opening') {
                $rows[] = $row;
                break;
            }
        }

        $events = MindGymSessionEvent::where('session_id', $session->id)->orderBy('id')->get();
        foreach ($events as $event) {
            $rows[] = [
                't' => $event->created_at?->toIso8601String(),
                'type' => $event->event_type,
                'payload' => $event->payload,
            ];
        }

        return $rows;
    }

    private function confidenceSignal(MindGymSession $session): string
    {
        $score = (float) ($session->overall_score ?? 5);
        if ($score >= 7.5) {
            return 'high';
        }
        if ($score >= 4.5) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Reflective turn: one open question at a time, contextual follow-ups, no scoring/judgment.
     *
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function npcTurn(array $context, string $studentInput): array
    {
        $category = (string) ($context['category'] ?? 'exam');
        $turn = (int) ($context['turn'] ?? 0);
        $useBn = (($context['language'] ?? 'bn') !== 'en');
        $history = is_array($context['history'] ?? null) ? $context['history'] : [];
        $opening = (string) ($context['opening'] ?? '');
        $minTurns = 6;
        $maxTurns = 10;
        $nextTurn = $turn + 1;
        $isComplete = $nextTurn >= $maxTurns
            || ($nextTurn >= $minTurns && $this->userSignalsReadyToClose($studentInput));

        $ai = $this->generateReflectiveTurn(
            $category,
            $opening,
            $history,
            $studentInput,
            $turn,
            $useBn,
            $isComplete
        );
        $image = $this->imageForBeat($category, min($nextTurn, 3));

        return [
            'dialogue' => $ai['acknowledgement'],
            'emotion_tag' => 'reflective',
            'internal_difficulty_adjust' => 0,
            'narration' => $ai['acknowledgement'],
            'challenge' => '',
            'askPrompt' => $ai['question'],
            'imageUrl' => $image,
            'turn' => $nextTurn,
            'isComplete' => $isComplete,
            'questionNumber' => $isComplete ? $nextTurn : min($nextTurn + 1, $maxTurns),
            'targetQuestions' => $maxTurns,
        ];
    }

    /**
     * Persist reflective free-text turn on an active session.
     *
     * @return array<string, mixed>
     */
    public function storyTurn(MindGymSession $session, string $studentInput, ?string $language = null): array
    {
        $this->assertActive($session);
        $session->loadMissing(['scenario', 'user']);
        $useBn = $this->prefersBangla($session->user, $language);
        $category = $session->scenario->category;
        $turn = MindGymSessionEvent::where('session_id', $session->id)->where('event_type', 'story')->count();
        $history = $this->storyHistoryPairs($session);
        $opening = $useBn
            ? ($session->scenario->opening_scene_bn.' '.$session->scenario->setting_description_bn)
            : ($session->scenario->opening_scene_en.' '.$session->scenario->setting_description_en);

        $beat = $this->npcTurn([
            'category' => $category,
            'turn' => $turn,
            'language' => $useBn ? 'bn' : 'en',
            'history' => $history,
            'opening' => $opening,
        ], $studentInput);

        MindGymSessionEvent::create([
            'session_id' => $session->id,
            'event_type' => 'story',
            'payload' => [
                'studentInput' => $studentInput,
                'beat' => $beat,
            ],
        ]);

        $session->current_node_id = $beat['isComplete'] ? 'END_OK' : ('REFLECT_'.$beat['turn']);
        if ($beat['isComplete']) {
            $session->status = 'completed';
            $session->ended_at = now();
            // Keep numeric fields for existing analytics/progress, but do not surface as grading UX.
            $session->overall_score = $this->computeOverallScore($session);
            $session->scores_json = [
                'mode' => 'reflective',
                'questionCount' => $beat['turn'],
            ];
            $session->transcript_json = $this->normalizedTranscript($session);
            $session->confidence_signal = null;
            // Reflective summary is generated after an optional closing note via completeWithReflection.
            $session->feedback_text = null;
            $session->save();
            $this->updateUserProgress($session);
        } else {
            $session->transcript_json = $this->normalizedTranscript($session);
            $session->save();
        }

        $state = $this->sessionState($session->fresh(['scenario']));
        $state['storyBeat'] = $beat;

        return $state;
    }

    /** @return array<string, mixed> */
    private function buildScenarioProfile(array $answers, MindGymScenario $scenario, bool $useBn): array
    {
        $problem = $answers['problem'] ?? $answers['stress_type'] ?? $scenario->category;
        $goal = $answers['goal'] ?? $answers['practice_goal'] ?? 'confidence';
        $problemLabel = match ($problem) {
            'presentation' => $useBn ? 'Presentation Anxiety' : 'Presentation Anxiety',
            'exam' => $useBn ? 'Exam Stress' : 'Exam Stress',
            'social' => $useBn ? 'Social Anxiety' : 'Social Anxiety',
            'interview' => $useBn ? 'Interview Anxiety' : 'Interview Anxiety',
            'conflict' => $useBn ? 'Conflict Management' : 'Conflict Management',
            'academic_stress' => $useBn ? 'Time Management' : 'Time Management',
            'confidence' => $useBn ? 'Self Confidence' : 'Self Confidence',
            default => $scenario->category,
        };
        $goalLabel = match ($goal) {
            'confidence' => $useBn ? 'Confidence বাড়ানো' : 'Increase Confidence',
            'calm' => $useBn ? 'Calm থাকা' : 'Stay Calm',
            'communication' => 'Better Communication',
            'decision' => 'Better Decision Making',
            default => $goal,
        };

        return [
            'problem' => $problemLabel,
            'difficulty' => $this->preferredDifficultyFromIntake($answers) ?? $scenario->difficulty,
            'goal' => $goalLabel,
            'intensity' => (int) ($answers['intensity'] ?? 3),
            'priorExperience' => $answers['prior_experience'] ?? null,
            'imageUrl' => $this->imageForBeat($scenario->category, 0),
            'imagePrompt' => $this->imagePromptForCategory($scenario->category),
        ];
    }

    /** @return array<string, mixed> */
    private function openingStoryBeat(MindGymScenario $scenario, bool $useBn): array
    {
        $setting = $useBn ? $scenario->setting_description_bn : $scenario->setting_description_en;
        $opening = $useBn ? $scenario->opening_scene_bn : $scenario->opening_scene_en;
        $story = trim($setting.' '.$opening);
        $firstQuestion = $this->generateOpeningQuestion(
            $scenario->category,
            $story,
            $useBn
        );

        return [
            'dialogue' => '',
            'emotion_tag' => 'reflective',
            'narration' => $story,
            'challenge' => '',
            'askPrompt' => $firstQuestion,
            'imageUrl' => $this->imageForBeat($scenario->category, 0),
            'turn' => 0,
            'isComplete' => false,
            'questionNumber' => 1,
            'targetQuestions' => 10,
        ];
    }

    private function generateOpeningQuestion(string $category, string $story, bool $useBn): string
    {
        $fallback = $this->safeFallbackQuestion($useBn, random_int(0, 40));
        $lang = $useBn ? 'Bengali' : 'English';
        $apiKey = $this->firstGroqApiKey();
        if (! $apiKey) {
            return $fallback;
        }

        $angles = [
            'what stands out first',
            'first thoughts that appear',
            'what feels unclear or important',
            'what the person notices in the moment',
            'possible next considerations without deciding for them',
        ];
        $angle = $angles[array_rand($angles)];

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                $prompt = "Create ONE opening reflective interview question for Mind Gym in {$lang}. "
                    ."Category: {$category}. Angle: {$angle}. "
                    ."Scenario story:\n{$story}\n\n"
                    .'Rules: open-ended, non-leading, non-diagnostic, no assumptions about feelings. '
                    .'Do not reuse generic wording like "what stands out to you most" every time — vary the phrasing. '
                    .($useBn
                        ? 'Write ONLY in Bengali script. Return strict JSON: {"question":"..."}'
                        : 'Write ONLY in English. Return strict JSON: {"question":"..."}');

                $resp = Http::withToken($apiKey)->timeout(35)->post(
                    rtrim(config('services.groq.base_url'), '/').'/chat/completions',
                    [
                        'model' => config('services.groq.model'),
                        'messages' => [
                            ['role' => 'system', 'content' => 'Output strict JSON only with key question.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => 0.85,
                        'max_tokens' => 180,
                    ]
                );
                $text = $resp->json('choices.0.message.content');
                if (! is_string($text) || ! str_contains($text, '{')) {
                    continue;
                }
                $json = json_decode($text, true);
                $question = trim((string) ($json['question'] ?? ''));
                if ($this->isValidMindGymQuestion($question, $useBn)) {
                    return $this->sanitizeMindGymQuestion($question, $useBn, 0, []);
                }
            } catch (\Throwable $e) {
                Log::warning('MindGym opening question generation failed', [
                    'attempt' => $attempt,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $fallback;
    }

    private function imageForBeat(string $category, int $beat): string
    {
        // Beat- Progressive image match: opening scene → related moments in the same scenario family.
        $map = [
            'exam' => ['exam', 'result_day', 'deadline', 'exam'],
            'presentation' => ['presentation', 'ask_teacher', 'interview', 'presentation'],
            'conflict' => ['conflict', 'roommate', 'conflict', 'social'],
            'social' => ['social', 'lonely_campus', 'group_study', 'ask_teacher'],
            'academic_stress' => ['academic_stress', 'deadline', 'exam', 'academic_stress'],
            'interview' => ['interview', 'presentation', 'ask_teacher', 'interview'],
        ];
        $keys = $map[$category] ?? $map['exam'];
        $key = $keys[min(max(0, $beat), count($keys) - 1)];

        return '/images/mind-gym/'.$key.'.jpg';
    }

    private function imagePromptForCategory(string $category): string
    {
        return match ($category) {
            'presentation' => 'Generate an image of a university classroom where a student is about to give a presentation in front of 40 students. Some students are attentive, a teacher is sitting in front, projector is on.',
            'exam' => 'Generate an image of a large exam hall with ticking clock, students writing, one student looking anxious.',
            'conflict' => 'Generate an image of a campus cafe with two friends in a tense conversation over a project.',
            'social' => 'Generate an image of lunch break on campus where a student hesitates before joining a group.',
            'academic_stress' => 'Generate an image of a dorm room at 2AM with laptop open and unfinished assignment.',
            'interview' => 'Generate an image of a formal campus job interview with two interviewers and a student candidate.',
            default => 'Generate an image of a student practicing a stressful campus situation safely.',
        };
    }

    /**
     * @param  array<int, array{question?: string, answer?: string}>  $history
     * @return array{acknowledgement: string, question: string}
     */
    private function generateReflectiveTurn(
        string $category,
        string $opening,
        array $history,
        string $studentInput,
        int $turn,
        bool $useBn,
        bool $isComplete
    ): array {
        $previousQuestions = [];
        foreach ($history as $pair) {
            $prev = trim((string) ($pair['question'] ?? ''));
            if ($prev !== '') {
                $previousQuestions[] = $prev;
            }
        }
        $fallback = $this->fallbackReflectiveTurn($category, $turn, $useBn, $studentInput, $isComplete, $previousQuestions);
        if ($isComplete) {
            return $fallback;
        }

        $historyText = '';
        foreach ($history as $i => $pair) {
            $historyText .= 'Q'.($i + 1).': '.($pair['question'] ?? '')."\n";
            $historyText .= 'A'.($i + 1).': '.($pair['answer'] ?? '')."\n";
        }
        $alreadyAsked = $previousQuestions === []
            ? '(none yet)'
            : implode("\n- ", $previousQuestions);
        $lang = $useBn ? 'Bengali' : 'English';
        $nextDepth = $turn + 2;
        $focus = $this->reflectiveFocusForTurn($turn + random_int(0, 3));
        $depthNote = $turn < 2
            ? 'Keep the question gently exploratory (early session — build trust first; do not push deep vulnerability).'
            : ($turn < 5
                ? 'You may go a little deeper, still without assuming emotions or pushing vulnerability.'
                : 'A deeper exploratory question is allowed only if it stays non-leading and non-assumptive.');

        $qualityRules = $this->mindGymQuestionQualityRules();
        $languageRule = $useBn
            ? 'LANGUAGE RULE (mandatory): Write acknowledgement and question in Bangla (Bengali script). Do NOT use English. Everyday Bangla is preferred.'
            : 'LANGUAGE RULE (mandatory): Write acknowledgement and question in English only.';

        if ($this->firstGroqApiKey()) {
            $acknowledgement = $fallback['acknowledgement'];
            $question = '';
            $maxAttempts = 4;

            for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
                try {
                    $rejectHint = '';
                    if ($question !== '') {
                        if (! $this->isValidMindGymQuestion($question, $useBn)) {
                            $rejectHint = "Previous question was rejected for quality/language rules. Regenerate a cleaner exploratory question in {$lang}. Rejected: {$question}\n";
                        } elseif ($this->isTooSimilarToPrevious($question, $previousQuestions)) {
                            $rejectHint = "Previous question was too similar to earlier ones. Create a NEW unique question with different wording. Rejected: {$question}\n";
                        }
                    }
                    $prompt = "You facilitate Mind Gym reflective interviewing in {$lang}. "
                        .'Style: calm, professional, curious, evidence-informed psychological interviewing. '
                        .'You are NOT a clinician, motivator, poet, or life coach. Never diagnose, score, judge, or label. '
                        .$languageRule.' '
                        ."Scenario:\n{$opening}\n\nPrior turns:\n{$historyText}\nLatest answer:\n{$studentInput}\n\n"
                        ."Already asked questions (DO NOT repeat or paraphrase closely):\n- {$alreadyAsked}\n\n"
                        ."Turn depth {$nextDepth} of ~6-10. Focus theme for this turn: {$focus}. {$depthNote}\n"
                        .$rejectHint
                        .'Return JSON with: acknowledgement (1-2 short neutral-empathic lines that reference what they said WITHOUT inventing feelings they did not name), '
                        .'question (ONE fresh open-ended exploratory question only — unique wording, not used before). '
                        .$qualityRules
                        .' Connect the question to the scenario and their last answer. One question only.';

                    $resp = Http::withToken($this->firstGroqApiKey())->timeout(40)->post(
                        rtrim(config('services.groq.base_url'), '/').'/chat/completions',
                        [
                            'model' => config('services.groq.model'),
                            'messages' => [
                                [
                                    'role' => 'system',
                                    'content' => 'Output strict JSON only with keys acknowledgement and question. '
                                        .($useBn
                                            ? 'Both values MUST be written in Bengali script. No English sentences.'
                                            : 'Both values MUST be written in English.')
                                        .' Every question must be unique, never copy previous questions, and invite exploration without assumptions, leading, optimism pressure, poetry, or diagnosis.',
                                ],
                                ['role' => 'user', 'content' => $prompt],
                            ],
                            'temperature' => min(0.95, 0.7 + ($attempt * 0.05)),
                            'max_tokens' => 360,
                        ]
                    );
                    $text = $resp->json('choices.0.message.content');
                    if (! is_string($text) || ! str_contains($text, '{')) {
                        continue;
                    }
                    $json = json_decode($text, true);
                    if (! is_array($json) || ! isset($json['acknowledgement'])) {
                        continue;
                    }
                    $acknowledgement = $this->sanitizeMindGymAcknowledgement((string) $json['acknowledgement'], $useBn);
                    $question = trim((string) ($json['question'] ?? ''));
                    if (
                        $this->isValidMindGymQuestion($question, $useBn)
                        && ! $this->isTooSimilarToPrevious($question, $previousQuestions)
                    ) {
                        return [
                            'acknowledgement' => $acknowledgement,
                            'question' => $this->sanitizeMindGymQuestion($question, $useBn, $turn, $previousQuestions),
                        ];
                    }
                } catch (\Throwable $e) {
                    Log::warning('MindGym reflective turn attempt failed', [
                        'attempt' => $attempt,
                        'message' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('MindGym question validation used fallback', ['category' => $category, 'turn' => $turn]);
        }

        return [
            'acknowledgement' => $fallback['acknowledgement'],
            'question' => $this->sanitizeMindGymQuestion($fallback['question'], $useBn, $turn, $previousQuestions),
        ];
    }

    private function firstGroqApiKey(): ?string
    {
        $keys = config('services.groq.api_keys', []);
        if (! is_array($keys) || count($keys) === 0) {
            // Compatibility with older configs that used services.groq.api_keys.0 style.
            $legacy = config('services.groq.api_keys.0');

            return filled($legacy) ? (string) $legacy : null;
        }

        foreach ($keys as $key) {
            if (filled($key)) {
                return (string) $key;
            }
        }

        return null;
    }

    private function mindGymQuestionQualityRules(): string
    {
        return 'QUALITY RULES (mandatory): '
            .'1) Never assume the user\'s thoughts, emotions, beliefs, intentions, or mental state. Invite exploration. '
            .'2) No leading questions that push a conclusion (e.g. "What hope can you find?", "Why is this actually good?", "Isn\'t this an opportunity to grow?", "What lesson did this teach you?"). '
            .'3) No forced optimism/reframing; do not imply every hardship has meaning, growth, healing, or a positive outcome. '
            .'4) No emotionally manipulative or overly poetic/motivational language. '
            .'5) No philosophy puzzles; keep reflection realistic and concrete to the scenario. '
            .'6) Never claim "You are protecting yourself/afraid/avoiding...", "Your heart wants...", "Your inner child...", "The answer is already inside you...". '
            .'7) Never tell the user what they feel before they say it. '
            .'8) Prefer openings like: What stands out...?, What thoughts came first...?, What made that moment difficult...?, What options do you notice...?, What feels most important...?, What influenced that...?, What would you want to understand better...?, What possibilities have you not considered yet...? '
            .'9) One open-ended question only; no yes/no; no multiple unrelated questions. '
            .'10) No diagnosis, personality evaluation, trauma inference, disorder labels. '
            .'11) Do not pressure vulnerability; brief answers are fine. '
            .'12) Quotes/philosophers only rarely and must not steer the conversation. '
            .'13) Vary focus across turns (emotions, decisions, values, priorities, communication, uncertainty, consequences, relationships, assumptions, expectations, strengths, alternatives). '
            .'14) Never repeat wording from prior turns. Never paraphrase an already-asked question. Every question must feel newly generated for this exact conversation.';
    }

    private function reflectiveFocusForTurn(int $turn): string
    {
        $foci = [
            'what stands out / first thoughts',
            'what made the moment difficult or complex',
            'options and decisions noticed',
            'values and priorities',
            'communication or relationship angle',
            'assumptions, expectations, or uncertainty',
            'possible consequences',
            'alternative perspectives',
            'personal strengths or resources the user already mentioned',
            'what they want to understand better about their own reaction',
        ];

        return $foci[$turn % count($foci)];
    }

    private function isValidMindGymQuestion(string $question, bool $useBn = true): bool
    {
        $q = trim($question);
        if ($q === '' || mb_strlen($q) < 12) {
            return false;
        }

        // Language lock: Bangla sessions must not surface English questions.
        if ($useBn && ! $this->looksLikeBangla($q)) {
            return false;
        }
        if (! $useBn && $this->looksLikeBangla($q) && ! preg_match('/[A-Za-z]/', $q)) {
            return false;
        }

        // Multiple question marks often mean stacked questions.
        if (substr_count($q, '?') > 1 || substr_count($q, '؟') > 1) {
            return false;
        }

        $lower = mb_strtolower($q);

        $banned = [
            // Leading optimism / forced meaning
            'what hope can you find',
            'hope can you find',
            'why is this actually a good',
            'isn\'t this an opportunity',
            'is this an opportunity to grow',
            'what lesson did this teach',
            'what lesson is this teaching',
            'silver lining',
            'blessing in disguise',
            'meant to happen',
            'everything happens for a reason',
            'grow from this',
            'opportunity to grow',
            'find the gift',
            'find meaning in',
            'আশা খুঁজে',
            'এটা আসলে ভালো',
            'সুযোগ নয় কি',
            'কী শিক্ষা দিয়েছে',
            'কী শিক্ষা দিচ্ছে',
            'আশীর্বাদ',
            'অর্থ খুঁজে',
            // Assumptive / mind-reading
            'you are protecting',
            'you\'re protecting',
            'you are afraid because',
            'you\'re afraid because',
            'you are avoiding',
            'you\'re avoiding',
            'your heart wants',
            'your inner child',
            'the answer is already inside',
            'deep down you',
            'what your soul',
            'what your heart is telling',
            'what fear is whispering',
            'তোমার হৃদয় চায়',
            'তুমি নিজেকে রক্ষা',
            'তুমি এড়াচ্ছ',
            'তুমি ভয় পাচ্ছ কারণ',
            'উত্তর ইতিমধ্যে ভেতরে',
            'আভ্যন্তরীণ শিশু',
            // Overly poetic / motivational speaker tropes
            'unexpected guest',
            'wound is where the light',
            'light enters',
            'river of conversation',
            'doorway of the heart',
            'ocean of',
            'whisper to your soul',
            'listen to your heart',
            'what is seeking you',
            'রুমি',
            'rumi',
            'অতিথি হয়ে',
            'আলোর দ্বার',
            'হৃদয়ের দরজা',
            'আত্মার',
            // Philosophy puzzle / diagnosis-ish
            'existential',
            'inner demon',
            'trauma',
            'traumatic',
            'depression',
            'anxiety disorder',
            'ptsd',
            'disorder',
            'diagnose',
            'ট্রমা',
            'ডিপ্রেশন',
            'অ্যাংজাইটি ডিসঅর্ডার',
        ];

        foreach ($banned as $phrase) {
            if (str_contains($lower, mb_strtolower($phrase))) {
                return false;
            }
        }

        // Yes/No shaped openers (weak exploratory form).
        if (preg_match('/^(is|are|do|does|did|can|could|would|will|have|has|should)\s+/i', $q) === 1
            && ! preg_match('/\b(what|which|how|where|when|who)\b/i', $q)) {
            return false;
        }
        if (preg_match('/^(কি|কেন|না কি)\s+/u', $q) === 1 && substr_count($q, '?') === 1 && mb_strlen($q) < 40) {
            // short yes/no-ish Bangla forms — reject if too closed
            if (preg_match('/^(কি তুমি|তুমি কি|এটা কি)\b/u', $q) === 1) {
                return false;
            }
        }

        // Prefer exploratory stems; allow Bengali equivalents.
        $hasExploratoryStem = preg_match(
            '/\b(what|which|how|where|when|who|tell me about|describe|notice|consider|stand(?:s)? out|influenced|important|options?|possibilit|understand)\b/i',
            $q
        ) === 1
            || preg_match('/(কী|কোন|কেন|কীভাবে|কোথায়|কখন|কে|স্পষ্ট|নজরে|মনে হয়|বিকল্প|প্রভাব|গুরুত্বপূর্ণ|বুঝতে)/u', $q) === 1;

        if (! $hasExploratoryStem) {
            return false;
        }

        return true;
    }

    private function sanitizeMindGymQuestion(string $question, bool $useBn, int $turn, array $previousQuestions = []): string
    {
        $q = trim(preg_replace('/\s+/u', ' ', $question) ?? $question);
        // Keep only the first interrogative sentence if model stacked questions.
        if (preg_match('/^(.+?\?)/u', $q, $m) === 1) {
            $q = trim($m[1]);
        }
        if ($this->isValidMindGymQuestion($q, $useBn) && ! $this->isTooSimilarToPrevious($q, $previousQuestions)) {
            return $q;
        }

        return $this->safeFallbackQuestion($useBn, $turn, $previousQuestions);
    }

    private function questionFingerprint(string $question): string
    {
        $normalized = mb_strtolower(trim($question));
        $normalized = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $normalized) ?? $normalized;
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? $normalized;

        return trim($normalized);
    }

    /** @param  array<int, string>  $previousQuestions */
    private function isTooSimilarToPrevious(string $question, array $previousQuestions): bool
    {
        $candidate = $this->questionFingerprint($question);
        if ($candidate === '') {
            return true;
        }

        foreach ($previousQuestions as $prev) {
            $existing = $this->questionFingerprint((string) $prev);
            if ($existing === '') {
                continue;
            }
            if ($candidate === $existing) {
                return true;
            }
            similar_text($candidate, $existing, $percent);
            if ($percent >= 72) {
                return true;
            }
            if (str_contains($candidate, $existing) || str_contains($existing, $candidate)) {
                return true;
            }
        }

        return false;
    }

    private function looksLikeBangla(string $text): bool
    {
        // Bangla Unicode block letters.
        return preg_match('/\p{Bengali}/u', $text) === 1;
    }

    private function sanitizeMindGymAcknowledgement(string $text, bool $useBn): string
    {
        $a = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
        if ($a === '') {
            return $useBn
                ? 'তোমার উত্তরের জন্য ধন্যবাদ। এখানে কোনো উত্তরই সঠিক বা ভুল নয়।'
                : 'Thank you for sharing that. Nothing you write here is judged as right or wrong.';
        }

        if ($useBn && ! $this->looksLikeBangla($a)) {
            return 'তোমার ভাগ করে নেওয়া কথাগুলো শোনা গেছে — ধন্যবাদ। আমরা ধীরে ধীরে একটু আরও খুঁজে দেখি।';
        }

        // Soft strip of assumptive acknowledgements.
        $bannedAck = [
            'you are afraid', 'you\'re afraid', 'your heart', 'inner child', 'deep down',
            'protecting yourself', 'তুমি ভয়', 'তোমার হৃদয়', 'গভীরে তুমি',
        ];
        $lower = mb_strtolower($a);
        foreach ($bannedAck as $phrase) {
            if (str_contains($lower, mb_strtolower($phrase))) {
                return $useBn
                    ? 'তোমার ভাগ করে নেওয়া কথাগুলো শোনা গেছে — ধন্যবাদ। আমরা ধীরে ধীরে একটু আরও খুঁজে দেখি।'
                    : 'I hear what you shared — thank you. Let’s continue exploring one step at a time.';
            }
        }

        return $a;
    }

    private function safeFallbackQuestion(bool $useBn, int $turn, array $previousQuestions = []): string
    {
        $bankBn = [
            'এই পরিস্থিতিতে তোমার কাছে সবচেয়ে কোন দিকটা স্পষ্ট মনে হচ্ছে?',
            'এই মুহূর্তে প্রথমে কোন চিন্তাগুলো মাথায় এসেছিল?',
            'এই অংশটা তোমার জন্য কী কারণে কঠিন বা জটিল মনে হচ্ছে?',
            'এখানে তুমি কোন কোন বিকল্প দেখতে পাচ্ছ?',
            'এখন তোমার কাছে সবচেয়ে গুরুত্বপূর্ণ মনে হচ্ছে কোন বিষয়টা?',
            'তোমার সেই সাড়া বা সিদ্ধান্তে কী প্রভাব ফেলেছে বলে মনে হয়?',
            'নিজের প্রতিক্রিয়া সম্পর্কে আর কী বুঝতে চাইবে?',
            'এমন কোন সম্ভাবনা আছে যা এখনও বিবেচনা করোনি?',
            'অন্য কেউ এই পরিস্থিতিতে থাকলে তাদের দৃষ্টিকোণ কেমন হতে পারত বলে ভাবা যায়?',
            'এই আলোচনায় এখন কোন দিকটা আর একটু খোলাখুলি দেখতে চাও?',
            'এই দৃশ্যে কোন ধরনের অনিশ্চয়তা সবচেয়ে বেশি নজরে আসছে?',
            'যদি এক ধাপ পিছিয়ে তাকাও, কোন বিষয়টা আগে ভাবা দরকার বলে মনে হয়?',
            'এখানে কোন প্রত্যাশা বা ধারণা তোমার চিন্তাকে প্রভাবিত করতে পারে?',
            'এই পরিস্থিতিতে কথা বলা বা না বলার সম্ভাব্য ফলগুলো কী কী হতে পারে?',
            'এখনকার মুহূর্তে কোন ছোট বিষয়টা আর একটু পরিষ্কার করতে চাও?',
        ];
        $bankEn = [
            'What stands out to you most in this situation?',
            'What thoughts came to your mind first in that moment?',
            'What made that part of the situation difficult or complex for you?',
            'What different options do you notice from here?',
            'What feels most important to you right now in this scenario?',
            'What do you think influenced that response or decision?',
            'What would you want to understand better about your own reaction?',
            'What possibilities have you not considered yet?',
            'How might someone else in the same situation see it differently?',
            'Which part of this conversation do you want to explore a little further?',
            'What kind of uncertainty catches your attention most in this scene?',
            'If you step back for a moment, what seems useful to think about first?',
            'Which assumption or expectation might be shaping your thinking here?',
            'What possible outcomes do you notice if you speak up or stay silent?',
            'What small part of this moment would you like to clarify a bit more?',
        ];
        $bank = $useBn ? $bankBn : $bankEn;
        $fresh = [];
        foreach ($bank as $candidate) {
            if (! $this->isTooSimilarToPrevious($candidate, $previousQuestions)) {
                $fresh[] = $candidate;
            }
        }
        if ($fresh === []) {
            $fresh = $bank;
        }

        return $fresh[($turn + count($previousQuestions) + random_int(0, max(1, count($fresh) - 1))) % count($fresh)];
    }

    /**
     * @param  array<int, string>  $previousQuestions
     * @return array{acknowledgement: string, question: string}
     */
    private function fallbackReflectiveTurn(
        string $category,
        int $turn,
        bool $useBn,
        string $studentInput,
        bool $isComplete,
        array $previousQuestions = []
    ): array {
        $ack = $useBn
            ? 'তোমার উত্তরের জন্য ধন্যবাদ। এখানে কোনো উত্তরই সঠিক বা ভুল নয়।'
            : 'Thank you for sharing that. Nothing you write here is judged as right or wrong.';
        if ($isComplete) {
            return [
                'acknowledgement' => $useBn
                    ? $ack.' এই সেশনের কথোপকথন এখানে থামানো যায় — চাইলে শেষে একটা ছোট নোট রেখে reflective summary নিতে পারো।'
                    : $ack.' We can pause the conversation here — if you wish, add a short closing note before the reflective summary.',
                'question' => '',
            ];
        }

        $bank = [
            'exam' => $useBn ? [
                'পরীক্ষার এই পরিস্থিতিতে তোমার কাছে প্রথমে কোন দিকটা সবচেয়ে স্পষ্ট মনে হচ্ছে?',
                'সময়ের চাপের মধ্যে কোন চিন্তাগুলো আগে এসেছিল?',
                'এই মুহূর্তটাকে কী কারণে কঠিন মনে হচ্ছে?',
                'এখানে তুমি কোন কোন বিকল্প দেখতে পাচ্ছ?',
                'এখন কোন বিষয়টা তোমার কাছে সবচেয়ে গুরুত্বপূর্ণ মনে হচ্ছে?',
                'তোমার সাড়ায় কী প্রভাব ফেলেছে বলে মনে হয়?',
                'নিজের প্রতিক্রিয়া সম্পর্কে আর কী বুঝতে চাইবে?',
                'এমন কোন সম্ভাবনা এখনও বিবেচনা করোনি?',
            ] : [
                'In this exam situation, what stands out to you most right now?',
                'When time pressure appeared, what thoughts came to mind first?',
                'What made that moment difficult for you?',
                'What different options do you notice from here?',
                'What feels most important to you in this moment?',
                'What do you think influenced the way you responded?',
                'What would you want to understand better about your own reaction?',
                'What possibilities have you not considered yet?',
            ],
            'presentation' => $useBn ? [
                'উপস্থাপনার এই দৃশ্যে তোমার কাছে সবচেয়ে কোন অংশ স্পষ্ট মনে হচ্ছে?',
                'শ্রোতাদের সামনে দাঁড়ানোর আগে প্রথমে কোন চিন্তা এসেছিল?',
                'এই মুহূর্তটাকে কী কারণে চাপপূর্ণ মনে হচ্ছে?',
                'এখানে তুমি কোন কোন উপায় বা বিকল্প দেখতে পাচ্ছ?',
                'এখন কোন বিষয়টা তোমার কাছে সবচেয়ে গুরুত্বপূর্ণ?',
                'তোমার সাড়া বা সিদ্ধান্তে কী প্রভাব ফেলতে পারে বলে মনে হয়?',
                'নিজের প্রতিক্রিয়া সম্পর্কে আর কী জানতে চাইবে?',
                'অন্য কোন দৃষ্টিকোণ এখনও বিবেচনা করা যায়?',
            ] : [
                'In this presentation scene, what stands out to you most?',
                'Before speaking to the audience, what thoughts came first?',
                'What made this moment feel pressured for you?',
                'What different options do you notice here?',
                'What feels most important to you right now?',
                'What do you think might influence how you respond?',
                'What would you want to understand better about your reaction?',
                'What other perspectives have you not considered yet?',
            ],
            'conflict' => $useBn ? [
                'এই মতবিরোধে তোমার কাছে সবচেয়ে কোন দিকটা স্পষ্ট?',
                'বন্ধুর কথার পর প্রথমে কোন চিন্তা এসেছিল?',
                'এই মুহূর্তটাকে কী কারণে কঠিন মনে হচ্ছে?',
                'এখানে তুমি কোন কোন জবাবের বিকল্প দেখতে পাচ্ছ?',
                'এখন তোমার কাছে সবচেয়ে গুরুত্বপূর্ণ মনে হচ্ছে কোন বিষয়?',
                'তোমার সম্ভাব্য সাড়ায় কী প্রভাব ফেলতে পারে?',
                'নিজের প্রতিক্রিয়া সম্পর্কে আর কী বুঝতে চাইবে?',
                'এমন কোন সম্ভাবনা এখনও ভাবোনি?',
            ] : [
                'In this disagreement, what stands out to you most?',
                'After your friend’s words, what thoughts came first?',
                'What made this moment difficult for you?',
                'What different response options do you notice?',
                'What feels most important to you right now?',
                'What do you think might influence how you reply?',
                'What would you want to understand better about your reaction?',
                'What possibilities have you not considered yet?',
            ],
            'social' => $useBn ? [
                'এই সামাজিক পরিস্থিতিতে তোমার কাছে সবচেয়ে কোন দিকটা স্পষ্ট?',
                'একা বসে থাকার সময় প্রথমে কোন চিন্তা এসেছিল?',
                'এই মুহূর্তটাকে কী কারণে অস্বস্তিকর বা জটিল মনে হচ্ছে?',
                'এখানে তুমি কোন কোন বিকল্প দেখতে পাচ্ছ?',
                'এখন কোন বিষয়টা তোমার কাছে সবচেয়ে গুরুত্বপূর্ণ?',
                'তোমার সাড়ায় কী প্রভাব ফেলতে পারে বলে মনে হয়?',
                'নিজের প্রতিক্রিয়া সম্পর্কে আর কী বুঝতে চাইবে?',
                'এমন কোন সম্ভাবনা এখনও বিবেচনা করোনি?',
            ] : [
                'In this social situation, what stands out to you most?',
                'While sitting apart, what thoughts came to mind first?',
                'What made this moment uncomfortable or complex for you?',
                'What different options do you notice from here?',
                'What feels most important to you right now?',
                'What do you think might influence how you respond?',
                'What would you want to understand better about your reaction?',
                'What possibilities have you not considered yet?',
            ],
            'academic_stress' => $useBn ? [
                'ডেডলাইনের এই পরিস্থিতিতে তোমার কাছে সবচেয়ে কোন দিকটা স্পষ্ট?',
                'কাজ জমিয়ে রাখার চাপে প্রথমে কোন চিন্তা এসেছিল?',
                'এই মুহূর্তটাকে কী কারণে কঠিন মনে হচ্ছে?',
                'এখানে তুমি কোন কোন বিকল্প বা ধাপ দেখতে পাচ্ছ?',
                'এখন কোন বিষয়টা তোমার কাছে সবচেয়ে গুরুত্বপূর্ণ?',
                'তোমার সিদ্ধান্তে কী প্রভাব ফেলতে পারে বলে মনে হয়?',
                'নিজের প্রতিক্রিয়া সম্পর্কে আর কী বুঝতে চাইবে?',
                'এমন কোন সম্ভাবনা এখনও বিবেচনা করোনি?',
            ] : [
                'In this deadline situation, what stands out to you most?',
                'When the unfinished work pressure hit, what thoughts came first?',
                'What made this moment difficult for you?',
                'What different options or next steps do you notice?',
                'What feels most important to you right now?',
                'What do you think might influence the decision you make?',
                'What would you want to understand better about your reaction?',
                'What possibilities have you not considered yet?',
            ],
            'interview' => $useBn ? [
                'সাক্ষাৎকারের এই পরিস্থিতিতে তোমার কাছে সবচেয়ে কোন দিকটা স্পষ্ট?',
                'প্রশ্ন শোনার পর প্রথমে কোন চিন্তা এসেছিল?',
                'এই মুহূর্তটাকে কী কারণে চাপপূর্ণ মনে হচ্ছে?',
                'এখানে তুমি কোন কোন উত্তরের ধরন বা বিকল্প দেখতে পাচ্ছ?',
                'এখন কোন বিষয়টা তোমার কাছে সবচেয়ে গুরুত্বপূর্ণ?',
                'তোমার সাড়ায় কী প্রভাব ফেলতে পারে বলে মনে হয়?',
                'নিজের প্রতিক্রিয়া সম্পর্কে আর কী বুঝতে চাইবে?',
                'এমন কোন সম্ভাবনা এখনও বিবেচনা করোনি?',
            ] : [
                'In this interview situation, what stands out to you most?',
                'After hearing the question, what thoughts came first?',
                'What made this moment feel pressured for you?',
                'What different ways of responding do you notice?',
                'What feels most important to you right now?',
                'What do you think might influence how you answer?',
                'What would you want to understand better about your reaction?',
                'What possibilities have you not considered yet?',
            ],
        ];

        $list = $bank[$category] ?? $bank['exam'];
        $fresh = [];
        foreach ($list as $candidate) {
            if (! $this->isTooSimilarToPrevious($candidate, $previousQuestions)) {
                $fresh[] = $candidate;
            }
        }
        if ($fresh === []) {
            $question = $this->safeFallbackQuestion($useBn, $turn, $previousQuestions);
        } else {
            $question = $fresh[($turn + count($previousQuestions)) % count($fresh)];
        }
        $question = $this->sanitizeMindGymQuestion($question, $useBn, $turn, $previousQuestions);

        if (mb_strlen(trim($studentInput)) > 0) {
            $ack = $useBn
                ? 'তোমার বলা বিষয়গুলো নোট করা গেছে — ধন্যবাদ। এবার আর একটু খুঁজে দেখি।'
                : 'Thanks for what you shared. Let’s explore one step further.';
        }

        return [
            'acknowledgement' => $ack,
            'question' => $question,
        ];
    }

    private function userSignalsReadyToClose(string $text): bool
    {
        $t = mb_strtolower(trim($text));

        return (bool) preg_match('/^(done|finish|শেষ|থামো|close|enough|সমাপ্ত)/u', $t)
            || str_contains($t, 'session end')
            || str_contains($t, 'সেশন শেষ');
    }

    /** @return array<int, array{question: string, answer: string}> */
    private function storyHistoryPairs(MindGymSession $session): array
    {
        $events = MindGymSessionEvent::where('session_id', $session->id)
            ->where('event_type', 'story')
            ->orderBy('id')
            ->get();
        $pairs = [];
        $prevQuestion = null;
        $opening = collect($session->transcript_json ?? [])->firstWhere('type', 'opening');
        if (is_array($opening)) {
            $prevQuestion = (string) ($opening['payload']['askPrompt'] ?? '');
        }
        foreach ($events as $event) {
            $answer = (string) ($event->payload['studentInput'] ?? '');
            $pairs[] = [
                'question' => $prevQuestion ?? '',
                'answer' => $answer,
            ];
            $prevQuestion = (string) ($event->payload['beat']['askPrompt'] ?? '');
        }

        return $pairs;
    }

    private function storyTranscriptForPrompt(MindGymSession $session): string
    {
        $lines = [];
        foreach ($this->storyHistoryPairs($session) as $i => $pair) {
            $lines[] = 'Question '.($i + 1).': '.$pair['question'];
            $lines[] = 'User: '.$pair['answer'];
        }

        return implode("\n", $lines);
    }

    private function fallbackReflectiveSummary(MindGymSession $session, string $reflection, bool $useBn): string
    {
        $session->loadMissing('scenario');
        $title = $useBn ? $session->scenario->title_bn : $session->scenario->title_en;
        $count = MindGymSessionEvent::where('session_id', $session->id)->where('event_type', 'story')->count();

        if ($useBn) {
            return "এই Mind Gym সেশনে তুমি “{$title}” পরিস্থিতি নিয়ে {$count}টি ধাপে চিন্তা করেছ। "
                .'কথোপকথনে মূল থিমগুলো ছিল চাপের মুহূর্তে সিদ্ধান্ত, অনুভূতির প্রতি নজর, এবং সম্ভাব্য পরিণতি নিয়ে ভাবা। '
                .'তোমার ভাষায় নিজের অভিজ্ঞতা খোলাখুলি রাখার চেষ্টা একটি শক্তি। '
                .'আরও গভীর প্রতিফলনের জন্য অন্য মানুষের দৃষ্টিকোণ ও দীর্ঘমেয়াদি ফল নিয়ে ভাবা সহায়ক হতে পারে। '
                .'বাস্তবে একই রকম পরিস্থিতিতে একটা ছোট, স্পষ্ট পদক্ষেপ বেছে নেওয়া অনুশীলনের মতো কাজে লাগতে পারে। '
                .($reflection !== '' ? "শেষ নোট: {$reflection} " : '')
                .'মনে রেখো: এই সেশন আত্ম-প্রতিফলন ও দক্ষতা অনুশীলনের জন্য — রোগ নির্ণয় বা থেরাপি নয়। '
                .'যদি দীর্ঘদিন ধরে কষ্ট থাকলে একজন যোগ্য পেশাদারের সাথে কথা বলা বিবেচনা করতে পারো; AI সেই প্রয়োজন নির্ধারণ করতে পারে না।';
        }

        return "In this Mind Gym session you reflected on “{$title}” across {$count} turns. "
            .'Themes included decision-making under pressure, noticing feelings, and considering possible consequences. '
            .'Your willingness to describe the experience in your own words is a strength. '
            .'Further reflection on other people’s perspectives and longer-term outcomes may deepen insight. '
            .'In real life, choosing one small clear step in similar moments can serve as practice. '
            .($reflection !== '' ? "Closing note: {$reflection} " : '')
            .'Remember: this session is for self-reflection and skill development — not diagnosis or therapy. '
            .'If distress persists, consider speaking with a qualified professional; the AI cannot determine whether that is needed.';
    }

    /**
     * Legacy helper retained for compatibility; reflective path no longer uses it.
     *
     * @return array{dialogue: string, emotion_tag: string, internal_difficulty_adjust: int, narration: string, challenge: string}
     */
    private function generateStoryBeat(string $category, int $difficulty, string $studentInput, int $turn, bool $useBn): array
    {
        return $this->fallbackStoryBeat($category, $turn, $useBn, $studentInput);
    }

    /**
     * @return array{dialogue: string, emotion_tag: string, internal_difficulty_adjust: int, narration: string, challenge: string}
     */
    private function fallbackStoryBeat(string $category, int $turn, bool $useBn, string $studentInput): array
    {
        $beats = [
            'presentation' => [
                [
                    'dialogue' => $useBn ? 'ভালো। ধীরে শুরু করুন — আমরা শুনছি।' : 'Good. Begin slowly — we are listening.',
                    'narration' => $useBn
                        ? 'প্রজেক্টর জ্বলজ্বল করছে। শিক্ষক সামনে নোট নিচ্ছেন। ক্লাসের চোখ তোমার দিকে। গলা শুকনো লাগলেও প্রথম বাক্য বলার সুযোগ এখনই।'
                        : 'The projector glows. The teacher takes notes up front. Eyes are on you. Even if your throat is dry, this is the moment for your first sentence.',
                    'challenge' => $useBn
                        ? 'হঠাৎ মাঝখান থেকে এক ছাত্র কঠিন প্রশ্ন করে: "এর বাস্তব উদাহরণ কী?"'
                        : 'Suddenly a student asks a hard question: "What is a real-life example of this?"',
                    'emotion_tag' => 'encouraging',
                ],
                [
                    'dialogue' => $useBn ? 'ধারণাটা একটু স্পষ্ট করুন — ছোট করে।' : 'Make that idea clearer — keep it short.',
                    'narration' => $useBn
                        ? 'কিছু সহপাঠী মাথা নাড়ছে, কেউ কেউ বিভ্রান্ত। তুমি ব্যাখ্যা চালিয়ে যাচ্ছ, কিন্তু ঘাম হচ্ছে এবং চোখ স্লাইডে ফিরছে।'
                        : 'Some classmates nod, a few look confused. You keep explaining, but you are sweating and your eyes keep returning to the slides.',
                    'challenge' => $useBn
                        ? 'প্রজেক্টর হঠাৎ নিভে যায়। স্লাইড নেই। সবাই তাকিয়ে আছে — এখন কী করবে?'
                        : 'The projector suddenly shuts down. No slides. Everyone is watching — what will you do now?',
                    'emotion_tag' => 'skeptical',
                ],
                [
                    'dialogue' => $useBn ? 'চালিয়ে যান — শান্ত গলায় শেষ করুন।' : 'Continue — finish with a steady voice.',
                    'narration' => $useBn
                        ? 'তুমি বোর্ডে দুইটা পয়েন্ট লিখে মুখে ব্যাখ্যা করছ। ঘরটা আবার শান্ত। সময়ের চাপ বাড়ছে।'
                        : 'You write two points on the board and explain aloud. The room settles again. Time pressure is rising.',
                    'challenge' => $useBn
                        ? 'টিচার বলেন: "শেষ করার জন্য ৩০ সেকেন্ড।" একটা পরিষ্কার closing চাই।'
                        : 'The teacher says: "Thirty seconds to finish." You need one clear closing line.',
                    'emotion_tag' => 'neutral',
                ],
                [
                    'dialogue' => $useBn ? 'ধন্যবাদ। আপনি আজ অনুশীলন শেষ করেছেন।' : 'Thank you. You finished today’s practice.',
                    'narration' => $useBn
                        ? 'ক্লাস হালকা হাততালি দেয়। তুমি নিঃশ্বাস ছাড়ো। চাপ থাকলেও তুমি থেমে যাওনি — এটাই দক্ষতার অনুশীলন।'
                        : 'The class gives light applause. You exhale. Even with stress you did not quit — that is skill practice.',
                    'challenge' => '',
                    'emotion_tag' => 'encouraging',
                ],
            ],
            'exam' => [
                [
                    'dialogue' => $useBn ? 'একটা প্রশ্ন বেছে ধীরে শুরু করো।' : 'Pick one question and start slowly.',
                    'narration' => $useBn
                        ? 'বড় হলে ঘড়ি টিকটিক করছে। পাশে সবাই লিখছে। তোমার হাত কাঁপছে, কিন্তু প্রশ্নপত্র এখনো খোলা।'
                        : 'In the large hall the clock ticks. Everyone writes around you. Your hands shake, but the paper is still open.',
                    'challenge' => $useBn
                        ? 'পাশের কেউ উত্তর শিট জোরে ওল্টায় — মনোযোগ ভেঙে যায়। তুমি কীভাবে ফিরে আসবে?'
                        : 'Someone nearby loudly flips their answer sheet — focus breaks. How will you return?',
                    'emotion_tag' => 'skeptical',
                ],
                [
                    'dialogue' => $useBn ? 'শ্বাস নিয়ে এক লাইন লেখো — নিখুঁত লাগবে না।' : 'Breathe and write one line — it does not need to be perfect.',
                    'narration' => $useBn
                        ? 'তুমি প্রথম প্রশ্নটা আবার পড়ছ। কয়েকটা কিওয়ার্ড মনে আসছে। কলম কাগজে ছোঁয়াচ্ছে।'
                        : 'You reread the first question. A few keywords return. The pen touches the paper.',
                    'challenge' => $useBn
                        ? 'ইনভিজিলেটর বলেন: "মাত্র ১৫ মিনিট বাকি।" সময়ের চাপ হঠাৎ বাড়ে।'
                        : 'The invigilator says: "Only fifteen minutes left." Time pressure jumps.',
                    'emotion_tag' => 'anxious',
                ],
                [
                    'dialogue' => $useBn ? 'যতটুকু জানো সেটাই পরিষ্কার করে লেখো।' : 'Write clearly what you know right now.',
                    'narration' => $useBn
                        ? 'কলম চলতে শুরু করেছে। উত্তর পুরো না হলেও কাঠামো দেখা যাচ্ছে। বুকের ধড়ফড় একটু কমছে।'
                        : 'The pen is moving. The answer is incomplete but structure appears. Your heartbeat eases a little.',
                    'challenge' => $useBn
                        ? 'শেষ ৫ মিনিট ঘোষণা। কোন অংশ আগে শেষ করবে?'
                        : 'Five minutes remaining is announced. Which part will you finish first?',
                    'emotion_tag' => 'encouraging',
                ],
                [
                    'dialogue' => $useBn ? 'ভালো চেষ্টা। আজকের অনুশীলন শেষ।' : 'Good effort. Today’s practice ends.',
                    'narration' => $useBn
                        ? 'তুমি যা পেরেছ জমা দিয়ে উঠে দাঁড়াও। প্যানিক এলেও তুমি একটা পদক্ষেপ নিয়েছ — এটা শক্তির চিহ্ন।'
                        : 'You submit what you finished and stand. Even with panic you took a step — that is a strength signal.',
                    'challenge' => '',
                    'emotion_tag' => 'encouraging',
                ],
            ],
            'conflict' => [
                [
                    'dialogue' => $useBn ? 'আমি শুনছি। একটু শান্ত হয়ে বলো।' : 'I am listening. Speak a bit more calmly.',
                    'narration' => $useBn
                        ? 'ক্যাফেতে টেনশন ঘন। বন্ধুর কণ্ঠ তীব্র। পাশ থেকে কেউ কেউ তাকায়। তোমার হাতে কাপ কাঁপছে।'
                        : 'Tension sits heavy in the cafe. Your friend’s voice is sharp. A few people glance over. Your cup shakes.',
                    'challenge' => $useBn
                        ? 'বন্ধু বলে: "তুই সবসময় এড়াস।" কেমন করে জবাব দেবে?'
                        : 'Your friend says: "You always avoid." How will you answer?',
                    'emotion_tag' => 'skeptical',
                ],
                [
                    'dialogue' => $useBn ? 'আমরা একটা ছোট সমাধান খুঁজি।' : 'Let’s find one small solution.',
                    'narration' => $useBn
                        ? 'কথা একটু নরম হয়েছে। তুমি নিজের অংশ স্বীকার করতে পারো, অথবা স্পষ্ট সীমানা টানতে পারো।'
                        : 'The tone softens a little. You can own your part or set a clear boundary.',
                    'challenge' => $useBn
                        ? 'হঠাৎ বন্ধু উঠে যেতে চায়। সম্পর্ক না ভেঙে কী বলবে?'
                        : 'Suddenly your friend wants to leave. What will you say without breaking the bond?',
                    'emotion_tag' => 'neutral',
                ],
                [
                    'dialogue' => $useBn ? 'কাল আবার কথা বলি — আজ একটা পদক্ষেপ ঠিক করি।' : 'Let’s talk again tomorrow — decide one step today.',
                    'narration' => $useBn
                        ? 'দুজনেই একটু শান্ত। কাজ ভাগ করার সুযোগ তৈরি হচ্ছে।'
                        : 'Both of you are a bit calmer. There is room to divide the work.',
                    'challenge' => $useBn
                        ? 'মেসেজে আরেক বন্ধু জিজ্ঞেস করে "কী হলো?" — কতটা শেয়ার করবে?'
                        : 'Another friend texts "What happened?" — how much will you share?',
                    'emotion_tag' => 'encouraging',
                ],
                [
                    'dialogue' => $useBn ? 'ভালো। তুমি ঝগড়া না বাড়িয়ে কথা রেখেছ।' : 'Good. You kept talking without escalating.',
                    'narration' => $useBn
                        ? 'সেশন শেষ। রাগ থাকতে পারে, কিন্তু তুমি এড়ানো বা চিৎকারের বদলে একটি স্পষ্ট পদক্ষেপ অনুশীলন করেছ।'
                        : 'Session ends. Anger may remain, but instead of avoiding or yelling you practiced one clear step.',
                    'challenge' => '',
                    'emotion_tag' => 'encouraging',
                ],
            ],
            'social' => [
                [
                    'dialogue' => $useBn ? 'এসো বসো — কেমন আছ?' : 'Come sit — how are you?',
                    'narration' => $useBn
                        ? 'লাঞ্চ টেবিলে জায়গা আছে। কেউ কেউ তাকিয়ে হাসি দিচ্ছে। তোমার পা ভারী লাগছে।'
                        : 'There is space at the lunch table. Someone smiles. Your legs feel heavy.',
                    'challenge' => $useBn
                        ? 'মনে হয়: "যদি অদ্ভুত লাগে?" — তবুও কী বলবে প্রথম লাইনে?'
                        : 'A thought pops up: "What if this is awkward?" Still, what first line will you say?',
                    'emotion_tag' => 'encouraging',
                ],
                [
                    'dialogue' => $useBn ? 'কোন বিভাগে পড়ো?' : 'Which department are you in?',
                    'narration' => $useBn
                        ? 'কথোপকথন শুরু হয়েছে। চোখ মিলছে। ভিতরে টেনশন থাকলেও তুমি বসে আছ।'
                        : 'Conversation has started. Eyes meet. Even with inner tension you are still sitting here.',
                    'challenge' => $useBn
                        ? 'হঠাৎ নীরবতা। কেউ কথা বলছে না — তুমি কীভাবে চালিয়ে নেবে?'
                        : 'Sudden silence. No one is talking — how will you continue?',
                    'emotion_tag' => 'neutral',
                ],
                [
                    'dialogue' => $useBn ? 'পরে আবার দেখা হবে।' : 'See you around later.',
                    'narration' => $useBn
                        ? 'তুমি পরিচয় আর একটা ছোট প্রশ্ন দিয়ে নিজেকে যুক্ত রেখেছ। সামাজিক দক্ষতা এভাবেই বাড়ে।'
                        : 'You stayed connected with an introduction and one small question. Social skill grows this way.',
                    'challenge' => $useBn
                        ? 'গ্রুপ অন্য জায়গায় যেতে চায়। সাথে যাবে নাকি নম্রভাবে না বলবে?'
                        : 'The group wants to move elsewhere. Will you join or politely decline?',
                    'emotion_tag' => 'encouraging',
                ],
                [
                    'dialogue' => $useBn ? 'ভালো চেষ্টা — আজকের অনুশীলন সম্পন্ন।' : 'Nice effort — today’s practice is complete.',
                    'narration' => $useBn
                        ? 'তুমি পুরোপুরি আরাম না পেলেও একা বসে থাকা এড়িয়ে একটি ছোট যোগাযোগ অনুশীলন করেছ।'
                        : 'Even if it was not fully comfortable, you practiced a small connection instead of staying alone.',
                    'challenge' => '',
                    'emotion_tag' => 'encouraging',
                ],
            ],
            'academic_stress' => [
                [
                    'dialogue' => $useBn ? 'একটা ছোট ধাপ বেছে নাও।' : 'Choose one small step.',
                    'narration' => $useBn
                        ? 'রাত গভীর। ল্যাপটপে অসমাপ্ত অ্যাসাইনমেন্ট। ট্যাব অনেক। চোখে জ্বালা। মন বলছে সব একসাথে শেষ করতে হবে।'
                        : 'Late night. Unfinished assignment on the laptop. Too many tabs. Eyes burn. Your mind says you must finish everything together.',
                    'challenge' => $useBn
                        ? 'ফোনে নোটিফিকেশন আসে — সোশ্যাল মিডিয়া খুলবে নাকি টাইমার দিবে?'
                        : 'A phone notification arrives — open social media or set a timer?',
                    'emotion_tag' => 'anxious',
                ],
                [
                    'dialogue' => $useBn ? '২৫ মিনিট শুধু এক অংশ।' : 'Twenty-five minutes on just one part.',
                    'narration' => $useBn
                        ? 'তুমি একটা সেকশন বেছে নিয়েছ। অগ্রগতি ধীর কিন্তু দৃশ্যমান। ঘুমের চাপ এখনো আছে।'
                        : 'You picked one section. Progress is slow but visible. Sleep pressure is still there.',
                    'challenge' => $useBn
                        ? 'রুমমেট জিজ্ঞেস করে "এখনো জেগে আছিস?" — কীভাবে সাহায্য চাইবে বা সীমানা টানবে?'
                        : 'Roommate asks "Still awake?" — how will you ask for help or set a boundary?',
                    'emotion_tag' => 'neutral',
                ],
                [
                    'dialogue' => $useBn ? 'জরুরি অংশ আগে — বাকি কাল সকালে।' : 'Urgent part first — rest in the morning.',
                    'narration' => $useBn
                        ? 'প্রায়োরিটি স্পষ্ট হচ্ছে। পারফেক্ট না হলেও জমা দেওয়ার মতো অংশ তৈরি হচ্ছে।'
                        : 'Priorities get clearer. Even if imperfect, a submittable section is forming.',
                    'challenge' => $useBn
                        ? 'কম্পিউটার হ্যাং হতে চায়। ব্যাকআপ নাই। এখন কী করবে?'
                        : 'The computer starts lagging. No backup yet. What will you do?',
                    'emotion_tag' => 'encouraging',
                ],
                [
                    'dialogue' => $useBn ? 'আজকের চাপ অনুশীলন শেষ।' : 'Tonight’s pressure practice ends.',
                    'narration' => $useBn
                        ? 'তুমি এড়িয়ে না গিয়ে ছোট ধাপে কাজ ভেঙেছ। এটাই ডেডলাইন স্কিলের মূল অনুশীলন।'
                        : 'Instead of escaping you broke work into small steps. That is the core deadline skill.',
                    'challenge' => '',
                    'emotion_tag' => 'encouraging',
                ],
            ],
        ];

        $list = $beats[$category] ?? $beats['exam'];
        $beat = $list[min($turn, count($list) - 1)];
        if (str_contains(mb_strtolower($studentInput), 'greeting') || str_contains($studentInput, 'সালাম') || str_contains($studentInput, 'নমস্কার')) {
            $beat['emotion_tag'] = 'encouraging';
        }

        return [
            'dialogue' => $beat['dialogue'],
            'emotion_tag' => $beat['emotion_tag'],
            'internal_difficulty_adjust' => 0,
            'narration' => $beat['narration'],
            'challenge' => $beat['challenge'],
        ];
    }

    /** @return array<string, int> */
    private function scoreFromFreeText(string $text, int $turn): array
    {
        $len = mb_strlen(trim($text));
        $base = min(95, 45 + (int) ($len / 3) + ($turn * 4));
        $hasPlan = preg_match('/(প্রথমে|তারপর|hello|greeting|শ্বাস|calm|help|সাহায্য)/iu', $text) === 1;

        return [
            'confidence' => min(100, $base + ($hasPlan ? 8 : 0)),
            'communication' => min(100, $base + ($len > 20 ? 6 : 0)),
            'decision_making' => min(100, $base + ($hasPlan ? 10 : 0)),
            'problem_solving' => min(100, $base),
            'calmness' => min(100, $base - (str_contains(mb_strtolower($text), 'panic') ? 10 : 0)),
        ];
    }

    private function prefersBangla(?User $user = null, ?string $languageOverride = null): bool
    {
        $lang = strtolower(trim((string) ($languageOverride ?: ($user?->language ?? 'bn'))));

        // Default Bangla unless explicitly English.
        return $lang !== 'en' && ! str_starts_with($lang, 'en');
    }

    private function assertActive(MindGymSession $session): void
    {
        abort_if($session->status !== 'active', 422, 'Session is not active');
    }
}
