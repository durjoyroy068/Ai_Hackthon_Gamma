<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentResult;
use App\Services\AssessmentScoringService;
use App\Services\RecoveryPlanService;
use App\Support\ApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function __construct(
        private AssessmentScoringService $scoringService,
        private RecoveryPlanService $recoveryPlanService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $results = $request->user()->assessmentResults()->latest()->get();

        return response()->json($results->map(fn ($r) => ApiFormatter::assessment($r))->values());
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'scaleType' => 'required|in:PHQ-9,GAD-7,PHQ-A,RCADS',
            'responses' => 'required|array',
        ]);

        $scored = $this->scoringService->score($data['scaleType'], $data['responses']);

        $result = AssessmentResult::create([
            'user_id' => $user->id,
            'scale_type' => $data['scaleType'],
            'responses' => $data['responses'],
            'total_score' => $scored['totalScore'],
            'risk_level' => $scored['riskLevel'],
            'mind_dialogue_summary' => $scored['mindDialogueSummary'],
        ]);

        $this->recoveryPlanService->ensureForUser($user, $scored['riskLevel']);

        return response()->json(ApiFormatter::assessment($result), 201);
    }
}
