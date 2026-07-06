<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$key = config('services.gemini.api_key');
echo 'configured='.(filled($key) ? 'yes' : 'no').PHP_EOL;

$model = config('services.gemini.model');
$url = rtrim(config('services.gemini.base_url'), '/')."/models/{$model}:generateContent";

$response = \Illuminate\Support\Facades\Http::withHeaders([
    'x-goog-api-key' => $key,
    'Content-Type' => 'application/json',
])->timeout(30)->post($url, [
    'contents' => [
        ['role' => 'user', 'parts' => [['text' => 'হ্যালো']]],
    ],
    'generationConfig' => ['maxOutputTokens' => 60],
]);

echo 'status='.$response->status().PHP_EOL;
$text = $response->json('candidates.0.content.parts.0.text');
echo 'ai='.($text ? mb_substr($text, 0, 150) : 'FAILED: '.$response->body()).PHP_EOL;
