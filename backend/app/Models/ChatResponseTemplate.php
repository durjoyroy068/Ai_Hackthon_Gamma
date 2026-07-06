<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatResponseTemplate extends Model
{
    protected $fillable = ['category', 'content', 'keywords', 'is_active'];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
