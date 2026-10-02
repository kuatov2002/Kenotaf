"use strict";
/* ============================== ENEMIES ============================== */
class Enemy extends Body{
  constructor(world,def,x,y){
    super(x,y,def.w||0.9,def.h||1.6);
    this.world=world;this.type=def.type;this.def=def;
    this.hp=def.hp;this.maxHp=def.hp;this.dmg=def.dmg||1;this.face=-1;
    this.t=0;this.flash=0;this.dead=false;this.deadT=0;
    this.patrol=def.patrol||[x-4,x+4];this.alert=0;this.investigate=null;
    this.hearing=def.hearing||0;this.aggro=def.aggro||9;this.wind=0;this.swing=0;
  }
  hurt(dmg,kx,ky){
    if(this.dead)return;
    this.hp-=dmg;this.flash=0.2;this.vx+=kx;this.vy+=ky;
    const g=this.world.game;
    g.audio.hit();g.hitstop(CFG.hsMelee);g.camera.addShake(0.28);
    g.particles.burst(this.cx,this.cy,10,{kind:'spark',col:'#ffcf7a',spd:5,life:0.4,size:0.05,add:true,g:14});
    g.particles.burst(this.cx,this.cy,6,{kind:'debris',col:this.def.blood||'#6b4a3a',spd:3,life:0.7,size:0.09,g:26});
    this.alert=6;
    if(this.hp<=0)this.die();
  }
  die(){
    this.dead=true;this.deadT=0;const g=this.world.game,W=this.world;
    if(this.key&&W.room){const id=W.room.id;(W.slain[id]=W.slain[id]||{})[this.key]=true;}
    g.audio.enemyDie();g.camera.addShake(0.4);
    g.particles.burst(this.cx,this.cy,26,{kind:'debris',col:this.def.blood||'#6b4a3a',spd:6,life:1.2,size:0.14,g:30});
    g.particles.burst(this.cx,this.cy,16,{kind:'spark',col:'#ffb45a',spd:7,life:0.6,size:0.06,add:true,g:16});
    g.particles.burst(this.cx,this.cy,10,{kind:'smoke',col:'#2a2622',spd:1.6,life:1.8,size:0.5,grow:0.9,drag:1.2});
    this.world.checkClear();
  }
  physics(dt){this.vy+=CFG.gravity*dt;this.vy=clamp(this.vy,-40,CFG.player.maxFall);
    moveBody(this,dt,this.world.room.solids);}
  sensePlayer(){const p=this.world.player;if(!p||p.dead)return -1;
    const d=dist(this.cx,this.cy,p.cx,p.cy);
    if(d<this.aggro&&losCheck(this.world,this.cx,this.cy-0.2,p.cx,p.cy))return d;
    return -1;}
  hear(nx,ny,r){if(!this.hearing)return;
    if(dist(this.cx,this.cy,nx,ny)<r*this.hearing){this.investigate={x:nx,y:ny,t:6};this.alert=Math.max(this.alert,4);}}
  damagePlayer(){this.world.game.combat.damagePlayer(this.dmg,this.cx);}
  update(dt){this.t+=dt;if(this.flash>0)this.flash-=dt;
    if(this.dead){this.deadT+=dt;return;}
    this.ai(dt);this.physics(dt);}
  ai(){}
  draw(){}
  drawBody(c,t){
    if(this.dead){
      if(this.deadT>2.4)return;
      const a=clamp(1-(this.deadT-1.5)/0.9,0,1);
      c.save();c.globalAlpha=a;c.translate(this.cx,this.bottom);
      c.fillStyle=this.def.blood||'#4a3a30';
      c.beginPath();c.ellipse(0,-0.14,this.w*0.8,0.2,0,0,TAU);c.fill();
      c.fillStyle='#2b2622';c.fillRect(-this.w*0.42,-0.28,this.w*0.84,0.2);
      c.restore();return;}
    c.save();c.translate(this.cx,this.bottom);
    if(this.face<0)c.scale(-1,1);
    this.draw(c,t);
    c.restore();
    if(this.flash>0){c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=clamp(this.flash*3,0,0.8);
      const m=this.spriteBounds();c.fillStyle='#ffd0a0';c.fillRect(m.x,m.y,m.w,m.h);c.restore();}
  }
  spriteBounds(){const big=this.w>2.5;
    return {x:this.cx-this.w/2-(big?4.6:2.8),y:this.y-(big?2.6:1.4),w:this.w+(big?9.2:5.6),h:this.h+(big?3.2:1.9)};}
  /* угроза читается контуром: в покое — светлый, на замахе — красный */
  threat(){return this.wind>0||this.swing>0||this.state==='windup'||this.state==='grab'||this.state==='slam';}
}
class Aristocrat extends Enemy{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.8,h:2.35,hp:80,dmg:1,aggro:6.5,hearing:1.0,blood:'#3a2a2a'},def),x,y);
    this.glide=0;}
  ai(dt){
    const p=this.world.player,g=this.world.game;
    if(this.alert>0)this.alert-=dt;
    if(this.investigate){this.investigate.t-=dt;if(this.investigate.t<=0)this.investigate=null;}
    const d=this.sensePlayer();
    if(d>0&&p.noiseLevel>0.25){this.alert=6;this.investigate={x:p.cx,y:p.cy,t:5};}
    else if(p.noiseLevel>0.5&&dist(this.cx,this.cy,p.cx,p.cy)<CFG.noiseRun){this.investigate={x:p.cx,y:p.cy,t:5};this.alert=4;}
    if(this.alert>0||this.investigate){
      const tx=this.investigate?this.investigate.x:p.cx;
      this.face=tx>this.cx?1:-1;const dd=Math.abs(tx-this.cx);
      this.vx=damp(this.vx,this.face*Math.min(3.4,dd*1.6),4,dt);
      if(this.wind>0){this.wind-=dt;this.vx=damp(this.vx,0,8,dt);
        if(this.wind<=0){this.swing=0.3;g.audio.melee();
          const hb={x:this.cx+(this.face>0?0.1:-2.0),y:this.y+0.2,w:2.0,h:this.h-0.3};
          g.particles.burst(this.cx+this.face*1.2,this.cy,10,{kind:'spark',col:'#c8452f',spd:5,life:0.3,size:0.04,add:true});
          if(aabb(hb,p.rect()))this.damagePlayer();}}
      else if(this.swing>0)this.swing-=dt;
      else if(dd<2.1)this.wind=0.7;
    }else{
      if(this.cx<this.patrol[0]-0.4)this.face=1;
      if(this.cx>this.patrol[1]+0.4)this.face=-1;
      this.vx=damp(this.vx,this.face*0.85,3,dt);
    }
    this.glide+=dt;
  }
  draw(c,t){
    const h=this.h,w=this.w;
    c.save();c.rotate(Math.sin(this.glide*1.6)*0.03);
    const g=c.createLinearGradient(0,-h,0,0);
    g.addColorStop(0,'#3a2b2b');g.addColorStop(.5,'#2a1f1f');g.addColorStop(1,'#16100f');
    c.fillStyle=g;
    c.beginPath();c.moveTo(-w*0.34,-h*0.92);c.lineTo(w*0.34,-h*0.92);c.lineTo(w*0.52,-0.06);c.lineTo(-w*0.52,-0.06);c.closePath();c.fill();
    c.fillStyle='#16100f';
    for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*w*0.16,-0.1);c.lineTo(i*w*0.16+w*0.08,-0.1);
      c.lineTo(i*w*0.16+w*0.04,0.12+((i*7)%3)*0.05);c.fill();}
    c.fillStyle='rgba(255,255,255,.05)';c.fillRect(-w*0.34,-h*0.92,w*0.1,h*0.9);
    c.strokeStyle='#8e2b1e';c.lineWidth=0.055;
    c.beginPath();c.moveTo(-w*0.3,-h*0.86);c.lineTo(w*0.3,-h*0.86);c.stroke();
    c.fillStyle='#d8cdb8';c.beginPath();c.ellipse(0,-h*1.0,w*0.24,h*0.075,0,0,TAU);c.fill();
    c.fillStyle='#241c1c';rr(c,-w*0.24,-h*1.03,w*0.48,h*0.035,0.02);c.fill();
    c.fillStyle='#4a3a34';c.beginPath();c.ellipse(0,-h*1.11,w*0.26,h*0.055,0,0,TAU);c.fill();
    const atk=this.wind>0?clamp(1-this.wind/0.7,0,1):(this.swing>0?1:0);
    c.save();c.translate(w*0.3,-h*0.55);c.rotate(-0.2+atk*1.9);
    c.strokeStyle='#2b2422';c.lineWidth=0.055;c.beginPath();c.moveTo(0,0);c.lineTo(0,h*0.5);c.stroke();
    c.fillStyle='#c9c3b0';c.beginPath();c.moveTo(-0.02,h*0.5);c.lineTo(0.02,h*0.5);c.lineTo(0,h*0.78);c.fill();
    if(atk>0.4){c.strokeStyle=rgba('#c8452f',(atk-0.4)*1.2);c.lineWidth=0.05;
      c.beginPath();c.arc(0,h*0.5,0.5,-0.6,0.9);c.stroke();}
    c.restore();c.restore();
    if(this.alert>0){const p=0.5+0.5*Math.sin(t*9);
      c.save();c.globalCompositeOperation='lighter';
      c.fillStyle=rgba('#c8452f',0.5*p);c.beginPath();c.arc(0,-h*1.12,0.1,0,TAU);c.fill();c.restore();
      game.renderer.glowAdd(this.cx,this.bottom-h*1.12,0.5,'#c8452f',0.4);}
  }
}
class Censor extends Enemy{
  constructor(world,def,x,y){
    super(world,Object.assign({w:1.25,h:2.05,hp:130,dmg:1,aggro:10,blood:'#8a6d3b'},def),x,y);
    this.stun=0;this.walk=0;this.tankBroken=false;}
  safe(){return this.stun>0;}
  hurt(dmg,kx,ky){
    if(this.stun<=0&&!this.tankBroken){
      dmg*=0.45;
      this.world.game.audio.hitMetal();
      this.world.game.particles.burst(this.cx,this.cy,8,{kind:'spark',col:'#ffe6a3',spd:6,life:0.35,size:0.05,add:true,g:12});}
    super.hurt(dmg,kx*0.4,ky*0.4);
  }
  popTank(){
    if(this.tankBroken)return;
    this.tankBroken=true;this.stun=3.4;const g=this.world.game;g.tutorial.notify('tank');
    g.audio.explosion();g.camera.addShake(0.7);g.hitstop(CFG.hsHeavy);
    g.particles.burst(this.cx,this.cy-0.6,30,{kind:'steam',col:'#e8e0d0',spd:5,life:1.6,size:0.6,grow:1.6,drag:1.6});
    g.particles.burst(this.cx,this.cy-0.6,18,{kind:'spark',col:'#ffd27a',spd:9,life:0.6,size:0.06,add:true,g:20});
  }
  ai(dt){
    const p=this.world.player,g=this.world.game;
    if(this.stun>0){this.stun-=dt;this.vx=damp(this.vx,0,7,dt);return;}
    if(this.alert>0)this.alert-=dt;
    if(this.sensePlayer()>0)this.alert=5;
    if(this.alert>0){
      this.face=p.cx>this.cx?1:-1;const dd=Math.abs(p.cx-this.cx);
      this.vx=damp(this.vx,this.face*(dd<2.2?0:2.3),4,dt);
      if(this.wind>0){this.wind-=dt;this.vx=damp(this.vx,0,9,dt);
        if(this.wind<=0){this.swing=0.4;g.audio.hitMetal();g.camera.addShake(0.4);
          g.particles.burst(this.cx+this.face*1.6,this.bottom-0.2,16,{kind:'debris',col:'#8a7a6a',spd:6,life:0.8,size:0.12,g:26});
          const hb={x:this.cx+(this.face>0?0:-2.4),y:this.y,w:2.4,h:this.h};
          if(aabb(hb,p.rect()))this.damagePlayer();}}
      else if(this.swing>0)this.swing-=dt;
      else if(dd<2.6&&this.onGround)this.wind=0.85;
    }else{
      if(this.cx<this.patrol[0]-0.4)this.face=1;
      if(this.cx>this.patrol[1]+0.4)this.face=-1;
      this.vx=damp(this.vx,this.face*1.1,3,dt);
    }
    this.walk+=Math.abs(this.vx)*dt*2;
  }
  draw(c,t){
    const w=this.w,h=this.h,stun=this.stun>0;
    c.strokeStyle='#6d5416';c.lineWidth=0.2;c.lineCap='round';
    for(let i=0;i<2;i++){const ph=this.walk+i*PI;
      c.beginPath();c.moveTo((i?0.2:-0.2),-h*0.42);c.lineTo((i?0.2:-0.2)+Math.sin(ph)*0.2,0);c.stroke();}
    const g=c.createLinearGradient(-w/2,-h,w/2,0);
    g.addColorStop(0,'#e0bd55');g.addColorStop(.35,'#a8842a');g.addColorStop(.7,'#7d6120');g.addColorStop(1,'#4a3a12');
    c.fillStyle=g;rr(c,-w*0.42,-h*0.95,w*0.84,h*0.58,0.16);c.fill();
    c.save();rr(c,-w*0.42,-h*0.95,w*0.84,h*0.58,0.16);c.clip();
    c.fillStyle=PAT(c,'rust');c.globalAlpha=0.18;c.fillRect(-w,-h,w*2,h*2);c.restore();
    for(let i=0;i<4;i++)Kit.bolt(c,-w*0.3+i*w*0.2,-h*0.9,0.05);
    c.fillStyle='rgba(0,0,0,.3)';c.fillRect(-w*0.42,-h*0.5,w*0.84,0.07);
    c.save();c.translate(-w*0.44,-h*0.78);
    if(!this.tankBroken){
      const bg=c.createLinearGradient(-0.3,0,0.3,0);
      bg.addColorStop(0,'#5c646b');bg.addColorStop(.4,'#9aa2a9');bg.addColorStop(1,'#3a4046');
      c.fillStyle=bg;rr(c,-0.3,-0.1,0.52,h*0.44,0.2);c.fill();
      c.fillStyle='#8a6d2a';c.fillRect(-0.3,0.06,0.52,0.08);c.fillRect(-0.3,h*0.28,0.52,0.08);
      Kit.gauge(c,0.0,0.16,0.13,stun?0.05:0.85);
      const p=0.5+0.5*Math.sin(t*4);
      c.fillStyle=rgba(stun?'#69d68f':'#c8452f',0.22+0.28*p);
      c.beginPath();c.arc(0,h*0.14,0.44,0,TAU);c.fill();
      game.renderer.glowAdd(this.cx-this.face*0.5,this.bottom-h*0.64,0.7,stun?'#69d68f':'#c8452f',0.3);
    }else{
      c.fillStyle='#2b3035';rr(c,-0.3,-0.1,0.52,h*0.3,0.14);c.fill();
      c.strokeStyle='#1a1d20';c.lineWidth=0.06;c.beginPath();c.moveTo(-0.2,h*0.1);c.lineTo(0.2,h*0.2);c.stroke();
      if(Math.random()<0.3)this.world.game.particles.spawn({kind:'steam',x:this.cx-this.face*0.6,y:this.cy,
        vx:-this.face*0.6,vy:-1.2,life:1.2,size:0.3,grow:0.6,col:'#cfc9b8',drag:1.4});}
    c.restore();
    c.save();c.translate(0,-h*0.98);
    c.fillStyle='#8a6d2a';c.beginPath();c.arc(0,0,w*0.3,PI,0);c.fill();
    c.fillStyle='rgba(255,255,255,.22)';c.beginPath();c.arc(-w*0.1,-w*0.08,w*0.12,0,TAU);c.fill();
    c.fillStyle='#1a1512';c.fillRect(-w*0.3,-0.02,w*0.6,0.1);
    c.fillStyle=rgba(stun?'#69d68f':'#ff3b22',stun?0.3:0.8);c.fillRect(-w*0.22,0.0,w*0.44,0.05);
    c.restore();
    const atk=this.wind>0?clamp(1-this.wind/0.85,0,1):(this.swing>0?1:0);
    c.save();c.translate(w*0.34,-h*0.72);c.rotate(-0.4+atk*1.6);
    c.strokeStyle='#7d6120';c.lineWidth=0.17;c.beginPath();c.moveTo(0,0);c.lineTo(0.7,0.1);c.stroke();
    c.fillStyle='#a8842a';
    c.beginPath();c.moveTo(0.7,-0.06);c.lineTo(1.14,-0.2);c.lineTo(1.1,0.0);c.closePath();c.fill();
    c.beginPath();c.moveTo(0.7,0.24);c.lineTo(1.14,0.36);c.lineTo(1.1,0.14);c.closePath();c.fill();
    if(atk>0.5){c.strokeStyle=rgba('#ff3b22',(atk-0.5)*1.6);c.lineWidth=0.07;
      c.beginPath();c.arc(0.8,0.1,0.7,-0.9,0.9);c.stroke();}
    c.restore();
  }
}
class Gardener extends Enemy{
  constructor(world,def,x,y){
    super(world,Object.assign({w:1.5,h:1.3,hp:95,dmg:1,aggro:7,blood:'#8a9a6a'},def),x,y);
    this.blade=0;}
  threat(){return this.alert>0;}
  ai(dt){
    const p=this.world.player;
    if(this.alert>0)this.alert-=dt;
    if(this.sensePlayer()>0)this.alert=5;
    if(this.alert>0){
      this.face=p.cx>this.cx?1:-1;const dd=Math.abs(p.cx-this.cx);
      this.vx=damp(this.vx,this.face*(dd<1.8?0:2.0),4,dt);
      if(dd<2.2)this.world.game.combat.contactDamage(p,this,1);
    }else{
      if(this.cx<this.patrol[0]-0.4)this.face=1;
      if(this.cx>this.patrol[1]+0.4)this.face=-1;
      this.vx=damp(this.vx,this.face*1.0,3,dt);
    }
    this.blade+=dt*(this.alert>0?16:6);
  }
  draw(c,t){
    const w=this.w,h=this.h;
    c.fillStyle='#3a3d34';rr(c,-w*0.5,-h*0.55,w,h*0.5,0.14);c.fill();
    const g=c.createLinearGradient(0,-h,0,0);
    g.addColorStop(0,'#efeade');g.addColorStop(.5,'#cfcabb');g.addColorStop(1,'#8e8a7c');
    c.fillStyle=g;rr(c,-w*0.46,-h*0.98,w*0.92,h*0.5,0.18);c.fill();
    c.save();rr(c,-w*0.46,-h*0.98,w*0.92,h*0.5,0.18);c.clip();
    c.fillStyle=PAT(c,'marble');c.globalAlpha=0.35;c.fillRect(-w,-h*1.2,w*2,h*1.4);c.restore();
    c.fillStyle='rgba(184,196,106,.55)';rr(c,-w*0.2,-h*1.24,w*0.4,h*0.3,0.1);c.fill();
    c.strokeStyle='#a8a496';c.lineWidth=0.05;c.strokeRect(-w*0.2,-h*1.24,w*0.4,h*0.3);
    for(let i=0;i<4;i++)Kit.bolt(c,-w*0.3+i*w*0.2,-h*0.9,0.04);
    c.fillStyle='#22251f';
    for(let i=-1;i<=1;i+=2){c.beginPath();c.arc(i*w*0.3,-0.14,0.2,0,TAU);c.fill();
      c.strokeStyle='#5c6057';c.lineWidth=0.04;c.beginPath();c.arc(i*w*0.3,-0.14,0.2,0,TAU);c.stroke();}
    c.save();c.translate(w*0.42,-h*0.78);c.rotate(this.blade);
    c.fillStyle='#c9c3b0';
    for(let i=0;i<3;i++){c.save();c.rotate(i/3*TAU);
      c.beginPath();c.moveTo(0,-0.05);c.lineTo(0.62,-0.12);c.lineTo(0.66,0);c.lineTo(0.02,0.07);c.closePath();c.fill();
      c.restore();}
    c.fillStyle='#8a8d7a';c.beginPath();c.arc(0,0,0.12,0,TAU);c.fill();
    if(this.alert>0){c.strokeStyle=rgba('#c8452f',0.5);c.lineWidth=0.05;c.beginPath();c.arc(0,0,0.8,0,TAU);c.stroke();}
    c.restore();
    c.fillStyle=rgba(this.alert>0?'#c8452f':'#b8c46a',0.9);
    c.beginPath();c.arc(-w*0.3,-h*0.86,0.075,0,TAU);c.fill();
  }
}
class Clockmaker extends Enemy{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.9,h:1.9,hp:90,dmg:1,aggro:11,blood:'#5c6067'},def),x,y);
    this.pend=0;this.shootCd=2;}
  threat(){return this.alert>0&&this.shootCd<0.7;}
  ai(dt){
    const p=this.world.player,g=this.world.game;
    if(this.alert>0)this.alert-=dt;
    if(this.sensePlayer()>0)this.alert=5;
    if(p.noiseLevel>0.5&&dist(this.cx,this.cy,p.cx,p.cy)<16){this.alert=5;this.investigate={x:p.cx,y:p.cy,t:4};}
    if(this.alert>0){
      this.face=p.cx>this.cx?1:-1;const dd=Math.abs(p.cx-this.cx);
      this.vx=damp(this.vx,this.face*(dd<6?0:2.2),4,dt);
      this.shootCd-=dt;
      if(this.shootCd<=0&&dd<15){this.shootCd=2.4;
        const a=Math.atan2(p.cy-this.cy,p.cx-this.cx);
        this.world.projectiles.push({x:this.cx,y:this.cy-0.4,vx:Math.cos(a)*11,vy:Math.sin(a)*11,
          r:0.17,dmg:1,life:2.4,kind:'shard',rot:0});
        g.audio.melee();}
    }else{
      if(this.cx<this.patrol[0]-0.4)this.face=1;
      if(this.cx>this.patrol[1]+0.4)this.face=-1;
      this.vx=damp(this.vx,this.face*1.2,3,dt);
    }
    this.pend+=dt*(this.alert>0?7:2.4);
  }
  draw(c,t){
    const w=this.w,h=this.h;
    c.strokeStyle='#3a3d44';c.lineWidth=0.11;
    for(let i=0;i<2;i++){const ph=this.pend*0.6+i*PI;
      c.beginPath();c.moveTo((i?0.16:-0.16),-h*0.44);c.lineTo((i?0.16:-0.16)+Math.sin(ph)*0.2,0);c.stroke();}
    const g=c.createLinearGradient(-w/2,-h,w/2,0);
    g.addColorStop(0,'#8e9298');g.addColorStop(.4,'#5c6067');g.addColorStop(1,'#2c2f34');
    c.fillStyle=g;rr(c,-w*0.4,-h*0.94,w*0.8,h*0.55,0.1);c.fill();
    c.fillStyle='#e8e8e8';c.beginPath();c.arc(0,-h*0.7,w*0.22,0,TAU);c.fill();
    c.strokeStyle='#22242a';c.lineWidth=0.035;
    c.beginPath();c.moveTo(0,-h*0.7);c.lineTo(Math.cos(this.pend*2)*w*0.16,-h*0.7+Math.sin(this.pend*2)*w*0.16);c.stroke();
    c.save();c.translate(0,-h*0.98);c.rotate(Math.sin(this.pend)*0.5);
    c.strokeStyle='#5c6067';c.lineWidth=0.05;c.beginPath();c.moveTo(0,0);c.lineTo(0,-0.4);c.stroke();
    c.fillStyle='#b08d3e';c.beginPath();c.arc(0,-0.46,0.16,0,TAU);c.fill();
    c.fillStyle=rgba(this.alert>0?'#c8452f':'#8fb6c9',0.9);c.beginPath();c.arc(0,-0.46,0.07,0,TAU);c.fill();
    c.restore();
    c.strokeStyle='#4a4e55';c.lineWidth=0.09;
    c.beginPath();c.moveTo(w*0.34,-h*0.8);c.lineTo(w*0.5,-h*0.5);c.stroke();
    c.beginPath();c.moveTo(-w*0.34,-h*0.8);c.lineTo(-w*0.5,-h*0.5);c.stroke();
    if(this.alert>0)game.renderer.glowAdd(this.cx,this.bottom-h*1.44,0.45,'#c8452f',0.3);
  }
}
/* ЛАМПАДА — летучий соглядатай Цензуры: латунная чаша с огнём под винтом. Висит на посту, а увидев
   курьера — заходит сверху-сбоку, телеграфирует (огонь белеет, чаша дрожит, винт воет) и пикирует по
   прямой. Удар сбивает замах; промах о стену или пол — оглушена и падает. Сверху её бьют ударом вниз —
   отскок (пого): над провалами лампада — ступенька. */
