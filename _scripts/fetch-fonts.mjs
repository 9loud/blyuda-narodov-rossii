// Скачивание шрифтов с Google Fonts (кириллица + латиница) для офлайн-работы сайта
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');
const fontsDir = path.join(base, 'assets', 'fonts');
const cssDir = path.join(base, 'assets', 'css');
fs.mkdirSync(fontsDir, { recursive: true });
fs.mkdirSync(cssDir, { recursive: true });

const cssUrl = 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=PT+Serif:wght@400;700&family=Ruslan+Display&display=swap';
const res = await fetch(cssUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
});
if (!res.ok) { console.error('CSS не получен:', res.status); process.exit(1); }
const css = await res.text();

const keepSubsets = new Set(['cyrillic', 'latin']);
const re = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
let out = '/* Шрифты проекта (локальные копии, Google Fonts: PT Sans, PT Serif, Ruslan Display) */\n';
let m, count = 0;
while ((m = re.exec(css)) !== null) {
  const subset = m[1];
  const block = m[2];
  if (!keepSubsets.has(subset)) continue;
  const fam = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
  const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1] || '400';
  const style = (block.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
  const url = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
  const range = (block.match(/unicode-range:\s*([^;]+)/) || [])[1];
  if (!fam || !url) continue;
  const fn = `${fam.replace(/\s+/g, '_')}-${weight}-${subset}.woff2`;
  const fr = await fetch(url);
  if (!fr.ok) { console.error('Не скачался', fn, fr.status); continue; }
  const buf = Buffer.from(await fr.arrayBuffer());
  fs.writeFileSync(path.join(fontsDir, fn), buf);
  out += `@font-face {\n  font-family: '${fam}';\n  font-style: ${style};\n  font-weight: ${weight};\n  font-display: swap;\n  src: url('../fonts/${fn}') format('woff2');\n`;
  if (range) out += `  unicode-range: ${range};\n`;
  out += `}\n`;
  count++;
  console.log('OK', fn, (buf.length / 1024).toFixed(0) + 'KB');
}
fs.writeFileSync(path.join(cssDir, 'fonts.css'), out, 'utf8');
console.log('Итого файлов:', count);
