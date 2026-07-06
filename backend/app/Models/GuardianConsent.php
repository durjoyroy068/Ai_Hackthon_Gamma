<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardianConsent extends Model
{
    protected $fillable = [
        'user_id', 'guardian_name', 'guardian_email', 'guardian_phone',
        'consent_given', 'consent_date',
    ];

    protected function casts(): array
    {
        return [
            'consent_given' => 'boolean',
            'consent_date' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
