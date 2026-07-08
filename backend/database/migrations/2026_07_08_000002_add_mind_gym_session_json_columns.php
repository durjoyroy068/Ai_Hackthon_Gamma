<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mind_gym_sessions', function (Blueprint $table): void {
            $table->json('scenario_json')->nullable()->after('difficulty_level');
            $table->json('transcript_json')->nullable()->after('feedback_text');
            $table->json('scores_json')->nullable()->after('transcript_json');
            $table->string('confidence_signal', 20)->nullable()->after('scores_json');
        });
    }

    public function down(): void
    {
        Schema::table('mind_gym_sessions', function (Blueprint $table): void {
            $table->dropColumn(['scenario_json', 'transcript_json', 'scores_json', 'confidence_signal']);
        });
    }
};

