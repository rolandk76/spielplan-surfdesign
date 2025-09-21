@extends('layouts.app')

@section('title', 'Neues Turnier anlegen')
@section('page-title', 'Neues Turnier anlegen')

@section('content')
<div class="animate-fade-in">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200">
        <form method="POST" action="{{ route('tournaments.store') }}" class="p-8 space-y-8">
            @csrf
            
            <!-- Tournament Name -->
            <div>
                <label for="name" class="block text-sm font-medium text-slate-700 mb-2">Turniername</label>
                <input type="text" id="name" name="name" required 
                       value="{{ old('name') }}"
                       class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors @error('name') border-red-300 @enderror" 
                       placeholder="Mein Volleyball Turnier" />
                @error('name')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Basic Settings Grid -->
            <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Grundeinstellungen</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label for="numTeams" class="block text-sm font-medium text-slate-700 mb-2">Anzahl Teams</label>
                        <input type="number" id="numTeams" name="numTeams" min="2" max="64" value="{{ old('numTeams', 4) }}" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('numTeams') border-red-300 @enderror" />
                        @error('numTeams')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label for="winningSets" class="block text-sm font-medium text-slate-700 mb-2">Gewinnsätze</label>
                        <input type="number" id="winningSets" name="winningSets" min="1" max="5" value="{{ old('winningSets', 2) }}" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('winningSets') border-red-300 @enderror" />
                        @error('winningSets')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label for="numFields" class="block text-sm font-medium text-slate-700 mb-2">Anzahl Felder</label>
                        <input type="number" id="numFields" name="numFields" min="1" max="10" value="{{ old('numFields', 1) }}" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('numFields') border-red-300 @enderror" />
                        @error('numFields')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>

            <!-- Timing Settings -->
            <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Zeitplanung</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label for="startTime" class="block text-sm font-medium text-slate-700 mb-2">Startzeit</label>
                        <input type="time" id="startTime" name="startTime" value="{{ old('startTime', '09:00') }}" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('startTime') border-red-300 @enderror" />
                        @error('startTime')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label for="gameDuration" class="block text-sm font-medium text-slate-700 mb-2">Spieldauer (min)</label>
                        <input type="number" id="gameDuration" name="gameDuration" min="1" max="120" value="{{ old('gameDuration', 15) }}" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('gameDuration') border-red-300 @enderror" />
                        @error('gameDuration')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label for="breakDuration" class="block text-sm font-medium text-slate-700 mb-2">Pause (min)</label>
                        <input type="number" id="breakDuration" name="breakDuration" min="0" max="60" value="{{ old('breakDuration', 5) }}" 
                               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('breakDuration') border-red-300 @enderror" />
                        @error('breakDuration')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
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
                                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('scoringMode') border-red-300 @enderror">
                            <option value="per_set" {{ old('scoringMode', 'per_set') === 'per_set' ? 'selected' : '' }}>Pro Satz (1 Punkt je Satz)</option>
                            <option value="match_321" {{ old('scoringMode') === 'match_321' ? 'selected' : '' }}>Match 3‑2‑1</option>
                            <option value="match_210" {{ old('scoringMode') === 'match_210' ? 'selected' : '' }}>Match 2‑1‑0</option>
                            <option value="match_10" {{ old('scoringMode') === 'match_10' ? 'selected' : '' }}>Match 1‑0</option>
                        </select>
                        @error('scoringMode')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label for="tiebreakerScheme" class="block text-sm font-medium text-slate-700 mb-2">Tiebreaker</label>
                        <select id="tiebreakerScheme" name="tiebreakerScheme" 
                                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('tiebreakerScheme') border-red-300 @enderror">
                            <option value="points>setDiff>ballDiff" {{ old('tiebreakerScheme', 'points>setDiff>ballDiff') === 'points>setDiff>ballDiff' ? 'selected' : '' }}>Points > SetDiff > BallDiff</option>
                            <option value="points>ballDiff>setDiff" {{ old('tiebreakerScheme') === 'points>ballDiff>setDiff' ? 'selected' : '' }}>Points > BallDiff > SetDiff</option>
                        </select>
                        @error('tiebreakerScheme')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </div>

            <!-- Tournament Options -->
            <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Turnieroptionen</h3>
                <div class="space-y-4">
                    <div class="flex items-center">
                        <input type="checkbox" id="doubleRoundRobin" name="doubleRoundRobin" {{ old('doubleRoundRobin') ? 'checked' : '' }}
                               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                        <label for="doubleRoundRobin" class="ml-3 text-sm text-slate-700">Rückrunde (doppelt)</label>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="allowDraws" name="allowDraws" {{ old('allowDraws', true) ? 'checked' : '' }}
                               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                        <label for="allowDraws" class="ml-3 text-sm text-slate-700">Unentschieden erlauben</label>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="includeTeamsAsReferees" name="includeTeamsAsReferees" {{ old('includeTeamsAsReferees', true) ? 'checked' : '' }}
                               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                        <label for="includeTeamsAsReferees" class="ml-3 text-sm text-slate-700">Teams als Schiedsrichter einbeziehen</label>
                    </div>
                </div>
            </div>

            <!-- Teams -->
            <div>
                <label for="teamNames" class="block text-sm font-medium text-slate-700 mb-2">Teamnamen</label>
                <p class="text-sm text-slate-500 mb-3">Geben Sie jeden Teamnamen in eine neue Zeile ein</p>
                <textarea id="teamNames" name="teamNames" rows="6" 
                          class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('teamNames') border-red-300 @enderror" 
                          placeholder="Team 1&#10;Team 2&#10;Team 3&#10;Team 4">{{ old('teamNames') }}</textarea>
                @error('teamNames')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Fields -->
            <div>
                <label for="fieldNames" class="block text-sm font-medium text-slate-700 mb-2">Feldnamen</label>
                <p class="text-sm text-slate-500 mb-3">Geben Sie jeden Feldnamen in eine neue Zeile ein</p>
                <textarea id="fieldNames" name="fieldNames" rows="3" 
                          class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('fieldNames') border-red-300 @enderror" 
                          placeholder="Feld 1">{{ old('fieldNames') }}</textarea>
                @error('fieldNames')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- External Referees (optional) -->
            <div>
                <label for="referees" class="block text-sm font-medium text-slate-700 mb-2">Externe Schiedsrichter (optional)</label>
                <p class="text-sm text-slate-500 mb-3">Eine Person pro Zeile. Diese werden bevorzugt eingesetzt; Teams werden ergänzend genutzt (sofern aktiviert).</p>
                <textarea id="referees" name="referees" rows="4"
                          class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('referees') border-red-300 @enderror"
                          placeholder="SR Max Mustermann&#10;SR Anna Beispiel">{{ old('referees') }}</textarea>
                @error('referees')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Referee Coverage Soft Warning -->
            <div id="ref-coverage" class="mt-4 hidden"></div>

            <!-- Submit Button -->
            <div class="flex items-center justify-between pt-6 border-t border-slate-200">
                <a href="{{ route('home') }}" class="text-slate-600 hover:text-slate-900 transition-colors">Abbrechen</a>
                <button type="submit" 
                        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md">
                    <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Spielplan generieren
                </button>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
  const numTeamsEl = document.getElementById('numTeams');
  const numFieldsEl = document.getElementById('numFields');
  const includeTeamsEl = document.getElementById('includeTeamsAsReferees');
  const refereesEl = document.getElementById('referees');
  const refBox = document.getElementById('ref-coverage');

  function parseIntSafe(el, def=0){
    const v = parseInt(el?.value ?? def, 10);
    return isNaN(v) ? def : v;
  }

  function calcCoverage(){
    const numTeams = parseIntSafe(numTeamsEl, 0);
    const numFields = parseIntSafe(numFieldsEl, 1);
    const includeTeams = !!(includeTeamsEl?.checked);
    const refs = (refereesEl?.value || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);

    const matchesPerSlot = Math.max(1, Math.min(numFields, Math.floor(numTeams/2)));
    const externalCount = refs.length;
    let availableTeamsForRef = 0;
    if (includeTeams) {
      const playingTeams = Math.min(numTeams, matchesPerSlot * 2);
      availableTeamsForRef = Math.max(0, numTeams - playingTeams);
    }
    const totalAvailable = externalCount + availableTeamsForRef;

    if (!refBox) return;
    refBox.classList.remove('hidden');
    if (totalAvailable < matchesPerSlot) {
      refBox.className = 'mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800';
      refBox.innerHTML = `Nicht genug Schiedsrichter für parallele Spiele vorhanden. Benötigt: <strong>${matchesPerSlot}</strong>, verfügbar: <strong>${totalAvailable}</strong>.`;
    } else {
      refBox.className = 'mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800';
      refBox.innerHTML = `Schiedsrichter-Abdeckung voraussichtlich ausreichend. Parallelspiele: <strong>${matchesPerSlot}</strong>, verfügbar: <strong>${totalAvailable}</strong>.`;
    }
  }

  [numTeamsEl, numFieldsEl, includeTeamsEl, refereesEl].forEach(el => {
    el?.addEventListener('input', calcCoverage);
    el?.addEventListener('change', calcCoverage);
  });

  calcCoverage();
});
</script>

@endsection
