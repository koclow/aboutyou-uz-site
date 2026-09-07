/* About You UZ — секция «Что можно поручить нам»: вкладки, масштаб схемы, отрисовка линий.
   На телефоне (≤719) --how-k-min = .85: схема не складывается в список, а листается вбок
   (snap по узлам — в how.css), подсказка «Листайте →» — класс .how--pan ниже. */
(function () {
  var root = document.getElementById('how');
  if (!root) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('.how__tab'));
  if (!tabs.length) return;
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var head = root.querySelector('.how__head');
  var frames = Array.prototype.slice.call(root.querySelectorAll('.how__frame'));
  var STAGE = 1312;          /* ширина схемы в макете 1440 */
  var OUT = 200, IN = 300;   /* уход / приход панели, мс */
  var current = 0;
  var timers = [];   /* таймеры смены панели: новый клик их сбрасывает */

  /* ── масштаб схемы: k = ширина контента / 1312, не больше 1 и
     не меньше --how-k-min (ниже него подписи узлов не читаются).
     Упёрлись в минимум → схема шире рамки и листается вбок: об этом
     говорим словами через класс .how--pan. ── */
  function fit() {
    var w = (head || root).getBoundingClientRect().width;
    if (!w) return;
    var min = parseFloat(getComputedStyle(root).getPropertyValue('--how-k-min'));
    if (!(min > 0)) min = 0;
    var k = Math.min(1, w / STAGE);
    var pan = false;
    /* держим минимум только если он даёт заметный выигрыш: ради 20px
       прокрутки схему не режем и подсказку не показываем */
    if (min > 0 && k < min && STAGE * min - w > 24) { k = min; pan = true; }
    root.style.setProperty('--how-k', k.toFixed(4));
    root.classList.toggle('how--pan', pan);
    /* прокручиваемую рамку надо уметь листать и с клавиатуры */
    frames.forEach(function (f) {
      if (pan) {
        f.setAttribute('tabindex', '0');
        f.setAttribute('role', 'group');
        f.setAttribute('aria-label', 'Схема сценария, прокручивается по горизонтали');
      } else {
        f.removeAttribute('tabindex');
        f.removeAttribute('role');
        f.removeAttribute('aria-label');
      }
    });
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if ('ResizeObserver' in window && head) {
    var ro = new ResizeObserver(fit);   /* ссылку держим, иначе наблюдатель может быть собран GC */
    ro.observe(head);
  }

  /* ── первый показ панели: линии рисуются stroke-dashoffset'ом ── */
  function draw(panel) {
    if (!panel || panel.dataset.drawn === '1') return;
    panel.dataset.drawn = '1';
    if (reduce) return;
    var shapes = panel.querySelectorAll('.how__lines path, .how__lines circle');
    Array.prototype.forEach.call(shapes, function (el) {
      if (el.classList.contains('how__dot') || el.classList.contains('how__dash')) return;
      if (typeof el.getTotalLength !== 'function') return;
      var len = el.getTotalLength();
      if (!len) return;
      el.style.transition = 'none';
      el.style.strokeDasharray = len + ' ' + len;
      el.style.strokeDashoffset = len;
      void el.getBoundingClientRect();          /* перезапуск перехода */
      el.style.transition = 'stroke-dashoffset .5s var(--ease)';
      el.style.strokeDashoffset = '0';
      /* страховка: если переход не отработал (вкладка была неактивна) — линия всё равно на месте */
      window.setTimeout(function () {
        el.style.transition = '';
        el.style.strokeDasharray = '';
        el.style.strokeDashoffset = '';
      }, 900);
    });
  }

  function select(i, focus) {
    tabs.forEach(function (t, n) {
      t.setAttribute('aria-selected', n === i ? 'true' : 'false');
      t.tabIndex = n === i ? 0 : -1;
    });
    if (focus) tabs[i].focus();
  }

  /* Смена панели без блокировки: раньше на время анимации (900 мс) стоял
     замок busy, и клик в это окно помечал таб выбранным, а панель не менял —
     «переключается со второго раза» (Никита 07.09). Теперь каждый клик
     сбрасывает незавершённую смену и показывает нужную панель. */
  function show(i, focus) {
    select(i, focus);
    if (i === current) return;
    var out = panels[current], next = panels[i];
    current = i;
    timers.forEach(window.clearTimeout);
    timers = [];
    panels.forEach(function (pn) {
      if (pn !== next && pn !== out) { pn.hidden = true; pn.classList.remove('is-in', 'is-out'); }
    });
    if (!next) return;

    if (reduce || !out || out.hidden) {
      if (out) { out.hidden = true; out.classList.remove('is-in', 'is-out'); }
      next.classList.remove('is-in', 'is-out');
      next.hidden = false;
      draw(next);
      return;
    }

    out.classList.remove('is-in');
    out.classList.add('is-out');
    timers.push(window.setTimeout(function () {
      out.classList.remove('is-out');
      out.hidden = true;
      next.hidden = false;
      void next.offsetWidth;
      next.classList.add('is-in');
      draw(next);
      timers.push(window.setTimeout(function () { next.classList.remove('is-in'); }, IN + 400));
    }, OUT));
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { show(i, false); });
    tab.addEventListener('keydown', function (e) {
      var k = e.key, n = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = tabs.length - 1;
      if (n < 0) return;
      e.preventDefault();
      show(n, true);
    });
  });

  /* первая панель: линии рисуются, когда секция попала в кадр */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        draw(panels[0]);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    io.observe(root);
  } else {
    draw(panels[0]);
  }
})();
