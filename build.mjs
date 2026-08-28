// Сборка index.html из index.template.html + sections/*.html
import { readFileSync, writeFileSync } from 'node:fs';
let html = readFileSync('index.template.html', 'utf8');
for (const name of ['cases', 'how', 'about', 'apply']) {
  const frag = readFileSync(`sections/${name}.html`, 'utf8').trim();
  html = html.replace(`<!-- include:${name} -->`, frag);
}
writeFileSync('index.html', html);
console.log('index.html собран:', html.length, 'байт');
