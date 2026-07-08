<?php

namespace App\Services;

use App\Models\RecoveryPlan;
use App\Models\RecoveryPlanActivity;
use App\Models\RecoveryPlanDay;
use App\Models\User;

class RecoveryPlanService
{
    public function ensureForUser(User $user, string $riskProfile = 'mild'): RecoveryPlan
    {
        $existing = $user->recoveryPlan()->with('days.activities')->first();
        if ($existing) {
            $this->repairTranslationKeys($existing);

            return $existing->fresh(['days.activities']);
        }

        $plan = RecoveryPlan::create([
            'user_id' => $user->id,
            'start_date' => now()->toDateString(),
            'current_day' => 1,
            'risk_profile' => $riskProfile,
        ]);

        for ($day = 1; $day <= 30; $day++) {
            $planDay = RecoveryPlanDay::create([
                'recovery_plan_id' => $plan->id,
                'day' => $day,
                'goals' => $this->goalsForDay($day),
                'tip_key' => $this->tipKeyForProfile($riskProfile),
                'completed_percent' => 0,
            ]);

            foreach ($this->activityLabelsForDay($day) as $label) {
                RecoveryPlanActivity::create([
                    'recovery_plan_day_id' => $planDay->id,
                    'label_key' => $label,
                    'completed' => false,
                ]);
            }
        }

        return $plan->load('days.activities');
    }

    /** @return array<int, string> */
    private function goalsForDay(int $day): array
    {
        $sets = [
            ['recovery.goals.breathing', 'recovery.goals.journal'],
            ['recovery.goals.walk', 'recovery.goals.breathing'],
            ['recovery.goals.sleep', 'recovery.goals.journal'],
            ['recovery.goals.walk', 'recovery.goals.sleep'],
        ];

        return $sets[($day - 1) % count($sets)];
    }

    /** @return array<int, string> */
    private function activityLabelsForDay(int $day): array
    {
        $sets = [
            ['recovery.activities.breathing', 'recovery.activities.journal', 'recovery.activities.hydration'],
            ['recovery.activities.walking', 'recovery.activities.meditation', 'recovery.activities.sleep'],
            ['recovery.activities.journal', 'recovery.activities.reading', 'recovery.activities.breathing'],
            ['recovery.activities.walking', 'recovery.activities.hydration', 'recovery.activities.sleep'],
        ];

        return $sets[($day - 1) % count($sets)];
    }

    private function tipKeyForProfile(string $riskProfile): string
    {
        return match ($riskProfile) {
            'minimal' => 'recovery.tips.minimal',
            'moderate' => 'recovery.tips.moderate',
            'high', 'severe' => 'recovery.tips.high',
            default => 'recovery.tips.mild',
        };
    }

    private function repairTranslationKeys(RecoveryPlan $plan): void
    {
        $goalMap = [
            'recovery.goals.breathe' => 'recovery.goals.breathing',
            'recovery.goals.reflect' => 'recovery.goals.journal',
        ];
        $activityMap = [
            'recovery.activities.journal' => 'recovery.activities.journal',
            'recovery.activities.walk' => 'recovery.activities.walking',
            'recovery.activities.breathing' => 'recovery.activities.breathing',
        ];

        foreach ($plan->days as $day) {
            $goals = is_array($day->goals) ? $day->goals : [];
            $fixedGoals = array_values(array_map(
                fn ($g) => $goalMap[$g] ?? (str_starts_with((string) $g, 'recovery.goals.') ? (string) $g : 'recovery.goals.breathing'),
                $goals
            ));
            if ($fixedGoals === []) {
                $fixedGoals = $this->goalsForDay((int) $day->day);
            }

            $tipKey = (string) $day->tip_key;
            if (! in_array($tipKey, ['recovery.tips.minimal', 'recovery.tips.mild', 'recovery.tips.moderate', 'recovery.tips.high'], true)) {
                $tipKey = $this->tipKeyForProfile((string) $plan->risk_profile);
            }

            $dirty = $fixedGoals !== $goals || $tipKey !== $day->tip_key;
            if ($dirty) {
                $day->update([
                    'goals' => $fixedGoals,
                    'tip_key' => $tipKey,
                ]);
            }

            foreach ($day->activities as $activity) {
                $label = (string) $activity->label_key;
                $fixed = $activityMap[$label] ?? $label;
                if ($fixed === 'recovery.activities.walk') {
                    $fixed = 'recovery.activities.walking';
                }
                if (! str_starts_with($fixed, 'recovery.activities.')) {
                    $fixed = 'recovery.activities.breathing';
                }
                if ($fixed !== $label) {
                    $activity->update(['label_key' => $fixed]);
                }
            }

            // Ensure journal activity label exists in i18n (alias to mood journal wording via bn/en).
            if ($day->activities->isEmpty()) {
                foreach ($this->activityLabelsForDay((int) $day->day) as $label) {
                    RecoveryPlanActivity::create([
                        'recovery_plan_day_id' => $day->id,
                        'label_key' => $label,
                        'completed' => false,
                    ]);
                }
            }
        }
    }
}
