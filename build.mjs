import { readFileSync, writeFileSync } from 'node:fs';

// v2: «выставки» → «ивенты» в ОБЩИХ фрагментах (метка фильтра и тег
// каталога), не трогая index.html. Порядок замен: длинная первой.
const eventify = (s) => s.replace(/Выставки и события/g, 'Ивенты').replace(/Выставки/g, 'Ивенты');

const pages = [
  { tpl: 'index.template.html', out: 'index.html',
    sections: ['cases', 'how', 'about', 'apply'], post: (s) => s },
  { tpl: 'index-v2.template.html', out: 'v2.html',
    sections: ['v2-hero', 'v2-work', 'cases', 'how', 'v2-about', 'apply'], post: eventify },
];

for (const p of pages) {
  let html = readFileSync(p.tpl, 'utf8');
  for (const name of p.sections) {
    const frag = p.post(readFileSync(`sections/${name}.html`, 'utf8').trim());
    html = html.replace(`<!-- include:${name} -->`, frag);
  }
  writeFileSync(p.out, html);
  console.log(`${p.out} собран: ${Buffer.byteLength(html)} байт`);
}
