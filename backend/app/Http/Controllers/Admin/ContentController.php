<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AchievementDefinition;
use App\Models\FaqItem;
use App\Models\FeedbackSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ContentController extends Controller
{
    public function faqIndex(): View
    {
        $items = FaqItem::orderBy('sort_order')->get();

        return view('admin.faq.index', compact('items'));
    }

    public function faqStore(Request $request): RedirectResponse
    {
        FaqItem::create($request->validate([
            'question_key' => 'required|string|max:255',
            'answer_key' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer',
        ]) + ['is_active' => $request->boolean('is_active', true)]);

        return back()->with('success', 'FAQ item added.');
    }

    public function faqDestroy(FaqItem $faq): RedirectResponse
    {
        $faq->delete();

        return back()->with('success', 'FAQ item deleted.');
    }

    public function achievementsIndex(): View
    {
        $achievements = AchievementDefinition::orderBy('id')->get();

        return view('admin.achievements.index', compact('achievements'));
    }

    public function achievementsStore(Request $request): RedirectResponse
    {
        AchievementDefinition::create($request->validate([
            'title_key' => 'required|string|max:255',
            'description_key' => 'required|string|max:255',
            'icon' => 'required|string|max:50',
            'unlock_criteria' => 'nullable|string|max:100',
        ]) + [
            'gentle' => $request->boolean('gentle', true),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Achievement added.');
    }

    public function achievementsDestroy(AchievementDefinition $achievement): RedirectResponse
    {
        $achievement->delete();

        return back()->with('success', 'Achievement deleted.');
    }

    public function feedbackIndex(): View
    {
        $feedback = FeedbackSubmission::with('user')->latest()->paginate(20);

        return view('admin.feedback.index', compact('feedback'));
    }

    public function feedbackUpdate(Request $request, FeedbackSubmission $feedback): RedirectResponse
    {
        $feedback->update($request->validate(['status' => 'required|in:new,reviewed,resolved']));

        return back()->with('success', 'Feedback updated.');
    }
}
