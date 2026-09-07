/* About You UZ — секция «Кейсы»: жест-подчёркивание, тихий фильтр,
   «Ещё кейсы» (v3), параллакс колонок (index/v2) */
(function () {
  var root = document.getElementById('cases');
  if (!root || !root.classList.contains('catalog')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var v3 = document.body.classList.contains('page-v3');
  var grid = document.getElementById('catalog-grid');

  /* ── колонки для index/v2 ──
     Фрагмент v2-cases.html с 07.09 — плоский список в порядке показа v3.
     На v2 каталог по-прежнему три колонки с параллаксом, поэтому здесь
     собираем их из data-col («a3» = колонка a, третья сверху) — прежний
     состав и порядок колонок сохраняются пиксель в пиксель. На index.html
     колонки уже в разметке, на v3 они не нужны. */
  if (grid && !v3 && !grid.querySelector('.catalog__col')) {
    var flat = [].slice.call(grid.querySelectorAll('.catalog__card[data-col]'));
    if (flat.length) {
      var byCol = {};
      ['a', 'b', 'c'].forEach(function (k) {
        var col = document.createElement('div');
        col.className = 'catalog__col catalog__col--' + k;
        byCol[k] = col;
      });
      flat.sort(function (x, y) {
        return parseInt(x.getAttribute('data-col').slice(1), 10) - parseInt(y.getAttribute('data-col').slice(1), 10);
      });
      flat.forEach(function (c) {
        c.hidden = false;                        /* порций на v2 нет — показываем всё */
        (byCol[c.getAttribute('data-col').charAt(0)] || byCol.a).appendChild(c);
      });
      ['a', 'b', 'c'].forEach(function (k) { grid.appendChild(byCol[k]); });
      grid.classList.add('is-cols');
    }
  }

  /* ── маркерный штрих под «результаты»: рисуется stroke-dashoffset'ом при появлении ── */
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

  /* ── тихий фильтр: остающиеся карточки входят стагером 30 мс ──
     На v3 фильтр выключен (Никита 07.09: не подсвечивать, где сколько
     кейсов): разметка и обработчики на месте, но apply ничего не делает —
     иначе клик по направлению в «Что делаем» (main.js нажимает скрытую
     кнопку) оставил бы каталог отфильтрованным без видимого сброса. */
  var filtersOn = !v3;
  var buttons = [].slice.call(root.querySelectorAll('.catalog__f'));
  var cards = [].slice.call(root.querySelectorAll('.catalog__card'));
  var count = document.getElementById('catalog-count');

  /* data-dir — направления через пробел («pr influence»), совпадение по токену */
  function inDir(card, dir) {
    if (dir === 'all') return true;
    return (' ' + (card.getAttribute('data-dir') || '') + ' ').indexOf(' ' + dir + ' ') !== -1;
  }

  function apply(dir) {
    if (!filtersOn) return;
    var shown = 0;
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-catalog-f') === dir;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    cards.forEach(function (c) {
      var show = inDir(c, dir);
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

  /* ── кнопка под каталогом ──
     v3: «Ещё кейсы» — порционная подгрузка без перехода: в разметке первые
     тринадцать карточек открыты, остальные под hidden; кнопка снимает hidden
     со следующей порции. Размер порции задаёт css (--catalog-page на сетке:
     13 на 4, 2 и 1 колонках, 12 на 3 — модули должны закрываться без дыр).
     Хвост меньше половины порции досыпается к текущей, чтобы не оставлять
     сироту на отдельный клик. Кончились карточки — кнопка исчезает.
     Пока вторая порция не открыта, смена ширины пересчитывает первую по
     новому --catalog-page: иначе 13 карточек на трёх колонках оставили бы
     дыру в последнем ряду.
     index/v2: страницы каталога нет — кнопка честно снимает фильтр и
     возвращает к началу каталога, а не притворяется переходом. */
  var all = root.querySelector('[data-catalog-all]');
  var foot = root.querySelector('.catalog__foot');

  function pageSize() {
    var n = grid ? parseInt(getComputedStyle(grid).getPropertyValue('--catalog-page'), 10) : 0;
    return n > 0 ? n : 10;
  }

  if (all && v3) {
    var total = cards.length;
    var visible = 0;
    function reveal(upto) {
      var page = pageSize();
      if (total - upto < page / 2) upto = total;
      var first = null;
      cards.forEach(function (c, i) {
        var show = i < upto;
        if (show && c.hidden && !first) first = c;
        c.hidden = !show;
      });
      visible = Math.min(upto, total);
      if (foot) foot.hidden = visible >= total;
      return first;
    }
    reveal(pageSize());
    window.addEventListener('resize', function () {
      if (visible < total && visible !== pageSize()) reveal(pageSize());
    });
    all.addEventListener('click', function () {
      var first = reveal(visible + pageSize());
      if (first) {                       /* клавиатуре — фокус на первую новую карточку */
        first.setAttribute('tabindex', '-1');
        first.focus({ preventScroll: true });
      }
    });
  } else if (all) {
    all.addEventListener('click', function () {
      apply('all');
      root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ── параллакс колонок ──
     Работает только там, где колонки — реальные боксы (три колонки, ≥1200).
     На 900–1200 колонки раскладываются в две (display:contents), ниже 900 —
     в одну; трансформировать нечего, и по контракту приём выключен.
     На v3 колонок нет вовсе: модульная сетка, без параллакса (07.09). */
  var cols = grid ? [].slice.call(grid.querySelectorAll('.catalog__col')) : [];
  var FACTOR = [0, 0.06, 0.03];
  var MAX = 90;                        /* потолок сдвига, чтобы колонка не выходила из акта */
  var running = false;
  var ticking = false;
  var calm = v3;

  function able() {
    return !reduce && !calm && cols.length > 1 && window.innerWidth >= 1200;
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
