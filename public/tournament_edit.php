<?php
require __DIR__ . '/_bootstrap.php';

header('Content-Type: text/html; charset=utf-8');

$id = $_GET['id'] ?? ($_POST['id'] ?? '');
if ($id === '') {
  http_response_code(400);
  echo 'Fehlende ID';
  exit;
}

$err = null;
$ok = null;
$row = null;

try {
  $pdo = db_pdo();
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    if ($name === '') throw new RuntimeException('Name ist erforderlich.');
    $settingsRaw = trim($_POST['settings'] ?? '');
    $matchesRaw = trim($_POST['matches'] ?? '');

    $settings = $settingsRaw !== '' ? json_decode($settingsRaw, true, 512, JSON_THROW_ON_ERROR) : [];
    $matches  = $matchesRaw  !== '' ? json_decode($matchesRaw,  true, 512, JSON_THROW_ON_ERROR)  : [];

    $stmt = $pdo->prepare(
      'UPDATE tournaments SET name = ?, settings = ?, matches = ?, last_modified = NOW(6) WHERE id = ?'
    );
    $stmt->execute([
      $name,
      json_encode($settings, JSON_UNESCAPED_UNICODE),
      json_encode($matches, JSON_UNESCAPED_UNICODE),
      $id
    ]);
    header('Location: /tournament_view.php?id=' . urlencode($id));
    exit;
  }

  // load existing
  $stmt = $pdo->prepare('SELECT id, name, settings, matches FROM tournaments WHERE id = ? LIMIT 1');
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

$settingsText = '';
$matchesText = '';
if ($row) {
  $settings = is_string($row['settings']) ? json_decode($row['settings'], true) : $row['settings'];
  $matches  = is_string($row['matches'])  ? json_decode($row['matches'],  true) : $row['matches'];
  $settingsText = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  $matchesText  = json_encode($matches,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Turnier bearbeiten</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; color: #111; }
    label { display:block; margin-top: 12px; font-weight: 600; }
    textarea, input[type=text] { width: 100%; padding: 8px; }
    .err { color: #a00; }
  </style>
</head>
<body>
  <h1>Turnier bearbeiten</h1>
  <p><a href="/">Zurück</a> | <a href="/tournament_view.php?id=<?= htmlspecialchars($id) ?>">Anzeigen</a></p>

  <?php if ($err): ?>
    <p class="err">Fehler: <?= htmlspecialchars($err) ?></p>
  <?php endif; ?>

  <form method="post">
    <input type="hidden" name="id" value="<?= htmlspecialchars($id) ?>" />

    <label for="name">Name</label>
    <input type="text" id="name" name="name" value="<?= htmlspecialchars($row['name'] ?? '') ?>" required />

    <label for="settings">Settings (JSON)</label>
    <textarea id="settings" name="settings" rows="10"><?= htmlspecialchars($settingsText) ?></textarea>

    <label for="matches">Matches (JSON)</label>
    <textarea id="matches" name="matches" rows="12"><?= htmlspecialchars($matchesText) ?></textarea>

    <div style="margin-top: 16px;">
      <button type="submit">Speichern</button>
    </div>
  </form>
</body>
</html>
