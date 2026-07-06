<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->boolean('pinned')->default(false);
            $table->foreignId('folder_id')->nullable()->constrained('chat_folders')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20);
            $table->longText('content');
            $table->string('safety_level', 20)->default('none');
            $table->boolean('liked')->nullable();
            $table->timestamps();
        });

        Schema::create('mood_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedTinyInteger('mood_score');
            $table->json('emotions')->nullable();
            $table->text('note')->nullable();
            $table->unsignedTinyInteger('sleep')->nullable();
            $table->unsignedTinyInteger('hydration')->nullable();
            $table->unsignedTinyInteger('exercise')->nullable();
            $table->unsignedTinyInteger('meditation')->nullable();
            $table->text('gratitude')->nullable();
            $table->text('reflection')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'date']);
        });

        Schema::create('assessment_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('scale_type', 20);
            $table->json('responses');
            $table->unsignedSmallInteger('total_score');
            $table->string('risk_level', 20);
            $table->text('mind_dialogue_summary')->nullable();
            $table->timestamps();
        });

        Schema::create('voice_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('duration_seconds');
            $table->json('detected_emotions');
            $table->json('acoustic_features');
            $table->boolean('consent_given')->default(true);
            $table->string('audio_path')->nullable();
            $table->timestamps();
        });

        Schema::create('recovery_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->unsignedSmallInteger('current_day')->default(1);
            $table->string('risk_profile', 20)->default('mild');
            $table->timestamps();
        });

        Schema::create('recovery_plan_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recovery_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('day');
            $table->json('goals');
            $table->string('tip_key');
            $table->unsignedTinyInteger('completed_percent')->default(0);
            $table->timestamps();
        });

        Schema::create('recovery_plan_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recovery_plan_day_id')->constrained()->cascadeOnDelete();
            $table->string('label_key');
            $table->boolean('completed')->default(false);
            $table->timestamps();
        });

        Schema::create('achievement_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('title_key');
            $table->string('description_key');
            $table->string('icon', 50);
            $table->boolean('gentle')->default(true);
            $table->string('unlock_criteria', 50)->default('manual');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('achievement_definition_id')->constrained()->cascadeOnDelete();
            $table->timestamp('unlocked_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'achievement_definition_id']);
        });

        Schema::create('trusted_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone');
            $table->string('relationship');
            $table->timestamps();
        });

        Schema::create('safety_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('warning_signs')->nullable();
            $table->json('coping_strategies')->nullable();
            $table->json('distractions')->nullable();
            $table->json('trusted_people')->nullable();
            $table->json('professional_contacts')->nullable();
            $table->json('safe_environment')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title_key');
            $table->string('body_key');
            $table->boolean('read')->default(false);
            $table->timestamps();
        });

        Schema::create('emergency_resources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_bn')->nullable();
            $table->string('phone');
            $table->string('url')->nullable();
            $table->string('region')->default('Bangladesh');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('faq_items', function (Blueprint $table) {
            $table->id();
            $table->string('question_key');
            $table->string('answer_key');
            $table->string('category')->default('general');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('chat_response_templates', function (Blueprint $table) {
            $table->id();
            $table->string('category')->default('default');
            $table->text('content');
            $table->json('keywords')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('feedback_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email')->nullable();
            $table->text('message');
            $table->string('status', 20)->default('new');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_submissions');
        Schema::dropIfExists('chat_response_templates');
        Schema::dropIfExists('faq_items');
        Schema::dropIfExists('emergency_resources');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('safety_plans');
        Schema::dropIfExists('trusted_contacts');
        Schema::dropIfExists('user_achievements');
        Schema::dropIfExists('achievement_definitions');
        Schema::dropIfExists('recovery_plan_activities');
        Schema::dropIfExists('recovery_plan_days');
        Schema::dropIfExists('recovery_plans');
        Schema::dropIfExists('voice_samples');
        Schema::dropIfExists('assessment_results');
        Schema::dropIfExists('mood_entries');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('chat_folders');
    }
};
