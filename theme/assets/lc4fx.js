(function(){
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var cur=null,ev=null,raf=0;
  function run(){raf=0;if(!cur||!ev)return;var r=cur.el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height,s=cur.el.style;
    s.setProperty('--mx',(x*100).toFixed(1)+'%');s.setProperty('--my',(y*100).toFixed(1)+'%');
    if(cur.t){s.setProperty('--ry',((x-.5)*cur.t).toFixed(2)+'deg');s.setProperty('--rx',((.5-y)*cur.t).toFixed(2)+'deg');s.setProperty('--px',(x-.5).toFixed(3));s.setProperty('--py',(y-.5).toFixed(3));}
    if(cur.m){s.setProperty('--bx',((x-.5)*cur.m).toFixed(1)+'px');s.setProperty('--by',((y-.5)*cur.m).toFixed(1)+'px');}}
  function reset(el){['--rx','--ry','--px','--py','--bx','--by'].forEach(function(p){el.style.removeProperty(p);});}
  var rules=[['.lc4-card__media',9,0],['.lc4-stage__media',6,0],['.lc4p-shot',0,0],['.lc4-rayons__list a',0,0],['.lc-btn',0,8],['.lc4p-add',0,6]];
  document.addEventListener('pointerover',function(e){
    for(var i=0;i<rules.length;i++){var el=e.target.closest&&e.target.closest(rules[i][0]);if(el){if(!cur||cur.el!==el){if(cur)reset(cur.el);cur={el:el,t:rules[i][1],m:rules[i][2]};}return;}}
  },{passive:true});
  document.addEventListener('pointermove',function(e){if(!cur)return;if(!cur.el.contains(e.target)){reset(cur.el);cur=null;return;}ev=e;if(!raf)raf=requestAnimationFrame(run);},{passive:true});
  document.addEventListener('pointerout',function(e){if(cur&&!cur.el.contains(e.relatedTarget)){var el=cur.el;cur=null;reset(el);}},{passive:true});
})();
