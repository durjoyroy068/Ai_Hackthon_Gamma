<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ChatTemplateController;
use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EmergencyResourceController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('admin.login'));

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');

        Route::resource('emergency', EmergencyResourceController::class)->except(['show']);
        Route::resource('chat-templates', ChatTemplateController::class)->except(['show']);

        Route::get('/faq', [ContentController::class, 'faqIndex'])->name('faq.index');
        Route::post('/faq', [ContentController::class, 'faqStore'])->name('faq.store');
        Route::delete('/faq/{faq}', [ContentController::class, 'faqDestroy'])->name('faq.destroy');

        Route::get('/achievements', [ContentController::class, 'achievementsIndex'])->name('achievements.index');
        Route::post('/achievements', [ContentController::class, 'achievementsStore'])->name('achievements.store');
        Route::delete('/achievements/{achievement}', [ContentController::class, 'achievementsDestroy'])->name('achievements.destroy');

        Route::get('/feedback', [ContentController::class, 'feedbackIndex'])->name('feedback.index');
        Route::patch('/feedback/{feedback}', [ContentController::class, 'feedbackUpdate'])->name('feedback.update');
    });
});
