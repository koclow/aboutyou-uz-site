// Контрольный лист пилота: обложки из jobs.json в ряд на бумаге #F2EFE9, подпись типа под каждой.
//   node tools/posters/sheet.mjs <выход.png> [--jobs jobs.json] [--title "…"]
import { chromium } from '/Users/nikitakozlov/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const out = resolve(args.find(a => !a.startsWith('--') && a.endsWith('.png')) || join(HERE, 'out', 'sheet.png'));
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const jobs = JSON.parse(readFileSync(resolve(opt('--jobs') || join(HERE, 'jobs.json')), 'utf8'));
const title = opt('--title') || 'Обложки кейсов — пилот';
const TYPE = { frame: 'Кадр', composition: 'Композиция', type: 'Типографика' };
const W = 2400, H = 1500;

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&family=Golos+Text:wght@400;500&display=swap">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;background:#F2EFE9;color:#141312;font-family:"Golos Text",system-ui,sans-serif;padding:72px 80px;overflow:hidden}
h1{font-family:Unbounded,sans-serif;font-weight:700;font-size:30px;letter-spacing:-.01em;text-transform:uppercase}
.sub{font-size:20px;color:rgba(20,19,18,.6);margin-top:10px}
.row{display:grid;grid-template-columns:repeat(${jobs.length},1fr);gap:64px;margin-top:64px}
.p img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;box-shadow:0 30px 60px rgba(20,19,18,.14)}
.cap{margin-top:28px}
.cap .t{display:block;margin-top:8px;font-size:18px;line-height:1.3}
.k{font-family:Unbounded,sans-serif;font-weight:700;font-size:15px;letter-spacing:.06em;text-transform:uppercase}
.k::before{content:"";display:inline-block;width:9px;height:9px;border-radius:50%;background:#E10600;margin-right:12px;vertical-align:1px}
.t{color:rgba(20,19,18,.7)}
.s{font-size:15px;color:rgba(20,19,18,.45);margin-top:8px;font-variant-numeric:tabular-nums}
.legend{display:grid;grid-template-columns:repeat(3,1fr);gap:64px;margin-top:88px;padding-top:28px;border-top:1px solid rgba(20,19,18,.12)}
.legend b{display:block;font-family:Unbounded,sans-serif;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
.legend p{font-size:16px;line-height:1.45;color:rgba(20,19,18,.7)}
.foot{position:absolute;left:80px;right:80px;bottom:56px;display:flex;justify-content:space-between;font-size:15px;color:rgba(20,19,18,.45);border-top:1px solid rgba(20,19,18,.12);padding-top:18px}
</style></head><body>
<h1>${title}</h1>
<p class="sub">Формат 4:5 · 1200×1500 · внутренняя рамка 2 px с отступом 4 % · насыщенность −15 %, тёплые тени, приподнятый чёрный, зерно · подпись живёт в карточке, не в картинке</p>
<div class="row">${jobs.map(j => `
  <div class="p"><img src="${pathToFileURL(join(HERE, 'out', j.slug + '.png')).href}">
    <div class="cap"><span class="k">${TYPE[j.type] || j.type}</span><span class="t">${j.title || ''}</span></div>
    <div class="s">${j.slug}.jpg · фон ${j.params.bg || 'фото'}</div></div>`).join('')}
</div>
<div class="legend">
  <div><b>Кадр</b><p>Есть хорошая фотография: фото + единая обработка + рамка. Ничего больше. Кадрирование под 4:5 с вниманием к главному объекту.</p></div>
  <div><b>Композиция</b><p>Фото нет: плоский цвет из проекта (приглушённый, редакционный), один главный элемент крупно и не по центру — вырезка, портрет, одна карточка интерфейса; мягкая тень; можно один второстепенный элемент мелко. Всё прямо.</p></div>
  <div><b>Типографика</b><p>Только 2–3 крупные истории: одна цифра или одно слово в Unbounded на цветном фоне плюс маленький реальный элемент картинки.</p></div>
</div>
<div class="foot"><span>About You UZ · Сайт/tools/posters</span><span>${new Date().toLocaleDateString('ru-RU')}</span></div>
</body></html>`;
const tmp = join(HERE, 'out', '_sheet.html');
writeFileSync(tmp, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(tmp).href);
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))); });
await page.screenshot({ path: out });
await browser.close();
console.log('✓', out);
