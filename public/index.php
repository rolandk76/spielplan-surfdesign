<?php
// Simple PHP app for Forge with MySQL connection
// Document root should be set to the `public/` directory on Forge.

// Load env vars from .env if present (simple loader)
$root = dirname(__DIR__);
$envPath = $root . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        if (strlen($v) >= 2 && (($v[0] === '"' && $v[strlen($v)-1] === '"') || ($v[0] === "'" && $v[strlen($v)-1] === "'"))) {
            $v = substr($v, 1, -1);
        }
        $_ENV[$k] = $v;
        putenv("$k=$v");
    }
}

function env($key, $default = null) {
    $val = $_ENV[$key] ?? getenv($key);
    return $val !== false && $val !== null ? $val : $default;
}

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    env('DB_HOST', '127.0.0.1'),
    env('DB_PORT', '3306'),
    env('DB_DATABASE', '')
);

$ok = false;
$error = null;
$tournaments = [];

try {
    $pdo = new PDO($dsn, env('DB_USERNAME', ''), env('DB_PASSWORD', ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $ok = true;
    // Try to query a few tournaments if table exists
    try {
        $stmt = $pdo->query('SHOW TABLES LIKE "tournaments"');
        if ($stmt->fetch()) {
            $q = $pdo->query('SELECT id, name, last_modified FROM tournaments ORDER BY last_modified DESC LIMIT 10');
            $tournaments = $q->fetchAll();
        }
    } catch (Throwable $e) {
        // ignore if table not found
    }
} catch (Throwable $e) {
    $error = $e->getMessage();
}

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Spielplan App • Forge</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; color: #111; }
    .ok { color: #0a7a25; }
    .err { color: #a00; }
    code, pre { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>Spielplan App</h1>
  <p>Deployment-Ziel: <strong>Laravel Forge</strong> (PHP Site)</p>

  <h2>Datenbankverbindung</h2>
  <?php if ($ok): ?>
    <p class="ok">Verbunden mit MySQL: <code><?= htmlspecialchars($dsn) ?></code></p>
  <?php else: ?>
    <p class="err">Verbindung fehlgeschlagen: <?= htmlspecialchars($error) ?></p>
  <?php endif; ?>

  <h2>Tournaments (Top 10)</h2>
  <?php if ($tournaments && count($tournaments) > 0): ?>
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Last Modified</th></tr></thead>
      <tbody>
      <?php foreach ($tournaments as $t): ?>
        <tr>
          <td><code><?= htmlspecialchars($t['id']) ?></code></td>
          <td><?= htmlspecialchars($t['name']) ?></td>
          <td><?= htmlspecialchars($t['last_modified']) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  <?php else: ?>
    <p>Keine Daten vorhanden oder Tabelle <code>tournaments</code> existiert noch nicht.</p>
  <?php endif; ?>

  <h2>Setup</h2>
  <ol>
    <li>Erstelle in MySQL die Datenbank und einen User (auf Forge).</li>
    <li>Lege eine <code>.env</code> mit deinen DB-Zugangsdaten an (siehe <code>.env.example</code>).</li>
    <li>Importiere <code>mysql_schema.sql</code> (Schema) und optional deine Daten.</li>
  </ol>
</body>
</html>
