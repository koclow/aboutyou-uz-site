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

  /* шапка: фон и CTA после первого экрана.
     Если в разметке есть [data-nav-anchor] (блок внутри hero), следим
     за ним без отступа; иначе — за #top с отступом. На всех трёх
     страницах сейчас якоря нет (столбик на hero сняли 07.09). */
  var nav = document.getElementById('nav');
  var hero = document.getElementById('top');
  var anchor = document.querySelector('[data-nav-anchor]');
  if (nav && (anchor || hero) && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      nav.classList.toggle('solid', !e[0].isIntersecting);
    }, { rootMargin: anchor ? '0px' : '-64px 0px 0px 0px' }).observe(anchor || hero);
  }

  /* клик по направлению — открыть каталог с этим фильтром */
  document.querySelectorAll('[data-goto]').forEach(function (a) {
    a.addEventListener('click', function () {
      var btn = document.querySelector('.catalog__f[data-catalog-f="' + a.dataset.goto + '"]');
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
