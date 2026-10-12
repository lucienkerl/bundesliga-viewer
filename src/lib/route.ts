import type { Discipline } from '../../shared/types';

export type View = 'tage' | 'tabelle' | 'teams';

export interface Route {
  discipline: Discipline;
  slug: string;
  view: View;
  /** Match day number for "tage", team name for "teams". */
  param: string | null;
}

export const DEFAULT_ROUTE: Route = { discipline: 'luftpistole', slug: '1-bl-sued', view: 'tage', param: null };

const VIEWS: View[] = ['tage', 'tabelle', 'teams'];

export function parseHash(hash: string, fallback: Route = DEFAULT_ROUTE): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [discipline, slug, view, param] = parts;
  if ((discipline !== 'luftpistole' && discipline !== 'luftgewehr') || !slug) return fallback;
  return {
    discipline,
    slug,
    view: VIEWS.includes(view as View) ? (view as View) : 'tage',
    param: param ? decodeURIComponent(param) : null,
  };
}

export function buildHash(r: Route): string {
  const base = `#/${r.discipline}/${r.slug}/${r.view}`;
  return r.param ? `${base}/${encodeURIComponent(r.param)}` : base;
}

export const leagueId = (r: Pick<Route, 'discipline' | 'slug'>): string => `${r.discipline}/${r.slug}`;
