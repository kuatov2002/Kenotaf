"use strict";
/* ============================== ВАРИАЦИИ И НОВЫЙ КЛАСС ==============================
   По три новых противника на зону: тот же механизм-основа, но другая работа — и это видно
   (своя деталь на корпусе и окраска) и чувствуется (свой приём поверх базовых атак).
   Приём (addon) — честный, как всё в бою: замах с телеграфом на узле; янтарный — срывается импульсом,
   красный — только рывок. Пассивные приёмы (парирование, рой) меняют то, как к механизму подходить.
     I  ОТСТОЙНИК  клепальщик (заклёпки — импульс отбивает обратно) · мокрица-каток (сворачивается и катится,
                   красный; в стену — оглушена) · лампада-вестовая (поднимает тревогу, будит зал)
     II СОТЫ       штемпелёр (выжигает «ИЗЪЯТО» под ногами) · дуэлянт (парирует удары в лоб — заходи
                   сзади, срывай или ломай разрывом) · люстра (висит под сводом, падает на того, кто внизу)
     III ЭДЕМ      опрыскиватель (облако гербицида — сдуть импульсом) · трутни (мелкие и быстрые, парой) ·
                   корневик (уходит в землю и выныривает под курьером)
     IV ПЕЧАТЬ     звонарь (кольцо звона, красный — рывок сквозь) · шестерёнщик (катит шестерню — отбить) ·
                   маятник (широкий рубящий взмах маятником, срывается)
     V АРХИВ       писарь (пресс-папье по дуге — отбивается в него же) · хранитель каталога (парирует) ·
                   свечник (жжёт метку на полу)
   Новый класс — ПОЧТОВИК: одноколёсный разносчик; держит дистанцию, швыряет капсулы, удирает.
   Мини-боссы зон — элиты с ареной (двери запираются, полоса, табличка, два приёма и ярость на половине). */
