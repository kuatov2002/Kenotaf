"use strict";
/* ============================== ОБЖИТОСТЬ ==============================
   Комнаты — места, где жили люди. После постройки комнаты (dressRoom) раскладчик находит полы,
   полосу стены «на уровне роста» и своды и ставит туда следы жизни из набора своей зоны/подзоны:
   шкафчики с курткой, термос и кружку на ящике, календарь с зачёркнутыми днями, фото, нары, кровати,
   бельё, детские рисунки, рассаду и лейки, журналы смен, стопки бумаг. И следы того, что случилось:
   перевёрнутый стул, рассыпанные листы, баррикада из мебели, недоеденная еда.
   Правила: ничего игрового не закрывать (двери, интерактивы, фонари, станции, опасности, толкаемое,
   таблички) — отступ; на настилах — только мелочь (не загромождать путь); всё — фон, без коллизий;
   практические лампы дают тёплый свет (R.lights). Детерминированно: сид — id комнаты. */
const DRESS={
  /* набор: [предмет, вес, где] — где: f (пол), s (мелочь, можно на настил), w (стена), h (свод) */
  sump:[['locker',3,'f'],['cot',2,'f'],['mealbox',3,'f'],['toolchest',2,'f'],['stove',2,'f'],['boots',2,'s'],['bucket',2,'s'],['radio',1,'s'],
    ['calendar',3,'w'],['photo',2,'w'],['notice',3,'w'],['coat',3,'w'],['shelf',2,'w'],['tally',2,'w'],['clock',1,'w'],['chalk',2,'w'],['bulb',3,'h']],
  hives:[['bed',3,'f'],['table',3,'f'],['wardrobe',2,'f'],['bicycle',1,'f'],['pots',2,'s'],['doll',1,'s'],['boots',1,'s'],['washtub',1,'f'],
    ['window',3,'w'],['drawing',3,'w'],['photo',2,'w'],['poster',2,'w'],['clock',2,'w'],['mirror',1,'w'],['shelf',2,'w'],['calendar',1,'w'],['bulb',2,'h'],['laundry',2,'h']],
  eden:[['wheelbarrow',2,'f'],['seedbench',3,'f'],['bench',2,'f'],['fruitcrate',2,'f'],['wcan',3,'s'],['pots',3,'s'],['tools',2,'f'],
    ['apron',2,'w'],['labels',2,'w'],['notice',1,'w'],['shelf',2,'w'],['hangplant',3,'h']],
  seal:[['workbench',3,'f'],['locker',2,'f'],['gearpile',2,'f'],['oilcans',3,'s'],['cot',1,'f'],['mealbox',1,'f'],
    ['logbook',3,'w'],['coat',2,'w'],['clock',2,'w'],['chalkcalc',3,'w'],['shelf',1,'w'],['bulb',2,'h']],
  archive:[['desk',3,'f'],['cabinet',3,'f'],['books',3,'s'],['gramophone',1,'f'],['candles',2,'s'],['chair',2,'f'],
    ['portrait',2,'w'],['pigeonholes',3,'w'],['robe',1,'w'],['notice',1,'w'],['bulb',1,'h']]
};
/* подзоны уточняют набор (что жило именно здесь) */
const DRESS_SUB={
  school:['desk','books','drawing','drawing','chair','clock','poster'],laundry:['washtub','laundry','laundry','boots','window'],
  market:['fruitcrate','table','mealbox','notice','pots'],offices:['desk','cabinet','notice','clock','chair','photo'],
  chapel:['candles','candles','photo','bench'],apiary:['fruitcrate','apron','wcan','labels'],herbarium:['labels','shelf','seedbench','books'],
  workshop:['workbench','toolchest','oilcans','gearpile'],reading:['desk','books','candles','pigeonholes'],stacks:['books','cabinet','pigeonholes'],
  council:['portrait','candles','chair'],crypt:['candles','candles','photo']
};
/* события: что здесь случилось (одно на комнату, не во всех) */
const DRESS_EVENT=['overturned','papers','barricade','meal'];
function dressRoom(R){
  if(R.noDress||R.zone==='surface'||!DRESS[R.zone])return;
  const r=rng('dress:'+R.id),out=[],K=DRESS[R.zone],sub=R.sub&&DRESS_SUB[R.sub];
  /* у подзоны своя прорисованная стена (доски, окна, стеллажи) — её не закрываем панелью и вещами */
  const own=!!(R.sub&&typeof SUBART!=='undefined'&&SUBART[R.sub]&&SUBART[R.sub].wall);
  /* запретные зоны: всё, с чем играют */
  const keep=[];const add=(x,y,w,h,pad)=>keep.push({x:x-pad,y:y-pad,w:w+pad*2,h:h+pad*2});
  for(const d of R.doors||[])add(d.x,d.y,d.w,d.h,1.3);
  for(const it of R.interactables||[])add(it.x-(it.w||1.6)/2,it.y-(it.h||1.8),(it.w||1.6),(it.h||1.8),1.2);
  if(R.checkpoint)add(R.checkpoint.x-0.5,R.checkpoint.y-2,1,2,1.4);
  for(const h of R.hazards||[])add(h.x,h.y,h.w,h.h,0.8);
  for(const p of R.pushables||[])add(p.x,p.y,p.w,p.h,0.9);
  for(const s of R.signs||[])add(s.x-1,s.y-1,4,1.4,0.4);
  for(const a of R.anchors||[])add(a.x-0.6,a.y-0.6,1.2,1.2,1.0);
  for(const p of R.pogos||[])add(p.x-0.6,p.y-0.6,1.2,(p.len||1)+0.6,0.6);
  for(const m of R.magnetRects||[])add(m.x,m.y,m.w,m.h+1.5,0.4);
  if(R.bossTrigger)add(R.bossTrigger.x,R.bossTrigger.y,R.bossTrigger.w,R.bossTrigger.h,0);
  const sol=R.solids.filter(s=>!s.hidden),solid=sol.filter(s=>!s.ow);
  const free=(x,y,w,h)=>{const q={x,y,w,h};return !solid.some(s=>aabb(q,s))&&!keep.some(k=>aabb(q,k));};
  const pick=where=>{let pool=K.filter(k=>k[2]===where||(where==='f'&&k[2]==='s'));
    if(sub&&r()<0.8){const sp=pool.filter(k=>sub.indexOf(k[0])>=0);if(sp.length)pool=sp;}
    let tot=pool.reduce((a,k)=>a+k[1],0),q=r()*tot;for(const k of pool){q-=k[1];if(q<=0)return k[0];}return pool[0]&&pool[0][0];};
  const SIZE={locker:[0.66,1.95],cot:[1.9,0.62],mealbox:[0.9,0.9],toolchest:[0.9,0.8],stove:[0.7,1.0],boots:[0.5,0.35],bucket:[0.45,0.6],radio:[0.5,0.45],
    bed:[1.95,0.95],table:[1.5,1.0],wardrobe:[1.1,2.0],bicycle:[1.5,0.95],pots:[0.8,0.6],doll:[0.35,0.4],washtub:[0.9,0.55],
    wheelbarrow:[1.4,0.8],seedbench:[1.8,1.0],bench:[1.6,0.7],fruitcrate:[0.9,0.7],wcan:[0.55,0.45],tools:[0.8,1.6],
    workbench:[1.8,1.05],gearpile:[1.0,0.7],oilcans:[0.7,0.45],desk:[1.5,1.1],cabinet:[0.8,1.5],books:[0.6,0.6],gramophone:[0.8,1.15],candles:[0.6,0.4],chair:[0.6,0.95]};
  /* полы: верхние грани твёрдого (ровные участки) и настилы */
  const E=buildEdges(R),floors=E.top.map(e=>({x0:e[0],x1:e[1],y:e[2],ow:false})).concat(E.ow.map(e=>({x0:e[0],x1:e[1],y:e[2],ow:true})));
  let lamps=0;
  for(const F of floors){const L=F.x1-F.x0;if(L<1.4||F.y<1.2)continue;
    let x=F.x0+0.4+r()*1.2;
    while(x<F.x1-0.6){const big=!F.ow&&r()<0.75;let kind=pick(big?'f':'s');
      if(F.ow&&SIZE[kind]&&SIZE[kind][1]>0.7)kind=pick('s');
      const sz=SIZE[kind]||[0.6,0.6],w=sz[0],h=sz[1];
      if(x+w<=F.x1-0.2&&free(x,F.y-h-0.05,w,h)&&free(x-0.2,F.y-Math.max(h,1.9)-0.3,w+0.4,0.3)){
        out.push({k:kind,x:x+w/2,y:F.y,w,h,s:(r()*1e6)|0,flip:r()<0.5});
        /* настольная лампа / окно — тёплый свет у жилого угла */
        if((kind==='table'||kind==='desk'||kind==='stove')&&lamps<4&&r()<0.6){lamps++;R.lights.push(lit(x+w/2,F.y-1.1,3.2,'#ffc27a',0.42,{flicker:0.25}));}
        /* над крупным предметом — вещь на стене, на высоте роста (иногда две) */
        if(!F.ow)for(let k=0;k<(r()<0.35&&!own?2:1);k++){if(r()>(own?0.45:0.9))continue;const wk=pick('w'),wy=F.y-1.5-r()*1.1,wx=x+w/2+(r()-0.5)*1.6;
          if(free(wx-0.55,wy-0.55,1.1,1.1)&&wy>1){out.push({k:wk,x:wx,y:wy,s:(r()*1e6)|0,wall:true});
            if(wk==='window'&&lamps<4){lamps++;R.lights.push(lit(wx,wy,2.6,'#ffb46a',0.45));}}}
        x+=w+0.9+r()*2.6;}
      else x+=0.9;}
    /* полоса износа у пола: тут ходили годами — потёртость, грязь у плинтуса */
    if(!F.ow&&L>3)out.push({k:'scuff',x:(F.x0+F.x1)/2,y:F.y,w:L,s:(r()*1e6)|0,under:true});
    /* панель на уровне роста: материал зоны, разрывы у дверей и там, где стена занята */
    if(!F.ow&&L>2.4&&!own){let a=F.x0;const step=0.5;
      for(let x=F.x0;x<=F.x1;x+=step){const ok=x<F.x1-0.01&&free(x,F.y-1.15,step,1.1);
        if(!ok||x+step>F.x1){const b=ok?F.x1:x;if(b-a>1.2)out.push({k:'band',x0:a,x1:b,y:F.y,z:R.zone,sub:R.sub,s:(r()*1e6)|0,under:true});a=x+step;}}}}
  /* следы времени выше панели: подтёки от свода, облупленная штукатурка, копоть */
  for(let i=0;i<Math.max(2,R.w*R.h/90);i++){const x=1+r()*(R.w-2),y=1.5+r()*(R.h-4),w=0.8+r()*1.8,h=0.8+r()*2.2;
    if(free(x,y,w,h))out.push({k:r()<0.5?'streak':'patch',x,y,w,h,z:R.zone,s:(r()*1e6)|0,under:true});}
  /* своды: лампы на шнуре, бельё, кашпо — с низа твёрдых блоков над открытым воздухом */
  for(const l of E.line){if(l[1]!==l[3])continue;const y=l[1],x0=Math.min(l[0],l[2]),x1=Math.max(l[0],l[2]);if(x1-x0<3||y>R.h-4)continue;
    for(let x=x0+1.5+r()*3;x<x1-1.5;x+=5+r()*4.5){const kind=pick('h');if(!kind)break;
      if(!free(x-0.6,y+0.1,1.2,2.4))continue;
      if(kind==='laundry'){const x2=Math.min(x1-0.5,x+3+r()*2.5);if(free(x,y+0.1,x2-x,1.6))out.push({k:'laundry',x,x2,y,s:(r()*1e6)|0});x=x2;continue;}
      out.push({k:kind,x,y,len:0.6+r()*1.4,s:(r()*1e6)|0});
      if(kind==='bulb'&&lamps<3){lamps++;R.lights.push(lit(x,y+1.3,4.5,'#ffcf8a',0.5,{flicker:r()<0.3?0.6:0}));}}}
  /* одно событие на комнату — не во всех */
  if(r()<0.45&&floors.length){const ev=DRESS_EVENT[(r()*DRESS_EVENT.length)|0];
    const F=floors.filter(f=>!f.ow&&f.x1-f.x0>4)[0];
    if(F){const x=F.x0+1+r()*(F.x1-F.x0-3);if(free(x-1,F.y-1.2,2.2,1.1))out.push({k:ev,x,y:F.y,s:(r()*1e6)|0});}}
  R.dress=out;
}
/* ---------- рисунок ---------- */
function shadeHex(hex,k){const n=parseInt(hex.slice(1),16);let rr_=(n>>16)&255,gg=(n>>8)&255,bb=n&255;
  const f=v=>clamp(Math.round(k<0?v*(1+k):v+(255-v)*k),0,255);return 'rgb('+f(rr_)+','+f(gg)+','+f(bb)+')';}
