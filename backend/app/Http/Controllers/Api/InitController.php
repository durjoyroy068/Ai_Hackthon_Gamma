<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AchievementDefinition;
use App\Models\UserAchievement;
use App\Services\RecoveryPlanService;
use App\Support\ApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InitController extends Controller
{
    public function __construct(private RecoveryPlanService $recoveryPlanService) {}

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'guardianConsent',
            'folders',
            'conversations.messages',
            'moodEntries',
            'assessmentResults',
            'trustedContacts',
            'safetyPlan',
            'notifications',
        ]);

        $recoveryPlan = $this->recoveryPlanService->ensureForUser($user);
        $recoveryPlan->load('days.activities');

        $achievements = AchievementDefinition::where('is_active', true)->get();
        $unlocks = UserAchievement::where('user_id', $user->id)->get()->keyBy('achievement_definition_id');

        return response()->json([
            'user' => ApiFormatter::user($user),
            'conversations' => $user->conversations->map(fn ($c) => ApiFormatter::conversation($c))->values(),
            'folders' => $user->folders->map(fn ($f) => ApiFormatter::folder($f))->values(),
            'moodEntries' => $user->moodEntries->map(fn ($m) => ApiFormatter::moodEntry($m))->values(),
            'assessments' => $user->assessmentResults->map(fn ($a) => ApiFormatter::assessment($a))->values(),
            'recoveryPlan' => ApiFormatter::recoveryPlan($recoveryPlan),
            'achievements' => $achievements->map(function ($def) use ($unlocks) {
                $unlock = $unlocks->get($def->id);

                return ApiFormatter::achievement(
                    $def,
                    $unlock?->unlocked_at?->toIso8601String()
                );
            })->values(),
            'trustedContacts' => $user->trustedContacts->map(fn ($c) => ApiFormatter::trustedContact($c))->values(),
            'safetyPlan' => $user->safetyPlan
                ? ApiFormatter::safetyPlan($user->safetyPlan)
                : null,
            'notifications' => $user->notifications->map(fn ($n) => ApiFormatter::notification($n))->values(),
        ]);
    }
}
