import { describe, expect, it } from 'vitest';
import { berlinNow, crawlWindowOpen, decideCrawl } from '../crawler/gate';

// 2026-10-24 is a match day with starts at 15:00, 16:30 and 18:00 (CEST, UTC+2).
const slots = [
  { date: '2026-10-24', time: '15:00' },
  { date: '2026-10-24', time: '16:30' },
  { date: '2026-10-24', time: '18:00' },
];
const at = (iso: string) => new Date(iso);

describe('berlinNow', () => {
  it('converts UTC to Berlin summer and winter time', () => {
    expect(berlinNow(at('2026-10-24T13:00:00Z'))).toEqual({ date: '2026-10-24', minutes: 15 * 60 });
    expect(berlinNow(at('2026-11-28T14:00:00Z'))).toEqual({ date: '2026-11-28', minutes: 15 * 60 });
  });
  it('uses the Berlin date near midnight', () => {
    expect(berlinNow(at('2026-10-24T22:30:00Z')).date).toBe('2026-10-25');
  });
});

describe('crawlWindowOpen', () => {
  it('is closed on days without matches', () => {
    expect(crawlWindowOpen(slots, at('2026-10-23T13:00:00Z'))).toBe(false);
    expect(crawlWindowOpen(slots, at('2026-10-25T13:00:00Z'))).toBe(false);
  });
  it('opens 30 minutes before the first start', () => {
    expect(crawlWindowOpen(slots, at('2026-10-24T12:20:00Z'))).toBe(false); // 14:20
    expect(crawlWindowOpen(slots, at('2026-10-24T12:35:00Z'))).toBe(true); // 14:35
  });
  it('stays open between matches and closes 150 minutes after the last start', () => {
    expect(crawlWindowOpen(slots, at('2026-10-24T14:15:00Z'))).toBe(true); // 16:15
    expect(crawlWindowOpen(slots, at('2026-10-24T18:25:00Z'))).toBe(true); // 20:25
    expect(crawlWindowOpen(slots, at('2026-10-24T18:40:00Z'))).toBe(false); // 20:40
  });
  it('keeps the whole day open when a time is unknown', () => {
    expect(crawlWindowOpen([{ date: '2026-10-24', time: null }], at('2026-10-24T05:00:00Z'))).toBe(true);
  });
  it('handles two match days in a row independently', () => {
    const two = [...slots, { date: '2026-10-25', time: '10:00' }];
    // Daylight saving time ends on 2026-10-25, so Berlin is UTC+1 that day.
    expect(crawlWindowOpen(two, at('2026-10-25T08:45:00Z'))).toBe(true); // 09:45
    expect(crawlWindowOpen(two, at('2026-10-25T06:00:00Z'))).toBe(false); // 07:00
  });
});

describe('decideCrawl', () => {
  it('does a light crawl inside the window', () => {
    expect(decideCrawl(slots, at('2026-10-24T13:30:00Z'), false)).toEqual({ run: true, full: false, windowOpen: true });
  });
  it('skips outside the window unless forced', () => {
    expect(decideCrawl(slots, at('2026-10-24T05:00:00Z'), false)).toEqual({ run: false, full: false, windowOpen: false });
    expect(decideCrawl(slots, at('2026-10-24T05:00:00Z'), true)).toEqual({ run: true, full: true, windowOpen: false });
  });
  it('does a full crawl without any known schedule', () => {
    expect(decideCrawl([], at('2026-10-24T05:00:00Z'), false)).toMatchObject({ run: true, full: true });
  });
});
