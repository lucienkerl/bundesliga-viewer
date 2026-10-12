import type { LeagueData } from '../../shared/types';
import type { Route } from '../lib/route';

export type SetlistView = 'cmp' | 'off' | 'calc';
export type LineupMode = 'auto' | 'pick';
export type LineupSort = 'official' | 'calculated';

export interface UiState {
  /** Keys ("day-venue-match") of expanded match cards. */
  open: Set<string>;
  setlistView: SetlistView;
  lineupMode: LineupMode;
  /** Sort order of the chosen lineup. */
  lineupSort: LineupSort;
  /** Chosen lineup per "<league>|<team>". */
  picks: Map<string, string[]>;
}

export interface ViewContext {
  data: LeagueData;
  route: Route;
  ui: UiState;
  /** ISO date of today. */
  today: string;
}

export const matchKey = (day: number, venue: number, match: number): string => `${day}-${venue}-${match}`;
