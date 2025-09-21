<?php
// Common bootstrap: load .env and provide PDO connection

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

function env_val(string $key, $default = null) {
    $val = $_ENV[$key] ?? getenv($key);
    return $val !== false && $val !== null ? $val : $default;
}

function db_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        env_val('DB_HOST', '127.0.0.1'),
        env_val('DB_PORT', '3306'),
        env_val('DB_DATABASE', '')
    );
    $pdo = new PDO($dsn, env_val('DB_USERNAME', ''), env_val('DB_PASSWORD', ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}
