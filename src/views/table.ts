import { de } from '../i18n/de';
import { esc } from '../lib/format';
import { logoImg, teamLogo } from '../lib/logo';
import { buildHash } from '../lib/route';
import type { ViewContext } from './state';

export function renderTable(ctx: ViewContext): string {
  const rows = ctx.data.table
    .map((r) => {
      const href = buildHash({ ...ctx.route, view: 'teams', param: r.team });
      return `<tr><td class="num">${r.rank}</td><td><a class="with-logo" href="${href}">${logoImg(teamLogo(ctx.data, r.team))}<span>${esc(r.team)}</span></a></td><td class="num">${esc(r.singlePoints)}</td><td class="num">${esc(r.teamPoints)}</td></tr>`;
    })
    .join('');
  return `<div class="card table-wrap"><table>
    <thead><tr><th class="num">#</th><th>Team</th><th class="num">${de.singlePoints}</th><th class="num">${de.teamPoints}</th></tr></thead>
    <tbody>${rows}</tbody></table></div><p class="muted">${de.teamsHint}</p>`;
}
