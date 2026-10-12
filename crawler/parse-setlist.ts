import * as cheerio from 'cheerio';
import type { Club, Setlist, SetlistEntry } from '../shared/types.js';
import { clean, toInt, toIsoDateTime } from './text.js';

/** Parses the HTML fragment returned by the DSB "Setzliste anzeigen" button. */
export function parseSetlist(html: string): Setlist {
  const $ = cheerio.load(html);
  const entries: SetlistEntry[] = [];

  $('table tbody tr').each((_, tr) => {
    const row = $(tr);
    const rank = toInt(row.find('th[scope=row]').text());
    const cells = row.find('td');
    if (!rank || cells.length < 4) return;
    const average = Number.parseFloat(clean(cells.eq(3).text()));
    entries.push({
      rank,
      name: clean(cells.eq(0).text()),
      foreign: clean(cells.eq(1).text()) || null,
      status: clean(cells.eq(2).text()),
      startAverage: Number.isFinite(average) ? average : 0,
      results: cells
        .slice(4)
        .map((__, c) => toInt($(c).text()))
        .get(),
    });
  });

  if (entries.length === 0) throw new Error('No setlist rows found: the DSB markup may have changed');
  return { updatedAt: toIsoDateTime($('[title="zuletzt aktualisiert"]').text()), entries };
}

/** Parses a DSB club page. Contact persons and e-mail addresses are deliberately not read. The logo is only returned as a URL. */
export type ParsedClub = Omit<Club, 'logo'> & { logoUrl: string | null };

export function parseClub(html: string): ParsedClub {
  const $ = cheerio.load(html);
  const header = $('.verein-header').first();
  const box = $('.verein-detail-content .card-body').first();
  const lines = box
    .children('div')
    .filter((_, d) => $(d).find('a, span').length === 0)
    .map((_, d) => clean($(d).text()))
    .get()
    .filter(Boolean);
  const website = box.find('a[target=_blank][href^=http]').first().attr('href') ?? null;
  const logoSrc = box.find('img').first().attr('src');
  return {
    logoUrl: logoSrc && /^https?:\/\//.test(logoSrc) ? logoSrc : null,
    name: clean(header.find('h1').text()),
    federation: clean(header.find('h4').text()) || null,
    street: lines[0] ?? null,
    city: lines[1] ?? null,
    website,
  };
}
