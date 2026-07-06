@extends('admin.layout')

@section('title', 'Achievements')

@section('content')
<h2 class="text-2xl font-bold mb-6">Achievements</h2>
<form method="POST" action="{{ route('admin.achievements.store') }}" class="bg-white rounded-xl p-6 shadow-sm max-w-xl space-y-4 mb-8">
    @csrf
    <div><label class="block text-sm mb-1">Title Key</label><input name="title_key" required class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">Description Key</label><input name="description_key" required class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">Icon</label><input name="icon" value="star" class="w-full border rounded-lg px-3 py-2"></div>
    <button class="bg-slate-900 text-white px-4 py-2 rounded-lg">Add Achievement</button>
</form>
<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left"><tr><th class="p-3">Title Key</th><th class="p-3">Icon</th><th class="p-3"></th></tr></thead>
        <tbody>
            @foreach($achievements as $achievement)
                <tr class="border-t">
                    <td class="p-3">{{ $achievement->title_key }}</td>
                    <td class="p-3">{{ $achievement->icon }}</td>
                    <td class="p-3">
                        <form method="POST" action="{{ route('admin.achievements.destroy', $achievement) }}" onsubmit="return confirm('Delete?')">
                            @csrf @method('DELETE')
                            <button class="text-red-600">Delete</button>
                        </form>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endsection
