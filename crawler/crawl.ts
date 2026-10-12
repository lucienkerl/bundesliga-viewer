import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';
import type { Club, LeagueData, LeagueRef, Setlist, Team } from '../shared/types.js';
import { DATA_DIR } from './config.js';
import { fetchImage, fetchText } from './http.js';
import { parseLeaguePage } from './parse-league.js';
import { parseClub, parseSetlist } from './parse-setlist.js';

/**
 * Downloads a club logo, shrinks it to at most 160x160 (WebP, keeps transparency) and stores it in
 * public/data/logos once; file names are the DSB image ids. Returns the path relative to the data directory.
 */
async function downloadLogo(url: string, log: (msg: string) => void): Promise<string | null> {
  const id = basename(new URL(url).pathname).replace(/\.[A-Za-z0-9]+$/, '').replace(/[^A-Za-z0-9_-]/g, '_');
  if (!id) return null;
  const target = join(DATA_DIR, 'logos', `${id}.webp`);
  if (!existsSync(target)) {
    try {
      const { bytes } = await fetchImage(url, 10_000_000);
      const small = await sharp(bytes).resize(160, 160, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
      await mkdir(join(DATA_DIR, 'logos'), { recursive: true });
      await writeFile(target, small);
    } catch (err) {
      log(`  warn: logo ${id} skipped (${(err as Error).message})`);
      return null;
    }
  }
  return `logos/${id}.webp`;
}

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
    // Clubs are cached; re-read them on request or when the cached entry predates logo support.
    if (ref.clubUrl && (club === null || options.refreshClubs || club.logo === undefined)) {
      try {
        const { logoUrl, ...parsed } = parseClub(await fetchText(ref.clubUrl));
        club = { ...parsed, logo: logoUrl ? await downloadLogo(logoUrl, log) : null };
      } catch (err) {
        log(`  warn: club page of ${ref.name} skipped (${(err as Error).message})`);
      }
    }

    teams.push({ name: ref.name, setlist, clubUrl: ref.clubUrl, club });
  }

  return { league, table: page.table, matchDays: page.matchDays, teams };
}
