<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login — Mon-Songlap</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 min-h-screen flex items-center justify-center">
    <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <h1 class="text-2xl font-bold mb-2">Mon-Songlap Admin</h1>
        <p class="text-slate-500 mb-6">Sign in to manage the platform</p>
        @if(session('error'))
            <div class="mb-4 rounded bg-red-100 text-red-800 px-4 py-3 text-sm">{{ session('error') }}</div>
        @endif
        <form method="POST" action="{{ route('admin.login') }}" class="space-y-4">
            @csrf
            <div>
                <label class="block text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" required class="w-full border rounded-lg px-3 py-2" value="{{ old('email') }}">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Password</label>
                <input type="password" name="password" required class="w-full border rounded-lg px-3 py-2">
            </div>
            <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" name="remember"> Remember me
            </label>
            <button type="submit" class="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">Login</button>
        </form>
    </div>
</body>
</html>
