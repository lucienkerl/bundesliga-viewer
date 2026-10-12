// ==UserScript==
// @name         DSB Bundesliga – Wettkampfbogen drucken
// @namespace    https://bundesliga.dsb.de/
// @version      1.0
// @description  Fügt bei jedem Wettkampf einen Drucken-Button hinzu (A4 quer, Layout wie OpticScore-Ausdruck, inkl. Unterschriftenfeldern)
// @match        https://bundesliga.dsb.de/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const num = (s) => {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? 0 : n;
  };
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Daten aus dem DOM lesen ----------
  function parseMatch(item) {
    const head = item.querySelector(':scope > .row');
    const cols = head.children;
    const tds = cols[3].querySelectorAll('td');
    const match = {
      nr: txt(cols[0]),
      time: txt(cols[1]),
      home: txt(cols[2]),
      away: txt(cols[4]),
      homeRings: num(txt(tds[0])),
      homePoints: num(txt(tds[1])),
      awayPoints: num(txt(tds[2])),
      awayRings: num(txt(tds[3])),
      shooters: [],
    };

    item.querySelectorAll(':scope > .collapse > ul > li').forEach((li) => {
      const r = li.querySelector(':scope > .row');
      const c = r.children;
      const t = c[3].querySelectorAll(':scope > table td');
      const series = { h: [], a: [] };
      li.querySelectorAll(':scope > .collapse table tr').forEach((tr) => {
        const cells = tr.querySelectorAll('td');
        const h = txt(cells[0]);
        const a = txt(cells[3]);
        if (h !== '' || a !== '') {
          series.h.push(num(h));
          series.a.push(num(a));
        }
      });
      match.shooters.push({
        pos: txt(c[0]),
        home: txt(c[2]).replace(/^Schütze nicht gesetzt$/, ''),
        away: txt(c[4]).replace(/^Schütze nicht gesetzt$/, ''),
        homeSum: num(txt(t[0])),
        homePoint: txt(t[1]),
        awayPoint: txt(t[2]),
        awaySum: num(txt(t[3])),
        homeSeries: series.h,
        awaySeries: series.a,
      });
    });

    // Kontext: Wettkampftag, Datum, Ausrichter, Kampfrichter
    const container = item.closest('.match-container');
    const pane = container.closest('.tab-pane');
    const day = txt(pane.querySelector('h2'));
    const date = (txt(pane.querySelector('h4')).match(/\d{2}\.\d{2}\.\d{4}/) || [''])[0];
    const info = [];
    let prev = container.previousElementSibling;
    while (prev && !prev.classList.contains('match-container') && prev.tagName !== 'H4') {
      info.unshift(txt(prev));
      prev = prev.previousElementSibling;
    }
    match.day = day;
    match.date = date;
    match.info = info.filter(Boolean).join(' · ');
    match.league = [txt(document.querySelector('h1')), document.title.replace(/^.*?Bundesliga:\s*/, '').replace(/\bBL\b/, 'Bundesliga')].filter(Boolean).join(' ');
    return match;
  }

  // ---------- Druck-HTML ----------
  function renderSheet(m, imgUrl) {
    const cell = (v) => `<td class="s">${v === undefined ? '' : v}</td>`;
    const rows = m.shooters
      .map((s) => {
        const hs = [0, 1, 2, 3].map((i) => cell(s.homeSeries[i])).join('');
        const as = [3, 2, 1, 0].map((i) => cell(s.awaySeries[i])).join('');
        const win = (a, b) => (num(a) > num(b) ? ' win' : '');
        return `<tr class="row">
          <td class="name">${esc(s.home)}</td>${hs}
          <td class="sum h${win(s.homePoint, s.awayPoint)}">${s.homeSum || ''}</td>
          <td class="pt">${s.homePoint}</td><td class="pt">${s.awayPoint}</td>
          <td class="sum a${win(s.awayPoint, s.homePoint)}">${s.awaySum || ''}</td>${as}
          <td class="name right">${esc(s.away)}</td></tr>`;
      })
      .join('');

    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(m.home)} - ${esc(m.away)} (${esc(m.date)})</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  :root { --accent: #1e3a5f; --neutral-l: #eef2f7; --win: #16a34a; --win-l: #d9f5e3; --ink: #0f172a; }
  body { font: 13px/1.3 "Helvetica Neue", Arial, sans-serif; color: var(--ink); margin: 0; }
  .bar { position: sticky; top: 0; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 8px 16px; text-align: right; }
  .bar a.dl { font: inherit; padding: 5px 16px; margin-right: 8px; border: 1px solid #767676; border-radius: 3px; background: #efefef; color: #000; text-decoration: none; display: inline-block; }
  .bar button { font: inherit; padding: 6px 16px; cursor: pointer; }
  @media print { .bar { display: none; } }
  .sheet { padding: 6mm 2mm; }
  .league { background: var(--accent); color: #fff; border-radius: 10px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
  .league .l { font-size: 34px; font-weight: 800; letter-spacing: -.5px; }
  .league .r { text-align: right; font-size: 14px; opacity: .95; }
  .league .r b { display: block; font-size: 24px; }
  h1 { font-size: 30px; margin: 18px 0 2px; letter-spacing: -.5px; text-align: center; }
  h1 .vs { color: #94a3b8; font-weight: 400; margin: 0 .4em; }
  
  .score { text-align: center; font-size: 44px; font-weight: 800; margin: 2px 0 0; }
  .score .c { color: #94a3b8; margin: 0 .3em; }
  .rings { text-align: center; color: #475569; font-size: 14px; margin-bottom: 4px; }
  .meta { text-align: center; color: #475569; font-size: 12px; }
  table.res { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 14px; }
  th.team { color: #fff; font-size: 17px; padding: 7px 10px; text-align: center; }
  th.team.h { background: var(--accent); border-radius: 8px 0 0 0; }
  th.team.a { background: var(--accent); border-radius: 0 8px 0 0; }
  th.sub { color: #64748b; font-size: 11px; font-weight: 600; padding: 6px 0 3px; text-align: center; }
  th.tot { font-size: 15px; color: #fff; }
  th.tot.h, th.tot.a { background: var(--accent); }
  td { padding: 8px 4px; border-bottom: 1px solid #e2e8f0; }
  tr.row:last-of-type td { border-bottom: 2px solid var(--accent); }
  .space { height: 38mm; }
  tr.row:nth-child(even) td { background: #f8fafc; }
  td.s { font-size: 14px; text-align: center; width: 5%; color: #334155; }
  td.name { font-weight: 700; width: 20%; white-space: nowrap; padding: 8px 8px; }
  td.name.right { text-align: right; }
  td.sum { font-weight: 800; text-align: center; width: 7%; font-size: 15px; }
  td.sum.h, td.sum.a { background: var(--neutral-l) !important; }
  td.sum.win { background: var(--win-l) !important; color: var(--win); }
  td.pt { text-align: center; width: 3%; font-weight: 700; }
  .foot { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: right; }
  @media screen and (max-width: 700px) {
    .sheet { padding: 8px 6px; }
    .league { padding: 10px 12px; flex-direction: column; align-items: flex-start; gap: 4px; }
    .league .l { font-size: 22px; } .league .r { text-align: left; font-size: 12px; } .league .r b { display: inline; font-size: 14px; margin-right: 8px; }
    h1 { font-size: 17px; margin-top: 12px; } .score { font-size: 34px; } .rings { font-size: 12px; }
    table.res { margin-top: 8px; }
    th.team { font-size: 12px; padding: 5px 4px; }
    th.sub { font-size: 9px; } th.tot { font-size: 11px; }
    td { padding: 6px 1px; }
    td.s { font-size: 11px; width: 5%; }
    td.name { white-space: normal; width: 15%; font-size: 10.5px; line-height: 1.15; padding: 6px 3px; }
    td.sum { font-size: 12px; width: 7%; } td.pt { font-size: 11px; }
    .foot { text-align: center; } .space { height: 8px; }
  }
</style></head><body>
<div class="bar"><a class="dl" download="${esc(m.home)} - ${esc(m.away)} ${esc(m.date)}.png" href="${imgUrl}">Als Bild speichern</a><button onclick="window.print()">Drucken / als PDF speichern</button></div>
<div class="sheet">
  <div class="league"><div class="l">${esc(m.league)}</div><div class="r"><b>${esc(m.day)}</b>${esc(m.date)}${m.time ? ' · ' + esc(m.time) + ' Uhr' : ''}</div></div>
  <h1><span class="h">${esc(m.home)}</span><span class="vs">–</span><span class="a">${esc(m.away)}</span></h1>
  <div class="score"><span class="h">${m.homePoints}</span><span class="c">:</span><span class="a">${m.awayPoints}</span></div>
  <div class="rings">${m.homeRings} : ${m.awayRings} Ringe</div>
  <table class="res">
    <tr><th class="team h" colspan="7">${esc(m.home)}</th><th class="team a" colspan="7">${esc(m.away)}</th></tr>
    <tr>
      <th></th><th class="sub">S 1</th><th class="sub">S 2</th><th class="sub">S 3</th><th class="sub">S 4</th>
      <th class="sub tot h">${m.homeRings}</th><th class="sub tot h">${m.homePoints}</th>
      <th class="sub tot a">${m.awayPoints}</th><th class="sub tot a">${m.awayRings}</th>
      <th class="sub">S 4</th><th class="sub">S 3</th><th class="sub">S 2</th><th class="sub">S 1</th><th></th>
    </tr>
    ${rows}
  </table>
  <div class="space"></div>
  <div class="foot">Ausdruck vom ${new Date().toLocaleString('de-DE')} – erzeugt aus bundesliga.dsb.de</div>
</div></body></html>`;
  }

  function openSheet(item) {
    const m = parseMatch(item);
    const html = renderSheet(m, renderImage(m).toDataURL('image/png'));
    const w = window.open('', '_blank');
    if (!w) {
      alert('Pop-up wurde blockiert – bitte Pop-ups für diese Seite erlauben.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  // ---------- Bild für WhatsApp-Status (1080x1920) ----------
  function renderImage(m) {
    const W = 1080, H = 1920;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const FONT = '"Helvetica Neue", Arial, sans-serif';
    const NAVY = '#1e3a5f', GREEN = '#16a34a', GREEN_L = '#d9f5e3', GREY_L = '#eef2f7';

    const rr = (x, y, w, h, r, fill) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill(); };
    const text = (t, x, y, size, weight, color, align, maxW) => {
      let sz = size;
      g.font = `${weight} ${sz}px ${FONT}`;
      while (maxW && g.measureText(t).width > maxW && sz > 14) { sz -= 1; g.font = `${weight} ${sz}px ${FONT}`; }
      g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic';
      g.fillText(t, x, y);
    };
    const wrap = (t, x, y, size, weight, color, maxW, lh) => {
      g.font = `${weight} ${size}px ${FONT}`;
      const words = t.split(' '); let line = ''; const lines = [];
      words.forEach((w) => {
        const test = line ? line + ' ' + w : w;
        if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
      });
      lines.push(line);
      lines.forEach((l, i) => text(l, x, y + i * lh, size, weight, color, 'center'));
      return lines.length;
    };

    // Hintergrund
    g.fillStyle = NAVY; g.fillRect(0, 0, W, H);

    // Sicherer Bereich: WhatsApp blendet oben (~200px) und unten (~300px) Leisten ein
    const SAFE_TOP = 210, SAFE_BOTTOM = H - 310;

    // Kopf: Liga
    const n = wrap(m.league, W / 2, SAFE_TOP + 62, 62, 800, '#fff', W - 120, 72);
    let y = SAFE_TOP + 62 + (n - 1) * 72;
    text(`${m.day} · ${m.date}`, W / 2, y + 54, 34, 500, '#c3d0e0', 'center');

    // Ergebniskarte
    const cy = y + 92, ch0 = 290;
    rr(40, cy, W - 80, ch0, 32, '#fff');
    text(m.home, 70 + 235, cy + 60, 38, 800, NAVY, 'center', 450);
    text(m.away, W - 70 - 235, cy + 60, 38, 800, NAVY, 'center', 450);
    text(`${m.homePoints}`, W / 2 - 90, cy + 185, 130, 800, NAVY, 'center');
    text(':', W / 2, cy + 172, 110, 800, '#94a3b8', 'center');
    text(`${m.awayPoints}`, W / 2 + 90, cy + 185, 130, 800, NAVY, 'center');
    text(`${m.homeRings}`, W / 2 - 150, cy + 252, 40, 600, '#475569', 'center');
    text('Ringe', W / 2, cy + 252, 28, 500, '#94a3b8', 'center');
    text(`${m.awayRings}`, W / 2 + 150, cy + 252, 40, 600, '#475569', 'center');

    // Einzelduelle
    const top = cy + ch0 + 26;
    const bottom = SAFE_BOTTOM;
    const count = Math.max(m.shooters.length, 1);
    const gap = 16;
    const ch = Math.min(230, (bottom - top - gap * (count - 1)) / count);
    m.shooters.forEach((s, i) => {
      const x = 40, w = W - 80, yy = top + i * (ch + gap);
      rr(x, yy, w, ch, 28, '#fff');
      const hw = Number(s.homePoint) > Number(s.awayPoint);
      const aw = Number(s.awayPoint) > Number(s.homePoint);
      const half = (w - 40) / 2;
      const col = (side, isWin, name, sum, series, cx) => {
        text(name, cx, yy + ch * 0.22, 32, 700, NAVY, 'center', half - 30);
        const bw = 220, bh = ch * 0.32, bx = cx - bw / 2, by = yy + ch * 0.29;
        rr(bx, by, bw, bh, 18, isWin ? GREEN_L : GREY_L);
        text(sum ? String(sum) : '–', cx, by + bh * 0.76, bh * 0.72, 800, isWin ? GREEN : NAVY, 'center');
        const step = Math.min(84, (half - 20) / 4);
        for (let k = 0; k < 4; k++) {
          const sx = cx + (k - 1.5) * step;
          text(`S${k + 1}`, sx, yy + ch * 0.80, 20, 600, '#94a3b8', 'center');
          if (series[k] !== undefined) text(String(series[k]), sx, yy + ch * 0.94, 28, 600, '#334155', 'center');
        }
      };
      col('h', hw, s.home, s.homeSum, s.homeSeries, x + 20 + half / 2);
      col('a', aw, s.away, s.awaySum, s.awaySeries, x + 20 + half * 1.5);
      g.fillStyle = '#e2e8f0'; g.fillRect(W / 2 - 1, yy + 24, 2, ch - 48);
    });

    return c;
  }

  async function shareImage(item) {
    const m = parseMatch(item);
    const canvas = renderImage(m);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const name = `${m.home} - ${m.away} ${m.date}.png`.replace(/[\\/:*?"<>|]/g, '');
    const file = new File([blob], name, { type: 'image/png' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------- Buttons einfügen ----------
  function addButtons(root) {
    root.querySelectorAll('.match-list > .list-group-item.bg-light').forEach((item) => {
      if (item.dataset.printBtn) return;
      const head = item.querySelector(':scope > .row');
      if (!head) return;
      const mk = (label, title, fn) => {
        const btn = document.createElement('a');
        btn.href = '#';
        btn.title = title;
        btn.textContent = label;
        btn.style.cssText = 'display:inline-block;margin-left:8px;padding:5px 14px;border-radius:6px;background:#1e3a5f;color:#fff;font-weight:600;font-size:.85rem;text-decoration:none;white-space:nowrap';
        btn.addEventListener('click', (e) => { e.preventDefault(); fn(item); });
        return btn;
      };
      const bar = document.createElement('div');
      bar.style.cssText = 'display:flex;justify-content:flex-end;flex-wrap:wrap;gap:4px 0;margin:8px 0 2px';
      bar.appendChild(mk('🖨 Drucken', 'Wettkampfbogen drucken / als PDF', openSheet));
      bar.appendChild(mk('⬇ Bild', 'Als Bild herunterladen (z. B. für WhatsApp-Status)', shareImage));
      head.insertAdjacentElement('afterend', bar);
      item.dataset.printBtn = '1';
    });
  }

  addButtons(document);
  new MutationObserver(() => addButtons(document)).observe(document.body, { childList: true, subtree: true });
})();
