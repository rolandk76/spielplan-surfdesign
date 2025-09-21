<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Services\ScheduleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TournamentController extends Controller
{
    protected $scheduleService;

    public function __construct(ScheduleService $scheduleService)
    {
        $this->scheduleService = $scheduleService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tournaments = Tournament::orderBy('last_modified', 'desc')->limit(20)->get();
        
        $stats = [
            'total' => Tournament::count(),
            'recent' => Tournament::where('last_modified', '>=', now()->subWeek())->count(),
            'today' => Tournament::whereDate('last_modified', today())->count(),
        ];

        return view('tournaments.index', compact('tournaments', 'stats'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('tournaments.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'numTeams' => 'required|integer|min:2|max:64',
            'winningSets' => 'required|integer|min:1|max:5',
            'numFields' => 'required|integer|min:1|max:10',
            'startTime' => 'required|string',
            'gameDuration' => 'required|integer|min:1|max:120',
            'breakDuration' => 'required|integer|min:0|max:60',
            'scoringMode' => 'required|string|in:per_set,match_321,match_210,match_10',
            'tiebreakerScheme' => 'required|string',
            'teamNames' => 'nullable|string',
            'fieldNames' => 'nullable|string',
            'referees' => 'nullable|string',
            // Accept HTML checkbox values like 'on' as well
            'includeTeamsAsReferees' => 'nullable|in:on,1,0,true,false',
        ]);

        // Process team names
        $teamLines = trim($request->teamNames ?? '');
        $teamNames = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $teamLines)), fn($v) => $v !== ''));
        if (empty($teamNames)) {
            $teamNames = array_map(fn($i) => "Team $i", range(1, $validated['numTeams']));
        }

        // Process field names
        $fieldLines = trim($request->fieldNames ?? 'Feld 1');
        $fieldNames = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $fieldLines)), fn($v) => $v !== ''));
        if (empty($fieldNames)) {
            $fieldNames = ['Feld 1'];
        }

        // Process referees (optional external list)
        $referees = [];
        if (!empty($request->referees)) {
            $refLines = trim($request->referees);
            $referees = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $refLines)), fn($v) => $v !== ''));
        }

        $settings = [
            'name' => $validated['name'],
            'numTeams' => $validated['numTeams'],
            'teamNames' => $teamNames,
            'numFields' => $validated['numFields'],
            'fieldNames' => $fieldNames,
            'gameDuration' => $validated['gameDuration'],
            'breakDuration' => $validated['breakDuration'],
            'startTime' => $validated['startTime'],
            'winningSets' => $validated['winningSets'],
            'allowDraws' => $request->has('allowDraws'),
            'scoringMode' => $validated['scoringMode'],
            'tiebreakers' => $validated['tiebreakerScheme'] === 'points>ballDiff>setDiff'
                ? ['points','ballDiff','setDiff','teamName']
                : ['points','setDiff','ballDiff','teamName'],
            'doubleRoundRobin' => $request->has('doubleRoundRobin'),
            'playoffMode' => 'none',
            // Referee assignment options
            'referees' => $referees, // optional external referees
            // Treat checkbox as boolean by presence (checked => true, missing => false)
            'includeTeamsAsReferees' => $request->has('includeTeamsAsReferees') ? true : false,
        ];

        // Hard validation: ensure referee pool can cover concurrent matches per slot
        // Parallel matches per slot = min(numFields, floor(numTeams/2)) in round-robin
        $matchesPerSlot = min((int)$validated['numFields'], intdiv((int)$validated['numTeams'], 2));
        if ($matchesPerSlot < 1) { $matchesPerSlot = 1; }
        $externalCount = count($referees);
        $availableTeamsForRef = 0;
        if ($settings['includeTeamsAsReferees']) {
            // In a slot, 2 teams per match are playing
            $playingTeams = min($validated['numTeams'], $matchesPerSlot * 2);
            $availableTeamsForRef = max(0, (int)$validated['numTeams'] - $playingTeams);
        }
        $totalAvailableRefs = $externalCount + $availableTeamsForRef;
        if ($totalAvailableRefs < $matchesPerSlot) {
            return back()->withErrors([
                'referees' => "Nicht genug Schiedsrichter für parallele Spiele vorhanden. Benötigt: {$matchesPerSlot}, verfügbar: {$totalAvailableRefs}. Fügen Sie externe Schiedsrichter hinzu oder verringern Sie parallele Spiele (Felder)."
            ])->withInput();
        }

        $matches = $this->scheduleService->generateSchedule($settings);

        $tournament = Tournament::create([
            'name' => $validated['name'],
            'settings' => $settings,
            'matches' => $matches,
        ]);

        return redirect()->route('tournaments.show', $tournament)
            ->with('success', 'Turnier erfolgreich erstellt!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Tournament $tournament)
    {
        $standings = $this->scheduleService->calculateStandings(
            $tournament->matches,
            $tournament->settings['teamNames'] ?? [],
            $tournament->settings,
            'group'
        );

        return view('tournaments.show', compact('tournament', 'standings'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Tournament $tournament)
    {
        return view('tournaments.edit', compact('tournament'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'settings' => 'required|json',
            'matches' => 'required|json',
        ]);

        $settings = json_decode($validated['settings'], true);
        $matches = json_decode($validated['matches'], true);

        // Normalize includeTeamsAsReferees to strict boolean if present
        if (array_key_exists('includeTeamsAsReferees', $settings)) {
            $raw = $settings['includeTeamsAsReferees'];
            $truthy = ['on','1',1,true,'true','TRUE','True'];
            $settings['includeTeamsAsReferees'] = in_array($raw, $truthy, true);
        }

        $tournament->update([
            'name' => $validated['name'],
            'settings' => $settings,
            'matches' => $matches,
        ]);

        return redirect()->route('tournaments.show', $tournament)
            ->with('success', 'Turnier erfolgreich aktualisiert!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tournament $tournament)
    {
        $tournament->delete();
        
        return redirect()->route('tournaments.index')
            ->with('success', 'Turnier erfolgreich gelöscht!');
    }

    /**
     * Update match results
     */
    public function updateMatch(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'mid' => 'required|integer',
            'setCount' => 'required|integer|min:1|max:5',
        ]);

        $matchId = (int)$validated['mid'];
        $setCount = (int)$validated['setCount'];
        
        $matches = $tournament->matches;
        $matchIndex = null;
        
        foreach ($matches as $index => $match) {
            if ((int)($match['id'] ?? 0) === $matchId) {
                $matchIndex = $index;
                break;
            }
        }
        
        if ($matchIndex === null) {
            return back()->withErrors(['match' => 'Match nicht gefunden']);
        }

        // Update sets
        $newSets = [];
        for ($i = 0; $i < $setCount; $i++) {
            $scoreA = $request->input("scoreA_{$i}");
            $scoreB = $request->input("scoreB_{$i}");
            $newSets[] = [
                'scoreA' => $scoreA === '' ? null : (int)$scoreA,
                'scoreB' => $scoreB === '' ? null : (int)$scoreB,
            ];
        }

        $matches[$matchIndex]['sets'] = $newSets;
        
        // Recalculate derived fields
        $swA = 0; $swB = 0; $pfA = 0; $pfB = 0;
        foreach ($newSets as $set) {
            if ($set['scoreA'] !== null && $set['scoreB'] !== null) {
                $pfA += (int)$set['scoreA'];
                $pfB += (int)$set['scoreB'];
                if ((int)$set['scoreA'] > (int)$set['scoreB']) {
                    $swA++;
                } elseif ((int)$set['scoreB'] > (int)$set['scoreA']) {
                    $swB++;
                }
            }
        }
        
        $matches[$matchIndex]['setsWonA'] = $swA;
        $matches[$matchIndex]['setsWonB'] = $swB;
        $matches[$matchIndex]['pointsForA'] = $pfA;
        $matches[$matchIndex]['pointsForB'] = $pfB;

        $tournament->update(['matches' => $matches]);

        return redirect()->route('tournaments.show', $tournament)
            ->with('success', 'Ergebnisse erfolgreich gespeichert!');
    }

    /**
     * Reassign referees on existing matches based on current settings
     */
    public function reassignReferees(Request $request, Tournament $tournament)
    {
        $matches = $this->scheduleService->assignReferees(
            $tournament->matches,
            $tournament->settings,
            $tournament->settings['teamNames'] ?? [],
            $tournament->settings['numFields'] ?? 1
        );

        $tournament->update(['matches' => $matches]);

        return redirect()->route('tournaments.show', $tournament)
            ->with('success', 'Schiedsrichter erfolgreich neu verteilt.');
    }
}
