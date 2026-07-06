@extends('admin.layout')

@section('title', 'Users')

@section('content')
<h2 class="text-2xl font-bold mb-6">Users</h2>
<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
            <tr>
                <th class="p-3">Name</th>
                <th class="p-3">Email</th>
                <th class="p-3">Language</th>
                <th class="p-3">Joined</th>
                <th class="p-3"></th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
                <tr class="border-t">
                    <td class="p-3">{{ $user->full_name }}</td>
                    <td class="p-3">{{ $user->email }}</td>
                    <td class="p-3">{{ $user->language }}</td>
                    <td class="p-3">{{ $user->created_at->format('Y-m-d') }}</td>
                    <td class="p-3"><a href="{{ route('admin.users.show', $user) }}" class="text-blue-600">View</a></td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
<div class="mt-4">{{ $users->links() }}</div>
@endsection
