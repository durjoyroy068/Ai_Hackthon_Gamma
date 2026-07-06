<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mind_gym_scenarios', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('title_bn');
            $table->string('title_en');
            $table->string('category', 40);
            $table->string('difficulty', 20)->default('medium');
            $table->string('intake_tags')->nullable();
            $table->text('setting_description_bn');
            $table->text('setting_description_en');
            $table->text('opening_scene_bn');
            $table->text('opening_scene_en');
            $table->string('npc_roles')->nullable();
            $table->unsignedTinyInteger('duration_minutes')->default(8);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('mind_gym_choices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scenario_id')->constrained('mind_gym_scenarios')->cascadeOnDelete();
            $table->string('node_id', 20);
            $table->text('choice_text_bn');
            $table->text('choice_text_en');
            $table->string('next_node_id', 20);
            $table->json('score_impact')->nullable();
            $table->tinyInteger('difficulty_delta')->default(0);
            $table->timestamps();
        });

        Schema::create('mind_gym_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('scenario_id')->constrained('mind_gym_scenarios')->cascadeOnDelete();
            $table->string('current_node_id', 20)->default('N1');
            $table->string('difficulty_level', 20)->default('medium');
            $table->string('status', 20)->default('active');
            $table->unsignedTinyInteger('coping_score')->default(0);
            $table->unsignedTinyInteger('avoidance_score')->default(0);
            $table->unsignedTinyInteger('clarity_score')->default(0);
            $table->decimal('overall_score', 4, 1)->nullable();
            $table->text('feedback_text')->nullable();
            $table->unsignedTinyInteger('mood_before')->nullable();
            $table->unsignedTinyInteger('mood_after')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });

        Schema::create('mind_gym_session_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('mind_gym_sessions')->cascadeOnDelete();
            $table->string('event_type', 30);
            $table->json('payload')->nullable();
            $table->timestamps();
        });

        Schema::create('mind_gym_user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category', 40);
            $table->unsignedTinyInteger('current_level')->default(1);
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedInteger('sessions_completed')->default(0);
            $table->decimal('avg_score', 4, 1)->default(0);
            $table->json('unlocked_scenarios')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mind_gym_session_events');
        Schema::dropIfExists('mind_gym_sessions');
        Schema::dropIfExists('mind_gym_user_progress');
        Schema::dropIfExists('mind_gym_choices');
        Schema::dropIfExists('mind_gym_scenarios');
    }
};
