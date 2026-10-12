import { de } from '../i18n/de';
import type { Discipline, LeagueRef } from '../../shared/types';

export const esc = (s: string | number): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

/** 385.3333 -> "385,33" */
export const avg = (n: number): string => n.toFixed(2).replace('.', ',');

export const disciplineLabel = (d: Discipline): string => de.disciplines[d];

/** "1. BL Süd" -> "1. Bundesliga Süd" */
export const leagueLong = (l: LeagueRef): string => l.name.replace('BL', 'Bundesliga');

export const leagueTitle = (l: LeagueRef): string => `${disciplineLabel(l.discipline)} ${leagueLong(l)}`;

const parse = (iso: string) => new Date(`${iso}T00:00:00`);

/** "2026-10-10" -> "10.10." */
export const dayMonth = (iso: string): string => {
  const [, m = '', d = ''] = iso.split('-');
  return `${d}.${m}.`;
};

/** "2026-10-10" -> "10.10.2026" */
export const fullDate = (iso: string): string => iso.split('-').reverse().join('.');

/** "2026-10-10" -> "Sa., 10.10." */
export const weekdayDate = (iso: string): string =>
  parse(iso).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });

/** "2026-09-23T20:33" -> "23.09.2026, 20:33" */
export const dateTime = (iso: string): string => {
  const [date = '', time = ''] = iso.split('T');
  return `${fullDate(date)}, ${time.slice(0, 5)}`;
};

export const slugify = (s: string): string => encodeURIComponent(s);
