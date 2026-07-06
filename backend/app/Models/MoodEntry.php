<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoodEntry extends Model
{
    protected $fillable = [
        'user_id', 'date', 'mood_score', 'emotions', 'note',
        'sleep', 'hydration', 'exercise', 'meditation', 'gratitude', 'reflection',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'emotions' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
