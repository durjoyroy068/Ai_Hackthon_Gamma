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

    public function analytics(): JsonResponse
    {
        return response()->json($this->mindGym->betaAnalytics());
    }

    public function protocol(): JsonResponse
    {
        return response()->json($this->mindGym->rubricMeta());
    }

    public function intake(Request $request): JsonResponse
    {
        return response()->json($this->mindGym->intakeQuestionnaire($request->user()));
    }

    public function recommend(Request $request): JsonResponse
    {
        $data = $request->validate([
            'answers' => 'required|array',
            'answers.problem' => 'required_without:answers.stress_type|string',
            'answers.stress_type' => 'nullable|string',
            'answers.intensity' => 'required|string',
            'answers.prior_experience' => 'nullable|string',
            'answers.goal' => 'nullable|string',
            'answers.body_signal' => 'nullable|string',
            'answers.support_level' => 'nullable|string',
            'answers.practice_goal' => 'nullable|string',
        ]);

        return response()->json(
            $this->mindGym->recommendFromIntake($request->user(), $data['answers'])
        );
    }

    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'scenarioId' => 'required|integer|exists:mind_gym_scenarios,id',
            'moodBefore' => 'nullable|integer|min:1|max:10',
            'intakeAnswers' => 'nullable|array',
            'language' => 'nullable|in:bn,en',
        ]);

        return response()->json(
            $this->mindGym->startSession(
                $request->user(),
                (int) $data['scenarioId'],
                $data['moodBefore'] ?? null,
                $data['language'] ?? null
            ),
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

    public function npcTurn(Request $request): JsonResponse
    {
        $data = $request->validate([
            'context' => 'nullable|array',
            'studentInput' => 'required|string|max:500',
        ]);

        return response()->json(
            $this->mindGym->npcTurn($data['context'] ?? [], $data['studentInput'])
        );
    }

    public function storyTurn(Request $request, MindGymSession $session): JsonResponse
    {
        abort_if($session->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'studentInput' => 'required|string|max:1000',
            'language' => 'nullable|in:bn,en',
        ]);

        return response()->json(
            $this->mindGym->storyTurn($session, $data['studentInput'], $data['language'] ?? null)
        );
    }
}
