<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AchievementDefinition extends Model
{
    protected $fillable = [
        'title_key', 'description_key', 'icon', 'gentle',
        'unlock_criteria', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'gentle' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function userAchievements(): HasMany
    {
        return $this->hasMany(UserAchievement::class);
    }
}
