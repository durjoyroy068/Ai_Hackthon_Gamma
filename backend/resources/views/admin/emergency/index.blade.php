@extends('admin.layout')

@section('title', 'Emergency Resources')

@section('content')
<div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">Emergency Resources</h2>
    <a href="{{ route('admin.emergency.create') }}" class="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Add Resource</a>
</div>
<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr><th class="p-3">Name</th><th class="p-3">Phone</th><th class="p-3">Region</th><th class="p-3">Active</th><th class="p-3"></th></tr>
        </thead>
        <tbody>
            @foreach($resources as $resource)
                <tr class="border-t">
                    <td class="p-3">{{ $resource->name }}</td>
                    <td class="p-3">{{ $resource->phone }}</td>
                    <td class="p-3">{{ $resource->region }}</td>
                    <td class="p-3">{{ $resource->is_active ? 'Yes' : 'No' }}</td>
                    <td class="p-3 space-x-2">
                        <a href="{{ route('admin.emergency.edit', $resource) }}" class="text-blue-600">Edit</a>
                        <form method="POST" action="{{ route('admin.emergency.destroy', $resource) }}" class="inline" onsubmit="return confirm('Delete?')">
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
