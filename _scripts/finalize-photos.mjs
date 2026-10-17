// Финальная загрузка выбранных фото (ширина 1400) + генерация credits.js
// SELECT: dishId -> { r: номер отчёта (1|2), key: id блюда в отчёте, n: номер кандидата }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');
const st = path.join(base, '_staging');

const SELECT = {
  shchi:      { r: 1, key: 'shchi',      n: '3' },
  pelmeni:    { r: 1, key: 'pelmeni',    n: '4' },
  blini:      { r: 1, key: 'blini',      n: '2' },
  echpochmak: { r: 1, key: 'echpochmak', n: '1' },
  chakchak:   { r: 1, key: 'chakchak',   n: '2' },
  gubadiya:   { r: 1, key: 'gubadiya',   n: '1' },
  beshbarmak: { r: 1, key: 'beshbarmak', n: '3' },
  kort:       { r: 2, key: 'kazy',       n: '1' },
  kumys:      { r: 1, key: 'kumys',      n: '6' },
  oset_pies:  { r: 2, key: 'oset_pies',  n: '2' },
  fydzhyn:    { r: 2, key: 'oset_pies',  n: '4' },
  osetsyr:    { r: 2, key: 'oset_pies',  n: '10' },
  buuzy:      { r: 1, key: 'buuzy',      n: '1' },
  shulen:     { r: 2, key: 'shulen',     n: '12' },
  huushuur:   { r: 2, key: 'huushuur',   n: '4' },
  stroganina: { r: 2, key: 'stroganina', n: '8' },
  kerchekh:   { r: 2, key: 'kerchekh',   n: '2' },
  indigirka:  { r: 2, key: 'kerchekh',   n: '1' }
};

function parseReport(file) {
  const map = {};
  if (!fs.existsSync(file)) return map;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_0-9]+) \| (\d+) \| (File:.+?) \| LIC: (.*?) \| BY: (.*?) \| URL: (https?:\S+)\s*$/);
    if (m) map[m[1] + '|' + m[2]] = { title: m[3], license: m[4].trim(), author: m[5].trim(), url: m[6] };
  }
  return map;
}

const reports = {
  1: parseReport(path.join(st, 'photos-report.txt')),
  2: parseReport(path.join(st, 'photos-report2.txt'))
};

const credits = {};
let ok = 0, fail = 0;

for (const [dishId, sel] of Object.entries(SELECT)) {
  const info = reports[sel.r] && reports[sel.r][sel.key + '|' + sel.n];
  if (!info) { console.error('НЕТ в отчёте:', dishId, sel.r, sel.key, sel.n); fail++; continue; }
  const cleanTitle = info.title.replace(/^File:/, '');
  const ext = (cleanTitle.match(/\.(jpe?g|png)$/i) || ['.jpg'])[0].toLowerCase();
  const url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(cleanTitle) + '?width=1400';
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'SchoolProject-SiteBuilder/1.0 (school research project)' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 9000) throw new Error('слишком маленький файл: ' + buf.length);
    const out = path.join(base, 'assets', 'img', 'dishes', dishId + ext);
    fs.writeFileSync(out, buf);
    credits[dishId] = { author: info.author, license: info.license, url: info.url };
    console.log('OK', dishId, '->', path.basename(out), (buf.length / 1024).toFixed(0) + 'KB', '|', cleanTitle);
    ok++;
    await new Promise(res => setTimeout(res, 900));
  } catch (e) {
    console.error('FAIL', dishId, e.message, cleanTitle);
    fail++;
  }
}

const lines = Object.keys(credits).map(k => {
  const c = credits[k];
  const s = v => JSON.stringify(v);
  return '  ' + s(k) + ': { author: ' + s(c.author) + ', license: ' + s(c.license) + ', url: ' + s(c.url) + ' }';
});
fs.writeFileSync(path.join(base, 'assets', 'js', 'credits.js'),
  '// Источники фотографий (Wikimedia Commons). Сгенерировано finalize-photos.mjs.\nconst CREDITS = {\n' + lines.join(',\n') + '\n};\n',
  'utf8');
console.log('Готово. Успешно:', ok, 'Ошибок:', fail, '| credits.js записан');
