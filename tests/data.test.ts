import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { LeagueData } from '../shared/types';

const dir = new URL('../public/data/', import.meta.url);
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json') : [];

describe.skipIf(files.length === 0)('crawled data invariants', () => {
  for (const file of files) {
    const data = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as LeagueData;
    it(`${data.league.id}: played matches are consistent`, () => {
      for (const day of data.matchDays) {
        for (const match of day.venues.flatMap((v) => v.matches).filter((m) => m.played)) {
          expect(match.pairs.length).toBeGreaterThan(0);
          for (const pair of match.pairs) {
            for (const s of [pair.home, pair.away]) {
              expect(s.series.reduce((a, b) => a + b, 0), `${match.home} vs ${match.away}, ${s.name}`).toBe(s.total);
            }
          }
          expect(match.pairs.reduce((a, p) => a + p.home.total, 0), `${match.home}`).toBe(match.homeRings);
          expect(match.pairs.reduce((a, p) => a + p.away.total, 0), `${match.away}`).toBe(match.awayRings);
        }
      }
    });

    it(`${data.league.id}: every team has a setlist when setlists were crawled`, () => {
      expect(data.teams.length).toBe(data.table.length);
    });
  }
});
