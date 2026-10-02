"use strict";
/* ============================== DYNAMIC WORLD DRAW ============================== */
function drawDoor(c,d,t,locked){
  const x=d.x,y=d.y,w=d.w,h=d.h;
  const g=c.createLinearGradient(x,y,x,y+h);
  g.addColorStop(0,'#05060a');g.addColorStop(1,'#0b0d12');
  c.fillStyle=g;c.fillRect(x,y,w,h);
  const lg=c.createRadialGradient(x+w/2,y+h/2,0,x+w/2,y+h/2,h*1.2);
  lg.addColorStop(0,'rgba(160,200,220,.2)');lg.addColorStop(1,'rgba(160,200,220,0)');
  c.fillStyle=lg;c.fillRect(x-w,y-h*0.6,w*3,h*2.2);
  c.fillStyle='#3a4046';c.fillRect(x-0.24,y-0.24,w+0.48,0.24);
  c.fillRect(x-0.24,y,0.24,h);c.fillRect(x+w,y,0.24,h);
  for(let i=0;i<4;i++){Kit.bolt(c,x-0.12,y+0.3+i*(h-0.6)/3,0.06);Kit.bolt(c,x+w+0.12,y+0.3+i*(h-0.6)/3,0.06);}
  if(d.latch&&!d.latchHere&&locked){
    /* засов с той стороны: глухая стальная створка с поперечным брусом — «откроют изнутри» */
    Kit.plate(c,x,y,w,h,'steel',880+(x|0),{rust:0.5,bolts:true});
    c.fillStyle='#2b3035';c.fillRect(x-0.3,y+h*0.45,w+0.6,0.32);
    c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x-0.3,y+h*0.45,w+0.6,0.06);
    Kit.bolt(c,x-0.15,y+h*0.45+0.16,0.08);Kit.bolt(c,x+w+0.15,y+h*0.45+0.16,0.08);
    return;}
  if(d.latch&&d.latchHere&&!game.gs.flags[d.latch]){
    /* засов на этой стороне: латунный брус и рукоять — E откроет шорткат */
    const p=0.5+0.5*Math.sin(t*3);
    c.fillStyle='#8a6d2a';c.fillRect(x-0.3,y+h*0.45,w+0.6,0.3);
    c.fillStyle='#e8c96a';c.fillRect(x+w/2-0.1,y+h*0.45-0.3,0.2,0.9);
    game.renderer.glowAdd(x+w/2,y+h*0.5,1.0,'#e8c96a',0.2+0.15*p);
    return;}
  if(locked){const p=0.5+0.5*Math.sin(t*4);
    c.fillStyle=rgba('#c8452f',0.3+0.28*p);c.fillRect(x,y,w,h);
    Kit.hazardTape(c,x-0.24,y+h,w+0.48,0.26);
    game.renderer.glowAdd(x+w/2,y+h/2,1.4,'#c8452f',0.3+0.2*p);}
}
/* ДО света: машины, реквизит, двери, чекпоинт — часть окружения, их затеняет свет комнаты */
function drawWorldDyn(c,R,t,gs){
  if(R.dyn)R.dyn(c,t,game.world);
  const ms=R.machines||[];
  for(let i=0;i<ms.length;i++){
    const m=ms[i];
    if(m.kind==='flywheel'){
      Kit.flywheel(c,m.x,m.y,m.r,m.a,7);
      c.save();c.globalCompositeOperation='lighter';
      c.fillStyle=rgba('#ffbe63',0.05);c.beginPath();c.arc(m.x,m.y,m.r*1.4,0,TAU);c.fill();c.restore();
      game.renderer.glowAdd(m.x,m.y,m.r*0.8,'#ff9c4a',0.12);
    }else if(m.kind==='crane'){
      Kit.trolley(c,m.x,m.y,1.1);
      Kit.chain(c,m.x,m.y+0.5,3.4+Math.sin(t*0.5)*0.2,0.13,Math.sin(t*0.4)*0.04,t);
      Kit.hook(c,m.x,m.y+4.0,1.1);
    }else if(m.kind==='chain'){
      Kit.chain(c,m.x,m.y,m.len,0.13,Math.sin(t*0.6+m.ph)*0.06,t);
      Kit.hook(c,m.x+Math.sin(t*0.6+m.ph)*m.len*0.06,m.y+m.len,0.9);
    }else if(m.kind==='needle'){
      Kit.gauge(c,m.x,m.y,m.r,0.6+0.14*Math.sin((m.v||0)*3)+0.03*Math.sin((m.v||0)*17));
    }else if(m.kind==='turbines'){
      const xs=m.xs||[11,18,25],by=m.y||21;
      for(let k=0;k<xs.length;k++){const x=xs[k],y=by-2.7;
        c.save();c.translate(x,y);c.rotate((m.a||0)*(1+k*0.12));
        c.strokeStyle=m.on?'rgba(255,225,160,.55)':'rgba(120,110,90,.25)';c.lineWidth=0.13;
        for(let j=0;j<7;j++){const a=j/7*TAU;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*1.3,Math.sin(a)*1.3);c.stroke();}
        c.restore();
        if(m.on){game.renderer.glowAdd(x,y,1.6,'#ffd27a',0.2);
          if(Math.random()<0.05)game.particles.spawn({kind:'steam',x:x+(Math.random()-0.5)*3,y:by-4.6,
            vx:0,vy:-1.6,life:1.6,size:0.4,grow:0.8,col:'#cfc9b8',drag:0.8,a:0.3});}}
    }else if(m.kind==='swayCab'){
      c.save();c.translate(m.x+m.w/2,m.y-m.len);c.rotate(m.a);
      Kit.cable(c,0,0,0,m.len,0.2,0.09,'#2b2119');
      c.translate(-m.w/2,m.len);Kit.liftCab(c,0,0,m.w,m.h,m.a*0.4);c.restore();
    }else if(m.kind==='sealwheel'){
      Kit.sealWheel(c,m.x,m.y,m.r,m.a);
      if(m.turned){
        c.save();c.globalCompositeOperation='lighter';
        const p=0.5+0.5*Math.sin(t*1.4);
        const g2=c.createRadialGradient(m.x,m.y,0,m.x,m.y,m.r*3);
        g2.addColorStop(0,rgba('#fff6dd',0.3+0.2*p));g2.addColorStop(1,'rgba(255,246,221,0)');
        c.fillStyle=g2;c.beginPath();c.arc(m.x,m.y,m.r*3,0,TAU);c.fill();c.restore();
        game.renderer.glowAdd(m.x,m.y,m.r*2.4,'#fff6dd',0.5);
      }
    }else if(m.kind==='archivist'){
      const p=0.5+0.5*Math.sin(t*0.8);
      c.save();c.globalCompositeOperation='lighter';
      c.fillStyle=rgba(m.alive?'#fff6dd':'#5a606a',0.1+0.07*p);
      c.beginPath();c.arc(m.x,m.y,5.5,0,TAU);c.fill();c.restore();
    }
  }
  if(R.weights){
    for(let i=0;i<R.weights.length;i++){
      const wt=R.weights[i];
      if(wt.state!=='down')continue;
      if(R.pit&&wt.x+wt.w/2>R.pit[0]&&wt.x-wt.w/2<R.pit[1])continue;
      const yy=22-wt.h;
      Kit.plate(c,wt.x-wt.w/2,yy,wt.w,wt.h,'steel',301+wt.id,{rust:0.9});
      Kit.hazardTape(c,wt.x-wt.w/2,yy+wt.h-0.3,wt.w,0.3);
      for(let k=0;k<4;k++)Kit.bolt(c,wt.x-wt.w/2+0.3+k*0.6,yy+0.4,0.07);
      Kit.rubble(c,wt.x-wt.w/2-1,21.4,wt.w+2,0.6,rng(wt.id*31),'concrete');
    }
  }
  const hz=R.hazards||[];
  for(let i=0;i<hz.length;i++){
    const h=hz[i];
    if(h.kind==='coolant'||h.look==='coolant'){
      const yy=h.y+Math.sin(t*1.2)*0.06;
      const g=c.createLinearGradient(0,yy,0,h.y+h.h);
      g.addColorStop(0,'rgba(120,240,170,.55)');g.addColorStop(.3,'rgba(40,140,90,.75)');g.addColorStop(1,'rgba(10,50,30,.9)');
      c.fillStyle=g;c.fillRect(h.x,yy,h.w,h.h);
      c.fillStyle='rgba(200,255,220,.35)';
      for(let k=0;k<8;k++){const x=h.x+((k*2.1+t*0.6)%h.w);c.fillRect(x,yy+Math.sin(t*2+k)*0.04,0.7,0.05);}
      game.renderer.glowAdd(h.x+h.w/2,yy+0.4,h.w*0.55,'#69d68f',0.55);
    }else if(h.look==='molten'){
      const yy=h.y+Math.sin(t*0.9)*0.05,g=c.createLinearGradient(0,yy,0,h.y+h.h);
      g.addColorStop(0,'rgba(255,236,170,.95)');g.addColorStop(.25,'rgba(255,140,40,.95)');g.addColorStop(1,'rgba(120,30,8,.98)');
      c.fillStyle=g;c.fillRect(h.x,yy,h.w,h.h+0.4);
      c.fillStyle='rgba(60,20,8,.55)';for(let k=0;k<6;k++){const x=h.x+((k*2.7+t*0.25)%h.w);c.beginPath();c.ellipse(x,yy+0.12,0.6,0.08,0,0,TAU);c.fill();}
      game.renderer.glowAdd(h.x+h.w/2,yy+0.2,h.w*0.6,'#ff8a3a',0.7);
      if(Math.random()<0.15)game.particles.spawn({kind:'spark',x:h.x+Math.random()*h.w,y:yy,vx:(Math.random()-0.5)*1.5,vy:-2-Math.random()*3,life:0.7,size:0.04,col:'#ffcf7a',add:true,g:10});
    }else if(h.kind==='pit'){
      const g=c.createLinearGradient(0,h.y-3,0,h.y+h.h);
      g.addColorStop(0,'rgba(4,6,8,0)');g.addColorStop(1,'rgba(2,3,4,.98)');
      c.fillStyle=g;c.fillRect(h.x,h.y-3,h.w,h.h+3);
    }
  }
  if(R.checkpoint){
    const cp=R.checkpoint;cp.lit=cp.lit||(gs.cp.room===R.id);
    Kit.checkpointPost(c,cp.x,cp.y,cp.h,cp.lit);
  }
  for(let i=0;i<R.doors.length;i++)drawDoor(c,R.doors[i],t,game.gates.doorLocked(R.doors[i]));
  if(game.world.bossDoorClosed&&R.bossDoor){
    const bd=R.bossDoor;
    Kit.plate(c,bd.x-0.3,bd.y-0.3,bd.w+0.6,bd.h+0.6,'steel',555,{rust:0.7});
    Kit.hazardTape(c,bd.x-0.3,bd.y+bd.h,bd.w+0.6,0.26);
    for(let i=0;i<3;i++)Kit.bolt(c,bd.x+bd.w/2,bd.y+0.4+i*0.6,0.08);
  }
}
/* ПОСЛЕ света: всё, с чем игрок взаимодействует или что его бьёт, читается в любой темноте */
function drawWorldLive(c,R,t,gs){
  const W=game.world;
  /* облака пыльцы и продувочные колонны — читаются в любом свете */
  for(const z of (R.pollen||[])){
    const g2=c.createLinearGradient(0,z.y,0,z.y+z.h);
    g2.addColorStop(0,'rgba(190,204,110,0)');g2.addColorStop(0.3,'rgba(190,204,110,.2)');g2.addColorStop(Math.max(0.31,1-1.2/z.h),'rgba(160,178,80,.3)');g2.addColorStop(1,'rgba(160,178,80,.16)');
    c.fillStyle=g2;c.fillRect(z.x,z.y,z.w,z.h);
    const n=Math.min(90,Math.round(z.w*z.h*0.5));c.fillStyle='rgba(226,236,140,.6)';
    for(let i=0;i<n;i++){const sx=z.x+((i*7.13+t*0.35*(1+i%3))%z.w),sy=z.y+(((i*3.71+Math.sin(t*0.7+i)*0.8)%z.h)+z.h)%z.h;
      c.fillRect(sx,sy,0.07,0.07);}
  }
  for(const a of (R.air||[])){
    c.save();c.globalCompositeOperation='lighter';
    const g3=c.createLinearGradient(a.x,0,a.x+a.w,0);
    g3.addColorStop(0,'rgba(190,225,255,0)');g3.addColorStop(0.5,'rgba(190,225,255,.22)');g3.addColorStop(1,'rgba(190,225,255,0)');
    c.fillStyle=g3;c.fillRect(a.x,a.y,a.w,a.h);
    c.strokeStyle='rgba(220,240,255,.35)';c.lineWidth=0.04;
    for(let i=0;i<5;i++){const x=a.x+0.3+i*(a.w-0.6)/4,o=(t*6+i*1.7)%3;
      for(let y=a.y+a.h-o;y>a.y;y-=3){c.beginPath();c.moveTo(x,y);c.lineTo(x,y-0.9);c.stroke();}}
    c.restore();game.renderer.glowAdd(a.x+a.w/2,a.y+a.h*0.6,a.w*1.4,'#cfeaff',0.25);
  }
  for(let i=0;i<W.pushables.length;i++)W.pushables[i].draw(c,t);
  const hz=R.hazards||[];
  for(let i=0;i<hz.length;i++){
    const h=hz[i];
    if(h.kind==='spikes'){Kit.spikes(c,h.x,h.y,h.w,h.h);
      c.fillStyle=rgba('#c8452f',0.16+0.06*Math.sin(t*3));c.fillRect(h.x,h.y+h.h*0.55,h.w,h.h*0.45);}
    else if(h.kind==='steam'){
      if(h.active){c.save();c.globalCompositeOperation='lighter';
        const g=c.createLinearGradient(h.x,h.y+h.h,h.x,h.y);
        g.addColorStop(0,'rgba(240,244,248,.55)');g.addColorStop(1,'rgba(240,244,248,0.04)');
        c.fillStyle=g;c.fillRect(h.x,h.y,h.w,h.h);c.restore();
        game.renderer.glowAdd(h.x+h.w/2,h.y+h.h*0.5,h.w*1.6,'#e8f0f6',0.35);
      }else if(h.warn){
        const p=0.5+0.5*Math.sin(t*18);
        c.fillStyle=rgba('#c8452f',0.2+0.26*p);c.fillRect(h.x,h.y,h.w,h.h);
        game.renderer.glowAdd(h.x+h.w/2,h.y+h.h,h.w*1.4,'#c8452f',0.25*p);
      }
      c.fillStyle='#5d6067';rr(c,h.x-0.1,h.y+h.h,h.w+0.2,0.4,0.06);c.fill();
      c.fillStyle=h.active?'#ffe9c0':(h.warn?'#ff5a3a':'#3a2a26');c.fillRect(h.x+h.w/2-0.12,h.y+h.h+0.12,0.24,0.14);
    }
  }
  game.lamps.drawLive(c,R,t);
  drawChalk(c,R,t);
  if(R.anchors&&R.anchors.length){const p=W.player,aim=p&&p.hookAim,has=game.gs.has('hook');
    for(const a of R.anchors){if(a.hidden)continue;drawAnchor(c,a,t,has,a===aim||(p&&p.hook&&p.hook.a===a));}}
  for(let i=0;i<W.interactables.length;i++)W.interactables[i].draw(c,t,gs);
  if(R.weights&&W.boss&&!W.boss.dead){
    for(let i=0;i<R.weights.length;i++){
      const wt=R.weights[i];
      if(wt.state!=='hang'&&wt.state!=='fall')continue;
      const p2=W.boss.phase===2&&wt.state==='hang';
      if(wt.state==='hang'){
        c.strokeStyle='#2b3035';c.lineWidth=0.09;
        c.beginPath();c.moveTo(wt.x,wt.cableTop);c.lineTo(wt.x,wt.y);c.stroke();
        c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=0.03;
        c.beginPath();c.moveTo(wt.x-0.03,wt.cableTop);c.lineTo(wt.x-0.03,wt.y);c.stroke();
        /* скоба-подвес; в фазе II груз помечен латунной мишенью — тот же язык, что у противовеса */
        c.strokeStyle=p2?rgba('#e8c96a',0.85):'#4a5158';c.lineWidth=0.1;
        c.beginPath();c.arc(wt.x,wt.y-0.25,0.22,0,TAU);c.stroke();
        if(p2){const ph=0.5+0.5*Math.sin(t*4+wt.id);
          c.strokeStyle=rgba('#e8c96a',0.35+0.45*ph);c.lineWidth=0.14;
          c.beginPath();c.moveTo(wt.x,wt.cableTop+0.3);c.lineTo(wt.x,wt.y-0.45);c.stroke();}
      }
      Kit.plate(c,wt.x-wt.w/2,wt.y,wt.w,wt.h,'steel',301+wt.id,{rust:0.8});
      Kit.hazardTape(c,wt.x-wt.w/2,wt.y+wt.h-0.3,wt.w,0.3);
      for(let k=0;k<4;k++)Kit.bolt(c,wt.x-wt.w/2+0.3+k*0.6,wt.y+0.4,0.07);
      Kit.stencil(c,wt.x-0.5,wt.y+1.5,'4Т',0.4,'rgba(220,210,180,.55)',0.55);
      if(p2){
        const ph=0.5+0.5*Math.sin(t*4+wt.id),cx=wt.x,cy=wt.y+wt.h*0.5-0.2;
        c.fillStyle='rgba(20,16,10,.75)';c.beginPath();c.arc(cx,cy,0.7,0,TAU);c.fill();
        c.strokeStyle=rgba('#ffe6a3',0.85);c.lineWidth=0.07;
        c.beginPath();c.arc(cx,cy,0.6,0,TAU);c.stroke();c.beginPath();c.arc(cx,cy,0.3,0,TAU);c.stroke();
        c.fillStyle=rgba('#ffe6a3',0.4+0.5*ph);c.beginPath();c.arc(cx,cy,0.1,0,TAU);c.fill();
        game.renderer.glowAdd(cx,cy,1.4,'#e8c96a',0.3+0.25*ph);
      }
    }
  }
  for(let i=0;i<W.projectiles.length;i++){
    const pr=W.projectiles[i];
    c.save();c.translate(pr.x,pr.y);c.rotate(pr.rot||0);
    if(pr.kind==='nut'){
      c.fillStyle='#9aa1a8';c.beginPath();
      for(let k=0;k<6;k++){const a=k/6*TAU;c.lineTo(Math.cos(a)*pr.r*1.4,Math.sin(a)*pr.r*1.4);}
      c.closePath();c.fill();c.strokeStyle='#ff5a3a';c.lineWidth=0.04;c.stroke();
      c.fillStyle='#22262a';c.beginPath();c.arc(0,0,pr.r*0.5,0,TAU);c.fill();
    }else if(pr.kind==='shard'){
      c.fillStyle='#cfe6ee';c.beginPath();c.moveTo(-pr.r*2,0);c.lineTo(0,-pr.r);c.lineTo(pr.r*2,0);c.lineTo(0,pr.r);c.closePath();c.fill();
      c.fillStyle=rgba('#c8452f',0.7);c.beginPath();c.arc(0,0,pr.r*0.5,0,TAU);c.fill();
    }else if(pr.kind==='wave'){
      c.strokeStyle=rgba('#c8452f',0.65);c.lineWidth=0.16;c.beginPath();c.arc(0,0,pr.r*2,0,TAU);c.stroke();
      c.fillStyle=rgba('#8a7a6a',0.28);c.beginPath();c.arc(0,0,pr.r*1.6,0,TAU);c.fill();
    }else if(pr.kind==='orb'){
      /* осколок ядра: свинец со светящейся сердцевиной; латунное кольцо = «отбей импульсом» */
      c.rotate(-(pr.rot||0));
      const og=c.createRadialGradient(0,0,0,0,0,pr.r);
      og.addColorStop(0,pr.back?'#ffffff':'#e6f2ff');og.addColorStop(.55,pr.back?'#bfe3ff':'#6e7c8c');og.addColorStop(1,'#2a2e34');
      c.fillStyle=og;c.beginPath();c.arc(0,0,pr.r,0,TAU);c.fill();
      c.strokeStyle=pr.back?'rgba(220,240,255,.9)':'rgba(232,201,106,.9)';c.lineWidth=0.06;
      c.beginPath();c.arc(0,0,pr.r+0.16+0.05*Math.sin(game.world.time*12),0,TAU);c.stroke();
    }
    c.restore();
    game.renderer.glowAdd(pr.x,pr.y,pr.kind==='orb'?1.1:0.6,pr.kind==='orb'?'#bfe3ff':'#ff9c4a',pr.kind==='orb'?0.6:0.35);
  }
}
/* клапан-отбойник: латунная головка на трубе. Ударом вниз от неё отскакивают (как от шипов),
   поэтому её язык — тот же латунный, что у всего, с чем курьер взаимодействует */
