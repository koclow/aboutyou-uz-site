import { chromium } from '/Users/nikitakozlov/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const OUT = process.argv[2];
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
// file:// не даёт читать cssRules чужих файлов, поэтому поднимаем локальный сервер
const ROOT = process.cwd() + '/preview-site';
const MIME = {html:'text/html',css:'text/css',js:'text/javascript',png:'image/png',jpg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',woff2:'font/woff2',woff:'font/woff',mp4:'video/mp4'};
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'content-type': MIME[path.extname(f).slice(1)] || 'application/octet-stream'}); r.end(d); }); }).listen(8766);
const URL = 'http://localhost:8766/v3.html';
const b = await chromium.launch();
for (const [name, w, h] of [['About You UZ — v3 (десктоп 1440)', 1440, 900], ['About You UZ — v3 (мобильный 390)', 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  await p.emulateMedia({ media: 'screen' });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelectorAll('.rise').forEach(e => e.classList.add('in')));
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
  // печать считает vh от высоты листа: перед экспортом заменяем vh на px от экрана h
  await p.evaluate((vh) => {
    const RX = /(\d*\.?\d+)(?:s|d|l)?vh\b/g;
    const walk = (rules) => { let out = '';
      for (const r of rules) {
        if (r.style) { let decl = '';
          for (const prop of r.style) { const v = r.style.getPropertyValue(prop); if (RX.test(v)) decl += `${prop}:${v.replace(RX, (_, n) => (parseFloat(n) * vh) + 'px')}${r.style.getPropertyPriority(prop) ? ' !important' : ''};`; RX.lastIndex = 0; }
          if (decl) out += `${r.selectorText}{${decl}}\n`;
        } else if (r.cssRules) { const inner = walk(r.cssRules); if (inner) out += `@${r.constructor.name === 'CSSMediaRule' ? 'media' : 'supports'} ${r.conditionText}{${inner}}\n`; }
      }
      return out; };
    let css = '';
    for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { console.log('skip', sh.href); continue; } css += walk(rules); }
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }, h / 100);
  await p.waitForTimeout(800);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.pdf({ path: `${OUT}/${name}.pdf`, width: `${w}px`, height: `${H + 2}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log(name, w, H);
}
await b.close(); srv.close();
