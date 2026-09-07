/* v3: responsive ports keep every connector attached to its node.
   One SVG marker defines all arrowheads; no hand-positioned chevrons. */
(function () {
  var root = document.querySelector('.how--refined');
  if (!root) return;
  var tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function(t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ns = 'http://www.w3.org/2000/svg';
  var current = 0;
  function layout() {
    var stage = panels[current].querySelector('.how__stage');
    var frame = stage.parentElement, svg = stage.querySelector('svg');
    var width = stage.clientWidth, height = stage.clientHeight;
    svg.setAttribute('viewBox', '0 0 '+width+' '+height);
    var group = svg.querySelector('.how__routes');
    group.replaceChildren();
    root.classList.toggle('how--pan', width > frame.clientWidth+2);
    var nodes = {};
    stage.querySelectorAll('[data-node]').forEach(function(n){
      var x=n.offsetLeft,y=n.offsetTop,w=n.offsetWidth,h=n.offsetHeight;
      nodes[n.dataset.node]={l:x,r:x+w,t:y,b:y+h,x:x+w/2,y:y+h/2};
    });
    function path(d, arrow, soft) {
      var p=document.createElementNS(ns,'path'); p.setAttribute('d',d);
      if (arrow) p.setAttribute('marker-end','url(#how-head-'+(current+1)+')');
      if (soft) p.classList.add('how__route--soft');
      group.appendChild(p);
    }
    function link(a,b) {
      a=nodes[a];b=nodes[b];
      var sx=a.r+2, ex=b.l-10, middle=(sx+ex)/2;
      if(Math.abs(a.y-b.y)<2){path('M'+sx+' '+a.y+'H'+ex,true);return;}
      var sign=b.y>a.y?1:-1, radius=Math.min(16,(ex-sx)/4,Math.abs(b.y-a.y)/4);
      path('M'+sx+' '+a.y+'H'+(middle-radius)+'Q'+middle+' '+a.y+' '+middle+' '+(a.y+sign*radius)+'V'+(b.y-sign*radius)+'Q'+middle+' '+b.y+' '+(middle+radius)+' '+b.y+'H'+ex,true);
    }
    function loop(key) {
      var n=nodes[key], y=n.t-46;
      path('M'+(n.x+32)+' '+n.t+'V'+(y+14)+'Q'+(n.x+32)+' '+y+' '+(n.x+18)+' '+y+'H'+(n.x-18)+'Q'+(n.x-32)+' '+y+' '+(n.x-32)+' '+(y+14)+'V'+(n.t-9),true,true);
    }
    if(current===0){
      link('start','plan');
      for(var i=0;i<5;i++){link('plan','dir'+i);link('dir'+i,'launch');}
      link('launch','result');loop('launch');
    } else if(current===1){
      var a=nodes.plan,b=nodes.produce,c=nodes.publish,d=nodes.analyse,s=nodes.start,r=nodes.report,t=nodes.strategy;
      // Four quarters join actual node ports with horizontal/vertical tangents.
      path('M'+a.r+' '+a.y+'C'+b.x+' '+a.y+' '+b.x+' '+a.y+' '+b.x+' '+(b.t-10),true);
      path('M'+b.x+' '+b.b+'C'+b.x+' '+c.y+' '+b.x+' '+c.y+' '+(c.r+10)+' '+c.y,true);
      path('M'+c.l+' '+c.y+'C'+d.x+' '+c.y+' '+d.x+' '+c.y+' '+d.x+' '+(d.b+10),true);
      path('M'+d.x+' '+d.t+'C'+d.x+' '+a.y+' '+d.x+' '+a.y+' '+(a.l-10)+' '+a.y,true);
      // Start enters the planning node along the upper route; the reporting branch exits the cycle.
      var mx=s.r+26;
      path('M'+s.r+' '+s.y+'H'+(mx-12)+'Q'+mx+' '+s.y+' '+mx+' '+(s.y-12)+'V'+(a.y+12)+'Q'+mx+' '+a.y+' '+(mx+12)+' '+a.y+'H'+(a.l-10),true,true);
      link('produce','report');
      path('M'+r.x+' '+r.b+'V'+(t.t-10),true);
    } else {
      ['task','brief','produce','review'].forEach(function(n,i){link(n,['brief','produce','review','deliver'][i]);});
      loop('review');
    }
  }
  function show(i,focus) {
    current=i;
    tabs.forEach(function(t,n){t.setAttribute('aria-selected',String(i===n));t.tabIndex=i===n?0:-1;panels[n].hidden=i!==n;});
    layout();
    if(focus) tabs[i].focus();
    if(!reduce.matches) {
      // Only opacity changes: ports and arrowheads remain registered throughout the transition.
      var nodes=panels[i].querySelector('.how__stage');
      nodes.getAnimations().forEach(function(a){a.cancel();});
      nodes.animate([{opacity:0},{opacity:1}],{duration:parseFloat(getComputedStyle(root).getPropertyValue('--v3-motion-quick'))||220,easing:'ease-out'});
    }
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){show(i,false);});
    t.addEventListener('keydown',function(e){
      var n=-1;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%tabs.length;
      if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i+tabs.length-1)%tabs.length;
      if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;
      if(n<0)return;e.preventDefault();show(n,true);
    });
  });
  new ResizeObserver(layout).observe(root);
  document.fonts.ready.then(layout);
  layout();
})();
