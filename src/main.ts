import './styles.css';
import type { LeagueData } from '../shared/types';
import { de } from './i18n/de';
import { loadIndex, loadLeague, type DataIndex } from './lib/data';
import { disciplineLabel, esc, leagueLong, leagueTitle } from './lib/format';
import { buildHash, DEFAULT_ROUTE, leagueId, parseHash, type Route, type View } from './lib/route';
import { downloadImage, openSheet } from './print/actions';
import type { SheetContext } from './print/types';
import { lastLineup } from './lib/days';
import { teamLogo } from './lib/logo';
import { renderDays } from './views/days';
import { matchKey, type UiState } from './views/state';
import { renderTable } from './views/table';
import { renderTeams } from './views/teams';

const app = document.getElementById('app')!;
const ui: UiState = { open: new Set(), setlistView: 'cmp', lineupMode: 'auto', lineupSort: 'official', picks: new Map() };
let index: DataIndex;
let route: Route = DEFAULT_ROUTE;
let data: LeagueData | null = null;
let error: string | null = null;

const STORE_KEY = 'bundesliga-viewer:league';
const stored = (): Route | null => {
  try {
    const id = localStorage.getItem(STORE_KEY);
    return id ? parseHash(`#/${id}/tage`) : null;
  } catch {
    return null;
  }
};
const remember = (id: string) => {
  try {
    localStorage.setItem(STORE_KEY, id);
  } catch {
    /* storage can be unavailable (private mode) */
  }
};

const todayIso = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

async function navigate(): Promise<void> {
  route = parseHash(location.hash, stored() ?? DEFAULT_ROUTE);
  let ref = index.leagues.find((l) => l.id === leagueId(route));
  if (!ref) {
    ref = index.leagues.find((l) => l.id === leagueId(DEFAULT_ROUTE)) ?? index.leagues[0]!;
    route = { ...DEFAULT_ROUTE, discipline: ref.discipline, slug: ref.slug };
  }
  remember(ref.id);
  error = null;
  if (data?.league.id !== ref.id) {
    data = null;
    render();
    try {
      data = await loadLeague(ref.file);
    } catch (err) {
      error = (err as Error).message;
    }
  }
  render();
}

function header(): string {
  const groups = (['luftpistole', 'luftgewehr'] as const)
    .map((d) => {
      const opts = index.leagues
        .filter((l) => l.discipline === d)
        .map((l) => `<option value="${l.id}" ${l.id === leagueId(route) ? 'selected' : ''}>${esc(leagueLong(l))}</option>`)
        .join('');
      return `<optgroup label="${esc(disciplineLabel(d))}">${opts}</optgroup>`;
    })
    .join('');
  const tab = (v: View) =>
    `<a class="tab ${route.view === v ? 'on' : ''}" href="${buildHash({ ...route, view: v, param: null })}">${de.tabs[v]}</a>`;
  return `<header class="top">
    <div class="brand"><img class="mark" src="${import.meta.env.BASE_URL}favicon.svg" alt="" width="26" height="26"><span class="name">${de.appName}</span><span class="dim">${de.season}</span></div>
    <label class="league-pick"><span class="sr-only">Liga</span><select data-action="league">${groups}</select></label>
  </header>
  <nav class="tabs">${tab('tage')}${tab('tabelle')}${tab('teams')}</nav>`;
}

function body(): string {
  if (error) return `<p class="error">${de.loadError} <span class="dim">${esc(error)}</span></p>`;
  if (!data) return `<p class="loading">${de.loading}</p>`;
  const ctx = { data, route, ui, today: todayIso() };
  if (route.view === 'tabelle') return renderTable(ctx);
  if (route.view === 'teams') return renderTeams(ctx);
  return renderDays(ctx);
}

function footer(): string {
  const when = index.generatedAt ? new Date(index.generatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  return `<footer class="foot muted">${when ? `${de.dataAsOf(when)}<br>` : ''}${de.source}</footer>`;
}

function render(): void {
  app.innerHTML = `${header()}<main>${body()}</main>${footer()}`;
}

function sheetContext(key: string): SheetContext | null {
  if (!data) return null;
  const [d, v, m] = key.split('-').map(Number);
  const day = data.matchDays.find((x) => x.number === d);
  const match = day?.venues[v ?? -1]?.matches[m ?? -1];
  return day && match
    ? { league: leagueTitle(data.league), day: day.number, date: day.date, match, homeLogo: teamLogo(data, match.home), awayLogo: teamLogo(data, match.away) }
    : null;
}

app.addEventListener('click', (ev) => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!el || el.tagName === 'SELECT') return;
  const { action, key, value, name } = el.dataset;
  if (action === 'toggle' && key) {
    ui.open.has(key) ? ui.open.delete(key) : ui.open.add(key);
  } else if ((action === 'print' || action === 'image') && key) {
    const ctx = sheetContext(key);
    if (ctx) void (action === 'print' ? openSheet(ctx) : downloadImage(ctx));
    return;
  } else if (action === 'sv') {
    ui.setlistView = value as UiState['setlistView'];
  } else if (action === 'ls') {
    ui.lineupSort = value as UiState['lineupSort'];
  } else if (action === 'lu') {
    ui.lineupMode = value as UiState['lineupMode'];
  } else if (action === 'pick' && key && name && data) {
    const team = key.split('|')[1] ?? '';
    const current = ui.picks.get(key) ?? lastLineup(data, team);
    ui.picks.set(key, current.includes(name) ? current.filter((n) => n !== name) : [...current, name]);
  } else return;
  render();
});

app.addEventListener('change', (ev) => {
  const el = ev.target as HTMLSelectElement;
  if (el.dataset.action === 'league') {
    const [discipline, slug] = el.value.split('/');
    location.hash = buildHash({ discipline: discipline as Route['discipline'], slug: slug ?? '', view: route.view === 'teams' ? 'tabelle' : route.view, param: null });
  } else if (el.dataset.action === 'team') {
    location.hash = buildHash({ ...route, view: 'teams', param: el.value });
  }
});

try {
  index = await loadIndex();
  window.addEventListener('hashchange', () => void navigate());
  await navigate();
} catch (err) {
  app.innerHTML = `<p class="error">${de.loadError} <span class="dim">${esc((err as Error).message)}</span></p>`;
}
