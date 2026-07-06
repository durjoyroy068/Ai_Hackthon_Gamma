@extends('admin.layout')

@section('title', $template->exists ? 'Edit Template' : 'New Template')

@section('content')
<h2 class="text-2xl font-bold mb-6">{{ $template->exists ? 'Edit' : 'New' }} Chat Template</h2>
<form method="POST" action="{{ $template->exists ? route('admin.chat-templates.update', $template) : route('admin.chat-templates.store') }}" class="bg-white rounded-xl p-6 shadow-sm max-w-2xl space-y-4">
    @csrf
    @if($template->exists) @method('PUT') @endif
    <div><label class="block text-sm mb-1">Category</label><input name="category" value="{{ old('category', $template->category ?? 'default') }}" class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">Content</label><textarea name="content" rows="4" required class="w-full border rounded-lg px-3 py-2">{{ old('content', $template->content) }}</textarea></div>
    <div><label class="block text-sm mb-1">Keywords (comma-separated)</label><input name="keywords" value="{{ old('keywords', $template->keywords ? implode(', ', $template->keywords) : '') }}" class="w-full border rounded-lg px-3 py-2"></div>
    <label class="flex items-center gap-2"><input type="checkbox" name="is_active" value="1" @checked(old('is_active', $template->is_active ?? true))> Active</label>
    <button class="bg-slate-900 text-white px-4 py-2 rounded-lg">Save</button>
</form>
@endsection
