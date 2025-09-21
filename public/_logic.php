<?php
// Schedule generation and standings calculation (PHP port of React logic)

function generate_schedule(array $settings): array {
    $teams = array_values($settings['teamNames'] ?? []);
    $double = !empty($settings['doubleRoundRobin']);
    $numFields = max(1, (int)($settings['numFields'] ?? 1));
    $fieldNames = $settings['fieldNames'] ?? ['Feld 1'];
    $gameDuration = (int)($settings['gameDuration'] ?? 15);
    $breakDuration = (int)($settings['breakDuration'] ?? 5);
    $startTime = $settings['startTime'] ?? '09:00';
    $winningSets = (int)($settings['winningSets'] ?? 2);

    $isOdd = count($teams) % 2 !== 0;
    if ($isOdd) {
        $teams[] = ' spielfrei ';
    }
    $numTeams = count($teams);
    $numRounds = $numTeams - 1;
    $matchesPerRound = intdiv($numTeams, 2);

    $teamIndices = range(0, $numTeams - 1);
    $generated = [];

    // first leg
    for ($round = 0; $round < $numRounds; $round++) {
        for ($i = 0; $i < $matchesPerRound; $i++) {
            $teamAIndex = $teamIndices[$i];
            $teamBIndex = $teamIndices[$numTeams - 1 - $i];
            $generated[] = [
                'round' => $round + 1,
                'teamA' => $teams[$teamAIndex],
                'teamB' => $teams[$teamBIndex],
            ];
        }
        $last = array_pop($teamIndices);
        array_splice($teamIndices, 1, 0, [$last]);
    }

    // second leg if double
    if ($double) {
        $teamIndices = range(0, $numTeams - 1);
        for ($round = 0; $round < $numRounds; $round++) {
            for ($i = 0; $i < $matchesPerRound; $i++) {
                $teamAIndex = $teamIndices[$i];
                $teamBIndex = $teamIndices[$numTeams - 1 - $i];
                $generated[] = [
                    'round' => $numRounds + $round + 1,
                    'teamA' => $teams[$teamBIndex],
                    'teamB' => $teams[$teamAIndex],
                ];
            }
            $last = array_pop($teamIndices);
            array_splice($teamIndices, 1, 0, [$last]);
        }
    }

    // remove bye
    $generated = array_values(array_filter($generated, function ($m) {
        return ($m['teamA'] !== ' spielfrei ' && $m['teamB'] !== ' spielfrei ');
    }));

    // time assignment
    [$hh, $mm] = array_map('intval', explode(':', $startTime));
    $matchTime = mktime($hh, $mm, 0);

    $matches = [];
    $maxSets = $winningSets; // create fixed number of sets entries

    foreach ($generated as $idx => $m) {
        if ($idx > 0 && $idx % $numFields === 0) {
            $matchTime = $matchTime + ($gameDuration + $breakDuration) * 60;
        }
        $field = $fieldNames[$idx % $numFields] ?? ($fieldNames[0] ?? 'Feld 1');
        $sets = [];
        for ($s = 0; $s < $maxSets; $s++) $sets[] = ['scoreA' => null, 'scoreB' => null];
        $matches[] = [
            'id' => $idx + 1,
            'round' => $m['round'],
            'time' => date('H:i', $matchTime),
            'field' => $field,
            'teamA' => $m['teamA'],
            'teamB' => $m['teamB'],
            'sets' => $sets,
            'setsWonA' => 0,
            'setsWonB' => 0,
            'pointsForA' => 0,
            'pointsForB' => 0,
            'scoreHistory' => [],
            'phase' => 'group',
        ];
    }

    return $matches;
}

