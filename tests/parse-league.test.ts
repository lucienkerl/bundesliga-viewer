import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseLeaguePage, parseMatchesHtml } from '../crawler/parse-league';

const html = readFileSync(new URL('../crawler/fixtures/lp-1-bl-sued.html', import.meta.url), 'utf8');
const page = parseLeaguePage(html, 'https://bundesliga.dsb.de/luftpistole/1-bl-sued');

describe('parseLeaguePage (1. BL Süd, after weekend 1)', () => {
  it('reads the table', () => {
    expect(page.table).toHaveLength(12);
    expect(page.table[0]).toEqual({ rank: 1, team: 'ESV Weil am Rhein', singlePoints: '10:0', teamPoints: '4:0' });
    expect(page.table[11]?.team).toBe('SG 1928 Glattbach');
  });

  it('collects team links', () => {
    const lud = page.teams.find((t) => t.name === 'SGi Ludwigsburg');
    expect(lud?.setlistUrl).toContain('tx_piidatash_setlist');
    expect(lud?.setlistUrl?.startsWith('https://bundesliga.dsb.de/')).toBe(true);
    expect(lud?.clubUrl).toContain('/verein/show/club/');
  });

  it('reads all eleven match days with dates', () => {
    expect(page.matchDays).toHaveLength(11);
    expect(page.matchDays[0]).toMatchObject({ number: 1, date: '2026-10-10' });
    expect(page.matchDays[10]).toMatchObject({ number: 11, date: '2027-01-10' });
  });

  it('reads venues, referee and matches of match day 1', () => {
    const day = page.matchDays[0]!;
    expect(day.venues).toHaveLength(2);
    expect(day.venues[0]).toMatchObject({ host: 'SSG RWS Fürth', city: '90587 Veitsbronn', referee: 'Köhler, Gerhard' });
    expect(day.venues[0]?.matches).toHaveLength(3);
  });

  it('reads a played match with pairs and series', () => {
    const match = page.matchDays[0]!.venues[0]!.matches[0]!;
    expect(match).toMatchObject({
      home: 'SV Hubertus Hitzhofen-Oberzell',
      away: 'Sgi Waldenburg',
      homeRings: 1851,
      awayRings: 1880,
      homePoints: 2,
      awayPoints: 3,
      played: true,
    });
    expect(match.pairs).toHaveLength(5);
    expect(match.pairs[0]).toEqual({
      position: 1,
      home: { name: 'Negler, Stefan', total: 366, series: [92, 90, 94, 90], shootOff: null },
      away: { name: 'Fouquet, Florian', total: 382, series: [94, 94, 95, 99], shootOff: null },
      homePoint: 0,
      awayPoint: 1,
    });
  });

  it('marks future matches as not played and shooters as not set', () => {
    const match = page.matchDays[2]!.venues[0]!.matches[0]!;
    expect(match.played).toBe(false);
    expect(match.pairs[0]?.home.name).toBeNull();
  });

  it('keeps total equal to the sum of series for played pairs', () => {
    for (const day of page.matchDays) {
      for (const venue of day.venues) {
        for (const match of venue.matches.filter((m) => m.played)) {
          for (const pair of match.pairs) {
            for (const s of [pair.home, pair.away]) {
              expect(s.series.reduce((a, b) => a + b, 0)).toBe(s.total);
            }
          }
          const homeSum = match.pairs.reduce((a, p) => a + p.home.total, 0);
          expect(homeSum).toBe(match.homeRings);
        }
      }
    }
  });
});

describe('shoot-off (Stechen)', () => {
  const [match] = parseMatchesHtml(readFileSync(new URL('../crawler/fixtures/match-shootoff.html', import.meta.url), 'utf8'));

  it('keeps ring totals correct although the DSB shows the shoot-off in the home total cell', () => {
    expect(match).toBeDefined();
    const tied = match!.pairs.filter((p) => p.home.shootOff !== null);
    expect(tied.length).toBeGreaterThan(0);
    for (const pair of tied) {
      expect(pair.home.total).toBe(pair.away.total);
      expect(pair.home.series).toHaveLength(4);
      expect(pair.home.shootOff! > pair.away.shootOff!).toBe(pair.homePoint === 1);
    }
  });

  it('adds up to the team ring total', () => {
    expect(match!.pairs.reduce((a, p) => a + p.home.total, 0)).toBe(match!.homeRings);
    expect(match!.pairs.reduce((a, p) => a + p.away.total, 0)).toBe(match!.awayRings);
  });
});
