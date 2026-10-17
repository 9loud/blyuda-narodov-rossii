// Генератор презентации к защите проекта «Блюда народов России».
// Запуск: node _scripts/make-pptx.mjs
// Результат: _docs/Блюда народов России - презентация.pptx
import pptxgen from 'pptxgenjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');
const shots = path.join(base, '_staging', 'shots');
const dishes = path.join(base, 'assets', 'img', 'dishes');
const docs = path.join(base, '_docs');
fs.mkdirSync(docs, { recursive: true });

const INK = '2B2118', SOFT = '6E604F', THREAD = 'A63B2A', LINEN = 'F2EBDD', PAPER = 'F7F1E4';
const FT = 'Georgia', FB = 'Tahoma';
const CUISINE_DOTS = [
  ['A63B2A', 'русская'], ['2F7D5A', 'татарская'], ['B98A1E', 'башкирская'],
  ['7A3038', 'осетинская'], ['2C6E9B', 'бурятская'], ['4E8E8B', 'якутская']
];

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9'; // 10 × 5,625 дюйма

const P = f => path.join(shots, f);
const D = f => path.join(dishes, f);

function frame(n) {
  const s = pptx.addSlide();
  s.background = { color: LINEN };
  s.addShape(pptx.ShapeType.line, { x: 0.55, y: 0.34, w: 8.9, h: 0, line: { color: THREAD, width: 2, dashType: 'dash' } });
  s.addText('Блюда народов России · школьный проект 9М · школа №2, Мурино', { x: 0.55, y: 5.24, w: 7.5, h: 0.3, fontFace: FB, fontSize: 9, color: SOFT });
  s.addText(String(n), { x: 9.05, y: 5.24, w: 0.4, h: 0.3, fontFace: FB, fontSize: 9, color: SOFT, align: 'right' });
  return s;
}
function head(s, t) {
  s.addText(t, { x: 0.55, y: 0.5, w: 8.9, h: 0.7, fontFace: FT, fontSize: 28, bold: true, color: INK });
}
function list(s, items, o = {}) {
  s.addText(items.map(t => ({ text: t, options: { bullet: true, breakLine: true } })), {
    x: o.x ?? 0.6, y: o.y ?? 1.5, w: o.w ?? 8.8, h: o.h ?? 3.4,
    fontFace: FB, fontSize: o.size ?? 15, color: SOFT, lineSpacingMultiple: 1.2, valign: 'top'
  });
}
function img(s, file, x, y, w, h) {
  s.addImage({ path: file, x, y, w, h, sizing: { type: 'cover', w, h } });
}

// ——— Слайд 1. Титульный ———
{
  const s = pptx.addSlide();
  s.background = { color: LINEN };
  s.addShape(pptx.ShapeType.line, { x: 3.3, y: 1.02, w: 3.4, h: 0, line: { color: THREAD, width: 2.5, dashType: 'dash' } });
  s.addText('БЛЮДА НАРОДОВ РОССИИ', { x: 0.4, y: 1.3, w: 9.2, h: 1.1, fontFace: FT, fontSize: 40, bold: true, color: INK, align: 'center', charSpacing: 1 });
  s.addText('Интерактивный сайт о кухнях шести народов нашей страны', { x: 0.5, y: 2.42, w: 9, h: 0.5, fontFace: FB, fontSize: 17, color: SOFT, align: 'center' });
  const dotW = 0.13, gap = 0.42;
  let x = (10 - (CUISINE_DOTS.length * dotW + (CUISINE_DOTS.length - 1) * gap)) / 2;
  for (const [color] of CUISINE_DOTS) {
    s.addShape(pptx.ShapeType.ellipse, { x, y: 3.2, w: dotW, h: dotW, fill: { color }, line: { color, width: 0 } });
    x += dotW + gap;
  }
  s.addText([
    { text: 'Авторы: Кирилл Чурсинов и Кирилл Кольчик · 9М класс', options: { breakLine: true } },
    { text: 'Школа №2, г. Мурино · 2026 год', options: {} }
  ], { x: 0.5, y: 3.95, w: 9, h: 0.8, fontFace: FB, fontSize: 14, color: SOFT, align: 'center', lineSpacingMultiple: 1.3 });
  s.addNotes('Здравствуйте! Мы — Кирилл Чурсинов и Кирилл Кольчик из 9М класса. Наш проект называется «Блюда народов России»: мы сделали сайт, который знакомит с кухнями шести народов нашей страны.');
}

