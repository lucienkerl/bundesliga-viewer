import { REQUEST_DELAY_MS, USER_AGENT } from './config.js';

let last = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetches a URL as text. Waits between requests and retries server errors twice. */
export async function fetchText(url: string): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const wait = last + REQUEST_DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' } });
      if (res.ok) return await res.text();
      if (res.status < 500 || attempt >= 2) throw new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      if (attempt >= 2) throw err;
    }
    await sleep(1500 * (attempt + 1));
  }
}
