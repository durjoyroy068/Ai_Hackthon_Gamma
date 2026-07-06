<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecoveryPlanActivity extends Model
{
    protected $fillable = ['recovery_plan_day_id', 'label_key', 'completed'];

    protected function casts(): array
    {
        return ['completed' => 'boolean'];
    }

    public function day(): BelongsTo
    {
        return $this->belongsTo(RecoveryPlanDay::class, 'recovery_plan_day_id');
    }
}
