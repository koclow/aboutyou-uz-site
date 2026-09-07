/* Ten initial cases, then complete groups of five. All content works without JS. */
(function () {
  var section = document.getElementById('cases');
  if (!section || !section.classList.contains('artcases')) return;
  var cards = Array.from(section.querySelectorAll('.artcases__case'));
  var foot = section.querySelector('.artcases__foot');
  var button = section.querySelector('.artcases__more');
  var status = section.querySelector('.artcases__status');
  var initialIndex=cards.findIndex(function(card){return '#'+card.id===window.location.hash;});
  var visible = Math.max(10,Math.ceil((initialIndex+1)/5)*5);
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
  // Capture phase reveals a hidden target before the shared anchor handler measures it.
  document.querySelectorAll('[data-case-direction]').forEach(function(link){
    link.addEventListener('click',function(){
      var target=document.getElementById(link.hash.slice(1));
      var index=cards.indexOf(target);
      if(index<0)return;
      visible=Math.max(visible,Math.ceil((index+1)/5)*5);
      render();
      target.tabIndex=-1;
      target.focus({preventScroll:true});
    },true);
  });
  render();
})();
