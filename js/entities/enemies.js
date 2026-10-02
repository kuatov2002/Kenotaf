"use strict";
/* ============================== ENEMIES ============================== */
class Enemy extends Body{
  constructor(world,def,x,y){
    super(x,y,def.w||0.9,def.h||1.6);
    this.world=world;this.type=def.type;this.def=def;
    const dk=def.hp<900?Settings.diff().hp:1;this.hp=def.hp*dk;this.maxHp=def.hp*dk;this.dmg=def.dmg||1;this.face=-1;
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
/* реестр типов: механизмы (js/entities/mechs/*) добавляют себя сами */
const ENEMY_TYPES={};
