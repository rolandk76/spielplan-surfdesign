<?php
// Modern UI components and styles

function ui_header($title = 'Spielplan App', $backUrl = null) {
    $backBtn = $backUrl ? '<a href="' . htmlspecialchars($backUrl) . '" class="flex items-center text-slate-600 hover:text-slate-900 transition-colors"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>Zurück</a>' : '';
    return '
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-4">
                    ' . $backBtn . '
                    <h1 class="text-xl font-bold text-slate-900">' . htmlspecialchars($title) . '</h1>
                </div>
                <nav class="hidden md:flex items-center space-x-6">
                    <a href="/" class="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</a>
                    <a href="/tournament_new.php" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">Neues Turnier</a>
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
                <a href="/" class="block px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Dashboard</a>
                <a href="/tournament_new.php" class="block px-3 py-2 rounded-lg bg-blue-600 text-white">Neues Turnier</a>
            </div>
        </div>
    </header>';
}

function ui_card($content, $classes = '') {
    return '<div class="bg-white rounded-xl shadow-sm border border-slate-200 ' . $classes . '">' . $content . '</div>';
}

function ui_button($text, $href = null, $type = 'primary', $size = 'md', $icon = null) {
    $baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    $sizeClasses = [
        'sm' => 'px-3 py-1.5 text-sm',
        'md' => 'px-4 py-2 text-sm',
        'lg' => 'px-6 py-3 text-base'
    ];
    $typeClasses = [
        'primary' => 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md',
        'secondary' => 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-500',
        'danger' => 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        'ghost' => 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-500'
    ];
    
    $classes = $baseClasses . ' ' . $sizeClasses[$size] . ' ' . $typeClasses[$type];
    $iconHtml = $icon ? '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">' . $icon . '</svg>' : '';
    
    if ($href) {
        return '<a href="' . htmlspecialchars($href) . '" class="' . $classes . '">' . $iconHtml . htmlspecialchars($text) . '</a>';
    }
    return '<button type="button" class="' . $classes . '">' . $iconHtml . htmlspecialchars($text) . '</button>';
}

function ui_stats_grid($stats) {
    $html = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">';
    foreach ($stats as $stat) {
        $html .= '
        <div class="bg-gradient-to-r ' . ($stat['gradient'] ?? 'from-blue-500 to-blue-600') . ' rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-blue-100 text-sm font-medium">' . htmlspecialchars($stat['label']) . '</p>
                    <p class="text-2xl font-bold">' . htmlspecialchars($stat['value']) . '</p>
                </div>
                <div class="p-3 bg-white/20 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ' . ($stat['icon'] ?? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>') . '
                    </svg>
                </div>
            </div>
        </div>';
    }
    $html .= '</div>';
    return $html;
}

function ui_table_responsive($headers, $rows, $actions = []) {
    $html = '
    <div class="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>';
    
    foreach ($headers as $header) {
        $html .= '<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">' . htmlspecialchars($header) . '</th>';
    }
    if (!empty($actions)) {
        $html .= '<th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aktionen</th>';
    }
    
    $html .= '</tr></thead><tbody class="bg-white divide-y divide-slate-200">';
    
    foreach ($rows as $i => $row) {
        $html .= '<tr class="hover:bg-slate-50 transition-colors">';
        foreach ($row as $cell) {
            $html .= '<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">' . $cell . '</td>';
        }
        if (!empty($actions)) {
            $html .= '<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">';
            foreach ($actions as $action) {
                if (is_callable($action['condition']) && !$action['condition']($row, $i)) continue;
                $html .= '<a href="' . htmlspecialchars($action['url']($row, $i)) . '" class="' . ($action['class'] ?? 'text-blue-600 hover:text-blue-900 mr-3') . '">' . htmlspecialchars($action['label']) . '</a>';
            }
            $html .= '</td>';
        }
        $html .= '</tr>';
    }
    
    $html .= '</tbody></table></div></div>';
    return $html;
}

function ui_layout_start($title = 'Spielplan App', $backUrl = null) {
    return '<!doctype html>
<html lang="de" class="h-full">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>' . htmlspecialchars($title) . '</title>
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
    ' . ui_header($title, $backUrl) . '
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">';
}

function ui_layout_end() {
    return '
    </main>
    <script>
        // Mobile menu toggle
        document.getElementById("mobileMenuBtn")?.addEventListener("click", function() {
            document.getElementById("mobileMenu").classList.toggle("hidden");
        });
        
        // Auto-hide mobile menu on resize
        window.addEventListener("resize", function() {
            if (window.innerWidth >= 768) {
                document.getElementById("mobileMenu").classList.add("hidden");
            }
        });
    </script>
</body>
</html>';
}
