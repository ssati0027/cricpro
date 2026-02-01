
export type MatchStatus = 'live' | 'inningsBreak' | 'completed';

export interface PlayerStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal?: string;
  fielder?: string;
  bowler?: string;
}

export interface BowlerStats {
  name: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
}

export interface BallRecord {
  ballId: string;
  runs: number;
  isExtra: boolean;
  extraType?: 'wide' | 'noball' | 'bye' | 'legbye';
  isWicket: boolean;
  wicketType?: string;
  fielderName?: string;
  striker: string;
  bowler: string;
  runsToBatsman?: boolean;
  manualStrikeRotate?: boolean; // Flag for manual strike swap
}

export interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  balls: number;
  extras: number;
  batsmen: PlayerStats[];
  bowlers: BowlerStats[];
  currentBatsmenNames: string[]; // Track who is currently in
  currentBowlerName: string | null;
  ballByBall: BallRecord[];
  currentOverBalls: BallRecord[];
}

export interface Match {
  id: string;
  team1: string;
  team2: string;
  totalOvers: number;
  password: string;
  status: MatchStatus;
  currentInnings: 1 | 2;
  innings: [Innings, Innings | null];
  allPlayers: Record<string, string[]>;
  lastSynced?: string;
}

export interface AppState {
  matches: Match[];
  currentMatchId: string | null;
  isScorer: boolean;
}
