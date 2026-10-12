import type { Setlist, SetlistEntry } from './types.js';

export interface LineupCheck {
  /** Chosen shooters in the order of the official seeding list (positions 1 to 5). */
  order: SetlistEntry[];
  errors: string[];
}

/**
 * Orders the chosen shooters by the official seeding list and checks the rules:
 * five shooters, at most one foreign shooter (Ligaordnung 3.1.3).
 */
export function checkLineup(setlist: Setlist, chosenNames: string[]): LineupCheck {
  const order = setlist.entries.filter((e) => chosenNames.includes(e.name)).sort((a, b) => a.rank - b.rank);
  const errors: string[] = [];
  if (order.length !== 5) errors.push(`${order.length} von 5 Schützen gewählt.`);
  const foreign = order.filter((e) => e.foreign !== null);
  if (foreign.length > 1) errors.push('Mehr als ein Ausländer (A) pro Mannschaft ist nicht erlaubt.');
  return { order, errors };
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
