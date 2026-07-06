<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MindGymScenario extends Model
{
    protected $fillable = [
        'code', 'title_bn', 'title_en', 'category', 'difficulty', 'intake_tags',
        'setting_description_bn', 'setting_description_en',
        'opening_scene_bn', 'opening_scene_en', 'npc_roles', 'duration_minutes', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function choices(): HasMany
    {
        return $this->hasMany(MindGymChoice::class, 'scenario_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(MindGymSession::class, 'scenario_id');
    }
}
