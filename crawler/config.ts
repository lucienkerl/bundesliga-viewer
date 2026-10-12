import type { Discipline, LeagueRef } from '../shared/types.js';

const BASE = 'https://bundesliga.dsb.de';

const SLUGS: Record<Discipline, string[]> = {
  luftpistole: ['1-bl-nord', '1-bl-sued', '2-bl-nord', '2-bl-ost', '2-bl-west', '2-bl-suedwest', '2-bl-sued'],
  luftgewehr: ['1-bl-nord', '1-bl-sued', '2-bl-nord', '2-bl-ost', '2-bl-west', '2-bl-suedwest', '2-bl-sued'],
};

const REGION: Record<string, string> = { nord: 'Nord', sued: 'Süd', ost: 'Ost', west: 'West', suedwest: 'Südwest' };

export function leagueName(slug: string): string {
  const [tier, , region = ''] = slug.split('-');
  return `${tier}. BL ${REGION[region] ?? region}`;
}

export const LEAGUES: LeagueRef[] = (Object.keys(SLUGS) as Discipline[]).flatMap((discipline) =>
  SLUGS[discipline].map((slug) => ({
    id: `${discipline}/${slug}`,
    discipline,
    slug,
    name: leagueName(slug),
    url: `${BASE}/${discipline}/${slug}`,
  })),
);

export const DATA_DIR = 'public/data';
export const USER_AGENT = 'bundesliga-viewer/0.1 (open-source results viewer; polite crawler)';
export const REQUEST_DELAY_MS = 400;
