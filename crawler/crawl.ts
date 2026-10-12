import { readFile } from 'node:fs/promises';
import type { Club, LeagueData, LeagueRef, Setlist, Team } from '../shared/types.js';
import { fetchText } from './http.js';
import { parseLeaguePage } from './parse-league.js';
import { parseClub, parseSetlist } from './parse-setlist.js';

export interface CrawlOptions {
  skipSetlists: boolean;
  refreshClubs: boolean;
}

export async function readPrevious(file: string): Promise<LeagueData | null> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as LeagueData;
  } catch {
    return null;
  }
}

/** Crawls one league. Falls back to previous data for single teams when a sub-request fails. */
export async function crawlLeague(
  league: LeagueRef,
  previous: LeagueData | null,
  options: CrawlOptions,
  log: (msg: string) => void,
): Promise<LeagueData> {
  const page = parseLeaguePage(await fetchText(league.url), league.url);
  const teams: Team[] = [];

  for (const ref of page.teams) {
    const old = previous?.teams.find((t) => t.name === ref.name) ?? null;

    let setlist: Setlist | null = old?.setlist ?? null;
    if (ref.setlistUrl && !options.skipSetlists) {
      try {
        setlist = parseSetlist(await fetchText(ref.setlistUrl));
      } catch (err) {
        log(`  warn: setlist of ${ref.name} kept from previous run (${(err as Error).message})`);
      }
    }

    let club: Club | null = old?.club ?? null;
    if (ref.clubUrl && (club === null || options.refreshClubs)) {
      try {
        club = parseClub(await fetchText(ref.clubUrl));
      } catch (err) {
        log(`  warn: club page of ${ref.name} skipped (${(err as Error).message})`);
      }
    }

    teams.push({ name: ref.name, setlist, clubUrl: ref.clubUrl, club });
  }

  return { league, table: page.table, matchDays: page.matchDays, teams };
}
