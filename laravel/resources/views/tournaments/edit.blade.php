@extends('layouts.app')

@section('title', 'Turnier bearbeiten: ' . $tournament->name)
@section('page-title', 'Turnier bearbeiten')

@section('content')
<div class="animate-fade-in">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200">
        <form method="POST" action="{{ route('tournaments.update', $tournament) }}" class="p-8 space-y-8">
            @csrf
            @method('PUT')
            
            <!-- Tournament Name -->
            <div>
                <label for="name" class="block text-sm font-medium text-slate-700 mb-2">Turniername</label>
                <input type="text" id="name" name="name" required 
                       value="{{ old('name', $tournament->name) }}"
                       class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors @error('name') border-red-300 @enderror" />
                @error('name')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Settings JSON -->
            <div>
                <label for="settings" class="block text-sm font-medium text-slate-700 mb-2">Einstellungen (JSON)</label>
                <p class="text-sm text-slate-500 mb-3">Erweiterte Konfiguration als JSON-Format</p>
                <textarea id="settings" name="settings" rows="12" 
                          class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm @error('settings') border-red-300 @enderror">{{ old('settings', json_encode($tournament->settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) }}</textarea>
                @error('settings')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Referee Settings (convenience) -->
            <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Schiedsrichter-Einstellungen</h3>
                <div class="space-y-4">
                    <div class="flex items-center">
                        @php $incTeams = data_get($tournament->settings, 'includeTeamsAsReferees', true); @endphp
                        <input type="checkbox" id="includeTeamsAsRefereesHelper" {{ old('includeTeamsAsRefereesHelper', $incTeams) ? 'checked' : '' }}
                               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
                        <label for="includeTeamsAsRefereesHelper" class="ml-3 text-sm text-slate-700">Teams als Schiedsrichter einbeziehen</label>
                    </div>
                    <div>
                        <label for="refereesHelper" class="block text-sm font-medium text-slate-700 mb-2">Externe Schiedsrichter (optional)</label>
                        @php $refs = (array) (data_get($tournament->settings, 'referees', [])); @endphp
                        <textarea id="refereesHelper" rows="4"
                                  class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="SR Max Mustermann&#10;SR Anna Beispiel">{{ old('refereesHelper', implode("\n", $refs)) }}</textarea>
                        <p class="text-xs text-slate-500 mt-2">Hinweis: Diese Eingaben werden beim Speichern in das JSON-Feld oben übernommen.</p>
                    </div>
                </div>
            </div>

            <!-- Matches JSON -->
            <div>
                <label for="matches" class="block text-sm font-medium text-slate-700 mb-2">Spiele (JSON)</label>
                <p class="text-sm text-slate-500 mb-3">Spielplan und Ergebnisse als JSON-Format</p>
                <textarea id="matches" name="matches" rows="20" 
                          class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm @error('matches') border-red-300 @enderror">{{ old('matches', json_encode($tournament->matches, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) }}</textarea>
                @error('matches')
                    <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Referee Coverage Soft Warning (Edit) -->
            <div id="ref-coverage-edit" class="mt-4 hidden"></div>

            <!-- Submit Button -->
            <div class="flex items-center justify-between pt-6 border-t border-slate-200">
                <a href="{{ route('tournaments.show', $tournament) }}" class="text-slate-600 hover:text-slate-900 transition-colors">Abbrechen</a>
                <button type="submit" 
                        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md">
                    <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Änderungen speichern
                </button>
            </div>
        </form>
    </div>

    <!-- JSON Validation Helper -->
    <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
            <svg class="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
                <h3 class="text-sm font-medium text-blue-800">JSON-Bearbeitung</h3>
                <p class="text-sm text-blue-700 mt-1">
                    Achten Sie auf korrekte JSON-Syntax. Verwenden Sie doppelte Anführungszeichen für Strings und beachten Sie Kommas zwischen Objektelementen.
                    Bei Syntaxfehlern wird das Formular nicht gespeichert.
                </p>
            </div>
        </div>
    </div>
</div>

<script>
// JSON Syntax Highlighting (basic)
document.addEventListener('DOMContentLoaded', function() {
    const textareas = document.querySelectorAll('textarea[name="settings"], textarea[name="matches"]');
    const form = document.querySelector('form');
    const refereesHelper = document.getElementById('refereesHelper');
    const includeTeamsHelper = document.getElementById('includeTeamsAsRefereesHelper');
    
    textareas.forEach(textarea => {
        textarea.addEventListener('blur', function() {
            try {
                const parsed = JSON.parse(this.value);
                this.classList.remove('border-red-300');
                this.classList.add('border-green-300');
            } catch (e) {
                this.classList.remove('border-green-300');
                this.classList.add('border-red-300');
            }
        });
    });

    // On submit, merge convenience referee fields into settings JSON
    form?.addEventListener('submit', function(e) {
        const settingsEl = document.getElementById('settings');
        if (!settingsEl) return;
        let settings;
        try { settings = JSON.parse(settingsEl.value || '{}'); }
        catch { settings = {}; }
        // Include teams flag
        if (includeTeamsHelper) {
            settings.includeTeamsAsReferees = !!includeTeamsHelper.checked;
        }
        // Referees list
        if (refereesHelper) {
            const lines = (refereesHelper.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            settings.referees = lines;
        }
        settingsEl.value = JSON.stringify(settings, null, 2);
    });

    // Soft coverage warning based on current JSON + helper fields
    function calcCoverageEdit(){
        const box = document.getElementById('ref-coverage-edit');
        const settingsEl = document.getElementById('settings');
        if (!box || !settingsEl) return;

        let s = {};
        try { s = JSON.parse(settingsEl.value || '{}'); } catch {}
        // Override from helpers before submit
        if (includeTeamsHelper) {
            s.includeTeamsAsReferees = !!includeTeamsHelper.checked;
        }
        if (refereesHelper) {
            const lines = (refereesHelper.value || '').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
            s.referees = lines;
        }
        const numTeams = parseInt(s.numTeams || (s.teamNames ? s.teamNames.length : 0)) || 0;
        const numFields = parseInt(s.numFields || 1) || 1;
        const matchesPerSlot = Math.max(1, Math.min(numFields, Math.floor(numTeams/2)));
        const externalCount = Array.isArray(s.referees) ? s.referees.length : 0;
        let availableTeamsForRef = 0;
        if (!!s.includeTeamsAsReferees) {
            const playingTeams = Math.min(numTeams, matchesPerSlot * 2);
            availableTeamsForRef = Math.max(0, numTeams - playingTeams);
        }
        const totalAvailable = externalCount + availableTeamsForRef;

        box.classList.remove('hidden');
        if (totalAvailable < matchesPerSlot) {
            box.className = 'mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800';
            box.innerHTML = `Nicht genug Schiedsrichter für parallele Spiele vorhanden. Benötigt: <strong>${matchesPerSlot}</strong>, verfügbar: <strong>${totalAvailable}</strong>.`;
        } else {
            box.className = 'mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800';
            box.innerHTML = `Schiedsrichter-Abdeckung voraussichtlich ausreichend. Parallelspiele: <strong>${matchesPerSlot}</strong>, verfügbar: <strong>${totalAvailable}</strong>.`;
        }
    }

    // Listen changes
    refereesHelper?.addEventListener('input', calcCoverageEdit);
    includeTeamsHelper?.addEventListener('change', calcCoverageEdit);
    // Also when JSON is edited
    document.getElementById('settings')?.addEventListener('input', calcCoverageEdit);

    calcCoverageEdit();
});
</script>
@endsection
