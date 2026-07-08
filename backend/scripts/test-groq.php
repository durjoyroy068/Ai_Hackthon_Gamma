<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$keys = config('services.groq.api_keys', []);
echo 'configured_keys='.count($keys).PHP_EOL;

$url = rtrim(config('services.groq.base_url'), '/').'/chat/completions';
$model = config('services.groq.model');

if (count($keys) === 0) {
    echo 'No GROQ_API_KEYS configured'.PHP_EOL;
    exit(1);
}

$response = \Illuminate\Support\Facades\Http::withToken($keys[0])
    ->timeout(30)
    ->post($url, [
        'model' => $model,
        'messages' => [
            ['role' => 'system', 'content' => 'You are a concise helper.'],
            ['role' => 'user', 'content' => 'Reply with one short Bengali greeting.'],
        ],
        'temperature' => 0.2,
        'max_tokens' => 40,
    ]);

echo 'status='.$response->status().PHP_EOL;
$text = $response->json('choices.0.message.content');
echo 'ai='.($text ? trim($text) : 'FAILED: '.$response->body()).PHP_EOL;
