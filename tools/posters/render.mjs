// Рендер обложек-«афиш» кейсов. Playwright открывает шаблон нужного типа с
// параметрами во viewport 1200×1500, снимает PNG, затем PNG → jpg (q82) и webp.
//
//   node tools/posters/render.mjs                 # все задания из jobs.json
//   node tools/posters/render.mjs --only slug     # одно задание
//   node tools/posters/render.mjs --jobs my.json  # другой файл заданий
//
// Задание: { slug, type: "frame"|"composition"|"type", params: {...} }
// Пути картинок в params — относительно tools/posters/ (обычно src/…).
// Выход: assets/img/cases/posters/<slug>.jpg + .webp; PNG — в out/ рядом (не для сайта).
// Ничего глобально не ставит: Playwright берётся из кэша npx, webp — cwebp или Pillow.

import { chromium } from '/Users/nikitakozlov/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..', '..');
const OUT_SITE = join(SITE, 'assets', 'img', 'cases', 'posters');
const OUT_PNG = join(HERE, 'out');
const W = 1200, H = 1500, JPG_Q = 82, WEBP_Q = 82;

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const jobsFile = resolve(opt('--jobs') || join(HERE, 'jobs.json'));
const only = opt('--only');

const jobs = JSON.parse(readFileSync(jobsFile, 'utf8')).filter(j => !only || j.slug === only);
if (!jobs.length) { console.error('нет заданий'); process.exit(1); }
mkdirSync(OUT_SITE, { recursive: true });
mkdirSync(OUT_PNG, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

for (const job of jobs) {
  const tpl = join(HERE, `${job.type}.html`);
  if (!existsSync(tpl)) { console.error(`нет шаблона ${job.type}`); continue; }
  const url = pathToFileURL(tpl).href + '?p=' + encodeURIComponent(JSON.stringify(job.params));
  await page.goto(url);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  const png = join(OUT_PNG, `${job.slug}.png`);
  await page.screenshot({ path: png, clip: { x: 0, y: 0, width: W, height: H } });

  const jpg = join(OUT_SITE, `${job.slug}.jpg`);
  const webp = join(OUT_SITE, `${job.slug}.webp`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(JPG_Q), png, '--out', jpg], { stdio: 'ignore' });
  try {
    execFileSync('cwebp', ['-quiet', '-q', String(WEBP_Q), png, '-o', webp]);
  } catch {
    execFileSync('python3', ['-c', `from PIL import Image; Image.open(${JSON.stringify(png)}).convert('RGB').save(${JSON.stringify(webp)}, quality=${WEBP_Q})`]);
  }
  console.log(`✓ ${job.slug}  (${job.type})`);
}
await browser.close();