const VARIANTS={
  riveter:{base:'repairer',name:'КЛЕПАЛЬЩИК',tint:'#4a6a8a',addons:['rivet'],prop:'gun'},
  roller:{base:'mokrica',name:'МОКРИЦА-КАТОК',tint:'#4a5a3a',addons:['roll'],prop:'plates'},
  herald:{base:'lampada',name:'ЛАМПАДА-ВЕСТОВАЯ',tint:'#c8a040',addons:['call'],prop:'beacon'},
  stamper:{base:'censor',name:'ШТЕМПЕЛЁР',tint:'#8a2a24',addons:['brand'],prop:'stamp'},
  duelist:{base:'aristocrat',name:'ДУЭЛЯНТ',tint:'#5a3a6a',addons:['parry'],prop:'buckler'},
  chandelier:{base:'lampada',name:'ЛЮСТРА',tint:'#b8902a',addons:['drop'],prop:'chain'},
  sprayer:{base:'gardener',name:'ОПРЫСКИВАТЕЛЬ',tint:'#5a8a3a',addons:['cloud'],prop:'tank'},
  drone:{base:'pollinator',name:'ТРУТЕНЬ',tint:'#8a7a2a',addons:['swarm'],prop:null,scale:0.75},
  rootling:{base:'mokrica',name:'КОРНЕВИК',tint:'#5a4428',addons:['burrow'],prop:'roots'},
  bellringer:{base:'clockmaker',name:'ЗВОНАРЬ',tint:'#8a6a2a',addons:['ring'],prop:'bell'},
  gearthrower:{base:'clockmaker',name:'ШЕСТЕРЁНЩИК',tint:'#6a6e78',addons:['gear'],prop:'sack'},
  pendulum:{base:'clockmaker',name:'МАЯТНИК',tint:'#3a4a6a',addons:['swing'],prop:'blade'},
  scribe:{base:'aristocrat',name:'ПИСАРЬ',tint:'#4a3a2a',addons:['paper'],prop:'satchel'},
  keeper:{base:'censor',name:'ХРАНИТЕЛЬ КАТАЛОГА',tint:'#3a3a4a',addons:['parry'],prop:'buckler'},
  chandler:{base:'lampada',name:'СВЕЧНИК',tint:'#c86a2a',addons:['brand'],prop:'candles'}
};
/* приёмы: wind — замах, red — несрываемый, cd — перезарядка, range — с какой дальности */
const ADDONS={
  rivet:{wind:0.7,cd:[3,4.5],range:[2.5,11],act(e,W,p,g){const sx=e.cx+e.face*0.5,sy=e.cy-0.2;
    for(let i=0;i<3;i++){const dx=p.cx-sx,tt=0.55+i*0.06,vy=(p.cy-sy)/tt-0.5*40*tt;W.projectiles.push({x:sx,y:sy,vx:dx/tt+(i-1)*0.8,vy,r:0.15,dmg:1,life:2.5,kind:'nut',rot:0});}
    g.audio.mat('iron',0.7);g.particles.burst(sx,sy,8,{kind:'spark',col:'#ffd27a',spd:5,life:0.3,size:0.04,add:true});}},
  roll:{wind:0.75,red:true,cd:[4.5,6.5],range:[2,13],act(e,W,p,g){e._roll=1.6;e._rollDir=e.face;g.audio.dash();}},
  call:{wind:0.6,cd:[7,10],range:[0,15],act(e,W,p,g){g.audio.tone(880,0.5,'square',0.03,660);g.audio.tone(660,0.5,'square',0.02,880);
    for(const o of W.enemies)if(o!==e&&!o.dead&&Math.hypot(o.cx-e.cx,o.cy-e.cy)<22){o.alert=7;o.investigate={x:p.cx,y:p.cy,t:5};}
    g.particles.spawn({kind:'ring',x:e.cx,y:e.cy,ringR:8,life:0.7,size:0.12,col:'#ffcf7a',add:true,a:0.8});e._flee=2.5;}},
  brand:{wind:0.85,cd:[4,6],range:[0,9],aim:true,act(e,W,p,g){BossFX.zone(W,{kind:'brand',x:e._aimX,y:e._aimY,r:1.25,life:2.6,arm:0.15,text:'ИЗЪЯТО'});g.audio.mat('brass',0.8);g.camera.addShake(0.3);}},
  cloud:{wind:0.8,cd:[5,7],range:[0,10],aim:true,act(e,W,p,g){BossFX.zone(W,{kind:'cloud',x:e._aimX,y:e._aimY-0.9,r:1.0,rmax:2.0,life:4,arm:0.5});g.audio.steamBurst();}},
  ring:{wind:0.8,red:true,cd:[5,7],range:[0,8],act(e,W,p,g){BossFX.ring(W,e.cx,e.cy-0.4,{vr:7,rmax:8.5,band:0.5,col:'#ffe6a3'});g.audio.tone(523,1.2,'sine',0.04,0,g.audio.verb);}},
  gear:{wind:0.7,cd:[3.5,5],range:[2,13],act(e,W,p,g){BossFX.gear(W,e.cx+e.face*0.6,e.bottom-0.56,e.face,{spd:7,bounces:2,r:0.42,life:5});g.audio.mat('brass',0.6);}},
  swing:{wind:0.9,cd:[3.5,5],range:[0,2.6],act(e,W,p,g){e._swing=0.35;e._swingHit=false;g.audio.slash('side');}},
  paper:{wind:0.65,cd:[3,4.5],range:[2.5,11],act(e,W,p,g){const sx=e.cx,sy=e.y+0.4,dx=p.cx-sx,tt=0.75,vy=(p.cy-sy)/tt-0.5*40*tt;
    W.projectiles.push({x:sx,y:sy,vx:dx/tt,vy,r:0.18,dmg:1,life:3,kind:'nut',rot:0});g.audio.tone(300,0.15,'triangle',0.03,200);}},
  burrow:{wind:0.5,cd:[5,7],range:[1.5,12],act(e,W,p,g){e._burrow=2.4;e._erupt=-1;g.audio.mat('rubber',0.8);
    g.particles.burst(e.cx,e.bottom,16,{kind:'debris',col:'#5a4630',spd:4,life:0.8,size:0.1,g:20});}},
  drop:{passive:true},parry:{passive:true},swarm:{passive:true}
};
/* узел, на котором видно замах приёма */
function addonNode(e){return e.nodes.find(n=>n.core&&!n.broken&&!n.locked)||e.nodes.find(n=>!n.broken&&!n.hidden)||null;}
function applyVariant(e,key){const V=VARIANTS[key];if(!V)return e;return applyVariantDef(e,V,key);}
function applyVariantDef(e,V,key){
  e.variantKey=key;e.variantName=V.name;e.vtint=V.tint;e.vprop=V.prop;e.addons=V.addons;e._acd=1.5+Math.random()*2;e._ast=null;
  if(V.scale){const k=V.scale;e.w*=k;e.h*=k;e.x+=e.w*(1-k)/2;e.y+=e.h*(1/k-1);for(const n of e.nodes){n.hp*=0.65;n.max*=0.65;}e.hp*=0.65;e.maxHp=(e.maxHp||e.hp)*0.65;e.vscale=k;
    if(e.speed){const sp=e.speed.bind(e);e.speed=()=>sp()*1.45;}}
  if(V.addons.indexOf('drop')>=0){e._hang=true;e._hangY=e.y;e._hangX=e.x;}
  /* ИИ: приём поверх базового цикла — пока он идёт, база молчит */
  const baseAi=e.ai.bind(e),baseCancel=e.cancelAttack.bind(e),baseHit=e.takeHit.bind(e),baseDraw=e.draw.bind(e),baseFX=e.drawFX?e.drawFX.bind(e):null,basePhys=e.physics.bind(e);
  e.cancelAttack=function(){if(this._ast){this._ast=null;this._acd=2.5;}baseCancel();};
  e.ai=function(dt){variantAi(this,dt,baseAi);};
  e.physics=function(dt){if(this._hang&&!this.dead){this.x=this._hangX;this.y=this._hangY;this.vx=0;this.vy=0;return;}
    if(this._burrow>0)this.vy=0;basePhys(dt);};
  /* парирование: удары в лоб — рикошет (кроме тяжёлого / разрыва / открытого механизма) */
  e.takeHit=function(h){if(this._burrow>0)return null;
    if(this.addons.indexOf('parry')>=0&&!this.dead&&!h.heavy&&!h.rupture&&h.kind!=='reflect'&&this.openT<=0&&this.stunT<=0&&this.pinT<=0){
      const front=Math.sign(h.fromX-this.cx)===this.face;
      if(front&&!this.nodes.some(n=>n.exT>0)){const g=this.world.game;g.fx.deflect(this.cx+this.face*0.4,this.cy,'steel');g.audio.deflect();
        this.react(h,0.2);this._riposte=0.35;return 'deflect';}}
    return baseHit(h);};
  e.draw=function(c,t){if(this._burrow>0){drawMound(c,this,t);return;}
    if(this.vscale){c.save();c.scale(this.vscale,this.vscale);baseDraw(c,t);c.restore();}else baseDraw(c,t);drawVariantProp(c,this,t);};
  e.drawFX=function(c,t){if(this._burrow>0)return;if(baseFX){if(this.vscale){c.save();c.scale(this.vscale,this.vscale);baseFX(c,t);c.restore();}else baseFX(c,t);}};
  return e;}