class Lampada extends Enemy{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.86,h:0.9,hp:56,dmg:1,aggro:10.5,blood:'#7a3a22'},def),x,y);
    this.home={x:x+this.w/2,y:y+this.h/2};this.state='idle';this.st=0;this.ph=rng(x*31+y*7)()*TAU;
    this.rot=0;this.cd=0.8;this.dv={x:0,y:1};}
  safe(){return this.state==='stun';}
  threat(){return this.state==='wind'||this.state==='dive';}
  hurt(dmg,kx,ky){
    if(this.state==='stun')dmg*=1.4;
    super.hurt(dmg,kx*1.15,ky*1.3);
    if(!this.dead&&this.state!=='stun'){this.state='reel';this.st=0;}
  }
  bonk(){const g=this.world.game;this.state='stun';this.st=0;this.vx*=-0.3;this.vy=-2.6;this.cd=1.2;
    g.audio.hitMetal();g.camera.addShake(0.25);
    g.particles.burst(this.cx,this.cy,14,{kind:'spark',col:'#ffcf7a',spd:6,life:0.45,size:0.05,add:true,g:14});}
  physics(dt){
    if(this.state==='stun'){this.vy+=CFG.gravity*0.55*dt;this.vy=clamp(this.vy,-20,14);}
    const sp=Math.hypot(this.vx,this.vy);
    moveBody(this,dt,this.world.room.solids);
    const hit=this.wall||this.ceilHit||this.onGround;
    if(hit&&(this.state==='dive'||(this.state==='reel'&&sp>9)))this.bonk();
  }
  ai(dt){
    const p=this.world.player,g=this.world.game;this.st+=dt;this.cd-=dt;
    const seek=(tx,ty,sp,k)=>{const dx=tx-this.cx,dy=ty-this.cy,d=Math.hypot(dx,dy)||1,v=Math.min(sp,d*2.4);
      this.vx=damp(this.vx,dx/d*v,k,dt);this.vy=damp(this.vy,dy/d*v,k,dt);};
    const see=this.sensePlayer()>0;
    if(this.alert>0)this.alert-=dt;
    if(see)this.alert=4;
    switch(this.state){
      case 'idle':
        seek(this.home.x+Math.sin(this.t*0.55+this.ph)*1.1,this.home.y+Math.sin(this.t*1.3+this.ph)*0.3,2.2,3);
        if(see){this.state='track';this.st=0;}
        break;
      case 'track':{
        /* занять точку над курьером, чуть сбоку: оттуда пике идёт под углом и читается */
        const side=this.cx<p.cx?-1:1;
        seek(p.cx+side*1.8,p.y-2.6,5.4,4);
        this.face=p.cx>this.cx?1:-1;
        if(this.alert<=0){this.state='home';this.st=0;}
        else if(this.st>0.8&&this.cd<=0&&see&&Math.abs(this.cx-p.cx)<4&&this.cy<p.cy-0.8){
          this.state='wind';this.st=0;g.audio.lampWind();}
        break;}
      case 'wind':
        this.vx=damp(this.vx,0,9,dt);this.vy=damp(this.vy,-1.4,9,dt);this.face=p.cx>this.cx?1:-1;
        if(this.st>0.58){const dx=p.cx-this.cx,dy=p.cy+0.2-this.cy,d=Math.hypot(dx,dy)||1;
          this.dv={x:dx/d,y:dy/d};this.state='dive';this.st=0;g.audio.lampDive();}
        break;
      case 'dive':
        this.vx=this.dv.x*17;this.vy=this.dv.y*17;
        if(Math.random()<0.6)g.particles.spawn({kind:'spark',x:this.cx,y:this.cy-0.3,vx:-this.dv.x*3,vy:-this.dv.y*3,
          life:0.3,size:0.05,col:'#ffb45a',add:true});
        if(this.st>0.62){this.state='rise';this.st=0;this.cd=1.3;}
        break;
      case 'rise':
        seek(this.cx-this.dv.x*1.5,Math.min(this.cy,p.y-2.6),4.2,3);
        if(this.st>0.7){this.state=this.alert>0?'track':'home';this.st=0;}
        break;
      case 'reel':
        this.vx=damp(this.vx,0,3.2,dt);this.vy=damp(this.vy,0,3.2,dt);
        if(this.st>0.42){this.state='track';this.st=0;this.cd=Math.max(this.cd,0.7);this.alert=4;}
        break;
      case 'stun':
        this.vx=damp(this.vx,0,4,dt);
        if(this.st>1.3){this.state='rise';this.st=0;this.cd=0.9;this.vy=-3;}
        break;
      case 'home':
        seek(this.home.x,this.home.y,3.2,3);
        if(see){this.state='track';this.st=0;}
        else if(Math.hypot(this.home.x-this.cx,this.home.y-this.cy)<0.4){this.state='idle';this.st=0;}
        break;
    }
    this.rot+=dt*(this.state==='dive'?42:this.state==='stun'?3:this.state==='wind'?60:20);
  }
  draw(c,t){
    const w=this.w,h=this.h,st=this.state;
    const wind=st==='wind'?clamp(this.st/0.58,0,1):0,stun=st==='stun';
    if(wind>0)c.translate((Math.random()-0.5)*0.06*wind,(Math.random()-0.5)*0.05*wind);
    if(st==='dive')c.rotate(Math.atan2(this.dv.y,Math.abs(this.dv.x))*0.35-0.2);
    if(stun)c.rotate(Math.sin(this.t*9)*0.25);
    /* винт и ступица */
    const hy=-h-0.42;
    c.fillStyle='#5c4a2a';rr(c,-0.14,hy-0.06,0.28,0.18,0.06);c.fill();
    c.save();c.translate(0,hy-0.06);
    const bl=Math.cos(this.rot)*0.62;
    c.fillStyle=stun?'rgba(160,150,130,.6)':'rgba(200,190,160,.28)';c.beginPath();c.ellipse(0,0,0.66,0.07,0,0,TAU);c.fill();
    c.fillStyle='#8a7444';c.fillRect(-Math.abs(bl),-0.025,Math.abs(bl)*2,0.05);c.restore();
    /* три цепи к чаше */
    c.strokeStyle='#4a3d26';c.lineWidth=0.035;
    for(const sx of [-0.36,0,0.36]){c.beginPath();c.moveTo(0,hy+0.1);c.lineTo(sx,-h*0.52);c.stroke();}
    /* чаша: латунь, красное стекло, огонь */
    const g=c.createLinearGradient(-w/2,0,w/2,0);
    g.addColorStop(0,'#5a4420');g.addColorStop(.35,'#d8b25a');g.addColorStop(.6,'#a8842a');g.addColorStop(1,'#4a3812');
    c.fillStyle='#7a2418';c.beginPath();c.ellipse(0,-h*0.52,w*0.42,h*0.12,0,0,TAU);c.fill();
    const fl=stun?0.25:(0.6+0.15*Math.sin(t*11+this.ph)+wind*0.6);
    const fc=wind>0.5?'#fff2d6':(this.alert>0?'#ff6a3a':'#ffb45a');
    c.save();c.globalCompositeOperation='lighter';
    c.fillStyle=rgba(fc,0.85*fl);c.beginPath();c.moveTo(-0.13,-h*0.55);
    c.quadraticCurveTo(0,-h*0.55-0.5*fl-0.1,0.13,-h*0.55);c.closePath();c.fill();c.restore();
    c.fillStyle=g;c.beginPath();c.moveTo(-w*0.46,-h*0.52);c.quadraticCurveTo(-w*0.4,-0.05,0,0);
    c.quadraticCurveTo(w*0.4,-0.05,w*0.46,-h*0.52);c.closePath();c.fill();
    c.fillStyle='rgba(255,240,200,.28)';c.beginPath();c.ellipse(-w*0.18,-h*0.36,0.06,0.16,0.3,0,TAU);c.fill();
    c.fillStyle='#3a2a10';c.fillRect(-w*0.46,-h*0.55,w*0.92,0.06);
    c.fillStyle=g;c.beginPath();c.moveTo(-0.08,0);c.lineTo(0.08,0);c.lineTo(0,0.18);c.closePath();c.fill();
    if(stun&&Math.random()<0.2)this.world.game.particles.spawn({kind:'smoke',x:this.cx,y:this.y,vx:0,vy:-0.8,life:1,size:0.2,grow:0.6,col:'#3a342c',drag:1,a:0.4});
    game.renderer.glowAdd(this.cx,this.y+0.3,0.9+wind*0.8,fc,stun?0.1:0.35+0.35*wind);
  }
}
/* МОКРИЦА — сервисная тележка-уборщик: ползёт по полу, у края и у стены разворачивается.
   Атак нет — только контакт. Два удара ключом; ударом вниз от неё отскакивают. На ней учатся бить. */
