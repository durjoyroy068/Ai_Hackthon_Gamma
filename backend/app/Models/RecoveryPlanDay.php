<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecoveryPlanDay extends Model
{
    protected $fillable = [
        'recovery_plan_id', 'day', 'goals', 'tip_key', 'completed_percent',
    ];

    protected function casts(): array
    {
        return ['goals' => 'array'];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(RecoveryPlan::class, 'recovery_plan_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(RecoveryPlanActivity::class);
    }
}
