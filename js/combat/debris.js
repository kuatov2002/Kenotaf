"use strict";
/* ============================== DEBRIS / SCRAP ==============================
   Обломки — настоящие тела: отлетевшая горелка, лопнувший баллон, корпус погибшего механизма.
   Падают, отскакивают, лежат до смены комнаты. Импульс резака швыряет их — и брошенный обломок
   бьёт механизм (урон наносит железо, не импульс). Корпуса тяжёлые и летят хуже.
   Лом (сальваж) — латунные детали из сломанных узлов: курьер подбирает их на ходу → РЕМОНТ. */
class Debris extends Body{
  constructor(world,o){
    const w=o.w||0.5,h=o.h||0.5;
    super(o.x-w/2,o.y-h/2,w,h);
    this.world=world;this.vx=o.vx||0;this.vy=o.vy||0;this.rot=o.rot||0;this.vr=o.vr||0;
    this.paint=o.draw;this.mass=o.mass||1;this.corpse=!!o.corpse;this.mat=o.mat||'steel';
    this.hot=o.hot||0;this.src=o.src||null;this.face=o.face||1;this.age=0;this.flyT=0;this.hitSet=null;
    this.rest=0;this.flat=o.flat===undefined?true:o.flat;
  }
  launch(vx,vy){this.vx+=vx/this.mass;this.vy+=vy/Math.max(1,this.mass*0.7);this.vr+=(Math.random()-0.5)*16/this.mass;
    this.flyT=0.75;this.hitSet=new Set();this.rest=0;}
  update(dt){
    const g=this.world.game;this.age+=dt;if(this.flyT>0)this.flyT-=dt;
    this.vy+=CFG.gravity*dt;this.vy=clamp(this.vy,-40,30);
    const vx0=this.vx,vy0=this.vy;
    moveBody(this,dt,this.world.room.solids);
    if(this.onGround&&vy0>3.2){this.vy=-vy0*(this.corpse?0.18:0.34);this.vx*=0.72;this.vr*=0.55;
      if(vy0>7){g.audio.clatter(this.mat,Math.min(1,vy0/18));
        g.particles.burst(this.cx,this.bottom,5,{kind:'dust',col:'#7a6c5c',spd:2.2,life:0.4,size:0.08,g:8,ang:-PI/2,spread:PI});}}
    if(this.wall!==0&&Math.abs(vx0)>3){this.vx=-vx0*0.38;this.vr*=-0.6;if(Math.abs(vx0)>8)g.audio.clatter(this.mat,0.5);}
    if(this.onGround){this.vx=damp(this.vx,0,this.corpse?7:4,dt);this.vr=damp(this.vr,0,6,dt);
      if(Math.abs(this.vx)<0.3&&Math.abs(this.vr)<0.4){this.rest+=dt;
        const tgt=this.flat?Math.round(this.rot/PI)*PI:this.rot;this.rot=damp(this.rot,tgt,6,dt);}}
    this.rot+=this.vr*dt;
    if(this.hot>0){this.hot-=dt;
      if(Math.random()<dt*(this.corpse?6:4))g.particles.spawn({kind:'smoke',x:this.cx+(Math.random()-0.5)*this.w*0.5,y:this.y,
        vx:(Math.random()-0.5)*0.3,vy:-0.7,life:1.4,size:0.18,grow:0.6,col:'#2f2a26',drag:0.8,a:0.42*clamp(this.hot,0,1)});
      if(Math.random()<dt*2.5*clamp(this.hot,0,1))g.particles.burst(this.cx,this.cy,2,{kind:'spark',col:'#ffcf7a',spd:2.6,life:0.3,size:0.035,add:true,g:14});}
    /* брошенный импульсом обломок бьёт механизмы на пути */
    if(this.flyT>0&&Math.hypot(this.vx,this.vy)>7){
      const W=this.world,list=W.boss&&W.boss.activated&&!W.boss.dead?W.enemies.concat([W.boss]):W.enemies;
      for(const e of list){
        if(!e.isMech||e.dead||e===this.src&&this.age<0.4||this.hitSet.has(e))continue;
        if(!aabb(this,e.rect()))continue;
        this.hitSet.add(e);
        const sp=Math.hypot(this.vx,this.vy),dir=Math.sign(this.vx)||1;
        e.takeHit({kind:'debris',dmg:CFG.combat.debrisDmg*clamp(sp/16,0.5,1.4)*(this.corpse?1.4:1),hb:this.rect(),sx:this.cx,sy:this.cy,
          fromX:this.cx-dir,dir:dir,ky:-2});
        e.impulse(dir*4/Math.max(1,e.mass),-2,'debris');
        this.vx=-this.vx*0.3;this.vy=-4;this.flyT=0;
        g.audio.clatter(this.mat,1);g.camera.addShake(0.35);g.hitstop(0.05);
      }
    }
  }
  draw(c,t){
    c.save();c.translate(this.cx,this.cy);c.rotate(this.rot);if(this.face<0)c.scale(-1,1);
    this.paint(c,t,this);
    c.restore();
  }
}
/* лом: латунные детальки из сломанных узлов; притягиваются к курьеру и дают РЕМОНТ */
class ScrapSystem{
  constructor(world){this.world=world;this.list=[];}
  clear(){this.list.length=0;}
  spawn(x,y,n,dir){
    for(let i=0;i<n;i++)this.list.push({x,y,vx:(dir||0)*(1+Math.random()*2.5)+(Math.random()-0.5)*4,vy:-3-Math.random()*4.5,
      rot:Math.random()*TAU,vr:(Math.random()-0.5)*20,age:0,kind:(Math.random()*3)|0,rest:false,pull:false});
    if(this.list.length>60)this.list.splice(0,this.list.length-60);
  }
  update(dt){
    const W=this.world,p=W.player,g=W.game,sol=W.room.solids;
    for(const s of this.list){
      s.age+=dt;
      const dx=p?p.cx-s.x:0,dy=p?p.cy-s.y:0,d=Math.hypot(dx,dy);
      const mag=g.gs.mod('scrap_magnet');
      if(p&&!p.dead&&s.age>0.4&&d<(mag?7:2.6))s.pull=true;
      if(s.pull&&p){const sp=8+s.age*6;s.vx=damp(s.vx,dx/(d||1)*sp,10,dt);s.vy=damp(s.vy,dy/(d||1)*sp,10,dt);
        s.x+=s.vx*dt;s.y+=s.vy*dt;s.rot+=dt*14;
        if(d<0.45){s.dead=true;g.combat.gainWeld(CFG.combat.scrapWeld*(mag?1.5:1));g.audio.scrap();
          g.particles.burst(s.x,s.y,4,{kind:'spark',col:'#ffe6a3',spd:2.5,life:0.25,size:0.035,add:true,g:4});}
        continue;}
      if(s.rest)continue;
      s.vy+=CFG.gravity*0.8*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.rot+=s.vr*dt;
      for(const q of sol){if(q.hidden)continue;
        if(s.x>q.x&&s.x<q.x+q.w&&s.y>q.y&&s.y<q.y+q.h){
          if(s.vy>0&&s.y-s.vy*dt<=q.y+0.05){s.y=q.y-0.04;if(s.vy>3){s.vy=-s.vy*0.35;s.vx*=0.6;}else{s.vy=0;s.vx=0;s.rest=true;}}
          else if(!q.ow){s.vx=-s.vx*0.4;s.x+=s.vx*dt*2;}
          break;}}
      if(s.age>16)s.dead=true;
    }
    if(this.list.some(s=>s.dead))this.list=this.list.filter(s=>!s.dead);
  }
  draw(c,t){
    for(const s of this.list){
      const a=s.age>14?clamp((16-s.age)/2,0,1):1;if(a<=0)continue;
      c.save();c.globalAlpha=a;c.translate(s.x,s.y);c.rotate(s.rot);
      if(s.kind===0){MK.bolt(c,0,0,0.07,'brass');}
      else if(s.kind===1){c.fillStyle='#c9a227';c.beginPath();for(let k=0;k<6;k++){const an=k/6*TAU;c.lineTo(Math.cos(an)*0.09,Math.sin(an)*0.09);}
        c.closePath();c.fill();c.fillStyle='#3a2c0c';c.beginPath();c.arc(0,0,0.035,0,TAU);c.fill();}
      else{c.fillStyle='#b08d3e';c.fillRect(-0.1,-0.03,0.2,0.06);c.fillStyle='#fff0c0';c.fillRect(-0.1,-0.03,0.2,0.015);}
      c.restore();
      const tw=0.5+0.5*Math.sin(t*6+s.x*3);
      if(tw>0.85)this.world.game.renderer.glowAdd(s.x,s.y,0.35,'#ffe6a3',0.45*a);
    }
  }
}
