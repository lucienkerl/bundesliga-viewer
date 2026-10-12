import type { Setlist, SetlistEntry } from './types.js';

export type SeatStatus = 'stamm' | 'ersatz' | 'f';

export interface SeedingRow {
  /** Rank in the official DSB list. */
  officialRank: number;
  /** Rank in the calculated list. */
  calculatedRank: number;
  name: string;
  foreign: string | null;
  /** Results of match days on which the shooter started. */
  results: number[];
  starts: number;
  startAverage: number;
  /** Average of all season results, or the start average when there is none. */
  average: number;
  /** True when the average is the start average of the DSB (no season result yet). */
  usesStartAverage: boolean;
  /** True when there is neither a season result nor a start average. */
  noBasis: boolean;
  status: SeatStatus;
  /** For substitutes: starts still missing until they become regular shooters (F). */
  startsUntilF: number | null;
  /** officialRank - calculatedRank, positive = moves up. */
  movement: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** A result of 0 means "did not shoot" on the DSB page. */
const shot = (r: number) => r > 0;

function statusOf(entry: SetlistEntry, starts: number): { status: SeatStatus; startsUntilF: number | null } {
  const raw = entry.status.toUpperCase();
  if (raw === 'F') return { status: 'f', startsUntilF: null };
  if (raw === 'S') return { status: 'stamm', startsUntilF: null };
  // Ersatz: becomes a regular shooter (F) after three starts (Ausschreibung 3.9).
  if (starts >= 3) return { status: 'f', startsUntilF: null };
  return { status: 'ersatz', startsUntilF: 3 - starts };
}

/**
 * Calculates the seeding list from season results (Ausschreibung LG/LP 1.5.3).
 * The average is the mean of all results of the current season, rounded to two decimals.
 * Shooters without a season result keep their start average. Shooters with neither go to the
 * end. Ties keep the order of the official list.
 * This is a preview only; the official list of the league management is binding.
 */
export function calculateSeeding(setlist: Setlist): SeedingRow[] {
  const rows = setlist.entries.map((entry) => {
    const results = entry.results.filter(shot);
    const starts = results.length;
    const usesStartAverage = starts === 0;
    const average = usesStartAverage ? entry.startAverage : round2(results.reduce((a, b) => a + b, 0) / starts);
    const noBasis = usesStartAverage && entry.startAverage <= 0;
    return { entry, results, starts, usesStartAverage, average, noBasis };
  });

  const sorted = rows.slice().sort((a, b) => {
    if (a.noBasis !== b.noBasis) return a.noBasis ? 1 : -1;
    if (a.average !== b.average) return b.average - a.average;
    return a.entry.rank - b.entry.rank;
  });

  return sorted.map((r, i) => {
    const { status, startsUntilF } = statusOf(r.entry, r.starts);
    return {
      officialRank: r.entry.rank,
      calculatedRank: i + 1,
      name: r.entry.name,
      foreign: r.entry.foreign,
      results: r.results,
      starts: r.starts,
      startAverage: r.entry.startAverage,
      average: r.average,
      usesStartAverage: r.usesStartAverage,
      noBasis: r.noBasis,
      status,
      startsUntilF,
      movement: r.entry.rank - (i + 1),
    };
  });
}