// ——— Слайд 2. Актуальность ———
{
  const s = frame(2);
  head(s, 'Почему это важно');
  list(s, [
    'В России живёт более 190 народов — и у каждого своя кухня',
    'Мы часто знаем пиццу и суши лучше, чем блюда соседних народов',
    'Мурино — молодой город, куда переезжают люди из разных регионов страны',
    'Еда — простой способ познакомиться с культурой: приготовил, попробовал, поделился'
  ], { y: 1.55, size: 16 });
  s.addNotes('Россия многонациональна: 190+ народов. Кухня — самый доступный способ узнать культуру соседей. Особенно это заметно в Мурино, где живут люди из разных регионов.');
}

// ——— Слайд 3. Цель и задачи ———
{
  const s = frame(3);
  head(s, 'Цель и задачи');
  s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 1.35, w: 8.8, h: 0.8, fill: { color: PAPER }, line: { color: 'D8CBB2', width: 1 }, rectRadius: 0.08 });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.35, w: 0.07, h: 0.8, fill: { color: THREAD }, line: { color: THREAD, width: 0 } });
  s.addText('Цель — создать сайт «Блюда народов России», который в увлекательной и современной форме знакомит с кулинарными традициями народов страны.', { x: 0.85, y: 1.4, w: 8.4, h: 0.7, fontFace: FB, fontSize: 13.5, color: INK, valign: 'middle' });
  list(s, [
    'Изучить кухни шести народов и отобрать блюда',
    'Собрать истории, рецепты и фотографии из открытых источников',
    'Придумать дизайн и сделать сайт: карта, каталог, поиск, фильтры',
    'Проверить на телефоне и опубликовать в интернете'
  ], { y: 2.45, size: 15 });
  s.addNotes('Цель и четыре задачи: изучить кухни, собрать материалы, придумать дизайн, сделать и проверить сайт.');
}

// ——— Слайд 4. Дизайн ———
{
  const s = frame(4);
  head(s, 'Идея дизайна: «вышитая карта»');
  list(s, [
    'Оформление как вышивка: фон — цвет льна, текст — «чернила»',
    'Пунктирные «стежки» и карта в «пяльцах»',
    'У каждой кухни свой цвет «нити» — как у ниток в вышивке'
  ], { y: 1.45, size: 15, h: 1.6 });
  const cw = 1.47;
  CUISINE_DOTS.forEach(([color, name], i) => {
    const x = 0.62 + i * cw;
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.52, y: 3.15, w: 0.3, h: 0.3, fill: { color }, line: { color, width: 0 } });
    s.addText(name, { x, y: 3.55, w: cw, h: 0.3, fontFace: FB, fontSize: 10.5, color: SOFT, align: 'center' });
  });
  s.addText('Дизайн придумали сами: кухни — как нити, которыми «вышита» карта России.', { x: 0.62, y: 4.15, w: 8.8, h: 0.4, fontFace: FB, fontSize: 12, italic: true, color: SOFT });
  s.addNotes('Метафора дизайна: карта России «вышита» нитями шести кухонь. Цвета взяли из традиционной вышивки и платков народов.');
}

// ——— Слайд 5. Главная с картой ———
{
  const s = frame(5);
  head(s, 'Главная страница — карта России');
  list(s, [
    'Кликабельная карта: шесть точек — шесть кухонь',
    'Нажимаешь на точку — открывается каталог нужной кухни',
    'Карта построена по геоданным Natural Earth — остаётся чёткой на любом экране'
  ], { x: 0.6, y: 1.6, w: 3.6, size: 13.5, h: 3.2 });
  img(s, P('home-v.png'), 4.35, 1.4, 5.1, 3.5);
  s.addNotes('Главная — сердце сайта: интерактивная карта. Показываем, как точки открывают каталог нужной кухни.');
}

// ——— Слайд 6. Каталог ———
{
  const s = frame(6);
  head(s, 'Каталог: поиск и фильтры');
  list(s, [
    '18 блюд — по три от каждой кухни',
    'Поиск по названию и ингредиентам (например, «сыр»)',
    'Фильтры: кухни и категории — супы, основные блюда, выпечка, закуски, сладкое, напитки'
  ], { x: 0.6, y: 1.6, w: 3.6, size: 13.5, h: 3.2 });
  img(s, P('catalog-v.png'), 4.35, 1.4, 5.1, 3.5);
  s.addNotes('В каталоге ищем блюдо по ингредиенту или фильтруем по кухне. Если есть возможность — показать поиск вживую.');
}

