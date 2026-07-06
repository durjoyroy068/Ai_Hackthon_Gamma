<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('recovery_email')->nullable();
            $table->string('recovery_phone')->nullable();
            $table->string('age_band')->default('18-24');
            $table->string('language', 5)->default('bn');
            $table->string('country')->default('Bangladesh');
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->string('avatar_url')->nullable();
            $table->boolean('onboarding_complete')->default(false);
            $table->boolean('phone_verified')->default(false);
            $table->boolean('is_admin')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('guardian_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('guardian_name');
            $table->string('guardian_email');
            $table->string('guardian_phone');
            $table->boolean('consent_given')->default(false);
            $table->timestamp('consent_date')->nullable();
            $table->timestamps();
        });

        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('theme')->default('system');
            $table->boolean('high_contrast')->default(false);
            $table->boolean('use_bangla_numerals')->default(false);
            $table->boolean('voice_consent_given')->default(false);
            $table->boolean('voice_auto_delete')->default(true);
            $table->string('ai_tone')->default('warm');
            $table->boolean('mood_reminders')->default(true);
            $table->boolean('weekly_reports')->default(true);
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('target');
            $table->string('type', 10);
            $table->string('code', 6);
            $table->timestamp('expires_at');
            $table->boolean('used')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('user_settings');
        Schema::dropIfExists('guardian_consents');
        Schema::dropIfExists('users');
    }
};
