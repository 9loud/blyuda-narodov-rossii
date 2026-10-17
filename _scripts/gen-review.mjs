// Генерация страниц-обзоров фото-кандидатов (preview + preview2) для визуального отбора
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');
const st = path.join(base, '_staging');

const pages = [
  ['oset_pies', 'dzykka', 'stroganina'],
  ['shulen', 'huushuur', 'kerchekh'],
  ['salamat', 'kazy', 'kumys'],
  ['shchi', 'pelmeni', 'blini'],
  ['echpochmak', 'chakchak', 'gubadiya'],
  ['beshbarmak', 'buuzy', 'osset_third']
];

function listImgs(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder)
    .filter(f => /\.(jpe?g|png)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

let n = 0;
for (const page of pages) {
  n++;
  const secs = page.map(id => {
    const imgs = [
      ...listImgs(path.join(st, 'preview', id)).map(f => ({ src: `preview/${id}/${f}`, label: `P1/${f}` })),
      ...listImgs(path.join(st, 'preview2', id)).map(f => ({ src: `preview2/${id}/${f}`, label: `P2/${f}` }))
    ].slice(0, 14);
    if (!imgs.length) return `<section><h2>${id}</h2><p class="none">нет файлов</p></section>`;
    return `<section><h2>${id}</h2><div class="row">` +
      imgs.map(im => `<figure><img src="${im.src}"><figcaption>${im.label}</figcaption></figure>`).join('') +
      `</div></section>`;
  }).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font:14px 'Segoe UI',sans-serif;background:#f6f3ec;margin:12px}
  h2{margin:12px 0 6px;font-size:17px;font-family:Consolas,monospace}
  section{border-bottom:2px dashed #999;padding-bottom:10px;margin-bottom:10px}
  section:last-child{border-bottom:none}
  .row{display:grid;grid-template-columns:repeat(7,1fr);gap:7px}
  figure{margin:0}
  img{width:100%;height:150px;object-fit:cover;background:#ddd;border:1px solid #bbb}
  figcaption{font:11px Consolas,monospace;color:#333;padding-top:2px}
  .none{color:#a00}
  </style></head><body>${secs}</body></html>`;
  fs.writeFileSync(path.join(st, `review-${n}.html`), html, 'utf8');
}
console.log('Страниц-обзоров:', n);
