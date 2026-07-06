@extends('admin.layout')

@section('title', 'Feedback')

@section('content')
<h2 class="text-2xl font-bold mb-6">User Feedback</h2>
<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr><th class="p-3">Email</th><th class="p-3">Message</th><th class="p-3">Status</th><th class="p-3">Date</th></tr>
        </thead>
        <tbody>
            @foreach($feedback as $item)
                <tr class="border-t align-top">
                    <td class="p-3">{{ $item->email ?? '—' }}</td>
                    <td class="p-3 max-w-md">{{ $item->message }}</td>
                    <td class="p-3">
                        <form method="POST" action="{{ route('admin.feedback.update', $item) }}">
                            @csrf @method('PATCH')
                            <select name="status" onchange="this.form.submit()" class="border rounded px-2 py-1">
                                @foreach(['new','reviewed','resolved'] as $status)
                                    <option value="{{ $status }}" @selected($item->status === $status)>{{ ucfirst($status) }}</option>
                                @endforeach
                            </select>
                        </form>
                    </td>
                    <td class="p-3">{{ $item->created_at->format('Y-m-d') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
<div class="mt-4">{{ $feedback->links() }}</div>
@endsection
