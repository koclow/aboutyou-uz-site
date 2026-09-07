import { readFileSync, writeFileSync } from 'node:fs';

// v2: «выставки» → «ивенты» в ОБЩИХ фрагментах (метка фильтра и тег
// каталога), не трогая index.html. Порядок замен: длинная первой.
const eventify = (s) => s.replace(/Выставки и события/g, 'Ивенты').replace(/Выставки/g, 'Ивенты');

// v3: строка подвала в общем фрагменте apply.html перечисляет четыре
// направления старым набором — на v3 их пять и в другом порядке.
// Правим здесь, а не в фрагменте: index.html и v2.html остаются как есть.
const v3ify = (s) => eventify(s)
  .replace('PR · Продакшн · IT · Мероприятия', 'PR · Инфлюенс · Ивенты · Продакшн · IT')
  .replace('<span class="how__node-t">События</span>', '<span class="how__node-t">Ивенты</span>');

const pages = [
  { tpl: 'index.template.html', out: 'index.html',
    sections: ['cases', 'how', 'about', 'apply'], post: (s) => s },
  { tpl: 'index-v2.template.html', out: 'v2.html',
    sections: ['v2-hero', 'v2-work', 'v2-cases', 'how', 'v2-about', 'apply'], post: eventify },
  { tpl: 'index-v3.template.html', out: 'v3.html',
    sections: ['v3-hero', 'v3-scale', 'v2-work', 'v2-cases', 'how', 'v2-about', 'apply'], post: v3ify },   // «вдох» (v3-breath) снят 07.09 по слову Никиты, файлы секции остались
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
