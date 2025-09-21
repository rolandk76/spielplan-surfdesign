
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { TournamentSettings, Match, Standing, ScoreVersion, SavedTournament, TournamentVersion, AuditLogEntry } from './types';

// --- UI Helpers --- //
function getTeamHue(name: string): number {
    // Stable pseudo-random hue from team name
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return hash % 360;
}

function TeamDot({ name, className = '' }: { name: string; className?: string }) {
    const hue = getTeamHue(name);
    const style = { backgroundColor: `hsl(${hue} 70% 50%)` } as React.CSSProperties;
    return <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle ${className}`} style={style} aria-hidden="true" />;
}

function parseTimeToDate(time: string): Date | null {
    // expects HH:MM 24h
    if (!time || !/^[0-9]{2}:[0-9]{2}$/.test(time)) return null;
    const [hh, mm] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
}

function computeMatchStatus(match: Match, settings: TournamentSettings): 'next' | 'live' | 'done' | 'pending' {
    const start = parseTimeToDate(match.time);
    if (!start) return 'pending';
    const durationMin = settings.gameDuration + settings.breakDuration;
    const end = new Date(start.getTime() + durationMin * 60000);
    const now = new Date();
    const anySet = match.sets.some(s => s.scoreA !== null || s.scoreB !== null);
    // Game is finished when all sets are played
    const totalSetsPlayed = match.sets.filter(s => s.scoreA !== null && s.scoreB !== null).length;
    const finished = totalSetsPlayed === settings.winningSets;
    if (finished) return 'done';
    if (now >= start && now <= end) return 'live';
    if (now < start) return 'next';
    return anySet ? 'live' : 'pending';
}

// --- ICONS --- //
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
  </svg>
);

const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
);

const PrintIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
    </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const DatabaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
    </svg>
);


// --- UI COMPONENTS --- //
interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    touchMode?: boolean;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, unit, onChange, touchMode = false }) => (
    <div className="space-y-3">
        <label className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2">
                {label}
            </span>
            <span className="font-bold text-primary-700 dark:text-primary-300 bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 rounded-xl px-3 py-1.5 text-xs shadow-sm border border-primary-200 dark:border-primary-600">
                {value}{unit}
            </span>
        </label>
        <div className="relative">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className={`w-full ${touchMode ? 'h-8' : 'h-2'} bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg appearance-none cursor-pointer slider-thumb`}
                style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e2e8f0 ${((value - min) / (max - min)) * 100}%, #e2e8f0 100%)`
                }}
            />
            <div 
                className={`absolute top-1/2 ${touchMode ? 'w-8 h-8' : 'w-5 h-5'} bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg border-2 border-white dark:border-slate-800 transform -translate-y-1/2 pointer-events-none transition-all duration-200`}
                style={{ left: `calc(${((value - min) / (max - min)) * 100}% - ${touchMode ? '16px' : '10px'})` }}
            />
        </div>
    </div>
);

// --- APP LOGIC & SUB-COMPONENTS --- //
const generatePlayoffMatches = (qualifiedTeams: string[], settings: TournamentSettings, startMatchId: number, lastMatchTime: string): Match[] => {
    const playoffMatches: Match[] = [];
    let matchId = startMatchId;
    let currentTime = lastMatchTime;
    
    // Verwende Platzhalter für dynamische Paarungen
    const getTeamPlaceholder = (position: number) => `{{PLATZ_${position}}}`;
    
    // Debug-Logs (entfernt für Production)
    
    const addMinutesToTime = (timeStr: string, minutes: number): string => {
        const [hours, mins] = timeStr.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    };

    const createMatch = (teamA: string, teamB: string, playoffRound: string): Match => {
        // Verwende Playoff-spezifische Einstellungen falls vorhanden
        const maxSets = settings.playoffMaxSets || settings.winningSets * 2 - 1;
        
        const match: Match = {
            id: matchId++,
            round: 999, // Spezielle Runden-Nummer für Playoffs
            time: currentTime,
            field: settings.fieldNames[0] || 'Feld 1',
            teamA,
            teamB,
            sets: Array.from({ length: maxSets }, () => ({ scoreA: null, scoreB: null })),
            setsWonA: 0,
            setsWonB: 0,
            pointsForA: 0,
            pointsForB: 0,
            scoreHistory: [],
            phase: 'playoff',
            playoffRound
        };
        currentTime = addMinutesToTime(currentTime, settings.gameDuration + settings.breakDuration);
        return match;
    };

    switch (settings.playoffMode) {
        case 'direct_final':
            // Verwende Platzhalter für dynamische Paarungen
            playoffMatches.push(createMatch(getTeamPlaceholder(1), getTeamPlaceholder(2), 'Finale'));
            // Spiel um Platz 3 nur wenn mindestens 4 Teams qualifiziert sind
            if (settings.playoffTeams && settings.playoffTeams >= 4) {
                playoffMatches.push(createMatch(getTeamPlaceholder(3), getTeamPlaceholder(4), 'Spiel um Platz 3'));
            }
            break;

        case 'semi_final':
            if (settings.playoffTeams && settings.playoffTeams >= 4) {
                // Halbfinale mit Platzhaltern
                playoffMatches.push(createMatch(getTeamPlaceholder(1), getTeamPlaceholder(4), 'Halbfinale 1'));
                playoffMatches.push(createMatch(getTeamPlaceholder(2), getTeamPlaceholder(3), 'Halbfinale 2'));
                
                // Finale und Spiel um Platz 3 (Platzhalter für Halbfinal-Sieger/Verlierer)
                playoffMatches.push(createMatch('{{SIEGER_HF1}}', '{{SIEGER_HF2}}', 'Finale'));
                playoffMatches.push(createMatch('{{VERLIERER_HF1}}', '{{VERLIERER_HF2}}', 'Spiel um Platz 3'));
            }
            break;

        case 'top4_roundrobin':
            if (settings.playoffTeams && settings.playoffTeams >= 4) {
                // Jeder gegen jeden mit Platzhaltern
                for (let i = 1; i <= 4; i++) {
                    for (let j = i + 1; j <= 4; j++) {
                        playoffMatches.push(createMatch(getTeamPlaceholder(i), getTeamPlaceholder(j), 'Endrunde'));
                    }
                }
            }
            break;

        case 'top6_roundrobin':
            if (settings.playoffTeams && settings.playoffTeams >= 6) {
                // Jeder gegen jeden mit Platzhaltern
                for (let i = 1; i <= 6; i++) {
                    for (let j = i + 1; j <= 6; j++) {
                        playoffMatches.push(createMatch(getTeamPlaceholder(i), getTeamPlaceholder(j), 'Endrunde'));
                    }
                }
            }
            break;
    }

    return playoffMatches;
};

// Funktion zum Ersetzen der Platzhalter mit aktuellen Teams
const resolvePlayoffTeamNames = (match: Match, currentStandings: Standing[], playoffMatches: Match[]): { teamA: string; teamB: string } => {
    let teamA = match.teamA;
    let teamB = match.teamB;
    
    // Ersetze Platzhalter für Tabellenplätze
    const platzRegex = /\{\{PLATZ_(\d+)\}\}/;
    
    const matchA = teamA.match(platzRegex);
    if (matchA) {
        const position = parseInt(matchA[1]) - 1; // 0-basiert
        teamA = currentStandings[position]?.teamName || `Platz ${position + 1}`;
    }
    
    const matchB = teamB.match(platzRegex);
    if (matchB) {
        const position = parseInt(matchB[1]) - 1; // 0-basiert
        teamB = currentStandings[position]?.teamName || `Platz ${position + 1}`;
    }
    
    // Ersetze Platzhalter für Halbfinal-Sieger/Verlierer
    if (teamA.includes('{{SIEGER_HF') || teamA.includes('{{VERLIERER_HF')) {
        teamA = resolveHalbfinalResult(teamA, playoffMatches);
    }
    if (teamB.includes('{{SIEGER_HF') || teamB.includes('{{VERLIERER_HF')) {
        teamB = resolveHalbfinalResult(teamB, playoffMatches);
    }
    
    return { teamA, teamB };
};

// Hilfsfunktion für Halbfinal-Ergebnisse
const resolveHalbfinalResult = (placeholder: string, playoffMatches: Match[]): string => {
    if (placeholder === '{{SIEGER_HF1}}') {
        const hf1 = playoffMatches.find(m => m.playoffRound === 'Halbfinale 1');
        if (hf1 && hf1.setsWonA > hf1.setsWonB) return hf1.teamA;
        if (hf1 && hf1.setsWonB > hf1.setsWonA) return hf1.teamB;
        return 'Sieger HF1'; // Fallback wenn noch nicht entschieden
    }
    if (placeholder === '{{SIEGER_HF2}}') {
        const hf2 = playoffMatches.find(m => m.playoffRound === 'Halbfinale 2');
        if (hf2 && hf2.setsWonA > hf2.setsWonB) return hf2.teamA;
        if (hf2 && hf2.setsWonB > hf2.setsWonA) return hf2.teamB;
        return 'Sieger HF2'; // Fallback wenn noch nicht entschieden
    }
    if (placeholder === '{{VERLIERER_HF1}}') {
        const hf1 = playoffMatches.find(m => m.playoffRound === 'Halbfinale 1');
        if (hf1 && hf1.setsWonA < hf1.setsWonB) return hf1.teamA;
        if (hf1 && hf1.setsWonB < hf1.setsWonA) return hf1.teamB;
        return 'Verlierer HF1'; // Fallback wenn noch nicht entschieden
    }
    if (placeholder === '{{VERLIERER_HF2}}') {
        const hf2 = playoffMatches.find(m => m.playoffRound === 'Halbfinale 2');
        if (hf2 && hf2.setsWonA < hf2.setsWonB) return hf2.teamA;
        if (hf2 && hf2.setsWonB < hf2.setsWonA) return hf2.teamB;
        return 'Verlierer HF2'; // Fallback wenn noch nicht entschieden
    }
    return placeholder; // Fallback
};

const generateSchedule = (settings: TournamentSettings): Match[] => {
    let teams = [...settings.teamNames];
    const isOdd = teams.length % 2 !== 0;
    if (isOdd) {
        teams.push(" spielfrei ");
    }
    const numTeams = teams.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;
    const generatedMatches: { round: number; teamA: string; teamB: string }[] = [];

    const teamIndices = Array.from({ length: numTeams }, (_, i) => i);

    // Hinrunde
    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < matchesPerRound; i++) {
            const teamAIndex = teamIndices[i];
            const teamBIndex = teamIndices[numTeams - 1 - i];
            generatedMatches.push({
                round: round + 1,
                teamA: teams[teamAIndex],
                teamB: teams[teamBIndex],
            });
        }
        const lastTeamIndex = teamIndices.pop()!;
        teamIndices.splice(1, 0, lastTeamIndex);
    }

    // Rückrunde (falls aktiviert)
    if (settings.doubleRoundRobin) {
        // Reset team indices for return round
        const teamIndicesReturn = Array.from({ length: numTeams }, (_, i) => i);
        
        for (let round = 0; round < numRounds; round++) {
            for (let i = 0; i < matchesPerRound; i++) {
                const teamAIndex = teamIndicesReturn[i];
                const teamBIndex = teamIndicesReturn[numTeams - 1 - i];
                // Swap teams for return round to create different home/away matchups
                generatedMatches.push({
                    round: numRounds + round + 1,
                    teamA: teams[teamBIndex], // Swapped
                    teamB: teams[teamAIndex], // Swapped
                });
            }
            const lastTeamIndex = teamIndicesReturn.pop()!;
            teamIndicesReturn.splice(1, 0, lastTeamIndex);
        }
    }
    
    const finalMatches = generatedMatches.filter(m => m.teamA !== " spielfrei " && m.teamB !== " spielfrei ");

    const [startHour, startMinute] = settings.startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    let matchTime = new Date(startDate);
    
    const maxSets = settings.winningSets; // Fixed number of sets

    return finalMatches.map((match, index) => {
        const field = settings.fieldNames[index % settings.numFields];
        
        if (index > 0 && index % settings.numFields === 0) {
            const minutesToAdd = settings.gameDuration + settings.breakDuration;
            matchTime = new Date(matchTime.getTime() + minutesToAdd * 60000);
        }
        
        return {
            ...match,
            id: index + 1,
            time: matchTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            field: field,
            sets: Array(maxSets).fill({ scoreA: null, scoreB: null }),
            setsWonA: 0,
            setsWonB: 0,
            pointsForA: 0,
            pointsForB: 0,
            scoreHistory: [],
            phase: 'group', // Hauptrunde
        };
    });
};

