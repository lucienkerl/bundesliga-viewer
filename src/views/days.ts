import { de } from '../i18n/de';
import { defaultDay, isPlayed } from '../lib/days';
import { dayMonth, esc, weekdayDate } from '../lib/format';
import { buildHash } from '../lib/route';
import type { Match, Pair, Shooter } from '../../shared/types';
import { matchKey, type ViewContext } from './state';

export function renderDays(ctx: ViewContext): string {
  const { data, route } = ctx;
  if (data.matchDays.length === 0) return `<p class="muted">${de.noMatches}</p>`;
  const wanted = route.param ? data.matchDays.find((d) => String(d.number) === route.param) : undefined;
  const day = wanted ?? defaultDay(data.matchDays, ctx.today)!;

  const chips = data.matchDays
    .map((d) => {
      const href = buildHash({ ...route, view: 'tage', param: String(d.number) });
      const cls = ['chip', d.number === day.number ? 'on' : '', isPlayed(d) ? 'played' : ''].join(' ');
      return `<a class="${cls}" href="${href}" ${d.number === day.number ? 'aria-current="true"' : ''}>${esc(de.matchDay(d.number))} <span class="dim">${dayMonth(d.date)}</span></a>`;
    })
    .join('');

  const venues = day.venues
    .map((venue, vi) => {
      const place = [venue.hall, venue.street, venue.city].filter(Boolean).join(', ');
      const matches = venue.matches.map((m, mi) => renderMatch(m, matchKey(day.number, vi, mi), ctx)).join('');
      return `<section class="venue">
        <h3>${de.host}: ${esc(venue.host)}</h3>
        <p class="muted">${esc(place)}${venue.referee ? ` · ${de.referee}: ${esc(venue.referee)}` : ''}</p>
        ${matches}
      </section>`;
    })
    .join('');

  return `<div class="chips">${chips}</div><p class="muted day-title">${esc(weekdayDate(day.date))}</p>${venues}`;
}

function renderMatch(m: Match, key: string, ctx: ViewContext): string {
  const open = ctx.ui.open.has(key);
  const score = m.played
    ? `<span class="score">${m.homePoints} : ${m.awayPoints}<small>${m.homeRings} : ${m.awayRings}</small></span>`
    : `<span class="score dim">– : –</span>`;
  const body = open
    ? `<div class="match-body">${
        m.played
          ? `${m.pairs.map(renderPair).join('')}
            <div class="actions">
              <button data-action="print" data-key="${key}" title="${esc(de.printTitle)}">${de.print}</button>
              <button data-action="image" data-key="${key}" title="${esc(de.imageTitle)}">${de.image}</button>
            </div>`
          : `<p class="muted">${de.notPlayed}</p>`
      }</div>`
    : '';
  return `<article class="card match">
    <button class="match-head" data-action="toggle" data-key="${key}" aria-expanded="${open}">
      <span class="time dim">${esc(m.time)}</span>
      <span class="team home">${esc(m.home)}</span>${score}<span class="team away">${esc(m.away)}</span>
    </button>${body}</article>`;
}

function renderPair(p: Pair): string {
  const side = (s: Shooter, cls: string) =>
    `<div class="side ${cls}"><span class="name">${esc(s.name ?? '–')}</span><span class="series">${s.series.join(' ')}</span></div>`;
  const homeWin = p.homePoint > p.awayPoint;
  const awayWin = p.awayPoint > p.homePoint;
  const so =
    p.home.shootOff !== null && p.away.shootOff !== null
      ? `<span class="so">${de.shootOff} ${p.home.shootOff} : ${p.away.shootOff}</span>`
      : '';
  return `<div class="pair">${side(p.home, 'home')}
    <div class="mid"><b class="tot ${homeWin ? 'win' : ''}">${p.home.total || '–'}</b><span class="pts">${p.homePoint} : ${p.awayPoint}</span><b class="tot ${awayWin ? 'win' : ''}">${p.away.total || '–'}</b>${so}</div>
    ${side(p.away, 'away')}</div>`;
}
