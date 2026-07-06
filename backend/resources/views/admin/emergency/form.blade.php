@extends('admin.layout')

@section('title', $resource->exists ? 'Edit Resource' : 'New Resource')

@section('content')
<h2 class="text-2xl font-bold mb-6">{{ $resource->exists ? 'Edit' : 'New' }} Emergency Resource</h2>
<form method="POST" action="{{ $resource->exists ? route('admin.emergency.update', $resource) : route('admin.emergency.store') }}" class="bg-white rounded-xl p-6 shadow-sm max-w-xl space-y-4">
    @csrf
    @if($resource->exists) @method('PUT') @endif
    <div><label class="block text-sm mb-1">Name (EN)</label><input name="name" value="{{ old('name', $resource->name) }}" required class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">Name (BN)</label><input name="name_bn" value="{{ old('name_bn', $resource->name_bn) }}" class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">Phone</label><input name="phone" value="{{ old('phone', $resource->phone) }}" required class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">URL</label><input name="url" value="{{ old('url', $resource->url) }}" class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">Region</label><input name="region" value="{{ old('region', $resource->region ?? 'Bangladesh') }}" class="w-full border rounded-lg px-3 py-2"></div>
    <div><label class="block text-sm mb-1">Sort Order</label><input type="number" name="sort_order" value="{{ old('sort_order', $resource->sort_order ?? 0) }}" class="w-full border rounded-lg px-3 py-2"></div>
    <label class="flex items-center gap-2"><input type="checkbox" name="is_active" value="1" @checked(old('is_active', $resource->is_active ?? true))> Active</label>
    <button class="bg-slate-900 text-white px-4 py-2 rounded-lg">Save</button>
</form>
@endsection
