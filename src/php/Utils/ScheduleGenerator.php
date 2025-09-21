<?php

declare(strict_types=1);

namespace SpielplanGenerator\Utils;

/**
 * Schedule Generator Utility
 * 
 * PHP implementation of tournament schedule generation algorithms
 */
class ScheduleGenerator
{
    /**
     * Generate round-robin schedule for given teams
     */
    public static function generateRoundRobin(array $teams, bool $doubleRoundRobin = false): array
    {
        $teamCount = count($teams);
        
        if ($teamCount < 2) {
            return [];
        }
        
        // Add bye team if odd number of teams
        $workingTeams = $teams;
        $hasBye = $teamCount % 2 !== 0;
        if ($hasBye) {
            $workingTeams[] = 'BYE';
        }
        
        $totalTeams = count($workingTeams);
        $rounds = $totalTeams - 1;
        $matchesPerRound = $totalTeams / 2;
        
        $schedule = [];
        $matchId = 1;
        
        // Generate single round-robin
        for ($round = 1; $round <= $rounds; $round++) {
            $roundMatches = [];
            
            for ($match = 0; $match < $matchesPerRound; $match++) {
                $home = ($round + $match - 1) % ($totalTeams - 1);
                $away = ($totalTeams - 1 - $match + $round - 1) % ($totalTeams - 1);
                
                // Last team stays fixed
                if ($match === 0) {
                    $away = $totalTeams - 1;
                }
                
                $teamA = $workingTeams[$home];
                $teamB = $workingTeams[$away];
                
                // Skip matches with BYE team
                if ($teamA !== 'BYE' && $teamB !== 'BYE') {
                    $roundMatches[] = [
                        'id' => $matchId++,
                        'round' => $round,
                        'teamA' => $teamA,
                        'teamB' => $teamB,
                        'phase' => 'group'
                    ];
                }
            }
            
            $schedule = array_merge($schedule, $roundMatches);
        }
        
        // Add return matches for double round-robin
        if ($doubleRoundRobin) {
            $returnMatches = [];
            foreach ($schedule as $match) {
                $returnMatches[] = [
                    'id' => $matchId++,
                    'round' => $match['round'] + $rounds,
                    'teamA' => $match['teamB'], // Swap home/away
                    'teamB' => $match['teamA'],
                    'phase' => 'group'
                ];
            }
            $schedule = array_merge($schedule, $returnMatches);
        }
        
        return $schedule;
    }
    
    /**
     * Generate playoff bracket
     */
    public static function generatePlayoffBracket(array $qualifiedTeams, string $mode = 'direct_final'): array
    {
        $teamCount = count($qualifiedTeams);
        $matches = [];
        $matchId = 1000; // Start with high ID to avoid conflicts
        
        switch ($mode) {
            case 'direct_final':
                if ($teamCount >= 2) {
                    $matches[] = [
                        'id' => $matchId++,
                        'teamA' => $qualifiedTeams[0],
                        'teamB' => $qualifiedTeams[1],
                        'phase' => 'playoff',
                        'playoffRound' => 'Finale'
                    ];
                    
                    // Third place match if 4+ teams
                    if ($teamCount >= 4) {
                        $matches[] = [
                            'id' => $matchId++,
                            'teamA' => $qualifiedTeams[2],
                            'teamB' => $qualifiedTeams[3],
                            'phase' => 'playoff',
                            'playoffRound' => 'Spiel um Platz 3'
                        ];
                    }
                }
                break;
                
            case 'semi_final':
                if ($teamCount >= 4) {
                    // Semifinals
                    $matches[] = [
                        'id' => $matchId++,
                        'teamA' => $qualifiedTeams[0],
                        'teamB' => $qualifiedTeams[3],
                        'phase' => 'playoff',
                        'playoffRound' => 'Halbfinale 1'
                    ];
                    
                    $matches[] = [
                        'id' => $matchId++,
                        'teamA' => $qualifiedTeams[1],
                        'teamB' => $qualifiedTeams[2],
                        'phase' => 'playoff',
                        'playoffRound' => 'Halbfinale 2'
                    ];
                    
                    // Final and third place (placeholders)
                    $matches[] = [
                        'id' => $matchId++,
                        'teamA' => 'Sieger HF1',
                        'teamB' => 'Sieger HF2',
                        'phase' => 'playoff',
                        'playoffRound' => 'Finale'
                    ];
                    
                    $matches[] = [
                        'id' => $matchId++,
                        'teamA' => 'Verlierer HF1',
                        'teamB' => 'Verlierer HF2',
                        'phase' => 'playoff',
                        'playoffRound' => 'Spiel um Platz 3'
                    ];
                }
                break;
                
            case 'top4_roundrobin':
            case 'top6_roundrobin':
                $playoffTeamCount = $mode === 'top4_roundrobin' ? 4 : 6;
                $playoffTeams = array_slice($qualifiedTeams, 0, $playoffTeamCount);
                
                // Generate round-robin for playoff teams
                for ($i = 0; $i < count($playoffTeams); $i++) {
                    for ($j = $i + 1; $j < count($playoffTeams); $j++) {
                        $matches[] = [
                            'id' => $matchId++,
                            'teamA' => $playoffTeams[$i],
                            'teamB' => $playoffTeams[$j],
                            'phase' => 'playoff',
                            'playoffRound' => 'Endrunde'
                        ];
                    }
                }
                break;
        }
        
        return $matches;
    }
    
