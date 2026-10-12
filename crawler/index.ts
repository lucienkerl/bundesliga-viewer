import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { crawlLeague, readPrevious } from './crawl.js';
import { DATA_DIR, LEAGUES } from './config.js';

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--league='))?.slice('--league='.length);
const options = { skipSetlists: args.includes('--skip-setlists'), refreshClubs: args.includes('--refresh-clubs') };
const log = (msg: string) => console.log(msg);

const fileFor = (id: string) => join(DATA_DIR, `${id.replace('/', '-')}.json`);

/** Writes JSON only when the content changed, so scheduled runs only commit real changes. */
async function writeIfChanged(file: string, data: unknown): Promise<boolean> {
  const text = `${JSON.stringify(data, null, 1)}\n`;
  try {
    if ((await readFile(file, 'utf8')) === text) return false;
  } catch {
    /* file does not exist yet */
  }
  await writeFile(file, text);
  return true;
}

await mkdir(DATA_DIR, { recursive: true });
const selected = LEAGUES.filter((l) => !only || l.id.includes(only));
if (selected.length === 0) {
  console.error(`No league matches "${only}"`);
  process.exit(2);
}

let changed = false;
let failed = 0;
for (const league of selected) {
  const file = fileFor(league.id);
  log(`${league.id}`);
  try {
    const data = await crawlLeague(league, await readPrevious(file), options, log);
    const wrote = await writeIfChanged(file, data);
    changed ||= wrote;
    const played = data.matchDays.flatMap((d) => d.venues.flatMap((v) => v.matches)).filter((m) => m.played).length;
    log(`  ${data.table.length} teams, ${data.matchDays.length} match days, ${played} matches played${wrote ? ', updated' : ', unchanged'}`);
  } catch (err) {
    failed++;
    console.error(`  FAILED: ${(err as Error).message}`);
  }
}

// index.json lists the leagues; its timestamp only moves when some league file changed.
const indexFile = join(DATA_DIR, 'index.json');
let previousIndex: { generatedAt?: string } = {};
try {
  previousIndex = JSON.parse(await readFile(indexFile, 'utf8'));
} catch {
  /* first run */
}
const generatedAt = changed || !previousIndex.generatedAt ? new Date().toISOString() : previousIndex.generatedAt;
await writeIfChanged(indexFile, { generatedAt, leagues: LEAGUES.map((l) => ({ ...l, file: `${l.id.replace('/', '-')}.json` })) });

if (failed > 0) {
  console.error(`${failed} league(s) failed`);
  process.exit(1);
}
