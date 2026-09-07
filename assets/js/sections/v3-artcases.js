/* Ten initial cases, then complete groups of five. All content works without JS. */
(function () {
  var section = document.getElementById('cases');
  if (!section || !section.classList.contains('artcases')) return;
  var cards = Array.from(section.querySelectorAll('.artcases__case'));
  var foot = section.querySelector('.artcases__foot');
  var button = section.querySelector('.artcases__more');
  var status = section.querySelector('.artcases__status');
  var visible = 10;
  function render() {
    cards.forEach(function (card, i) { card.hidden = i >= visible; });
    foot.hidden = visible >= cards.length;
    status.textContent = 'Показано ' + Math.min(visible, cards.length) + ' из ' + cards.length;
  }
  button.addEventListener('click', function () {
    var first = cards[visible];
    visible += 5;
    render();
    if (first) {
      first.tabIndex = -1;
      first.focus({ preventScroll: true });
    }
  });
  render();
})();
