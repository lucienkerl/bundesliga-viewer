/** A scheduled match start: ISO date and local DSB time ("15:00"), or null if the time is unknown. */
export interface Slot {
  date: string;
  time: string | null;
}

export interface WindowOptions {
  /** Minutes before a match start in which crawling is useful (lineups, schedule changes). */
  beforeMin: number;
  /** Minutes after a match start in which results are still coming in. */
  afterMin: number;
}

export const DEFAULT_WINDOW: WindowOptions = { beforeMin: 30, afterMin: 150 };

/** Current date and minutes since midnight in Germany, independent of the runner time zone. */
export function berlinNow(now: Date): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/**
 * True when `now` is within the window of any match slot of today. A slot without a usable time keeps
 * the whole day open. The union of per-match windows covers the gaps between matches of the same day.
 */
export function crawlWindowOpen(slots: Slot[], now: Date, opts: WindowOptions = DEFAULT_WINDOW): boolean {
  const today = berlinNow(now);
  for (const slot of slots) {
    if (slot.date !== today.date) continue;
    const m = /^(\d{1,2}):(\d{2})$/.exec(slot.time ?? '');
    if (!m) return true;
    const start = Number(m[1]) * 60 + Number(m[2]);
    if (today.minutes >= start - opts.beforeMin && today.minutes <= start + opts.afterMin) return true;
  }
  return false;
}