const calculateStandings = (matches: Match[], teamNames: string[], settings: TournamentSettings, phase: 'group' | 'playoff' = 'group'): Standing[] => {
    const stats: { [key: string]: Omit<Standing, 'rank' | 'teamName'> } = {};
    
    // Verwende Playoff-spezifische Einstellungen falls in Playoff-Phase
    const scoringMode = phase === 'playoff' && settings.playoffScoringMode 
        ? settings.playoffScoringMode 
        : (settings.scoringMode || 'per_set');
    const allowDraws = phase === 'playoff' && settings.playoffAllowDraws !== undefined
        ? settings.playoffAllowDraws
        : (settings.allowDraws ?? true);
    
    const tiebreakers = settings.tiebreakers && settings.tiebreakers.length
        ? settings.tiebreakers
        : ['points', 'setDiff', 'ballDiff', 'teamName'];

    teamNames.forEach(teamName => {
        stats[teamName] = {
            played: 0, wins: 0, losses: 0, draws: 0,
            setsWon: 0, setsLost: 0, pointsFor: 0, pointsAgainst: 0, points: 0
        };
    });

    // Nur Spiele der gewünschten Phase berücksichtigen
    const relevantMatches = matches.filter(match => (match.phase || 'group') === phase);
    
    relevantMatches.forEach(match => {
        const { teamA, teamB } = match as any;
        if (!teamA || !teamB) return;

        // Compute from entered sets to be robust (even if match fields aren't finalized)
        let swA = 0, swB = 0, pfA = 0, pfB = 0;
        const playedSets = (match.sets || []).filter(s => s && s.scoreA !== null && s.scoreB !== null);
        for (const s of playedSets) {
            const a = Number(s.scoreA ?? 0);
            const b = Number(s.scoreB ?? 0);
            pfA += a; pfB += b;
            if (a > b) swA++; else if (b > a) swB++;
        }

        if (playedSets.length === 0) return; // nothing to count

        stats[teamA].played++;
        stats[teamB].played++;
        stats[teamA].setsWon += swA; stats[teamA].setsLost += swB;
        stats[teamB].setsWon += swB; stats[teamB].setsLost += swA;
        stats[teamA].pointsFor += pfA; stats[teamA].pointsAgainst += pfB;
        stats[teamB].pointsFor += pfB; stats[teamB].pointsAgainst += pfA;

        // Game is finished when one team has won enough sets or all sets are played
        const winningSets = phase === 'playoff' && settings.playoffWinningSets 
            ? settings.playoffWinningSets 
            : settings.winningSets;
        const maxSets = phase === 'playoff' && settings.playoffMaxSets 
            ? settings.playoffMaxSets 
            : (settings.winningSets * 2 - 1);
        
        const totalSetsPlayed = match.sets.filter(s => s.scoreA !== null && s.scoreB !== null).length;
        const gameWon = swA >= winningSets || swB >= winningSets;
        const finished = gameWon || totalSetsPlayed >= maxSets;

        // Points allocation based on scoring mode
        switch (scoringMode) {
            case 'per_set': {
                stats[teamA].points += swA;
                stats[teamB].points += swB;
                
                // Auch Siege/Niederlagen zählen wenn Spiel beendet
                if (finished) {
                    if (swA > swB) {
                        stats[teamA].wins++;
                        stats[teamB].losses++;
                    } else if (swB > swA) {
                        stats[teamB].wins++;
                        stats[teamA].losses++;
                    } else if (allowDraws) {
                        stats[teamA].draws++;
                        stats[teamB].draws++;
                    }
                }
                break;
            }
            case 'match_321': {
                if (finished) {
                    if (swA > swB) {
                        stats[teamA].wins++; stats[teamB].losses++;
                        // Clear win if opponent has 0 sets, otherwise normal win
                        if (swB === 0) stats[teamA].points += 3; // clear win
                        else { stats[teamA].points += 2; stats[teamB].points += 1; }
                    } else if (swB > swA) {
                        stats[teamB].wins++; stats[teamA].losses++;
                        // Clear win if opponent has 0 sets, otherwise normal win
                        if (swA === 0) stats[teamB].points += 3; // clear win
                        else { stats[teamB].points += 2; stats[teamA].points += 1; }
                    } else if (swA === swB) {
                        // Draw - both teams get 1 point
                        stats[teamA].draws++; stats[teamB].draws++;
                        stats[teamA].points += 1; stats[teamB].points += 1;
                    }
                } else if (allowDraws && swA === swB) {
                    stats[teamA].points += 1;
                    stats[teamB].points += 1;
                }
                break;
            }
            case 'match_210': {
                if (finished) {
                    if (swA > swB) { stats[teamA].wins++; stats[teamB].losses++; stats[teamA].points += 2; }
                    else if (swB > swA) { stats[teamB].wins++; stats[teamA].losses++; stats[teamB].points += 2; }
                } else if (allowDraws && swA === swB) {
                    stats[teamA].points += 1; stats[teamB].points += 1;
                }
                break;
            }
            case 'match_10': {
                if (finished) {
                    if (swA > swB) { stats[teamA].wins++; stats[teamB].losses++; stats[teamA].points += 1; }
                    else if (swB > swA) { stats[teamB].wins++; stats[teamA].losses++; stats[teamB].points += 1; }
                }
                break;
            }
            default: {
                // Fallback to per_set
                stats[teamA].points += swA;
                stats[teamB].points += swB;
            }
        }
    });

    // Sorting based on dynamic tiebreakers
    const sortBy = (a: any, b: any): number => {
        for (const key of tiebreakers) {
            if (key === 'points') {
                if (b.points !== a.points) return b.points - a.points;
            } else if (key === 'setDiff') {
                const da = a.setsWon - a.setsLost; const db = b.setsWon - b.setsLost;
                if (db !== da) return db - da;
            } else if (key === 'ballDiff') {
                const da = a.pointsFor - a.pointsAgainst; const db = b.pointsFor - b.pointsAgainst;
                if (db !== da) return db - da;
            } else if (key === 'teamName') {
                const cmp = a.teamName.localeCompare(b.teamName);
                if (cmp !== 0) return cmp;
            }
        }
        return 0;
    };

    const sortedStandings = Object.entries(stats)
        .map(([teamName, data]) => ({ teamName, ...data }))
        .sort(sortBy);

    return sortedStandings.map((standing, index) => ({ ...standing, rank: index + 1 }));
};

interface TournamentSetupFormProps {
    onGenerate: (settings: TournamentSettings) => void;
    onBack: () => void;
}

