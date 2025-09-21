<!DOCTYPE html>
<html lang="de" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Spielplan App')</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    animation: {
                        "fade-in": "fadeIn 0.5s ease-in-out",
                        "slide-up": "slideUp 0.3s ease-out",
                        "bounce-gentle": "bounceGentle 2s infinite",
                    },
                    keyframes: {
                        fadeIn: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
                        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
                        bounceGentle: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } }
                    }
                }
            }
        }
    </script>
</head>
<body class="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <!-- Navigation -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-4">
                    @if(request()->route()->getName() !== 'home')
                        <a href="{{ route('home') }}" class="flex items-center text-slate-600 hover:text-slate-900 transition-colors">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                            Zurück
                        </a>
                    @endif
                    <h1 class="text-xl font-bold text-slate-900">@yield('page-title', 'Spielplan App')</h1>
                </div>
                <nav class="hidden md:flex items-center space-x-6">
                    <a href="{{ route('home') }}" class="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</a>
                    <a href="{{ route('tournaments.create') }}" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">Neues Turnier</a>
                </nav>
                <button id="mobileMenuBtn" class="md:hidden p-2 rounded-lg hover:bg-slate-100">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div id="mobileMenu" class="hidden md:hidden border-t border-slate-200 bg-white">
            <div class="px-4 py-3 space-y-2">
                <a href="{{ route('home') }}" class="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Dashboard</a>
                <a href="{{ route('tournaments.create') }}" class="block px-3 py-2 rounded-lg bg-blue-600 text-white">Neues Turnier</a>
            </div>
        </div>
    </header>

    <!-- Flash Messages -->
    @if(session('success'))
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-green-800 font-medium">{{ session('success') }}</span>
                </div>
            </div>
        </div>
    @endif

    @if($errors->any())
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                        <span class="text-red-800 font-medium">Fehler:</span>
                        <ul class="text-red-700 ml-2 list-disc list-inside">
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    @endif

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @yield('content')
    </main>

    <!-- Scripts -->
    <script>
        // Mobile menu toggle
        document.getElementById('mobileMenuBtn')?.addEventListener('click', function() {
            document.getElementById('mobileMenu').classList.toggle('hidden');
        });
        
        // Auto-hide mobile menu on resize
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                document.getElementById('mobileMenu').classList.add('hidden');
            }
        });

        // Quick edit toggle function
        function toggleQuickEdit(id) {
            const element = document.getElementById(id);
            if (element) {
                element.classList.toggle('hidden');
            }
        }
    </script>
</body>
</html>