function drawPogo(c,q,t){
  const r=q.r||0.45,len=q.len===undefined?1.6:q.len,hit=q.hitT>0?q.hitT/0.25:0;
  if(len>0){c.fillStyle='#2b3035';c.fillRect(q.x-0.12,q.y,0.24,len);
    c.fillStyle='rgba(255,255,255,.12)';c.fillRect(q.x-0.12,q.y,0.05,len);
    c.fillStyle='#4a5158';rr(c,q.x-0.22,q.y+len-0.16,0.44,0.16,0.04);c.fill();}
  const y=q.y-hit*0.12;
  const g=c.createLinearGradient(q.x-r,y-r,q.x+r,y+r*0.4);
  g.addColorStop(0,'#fff0c0');g.addColorStop(0.35,'#e8c96a');g.addColorStop(1,'#6d5416');
  c.fillStyle=g;c.beginPath();c.ellipse(q.x,y,r,r*0.62,0,PI,TAU);c.closePath();c.fill();
  c.fillStyle='#8a6d2a';rr(c,q.x-r,y-0.04,r*2,0.16,0.05);c.fill();
  for(let i=0;i<4;i++)Kit.bolt(c,q.x-r*0.7+i*r*0.47,y+0.04,0.035);
  const p=0.5+0.5*Math.sin(t*3+q.x);
  c.strokeStyle=rgba('#ffe6a3',0.35+0.35*p+0.3*hit);c.lineWidth=0.05;
  c.beginPath();c.ellipse(q.x,y-r*0.25,r*1.25,r*0.5,0,PI*1.1,PI*1.9);c.stroke();
  game.renderer.glowAdd(q.x,y-0.2,0.9,'#e8c96a',0.18+0.12*p+0.4*hit);
}
/* станция пневмопочты: латунный шкаф с круглым люком под капсулу, манометр, лампа; вверх уходит
   стеклянная труба. Сеть мертва — всё тёмное, стрелка на нуле; живая — в трубе пробегают капсулы */