function variantAi(e,dt,baseAi){const W=e.world,g=W.game,p=W.player;
  if(e._acd>0)e._acd-=dt;
  /* люстра: висит под сводом, пока курьер не под ней; потом — падение (красный замах) и застревание */
  if(e._hang){if(p&&!p.dead&&Math.abs(p.cx-e.cx)<1.5&&p.cy>e.cy&&p.cy-e.cy<12&&!(W.calm&&W.calm(e))){e._ast={k:'dropW',t:0};e._hang=false;}
    else return;}
  if(e._ast&&e._ast.k==='dropW'){e._ast.t+=dt;const n=addonNode(e);e.telegraph(n,e._ast.t/0.55,e._ast.t>0.3,true);e.vx=0;e.vy=0;e.flying=true;
    if(e._ast.t>=0.55){e._ast={k:'dropF',t:0};e.flying=false;e.vy=20;g.audio.lampDive();}return;}
  if(e._ast&&e._ast.k==='dropF'){e._ast.t+=dt;e.vy=Math.max(e.vy,18);
    if(p&&!p.dead&&aabb(e.rect(),p.rect()))g.combat.damagePlayer(1,e.cx);
    if(e.onGround||e._ast.t>1.2){e._ast=null;e.openT=1.5;e.state='open';g.camera.addShake(0.5);g.audio.clatter('brass',1);
      for(const n of e.nodes)if(!n.broken)n.exT=Math.max(n.exT,1.5);e.flying=e.nodes.some(n=>n.id==='rotor'&&!n.broken);}
    return;}
  /* каток: катится по полу; в стену — оглушён и открыт */
  if(e._roll>0){e._roll-=dt;e.vx=e._rollDir*11;if(Math.random()<dt*30)g.particles.spawn({kind:'dust',x:e.cx,y:e.bottom,vx:-e._rollDir*2,vy:-1,life:0.4,size:0.12,col:'#7a6c5c',g:6});
    if(p&&!p.dead&&!e._rollHit&&aabb(e.rect(),p.rect())){e._rollHit=true;g.combat.damagePlayer(1,e.cx);}
    if(e.wall!==0||e._roll<=0){if(e.wall!==0){e.stunT=1.3;g.fx.slam(e.cx+e._rollDir*0.6,e.cy,'steel',11);for(const n of e.nodes)if(!n.broken)n.exT=Math.max(n.exT,1.3);}
      e._roll=0;e._rollHit=false;e.vx=0;}
    return;}
  /* корневик: под землёй ползёт к курьеру; бурление на полу — и выныривает */
  if(e._burrow>0){e._burrow-=dt;
    if(e._erupt<0){e.vx=damp(e.vx,Math.sign(p.cx-e.cx)*4.2,6,dt);if(Math.random()<dt*20)g.particles.spawn({kind:'debris',x:e.cx,y:e.bottom-0.05,vx:(Math.random()-0.5)*2,vy:-2,life:0.4,size:0.07,col:'#5a4630',g:14});
      if(Math.abs(p.cx-e.cx)<0.6||e._burrow<0.9){e._erupt=0;e.vx=0;}}
    else{e._erupt+=dt;e.vx=0;const n=addonNode(e);if(n){n.tele=clamp(e._erupt/0.7,0,1);n.teleHot=e._erupt>0.4;}
      if(Math.random()<dt*40)g.particles.spawn({kind:'debris',x:e.cx+(Math.random()-0.5)*1.2,y:e.bottom-0.05,vx:(Math.random()-0.5)*2,vy:-3-Math.random()*2,life:0.5,size:0.08,col:'#5a4630',g:16});
      if(e._erupt>=0.7){e._burrow=0;e.vy=-9;g.audio.mat('rubber',1);g.camera.addShake(0.4);
        if(p&&!p.dead&&Math.abs(p.cx-e.cx)<1.0&&Math.abs(p.bottom-e.bottom)<1.2)g.combat.damagePlayer(1,e.cx);
        e.openT=1.2;e.state='open';for(const n of e.nodes)if(!n.broken)n.exT=Math.max(n.exT,1.2);}}
    return;}
  /* маятник: рубящий взмах */
  if(e._swing>0){e._swing-=dt;e.vx=0;const hb={x:e.face>0?e.cx:e.cx-2.4,y:e.y-0.2,w:2.4,h:e.h};
    if(!e._swingHit&&p&&!p.dead&&aabb(hb,p.rect())){e._swingHit=true;g.combat.damagePlayer(1,e.cx);}return;}
  /* дуэлянт после парирования — короткий ответный выпад */
  if(e._riposte>0){e._riposte-=dt;if(e._riposte<=0&&p&&Math.abs(p.cx-e.cx)<1.8){e.vx=e.face*6;g.audio.slash('side');
    const hb={x:e.face>0?e.cx:e.cx-1.6,y:e.y+0.3,w:1.6,h:1.2};if(aabb(hb,p.rect()))g.combat.damagePlayer(1,e.cx);}}
  if(e._flee>0){e._flee-=dt;baseAi(dt);e.vx=damp(e.vx,-Math.sign(p.cx-e.cx)*3,4,dt);if(e.flying)e.vy=damp(e.vy,-2,3,dt);return;}
  /* замах приёма */
  if(e._ast){const A=ADDONS[e._ast.k];e._ast.t+=dt;const n=addonNode(e);e.vx=damp(e.vx,0,8,dt);if(e.flying)e.vy=damp(e.vy,0,6,dt);
    if(A.aim&&e._ast.t<A.wind*0.7){e._aimX=p.cx;e._aimY=p.bottom;}
    e.telegraph(n,e._ast.t/A.wind,e._ast.t>A.wind-0.3,!!A.red);
    if(e._ast.t>=A.wind){A.act(e,W,p,g);e._ast=null;e._acd=(A.cd[0]+Math.random()*(A.cd[1]-A.cd[0]))*(e.addonCdK||1);e.releaseToken();e.state='recover';e.st=0;}
    return;}
  baseAi(dt);
  /* можно начать приём: охотится, не в своей атаке, в дистанции, перезарядка вышла, очередь атак дала добро */
  const ad=e.addons.map(k=>ADDONS[k]).filter(A=>A&&!A.passive);if(!ad.length||e._acd>0||!p||p.dead){e._why='cd';return;}
  if(e.state==='wind'||e.state==='strike'||e.state==='open'||e.stunT>0){e._why='busy:'+e.state;return;}
  /* охотится: у обходчиков — их чувства; у прочих — дальность агро и прямая видимость */
  const hunt=e.hunting?e.hunting():((e.alert||0)>0||(Math.hypot(p.cx-e.cx,p.cy-e.cy)<(e.def&&e.def.aggro||9)&&losCheck(W,e.cx,e.cy,p.cx,p.cy-0.3)));if(!hunt){e._why='nohunt';return;}
  const d=Math.abs(p.cx-e.cx),A=ad[(Math.random()*ad.length)|0];if(d<A.range[0]||d>A.range[1]||Math.abs(p.cy-e.cy)>6){e._why='range'+d.toFixed(1);return;}
  if(e.wantAttack&&!e.wantAttack()){e._why='token';return;}e._why='go';
  e.face=p.cx>e.cx?1:-1;e._ast={k:e.addons.find(k=>ADDONS[k]===A),t:0};e._aimX=p.cx;e._aimY=p.bottom;g.audio.hydraulic(0.4);
}
/* корневик под землёй: бугор дёрна, по нему видно, куда он ползёт */
function drawMound(c,e,t){c.fillStyle='#4a3a26';c.beginPath();c.ellipse(0,-0.05,0.7,0.22+(e._erupt>=0?0.12*Math.sin(t*40):0),0,PI,TAU);c.fill();
  c.fillStyle='#6a5a3a';for(let i=0;i<5;i++){c.beginPath();c.arc(-0.5+i*0.25,-0.12-Math.abs(Math.sin(t*6+i))*0.08,0.06,0,TAU);c.fill();}}
