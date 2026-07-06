@extends('admin.layout')

@section('title', $user->full_name)

@section('content')
<h2 class="text-2xl font-bold mb-6">{{ $user->full_name }}</h2>
<div class="grid lg:grid-cols-3 gap-4 mb-6">
    <div class="bg-white rounded-xl p-4 shadow-sm"><p class="text-slate-500 text-sm">Email</p><p>{{ $user->email }}</p></div>
    <div class="bg-white rounded-xl p-4 shadow-sm"><p class="text-slate-500 text-sm">Phone</p><p>{{ $user->phone ?? '—' }}</p></div>
    <div class="bg-white rounded-xl p-4 shadow-sm"><p class="text-slate-500 text-sm">Age Band</p><p>{{ $user->age_band }}</p></div>
</div>
<div class="grid lg:grid-cols-3 gap-4">
    <div class="bg-white rounded-xl p-4 shadow-sm"><p class="text-slate-500 text-sm">Mood Entries</p><p class="text-2xl font-bold">{{ $user->moodEntries->count() }}</p></div>
    <div class="bg-white rounded-xl p-4 shadow-sm"><p class="text-slate-500 text-sm">Conversations</p><p class="text-2xl font-bold">{{ $user->conversations->count() }}</p></div>
    <div class="bg-white rounded-xl p-4 shadow-sm"><p class="text-slate-500 text-sm">Assessments</p><p class="text-2xl font-bold">{{ $user->assessmentResults->count() }}</p></div>
</div>
@endsection
