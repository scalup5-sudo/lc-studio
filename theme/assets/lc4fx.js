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

/* Ajout au panier depuis les cartes, sans quitter la page + confirmation */
(function(){
  var d=document,root=(window.Shopify&&Shopify.routes&&Shopify.routes.root)||'/',t;
  function toast(name){
    var el=d.querySelector('.lc-mtoast');
    if(!el){el=d.createElement('div');el.className='lc-mtoast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
      el.innerHTML='<p class="lc-mtoast__t"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="9" fill="#2E7D4F"/><path d="M5 9.3l2.6 2.6L13 6.5" fill="none" stroke="#fff" stroke-width="1.8"/></svg><span>Ajouté au panier</span></p><p class="lc-mtoast__n"></p><a class="lc-mtoast__go" href="'+root+'cart">Voir le panier</a>';
      d.body.appendChild(el);}
    el.querySelector('.lc-mtoast__n').textContent=name||'';
    el.classList.remove('is-on');void el.offsetWidth;el.classList.add('is-on');
    clearTimeout(t);t=setTimeout(function(){el.classList.remove('is-on');},4500);
  }
  d.addEventListener('submit',function(e){
    var f=e.target;if(!f.matches||f.matches('.lc4p-form')||!/\/cart\/add/.test(f.getAttribute('action')||'')||!window.fetch)return;
    e.preventDefault();var b=f.querySelector('[type=submit]'),lbl=b?b.textContent:'';
    if(b){b.disabled=true;b.classList.add('is-busy');}
    fetch(root+'cart/add.js',{method:'POST',headers:{'Accept':'application/json'},body:new FormData(f)}).then(function(r){if(!r.ok)throw 0;return fetch(root+'cart.js');}).then(function(r){return r.json();}).then(function(c){
      var s=d.querySelector('.lc-cart span');if(s){s.textContent=c.item_count;s.classList.remove('is-bump');void s.offsetWidth;s.classList.add('is-bump');}
      var card=f.closest('.lc4-card,.lc4-stage__info'),n=card&&card.querySelector('.lc4-card__title,.lc4-stage__title');
      if(b){b.classList.remove('is-busy');b.classList.add('is-done');b.textContent='Ajouté ✓';setTimeout(function(){b.disabled=false;b.classList.remove('is-done');b.textContent=lbl;},2000);}
      toast(n?n.textContent.trim():'');
    }).catch(function(){f.submit();});
  });
  /* Écrans tactiles : les cartes s'animent à l'entrée dans l'écran */
  if(matchMedia('(hover:none)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&'IntersectionObserver' in window){
    d.documentElement.classList.add('lc-touchfx');
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-lit');io.unobserve(e.target);}});},{rootMargin:'0px 0px -12% 0px'});
    var watch=function(){d.querySelectorAll('.lc4-card__media,.lc4-stage__media,.lc4-rayons__list a,.lc-th__panel').forEach(function(el){if(!el.dataset.fx){el.dataset.fx=1;io.observe(el);}});};
    watch();addEventListener('load',watch);
  }
})();
