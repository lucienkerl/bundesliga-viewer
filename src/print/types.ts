import type { Match } from '../../shared/types';

export interface SheetContext {
  /** e.g. "Luftpistole 1. Bundesliga Süd" */
  league: string;
  day: number;
  /** ISO date */
  date: string;
  match: Match;
  /** Absolute logo URLs, or null. */
  homeLogo: string | null;
  awayLogo: string | null;
}