/* опознаваемая деталь вариации + окраска (в контурном спрайте механизма) */
function drawVariantProp(c,e,t){const k=e.vscale||1,h=e.h/k,P=e.vprop;
  if(P==='gun'){c.fillStyle='#3a4450';rr(c,0.2,-h*0.62,0.55,0.2,0.04);c.fill();c.fillStyle='#22262a';c.fillRect(0.7,-h*0.6,0.28,0.1);c.fillStyle='#c9a227';c.fillRect(0.3,-h*0.47,0.12,0.12);}
  else if(P==='plates'){c.strokeStyle='rgba(30,40,24,.8)';c.lineWidth=0.05;for(let i=-2;i<=2;i++){c.beginPath();c.arc(0,-h*0.2,0.42+i*0.03,PI*1.1+i*0.1,PI*1.9+i*0.1);c.stroke();}}
  else if(P==='beacon'){c.fillStyle='#2a2418';c.fillRect(-0.08,-h-0.12,0.16,0.14);const p=0.5+0.5*Math.sin(t*9);c.fillStyle=rgba('#ffcf3a',0.5+0.5*p);c.beginPath();c.arc(0,-h-0.16,0.1,0,TAU);c.fill();
    e.world.game.renderer.glowAdd(e.cx,e.y-0.16,1.2,'#ffcf3a',0.3*p);}
  else if(P==='stamp'){c.fillStyle='#4a3424';c.fillRect(0.25,-h*0.95,0.08,0.7);c.fillStyle='#8a2a24';rr(c,0.12,-h*0.3,0.34,0.18,0.03);c.fill();c.fillStyle='rgba(255,210,180,.7)';c.font='700 0.06px Oswald';c.fillText('ИЗЪЯТО',0.13,-h*0.18);}
  else if(P==='buckler'){const g2=c.createLinearGradient(0.3,-h*0.7,0.6,-h*0.3);g2.addColorStop(0,'#c9a227');g2.addColorStop(1,'#6d5416');c.fillStyle=g2;c.beginPath();c.ellipse(0.42,-h*0.52,0.14,0.32,0,0,TAU);c.fill();
    c.strokeStyle='#3a2a10';c.lineWidth=0.03;c.stroke();Kit.bolt(c,0.42,-h*0.52,0.04);}
  else if(P==='chain'&&e._hang){c.strokeStyle='#3a3a3a';c.lineWidth=0.05;c.beginPath();c.moveTo(0,-h*0.8);c.lineTo(0,-h*0.8-6);c.stroke();}
  else if(P==='tank'){c.fillStyle='#4a7a3a';rr(c,-0.62,-h*0.92,0.32,0.58,0.12);c.fill();c.strokeStyle='#2a3a1e';c.lineWidth=0.03;c.stroke();c.strokeStyle='#6a6e70';c.lineWidth=0.04;c.beginPath();c.moveTo(-0.3,-h*0.7);c.quadraticCurveTo(0.1,-h*0.95,0.4,-h*0.8);c.stroke();}
  else if(P==='roots'){c.strokeStyle='#5a4428';c.lineWidth=0.05;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-0.4+i*0.2,-h*0.4);c.quadraticCurveTo(-0.5+i*0.2,-h*0.1,-0.3+i*0.22+Math.sin(t*3+i)*0.04,0);c.stroke();}}
  else if(P==='bell'){c.fillStyle='#c9a227';c.beginPath();c.moveTo(-0.16,-h-0.05);c.quadraticCurveTo(-0.16,-h-0.36,0,-h-0.36);c.quadraticCurveTo(0.16,-h-0.36,0.16,-h-0.05);c.closePath();c.fill();
    c.fillStyle='#6d5416';c.beginPath();c.arc(0,-h-0.04,0.04,0,TAU);c.fill();}
  else if(P==='sack'){c.fillStyle='#5a4a36';c.beginPath();c.ellipse(-0.42,-h*0.55,0.22,0.3,0.2,0,TAU);c.fill();Kit.gear(c,-0.42,-h*0.78,0.1,6,t,'#8a7a5a');}
  else if(P==='blade'){c.fillStyle='#b8c0c8';c.beginPath();c.moveTo(-0.05,-h*0.25);c.lineTo(0.05,-h*0.25);c.lineTo(0.3,0.05);c.lineTo(-0.3,0.05);c.closePath();c.fill();c.strokeStyle='#4a5258';c.lineWidth=0.02;c.stroke();}
  else if(P==='satchel'){c.fillStyle='#5a3a24';rr(c,-0.4,-h*0.5,0.32,0.28,0.04);c.fill();c.fillStyle='#e2d8c0';c.fillRect(-0.36,-h*0.56,0.24,0.08);}
  else if(P==='candles'){for(let i=0;i<3;i++){const x=-0.2+i*0.2;c.fillStyle='#e8dcc0';c.fillRect(x-0.03,-h-0.22,0.06,0.2);const p=0.6+0.4*Math.sin(t*12+i);c.fillStyle=rgba('#ffcf7a',p);c.beginPath();c.ellipse(x,-h-0.27,0.03,0.06,0,0,TAU);c.fill();}
    e.world.game.renderer.glowAdd(e.cx,e.y-0.25,1.0,'#ffb45a',0.3);}
  /* окраска корпуса — в пределах спрайта (рисуется в его собственный слой с контуром) */
  if(e.vtint){c.save();c.globalCompositeOperation='source-atop';c.fillStyle=rgba(e.vtint,0.28);c.fillRect(-2.5,-h-1.5,5,h+1.8);c.restore();}
}
/* ---------- ПОЧТОВИК: новый класс ----------
   Одноколёсный разносчик пневмопочты, которого Совет переучил на «изъятие»: тумба на колесе,
   над ней — лампа-голова, за спиной — сумка с капсулами. Держит дистанцию и швыряет капсулы
   (импульс отбивает их обратно), вплотную — толкает. Узлы: КОЛЕСО (без него — еле ползёт),
   СУМКА (на спине; без неё — нечем бросать, лезет толкаться), ЛАМПА (без неё — слеп, идёт на шум). */
