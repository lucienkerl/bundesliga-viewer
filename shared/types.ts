export type Discipline = 'luftpistole' | 'luftgewehr';

export interface LeagueRef {
  /** Stable id, e.g. "luftpistole/1-bl-sued". */
  id: string;
  discipline: Discipline;
  slug: string;
  /** Human readable, e.g. "1. BL Süd". */
  name: string;
  url: string;
}

export interface TableRow {
  rank: number;
  team: string;
  /** "10:0" as shown by the DSB. */
  singlePoints: string;
  teamPoints: string;
}

export interface Shooter {
  /** "Surname, Given name". null when the DSB shows "Schütze nicht gesetzt". */
  name: string | null;
  /** Ring total of the four regular series. */
  total: number;
  series: number[];
  /** Result of the shoot-off (Stechen) when the pair was tied, otherwise null. */
  shootOff: number | null;
}

export interface Pair {
  position: number;
  home: Shooter;
  away: Shooter;
  homePoint: number;
  awayPoint: number;
}

export interface Match {
  number: number;
  time: string;
  home: string;
  away: string;
  homeRings: number;
  awayRings: number;
  homePoints: number;
  awayPoints: number;
  /** True once any ring or point is recorded. */
  played: boolean;
  pairs: Pair[];
}

export interface Venue {
  host: string;
  hall: string;
  street: string;
  city: string;
  phone: string | null;
  referee: string | null;
  matches: Match[];
}

export interface MatchDay {
  number: number;
  /** ISO date, e.g. "2026-10-10". */
  date: string;
  venues: Venue[];
}

export interface TeamRef {
  name: string;
  setlistUrl: string | null;
  clubUrl: string | null;
}

export interface SetlistEntry {
  /** Rank in the official list. */
  rank: number;
  name: string;
  /** Foreign marker as shown by the DSB ("A", "AS", "EU") or null. */
  foreign: string | null;
  /** Raw status as shown by the DSB: "S" (Stamm), "E" (Ersatz), "F" (Stamm after three starts). */
  status: string;
  /** Start average from the previous season. 0 when the DSB has none. */
  startAverage: number;
  /** Result per match day, 0 = did not shoot. */
  results: number[];
}

export interface Setlist {
  /** Local DSB time of the list ("2026-09-23T20:33"), or null. */
  updatedAt: string | null;
  entries: SetlistEntry[];
}

export interface Club {
  name: string;
  federation: string | null;
  street: string | null;
  city: string | null;
  website: string | null;
}

export interface Team {
  name: string;
  setlist: Setlist | null;
  clubUrl: string | null;
  club: Club | null;
}

export interface LeagueData {
  league: LeagueRef;
  table: TableRow[];
  matchDays: MatchDay[];
  teams: Team[];
}
