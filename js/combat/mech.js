"use strict";
/* ============================== MECH ==============================
   Механизм — враг, собранный из узлов. Его жизнь — корпус (hp); узлы — системы.
     Melee  — ЧТО я ломаю: урон по узлу под ударом (или по корпусу, если узла нет).
     Pulse  — ГДЕ противник: импульс без урона по массе; в окно телеграфа — прерывание атаки.
     Dash   — ГДЕ я: проход сквозь механизм ставит след на повреждённом узле → следующий удар ломает.
   Удар о стену после импульса: оглушение, а с разгона от импульса — прижатие (броня ломается).
   Подкласс задаёт узлы, позу (lx/ly узлов), ИИ атак (с телеграфом), onBreak/onInterrupt/onPin,
   рисунок и обломки своих деталей (partDebris / corpseDebris). */
class Mech extends Enemy{
  constructor(world,def,x,y){
    super(world,def,x,y);
    this.isMech=true;this.nodes=[];this.mass=def.mass||1;
    this.bodyArmor=def.bodyArmor===undefined?CFG.combat.bodyArmor:def.bodyArmor;this.bodyMat=def.bodyMat||'iron';
    this.state='idle';this.st=0;this.knockT=0;this.stunT=0;this.pinT=0;this.pinSide=0;this.openT=0;
    this.token=false;this.cd=0.9+Math.random()*0.7;this.lastImp=null;this.slamCd=0;
    this.walk=0;this.recoil=0;this.recoilDir=0;this.flying=!!def.flying;this.turnT=0;
  }
  /* сложность: узлы крепче/слабее (на всех механизмах, боссах тоже) */
  addNode(o){const n=new Node(Object.assign({},o,{hp:(o.hp||40)*Settings.diff().node}));n.owner=this;this.nodes.push(n);return n;}
  /* границы попадания: корпус + узлы, вынесенные за него (стрелы, факел) — удар по выступающей детали засчитывается */
  hitBounds(){let x0=this.x,y0=this.y,x1=this.x+this.w,y1=this.y+this.h;
    for(const n of this.nodes){if(n.broken||n.hidden||n.locked)continue;
      x0=Math.min(x0,n.wx-n.r);x1=Math.max(x1,n.wx+n.r);y0=Math.min(y0,n.wy-n.r);y1=Math.max(y1,n.wy+n.r);}
    return {x:x0,y:y0,w:x1-x0,h:y1-y0};}
  node(id){for(const n of this.nodes)if(n.id===id)return n;return null;}
  has(id){const n=this.node(id);return !!n&&!n.broken;}
  /* --- общие состояния --- */
  safe(){return this.stunT>0||this.pinT>0||this.openT>0;}
  threat(){for(const n of this.nodes)if(n.teleHot)return true;return this.state==='strike';}
  isWinding(){return this.state==='wind';}
  canPin(){return this.mass<=2;}
  attackUses(n){return true;}
  /* --- очередь атак: механизмы бьют по одному --- */
  wantAttack(){return this.world.game.combat.requestToken(this);}
  releaseToken(){this.world.game.combat.releaseToken(this);}
  cancelAttack(){this.releaseToken();for(const n of this.nodes){n.tele=0;n.teleHot=false;}
    if(this.state==='wind'||this.state==='strike'){this.state='recover';this.st=0;}}
  /* узел телеграфирует: k — прогресс замаха 0..1; последние hot секунд — окно прерывания.
     red — НЕСРЫВАЕМАЯ атака (таран, прыжок, звон): красное кольцо, импульс её не берёт — ответ только рывок */
  telegraph(n,k,hot,red){if(!n||n.broken)return;n.tele=clamp(k,0,1);n.teleHot=!!hot;n.red=!!red;}
  /* --- цикл --- */
  update(dt){
    this.t+=dt;if(this.flash>0)this.flash-=dt;
    for(const n of this.nodes){if(n.exT>0)n.exT-=dt;if(n.markT>0)n.markT-=dt;if(n.hitT>0)n.hitT-=dt;n.tele=0;n.teleHot=false;n.red=false;}
    if(this.recoil>0)this.recoil=Math.max(0,this.recoil-dt*5);
    if(this.squash>0)this.squash=Math.max(0,this.squash-dt*7);
    if(this.slamCd>0)this.slamCd-=dt;
    if(this.dead){this.deadT+=dt;return;}
    if(this.pinT>0){this.pinT-=dt;this.vx=0;this.vy=0;
      if(Math.random()<dt*14)this.world.game.particles.spawn({kind:'dust',x:this.cx+this.pinSide*this.w*0.5,y:this.cy+(Math.random()-0.5)*this.h,
        vx:-this.pinSide*1.5,vy:-0.5,life:0.6,size:0.08,col:'#8a7a6a',g:6});
      if(this.pinT<=0){this.vx=-this.pinSide*2.5;this.knockT=0.25;this.onUnpin();}}
    else if(this.stunT>0){this.stunT-=dt;if(this.onGround)this.vx=damp(this.vx,0,7,dt);if(this.stunT<=0)this.onStunEnd();}
    else if(this.knockT>0){this.knockT-=dt;if(this.onGround)this.vx=damp(this.vx,0,this.fric||6,dt);}
    else if(this.openT>0){this.openT-=dt;this.vx=damp(this.vx,0,5,dt);if(this.openT<=0){this.state='recover';this.st=0;this.cd=Math.max(this.cd,0.5);}}
    /* замах: на «легко» тянется дольше, на «сложно» — короче */
    else this.ai(this.isWinding()?dt*(this.tierW||1)/Settings.diff().windup:dt);
    this.physics(dt);
    this.pose(dt);
    for(const n of this.nodes){n.wx=this.cx+this.face*n.lx;n.wy=this.bottom+n.ly;}
    this.nodeEmit(dt);
  }
  ai(dt){}
  pose(dt){}
  physics(dt){
    if(!this.flying){this.vy+=CFG.gravity*dt;this.vy=clamp(this.vy,-40,CFG.player.maxFall);}
    const vx0=this.vx,vy0=this.vy;
    moveBody(this,dt,this.world.room.solids);
    const imp=this.lastImp,fresh=imp&&this.world.time-imp.t<0.6;
    if(fresh&&this.slamCd<=0&&!this.dead){
      if(this.wall!==0&&Math.abs(vx0)>CFG.combat.slamSpeed)this.slam(Math.abs(vx0),this.wall,imp);
      else if(this.ceilHit&&vy0<-CFG.combat.slamSpeed)this.slam(Math.abs(vy0),0,imp);
    }
  }
  /* искры и дым из повреждённых узлов — из конкретной точки, не «вообще» */
  nodeEmit(dt){
    const g=this.world.game;
    for(const n of this.nodes){
      if(n.broken){if(n.stump!==false&&Math.random()<dt*3)g.particles.spawn({kind:'smoke',x:n.wx,y:n.wy,vx:(Math.random()-0.5)*0.4,vy:-0.8,
        life:1.2,size:0.16,grow:0.5,col:'#2c2824',drag:0.8,a:0.45});
        if(n.stump!==false&&Math.random()<dt*2.2)g.particles.burst(n.wx,n.wy,3,{kind:'spark',col:'#ffcf7a',spd:3,life:0.3,size:0.035,add:true,g:14});
        continue;}
      if(!n.damaged)continue;
      n.fxT-=dt;
      if(n.fxT<=0){n.fxT=0.25+Math.random()*0.7;
        g.particles.burst(n.wx+(Math.random()-0.5)*n.r,n.wy+(Math.random()-0.5)*n.r,2+((Math.random()*3)|0),
          {kind:'spark',col:n.mat==='glass'?'#cfe6ff':'#ffd27a',spd:3,life:0.3,size:0.035,add:true,g:14});
        if(Math.random()<0.5)g.particles.spawn({kind:'smoke',x:n.wx,y:n.wy,vx:(Math.random()-0.5)*0.3,vy:-0.6,life:1,size:0.12,grow:0.4,col:'#3a342c',drag:0.8,a:0.35});}
    }
  }
  /* --- импульс --- */
  impulse(vx,vy,src){
    if(this.dead)return;
    this.vx+=vx;this.vy+=vy;
    this.knockT=Math.max(this.knockT,0.32+Math.min(0.3,Math.hypot(vx,vy)*0.012));
    this.lastImp={src,t:this.world.time};
  }
  /* импульс резака: ни единицы урона — только позиция, траектория и срыв замаха */
  applyPulse(p,dir,pw){
    const C=CFG.combat;if(this.dead)return;pw=pw||1;
    const tn=this.nodes.find(n=>n.teleHot&&!n.broken&&!n.red),red=this.nodes.some(n=>n.red&&n.tele>0);
    if(tn)this.interrupt(tn,p);
    else if(red)this.world.game.fx.redDeny(this.cx,this.cy);
    const m=this.mass;
    if(m>=3){this.vx+=dir*C.pulseImpulse*0.22*pw;this.knockT=Math.max(this.knockT,0.28);this.lastImp={src:'pulse',t:this.world.time};
      this.recoil=1;this.recoilDir=dir;}
    else this.impulse(dir*C.pulseImpulse*pw/m,-C.pulseLift/Math.max(1,m),'pulse');
    if(!tn&&!red&&this.isWinding())this.cancelAttack();
    this.alert=6;
  }
  /* рывок сквозь механизм: толкает лёгких и средних, след ставит на выходе (Combat.update) */
  dashShove(p){if(this.mass<2&&!this.dead){this.impulse(p.face*CFG.combat.dashShove/this.mass,-1.5,'dash');}}
  dashMark(p){
    const C=CFG.combat;let any=false;
    for(const n of this.nodes){
      if(n.broken||n.locked||n.hidden||n.core)continue;
      if(!(n.damaged||n.exT>0))continue;
      if(Math.abs(n.wy-p.cy)>1.4)continue;
      n.markT=C.markT*(this.world.game.gs.mod('mark_long')?1.8:1);n.markA=(Math.random()-0.5)*0.6;any=true;}
    if(any)this.world.game.fx.mark(this.cx,this.cy);
    return any;
  }
  /* прерывание: атака сорвана, узел повреждён и вскрыт, у механизма — окно уязвимости */
  interrupt(n,p){
    const C=CFG.combat,g=this.world.game;
    this.cancelAttack();
    n.hp=Math.min(n.hp,n.max*(C.damagedAt-0.08));n.exT=Math.max(n.exT,C.interruptOpen+0.2);n.hitT=0.22;
    this.openT=C.interruptOpen*(g.gs.mod('stun_long')?1.4:1);
    if(g.gs.mod('weld_parry'))g.combat.gainWeld(18);   /* ОТРАЖАТЕЛЬ: шов — из сорванного замаха */this.state='open';this.st=0;
    g.fx.interrupt(n.wx,n.wy,n.mat,this.isBoss);
    /* срыв замаха — давление в резаке перегревается: запас на разрыв или аварийный импульс */
    if(p&&p.gainHeat)p.gainHeat(1,n.wx,n.wy);
    this.onInterrupt(n,p);
  }
  slam(speed,side,imp){
    const C=CFG.combat,g=this.world.game;this.slamCd=0.7;
    const back=side!==0&&side===-this.face;
    if(imp.src==='pulse'&&speed>=C.pinSpeed&&side!==0&&this.canPin()){
      this.pinT=C.pinT;this.pinSide=side;this.vx=0;this.vy=0;this.cancelAttack();this.state='pinned';
      for(const n of this.nodes)if(!n.broken&&!n.locked&&!n.core)n.exT=Math.max(n.exT,C.pinT+0.35);
      g.fx.pin(this.cx+side*this.w*0.5,this.cy,this.bodyMat);
      this.onPin(back);
    }else{
      this.stunT=Math.max(this.stunT,C.slamStunT);this.cancelAttack();
      g.fx.slam(this.cx+side*this.w*0.5,this.cy,this.bodyMat,speed);
      this.onSlam(back,speed);
    }
  }
  /* --- урон: удар ищет узел под собой, иначе бьёт корпус --- */
  takeHit(h){
    if(this.dead)return null;
    const behind=Math.sign(h.fromX-this.cx)===-this.face;
    let best=null,bs=1e9;
    for(const n of this.nodes){
      if(n.broken||n.locked||n.hidden)continue;
      /* баллон на спине с фронта недоступен — удар уходит в корпус (броня-«щит» — только узлы с deflect) */
      if(n.exT<=0&&!n.deflect&&((n.backOnly&&!behind)||(n.frontOnly&&behind)))continue;
      const nx=clamp(n.wx,h.hb.x,h.hb.x+h.hb.w),ny=clamp(n.wy,h.hb.y,h.hb.y+h.hb.h);
      if(Math.hypot(nx-n.wx,ny-n.wy)>n.r)continue;
      /* линия взмаха: боковой удар бьёт то, что на высоте ключа и ближе; вверх/вниз — по вертикали */
      let s;
      if(h.sd==='side')s=Math.abs(n.wy-h.sy)+Math.abs(n.wx-(h.fromX+h.dir*0.7))*0.35;
      else if(h.sd==='up'||h.sd==='down')s=Math.abs(n.wx-h.fromX)+Math.abs(n.wy-h.sy)*0.35;
      else s=Math.hypot(n.wx-h.sx,n.wy-h.sy);
      if(n.exT>0)s-=1.5;if(n.markT>0)s-=3;
      if(((n.backOnly&&!behind)||(n.frontOnly&&behind))&&n.exT<=0)s+=2.5;
      if(s<bs){bs=s;best=n;}
    }
    return best?this.hitNode(best,h,behind):this.hitBody(h);
  }
  hitNode(n,h,behind){
    const C=CFG.combat,g=this.world.game;
    /* РАЗРЫВ (заряженный удар на перегреве): узел ломается сразу — даже бронированный в лоб; ядро — тройной урон */
    if(h.rupture&&!n.core){g.fx.rupture(n.wx,n.wy,n.mat);this.breakNode(n,h,true);return 'break';}
    if(n.exT<=0&&n.deflect&&!(n.backOnly&&behind)&&!(n.frontOnly&&!behind)){
      n.hitT=0.08;g.fx.deflect(n.wx,n.wy,n.mat);this.react(h,0.35);return 'deflect';}
    if(n.markT>0&&!n.core){n.markT=0;this.breakNode(n,h,true);return 'break';}
    if(h.rupture&&n.core)g.fx.rupture(n.wx,n.wy,n.mat);
    const d=h.dmg*(n.exT>0?C.exposedMul:n.armor)*(h.heavy?C.heavyNodeMul:1)*(h.bonus?C.bonusMul:1)*(h.rupture&&n.core?3:1);
    const was=n.damaged;
    n.hp-=d;n.hitT=0.16;
    this.hp-=n.core?d:d*C.nodeLeak;
    if(n.hp<=0){this.breakNode(n,h,false);return 'break';}
    g.fx.nodeHit(n.wx,n.wy,n.mat,h,!was&&n.damaged,this.isBoss);
    this.react(h,1);
    if(this.hp<=0){this.die(h);return 'kill';}
    return 'node';
  }
  hitBody(h){
    const C=CFG.combat,g=this.world.game;
    const open=this.openT>0||this.pinT>0||this.stunT>0;
    if(this.bodyArmor<=0&&!open){g.fx.deflect(clamp(h.sx,this.x,this.x+this.w),clamp(h.sy,this.y,this.bottom),this.bodyMat);this.react(h,0.3);return 'deflect';}
    const d=h.dmg*(open?1:this.bodyArmor)*(h.heavy?C.heavyMul:1)*(h.bonus?C.bonusMul:1)*(h.rupture?1.8:1);
    this.hp-=d;this.flash=0.12;
    g.fx.bodyHit(clamp(h.sx,this.x,this.x+this.w),clamp(h.sy,this.y,this.bottom),this.bodyMat,h,this.isBoss);
    this.react(h,0.75);
    if(this.hp<=0){this.die(h);return 'kill';}
    return 'body';
  }
  /* отклик тела на удар: вес решает, насколько он сдвинется */
  react(h,k){
    const m=this.mass;this.recoil=1;this.recoilDir=h.dir||0;this.alert=6;
    /* корпус сжимается от удара: тяжёлый — сильнее; мелкие механизмы гнутся заметнее боссов */
    this.squash=Math.max(this.squash||0,(h.heavy?1.4:1)*k);
    if(m>=3||this.pinT>0)return;
    const kb=(h.heavy?8.5:2.4)*k/Math.max(0.7,m);
    this.vx+=(h.dir||0)*kb;if(h.ky)this.vy+=h.ky*k/Math.max(1,m);
    this.knockT=Math.max(this.knockT,h.heavy?0.32:0.1);
    if(h.heavy)this.lastImp={src:'heavy',t:this.world.time};
    if(h.heavy&&this.isWinding())this.cancelAttack();
  }
  breakNode(n,h,guar){
    const g=this.world.game,W=this.world;
    n.broken=true;n.hp=0;n.exT=0;n.markT=0;n.tele=0;n.teleHot=false;this.squash=1.8;
    this.hp-=n.coreDmg||0;
    const dir=(h&&h.dir)||(h&&Math.sign(n.wx-h.sx))||-this.face;
    const part=this.partDebris(n);
    if(part)W.addDebris(Object.assign({x:n.wx,y:n.wy,vx:dir*(2.5+Math.random()*3)+this.vx*0.4,vy:-4.5-Math.random()*3,
      vr:(Math.random()-0.5)*14,hot:2.4,src:this,face:this.face},part));
    if(n.scrap!==0)W.scrap.spawn(n.wx,n.wy,n.scrap||3,dir);
    g.fx.breakNode(n.wx,n.wy,n.mat,guar,this.isBoss);
    if(this.isWinding()&&this.attackUses(n))this.cancelAttack();
    this.onBreak(n,h);
    if(this.hp<=0&&!this.dead)this.die(h);
  }
  /* смерть: механизм разваливается — уцелевшие детали отлетают, корпус остаётся обломком */
  die(h){
    if(this.dead)return;
    this.dead=true;this.deadT=0;this.releaseToken();
    const g=this.world.game,W=this.world;
    if(this.key&&W.room){const id=W.room.id;(W.slain[id]=W.slain[id]||{})[this.key]=true;}
    const dir=(h&&h.dir)||-this.face;
    for(const n of this.nodes){if(n.broken||n.core)continue;const part=this.partDebris(n);
      if(part)W.addDebris(Object.assign({x:n.wx,y:n.wy,vx:dir*(1.5+Math.random()*4)+(Math.random()-0.5)*3,vy:-4-Math.random()*4,
        vr:(Math.random()-0.5)*16,hot:3,src:this,face:this.face},part));n.broken=true;}
    const cp=this.corpseDebris();
    if(cp)W.addDebris(Object.assign({x:this.cx,y:this.cy,vx:dir*0.8+this.vx*0.15,vy:-1.5,vr:dir*1.2,hot:6,corpse:true,src:this,face:this.face},cp));
    W.scrap.spawn(this.cx,this.cy,this.scrapOnDeath||3,dir);
    g.fx.kill(this.cx,this.cy,this.bodyMat,this.isBoss);
    this.onDeath(h);
    dropPhono(W,this);   /* последняя фонограмма: латунный валик у корпуса (js/world/phono.js) */
    if(this.elite&&!this.isBoss)W.onEliteDown(this);
    W.checkClear();
  }
  hurt(dmg,kx,ky){this.takeHit({kind:'raw',dmg,hb:this.rect(),sx:this.cx,sy:this.cy,fromX:this.cx-(kx||0),dir:Math.sign(kx||0),ky:ky||0});}
  /* --- крючки подклассов --- */
  onBreak(n,h){}
  onInterrupt(n,p){}
  onPin(back){}
  onSlam(back,speed){}
  onUnpin(){this.state='recover';this.st=0;}
  onStunEnd(){this.state='recover';this.st=0;}
  onDeath(h){}
  partDebris(n){return null;}
  corpseDebris(){return null;}
  /* эффекты поверх контурного спрайта (без обводки): пламя, свечение узлов, кольца телеграфа, след рывка */
  drawOverlay(c,t){
    if(this.dead)return;
    c.save();c.translate(this.cx,this.bottom);if(this.face<0)c.scale(-1,1);
    if(this.recoil>0)c.translate(this.recoil*this.recoilDir*this.face*0.1,0);
    if(this.squash>0){const k=this.squash*(this.isBoss?0.03:0.07);c.scale(1+k,1-k);}
    this.drawFX(c,t);drawNodeFX(c,this,t);
    c.restore();
  }
  drawFX(c,t){}
  /* --- рисунок: живой механизм; после смерти его заменяют обломки --- */
  drawBody(c,t){
    if(this.dead)return;
    c.save();c.translate(this.cx,this.bottom);
    if(this.face<0)c.scale(-1,1);
    /* отдача от удара: корпус уходит по направлению удара (в локальных осях) */
    if(this.recoil>0)c.translate(this.recoil*this.recoilDir*this.face*0.1,0);
    if(this.squash>0){const k=this.squash*(this.isBoss?0.03:0.07);c.scale(1+k,1-k);}
    this.draw(c,t);
    c.restore();
    if(this.flash>0){c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=clamp(this.flash*3,0,0.55);
      const m=this.spriteBounds();c.fillStyle='#ffe2c0';c.fillRect(m.x,m.y,m.w,m.h);c.restore();}
  }
}
/* ============================== MOB MECH ==============================
   Рядовой механизм: чувства (зрение + шум), обход, общий цикл атаки
   «подход → замах (телеграф узла) → удар → восстановление» с очередью атак.
   Подкласс задаёт atk() — что у него сейчас есть для удара (по уцелевшим узлам):
     {node, range, minR?, dy?, wind, hot, strike, rec, cd?}
   и крючки: onWind(A), onStrike(A), strikeTick(dt,A), strikeBox(A), approach(dd,A), speed(). */
