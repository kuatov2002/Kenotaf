"use strict";
/* ============================== BOSS FX ==============================
   Общие снаряды и зоны для боссов. Всё честно телеграфируется:
     drop  — падает сверху; за 0.7 с до удара на полу — круг-предупреждение;
     ring  — расширяющееся кольцо (звон, удар): одно касание; рывок сквозь него неуязвим;
     gear  — шестерня катится по полу и скачет по стенам; импульсом отбивается обратно;
     seal  — свинцовая пломба по дуге; импульсом — в ядро босса (как осколок Архивариуса);
   Зоны (world.zones): cloud — облако гербицида (жжёт, пока стоишь; импульс сдувает),
     brand — выжженный штамп на полу (горит 2.5 с), pit — проваленный пол (временно). */
const BOSS_PR={drop:1,ring:1,gear:1,seal:1,erupt:1};
const BossFX={
  /* случайный выбор по весам: [['имя',вес],...] */
  pick(o){let tot=o.reduce((a,b)=>a+b[1],0),r=Math.random()*tot;for(const q of o){r-=q[1];if(r<=0)return q[0];}return o[0][0];},
  drop(W,x,o){o=o||{};const R=W.room,y0=o.y0===undefined?1.2:o.y0;let fy=R.h;
    for(const s of R.solids){if(s.hidden||x<s.x||x>s.x+s.w)continue;if(s.y>y0+0.5&&s.y<fy)fy=s.y;}

    W.projectiles.push(Object.assign({kind:'drop',x:x,y:(o.y0===undefined?1.2:o.y0),vx:0,vy:0,r:o.r||0.5,dmg:1,life:6,delay:o.delay===undefined?0.7:o.delay,fy:fy,rad:o.rad||1.6,look:o.look||'capsule',rot:0},o));},
  ring(W,x,y,o){o=o||{};W.projectiles.push(Object.assign({kind:'ring',x,y,r:o.r0||0.6,vr:o.vr||7,band:o.band||0.5,rmax:o.rmax||14,dmg:1,life:4,col:o.col||'#ffe6a3'},o));},
  gear(W,x,y,dir,o){o=o||{};W.projectiles.push(Object.assign({kind:'gear',x,y,vx:dir*(o.spd||7),vy:0,r:o.r||0.55,dmg:1,life:o.life||6,bounces:o.bounces||2,rot:0},o));},
  seal(W,x,y,tx,ty,o){o=o||{};const T=o.T||0.9,g=30;const vx=(tx-x)/T,vy=(ty-y)/T-0.5*g*T;
    W.projectiles.push(Object.assign({kind:'seal',x,y,vx,vy,g,r:0.38,dmg:1,life:5,reflect:true,rot:0},o));},
  zone(W,o){(W.zones=W.zones||[]).push(Object.assign({t:0,life:4,r:1.6,hitCd:0},o));}
};
/* ---------- обновление: снаряды босса (вызывается из World.updateProjectiles) ---------- */
function updateBossProjectile(W,pr,dt){
  const g=W.game,p=W.player;
  if(pr.kind==='drop'){
    if(pr.delay>0){pr.delay-=dt;return false;}
    pr.vy+=34*dt;pr.y+=pr.vy*dt;pr.rot+=dt*4;
    if(pr.y+pr.r>=pr.fy){pr.y=pr.fy-pr.r;
      g.audio.explosion();g.camera.addShake(0.5);
      g.particles.burst(pr.x,pr.fy,22,{kind:'debris',col:pr.look==='boulder'?'#6a5a3a':'#8a7a6a',spd:7,life:0.8,size:0.13,g:28});
      g.particles.burst(pr.x,pr.fy-0.2,12,{kind:'spark',col:'#ffcf7a',spd:6,life:0.4,size:0.05,add:true,g:16});
      g.particles.spawn({kind:'shock',x:pr.x,y:pr.fy-0.1,ringR:pr.rad*1.4,life:0.3,size:0.08,col:'#ffcf7a',add:true,a:0.6});
      /* удар — только по тем, кто на этой поверхности или прямо над ней (в пределах круга) */
      if(p&&!p.dead&&p.x<pr.x+pr.rad&&p.x+p.w>pr.x-pr.rad&&p.bottom>pr.fy-1.6&&p.bottom<pr.fy+0.35)p.hurtBy(pr.dmg,pr.x);
      if(pr.onLand)pr.onLand(pr);
      return true;}
    if(p&&!p.dead&&aabb({x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2},p.rect())){p.hurtBy(pr.dmg,pr.x);return true;}
    return false;}
  if(pr.kind==='ring'){
    pr.r+=pr.vr*dt;
    if(!pr.hit&&p&&!p.dead){const pts=[[p.cx,p.cy],[p.cx,p.y+0.15],[p.cx,p.bottom-0.1],[p.x+0.08,p.cy],[p.x+p.w-0.08,p.cy]];
      const on=pts.some(q=>Math.abs(Math.hypot(q[0]-pr.x,q[1]-pr.y)-pr.r)<pr.band*0.5);
      if(on&&(!pr.ground||p.bottom>pr.y-0.6)){if(p.hurtBy(pr.dmg,pr.x)||p.dashT>0||p.evIF>0)pr.hit=true;}}
    return pr.r>pr.rmax;}
  if(pr.kind==='gear'){
    pr.vy+=40*dt;const nx=pr.x+pr.vx*dt,ny=pr.y+pr.vy*dt;pr.rot+=pr.vx*dt/pr.r;
    let hitX=false,hitY=false;
    for(const s of W.room.solids){if(s.hidden)continue;
      if(nx+pr.r>s.x&&nx-pr.r<s.x+s.w&&pr.y+pr.r>s.y&&pr.y-pr.r<s.y+s.h&&!s.ow)hitX=true;
      if(pr.x+pr.r>s.x&&pr.x-pr.r<s.x+s.w&&ny+pr.r>s.y&&ny-pr.r<s.y+s.h&&(!s.ow||(pr.vy>0&&pr.y+pr.r<=s.y+0.1)))hitY=true;}
    if(hitX){pr.vx=-pr.vx*0.9;pr.bounces--;g.audio.mat('brass',0.5);}else pr.x=nx;
    if(hitY){if(pr.vy>0)pr.vy=-Math.min(9,pr.vy*0.45);else pr.vy=0;}else pr.y=ny;
    if(Math.random()<dt*20)g.particles.spawn({kind:'spark',x:pr.x,y:pr.y+pr.r,vx:-pr.vx*0.3,vy:-1.5,life:0.25,size:0.04,col:'#ffcf7a',add:true,g:10});
    if(pr.mine){const b=W.boss;if(b&&!b.dead&&b.activated&&aabb({x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2},b.rect())){
        b.hurt(30,Math.sign(pr.vx),0,true);g.audio.breakPart('brass',true);g.particles.burst(pr.x,pr.y,20,{kind:'spark',col:'#ffe6a3',spd:8,life:0.5,size:0.06,add:true,g:14});return true;}}
    else if(p&&!p.dead&&aabb({x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2},p.rect())){p.hurtBy(pr.dmg,pr.x);return true;}
    return pr.bounces<0;}
  if(pr.kind==='seal'&&!pr.back){
    pr.vy+=pr.g*dt;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.rot+=dt*6;
    for(const s of W.room.solids){if(s.hidden||s.ow)continue;if(pr.x>s.x&&pr.x<s.x+s.w&&pr.y+pr.r>s.y&&pr.y<s.y+s.h){
      g.particles.burst(pr.x,pr.y,10,{kind:'spark',col:'#cfd6e0',spd:5,life:0.35,size:0.05,add:true,g:14});g.audio.mat('iron',0.5);return true;}}
    if(p&&!p.dead&&aabb({x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2},p.rect())){p.hurtBy(pr.dmg,pr.x);return true;}
    return false;}
  return null;
}
/* ---------- зоны: облака, клейма, провалы ---------- */
function updateZones(W,dt){
  const Z=W.zones;if(!Z||!Z.length)return;const g=W.game,p=W.player;
  for(const z of Z){z.t+=dt;if(z.hitCd>0)z.hitCd-=dt;
    if(z.kind==='cloud'){z.x+=(z.vx||0)*dt;z.vx=damp(z.vx||0,0,1.2,dt);z.r=Math.min(z.rmax||2.4,z.r+dt*0.6);
      if(Math.random()<dt*20)g.particles.spawn({kind:'steam',x:z.x+(Math.random()-0.5)*z.r*1.6,y:z.y+(Math.random()-0.5)*z.r,vx:(Math.random()-0.5),vy:-0.4,life:1.2,size:0.5,grow:0.6,col:'#9ab84a',drag:1,a:0.45});
      /* сдутое в механизм облако разъедает его баллон */
      const b=W.boss;if(z.pushed&&b&&b.activated&&!b.dead&&b.cloudHit&&Math.hypot(b.cx-z.x,b.cy-z.y)<z.r+1.4){b.cloudHit(z);z.life=0;}}
    if(p&&!p.dead&&z.hitCd<=0&&z.t>(z.arm||0.4)){
      const inside=z.kind==='brand'?(p.x+p.w-0.12>z.x-z.r&&p.x+0.12<z.x+z.r&&Math.abs(p.bottom-z.y)<0.35):(Math.hypot(p.cx-z.x,p.cy-z.y)<z.r*0.75);
      if(inside&&p.hurtBy(1,z.x))z.hitCd=1.0;}}
  W.zones=Z.filter(z=>z.t<z.life);
}
/* импульс сдувает облака в сторону удара */
function pulseZones(W,p,dir,hb){
  for(const z of (W.zones||[])){if(z.kind!=='cloud')continue;
    if(Math.abs(z.x-(p.cx+dir*1.6))<z.r+2&&Math.abs(z.y-p.cy)<z.r+1.5){z.vx=dir*14;z.pushed=true;z.t=Math.min(z.t,z.life-2.5);}}
}
function drawBossFX(c,W,t){
  for(const z of (W.zones||[])){const a=clamp(Math.min(z.t/0.4,(z.life-z.t)/0.6),0,1);
    if(z.kind==='cloud'){const g=c.createRadialGradient(z.x,z.y,0,z.x,z.y,z.r);g.addColorStop(0,rgba('#b8d04a',0.5*a));g.addColorStop(0.7,rgba('#7a9a2a',0.3*a));g.addColorStop(1,'rgba(90,120,30,0)');
      c.fillStyle=g;c.beginPath();c.arc(z.x,z.y,z.r,0,TAU);c.fill();
      c.strokeStyle=rgba('#e0f07a',0.35*a);c.lineWidth=0.05;c.beginPath();c.arc(z.x,z.y,z.r*0.8,0,TAU);c.stroke();}
    else if(z.kind==='brand'){const fl=0.6+0.4*Math.sin(t*12+z.x);c.fillStyle=rgba('#ff6a2a',0.55*a*fl);c.fillRect(z.x-z.r,z.y-0.1,z.r*2,0.12);
      c.save();c.globalAlpha=0.8*a;c.fillStyle='#ffb45a';c.font='600 0.42px Oswald';c.textAlign='center';c.fillText(z.text||'ИЗЪЯТО',z.x,z.y-0.25);c.restore();
      game.renderer.glowAdd(z.x,z.y-0.2,z.r,'#ff7a3a',0.4*a*fl);}}
  for(const pr of W.projectiles){
    if(pr.kind==='drop'){
      /* круг-предупреждение на полу: сжимается к моменту удара */
      const k=pr.delay>0?1-pr.delay/0.7:1,fy=pr.fy;
      c.strokeStyle=rgba('#ff5a3a',0.4+0.5*k);c.lineWidth=0.08;c.beginPath();c.ellipse(pr.x,fy-0.05,pr.rad*(1.6-0.6*k),0.22,0,0,TAU);c.stroke();
      c.fillStyle=rgba('#ff5a3a',0.12+0.18*k);c.beginPath();c.ellipse(pr.x,fy-0.05,pr.rad,0.18,0,0,TAU);c.fill();
      if(pr.delay>0)continue;
      c.save();c.translate(pr.x,pr.y);c.rotate(pr.rot*0.2);
      if(pr.look==='boulder'){c.fillStyle='#5a4a30';c.beginPath();for(let i=0;i<7;i++){const a=i/7*TAU;c.lineTo(Math.cos(a)*pr.r*(0.85+((i*7)%3)*0.08),Math.sin(a)*pr.r*(0.85+((i*5)%3)*0.08));}c.closePath();c.fill();
        c.strokeStyle='#2a4a1a';c.lineWidth=0.06;c.beginPath();c.moveTo(-pr.r*0.6,-pr.r*0.3);c.quadraticCurveTo(0,-pr.r*1.2,pr.r*0.5,-pr.r*0.9);c.stroke();}
      else{MK.cyl(c,-pr.r*0.6,-pr.r,pr.r*1.2,pr.r*2,'brass',{bands:[[0.2,0.08,'copper'],[0.75,0.08,'copper']]});}
      c.restore();}
    else if(pr.kind==='ring'){const a=clamp(1-pr.r/pr.rmax,0,1)*(pr.hit?0.4:1);
      c.save();c.globalCompositeOperation='lighter';c.strokeStyle=rgba(pr.col,0.75*a);c.lineWidth=pr.band;c.beginPath();c.arc(pr.x,pr.y,pr.r,0,TAU);c.stroke();
      c.strokeStyle=rgba('#ffffff',0.6*a);c.lineWidth=0.05;c.beginPath();c.arc(pr.x,pr.y,pr.r,0,TAU);c.stroke();c.restore();
      if(pr.label){c.save();c.globalAlpha=0.85*a;c.fillStyle=pr.col;c.font='600 0.62px Oswald';c.textAlign='center';
        for(const ang of [-PI/2,PI/2-0.6,PI/2+0.6,-0.2,PI+0.2])c.fillText(pr.label,pr.x+Math.cos(ang)*pr.r,pr.y+Math.sin(ang)*pr.r+0.2);c.restore();}}
    else if(pr.kind==='gear'){c.save();c.translate(pr.x,pr.y);Kit.gear(c,0,0,pr.r,10,pr.rot,pr.mine?'#e8c96a':'#a8842a');
      c.strokeStyle=pr.mine?'rgba(220,240,255,.8)':'rgba(255,90,60,.7)';c.lineWidth=0.05;c.beginPath();c.arc(0,0,pr.r+0.12,0,TAU);c.stroke();c.restore();
      game.renderer.glowAdd(pr.x,pr.y,0.8,pr.mine?'#bfe3ff':'#ff8a3a',0.35);}
    else if(pr.kind==='seal'){c.save();c.translate(pr.x,pr.y);c.rotate(pr.rot);
      const gr=c.createRadialGradient(-0.1,-0.1,0,0,0,pr.r);gr.addColorStop(0,pr.back?'#ffffff':'#d8dde4');gr.addColorStop(1,pr.back?'#9fd6ff':'#4e5257');
      c.fillStyle=gr;c.beginPath();c.arc(0,0,pr.r,0,TAU);c.fill();c.fillStyle='#8a2a1c';c.fillRect(-0.12,-0.04,0.24,0.08);
      c.strokeStyle=pr.back?'rgba(220,240,255,.9)':'rgba(232,201,106,.9)';c.lineWidth=0.05;c.beginPath();c.arc(0,0,pr.r+0.14,0,TAU);c.stroke();c.restore();
      game.renderer.glowAdd(pr.x,pr.y,0.8,pr.back?'#bfe3ff':'#e8c96a',0.4);}
  }
}
