<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MindGymSession;
use App\Services\MindGymService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MindGymController extends Controller
{
    public function __construct(private MindGymService $mindGym) {}

    public function scenarios(Request $request): JsonResponse
    {
        return response()->json($this->mindGym->listScenarios($request->user()));
    }

    public function progress(Request $request): JsonResponse
    {
        return response()->json($this->mindGym->userProgress($request->user()));
    }

    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'scenarioId' => 'required|integer|exists:mind_gym_scenarios,id',
            'moodBefore' => 'nullable|integer|min:1|max:10',
        ]);

        return response()->json(
            $this->mindGym->startSession($request->user(), (int) $data['scenarioId'], $data['moodBefore'] ?? null),
            201
        );
    }

    public function show(Request $request, MindGymSession $session): JsonResponse
    {
        abort_if($session->user_id !== $request->user()->id, 403);

        return response()->json($this->mindGym->sessionState($session));
    }

    public function choose(Request $request, MindGymSession $session): JsonResponse
    {
        abort_if($session->user_id !== $request->user()->id, 403);

        $data = $request->validate(['choiceId' => 'required|integer']);

        return response()->json($this->mindGym->makeChoice($session, (int) $data['choiceId']));
    }

    public function reflect(Request $request, MindGymSession $session): JsonResponse
    {
        abort_if($session->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'reflection' => 'required|string|max:2000',
            'moodAfter' => 'nullable|integer|min:1|max:10',
        ]);

        return response()->json(
            $this->mindGym->completeWithReflection($session, $data['reflection'], $data['moodAfter'] ?? null)
        );
    }
}
