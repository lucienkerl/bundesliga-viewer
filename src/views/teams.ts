import { calculateSeeding, type SeedingRow } from '../../shared/seeding';
import { checkLineup, suggestLineup } from '../../shared/lineup';
import type { LeagueData, Team } from '../../shared/types';
import { de } from '../i18n/de';
import { lastLineup, remainingMatchDays } from '../lib/days';
import { avg, dateTime, esc, fullDate } from '../lib/format';
import { buildHash, leagueId } from '../lib/route';
import type { ViewContext } from './state';

export function renderTeams(ctx: ViewContext): string {
  const { data, route } = ctx;
  const team = data.teams.find((t) => t.name === route.param) ?? data.teams[0];
  const options = data.teams
    .map((t) => `<option value="${esc(t.name)}" ${t === team ? 'selected' : ''}>${esc(t.name)}</option>`)
    .join('');
  const picker = `<label class="picker"><span class="sr-only">${de.chooseTeam}</span><select data-action="team">${options}</select></label>`;
  if (!team) return picker;
  return `${picker}${renderClub(team, data)}${renderSetlistSection(team, ctx)}`;
}

function renderClub(team: Team, data: LeagueData): string {
  const c = team.club;
  const homeDays = data.matchDays.filter((d) => d.venues.some((v) => v.host === team.name)).map((d) => fullDate(d.date));
  const lines = [
    c?.federation ? `<span>${esc(c.federation)}</span>` : '',
    c?.street || c?.city ? `<span>${esc([c.street, c.city].filter(Boolean).join(', '))}</span>` : '',
    c?.website ? `<a href="${esc(c.website)}" rel="noopener" target="_blank">${de.website}</a>` : '',
    homeDays.length ? `<span>${de.homeMatches}: ${esc(homeDays.join(', '))}</span>` : '',
  ].filter(Boolean);
  return `<section class="card pad club"><h2>${esc(team.name)}</h2><p class="muted club-lines">${lines.join('<br>')}</p></section>`;
}

function statusLabel(row: SeedingRow, remaining: number): { text: string; tone: 'ok' | 'info' } {
  if (row.status === 'f') return { text: de.status.f, tone: 'ok' };
  if (row.status === 'ersatz') return { text: de.status.ersatzProgress(3 - (row.startsUntilF ?? 3)), tone: 'info' };
  return row.starts === 0 ? { text: de.status.stammOpen(remaining), tone: 'info' } : { text: de.status.stamm, tone: 'ok' };
}

const foreignTag = (f: string | null) => (f ? ` <span class="tag a" title="${esc(de.foreignTitle)}">${esc(f)}</span>` : '');

