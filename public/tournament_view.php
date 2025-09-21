<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_logic.php';

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
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Turnier anzeigen</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
</head>
<body>
  <div class="max-w-5xl mx-auto p-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Turnier anzeigen</h1>
      <a class="text-blue-600 hover:underline" href="/">Zurück</a>
    </div>

  <?php if ($err): ?>
    <p style="color:#a00;">Fehler: <?= htmlspecialchars($err) ?></p>
  <?php endif; ?>

  <h2 class="mt-6 text-xl font-semibold">Allgemein</h2>
  <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
    <div><span class="font-semibold">ID:</span> <code><?= htmlspecialchars($row['id']) ?></code></div>
    <div><span class="font-semibold">Name:</span> <?= htmlspecialchars($row['name'] ?? ($settings['name'] ?? '')) ?></div>
    <div><span class="font-semibold">Letzte Änderung:</span> <?= htmlspecialchars($row['last_modified'] ?? '') ?></div>
  </div>

  <h2 class="mt-6 text-xl font-semibold">Einstellungen</h2>
  <pre class="mt-2 bg-slate-100 rounded p-4 overflow-auto text-sm"><?php echo htmlspecialchars(json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?></pre>

  <h2 class="mt-6 text-xl font-semibold">Spiele</h2>
  <?php if (is_array($matches) && count($matches) > 0): ?>
    <div class="mt-2 overflow-x-auto">
      <table class="min-w-full border border-slate-200 text-sm" id="matchesTable">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left border-b">#</th>
            <th class="px-3 py-2 text-left border-b">Zeit</th>
            <th class="px-3 py-2 text-left border-b">Feld</th>
            <th class="px-3 py-2 text-left border-b">Team A</th>
            <th class="px-3 py-2 text-left border-b">Team B</th>
            <th class="px-3 py-2 text-left border-b">Sätze</th>
            <th class="px-3 py-2 text-left border-b">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($matches as $m): ?>
            <?php $setCount = isset($m['sets']) && is_array($m['sets']) ? count($m['sets']) : (int)($settings['winningSets'] ?? 2); ?>
            <tr class="odd:bg-white even:bg-slate-50">
              <td class="px-3 py-2 border-b"><?= htmlspecialchars((string)($m['id'] ?? '')) ?></td>
              <td class="px-3 py-2 border-b"><?= htmlspecialchars((string)($m['time'] ?? '')) ?></td>
              <td class="px-3 py-2 border-b"><?= htmlspecialchars((string)($m['field'] ?? '')) ?></td>
              <td class="px-3 py-2 border-b"><?= htmlspecialchars((string)($m['teamA'] ?? '')) ?></td>
              <td class="px-3 py-2 border-b"><?= htmlspecialchars((string)($m['teamB'] ?? '')) ?></td>
              <td class="px-3 py-2 border-b">
                <?php if (isset($m['sets']) && is_array($m['sets'])): ?>
                  <?php foreach ($m['sets'] as $idx => $s): ?>
                    <span class="inline-block mr-2">Set <?= $idx+1 ?>: <?= htmlspecialchars((string)($s['scoreA'] ?? '')) ?> : <?= htmlspecialchars((string)($s['scoreB'] ?? '')) ?></span>
                  <?php endforeach; ?>
                <?php endif; ?>
              </td>
              <td class="px-3 py-2 border-b">
                <a class="text-blue-600 hover:underline mr-3" href="/match_edit.php?id=<?= urlencode($row['id']) ?>&mid=<?= urlencode((string)($m['id'] ?? '')) ?>">Ergebnisse</a>
                <button type="button" class="text-slate-700 hover:underline" onclick="toggleQuickEdit('qe-<?= (int)$m['id'] ?>')">Schnell bearbeiten</button>
              </td>
            </tr>
            <tr id="qe-<?= (int)$m['id'] ?>" class="hidden">
              <td colspan="7" class="px-3 py-3 border-b bg-slate-50">
                <form method="post" action="/match_edit.php" class="space-y-2">
                  <input type="hidden" name="id" value="<?= htmlspecialchars($row['id']) ?>">
                  <input type="hidden" name="mid" value="<?= (int)$m['id'] ?>">
                  <input type="hidden" name="setCount" value="<?= (int)$setCount ?>">
                  <div class="grid grid-cols-1 md:grid-cols-<?= (int)$setCount ?> gap-3">
                    <?php for ($qi = 0; $qi < $setCount; $qi++): $qs = $m['sets'][$qi] ?? ['scoreA'=>null,'scoreB'=>null]; ?>
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-slate-600">Set <?= $qi+1 ?>:</span>
                        <input class="w-20 border rounded px-2 py-1" type="number" name="scoreA_<?= $qi ?>" value="<?= htmlspecialchars($qs['scoreA'] === null ? '' : (string)$qs['scoreA']) ?>" placeholder="A">
                        <span class="text-slate-500">:</span>
                        <input class="w-20 border rounded px-2 py-1" type="number" name="scoreB_<?= $qi ?>" value="<?= htmlspecialchars($qs['scoreB'] === null ? '' : (string)$qs['scoreB']) ?>" placeholder="B">
                      </div>
                    <?php endfor; ?>
                  </div>
                  <div>
                    <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded" type="submit">Speichern</button>
                    <button class="ml-2 text-slate-700 hover:underline" type="button" onclick="toggleQuickEdit('qe-<?= (int)$m['id'] ?>')">Abbrechen</button>
                  </div>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php else: ?>
    <p class="mt-2 text-slate-600">Keine Spiele vorhanden.</p>
  <?php endif; ?>

  <?php
    // standings from PHP logic
    $teamNames = $settings['teamNames'] ?? [];
    $standings = calculate_standings($matches, $teamNames, $settings, 'group');
  ?>
  <h2 class="mt-8 text-xl font-semibold">Tabelle</h2>
  <?php if ($standings): ?>
    <div class="mt-2 overflow-x-auto">
      <table class="min-w-full border border-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 py-2 text-left border-b">Platz</th>
            <th class="px-3 py-2 text-left border-b">Team</th>
            <th class="px-3 py-2 text-left border-b">Spiele</th>
            <th class="px-3 py-2 text-left border-b">Sätze (W-L)</th>
            <th class="px-3 py-2 text-left border-b">Bälle (F-A)</th>
            <th class="px-3 py-2 text-left border-b">Punkte</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($standings as $s): ?>
            <tr class="odd:bg-white even:bg-slate-50">
              <td class="px-3 py-2 border-b"><?= (int)$s['rank'] ?></td>
              <td class="px-3 py-2 border-b"><?= htmlspecialchars($s['teamName']) ?></td>
              <td class="px-3 py-2 border-b"><?= (int)$s['played'] ?></td>
              <td class="px-3 py-2 border-b"><?= (int)$s['setsWon'] ?>‑<?= (int)$s['setsLost'] ?></td>
              <td class="px-3 py-2 border-b"><?= (int)$s['pointsFor'] ?>‑<?= (int)$s['pointsAgainst'] ?></td>
              <td class="px-3 py-2 border-b font-semibold"><?= (int)$s['points'] ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>

  </div>
  <script>
    function toggleQuickEdit(id) {
      const row = document.getElementById(id);
      if (!row) return;
      row.classList.toggle('hidden');
    }
  </script>
</body>
</html>