class Mailbot extends MobMech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.9,h:1.55,hp:66,dmg:1,aggro:9.5,hearing:1.0,mass:1.0,bodyMat:'brass',blood:'#5a4a3a'},def),x,y);
    this.addNode({id:'wheel',hp:32,r:0.3,mat:'rubber',coreDmg:14,scrap:2});
    this.addNode({id:'sack',hp:26,r:0.3,mat:'ply',backOnly:true,coreDmg:12,scrap:2});
    this.addNode({id:'lamp',hp:18,r:0.18,mat:'glass',coreDmg:10,scrap:1});
    this.roll=0;this.pose(0);}
  speed(){return this.has('wheel')?4.0:0.9;}
  turnTime(){return this.has('wheel')?0.12:0.4;}
  get blind(){return !this.has('lamp');}
  set blind(v){}
  atk(){if(this.has('sack'))return {kind:'throw',node:this.node('sack'),range:9.5,minR:3,dy:6,wind:0.7,hot:0.32,strike:0.15,rec:0.9};
    return {kind:'shove',node:this.node('wheel')||this.node('lamp'),range:1.5,wind:0.55,hot:0.28,strike:0.25,rec:0.7};}
  ai(dt){this.sense(dt);this.fight(dt);}
  approach(dd,A){if(A.kind==='throw'){if(dd<A.minR)return -this.face*this.speed();if(dd>A.range*0.8)return this.face*this.speed()*0.8;return 0;}return super.approach(dd,A);}
  onWind(A){this.world.game.audio.tone(440,A.wind,'triangle',0.02,660);}
  onStrike(A){const W=this.world,g=W.game,p=W.player;
    if(A.kind==='throw'){const sx=this.cx-this.face*0.2,sy=this.y+0.3,dx=p.cx-sx,tt=0.7,vy=(p.cy-sy)/tt-0.5*40*tt;
      W.projectiles.push({x:sx,y:sy,vx:dx/tt,vy,r:0.17,dmg:1,life:3,kind:'nut',rot:0,look:'capsule'});g.audio.tone(330,0.12,'triangle',0.03,500);}
    else{this.vx=this.face*7;g.audio.melee();}}
  strikeBox(A){if(A.kind!=='shove')return null;return {x:this.face>0?this.cx:this.cx-1.4,y:this.y+0.4,w:1.4,h:1.0};}
  onBreak(n){const g=this.world.game;if(n.id==='sack'){g.particles.burst(n.wx,n.wy,14,{kind:'debris',col:'#e2d8c0',spd:4,life:1.2,size:0.08,g:6});g.audio.clatter('brass',0.8);}
    if(n.id==='wheel')g.audio.mat('rubber',1);if(n.id==='lamp')g.audio.crack('glass');}
  pose(dt){const P=this.P;this.roll+=(dt||0)*this.vx*this.face/0.3;
    P.lean=clamp(this.vx*0.03,-0.2,0.2)+(this.state==='wind'?-0.12:0)+(this.openT>0||this.stunT>0?Math.sin(this.t*8)*0.06:0);
    const wn=this.node('wheel');wn.lx=0;wn.ly=-0.3;const sn=this.node('sack');sn.lx=-0.42;sn.ly=-0.95;const ln=this.node('lamp');ln.lx=0.05;ln.ly=-1.5;}
  draw(c,t){const P=this.P;
    if(this.has('wheel')){c.save();c.translate(0,-0.3);c.rotate(this.roll);c.fillStyle='#1e1c1a';c.beginPath();c.arc(0,0,0.3,0,TAU);c.fill();c.strokeStyle='#6a6e70';c.lineWidth=0.04;
      for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(i*1.257)*0.26,Math.sin(i*1.257)*0.26);c.stroke();}MK.joint(c,0,0,0.07,'brass');c.restore();}
    else MK.stump(c,0,-0.3,0.12,PI/2,this.node('wheel').seed,t,'rubber');
    c.save();c.translate(0,-0.55);c.rotate(P.lean);
    MK.box(c,-0.32,-0.85,0.64,0.85,0.14,'brass',{seams:[0.4]});
    c.fillStyle='#1a1410';rr(c,-0.18,-0.62,0.36,0.07,0.02);c.fill();
    c.fillStyle='#8a2a24';c.fillRect(-0.32,-0.3,0.64,0.07);c.fillStyle='rgba(240,230,200,.8)';c.font='700 0.09px Oswald';c.fillText('ПОЧТА',-0.18,-0.4);
    if(this.has('sack')){c.fillStyle='#5a4a36';c.beginPath();c.ellipse(-0.42,-0.4,0.2,0.3,0.15,0,TAU);c.fill();
      for(let i=0;i<3;i++){c.fillStyle='#c9a227';rr(c,-0.55+i*0.1,-0.78,0.07,0.18,0.03);c.fill();}}
    c.fillStyle='#3a3a36';c.fillRect(-0.04,-1.0,0.08,0.18);
    c.restore();
    if(this.has('lamp')){const n=this.node('lamp');MK.joint(c,n.lx,n.ly,0.17,'steel');c.fillStyle=this.hunting()?'#ffcf7a':'#a08a5a';c.beginPath();c.arc(n.lx+0.06,n.ly,0.09,0,TAU);c.fill();}
    else MK.stump(c,0.05,-1.4,0.06,-PI/2,this.node('lamp').seed,t,'glass');}
  drawFX(c,t){if(!this.has('lamp')||!this.hunting())return;const n=this.node('lamp');this.world.game.renderer.glowAdd(n.wx,n.wy,1.2,'#ffcf7a',0.35);}
  partDebris(n){if(n.id==='wheel')return {w:0.6,h:0.6,mass:0.4,mat:'rubber',draw:(c,t)=>{c.fillStyle='#1e1c1a';c.beginPath();c.arc(0,0,0.28,0,TAU);c.fill();}};
    if(n.id==='sack')return {w:0.4,h:0.5,mass:0.2,mat:'ply',draw:(c,t)=>{c.fillStyle='#5a4a36';c.beginPath();c.ellipse(0,0,0.18,0.26,0,0,TAU);c.fill();}};
    if(n.id==='lamp')return {w:0.25,h:0.25,mass:0.1,mat:'glass',draw:(c,t)=>{MK.joint(c,0,0,0.12,'steel');}};return null;}
  corpseDebris(){return {w:0.9,h:0.5,mass:1.0,mat:'brass',draw:(c,t)=>{c.save();c.rotate(1.3);MK.box(c,-0.3,-0.4,0.6,0.8,0.12,'brass',{});c.restore();}};}
  spriteBounds(){return {x:this.cx-1.4,y:this.bottom-2.2,w:2.8,h:2.5};}
}
Object.assign(ENEMY_TYPES,{mailbot:Mailbot});
/* вариации — фабрики: new ENEMY_TYPES.riveter(...) вернёт базовый механизм с приёмом */
for(const k in VARIANTS){const V=VARIANTS[k];ENEMY_TYPES[k]=function(W,d,x,y){const B=ENEMY_TYPES[V.base];
  const e=new B(W,Object.assign({},d,{type:V.base}),x,y);e.type=k;return applyVariant(e,k);};}