class MobMech extends Mech{
  constructor(world,def,x,y){super(world,def,x,y);this.patrolPause=0;this.hitDone=false;this.P={};}
  /* зрение и слух; deaf/blind — по сломанным сенсорам */
  sense(dt){
    const p=this.world.player;
    if(this.alert>0)this.alert-=dt;
    const d=this.blind?-1:this.sensePlayer();
    if(d>0){this.alert=4;this.investigate={x:p.cx,y:p.cy,t:4};}
    else{
      if(this.hearing&&p&&!p.dead&&p.noiseLevel>0.45&&dist(this.cx,this.cy,p.cx,p.cy)<CFG.noiseRun*this.hearing){
        const err=this.blind?(Math.random()-0.5)*3:0;this.investigate={x:p.cx+err,y:p.cy,t:3};this.alert=Math.max(this.alert,2.5);}
      if(this.investigate){this.investigate.t-=dt;if(this.investigate.t<=0)this.investigate=null;}}
  }
  hunting(){return this.alert>0||!!this.investigate;}
  targetX(){const p=this.world.player;return this.investigate&&(this.blind||this.sensePlayer()<0)?this.investigate.x:p.cx;}
  speed(){return 2.4;}
  turnTime(){return 0.16;}
  patrol_(dt,k){
    this.releaseToken();
    if(this.patrolPause>0){this.patrolPause-=dt;this.vx=damp(this.vx,0,6,dt);return;}
    const pt=this.patrol;
    if(this.cx<pt[0]-0.3&&this.face<0){this.face=1;this.patrolPause=0.7+Math.random();}
    else if(this.cx>pt[1]+0.3&&this.face>0){this.face=-1;this.patrolPause=0.7+Math.random();}
    else if(this.onGround&&(this.wall===this.face||!this.groundAhead())){this.face=-this.face;this.patrolPause=0.5;}
    this.vx=damp(this.vx,this.face*this.speed()*(k||0.45),5,dt);
  }
  /* пол впереди есть (и нет ям/кислоты): обходчики не падают с карнизов */
  groundAhead(){
    const R=this.world.room,fx=this.face>0?this.x+this.w:this.x-0.16,ahead={x:fx,y:this.bottom+0.04,w:0.16,h:0.4};
    if(!R.solids.some(s=>!s.hidden&&aabb(ahead,s)))return false;
    return !(R.hazards||[]).some(h=>aabb({x:fx,y:this.y,w:0.16,h:this.h+0.4},h));
  }
  approach(dd,A){
    if(A.minR&&dd<A.minR)return -this.face*this.speed()*0.7;
    if(dd>A.range*0.85)return this.face*this.speed();
    if(dd<A.range*0.4)return -this.face*this.speed()*0.5;
    return 0;
  }
  fight(dt){
    const p=this.world.player,A=this.atk();this.st+=dt;this.cd-=dt;
    const tx=this.targetX(),dd=Math.abs(tx-this.cx),want=tx>this.cx?1:-1;
    if(this.state!=='wind'&&this.state!=='strike'&&want!==this.face&&this.hunting()){
      this.turnT+=dt;if(this.turnT>this.turnTime()){this.face=want;this.turnT=0;}}
    else this.turnT=0;
    switch(this.state){
      case 'recover':this.vx=damp(this.vx,0,8,dt);if(this.st>(A?A.rec:0.6)){this.state='hunt';this.st=0;this.releaseToken();}break;
      case 'wind':{if(!A){this.cancelAttack();break;}
        const k=this.st/A.wind;this.vx=damp(this.vx,0,10,dt);
        this.telegraph(A.node,k,this.st>A.wind-A.hot);
        if(this.st>=A.wind){this.state='strike';this.st=0;this.hitDone=false;this.onStrike(A);}
        break;}
      case 'strike':{if(!A){this.state='recover';this.st=0;break;}
        this.strikeTick(dt,A);
        if(!this.hitDone){const hb=this.strikeBox(A);if(hb&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}}
        if(this.st>=A.strike){this.state='recover';this.st=0;this.cd=A.cd!==undefined?A.cd:0.8+Math.random()*0.7;}
        break;}
      default:{
        if(!this.hunting()){this.state='idle';this.patrol_(dt);break;}
        this.state='hunt';
        if(!A){this.vx=damp(this.vx,-this.face*this.speed()*0.6,5,dt);break;}
        let tv=this.approach(dd,A);
        if(tv&&this.onGround&&!this.flying&&Math.sign(tv)===this.face&&(this.wall===this.face||!this.groundAhead()))tv=0;
        const inRange=dd<A.range&&dd>(A.minR||0)*0.7&&Math.abs(p.cy-this.cy)<(A.dy||1.8);
        if(inRange&&this.cd<=0&&this.face===want&&(this.flying||this.onGround)){
          if(this.wantAttack()){this.state='wind';this.st=0;this.hitDone=false;this.vx=damp(this.vx,0,10,dt);this.onWind(A);break;}
          tv=Math.sin(this.t*2.3+this.x)*this.speed()*0.18;if(dd<A.range*0.7)tv-=this.face*0.5;}
        this.vx=damp(this.vx,tv,7,dt);
      }
    }
  }
  attackUses(n){const A=this.atk();return !!A&&A.node===n;}
  onWind(A){}
  onStrike(A){}
  strikeTick(dt,A){this.vx=damp(this.vx,0,8,dt);}
  strikeBox(A){return null;}
  atk(){return null;}
}
/* ============================== MECH BOSS ==============================
   Босс-механизм: та же разборка по узлам, но жизнь — ядро (узел core, закрыт бронёй до
   поломки нескольких систем). Полоса босса показывает целостность всей конструкции. */
