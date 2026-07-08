<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseAuthService
{
    /**
     * Verify a Firebase ID token and return normalized user claims.
     *
     * @return array{uid: string, email: string, name: string, picture: ?string, email_verified: bool}|null
     */
    public function verifyIdToken(string $idToken): ?array
    {
        $apiKey = config('services.firebase.web_api_key');
        $projectId = config('services.firebase.project_id');

        if (! filled($apiKey) || ! filled($projectId)) {
            Log::warning('Firebase is not configured');

            return null;
        }

        try {
            // Identity Toolkit lookup validates Firebase ID tokens for this Web API key.
            $response = Http::timeout(20)
                ->asJson()
                ->post('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='.$apiKey, [
                    'idToken' => $idToken,
                ]);

            if (! $response->successful()) {
                Log::warning('Firebase ID token lookup failed', [
                    'status' => $response->status(),
                    'body' => $response->json('error.message') ?? $response->body(),
                ]);

                return null;
            }

            $user = $response->json('users.0');
            if (! is_array($user) || ! filled($user['localId'] ?? null) || ! filled($user['email'] ?? null)) {
                return null;
            }

            $provider = collect($user['providerUserInfo'] ?? [])
                ->firstWhere('providerId', 'google.com');

            return [
                'uid' => (string) $user['localId'],
                'email' => (string) $user['email'],
                'name' => (string) ($user['displayName'] ?? ($provider['displayName'] ?? $user['email'])),
                'picture' => isset($user['photoUrl'])
                    ? (string) $user['photoUrl']
                    : (isset($provider['photoUrl']) ? (string) $provider['photoUrl'] : null),
                'email_verified' => (bool) ($user['emailVerified'] ?? false),
            ];
        } catch (\Throwable $e) {
            Log::error('Firebase token verification exception', ['message' => $e->getMessage()]);

            return null;
        }
    }
}
