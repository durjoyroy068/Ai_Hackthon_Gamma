<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyResource extends Model
{
    protected $fillable = [
        'name', 'name_bn', 'phone', 'url', 'region', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
