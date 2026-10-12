import { REQUEST_DELAY_MS, USER_AGENT } from './config.js';

let last = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request(url: string, accept: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const wait = last + REQUEST_DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: accept } });
      if (res.ok) return res;
      if (res.status < 500 || attempt >= 2) throw new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      if (attempt >= 2) throw err;
    }
    await sleep(1500 * (attempt + 1));
  }
}

/** Fetches a URL as text. Waits between requests and retries server errors twice. */
export async function fetchText(url: string): Promise<string> {
  return (await request(url, 'text/html,*/*')).text();
}

/** Fetches an image. Rejects anything that is not an image or is unreasonably large. */
export async function fetchImage(url: string, maxBytes = 500_000): Promise<{ bytes: Buffer; type: string }> {
  const res = await request(url, 'image/*');
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`Not an image (${type}) for ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error(`Image too large (${bytes.length} bytes) for ${url}`);
  return { bytes, type };
}
