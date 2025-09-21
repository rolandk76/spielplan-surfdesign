<?php

namespace Tests\Feature;

use App\Models\Tournament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TournamentTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_view_tournament_index()
    {
        $response = $this->get('/');
        
        $response->assertStatus(200);
        $response->assertSee('Willkommen zurück!');
        $response->assertSee('Gesamt Turniere');
    }

    public function test_can_create_tournament()
    {
        $tournamentData = [
            'name' => 'Test Turnier',
            'numTeams' => 4,
            'winningSets' => 2,
            'numFields' => 1,
            'startTime' => '09:00',
            'gameDuration' => 15,
            'breakDuration' => 5,
            'scoringMode' => 'per_set',
            'tiebreakerScheme' => 'points>setDiff>ballDiff',
            'teamNames' => "Team 1\nTeam 2\nTeam 3\nTeam 4",
            'fieldNames' => 'Feld 1',
            'allowDraws' => true,
        ];

        $response = $this->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class)
                        ->post('/tournaments', $tournamentData);
        
        $response->assertStatus(302); // Redirect after creation
        
        $this->assertDatabaseHas('tournaments', [
            'name' => 'Test Turnier'
        ]);
        
        $tournament = Tournament::where('name', 'Test Turnier')->first();
        $this->assertNotNull($tournament);
        $this->assertEquals(4, count($tournament->settings['teamNames']));
        $this->assertGreaterThan(0, count($tournament->matches));
    }

    public function test_can_view_tournament()
    {
        $tournament = Tournament::create([
            'name' => 'Test Turnier',
            'settings' => [
                'teamNames' => ['Team 1', 'Team 2', 'Team 3', 'Team 4'],
                'scoringMode' => 'per_set',
                'tiebreakers' => ['points', 'setDiff', 'ballDiff', 'teamName']
            ],
            'matches' => [
                [
                    'id' => 1,
                    'teamA' => 'Team 1',
                    'teamB' => 'Team 2',
                    'sets' => [
                        ['scoreA' => 21, 'scoreB' => 19],
                        ['scoreA' => 19, 'scoreB' => 21]
                    ]
                ]
            ]
        ]);

        $response = $this->get("/tournaments/{$tournament->id}");
        
        $response->assertStatus(200);
        $response->assertSee('Test Turnier');
        $response->assertSee('Team 1');
        $response->assertSee('Team 2');
        $response->assertSee('Tabelle');
    }

    public function test_can_update_match_results()
    {
        $tournament = Tournament::create([
            'name' => 'Test Turnier',
            'settings' => ['teamNames' => ['Team 1', 'Team 2']],
            'matches' => [
                [
                    'id' => 1,
                    'teamA' => 'Team 1',
                    'teamB' => 'Team 2',
                    'sets' => [
                        ['scoreA' => null, 'scoreB' => null],
                        ['scoreA' => null, 'scoreB' => null]
                    ]
                ]
            ]
        ]);

        $response = $this->post("/tournaments/{$tournament->id}/matches", [
            'mid' => 1,
            'setCount' => 2,
            'scoreA_0' => 21,
            'scoreB_0' => 19,
            'scoreA_1' => 19,
            'scoreB_1' => 21
        ]);

        $response->assertStatus(302); // Redirect after update
        
        $tournament->refresh();
        $match = $tournament->matches[0];
        
        $this->assertEquals(21, $match['sets'][0]['scoreA']);
        $this->assertEquals(19, $match['sets'][0]['scoreB']);
        $this->assertEquals(19, $match['sets'][1]['scoreA']);
        $this->assertEquals(21, $match['sets'][1]['scoreB']);
    }

    public function test_can_delete_tournament()
    {
        $tournament = Tournament::create([
            'name' => 'Test Turnier',
            'settings' => ['teamNames' => ['Team 1', 'Team 2']],
            'matches' => []
        ]);

        $response = $this->delete("/tournaments/{$tournament->id}");
        
        $response->assertStatus(302); // Redirect after deletion
        
        $this->assertDatabaseMissing('tournaments', [
            'id' => $tournament->id
        ]);
    }

    public function test_tournament_validation()
    {
        $response = $this->post('/tournaments', [
            'name' => '', // Required field missing
            'numTeams' => 1, // Below minimum
            'winningSets' => 0, // Below minimum
        ]);

        $response->assertStatus(302); // Redirect back with errors
        $response->assertSessionHasErrors(['name', 'numTeams', 'winningSets']);
    }
}
