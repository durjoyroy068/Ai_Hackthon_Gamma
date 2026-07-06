<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Services\ChatService;
use App\Support\ApiFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(private ChatService $chatService) {}

    public function index(Request $request): JsonResponse
    {
        $conversations = $request->user()
            ->conversations()
            ->with('messages')
            ->latest('updated_at')
            ->get();

        return response()->json(
            $conversations->map(fn ($c) => ApiFormatter::conversation($c))->values()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'folderId' => 'nullable|integer|exists:chat_folders,id',
        ]);

        $conversation = $request->user()->conversations()->create([
            'title' => $data['title'] ?? 'New Chat',
            'folder_id' => $data['folderId'] ?? null,
        ]);

        return response()->json(ApiFormatter::conversation($conversation->load('messages')), 201);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        return response()->json(ApiFormatter::conversation($conversation->load('messages')));
    }

    public function update(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'pinned' => 'sometimes|boolean',
            'folderId' => 'nullable|integer|exists:chat_folders,id',
        ]);

        $conversation->update([
            'title' => $data['title'] ?? $conversation->title,
            'pinned' => $data['pinned'] ?? $conversation->pinned,
            'folder_id' => array_key_exists('folderId', $data) ? $data['folderId'] : $conversation->folder_id,
        ]);

        return response()->json(ApiFormatter::conversation($conversation->fresh()->load('messages')));
    }

    public function destroy(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);
        $conversation->delete();

        return response()->json(['success' => true]);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $data = $request->validate(['content' => 'required|string|max:5000']);
        $result = $this->chatService->sendMessage($conversation, $data['content']);

        return response()->json([
            'userMessage' => ApiFormatter::message($result['userMessage']),
            'assistantMessage' => ApiFormatter::message($result['assistantMessage']),
            'responseText' => $result['responseText'],
        ]);
    }

    private function authorizeConversation(Request $request, Conversation $conversation): void
    {
        abort_if($conversation->user_id !== $request->user()->id, 403);
    }
}
