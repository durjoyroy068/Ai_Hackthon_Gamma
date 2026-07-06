<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'full_name', 'email', 'phone', 'recovery_email', 'recovery_phone',
    'age_band', 'language', 'country', 'date_of_birth', 'gender',
    'is_anonymous', 'avatar_url', 'onboarding_complete', 'phone_verified',
    'is_admin', 'password', 'email_verified_at',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_of_birth' => 'date',
            'password' => 'hashed',
            'is_anonymous' => 'boolean',
            'onboarding_complete' => 'boolean',
            'phone_verified' => 'boolean',
            'is_admin' => 'boolean',
        ];
    }

    public function guardianConsent(): HasOne
    {
        return $this->hasOne(GuardianConsent::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function folders(): HasMany
    {
        return $this->hasMany(ChatFolder::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function moodEntries(): HasMany
    {
        return $this->hasMany(MoodEntry::class);
    }

    public function assessmentResults(): HasMany
    {
        return $this->hasMany(AssessmentResult::class);
    }

    public function recoveryPlan(): HasOne
    {
        return $this->hasOne(RecoveryPlan::class);
    }

    public function trustedContacts(): HasMany
    {
        return $this->hasMany(TrustedContact::class);
    }

    public function safetyPlan(): HasOne
    {
        return $this->hasOne(SafetyPlan::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
