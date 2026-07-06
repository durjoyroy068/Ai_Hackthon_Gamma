<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAchievement extends Model
{
    protected $fillable = [
        'user_id', 'achievement_definition_id', 'unlocked_at',
    ];

    protected function casts(): array
    {
        return ['unlocked_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(AchievementDefinition::class, 'achievement_definition_id');
    }
}
