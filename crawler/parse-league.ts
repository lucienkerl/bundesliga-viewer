import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Match, MatchDay, Pair, Shooter, TableRow, TeamRef, Venue } from '../shared/types.js';
import { clean, toInt, toIsoDate } from './text.js';

type Cheerio = ReturnType<ReturnType<typeof cheerio.load>>;

export interface ParsedLeaguePage {
  title: string;
  table: TableRow[];
  teams: TeamRef[];
  matchDays: MatchDay[];
}

const NOT_SET = 'Schütze nicht gesetzt';

export function parseLeaguePage(html: string, baseUrl: string): ParsedLeaguePage {
  const $ = cheerio.load(html);
  const abs = (href: string | undefined) => (href ? new URL(href, baseUrl).toString() : null);

  const table: TableRow[] = [];
  const teams: TeamRef[] = [];
  $('table tbody tr').each((_, tr) => {
    const row = $(tr);
    const rank = toInt(row.find('th[scope=row]').text());
    const cells = row.find('td');
    if (!rank || cells.length < 3) return;
    const name = clean(cells.eq(0).find('.d-flex > div').first().text());
    table.push({
      rank,
      team: name,
      singlePoints: clean(cells.eq(1).text()),
      teamPoints: clean(cells.eq(2).text()),
    });
    teams.push({
      name,
      setlistUrl: abs(row.find('button[data-url]').attr('data-url')?.replace(/&amp;/g, '&')),
      clubUrl: abs(row.find('a[title="Verein anzeigen"]').attr('href')),
    });
  });
  if (table.length === 0) throw new Error('No table rows found: the DSB markup may have changed');

  const matchDays: MatchDay[] = [];
  $('[id^=v-pills-][role=tab]').each((_, tab) => {
    const paneId = ($(tab).attr('id') ?? '').replace(/-tab$/, '');
    const pane = $(`#${paneId}`);
    if (pane.length === 0) return;
    matchDays.push(parseMatchDay($, pane));
  });

  return { title: clean($('title').text()), table, teams, matchDays };
}

function parseMatchDay($: cheerio.CheerioAPI, pane: Cheerio): MatchDay {
  const heading = clean(pane.children('h2').first().text());
  const number = toInt(heading);
  const date = toIsoDate(clean(pane.children('h4.text-primary').first().text()));
  if (!number || !date) throw new Error(`Match day heading not understood: "${heading}"`);

  const venues: Venue[] = [];
  let pending: Omit<Venue, 'matches'> | null = null;
  let expecting: 'card' | 'referee' | null = null;

  pane.children().each((_, el) => {
    const node = $(el);
    const tag = (el as AnyNode & { tagName?: string }).tagName;
    if (tag === 'h4' && clean(node.text()) === 'Ausrichter') {
      pending = { host: '', hall: '', street: '', city: '', phone: null, referee: null };
      expecting = 'card';
    } else if (tag === 'h4' && clean(node.text()) === 'Kampfrichter') {
      expecting = 'referee';
    } else if (pending && expecting === 'card' && node.hasClass('card')) {
      const body = node.find('.card-body > div').map((__, d) => clean($(d).text())).get();
      pending.host = clean(node.find('.card-header').text());
      pending.hall = body[0] ?? '';
      pending.street = body[1] ?? '';
      pending.city = body[2] ?? '';
      pending.phone = body.find((t, i) => i > 2 && /\d{5,}/.test(t)) ?? null;
    } else if (pending && expecting === 'referee' && node.hasClass('text-primary')) {
      pending.referee = clean(node.text());
    } else if (node.hasClass('match-container') && pending) {
      venues.push({ ...pending, matches: parseMatches($, node) });
    }
  });

  return { number, date, venues };
}

function parseMatches($: cheerio.CheerioAPI, container: Cheerio): Match[] {
  return container
    .find('.match-list > .list-group-item.bg-light')
    .map((_, item) => parseMatch($, $(item)))
    .get();
}

function parseMatch($: cheerio.CheerioAPI, item: Cheerio): Match {
  const head = item.children('.row').first().children();
  const result = head.eq(3).find('td');
  const homeRings = toInt(result.eq(0).text());
  const homePoints = toInt(result.eq(1).text());
  const awayPoints = toInt(result.eq(2).text());
  const awayRings = toInt(result.eq(3).text());

  const pairs: Pair[] = item
    .find('> .collapse > ul > li')
    .map((_, li) => parsePair($, $(li)))
    .get();

  return {
    number: toInt(head.eq(0).text()),
    time: clean(head.eq(1).text()),
    home: clean(head.eq(2).text()),
    away: clean(head.eq(4).text()),
    homeRings,
    awayRings,
    homePoints,
    awayPoints,
    played: homeRings > 0 || awayRings > 0 || homePoints > 0 || awayPoints > 0,
    pairs,
  };
}

function parsePair($: cheerio.CheerioAPI, li: Cheerio): Pair {
  const cols = li.children('.row').first().children();
  const totals = cols.eq(3).children('table').first().find('td');
  const rows: { home: string; away: string; label: boolean }[] = [];
  li.find('> .collapse table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    rows.push({
      home: clean(cells.eq(0).text()),
      away: clean(cells.eq(3).text()),
      label: clean($(tr).text()) === 'Stechergebnis',
    });
  });

  // The first four rows are the series. When a pair was tied the DSB adds a "Stechergebnis" label
  // row followed by the shoot-off values, and (a DSB quirk) puts the home shoot-off into the home
  // total cell, so totals are recomputed from the series in that case.
  const series = (side: 'home' | 'away') =>
    rows
      .filter((r) => !r.label)
      .slice(0, 4)
      .map((r) => r[side])
      .filter((v) => v !== '')
      .map(toInt);
  const labelIndex = rows.findIndex((r) => r.label);
  const shootOff = (side: 'home' | 'away') => {
    const v = labelIndex >= 0 ? (rows[labelIndex + 1]?.[side] ?? '') : '';
    return v === '' ? null : Number.parseFloat(v.replace(',', '.'));
  };

  const shooter = (side: 'home' | 'away', name: string, total: string): Shooter => {
    const s = series(side);
    const off = shootOff(side);
    return {
      name: name === NOT_SET || name === '' ? null : name,
      total: off === null ? toInt(total) : s.reduce((a, b) => a + b, 0),
      series: s,
      shootOff: off,
    };
  };

  return {
    position: toInt(cols.eq(0).text()),
    home: shooter('home', clean(cols.eq(2).text()), totals.eq(0).text()),
    away: shooter('away', clean(cols.eq(4).text()), totals.eq(3).text()),
    homePoint: toInt(totals.eq(1).text()),
    awayPoint: toInt(totals.eq(2).text()),
  };
}

/** Parses match items from an HTML fragment (used by tests with small fixtures). */
export function parseMatchesHtml(html: string): Match[] {
  const $ = cheerio.load(html);
  return parseMatches($, $('.match-container').first());
}
