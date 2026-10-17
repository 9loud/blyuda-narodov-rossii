// Надёжные скриншоты сайта через puppeteer-core + установленный Edge.
// Запуск: node _scripts/shots.mjs
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');
const out = path.join(base, '_staging', 'shots');
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const site = 'file:///' + base.replace(/\\/g, '/') + '/';

const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-first-run', '--disable-gpu']
});

async function shot(name, url, viewport, fullPage) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  await new Promise(r => setTimeout(r, 300));
  if (fullPage) {
    // Прогреваем ленивую загрузку: прокручиваем страницу вниз и обратно.
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += Math.floor(innerHeight * 0.8)) {
        scrollTo(0, y);
        await new Promise(r => setTimeout(r, 130));
      }
      scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 700));
  }
  await page.screenshot({ path: path.join(out, name + '.png'), fullPage: !!fullPage });
  const size = await page.evaluate(() => ({
    w: document.documentElement.scrollWidth,
    h: document.documentElement.scrollHeight
  }));
  console.log('OK', name, `(${size.w}x${size.h} css)`);
  await page.close();
}

await shot('home-d', site + 'index.html', DESKTOP, true);
await shot('home-v', site + 'index.html', DESKTOP, false);
await shot('catalog-v', site + 'catalog.html', DESKTOP, false);
await shot('catalog-d', site + 'catalog.html', DESKTOP, true);
await shot('modal-d', site + 'catalog.html?open=shchi', DESKTOP, false);
await shot('about-d', site + 'about.html', DESKTOP, true);
await shot('home-m', site + 'index.html', PHONE, true);
await shot('catalog-m', site + 'catalog.html', PHONE, true);
await shot('modal-m', site + 'catalog.html?open=shchi', PHONE, false);
await shot('cuisine-tatar', site + 'catalog.html?cuisine=tatar', PHONE, false);

await browser.close();
console.log('DONE');
