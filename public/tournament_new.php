<?php
require __DIR__ . '/_bootstrap.php';
require __DIR__ . '/_logic.php';

$error = null;
$ok = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $pdo = db_pdo();
        $id = $_POST['id'] ?? bin2hex(random_bytes(16));
        $name = trim($_POST['name'] ?? '');
        if ($name === '') throw new RuntimeException('Name ist erforderlich.');

        // Build settings from form inputs (no JSON required)
        $numTeams = max(2, (int)($_POST['numTeams'] ?? 4));
        $teamLines = trim($_POST['teamNames'] ?? '');
        $teamNames = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $teamLines)), function($v){ return $v !== ''; }));
        if (count($teamNames) === 0) {
            // fallback generic names
            $teamNames = array_map(fn($i)=>"Team $i", range(1,$numTeams));
        }
        $numFields = max(1, (int)($_POST['numFields'] ?? 1));
        $fieldLines = trim($_POST['fieldNames'] ?? 'Feld 1');
        $fieldNames = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $fieldLines)), fn($v)=>$v!==''));
        if (count($fieldNames) === 0) { $fieldNames = ['Feld 1']; }
        $gameDuration = max(1, (int)($_POST['gameDuration'] ?? 15));
        $breakDuration = max(0, (int)($_POST['breakDuration'] ?? 5));
        $startTime = $_POST['startTime'] ?? '09:00';
        $winningSets = max(1, (int)($_POST['winningSets'] ?? 2));
        $doubleRR = isset($_POST['doubleRoundRobin']) && $_POST['doubleRoundRobin'] === 'on';
        $allowDraws = isset($_POST['allowDraws']) && $_POST['allowDraws'] === 'on';
        $scoringMode = $_POST['scoringMode'] ?? 'per_set';
        $tiebreakerScheme = $_POST['tiebreakerScheme'] ?? 'points>setDiff>ballDiff';
        $tiebreakers = $tiebreakerScheme === 'points>ballDiff>setDiff'
            ? ['points','ballDiff','setDiff','teamName']
            : ['points','setDiff','ballDiff','teamName'];

        $settings = [
            'name' => $name,
            'numTeams' => $numTeams,
            'teamNames' => $teamNames,
            'numFields' => $numFields,
            'fieldNames' => $fieldNames,
            'gameDuration' => $gameDuration,
            'breakDuration' => $breakDuration,
            'startTime' => $startTime,
            'winningSets' => $winningSets,
            'allowDraws' => $allowDraws,
            'scoringMode' => $scoringMode,
            'tiebreakers' => $tiebreakers,
            'doubleRoundRobin' => $doubleRR,
            'playoffMode' => 'none'
        ];

        // Generate schedule from settings
        $matches = generate_schedule($settings);

        $stmt = $pdo->prepare(
            'INSERT INTO tournaments (id, name, settings, matches, last_modified) VALUES (?, ?, ?, ?, NOW(6))
             ON DUPLICATE KEY UPDATE name=VALUES(name), settings=VALUES(settings), matches=VALUES(matches), last_modified=NOW(6)'
        );
        $stmt->execute([$id, $name, json_encode($settings, JSON_UNESCAPED_UNICODE), json_encode($matches, JSON_UNESCAPED_UNICODE)]);
        header('Location: /tournament_view.php?id=' . urlencode($id));
        exit;
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

header('Content-Type: text/html; charset=utf-8');
echo ui_layout_start('Neues Turnier anlegen', '/');
?>

