<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AchievementDefinition;
use App\Models\ChatResponseTemplate;
use App\Models\Conversation;
use App\Models\EmergencyResource;
use App\Models\FaqItem;
use App\Models\FeedbackSubmission;
use App\Models\MoodEntry;
use App\Models\User;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        return view('admin.dashboard', [
            'stats' => [
                'users' => User::where('is_admin', false)->count(),
                'conversations' => Conversation::count(),
                'moodEntries' => MoodEntry::count(),
                'feedback' => FeedbackSubmission::where('status', 'new')->count(),
                'emergencyResources' => EmergencyResource::count(),
                'chatTemplates' => ChatResponseTemplate::count(),
                'achievements' => AchievementDefinition::count(),
                'faqItems' => FaqItem::count(),
            ],
            'recentUsers' => User::where('is_admin', false)->latest()->take(5)->get(),
            'recentFeedback' => FeedbackSubmission::latest()->take(5)->get(),
        ]);
    }
}
