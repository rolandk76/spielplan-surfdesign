<?php

declare(strict_types=1);

namespace SpielplanGenerator\Api;

use JsonException;

/**
 * Tournament API Handler
 * 
 * Provides backend functionality for tournament management
 * Currently used by Netlify Functions, but can be extended for PHP backend
 */
class TournamentApi
{
    private string $dataPath;
    
    public function __construct(string $dataPath = 'data/tournaments')
    {
        $this->dataPath = $dataPath;
        $this->ensureDataDirectory();
    }
    
    /**
     * Get all tournaments for a user
     */
    public function getTournaments(string $userId): array
    {
        $userFile = $this->getUserFile($userId);
        
        if (!file_exists($userFile)) {
            return [];
        }
        
        try {
            $content = file_get_contents($userFile);
            return json_decode($content, true, 512, JSON_THROW_ON_ERROR) ?? [];
        } catch (JsonException $e) {
            error_log("Failed to decode tournaments for user {$userId}: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Save tournaments for a user
     */
    public function saveTournaments(string $userId, array $tournaments): bool
    {
        $userFile = $this->getUserFile($userId);
        
        try {
            $json = json_encode($tournaments, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT);
            return file_put_contents($userFile, $json) !== false;
        } catch (JsonException $e) {
            error_log("Failed to encode tournaments for user {$userId}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete a specific tournament
     */
    public function deleteTournament(string $userId, string $tournamentId): bool
    {
        $tournaments = $this->getTournaments($userId);
        
        $filteredTournaments = array_filter(
            $tournaments,
            fn($tournament) => $tournament['id'] !== $tournamentId
        );
        
        if (count($filteredTournaments) === count($tournaments)) {
            return false; // Tournament not found
        }
        
        return $this->saveTournaments($userId, array_values($filteredTournaments));
    }
    
    /**
     * Generate tournament statistics
     */
    public function getTournamentStats(array $tournament): array
    {
        $matches = $tournament['matches'] ?? [];
        $settings = $tournament['settings'] ?? [];
        
        $totalMatches = count($matches);
        $completedMatches = count(array_filter(
            $matches,
            fn($match) => !empty(array_filter($match['sets'], fn($set) => $set['scoreA'] !== null))
        ));
        
        $playoffMatches = array_filter($matches, fn($match) => ($match['phase'] ?? 'group') === 'playoff');
        
        return [
            'total_matches' => $totalMatches,
            'completed_matches' => $completedMatches,
            'completion_percentage' => $totalMatches > 0 ? round(($completedMatches / $totalMatches) * 100, 1) : 0,
            'playoff_matches' => count($playoffMatches),
            'team_count' => $settings['numTeams'] ?? 0,
            'tournament_name' => $settings['name'] ?? 'Unnamed Tournament',
            'created_date' => $tournament['lastModified'] ?? null,
        ];
    }
    
    /**
     * Validate tournament data structure
     */
    public function validateTournament(array $tournament): array
    {
        $errors = [];
        
        if (empty($tournament['id'])) {
            $errors[] = 'Tournament ID is required';
        }
        
        if (empty($tournament['settings'])) {
            $errors[] = 'Tournament settings are required';
        } else {
            $settings = $tournament['settings'];
            
            if (empty($settings['name'])) {
                $errors[] = 'Tournament name is required';
            }
            
            if (empty($settings['teamNames']) || !is_array($settings['teamNames'])) {
                $errors[] = 'Team names are required and must be an array';
            }
            
            if (($settings['numTeams'] ?? 0) < 2) {
                $errors[] = 'At least 2 teams are required';
            }
        }
        
        if (!isset($tournament['matches']) || !is_array($tournament['matches'])) {
            $errors[] = 'Matches must be an array';
        }
        
        return $errors;
    }
    
    private function ensureDataDirectory(): void
    {
        if (!is_dir($this->dataPath)) {
            mkdir($this->dataPath, 0755, true);
        }
    }
    
    private function getUserFile(string $userId): string
    {
        $safeUserId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $userId);
        return $this->dataPath . '/' . $safeUserId . '.json';
    }
}
