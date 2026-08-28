/* About You UZ — main.js */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* бесшовная лента услуг: дублируем контент до 1.2× ширины экрана, затем ×2 для сдвига -50% */
  var track = document.getElementById('belt-track');
  if (track) {
    var base = track.innerHTML;
    while (track.scrollWidth < window.innerWidth * 1.2) track.innerHTML += base;
    track.innerHTML += track.innerHTML;
  }

  /* шапка: фон и CTA после первого экрана */
  var nav = document.getElementById('nav');
  var hero = document.getElementById('top');
  if (nav && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      nav.classList.toggle('solid', !e[0].isIntersecting);
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
  }

  /* фильтр кейсов: оставшиеся карточки входят со стагером */
  var filters = document.querySelectorAll('.filter');
  var cards = document.querySelectorAll('.case-card');
  var count = document.getElementById('count');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      var f = btn.dataset.f, n = 0;
      cards.forEach(function (c) {
        var show = f === 'all' || c.dataset.dir === f;
        c.classList.remove('enter');
        c.classList.toggle('hide', !show);
        if (show) {
          if (!reduce) {
            c.style.animationDelay = (n * 30) + 'ms';
            void c.offsetWidth; /* перезапуск анимации */
            c.classList.add('enter');
          }
          n++;
        }
      });
      if (count) count.textContent = n;
    });
  });
  if (count) count.textContent = cards.length;

  /* счётчик цифр в кейсах: один раз, при появлении */
  function countUp(el) {
    var m = el.textContent.match(/^([+]?)(\d+(?:,\d+)?)(.*)$/);
    if (!m) return; /* нечисловые штампы («Тендер») не трогаем */
    var target = parseFloat(m[2].replace(',', '.'));
    var dec = m[2].indexOf(',') > -1 ? 2 : 0;
    var t0 = null, DUR = 800;
    function frame(ts) {
      if (!t0) t0 = ts;
      var t = Math.min((ts - t0) / DUR, 1);
      var p = 1 - Math.pow(1 - t, 3); /* ease-out cubic */
      el.textContent = m[1] + (target * p).toFixed(dec).replace('.', ',') + m[3];
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var statIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        statIo.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.case-card__stat b').forEach(function (el) { statIo.observe(el); });
  }

  /* клик по направлению — открыть каталог с этим фильтром */
  document.querySelectorAll('[data-goto]').forEach(function (a) {
    a.addEventListener('click', function () {
      var btn = document.querySelector('.filter[data-f="' + a.dataset.goto + '"]');
      if (btn) btn.click();
    });
  });

  /* появление блоков */
  var items = document.querySelectorAll('.rise');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
