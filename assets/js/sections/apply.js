/* About You UZ — apply.js · черновик заявки и честный сабмит.
   Правило студии: пользовательский ввод не теряется никогда.
   Черновик пишется в localStorage при вводе (debounce 300мс) и
   восстанавливается при загрузке. Чистится ТОЛЬКО после
   подтверждённой успешной отправки — которой пока нет,
   поэтому здесь его не чистит никто. */
(function () {
  var form = document.getElementById('apply-form');
  if (!form) return;

  var KEY = 'aboutyou.apply.draft.v1';
  var TTL = 14 * 24 * 60 * 60 * 1000; /* через две недели черновик протух — человек передумал */
  var DEBOUNCE = 300;

  var fields = Array.prototype.slice.call(
    form.querySelectorAll('input[name], textarea[name]')
  );
  if (!fields.length) return;

  /* localStorage бывает недоступен (приватный режим, отключённые куки) —
     форма обязана работать и без него */
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var box = JSON.parse(raw);
      if (!box || typeof box !== 'object' || !box.data) return null;
      if (box.at && Date.now() - box.at > TTL) {
        window.localStorage.removeItem(KEY);
        return null;
      }
      return box.data;
    } catch (e) {
      return null;
    }
  }

  function save() {
    var data = {};
    fields.forEach(function (el) {
      if (el.value) data[el.name] = el.value;
    });
    try {
      /* пустой черновик не храним, но и поля при этом не трогаем */
      var empty = true, k;
      for (k in data) { if (Object.prototype.hasOwnProperty.call(data, k)) { empty = false; break; } }
      if (empty) window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data: data }));
    } catch (e) { /* переполнение или запрет хранилища — молча живём дальше */ }
  }

  /* восстановление: только пустые поля, чтобы не затирать автозаполнение */
  var draft = load();
  if (draft) {
    fields.forEach(function (el) {
      if (!el.value && typeof draft[el.name] === 'string') el.value = draft[el.name];
    });
  }

  var timer = null;
  function schedule() {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(function () { timer = null; save(); }, DEBOUNCE);
  }
  function flush() {
    if (timer) { window.clearTimeout(timer); timer = null; }
    save();
  }

  fields.forEach(function (el) {
    el.addEventListener('input', schedule);
    el.addEventListener('change', flush);
  });
  /* уход со страницы не должен съедать последние 300мс ввода */
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  /* Отправки пока нет. Не врём «отправлено», не чистим поля,
     не чистим черновик — просто говорим, как с нами связаться. */
  var status = document.getElementById('apply-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    flush();
    if (!status) return;
    status.hidden = false;
    if (typeof status.scrollIntoView === 'function') {
      status.scrollIntoView({ block: 'nearest' });
    }
  });
})();
