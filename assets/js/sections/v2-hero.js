/* About You UZ — герой v2: кадр-слайдер. Рамка переезжает между
   пропорциями кейсов, картинки меняются кроссфейдом. Ход останавливается,
   когда вкладка скрыта или герой ушёл из вида. */
(function () {
  var frame = document.getElementById('vhero-frame');
  if (!frame) return;

  var slides = [].slice.call(frame.querySelectorAll('.vhero__slide'));
  if (slides.length < 2) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP = 3800;
  var i = 0;
  var timer = null;
  var onScreen = true;

  /* размер рамки: data-w/data-h — пиксели макета 1440, отдаём в vw и в пропорцию */
  function size(n) {
    var s = slides[n];
    var w = parseFloat(s.getAttribute('data-w'));
    var h = parseFloat(s.getAttribute('data-h'));
    if (!w || !h) return;
    frame.style.setProperty('--fw', (w / 14.4).toFixed(3));
    frame.style.setProperty('--arn', (w / h).toFixed(4));
  }

  function show(n) {
    slides[i].classList.remove('is-on');
    i = n;
    slides[i].classList.add('is-on');
    size(i);
  }

  function next() { show((i + 1) % slides.length); }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function start() {
    if (timer || reduce || !onScreen || document.hidden) return;
    timer = setInterval(next, STEP);
  }

  size(0);
  if (reduce) return;              /* смен нет: первый кадр 620×349, как в css */

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  var hero = frame.closest ? frame.closest('.vhero') : null;
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      onScreen = e[0].isIntersecting;
      if (onScreen) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  } else {
    start();
  }
})();
