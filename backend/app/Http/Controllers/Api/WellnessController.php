<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AchievementDefinition;
use App\Models\FeedbackSubmission;
use App\Models\RecoveryPlanActivity;
use App\Models\SafetyPlan;
use App\Models\TrustedContact;
use App\Models\UserAchievement;
use App\Models\Notification as AppNotification;
use App\Services\RecoveryPlanService;
use App\Support\ApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WellnessController extends Controller
{
    public function __construct(private RecoveryPlanService $recoveryPlanService) {}

    public function recoveryPlan(Request $request): JsonResponse
    {
        $plan = $this->recoveryPlanService->ensureForUser($request->user());
        $plan->load('days.activities');

        return response()->json(ApiFormatter::recoveryPlan($plan));
    }

    public function toggleActivity(Request $request, RecoveryPlanActivity $activity): JsonResponse
    {
        $activity->load('day.plan');
        abort_if($activity->day->plan->user_id !== $request->user()->id, 403);

        $data = $request->validate(['completed' => 'required|boolean']);
        $activity->update(['completed' => $data['completed']]);

        $day = $activity->day()->with('activities')->first();
        $total = $day->activities->count();
        $done = $day->activities->where('completed', true)->count();
        $day->update(['completed_percent' => $total > 0 ? (int) round(($done / $total) * 100) : 0]);

        return response()->json(['success' => true, 'completedPercent' => $day->completed_percent]);
    }

    public function achievements(Request $request): JsonResponse
    {
        $defs = AchievementDefinition::where('is_active', true)->get();
        $unlocks = UserAchievement::where('user_id', $request->user()->id)->get()->keyBy('achievement_definition_id');

        return response()->json($defs->map(function ($def) use ($unlocks) {
            return ApiFormatter::achievement($def, $unlocks->get($def->id)?->unlocked_at?->toIso8601String());
        })->values());
    }

    public function trustedContacts(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->trustedContacts->map(fn ($c) => ApiFormatter::trustedContact($c))->values()
        );
    }

    public function storeTrustedContact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:30',
            'relationship' => 'required|string|max:100',
        ]);

        $contact = $request->user()->trustedContacts()->create($data);

        return response()->json(ApiFormatter::trustedContact($contact), 201);
    }

    public function safetyPlan(Request $request): JsonResponse
    {
        $plan = $request->user()->safetyPlan;

        return response()->json($plan ? ApiFormatter::safetyPlan($plan) : null);
    }

    public function updateSafetyPlan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'warningSigns' => 'nullable|array',
            'copingStrategies' => 'nullable|array',
            'distractions' => 'nullable|array',
            'trustedPeople' => 'nullable|array',
            'professionalContacts' => 'nullable|array',
            'safeEnvironment' => 'nullable|array',
        ]);

        $plan = SafetyPlan::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'warning_signs' => $data['warningSigns'] ?? [],
                'coping_strategies' => $data['copingStrategies'] ?? [],
                'distractions' => $data['distractions'] ?? [],
                'trusted_people' => $data['trustedPeople'] ?? [],
                'professional_contacts' => $data['professionalContacts'] ?? [],
                'safe_environment' => $data['safeEnvironment'] ?? [],
            ]
        );

        return response()->json(ApiFormatter::safetyPlan($plan));
    }

    public function notifications(Request $request): JsonResponse
    {
        $items = $request->user()->notifications()->latest()->get();

        return response()->json($items->map(fn ($n) => ApiFormatter::notification($n))->values());
    }

    public function markNotificationRead(Request $request, AppNotification $notification): JsonResponse
    {
        abort_if($notification->user_id !== $request->user()->id, 403);
        $notification->update(['read' => true]);

        return response()->json(ApiFormatter::notification($notification));
    }

    public function feedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'nullable|email',
            'message' => 'required|string|max:5000',
        ]);

        FeedbackSubmission::create([
            'user_id' => $request->user()?->id,
            'email' => $data['email'] ?? $request->user()?->email,
            'message' => $data['message'],
        ]);

        return response()->json(['success' => true], 201);
    }
}
