<?php

declare(strict_types=1);

namespace SpielplanGenerator\Tests;

use PHPUnit\Framework\TestCase;
use SpielplanGenerator\Api\TournamentApi;
use SpielplanGenerator\Utils\ScheduleGenerator;

class TournamentApiTest extends TestCase
{
    private TournamentApi $api;
    private string $testDataPath;
    
    protected function setUp(): void
    {
        $this->testDataPath = sys_get_temp_dir() . '/spielplan_test_' . uniqid();
        $this->api = new TournamentApi($this->testDataPath);
    }
    
    protected function tearDown(): void
    {
        // Clean up test data
        if (is_dir($this->testDataPath)) {
            $files = glob($this->testDataPath . '/*');
            foreach ($files as $file) {
                unlink($file);
            }
            rmdir($this->testDataPath);
        }
    }
    
    public function testGetTournamentsEmptyUser(): void
    {
        $tournaments = $this->api->getTournaments('nonexistent_user');
        $this->assertEmpty($tournaments);
    }
    
    public function testSaveAndGetTournaments(): void
    {
        $userId = 'test_user';
        $tournaments = [
            [
                'id' => 'tournament_1',
                'settings' => [
                    'name' => 'Test Tournament',
                    'teamNames' => ['Team A', 'Team B', 'Team C'],
                    'numTeams' => 3
                ],
                'matches' => []
            ]
        ];
        
        $result = $this->api->saveTournaments($userId, $tournaments);
        $this->assertTrue($result);
        
        $retrieved = $this->api->getTournaments($userId);
        $this->assertEquals($tournaments, $retrieved);
    }
    
    public function testDeleteTournament(): void
    {
        $userId = 'test_user';
        $tournaments = [
            ['id' => 'tournament_1', 'settings' => ['name' => 'Tournament 1']],
            ['id' => 'tournament_2', 'settings' => ['name' => 'Tournament 2']]
        ];
        
        $this->api->saveTournaments($userId, $tournaments);
        
        $result = $this->api->deleteTournament($userId, 'tournament_1');
        $this->assertTrue($result);
        
        $remaining = $this->api->getTournaments($userId);
        $this->assertCount(1, $remaining);
        $this->assertEquals('tournament_2', $remaining[0]['id']);
    }
    
    public function testValidateTournament(): void
    {
        $validTournament = [
            'id' => 'valid_tournament',
            'settings' => [
                'name' => 'Valid Tournament',
                'teamNames' => ['Team A', 'Team B'],
                'numTeams' => 2
            ],
            'matches' => []
        ];
        
        $errors = $this->api->validateTournament($validTournament);
        $this->assertEmpty($errors);
        
        $invalidTournament = [
            'settings' => [
                'teamNames' => ['Team A'],
                'numTeams' => 1
            ]
        ];
        
        $errors = $this->api->validateTournament($invalidTournament);
        $this->assertNotEmpty($errors);
        $this->assertContains('Tournament ID is required', $errors);
        $this->assertContains('At least 2 teams are required', $errors);
    }
    
    public function testGetTournamentStats(): void
    {
        $tournament = [
            'settings' => [
                'name' => 'Test Tournament',
                'numTeams' => 3
            ],
            'matches' => [
                [
                    'sets' => [
                        ['scoreA' => 25, 'scoreB' => 20],
                        ['scoreA' => 25, 'scoreB' => 18]
                    ]
                ],
                [
                    'sets' => [
                        ['scoreA' => null, 'scoreB' => null]
                    ]
                ]
            ],
            'lastModified' => '2024-01-01T12:00:00Z'
        ];
        
        $stats = $this->api->getTournamentStats($tournament);
        
        $this->assertEquals(2, $stats['total_matches']);
        $this->assertEquals(1, $stats['completed_matches']);
        $this->assertEquals(50.0, $stats['completion_percentage']);
        $this->assertEquals('Test Tournament', $stats['tournament_name']);
        $this->assertEquals(3, $stats['team_count']);
    }
}

class ScheduleGeneratorTest extends TestCase
{
    public function testGenerateRoundRobin(): void
    {
        $teams = ['Team A', 'Team B', 'Team C', 'Team D'];
        $schedule = ScheduleGenerator::generateRoundRobin($teams);
        
        // With 4 teams, should have 6 matches (each team plays each other once)
        $this->assertCount(6, $schedule);
        
        // Check that each team appears in correct number of matches
        $teamMatches = [];
        foreach ($schedule as $match) {
            $teamMatches[$match['teamA']] = ($teamMatches[$match['teamA']] ?? 0) + 1;
            $teamMatches[$match['teamB']] = ($teamMatches[$match['teamB']] ?? 0) + 1;
        }
        
        foreach ($teams as $team) {
            $this->assertEquals(3, $teamMatches[$team], "Team {$team} should play 3 matches");
        }
    }
    
    public function testGenerateRoundRobinOddTeams(): void
    {
        $teams = ['Team A', 'Team B', 'Team C'];
        $schedule = ScheduleGenerator::generateRoundRobin($teams);
        
        // With 3 teams, should have 3 matches
        $this->assertCount(3, $schedule);
        
        // No team should be 'BYE'
        foreach ($schedule as $match) {
            $this->assertNotEquals('BYE', $match['teamA']);
            $this->assertNotEquals('BYE', $match['teamB']);
        }
    }
    
    public function testGeneratePlayoffBracket(): void
    {
        $teams = ['Team A', 'Team B', 'Team C', 'Team D'];
        
        // Test direct final
        $bracket = ScheduleGenerator::generatePlayoffBracket($teams, 'direct_final');
        $this->assertCount(2, $bracket); // Final + 3rd place match
        
        $finalMatch = array_filter($bracket, fn($m) => $m['playoffRound'] === 'Finale');
        $this->assertCount(1, $finalMatch);
        
        $thirdPlaceMatch = array_filter($bracket, fn($m) => $m['playoffRound'] === 'Spiel um Platz 3');
        $this->assertCount(1, $thirdPlaceMatch);
    }
    
    public function testCalculateStandings(): void
    {
        $teams = ['Team A', 'Team B'];
        $matches = [
            [
                'teamA' => 'Team A',
                'teamB' => 'Team B',
                'sets' => [
                    ['scoreA' => 25, 'scoreB' => 20],
                    ['scoreA' => 25, 'scoreB' => 18]
                ]
            ]
        ];
        
        $standings = ScheduleGenerator::calculateStandings($matches, $teams);
        
        $this->assertCount(2, $standings);
        
        // Team A should be first (won the match)
        $this->assertEquals('Team A', $standings[0]['teamName']);
        $this->assertEquals(2, $standings[0]['points']);
        $this->assertEquals(1, $standings[0]['wins']);
        $this->assertEquals(2, $standings[0]['setsWon']);
        
        // Team B should be second
        $this->assertEquals('Team B', $standings[1]['teamName']);
        $this->assertEquals(0, $standings[1]['points']);
        $this->assertEquals(1, $standings[1]['losses']);
        $this->assertEquals(0, $standings[1]['setsWon']);
    }
}
