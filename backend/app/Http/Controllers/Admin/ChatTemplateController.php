<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatResponseTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ChatTemplateController extends Controller
{
    public function index(): View
    {
        $templates = ChatResponseTemplate::latest()->get();

        return view('admin.chat-templates.index', compact('templates'));
    }

    public function create(): View
    {
        return view('admin.chat-templates.form', ['template' => new ChatResponseTemplate()]);
    }

    public function store(Request $request): RedirectResponse
    {
        ChatResponseTemplate::create($this->validated($request));

        return redirect()->route('admin.chat-templates.index')->with('success', 'Template created.');
    }

    public function edit(ChatResponseTemplate $chatTemplate): View
    {
        return view('admin.chat-templates.form', ['template' => $chatTemplate]);
    }

    public function update(Request $request, ChatResponseTemplate $chatTemplate): RedirectResponse
    {
        $chatTemplate->update($this->validated($request));

        return redirect()->route('admin.chat-templates.index')->with('success', 'Template updated.');
    }

    public function destroy(ChatResponseTemplate $chatTemplate): RedirectResponse
    {
        $chatTemplate->delete();

        return redirect()->route('admin.chat-templates.index')->with('success', 'Template deleted.');
    }

    private function validated(Request $request): array
    {
        $keywords = $request->input('keywords');
        $keywordList = $keywords
            ? array_filter(array_map('trim', explode(',', $keywords)))
            : [];

        return [
            'category' => $request->input('category', 'default'),
            'content' => $request->validate(['content' => 'required|string'])['content'],
            'keywords' => $keywordList,
            'is_active' => $request->boolean('is_active'),
        ];
    }
}
