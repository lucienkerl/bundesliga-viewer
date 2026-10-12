import { calculateSeeding } from './seeding.js';
import type { Setlist, SetlistEntry } from './types.js';

export type LineupOrder = 'official' | 'calculated';

export interface LineupCheck {
  /** Chosen shooters in the requested order (positions 1 to 5). */
  order: SetlistEntry[];
  errors: string[];
  /** True when the calculated order differs from the official one (only set for `calculated`). */
  differsFromOfficial: boolean;
}

/**
 * Orders the chosen shooters by the official seeding list (binding) or by the calculated average
 * (preview) and checks the rules: five shooters, at most one foreign shooter (Ligaordnung 3.1.3).
 */
export function checkLineup(setlist: Setlist, chosenNames: string[], by: LineupOrder = 'official'): LineupCheck {
  const chosen = setlist.entries.filter((e) => chosenNames.includes(e.name));
  const official = chosen.slice().sort((a, b) => a.rank - b.rank);
  let order = official;
  if (by === 'calculated') {
    const rank = new Map(calculateSeeding(setlist).map((r) => [r.name, r.calculatedRank]));
    order = chosen.slice().sort((a, b) => (rank.get(a.name) ?? 99) - (rank.get(b.name) ?? 99));
  }
  const differsFromOfficial = order.some((e, i) => e.name !== official[i]?.name);
  const errors: string[] = [];
  if (order.length !== 5) errors.push(`${order.length} von 5 Schützen gewählt.`);
  const foreign = order.filter((e) => e.foreign !== null);
  if (foreign.length > 1) errors.push('Mehr als ein Ausländer (A) pro Mannschaft ist nicht erlaubt.');
  return { order, errors, differsFromOfficial };
}

/**
 * Best five by the calculated list with at most one foreign shooter.
 * `calculatedOrder` must already be sorted best first.
 */
export function suggestLineup<T extends { foreign: string | null }>(calculatedOrder: T[]): T[] {
  const picked: T[] = [];
  let hasForeign = false;
  for (const row of calculatedOrder) {
    if (picked.length === 5) break;
    if (row.foreign && hasForeign) continue;
    picked.push(row);
    if (row.foreign) hasForeign = true;
  }
  return picked;
}