<div class="animate-fade-in">
  <?php if ($error): ?>
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-red-800 font-medium">Fehler:</span>
        <span class="text-red-700 ml-2"><?= htmlspecialchars($error) ?></span>
      </div>
    </div>
  <?php endif; ?>

  <?= ui_card('
    <form method="post" class="p-8 space-y-8">
      <!-- Tournament Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-slate-700 mb-2">Turniername</label>
        <input type="text" id="name" name="name" required 
               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
               placeholder="Mein Volleyball Turnier" />
      </div>

      <!-- Basic Settings Grid -->
      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Grundeinstellungen</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label for="numTeams" class="block text-sm font-medium text-slate-700 mb-2">Anzahl Teams</label>
            <input type="number" id="numTeams" name="numTeams" min="2" max="64" value="4" 
                   class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label for="winningSets" class="block text-sm font-medium text-slate-700 mb-2">Gewinnsätze</label>
            <input type="number" id="winningSets" name="winningSets" min="1" max="5" value="2" 
                   class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label for="numFields" class="block text-sm font-medium text-slate-700 mb-2">Anzahl Felder</label>
            <input type="number" id="numFields" name="numFields" min="1" max="10" value="1" 
                   class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      <!-- Timing Settings -->
      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Zeitplanung</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="startTime" class="block text-sm font-medium text-slate-700 mb-2">Startzeit</label>
            <input type="time" id="startTime" name="startTime" value="09:00" 
                   class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label for="gameDuration" class="block text-sm font-medium text-slate-700 mb-2">Spieldauer (min)</label>
            <input type="number" id="gameDuration" name="gameDuration" min="1" max="120" value="15" 
                   class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label for="breakDuration" class="block text-sm font-medium text-slate-700 mb-2">Pause (min)</label>
            <input type="number" id="breakDuration" name="breakDuration" min="0" max="60" value="5" 
                   class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      <!-- Scoring Settings -->
      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Punktesystem</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="scoringMode" class="block text-sm font-medium text-slate-700 mb-2">Punktesystem</label>
            <select id="scoringMode" name="scoringMode" 
                    class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="per_set" selected>Pro Satz (1 Punkt je Satz)</option>
              <option value="match_321">Match 3‑2‑1</option>
              <option value="match_210">Match 2‑1‑0</option>
              <option value="match_10">Match 1‑0</option>
            </select>
          </div>
          <div>
            <label for="tiebreakerScheme" class="block text-sm font-medium text-slate-700 mb-2">Tiebreaker</label>
            <select id="tiebreakerScheme" name="tiebreakerScheme" 
                    class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="points>setDiff>ballDiff" selected>Points > SetDiff > BallDiff</option>
              <option value="points>ballDiff>setDiff">Points > BallDiff > SetDiff</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tournament Options -->
      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Turnieroptionen</h3>
        <div class="space-y-4">
          <div class="flex items-center">
            <input type="checkbox" id="doubleRoundRobin" name="doubleRoundRobin" 
                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
            <label for="doubleRoundRobin" class="ml-3 text-sm text-slate-700">Rückrunde (doppelt)</label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="allowDraws" name="allowDraws" checked 
                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
            <label for="allowDraws" class="ml-3 text-sm text-slate-700">Unentschieden erlauben</label>
          </div>
        </div>
      </div>

      <!-- Teams -->
      <div>
        <label for="teamNames" class="block text-sm font-medium text-slate-700 mb-2">Teamnamen</label>
        <p class="text-sm text-slate-500 mb-3">Geben Sie jeden Teamnamen in eine neue Zeile ein</p>
        <textarea id="teamNames" name="teamNames" rows="6" 
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Team 1
Team 2
Team 3
Team 4"></textarea>
      </div>

      <!-- Fields -->
      <div>
        <label for="fieldNames" class="block text-sm font-medium text-slate-700 mb-2">Feldnamen</label>
        <p class="text-sm text-slate-500 mb-3">Geben Sie jeden Feldnamen in eine neue Zeile ein</p>
        <textarea id="fieldNames" name="fieldNames" rows="3" 
                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Feld 1"></textarea>
      </div>

      <!-- Submit Button -->
      <div class="flex items-center justify-between pt-6 border-t border-slate-200">
        <a href="/" class="text-slate-600 hover:text-slate-900 transition-colors">Abbrechen</a>
        <button type="submit" 
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md">
          <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Spielplan generieren
        </button>
      </div>
    </form>
  ') ?>
</div>

<?= ui_layout_end() ?>