class Mokrica extends Enemy{
  constructor(world,def,x,y){
    super(world,Object.assign({w:1.1,h:0.62,hp:52,dmg:1,aggro:6,blood:'#5a4a30'},def),x,y);
    this.face=def.face||(rng(x*17+3)()<0.5?-1:1);this.curl=0;this.leg=0;this.skT=0;}
  hurt(dmg,kx,ky){super.hurt(dmg,kx*0.6,Math.min(ky,0)*0.5);if(!this.dead)this.curl=0.45;}
  ai(dt){
    if(this.alert>0)this.alert-=dt;
    if(this.sensePlayer()>0)this.alert=2;
    if(this.curl>0){this.curl-=dt;this.vx=damp(this.vx,0,10,dt);return;}
    const R=this.world.room;
    if(this.onGround){
      const fx=this.face>0?this.x+this.w:this.x-0.14;
      const ahead={x:fx,y:this.bottom+0.04,w:0.14,h:0.3};
      const floor=R.solids.some(s=>!s.hidden&&aabb(ahead,s));
      const hz=(R.hazards||[]).some(h=>aabb({x:fx,y:this.y,w:0.14,h:this.h+0.35},h));
      const pt=this.def.patrol;
      const out=pt&&((this.face<0&&this.cx<pt[0])||(this.face>0&&this.cx>pt[1]));
      if(!floor||hz||this.wall===this.face||out)this.face=-this.face;
    }
    this.vx=damp(this.vx,this.face*(this.alert>0?2.5:1.5),8,dt);
    this.leg+=Math.abs(this.vx)*dt*7;
    this.skT-=dt;if(this.skT<=0&&this.onGround){this.skT=0.5+Math.random()*0.4;
      const p=this.world.player;if(p&&Math.abs(p.cx-this.cx)<9)this.world.game.audio.skitter();}
  }
  draw(c,t){
    const w=this.w,h=this.h,cu=this.curl>0?clamp(this.curl/0.45,0,1):0;
    c.strokeStyle='#2b241e';c.lineWidth=0.05;c.lineCap='round';
    for(let i=0;i<5;i++){const x=-w*0.4+i*w*0.2,k=Math.sin(this.leg+i*1.9)*0.07;
      c.beginPath();c.moveTo(x,-h*0.26);c.lineTo(x+0.05+k,-0.01);c.stroke();}
    c.save();c.translate(0,-h*0.18);c.scale(1,1-cu*0.28);
    for(let i=0;i<4;i++){const x=-w*0.44+i*w*0.24,sw=w*0.3,sh=h*(0.6+0.22*Math.sin((i+0.5)/4*PI));
      const g=c.createLinearGradient(0,-sh,0,0);g.addColorStop(0,'#a8925a');g.addColorStop(.55,'#6b5a34');g.addColorStop(1,'#3a3020');
      c.fillStyle=g;c.beginPath();c.ellipse(x+sw/2,0,sw*0.64,sh,0,PI,TAU);c.fill();
      c.strokeStyle='rgba(20,16,10,.75)';c.lineWidth=0.03;c.beginPath();c.ellipse(x+sw/2,0,sw*0.64,sh,0,PI,TAU);c.stroke();
      c.fillStyle='rgba(255,240,200,.2)';c.beginPath();c.ellipse(x+sw/2-0.04,-sh*0.72,sw*0.22,sh*0.1,0,0,TAU);c.fill();}
    c.restore();
    c.fillStyle='#3a3226';rr(c,w*0.36,-h*0.44,w*0.2,h*0.38,0.05);c.fill();
    c.fillStyle='#8a7a5a';for(let i=0;i<5;i++)c.fillRect(w*0.4+i*0.03,-0.1,0.015,0.1);
    const eye=this.alert>0?1:0.5+0.25*Math.sin(t*4+this.x);
    c.fillStyle=rgba('#ff3b22',eye);c.beginPath();c.arc(w*0.5,-h*0.32,0.055,0,TAU);c.fill();
    if(this.alert>0)game.renderer.glowAdd(this.cx+this.face*w*0.5,this.bottom-h*0.32,0.35,'#ff3b22',0.3);
  }
}
const ENEMY_TYPES={aristocrat:Aristocrat,censor:Censor,gardener:Gardener,clockmaker:Clockmaker,
  lampada:Lampada,mokrica:Mokrica};
