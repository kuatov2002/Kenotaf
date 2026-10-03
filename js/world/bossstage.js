"use strict";
/* ============================== СЦЕНА БОССА ==============================
   ВСТУПЛЕНИЕ (3.2 с, управление не отнимается): кадр тянется к боссу и показывает его в его мире —
   «открытка»: у Надсмотрщика по одному загораются прожекторы и качаются грузы; у Примарха луч цензуры
   находит курьера; Корчеватель выдёргивает куст из грядки; у Регулятора бьют все часы зала; Архивариус
   съезжает по рельсу, с полок сыплются листы. Поверх — титульная табличка: зона, имя, кто он, реплика.
   Пока идёт вступление, босс не атакует.
   ПОСЛЕДНЯЯ ФАЗА — зал меняется у каждого (у Архивариуса это свинец, он у него свой):
     Надсмотрщик — аварийная тревога: красный свет, мигалка, с потолка сыплется обвал (метка на полу);
     Примарх — свет гаснет, остаётся только луч прожектора, капсулы чаще;
     Корчеватель — лампы-солнца лопаются, пол затягивает гербицидом;
     Регулятор — полночь: циферблаты краснеют, часы бьют. */
const BOSS_INTRO={
  overseer:{k:'ЗОНА I · ГРУЗОВОЙ ПУТЬ НАВЕРХ',n:'НАДСМОТРЩИК',e:'ГУСЕНИЧНЫЙ КРАН · ДЕРЖИТ ЯРУС −41',l:'«ГРУЗ НЕ ПОКИДАЕТ ЯРУС БЕЗ ПРИКАЗА.»'},
  primarch:{k:'ЗОНА II · КАБИНЕТ ЦЕНЗУРЫ',n:'ЦЕНЗОР-ПРИМАРХ',e:'ПЕРВЫЙ ЧИТАТЕЛЬ ВСЕХ ПИСЕМ',l:'«ИЗЪЯТО. ИЗЪЯТО. ИЗЪЯТО.»'},
  uprooter:{k:'ЗОНА III · КОРЧЕВАЛЬНЯ',n:'КОРЧЕВАТЕЛЬ',e:'САДОВАЯ МАШИНА ЭДЕМ-К-1',l:'«ВНЕ КАТАЛОГА — СОРНЯК.»'},
  regulator:{k:'ЗОНА IV · ЦИФЕРБЛАТ',n:'РЕГУЛЯТОР',e:'ЧАСЫ, ПО КОТОРЫМ ИДЁТ ПЕЧАТЬ',l:'«ВРЕМЯ — ЭТО ДИСЦИПЛИНА.»'},
  archivist:{k:'ЗОНА V · ЗАЛ ПЕЧАТИ',n:'АРХИВАРИУС',e:'ХРАНИТЕЛЬ ПЕЧАТИ',l:'«ДОСТУП К ПЕЧАТИ — ТОЛЬКО СОВЕТУ.»'}
};
const BossStage={
  INTRO:3.2,
  title(o,mini){let el=document.getElementById('bosstitle');
    if(!el){el=document.createElement('div');el.id='bosstitle';el.innerHTML='<div class="bk"></div><div class="bn"></div><div class="be"></div><div class="bl"></div>';document.getElementById('hud').appendChild(el);}
    el.classList.toggle('mini',!!mini);
    el.querySelector('.bk').textContent=o.k;el.querySelector('.bn').textContent=o.n;el.querySelector('.be').textContent=o.e||'';el.querySelector('.bl').textContent=o.l||'';
    el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(this._tt);this._tt=setTimeout(()=>el.classList.remove('on'),3600);},
  /* старт вступления (вызывается при срабатывании триггера арены) */
  intro(W,b,info){const g=W.game,o=info||BOSS_INTRO[b.type]||{k:'',n:b.name,e:'',l:''};
    W.stage={b,t:0,o,mini:!!info,last:false,fx:[]};
    b.cd=Math.max(b.cd||0,this.INTRO);if(typeof BossDyn!=='undefined')BossDyn.clear(b);
    this.title(o,!!info);g.audio.tone(98,2.4,'sine',0.04,98,g.audio.verb);},
  update(W,dt){const S=W.stage;if(!S)return;const g=W.game,b=S.b,p=W.player,cam=g.camera;S.t+=dt;
    if(b.dead){cam.frame=null;W.stage=null;return;}
    /* вступление: кадр тянется к боссу и отпускает */
    if(S.t<this.INTRO){const k=S.t<0.6?S.t/0.6:S.t>this.INTRO-0.8?(this.INTRO-S.t)/0.8:1;
      cam.frame={x:lerp(p.cx,b.cx,0.65),y:lerp(p.cy,b.cy,0.5)-1,w:0.85*EZ.io(clamp(k,0,1))};cam.tzoom=lerp(1,0.82,EZ.io(clamp(k,0,1)));
      if(!S.mini)this.vignette(W,b,S,dt);
      if(b.cd<0.3)b.cd=0.3;}
    else if(!S.introDone){S.introDone=true;cam.frame=null;cam.tzoom=1;}
    /* последняя фаза: зал меняется один раз и живёт так до конца боя */
    if(!S.last&&this.lastPhase(b)){S.last=true;S.lt=0;this.shift(W,b,S);}
    if(S.last){S.lt+=dt;this.live(W,b,S,dt);}},
  lastPhase(b){if(b.type==='overseer')return b.nodes.some(n=>n.core&&!n.locked);return (b.phase||1)>=3;},
  /* «открытка»: короткая сцена — босс в своём мире */
  vignette(W,b,S,dt){const g=W.game,R=W.room,t=S.t,once=(k,at,fn)=>{if(t>=at&&!S[k]){S[k]=1;fn();}};
    if(b.type==='overseer'){
      for(let i=0;i<4;i++)once('ov'+i,0.3+i*0.35,()=>{g.audio.hitMetal();const L=(R.lights||[])[i];if(L){L.i0=L.i0||L.i;L.i=L.i0*1.6;}
        g.particles.burst(6+i*8,3,10,{kind:'spark',col:'#ffe6a3',spd:4,life:0.6,size:0.05,add:true,g:12});});
      if(R.weights)for(const w of R.weights)w.sway=(w.sway||0)+dt*2;}
    else if(b.type==='primarch'){once('pr',0.4,()=>{g.audio.mat('brass',1);g.camera.addShake(0.3);});
      if(t<2.6&&Math.random()<dt*30){const p=W.player;g.particles.spawn({kind:'dust',x:p.cx+(Math.random()-0.5)*1.6,y:p.cy+(Math.random()-0.5)*1.6,vx:0,vy:-0.3,life:0.8,size:0.06,col:'#fff2c0',add:true,a:0.8});}}
    else if(b.type==='uprooter'){once('up',0.7,()=>{g.audio.mat('rubber',1);g.camera.addShake(0.4);
      g.particles.burst(b.cx+b.face*3,b.bottom-0.2,28,{kind:'leaf',col:'#6f9a4a',spd:6,life:1.4,size:0.14,g:8,drag:0.8});
      g.particles.burst(b.cx+b.face*3,b.bottom-0.1,18,{kind:'debris',col:'#5a4630',spd:5,life:1.0,size:0.1,g:20});});}
    else if(b.type==='regulator'){for(let i=0;i<4;i++)once('rg'+i,0.3+i*0.55,()=>{g.audio.tone(392+i*98,1.6,'sine',0.03,0,g.audio.verb);g.audio.hitMetal();});}
    else if(b.type==='archivist'){once('ar',0.3,()=>g.audio.hydraulic(1));
      if(t<2.4&&Math.random()<dt*24)g.particles.spawn({kind:'debris',x:b.cx+(Math.random()-0.5)*8,y:b.y+Math.random()*2,vx:(Math.random()-0.5)*1.2,vy:0.6,life:2.4,size:0.12,col:'#e2d8c0',g:3,rot:Math.random()*6,vr:(Math.random()-0.5)*6});}},
  /* смена зала в последней фазе */
  shift(W,b,S){const g=W.game,R=W.room;g.audio.bossRoar();g.camera.addShake(0.9);
    const tint=(col,k)=>{for(const L of (R.lights||[])){L.col0=L.col0||L.col;L.i0=L.i0||L.i;L.col=col;L.i=L.i0*k;}};
    if(b.type==='overseer'){tint('#ff4a2a',0.9);g.hud.say('АВАРИЙНАЯ ТРЕВОГА. ПОДЪЁМНЫЕ ПУТИ ОБРУШАЮТСЯ.','НАДСМОТРЩИК');S.drop=2.2;}
    else if(b.type==='primarch'){tint('#3a2a20',0.35);g.hud.say('СВЕТ ВЫКЛЮЧЕН. ОСТАЛСЯ ТОЛЬКО ЛУЧ ЦЕНЗУРЫ.','ЦЕНЗОР-ПРИМАРХ');S.drop=3.0;}
    else if(b.type==='uprooter'){tint('#7ab04a',0.55);g.hud.say('ЛАМПЫ-СОЛНЦА ЛОПАЮТСЯ. ПОЛ ЗАТЯГИВАЕТ ГЕРБИЦИДОМ.','КОРЧЕВАТЕЛЬ');
      for(let i=0;i<8;i++)g.particles.burst(4+i*6,3,8,{kind:'spark',col:'#fff2c0',spd:5,life:0.6,size:0.05,add:true,g:14});}
    else if(b.type==='regulator'){tint('#ff5a3a',0.8);g.hud.say('ПОЛНОЧЬ.','РЕГУЛЯТОР');}},
  live(W,b,S,dt){const g=W.game,R=W.room,p=W.player;
    if(b.type==='overseer'||b.type==='primarch'){S.drop-=dt;
      if(S.drop<=0){S.drop=b.type==='overseer'?3.4:2.6;const x=clamp(p.cx+(Math.random()-0.5)*7,2,R.w-2);
        BossFX.drop(W,x,{look:b.type==='overseer'?'boulder':'capsule',r:0.42,rad:1.3,delay:0.9});}}
    if(b.type==='overseer'){/* мигалка тревоги */const k=0.5+0.5*Math.sin(W.time*7);for(const L of (R.lights||[]))if(L.i0)L.i=L.i0*(0.5+0.6*k);}
    if(b.type==='uprooter'&&Math.random()<dt*14)g.particles.spawn({kind:'steam',x:Math.random()*R.w,y:R.h-3.6,vx:(Math.random()-0.5)*0.6,vy:-0.2,life:2.4,size:0.9,grow:0.8,col:'#9ab84a',drag:0.8,a:0.3});},
  /* поверх мира: мигалка тревоги, полночь, темнота с лучом */
  draw(c,W){const S=W.stage;if(!S||!S.last)return;const g=W.game,b=S.b,t=W.time;c.setTransform(1,0,0,1,0,0);
    if(b.type==='overseer'){const k=Math.max(0,Math.sin(t*7));c.fillStyle='rgba(200,30,20,'+(0.08+0.08*k)+')';c.fillRect(0,0,g.vw,g.vh);}
    else if(b.type==='primarch'){const p=W.player,cam=g.camera,s=g.ppm*cam.zoom,px=(p.cx-cam.cx)*s+g.vw/2,py=(p.cy-cam.cy)*s+g.vh/2;
      const gr=c.createRadialGradient(px,py,s*1.8,px,py,s*9);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=gr;c.fillRect(0,0,g.vw,g.vh);}
    else if(b.type==='regulator'){c.fillStyle='rgba(120,20,20,.1)';c.fillRect(0,0,g.vw,g.vh);}
    else if(b.type==='uprooter'){const gr=c.createLinearGradient(0,g.vh*0.6,0,g.vh);gr.addColorStop(0,'rgba(140,180,70,0)');gr.addColorStop(1,'rgba(140,180,70,.18)');c.fillStyle=gr;c.fillRect(0,0,g.vw,g.vh);}},
  end(W){const R=W.room;if(R)for(const L of (R.lights||[])){if(L.col0)L.col=L.col0;if(L.i0)L.i=L.i0;}W.stage=null;W.game.camera.frame=null;}
};
