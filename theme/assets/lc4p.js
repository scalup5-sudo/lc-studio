(function(){
  var d=document,root=(window.Shopify&&Shopify.routes&&Shopify.routes.root)||'/';
  var form=d.querySelector('.lc4p-form'),add=d.querySelector('[data-lc4p-add]'),sel=d.querySelector('[data-lc4p-variant]');
  var price=d.querySelector('[data-lc4p-price]'),cmp=d.querySelector('[data-lc4p-compare]'),kl=d.querySelector('[data-lc4p-klarna]');
  var sticky=d.querySelector('[data-lc4p-sticky]'),sadd=d.querySelector('[data-lc4p-sadd]'),sprice=d.querySelector('[data-lc4p-sprice]');
  var toast=d.querySelector('[data-lc4p-toast]'),msg=d.querySelector('[data-lc4p-msg]');
  function money(c){return (c/100).toFixed(2).replace('.',',')+' €';}
  function label(ok){return ok?'Ajouter au panier':'Bientôt de retour';}

  /* Variantes */
  var data=d.querySelector('[data-lc4p-variants]'),vars=[];
  try{vars=JSON.parse(data.textContent);}catch(e){}
  if(sel)sel.addEventListener('change',function(){
    var id=+sel.value,v=null;for(var i=0;i<vars.length;i++){if(vars[i].id===id){v=vars[i];break;}}
    if(!v)return;
    if(price)price.textContent=money(v.price);
    if(sprice)sprice.textContent=money(v.price);
    if(kl)kl.textContent=money(Math.floor(v.price/3));
    if(cmp){if(v.compare_at_price&&v.compare_at_price>v.price){cmp.hidden=false;cmp.textContent=money(v.compare_at_price);}else{cmp.hidden=true;}}
    [add,sadd].forEach(function(b){if(b){b.disabled=!v.available;b.textContent=label(v.available);}});
    try{var u=new URL(location.href);u.searchParams.set('variant',id);history.replaceState(null,'',u);}catch(e){}
  });

  /* Barre d'achat fixe : visible dès que le bouton principal n'est plus à l'écran */
  if(sticky&&add&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      var show=!es[0].isIntersecting;
      sticky.classList.toggle('is-on',show);
      d.documentElement.classList.toggle('lc4p-sticky-on',show);
      if(sadd)sadd.tabIndex=show?0:-1;
    },{rootMargin:'-110px 0px -40px 0px'});
    io.observe(add);
  }
  if(sadd&&form)sadd.addEventListener('click',function(){
    if(form.requestSubmit)form.requestSubmit(add);else add.click();
  });

  /* Ajout au panier sans quitter la page */
  var tt;
  function bump(n){
    var c=d.querySelector('.lc-cart span');if(!c)return;
    c.textContent=n;c.classList.remove('is-bump');void c.offsetWidth;c.classList.add('is-bump');
  }
  function busy(on){[add,sadd].forEach(function(b){if(b){b.classList.toggle('is-busy',on);b.setAttribute('aria-busy',on?'true':'false');}});}
  function done(){
    [add,sadd].forEach(function(b){if(!b)return;b.classList.add('is-done');b.textContent='Ajouté ✓';});
    setTimeout(function(){[add,sadd].forEach(function(b){if(b){b.classList.remove('is-done');b.textContent=label(!b.disabled);}});},2200);
    if(toast){toast.hidden=false;requestAnimationFrame(function(){toast.classList.add('is-on');});clearTimeout(tt);tt=setTimeout(hide,6000);}
  }
  function hide(){if(!toast)return;toast.classList.remove('is-on');setTimeout(function(){toast.hidden=true;},350);}
  var x=d.querySelector('[data-lc4p-toastx]');if(x)x.addEventListener('click',hide);
  if(form&&window.fetch&&window.FormData)form.addEventListener('submit',function(e){
    e.preventDefault();
    if(msg)msg.hidden=true;
    busy(true);
    fetch(root+'cart/add.js',{method:'POST',headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest'},body:new FormData(form)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(res){
        if(!res.ok){busy(false);if(msg){msg.textContent=res.j.description||'Impossible d’ajouter cet article.';msg.hidden=false;}return;}
        return fetch(root+'cart.js',{headers:{'Accept':'application/json'}}).then(function(r){return r.json();}).then(function(c){busy(false);bump(c.item_count);done();});
      })
      .catch(function(){busy(false);form.submit();});
  });

  /* Galerie mobile : points de position */
  var g=d.querySelector('[data-lc4p-gallery]'),dots=d.querySelectorAll('[data-lc4p-dots] span');
  if(g&&dots.length){
    var t2=false;
    g.addEventListener('scroll',function(){if(t2)return;t2=true;requestAnimationFrame(function(){t2=false;
      var w=g.firstElementChild?g.firstElementChild.getBoundingClientRect().width+10:g.clientWidth;
      var i=Math.round(g.scrollLeft/w);for(var k=0;k<dots.length;k++)dots[k].classList.toggle('is-on',k===i);
    });},{passive:true});
  }

  /* Galerie bureau : un clic sur une vignette l'affiche en grand */
  if(g&&window.matchMedia){
    var mq=matchMedia('(min-width:1001px)');
    var thumbs=function(){return g.querySelectorAll('.lc4p-shot:not(.lc4p-shot--main)');};
    var setup=function(){[].forEach.call(thumbs(),function(f){if(mq.matches){f.tabIndex=0;f.setAttribute('role','button');f.setAttribute('aria-label','Afficher cette photo en grand');}else{f.removeAttribute('tabindex');f.removeAttribute('role');f.removeAttribute('aria-label');}});};
    setup();if(mq.addEventListener)mq.addEventListener('change',setup);
    var swap=function(f){
      var main=g.querySelector('.lc4p-shot--main');if(!main||f===main)return;
      var a=main.querySelector('img'),b=f.querySelector('img');if(!a||!b)return;
      var as=a.getAttribute('sizes'),bs=b.getAttribute('sizes');
      b.loading='eager';
      main.insertBefore(b,main.firstChild);f.insertBefore(a,f.firstChild);
      if(as)b.setAttribute('sizes',as);if(bs)a.setAttribute('sizes',bs);
      main.classList.remove('is-swap');void main.offsetWidth;main.classList.add('is-swap');
      var r=main.getBoundingClientRect();if(r.top<90)window.scrollTo({top:window.scrollY+r.top-110,behavior:'smooth'});
    };
    g.addEventListener('click',function(e){if(!mq.matches)return;var f=e.target.closest('.lc4p-shot');if(f&&!f.classList.contains('lc4p-shot--main'))swap(f);});
    g.addEventListener('keydown',function(e){if(!mq.matches||(e.key!=='Enter'&&e.key!==' '))return;var f=e.target.closest('.lc4p-shot');if(f&&!f.classList.contains('lc4p-shot--main')){e.preventDefault();swap(f);}});
  }
})();