function vgrad(c,x,y,w,col,k){const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,shadeHex(col,-0.25*(k||1)));g.addColorStop(0.45,shadeHex(col,0.12*(k||1)));g.addColorStop(1,shadeHex(col,-0.35*(k||1)));return g;}
function contact(c,x,y,w){c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x,y+0.02,w*0.55,0.07,0,0,TAU);c.fill();}
const DRAW={
  /* --- отстойник: смены насосников --- */
  locker(c,o,r){const x=o.x-0.33,y=o.y-1.95;contact(c,o.x,o.y,0.7);c.fillStyle=vgrad(c,x,0,0.66,'#4a5258');rr(c,x,y,0.66,1.95,0.04);c.fill();
    c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=0.025;c.strokeRect(x+0.04,y+0.06,0.58,1.83);
    for(let i=0;i<4;i++){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x+0.16,y+0.18+i*0.07,0.34,0.03);}
    c.fillStyle='#c9a227';c.fillRect(x+0.52,y+0.9,0.05,0.16);
    if(r()<0.5){/* дверца приоткрыта: внутри — куртка */c.fillStyle='#14171a';c.fillRect(x+0.05,y+0.35,0.3,1.5);
      c.fillStyle='#5a4a36';rr(c,x+0.07,y+0.42,0.24,0.9,0.06);c.fill();c.fillStyle='#3a2e22';c.fillRect(x+0.17,y+0.42,0.03,0.9);}
    c.fillStyle='rgba(230,220,190,.55)';c.fillRect(x+0.2,y+1.1,0.26,0.14);c.fillStyle='rgba(40,30,20,.6)';c.fillRect(x+0.23,y+1.15,0.18,0.03);},
  cot(c,o,r){const x=o.x-0.95,y=o.y;contact(c,o.x,y,1.9);c.strokeStyle='#3a4046';c.lineWidth=0.06;
    c.beginPath();c.moveTo(x+0.05,y);c.lineTo(x+0.05,y-0.55);c.moveTo(x+1.85,y);c.lineTo(x+1.85,y-0.45);c.moveTo(x,y-0.36);c.lineTo(x+1.9,y-0.36);c.stroke();
    c.fillStyle='#4a4436';rr(c,x+0.08,y-0.52,1.74,0.18,0.06);c.fill();
    c.fillStyle=['#5a3a2e','#3e4a3a','#4a3e52'][(r()*3)|0];c.beginPath();c.moveTo(x+0.5,y-0.5);c.quadraticCurveTo(x+1.1,y-0.62,x+1.8,y-0.5);
    c.lineTo(x+1.82,y-0.3);c.quadraticCurveTo(x+1.2,y-0.22,x+0.5,y-0.32);c.closePath();c.fill();
    c.fillStyle='#d8cdb6';rr(c,x+0.12,y-0.62,0.42,0.15,0.06);c.fill();},
  mealbox(c,o,r){const x=o.x-0.45,y=o.y;contact(c,o.x,y,0.9);Kit.crate(c,x,y-0.62,0.9,0.62,{seed:o.s%97});
    /* термос и жестяная кружка, газета */
    c.fillStyle='#3a5a4a';rr(c,x+0.12,y-0.98,0.14,0.36,0.04);c.fill();c.fillStyle='#8a8a7a';c.fillRect(x+0.12,y-1.0,0.14,0.05);
    c.fillStyle='#9aa0a4';rr(c,x+0.38,y-0.76,0.13,0.14,0.02);c.fill();c.strokeStyle='#9aa0a4';c.lineWidth=0.025;c.beginPath();c.arc(x+0.53,y-0.69,0.04,-PI/2,PI/2);c.stroke();
    c.fillStyle='rgba(225,215,190,.8)';c.fillRect(x+0.56,y-0.65,0.3,0.03);},
  toolchest(c,o,r){const x=o.x-0.45,y=o.y;contact(c,o.x,y,0.9);c.fillStyle=vgrad(c,x,0,0.9,'#7a2e24');rr(c,x,y-0.8,0.9,0.8,0.05);c.fill();
    for(let i=0;i<4;i++){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+0.04,y-0.76+i*0.19,0.82,0.02);c.fillStyle='#b8b0a0';c.fillRect(x+0.36,y-0.68+i*0.19,0.18,0.03);}
    c.strokeStyle='#5c646b';c.lineWidth=0.04;c.beginPath();c.moveTo(x+0.2,y-0.8);c.lineTo(x+0.3,y-0.9);c.lineTo(x+0.6,y-0.9);c.lineTo(x+0.7,y-0.8);c.stroke();},
  stove(c,o,r){const x=o.x-0.35,y=o.y;contact(c,o.x,y,0.7);Kit.crate(c,x,y-0.55,0.7,0.55,{seed:o.s%91});
    c.fillStyle='#2a2a2c';rr(c,x+0.05,y-0.72,0.6,0.17,0.03);c.fill();c.fillStyle='#c8452f';c.fillRect(x+0.15,y-0.66,0.12,0.04);
    c.fillStyle='#7a7a74';c.beginPath();c.moveTo(x+0.3,y-0.72);c.quadraticCurveTo(x+0.32,y-1.0,x+0.48,y-0.98);c.quadraticCurveTo(x+0.62,y-0.98,x+0.6,y-0.72);c.fill();
    c.strokeStyle='#7a7a74';c.lineWidth=0.03;c.beginPath();c.moveTo(x+0.6,y-0.85);c.lineTo(x+0.7,y-0.93);c.stroke();
    /* копоть над плиткой */const g=c.createRadialGradient(o.x,y-1.6,0,o.x,y-1.6,0.8);g.addColorStop(0,'rgba(10,8,6,.35)');g.addColorStop(1,'rgba(10,8,6,0)');c.fillStyle=g;c.fillRect(o.x-0.8,y-2.4,1.6,1.6);},
  boots(c,o,r){const x=o.x-0.25,y=o.y;for(let i=0;i<2;i++){const bx=x+i*0.26;c.fillStyle='#2e2620';c.beginPath();c.moveTo(bx,y);c.lineTo(bx,y-0.32);c.lineTo(bx+0.12,y-0.32);
    c.lineTo(bx+0.12,y-0.1);c.lineTo(bx+0.22,y-0.08);c.lineTo(bx+0.22,y);c.closePath();c.fill();c.fillStyle='#4a3e32';c.fillRect(bx,y-0.32,0.12,0.04);}},
  bucket(c,o,r){const x=o.x,y=o.y;contact(c,x,y,0.45);c.fillStyle=vgrad(c,x-0.2,0,0.4,'#6a6e70');c.beginPath();c.moveTo(x-0.2,y-0.36);c.lineTo(x+0.2,y-0.36);c.lineTo(x+0.16,y);c.lineTo(x-0.16,y);c.fill();
    c.strokeStyle='#5c5040';c.lineWidth=0.04;c.beginPath();c.moveTo(x+0.05,y-0.3);c.lineTo(x+0.32,y-1.1);c.stroke();
    c.fillStyle='#8a7d5f';c.beginPath();c.moveTo(x+0.3,y-1.1);c.lineTo(x+0.42,y-1.0);c.lineTo(x+0.26,y-0.98);c.fill();},
  radio(c,o,r){const x=o.x-0.25,y=o.y;contact(c,o.x,y,0.5);c.fillStyle=vgrad(c,x,0,0.5,'#5a4a36');rr(c,x,y-0.42,0.5,0.42,0.06);c.fill();
    c.fillStyle='#2a221a';c.beginPath();c.arc(x+0.16,y-0.21,0.11,0,TAU);c.fill();c.fillStyle='#d8b85c';c.fillRect(x+0.32,y-0.33,0.12,0.06);
    c.strokeStyle='#6a6e70';c.lineWidth=0.02;c.beginPath();c.moveTo(x+0.42,y-0.42);c.lineTo(x+0.6,y-0.85);c.stroke();},
  /* --- соты: квартиры --- */
  bed(c,o,r){const x=o.x-0.98,y=o.y;contact(c,o.x,y,1.95);c.fillStyle='#4a3424';rr(c,x,y-0.95,0.12,0.95,0.03);c.fill();rr(c,x+1.83,y-0.6,0.12,0.6,0.03);c.fill();
    c.fillStyle='#3a2a1e';c.fillRect(x+0.1,y-0.38,1.76,0.14);
    c.fillStyle='#d8d0bc';rr(c,x+0.12,y-0.55,1.72,0.2,0.08);c.fill();
    const col=['#7a3a30','#3a4a6a','#5a6a3a','#6a5a7a'][(r()*4)|0];c.fillStyle=col;c.beginPath();c.moveTo(x+0.62,y-0.56);c.quadraticCurveTo(x+1.2,y-0.66,x+1.86,y-0.55);
    c.lineTo(x+1.88,y-0.24);c.lineTo(x+0.62,y-0.26);c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=0.02;for(let i=0;i<4;i++){c.beginPath();c.moveTo(x+0.7+i*0.3,y-0.6);c.lineTo(x+0.7+i*0.3,y-0.28);c.stroke();}
    c.fillStyle='#ece4d2';rr(c,x+0.16,y-0.72,0.42,0.2,0.08);c.fill();},
  table(c,o,r){const x=o.x-0.75,y=o.y;contact(c,o.x,y,1.5);c.fillStyle='#5a4230';c.fillRect(x,y-0.78,1.5,0.09);c.fillStyle='#3e2e22';c.fillRect(x+0.08,y-0.69,0.08,0.69);c.fillRect(x+1.34,y-0.69,0.08,0.69);
    c.fillStyle='rgba(230,220,200,.75)';c.beginPath();c.ellipse(x+0.45,y-0.8,0.17,0.04,0,0,TAU);c.fill();
    c.fillStyle='#8a8a7a';rr(c,x+0.85,y-0.95,0.13,0.15,0.02);c.fill();
    c.fillStyle='#c9a227';c.fillRect(x+1.12,y-1.05,0.04,0.25);c.fillStyle='#fff2c0';c.beginPath();c.ellipse(x+1.14,y-1.09,0.025,0.04,0,0,TAU);c.fill();
    DRAW.chair(c,{x:x+(o.flip?-0.25:1.75),y,s:o.s},r);},
  chair(c,o,r){const x=o.x,y=o.y;c.fillStyle='#4a3626';c.fillRect(x-0.25,y-0.48,0.5,0.06);c.fillRect(x-0.25,y-0.48,0.05,0.48);c.fillRect(x+0.2,y-0.48,0.05,0.48);
    c.fillRect(x+0.2,y-0.98,0.05,0.5);c.fillRect(x-0.0,y-0.95,0.25,0.05);c.fillRect(x-0.0,y-0.8,0.25,0.04);},
  wardrobe(c,o,r){const x=o.x-0.55,y=o.y;contact(c,o.x,y,1.1);c.fillStyle=vgrad(c,x,0,1.1,'#4a3424');rr(c,x,y-2.0,1.1,2.0,0.04);c.fill();
    c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=0.025;c.strokeRect(x+0.06,y-1.92,0.47,1.6);c.strokeRect(x+0.57,y-1.92,0.47,1.6);
    c.fillStyle='#c9a227';c.beginPath();c.arc(x+0.5,y-1.1,0.025,0,TAU);c.arc(x+0.6,y-1.1,0.025,0,TAU);c.fill();
    c.fillStyle='#3a2a1e';c.fillRect(x+0.06,y-0.28,0.98,0.2);
    if(r()<0.6){c.fillStyle='#6a5a4a';rr(c,x+0.15,y-2.32,0.6,0.32,0.04);c.fill();c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x+0.15,y-2.18,0.6,0.03);}},
  bicycle(c,o,r){const x=o.x,y=o.y;c.strokeStyle='#2a2e30';c.lineWidth=0.05;
    for(const dx of [-0.48,0.48]){c.beginPath();c.arc(x+dx,y-0.34,0.32,0,TAU);c.stroke();}
    c.strokeStyle='#6a2a24';c.lineWidth=0.05;c.beginPath();c.moveTo(x-0.48,y-0.34);c.lineTo(x-0.08,y-0.34);c.lineTo(x+0.25,y-0.7);c.lineTo(x-0.2,y-0.7);c.closePath();
    c.moveTo(x+0.25,y-0.7);c.lineTo(x+0.48,y-0.34);c.moveTo(x-0.2,y-0.7);c.lineTo(x-0.24,y-0.82);c.moveTo(x+0.25,y-0.7);c.lineTo(x+0.22,y-0.88);c.stroke();
    c.fillStyle='#2a221a';c.fillRect(x-0.34,y-0.86,0.22,0.05);},
  pots(c,o,r){const n=2+((r()*2)|0);for(let i=0;i<n;i++){const x=o.x-0.3+i*0.3,y=o.y,h=0.18+r()*0.12;
    c.fillStyle=['#8a4a32','#7a5a3a','#6a6a5a'][i%3];c.beginPath();c.moveTo(x-0.11,y-h);c.lineTo(x+0.11,y-h);c.lineTo(x+0.08,y);c.lineTo(x-0.08,y);c.fill();
    c.strokeStyle=o.dry?'#6a5a3a':'#4f7a3a';c.lineWidth=0.035;for(let k=0;k<4;k++){const a=-PI/2+(r()-0.5)*1.6;c.beginPath();c.moveTo(x,y-h);c.quadraticCurveTo(x+Math.cos(a)*0.1,y-h-0.15,x+Math.cos(a)*0.2,y-h-0.15-r()*0.2);c.stroke();}}},
  doll(c,o,r){const x=o.x,y=o.y;c.fillStyle='#b88a6a';c.beginPath();c.arc(x,y-0.3,0.07,0,TAU);c.fill();c.fillStyle='#7a3a4a';c.beginPath();c.moveTo(x-0.1,y);c.lineTo(x-0.06,y-0.24);c.lineTo(x+0.06,y-0.24);c.lineTo(x+0.12,y);c.fill();
    c.fillStyle='#5a3a24';c.fillRect(x-0.08,y-0.38,0.16,0.05);},
  washtub(c,o,r){const x=o.x,y=o.y;contact(c,x,y,0.9);c.fillStyle=vgrad(c,x-0.45,0,0.9,'#7a7e80');c.beginPath();c.moveTo(x-0.45,y-0.45);c.lineTo(x+0.45,y-0.45);c.lineTo(x+0.38,y);c.lineTo(x-0.38,y);c.fill();
    c.fillStyle='rgba(180,200,210,.5)';c.fillRect(x-0.4,y-0.43,0.8,0.05);c.fillStyle='#8a7a5a';c.save();c.translate(x+0.2,y-0.45);c.rotate(-0.4);c.fillRect(-0.04,-0.5,0.08,0.55);c.restore();},
  /* --- эдем: садовники --- */
  wheelbarrow(c,o,r){const x=o.x,y=o.y;contact(c,x,y,1.3);c.fillStyle=vgrad(c,x-0.55,0,1.0,'#5a6a4a');c.beginPath();c.moveTo(x-0.55,y-0.65);c.lineTo(x+0.35,y-0.65);c.lineTo(x+0.2,y-0.3);c.lineTo(x-0.4,y-0.3);c.fill();
    c.fillStyle='#4a3a2a';c.beginPath();c.ellipse(x-0.1,y-0.66,0.42,0.06,0,0,TAU);c.fill();
    c.strokeStyle='#2a2a26';c.lineWidth=0.05;c.beginPath();c.arc(x-0.45,y-0.18,0.18,0,TAU);c.stroke();c.beginPath();c.moveTo(x+0.2,y-0.45);c.lineTo(x+0.72,y-0.6);c.moveTo(x+0.1,y-0.3);c.lineTo(x+0.15,y);c.stroke();},
  seedbench(c,o,r){const x=o.x-0.9,y=o.y;contact(c,o.x,y,1.8);c.fillStyle='#5a4a36';c.fillRect(x,y-0.8,1.8,0.08);c.fillRect(x+0.08,y-0.72,0.07,0.72);c.fillRect(x+1.65,y-0.72,0.07,0.72);
    for(let i=0;i<3;i++){const tx=x+0.1+i*0.56;c.fillStyle='#3a2e22';c.fillRect(tx,y-0.92,0.5,0.12);
      for(let k=0;k<5;k++){c.strokeStyle=o.dry?'#7a6a3a':'#6a9a4a';c.lineWidth=0.03;c.beginPath();c.moveTo(tx+0.05+k*0.1,y-0.92);c.lineTo(tx+0.05+k*0.1+(r()-0.5)*0.04,y-1.0-r()*0.08);c.stroke();}}
    c.fillStyle='rgba(230,220,190,.75)';c.fillRect(x+0.2,y-0.66,0.22,0.1);},
  bench(c,o,r){const x=o.x-0.8,y=o.y;contact(c,o.x,y,1.6);c.fillStyle='#5a4230';c.fillRect(x,y-0.45,1.6,0.07);c.fillRect(x,y-0.7,1.6,0.05);
    c.fillStyle='#3a2a1e';c.fillRect(x+0.1,y-0.45,0.06,0.45);c.fillRect(x+1.44,y-0.45,0.06,0.45);c.fillRect(x+0.1,y-0.72,0.05,0.27);c.fillRect(x+1.45,y-0.72,0.05,0.27);},
  fruitcrate(c,o,r){const x=o.x-0.45,y=o.y;contact(c,o.x,y,0.9);Kit.crate(c,x,y-0.55,0.9,0.55,{seed:o.s%83});
    for(let i=0;i<6;i++){c.fillStyle=['#a8502a','#c08a2a','#7a9a3a'][i%3];c.beginPath();c.arc(x+0.15+i*0.12,y-0.6+(i%2)*0.04,0.07,0,TAU);c.fill();}},
  wcan(c,o,r){const x=o.x,y=o.y;contact(c,x,y,0.5);c.fillStyle=vgrad(c,x-0.18,0,0.36,'#5a7a6a');rr(c,x-0.18,y-0.34,0.36,0.34,0.05);c.fill();
    c.strokeStyle='#5a7a6a';c.lineWidth=0.04;c.beginPath();c.moveTo(x+0.16,y-0.25);c.lineTo(x+0.4,y-0.45);c.stroke();c.beginPath();c.arc(x,y-0.38,0.12,PI,0);c.stroke();},
  tools(c,o,r){const x=o.x,y=o.y;c.strokeStyle='#6a5236';c.lineWidth=0.05;
    c.beginPath();c.moveTo(x-0.2,y);c.lineTo(x-0.05,y-1.55);c.moveTo(x+0.2,y);c.lineTo(x+0.1,y-1.45);c.stroke();
    c.fillStyle='#6a6e70';c.fillRect(x-0.32,y-0.2,0.26,0.05);for(let i=0;i<5;i++)c.fillRect(x-0.3+i*0.05,y-0.2,0.02,0.12);
    c.beginPath();c.moveTo(x+0.06,y-1.45);c.lineTo(x+0.24,y-1.45);c.lineTo(x+0.2,y-1.2);c.lineTo(x+0.1,y-1.2);c.fill();},
  /* --- печать: смотрители механизма --- */
  workbench(c,o,r){const x=o.x-0.9,y=o.y;contact(c,o.x,y,1.8);c.fillStyle=vgrad(c,x,0,1.8,'#5a5048');c.fillRect(x,y-0.9,1.8,0.12);
    c.fillStyle='#3a342e';c.fillRect(x+0.06,y-0.78,0.1,0.78);c.fillRect(x+1.64,y-0.78,0.1,0.78);c.fillRect(x+0.06,y-0.3,1.68,0.06);
    c.fillStyle='#4a5258';c.fillRect(x+1.3,y-1.08,0.3,0.18);c.fillRect(x+1.42,y-1.2,0.06,0.12);
    Kit.gear(c,x+0.45,y-1.05,0.16,8,r()*3,'#8a7a5a');Kit.gear(c,x+0.75,y-0.98,0.09,6,r()*3,'#6a6e70');
    c.fillStyle='rgba(230,220,190,.6)';c.fillRect(x+0.9,y-0.93,0.3,0.03);},
  gearpile(c,o,r){const x=o.x,y=o.y;contact(c,x,y,1.0);for(let i=0;i<5;i++){const rad=0.12+r()*0.2;Kit.gear(c,x-0.35+r()*0.7,y-rad*0.9-(i>2?0.25:0),rad,6+((r()*6)|0),r()*3,['#8a7a5a','#6a6e70','#7a6a4a'][i%3]);}},
  oilcans(c,o,r){const x=o.x-0.3,y=o.y;for(let i=0;i<3;i++){const cx=x+i*0.24,h=0.24+r()*0.16;c.fillStyle=['#8a2e24','#3a5a3a','#6a6e70'][i];rr(c,cx,y-h,0.18,h,0.03);c.fill();
    c.fillStyle='#c9a227';c.fillRect(cx+0.06,y-h-0.05,0.06,0.05);}},
  /* --- архив: писцы совета --- */
  desk(c,o,r){const x=o.x-0.75,y=o.y;contact(c,o.x,y,1.5);c.fillStyle=vgrad(c,x,0,1.5,'#4a3020');c.fillRect(x,y-0.82,1.5,0.1);c.fillRect(x+1.0,y-0.72,0.46,0.72);c.fillRect(x+0.05,y-0.72,0.08,0.72);
    c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=0.02;for(let i=0;i<3;i++)c.strokeRect(x+1.04,y-0.68+i*0.22,0.38,0.2);
    for(let i=0;i<4;i++){c.fillStyle=i%2?'#e2d8c0':'#d0c4a6';c.fillRect(x+0.2+r()*0.05,y-0.86-i*0.03,0.5,0.03);}
    c.fillStyle='#1a1a20';rr(c,x+0.85,y-0.92,0.1,0.1,0.02);c.fill();c.strokeStyle='#d8d0b8';c.lineWidth=0.015;c.beginPath();c.moveTo(x+0.9,y-0.92);c.lineTo(x+1.0,y-1.12);c.stroke();
    c.fillStyle='#2a3a2a';c.beginPath();c.moveTo(x+1.25,y-0.82);c.lineTo(x+1.2,y-1.2);c.lineTo(x+1.42,y-1.2);c.closePath();c.fill();},
  cabinet(c,o,r){const x=o.x-0.4,y=o.y;contact(c,o.x,y,0.8);c.fillStyle=vgrad(c,x,0,0.8,'#5a5e62');rr(c,x,y-1.5,0.8,1.5,0.03);c.fill();
    for(let i=0;i<4;i++){c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=0.02;c.strokeRect(x+0.05,y-1.45+i*0.36,0.7,0.33);c.fillStyle='#b8a878';c.fillRect(x+0.3,y-1.33+i*0.36,0.2,0.05);
      c.fillStyle='rgba(235,225,200,.7)';c.fillRect(x+0.3,y-1.4+i*0.36,0.2,0.04);}
    if(r()<0.5){c.fillStyle='#d8ccb0';c.save();c.translate(x+0.4,y-0.3);c.rotate(0.2);c.fillRect(0,0,0.5,0.04);c.restore();}},
  books(c,o,r){const x=o.x-0.3,y=o.y;let yy=y;for(let i=0;i<5+((r()*4)|0);i++){const w=0.36+r()*0.22,h=0.06+r()*0.05;c.fillStyle=['#5a2a24','#2a3a4a','#4a4a2a','#3a2a3a','#6a5a3a'][i%5];
    c.fillRect(x+(r()-0.5)*0.1,yy-h,w,h);c.fillStyle='rgba(230,220,190,.35)';c.fillRect(x+w*0.8,yy-h+0.01,0.02,h-0.02);yy-=h;}},
  gramophone(c,o,r){const x=o.x,y=o.y;contact(c,x,y,0.8);Kit.crate(c,x-0.35,y-0.6,0.7,0.6,{seed:o.s%71});c.fillStyle='#3a2a1e';c.fillRect(x-0.3,y-0.72,0.6,0.12);
    c.fillStyle='#c9a227';c.beginPath();c.moveTo(x,y-0.75);c.quadraticCurveTo(x+0.05,y-1.0,x+0.2,y-1.05);c.lineTo(x+0.42,y-1.18);c.lineTo(x+0.34,y-0.88);c.closePath();c.fill();
    c.fillStyle='#1a1a1a';c.beginPath();c.ellipse(x-0.08,y-0.73,0.2,0.04,0,0,TAU);c.fill();},
  candles(c,o,r){const x=o.x,y=o.y;for(let i=0;i<3;i++){const cx=x-0.2+i*0.2,h=0.12+r()*0.18;c.fillStyle='#e8dcc0';c.fillRect(cx-0.03,y-h,0.06,h);
    c.fillStyle='rgba(255,210,140,.9)';c.beginPath();c.ellipse(cx,y-h-0.04,0.02,0.04,0,0,TAU);c.fill();game.renderer&&0;}
    c.fillStyle='rgba(200,190,170,.55)';c.fillRect(x-0.32,y-0.03,0.64,0.03);},
  /* --- стена --- */
  calendar(c,o,r){const x=o.x-0.25,y=o.y-0.35;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+0.04,y+0.04,0.5,0.7);c.fillStyle='#e2d8c0';c.fillRect(x,y,0.5,0.7);
    c.fillStyle='#8a2e24';c.fillRect(x,y,0.5,0.14);for(let i=0;i<20;i++){const cx=x+0.06+(i%5)*0.09,cy=y+0.22+Math.floor(i/5)*0.11;
      c.fillStyle='rgba(60,50,40,.5)';c.fillRect(cx,cy,0.05,0.05);if(i<o.s%17+3){c.strokeStyle='rgba(140,30,20,.85)';c.lineWidth=0.015;c.beginPath();c.moveTo(cx-0.01,cy-0.01);c.lineTo(cx+0.06,cy+0.06);c.stroke();}}},
  photo(c,o,r){const x=o.x-0.2,y=o.y-0.25;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+0.03,y+0.03,0.4,0.5);c.fillStyle='#6a5a3a';c.fillRect(x,y,0.4,0.5);
    c.fillStyle='#c8b896';c.fillRect(x+0.04,y+0.04,0.32,0.42);c.fillStyle='rgba(60,50,40,.7)';
    for(let i=0;i<2+((r()*2)|0);i++){const px=x+0.1+i*0.1;c.beginPath();c.arc(px,y+0.2,0.035,0,TAU);c.fill();c.fillRect(px-0.035,y+0.24,0.07,0.16);}},
  notice(c,o,r){const x=o.x-0.45,y=o.y-0.35;c.fillStyle='#4a3a2a';c.fillRect(x,y,0.9,0.7);c.fillStyle='#6a5236';c.fillRect(x+0.04,y+0.04,0.82,0.62);
    for(let i=0;i<4;i++){const px=x+0.08+r()*0.5,py=y+0.08+r()*0.35;c.save();c.translate(px,py);c.rotate((r()-0.5)*0.2);c.fillStyle=['#e2d8c0','#d8c8a0','#e8e0d0'][i%3];c.fillRect(0,0,0.26,0.22);
      c.fillStyle='rgba(40,30,20,.5)';for(let k=0;k<3;k++)c.fillRect(0.03,0.05+k*0.05,0.18,0.015);c.fillStyle='#8a2e24';c.beginPath();c.arc(0.13,0.02,0.015,0,TAU);c.fill();c.restore();}},
  coat(c,o,r){const x=o.x,y=o.y-0.5;c.fillStyle='#6a6e70';c.fillRect(x-0.04,y-0.06,0.08,0.06);
    c.fillStyle=['#4a4030','#3a3e30','#4a3a34'][(r()*3)|0];c.beginPath();c.moveTo(x-0.2,y);c.lineTo(x+0.2,y);c.lineTo(x+0.3,y+0.95);c.lineTo(x-0.3,y+0.95);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x-0.02,y,0.04,0.95);
    if(r()<0.6){c.fillStyle='#c9a227';c.beginPath();c.ellipse(x+0.35,y+0.05,0.18,0.12,0,PI,TAU);c.fill();c.fillRect(x+0.17,y+0.04,0.36,0.03);}},
  shelf(c,o,r){const x=o.x-0.6,y=o.y;c.fillStyle='#4a3a2a';c.fillRect(x,y,1.2,0.06);c.fillStyle='#2a221a';c.fillRect(x+0.1,y+0.06,0.05,0.12);c.fillRect(x+1.05,y+0.06,0.05,0.12);
    for(let i=0;i<4;i++){const ix=x+0.1+i*0.27,h=0.14+r()*0.16;c.fillStyle=['#6a6e70','#8a6d3b','#3a5a6a','#7a7a5a'][(r()*4)|0];rr(c,ix,y-h,0.16,h,0.03);c.fill();}},
  tally(c,o,r){const x=o.x-0.4,y=o.y-0.2;c.strokeStyle='rgba(220,210,190,.5)';c.lineWidth=0.025;const n=8+(o.s%20);
    for(let i=0;i<n;i++){const gx=x+Math.floor(i/5)*0.22+(i%5)*0.04;if(i%5===4){c.beginPath();c.moveTo(gx-0.17,y+0.05);c.lineTo(gx+0.02,y+0.25);c.stroke();}
      else{c.beginPath();c.moveTo(gx,y);c.lineTo(gx,y+0.3);c.stroke();}}},
  clock(c,o,r){const x=o.x,y=o.y;c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(x+0.03,y+0.03,0.25,0,TAU);c.fill();c.fillStyle='#3a2a1e';c.beginPath();c.arc(x,y,0.25,0,TAU);c.fill();
    c.fillStyle='#e2d8c0';c.beginPath();c.arc(x,y,0.2,0,TAU);c.fill();c.strokeStyle='#2a221a';c.lineWidth=0.02;const a=(o.s%60)/60*TAU;
    c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(a)*0.15,y-Math.cos(a)*0.15);c.moveTo(x,y);c.lineTo(x+Math.sin(a*7)*0.1,y-Math.cos(a*7)*0.1);c.stroke();},
  chalk(c,o,r){const L=['СМЕНА 3 НЕ ВЕРНУЛАСЬ','ЖДЁМ НАСОСЫ','МАРИНА — 14 ДНЕЙ','ВОДА ГОРЬКАЯ','КТО ВЗЯЛ МОЙ ТЕРМОС?','НЕ ВЕРЬ ПЛАСТИНКАМ','ПЕЧАТЬ БЕРЕЖЁТ?'];
    c.save();c.translate(o.x-0.8,o.y);c.rotate((r()-0.5)*0.08);c.fillStyle='rgba(225,218,200,.42)';c.font='600 0.24px Oswald';c.fillText(L[o.s%L.length],0,0);c.restore();},
  window(c,o,r){const x=o.x-0.45,y=o.y-0.5;c.fillStyle='#2a1e16';c.fillRect(x-0.06,y-0.06,1.02,1.12);
    const g=c.createLinearGradient(0,y,0,y+1);g.addColorStop(0,'rgba(255,200,130,.75)');g.addColorStop(1,'rgba(200,130,70,.55)');c.fillStyle=g;c.fillRect(x,y,0.9,1.0);
    c.fillStyle='#2a1e16';c.fillRect(x+0.43,y,0.04,1.0);c.fillRect(x,y+0.48,0.9,0.04);
    c.fillStyle=['#7a3a30','#4a5a3a','#5a4a6a'][(r()*3)|0];c.beginPath();c.moveTo(x-0.05,y-0.05);c.quadraticCurveTo(x+0.2,y+0.5,x+0.05,y+1.0);c.lineTo(x-0.05,y+1.0);c.fill();
    c.beginPath();c.moveTo(x+0.95,y-0.05);c.quadraticCurveTo(x+0.7,y+0.5,x+0.85,y+1.0);c.lineTo(x+0.95,y+1.0);c.fill();
    c.fillStyle='rgba(30,20,14,.7)';c.beginPath();c.arc(x+0.6,y+0.62,0.08,0,TAU);c.fill();c.fillRect(x+0.53,y+0.7,0.14,0.3);
    game.renderer&&0;},
  drawing(c,o,r){const x=o.x-0.22,y=o.y-0.18;c.save();c.translate(x,y);c.rotate((r()-0.5)*0.15);c.fillStyle='#ece4d2';c.fillRect(0,0,0.44,0.34);
    c.strokeStyle=['#c8452f','#3a6aa0','#4a8a3a'][(r()*3)|0];c.lineWidth=0.02;
    if(r()<0.5){/* солнце и дом */c.beginPath();c.arc(0.32,0.08,0.05,0,TAU);c.stroke();c.strokeRect(0.06,0.16,0.16,0.13);c.beginPath();c.moveTo(0.05,0.16);c.lineTo(0.14,0.08);c.lineTo(0.23,0.16);c.stroke();}
    else{/* семья: палочки */for(let i=0;i<3;i++){const px=0.1+i*0.12;c.beginPath();c.arc(px,0.1,0.03,0,TAU);c.moveTo(px,0.13);c.lineTo(px,0.24);c.moveTo(px-0.04,0.3);c.lineTo(px,0.24);c.lineTo(px+0.04,0.3);c.stroke();}}
    c.fillStyle='#c9a227';c.beginPath();c.arc(0.22,0.01,0.015,0,TAU);c.fill();c.restore();},
  poster(c,o,r){const T=['ПЕЧАТЬ БЕРЕЖЁТ','СНАРУЖИ — ПЕПЕЛ','СОВЕТ ДУМАЕТ ЗА ВАС','ЭКОНОМЬ ВОЗДУХ','ПИСЬМА ЧИТАЕТ ЦЕНЗУРА'];
    const x=o.x-0.4,y=o.y-0.55;Kit.poster(c,x,y,0.8,1.1,o.s%50);c.fillStyle='rgba(235,225,200,.8)';c.font='700 0.09px Oswald';c.fillText(T[o.s%T.length],x+0.08,y+0.95);
    c.fillStyle='rgba(30,20,14,.6)';c.beginPath();c.arc(x+0.4,y+0.45,0.18,0,TAU);c.fill();},
  mirror(c,o,r){const x=o.x,y=o.y;c.fillStyle='#5a4a36';c.beginPath();c.ellipse(x,y,0.24,0.32,0,0,TAU);c.fill();
    const g=c.createLinearGradient(x-0.2,y-0.3,x+0.2,y+0.3);g.addColorStop(0,'rgba(200,215,220,.6)');g.addColorStop(1,'rgba(90,100,110,.6)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,0.19,0.27,0,0,TAU);c.fill();
    c.strokeStyle='rgba(20,20,20,.5)';c.lineWidth=0.01;c.beginPath();c.moveTo(x-0.1,y-0.2);c.lineTo(x+0.05,y+0.05);c.lineTo(x-0.02,y+0.2);c.stroke();},
  apron(c,o,r){DRAW.coat(c,o,r);c.fillStyle='rgba(120,150,90,.6)';c.fillRect(o.x-0.18,o.y-0.2,0.36,0.5);},
  labels(c,o,r){for(let i=0;i<3;i++){const x=o.x-0.45+i*0.32,y=o.y-0.1+(i%2)*0.08;c.fillStyle='#e2d8c0';c.fillRect(x,y,0.26,0.16);c.fillStyle='rgba(60,80,40,.7)';c.font='600 0.06px Oswald';
    c.fillText(['ROSA','MALUS','PYRUS','SALVIA','MENTHA'][(o.s+i)%5],x+0.02,y+0.1);}},
  logbook(c,o,r){const x=o.x-0.3,y=o.y-0.4;c.fillStyle='#6a6e70';c.fillRect(x-0.03,y-0.03,0.66,0.86);c.fillStyle='#e2d8c0';c.fillRect(x,y,0.6,0.8);
    c.fillStyle='rgba(40,40,40,.5)';c.fillRect(x,y,0.6,0.1);for(let i=0;i<8;i++){c.fillRect(x+0.04,y+0.16+i*0.075,0.52,0.012);if(i<6){c.fillStyle='rgba(30,60,30,.7)';c.fillRect(x+0.48,y+0.13+i*0.075,0.05,0.04);c.fillStyle='rgba(40,40,40,.5)';}}
    c.fillStyle='#c8452f';c.fillRect(x+0.48,y+0.58,0.05,0.04);},
  chalkcalc(c,o,r){c.save();c.translate(o.x-0.9,o.y-0.2);c.fillStyle='rgba(225,225,215,.38)';c.font='500 0.16px Oswald';
    const L=['Т = 214 × 365','ХОД 1/60 · ПОПРАВКА −3','ДАВЛ. 2.4 → 1.9 ?','ЗУБ 41 — ТРЕЩИНА'];c.fillText(L[o.s%4],0,0);c.fillText(L[(o.s+1)%4],0.1,0.24);
    c.strokeStyle='rgba(225,225,215,.3)';c.lineWidth=0.015;c.beginPath();c.arc(1.4,-0.05,0.15,0,TAU);c.moveTo(1.4,-0.05);c.lineTo(1.5,-0.15);c.stroke();c.restore();},
  portrait(c,o,r){const x=o.x-0.32,y=o.y-0.45;c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+0.04,y+0.05,0.64,0.9);c.fillStyle='#8a6d2a';c.fillRect(x,y,0.64,0.9);
    c.fillStyle='#2a221a';c.fillRect(x+0.06,y+0.06,0.52,0.78);c.fillStyle='rgba(160,140,110,.75)';c.beginPath();c.arc(x+0.32,y+0.32,0.11,0,TAU);c.fill();
    c.fillStyle='rgba(40,34,30,.9)';c.beginPath();c.moveTo(x+0.12,y+0.84);c.quadraticCurveTo(x+0.32,y+0.42,x+0.52,y+0.84);c.fill();
    c.fillStyle='rgba(20,16,12,.85)';c.fillRect(x+0.16,y+0.28,0.32,0.06);},   /* глаза заклеены полосой */
  pigeonholes(c,o,r){const x=o.x-0.6,y=o.y-0.45;c.fillStyle='#3a2a1e';c.fillRect(x,y,1.2,0.9);for(let j=0;j<3;j++)for(let i=0;i<4;i++){const cx=x+0.05+i*0.29,cy=y+0.05+j*0.28;
    c.fillStyle='#1a120c';c.fillRect(cx,cy,0.25,0.24);if(((i+j*3+o.s)%3)){c.fillStyle='#e2d8c0';c.fillRect(cx+0.03,cy+0.1,0.19,0.12);c.fillStyle='rgba(140,30,20,.7)';c.fillRect(cx+0.1,cy+0.14,0.05,0.04);}}},
  robe(c,o,r){DRAW.coat(c,o,r);c.fillStyle='rgba(30,26,40,.6)';c.fillRect(o.x-0.3,o.y-0.5,0.6,1.0);},
  /* --- свод --- */
  bulb(c,o,r){const x=o.x,y=o.y;c.strokeStyle='#1a1a1a';c.lineWidth=0.03;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+o.len);c.stroke();
    c.fillStyle='#3a3a36';c.beginPath();c.moveTo(x-0.18,y+o.len+0.12);c.lineTo(x+0.18,y+o.len+0.12);c.lineTo(x+0.07,y+o.len);c.lineTo(x-0.07,y+o.len);c.fill();
    c.fillStyle='rgba(255,220,150,.95)';c.beginPath();c.arc(x,y+o.len+0.17,0.07,0,TAU);c.fill();},
  hangplant(c,o,r){const x=o.x,y=o.y;c.strokeStyle='#4a3a2a';c.lineWidth=0.02;c.beginPath();c.moveTo(x,y);c.lineTo(x-0.15,y+o.len);c.moveTo(x,y);c.lineTo(x+0.15,y+o.len);c.stroke();
    c.fillStyle='#7a4a32';c.beginPath();c.ellipse(x,y+o.len+0.08,0.2,0.1,0,0,PI);c.fill();
    c.strokeStyle=o.dry?'#7a6a3a':'#4f7a3a';c.lineWidth=0.035;for(let i=0;i<6;i++){const sx=x+(r()-0.5)*0.3;c.beginPath();c.moveTo(sx,y+o.len+0.1);c.quadraticCurveTo(sx+(r()-0.5)*0.3,y+o.len+0.4,sx+(r()-0.5)*0.4,y+o.len+0.5+r()*0.6);c.stroke();}},
  laundry(c,o,r){Kit.clothesline(c,o.x,o.y+0.5,o.x2,o.y+0.5,o.s%50);},
  /* --- стена: панель на уровне роста (материал зоны), подтёки, облупленная штукатурка --- */
  band(c,o,r){const x0=o.x0,x1=o.x1,y=o.y,w=x1-x0,top=y-1.1;
    const Z={sump:['#3e4a44','#2e3834','tile'],hives:['#4a3626','#2e2018','wood'],eden:['#b8bca8','#8a9080','tile'],seal:['#4a5058','#2e3238','plate'],archive:['#3a2618','#24160c','wood']}[o.z]||['#3e4a44','#2e3834','tile'];
    c.fillStyle=Z[0];c.fillRect(x0,top,w,1.1);
    if(Z[2]==='tile'){c.strokeStyle='rgba(0,0,0,.28)';c.lineWidth=0.02;for(let yy=top+0.22;yy<y;yy+=0.22){c.beginPath();c.moveTo(x0,yy);c.lineTo(x1,yy);c.stroke();}
      for(let row=0;row<5;row++)for(let xx=x0+(row%2)*0.15;xx<x1;xx+=0.3){c.beginPath();c.moveTo(xx,top+row*0.22);c.lineTo(xx,top+row*0.22+0.22);c.stroke();
        if(r()<0.06){c.fillStyle=Z[1];c.fillRect(xx,top+row*0.22,0.3,0.22);}
        if(o.z==='eden'&&r()<0.05){c.fillStyle='rgba(80,110,50,.45)';c.beginPath();c.ellipse(xx,top+row*0.22+0.2,0.2,0.08,0,0,TAU);c.fill();}}
      c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x0,top,w,0.04);}
    else if(Z[2]==='wood'){c.fillStyle=Z[1];for(let xx=x0+0.1;xx<x1-0.4;xx+=0.9){c.fillRect(xx,top+0.15,0.7,0.8);c.fillStyle='rgba(255,230,190,.06)';c.fillRect(xx,top+0.15,0.7,0.03);c.fillStyle=Z[1];}
      c.fillStyle='#5a4230';c.fillRect(x0,top-0.06,w,0.08);
      if(o.z==='hives'){/* обои над панелью: выцветший узор */c.globalAlpha*=0.35;c.fillStyle='#6a5a48';c.fillRect(x0,top-1.5,w,1.44);
        c.fillStyle='#8a7860';for(let xx=x0+0.2;xx<x1;xx+=0.5)for(let yy=top-1.35;yy<top-0.1;yy+=0.45){c.beginPath();c.arc(xx+((yy*7)%0.25),yy,0.05,0,TAU);c.fill();}
        c.globalAlpha/=0.35;if(r()<0.5){c.fillStyle='rgba(30,22,16,.55)';const px=x0+r()*w*0.8;c.beginPath();c.moveTo(px,top-1.5);c.lineTo(px+0.5,top-1.5);c.lineTo(px+0.3,top-0.6);c.lineTo(px+0.1,top-0.9);c.fill();}}}
    else{for(let xx=x0;xx<x1;xx+=1.2){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(xx,top,0.03,1.1);Kit.bolt(c,xx+0.12,top+0.12,0.025);Kit.bolt(c,xx+0.12,y-0.12,0.025);}
      c.fillStyle='#8a6d2a';c.fillRect(x0,top+0.5,w,0.06);}
    c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x0,y-0.12,w,0.12);},
  streak(c,o,r){for(let i=0;i<3+((r()*4)|0);i++){const x=o.x+r()*o.w,len=o.h*(0.4+r()*0.6),g=c.createLinearGradient(0,o.y,0,o.y+len);
    g.addColorStop(0,o.z==='eden'?'rgba(70,90,50,.35)':'rgba(20,16,10,.38)');g.addColorStop(1,'rgba(20,16,10,0)');c.fillStyle=g;c.fillRect(x,o.y,0.05+r()*0.08,len);}},
  patch(c,o,r){c.save();c.beginPath();c.moveTo(o.x,o.y+o.h*0.2);for(let i=0;i<7;i++){const a=i/7*TAU;c.lineTo(o.x+o.w/2+Math.cos(a)*o.w*0.5*(0.6+r()*0.4),o.y+o.h/2+Math.sin(a)*o.h*0.4*(0.6+r()*0.4));}
    c.closePath();c.clip();c.fillStyle=o.z==='archive'?'#2a1a10':o.z==='seal'?'#3a3e44':'#5a3a2a';c.fillRect(o.x-1,o.y-1,o.w+2,o.h+2);
    c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=0.02;for(let yy=o.y;yy<o.y+o.h;yy+=0.22){c.beginPath();c.moveTo(o.x-1,yy);c.lineTo(o.x+o.w+1,yy);c.stroke();
      for(let xx=o.x+((yy*5)%0.4);xx<o.x+o.w;xx+=0.44){c.beginPath();c.moveTo(xx,yy);c.lineTo(xx,yy+0.22);c.stroke();}}c.restore();},
  /* --- износ и события --- */
  scuff(c,o,r){const x0=o.x-o.w/2;const g=c.createLinearGradient(0,o.y-0.7,0,o.y);g.addColorStop(0,'rgba(10,8,6,0)');g.addColorStop(1,'rgba(10,8,6,.28)');c.fillStyle=g;c.fillRect(x0,o.y-0.7,o.w,0.7);
    for(let i=0;i<o.w/1.6;i++){c.fillStyle='rgba(20,16,12,.18)';c.beginPath();c.ellipse(x0+r()*o.w,o.y-0.05,0.2+r()*0.4,0.04,0,0,TAU);c.fill();}},
  overturned(c,o,r){c.save();c.translate(o.x,o.y);c.rotate(PI/2*(o.s%2?1:-1)*0.92);DRAW.chair(c,{x:0,y:0.25,s:o.s},r);c.restore();
    for(let i=0;i<3;i++){c.fillStyle='#e2d8c0';c.save();c.translate(o.x+0.6+i*0.3,o.y-0.02);c.rotate((r()-0.5)*0.6);c.fillRect(-0.12,-0.02,0.24,0.03);c.restore();}},
  papers(c,o,r){for(let i=0;i<9;i++){c.fillStyle=i%3?'#e2d8c0':'#d0c4a6';c.save();c.translate(o.x-0.9+r()*1.8,o.y-0.02-r()*0.03);c.rotate((r()-0.5)*0.5);c.fillRect(-0.14,-0.015,0.28,0.025);c.restore();}},
  barricade(c,o,r){DRAW.table(c,{x:o.x,y:o.y,s:o.s,flip:true},r);DRAW.mealbox(c,{x:o.x+0.9,y:o.y,s:o.s+1},r);c.save();c.translate(o.x-0.5,o.y);c.rotate(-0.5);
    c.fillStyle='#4a3424';c.fillRect(-0.05,-1.4,1.0,0.08);c.restore();},
  meal(c,o,r){DRAW.table(c,{x:o.x,y:o.y,s:o.s},r);c.fillStyle='rgba(120,90,60,.8)';c.beginPath();c.ellipse(o.x-0.3,o.y-0.82,0.1,0.025,0,0,TAU);c.fill();
    c.fillStyle='#9aa0a4';c.save();c.translate(o.x+0.4,o.y-0.82);c.rotate(1.4);rr(c,-0.06,-0.07,0.12,0.14,0.02);c.fill();c.restore();}
};
/* в слой комнаты: сначала износ, потом вещи; всё чуть приглушено, чтобы геймплей читался первым */
function drawDress(c,R){const D=R.dress;if(!D||!D.length)return;
  c.save();
  for(const o of D)if(o.under){const r=rng(o.s);try{DRAW[o.k](c,o,r);}catch(e){}}
  c.globalAlpha=0.9;
  for(const o of D)if(!o.under&&DRAW[o.k]){const r=rng(o.s);o.dry=R.wilt;try{DRAW[o.k](c,o,r);}catch(e){}}
  c.restore();}
