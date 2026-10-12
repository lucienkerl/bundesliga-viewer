import type { LeagueData, LeagueRef } from '../../shared/types';

export interface DataIndex {
  generatedAt: string;
  leagues: (LeagueRef & { file: string })[];
}

const cache = new Map<string, Promise<unknown>>();

function getJson<T>(file: string): Promise<T> {
  let p = cache.get(file);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}data/${file}`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${file}`);
      return r.json();
    });
    cache.set(file, p);
    p.catch(() => cache.delete(file));
  }
  return p as Promise<T>;
}

export const loadIndex = () => getJson<DataIndex>('index.json');
export const loadLeague = (file: string) => getJson<LeagueData>(file);
