(function () {
  var section=document.querySelector('.v3clients');
  if(section){
    var button=section.querySelector('button');
    var extra=Array.from(section.querySelectorAll('[data-client-extra]'));
    function show(open){
      extra.forEach(function(item){item.hidden=!open;});
      button.setAttribute('aria-expanded',String(open));
      button.innerHTML=(open?'Свернуть':'Все клиенты и партнёры')+' <span aria-hidden="true">'+(open?'−':'+')+'</span>';
    }
    button.hidden=false;show(false);
    button.addEventListener('click',function(){show(button.getAttribute('aria-expanded')!=='true');});
  }
})();
