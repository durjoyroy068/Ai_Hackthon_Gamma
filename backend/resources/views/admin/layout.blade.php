<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Admin') — Mon-Songlap</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 text-slate-900 min-h-screen">
    <div class="flex min-h-screen">
        <aside class="w-64 bg-slate-900 text-white p-6 hidden md:block">
            <h1 class="text-xl font-bold mb-8">Mon-Songlap Admin</h1>
            <nav class="space-y-2 text-sm">
                <a href="{{ route('admin.dashboard') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Dashboard</a>
                <a href="{{ route('admin.users.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Users</a>
                <a href="{{ route('admin.emergency.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Emergency Resources</a>
                <a href="{{ route('admin.chat-templates.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Chat Templates</a>
                <a href="{{ route('admin.faq.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">FAQ</a>
                <a href="{{ route('admin.achievements.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Achievements</a>
                <a href="{{ route('admin.feedback.index') }}" class="block px-3 py-2 rounded hover:bg-slate-800">Feedback</a>
            </nav>
            <form method="POST" action="{{ route('admin.logout') }}" class="mt-8">
                @csrf
                <button class="text-sm text-slate-300 hover:text-white">Logout</button>
            </form>
        </aside>
        <main class="flex-1 p-6">
            @if(session('success'))
                <div class="mb-4 rounded bg-green-100 text-green-800 px-4 py-3">{{ session('success') }}</div>
            @endif
            @if(session('error'))
                <div class="mb-4 rounded bg-red-100 text-red-800 px-4 py-3">{{ session('error') }}</div>
            @endif
            @yield('content')
        </main>
    </div>
</body>
</html>
