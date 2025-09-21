
export interface TournamentVersion {
  timestamp: string;
  description: string;
  matches: Match[];
}

export interface ScoreVersion {
  timestamp: string;
  sets: { scoreA: number | null; scoreB: number | null }[];
  pointsForA: number;
  pointsForB: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  matchId: number;
  teamA: string;
  teamB: string;
  action: 'score_change' | 'correction' | 'reset';
  oldSets: { scoreA: number | null; scoreB: number | null }[];
  newSets: { scoreA: number | null; scoreB: number | null }[];
  reason?: string;
  userId?: string;
  isCorrection: boolean;
}

export interface TournamentSettings {
  name: string;
  numTeams: number;
  teamNames: string[];
  numFields: number;
  fieldNames: string[];
  gameDuration: number;
  breakDuration: number;
  startTime: string;
  winningSets: number; // e.g., 2 for best-of-3
  // New: scoring & tie-breaking
  scoringMode?: 'per_set' | 'match_321' | 'match_210' | 'match_10';
  allowDraws?: boolean; // only relevant for modes that allow draws (e.g., fixed 2 sets)
  tiebreakers?: Array<'points' | 'setDiff' | 'ballDiff' | 'headToHead' | 'teamName'>;
  doubleRoundRobin?: boolean; // Hin- und Rückrunde
  // Endrunden-System
  playoffMode?: 'none' | 'direct_final' | 'semi_final' | 'top4_roundrobin' | 'top6_roundrobin';
  playoffTeams?: number; // Anzahl qualifizierter Teams (2, 4, 6, 8)
  // Endrunden-spezifische Spielregeln (vereinfacht)
  playoffScoringMode?: 'per_set' | 'match_321' | 'match_210' | 'match_10';
  playoffAllowDraws?: boolean; // Immer false für Endrunden
  playoffWinningSets?: number; // Anzahl Gewinnsätze für Endrunde
  playoffMaxSets?: number; // Maximale Anzahl Sätze pro Spiel
}

export interface Match {
  id: number;
  round: number;
  time: string;
  field: string;
  teamA: string;
  teamB: string;
  sets: { scoreA: number | null; scoreB: number | null }[];
  setsWonA: number;
  setsWonB: number;
  pointsForA: number;
  pointsForB: number;
  scoreHistory: ScoreVersion[];
  phase?: 'group' | 'playoff'; // Hauptrunde oder Endrunde
  playoffRound?: string; // z.B. "Halbfinale", "Finale", "Spiel um Platz 3"
}

export interface Standing {
  rank: number;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
}

export interface SavedTournament {
  id: string;
  lastModified: string;
  settings: TournamentSettings;
  matches: Match[];
  versions?: TournamentVersion[];
  auditLog?: AuditLogEntry[];
}