function renderSetlistSection(team: Team, ctx: ViewContext): string {
  if (!team.setlist) return `<p class="muted">${de.setlistMissing}</p>`;
  const rows = calculateSeeding(team.setlist);
  const remaining = remainingMatchDays(ctx.data, team.name);
  const view = ctx.ui.setlistView;
  const seg = (['cmp', 'off', 'calc'] as const)
    .map((v) => `<button class="seg ${view === v ? 'on' : ''}" data-action="sv" data-value="${v}">${de.setlistViews[v]}</button>`)
    .join('');

  const days = Math.max(0, ...team.setlist.entries.map((e) => e.results.reduce((last, r, i) => (r > 0 ? i + 1 : last), 0)));
  const dayHeads = Array.from({ length: days }, (_, i) => `<th class="num">${de.cols.day(i + 1)}</th>`).join('');
  const dayCells = (results: number[]) =>
    Array.from({ length: days }, (_, i) => `<td class="num">${results[i] ? results[i] : '–'}</td>`).join('');

  let table: string;
  if (view === 'cmp') {
    const byOfficial = rows.slice().sort((a, b) => a.officialRank - b.officialRank);
    const entry = (name: string) => team.setlist!.entries.find((e) => e.name === name)!;
    const body = byOfficial
      .map((r) => {
        const e = entry(r.name);
        const mv = r.movement > 0 ? `<span class="up">▲${r.movement}</span>` : r.movement < 0 ? `<span class="dn">▼${-r.movement}</span>` : '<span class="dim">–</span>';
        return `<tr><td class="num dim">${r.officialRank}</td><td>${esc(r.name)}${foreignTag(r.foreign)}</td>${dayCells(e.results)}
          <td class="num dim">${r.startAverage ? avg(r.startAverage) : '–'}</td><td class="num strong">${r.noBasis ? de.noBasis : avg(r.average)}</td>
          <td class="num strong">${r.calculatedRank}</td><td class="num">${mv}</td></tr>`;
      })
      .join('');
    table = `<thead><tr><th class="num">${de.cols.official}</th><th>${de.cols.shooter}</th>${dayHeads}<th class="num">${de.cols.startAvg}</th><th class="num">${de.cols.newAvg}</th><th class="num">${de.cols.newRank}</th><th></th></tr></thead><tbody>${body}</tbody>`;
  } else if (view === 'off') {
    const body = team.setlist.entries
      .map((e) => `<tr><td class="num">${e.rank}</td><td>${esc(e.name)}${foreignTag(e.foreign)}</td><td>${esc(e.status)}</td><td class="num">${e.startAverage ? avg(e.startAverage) : '–'}</td>${dayCells(e.results)}</tr>`)
      .join('');
    table = `<thead><tr><th class="num">#</th><th>${de.cols.shooter}</th><th>${de.cols.status}</th><th class="num">${de.cols.startAvg}</th>${dayHeads}</tr></thead><tbody>${body}</tbody>`;
  } else {
    const body = rows
      .map((r) => {
        const s = statusLabel(r, remaining);
        const shown = r.noBasis ? de.noBasis : avg(r.average);
        return `<tr><td class="num">${r.calculatedRank}</td><td>${esc(r.name)}${foreignTag(r.foreign)}</td><td><span class="tag ${s.tone}">${esc(s.text)}</span></td><td class="num">${r.starts}</td><td class="num strong">${shown}${r.usesStartAverage && !r.noBasis ? ` <span class="dim">${de.startAvgShort}</span>` : ''}</td></tr>`;
      })
      .join('');
    table = `<thead><tr><th class="num">#</th><th>${de.cols.shooter}</th><th>${de.cols.status}</th><th class="num">${de.cols.starts}</th><th class="num">${de.cols.avgSeason}</th></tr></thead><tbody>${body}</tbody>`;
  }

  const asOf = team.setlist.updatedAt ? de.setlistOfficialAsOf(dateTime(team.setlist.updatedAt)) : '';
  return `<h2 class="section-title">${de.setlist}</h2>
    <div class="segs">${seg}</div>
    <div class="card table-wrap"><table class="setlist">${table}</table></div>
    ${renderLineup(team, rows, ctx)}
    <p class="muted"><span class="icon">ⓘ</span> ${esc(asOf)}${asOf ? '. ' : ''}${de.setlistNote}</p>`;
}

function renderLineup(team: Team, rows: SeedingRow[], ctx: ViewContext): string {
  const setlist = team.setlist!;
  const mode = ctx.ui.lineupMode;
  const key = `${leagueId(ctx.route)}|${team.name}`;
  const picks = ctx.ui.picks.get(key) ?? lastLineup(ctx.data, team.name);
  const seg = (['auto', 'pick'] as const)
    .map((m) => `<button class="seg ${mode === m ? 'on' : ''}" data-action="lu" data-value="${m}">${de.lineup[m]}</button>`)
    .join('');
  const chip = (name: string, foreign: string | null, i: number) =>
    `<span class="chip static">${i} ${esc(name)}${foreign ? ' (A)' : ''}</span>`;

  let content: string;
  if (mode === 'auto') {
    const best = suggestLineup(rows);
    content = `<div class="chips">${best.map((r, i) => chip(r.name, r.foreign, i + 1)).join('')}</div><p class="muted">${de.lineup.autoNote}</p>`;
  } else {
    const check = checkLineup(setlist, picks);
    const choices = setlist.entries
      .map((e) => `<button class="chip pick ${picks.includes(e.name) ? 'on' : ''}" data-action="pick" data-name="${esc(e.name)}" data-key="${esc(key)}">${esc(e.name)}${e.foreign ? ' (A)' : ''}</button>`)
      .join('');
    const errors = check.errors.length
      ? check.errors.map((e) => `<span class="tag warn">${esc(e)}</span>`).join(' ')
      : `<span class="tag ok">${de.lineup.ok}</span>`;
    content = `<div class="chips">${choices}</div><p class="muted">${de.lineup.pickNote}</p>
      <div class="chips">${check.order.length ? check.order.map((e, i) => chip(e.name, e.foreign, i + 1)).join('') : `<span class="muted">${de.lineup.nobody}</span>`}</div>
      <div class="chips">${errors}</div>`;
  }
  return `<section class="card pad lineup"><div class="row between"><h3>${de.lineup.title}</h3><div class="segs">${seg}</div></div>${content}</section>`;
}
