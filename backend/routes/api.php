<?php

use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\InitController;
use App\Http\Controllers\Api\MindGymController;
use App\Http\Controllers\Api\MoodController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WellnessController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/emergency-resources', [PublicController::class, 'emergencyResources']);
    Route::get('/faq', [PublicController::class, 'faq']);

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/google', [AuthController::class, 'google']);
    Route::post('/auth/otp/send', [AuthController::class, 'sendOtp']);
    Route::post('/auth/otp/verify', [AuthController::class, 'verifyOtp']);
    Route::post('/auth/password/forgot', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/password/reset', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::get('/init', InitController::class);

        Route::patch('/user', [UserController::class, 'update']);
        Route::post('/user/guardian-consent', [UserController::class, 'guardianConsent']);
        Route::get('/user/settings', [UserController::class, 'getSettings']);
        Route::patch('/user/settings', [UserController::class, 'updateSettings']);
        Route::post('/user/password', [UserController::class, 'changePassword']);
        Route::get('/user/export', [UserController::class, 'export']);
        Route::delete('/user/data', [UserController::class, 'deleteData']);
        Route::delete('/user', [UserController::class, 'destroy']);

        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::post('/conversations', [ConversationController::class, 'store']);
        Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
        Route::patch('/conversations/{conversation}', [ConversationController::class, 'update']);
        Route::delete('/conversations/{conversation}', [ConversationController::class, 'destroy']);
        Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);

        Route::get('/mood-entries', [MoodController::class, 'index']);
        Route::post('/mood-entries', [MoodController::class, 'store']);

        Route::get('/assessments', [AssessmentController::class, 'index']);
        Route::post('/assessments', [AssessmentController::class, 'store']);

        Route::get('/recovery-plan', [WellnessController::class, 'recoveryPlan']);
        Route::patch('/recovery-plan/activities/{activity}', [WellnessController::class, 'toggleActivity']);
        Route::get('/achievements', [WellnessController::class, 'achievements']);
        Route::get('/trusted-contacts', [WellnessController::class, 'trustedContacts']);
        Route::post('/trusted-contacts', [WellnessController::class, 'storeTrustedContact']);
        Route::get('/safety-plan', [WellnessController::class, 'safetyPlan']);
        Route::put('/safety-plan', [WellnessController::class, 'updateSafetyPlan']);
        Route::get('/notifications', [WellnessController::class, 'notifications']);
        Route::patch('/notifications/{notification}/read', [WellnessController::class, 'markNotificationRead']);
        Route::post('/feedback', [WellnessController::class, 'feedback']);

        Route::get('/mind-gym/scenarios', [MindGymController::class, 'scenarios']);
        Route::get('/mind-gym/progress', [MindGymController::class, 'progress']);
        Route::get('/mind-gym/analytics', [MindGymController::class, 'analytics']);
        Route::get('/mind-gym/protocol', [MindGymController::class, 'protocol']);
        Route::get('/mind-gym/intake', [MindGymController::class, 'intake']);
        Route::post('/mind-gym/recommend', [MindGymController::class, 'recommend']);
        Route::post('/mind-gym/npc-turn', [MindGymController::class, 'npcTurn']);
        Route::post('/mind-gym/sessions', [MindGymController::class, 'start']);
        Route::get('/mind-gym/sessions/{session}', [MindGymController::class, 'show']);
        Route::post('/mind-gym/sessions/{session}/choose', [MindGymController::class, 'choose']);
        Route::post('/mind-gym/sessions/{session}/story', [MindGymController::class, 'storyTurn']);
        Route::post('/mind-gym/sessions/{session}/reflect', [MindGymController::class, 'reflect']);
    });
});
