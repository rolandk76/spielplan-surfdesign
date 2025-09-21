<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_ui.php';

$ok = false;
$error = null;
$tournaments = [];
$stats = [];

try {
    $pdo = db_pdo();
    $ok = true;
    
    // Get tournaments and stats
    try {
        $stmt = $pdo->query('SHOW TABLES LIKE "tournaments"');
        if ($stmt->fetch()) {
            $q = $pdo->query('SELECT id, name, last_modified FROM tournaments ORDER BY last_modified DESC LIMIT 20');
            $tournaments = $q->fetchAll();
            
            // Calculate stats
            $totalCount = $pdo->query('SELECT COUNT(*) as c FROM tournaments')->fetch()['c'];
            $recentCount = $pdo->query('SELECT COUNT(*) as c FROM tournaments WHERE last_modified >= DATE_SUB(NOW(), INTERVAL 7 DAY)')->fetch()['c'];
            $todayCount = $pdo->query('SELECT COUNT(*) as c FROM tournaments WHERE DATE(last_modified) = CURDATE()')->fetch()['c'];
            
            $stats = [
                ['label' => 'Gesamt Turniere', 'value' => $totalCount, 'gradient' => 'from-blue-500 to-blue-600', 'icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>'],
                ['label' => 'Diese Woche', 'value' => $recentCount, 'gradient' => 'from-green-500 to-green-600', 'icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>'],
                ['label' => 'Heute erstellt', 'value' => $todayCount, 'gradient' => 'from-purple-500 to-purple-600', 'icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>'],
                ['label' => 'Status', 'value' => $ok ? 'Online' : 'Offline', 'gradient' => 'from-emerald-500 to-emerald-600', 'icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>']
            ];
        }
    } catch (Throwable $e) {
        // ignore if table not found
    }
} catch (Throwable $e) {
    $error = $e->getMessage();
}

header('Content-Type: text/html; charset=utf-8');
echo ui_layout_start('Dashboard - Spielplan App');
?>

<div class="animate-fade-in">
    <!-- Welcome Section -->
    <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 mb-2">Willkommen zurück!</h1>
        <p class="text-slate-600">Verwalten Sie Ihre Turniere und Spielpläne professionell.</p>
    </div>

    <!-- Stats Grid -->
    <?= ui_stats_grid($stats) ?>

    <!-- Quick Actions -->
    <div class="mb-8">
        <h2 class="text-xl font-semibold text-slate-900 mb-4">Schnellaktionen</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <?= ui_card('
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-slate-900">Neues Turnier</h3>
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="text-slate-600 mb-4">Erstellen Sie ein neues Turnier mit automatischer Spielplan-Generierung.</p>
                    ' . ui_button('Turnier erstellen', '/tournament_new.php', 'primary', 'md') . '
                </div>
            ', 'hover:shadow-lg transition-shadow') ?>
            
            <?= ui_card('
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-slate-900">Display Ansicht</h3>
                        <div class="p-2 bg-green-100 rounded-lg">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="text-slate-600 mb-4">Große Anzeige für Hallen und öffentliche Bildschirme.</p>
                    ' . ui_button('Display öffnen', '/display.php', 'secondary', 'md') . '
                </div>
            ', 'hover:shadow-lg transition-shadow') ?>
            
            <?= ui_card('
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-slate-900">Einstellungen</h3>
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <p class="text-slate-600 mb-4">Konfigurieren Sie Standardwerte und Präferenzen.</p>
                    ' . ui_button('Einstellungen', '#', 'ghost', 'md') . '
                </div>
            ', 'hover:shadow-lg transition-shadow') ?>
        </div>
    </div>

    <!-- Database Status -->
    <?php if (!$ok): ?>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
                <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-red-800 font-medium">Datenbankverbindung fehlgeschlagen:</span>
                <span class="text-red-700 ml-2"><?= htmlspecialchars($error) ?></span>
            </div>
        </div>
    <?php endif; ?>

    <!-- Tournaments Table -->
    <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-slate-900">Aktuelle Turniere</h2>
            <?= ui_button('Alle anzeigen', '#', 'ghost', 'sm') ?>
        </div>
        
        <?php if ($tournaments && count($tournaments) > 0): ?>
            <?php
            $headers = ['Name', 'Erstellt', 'Status'];
            $rows = [];
            foreach ($tournaments as $t) {
                $timeAgo = date('d.m.Y H:i', strtotime($t['last_modified']));
                $status = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktiv</span>';
                $rows[] = [
                    '<div class="font-medium text-slate-900">' . htmlspecialchars($t['name']) . '</div><div class="text-sm text-slate-500">' . htmlspecialchars($t['id']) . '</div>',
                    $timeAgo,
                    $status
                ];
            }
            $actions = [
                [
                    'label' => 'Anzeigen',
                    'url' => fn($row, $i) => '/tournament_view.php?id=' . urlencode($tournaments[$i]['id']),
                    'class' => 'text-blue-600 hover:text-blue-900 mr-3',
                    'condition' => fn() => true
                ],
                [
                    'label' => 'Bearbeiten',
                    'url' => fn($row, $i) => '/tournament_edit.php?id=' . urlencode($tournaments[$i]['id']),
                    'class' => 'text-slate-600 hover:text-slate-900 mr-3',
                    'condition' => fn() => true
                ],
                [
                    'label' => 'Löschen',
                    'url' => fn($row, $i) => '/tournament_delete.php?id=' . urlencode($tournaments[$i]['id']),
                    'class' => 'text-red-600 hover:text-red-900',
                    'condition' => fn() => true
                ]
            ];
            echo ui_table_responsive($headers, $rows, $actions);
            ?>
        <?php else: ?>
            <?= ui_card('
                <div class="p-12 text-center">
                    <svg class="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-slate-900 mb-2">Keine Turniere vorhanden</h3>
                    <p class="text-slate-600 mb-6">Erstellen Sie Ihr erstes Turnier, um loszulegen.</p>
                    ' . ui_button('Erstes Turnier erstellen', '/tournament_new.php', 'primary', 'lg') . '
                </div>
            ') ?>
        <?php endif; ?>
    </div>
</div>

<?= ui_layout_end() ?>

