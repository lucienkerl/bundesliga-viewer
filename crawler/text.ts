export const clean = (s: string | undefined | null): string => (s ?? '').replace(/\s+/g, ' ').trim();

export const toInt = (s: string): number => {
  const n = Number.parseInt(clean(s), 10);
  return Number.isNaN(n) ? 0 : n;
};

/** "10.10.2026" -> "2026-10-10". Returns null if the input has no date. */
export const toIsoDate = (s: string): string | null => {
  const m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

/** "23.09.2026 20:33" -> "2026-09-23T20:33" (local DSB time, no zone). */
export const toIsoDateTime = (s: string): string | null => {
  const m = /(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/.exec(s);
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}` : null;
};
