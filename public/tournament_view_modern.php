<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_logic.php';
require __DIR__ . '/_ui.php';

header('Content-Type: text/html; charset=utf-8');

$id = $_GET['id'] ?? '';
if ($id === '') {
  http_response_code(400);
  echo 'Fehlende ID';
  exit;
}

$err = null;
$row = null;
try {
  $pdo = db_pdo();
  $stmt = $pdo->prepare('SELECT id, name, settings, matches, last_modified FROM tournaments WHERE id = ? LIMIT 1');
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  if (!$row) {
    http_response_code(404);
    echo 'Turnier nicht gefunden';
    exit;
  }
} catch (Throwable $e) {
  $err = $e->getMessage();
}

$settings = [];
$matches = [];
if ($row) {
  $settings = is_string($row['settings']) ? json_decode($row['settings'], true) : $row['settings'];
  $matches = is_string($row['matches']) ? json_decode($row['matches'], true) : $row['matches'];
}

echo ui_layout_start('Turnier: ' . htmlspecialchars($row['name'] ?? 'Unbekannt'), '/');
?>

<div class="animate-fade-in space-y-8">
  <?php if ($err): ?>
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-red-800 font-medium">Fehler:</span>
        <span class="text-red-700 ml-2"><?= htmlspecialchars($err) ?></span>
      </div>
    </div>
  <?php endif; ?>

  <!-- Tournament Header -->
  <?= ui_card('
    <div class="p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">' . htmlspecialchars($row['name'] ?? ($settings['name'] ?? '')) . '</h1>
          <p class="text-slate-600 mt-1">Turnier-ID: ' . htmlspecialchars($row['id']) . '</p>
          <p class="text-sm text-slate-500">Letzte Änderung: ' . htmlspecialchars($row['last_modified'] ?? '') . '</p>
        </div>
        <div class="mt-4 lg:mt-0 flex space-x-3">
          ' . ui_button('Bearbeiten', '/tournament_edit.php?id=' . urlencode($row['id']), 'secondary', 'md') . '
          ' . ui_button('Display', '/display.php?id=' . urlencode($row['id']), 'primary', 'md') . '
        </div>
      </div>
    </div>
  ') ?>

  <!-- Quick Stats -->
  <?php
    $totalMatches = count($matches);
    $playedMatches = 0;
    $upcomingMatches = 0;
    foreach ($matches as $m) {
      $hasResults = false;
      if (isset($m['sets']) && is_array($m['sets'])) {
        foreach ($m['sets'] as $s) {
          if (isset($s['scoreA'], $s['scoreB']) && $s['scoreA'] !== null && $s['scoreB'] !== null) {
            $hasResults = true;
            break;
          }
        }
      }
      if ($hasResults) $playedMatches++; else $upcomingMatches++;
    }
    
    $quickStats = [
      ['label' => 'Gesamt Spiele', 'value' => $totalMatches, 'gradient' => 'from-blue-500 to-blue-600'],
      ['label' => 'Gespielt', 'value' => $playedMatches, 'gradient' => 'from-green-500 to-green-600'],
      ['label' => 'Ausstehend', 'value' => $upcomingMatches, 'gradient' => 'from-orange-500 to-orange-600'],
      ['label' => 'Teams', 'value' => count($settings['teamNames'] ?? []), 'gradient' => 'from-purple-500 to-purple-600']
    ];
    echo ui_stats_grid($quickStats);
  ?>

  <!-- Matches and Standings Grid -->
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
    <!-- Matches -->
    <div class="xl:col-span-2">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-slate-900">Spiele</h2>
        <div class="flex space-x-2">
          <button class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">Alle</button>
          <button class="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-full">Live</button>
          <button class="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-full">Fertig</button>
        </div>
      </div>
      
      <?php if (is_array($matches) && count($matches) > 0): ?>
        <div class="space-y-3">
          <?php foreach ($matches as $m): ?>
            <?php 
            $setCount = isset($m['sets']) && is_array($m['sets']) ? count($m['sets']) : (int)($settings['winningSets'] ?? 2);
            $hasResults = false;
            if (isset($m['sets']) && is_array($m['sets'])) {
              foreach ($m['sets'] as $s) {
                if (isset($s['scoreA'], $s['scoreB']) && $s['scoreA'] !== null && $s['scoreB'] !== null) {
                  $hasResults = true;
                  break;
                }
              }
            }
            $statusColor = $hasResults ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
            $statusText = $hasResults ? 'Fertig' : 'Ausstehend';
            ?>
            <?= ui_card('
              <div class="p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium text-slate-500">#' . htmlspecialchars((string)($m['id'] ?? '')) . '</span>
                    <span class="text-sm text-slate-600">' . htmlspecialchars((string)($m['time'] ?? '')) . '</span>
                    <span class="text-sm text-slate-600">' . htmlspecialchars((string)($m['field'] ?? '')) . '</span>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' . $statusColor . '">' . $statusText . '</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="font-medium text-slate-900">' . htmlspecialchars((string)($m['teamA'] ?? '')) . '</div>
                    <div class="text-sm text-slate-500">vs</div>
                    <div class="font-medium text-slate-900">' . htmlspecialchars((string)($m['teamB'] ?? '')) . '</div>
                  </div>
                  
                  <div class="flex-1 text-center">
                    <div class="space-y-1">
                      ' . (isset($m['sets']) && is_array($m['sets']) ? 
                        implode('', array_map(function($s, $idx) {
                          $scoreA = htmlspecialchars((string)($s['scoreA'] ?? ''));
                          $scoreB = htmlspecialchars((string)($s['scoreB'] ?? ''));
                          return '<div class="text-sm"><span class="font-mono">' . $scoreA . ' : ' . $scoreB . '</span></div>';
                        }, $m['sets'], array_keys($m['sets']))) : '') . '
                    </div>
                  </div>
                  
                  <div class="flex-1 text-right">
                    <button onclick="toggleQuickEdit(\'qe-' . (int)$m['id'] . '\')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Bearbeiten</button>
                  </div>
                </div>
                
                <!-- Quick Edit Form -->
                <div id="qe-' . (int)$m['id'] . '" class="hidden mt-4 pt-4 border-t border-slate-200">
                  <form method="post" action="/match_edit.php" class="space-y-3">
                    <input type="hidden" name="id" value="' . htmlspecialchars($row['id']) . '">
                    <input type="hidden" name="mid" value="' . (int)$m['id'] . '">
                    <input type="hidden" name="setCount" value="' . (int)$setCount . '">
                    <div class="grid grid-cols-' . (int)$setCount . ' gap-3">
                      ' . implode('', array_map(function($qi) use ($m) {
                        $qs = $m['sets'][$qi] ?? ['scoreA'=>null,'scoreB'=>null];
                        return '<div class="text-center">
                          <div class="text-xs text-slate-500 mb-1">Set ' . ($qi+1) . '</div>
                          <div class="flex items-center justify-center space-x-2">
                            <input class="w-16 text-center border rounded px-2 py-1" type="number" name="scoreA_' . $qi . '" value="' . htmlspecialchars($qs['scoreA'] === null ? '' : (string)$qs['scoreA']) . '" placeholder="A">
                            <span class="text-slate-400">:</span>
                            <input class="w-16 text-center border rounded px-2 py-1" type="number" name="scoreB_' . $qi . '" value="' . htmlspecialchars($qs['scoreB'] === null ? '' : (string)$qs['scoreB']) . '" placeholder="B">
                          </div>
                        </div>';
                      }, range(0, $setCount-1))) . '
                    </div>
                    <div class="flex justify-end space-x-2">
                      <button type="button" onclick="toggleQuickEdit(\'qe-' . (int)$m['id'] . '\')" class="px-3 py-1 text-sm text-slate-600 hover:text-slate-800">Abbrechen</button>
                      <button type="submit" class="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Speichern</button>
                    </div>
                  </form>
                </div>
              </div>
            ', 'hover:shadow-md transition-shadow') ?>
          <?php endforeach; ?>
        </div>
      <?php else: ?>
        <?= ui_card('<div class="p-8 text-center text-slate-500">Keine Spiele vorhanden.</div>') ?>
      <?php endif; ?>
    </div>

    <!-- Standings -->
    <div>
      <h2 class="text-xl font-semibold text-slate-900 mb-4">Tabelle</h2>
      <?php
        $teamNames = $settings['teamNames'] ?? [];
        $standings = calculate_standings($matches, $teamNames, $settings, 'group');
      ?>
      <?php if ($standings): ?>
        <?= ui_card('
          <div class="p-6">
            <div class="space-y-3">
              ' . implode('', array_map(function($s, $i) {
                $isFirst = $i === 0;
                $medalColor = $isFirst ? 'text-yellow-600' : ($i === 1 ? 'text-slate-400' : ($i === 2 ? 'text-amber-600' : 'text-slate-600'));
                return '<div class="flex items-center justify-between py-2 ' . ($isFirst ? 'bg-yellow-50 -mx-2 px-2 rounded' : '') . '">
                  <div class="flex items-center space-x-3">
                    <span class="w-6 text-center font-bold ' . $medalColor . '">' . (int)$s['rank'] . '</span>
                    <span class="font-medium text-slate-900">' . htmlspecialchars($s['teamName']) . '</span>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-slate-900">' . (int)$s['points'] . '</div>
                    <div class="text-xs text-slate-500">' . (int)$s['setsWon'] . '-' . (int)$s['setsLost'] . '</div>
                  </div>
                </div>';
              }, $standings, array_keys($standings))) . '
            </div>
          </div>
        ') ?>
      <?php endif; ?>
    </div>
  </div>
</div>

<script>
  function toggleQuickEdit(id) {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('hidden');
    }
  }
</script>

<?= ui_layout_end() ?>
