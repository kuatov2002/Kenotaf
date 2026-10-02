"use strict";
/* ============================== BOSSES ============================== */
/* Каждый босс уязвим только в «окне», которое читается без текста:
   Архивариус — отражённые импульсом осколки. Надсмотрщик и Примарх — механизмы с узлами
   (js/entities/mechs/overseer.js, primarch.js). */
class Boss extends Enemy{
  constructor(world,def,x,y){super(world,def,x,y);this.phase=1;this.activated=false;this.armorSay=-9;
    this.phaseAt=def.phaseAt||[];this.state='idle';this.st=0;this.cd=1.4;this.quietT=0;this.nudged={};}
  /* одна короткая фраза, если 40 с боя прошли без единого настоящего попадания */
  nudge(){return '';}
  armor(){return 1;}
  armorMsg(){return 'БРОНЯ ДЕРЖИТ.';}
  setState(s){this.state=s;this.st=0;}
  /* raw — урон от окружения (груз, отражённый осколок), мимо брони */
  hurt(dmg,kx,ky,raw){
    if(this.dead)return;
    const a=raw?1:this.armor(),g=this.world.game;
    if(raw)this.quietT=0;
    if(a<0.5){
      this.hp-=dmg*a;this.flash=0.05;g.audio.hitMetal();g.hitstop(0.03);
      const p=this.world.player;
      g.particles.burst(clamp(p.cx,this.x,this.x+this.w),this.cy,10,{kind:'spark',col:'#ffe6a3',spd:6,life:0.35,size:0.05,add:true,g:12});
      if(this.hp<=0)this.die();
      return;}
    this.quietT=0;
    super.hurt(dmg*a,kx*0.06,ky*0.02);
  }
  die(){
    if(this.dead)return;
    super.die();
    const g=this.world.game;
    g.audio.explosion();g.camera.addShake(1.8);g.hitstop(0.3);g.flash(0.5);
    g.particles.burst(this.cx,this.cy,60,{kind:'debris',col:'#5c4a38',spd:12,life:1.8,size:0.24,g:28});
    g.particles.burst(this.cx,this.cy,40,{kind:'spark',col:'#ffb45a',spd:14,life:1,size:0.09,add:true,g:18});
    g.particles.burst(this.cx,this.cy,24,{kind:'smoke',col:'#2a2622',spd:3,life:3,size:1.2,grow:1.4,drag:1.1});
    g.hud.bossOff();
    g.hud.say(this.name+' · ОСТАНОВЛЕН.','');
  }
  update(dt){
    super.update(dt);
    if(this.dead)return;
    if(this.activated){this.quietT+=dt;
      if(this.quietT>40&&!this.nudged[this.phase]){const m=this.nudge();this.nudged[this.phase]=1;if(m)this.world.game.hud.say(m,'');}}
    this.world.game.hud.boss(this.name,this.hp/this.maxHp);
    let ph=1;for(const f of this.phaseAt)if(this.hp/this.maxHp<=f+1e-6)ph++;
    while(this.phase<ph){this.phase++;this.onPhase(this.phase);}
  }
  onPhase(n){}
}
class Archivist extends Boss{
  constructor(world,x,y){
    super(world,{type:'archivist',w:4.4,h:4.6,hp:6,dmg:1,aggro:99,blood:'#5c6067',phaseAt:[0.67,0.34]},x,y);
    this.name='АРХИВАРИУС';this.camZoom=0.72;this.shotT=2.4;this.jt=0;this.trig=[];this.hitT=0;this.face=1;}
  physics(){}
  safe(){return true;}
  armor(){return 0;}
  nudge(){return 'ОСКОЛКИ ЛЕТЯТ ИЗ ЯДРА — ЗНАЧИТ, ЯДРО ОТКРЫТО.';}
  armorMsg(){return 'ЯДРО ЗА СВИНЦОВЫМ СТЕКЛОМ. ОТБЕЙ ОСКОЛОК ИМПУЛЬСОМ ОБРАТНО — В ЯДРО.';}
  threat(){return this.shotT<0.6;}
  get coreX(){return this.cx;}
  get coreY(){return this.y+this.h*0.58;}
  onPhase(n){
    const g=this.world.game;g.audio.bossRoar();g.camera.addShake(1.2);this.jt=0;this.trig.length=0;
  }
  ai(dt){
    const g=this.world.game,p=this.world.player,R=this.world.room;
    this.st+=dt;this.jt+=dt;if(this.hitT>0)this.hitT-=dt;
    /* паровые сопла пола: фаза I — бегущая волна, II — весь пол разом, III — случайные пары */
    const jets=R.hazards.filter(h=>h.ctl==='arch');
    for(const h of jets){h.warn=false;h.active=false;}
    if(this.phase===1){const seq=[0,1,2,3,4,5,4,3,2,1],T=this.jt%5.2;
      for(let k=0;k<seq.length;k++){const st=k*0.52,h=jets[seq[k]];if(!h)continue;
        if(T>=st&&T<st+0.6)h.warn=true;else if(T>=st+0.6&&T<st+1.3)h.active=true;}}
    else if(this.phase===2){const T=this.jt%5.0;for(const h of jets){h.warn=T<0.9;h.active=T>=0.9&&T<2.8;}}
    else{if(this.jt>1.5){this.jt=0;for(let k=0;k<2;k++)this.trig.push({i:(Math.random()*jets.length)|0,t:0});}
      for(const q of this.trig){q.t+=dt;const h=jets[q.i];if(!h)continue;if(q.t<0.6)h.warn=true;else if(q.t<1.4)h.active=true;}
      this.trig=this.trig.filter(q=>q.t<1.4);}
    for(const h of jets)if(h.active&&Math.random()<0.7)g.particles.spawn({kind:'steam',x:h.x+Math.random()*h.w,y:h.y+h.h,
      vx:(Math.random()-0.5)*1.4,vy:-6-Math.random()*4,life:0.7,size:0.45,grow:1.3,col:'#e8e0d0',drag:0.8});
    /* осколки ядра: медленные, ярко подсвечены — их надо отбить импульсом */
    this.shotT-=dt;
    if(this.shotT<=0&&!p.dead){
      const n=this.phase===3?3:1,sp=this.phase===1?6.2:7.2;
      for(let i=0;i<n;i++){const a=Math.atan2(p.cy-this.coreY,p.cx-this.coreX)+(i-(n-1)/2)*0.32;
        this.world.projectiles.push({x:this.coreX+Math.cos(a)*1.6,y:this.coreY+Math.sin(a)*1.6,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
          r:0.42,dmg:1,life:7,kind:'orb',reflect:true,rot:0});}
      g.audio.hitMetal();this.shotT=[2.6,2.2,2.5][this.phase-1];
    }
  }
  draw(c,t){
    const w=this.w,h=this.h,k=this.shotT<0.6?1-this.shotT/0.6:0;
    c.save();c.translate(0,-h*0.55);c.rotate(t*0.15);Kit.gear(c,0,0,3.0,26,0,'#3d3a30');c.restore();
    for(let i=0;i<6;i++){const s=i<3?-1:1,j=i%3,a=s*(0.5+j*0.45)+Math.sin(t*1.3+i)*0.12;
      c.save();c.translate(s*0.8,-h*0.6+j*0.5);c.rotate(a+(s<0?PI:0));
      c.strokeStyle='#4e5157';c.lineWidth=0.18;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(1.9,0);c.lineTo(2.9,0.5);c.stroke();
      c.fillStyle='#b08d3e';c.beginPath();c.arc(1.9,0,0.14,0,TAU);c.fill();c.restore();}
    const g=c.createLinearGradient(-w/2,-h,w/2,0);
    g.addColorStop(0,'#7a7d84');g.addColorStop(.5,'#4e5157');g.addColorStop(1,'#23262a');
    c.fillStyle=g;rr(c,-w*0.32,-h*0.92,w*0.64,h*0.78,0.4);c.fill();
    for(let i=0;i<6;i++)Kit.bolt(c,-w*0.24+i*w*0.096,-h*0.86,0.07);
    c.fillStyle='#2c2f34';rr(c,-w*0.18,-h*1.08,w*0.36,h*0.26,0.12);c.fill();
    const eye=this.threat()?'#ff3b22':'#e8e8e8';
    c.fillStyle=eye;c.beginPath();c.arc(-0.32,-h*0.96,0.12,0,TAU);c.arc(0.32,-h*0.96,0.12,0,TAU);c.fill();
    /* ядро: свинцовое стекло, внутри — светящийся сердечник; вспыхивает от попадания */
    const cy=-h*0.42,p=0.5+0.5*Math.sin(t*3);
    c.fillStyle='#1a1c20';c.beginPath();c.arc(0,cy,0.95,0,TAU);c.fill();
    const cg=c.createRadialGradient(0,cy,0,0,cy,0.85);
    cg.addColorStop(0,this.hitT>0?'#ffffff':'rgba(220,235,255,1)');cg.addColorStop(.5,rgba('#8fb6c9',0.8+0.2*k));cg.addColorStop(1,'rgba(60,80,110,.3)');
    c.fillStyle=cg;c.beginPath();c.arc(0,cy,0.78+0.06*p,0,TAU);c.fill();
    c.strokeStyle='#b08d3e';c.lineWidth=0.12;c.beginPath();c.arc(0,cy,0.95,0,TAU);c.stroke();
    game.renderer.glowAdd(this.coreX,this.coreY,1.6,this.hitT>0?'#ffffff':'#bfe3ff',0.4+0.3*p+(this.hitT>0?0.6:0));
  }
}