class MechBoss extends Mech{
  constructor(world,def,x,y){
    super(world,Object.assign({mass:6,bodyArmor:0.12},def),x,y);
    this.isBoss=true;this.activated=false;this.phase=1;this.name=def.name||'';this.done=false;
  }
  safe(){return this.stunT>0||this.pinT>0||this.openT>0||this.state==='stuck'||this.state==='stunWall'||!this.activated;}
  canPin(){return false;}
  /* целостность для полосы: системы + ядро (вдвое весомее) */
  integrity(){let s=0,w=0;for(const n of this.nodes){const k=n.core?2:1;s+=k*(n.broken?0:n.hp/n.max);w+=k;}return w?s/w:0;}
  update(dt){
    if(!this.activated&&!this.dead){this.t+=dt;this.pose(dt);for(const n of this.nodes){n.wx=this.cx+this.face*n.lx;n.wy=this.bottom+n.ly;}return;}
    super.update(dt);
    if(!this.dead)this.world.game.hud.boss(this.name,this.integrity());
  }
  /* узел-ядро сломан — механизм кончился */
  onBreak(n,h){if(n.core&&!this.dead){this.hp=0;this.die(h);}}
  get coreX(){const n=this.nodes.find(q=>q.core);return n?n.wx:this.cx;}
  get coreY(){const n=this.nodes.find(q=>q.core);return n?n.wy:this.cy;}
  die(h){
    if(this.dead)return;
    super.die(h);
    const g=this.world.game;g.hud.bossOff();g.hud.say(this.name+' · РАЗОБРАН.','');
    g.flash(0.6,'#fff2d0');g.slowmo(0.5,0.3);
  }
  hurt(dmg,kx,ky,raw){
    /* сырой урон от окружения (отражённый осколок и т. п.) — по ближайшему открытому узлу */
    const n=this.nodes.filter(q=>!q.broken&&!q.locked).sort((a,b)=>(b.exT>0)-(a.exT>0))[0];
    if(n)this.hitNode(n,{kind:'raw',dmg,hb:this.rect(),sx:n.wx,sy:n.wy,fromX:n.wx-(kx||0),dir:Math.sign(kx||0),ky:0},true);
  }
}
