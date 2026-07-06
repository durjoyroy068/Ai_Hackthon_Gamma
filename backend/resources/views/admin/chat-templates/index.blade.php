@extends('admin.layout')

@section('title', 'Chat Templates')

@section('content')
<div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">Chat Response Templates</h2>
    <a href="{{ route('admin.chat-templates.create') }}" class="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Add Template</a>
</div>
<div class="space-y-4">
    @foreach($templates as $template)
        <div class="bg-white rounded-xl p-4 shadow-sm">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <span class="text-xs bg-slate-100 px-2 py-1 rounded">{{ $template->category }}</span>
                    <p class="mt-2">{{ $template->content }}</p>
                    @if($template->keywords)<p class="text-xs text-slate-500 mt-2">Keywords: {{ implode(', ', $template->keywords) }}</p>@endif
                </div>
                <div class="space-x-2 text-sm shrink-0">
                    <a href="{{ route('admin.chat-templates.edit', $template) }}" class="text-blue-600">Edit</a>
                    <form method="POST" action="{{ route('admin.chat-templates.destroy', $template) }}" class="inline" onsubmit="return confirm('Delete?')">
                        @csrf @method('DELETE')
                        <button class="text-red-600">Delete</button>
                    </form>
                </div>
            </div>
        </div>
    @endforeach
</div>
@endsection
