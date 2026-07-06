<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuardianConsent;
use App\Models\UserSetting;
use App\Support\ApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'fullName' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:30',
            'recoveryEmail' => 'sometimes|nullable|email',
            'recoveryPhone' => 'sometimes|nullable|string|max:30',
            'ageBand' => 'sometimes|in:13-17,18-24,25+',
            'language' => 'sometimes|in:bn,en',
            'country' => 'sometimes|string|max:100',
            'dateOfBirth' => 'sometimes|nullable|date',
            'gender' => 'sometimes|nullable|string|max:50',
            'isAnonymous' => 'sometimes|boolean',
            'onboardingComplete' => 'sometimes|boolean',
        ]);

        $user->update([
            'full_name' => $data['fullName'] ?? $user->full_name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $user->phone,
            'recovery_email' => $data['recoveryEmail'] ?? $user->recovery_email,
            'recovery_phone' => $data['recoveryPhone'] ?? $user->recovery_phone,
            'age_band' => $data['ageBand'] ?? $user->age_band,
            'language' => $data['language'] ?? $user->language,
            'country' => $data['country'] ?? $user->country,
            'date_of_birth' => $data['dateOfBirth'] ?? $user->date_of_birth,
            'gender' => $data['gender'] ?? $user->gender,
            'is_anonymous' => $data['isAnonymous'] ?? $user->is_anonymous,
            'onboarding_complete' => $data['onboardingComplete'] ?? $user->onboarding_complete,
        ]);

        return response()->json(ApiFormatter::user($user->fresh()->load('guardianConsent')));
    }

    public function guardianConsent(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'guardianName' => 'required|string|max:255',
            'guardianEmail' => 'required|email',
            'guardianPhone' => 'required|string|max:30',
            'consentGiven' => 'required|boolean',
        ]);

        GuardianConsent::updateOrCreate(
            ['user_id' => $user->id],
            [
                'guardian_name' => $data['guardianName'],
                'guardian_email' => $data['guardianEmail'],
                'guardian_phone' => $data['guardianPhone'],
                'consent_given' => $data['consentGiven'],
                'consent_date' => $data['consentGiven'] ? now() : null,
            ]
        );

        return response()->json(ApiFormatter::user($user->fresh()->load('guardianConsent')));
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'theme' => 'sometimes|in:light,dark,system',
            'highContrast' => 'sometimes|boolean',
            'useBanglaNumerals' => 'sometimes|boolean',
            'aiTone' => 'sometimes|in:warm,direct,gentle',
            'moodReminders' => 'sometimes|boolean',
            'weeklyReports' => 'sometimes|boolean',
        ]);

        $settings = UserSetting::firstOrCreate(['user_id' => $user->id]);
        $settings->update([
            'theme' => $data['theme'] ?? $settings->theme,
            'high_contrast' => $data['highContrast'] ?? $settings->high_contrast,
            'use_bangla_numerals' => $data['useBanglaNumerals'] ?? $settings->use_bangla_numerals,
            'ai_tone' => $data['aiTone'] ?? $settings->ai_tone,
            'mood_reminders' => $data['moodReminders'] ?? $settings->mood_reminders,
            'weekly_reports' => $data['weeklyReports'] ?? $settings->weekly_reports,
        ]);

        return response()->json([
            'theme' => $settings->theme,
            'highContrast' => $settings->high_contrast,
            'useBanglaNumerals' => $settings->use_bangla_numerals,
            'aiTone' => $settings->ai_tone,
            'moodReminders' => $settings->mood_reminders,
            'weeklyReports' => $settings->weekly_reports,
        ]);
    }

    public function getSettings(Request $request): JsonResponse
    {
        $settings = UserSetting::firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json([
            'theme' => $settings->theme,
            'highContrast' => $settings->high_contrast,
            'useBanglaNumerals' => $settings->use_bangla_numerals,
            'aiTone' => $settings->ai_tone,
            'moodReminders' => $settings->mood_reminders,
            'weeklyReports' => $settings->weekly_reports,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'currentPassword' => 'required|string',
            'password' => ['required', Password::min(8), 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['currentPassword'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['success' => true]);
    }

    public function export(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'moodEntries', 'assessmentResults',
            'conversations.messages', 'trustedContacts', 'safetyPlan',
        ]);

        return response()->json([
            'exported' => true,
            'date' => now()->toIso8601String(),
            'user' => ApiFormatter::user($user),
            'moodEntries' => $user->moodEntries,
            'assessments' => $user->assessmentResults,
            'conversations' => $user->conversations,
        ]);
    }

    public function deleteData(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->moodEntries()->delete();
        $user->assessmentResults()->delete();
        $user->conversations()->each(fn ($c) => $c->messages()->delete());
        $user->conversations()->delete();
        $user->folders()->delete();
        $user->notifications()->delete();
        $user->trustedContacts()->delete();
        $user->safetyPlan()?->delete();

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['success' => true]);
    }
}
