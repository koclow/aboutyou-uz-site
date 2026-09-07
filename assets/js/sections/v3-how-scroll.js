/* Mobile page-scroll tour of the selected diagram. CSS sticky does the pinning;
   an observer activates one rAF reader only while the section is near the viewport.
   No wheel/touch interception. Reduced motion and short landscape screens retain
   the original manual horizontal scroller. */
(function () {
  var root=document.querySelector('.how--refined');
  if(!root)return;
  var mobile=window.matchMedia('(max-width:719px)');
  var reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  var panels=Array.from(root.querySelectorAll('.how__panel'));
  var tabs=Array.from(root.querySelectorAll('.how__tab'));
  var enabled=false, near=false, raf=0, top=78;
  var items=panels.map(function(panel,i){
    var frame=panel.querySelector('.how__frame');
    var travel=document.createElement('div');travel.className='how__travel';
    var pin=document.createElement('div');pin.className='how__pin';
    var head=document.createElement('div');head.className='how__pin-head';
    var title=document.createElement('p');title.className='how__pin-title';
    title.textContent=tabs[i].textContent.replace(/^\s*0\d\s*/, '');
    var skip=document.createElement('button');skip.type='button';skip.className='how__skip';
    skip.textContent='Дальше ↓';skip.setAttribute('aria-label','Пропустить схему и перейти к разделу «О нас»');
    head.append(title,skip);
    var progress=document.createElement('div');progress.className='how__progress';
    progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Просмотр схемы');
    progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','100');progress.setAttribute('aria-valuenow','0');
    var bar=document.createElement('span');progress.append(bar);
    frame.before(travel);travel.append(pin);pin.append(head,frame,progress);
    var item={panel:panel,frame:frame,travel:travel,pin:pin,bar:bar,progress:progress,distance:0};
    skip.addEventListener('click',function(){
      var next=document.getElementById('about');
      next.tabIndex=-1;next.focus({preventScroll:true});
      window.scrollTo({top:next.getBoundingClientRect().top+window.scrollY-top,behavior:'instant'});
      update();
    });
    frame.addEventListener('keydown',function(e){
      if(!enabled)return;
      var target;
      if(e.key==='ArrowRight')target=frame.scrollLeft+180;
      if(e.key==='ArrowLeft')target=frame.scrollLeft-180;
      if(e.key==='Home')target=0;
      if(e.key==='End')target=item.distance;
      if(target===undefined)return;
      e.preventDefault();
      var y=travel.getBoundingClientRect().top+window.scrollY-top+Math.max(0,Math.min(item.distance,target));
      window.scrollTo({top:y,behavior:'instant'});update();
    });
    return item;
  });
  function active(){return items.find(function(i){return !i.panel.hidden;});}
  function update(){
    if(!enabled)return;
    var item=active();if(!item||!item.distance)return;
    var x=Math.max(0,Math.min(item.distance,top-item.travel.getBoundingClientRect().top));
    if(Math.abs(item.frame.scrollLeft-x)>.5)item.frame.scrollLeft=x;
    var progress=x/item.distance;
    item.bar.style.transform='scaleX('+progress+')';
    item.progress.setAttribute('aria-valuenow',String(Math.round(progress*100)));
  }
  function tick(){
    raf=0;update();
    if(enabled&&near&&!document.hidden)raf=requestAnimationFrame(tick);
  }
  function wake(){if(enabled&&near&&!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
  function configure(){
    var nav=document.getElementById('nav');top=(nav?nav.offsetHeight:66)+12;
    enabled=mobile.matches&&!reduced.matches&&window.innerHeight>=620&&CSS.supports('overflow-x','clip');
    root.classList.toggle('how--scroll-linked',enabled);
    document.body.classList.toggle('has-how-scroll',enabled);
    root.style.setProperty('--how-pin-top',top+'px');
    var item=active();if(!item)return;
    if(enabled){
      item.distance=Math.max(0,item.frame.scrollWidth-item.frame.clientWidth);
      item.travel.style.setProperty('--how-pan-distance',item.distance+'px');
      item.travel.style.setProperty('--how-pin-height',item.pin.offsetHeight+'px');
      // Large text may make the pinned scene taller than the available screen.
      if(item.pin.offsetHeight>window.innerHeight-top-12){
        enabled=false;root.classList.remove('how--scroll-linked');document.body.classList.remove('has-how-scroll');
      }
    }
    if(!enabled&&raf){cancelAnimationFrame(raf);raf=0;}
    update();wake();
  }
  var observer=new IntersectionObserver(function(entries){
    near=entries[0].isIntersecting;
    update();wake();
  },{rootMargin:'300px 0px'});
  observer.observe(root);
  root.addEventListener('how:change',configure);
  window.addEventListener('resize',configure);
  mobile.addEventListener('change',configure);reduced.addEventListener('change',configure);
  document.addEventListener('visibilitychange',function(){if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else wake();});
  new ResizeObserver(configure).observe(root.querySelector('.how__head'));
  window.addEventListener('load',configure);
  document.fonts.ready.then(configure);
  configure();
})();
