@extends('admin.layout')

@section('title', 'FAQ')

@section('content')
<h2 class="text-2xl font-bold mb-6">FAQ Items</h2>
<form method="POST" action="{{ route('admin.faq.store') }}" class="bg-white rounded-xl p-6 shadow-sm max-w-xl space-y-4 mb-8">
    @csrf
    <div><label class="block text-sm mb-1">Question Key (i18n)</label><input name="question_key" required class="w-full border rounded-lg px-3 py-2" placeholder="landing.faq.q1"></div>
    <div><label class="block text-sm mb-1">Answer Key (i18n)</label><input name="answer_key" required class="w-full border rounded-lg px-3 py-2" placeholder="landing.faq.a1"></div>
    <div><label class="block text-sm mb-1">Category</label><input name="category" value="general" class="w-full border rounded-lg px-3 py-2"></div>
    <button class="bg-slate-900 text-white px-4 py-2 rounded-lg">Add FAQ</button>
</form>
<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left"><tr><th class="p-3">Question Key</th><th class="p-3">Answer Key</th><th class="p-3"></th></tr></thead>
        <tbody>
            @foreach($items as $item)
                <tr class="border-t">
                    <td class="p-3">{{ $item->question_key }}</td>
                    <td class="p-3">{{ $item->answer_key }}</td>
                    <td class="p-3">
                        <form method="POST" action="{{ route('admin.faq.destroy', $item) }}" onsubmit="return confirm('Delete?')">
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
