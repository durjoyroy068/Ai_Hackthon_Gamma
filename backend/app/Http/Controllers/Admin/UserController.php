<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(): View
    {
        $users = User::where('is_admin', false)->latest()->paginate(20);

        return view('admin.users.index', compact('users'));
    }

    public function show(User $user): View
    {
        $user->load(['moodEntries', 'conversations', 'assessmentResults']);

        return view('admin.users.show', compact('user'));
    }

    public function toggleActive(Request $request, User $user): RedirectResponse
    {
        abort_if($user->is_admin, 403);

        return back()->with('success', 'User updated.');
    }
}