// ——— Слайд 7. Карточка блюда ———
{
  const s = frame(7);
  head(s, 'Карточка блюда');
  list(s, [
    'История: откуда взялось блюдо',
    'Состав и пошаговый рецепт',
    'Интересный факт',
    'Автор и лицензия фотографии — всё честно'
  ], { x: 0.6, y: 1.7, w: 3.6, size: 14, h: 3.0 });
  img(s, P('modal-d.png'), 4.35, 1.15, 5.1, 3.9);
  s.addNotes('Открываем карточку блюда: история, рецепт, факт и подпись автора фото.');
}

// ——— Слайд 8. Шесть блюд ———
{
  const s = frame(8);
  head(s, 'Шесть кухонь — шесть блюд');
  const items = [
    ['shchi.jpg', 'Щи · русская'],
    ['echpochmak.jpg', 'Эчпочмак · татарская'],
    ['kumys.jpg', 'Кумыс · башкирская'],
    ['fydzhyn.jpg', 'Фыдджын · осетинская'],
    ['buuzy.jpg', 'Буузы · бурятская'],
    ['stroganina.jpg', 'Строганина · якутская']
  ];
  const cw2 = 2.9, ch = 1.34, gapx = 0.15, gapy = 0.12;
  const x0 = 0.6, y0 = 1.32;
  items.forEach(([file, label], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = x0 + col * (cw2 + gapx);
    const y = y0 + row * (ch + gapy + 0.34);
    img(s, D(file), x, y, cw2, ch);
    s.addText(label, { x, y: y + ch + 0.01, w: cw2, h: 0.3, fontFace: FB, fontSize: 11, color: SOFT, align: 'center' });
  });
  s.addNotes('По одному блюду от каждой кухни: щи, эчпочмак, кумыс, фыдджын, буузы, строганина. У каждого — своя история на сайте.');
}

// ——— Слайд 9. Как устроен сайт ———
{
  const s = frame(9);
  head(s, 'Как устроен сайт');
  list(s, [
    'Только HTML, CSS и JavaScript — без библиотек и сборки',
    'Открывается без интернета — прямо с флешки; в сети работает на GitHub Pages',
    'Карта — из открытых геоданных Natural Earth, фото — с Wikimedia Commons (авторы указаны)',
    'Шрифты — свободные, всё хранится локально',
    'Сайт адаптирован для телефона и большого экрана'
  ], { y: 1.55, size: 15.5 });
  s.addNotes('Технически всё просто и надёжно: обычные веб-файлы. Сайт проверили на телефоне, фото и карта — из открытых источников.');
}

// ——— Слайд 10. Итоги ———
{
  const s = pptx.addSlide();
  s.background = { color: LINEN };
  s.addShape(pptx.ShapeType.line, { x: 3.3, y: 1.35, w: 3.4, h: 0, line: { color: THREAD, width: 2.5, dashType: 'dash' } });
  s.addText('Спасибо за внимание!', { x: 0.5, y: 1.6, w: 9, h: 0.9, fontFace: FT, fontSize: 34, bold: true, color: INK, align: 'center' });
  s.addText('6 кухонь · 18 блюд · карта, поиск, рецепты · открытые источники', { x: 0.5, y: 2.6, w: 9, h: 0.5, fontFace: FB, fontSize: 15, color: SOFT, align: 'center' });
  s.addText('Мы поняли главное: кухня — это живая история народа.', { x: 0.5, y: 3.15, w: 9, h: 0.5, fontFace: FB, fontSize: 15, italic: true, color: SOFT, align: 'center' });
  s.addText('Вопросы?', { x: 0.5, y: 3.9, w: 9, h: 0.5, fontFace: FB, fontSize: 15, bold: true, color: THREAD, align: 'center' });
  s.addText('Кирилл Чурсинов и Кирилл Кольчик · 9М класс · школа №2, г. Мурино', { x: 0.5, y: 4.75, w: 9, h: 0.4, fontFace: FB, fontSize: 11, color: SOFT, align: 'center' });
  s.addNotes('Подводим итоги: сайт готов и работает. Спасибо за внимание — готовы ответить на вопросы.');
}

const out = path.join(docs, 'Блюда народов России - презентация.pptx');
await pptx.writeFile({ fileName: out });
console.log('Готово:', out);
