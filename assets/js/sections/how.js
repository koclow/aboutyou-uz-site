/* About You UZ — секция «С чем вы приходите»: вкладки, масштаб схемы, отрисовка линий */
(function () {
  var root = document.getElementById('how');
  if (!root) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('.how__tab'));
  if (!tabs.length) return;
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var head = root.querySelector('.how__head');
  var STAGE = 1312;          /* ширина схемы в макете 1440 */
  var OUT = 200, IN = 300;   /* уход / приход панели, мс */
  var current = 0;
  var busy = false;

  /* ── масштаб схемы: k = ширина контента / 1312, не больше 1 ── */
  function fit() {
    var w = (head || root).getBoundingClientRect().width;
    if (!w) return;
    root.style.setProperty('--how-k', Math.min(1, w / STAGE).toFixed(4));
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

  function show(i, focus) {
    if (i === current || busy) { select(i, focus); return; }
    var out = panels[current], next = panels[i];
    current = i;
    select(i, focus);
    if (!out || !next) return;

    if (reduce) {
      out.hidden = true;
      next.hidden = false;
      draw(next);
      return;
    }

    busy = true;
    out.classList.add('is-out');
    window.setTimeout(function () {
      out.classList.remove('is-out');
      out.hidden = true;
      next.hidden = false;
      void next.offsetWidth;
      next.classList.add('is-in');
      draw(next);
      window.setTimeout(function () { next.classList.remove('is-in'); busy = false; }, IN + 400);
    }, OUT);
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
