<?php

use App\Models\MindGymSession;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mind-gym:beta-report {--output=}', function () {
    /** @var \App\Services\MindGymService $service */
    $service = app(\App\Services\MindGymService::class);
    $report = $service->betaAnalytics();

    $out = $this->option('output')
        ?: dirname(base_path()).DIRECTORY_SEPARATOR.'Dataset'.DIRECTORY_SEPARATOR.'MindGym'.DIRECTORY_SEPARATOR.'beta_analytics_report.json';

    file_put_contents($out, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    $this->info('Mind Gym beta analytics');
    $this->line('Sessions: '.$report['totalSessions']);
    $this->line('Users: '.$report['uniqueUsers']);
    $this->line('Avg score: '.$report['avgOverallScore']);
    $this->line('Completion %: '.$report['completionRate']);
    $this->line('Feedback: '.$report['betaFeedbackCount']);
    $this->line('Protocol: '.$report['protocol']['version'].' / '.$report['protocol']['status']);
    $this->info('Wrote '.$out);

    return 0;
})->purpose('Write Mind Gym beta analytics JSON report');

Artisan::command('mind-gym:export-sessions {--output=}', function () {
    $out = $this->option('output')
        ?: dirname(base_path()).DIRECTORY_SEPARATOR.'Dataset'.DIRECTORY_SEPARATOR.'MindGym'.DIRECTORY_SEPARATOR.'exported_sessions.csv';

    $sessions = MindGymSession::with(['scenario', 'user'])
        ->whereIn('status', ['completed', 'failed'])
        ->orderBy('id')
        ->get();

    $handle = fopen($out, 'w');
    if ($handle === false) {
        $this->error('Cannot write to '.$out);

        return 1;
    }

    fputcsv($handle, [
        'session_id', 'user_id', 'scenario_id', 'difficulty_level', 'user_response',
        'response_time_sec', 'choice_made', 'clarity_score', 'coping_score',
        'avoidance_score', 'overall_score', 'feedback_text', 'source',
    ]);

    foreach ($sessions as $s) {
        $reflection = $s->events()->where('event_type', 'reflection')->latest()->first();
        fputcsv($handle, [
            'S'.$s->id,
            'U'.$s->user_id,
            $s->scenario?->code ?? '',
            $s->difficulty_level,
            $reflection?->payload['text'] ?? '',
            $s->started_at && $s->ended_at ? $s->ended_at->diffInSeconds($s->started_at) : '',
            $s->status === 'completed' ? 'cope' : 'avoid',
            $s->clarity_score,
            $s->coping_score,
            $s->avoidance_score,
            $s->overall_score,
            $s->feedback_text,
            'app_export',
        ]);
    }

    fclose($handle);
    $this->info('Exported '.$sessions->count().' sessions to '.$out);

    return 0;
})->purpose('Export Mind Gym sessions to CSV for training');
