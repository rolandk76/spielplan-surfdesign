<?php

namespace App\Services;

class ScheduleService
{
    public function generateSchedule(array $settings): array
    {
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

        // First leg
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

        // Second leg if double
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

        // Remove bye matches
        $generated = array_values(array_filter($generated, function ($m) {
            return ($m['teamA'] !== ' spielfrei ' && $m['teamB'] !== ' spielfrei ');
        }));

        // Time assignment
        [$hh, $mm] = array_map('intval', explode(':', $startTime));
        $matchTime = mktime($hh, $mm, 0);

        $matches = [];
        foreach ($generated as $idx => $m) {
            if ($idx > 0 && $idx % $numFields === 0) {
                $matchTime = $matchTime + ($gameDuration + $breakDuration) * 60;
            }
            $field = $fieldNames[$idx % $numFields] ?? ($fieldNames[0] ?? 'Feld 1');
            $sets = [];
            for ($s = 0; $s < $winningSets; $s++) {
                $sets[] = ['scoreA' => null, 'scoreB' => null];
            }
            $matches[] = [
                'id' => $idx + 1,
                'round' => $m['round'],
                'time' => date('H:i', $matchTime),
                'field' => $field,
                'teamA' => $m['teamA'],
                'teamB' => $m['teamB'],
                // Referee will be assigned in a second pass
                'referee' => null,
                'sets' => $sets,
                'setsWonA' => 0,
                'setsWonB' => 0,
                'pointsForA' => 0,
                'pointsForB' => 0,
                'scoreHistory' => [],
                'phase' => 'group',
            ];
        }

        // Assign referees using helper
        return $this->assignReferees($matches, $settings, $teams, $numFields);
    }

    /**
     * Assign referees fairly to an existing matches array using current settings.
     * - Considers external referees plus optionally teams
     * - Avoids assigning a playing team
     * - Rotates round-robin and avoids repeating on same field consecutively
     */
    public function assignReferees(array $matches, array $settings, ?array $teamNames = null, ?int $numFields = null): array
    {
        $teams = array_values($teamNames ?? ($settings['teamNames'] ?? []));
        $externalRefs = array_values($settings['referees'] ?? []);
        $includeTeamsAsRefs = array_key_exists('includeTeamsAsReferees', $settings) ? (bool)$settings['includeTeamsAsReferees'] : true;
        $refPool = $externalRefs;
        if ($includeTeamsAsRefs) {
            $refPool = array_merge($refPool, $teams);
        }
        $refPool = array_values(array_unique($refPool));
        $numFields = $numFields ?? max(1, (int)($settings['numFields'] ?? 1));

        if (empty($refPool)) {
            return $matches;
        }

        $cycle = $refPool;
        $cycleIndex = 0;
        $refCount = array_fill_keys($refPool, 0);
        $lastRefByField = [];
        $totalMatches = count($matches);
        $numSlots = (int)ceil($totalMatches / max(1, $numFields));

        for ($slot = 0; $slot < $numSlots; $slot++) {
            $start = $slot * $numFields;
            $end = min($start + $numFields, $totalMatches);

            $playing = [];
            for ($i = $start; $i < $end; $i++) {
                $playing[] = $matches[$i]['teamA'];
                $playing[] = $matches[$i]['teamB'];
            }
            $playing = array_unique($playing);

            for ($i = $start; $i < $end; $i++) {
                $field = $matches[$i]['field'];
                $matchTeams = [$matches[$i]['teamA'], $matches[$i]['teamB']];

                $available = array_values(array_diff($refPool, $playing));

                $chosen = null;
                $tries = 0;
                $cycleLen = max(1, count($cycle));
                while ($tries < $cycleLen) {
                    $candidate = $cycle[$cycleIndex % $cycleLen];
                    $cycleIndex++;
                    $tries++;
                    if (!in_array($candidate, $available, true)) continue;
                    if (($lastRefByField[$field] ?? null) === $candidate && $tries < $cycleLen) continue;
                    $chosen = $candidate;
                    break;
                }

                if ($chosen === null) {
                    $fallback = array_values(array_diff($refPool, $matchTeams));
                    if (!empty($fallback)) {
                        usort($fallback, function($a,$b) use ($refCount){return ($refCount[$a] <=> $refCount[$b]);});
                        $chosen = $fallback[0];
                    }
                }

                if ($chosen !== null) {
                    $matches[$i]['referee'] = $chosen;
                    $refCount[$chosen] = ($refCount[$chosen] ?? 0) + 1;
                    $lastRefByField[$field] = $chosen;
                    $pos = array_search($chosen, $cycle, true);
                    if ($pos !== false) {
                        array_splice($cycle, $pos, 1);
                        $cycle[] = $chosen;
                        $cycleIndex = $cycleIndex % max(1, count($cycle));
                    }
                }
            }
        }

        return $matches;
    }

    public function calculateStandings(array $matches, array $teamNames, array $settings, string $phase = 'group'): array
    {
        $stats = [];
        foreach ($teamNames as $t) {
            $stats[$t] = [
                'played' => 0,
                'wins' => 0,
                'losses' => 0,
                'draws' => 0,
                'setsWon' => 0,
                'setsLost' => 0,
                'pointsFor' => 0,
                'pointsAgainst' => 0,
                'points' => 0
            ];
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
                    if ($swA > $swB) { 
                        $stats[$teamA]['wins']++; $stats[$teamB]['losses']++; 
                        $stats[$teamA]['points'] += ($swB === 0 ? 3 : 2); 
                        if ($swB > 0) $stats[$teamB]['points'] += 1; 
                    }
                    elseif ($swB > $swA) { 
                        $stats[$teamB]['wins']++; $stats[$teamA]['losses']++; 
                        $stats[$teamB]['points'] += ($swA === 0 ? 3 : 2); 
                        if ($swA > 0) $stats[$teamA]['points'] += 1; 
                    }
                    elseif ($allowDraws) { 
                        $stats[$teamA]['draws']++; $stats[$teamB]['draws']++; 
                        $stats[$teamA]['points'] += 1; $stats[$teamB]['points'] += 1; 
                    }
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

        // Sort standings
        $tiebreakers = $settings['tiebreakers'] ?? ['points','setDiff','ballDiff','teamName'];
        $list = [];
        foreach ($stats as $team => $d) { 
            $list[] = ['teamName' => $team] + $d; 
        }
        
        usort($list, function($a, $b) use ($tiebreakers) {
            foreach ($tiebreakers as $key) {
                if ($key === 'points') { 
                    if ($b['points'] !== $a['points']) return $b['points'] - $a['points']; 
                }
                elseif ($key === 'setDiff') { 
                    $da = $a['setsWon'] - $a['setsLost']; 
                    $db = $b['setsWon'] - $b['setsLost']; 
                    if ($db !== $da) return $db - $da; 
                }
                elseif ($key === 'ballDiff') { 
                    $da = $a['pointsFor'] - $a['pointsAgainst']; 
                    $db = $b['pointsFor'] - $b['pointsAgainst']; 
                    if ($db !== $da) return $db - $da; 
                }
                elseif ($key === 'teamName') { 
                    $cmp = strcmp($a['teamName'], $b['teamName']); 
                    if ($cmp !== 0) return $cmp; 
                }
            }
            return 0;
        });

        // Add rank
        foreach ($list as $i => &$row) { 
            $row['rank'] = $i + 1; 
        }
        
        return $list;
    }
}
