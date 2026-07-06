<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MindGymChoice extends Model
{
    protected $fillable = [
        'scenario_id', 'node_id', 'choice_text_bn', 'choice_text_en',
        'next_node_id', 'score_impact', 'difficulty_delta',
    ];

    protected function casts(): array
    {
        return [
            'score_impact' => 'array',
            'difficulty_delta' => 'integer',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(MindGymScenario::class, 'scenario_id');
    }
}
