import { fullDate } from '../lib/format';
import { de } from '../i18n/de';
import { loadImage } from '../lib/logo';
import type { SheetContext } from './types';

const W = 1080;
const H = 1920;
const FONT = '"Helvetica Neue", Arial, sans-serif';
const NAVY = '#1e3a5f';
const GREEN = '#16a34a';
const GREEN_L = '#d9f5e3';
const GREY_L = '#eef2f7';
/** WhatsApp overlays the top (~200px) and bottom (~300px) of a status. */
const SAFE_TOP = 210;
const SAFE_BOTTOM = H - 310;

/** Renders the 9:16 result card used for a WhatsApp status. */
export async function renderImage(ctx: SheetContext): Promise<HTMLCanvasElement> {
  const { match: m } = ctx;
  const [homeLogo, awayLogo] = await Promise.all([loadImage(ctx.homeLogo), loadImage(ctx.awayLogo)]);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d')!;

  const box = (x: number, y: number, w: number, h: number, r: number, fill: string) => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fillStyle = fill;
    g.fill();
  };
  const text = (t: string, x: number, y: number, size: number, weight: number, color: string, maxW?: number) => {
    let s = size;
    g.font = `${weight} ${s}px ${FONT}`;
    while (maxW && g.measureText(t).width > maxW && s > 14) {
      s -= 1;
      g.font = `${weight} ${s}px ${FONT}`;
    }
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillText(t, x, y);
  };
  const wrap = (t: string, y: number, size: number, maxW: number, lh: number): number => {
    g.font = `800 ${size}px ${FONT}`;
    const lines: string[] = [];
    let line = '';
    for (const word of t.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (g.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
    lines.forEach((l, i) => text(l, W / 2, y + i * lh, size, 800, '#fff'));
    return lines.length;
  };

  g.fillStyle = NAVY;
  g.fillRect(0, 0, W, H);

  const lines = wrap(ctx.league, SAFE_TOP + 62, 62, W - 120, 72);
  const y = SAFE_TOP + 62 + (lines - 1) * 72;
  text(`${de.matchDay(ctx.day)} · ${fullDate(ctx.date)}`, W / 2, y + 54, 34, 500, '#c3d0e0');

  const cy = y + 92;
  const cardH = 290;
  box(40, cy, W - 80, cardH, 32, '#fff');
  text(m.home, 70 + 235, cy + 60, 38, 800, NAVY, 450);
  text(m.away, W - 70 - 235, cy + 60, 38, 800, NAVY, 450);
  const logo = (img: HTMLImageElement | null, cx: number) => {
    if (!img) return;
    const size = 120;
    const r = Math.min(size / img.width, size / img.height);
    g.drawImage(img, cx - (img.width * r) / 2, cy + 90 + (size - img.height * r) / 2, img.width * r, img.height * r);
  };
  logo(homeLogo, 70 + 235 - 40);
  logo(awayLogo, W - 70 - 235 + 40);
  text(String(m.homePoints), W / 2 - 90, cy + 185, 130, 800, NAVY);
  text(':', W / 2, cy + 172, 110, 800, '#94a3b8');
  text(String(m.awayPoints), W / 2 + 90, cy + 185, 130, 800, NAVY);
  text(String(m.homeRings), W / 2 - 150, cy + 252, 40, 600, '#475569');
  text('Ringe', W / 2, cy + 252, 28, 500, '#94a3b8');
  text(String(m.awayRings), W / 2 + 150, cy + 252, 40, 600, '#475569');

  const top = cy + cardH + 26;
  const gap = 16;
  const count = Math.max(m.pairs.length, 1);
  const ch = Math.min(230, (SAFE_BOTTOM - top - gap * (count - 1)) / count);
  m.pairs.forEach((p, i) => {
    const yy = top + i * (ch + gap);
    box(40, yy, W - 80, ch, 28, '#fff');
    const half = (W - 80 - 40) / 2;
    const side = (s: typeof p.home, win: boolean, cx: number) => {
      text(s.name ?? '', cx, yy + ch * 0.22, 32, 700, NAVY, half - 30);
      const bw = 220;
      const bh = ch * 0.32;
      const by = yy + ch * 0.29;
      box(cx - bw / 2, by, bw, bh, 18, win ? GREEN_L : GREY_L);
      text(s.total ? String(s.total) : '–', cx, by + bh * 0.76, bh * 0.72, 800, win ? GREEN : NAVY);
      const step = Math.min(84, (half - 20) / 4);
      for (let k = 0; k < 4; k++) {
        const sx = cx + (k - 1.5) * step;
        text(`S${k + 1}`, sx, yy + ch * 0.8, 20, 600, '#94a3b8');
        const v = s.series[k];
        if (v !== undefined) text(String(v), sx, yy + ch * 0.94, 28, 600, '#334155');
      }
    };
    side(p.home, p.homePoint > p.awayPoint, 40 + 20 + half / 2);
    side(p.away, p.awayPoint > p.homePoint, 40 + 20 + half * 1.5);
    g.fillStyle = '#e2e8f0';
    g.fillRect(W / 2 - 1, yy + 24, 2, ch - 48);
  });

  return canvas;
}