function calculate_standings(array $matches, array $teamNames, array $settings, string $phase = 'group'): array {
    $stats = [];
    foreach ($teamNames as $t) {
        $stats[$t] = ['played'=>0,'wins'=>0,'losses'=>0,'draws'=>0,'setsWon'=>0,'setsLost'=>0,'pointsFor'=>0,'pointsAgainst'=>0,'points'=>0];
    }

    $scoringMode = $settings['scoringMode'] ?? 'per_set';
    $allowDraws = $settings['allowDraws'] ?? true;

    $relevant = array_filter($matches, function ($m) use ($phase) {
        return ($m['phase'] ?? 'group') === $phase;
    });

    foreach ($relevant as $m) {
        $teamA = $m['teamA'] ?? null;
        $teamB = $m['teamB'] ?? null;
        if (!$teamA || !$teamB) continue;
        $swA = 0; $swB = 0; $pfA = 0; $pfB = 0;
        $playedSets = array_values(array_filter($m['sets'] ?? [], function ($s) {
            return isset($s['scoreA'], $s['scoreB']) && $s['scoreA'] !== null && $s['scoreB'] !== null;
        }));
        foreach ($playedSets as $s) {
            $a = (int)$s['scoreA'];
            $b = (int)$s['scoreB'];
            $pfA += $a; $pfB += $b;
            if ($a > $b) $swA++; elseif ($b > $a) $swB++;
        }
        if (count($playedSets) === 0) continue;
        $stats[$teamA]['played']++; $stats[$teamB]['played']++;
        $stats[$teamA]['setsWon'] += $swA; $stats[$teamA]['setsLost'] += $swB;
        $stats[$teamB]['setsWon'] += $swB; $stats[$teamB]['setsLost'] += $swA;
        $stats[$teamA]['pointsFor'] += $pfA; $stats[$teamA]['pointsAgainst'] += $pfB;
        $stats[$teamB]['pointsFor'] += $pfB; $stats[$teamB]['pointsAgainst'] += $pfA;

        switch ($scoringMode) {
            case 'per_set':
                $stats[$teamA]['points'] += $swA;
                $stats[$teamB]['points'] += $swB;
                if ($swA > $swB) { $stats[$teamA]['wins']++; $stats[$teamB]['losses']++; }
                elseif ($swB > $swA) { $stats[$teamB]['wins']++; $stats[$teamA]['losses']++; }
                elseif ($allowDraws) { $stats[$teamA]['draws']++; $stats[$teamB]['draws']++; }
                break;
            case 'match_321':
                if ($swA > $swB) { $stats[$teamA]['wins']++; $stats[$teamB]['losses']++; $stats[$teamA]['points'] += ($swB === 0 ? 3 : 2); if ($swB > 0) $stats[$teamB]['points'] += 1; }
                elseif ($swB > $swA) { $stats[$teamB]['wins']++; $stats[$teamA]['losses']++; $stats[$teamB]['points'] += ($swA === 0 ? 3 : 2); if ($swA > 0) $stats[$teamA]['points'] += 1; }
                elseif ($allowDraws) { $stats[$teamA]['draws']++; $stats[$teamB]['draws']++; $stats[$teamA]['points'] += 1; $stats[$teamB]['points'] += 1; }
                break;
            case 'match_210':
                if ($swA > $swB) { $stats[$teamA]['wins']++; $stats[$teamB]['losses']++; $stats[$teamA]['points'] += 2; }
                elseif ($swB > $swA) { $stats[$teamB]['wins']++; $stats[$teamA]['losses']++; $stats[$teamB]['points'] += 2; }
                elseif ($allowDraws) { $stats[$teamA]['points'] += 1; $stats[$teamB]['points'] += 1; }
                break;
            case 'match_10':
                if ($swA > $swB) { $stats[$teamA]['wins']++; $stats[$teamB]['losses']++; $stats[$teamA]['points'] += 1; }
                elseif ($swB > $swA) { $stats[$teamB]['wins']++; $stats[$teamA]['losses']++; $stats[$teamB]['points'] += 1; }
                break;
            default:
                $stats[$teamA]['points'] += $swA; $stats[$teamB]['points'] += $swB;
        }
    }

    // sort
    $tiebreakers = $settings['tiebreakers'] ?? ['points','setDiff','ballDiff','teamName'];
    $list = [];
    foreach ($stats as $team => $d) { $list[] = ['teamName'=>$team] + $d; }
    usort($list, function($a,$b) use ($tiebreakers) {
        foreach ($tiebreakers as $key) {
            if ($key === 'points') { if ($b['points'] !== $a['points']) return $b['points'] - $a['points']; }
            elseif ($key === 'setDiff') { $da = $a['setsWon'] - $a['setsLost']; $db = $b['setsWon'] - $b['setsLost']; if ($db !== $da) return $db - $da; }
            elseif ($key === 'ballDiff') { $da = $a['pointsFor'] - $a['pointsAgainst']; $db = $b['pointsFor'] - $b['pointsAgainst']; if ($db !== $da) return $db - $da; }
            elseif ($key === 'teamName') { $cmp = strcmp($a['teamName'], $b['teamName']); if ($cmp !== 0) return $cmp; }
        }
        return 0;
    });

    // add rank
    foreach ($list as $i => &$row) { $row['rank'] = $i + 1; }
    return $list;
}
