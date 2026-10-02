"use strict";
/* ============================== КУРЬЕР: СКЕЛЕТ, ПОЗЫ, РИСУНОК ==============================
   Скелет: таз → корпус (крен вокруг таза) → плечи и голова; ноги и руки — двухзвенный IK к целям.
   Поза задаётся целями (ступни, кисти), креном и углом ключа. Переходы между позами сглаживаются;
   замах и удар ставятся напрямую — отклик в том же кадре, без задержки.
   Принципы: предвосхищение (ключ уходит назад-вверх до удара), смазанный кадр (дуга удара —
   в drawSlash), доводка (ключ проходит дальше точки удара), отдача (корпус откатывается),
   вес (тяжёлый ключ волочится на бегу и тянет руку вниз), вторичное движение (полы куртки, шарф).
   Ранец — манометр: шкала давления = энергия, пар на рывке/импульсе/заряде. */
const HERO={thigh:0.42,shin:0.41,uarm:0.3,farm:0.29,torso:0.56};
const HeroArt={
  /* ---------- цель позы по состоянию ---------- */
  target(p,t){
    const C=CFG.player,st=p.state,sp=Math.abs(p.vx),ph=p.runPh||0,air=!p.onGround&&!p.onCeil;
    const br=Math.sin(t*2.4)*0.012;
    const T={hx:0,hy:-0.8+br,lean:0.04,head:0,coat:0,ft:[[-0.11,0],[0.13,0]],hf:[0.3,-0.9],hb:[-0.06,-0.93],wa:1.15,
      direct:false,feetDirect:false,backFront:false};
    /* стоя долго — ключ на плечо */
    if(st==='idle'&&(p.idleT||0)>3.5){T.hf=[0.13,-1.3];T.wa=-2.45;T.hb=[-0.04,-0.95];}
    if(p.onGround&&sp>0.6&&!p.crouch&&p.dashT<=0){
      const k=clamp(sp/C.maxRun,0,1),s=0.2+0.22*k;
      for(let i=0;i<2;i++){const a=ph+(i?0:PI),stance=Math.sin(a)>0;
        T.ft[i]=[Math.cos(a)*s+0.03,stance?0:Math.sin(a)*(0.08+0.17*k)];}
      T.feetDirect=true;
      T.hy=-0.79-0.035*Math.cos(2*ph)*k;T.lean=0.06+0.13*k;
      /* на бегу ключ — на плече: силуэт чистый, замах из этой позы мгновенный */
      T.hf=[lerp(0.24,0.14,k),lerp(-0.98,-1.3,k)+Math.abs(Math.sin(ph))*0.025*k];T.wa=lerp(1.15,-2.45,clamp(k*1.6,0,1));
      T.hb=[-0.04-Math.cos(ph)*0.24*k,-0.96+Math.abs(Math.cos(ph))*0.04];T.coat=-0.3*k;
    }
    if(air&&p.dashT<=0){
      const k=clamp(Math.abs(p.vy)/18,0,1);
      if(p.vy<0){T.ft=[[-0.16,-0.06],[0.17,-0.3]];T.lean=0.08;T.hf=[0.3,-1.14];T.wa=0.15;T.hb=[-0.22,-1.0];T.coat=-0.15;}
      else{T.ft=[[-0.1,-0.04],[0.15,-0.14]];T.lean=-0.03;T.hf=[0.3,-1.28];T.wa=-0.55;T.hb=[-0.3,-1.24];T.coat=0.35*k;}
      T.hy=-0.8;
    }
    if(p.crouch){
      if(p.slideT>0){T.hy=-0.36;T.lean=-0.5;T.ft=[[0.02,-0.02],[0.62,-0.07]];T.hf=[-0.16,-0.66];T.wa=-2.75;T.hb=[0.06,-0.32];T.coat=-0.45;T.head=0.25;}
      else{T.hy=-0.42;T.lean=0.5;T.ft=[[-0.22,0],[0.24,0]];T.hf=[0.42,-0.42];T.wa=1.4;T.hb=[0.18,-0.5];T.head=-0.3;}
    }
    if(p.dashT>0){T.hy=-0.8;T.lean=0.46;T.ft=[[-0.56,-0.24],[0.18,-0.36]];T.hf=[-0.12,-0.98];T.wa=2.8;T.hb=[-0.34,-1.02];T.coat=-0.7;T.head=-0.3;}
    if(p.gripDir!==0&&air&&p.dashT<=0){
      if(p.gripDir===p.face){T.lean=0.1;T.hb=[0.3,-1.52];T.hf=[0.2,-1.08];T.wa=-1.25;T.ft=[[0.2,-0.2],[0.3,-0.52]];}
      else{T.lean=-0.12;T.hb=[-0.34,-1.46];T.ft=[[-0.3,-0.22],[-0.2,-0.5]];T.hf=[0.28,-1.0];T.wa=0.6;}
    }
    if(p.healT>0||p.restT>0){T.hy=-0.5;T.lean=0.16;T.ft=[[-0.46,-0.02],[0.22,0]];T.hf=[0.22,-0.95];T.wa=0.3;T.hb=[0.16,-0.9];T.head=0.1;}
    /* тяжёлый удар: набор давления — ключ уходит за спину, корпус сжимается; полный заряд — дрожь */
    const sd=p.slashT>0,A=p.atkPhase;
    if(p.chargeT>0.12&&!sd&&A!=='wind'){
      const k=clamp((p.chargeT-0.12)/(C.heavyHold-0.12),0,1),sh=p.charged?Math.sin(t*70)*0.018:0;
      T.hf=[lerp(0.2,-0.2,k),lerp(-1.0,-1.36,k)+sh];T.wa=lerp(0.9,-2.9,EZ.out(k));T.lean=lerp(0.04,-0.17,k);
      T.hy=lerp(-0.8,-0.7,k);T.ft=[[-0.26,0],[0.26,0]];T.feetDirect=false;
    }
    /* удар ключом: замах → удар (смаз) → доводка */
    if(A==='wind'){
      const heavy=p.atkHeavy,dir=p.atkDir,k=clamp(1-p.atkPT/(heavy?C.heavyWind:C.atkWind),0,1),e=EZ.out(k);T.direct=true;
      if(dir==='side'){T.hf=[lerp(0.18,-0.1,e),lerp(-1.05,-1.46,e)];T.wa=lerp(0.4,heavy?-2.8:-2.3,e);T.lean=lerp(0.04,heavy?-0.18:-0.12,e);T.hy-=0.04*e;}
      else if(dir==='up'){T.hf=[0.16,-0.8];T.wa=2.45;T.lean=0.14;T.hy-=0.06*e;}
      else{T.hf=[0.1,-1.46];T.wa=-1.95;T.lean=-0.06;T.ft=[[-0.1,-0.26],[0.16,-0.36]];}
    }else if(sd){
      const heavy=p.slashHeavy,dir=p.slashDir,T0=C.slashT*(heavy?1.5:1),u=clamp(1-p.slashT/T0,0,1),e=EZ.out(clamp(u*2.4,0,1));T.direct=true;
      const ft=clamp((u-0.42)/0.58,0,1);   /* доводка после удара */
      if(dir==='side'){T.hf=[lerp(0.05,0.56,e),lerp(-1.44,-0.98,e)+ft*0.06];T.wa=lerp(heavy?-2.7:-2.2,heavy?0.8:0.55,e)+ft*0.3;
        T.lean=lerp(-0.1,heavy?0.32:0.2,e);T.ft[1]=[T.ft[1][0]+(heavy?0.34:0.16),T.ft[1][1]];T.ft[0]=[T.ft[0][0]-0.08,T.ft[0][1]];T.coat=-0.2*e;}
      else if(dir==='up'){T.hf=[lerp(0.2,0.1,e),lerp(-0.84,-1.64,e)];T.wa=lerp(2.45,-1.85,e)-ft*0.25;T.lean=lerp(0.12,-0.1,e);}
      else{T.hf=[lerp(0.12,0.24,e),lerp(-1.44,-0.6,e)];T.wa=lerp(-1.95,1.75,e)+ft*0.15;T.lean=lerp(-0.06,0.26,e);T.ft=[[-0.1,-0.3],[0.16,-0.42]];}
    }
    /* импульс: дальняя рука с резаком выбрасывается вперёд, корпус отдаёт назад */
    if(p.pulseT>0){const k=clamp(p.pulseT/0.28,0,1);T.hb=[0.56,-1.18];T.lean-=0.12*k;T.hf=[T.hf[0]-0.12,T.hf[1]];T.backFront=true;}
    /* урон: отлёт — корпус откинут, руки врозь, голова назад */
    if(p.hurtT>0||p.dead){const k=p.dead?1:clamp(p.hurtT/0.34,0,1);
      T.lean=lerp(T.lean,-0.5,k);T.head=-0.35*k;T.hf=[0.42,-1.4];T.hb=[-0.44,-1.3];T.wa=-0.9;T.ft=[[-0.28,-0.14],[0.26,-0.05]];T.hy=-0.78;T.direct=k>0.8;
      if(p.dead&&p.deadT>0.25){T.lean=-1.35;T.hy=-0.24;T.ft=[[-0.5,-0.02],[0.52,-0.02]];T.hf=[-0.6,-0.4];T.hb=[-0.9,-0.12];T.head=0.2;}}
    return T;
  },
  /* ---------- сглаживание к цели ---------- */
  pose(p,t){
    /* время курьера, не рендера: в стоп-кадре (hitstop) поза замирает вместе с миром */
    const tt=p.t,T=this.target(p,tt),dt=clamp(tt-(p._pt===undefined?tt:p._pt),0,0.05);p._pt=tt;
    let P=p._pose;
    if(!P){P=p._pose={hx:T.hx,hy:T.hy,lean:T.lean,head:T.head,coat:T.coat,wa:T.wa,ft:T.ft.map(f=>f.slice()),hf:T.hf.slice(),hb:T.hb.slice(),backFront:false};}
    const r=T.direct?1:1-Math.exp(-16*dt),rf=T.feetDirect||T.direct?1:1-Math.exp(-26*dt),rb=1-Math.exp(-20*dt);
    const L=(a,b,k)=>a+(b-a)*k;
    P.hx=L(P.hx,T.hx,r);P.hy=L(P.hy,T.hy,r);P.lean=L(P.lean,T.lean,r);P.head=L(P.head,T.head,rb);P.coat=L(P.coat,T.coat,1-Math.exp(-7*dt));
    for(let i=0;i<2;i++){P.ft[i][0]=L(P.ft[i][0],T.ft[i][0],rf);P.ft[i][1]=L(P.ft[i][1],T.ft[i][1],rf);}
    P.hf[0]=L(P.hf[0],T.hf[0],r);P.hf[1]=L(P.hf[1],T.hf[1],r);
    P.hb[0]=L(P.hb[0],T.hb[0],T.backFront?1:rb);P.hb[1]=L(P.hb[1],T.hb[1],T.backFront?1:rb);
    P.wa=T.direct?T.wa:P.wa+angDiff(P.wa,T.wa)*r;P.backFront=T.backFront;
    /* суставы */
    const ck=clamp((CFG.player.h-p.h)/(CFG.player.h-CFG.player.crouchH),0,1),tl=HERO.torso*(1-0.25*ck);
    const R=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
    const hip={x:P.hx,y:P.hy},lean=P.lean,ad=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
    const chest=ad(hip,R(0,-tl,lean));
    const J=P.j={tl,hip,chest,
      shF:ad(chest,R(0.05,0.06,lean)),shB:ad(chest,R(-0.08,0.05,lean)),
      neck:ad(chest,R(0.02,-0.03,lean))};
    J.headA=lean*0.45+P.head;J.head=ad(J.neck,R(0.03,-0.17,J.headA));
    J.hipF={x:hip.x+0.05,y:hip.y};J.hipB={x:hip.x-0.05,y:hip.y};
    J.legF=ik2(J.hipF.x,J.hipF.y,P.ft[1][0],P.ft[1][1],HERO.thigh,HERO.shin,-1);
    J.legB=ik2(J.hipB.x,J.hipB.y,P.ft[0][0],P.ft[0][1],HERO.thigh,HERO.shin,-1);
    J.armF=ik2(J.shF.x,J.shF.y,P.hf[0],P.hf[1],HERO.uarm,HERO.farm,1);
    J.armB=ik2(J.shB.x,J.shB.y,P.hb[0],P.hb[1],HERO.uarm,HERO.farm,1);
    /* голова ключа и сопло ранца — для эффектов в мировых координатах */
    J.wHead={x:J.armF.fx+Math.cos(P.wa)*0.62,y:J.armF.fy+Math.sin(P.wa)*0.62};
    J.nozzle=ad(hip,R(-0.44,-tl*0.12,lean));
    J.gaunt={x:J.armB.fx,y:J.armB.fy,a:Math.atan2(J.armB.fy-J.armB.ky,J.armB.fx-J.armB.kx)};
    return P;
  },
  /* локальная точка → мир (с учётом взгляда и потолка) */
  toWorld(p,q){return p.onCeil?{x:p.cx+p.face*q.x,y:p.y-q.y}:{x:p.cx+p.face*q.x,y:p.bottom+q.y};},
  /* ---------- рисунок ---------- */
  draw(c,p,t){
    const P=this.pose(p,t),J=P.j,gs=p.world.game.gs;
    c.lineCap='round';c.lineJoin='round';
    if(!P.backFront)this.armB(c,J,p,gs,t,false);
    this.leg(c,J.hipB,J.legB,true,gs);
    c.save();c.translate(J.hip.x,J.hip.y);c.rotate(P.lean);
    this.pack(c,J.tl,p,gs,t);
    this.torso(c,J.tl,P,p,gs,t);
    c.restore();
    this.leg(c,J.hipF,J.legF,false,gs);
    c.save();c.translate(J.hip.x,J.hip.y);c.rotate(P.lean);this.coatFront(c,J.tl,P);c.restore();
    this.head(c,J,p,gs,t);
    if(P.backFront)this.armB(c,J,p,gs,t,true);
    this.armF(c,J,P,p,gs,t);
    /* мировые точки для эффектов (следующий кадр) */
    p._neck=this.toWorld(p,J.neck);p._wHead=this.toWorld(p,J.wHead);p._nozzle=this.toWorld(p,J.nozzle);
    const g=this.toWorld(p,{x:J.gaunt.x,y:J.gaunt.y});p._gaunt={x:g.x,y:g.y,a:J.gaunt.a};
  },
  leg(c,h,L,far,gs){
    c.strokeStyle=far?'#1d1a17':'#2f2b28';c.lineWidth=0.16;
    c.beginPath();c.moveTo(h.x,h.y);c.lineTo(L.kx,L.ky);c.lineTo(L.fx,L.fy-0.06);c.stroke();
    if(!far){c.strokeStyle='rgba(255,230,190,.08)';c.lineWidth=0.05;c.beginPath();c.moveTo(h.x+0.03,h.y);c.lineTo(L.kx+0.03,L.ky);c.stroke();}
    c.fillStyle=far?'#2a231b':'#4a3d2e';c.beginPath();c.arc(L.kx,L.ky,0.07,0,TAU);c.fill();
    /* ботинок: тяжёлый, латунный носок */
    const ang=clamp(Math.atan2(L.fy-L.ky,L.fx-L.kx)-PI/2,-0.5,0.6)*0.6;
    c.save();c.translate(L.fx,L.fy);c.rotate(ang);
    c.fillStyle=far?'#100f0e':'#1c1a18';rr(c,-0.09,-0.13,0.26,0.13,0.05);c.fill();
    c.fillStyle=far?'#4a3b20':'#8a6d3b';rr(c,0.1,-0.11,0.07,0.1,0.03);c.fill();
    if(gs.has('claws')){c.strokeStyle=far?'#8a6d2a':'#e8c96a';c.lineWidth=0.03;
      for(const o of [0,0.06]){c.beginPath();c.moveTo(0.14+o*0.3,-0.01);c.lineTo(0.22+o,0.03);c.stroke();}}
    c.restore();
  },
  /* ранец: брезентовый мешок на раме; с клапаном — латунный баллон с манометром и соплом */
  pack(c,tl,p,gs,t){
    const y0=-tl+0.02;
    c.fillStyle='#2f2b26';rr(c,-0.46,y0+0.04,0.3,tl*0.74,0.09);c.fill();
    c.fillStyle='#3d3831';rr(c,-0.44,y0+0.08,0.26,tl*0.3,0.06);c.fill();
    c.strokeStyle='#1d1a16';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.44,y0+0.38);c.lineTo(-0.18,y0+0.38);c.stroke();
    if(gs.has('dash')){
      const x=-0.58,w=0.22,y=y0+0.06,h=tl*0.66;
      const bg=c.createLinearGradient(x,0,x+w,0);bg.addColorStop(0,'#6d5416');bg.addColorStop(0.3,'#fff2c6');bg.addColorStop(0.45,'#e8c96a');bg.addColorStop(1,'#6d5416');
      c.fillStyle=bg;rr(c,x,y,w,h,0.1);c.fill();c.strokeStyle='#2e2208';c.lineWidth=0.02;c.stroke();
      c.fillStyle='#8a6d2a';c.fillRect(x,y+h*0.22,w,0.03);c.fillRect(x,y+h*0.78,w,0.03);
      /* манометр: столб давления = энергия; мало — мигает красным */
      const e=clamp(p.energy/p.maxEnergy(),0,1),low=p.energy<CFG.player.pulseCost,gx=x+0.07,gy=y+h*0.3,gh=h*0.42;
      c.fillStyle='#0d0f10';rr(c,gx,gy,0.08,gh,0.03);c.fill();
      c.fillStyle=low?(Math.sin(t*14)>0?'#ff5a3a':'#7a2a1c'):(e>=0.999?'#dff4ff':'#7fd0ff');
      c.fillRect(gx+0.015,gy+gh*(1-e)+0.01,0.05,Math.max(0,gh*e-0.02));
      /* вентиль и сопло (рывок бьёт отсюда) */
      c.fillStyle='#c8452f';c.beginPath();c.arc(x+w*0.5,y-0.03,0.05,0,TAU);c.fill();
      c.fillStyle='#3a3630';rr(c,x-0.04,y+h-0.12,0.1,0.1,0.03);c.fill();
    }
    if(gs.has('filter')){c.fillStyle='#5c646b';rr(c,-0.36,y0-0.06,0.16,0.22,0.06);c.fill();
      c.fillStyle='#8a9299';c.fillRect(-0.34,y0-0.02,0.12,0.03);}
  },
  /* куртка: корпус, ремень, лямки; полы — сзади (развеваются) */
  torso(c,tl,P,p,gs,t){
    const sw=P.coat;
    c.fillStyle='#241d15';c.beginPath();c.moveTo(-0.24,-0.06);c.lineTo(0.18,-0.06);c.lineTo(0.12+sw*0.08,0.34);
    c.quadraticCurveTo(-0.1+sw*0.2,0.4,-0.3+sw*0.42,0.36+sw*0.05);c.closePath();c.fill();
    const jg=c.createLinearGradient(-0.25,-tl,0.25,0);jg.addColorStop(0,'#5d4c3a');jg.addColorStop(0.5,'#45382a');jg.addColorStop(1,'#2c241a');
    c.fillStyle=jg;rr(c,-0.25,-tl,0.48,tl+0.06,0.13);c.fill();
    c.save();rr(c,-0.25,-tl,0.48,tl+0.06,0.13);c.clip();c.fillStyle=PAT(c,'ply');c.globalAlpha=0.14;c.fillRect(-0.3,-tl-0.1,0.6,tl+0.3);c.globalAlpha=1;
    c.fillStyle='rgba(255,230,190,.08)';c.fillRect(-0.25,-tl,0.48,0.05);
    c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=0.025;c.beginPath();c.moveTo(0.08,-tl+0.06);c.lineTo(0.06,0);c.stroke();c.restore();
    /* лямка ранца через грудь */
    c.strokeStyle='#2a2520';c.lineWidth=0.06;c.beginPath();c.moveTo(-0.2,-tl+0.04);c.quadraticCurveTo(0.12,-tl*0.55,0.0,-0.08);c.stroke();
    c.fillStyle='#8a6d3b';c.fillRect(0.06,-tl*0.5,0.05,0.06);
    /* ремень, пряжка, подсумок */
    c.fillStyle='#2b2318';c.fillRect(-0.26,-0.12,0.5,0.1);
    c.fillStyle='#c9a227';rr(c,0.04,-0.125,0.09,0.11,0.02);c.fill();c.fillStyle='#2b2318';c.fillRect(0.065,-0.1,0.04,0.06);
    c.fillStyle='#5a4a33';rr(c,-0.3,-0.16,0.14,0.2,0.04);c.fill();
    /* воротник */
    c.fillStyle='#3a2f23';c.beginPath();c.ellipse(0.0,-tl+0.02,0.16,0.07,0,0,TAU);c.fill();
  },
  /* передняя пола поверх передней ноги */
  coatFront(c,tl,P){
    const sw=P.coat;
    c.fillStyle='#3a2f23';c.beginPath();c.moveTo(0.02,-0.04);c.lineTo(0.23,-0.04);c.lineTo(0.2+sw*0.05,0.24);c.lineTo(0.0+sw*0.12,0.27);c.closePath();c.fill();
    c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=0.02;c.stroke();
  },
  head(c,J,p,gs,t){
    c.save();c.translate(J.head.x,J.head.y);c.rotate(J.headA);
    /* шлем: кожаный купол, латунный обод, фонарь-визор */
    c.fillStyle='#3a332a';c.beginPath();c.ellipse(0,0.02,0.19,0.18,0,0,TAU);c.fill();
    c.fillStyle='#4d453a';c.beginPath();c.arc(0,-0.01,0.19,PI,0);c.fill();
    c.fillStyle='rgba(255,230,190,.12)';c.beginPath();c.ellipse(-0.05,-0.12,0.08,0.04,-0.3,0,TAU);c.fill();
    c.fillStyle='#8a6d3b';c.fillRect(-0.19,-0.02,0.38,0.04);
    if(gs.has('filter')){c.fillStyle='#5c646b';rr(c,0.06,0.02,0.2,0.15,0.06);c.fill();
      c.fillStyle='#22262a';c.beginPath();c.arc(0.24,0.1,0.05,0,TAU);c.fill();}
    const lit=p.dead?0.2:1;
    const eg=c.createRadialGradient(0.13,0.02,0,0.13,0.02,0.13);
    eg.addColorStop(0,rgba('#ffecb4',lit));eg.addColorStop(0.45,rgba('#ffbe63',0.85*lit));eg.addColorStop(1,'rgba(255,150,60,0)');
    c.fillStyle=eg;c.beginPath();c.arc(0.13,0.02,0.13,0,TAU);c.fill();
    c.fillStyle=rgba('#ffdf9a',lit);c.beginPath();c.ellipse(0.13,0.02,0.075,0.05,0,0,TAU);c.fill();
    c.fillStyle='#2b2620';c.beginPath();c.moveTo(-0.03,-0.08);c.lineTo(0.26,-0.05);c.lineTo(0.24,-0.01);c.lineTo(-0.03,-0.03);c.fill();
    /* антенна с огоньком */
    c.strokeStyle='#7a8087';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.14,-0.12);c.lineTo(-0.25,-0.38);c.stroke();
    c.fillStyle=rgba('#c8452f',0.6+0.4*Math.sin(t*4));c.beginPath();c.arc(-0.25,-0.4,0.035,0,TAU);c.fill();
    c.restore();
  },
  /* дальняя рука: перчатка; с импульсом — резак-наруч с латунным соплом */
  armB(c,J,p,gs,t,front){
    const L=J.armB,sh=J.shB;
    c.strokeStyle=front?'#45382a':'#2a221a';c.lineWidth=0.12;
    c.beginPath();c.moveTo(sh.x,sh.y);c.lineTo(L.kx,L.ky);c.lineTo(L.fx,L.fy);c.stroke();
    if(gs.has('pulse')){const a=Math.atan2(L.fy-L.ky,L.fx-L.kx);
      c.save();c.translate(L.kx,L.ky);c.rotate(a);
      c.fillStyle=front?'#3a4046':'#262a2e';rr(c,0.04,-0.075,0.26,0.15,0.05);c.fill();
      c.fillStyle=front?'#c9a227':'#6d5416';rr(c,0.26,-0.09,0.1,0.18,0.03);c.fill();
      c.fillStyle='#16191c';c.beginPath();c.arc(0.36,0,0.045,0,TAU);c.fill();
      c.restore();}
    c.fillStyle=front?'#4a3d2e':'#2a231b';c.beginPath();c.arc(L.fx,L.fy,0.065,0,TAU);c.fill();
  },
  /* ближняя рука с ключом. Ключ рисуется до перчатки — кисть сжимает рукоять */
  armF(c,J,P,p,gs,t){
    const L=J.armF,sh=J.shF;
    this.wrench(c,L.fx,L.fy,P.wa,p,t);
    c.strokeStyle='#45382a';c.lineWidth=0.13;c.beginPath();c.moveTo(sh.x,sh.y);c.lineTo(L.kx,L.ky);c.lineTo(L.fx,L.fy);c.stroke();
    c.strokeStyle='rgba(255,230,190,.1)';c.lineWidth=0.04;c.beginPath();c.moveTo(sh.x,sh.y-0.03);c.lineTo(L.kx,L.ky-0.03);c.stroke();
    c.fillStyle='#4a3d2e';c.beginPath();c.arc(L.fx,L.fy,0.07,0,TAU);c.fill();
    c.fillStyle='#5d4c3a';c.beginPath();c.arc(L.fx-0.02,L.fy-0.02,0.035,0,TAU);c.fill();
  },
  /* разводной ключ: рукоять (сталь, латунная обмотка), червяк, тяжёлые губки */
  wrench(c,x,y,a,p,t){
    c.save();c.translate(x,y);c.rotate(a);
    c.fillStyle='#22272b';rr(c,-0.16,-0.045,0.66,0.09,0.035);c.fill();
    c.fillStyle='#7d868d';c.fillRect(-0.14,-0.045,0.6,0.022);
    c.fillStyle='#6d5416';rr(c,-0.13,-0.055,0.19,0.11,0.035);c.fill();
    c.strokeStyle='#3a2c0b';c.lineWidth=0.012;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-0.11+i*0.035,-0.055);c.lineTo(-0.1+i*0.035,0.055);c.stroke();}
    /* червяк регулировки */
    c.fillStyle='#b08d3e';rr(c,0.36,-0.06,0.1,0.12,0.025);c.fill();
    c.strokeStyle='#5c4510';c.lineWidth=0.012;for(let i=0;i<4;i++){c.beginPath();c.moveTo(0.375+i*0.022,-0.06);c.lineTo(0.375+i*0.022,0.06);c.stroke();}
    /* голова: неподвижная губка (большая) + подвижная, зев вперёд */
    c.fillStyle='#3d444a';c.beginPath();c.moveTo(0.44,-0.09);c.lineTo(0.66,-0.14);c.quadraticCurveTo(0.76,-0.12,0.76,-0.04);
    c.lineTo(0.62,-0.03);c.lineTo(0.62,0.03);c.lineTo(0.75,0.05);c.quadraticCurveTo(0.76,0.14,0.66,0.15);c.lineTo(0.44,0.1);c.closePath();c.fill();
    c.strokeStyle='#14171a';c.lineWidth=0.02;c.stroke();
    c.fillStyle='#9aa3aa';c.beginPath();c.moveTo(0.46,-0.085);c.lineTo(0.66,-0.13);c.lineTo(0.68,-0.105);c.lineTo(0.47,-0.06);c.closePath();c.fill();
    c.restore();
  },
  /* ---------- силуэт для следа рывка и идеального уклонения ---------- */
  silhouette(c,G,col,a){
    const J=G.j;if(!J)return;
    c.save();c.translate(G.x,G.y);if(G.ceil)c.scale(1,-1);if(G.face<0)c.scale(-1,1);
    c.globalAlpha=a;c.strokeStyle=col;c.fillStyle=col;c.lineCap='round';c.lineJoin='round';
    c.lineWidth=0.15;for(const [h,L] of [[J.hipB,J.legB],[J.hipF,J.legF]]){c.beginPath();c.moveTo(h.x,h.y);c.lineTo(L.kx,L.ky);c.lineTo(L.fx,L.fy);c.stroke();}
    c.save();c.translate(J.hip.x,J.hip.y);c.rotate(G.lean);rr(c,-0.25,-J.tl,0.48,J.tl+0.06,0.13);c.fill();rr(c,-0.5,-J.tl+0.06,0.32,J.tl*0.74,0.09);c.fill();c.restore();
    c.beginPath();c.arc(J.head.x,J.head.y,0.19,0,TAU);c.fill();
    c.lineWidth=0.12;c.beginPath();c.moveTo(J.shF.x,J.shF.y);c.lineTo(J.armF.kx,J.armF.ky);c.lineTo(J.armF.fx,J.armF.fy);c.stroke();
    c.lineWidth=0.09;c.beginPath();c.moveTo(J.armF.fx,J.armF.fy);c.lineTo(J.wHead.x,J.wHead.y);c.stroke();
    c.restore();
  },
  /* снимок позы для призрака */
  snap(p){const P=p._pose;if(!P||!P.j)return null;return {x:p.cx,y:p.onCeil?p.y:p.bottom,ceil:p.onCeil,face:p.face,lean:P.lean,j:P.j};}
};
