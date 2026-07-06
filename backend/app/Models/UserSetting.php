<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    protected $fillable = [
        'user_id', 'theme', 'high_contrast', 'use_bangla_numerals',
        'voice_consent_given', 'voice_auto_delete', 'ai_tone',
        'mood_reminders', 'weekly_reports',
    ];

    protected function casts(): array
    {
        return [
            'high_contrast' => 'boolean',
            'use_bangla_numerals' => 'boolean',
            'voice_consent_given' => 'boolean',
            'voice_auto_delete' => 'boolean',
            'mood_reminders' => 'boolean',
            'weekly_reports' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
