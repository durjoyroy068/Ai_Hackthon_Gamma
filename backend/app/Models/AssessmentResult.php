<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentResult extends Model
{
    protected $fillable = [
        'user_id', 'scale_type', 'responses', 'total_score',
        'risk_level', 'mind_dialogue_summary',
    ];

    protected function casts(): array
    {
        return ['responses' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
