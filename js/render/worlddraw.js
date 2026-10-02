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
    if(h.kind==='coolant'){
      const yy=h.y+Math.sin(t*1.2)*0.06;
      const g=c.createLinearGradient(0,yy,0,h.y+h.h);
      g.addColorStop(0,'rgba(120,240,170,.55)');g.addColorStop(.3,'rgba(40,140,90,.75)');g.addColorStop(1,'rgba(10,50,30,.9)');
      c.fillStyle=g;c.fillRect(h.x,yy,h.w,h.h);
      c.fillStyle='rgba(200,255,220,.35)';
      for(let k=0;k<8;k++){const x=h.x+((k*2.1+t*0.6)%h.w);c.fillRect(x,yy+Math.sin(t*2+k)*0.04,0.7,0.05);}
      game.renderer.glowAdd(h.x+h.w/2,yy+0.4,h.w*0.55,'#69d68f',0.55);
    }else if(h.kind==='pit'){
      const g=c.createLinearGradient(0,h.y-3,0,h.y+h.h);
      g.addColorStop(0,'rgba(4,6,8,0)');g.addColorStop(1,'rgba(2,3,4,.98)');
      c.fillStyle=g;c.fillRect(h.x,h.y-3,h.w,h.h+3);
    }
  }
  if(R.checkpoint){
    const cp=R.checkpoint;cp.lit=cp.lit||(gs.cp.room===R.id);
    Kit.checkpointPost(c,cp.x,cp.y,cp.h,cp.lit);
    if(cp.lit)game.renderer.glowAdd(cp.x,cp.y-cp.h*0.55,1.5,'#ffcf7a',0.55+0.08*Math.sin(t*2));
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
    g2.addColorStop(0,'rgba(190,204,110,0)');g2.addColorStop(0.3,'rgba(190,204,110,.2)');g2.addColorStop(1,'rgba(160,178,80,.3)');
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
