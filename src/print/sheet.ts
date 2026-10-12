import { de } from '../i18n/de';
import { esc, fullDate } from '../lib/format';
import type { SheetContext } from './types';

/** Standalone HTML page (A4 landscape) with the result sheet. `imageUrl` is a PNG data URL for the download button. */
export function renderSheet(ctx: SheetContext, imageUrl: string): string {
  const { match: m } = ctx;
  const rows = m.pairs
    .map((p) => {
      const cell = (v: number | undefined) => `<td class="s">${v ?? ''}</td>`;
      const home = [0, 1, 2, 3].map((i) => cell(p.home.series[i])).join('');
      // Away series run right to left: S1 is farthest from the totals.
      const away = [3, 2, 1, 0].map((i) => cell(p.away.series[i])).join('');
      const homeWin = p.homePoint > p.awayPoint ? ' win' : '';
      const awayWin = p.awayPoint > p.homePoint ? ' win' : '';
      const so =
        p.home.shootOff !== null && p.away.shootOff !== null
          ? `<small>${de.shootOff} ${p.home.shootOff} : ${p.away.shootOff}</small>`
          : '';
      return `<tr class="row">
        <td class="name">${esc(p.home.name ?? '')}${so}</td>${home}
        <td class="sum${homeWin}">${p.home.total || ''}</td><td class="pt">${p.homePoint}</td>
        <td class="pt">${p.awayPoint}</td><td class="sum${awayWin}">${p.away.total || ''}</td>${away}
        <td class="name right">${esc(p.away.name ?? '')}</td></tr>`;
    })
    .join('');
  const sub = (labels: string[]) => labels.map((l) => `<th class="sub">${l}</th>`).join('');

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.home)} - ${esc(m.away)} (${esc(fullDate(ctx.date))})</title>
<style>${CSS}</style></head><body>
<div class="bar"><a class="dl" download="${esc(m.home)} - ${esc(m.away)} ${esc(fullDate(ctx.date))}.png" href="${imageUrl}">${de.sheet.save}</a><button onclick="window.print()">${de.sheet.print}</button></div>
<div class="sheet">
  <div class="league"><div class="l">${esc(ctx.league)}</div><div class="r"><b>${esc(de.matchDay(ctx.day))}</b>${esc(fullDate(ctx.date))}${m.time ? ` · ${esc(m.time)} Uhr` : ''}</div></div>
  <h1>${esc(m.home)} <span class="vs">–</span> ${esc(m.away)}</h1>
  <div class="score">${m.homePoints}<span class="c">:</span>${m.awayPoints}</div>
  <div class="rings">${m.homeRings} : ${m.awayRings} Ringe</div>
  <table class="res">
    <tr><th class="team h" colspan="7">${esc(m.home)}</th><th class="team a" colspan="7">${esc(m.away)}</th></tr>
    <tr><th></th>${sub(['S 1', 'S 2', 'S 3', 'S 4'])}
      <th class="sub tot">${m.homeRings}</th><th class="sub tot">${m.homePoints}</th>
      <th class="sub tot">${m.awayPoints}</th><th class="sub tot">${m.awayRings}</th>
      ${sub(['S 4', 'S 3', 'S 2', 'S 1'])}<th></th></tr>
    ${rows}
  </table>
  <div class="space"></div>
  <div class="foot">${esc(de.sheet.printedAt(new Date().toLocaleString('de-DE')))}</div>
</div></body></html>`;
}

const CSS = `
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
:root { --accent: #1e3a5f; --neutral-l: #eef2f7; --win: #16a34a; --win-l: #d9f5e3; }
body { font: 13px/1.3 "Helvetica Neue", Arial, sans-serif; color: #0f172a; margin: 0; }
.bar { position: sticky; top: 0; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 8px 16px; text-align: right; }
.bar button, .bar a.dl { font: inherit; padding: 5px 16px; margin-left: 8px; border: 1px solid #767676; border-radius: 3px; background: #efefef; color: #000; text-decoration: none; display: inline-block; cursor: pointer; }
@media print { .bar { display: none; } }
.sheet { padding: 6mm 2mm; }
.league { background: var(--accent); color: #fff; border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
.league .l { font-size: 34px; font-weight: 800; letter-spacing: -.5px; }
.league .r { text-align: right; font-size: 14px; }
.league .r b { display: block; font-size: 24px; }
h1 { font-size: 30px; margin: 18px 0 2px; letter-spacing: -.5px; text-align: center; }
h1 .vs { color: #94a3b8; font-weight: 400; margin: 0 .4em; }
.score { text-align: center; font-size: 44px; font-weight: 800; }
.score .c { color: #94a3b8; margin: 0 .3em; }
.rings { text-align: center; color: #475569; font-size: 14px; margin-bottom: 4px; }
table.res { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 14px; }
th.team { background: var(--accent); color: #fff; font-size: 17px; padding: 7px 10px; text-align: center; }
th.team.h { border-radius: 8px 0 0 0; } th.team.a { border-radius: 0 8px 0 0; }
th.sub { color: #64748b; font-size: 11px; font-weight: 600; padding: 6px 0 3px; text-align: center; }
th.tot { font-size: 15px; color: #fff; background: var(--accent); }
td { padding: 8px 4px; border-bottom: 1px solid #e2e8f0; }
tr.row:nth-child(even) td { background: #f8fafc; }
tr.row:last-of-type td { border-bottom: 2px solid var(--accent); }
td.s { font-size: 14px; text-align: center; width: 5%; color: #334155; }
td.name { font-weight: 700; width: 20%; white-space: nowrap; padding: 8px 8px; }
td.name small { display: block; font-weight: 400; color: #64748b; font-size: 11px; }
td.name.right { text-align: right; }
td.sum { font-weight: 800; text-align: center; width: 7%; font-size: 15px; background: var(--neutral-l) !important; }
td.sum.win { background: var(--win-l) !important; color: var(--win); }
td.pt { text-align: center; width: 3%; font-weight: 700; }
.space { height: 38mm; }
.foot { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: right; }
@media screen and (max-width: 700px) {
  .sheet { padding: 8px 6px; }
  .league { padding: 10px 12px; flex-direction: column; align-items: flex-start; gap: 4px; }
  .league .l { font-size: 22px; } .league .r { text-align: left; font-size: 12px; } .league .r b { display: inline; font-size: 14px; margin-right: 8px; }
  h1 { font-size: 17px; margin-top: 12px; } .score { font-size: 34px; } .rings { font-size: 12px; }
  table.res { margin-top: 8px; } th.team { font-size: 12px; padding: 5px 4px; }
  th.sub { font-size: 9px; } th.tot { font-size: 11px; } td { padding: 6px 1px; }
  td.s { font-size: 11px; width: 5%; }
  td.name { white-space: normal; width: 15%; font-size: 10.5px; line-height: 1.15; padding: 6px 3px; }
  td.sum { font-size: 12px; width: 7%; } td.pt { font-size: 11px; }
  .foot { text-align: center; } .space { height: 8px; }
}`;
