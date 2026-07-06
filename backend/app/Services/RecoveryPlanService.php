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
            return $existing;
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
                'goals' => ['recovery.goals.breathe', 'recovery.goals.reflect'],
                'tip_key' => 'recovery.tips.day'.$day,
                'completed_percent' => 0,
            ]);

            foreach (['recovery.activities.journal', 'recovery.activities.walk', 'recovery.activities.breathing'] as $label) {
                RecoveryPlanActivity::create([
                    'recovery_plan_day_id' => $planDay->id,
                    'label_key' => $label,
                    'completed' => false,
                ]);
            }
        }

        return $plan->load('days.activities');
    }
}
