// Диагностика подписей на карте: считает стили и снимает .map-wrap отдельно.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const site = 'file:///' + base.replace(/\\/g, '/') + '/';

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-first-run', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
await page.goto(site + 'index.html', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2500));

const info = await page.evaluate(() => {
  const res = [];
  document.querySelectorAll('.pin-label').forEach(el => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    let bbox = null;
    try { const b = el.getBBox(); bbox = { x: b.x, y: b.y, w: b.width, h: b.height }; } catch (e) {}
    res.push({
      text: el.textContent,
      opacity: cs.opacity,
      display: cs.display,
      visibility: cs.visibility,
      fill: cs.fill,
      stroke: cs.stroke,
      strokeWidth: cs.strokeWidth,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily.slice(0, 40),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      bbox
    });
  });
  return res;
});
console.log(JSON.stringify(info, null, 1));

const holder = await page.$('.map-wrap');
await holder.screenshot({ path: path.join(base, '_staging', 'map-zoom.png') });
console.log('saved map-zoom.png');

await browser.close();
