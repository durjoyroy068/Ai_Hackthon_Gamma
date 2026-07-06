<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmergencyResource;
use App\Models\FaqItem;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function emergencyResources(): JsonResponse
    {
        $resources = EmergencyResource::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($r) => [
                'id' => (string) $r->id,
                'name' => $r->name,
                'nameBn' => $r->name_bn,
                'phone' => $r->phone,
                'url' => $r->url,
                'region' => $r->region,
            ]);

        return response()->json($resources);
    }

    public function faq(): JsonResponse
    {
        $items = FaqItem::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($f) => [
                'id' => (string) $f->id,
                'questionKey' => $f->question_key,
                'answerKey' => $f->answer_key,
                'category' => $f->category,
            ]);

        return response()->json($items);
    }
}
