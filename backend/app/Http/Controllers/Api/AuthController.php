<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserSetting;
use App\Services\OtpService;
use App\Services\RecoveryPlanService;
use App\Support\ApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private OtpService $otpService,
        private RecoveryPlanService $recoveryPlanService,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fullName' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => ['required', Password::min(8)],
            'ageBand' => 'nullable|in:13-17,18-24,25+',
            'language' => 'nullable|in:bn,en',
            'country' => 'nullable|string|max:100',
            'dateOfBirth' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'isAnonymous' => 'nullable|boolean',
        ]);

        $user = User::create([
            'full_name' => $data['fullName'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'age_band' => $data['ageBand'] ?? '18-24',
            'language' => $data['language'] ?? 'bn',
            'country' => $data['country'] ?? 'Bangladesh',
            'date_of_birth' => $data['dateOfBirth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'is_anonymous' => $data['isAnonymous'] ?? false,
        ]);

        UserSetting::create(['user_id' => $user->id]);
        $this->recoveryPlanService->ensureForUser($user);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => ApiFormatter::user($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => ApiFormatter::user($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('guardianConsent');

        return response()->json(ApiFormatter::user($user));
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'target' => 'required|string',
            'type' => 'required|in:email,phone',
        ]);

        $this->otpService->send($data['target'], $data['type']);

        return response()->json(['success' => true]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'target' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $valid = $this->otpService->verify($data['target'], $data['code']);

        return response()->json(['success' => $valid], $valid ? 200 : 422);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email']);
        $this->otpService->send($data['email'], 'email');

        return response()->json(['success' => true]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => ['required', Password::min(8)],
        ]);

        if (! $this->otpService->verify($data['email'], $data['code'])) {
            return response()->json(['message' => 'Invalid code'], 422);
        }

        $user = User::where('email', $data['email'])->firstOrFail();
        $user->update(['password' => $data['password']]);

        return response()->json(['success' => true]);
    }
}
