@extends('admin.layout')

@section('title', 'Dashboard')

@section('content')
<h2 class="text-2xl font-bold mb-6">Dashboard</h2>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    @foreach($stats as $label => $value)
        <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-sm text-slate-500 capitalize">{{ str_replace('_', ' ', $label) }}</p>
            <p class="text-3xl font-bold">{{ $value }}</p>
        </div>
    @endforeach
</div>

<div class="grid lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-xl p-6 shadow-sm">
        <h3 class="font-semibold mb-4">Recent Users</h3>
        <ul class="space-y-2 text-sm">
            @forelse($recentUsers as $user)
                <li class="flex justify-between border-b pb-2">
                    <span>{{ $user->full_name }}</span>
                    <span class="text-slate-500">{{ $user->email }}</span>
                </li>
            @empty
                <li class="text-slate-500">No users yet</li>
            @endforelse
        </ul>
    </div>
    <div class="bg-white rounded-xl p-6 shadow-sm">
        <h3 class="font-semibold mb-4">Recent Feedback</h3>
        <ul class="space-y-2 text-sm">
            @forelse($recentFeedback as $item)
                <li class="border-b pb-2">
                    <p class="font-medium">{{ $item->email ?? 'Anonymous' }}</p>
                    <p class="text-slate-600 truncate">{{ $item->message }}</p>
                </li>
            @empty
                <li class="text-slate-500">No feedback yet</li>
            @endforelse
        </ul>
    </div>
</div>
@endsection
