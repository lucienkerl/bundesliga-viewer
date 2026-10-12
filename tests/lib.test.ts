import { describe, expect, it } from 'vitest';
import type { LeagueData, MatchDay } from '../shared/types';
import { defaultDay, lastLineup, remainingMatchDays } from '../src/lib/days';
import { avg, dateTime, dayMonth, esc, fullDate, leagueLong } from '../src/lib/format';
import { buildHash, parseHash } from '../src/lib/route';

const match = (home: string, away: string, played: boolean, names: string[] = []) => ({
  number: 1, time: '10:00', home, away, homeRings: 0, awayRings: 0, homePoints: 0, awayPoints: 0, played,
  pairs: names.map((n, i) => ({
    position: i + 1,
    home: { name: n, total: 1, series: [], shootOff: null },
    away: { name: `${n}-away`, total: 1, series: [], shootOff: null },
    homePoint: 1, awayPoint: 0,
  })),
});
const day = (number: number, date: string, matches: ReturnType<typeof match>[]): MatchDay => ({
  number, date, venues: [{ host: 'H', hall: '', street: '', city: '', phone: null, referee: null, matches }],
});
const data = {
  matchDays: [day(1, '2026-10-10', [match('A', 'B', true, ['x', 'y'])]), day(2, '2026-10-24', [match('A', 'C', false)]), day(3, '2026-11-14', [match('B', 'A', false)])],
} as unknown as LeagueData;

describe('route', () => {
  it('parses and rebuilds hashes', () => {
    const r = parseHash('#/luftpistole/1-bl-sued/teams/SGi%20Ludwigsburg');
    expect(r).toEqual({ discipline: 'luftpistole', slug: '1-bl-sued', view: 'teams', param: 'SGi Ludwigsburg' });
    expect(buildHash(r)).toBe('#/luftpistole/1-bl-sued/teams/SGi%20Ludwigsburg');
  });
  it('falls back for unknown hashes and views', () => {
    expect(parseHash('#/foo/bar').slug).toBe('1-bl-sued');
    expect(parseHash('#/luftgewehr/1-bl-nord/xyz').view).toBe('tage');
  });
});

describe('days', () => {
  it('shows today or the next upcoming day, else the last one', () => {
    expect(defaultDay(data.matchDays, '2026-10-12')?.number).toBe(2);
    expect(defaultDay(data.matchDays, '2026-10-24')?.number).toBe(2);
    expect(defaultDay(data.matchDays, '2027-01-01')?.number).toBe(3);
    expect(defaultDay([], '2026-10-12')).toBeUndefined();
  });
  it('counts remaining match days of a team', () => {
    expect(remainingMatchDays(data, 'A')).toBe(2);
    expect(remainingMatchDays(data, 'C')).toBe(1);
  });
  it('reads the last lineup of a team', () => {
    expect(lastLineup(data, 'A')).toEqual(['x', 'y']);
    expect(lastLineup(data, 'B')).toEqual(['x-away', 'y-away']);
    expect(lastLineup(data, 'C')).toEqual([]);
  });
});

describe('format', () => {
  it('formats numbers, dates and names', () => {
    expect(avg(385.3333)).toBe('385,33');
    expect(fullDate('2026-10-10')).toBe('10.10.2026');
    expect(dayMonth('2026-10-10')).toBe('10.10.');
    expect(dateTime('2026-09-23T20:33')).toBe('23.09.2026, 20:33');
    expect(leagueLong({ name: '2. BL Südwest' } as never)).toBe('2. Bundesliga Südwest');
  });
  it('escapes HTML from crawled data', () => {
    expect(esc('<img src=x onerror="a">&\'')).toBe('&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
  });
});
