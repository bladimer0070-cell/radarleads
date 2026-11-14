/* RADAR — жидкое стекло (WebGL). FS: тёмное поле с линзой-радаром. FSW: светлый «гипс» для «Дар Гермеса».
   RL.liquid / RL.lazyLiquid. Пауза вне экрана, адаптивное качество на телефонах, prefers-reduced-motion. */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms)}}
  var mouse={x:-100,y:-100};
  addEventListener('pointermove',function(e){ if(e.pointerType==='mouse'){ mouse.x=e.clientX; mouse.y=e.clientY; } },{passive:true});

  var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var NOISE=[
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT;uniform vec2 uLens;uniform float uR;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
  ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}'
  ].join('\n');
  var FS=[NOISE,
  'vec3 field(vec2 uv){',
  ' float t=uT*.045;',
  ' vec2 q=vec2(fbm(uv*1.1+vec2(0.,t)),fbm(uv*1.1+vec2(5.2,1.3)-t));',
  ' vec2 r=vec2(fbm(uv*1.3+3.2*q+vec2(1.7,9.2)+t*1.3),fbm(uv*1.3+3.2*q+vec2(8.3,2.8)-t*1.1));',
  ' float f=fbm(uv*1.2+3.6*r);',
  ' vec3 deep=vec3(.025,.033,.047),slate=vec3(.12,.155,.205),cold=vec3(.53,.57,.65),sig=vec3(.49,.85,.34),warm=vec3(.95,.72,.29);',
  ' vec3 c=mix(deep,slate,smoothstep(.35,.7,f));',
  ' c=mix(c,cold*.78,smoothstep(.62,.92,f*q.y*1.9));',
  ' c=mix(c,sig*.72,smoothstep(.56,.74,r.y)*smoothstep(.3,.6,f));',
  ' c=mix(c,warm*.66,smoothstep(.55,.72,r.x*.55+q.x*.45)*.85);',
  ' c=mix(deep,c,smoothstep(.18,.5,f+q.x*.3));',
  ' return c;}',
  'void main(){',
  ' vec2 px=gl_FragCoord.xy; vec2 uv=(px-.5*uRes)/uRes.y;',
  ' vec2 d=px-uLens; float dist=length(d)/uR; float ew=2.2/uR; vec3 col;',
  ' if(dist>1.-ew) col=field(uv)*(1.-smoothstep(1.35,1.,dist)*.35);',
  ' if(dist<1.){ vec3 outc=col;',
  '  float z=sqrt(max(1.-dist*dist,0.)); vec2 lc=(uLens-.5*uRes)/uRes.y;',
  '  vec2 ruv=lc+(d/uRes.y)*mix(-.9,.5,z);',
  '  vec3 cr=field(ruv+vec2(.006,0.)*(1.-z)); vec3 cb=field(ruv-vec2(.006,0.)*(1.-z));',
  '  col=vec3(cr.r,(cr.g+cb.g)*.5,cb.b)*1.08;',
  '  col+=vec3(.86,.9,.95)*pow(1.-z,2.6)*.22;',
  '  vec2 ln=normalize(vec2(-.6,.7));',
  '  col+=pow(max(dot(normalize(d+.0001),ln),0.),12.)*smoothstep(.55,.95,dist)*smoothstep(1.,.96,dist)*.35;',
  '  float ring=0.;for(int i=1;i<4;i++){float rr=float(i)/4.;ring+=smoothstep(.006,0.,abs(dist-rr));}',
  '  col+=vec3(.49,.85,.34)*ring*.10;',
  '  float ang=atan(d.y,d.x); float sw=mod(-uT*1.96-ang,6.2831853);',
  '  col+=vec3(.49,.85,.34)*exp(-sw*2.2)*.20*smoothstep(1.,.2,dist);',
  '  col*=1.-smoothstep(.97,1.,dist)*.25;',
  '  if(dist>1.-ew) col=mix(col,outc,smoothstep(1.-ew,1.,dist));',
  ' }',
  ' vec2 q=px/uRes; col*=mix(.55,1.,smoothstep(0.,.35,q.y)); col*=1.-.35*length((q-.5)*vec2(1.1,.9));',
  ' col+=(h(px+fract(uT)*100.)-.5)*.012;',
  ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');
  var FSW=[NOISE,
  'void main(){',
  ' vec2 px=gl_FragCoord.xy; vec2 uv=(px-.5*uRes)/uRes.y*1.15;',
  ' float t=uT*.04;',
  ' vec2 q=vec2(fbm(uv*1.1+vec2(0.,t)),fbm(uv*1.1+vec2(5.2,1.3)-t));',
  ' vec2 r=vec2(fbm(uv*1.3+3.2*q+vec2(1.7,9.2)+t*1.3),fbm(uv*1.3+3.2*q+vec2(8.3,2.8)-t*1.1));',
  ' float f=fbm(uv*1.2+3.6*r);',
  ' vec3 ivory=vec3(.937,.918,.882), cream=vec3(.965,.953,.925), smoke=vec3(.78,.77,.75), silver=vec3(.86,.875,.895), gold=vec3(.82,.68,.45), grey=vec3(.66,.645,.62);',
  ' vec3 c=mix(cream,ivory,smoothstep(.3,.6,f));',
  ' c=mix(c,smoke,smoothstep(.55,.85,f)*.75);',
  ' c=mix(c,silver,smoothstep(.6,.9,f*q.y*1.9)*.7);',
  ' c=mix(c,gold,smoothstep(.58,.76,r.y)*smoothstep(.35,.65,f)*.42);',
  ' c=mix(c,grey,smoothstep(.62,.82,r.x*.55+q.x*.45)*.35);',
  ' float sheen=smoothstep(.47,.5,fract(f*3.+t*2.))*smoothstep(.53,.5,fract(f*3.+t*2.));',
  ' c+=sheen*.035;',
  ' c+=(h(px+fract(uT)*100.)-.5)*.008;',
  ' gl_FragColor=vec4(c,1.);}'
  ].join('\n');

  /* opts: scale, fps, animate, still, follow (линза тянется за мышью), target() → {x,y} в координатах host или null */
  function liquid(cv, host, place, fsrc, opts){
    var gl=cv.getContext('webgl',{antialias:false,premultipliedAlpha:false,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:true}); if(!gl) return false;
    function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;}
    var vs=sh(gl.VERTEX_SHADER,VS), fs=sh(gl.FRAGMENT_SHADER,fsrc); if(!vs||!fs) return false;
    var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);gl.useProgram(pr);
    var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    var U=function(n){return gl.getUniformLocation(pr,n)}; var uRes=U('uRes'),uT=U('uT'),uLens=U('uLens'),uR=U('uR');
    var scale=opts.scale*(mobile?Math.min(window.devicePixelRatio||1,2):1), animate=opts.animate&&!reduce, W=0,H=0, visible=false, running=false, last=0, minDt=1000/(opts.fps||60), t0=performance.now();
    var lx=null, ly=null, k=opts.ease||.05;
    function size(force){ var nw=cv.clientWidth, nh=cv.clientHeight; if(!force && nw===W && Math.abs(nh-H)<200) return; W=nw; H=nh; cv.width=Math.max(1,Math.round(W*scale)); cv.height=Math.max(1,Math.round(H*scale)); gl.viewport(0,0,cv.width,cv.height); draw((performance.now()-t0)/1000+(opts.still||0)); }
    function draw(t){ var p=place(W,H,t);
      var tx=p.x, ty=p.y, tgt=opts.target&&opts.target(W,H);
      if(tgt){ tx=tgt.x; ty=tgt.y; }
      else if(opts.follow){ var r=host.getBoundingClientRect(); if(mouse.x>-50 && mouse.y>r.top && mouse.y<r.bottom){ tx=p.x+(mouse.x-r.left-p.x)*.35; ty=p.y+((mouse.y-r.top)-p.y)*.35; } }
      if(lx===null||!animate){lx=tx;ly=ty;} lx+=(tx-lx)*k; ly+=(ty-ly)*k;
      gl.uniform2f(uRes,cv.width,cv.height); gl.uniform1f(uT,t); gl.uniform2f(uLens,lx*scale,(H-ly)*scale); gl.uniform1f(uR,p.r*scale); gl.drawArrays(gl.TRIANGLES,0,6); }
    var acc=0, n=0, minScale=scale*.6;
    function frame(now){
      if(!visible||document.hidden){ running=false; last=0; return; }
      if(now-last>=minDt-2){ if(last && mobile){ acc+=now-last; n++; if(n>=40){ if(acc/n>21 && scale>minScale){ scale=Math.max(minScale,scale*.85); size(true); } acc=0; n=0; } } last=now; draw((now-t0)/1000+(opts.still||0)); }
      requestAnimationFrame(frame);
    }
    function kick(){ if(animate && !running && visible && !document.hidden){ running=true; requestAnimationFrame(frame); } }
    size(true); addEventListener('resize', debounce(function(){size(false);},180));
    if(hasIO) new IntersectionObserver(function(e){visible=e[0].isIntersecting; kick();},{rootMargin:'80px'}).observe(host); else { visible=true; kick(); }
    document.addEventListener('visibilitychange',kick);
    return true;
  }
  function lazyLiquid(cv, host, place, fsrc, opts, cb){
    var done=false;
    function go(){ if(done) return; done=true; var ok=liquid(cv,host,place,fsrc,opts); if(cb) cb(ok); }
    if(!hasIO){ go(); return; }
    var o=new IntersectionObserver(function(e){ if(e[0].isIntersecting){ o.disconnect(); (window.requestIdleCallback||setTimeout)(go,{timeout:400}); } },{rootMargin:'400px'});
    o.observe(host);
  }
  /* старт после отрисовки текста */
  function afterLoad(fn){ if(document.readyState==='complete') setTimeout(fn,60); else addEventListener('load',function(){ setTimeout(fn,60); }); }
  window.RL={FS:FS,FSW:FSW,liquid:liquid,lazyLiquid:lazyLiquid,afterLoad:afterLoad,mobile:mobile,reduce:reduce};
})();
