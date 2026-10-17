// Генерация стилизованной SVG-карты России + пины кухонь.
// Результат: assets/js/map-data.js (встраивается без fetch), _staging/russia-map.svg, _staging/map-preview.html
// Данные: Natural Earth (public domain), проекция Альберса.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');
const staging = path.join(base, '_staging');
fs.mkdirSync(staging, { recursive: true });

const sources = [
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/RUS.geo.json'
];
let geo = null, used = '';
for (const s of sources) {
  try {
    console.log('Пробую:', s);
    const r = await fetch(s);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    geo = await r.json();
    used = s;
    break;
  } catch (e) { console.error('  не вышло:', e.message); }
}
if (!geo) { console.error('ГЕОДАННЫЕ НЕ ЗАГРУЖЕНЫ'); process.exit(1); }

let feat = geo;
if (geo.type === 'FeatureCollection') {
  feat = geo.features.find(f =>
    f.id === 'RUS' ||
    (f.properties && (f.properties.id === 'RUS' || f.properties.ADMIN === 'Russia' || f.properties.NAME === 'Russia'))
  ) || geo.features[0];
}
const geom = feat.geometry;
let polygons = [];
if (geom.type === 'Polygon') polygons = [geom.coordinates];
else if (geom.type === 'MultiPolygon') polygons = geom.coordinates;

// --- Проекция Альберса
const D2R = Math.PI / 180;
const LON0 = 100, PHI0 = 56 * D2R, PHI1 = 52 * D2R, PHI2 = 64 * D2R;
const N = (Math.sin(PHI1) + Math.sin(PHI2)) / 2;
const C = Math.cos(PHI1) ** 2 + 2 * N * Math.sin(PHI1);
const RHO0 = Math.sqrt(C - 2 * N * Math.sin(PHI0)) / N;
function project(lon, lat) {
  if (lon < 0) lon += 360;
  const phi = lat * D2R;
  const rho = Math.sqrt(C - 2 * N * Math.sin(phi)) / N;
  const th = N * (lon - LON0) * D2R;
  return [rho * Math.sin(th), RHO0 - rho * Math.cos(th)];
}

// --- Упрощение Дугласа-Пекера
function simplify(points, eps) {
  if (points.length <= 3) return points;
  const sq = eps * eps;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = -1, idx = -1;
    const [ax, ay] = points[a], [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px, ey = ay + t * dy - py;
      const dc = ex * ex + ey * ey;
      if (dc > maxD) { maxD = dc; idx = i; }
    }
    if (maxD > sq && idx > 0) { keep[idx] = true; stack.push([a, idx], [idx, b]); }
  }
  return points.filter((_, i) => keep[i]);
}

const projected = polygons.map(rings => rings.map(ring => ring.map(([lon, lat]) => project(lon, lat))));
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const rings of projected)
  for (const ring of rings)
    for (const [x, y] of ring) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
const W = 1200;
const scale = W / (maxX - minX);
const H = Math.round((maxY - minY) * scale);
const TX = (x) => +((x - minX) * scale).toFixed(1);
const TY = (y) => +((maxY - y) * scale).toFixed(1);

const epsProj = 0.45 / scale;
let d = '';
for (const rings of projected) {
  for (const ring of rings) {
    const simp = simplify(ring, epsProj);
    let first = true;
    for (const [x, y] of simp) { d += (first ? 'M' : 'L') + TX(x) + ' ' + TY(y); first = false; }
    d += 'Z';
  }
}
console.log(`path ${(d.length / 1024).toFixed(1)} KB; viewBox 0 0 ${W} ${H}`);

// --- Пины кухонь
const pinsCfg = [
  { key: 'moscow',      x: 172.5, y: 267,   cuisine: 'russian',  label: 'Русская'     },
  { key: 'kazan',       x: 243,   y: 343.7, cuisine: 'tatar',    label: 'Татарская'   },
  { key: 'ufa',         x: 280.3, y: 397.5, cuisine: 'bashkir',  label: 'Башкирская'  },
  { key: 'vladikavkaz', x: 64.8,  y: 456.5, cuisine: 'ossetian', label: 'Осетинская'  },
  { key: 'ulanude',     x: 738.7, y: 569,   cuisine: 'buryat',   label: 'Бурятская'   },
  { key: 'yakutsk',     x: 880.7, y: 358.8, cuisine: 'yakut',    label: 'Якутская'    }
];
const cuisineColors = { russian: '#A63B2A', tatar: '#2F7D5A', bashkir: '#B98A1E', ossetian: '#7A3038', buryat: '#2C6E9B', yakut: '#4E8E8B' };

let pins = '';
pinsCfg.forEach((p, i) => {
  const c = cuisineColors[p.cuisine];
  const lx = p.x + 20, ly = p.y + 7;
  pins += `\n<a class="map-pin" href="catalog.html?cuisine=${p.cuisine}" aria-label="${p.label} кухня: смотреть блюда" style="--c:${c}">` +
    `<g class="pin pin-${i + 1}">` +
    `<circle class="pin-ring" cx="${p.x}" cy="${p.y}" r="15"/>` +
    `<circle class="pin-dot" cx="${p.x}" cy="${p.y}" r="9"/>` +
    `</g>` +
    `<text class="pin-label pin-l${i + 1}" x="${lx}" y="${ly}">${p.label}</text>` +
    `</a>`;
});

const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Карта России: выберите кухню на карте">` +
`\n<defs><pattern id="weave" width="26" height="26" patternUnits="userSpaceOnUse">` +
`<path d="M0 26 L26 0" stroke="rgba(43,33,24,0.055)" stroke-width="2" stroke-dasharray="2.5 4.5"/></pattern></defs>` +
`\n<rect x="0" y="0" width="${W}" height="${H}" fill="url(#weave)"/>` +
`\n<path class="ru-land" fill-rule="evenodd" d="${d}"/>` +
pins +
`\n</svg>`;

fs.writeFileSync(path.join(staging, 'russia-map.svg'), svg, 'utf8');
fs.writeFileSync(path.join(base, 'assets', 'img', 'russia-map.svg'), svg, 'utf8');
const js = '// Сгенерировано автоматически (gen-map.mjs). Карта России + пины кухонь.\n' +
  '/* global window */\nconst MAP_SVG = `' + svg.replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`;\n';
fs.writeFileSync(path.join(base, 'assets', 'js', 'map-data.js'), js, 'utf8');

// превью для скриншота
const preview = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#F2EBDD;display:flex;align-items:center;justify-content:center;height:100vh}
.map-wrap{width:96vw}
svg{width:100%;height:auto;display:block}
.ru-land{fill:#382D21}
.pin-ring{fill:var(--c);opacity:.25}
.pin-dot{fill:var(--c);stroke:#F2EBDD;stroke-width:3}
.pin-label{font:700 26px 'PT Sans',sans-serif;fill:#2B2118;paint-order:stroke;stroke:#F2EBDD;stroke-width:7px;stroke-linejoin:round}
</style></head><body><div class="map-wrap">${svg}</div></body></html>`;
fs.writeFileSync(path.join(staging, 'map-preview.html'), preview, 'utf8');
console.log('Готово: map-data.js, assets/img/russia-map.svg, map-preview.html');