    /**
     * Calculate team standings from matches
     */
    public static function calculateStandings(array $matches, array $teamNames, array $settings = []): array
    {
        $standings = [];
        
        // Initialize standings
        foreach ($teamNames as $team) {
            $standings[$team] = [
                'teamName' => $team,
                'played' => 0,
                'wins' => 0,
                'losses' => 0,
                'draws' => 0,
                'points' => 0,
                'setsWon' => 0,
                'setsLost' => 0,
                'ballsWon' => 0,
                'ballsLost' => 0
            ];
        }
        
        // Process matches
        foreach ($matches as $match) {
            if (!isset($match['sets']) || empty($match['sets'])) {
                continue;
            }
            
            $teamA = $match['teamA'];
            $teamB = $match['teamB'];
            
            if (!isset($standings[$teamA]) || !isset($standings[$teamB])) {
                continue;
            }
            
            $setsA = 0;
            $setsB = 0;
            $ballsA = 0;
            $ballsB = 0;
            
            foreach ($match['sets'] as $set) {
                if ($set['scoreA'] !== null && $set['scoreB'] !== null) {
                    $ballsA += $set['scoreA'];
                    $ballsB += $set['scoreB'];
                    
                    if ($set['scoreA'] > $set['scoreB']) {
                        $setsA++;
                    } elseif ($set['scoreB'] > $set['scoreA']) {
                        $setsB++;
                    }
                }
            }
            
            // Only count completed matches
            if ($setsA > 0 || $setsB > 0) {
                $standings[$teamA]['played']++;
                $standings[$teamB]['played']++;
                $standings[$teamA]['setsWon'] += $setsA;
                $standings[$teamA]['setsLost'] += $setsB;
                $standings[$teamB]['setsWon'] += $setsB;
                $standings[$teamB]['setsLost'] += $setsA;
                $standings[$teamA]['ballsWon'] += $ballsA;
                $standings[$teamA]['ballsLost'] += $ballsB;
                $standings[$teamB]['ballsWon'] += $ballsB;
                $standings[$teamB]['ballsLost'] += $ballsA;
                
                // Determine winner
                if ($setsA > $setsB) {
                    $standings[$teamA]['wins']++;
                    $standings[$teamB]['losses']++;
                    $standings[$teamA]['points'] += 2;
                } elseif ($setsB > $setsA) {
                    $standings[$teamB]['wins']++;
                    $standings[$teamA]['losses']++;
                    $standings[$teamB]['points'] += 2;
                } else {
                    $standings[$teamA]['draws']++;
                    $standings[$teamB]['draws']++;
                    $standings[$teamA]['points'] += 1;
                    $standings[$teamB]['points'] += 1;
                }
            }
        }
        
        // Convert to array and sort
        $standingsArray = array_values($standings);
        
        // Sort by points, then by set difference, then by ball difference
        usort($standingsArray, function ($a, $b) {
            if ($a['points'] !== $b['points']) {
                return $b['points'] - $a['points'];
            }
            
            $setDiffA = $a['setsWon'] - $a['setsLost'];
            $setDiffB = $b['setsWon'] - $b['setsLost'];
            if ($setDiffA !== $setDiffB) {
                return $setDiffB - $setDiffA;
            }
            
            $ballDiffA = $a['ballsWon'] - $a['ballsLost'];
            $ballDiffB = $b['ballsWon'] - $b['ballsLost'];
            if ($ballDiffA !== $ballDiffB) {
                return $ballDiffB - $ballDiffA;
            }
            
            return strcmp($a['teamName'], $b['teamName']);
        });
        
        // Add ranks
        foreach ($standingsArray as $index => $standing) {
            $standingsArray[$index]['rank'] = $index + 1;
        }
        
        return $standingsArray;
    }
}
