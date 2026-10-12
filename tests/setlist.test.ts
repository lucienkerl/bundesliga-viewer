import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseClub, parseSetlist } from '../crawler/parse-setlist';
import { checkLineup, suggestLineup } from '../shared/lineup';
import { calculateSeeding } from '../shared/seeding';

const fixture = (name: string) => readFileSync(new URL(`../crawler/fixtures/${name}`, import.meta.url), 'utf8');
const setlist = parseSetlist(fixture('setlist-ludwigsburg.html'));

describe('parseSetlist (SGi Ludwigsburg, DSB list of 23.09.2026)', () => {
  it('reads all twelve entries in official order', () => {
    expect(setlist.entries).toHaveLength(12);
    expect(setlist.entries.map((e) => e.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(setlist.updatedAt).toBe('2026-09-23T20:33');
  });

  it('reads foreign marker, status, start average and results', () => {
    expect(setlist.entries[0]).toMatchObject({ name: 'Goberville, Celine', foreign: 'A', status: 'E', startAverage: 385.33 });
    expect(setlist.entries[3]).toMatchObject({ name: 'Goberville, Sandrine', foreign: 'A', status: 'S', startAverage: 376 });
    expect(setlist.entries[3]?.results.slice(0, 3)).toEqual([373, 369, 0]);
    expect(setlist.entries[11]).toMatchObject({ name: 'Kerl, Lucien', foreign: null, status: 'E', startAverage: 0 });
    expect(setlist.entries[0]?.results).toHaveLength(11);
  });
});

describe('calculateSeeding', () => {
  const rows = calculateSeeding(setlist);
  const byName = (n: string) => rows.find((r) => r.name === n)!;

  it('uses the season average once a shooter has results', () => {
    expect(byName('Schmidt, Florian Daniel')).toMatchObject({ average: 377.5, starts: 2, usesStartAverage: false });
    expect(byName('Goberville, Sandrine').average).toBe(371);
  });

  it('keeps the start average for shooters without season results', () => {
    expect(byName('Goberville, Celine')).toMatchObject({ average: 385.33, usesStartAverage: true, starts: 0 });
  });

  it('produces the expected order after weekend 1', () => {
    expect(rows.map((r) => r.name)).toEqual([
      'Goberville, Celine',
      'Voutilainen, Sampo',
      'Zechmeister, Richard',
      'Schmidt, Florian Daniel',
      'Kerl, Lucien',
      'Reitz, Florian',
      'Goberville, Sandrine',
      'Hlousek, Julia',
      'Spinella, Massimo',
      'Miklis, André',
      'Müller, Emanuel',
      'Potteck, René',
    ]);
  });

  it('reports movement against the official list', () => {
    expect(byName('Kerl, Lucien').movement).toBe(7);
    expect(byName('Schmidt, Florian Daniel').movement).toBe(3);
    expect(byName('Miklis, André').movement).toBe(-4);
  });

  it('tracks substitute status towards F', () => {
    expect(byName('Kerl, Lucien')).toMatchObject({ status: 'ersatz', startsUntilF: 1 });
    expect(byName('Reitz, Florian').status).toBe('stamm');
  });

  it('puts shooters without any basis at the end', () => {
    const custom = { updatedAt: null, entries: [
      { rank: 1, name: 'New, Shooter', foreign: null, status: 'E', startAverage: 0, results: [0, 0] },
      { rank: 2, name: 'Old, Shooter', foreign: null, status: 'S', startAverage: 360, results: [0, 0] },
    ] };
    const r = calculateSeeding(custom);
    expect(r.map((x) => x.name)).toEqual(['Old, Shooter', 'New, Shooter']);
    expect(r[1]?.noBasis).toBe(true);
  });

  it('keeps the official order on ties', () => {
    const tie = { updatedAt: null, entries: [
      { rank: 1, name: 'A', foreign: null, status: 'S', startAverage: 370, results: [370] },
      { rank: 2, name: 'B', foreign: null, status: 'S', startAverage: 360, results: [370] },
    ] };
    expect(calculateSeeding(tie).map((x) => x.name)).toEqual(['A', 'B']);
  });
});

describe('lineup', () => {
  it('orders the real lineup of match day 2 by the official list and accepts it', () => {
    const check = checkLineup(setlist, ['Kerl, Lucien', 'Schmidt, Florian Daniel', 'Miklis, André', 'Reitz, Florian', 'Goberville, Sandrine']);
    expect(check.errors).toEqual([]);
    expect(check.order.map((e) => e.name)).toEqual(['Goberville, Sandrine', 'Reitz, Florian', 'Miklis, André', 'Schmidt, Florian Daniel', 'Kerl, Lucien']);
  });

  it('rejects two foreign shooters and wrong team size', () => {
    const check = checkLineup(setlist, ['Goberville, Celine', 'Goberville, Sandrine', 'Reitz, Florian']);
    expect(check.errors).toHaveLength(2);
  });

  it('suggests the best five with at most one foreign shooter', () => {
    const s = suggestLineup(calculateSeeding(setlist));
    expect(s.map((r) => r.name)).toEqual(['Goberville, Celine', 'Schmidt, Florian Daniel', 'Kerl, Lucien', 'Reitz, Florian', 'Hlousek, Julia']);
  });
});

describe('parseClub', () => {
  it('reads name, federation, address and website only', () => {
    expect(parseClub(fixture('club-ludwigsburg.html'))).toEqual({
      name: 'SGi Ludwigsburg',
      federation: 'Württembergischer Schützenverband',
      street: 'Kugelberg 28A',
      city: '71642 Ludwigsburg',
      website: 'https://www.sgi-lb.de',
    });
  });
});
