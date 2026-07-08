<?php

namespace Database\Seeders;

use App\Models\FeedbackSubmission;
use App\Models\MindGymChoice;
use App\Models\MindGymScenario;
use App\Models\MindGymSession;
use App\Models\MindGymSessionEvent;
use App\Models\MindGymUserProgress;
use App\Models\User;
use App\Services\MindGymService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Pathway-valid proxy pilot corpus for Mind Gym.
 * Not a substitute for live student consent — generates replayable training/demo analytics.
 */
class MindGymPilotSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(MindGymService::class);
        $scenarios = MindGymScenario::where('is_active', true)->get();
        if ($scenarios->isEmpty()) {
            $this->command?->warn('No Mind Gym scenarios. Run MindGymSeeder first.');

            return;
        }

        $pilots = [];
        for ($i = 1; $i <= 60; $i++) {
            $pilots[] = User::firstOrCreate(
                ['email' => sprintf('pilot%02d@monsonglap.test', $i)],
                [
                    'full_name' => 'Pilot Student '.$i,
                    'password' => Hash::make('password123'),
                    'onboarding_complete' => true,
                    'language' => $i % 3 === 0 ? 'en' : 'bn',
                    'is_admin' => false,
                ]
            );
        }

        $styleCycle = ['strong', 'mixed', 'avoidant'];
        $created = 0;

        foreach ($pilots as $index => $user) {
            $style = $styleCycle[$index % 3];
            $toPlay = $scenarios->shuffle()->take(rand(2, 4));

            foreach ($toPlay as $scenario) {
                $path = $this->walkPath((int) $scenario->id, $style);
                if ($path === []) {
                    continue;
                }

                $session = MindGymSession::create([
                    'user_id' => $user->id,
                    'scenario_id' => $scenario->id,
                    'current_node_id' => 'N1',
                    'difficulty_level' => $scenario->difficulty,
                    'status' => 'active',
                    'mood_before' => rand(3, 7),
                    'started_at' => now()->subDays(rand(0, 14))->subMinutes(rand(5, 40)),
                ]);

                $node = 'N1';
                foreach ($path as $choiceId) {
                    $choice = MindGymChoice::find($choiceId);
                    if (! $choice) {
                        continue;
                    }
                    // Re-use service scoring path via direct discrete updates mirroring makeChoice
                    $impact = $choice->score_impact ?? [];
                    $session->coping_score += (int) ($impact['coping'] ?? 0);
                    $session->avoidance_score += (int) ($impact['avoidance'] ?? 0);
                    $session->clarity_score += (int) ($impact['clarity'] ?? 0);
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
                            'source' => 'pilot_proxy',
                        ],
                    ]);

                    $node = $choice->next_node_id;
                    $session->current_node_id = $node;
                }

                $ok = str_starts_with($node, 'END_') && str_contains($node, 'OK');
                $session->status = $ok ? 'completed' : (str_starts_with($node, 'END_') ? 'failed' : 'completed');
                $session->ended_at = $session->started_at->copy()->addSeconds(rand(90, 480));
                $session->mood_after = max(1, min(10, ($session->mood_before ?? 5) + ($ok ? rand(0, 2) : rand(-2, 0))));
                $session->overall_score = $service->computeOverallScore($session);
                $session->feedback_text = $ok
                    ? 'Pilot proxy: practiced a coping-forward path.'
                    : 'Pilot proxy: avoidance-heavy path — practice again with slower pacing.';
                $session->save();

                MindGymSessionEvent::create([
                    'session_id' => $session->id,
                    'event_type' => 'reflection',
                    'payload' => [
                        'text' => $ok
                            ? 'আমি একটু নার্ভাস ছিলাম কিন্তু একটা ছোট পদক্ষেপ নিয়েছি।'
                            : 'আমি এড়িয়ে গিয়েছিলাম — পরের বার আরেকটা চেষ্টা করব।',
                        'safetyLevel' => 'none',
                        'source' => 'pilot_proxy',
                    ],
                ]);

                // Progress update via service internals: refresh using reflect side-effect pattern
                $this->bumpProgress($session);
                $created++;
            }

            if ($index % 5 === 0) {
                FeedbackSubmission::create([
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'message' => "[Mind Gym Beta]\nScenario: mix\nHelpful: ".(3 + ($index % 3))."/5\nRelevant: ".(3 + (($index + 1) % 3))."/5\nFelt safe: 4/5\nNotes: proxy pilot feedback",
                    'status' => 'new',
                ]);
            }
        }

        $this->command?->info("Created {$created} pathway-valid pilot sessions for ".count($pilots).' proxy students.');
    }

    /** @return array<int, int> choice ids */
    private function walkPath(int $scenarioId, string $style): array
    {
        $choices = MindGymChoice::where('scenario_id', $scenarioId)->get()->groupBy('node_id');
        $path = [];
        $node = 'N1';
        $guard = 0;

        while ($guard++ < 12 && ! str_starts_with($node, 'END_')) {
            $options = $choices->get($node, collect());
            if ($options->isEmpty()) {
                break;
            }

            $picked = match ($style) {
                'strong' => $options->sortByDesc(function ($c) {
                    $i = $c->score_impact ?? [];

                    return ((int) ($i['coping'] ?? 0)) * 2
                        + ((int) ($i['clarity'] ?? 0))
                        + ((int) ($i['help_seeking'] ?? 0))
                        - ((int) ($i['avoidance'] ?? 0)) * 2;
                })->first(),
                'avoidant' => $options->sortByDesc(function ($c) {
                    $i = $c->score_impact ?? [];

                    return ((int) ($i['avoidance'] ?? 0)) * 3
                        + ((int) ($i['conflict'] ?? 0))
                        - ((int) ($i['coping'] ?? 0));
                })->first(),
                default => $options->values()->get($guard % max(1, $options->count())),
            };

            if (! $picked) {
                break;
            }

            $path[] = (int) $picked->id;
            $node = $picked->next_node_id;
        }

        return $path;
    }

    private function bumpProgress(MindGymSession $session): void
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
        $unlocked = $progress->unlocked_scenarios ?? [];
        if (! in_array($session->scenario->code, $unlocked, true)) {
            $unlocked[] = $session->scenario->code;
        }

        $progress->update([
            'sessions_completed' => $completed,
            'avg_score' => round($avg, 1),
            'xp' => $xp,
            'current_level' => min(5, 1 + intdiv($xp, 200)),
            'unlocked_scenarios' => $unlocked,
        ]);
    }
}
