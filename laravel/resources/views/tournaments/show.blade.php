@extends('layouts.app')

@section('title', 'Turnier: ' . $tournament->name)
@section('page-title', $tournament->name)

@section('content')
<div class="animate-fade-in space-y-8">
    <!-- Tournament Header -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200">
        <div class="p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900">{{ $tournament->name }}</h1>
                    <p class="text-slate-600 mt-1">Turnier-ID: {{ $tournament->id }}</p>
                    <p class="text-sm text-slate-500">Letzte Änderung: {{ $tournament->last_modified->format('d.m.Y H:i') }}</p>
                </div>
                <div class="mt-4 lg:mt-0 flex space-x-3">
                    <a href="{{ route('tournaments.edit', $tournament) }}" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-500">
                        Bearbeiten
                    </a>
                    <button type="button" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md">
                        Display
                    </button>
                    <form method="POST" action="{{ route('tournaments.referees.reassign', $tournament) }}">
                        @csrf
                        <button type="submit" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm hover:shadow-md">
                            SR neu verteilen
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Referee Coverage Notice -->
    @php
        // Group matches by time for slot-based coverage analysis
        $byTime = [];
        foreach ($tournament->matches as $m) {
            $t = $m['time'] ?? '—';
            $byTime[$t] = $byTime[$t] ?? [];
            $byTime[$t][] = $m;
        }
        $coverageIssues = [];
        foreach ($byTime as $time => $items) {
            $assigned = 0; $total = count($items);
            foreach ($items as $mm) { if (!empty($mm['referee'])) $assigned++; }
            if ($assigned < $total) {
                $coverageIssues[] = [
                    'time' => $time,
                    'assigned' => $assigned,
                    'total' => $total,
                    'missing' => $total - $assigned,
                ];
            }
        }
    @endphp

    @if(count($coverageIssues) > 0)
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div class="flex items-start">
                <svg class="w-5 h-5 text-amber-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                    <p class="text-amber-800 font-medium">Unvollständige Schiedsrichter-Zuteilung</p>
                    <ul class="mt-1 text-amber-700 text-sm list-disc list-inside">
                        @foreach($coverageIssues as $ci)
                            <li>{{ $ci['time'] }}: {{ $ci['assigned'] }} / {{ $ci['total'] }} zugeteilt ({{ $ci['missing'] }} offen)</li>
                        @endforeach
                    </ul>
                    <form method="POST" action="{{ route('tournaments.referees.reassign', $tournament) }}" class="mt-3">
                        @csrf
                        <button type="submit" class="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">SR neu verteilen</button>
                    </form>
                </div>
            </div>
        </div>
    @else
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center">
            <svg class="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-emerald-800 text-sm">Schiedsrichter-Abdeckung vollständig.</span>
        </div>
    @endif

    <!-- Quick Stats -->
    @php
        $totalMatches = count($tournament->matches);
        $playedMatches = 0;
        $upcomingMatches = 0;
        
        foreach ($tournament->matches as $match) {
            $hasResults = false;
            if (isset($match['sets']) && is_array($match['sets'])) {
                foreach ($match['sets'] as $set) {
                    if (isset($set['scoreA'], $set['scoreB']) && $set['scoreA'] !== null && $set['scoreB'] !== null) {
                        $hasResults = true;
                        break;
                    }
                }
            }
            if ($hasResults) {
                $playedMatches++;
            } else {
                $upcomingMatches++;
            }
        }
    @endphp

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-blue-100 text-sm font-medium">Gesamt Spiele</p>
                    <p class="text-2xl font-bold">{{ $totalMatches }}</p>
                </div>
                <div class="p-3 bg-white/20 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                </div>
            </div>
        </div>

        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-green-100 text-sm font-medium">Gespielt</p>
                    <p class="text-2xl font-bold">{{ $playedMatches }}</p>
                </div>
                <div class="p-3 bg-white/20 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
        </div>

        <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-orange-100 text-sm font-medium">Ausstehend</p>
                    <p class="text-2xl font-bold">{{ $upcomingMatches }}</p>
                </div>
                <div class="p-3 bg-white/20 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
        </div>

        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-purple-100 text-sm font-medium">Teams</p>
                    <p class="text-2xl font-bold">{{ count($tournament->settings['teamNames'] ?? []) }}</p>
                </div>
                <div class="p-3 bg-white/20 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <!-- Matches and Standings Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Matches -->
        <div class="xl:col-span-2">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-slate-900">Spiele</h2>
                <div class="flex space-x-2">
                    <button class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">Alle</button>
                    <button class="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-full">Live</button>
                    <button class="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-full">Fertig</button>
                </div>
            </div>
            
            @if(count($tournament->matches) > 0)
                <div class="space-y-3">
                    @foreach($tournament->matches as $match)
                        @php
                            $setCount = isset($match['sets']) && is_array($match['sets']) ? count($match['sets']) : ($tournament->settings['winningSets'] ?? 2);
                            $hasResults = false;
                            if (isset($match['sets']) && is_array($match['sets'])) {
                                foreach ($match['sets'] as $set) {
                                    if (isset($set['scoreA'], $set['scoreB']) && $set['scoreA'] !== null && $set['scoreB'] !== null) {
                                        $hasResults = true;
                                        break;
                                    }
                                }
                            }
                            $statusColor = $hasResults ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
                            $statusText = $hasResults ? 'Fertig' : 'Ausstehend';
                        @endphp
                        
                        <div class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <div class="p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center space-x-3 flex-wrap">
                                        <span class="text-sm font-medium text-slate-500">#{{ $match['id'] ?? '' }}</span>
                                        <span class="text-sm text-slate-600">{{ $match['time'] ?? '' }}</span>
                                        <span class="text-sm text-slate-600">{{ $match['field'] ?? '' }}</span>
                                        @if(!empty($match['referee']))
                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                                SR: {{ $match['referee'] }}
                                            </span>
                                        @endif
                                    </div>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {{ $statusColor }}">{{ $statusText }}</span>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <div class="font-medium text-slate-900">{{ $match['teamA'] ?? '' }}</div>
                                        <div class="text-sm text-slate-500">vs</div>
                                        <div class="font-medium text-slate-900">{{ $match['teamB'] ?? '' }}</div>
                                    </div>
                                    
                                    <div class="flex-1 text-center">
                                        <div class="space-y-1">
                                            @if(isset($match['sets']) && is_array($match['sets']))
                                                @foreach($match['sets'] as $index => $set)
                                                    <div class="text-sm">
                                                        <span class="font-mono">{{ $set['scoreA'] ?? '' }} : {{ $set['scoreB'] ?? '' }}</span>
                                                    </div>
                                                @endforeach
                                            @endif
                                        </div>
                                    </div>
                                    
                                    <div class="flex-1 text-right">
                                        <button onclick="toggleQuickEdit('qe-{{ $match['id'] ?? '' }}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Bearbeiten</button>
                                    </div>
                                </div>
                                
                                <!-- Quick Edit Form -->
                                <div id="qe-{{ $match['id'] ?? '' }}" class="hidden mt-4 pt-4 border-t border-slate-200">
                                    <form method="POST" action="{{ route('tournaments.matches.update', $tournament) }}" class="space-y-3">
                                        @csrf
                                        <input type="hidden" name="mid" value="{{ $match['id'] ?? '' }}">
                                        <input type="hidden" name="setCount" value="{{ $setCount }}">
                                        <div class="grid grid-cols-{{ $setCount }} gap-3">
                                            @for($i = 0; $i < $setCount; $i++)
                                                @php $set = $match['sets'][$i] ?? ['scoreA' => null, 'scoreB' => null]; @endphp
                                                <div class="text-center">
                                                    <div class="text-xs text-slate-500 mb-1">Set {{ $i + 1 }}</div>
                                                    <div class="flex items-center justify-center space-x-2">
                                                        <input class="w-16 text-center border rounded px-2 py-1" type="number" name="scoreA_{{ $i }}" value="{{ $set['scoreA'] ?? '' }}" placeholder="A">
                                                        <span class="text-slate-400">:</span>
                                                        <input class="w-16 text-center border rounded px-2 py-1" type="number" name="scoreB_{{ $i }}" value="{{ $set['scoreB'] ?? '' }}" placeholder="B">
                                                    </div>
                                                </div>
                                            @endfor
                                        </div>
                                        <div class="flex justify-end space-x-2">
                                            <button type="button" onclick="toggleQuickEdit('qe-{{ $match['id'] ?? '' }}')" class="px-3 py-1 text-sm text-slate-600 hover:text-slate-800">Abbrechen</button>
                                            <button type="submit" class="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Speichern</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div class="p-8 text-center text-slate-500">Keine Spiele vorhanden.</div>
                </div>
            @endif
        </div>

        <!-- Standings -->
        <div>
            <h2 class="text-xl font-semibold text-slate-900 mb-4">Tabelle</h2>
            @if(count($standings) > 0)
                <div class="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div class="p-6">
                        <div class="space-y-3">
                            @foreach($standings as $index => $standing)
                                @php
                                    $isFirst = $index === 0;
                                    $medalColor = $isFirst ? 'text-yellow-600' : ($index === 1 ? 'text-slate-400' : ($index === 2 ? 'text-amber-600' : 'text-slate-600'));
                                @endphp
                                <div class="flex items-center justify-between py-2 {{ $isFirst ? 'bg-yellow-50 -mx-2 px-2 rounded' : '' }}">
                                    <div class="flex items-center space-x-3">
                                        <span class="w-6 text-center font-bold {{ $medalColor }}">{{ $standing['rank'] }}</span>
                                        <span class="font-medium text-slate-900">{{ $standing['teamName'] }}</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-slate-900">{{ $standing['points'] }}</div>
                                        <div class="text-xs text-slate-500">{{ $standing['setsWon'] }}-{{ $standing['setsLost'] }}</div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>
            @else
                <div class="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div class="p-8 text-center text-slate-500">Keine Tabelle verfügbar.</div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
