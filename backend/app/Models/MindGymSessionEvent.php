<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MindGymSessionEvent extends Model
{
    protected $fillable = ['session_id', 'event_type', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(MindGymSession::class, 'session_id');
    }
}
