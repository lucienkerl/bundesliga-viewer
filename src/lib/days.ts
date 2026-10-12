import type { LeagueData, Match, MatchDay } from '../../shared/types';

export const matchesOf = (day: MatchDay): Match[] => day.venues.flatMap((v) => v.matches);

/**
 * Day to show first: today's or the next upcoming day. If the season is over, the last day.
 * `today` is an ISO date ("2026-10-12").
 */
export function defaultDay(days: MatchDay[], today: string): MatchDay | undefined {
  return days.find((d) => d.date >= today) ?? days[days.length - 1];
}

export const isPlayed = (day: MatchDay): boolean => matchesOf(day).some((m) => m.played);

/** Match days on which the team still has an unplayed match. */
export function remainingMatchDays(data: LeagueData, team: string): number {
  return data.matchDays.filter((d) => matchesOf(d).some((m) => !m.played && (m.home === team || m.away === team))).length;
}

/** Shooters used by the team in its most recent played match, in lineup order. */
export function lastLineup(data: LeagueData, team: string): string[] {
  const played = data.matchDays.flatMap((d) => matchesOf(d)).filter((m) => m.played && (m.home === team || m.away === team));
  const last = played[played.length - 1];
  if (!last) return [];
  const side = last.home === team ? 'home' : 'away';
  return last.pairs.map((p) => p[side].name).filter((n): n is string => n !== null);
}