function drawStation(c,it,t,gs){
  const x=it.x,y=it.y,on=!!gs.flags.post_on,reg=on&&gs.flags['st_'+it.def.station];
  const tubeTop=it.def.tubeTop===undefined?y-8:it.def.tubeTop;
  c.fillStyle='rgba(150,190,210,.10)';c.fillRect(x-0.22,tubeTop,0.44,y-2.2-tubeTop);
  c.strokeStyle='rgba(200,225,235,.35)';c.lineWidth=0.05;
  c.beginPath();c.moveTo(x-0.22,tubeTop);c.lineTo(x-0.22,y-2.2);c.moveTo(x+0.22,tubeTop);c.lineTo(x+0.22,y-2.2);c.stroke();
  for(let yy=tubeTop+0.6;yy<y-2.4;yy+=1.6){c.fillStyle='#8a6d2a';c.fillRect(x-0.3,yy,0.6,0.12);}
  if(on){const k=((t*0.9+x*0.13)%1),cy=lerp(y-2.4,tubeTop,k);
    c.fillStyle='#c9a227';rr(c,x-0.15,cy-0.3,0.3,0.6,0.12);c.fill();
    c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x-0.1,cy-0.25,0.05,0.5);}
  Kit.plate(c,x-0.65,y-2.3,1.3,2.3,'steel',990+((x*7)|0),{rust:0.4,bolts:true});
  const g=c.createLinearGradient(x-0.6,0,x+0.6,0);g.addColorStop(0,'#6d5416');g.addColorStop(0.45,'#e8c96a');g.addColorStop(1,'#6d5416');
  c.fillStyle=g;c.fillRect(x-0.65,y-2.3,1.3,0.18);
  c.fillStyle='#1b1d20';c.beginPath();c.arc(x,y-1.35,0.42,0,TAU);c.fill();
  c.strokeStyle='#b08d3e';c.lineWidth=0.09;c.beginPath();c.arc(x,y-1.35,0.42,0,TAU);c.stroke();
  for(let i=0;i<6;i++){const a=i/6*TAU;Kit.bolt(c,x+Math.cos(a)*0.5,y-1.35+Math.sin(a)*0.5,0.035);}
  if(reg){const p=0.5+0.5*Math.sin(t*2.4);
    c.fillStyle=rgba('#9fe0ff',0.25+0.25*p);c.beginPath();c.arc(x,y-1.35,0.34,0,TAU);c.fill();
    game.renderer.glowAdd(x,y-1.35,1.1,'#9fe0ff',0.25+0.2*p);}
  Kit.gauge(c,x-0.36,y-0.48,0.17,on?0.7+0.05*Math.sin(t*3):0.0);
  const lc=reg?'#69d68f':on?(Math.sin(t*6)>0?'#ffcf7a':'#5a4a2a'):'#3a2a26';
  c.fillStyle=lc;c.beginPath();c.arc(x+0.36,y-0.48,0.08,0,TAU);c.fill();
  if(on)game.renderer.glowAdd(x+0.36,y-0.48,0.4,lc,0.35);
}
/* почтмейстер за конторкой Главпочтамта. look: 0 — штемпелюет письма, ±1 — повернулась к курьеру */
function drawPostmaster(c,x,dy,t,look){
  const ph=look?0:Math.max(0,Math.sin(t*1.6))*Math.max(0,Math.sin(t*1.6));
  /* спинка стула */
  c.fillStyle='#2a201a';rr(c,x+0.3,dy-2.05,0.55,2.05,0.14);c.fill();
  /* корпус: форменная тужурка */
  const tg=c.createLinearGradient(x-0.5,dy-1.6,x+0.5,dy);tg.addColorStop(0,'#33405a');tg.addColorStop(1,'#1a2130');
  c.fillStyle=tg;rr(c,x-0.5,dy-1.6,1.0,1.7,0.3);c.fill();
  for(let i=0;i<3;i++){c.fillStyle='#c9a227';c.beginPath();c.arc(x+0.05,dy-1.25+i*0.32,0.045,0,TAU);c.fill();}
  /* шаль */
  c.fillStyle='#77736a';c.beginPath();c.moveTo(x-0.58,dy-1.3);c.quadraticCurveTo(x,dy-0.62,x+0.58,dy-1.3);
  c.lineTo(x+0.5,dy-1.6);c.quadraticCurveTo(x,dy-1.12,x-0.5,dy-1.6);c.closePath();c.fill();
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=0.025;for(let i=1;i<4;i++){c.beginPath();c.moveTo(x-0.5+i*0.25,dy-1.5);c.lineTo(x-0.42+i*0.21,dy-1.0);c.stroke();}
  /* голова */
  const hx=x+look*0.06,hy=dy-1.95;
  c.fillStyle='#d2b49a';c.fillRect(hx-0.08,hy+0.18,0.16,0.18);
  c.fillStyle='#e0c4a8';c.beginPath();c.ellipse(hx,hy,0.27,0.3,0,0,TAU);c.fill();
  c.fillStyle='#bdbab2';c.beginPath();c.arc(hx-0.24,hy-0.06,0.15,0,TAU);c.fill();
  c.fillStyle='#cfccc4';c.beginPath();c.ellipse(hx,hy-0.18,0.29,0.16,0,PI,TAU);c.fill();
  /* фуражка с латунным рожком */
  c.fillStyle='#232c3c';rr(c,hx-0.3,hy-0.42,0.6,0.22,0.06);c.fill();
  c.fillStyle='#161c27';c.beginPath();c.ellipse(hx+0.12,hy-0.2,0.32,0.06,0,0,TAU);c.fill();
  c.strokeStyle='#e8c96a';c.lineWidth=0.035;c.beginPath();c.arc(hx-0.02,hy-0.31,0.07,0.2,PI*1.6);c.stroke();
  /* очки: латунь, блик смотрит туда же, куда она */
  const ex=hx+0.06+look*0.04;
  c.strokeStyle='#b08d3e';c.lineWidth=0.03;
  c.beginPath();c.arc(ex-0.1,hy+0.0,0.075,0,TAU);c.stroke();c.beginPath();c.arc(ex+0.1,hy+0.0,0.075,0,TAU);c.stroke();
  c.fillStyle='rgba(220,240,255,.55)';c.fillRect(ex-0.13+look*0.02,hy-0.04,0.03,0.03);c.fillRect(ex+0.07+look*0.02,hy-0.04,0.03,0.03);
  c.strokeStyle='#8a6a52';c.lineWidth=0.025;c.beginPath();c.moveTo(ex-0.06,hy+0.16);c.quadraticCurveTo(ex,hy+0.19,ex+0.06,hy+0.16);c.stroke();
  /* рука со штемпелем */
  const sx=x+0.32,sy=dy-1.25,hx2=x+0.78,hy2=dy-0.12-ph*0.55;
  c.strokeStyle='#2a3448';c.lineWidth=0.16;c.lineCap='round';c.beginPath();c.moveTo(sx,sy);c.lineTo(x+0.62,dy-0.55-ph*0.3);c.lineTo(hx2,hy2);c.stroke();
  c.fillStyle='#8a6d2a';rr(c,hx2-0.05,hy2-0.28,0.1,0.26,0.04);c.fill();
  c.fillStyle='#2b2620';rr(c,hx2-0.13,hy2-0.04,0.26,0.1,0.03);c.fill();
  c.strokeStyle='#2a3448';c.beginPath();c.moveTo(x-0.32,dy-1.2);c.lineTo(x-0.5,dy-0.4);c.lineTo(x-0.2,dy-0.1);c.stroke();
  /* конторка */
  const g=c.createLinearGradient(0,dy,0,dy+1.2);g.addColorStop(0,'#5a4030');g.addColorStop(1,'#2e2018');
  c.fillStyle=g;c.fillRect(x-1.5,dy,3.4,1.2);
  c.fillStyle='#8a6d2a';c.fillRect(x-1.55,dy-0.06,3.5,0.1);
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=0.04;c.strokeRect(x-1.3,dy+0.22,1.3,0.8);c.strokeRect(x+0.2,dy+0.22,1.5,0.8);
  /* письма и штемпельная подушка */
  for(let i=0;i<4;i++){c.fillStyle=i%2?'#d8cdb8':'#c9b48a';c.fillRect(x+1.0,dy-0.1-i*0.05,0.6,0.05);}
  c.fillStyle='#d8cdb8';c.fillRect(x+0.62,dy-0.06,0.42,0.06);
  if(ph>0.95){c.fillStyle='rgba(200,69,47,.8)';c.fillRect(x+0.72,dy-0.07,0.14,0.03);}
  /* лампа с зелёным абажуром */
  c.strokeStyle='#3a3630';c.lineWidth=0.05;c.beginPath();c.moveTo(x-1.1,dy-0.05);c.lineTo(x-1.1,dy-0.75);c.lineTo(x-0.8,dy-0.95);c.stroke();
  c.fillStyle='#2f6b44';c.beginPath();c.moveTo(x-1.05,dy-0.95);c.lineTo(x-0.55,dy-0.95);c.lineTo(x-0.65,dy-1.15);c.lineTo(x-0.95,dy-1.15);c.closePath();c.fill();
  c.fillStyle='rgba(255,236,170,.9)';c.fillRect(x-0.98,dy-0.96,0.36,0.04);
  game.renderer.glowAdd(x-0.8,dy-0.85,1.1,'#ffe6a3',0.35);
}
function drawAnchor(c,a,t,has,aim){
  const x=a.x,y=a.y,m=a.mount||'top';
  c.strokeStyle='#2b2620';c.lineWidth=0.1;c.beginPath();
  if(m==='top'){c.moveTo(x,y-0.36);c.lineTo(x,y-(a.len||0.9));}
  else if(m==='left'){c.moveTo(x-0.34,y);c.lineTo(x-(a.len||0.8),y);}
  else if(m==='right'){c.moveTo(x+0.34,y);c.lineTo(x+(a.len||0.8),y);}
  c.stroke();
  if(m==='top'){c.fillStyle='#3a332b';c.fillRect(x-0.22,y-(a.len||0.9)-0.08,0.44,0.14);}
  const p=0.5+0.5*Math.sin(t*4+x);
  c.strokeStyle=has?'#e8c96a':'#a8842a';c.lineWidth=0.1;c.beginPath();c.arc(x,y,0.3,0,TAU);c.stroke();
  c.strokeStyle='rgba(255,246,214,.7)';c.lineWidth=0.03;c.beginPath();c.arc(x,y,0.3,PI*1.1,PI*1.7);c.stroke();
  if(aim){c.save();c.globalCompositeOperation='lighter';
    c.strokeStyle=rgba('#ffe6a3',0.55+0.4*p);c.lineWidth=0.05;
    const R2=0.62+0.1*p;for(let i=0;i<4;i++){const a0=i*PI/2+t*1.5;c.beginPath();c.arc(x,y,R2,a0,a0+0.7);c.stroke();}
    c.restore();game.renderer.glowAdd(x,y,1.3,'#ffe6a3',0.45+0.25*p);}
  else game.renderer.glowAdd(x,y,0.6,'#e8c96a',has?0.18:0.08);
}
function drawLightShafts(c,R,t){
  if(R.zone!=='eden'&&R.zone!=='sump')return;
  c.save();c.globalCompositeOperation='lighter';
  const n=R.zone==='eden'?5:3;
  for(let i=0;i<n;i++){
    const x=(R.w/(n+1))*(i+1)+Math.sin(t*0.13+i)*1.4;
    const w0=R.zone==='eden'?3.4:1.8;
    const g=c.createLinearGradient(x,0,x+w0*0.6,R.h);
    const col=R.zone==='eden'?'255,246,214':'255,196,120';
    g.addColorStop(0,'rgba('+col+','+(R.zone==='eden'?0.13:0.07)+')');
    g.addColorStop(1,'rgba('+col+',0)');
    c.fillStyle=g;
    c.beginPath();c.moveTo(x-w0*0.4,0);c.lineTo(x+w0*0.4,0);
    c.lineTo(x+w0*1.5,R.h);c.lineTo(x-w0*0.6,R.h);c.closePath();c.fill();
  }
  c.restore();
}
