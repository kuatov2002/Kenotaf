"use strict";
/* ============================== BOSSES ============================== */
/* Каждый босс уязвим только в «окне», которое читается без текста:
   Надсмотрщик — раскрытая кабина (крюки застряли / врезался в стену), затем только грузы;
   Примарх — баллон на спине (как у цензоров); Архивариус — отражённые импульсом осколки. */
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
class Overseer extends Boss{
  constructor(world,x,y){
    super(world,{type:'overseer',w:5.2,h:3.6,hp:100,dmg:1,aggro:40,blood:'#4a3a30',phaseAt:[0.6]},x,y);
    this.name='НАДСМОТРЩИК';this.tread=0;this.weightHits=0;this.chargeDir=1;}
  vuln(){return this.phase===1&&(this.state==='stuck'||this.state==='stunWall');}
  safe(){return this.vuln()||this.state==='stuck'||this.state==='recover';}
  armor(){return this.phase>=2?0.02:(this.vuln()?1:0.12);}
  nudge(){return this.phase>=2?'НАД АРЕНОЙ ВИСЯТ ГРУЗЫ.':'КРЮКИ ТЯЖЕЛЫ. ПРОМАХНЁТСЯ — ЗАСТРЯНЕТ.';}
  armorMsg(){return this.phase>=2?'БРОНЯ СОМКНУЛАСЬ. ТОЛЬКО ГРУЗ: С ПЛАТФОРМЫ ИМПУЛЬСОМ ПО ГРУЗУ НАД НИМ.'
    :'КАБИНА ЗАКРЫТА. ЖДИ: КРЮКИ ЗАСТРЯНУТ В ПОЛУ ИЛИ ОН ВРЕЖЕТСЯ В СТЕНУ — ТОГДА БЕЙ.';}
  threat(){return ['sweepWind','slamWind','chargeWind','charge','grab'].indexOf(this.state)>=0;}
  onPhase(n){
    const g=this.world.game;
    g.audio.bossRoar();g.camera.addShake(1.1);g.hitstop(0.16);this.setState('idle');this.cd=1.6;
    this.hp=this.maxHp*0.6;  /* фаза II всегда решается ровно тремя грузами */
    g.particles.burst(this.cx,this.cy,40,{kind:'spark',col:'#ffb45a',spd:12,life:1,size:0.07,add:true,g:20});
  }
  ai(dt){
    const p=this.world.player,g=this.world.game,R=this.world.room;
    this.st+=dt;const dd=p.cx-this.cx,ad=Math.abs(dd);
    switch(this.state){
      case 'idle':
        this.face=dd>0?1:-1;
        this.vx=damp(this.vx,this.face*(ad>5?2.2:0.5),3,dt);
        this.cd-=dt;
        if(this.cd<=0){const r=Math.random();
          if(this.phase===1){if(ad<6.5)this.setState(r<0.62?'slamWind':'sweepWind');else this.setState(r<0.6?'chargeWind':'slamWind');}
          else{if(ad<6.5)this.setState(r<0.5?'slamWind':'sweepWind');else this.setState(r<0.55?'grab':'chargeWind');}
          if(this.state==='chargeWind'){this.chargeDir=this.face;g.audio.elevator();}}
        break;
      case 'sweepWind':
        this.vx=damp(this.vx,0,6,dt);
        if(this.st>0.75){g.audio.melee();g.camera.addShake(0.5);
          const hb={x:this.cx+(this.face>0?0:-6),y:this.y-0.6,w:6,h:this.h+1.2};
          if(aabb(hb,p.rect()))this.damagePlayer();
          g.particles.burst(this.cx+this.face*4,this.bottom-0.4,22,{kind:'spark',col:'#ff9c4a',spd:9,life:0.5,size:0.07,add:true,g:22});
          this.setState('sweep');}
        break;
      case 'sweep':
        this.vx=damp(this.vx,this.face*3.4,3,dt);
        if(this.st>0.45){this.setState('idle');this.cd=0.9+Math.random()*0.5;}
        break;
      case 'slamWind':
        this.vx=damp(this.vx,0,7,dt);
        if(this.st>0.9){
          /* крюки в пол: удар перед собой + две ударные волны по полу (перепрыгнуть) */
          const ix=this.cx+this.face*2.8;
          g.audio.explosion();g.camera.addShake(1.0);g.hitstop(0.06);
          if(aabb({x:ix-1.8,y:this.bottom-2.4,w:3.6,h:2.4},p.rect()))this.damagePlayer();
          for(const s of [-1,1])this.world.projectiles.push({x:ix+s*1.4,y:this.bottom-0.4,vx:s*8,vy:0,r:0.45,dmg:1,life:2.6,kind:'wave'});
          g.particles.burst(ix,this.bottom,30,{kind:'debris',col:'#8a7a6a',spd:8,life:0.9,size:0.14,g:30});
          this.setState(this.phase===1?'stuck':'recover');
}
        break;
      case 'stuck':
        this.vx=damp(this.vx,0,12,dt);
        if(Math.random()<0.3)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*2,y:this.y+0.6,vx:0,vy:-2,life:0.8,size:0.3,grow:0.6,col:'#e8e0d0',drag:1});
        if(this.st>1.9){this.setState('idle');this.cd=1.1;}
        break;
      case 'recover':
        this.vx=damp(this.vx,0,8,dt);if(this.st>0.6){this.setState('idle');this.cd=0.9;}
        break;
      case 'chargeWind':
        this.vx=damp(this.vx,-this.chargeDir*1.0,4,dt);
        if(Math.random()<0.6)g.particles.spawn({kind:'smoke',x:this.cx-this.chargeDir*2.4,y:this.bottom-0.4,vx:-this.chargeDir*2,vy:-1,life:1,size:0.5,grow:1,col:'#3a322a',drag:1});
        if(this.st>1.1){this.setState('charge');g.audio.dash();}
        break;
      case 'charge':
        this.vx=this.chargeDir*12;this.face=this.chargeDir;
        if(aabb(this.rect(),p.rect()))this.damagePlayer();
        if(Math.random()<0.6)g.particles.spawn({kind:'dust',x:this.cx-this.chargeDir*2.4,y:this.bottom,vx:-this.chargeDir*3,vy:-1.4,life:0.6,size:0.2,col:'#7a6c5c',g:4});
        if(this.wall!==0||this.x<=0.05||this.x+this.w>=R.w-0.05){
          g.audio.explosion();g.camera.addShake(1.3);g.hitstop(0.1);this.vx=0;
          g.particles.burst(this.cx+this.chargeDir*2.6,this.cy,30,{kind:'debris',col:'#6b5a44',spd:9,life:1,size:0.16,g:26});
          this.setState('stunWall');
}
        else if(this.st>3.5)this.setState('idle');
        break;
      case 'stunWall':
        this.vx=0;
        if(Math.random()<0.25)g.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*3,y:this.y-0.2,vx:0,vy:-1,life:0.5,size:0.05,col:'#ffe6a3',add:true});
        if(this.st>1.7){this.setState('idle');this.cd=1.0;}
        break;
      case 'grab':
        this.vx=damp(this.vx,0,6,dt);
        if(this.st<0.6&&!p.dead){
          const dx=this.cx-p.cx,dy=this.cy-p.cy,d=Math.hypot(dx,dy)||1;
          p.vx+=dx/d*26*dt;p.vy+=dy/d*20*dt;p.grabbed=0.1;
          g.particles.spawn({kind:'spark',x:p.cx+(Math.random()-0.5),y:p.cy,vx:dx/d*4,vy:dy/d*4,col:'#c8452f',life:0.25,size:0.05,add:true});
        }else if(this.st>1.1){this.setState('idle');this.cd=1.0;}
        break;
    }
    this.tread+=this.vx*dt*1.4;
    if(Math.random()<0.12)g.particles.spawn({kind:'smoke',x:this.cx-this.w*0.3,y:this.y+this.h*0.1,
      vx:-0.4,vy:-1.4,life:2.2,size:0.4,grow:0.7,col:'#2f2a24',drag:1.1});
  }
  draw(c,t){
    const w=this.w,h=this.h,s=this.state,k=s==='sweepWind'?clamp(this.st/0.75,0,1):s==='slamWind'?clamp(this.st/0.9,0,1)
      :s==='sweep'?clamp(this.st/0.45,0,1):s==='grab'?clamp(this.st/0.6,0,1):0;
    const hot=s==='chargeWind'||s==='charge';
    c.fillStyle='#22262a';rr(c,-w/2,-0.9,w,0.9,0.2);c.fill();
    for(let i=0;i<8;i++){const x=-w/2+0.3+((i*0.62+Math.abs(this.tread)*0.62)%(w-0.6));
      c.fillStyle=hot?'#5a2a1e':'#2f353a';rr(c,x,-0.82,0.34,0.74,0.1);c.fill();}
    const g=c.createLinearGradient(0,-h,0,-0.8);
    g.addColorStop(0,'#6b5a44');g.addColorStop(.4,'#4e4234');g.addColorStop(1,'#2b251e');
    c.fillStyle=g;rr(c,-w*0.36,-h,w*0.72,h-0.8,0.24);c.fill();
    c.save();rr(c,-w*0.36,-h,w*0.72,h-0.8,0.24);c.clip();
    c.fillStyle=PAT(c,'rust');c.globalAlpha=0.3;c.fillRect(-w,-h,w*2,h*2);c.restore();
    const open=this.vuln();
    if(open){
      /* кабина раскрыта: ядро-котёл светится — сюда бить */
      const p=0.5+0.5*Math.sin(t*10);
      c.fillStyle='#120a06';rr(c,-w*0.26,-h*0.96,w*0.52,h*0.4,0.12);c.fill();
      const cg=c.createRadialGradient(0,-h*0.76,0,0,-h*0.76,w*0.24);
      cg.addColorStop(0,'rgba(255,240,200,1)');cg.addColorStop(.4,'rgba(255,150,60,.95)');cg.addColorStop(1,'rgba(200,60,20,.2)');
      c.fillStyle=cg;c.beginPath();c.arc(0,-h*0.76,w*0.2+p*0.06,0,TAU);c.fill();
      game.renderer.glowAdd(this.cx,this.bottom-h*0.76,1.6,'#ffb45a',0.6+0.3*p);
      c.fillStyle='#3a3129';c.save();c.translate(-w*0.3,-h*0.9);c.rotate(-0.5);c.fillRect(-0.1,0,0.9,0.18);c.restore();
      c.save();c.translate(w*0.3,-h*0.9);c.rotate(0.5);c.fillRect(-0.8,0,0.9,0.18);c.restore();
    }else{
      c.fillStyle='#1a2226';rr(c,-w*0.24,-h*0.94,w*0.48,h*0.34,0.12);c.fill();
      c.strokeStyle='#8a6d2a';c.lineWidth=0.09;c.strokeRect(-w*0.24,-h*0.94,w*0.48,h*0.34);
      const eye=(s==='sweepWind'||s==='slamWind'||hot)?1:0.5+0.2*Math.sin(t*3);
      c.fillStyle=rgba('#ff3b22',eye);
      c.beginPath();c.arc(-w*0.1,-h*0.8,0.13,0,TAU);c.arc(w*0.1,-h*0.8,0.13,0,TAU);c.fill();
      game.renderer.glowAdd(this.cx,this.bottom-h*0.8,0.9,'#ff3b22',0.4);
    }
    for(let i=0;i<8;i++)Kit.bolt(c,-w*0.32+i*w*0.09,-h*0.56,0.06);
    Kit.hazardTape(c,-w*0.36,-1.3,w*0.72,0.28);
    if(this.phase>=2){c.strokeStyle='rgba(201,162,39,.7)';c.lineWidth=0.08;rr(c,-w*0.37,-h*1.01,w*0.74,h-0.75,0.26);c.stroke();}
    const arm=side=>{
      let a;
      if(s==='stuck'||s==='recover')a=side*1.35;
      else if(s==='slamWind')a=side*(-0.5-1.0*k);
      else if(s==='sweepWind')a=side*(-0.5+1.1*k);
      else if(s==='sweep')a=side*(0.6-2.0*k);
      else if(s==='chargeWind'||s==='charge')a=side*0.2;
      else if(s==='grab')a=side*(0.1+0.6*k);
      else if(s==='stunWall')a=side*(0.9+0.1*Math.sin(t*20));
      else a=side*-0.5+Math.sin(t*1.4+side)*0.06;
      c.save();c.translate(side*w*0.3,-h*0.72);c.rotate(a);
      c.strokeStyle='#4a4238';c.lineWidth=0.3;c.lineCap='round';
      c.beginPath();c.moveTo(0,0);c.lineTo(side*2.0,0.2);c.stroke();
      c.save();c.translate(side*2.0,0.2);c.rotate(side*0.6);
      c.strokeStyle='#8a8172';c.lineWidth=0.18;
      c.beginPath();c.moveTo(0,0);c.lineTo(side*0.7,0.2);c.arc(side*0.7,0.55,0.35,PI*1.5,PI*0.8,true);c.stroke();
      if(s==='sweepWind'||s==='slamWind'||s==='grab'){
        c.strokeStyle=rgba('#ff3b22',0.4+0.4*Math.sin(t*14));c.lineWidth=0.1;
        c.beginPath();c.arc(side*0.7,0.4,0.62,0,TAU);c.stroke();}
      c.restore();c.restore();};
    arm(1);arm(-1);
    if(s==='stunWall')for(let i=0;i<3;i++){const a=t*4+i*2.1;
      c.fillStyle='#ffe6a3';c.beginPath();c.arc(Math.cos(a)*1.2,-h-0.5+Math.sin(a)*0.25,0.09,0,TAU);c.fill();}
  }
}
class Primarch extends Boss{
  constructor(world,x,y){
    super(world,{type:'primarch',w:3.2,h:3.4,hp:150,dmg:1,aggro:40,blood:'#8a6d3b',phaseAt:[0.5]},x,y);
    this.name='ЦЕНЗОР-ПРИМАРХ';this.walk=0;this.behindT=0;this.tank=true;this.tankHits=0;this.jt=0;this.turnT=0;
    this.tankCd=0;this.stunHits=0;}
  nudge(){return 'НА СПИНЕ У НЕГО — БАЛЛОН. КАК У ЦЕНЗОРОВ.';}
  /* в оглушении — не больше двух полноценных ударов: на втором он стряхивает оцепенение паром */
  hurt(dmg,kx,ky,raw){const was=this.hp;super.hurt(dmg,kx,ky,raw);
    if(!this.dead&&this.state==='stun'&&was-this.hp>4){this.stunHits++;if(this.stunHits>=2)this.shrug();}}
  shrug(){const g=this.world.game,p=this.world.player;
    this.setState('recover');this.tankCd=4.0;this.stunHits=0;g.audio.bossRoar();g.camera.addShake(0.8);
    g.particles.burst(this.cx,this.cy,36,{kind:'steam',col:'#efe8dc',spd:9,life:0.9,size:0.5,grow:1.4,drag:1.6});
    if(Math.abs(p.cx-this.cx)<4.4&&Math.abs(p.cy-this.cy)<3.4){p.vx=Math.sign(p.cx-this.cx||1)*15;p.vy=-9;}}
  armor(){return this.state==='stun'?0.85:0.1;}
  safe(){return this.state==='stun';}
  armorMsg(){return 'ЛОБОВАЯ БРОНЯ. ЗАЙДИ СО СПИНЫ — С КОЛОННЫ ЧЕРЕЗ НЕГО ИЛИ РЫВКОМ СКВОЗЬ — И ИМПУЛЬСОМ ПО БАЛЛОНУ.';}
  threat(){return ['slamWind','breathWind','breath','chargeWind','charge'].indexOf(this.state)>=0;}
  behind(px){return Math.sign(px-this.cx)===-this.face;}
  /* импульс со спины вскрывает баллон сразу, удары со спины — за два */
  onPulse(p){if(this.tank&&this.state!=='stun'&&this.behind(p.cx)){this.popTank();return true;}return false;}
  onMelee(p){if(this.tank&&this.state!=='stun'&&this.behind(p.cx)){
      this.tankHits++;const g=this.world.game;g.audio.hitMetal();this.flash=0.1;
      g.particles.burst(this.cx-this.face*1.6,this.cy-0.4,12,{kind:'steam',col:'#e8e0d0',spd:3,life:0.6,size:0.3,grow:0.6,drag:2});
      if(this.tankHits>=2)this.popTank();return true;}return false;}
  popTank(){
    const g=this.world.game;this.tank=false;this.tankHits=0;this.setState('stun');this.vx=0;
    this.stunHits=0;g.audio.explosion();g.camera.addShake(0.9);g.hitstop(0.12);g.tutorial.notify('ptank');
    g.particles.burst(this.cx-this.face*1.6,this.cy-0.6,40,{kind:'steam',col:'#e8e0d0',spd:6,life:1.6,size:0.6,grow:1.6,drag:1.6});
    g.particles.burst(this.cx-this.face*1.6,this.cy-0.6,20,{kind:'spark',col:'#ffd27a',spd:9,life:0.6,size:0.06,add:true,g:20});
  }
  onPhase(n){
    const g=this.world.game;
    g.audio.bossRoar();g.camera.addShake(1.2);g.hitstop(0.18);
    /* фаза II всегда с половины: перелёт урона не съедает её */
    this.hp=Math.max(this.hp,this.maxHp*0.5);if(this.state==='stun')this.shrug();
  }
  ai(dt){
    const p=this.world.player,g=this.world.game,R=this.world.room;
    this.st+=dt;const dd=p.cx-this.cx,ad=Math.abs(dd);
    /* баллон перезаряжается не сразу: окно надо заработать заново */
    if(!this.tank&&this.state!=='stun'){this.tankCd-=dt;if(this.tankCd<=0){this.tank=true;
      g.particles.burst(this.cx-this.face*1.6,this.cy-0.6,12,{kind:'spark',col:'#c8452f',spd:4,life:0.5,size:0.05,add:true});}}
    /* фаза II: пар из-под колонн по циклу (красное предупреждение → удар) */
    const vents=R.hazards.filter(h=>h.ctl==='primarch');
    if(this.phase>=2){this.jt+=dt;const cyc=this.jt%3.6;
      for(const h of vents){h.warn=cyc>1.6&&cyc<2.3;h.active=cyc>=2.3&&cyc<3.3;
        if(h.active&&Math.random()<0.6)g.particles.spawn({kind:'steam',x:h.x+Math.random()*h.w,y:h.y+h.h,
          vx:(Math.random()-0.5)*1.4,vy:-9-Math.random()*5,life:0.9,size:0.5,grow:1.4,col:'#e8e0d0',drag:0.8});}}
    else for(const h of vents){h.warn=false;h.active=false;}
    switch(this.state){
      case 'idle':{
        /* медленный разворот: зайти за спину — реальное окно */
        if(this.behind(p.cx)){this.behindT+=dt;if(this.behindT>(this.phase>=2?0.55:0.85)){this.face=-this.face;this.behindT=0;this.turnT=0.3;}}
        else this.behindT=0;
        const spd=this.phase>=2?2.4:1.6;
        this.vx=damp(this.vx,this.behind(p.cx)?0:this.face*(ad>3?spd:0),2.2,dt);
        this.cd-=dt;
        if(this.cd<=0&&!this.behind(p.cx)){const r=Math.random();
          if(ad<4.5)this.setState(r<0.65?'slamWind':'breathWind');
          else if(this.phase>=2&&r<0.5)this.setState('chargeWind');
          else this.setState(ad<7?'breathWind':'slamWind');}
        break;}
      case 'slamWind':
        this.vx=damp(this.vx,0,7,dt);
        if(this.st>0.9){g.audio.explosion();g.camera.addShake(0.9);
          const hb={x:this.face>0?this.cx-0.5:this.cx-4.5,y:this.y-0.4,w:5,h:this.h+0.8};
          if(aabb(hb,p.rect()))this.damagePlayer();
          g.particles.burst(this.cx+this.face*3,this.bottom,26,{kind:'debris',col:'#8a7a6a',spd:8,life:0.9,size:0.14,g:30});
          this.world.projectiles.push({x:this.cx+this.face*2.4,y:this.bottom-0.4,vx:this.face*9,vy:0,r:0.45,dmg:1,life:2.2,kind:'wave'});
          this.setState('recover');}
        break;
      case 'breathWind':
        this.vx=damp(this.vx,0,7,dt);
        if(this.st>0.7)this.setState('breath');
        break;
      case 'breath':{
        const hb={x:this.face>0?this.cx+1:this.cx-7,y:this.y+0.2,w:6,h:2.4};
        if(aabb(hb,p.rect()))this.damagePlayer();
        if(Math.random()<0.9)g.particles.spawn({kind:'steam',x:this.cx+this.face*1.4,y:this.y+1,vx:this.face*(9+Math.random()*4),
          vy:(Math.random()-0.5)*2,life:0.6,size:0.4,grow:1.4,col:'#efe8dc',drag:1.2});
        if(this.st>1.1)this.setState('recover');
        break;}
      case 'chargeWind':
        this.vx=damp(this.vx,0,6,dt);if(this.st>0.6){this.setState('charge');g.audio.dash();}
        break;
      case 'charge':
        this.vx=this.face*9;
        if(aabb(this.rect(),p.rect()))this.damagePlayer();
        if(this.wall!==0||this.st>2.0)this.setState('recover');
        break;
      case 'recover':
        this.vx=damp(this.vx,0,6,dt);if(this.st>0.7){this.setState('idle');this.cd=0.8+Math.random()*0.6;}
        break;
      case 'stun':
        this.vx=damp(this.vx,0,8,dt);
        if(Math.random()<0.35)g.particles.spawn({kind:'steam',x:this.cx-this.face*1.4,y:this.cy-0.4,vx:-this.face*1.5,vy:-1.5,life:1.0,size:0.4,grow:0.8,col:'#cfc9b8',drag:1.2});
        if(this.st>2.2){this.setState('idle');this.cd=0.8;this.tankCd=3.5;this.stunHits=0;
          g.particles.burst(this.cx-this.face*1.6,this.cy-0.6,12,{kind:'spark',col:'#c8452f',spd:4,life:0.5,size:0.05,add:true});}
        break;
    }
    this.walk+=this.vx*dt;
  }
  draw(c,t){
    const w=this.w,h=this.h,s=this.state,stun=s==='stun';
    c.strokeStyle='#6d5416';c.lineWidth=0.34;c.lineCap='round';
    for(let i=0;i<2;i++){const ph=this.walk*1.2+i*PI;
      c.beginPath();c.moveTo((i?0.5:-0.5),-h*0.42);c.lineTo((i?0.5:-0.5)+Math.sin(ph)*0.3,-h*0.18);c.lineTo((i?0.5:-0.5)+Math.sin(ph)*0.4,0);c.stroke();}
    const g=c.createLinearGradient(-w/2,-h,w/2,0);
    g.addColorStop(0,'#e0bd55');g.addColorStop(.3,'#b08d3e');g.addColorStop(.65,'#7d6120');g.addColorStop(1,'#3d3010');
    c.fillStyle=g;rr(c,-w*0.44,-h*0.92,w*0.88,h*0.55,0.26);c.fill();
    c.save();rr(c,-w*0.44,-h*0.92,w*0.88,h*0.55,0.26);c.clip();
    c.fillStyle=PAT(c,'rust');c.globalAlpha=0.2;c.fillRect(-w,-h,w*2,h*2);c.restore();
    for(let i=0;i<6;i++)Kit.bolt(c,-w*0.36+i*w*0.14,-h*0.86,0.07);
    /* баллон на спине (локальная левая сторона = спина): красный, когда цел — «вот слабое место» */
    c.save();c.translate(-w*0.52,-h*0.82);
    if(this.tank){const p=0.5+0.5*Math.sin(t*4);
      const bg=c.createLinearGradient(-0.3,0,0.3,0);bg.addColorStop(0,'#5c646b');bg.addColorStop(.45,'#9aa2a9');bg.addColorStop(1,'#3a4046');
      c.fillStyle=bg;rr(c,-0.34,0,0.62,h*0.5,0.22);c.fill();
      c.fillStyle='#8a6d2a';c.fillRect(-0.34,0.1,0.62,0.1);c.fillRect(-0.34,h*0.36,0.62,0.1);
      c.fillStyle=rgba('#c8452f',0.3+0.35*p);c.beginPath();c.arc(-0.03,h*0.25,0.55,0,TAU);c.fill();
      c.strokeStyle=rgba('#e8c96a',0.85);c.lineWidth=0.06;c.beginPath();c.arc(-0.03,h*0.25,0.36,0,TAU);c.stroke();
      game.renderer.glowAdd(this.cx-this.face*w*0.52,this.bottom-h*0.82+h*0.25,0.8,'#c8452f',0.35+0.25*p);
    }else{c.fillStyle='#2b3035';rr(c,-0.3,0,0.54,h*0.36,0.16);c.fill();}
    c.restore();
    c.save();c.translate(0,-h*0.95);
    c.fillStyle='#8a6d2a';c.beginPath();c.arc(0,0,w*0.34,PI,0);c.fill();
    const dg=c.createRadialGradient(-w*0.1,-w*0.12,0,0,0,w*0.34);
    dg.addColorStop(0,'rgba(220,240,250,.5)');dg.addColorStop(1,'rgba(90,120,140,.15)');
    c.fillStyle=dg;c.beginPath();c.arc(0,0,w*0.3,PI,0);c.fill();
    c.fillStyle=rgba(stun?'#69d68f':(this.threat()?'#ff3b22':'#c8452f'),0.9);c.beginPath();c.arc(w*0.06,-w*0.1,0.11,0,TAU);c.fill();
    c.restore();
    const wind=s==='slamWind'?clamp(this.st/0.9,0,1):0,slam=s==='recover'?clamp(1-this.st/0.7,0,1):0;
    c.save();c.translate(w*0.36,-h*0.7);c.rotate(stun?0.9:(-0.5+wind*1.4-slam*1.6));
    c.strokeStyle='#7d6120';c.lineWidth=0.3;c.beginPath();c.moveTo(0,0);c.lineTo(1.5,0.3);c.stroke();
    c.fillStyle='#b08d3e';
    c.beginPath();c.moveTo(1.5,0.0);c.lineTo(2.3,-0.4);c.lineTo(2.2,0.1);c.closePath();c.fill();
    c.beginPath();c.moveTo(1.5,0.5);c.lineTo(2.3,0.9);c.lineTo(2.2,0.4);c.closePath();c.fill();
    if(wind>0.3){c.strokeStyle=rgba('#ff3b22',wind);c.lineWidth=0.12;c.beginPath();c.arc(1.9,0.3,1.0,-1.0,1.0);c.stroke();}
    c.restore();
    if(s==='breathWind'||s==='breath'){const k=s==='breath'?1:clamp(this.st/0.7,0,1);
      c.fillStyle=rgba('#ff5a2a',0.25+0.4*k);c.beginPath();c.arc(w*0.34,-h*0.95,0.28,0,TAU);c.fill();}
    if(stun)for(let i=0;i<3;i++){const a=t*4+i*2.1;
      c.fillStyle='#ffe6a3';c.beginPath();c.arc(Math.cos(a)*0.9,-h*1.15+Math.sin(a)*0.2,0.08,0,TAU);c.fill();}
  }
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
