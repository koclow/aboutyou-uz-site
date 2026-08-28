/* About You UZ — секция «Кейсы»: жест-подчёркивание, тихий фильтр, параллакс колонок */
(function () {
  var root = document.getElementById('cases');
  if (!root || !root.classList.contains('catalog')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ── маркерный штрих под «в виду»: рисуется stroke-dashoffset'ом при появлении ── */
  var mark = root.querySelector('.catalog__mark');
  var path = root.querySelector('.catalog__stroke path');
  if (mark && path) {
    var len = 240;
    if (path.getTotalLength) len = Math.ceil(path.getTotalLength());
    mark.style.setProperty('--catalog-stroke-len', len);
    if (reduce || !hasIO) {
      mark.classList.add('is-drawn');
    } else {
      var markIo = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        mark.classList.add('is-drawn');
        markIo.disconnect();
      }, { threshold: 0.6 });
      markIo.observe(mark);
    }
  }

  /* ── тихий фильтр: остающиеся карточки входят стагером 30 мс ── */
  var buttons = [].slice.call(root.querySelectorAll('.catalog__f'));
  var cards = [].slice.call(root.querySelectorAll('.catalog__card'));
  var count = document.getElementById('catalog-count');

  function apply(dir) {
    var shown = 0;
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-catalog-f') === dir;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    cards.forEach(function (c) {
      var show = dir === 'all' || c.getAttribute('data-dir') === dir;
      c.classList.remove('is-enter');
      c.classList.toggle('is-off', !show);
      if (!show) return;
      if (!reduce) {
        c.style.animationDelay = (shown * 30) + 'ms';
        void c.offsetWidth;            /* перезапуск анимации */
        c.classList.add('is-enter');
      }
      shown++;
    });
    if (count) count.textContent = shown;
    tick();                            /* высота колонок изменилась — пересчитать параллакс */
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-catalog-f')); });
  });

  /* клик по направлению в акте выше открывает каталог с этим фильтром */
  document.querySelectorAll('[data-goto]').forEach(function (a) {
    a.addEventListener('click', function () { apply(a.getAttribute('data-goto')); });
  });

  /* «Все кейсы»: страницы каталога пока нет — кнопка честно снимает фильтр
     и возвращает к началу каталога, а не притворяется переходом */
  var all = root.querySelector('[data-catalog-all]');
  if (all) {
    all.addEventListener('click', function () {
      apply('all');
      root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ── параллакс колонок ──
     Работает только там, где колонки — реальные боксы (три колонки, ≥1200).
     На 900–1200 колонки раскладываются в две (display:contents), ниже 900 —
     в одну; трансформировать нечего, и по контракту приём выключен. */
  var grid = document.getElementById('catalog-grid');
  var cols = grid ? [].slice.call(grid.querySelectorAll('.catalog__col')) : [];
  var FACTOR = [0, 0.06, 0.03];
  var MAX = 90;                        /* потолок сдвига, чтобы колонка не выходила из акта */
  var running = false;
  var ticking = false;

  function able() {
    return !reduce && cols.length > 1 && window.innerWidth >= 1200;
  }

  function frame() {
    ticking = false;
    if (!running || !grid) return;
    var r = grid.getBoundingClientRect();
    if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
    /* нуль отсчёта — момент, когда каталог упирается в верх экрана: до него
       колонки стоят ровно на макетных сдвигах 0/140/64, дальше расходятся */
    var d = Math.max(0, -r.top);
    for (var i = 0; i < cols.length; i++) {
      var f = FACTOR[i] || 0;
      if (!f) continue;
      var y = Math.min(MAX, d * f);
      cols[i].style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    }
  }

  function tick() {
    if (ticking || !running) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  function sync() {
    var next = able();
    if (next === running) return;
    running = next;
    if (!running) {
      cols.forEach(function (c) { c.style.transform = ''; });
    } else {
      tick();
    }
  }

  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', function () { sync(); tick(); });
  sync();
  tick();
})();
