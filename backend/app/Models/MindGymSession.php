<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MindGymSession extends Model
{
    protected $fillable = [
        'user_id', 'scenario_id', 'current_node_id', 'difficulty_level', 'status',
        'coping_score', 'avoidance_score', 'clarity_score', 'overall_score',
        'feedback_text', 'mood_before', 'mood_after', 'started_at', 'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'overall_score' => 'float',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(MindGymScenario::class, 'scenario_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(MindGymSessionEvent::class, 'session_id');
    }
}
