<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_logic.php';

header('Content-Type: text/html; charset=utf-8');

$tournamentId = $_GET['id'] ?? ($_POST['id'] ?? '');
$matchId = isset($_GET['mid']) ? (int)$_GET['mid'] : (isset($_POST['mid']) ? (int)$_POST['mid'] : 0);
if ($tournamentId === '' || $matchId <= 0) {
  http_response_code(400);
  echo 'Fehlende Parameter';
  exit;
}

$err = null;
$row = null;
$match = null;
$matches = [];
$settings = [];

try {
  $pdo = db_pdo();
  // Load tournament
  $stmt = $pdo->prepare('SELECT id, name, settings, matches FROM tournaments WHERE id = ? LIMIT 1');
  $stmt->execute([$tournamentId]);
  $row = $stmt->fetch();
  if (!$row) {
    http_response_code(404);
    echo 'Turnier nicht gefunden';
    exit;
  }
  $settings = is_string($row['settings']) ? json_decode($row['settings'], true) : ($row['settings'] ?? []);
  $matches = is_string($row['matches']) ? json_decode($row['matches'], true) : ($row['matches'] ?? []);

  // Find match
  foreach ($matches as $m) {
    if ((int)($m['id'] ?? 0) === $matchId) { $match = $m; break; }
  }
  if (!$match) {
    http_response_code(404);
    echo 'Match nicht gefunden';
    exit;
  }

  // Handle save
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $newSets = [];
    $existingSets = is_array($match['sets'] ?? null) ? $match['sets'] : [];
    $setCount = count($existingSets) > 0 ? count($existingSets) : max(1, (int)($_POST['setCount'] ?? 2));
    for ($i = 0; $i < $setCount; $i++) {
      $a = $_POST['scoreA_' . $i] ?? '';
      $b = $_POST['scoreB_' . $i] ?? '';
      $a = ($a === '' ? null : (int)$a);
      $b = ($b === '' ? null : (int)$b);
      $newSets[] = ['scoreA' => $a, 'scoreB' => $b];
    }

    // Update in matches array
    foreach ($matches as &$mm) {
      if ((int)($mm['id'] ?? 0) === $matchId) {
        $mm['sets'] = $newSets;
        // Optional: recompute derived fields
        $swA = 0; $swB = 0; $pfA = 0; $pfB = 0;
        foreach ($newSets as $s) {
          if ($s['scoreA'] !== null && $s['scoreB'] !== null) {
            $pfA += (int)$s['scoreA'];
            $pfB += (int)$s['scoreB'];
            if ((int)$s['scoreA'] > (int)$s['scoreB']) $swA++; elseif ((int)$s['scoreB'] > (int)$s['scoreA']) $swB++;
          }
        }
        $mm['setsWonA'] = $swA;
        $mm['setsWonB'] = $swB;
        $mm['pointsForA'] = $pfA;
        $mm['pointsForB'] = $pfB;
        break;
      }
    }
    unset($mm);

    // Save back to DB
    $stmt = $pdo->prepare('UPDATE tournaments SET matches = ?, last_modified = NOW(6) WHERE id = ?');
    $stmt->execute([json_encode($matches, JSON_UNESCAPED_UNICODE), $tournamentId]);

    header('Location: /tournament_view.php?id=' . urlencode($tournamentId));
    exit;
  }
} catch (Throwable $e) {
  $err = $e->getMessage();
}

$sets = is_array($match['sets'] ?? null) ? $match['sets'] : [];
$setCount = count($sets) > 0 ? count($sets) : 2;
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ergebnisse eintragen</title>
  <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
</head>
<body>
  <div class="max-w-xl mx-auto p-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Ergebnisse eintragen</h1>
      <a class="text-blue-600 hover:underline" href="/tournament_view.php?id=<?= htmlspecialchars($tournamentId) ?>">Zurück</a>
    </div>

    <?php if ($err): ?>
      <p class="mt-3 text-red-700">Fehler: <?= htmlspecialchars($err) ?></p>
    <?php endif; ?>

    <div class="mt-4 text-sm text-slate-700">
      <div><span class="font-semibold">Match:</span> #<?= (int)$match['id'] ?> (<?= htmlspecialchars($match['teamA']) ?> vs. <?= htmlspecialchars($match['teamB']) ?>)</div>
      <div><span class="font-semibold">Zeit/Feld:</span> <?= htmlspecialchars($match['time'] ?? '') ?> / <?= htmlspecialchars($match['field'] ?? '') ?></div>
    </div>

    <form class="mt-6" method="post">
      <input type="hidden" name="id" value="<?= htmlspecialchars($tournamentId) ?>" />
      <input type="hidden" name="mid" value="<?= (int)$matchId ?>" />
      <input type="hidden" name="setCount" value="<?= (int)$setCount ?>" />

      <div class="space-y-3">
        <?php for ($i = 0; $i < $setCount; $i++): $s = $sets[$i] ?? ['scoreA'=>null,'scoreB'=>null]; ?>
          <div class="grid grid-cols-3 gap-3 items-center">
            <div class="text-slate-700">Set <?= $i+1 ?></div>
            <input class="border rounded px-3 py-2" type="number" name="scoreA_<?= $i ?>" value="<?= htmlspecialchars($s['scoreA'] === null ? '' : (string)$s['scoreA']) ?>" placeholder="A" />
            <input class="border rounded px-3 py-2" type="number" name="scoreB_<?= $i ?>" value="<?= htmlspecialchars($s['scoreB'] === null ? '' : (string)$s['scoreB']) ?>" placeholder="B" />
          </div>
        <?php endfor; ?>
      </div>

      <div class="mt-6">
        <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded" type="submit">Speichern</button>
      </div>
    </form>
  </div>
</body>
</html>
