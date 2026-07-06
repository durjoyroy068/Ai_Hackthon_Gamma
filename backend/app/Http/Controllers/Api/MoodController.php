<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MoodEntry;
use App\Support\ApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MoodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = $request->user()->moodEntries()->orderByDesc('date')->get();

        return response()->json($entries->map(fn ($e) => ApiFormatter::moodEntry($e))->values());
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'date' => 'required|date',
            'moodScore' => 'required|integer|min:1|max:10',
            'emotions' => 'nullable|array',
            'note' => 'nullable|string',
            'sleep' => 'nullable|integer|min:0|max:10',
            'hydration' => 'nullable|integer|min:0|max:10',
            'exercise' => 'nullable|integer|min:0|max:10',
            'meditation' => 'nullable|integer|min:0|max:10',
            'gratitude' => 'nullable|string',
            'reflection' => 'nullable|string',
        ]);

        $entry = MoodEntry::updateOrCreate(
            ['user_id' => $user->id, 'date' => $data['date']],
            [
                'mood_score' => $data['moodScore'],
                'emotions' => $data['emotions'] ?? [],
                'note' => $data['note'] ?? null,
                'sleep' => $data['sleep'] ?? null,
                'hydration' => $data['hydration'] ?? null,
                'exercise' => $data['exercise'] ?? null,
                'meditation' => $data['meditation'] ?? null,
                'gratitude' => $data['gratitude'] ?? null,
                'reflection' => $data['reflection'] ?? null,
            ]
        );

        return response()->json(ApiFormatter::moodEntry($entry), 201);
    }
}
