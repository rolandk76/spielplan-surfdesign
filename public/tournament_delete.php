<?php
require __DIR__ . '/_bootstrap.php';

$id = $_GET['id'] ?? '';
if ($id === '') {
  http_response_code(400);
  echo 'Fehlende ID';
  exit;
}

try {
  $pdo = db_pdo();
  $stmt = $pdo->prepare('DELETE FROM tournaments WHERE id = ?');
  $stmt->execute([$id]);
  header('Location: /');
  exit;
} catch (Throwable $e) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Fehler beim Löschen: ' . $e->getMessage();
}
