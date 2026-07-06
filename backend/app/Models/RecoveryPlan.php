<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecoveryPlan extends Model
{
    protected $fillable = [
        'user_id', 'start_date', 'current_day', 'risk_profile',
    ];

    protected function casts(): array
    {
        return ['start_date' => 'date'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function days(): HasMany
    {
        return $this->hasMany(RecoveryPlanDay::class)->orderBy('day');
    }
}
