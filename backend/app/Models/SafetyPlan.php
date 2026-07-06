<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SafetyPlan extends Model
{
    protected $fillable = [
        'user_id', 'warning_signs', 'coping_strategies', 'distractions',
        'trusted_people', 'professional_contacts', 'safe_environment',
    ];

    protected function casts(): array
    {
        return [
            'warning_signs' => 'array',
            'coping_strategies' => 'array',
            'distractions' => 'array',
            'trusted_people' => 'array',
            'professional_contacts' => 'array',
            'safe_environment' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