const TournamentSetupForm: React.FC<TournamentSetupFormProps> = ({ onGenerate, onBack }) => {
    const touchMode = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const [numTeams, setNumTeams] = useState(8);
    const [teamNames, setTeamNames] = useState<string[]>(Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`));
    const [tournamentName, setTournamentName] = useState('Indiaca Turnier');
    const [numFields, setNumFields] = useState(1);
    const [fieldNames, setFieldNames] = useState<string[]>(['Feld 1']);
    const [gameDuration, setGameDuration] = useState(15);
    const [breakDuration, setBreakDuration] = useState(5);
    // Neue Optionen
    const [scoringMode, setScoringMode] = useState<'per_set' | 'match_321' | 'match_210' | 'match_10'>('per_set');
    const [allowDraws, setAllowDraws] = useState<boolean>(true);
    const [tiebreakerScheme, setTiebreakerScheme] = useState<'points>setDiff>ballDiff' | 'points>ballDiff>setDiff'>('points>setDiff>ballDiff');
    const [startTime, setStartTime] = useState('09:00');
    const [winningSets, setWinningSets] = useState(2);
    const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);
    const [playoffMode, setPlayoffMode] = useState<'none' | 'direct_final' | 'semi_final' | 'top4_roundrobin' | 'top6_roundrobin'>('none');
    const [playoffTeams, setPlayoffTeams] = useState(4);
    // Endrunden-spezifische Satz-Einstellungen
    const [playoffWinningSets, setPlayoffWinningSets] = useState(2);
    const [playoffMaxSets, setPlayoffMaxSets] = useState(3);

    useEffect(() => {
        setTeamNames(prev => {
            const newTeamNames = Array.from({ length: numTeams }, (_, i) => prev[i] || `Team ${i + 1}`);
            return newTeamNames;
        });
    }, [numTeams]);

    useEffect(() => {
        setFieldNames(prev => {
            const newFieldNames = Array.from({ length: numFields }, (_, i) => prev[i] || `Feld ${i + 1}`);
            return newFieldNames;
        });
    }, [numFields]);

    const handleTeamNameChange = (index: number, name: string) => {
        const newTeamNames = [...teamNames];
        newTeamNames[index] = name;
        setTeamNames(newTeamNames);
    };

    const handleFieldNameChange = (index: number, name: string) => {
        const newFieldNames = [...fieldNames];
        newFieldNames[index] = name;
        setFieldNames(newFieldNames);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tiebreakers = tiebreakerScheme === 'points>ballDiff>setDiff'
            ? ['points','ballDiff','setDiff','teamName'] as const
            : ['points','setDiff','ballDiff','teamName'] as const;
        onGenerate({
            name: tournamentName,
            numTeams,
            teamNames: teamNames.filter(name => name.trim() !== ''),
            numFields,
            fieldNames: fieldNames.filter(name => name.trim() !== ''),
            gameDuration,
            breakDuration,
            startTime,
            winningSets,
            scoringMode,
            allowDraws,
            tiebreakers: [...tiebreakers],
            doubleRoundRobin,
            playoffMode,
            playoffTeams,
            playoffWinningSets,
            playoffMaxSets,
            playoffAllowDraws: false, // Endrunden haben immer klare Gewinner
            playoffScoringMode: 'per_set' // Vereinfacht: immer pro Satz
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Turnierdetails</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="tournamentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Turniername</label>
                        <input
                            type="text"
                            id="tournamentName"
                            value={tournamentName}
                            onChange={e => setTournamentName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Startzeit</label>
                        <input
                            type="time"
                            id="startTime"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Slider label="Anzahl der Spielfelder" value={numFields} min={1} max={10} unit="" onChange={e => setNumFields(parseInt(e.target.value, 10))} touchMode={touchMode} />
                    </div>
                    {numFields > 0 && (
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 -mt-2">
                            {fieldNames.map((name, i) => (
                                <div key={i}>
                                    <label htmlFor={`field-${i}`} className="block text-xs font-medium text-slate-500 dark:text-slate-400">Name Feld {i + 1}</label>
                                    <input
                                        type="text"
                                        id={`field-${i}`}
                                        value={name}
                                        onChange={e => handleFieldNameChange(i, e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <Slider label="Anzahl Sätze pro Spiel" value={winningSets} min={1} max={5} unit="" onChange={e => setWinningSets(parseInt(e.target.value, 10))} touchMode={touchMode} />
                    <Slider label="Spieldauer (Richtwert)" value={gameDuration} min={5} max={60} unit="min" onChange={e => setGameDuration(parseInt(e.target.value, 10))} touchMode={touchMode} />
                    <Slider label="Pause zwischen Spielen" value={breakDuration} min={0} max={20} unit="min" onChange={e => setBreakDuration(parseInt(e.target.value, 10))} touchMode={touchMode} />
                </div>
                {/* Wertungsmodus */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Wertungsmodus</label>
                    <select
                        value={scoringMode}
                        onChange={(e) => setScoringMode(e.target.value as any)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="per_set">Pro Satz: 1 Punkt pro gewonnenem Satz</option>
                        <option value="match_321">Match 3-2-1: 2:0=3 | 2:1=2/1</option>
                        <option value="match_210">Match 2-1-0: Sieg=2 | Unentsch.=1</option>
                        <option value="match_10">Match 1-0: Sieg=1</option>
                    </select>
                    <div className="mt-3 flex items-center gap-3">
                        <input id="allowDraws" type="checkbox" checked={allowDraws} onChange={(e)=>setAllowDraws(e.target.checked)} className="h-4 w-4" />
                        <label htmlFor="allowDraws" className="text-sm text-slate-700 dark:text-slate-300">Unentschieden erlauben (bei fixen 2 Sätzen o.ä.)</label>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <input id="doubleRoundRobin" type="checkbox" checked={doubleRoundRobin} onChange={(e)=>setDoubleRoundRobin(e.target.checked)} className="h-4 w-4" />
                        <label htmlFor="doubleRoundRobin" className="text-sm text-slate-700 dark:text-slate-300">
                            Hin- und Rückrunde (jedes Team spielt zweimal gegen jedes andere)
                            {doubleRoundRobin && (
                                <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                    → {numTeams * (numTeams - 1)} Spiele insgesamt
                                </span>
                            )}
                        </label>
                    </div>
                </div>

                {/* Endrunden-System */}
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">🏆 Endrunden-System (Optional)</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Endrunden-Modus</label>
                            <select
                                value={playoffMode}
                                onChange={(e) => setPlayoffMode(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="none">Keine Endrunde</option>
                                <option value="direct_final">Direktes Finale (1. vs 2.)</option>
                                <option value="semi_final">Halbfinale + Finale (Top 4)</option>
                                <option value="top4_roundrobin">Top 4 - Jeder gegen Jeden</option>
                                <option value="top6_roundrobin">Top 6 - Jeder gegen Jeden</option>
                            </select>
                        </div>

                        {playoffMode !== 'none' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Qualifizierte Teams</label>
                                <select
                                    value={playoffTeams}
                                    onChange={(e) => setPlayoffTeams(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                >
                                    {playoffMode === 'direct_final' && <option value={2}>Top 2</option>}
                                    {(playoffMode === 'semi_final' || playoffMode === 'top4_roundrobin') && <option value={4}>Top 4</option>}
                                    {playoffMode === 'top6_roundrobin' && <option value={6}>Top 6</option>}
                                    {playoffMode === 'semi_final' && <option value={8}>Top 8</option>}
                                </select>
                                
                                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                    {playoffMode === 'direct_final' && '• Finale: 1. vs 2. • Spiel um Platz 3: 3. vs 4.'}
                                    {playoffMode === 'semi_final' && playoffTeams === 4 && '• Halbfinale: 1. vs 4., 2. vs 3. • Finale + Spiel um Platz 3'}
                                    {playoffMode === 'semi_final' && playoffTeams === 8 && '• Viertelfinale + Halbfinale + Finale'}
                                    {playoffMode === 'top4_roundrobin' && '• Separate Tabelle nur für die Top 4 Teams'}
                                    {playoffMode === 'top6_roundrobin' && '• Separate Tabelle nur für die Top 6 Teams'}
                                </div>
                            </div>
                        )}

                        {/* Endrunden-Satz-Einstellungen */}
                        {playoffMode !== 'none' && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                                <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">⚽ Satz-Einstellungen für Endrunde</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gewinnsätze</label>
                                        <select
                                            value={playoffWinningSets}
                                            onChange={(e) => {
                                                const winningSets = parseInt(e.target.value);
                                                setPlayoffWinningSets(winningSets);
                                                // Automatisch maximale Sätze berechnen
                                                setPlayoffMaxSets(winningSets * 2 - 1);
                                            }}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value={1}>1 (Best of 1)</option>
                                            <option value={2}>2 (Best of 3)</option>
                                            <option value={3}>3 (Best of 5)</option>
                                            <option value={4}>4 (Best of 7)</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max. Sätze</label>
                                        <select
                                            value={playoffMaxSets}
                                            onChange={(e) => setPlayoffMaxSets(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value={1}>1 Satz</option>
                                            <option value={2}>2 Sätze</option>
                                            <option value={3}>3 Sätze</option>
                                            <option value={4}>4 Sätze</option>
                                            <option value={5}>5 Sätze</option>
                                            <option value={6}>6 Sätze</option>
                                            <option value={7}>7 Sätze</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/40 rounded-md">
                                    <div className="text-sm text-green-800 dark:text-green-200">
                                        <strong>Beispiel:</strong> {playoffWinningSets} Gewinnsätze, max. {playoffMaxSets} Sätze
                                        <br />
                                        <span className="text-xs text-green-600 dark:text-green-400">
                                            💡 Endrunden haben immer einen klaren Gewinner (keine Unentschieden)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {playoffMode !== 'none' && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Die Endrunde wird automatisch nach Abschluss der Hauptrunde generiert, basierend auf der Tabellen-Platzierung.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Teams</h2>
                <div className="mb-6">
                    <Slider label="Anzahl der Teams" value={numTeams} min={2} max={32} unit="" onChange={e => setNumTeams(parseInt(e.target.value, 10))} touchMode={touchMode} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {teamNames.map((name, i) => (
                        <div key={i}>
                            <label htmlFor={`team-${i}`} className="block text-sm font-medium text-slate-500 dark:text-slate-400">Team {i + 1}</label>
                            <input
                                type="text"
                                id={`team-${i}`}
                                value={name}
                                onChange={e => handleTeamNameChange(i, e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-center gap-4">
                 <button type="button" onClick={onBack} className="inline-flex items-center px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900">
                    Abbrechen
                </button>
                 <button type="submit" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105">
                    Spielplan erstellen
                </button>
            </div>
        </form>
    );
};

interface ScoreEntryModalProps {
    match: Match;
    winningSets: number;
    onClose: () => void;
    onSave: (matchId: number, sets: { scoreA: number | null; scoreB: number | null }[], isCorrection?: boolean, reason?: string) => void;
    tournament: SavedTournament; // Für Playoff-spezifische Einstellungen
}

const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({ match, winningSets, onClose, onSave, tournament }) => {
    const [sets, setSets] = useState(() => JSON.parse(JSON.stringify(match.sets)));
    const [error, setError] = useState<string | null>(null);
    const [correctionMode, setCorrectionMode] = useState(false);
    const [correctionReason, setCorrectionReason] = useState('');

    const matchStatus = useMemo(() => {
        let setsWonA = 0;
        let setsWonB = 0;
        let finishedAtSet = -1;

        // Bestimme die korrekten Gewinnsätze für dieses Spiel
        const actualWinningSets = match.phase === 'playoff' && tournament.settings.playoffWinningSets
            ? tournament.settings.playoffWinningSets
            : winningSets;

        for (let i = 0; i < sets.length; i++) {
            const set = sets[i];
            const scoreA = set.scoreA;
            const scoreB = set.scoreB;

            if (scoreA !== null && scoreB !== null) {
                if (scoreA > scoreB) setsWonA++;
                else if (scoreB > scoreA) setsWonB++;
                
                // Prüfe, ob das Spiel nach diesem Satz beendet ist
                if (match.phase === 'playoff' && (setsWonA >= actualWinningSets || setsWonB >= actualWinningSets)) {
                    finishedAtSet = i;
                    break;
                }
            }
        }
        
        // Für Hauptrunden-Spiele: alle Sätze müssen gespielt werden
        // Für Playoff-Spiele: Spiel ist beendet, wenn ein Team genug Sätze gewonnen hat
        const isFinished = match.phase === 'playoff' 
            ? (setsWonA >= actualWinningSets || setsWonB >= actualWinningSets)
            : sets.filter(s => s.scoreA !== null && s.scoreB !== null).length === actualWinningSets;
            
        return { isFinished, finishedAtSet, actualWinningSets };
    }, [sets, winningSets, match.phase, tournament.settings.playoffWinningSets]);


    const handleScoreChange = (setIndex: number, team: 'A' | 'B', value: string) => {
        const newSets = [...sets];
        const score = value === '' ? null : parseInt(value, 10);
        if (team === 'A') {
            newSets[setIndex] = { ...newSets[setIndex], scoreA: isNaN(score!) ? null : score };
        } else {
            newSets[setIndex] = { ...newSets[setIndex], scoreB: isNaN(score!) ? null : score };
        }
        setSets(newSets);
        setError(null);
    };

    const handleSave = () => {
        setError(null);
        let tempSetsWonA = 0;
        let tempSetsWonB = 0;
        let matchFinishedAtIndex = -1;

        for (let i = 0; i < sets.length; i++) {
            const set = sets[i];
            const scoreA = set.scoreA;
            const scoreB = set.scoreB;
            const bothScoresEntered = scoreA !== null && scoreB !== null;

            // No early finish validation needed - all sets must be played

            // Unentschieden in einzelnen Sätzen sind jetzt erlaubt
            // if (bothScoresEntered && scoreA === scoreB) {
            //     setError(`Ein Unentschieden ist in Satz ${i + 1} nicht möglich.`);
            //     return;
            // }

            if (bothScoresEntered) {
                if (scoreA > scoreB) tempSetsWonA++;
                else tempSetsWonB++;
            }

            // No early finish - all sets must be played
        }

        if (correctionMode && !correctionReason.trim()) {
            setError('Bitte geben Sie einen Grund für die Korrektur an.');
            return;
        }

        onSave(match.id, sets, correctionMode, correctionReason.trim() || undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:w-full sm:max-w-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 backdrop-blur ${correctionMode ? 'bg-amber-50/90 dark:bg-amber-900/30' : 'bg-white/80 dark:bg-slate-800/80'}`}>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {correctionMode ? '🔧 Korrektur-Modus' : 'Ergebnis eingeben'}
                        </h3>
                        {correctionMode && (
                            <p className="text-sm text-amber-700 dark:text-amber-300">Alle Felder sind bearbeitbar</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="text-center font-semibold text-slate-700 dark:text-slate-300">
                        {match.teamA} vs. {match.teamB}
                    </div>
                    {/* Show lock status when fields are disabled */}
                    {(() => {
                        const matchHasResults = match.sets.some(s => s.scoreA !== null && s.scoreB !== null);
                        return matchHasResults && !correctionMode && (
                            <div className="flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border">
                                <span className="text-slate-500 dark:text-slate-400">🔒</span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Spiel ist gespeichert - Aktiviere den Korrektur-Modus für Änderungen
                                </p>
                            </div>
                        );
                    })()}
                    {sets.map((set, index) => {
                         // Disable fields if match is completed AND not in correction mode
                         // OR if this set is after the game has finished (for playoffs)
                         const matchHasResults = match.sets.some(s => s.scoreA !== null && s.scoreB !== null);
                         const isAfterGameEnd = matchStatus.finishedAtSet >= 0 && index > matchStatus.finishedAtSet;
                         const isSetDisabled = (matchHasResults && !correctionMode) || (isAfterGameEnd && !correctionMode);
                         return (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <span className={`font-medium text-slate-500 dark:text-slate-400 ${isSetDisabled ? 'opacity-50' : ''}`}>Satz {index + 1}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        min="0"
                                        value={set.scoreA ?? ''}
                                        onChange={(e) => handleScoreChange(index, 'A', e.target.value)}
                                        disabled={isSetDisabled}
                                        className="w-16 sm:w-20 p-2 sm:p-3 text-center text-lg sm:text-base bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed touch-manipulation"
                                        aria-label={`Punkte für ${match.teamA} in Satz ${index + 1}`}
                                    />
                                    <span>:</span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        min="0"
                                        value={set.scoreB ?? ''}
                                        onChange={(e) => handleScoreChange(index, 'B', e.target.value)}
                                        disabled={isSetDisabled}
                                        className="w-16 sm:w-20 p-2 sm:p-3 text-center text-lg sm:text-base bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed touch-manipulation"
                                        aria-label={`Punkte für ${match.teamB} in Satz ${index + 1}`}
                                    />
                                </div>
                            </div>
                         );
                    })}
                    {error && (
                        <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 text-sm rounded-md" role="alert">
                            {error}
                        </div>
                    )}
                </div>
                
                {/* Korrektur-Modus */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-center gap-3 mb-3">
                        <input
                            type="checkbox"
                            id="correctionMode"
                            checked={correctionMode}
                            onChange={(e) => setCorrectionMode(e.target.checked)}
                            className="w-4 h-4 text-amber-600 bg-white border-amber-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-amber-600"
                        />
                        <label htmlFor="correctionMode" className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            🔧 Korrektur-Modus (für nachträgliche Änderungen)
                        </label>
                    </div>
                    {correctionMode && (
                        <div>
                            <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                                Grund für die Korrektur:
                            </label>
                            <textarea
                                value={correctionReason}
                                onChange={(e) => setCorrectionReason(e.target.value)}
                                placeholder="z.B. Eingabefehler korrigiert, Schiedsrichter-Entscheidung geändert..."
                                className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-amber-300 dark:border-amber-600 rounded-md shadow-sm placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white touch-manipulation"
                                rows={3}
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end sticky bottom-0">
                    <button onClick={handleSave} className={`px-6 py-3 text-base font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:cursor-not-allowed ${correctionMode ? 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 disabled:bg-amber-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 disabled:bg-indigo-400'}`} disabled={!!error}>
                        {correctionMode ? '🔧 Korrektur speichern' : 'Speichern'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ScoreHistoryModalProps {
    match: Match;
    onClose: () => void;
    onRestore: (matchId: number, sets: ScoreVersion['sets']) => void;
}

const ScoreHistoryModal: React.FC<ScoreHistoryModalProps> = ({ match, onClose, onRestore }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Verlauf für: {match.teamA} vs. {match.teamB}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {match.scoreHistory.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-slate-400">Kein Verlauf vorhanden.</p>
                    ) : (
                        <ul className="space-y-4">
                            {[...match.scoreHistory].reverse().map((version, index) => {
                                const playedSets = version.sets.filter(s => s.scoreA !== null && s.scoreB !== null);
                                const setScoresString = playedSets.map(s => `${s.scoreA}:${s.scoreB}`).join(', ');
                                return (
                                    <li key={version.timestamp} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                                {new Date(version.timestamp).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'medium' })}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Ergebnis: ({setScoresString})</div>
                                        </div>
                                        <button 
                                            onClick={() => onRestore(match.id, version.sets)}
                                            className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 rounded-md"
                                        >
                                            Wiederherstellen
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900">
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};


interface PlayoffEditorModalProps {
    tournament: SavedTournament;
    onClose: () => void;
    onSave: () => void;
    onUpdateTournament: (updatedTournament: SavedTournament) => void;
}

const PlayoffEditorModal: React.FC<PlayoffEditorModalProps> = ({ tournament, onClose, onSave, onUpdateTournament }) => {
    const [playoffMode, setPlayoffMode] = useState<'none' | 'direct_final' | 'semi_final' | 'top4_roundrobin' | 'top6_roundrobin'>('direct_final');
    const [playoffTeams, setPlayoffTeams] = useState(4);
    const [playoffWinningSets, setPlayoffWinningSets] = useState(tournament.settings.winningSets || 2);
    const [playoffMaxSets, setPlayoffMaxSets] = useState((tournament.settings.winningSets || 2) * 2 - 1); // z.B. Best of 3 = max 3 Sätze
    
    // Berechne aktuelle Tabelle für Qualifikation
    const currentStandings = useMemo(() => {
        return calculateStandings(tournament.matches, tournament.settings.teamNames, tournament.settings, 'group');
    }, [tournament]);

    // Prüfe ob bereits Playoff-Spiele existieren
    const hasPlayoffMatches = tournament.matches.some(match => match.phase === 'playoff');

    const handleAddPlayoffs = () => {
        if (hasPlayoffMatches) {
            if (!confirm('Es existieren bereits Endrunden-Spiele. Sollen diese überschrieben werden?')) {
                return;
            }
        }

        // Qualifizierte Teams basierend auf aktueller Tabelle
        const qualifiedTeams = currentStandings.slice(0, playoffTeams).map(s => s.teamName);
        
        // Erstelle eine komplett neue Tournament-Kopie
        const filteredMatches = tournament.matches.filter(match => match.phase !== 'playoff');
        
        // Finde letztes Spiel für Zeitberechnung
        const lastMatch = filteredMatches[filteredMatches.length - 1];
        const lastTime = lastMatch ? lastMatch.time : tournament.settings.startTime;
        const nextMatchId = Math.max(...filteredMatches.map(m => m.id), 0) + 1;
        
        // Generiere Playoff-Spiele - verwende die aktuellen Modal-Werte, nicht die alten Tournament-Settings
        const tempSettings = {
            ...tournament.settings,
            playoffMode,
            playoffTeams,
            playoffWinningSets,
            playoffMaxSets,
            // Endrunden haben immer klare Gewinner
            playoffAllowDraws: false,
            playoffScoringMode: 'per_set' // Vereinfacht: immer pro Satz
        };
        const playoffMatches = generatePlayoffMatches(qualifiedTeams, tempSettings, nextMatchId, lastTime);
        
        // Erstelle komplett neues Tournament-Objekt
        const updatedTournament: SavedTournament = {
            ...tournament,
            matches: [...filteredMatches, ...playoffMatches],
            settings: {
                ...tournament.settings,
                playoffMode,
                playoffTeams,
                playoffWinningSets,
                playoffMaxSets,
                playoffAllowDraws: false,
                playoffScoringMode: 'per_set'
            },
            lastModified: new Date().toISOString()
        };
        
        // Debug-Logs entfernt für Production
        
        // Aktualisiere das Tournament über Callback
        onUpdateTournament(updatedTournament);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">🏆 Endrunde hinzufügen</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    {hasPlayoffMatches && (
                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                            <div className="flex items-center gap-2">
                                <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Es existieren bereits Endrunden-Spiele. Diese werden überschrieben.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Endrunden-Modus</label>
                            <select
                                value={playoffMode}
                                onChange={(e) => setPlayoffMode(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="direct_final">Direktes Finale (1. vs 2.)</option>
                                <option value="semi_final">Halbfinale + Finale (Top 4)</option>
                                <option value="top4_roundrobin">Top 4 - Jeder gegen Jeden</option>
                                <option value="top6_roundrobin">Top 6 - Jeder gegen Jeden</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Qualifizierte Teams</label>
                            <select
                                value={playoffTeams}
                                onChange={(e) => setPlayoffTeams(parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            >
                                {playoffMode === 'direct_final' && <option value={2}>Top 2</option>}
                                {(playoffMode === 'semi_final' || playoffMode === 'top4_roundrobin') && <option value={4}>Top 4</option>}
                                {playoffMode === 'top6_roundrobin' && <option value={6}>Top 6</option>}
                                {playoffMode === 'semi_final' && <option value={8}>Top 8</option>}
                            </select>
                            
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                {playoffMode === 'direct_final' && '• Finale: 1. vs 2. • Spiel um Platz 3: 3. vs 4.'}
                                {playoffMode === 'semi_final' && playoffTeams === 4 && '• Halbfinale: 1. vs 4., 2. vs 3. • Finale + Spiel um Platz 3'}
                                {playoffMode === 'semi_final' && playoffTeams === 8 && '• Viertelfinale + Halbfinale + Finale'}
                                {playoffMode === 'top4_roundrobin' && '• Separate Tabelle nur für die Top 4 Teams'}
                                {playoffMode === 'top6_roundrobin' && '• Separate Tabelle nur für die Top 6 Teams'}
                            </div>
                        </div>

                        {/* Vereinfachte Endrunden-Einstellungen */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                            <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">⚽ Satz-Einstellungen für Endrunde</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gewinnsätze</label>
                                    <select
                                        value={playoffWinningSets}
                                        onChange={(e) => {
                                            const winningSets = parseInt(e.target.value);
                                            setPlayoffWinningSets(winningSets);
                                            // Automatisch maximale Sätze berechnen
                                            setPlayoffMaxSets(winningSets * 2 - 1);
                                        }}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value={1}>1 (Best of 1)</option>
                                        <option value={2}>2 (Best of 3)</option>
                                        <option value={3}>3 (Best of 5)</option>
                                        <option value={4}>4 (Best of 7)</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max. Sätze</label>
                                    <select
                                        value={playoffMaxSets}
                                        onChange={(e) => setPlayoffMaxSets(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value={1}>1 Satz</option>
                                        <option value={2}>2 Sätze</option>
                                        <option value={3}>3 Sätze</option>
                                        <option value={4}>4 Sätze</option>
                                        <option value={5}>5 Sätze</option>
                                        <option value={6}>6 Sätze</option>
                                        <option value={7}>7 Sätze</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/40 rounded-md">
                                <div className="text-sm text-green-800 dark:text-green-200">
                                    <strong>Beispiel:</strong> {playoffWinningSets} Gewinnsätze, max. {playoffMaxSets} Sätze
                                    <br />
                                    <span className="text-xs text-green-600 dark:text-green-400">
                                        💡 Endrunden haben immer einen klaren Gewinner (keine Unentschieden)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Qualifizierte Teams (aktuelle Tabelle):</h4>
                            <div className="space-y-1">
                                {currentStandings.slice(0, playoffTeams).map((standing, index) => (
                                    <div key={standing.teamName} className="flex justify-between text-sm">
                                        <span className="text-blue-700 dark:text-blue-300">
                                            {index + 1}. {standing.teamName}
                                        </span>
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {standing.points} Pkt
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={handleAddPlayoffs}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    >
                        🏆 Endrunde hinzufügen
                    </button>
                </div>
            </div>
        </div>
    );
};

interface MatchEditorModalProps {
    tournament: SavedTournament;
    onClose: () => void;
    onSave: () => void;
}

const MatchEditorModal: React.FC<MatchEditorModalProps> = ({ tournament, onClose, onSave }) => {
    const [matches, setMatches] = useState<Match[]>([...tournament.matches]);
    const [hasChanges, setHasChanges] = useState(false);

    const handleDeleteMatch = (matchId: number) => {
        if (window.confirm('Möchten Sie dieses Spiel wirklich löschen?')) {
            const newMatches = matches.filter(m => m.id !== matchId);
            setMatches(newMatches);
            setHasChanges(true);
        }
    };

    const handleAddMatch = () => {
        const newMatchId = Math.max(...matches.map(m => m.id), 0) + 1;
        const lastMatch = matches[matches.length - 1];
        const nextTime = lastMatch ? addMinutesToTime(lastMatch.time, tournament.settings.gameDuration + tournament.settings.breakDuration) : tournament.settings.startTime;
        
        const newMatch: Match = {
            id: newMatchId,
            round: Math.max(...matches.map(m => m.round), 0) + 1,
            time: nextTime,
            field: tournament.settings.fieldNames[0] || 'Feld 1',
            teamA: tournament.settings.teamNames[0] || 'Team A',
            teamB: tournament.settings.teamNames[1] || 'Team B',
            sets: Array.from({ length: tournament.settings.winningSets }, () => ({ scoreA: null, scoreB: null })),
            setsWonA: 0,
            setsWonB: 0,
            pointsForA: 0,
            pointsForB: 0,
            scoreHistory: []
        };
        
        setMatches([...matches, newMatch]);
        setHasChanges(true);
    };

    const handleMatchChange = (matchId: number, field: keyof Match, value: any) => {
        const newMatches = matches.map(match => 
            match.id === matchId ? { ...match, [field]: value } : match
        );
        setMatches(newMatches);
        setHasChanges(true);
    };

    const handleSave = () => {
        if (!hasChanges) {
            onClose();
            return;
        }

        tournament.matches = [...matches];
        onSave();
        onClose();
    };

    // Helper function to add minutes to time string
    const addMinutesToTime = (timeStr: string, minutes: number): string => {
        const [hours, mins] = timeStr.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col">
                {/* Fixed Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">⚽ Spiele verwalten</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Fixed Add Button */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button 
                        onClick={handleAddMatch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        ➕ Neues Spiel hinzufügen
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4 space-y-4">
                        {matches.map((match) => (
                            <div key={match.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-medium text-slate-900 dark:text-white">Spiel {match.id}</h4>
                                    <button 
                                        onClick={() => handleDeleteMatch(match.id)}
                                        className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        🗑️ Löschen
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Runde</label>
                                        <input
                                            type="number"
                                            value={match.round}
                                            onChange={(e) => handleMatchChange(match.id, 'round', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Zeit</label>
                                        <input
                                            type="time"
                                            value={match.time}
                                            onChange={(e) => handleMatchChange(match.id, 'time', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Feld</label>
                                        <select
                                            value={match.field}
                                            onChange={(e) => handleMatchChange(match.id, 'field', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        >
                                            {tournament.settings.fieldNames.map(field => (
                                                <option key={field} value={field}>{field}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Team A</label>
                                        <select
                                            value={match.teamA}
                                            onChange={(e) => handleMatchChange(match.id, 'teamA', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        >
                                            {tournament.settings.teamNames.map(team => (
                                                <option key={team} value={team}>{team}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Team B</label>
                                        <select
                                            value={match.teamB}
                                            onChange={(e) => handleMatchChange(match.id, 'teamB', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        >
                                            {tournament.settings.teamNames.map(team => (
                                                <option key={team} value={team}>{team}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {hasChanges && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Änderungen am Spielplan werden gespeichert. Die Tabelle wird automatisch aktualisiert.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={handleSave}
                        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            hasChanges 
                                ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                                : 'text-slate-400 bg-slate-200 dark:bg-slate-600 cursor-not-allowed'
                        }`}
                    >
                        {hasChanges ? 'Änderungen speichern' : 'Keine Änderungen'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface TeamEditorModalProps {
    tournament: SavedTournament;
    onClose: () => void;
    onSave: () => void;
}

const TeamEditorModal: React.FC<TeamEditorModalProps> = ({ tournament, onClose, onSave }) => {
    const [editedTeamNames, setEditedTeamNames] = useState<string[]>([...tournament.settings.teamNames]);
    const [hasChanges, setHasChanges] = useState(false);

    const handleTeamNameChange = (index: number, newName: string) => {
        const newTeamNames = [...editedTeamNames];
        newTeamNames[index] = newName;
        setEditedTeamNames(newTeamNames);
        setHasChanges(JSON.stringify(newTeamNames) !== JSON.stringify(tournament.settings.teamNames));
    };

    const handleSave = () => {
        if (!hasChanges) {
            onClose();
            return;
        }

        // Create mapping from old names to new names
        const nameMapping: { [oldName: string]: string } = {};
        tournament.settings.teamNames.forEach((oldName, index) => {
            nameMapping[oldName] = editedTeamNames[index];
        });
        
        // Update tournament settings
        tournament.settings.teamNames = [...editedTeamNames];
        
        // Update all matches with new team names
        tournament.matches.forEach(match => {
            if (nameMapping[match.teamA]) {
                match.teamA = nameMapping[match.teamA];
            }
            if (nameMapping[match.teamB]) {
                match.teamB = nameMapping[match.teamB];
            }
        });

        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">✏️ Teamnamen bearbeiten</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        {editedTeamNames.map((teamName, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-16">
                                    Team {index + 1}:
                                </span>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => handleTeamNameChange(index, e.target.value)}
                                    className="flex-1 px-3 py-2 text-base sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white touch-manipulation"
                                    placeholder={`Team ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                    
                    {hasChanges && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                            <div className="flex items-center gap-2">
                                <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Änderungen werden in allen Spielen und der Tabelle übernommen.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={handleSave}
                        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            hasChanges 
                                ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                                : 'text-slate-400 bg-slate-200 dark:bg-slate-600 cursor-not-allowed'
                        }`}
                    >
                        {hasChanges ? 'Änderungen speichern' : 'Keine Änderungen'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ScheduleDisplayProps {
    tournament: SavedTournament;
    onUpdateMatch: (matchId: number, sets: { scoreA: number | null; scoreB: number | null }[]) => void;
    onSave: () => void;
    onUpdateTournament: (updatedTournament: SavedTournament) => void;
    onBackToDashboard: () => void;
    showVersionHistory: boolean;
    setShowVersionHistory: (show: boolean) => void;
    showAuditLog: boolean;
    setShowAuditLog: (show: boolean) => void;
    touchMode: boolean;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ tournament: originalTournament, onUpdateMatch, onSave, onUpdateTournament, onBackToDashboard, showVersionHistory, setShowVersionHistory, showAuditLog, setShowAuditLog, touchMode }) => {
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [historyMatch, setHistoryMatch] = useState<Match | null>(null);
    const [showTeamEditor, setShowTeamEditor] = useState(false);
    const [showMatchEditor, setShowMatchEditor] = useState(false);
    const [showPlayoffEditor, setShowPlayoffEditor] = useState(false);
    
    const standings = useMemo(() => {
        return calculateStandings(originalTournament.matches, originalTournament.settings.teamNames, originalTournament.settings, 'group');
    }, [originalTournament.matches, originalTournament.settings.teamNames, originalTournament.settings]);

    // Dynamisch aufgelöste Matches mit aktuellen Teamnamen
    const resolvedMatches = useMemo(() => {
        const playoffMatches = originalTournament.matches.filter(match => match.phase === 'playoff');
        
        return originalTournament.matches.map(match => {
            if (match.phase !== 'playoff') {
                return match; // Hauptrunden-Spiele bleiben unverändert
            }
            
            // Löse Playoff-Teamnamen dynamisch auf
            const resolved = resolvePlayoffTeamNames(match, standings, playoffMatches);
            return {
                ...match,
                teamA: resolved.teamA,
                teamB: resolved.teamB
            };
        }).filter(match => {
            // Filtere Playoff-Matches heraus, die auf nicht existierende Teams verweisen
            if (match.phase === 'playoff') {
                const hasInvalidTeam = match.teamA.startsWith('Platz ') || match.teamB.startsWith('Platz ');
                return !hasInvalidTeam;
            }
            return true;
        });
    }, [originalTournament.matches, standings]);

    // Debug: Zeige aufgelöste Matches
    console.log('Resolved matches:', resolvedMatches.filter(m => m.phase === 'playoff').map(m => ({ 
        id: m.id, 
        teamA: m.teamA, 
        teamB: m.teamB, 
        playoffRound: m.playoffRound 
    })));

    // Hilfsfunktion zum Auflösen von Teamnamen für die Anzeige
    const getDisplayTeamName = useCallback((teamName: string, match: Match) => {
        if (match.phase !== 'playoff') return teamName;
        
        // Platzhalter für Tabellenplätze
        const platzRegex = /\{\{PLATZ_(\d+)\}\}/;
        const platzMatch = teamName.match(platzRegex);
        if (platzMatch) {
            const position = parseInt(platzMatch[1]) - 1;
            return standings[position]?.teamName || teamName;
        }
        
        // Platzhalter für Halbfinal-Ergebnisse
        const playoffMatches = originalTournament.matches.filter(m => m.phase === 'playoff');
        if (teamName.includes('{{SIEGER_HF') || teamName.includes('{{VERLIERER_HF')) {
            return resolveHalbfinalResult(teamName, playoffMatches);
        }
        
        return teamName;
    }, [standings, originalTournament.matches]);

    // Hilfsfunktionen für Playoff-Standings
    const getFinalWinner = (match: Match): string | null => {
        if (!match.sets || match.sets.length === 0) return null;
        
        let setsA = 0, setsB = 0;
        match.sets.forEach(set => {
            if (set.scoreA !== null && set.scoreB !== null) {
                if (set.scoreA > set.scoreB) setsA++;
                else if (set.scoreB > set.scoreA) setsB++;
            }
        });
        
        if (setsA > setsB) return match.teamA;
        if (setsB > setsA) return match.teamB;
        return null;
    };

    const getFinalLoser = (match: Match): string | null => {
        if (!match.sets || match.sets.length === 0) return null;
        
        let setsA = 0, setsB = 0;
        match.sets.forEach(set => {
            if (set.scoreA !== null && set.scoreB !== null) {
                if (set.scoreA > set.scoreB) setsA++;
                else if (set.scoreB > set.scoreA) setsB++;
            }
        });
        
        if (setsA > setsB) return match.teamB;
        if (setsB > setsA) return match.teamA;
        return null;
    };

    const createPlayoffStanding = (teamName: string, match: Match, rank: number): Standing => {
        let setsWon = 0, setsLost = 0, pointsFor = 0, pointsAgainst = 0;
        
        match.sets.forEach(set => {
            if (set.scoreA !== null && set.scoreB !== null) {
                if (match.teamA === teamName) {
                    pointsFor += set.scoreA;
                    pointsAgainst += set.scoreB;
                    if (set.scoreA > set.scoreB) setsWon++;
                    else if (set.scoreB > set.scoreA) setsLost++;
                } else if (match.teamB === teamName) {
                    pointsFor += set.scoreB;
                    pointsAgainst += set.scoreA;
                    if (set.scoreB > set.scoreA) setsWon++;
                    else if (set.scoreA > set.scoreB) setsLost++;
                }
            }
        });

        const isWinner = getFinalWinner(match) === teamName;
        
        return {
            rank,
            teamName,
            played: 1,
            wins: isWinner ? 1 : 0,
            losses: isWinner ? 0 : 1,
            draws: 0,
            setsWon,
            setsLost,
            pointsFor,
            pointsAgainst,
            points: setsWon
        };
    };

    // Überschreibe die Matches im Tournament-Objekt mit den aufgelösten Matches
    const tournament = useMemo(() => {
        const updatedTournament = { ...originalTournament };
        updatedTournament.matches = resolvedMatches;
        return updatedTournament;
    }, [originalTournament, resolvedMatches]);

    const playoffStandings = useMemo(() => {
        const playoffMatches = resolvedMatches.filter(match => match.phase === 'playoff');
        if (playoffMatches.length === 0) return [];
        
        // Spezielle Logik für Playoff-Platzierungen basierend auf Turnier-Hierarchie
        const finalMatch = playoffMatches.find(m => m.playoffRound === 'Finale');
        const thirdPlaceMatch = playoffMatches.find(m => m.playoffRound === 'Spiel um Platz 3');
        
        const playoffRankings: Standing[] = [];
        
        if (finalMatch) {
            // Bestimme Finale-Sieger und -Verlierer
            const finalWinner = getFinalWinner(finalMatch);
            const finalLoser = getFinalLoser(finalMatch);
            
            if (finalWinner) {
                playoffRankings.push(createPlayoffStanding(finalWinner, finalMatch, 1));
            }
            if (finalLoser) {
                playoffRankings.push(createPlayoffStanding(finalLoser, finalMatch, 2));
            }
        }
        
        if (thirdPlaceMatch) {
            // Bestimme Platz 3-Spiel Sieger und Verlierer
            const thirdWinner = getFinalWinner(thirdPlaceMatch);
            const thirdLoser = getFinalLoser(thirdPlaceMatch);
            
            if (thirdWinner) {
                playoffRankings.push(createPlayoffStanding(thirdWinner, thirdPlaceMatch, 3));
            }
            if (thirdLoser) {
                playoffRankings.push(createPlayoffStanding(thirdLoser, thirdPlaceMatch, 4));
            }
        }
        
        // Fallback: Wenn keine speziellen Matches, normale Berechnung
        if (playoffRankings.length === 0) {
            const playoffTeams = new Set<string>();
            playoffMatches.forEach(match => {
                if (match.teamA && !match.teamA.includes('{{') && !match.teamA.includes('Sieger') && !match.teamA.includes('Verlierer')) {
                    playoffTeams.add(match.teamA);
                }
                if (match.teamB && !match.teamB.includes('{{') && !match.teamB.includes('Sieger') && !match.teamB.includes('Verlierer')) {
                    playoffTeams.add(match.teamB);
                }
            });
            
            const playoffSettings = {
                ...originalTournament.settings,
                scoringMode: originalTournament.settings.playoffScoringMode || 'per_set',
                allowDraws: originalTournament.settings.playoffAllowDraws ?? false,
                winningSets: originalTournament.settings.playoffWinningSets || originalTournament.settings.winningSets
            };
            
            return calculateStandings(resolvedMatches, Array.from(playoffTeams), playoffSettings, 'playoff');
        }
        
        return playoffRankings;
    }, [resolvedMatches, originalTournament.settings, getFinalWinner, getFinalLoser, createPlayoffStanding]);

    const maxPts = useMemo(() => Math.max(1, ...standings.map(s => s.points)), [standings]);
    const hasPlayoffMatches = useMemo(() => tournament.matches.some(match => match.phase === 'playoff'), [tournament.matches]);

    // Debug-Logs entfernt für Production

    const StatusChip: React.FC<{ status: ReturnType<typeof computeMatchStatus> }> = ({ status }) => {
        const map: Record<string, string> = {
            live: 'bg-rose-100 text-rose-700 border-rose-200',
            next: 'bg-amber-100 text-amber-700 border-amber-200',
            done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            pending: 'bg-slate-100 text-slate-600 border-slate-200',
        };
        const label: Record<string, string> = { live: 'Live', next: 'Als nächstes', done: 'Beendet', pending: 'Offen' };
        return <span className={`ml-2 px-2 py-0.5 text-[10px] rounded border ${map[status]}`}>{label[status]}</span>;
    };

    const handlePrint = () => {
        window.print();
    };
    
    return (
        <div className="space-y-8">
            {editingMatch && <ScoreEntryModal match={editingMatch} winningSets={tournament.settings.winningSets} onClose={() => setEditingMatch(null)} onSave={onUpdateMatch} tournament={tournament} />}
            {historyMatch && <ScoreHistoryModal match={historyMatch} onClose={() => setHistoryMatch(null)} onRestore={(id, sets) => { onUpdateMatch(id, sets); setHistoryMatch(null); }} />}

            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight print-title">{tournament.settings.name}</h1>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex justify-center gap-4 print:hidden">
                <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900">
                    <PrintIcon className="w-5 h-5"/>
                    Drucken
                </button>
                <button onClick={() => setShowVersionHistory(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900">
                    <HistoryIcon className="w-5 h-5"/>
                    Versionen ({(tournament?.versions || []).length})
                </button>
                <button onClick={() => setShowAuditLog(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 dark:border-amber-600 text-sm font-medium rounded-md shadow-sm text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-slate-900">
                    📋 Audit-Log ({(tournament?.auditLog || []).length})
                </button>
                <button onClick={() => setShowTeamEditor(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900">
                    ✏️ Teams bearbeiten
                </button>
                <button onClick={() => setShowMatchEditor(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-300 dark:border-emerald-600 text-sm font-medium rounded-md shadow-sm text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-900">
                    ⚽ Spiele verwalten
                </button>
                <button onClick={() => setShowPlayoffEditor(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 dark:border-amber-600 text-sm font-medium rounded-md shadow-sm text-amber-700 dark:text-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-slate-900">
                    🏆 Endrunde hinzufügen
                </button>
                <button onClick={onBackToDashboard} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900">
                    <HomeIcon className="w-5 h-5"/>
                    Zurück zur Übersicht
                </button>
            </div>

            <div className="space-y-8 print-layout">
                <div>
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Spielplan</h2>
                    {/* Desktop/Tablets (lg): Tabelle */}
                    <div className="hidden lg:block overflow-x-auto bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Spiel</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zeit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Feld</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Begegnung</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ergebnis</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                                {tournament.matches.map(match => {
                                    const playedSets = match.sets.filter(s => s.scoreA !== null && s.scoreB !== null);
                                    const hasStarted = playedSets.length > 0;
                                    const setScoresString = playedSets.map(s => `${s.scoreA}:${s.scoreB}`).join(', ');
                                    const status = computeMatchStatus(match, tournament.settings);

                                    const isPlayoff = match.phase === 'playoff';
                                    const playoffRound = match.playoffRound || '';
                                    
                                    return (
                                        <tr key={match.id} className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors ${isPlayoff ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10' : ''}`}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                                {isPlayoff && '🏆'} {match.id}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{match.time}<StatusChip status={status} /></td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{match.field}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                                {isPlayoff && (
                                                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-800 dark:text-amber-200 rounded-full mr-2">
                                                        {playoffRound}
                                                    </span>
                                                )}
                                                <TeamDot name={match.teamA} />{match.teamA} - <TeamDot name={match.teamB} />{match.teamB}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {hasStarted ? (
                                                        <div>
                                                            <div className="font-bold text-lg">{match.setsWonA}:{match.setsWonB}</div>
                                                            {setScoresString && (
                                                                <div className="text-xs text-slate-500">
                                                                    ({setScoresString})
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="font-bold text-lg text-slate-400 dark:text-slate-500">- : -</div>
                                                    )}
                                                    <div className="flex flex-col print:hidden">
                                                        <button onClick={() => setEditingMatch(match)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" aria-label={`Ergebnis für Spiel ${match.id} bearbeiten`}>
                                                            <EditIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile/Tablet: Karten-Layout */}
                    <div className="space-y-3 lg:hidden">
                        {tournament.matches.map(match => {
                            const playedSets = match.sets.filter(s => s.scoreA !== null && s.scoreB !== null);
                            const hasStarted = playedSets.length > 0;
                            const setScoresString = playedSets.map(s => `${s.scoreA}:${s.scoreB}`).join(', ');
                            const status = computeMatchStatus(match, tournament.settings);
                            const isPlayoff = match.phase === 'playoff';
                            const playoffRound = match.playoffRound || '';
                            
                            return (
                                <div key={match.id} className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isPlayoff ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700' : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {isPlayoff && '🏆'} Spiel {match.id}
                                            {isPlayoff && playoffRound && (
                                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-800 dark:text-amber-200 rounded-full">
                                                    {playoffRound}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">{match.time} • Feld {match.field} <StatusChip status={status} /></div>
                                    </div>
                                    <div className="font-semibold text-slate-800 dark:text-slate-100 mb-2"><TeamDot name={match.teamA} />{match.teamA} — <TeamDot name={match.teamB} />{match.teamB}</div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {hasStarted ? (
                                                <div>
                                                    <div className="text-lg font-bold">{match.setsWonA}:{match.setsWonB}</div>
                                                    {setScoresString && (
                                                        <div className="text-xs text-slate-500">({setScoresString})</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-lg font-bold text-slate-400 dark:text-slate-500">- : -</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingMatch(match)} className={`${touchMode ? 'px-4 py-3 text-sm' : 'px-3 py-2 text-xs'} rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white`}>
                                                Ergebnis
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
                        📊 Hauptrunden-Tabelle
                        {hasPlayoffMatches && (
                            <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-400">
                                (Qualifikation für Endrunde)
                            </span>
                        )}
                    </h2>
                    {/* Desktop/Tablets (lg): Tabelle */}
                    <div className="hidden lg:block overflow-x-auto bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">#</th>
                                    <th className="p-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Team</th>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400" title="Spiele">Sp</th>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400" title="Siege">S</th>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400" title="Unentschieden">U</th>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400" title="Niederlagen">N</th>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400" title="Sätze">Sätze</th>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400" title="Bälle">Bälle</th>
                                    <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400" title="Punkte">Pkt</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                                {standings.map(s => (
                                    <tr key={s.teamName} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">{s.rank}</td>
                                        <td className="p-2 text-left text-sm font-medium text-slate-900 dark:text-white">
                                            <TeamDot name={s.teamName} />{s.teamName}
                                            <div className="mt-1 h-1.5 rounded bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.round((s.points / maxPts) * 100)}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">{s.played}</td>
                                        <td className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">{s.wins}</td>
                                        <td className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">{s.draws}</td>
                                        <td className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">{s.losses}</td>
                                        <td className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">{s.setsWon}:{s.setsLost}</td>
                                        <td className="p-2 text-center text-sm text-slate-500 dark:text-slate-400">{s.pointsFor}:{s.pointsAgainst}</td>
                                        <td className="p-2 text-center text-sm font-bold text-slate-900 dark:text-white">{s.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile/Tablet: kompakte Liste */}
                    <div className="lg:hidden space-y-2">
                        {standings.map(s => (
                            <div key={s.teamName} className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold">
                                            {s.rank}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold"><TeamDot name={s.teamName} />{s.teamName}</div>
                                            <div className="text-[11px] text-slate-500">Sp {s.played} • S {s.wins} • N {s.losses} • Sätze {s.setsWon}:{s.setsLost}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold">{s.points} Pkt</div>
                                </div>
                                <div className="mt-2 h-2 rounded bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.round((s.points / maxPts) * 100)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Endrunden-Tabelle */}
                {hasPlayoffMatches && playoffStandings.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
                            🏆 Endrunden-Tabelle
                            {tournament.settings.playoffMode === 'direct_final' && ' (Finale)'}
                            {tournament.settings.playoffMode === 'semi_final' && ' (Playoffs)'}
                            {tournament.settings.playoffMode === 'top4_roundrobin' && ' (Top 4)'}
                            {tournament.settings.playoffMode === 'top6_roundrobin' && ' (Top 6)'}
                        </h2>
                        
                        {/* Desktop/Tablets (lg): Tabelle */}
                        <div className="hidden lg:block overflow-x-auto bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg shadow-md border border-amber-200 dark:border-amber-700">
                            <table className="min-w-full divide-y divide-amber-200 dark:divide-amber-700">
                                <thead className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">#</th>
                                        <th className="p-2 text-left text-xs font-medium text-amber-700 dark:text-amber-300">Team</th>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300" title="Spiele">Sp</th>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300" title="Siege">S</th>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300" title="Unentschieden">U</th>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300" title="Niederlagen">N</th>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300" title="Sätze">Sätze</th>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300" title="Bälle">Bälle</th>
                                        <th className="p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300" title="Punkte">Pkt</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 divide-y divide-amber-200 dark:divide-amber-700">
                                    {playoffStandings.map((s, index) => (
                                        <tr key={s.teamName} className="hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors">
                                            <td className="p-2 text-center text-sm text-amber-600 dark:text-amber-400">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && s.rank}
                                            </td>
                                            <td className="p-2 text-left text-sm font-medium text-slate-900 dark:text-white">
                                                <TeamDot name={s.teamName} />{s.teamName}
                                                <div className="mt-1 h-1.5 rounded bg-amber-100 dark:bg-amber-800 overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.round((s.points / Math.max(1, ...playoffStandings.map(ps => ps.points))) * 100)}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="p-2 text-center text-sm text-amber-700 dark:text-amber-300">{s.played}</td>
                                            <td className="p-2 text-center text-sm text-amber-700 dark:text-amber-300">{s.wins}</td>
                                            <td className="p-2 text-center text-sm text-amber-700 dark:text-amber-300">{s.draws}</td>
                                            <td className="p-2 text-center text-sm text-amber-700 dark:text-amber-300">{s.losses}</td>
                                            <td className="p-2 text-center text-sm text-amber-700 dark:text-amber-300">{s.setsWon}:{s.setsLost}</td>
                                            <td className="p-2 text-center text-sm text-amber-700 dark:text-amber-300">{s.pointsFor}:{s.pointsAgainst}</td>
                                            <td className="p-2 text-center text-sm font-bold text-amber-800 dark:text-amber-200">{s.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Mobile/Tablet: kompakte Liste */}
                        <div className="lg:hidden space-y-2">
                            {playoffStandings.map((s, index) => (
                                <div key={s.teamName} className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-800 dark:to-orange-800 text-amber-700 dark:text-amber-200 flex items-center justify-center text-xs font-bold">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && s.rank}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                                    <TeamDot name={s.teamName} />{s.teamName}
                                                </div>
                                                <div className="text-[11px] text-amber-600 dark:text-amber-400">
                                                    Sp {s.played} • S {s.wins} • N {s.losses} • Sätze {s.setsWon}:{s.setsLost}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-amber-800 dark:text-amber-200">{s.points} Pkt</div>
                                    </div>
                                    <div className="mt-2 h-2 rounded bg-amber-100 dark:bg-amber-800 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.round((s.points / Math.max(1, ...playoffStandings.map(ps => ps.points))) * 100)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Mobile Action Bar */}
            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-4 inset-x-4 md:hidden print:hidden z-40">
                <div className="grid grid-cols-4 gap-1 bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 backdrop-blur-sm">
                    <button onClick={handlePrint} className="inline-flex items-center justify-center px-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium">
                        <PrintIcon className="w-3 h-3" />
                    </button>
                    <button onClick={() => setShowVersionHistory(true)} className="inline-flex items-center justify-center px-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium">
                        <HistoryIcon className="w-3 h-3" />
                    </button>
                    <button onClick={() => setShowAuditLog(true)} className="inline-flex items-center justify-center px-1 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium">
                        📋
                    </button>
                    <button onClick={() => setShowTeamEditor(true)} className="inline-flex items-center justify-center px-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium">
                        ✏️
                    </button>
                    <button onClick={() => setShowMatchEditor(true)} className="inline-flex items-center justify-center px-1 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
                        ⚽
                    </button>
                    <button onClick={() => setShowPlayoffEditor(true)} className="inline-flex items-center justify-center px-1 py-2 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium">
                        🏆
                    </button>
                    <button onClick={onBackToDashboard} className="inline-flex items-center justify-center px-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium col-span-2">
                        <HomeIcon className="w-3 h-3" /> Home
                    </button>
                </div>
            </div>
            <style>{`
                @media print {
                    body {
                        background: white !important;
                        font-size: 10pt;
                    }
                    .dark body, .dark * {
                        background-color: transparent !important;
                        color: black !important;
                        border-color: #cbd5e1 !important;
                    }
                    .print\\:hidden { display: none !important; }
                    
                    main { padding: 1rem !important; }

                    .print-title {
                        text-align: center;
                        font-size: 2rem;
                        margin-bottom: 2rem;
                        color: black !important;
                    }
                    
                    .print-layout {
                        display: block !important;
                    }
                    .print-layout > div {
                        break-inside: avoid; /* Avoid breaking tables across pages */
                        margin-bottom: 2rem;
                    }

                    .print-layout .overflow-x-auto {
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        overflow: visible !important;
                    }
                    
                    table { 
                        width: 100%;
                        border-collapse: collapse;
                    }
                    thead {
                        display: table-header-group; /* Ensure header repeats on each page */
                    }
                    th, td {
                        border: 1px solid #cbd5e1;
                        padding: 0.5rem;
                        text-align: left;
                    }
                    th {
                        background-color: #f1f5f9 !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                }
            `}</style>

            {/* Playoff Editor Modal */}
            {showPlayoffEditor && (
                <PlayoffEditorModal
                    tournament={tournament}
                    onClose={() => setShowPlayoffEditor(false)}
                    onSave={onSave}
                    onUpdateTournament={onUpdateTournament}
                />
            )}

            {/* Match Editor Modal */}
            {showMatchEditor && (
                <MatchEditorModal
                    tournament={tournament}
                    onClose={() => setShowMatchEditor(false)}
                    onSave={onSave}
                />
            )}

            {/* Team Editor Modal */}
            {showTeamEditor && (
                <TeamEditorModal
                    tournament={tournament}
                    onClose={() => setShowTeamEditor(false)}
                    onSave={onSave}
                />
            )}
        </div>
    );
};

interface TournamentListProps {
    tournaments: SavedTournament[];
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    onCreateNew: () => void;
    onCreateBackup: () => void;
    onRestoreBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
    dbMode: boolean;
    onMigrate?: () => void;
    onReload?: () => void;
    isLoading?: boolean;
}

const TournamentList: React.FC<TournamentListProps> = ({ tournaments, onLoad, onDelete, onCreateNew, onCreateBackup, onRestoreBackup, dbMode, onMigrate, onReload, isLoading }) => {
    const sortedTournaments = useMemo(() => {
        return [...tournaments].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    }, [tournaments]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 dark:from-primary-400 dark:via-primary-300 dark:to-secondary-400 bg-clip-text text-transparent tracking-tight">Meine Turniere</h1>
                
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={onCreateNew}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105"
                    >
                        <HomeIcon className="w-5 h-5 mr-2" />
                        Neues Turnier
                    </button>
                    
                    <button
                        onClick={onCreateBackup}
                        className="inline-flex items-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-xl shadow-lg text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 transform hover:scale-105"
                        title="Vollständiges Backup erstellen"
                    >
                        <DatabaseIcon className="w-5 h-5 mr-2" />
                        Backup
                    </button>
                    
                    <label className="inline-flex items-center px-4 py-3 border border-emerald-300 dark:border-emerald-600 text-base font-medium rounded-xl shadow-lg text-emerald-700 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                        title="Backup wiederherstellen"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Restore
                        <input
                            type="file"
                            accept=".json"
                            onChange={onRestoreBackup}
                            className="hidden"
                        />
                    </label>
                    {dbMode && onReload && (
                        <button
                            onClick={onReload}
                            className="inline-flex items-center px-4 py-3 border border-emerald-300 dark:border-emerald-600 text-base font-medium rounded-xl shadow-lg text-emerald-700 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 transform hover:scale-105"
                            title="Neu aus der Cloud laden"
                        >
                            <DatabaseIcon className="w-5 h-5 mr-2" />
                            Neu aus Cloud laden
                        </button>
                    )}
                </div>
            </div>

            {/* Speicher-Status-Anzeige */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200/50 dark:border-slate-600/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dbMode ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                            <DatabaseIcon className="w-4 h-4 text-white"/>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{dbMode ? 'Netlify Database' : 'Lokaler Speicher'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{tournaments.length} Turnier{tournaments.length !== 1 ? 'e' : ''} gespeichert</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${dbMode ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        <span className={`text-xs font-medium ${dbMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{dbMode ? 'DB aktiv' : 'Lokal aktiv'}</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 animate-pulse">
                            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                            <div className="h-3 w-72 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : sortedTournaments.length === 0 ? (
                <div className="text-center py-12 px-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 shadow-lg">
                    <TrophyIcon className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Keine Turniere gefunden</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Erstellen Sie Ihr erstes Turnier, um loszulegen.</p>
                    <button
                        onClick={onCreateNew}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 transform hover:scale-105"
                    >
                        <HomeIcon className="w-5 h-5 mr-2" />
                        Erstes Turnier erstellen
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <ul role="list" className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedTournaments.map((t) => (
                            <li key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150">
                                <div>
                                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{t.settings.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {t.settings.teamNames.length} Teams, zuletzt geändert am {new Date(t.lastModified).toLocaleDateString('de-DE')}
                                    </p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onLoad(t.id)}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105"
                                    >
                                        Laden
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.confirm(`Möchten Sie das Turnier "${t.settings.name}" wirklich löschen?`) && onDelete(t.id)}
                                        className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 transform hover:scale-105"
                                        aria-label="Löschen"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const DarkModeToggle: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    return (
        <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="relative z-50 p-3 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 hover:from-primary-100 hover:to-primary-200 dark:hover:from-slate-600 dark:hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            aria-label="Toggle dark mode"
        >
            <div className="relative z-10">
                {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        </button>
    );
};

const Header: React.FC = () => (
    <header className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 print:hidden shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
        <div className="container mx-auto flex justify-between items-center">
             <div className="flex items-center gap-4 group">
                <div className="relative">
                    <TrophyIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-all duration-300 transform group-hover:scale-110 animate-bounce-gentle"/>
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full opacity-20 blur group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 dark:from-primary-400 dark:via-primary-300 dark:to-secondary-400 bg-clip-text text-transparent">
                        Spielplan Generator
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Professionelle Turnierverwaltung
                    </p>
                </div>
            </div>
            <DarkModeToggle />
        </div>
    </header>
);

const Footer: React.FC = () => (
    <footer className="py-8 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border-t border-slate-200/50 dark:border-slate-700/50 print:hidden">
        <div className="container mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
                <TrophyIcon className="w-5 h-5 text-primary-600 dark:text-primary-400"/>
                <span className="text-lg font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent">
                    Spielplan Generator
                </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                &copy; {new Date().getFullYear()} Professionelle Turnierverwaltung. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                Entwickelt mit ❤️ für perfekte Turniere
            </p>
        </div>
    </footer>
);

// --- AUTH UTILS (client-side only, basic protection) --- //
async function sha256Hex(input: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function App() {
    type View = 'dashboard' | 'setup' | 'display';
    type AuthStatus = 'setup' | 'login' | 'ok';
    const STORAGE_KEY = 'spielplan-tournaments-v2';
    const USE_DB = (import.meta as any).env?.VITE_USE_DB === 'true';
    const API_URL = '/.netlify/functions/tournaments';
    // Optional fester Passwort-Hash (über ENV), gleich auf allen Geräten
    const FIXED_HASH = (import.meta as any).env?.VITE_APP_PASSWORD_HASH || (import.meta as any).env?.VITE_APP_PASSWORD_SHA256 || '';

    const [view, setView] = useState<View>('dashboard');
    const [tournaments, setTournaments] = useState<SavedTournament[]>([]);
    const [activeTournament, setActiveTournament] = useState<SavedTournament | null>(null);
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [showSyncToast, setShowSyncToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [lastApiOk, setLastApiOk] = useState<boolean | null>(null);
    const [lastApiAt, setLastApiAt] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authBusy, setAuthBusy] = useState(false);
    const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem('offline-mode') === 'true');
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    const [autoOfflineMode, setAutoOfflineMode] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [touchMode, setTouchMode] = useState(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);

    useEffect(() => {
        // Initialize custom auth from localStorage token
        const token = localStorage.getItem('auth_token');
        const initAuth = async () => {
            if (token) {
                try {
                    const res = await fetch('/.netlify/functions/auth-me', { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) {
                        const data = await res.json();
                        setCurrentUser(data.user);
                        setIsAdmin(data.user?.role === 'admin');
                    } else {
                        localStorage.removeItem('auth_token');
                        setCurrentUser(null);
                        setIsAdmin(false);
                    }
                } catch {}
            }
        };
        initAuth();
        const load = async () => {
            if (USE_DB && !effectiveOfflineMode) {
                setIsLoading(true);
                try {
                    // attach JWT if available
                    let headers: any = {};
                    const t = localStorage.getItem('auth_token');
                    if (t) headers.Authorization = `Bearer ${t}`;
                    const res = await fetch(API_URL, { headers });
                    if (!res.ok) throw new Error('API Fehler');
                    const data = await res.json();
                    setTournaments(data);
                } catch (error) {
                    console.error('Fehler beim Laden aus der DB:', error);
                    setErrorMsg('Fehler beim Laden aus der Cloud.');
                    setLastApiOk(false);
                    setLastApiAt(new Date().toLocaleTimeString());
                }
                setIsLoading(false);
                if (!errorMsg) { setLastApiOk(true); setLastApiAt(new Date().toLocaleTimeString()); }
                return;
            }
            // Load from localStorage (offline mode or local-only mode)
            try {
                const savedData = localStorage.getItem(STORAGE_KEY);
                if (savedData) {
                    setTournaments(JSON.parse(savedData));
                }
            } catch (error) {
                console.error("Fehler beim Laden der Turniere:", error);
            }
        };
        load();
    }, []);

    // Auto-detect online/offline status
    useEffect(() => {
        const testConnection = async () => {
            try {
                // Test actual internet connectivity
                const response = await fetch('/.netlify/functions/tournaments', {
                    method: 'HEAD',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                return response.ok;
            } catch {
                return false;
            }
        };

        const handleOnline = async () => {
            setIsOnline(true);
            
            // Test if we actually have internet connectivity
            const hasConnection = await testConnection();
            
            if (hasConnection && autoOfflineMode) {
                setAutoOfflineMode(false);
                // Try to sync when coming back online
                if (USE_DB && currentUser) {
                    reloadFromDB();
                }
            } else if (!hasConnection) {
                // Browser says online but no real connection
                setIsOnline(false);
                if (!offlineMode) {
                    setAutoOfflineMode(true);
                }
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            if (!offlineMode) {
                setAutoOfflineMode(true);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodically check connection and sync data
        const connectionCheckInterval = setInterval(async () => {
            if (autoOfflineMode && !offlineMode) {
                const hasConnection = await testConnection();
                if (hasConnection) {
                    setIsOnline(true);
                    setAutoOfflineMode(false);
                    if (USE_DB && currentUser) {
                        console.log('🔄 Auto-sync: Verbindung wiederhergestellt, synchronisiere mit der Cloud...');
                        // Show sync notification
                        setShowSyncToast(true);
                        setTimeout(() => setShowSyncToast(false), 3000);
                        
                        // First upload any local changes, then reload from cloud
                        try {
                            await saveTournaments(tournaments);
                            await reloadFromDB();
                        } catch (error) {
                            console.error('Sync-Fehler:', error);
                            // If sync fails, stay in offline mode
                            setIsOnline(false);
                            setAutoOfflineMode(true);
                        }
                    }
                }
            } else if (isOnline && !offlineMode && USE_DB && currentUser) {
                // Regular sync when online - check for updates every 30 seconds
                const hasConnection = await testConnection();
                if (hasConnection) {
                    console.log('🔄 Auto-sync: Regelmäßige Synchronisation mit der Cloud...');
                    reloadFromDB();
                } else {
                    // Connection lost during regular operation
                    setIsOnline(false);
                    setAutoOfflineMode(true);
                    console.log('📴 Auto-sync: Verbindung verloren, wechsle zu Offline-Modus...');
                }
            }
        }, 30000); // Check every 30 seconds

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(connectionCheckInterval);
        };
    }, [USE_DB, currentUser, offlineMode, autoOfflineMode, isOnline, tournaments]);

    // Compute effective offline mode (manual or auto)
    const effectiveOfflineMode = offlineMode || autoOfflineMode;

    const saveTournaments = async (updatedTournaments: SavedTournament[]) => {
        try {
            // Always save locally for offline mode
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTournaments));
            setTournaments(updatedTournaments);
            
            // Skip cloud save if offline mode is enabled (manual or auto)
            if (USE_DB && !effectiveOfflineMode) {
                // Upsert alle Turniere (einfach und robust)
                setIsSaving(true);
                let authHeaders: any = {};
                const t = localStorage.getItem('auth_token');
                if (t) authHeaders.Authorization = `Bearer ${t}`;
                const responses = await Promise.all(updatedTournaments.map(t => fetch(API_URL, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', ...authHeaders },
                    body: JSON.stringify(t)
                })));
                const anyBad = responses.some(r => !r.ok);
                if (anyBad) throw new Error('Mindestens ein Save ist fehlgeschlagen');
                // Nach dem Speichern direkt aus der Cloud neu laden
                await reloadFromDB();
                setShowSaveToast(true);
                setTimeout(() => setShowSaveToast(false), 3000);
                setLastApiOk(true);
                setLastApiAt(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error("Fehler beim Speichern der Turniere:", error);
            setErrorMsg('Fehler beim Speichern in die Cloud.');
            setLastApiOk(false);
            setLastApiAt(new Date().toLocaleTimeString());
        } finally {
            if (USE_DB) setIsSaving(false);
        }
    };

    const reloadFromDB = async () => {
        if (!USE_DB) return;
        try {
            setIsLoading(true);
            let headers: any = {};
            const t = localStorage.getItem('auth_token');
            if (t) headers.Authorization = `Bearer ${t}`;
            const res = await fetch(API_URL, { headers });
            if (!res.ok) throw new Error('API Fehler');
            const data = await res.json();
            setTournaments(data);
        } catch (e) {
            console.error('Reload fehlgeschlagen:', e);
            setErrorMsg('Neu laden aus der Cloud fehlgeschlagen.');
        } finally {
            setIsLoading(false);
        }
    };

    // Silent background reload every 60s while logged in and DB mode (not in offline mode)
    useEffect(() => {
        if (!USE_DB || !currentUser || effectiveOfflineMode) return;
        const id = setInterval(() => {
            reloadFromDB();
        }, 60000);
        return () => clearInterval(id);
    }, [USE_DB, currentUser, effectiveOfflineMode]);

    const handleCreateNew = () => {
        setView('setup');
    };

    const handleLoad = (id: string) => {
        const tournamentToLoad = tournaments.find(t => t.id === id);
        if (tournamentToLoad) {
            setActiveTournament(tournamentToLoad);
            setView('display');
        }
    };

    // removed duplicate handleUpdateMatch here; see useCallback version below

    const handleDelete = async (id: string) => {
        const updatedTournaments = tournaments.filter(t => t.id !== id);
        setTournaments(updatedTournaments);
        try {
            if (!USE_DB) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTournaments));
            }
            if (USE_DB) {
                setDeletingId(id);
                let authHeaders: any = { 'content-type': 'application/json' };
                const t = localStorage.getItem('auth_token');
                if (t) authHeaders.Authorization = `Bearer ${t}`;
                const resp = await fetch(API_URL, { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ id }) });
                if (!resp.ok) throw new Error('Delete fehlgeschlagen');
                await reloadFromDB();
                setLastApiOk(true);
                setLastApiAt(new Date().toLocaleTimeString());
            }
        } catch (e) {
            console.error('Fehler beim Löschen:', e);
            setErrorMsg('Fehler beim Löschen in der Cloud.');
            setLastApiOk(false);
            setLastApiAt(new Date().toLocaleTimeString());
        } finally {
            setDeletingId(null);
        }
    };

    const handleBackToDashboard = () => {
        setActiveTournament(null);
        setView('dashboard');
    };

    const migrateLocalToDB = async () => {
        if (!USE_DB) return;
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) {
                alert('Keine lokalen Daten gefunden.');
                return;
            }
            const list: SavedTournament[] = JSON.parse(savedData);
            if (!Array.isArray(list) || list.length === 0) {
                alert('Keine lokalen Turniere vorhanden.');
                return;
            }
            await Promise.all(list.map(t => fetch(API_URL, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(t)
            })));
            // Nach Migration neu laden
            const res = await fetch(API_URL);
            const data = await res.json();
            setTournaments(data);
            alert('Lokale Daten erfolgreich in die Datenbank migriert.');
        } catch (e) {
            console.error('Migration fehlgeschlagen:', e);
            alert('Migration fehlgeschlagen. Siehe Konsole.');
        }
    };

    const handleGenerate = (settings: TournamentSettings) => {
        const mainMatches = generateSchedule(settings);
        let allMatches = mainMatches;
        
        // Füge Playoff-Spiele hinzu, wenn konfiguriert
        if (settings.playoffMode && settings.playoffMode !== 'none') {
            const lastMatch = mainMatches[mainMatches.length - 1];
            const lastTime = lastMatch ? lastMatch.time : settings.startTime;
            const nextMatchId = Math.max(...mainMatches.map(m => m.id), 0) + 1;
            
            // Generiere Playoff-Spiele mit Platzhaltern
            const playoffMatches = generatePlayoffMatches([], settings, nextMatchId, lastTime);
            allMatches = [...mainMatches, ...playoffMatches];
        }
        
        const newTournament: SavedTournament = {
            id: crypto.randomUUID(),
            lastModified: new Date().toISOString(),
            settings,
            matches: allMatches,
        };
        const updatedTournaments = [...tournaments, newTournament];
        saveTournaments(updatedTournaments);
        setActiveTournament(newTournament);
        setView('display');
    };

    const createTournamentVersion = (tournament: SavedTournament, description: string): TournamentVersion => {
        return {
            timestamp: new Date().toISOString(),
            description,
            matches: JSON.parse(JSON.stringify(tournament.matches))
        };
    };

    const handleUpdateMatch = useCallback((matchId: number, sets: { scoreA: number | null; scoreB: number | null }[], isCorrection = false, reason?: string) => {
        if (!activeTournament) return;

        // Find the match to get old data for audit log
        const oldMatch = activeTournament.matches.find(m => m.id === matchId);
        if (!oldMatch) return;

        // Create version before making changes
        const version = createTournamentVersion(activeTournament, isCorrection ? `Korrektur: Spiel ${matchId}` : `Spiel ${matchId} aktualisiert`);

        // Create audit log entry
        const auditEntry: AuditLogEntry = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            matchId,
            teamA: oldMatch.teamA,
            teamB: oldMatch.teamB,
            action: isCorrection ? 'correction' : 'score_change',
            oldSets: JSON.parse(JSON.stringify(oldMatch.sets)),
            newSets: JSON.parse(JSON.stringify(sets)),
            reason,
            userId: currentUser?.email || 'Unbekannt',
            isCorrection
        };

        const updatedMatches = activeTournament.matches.map(match => {
            if (match.id === matchId) {
                let setsWonA = 0;
                let setsWonB = 0;
                let pointsForA = 0;
                let pointsForB = 0;

                // Bestimme Gewinnsätze basierend auf Spielphase
                const winningSets = match.phase === 'playoff' && activeTournament.settings.playoffWinningSets
                    ? activeTournament.settings.playoffWinningSets
                    : activeTournament.settings.winningSets;

                sets.forEach(set => {
                    if (set.scoreA !== null && set.scoreB !== null) {
                        pointsForA += set.scoreA;
                        pointsForB += set.scoreB;
                        if (set.scoreA > set.scoreB) setsWonA++;
                        else if (set.scoreB > set.scoreA) setsWonB++;
                    }
                });

                // Für Playoff-Spiele: Prüfe, ob das Spiel beendet ist
                if (match.phase === 'playoff') {
                    const isGameFinished = setsWonA >= winningSets || setsWonB >= winningSets;
                    if (isGameFinished) {
                        // Entferne überschüssige Sätze nach dem Spielende
                        const playedSets = setsWonA + setsWonB + sets.filter(s => s.scoreA === s.scoreB && s.scoreA !== null).length;
                        sets = sets.slice(0, playedSets);
                    }
                }

                return {
                    ...match,
                    sets,
                    setsWonA,
                    setsWonB,
                    pointsForA,
                    pointsForB,
                    scoreHistory: [] // Clear individual match history
                };
            }
            return match;
        });

        const versions = activeTournament.versions || [];
        const auditLog = activeTournament.auditLog || [];
        const updatedTournament = { 
            ...activeTournament, 
            matches: updatedMatches, 
            lastModified: new Date().toISOString(),
            versions: [...versions, version],
            auditLog: [...auditLog, auditEntry]
        };
        setActiveTournament(updatedTournament);
        
        const updatedTournaments = tournaments.map(t => t.id === updatedTournament.id ? updatedTournament : t);
        saveTournaments(updatedTournaments);
    }, [activeTournament, tournaments]);
    
    const handleSaveActiveTournament = () => {
        if (!activeTournament) return;
        const updatedTournament = { ...activeTournament, lastModified: new Date().toISOString() };
        const index = tournaments.findIndex(t => t.id === updatedTournament.id);
        const updatedTournaments = [...tournaments];
        if (index > -1) {
            updatedTournaments[index] = updatedTournament;
        } else {
            updatedTournaments.push(updatedTournament);
        }
        saveTournaments(updatedTournaments);
        setActiveTournament(updatedTournament); // Update auch das activeTournament State
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
    };

    // Backup/Restore Funktionen
    const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target?.result as string);
                
                // Prüfe ob es ein gültiges Backup ist
                if (backupData.tournaments && Array.isArray(backupData.tournaments)) {
                    // Bestätige die Wiederherstellung
                    if (confirm(`Backup vom ${new Date(backupData.exportDate).toLocaleString('de-DE')} wiederherstellen?\n\nDies überschreibt alle aktuellen Turniere!`)) {
                        saveTournaments(backupData.tournaments);
                        setShowSaveToast(true);
                        setTimeout(() => setShowSaveToast(false), 3000);
                    }
                } else {
                    alert('Ungültiges Backup-Format');
                }
            } catch (error) {
                console.error('Restore-Fehler:', error);
                alert('Fehler beim Wiederherstellen des Backups');
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    const handleCreateBackup = () => {
        try {
            const backupData = {
                tournaments,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `spielplan-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 3000);
        } catch (error) {
            console.error('Backup-Fehler:', error);
            alert('Fehler beim Erstellen des Backups');
        }
    };

    // Simple Password Gate
    const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
        const hasSession = sessionStorage.getItem('app-auth-ok') === 'true';
        if (FIXED_HASH) {
            return hasSession ? 'ok' : 'login';
        }
        const hasHash = localStorage.getItem('app-password-hash');
        if (!hasHash) return 'setup';
        return hasSession ? 'ok' : 'login';
    });
    const [authError, setAuthError] = useState<string | null>(null);

    const PasswordSetup: React.FC = () => {
        if (FIXED_HASH) return null; // Wenn fester Hash gesetzt, keine Einrichtung anbieten
        const [pw1, setPw1] = useState('');
        const [pw2, setPw2] = useState('');
        const [busy, setBusy] = useState(false);
        const strongEnough = pw1.length >= 8 && /[A-Z]/.test(pw1) && /[a-z]/.test(pw1) && /[0-9]/.test(pw1);

        const onSave = async () => {
            setAuthError(null);
            if (pw1 !== pw2) {
                setAuthError('Passwörter stimmen nicht überein.');
                return;
            }
            if (!strongEnough) {
                setAuthError('Das Passwort sollte mind. 8 Zeichen inkl. Groß-/Kleinbuchstaben und Zahl enthalten.');
                return;
            }
            setBusy(true);
            const hash = await sha256Hex(pw1);
            localStorage.setItem('app-password-hash', hash);
            sessionStorage.setItem('app-auth-ok', 'true');
            setBusy(false);
            setAuthStatus('ok');
        };

        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">App-Passwort festlegen</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Dieses Passwort schützt die App auf diesem Deployment.</p>
                    <div className="space-y-3">
                        <input type="password" placeholder="Neues Passwort" value={pw1} onChange={e=>setPw1(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600" />
                        <input type="password" placeholder="Passwort bestätigen" value={pw2} onChange={e=>setPw2(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Anforderung: mind. 8 Zeichen, Zahl, Groß- und Kleinbuchstaben.</p>
                        {authError && <div className="text-sm text-red-600 dark:text-red-400">{authError}</div>}
                        <button onClick={onSave} disabled={busy} className="w-full px-4 py-3 rounded-xl text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">{busy ? 'Speichere…' : 'Passwort speichern'}</button>
                    </div>
                </div>
            </div>
        );
    };

    const PasswordLogin: React.FC = () => {
        const [pw, setPw] = useState('');
        const [busy, setBusy] = useState(false);

        const onLogin = async () => {
            setAuthError(null);
            setBusy(true);
            try {
                const hash = await sha256Hex(pw);
                const stored = FIXED_HASH || localStorage.getItem('app-password-hash');
                if (stored && stored === hash) {
                    sessionStorage.setItem('app-auth-ok', 'true');
                    setAuthStatus('ok');
                } else {
                    setAuthError('Falsches Passwort.');
                }
            } finally {
                setBusy(false);
            }
        };

        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">App gesperrt</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Bitte geben Sie das App-Passwort ein.</p>
                    <div className="space-y-3">
                        <input type="password" placeholder="Passwort" value={pw} onChange={e=>setPw(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600" />
                        {authError && <div className="text-sm text-red-600 dark:text-red-400">{authError}</div>}
                        <button onClick={onLogin} disabled={busy} className="w-full px-4 py-3 rounded-xl text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">{busy ? 'Prüfe…' : 'Entsperren'}</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-200 transition-all duration-500 relative overflow-hidden">
            {/* Background decoration */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-200/30 to-secondary-200/30 dark:from-primary-800/20 dark:to-secondary-800/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary-200/30 to-primary-200/30 dark:from-secondary-800/20 dark:to-primary-800/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <Header />
            <main className="flex-grow container mx-auto p-4 md:p-8 relative z-10 animate-fade-in">
                {/* Custom Auth: Login/Registrieren */}
                {!currentUser && (
                    <div className="max-w-md mx-auto p-8 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-bold mb-4">Anmeldung</h2>
                        <div className="space-y-3">
                            <input type="email" placeholder="E-Mail" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
                            <input type="password" placeholder="Passwort" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
                            <div className="flex gap-3">
                                <button disabled={authBusy} onClick={async ()=>{ setAuthBusy(true); try{ const res=await fetch('/.netlify/functions/auth-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:authEmail,password:authPassword})}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Login fehlgeschlagen'); localStorage.setItem('auth_token', data.token); setCurrentUser(data.user); setIsAdmin(data.user?.role==='admin'); setView('dashboard'); await reloadFromDB(); }catch(e:any){ setErrorMsg(e.message||'Login fehlgeschlagen'); } finally{ setAuthBusy(false);} }} className="px-4 py-2 rounded bg-primary-600 text-white">{authBusy?'...':'Anmelden'}</button>
                                <button disabled={authBusy} onClick={async ()=>{ setAuthBusy(true); try{ const res=await fetch('/.netlify/functions/auth-register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:authEmail,password:authPassword})}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Registrierung fehlgeschlagen'); localStorage.setItem('auth_token', data.token); setCurrentUser(data.user); setIsAdmin(data.user?.role==='admin'); setView('dashboard'); await reloadFromDB(); }catch(e:any){ setErrorMsg(e.message||'Registrierung fehlgeschlagen'); } finally{ setAuthBusy(false);} }} className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">Registrieren</button>
                            </div>
                        </div>
                    </div>
                )}
                {currentUser && (
                    <>
                        {/* User-Info & Logout */}
                        <div className="flex justify-end mb-4 items-center gap-3">
                            <span className="text-sm text-slate-600 dark:text-slate-300">{currentUser.email}
                                {isAdmin && <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-amber-100 text-amber-800 border border-amber-300">Admin</span>}
                            </span>
                            {USE_DB && (
                                <button
                                    onClick={() => {
                                        const newOfflineMode = !offlineMode;
                                        setOfflineMode(newOfflineMode);
                                        localStorage.setItem('offline-mode', newOfflineMode.toString());
                                        if (!newOfflineMode) {
                                            // When going online, reload from cloud
                                            reloadFromDB();
                                        }
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm border ${effectiveOfflineMode 
                                        ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800' 
                                        : 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-800'
                                    }`}
                                    title={effectiveOfflineMode 
                                        ? (autoOfflineMode ? "Auto-Offline (keine Verbindung) - Klicken für manuell Offline" : "Offline-Modus aktiv - Klicken für Online")
                                        : "Online-Modus aktiv - Klicken für Offline"
                                    }
                                >
                                    {effectiveOfflineMode 
                                        ? (autoOfflineMode ? '📴 Auto-Offline' : '📴 Offline')
                                        : '🌐 Online'
                                    }
                                </button>
                            )}
                            <button
                                onClick={() => { localStorage.removeItem('auth_token'); setCurrentUser(null); setIsAdmin(false); setTournaments([]);} }
                                className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                title="Abmelden"
                            >
                                Abmelden
                            </button>
                        </div>
                        {view === 'dashboard' && (
                            <TournamentList
                                tournaments={tournaments}
                                onLoad={handleLoad}
                                onDelete={handleDelete}
                                onCreateNew={handleCreateNew}
                                onCreateBackup={handleCreateBackup}
                                onRestoreBackup={handleRestoreBackup}
                                dbMode={USE_DB}
                                isLoading={isLoading}
                            />
                        )}
                        {view === 'setup' && (
                            <TournamentSetupForm onGenerate={handleGenerate} onBack={handleBackToDashboard} />
                        )}
                        {view === 'display' && activeTournament && (
                            <ScheduleDisplay
                                key={activeTournament.lastModified} // Force re-mount on tournament changes
                                tournament={activeTournament}
                                onUpdateMatch={handleUpdateMatch}
                                onSave={handleSaveActiveTournament}
                                onUpdateTournament={(updatedTournament) => {
                                    setActiveTournament(updatedTournament);
                                    // Force immediate re-render by updating tournaments array too
                                    const updatedTournaments = tournaments.map(t => 
                                        t.id === updatedTournament.id ? updatedTournament : t
                                    );
                                    saveTournaments(updatedTournaments);
                                }}
                                onBackToDashboard={handleBackToDashboard}
                                showVersionHistory={showVersionHistory}
                                setShowVersionHistory={setShowVersionHistory}
                                showAuditLog={showAuditLog}
                                setShowAuditLog={setShowAuditLog}
                                touchMode={touchMode}
                            />
                        )}

            {/* Audit Log Modal */}
            {showAuditLog && activeTournament && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" aria-modal="true">
                    <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-4xl border-0 sm:border border-slate-200 dark:border-slate-700 sm:max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">📋 Audit-Log - Alle Änderungen</h3>
                                <button onClick={() => setShowAuditLog(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
                                <span className="text-amber-600 dark:text-amber-400">🔒</span>
                                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                    Unveränderliches Protokoll - Alle Einträge sind permanent und können nicht gelöscht werden
                                </p>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {(activeTournament.auditLog || []).length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8">Noch keine Änderungen protokolliert</p>
                            ) : (
                                <div className="space-y-3">
                                    {(activeTournament.auditLog || []).reverse().map((entry, index) => (
                                        <div key={entry.id} className={`p-4 rounded-lg border ${entry.isCorrection ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-medium ${entry.isCorrection ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {entry.isCorrection ? '🔧 Korrektur' : '📝 Änderung'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        Spiel {entry.matchId}: {entry.teamA} vs {entry.teamB}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(entry.timestamp).toLocaleString('de-DE')}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-slate-600 dark:text-slate-400">Vorher:</span>
                                                    <div className="text-slate-800 dark:text-slate-200">
                                                        {entry.oldSets.map((set, i) => (
                                                            <span key={i} className="mr-2">
                                                                {set.scoreA !== null && set.scoreB !== null ? `${set.scoreA}:${set.scoreB}` : '-:-'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-600 dark:text-slate-400">Nachher:</span>
                                                    <div className="text-slate-800 dark:text-slate-200">
                                                        {entry.newSets.map((set, i) => (
                                                            <span key={i} className="mr-2">
                                                                {set.scoreA !== null && set.scoreB !== null ? `${set.scoreA}:${set.scoreB}` : '-:-'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {entry.reason && (
                                                <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded border">
                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Begründung:</span>
                                                    <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{entry.reason}</p>
                                                </div>
                                            )}
                                            <div className="mt-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                                <span>Benutzer: {entry.userId}</span>
                                                {entry.action === 'reset' && (
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                                        🔄 Version wiederhergestellt
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Version History Modal */}
            {showVersionHistory && activeTournament && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4" aria-modal="true">
                    <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl border-0 sm:border border-slate-200 dark:border-slate-700 sm:max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Versionshistorie</h3>
                            <button onClick={() => setShowVersionHistory(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {(activeTournament.versions || []).length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8">Noch keine Versionen vorhanden</p>
                            ) : (
                                <div className="space-y-3">
                                    {(activeTournament.versions || []).reverse().map((version, index) => (
                                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{version.description}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {new Date(version.timestamp).toLocaleString('de-DE')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        // Create audit log entry for version restoration
                                                        const auditEntry: AuditLogEntry = {
                                                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                                            timestamp: new Date().toISOString(),
                                                            matchId: -1, // Special ID for version restoration
                                                            teamA: 'System',
                                                            teamB: 'Restore',
                                                            action: 'reset',
                                                            oldSets: [],
                                                            newSets: [],
                                                            reason: `Version vom ${new Date(version.timestamp).toLocaleString('de-DE')} wiederhergestellt`,
                                                            userId: currentUser?.email || 'Unbekannt',
                                                            isCorrection: false
                                                        };

                                                        const updatedTournament = { 
                                                            ...activeTournament, 
                                                            matches: JSON.parse(JSON.stringify(version.matches)),
                                                            lastModified: new Date().toISOString(),
                                                            // CRITICAL: Preserve audit log and add restoration entry
                                                            auditLog: [...(activeTournament.auditLog || []), auditEntry]
                                                        };
                                                        setActiveTournament(updatedTournament);
                                                        const updatedTournaments = tournaments.map(t => t.id === updatedTournament.id ? updatedTournament : t);
                                                        saveTournaments(updatedTournaments);
                                                        setShowVersionHistory(false);
                                                    }}
                                                    className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded"
                                                >
                                                    Wiederherstellen
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
                    </>
                )}
            </main>
            <Footer />
            {showSaveToast && (
                <div className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in-out z-50 border border-green-400/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="font-semibold">Erfolgreich in der Cloud gespeichert{lastApiAt ? ` • ${lastApiAt}` : ''}.</span>
                    </div>
                </div>
            )}
            {showSyncToast && (
                <div className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in-out z-50 border border-blue-400/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="font-semibold">🔄 Automatische Synchronisation mit der Cloud...</span>
                    </div>
                </div>
            )}
            {/* Cloud-Status Badge */}
            <div className="fixed top-24 right-6 z-40 print:hidden">
                <div className={`px-3 py-2 rounded-lg text-xs font-semibold border backdrop-blur-sm shadow ${lastApiOk === true ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700' : lastApiOk === false ? 'bg-red-50/80 border-red-200 text-red-700' : 'bg-slate-50/80 border-slate-200 text-slate-600'}`}>
                    {lastApiOk === null && 'Cloud: —'}
                    {lastApiOk === true && `Cloud: OK${lastApiAt ? ' • ' + lastApiAt : ''}`}
                    {lastApiOk === false && `Cloud: Fehler${lastApiAt ? ' • ' + lastApiAt : ''}`}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-out {
                    0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                    15% { opacity: 1; transform: translateY(0) scale(1); }
                    85% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-10px) scale(0.95); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 3s ease-in-out;
                }
            `}</style>
        </div>
    );
}
