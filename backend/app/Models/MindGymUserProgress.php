<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MindGymUserProgress extends Model
{
    protected $table = 'mind_gym_user_progress';

    protected $fillable = [
        'user_id', 'category', 'current_level', 'xp', 'sessions_completed', 'avg_score', 'unlocked_scenarios',
    ];

    protected function casts(): array
    {
        return [
            'avg_score' => 'float',
            'unlocked_scenarios' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
