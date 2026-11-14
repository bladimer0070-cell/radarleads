/* RADAR — общее поведение страниц: шапка, меню, лоадер, курсор, появление, вопросы, копирование ника,
   смена фраз, сравнение экранов, канбан CRM, путь до первого клиента, перенос UTM. */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $=function(id){return document.getElementById(id)};
  var all=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  // UTM и другие параметры: переносим на внутренние страницы и запоминаем на сессию
  var qs=location.search;
  if(qs){
    try{ var p=new URLSearchParams(qs), keep={}; p.forEach(function(v,k){ if(/^utm_/.test(k)) keep[k]=v; }); if(Object.keys(keep).length) sessionStorage.setItem('radar_utm',JSON.stringify(keep)); }catch(e){}
    all('a[data-keep]').forEach(function(a){ var h=a.getAttribute('href'), i=h.indexOf('#'); a.setAttribute('href', i<0 ? h+qs : h.slice(0,i)+qs+h.slice(i)); });
  }

  // лоадер
  var loader=$('loader');
  if(loader) setTimeout(function(){ loader.classList.add('done'); }, reduce?0:(RL&&RL.mobile?900:1300));

  // шапка: сплошная после первого экрана
  var nav=$('nav'), sent=$('navSentinel');
  if(nav){
    if(sent && hasIO) new IntersectionObserver(function(e){ var x=e[0]; nav.classList.toggle('solid', !x.isIntersecting && x.boundingClientRect.top<0); }).observe(sent);
    else if(sent) nav.classList.add('solid');
  }

  // мобильное меню
  var burger=$('burger'), mnav=$('mnav');
  if(burger && mnav){
    var setMenu=function(open){
      burger.setAttribute('aria-expanded',open?'true':'false'); burger.classList.toggle('x',open);
      mnav.classList.toggle('open',open); mnav.setAttribute('aria-hidden',open?'false':'true');
      if(open) mnav.removeAttribute('inert'); else mnav.setAttribute('inert','');
      document.documentElement.classList.toggle('menu-open',open);
      if(nav) nav.classList.toggle('solid', open || (sent? sent.getBoundingClientRect().top<0 : true));
    };
    burger.addEventListener('click',function(){ setMenu(burger.getAttribute('aria-expanded')!=='true'); });
    all('a',mnav).forEach(function(a){ a.addEventListener('click',function(){ setMenu(false); }); });
    addEventListener('keydown',function(e){ if(e.key==='Escape') setMenu(false); });
  }

  // копирование ника (работает и на телефоне)
  all('.handle').forEach(function(h){
    var btn=h.querySelector('button'), el=h.querySelector('span'); if(!btn||!el) return;
    btn.addEventListener('click',function(){
      var t=el.textContent.trim();
      function ok(){ btn.textContent='Скопировано'; setTimeout(function(){btn.textContent='Скопировать'},1600); }
      function fallback(){ var ta=document.createElement('textarea'); ta.value=t; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0,t.length); var done=false; try{done=document.execCommand('copy')}catch(e){} document.body.removeChild(ta); if(done) ok(); else { var r=document.createRange(); r.selectNodeContents(el); var s=getSelection(); s.removeAllRanges(); s.addRange(r); } }
      if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok,fallback); else fallback();
    });
  });

  // смена фраз первого экрана
  var hero=$('hero'), phrases=all('.phrase h1'), pi=0, heroVis=true;
  if(hero && hasIO) new IntersectionObserver(function(e){heroVis=e[0].isIntersecting;}).observe(hero);
  if(!reduce && phrases.length>1) setInterval(function(){
    if(!heroVis||document.hidden) return;
    phrases[pi].classList.remove('on'); phrases[pi].setAttribute('aria-hidden','true');
    pi=(pi+1)%phrases.length;
    phrases[pi].classList.add('on'); phrases[pi].removeAttribute('aria-hidden');
  }, 4200);

  // появление
  var rv=all('.rv');
  if(reduce||!hasIO) rv.forEach(function(el){el.classList.add('in')});
  else {
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); },{threshold:.2,rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){ io.observe(el); });
  }

  // вопросы: раскрытие через opacity + transform
  all('.faq details').forEach(function(d){
    var sum=d.querySelector('summary'), ans=d.querySelector('.ans'), anim=null;
    sum.addEventListener('click',function(e){
      if(reduce||!ans.animate) return;
      e.preventDefault();
      if(anim){ anim.cancel(); anim=null; }
      if(!d.open){ d.open=true; anim=ans.animate([{opacity:0,transform:'translate3d(0,-10px,0)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.19,1,.22,1)'}); anim.onfinish=function(){anim=null;}; }
      else { anim=ans.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translate3d(0,-6px,0)'}],{duration:220,easing:'cubic-bezier(.4,0,1,1)'}); anim.onfinish=function(){ d.open=false; anim=null; }; }
    });
  });

  // курсор (только мышь)
  var cur=$('cursor');
  if(cur && matchMedia('(hover:hover) and (pointer:fine)').matches){
    var mx=-100,my=-100,cx=-100,cy=-100,run=false;
    var step=function(){ cx+=(mx-cx)*.22; cy+=(my-cy)*.22; cur.style.transform='translate3d('+cx+'px,'+cy+'px,0)'; if(Math.abs(mx-cx)+Math.abs(my-cy)>.3) requestAnimationFrame(step); else run=false; };
    addEventListener('pointermove',function(e){ mx=e.clientX; my=e.clientY; if(!run){run=true;requestAnimationFrame(step);} },{passive:true});
    document.addEventListener('pointerover',function(e){ var a=e.target.closest&&e.target.closest('a,button,summary,.cmp'); cur.classList.toggle('big',!!a); });
  }

  // путь до первого клиента: шаги загораются по мере прокрутки
  all('.path').forEach(function(path){
    var items=all('li',path); items.forEach(function(li,i){ li.style.setProperty('--i',i); });
    if(reduce||!hasIO){ path.classList.add('lit'); path.style.setProperty('--p',1); return; }
    var vertical=function(){ return matchMedia('(max-width:1040px)').matches; };
    if(!vertical()){
      new IntersectionObserver(function(e,o){ if(e[0].isIntersecting){ path.classList.add('lit'); path.style.setProperty('--p',1); o.disconnect(); } },{threshold:.35}).observe(path);
    } else {
      var lit=0;
      var o2=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('lit'); var i=items.indexOf(e.target); if(i+1>lit){ lit=i+1; path.style.setProperty('--p', items.length>1 ? i/(items.length-1) : 1); } o2.unobserve(e.target); } }); },{rootMargin:'0px 0px -38% 0px'});
      items.forEach(function(li){ o2.observe(li); });
    }
  });

  // канбан CRM: карточка-пример сама едет по статусам, пока блок в кадре
  all('.kb').forEach(function(kb){
    var cols=all('.kb-col',kb), card=kb.querySelector('.kb-card.hl'); if(!card||cols.length<2) return;
    var pill=card.querySelector('.pill'), names=['новый','написал','ответил','созвон','сделка'], cls=['cold','cold','warm','warm','hot'];
    function counts(){ cols.forEach(function(c){ var em=c.querySelector('h4 em'); if(em) em.textContent=c.querySelectorAll('.kb-card').length; }); }
    function moveTo(i){
      var first=card.getBoundingClientRect();
      var list=cols[i].querySelector('.kb-list'); list.insertBefore(card,list.firstChild);
      if(pill){ pill.textContent=names[i]; pill.className='pill '+cls[i]; }
      counts();
      if(reduce||!card.animate) return;
      var lastR=card.getBoundingClientRect();
      card.animate([{transform:'translate3d('+(first.left-lastR.left)+'px,'+(first.top-lastR.top)+'px,0) scale(1.04)'},{transform:'none'}],{duration:900,easing:'cubic-bezier(.19,1,.22,1)'});
    }
    counts();
    if(reduce||!hasIO){ moveTo(4); return; }
    var stage=0, vis=false, timer=null;
    function tick(){ if(!vis||document.hidden){ timer=null; return; } stage=(stage+1)%5; moveTo(stage); timer=setTimeout(tick, stage===4?3200:1700); }
    new IntersectionObserver(function(e){ vis=e[0].isIntersecting; if(vis&&!timer) timer=setTimeout(tick,900); },{threshold:.45}).observe(kb);
  });

  // сравнение двух экранов
  var cmp=$('cmp');
  if(cmp){
    var rng=$('cmpR'), cxv=50, ctg=50, cRun=false, dragging=false, decided=false, sx=0, sy=0;
    var paint=function(){ cmp.style.setProperty('--x', cxv.toFixed(2)+'%'); };
    var cStep=function(){ cxv+=(ctg-cxv)*.16; if(Math.abs(ctg-cxv)<.04) cxv=ctg; paint(); if(cxv!==ctg) requestAnimationFrame(cStep); else cRun=false; };
    var cTo=function(v){ ctg=Math.max(0,Math.min(100,v)); if(reduce){cxv=ctg;paint();return;} if(!cRun){cRun=true;requestAnimationFrame(cStep);} };
    var cPos=function(e){ var r=cmp.getBoundingClientRect(); return (e.clientX-r.left)/r.width*100; };
    paint();
    rng.addEventListener('input',function(){ cTo(+rng.value); });
    cmp.addEventListener('pointerdown',function(e){ dragging=true; decided=e.pointerType!=='touch'; sx=e.clientX; sy=e.clientY; if(decided){ cmp.setPointerCapture(e.pointerId); cTo(cPos(e)); } });
    cmp.addEventListener('pointermove',function(e){ if(!dragging) return; if(!decided){ var dx=Math.abs(e.clientX-sx), dy=Math.abs(e.clientY-sy); if(dx<6&&dy<6) return; if(dy>dx){dragging=false;return;} decided=true; cmp.setPointerCapture(e.pointerId); } cTo(cPos(e)); });
    var endDrag=function(e){ if(dragging && !decided && e.type==='pointerup') cTo(cPos(e)); dragging=false; rng.value=Math.round(ctg); };
    cmp.addEventListener('pointerup',endDrag); cmp.addEventListener('pointercancel',endDrag);
    if(!reduce && hasIO){ var hinted=false; new IntersectionObserver(function(e){ if(e[0].isIntersecting && !hinted){ hinted=true; setTimeout(function(){cTo(32)},300); setTimeout(function(){cTo(66)},1200); setTimeout(function(){cTo(50)},2100); } },{threshold:.6}).observe(cmp); }
    var swapTok=null;
    var swapShots=function(a,b){
      var A=$('cmpA'),B=$('cmpB'); if(A.getAttribute('src')===a) return;
      var tok={}; swapTok=tok; var na=new Image(), nb=new Image(); na.src=a; nb.src=b;
      cmp.classList.add('swap');
      Promise.all([na.decode().catch(function(){}),nb.decode().catch(function(){}),new Promise(function(r){setTimeout(r,reduce?0:450)})]).then(function(){
        if(swapTok!==tok) return; A.src=a; B.src=b;
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(swapTok===tok) cmp.classList.remove('swap'); }); });
      });
    };
    all('.tabs button').forEach(function(b){ b.addEventListener('click',function(){ all('.tabs button').forEach(function(x){x.setAttribute('aria-selected','false')}); b.setAttribute('aria-selected','true'); swapShots(b.dataset.a,b.dataset.b); }); });
  }
})();
