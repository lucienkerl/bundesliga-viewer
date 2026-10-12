import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LeagueData } from '../shared/types.js';
import { DATA_DIR } from './config.js';
import { berlinNow, crawlWindowOpen, type Slot } from './gate.js';

/**
 * Decides whether a scheduled run should crawl: only around match starts of today, based on the schedule
 * from the last crawl. FORCE=true (manual or daily runs) always crawls. Writes run=true|false to GITHUB_OUTPUT.
 */
function main(): void {
  const slots: Slot[] = [];
  if (existsSync(DATA_DIR)) {
    for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
      const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as LeagueData;
      for (const day of data.matchDays) {
        for (const venue of day.venues) {
          for (const m of venue.matches) slots.push({ date: day.date, time: m.time || null });
        }
      }
    }
  }
  const force = process.env.FORCE === 'true';
  const open = crawlWindowOpen(slots, new Date());
  const run = force || open || slots.length === 0;
  const now = berlinNow(new Date());
  console.log(`Berlin ${now.date} ${Math.floor(now.minutes / 60)}:${String(now.minutes % 60).padStart(2, '0')}, ${slots.length} scheduled matches, window ${open ? 'open' : 'closed'}${force ? ', forced' : ''} -> ${run ? 'crawl' : 'skip'}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\n`);
}

main();
