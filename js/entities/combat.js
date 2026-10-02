"use strict";
/* ============================== COMBAT ============================== */
class Combat{
  constructor(game){this.game=game;}
  melee(p){
    const w=this.game.world,g=this.game,dir=p.face;
    const hb={x:p.cx+(dir>0?0.1:-1.7),y:p.y+0.1,w:1.7,h:p.h-0.15};
    let hitAny=false;
    for(const e of w.enemies){
      if(e.dead)continue;
      if(aabb(hb,e)){e.hurt(CFG.player.attackDmg,dir*7,-3.4);hitAny=true;
        if(e.type==='censor'&&dir*e.face<0&&Math.random()<0.35)e.popTank();}
    }
    if(w.boss&&!w.boss.dead&&w.boss.activated&&aabb(hb,w.boss)){
      if(!(w.boss.onMelee&&w.boss.onMelee(p)))w.boss.hurt(CFG.player.attackDmg,dir*3,-1);hitAny=true;}
    for(const pb of w.pushables){
      if(pb.pushed&&pb.kind!=='counterweight')continue;
      if(!aabb(hb,pb.rect()))continue;
      if(pb.strike(dir)){hitAny=true;continue;}
      hitAny=true;g.audio.hitMetal();
      g.particles.burst(pb.x+pb.w/2,clamp(p.cy,pb.y,pb.y+pb.h),10,{kind:'spark',col:'#ffd27a',spd:5,life:0.35,size:0.05,add:true});
    }
    if(hitAny){g.audio.hit();g.hitstop(CFG.hsMelee);g.camera.addShake(0.3);g.camera.impulse(dir*0.16,0);}
    g.particles.spawn({kind:'shock',x:p.cx+dir*0.8,y:p.cy,ringR:1.6,life:0.22,size:0.06,col:'#ffe6a3',add:true,a:0.55});
  }
  pulse(p){
    const w=this.game.world,g=this.game,C=CFG.player,dir=p.face;
    const hb={x:p.cx+(dir>0?0:-C.pulseRange),y:p.cy-C.pulseRange*0.55,w:C.pulseRange,h:C.pulseRange*1.1};
    let hitAny=false;
    for(const e of w.enemies){
      if(e.dead)continue;
      if(aabb(hb,e)){e.hurt(C.pulseDmg,dir*13,-5);hitAny=true;
        if(e.type==='censor'&&!e.tankBroken)e.popTank();}
    }
    if(w.boss&&!w.boss.dead&&w.boss.activated&&aabb(hb,w.boss)){
      if(!(w.boss.onPulse&&w.boss.onPulse(p)))w.boss.hurt(C.pulseDmg*0.6,dir*2,-1);hitAny=true;}
    for(const pb of w.pushables){
      if(!aabb(hb,pb.rect()))continue;
      if(pb.kind==='counterweight'&&!pb.pushed){
        pb.pushed=true;hitAny=true;g.gs.flag('blast_open');g.audio.hitMetal();g.camera.addShake(0.6);w.startAnim('blast');
        g.particles.burst(pb.x+pb.w/2,pb.y,24,{kind:'dust',col:'#8a7a6a',spd:4,life:1.2,size:0.14,g:14});
      }else if(pb.kind==='beam'&&!pb.pushed){
        pb.pushed=true;hitAny=true;g.audio.gate();g.camera.addShake(0.7);g.gs.flag('gh_beam');
        w.startAnim('beam',{dir:dir});w.startAnim('gardener');
        g.particles.burst(pb.x+pb.w/2,pb.y+0.4,24,{kind:'debris',col:'#8a8d7a',spd:5,life:1.0,size:0.12,g:22});
        g.particles.burst(pb.x+pb.w/2,pb.y+0.9,14,{kind:'dust',col:'#a8a48a',spd:3,life:1.2,size:0.14,g:6});
      }else if((pb.kind==='crate'||pb.kind==='grate')&&!pb.pushed){
        hitAny=true;w.breakPushable(pb,dir);
      }else if(pb.kind==='core'&&!pb.pushed){
        hitAny=true;pb.vx+=dir*11;pb.vy-=2;g.audio.hitMetal();g.camera.addShake(0.25);
        g.particles.burst(pb.x+pb.w/2,pb.y+pb.h/2,12,{kind:'spark',col:'#cfe6ee',spd:6,life:0.4,size:0.05,add:true});
      }
    }
    /* грузы: срывает и прямоугольник импульса, и его ударное кольцо (радиус как у визуального кольца) */
    if(w.boss&&!w.boss.dead&&w.room.weights){
      const ox=p.cx+dir*0.6,oy=p.cy;
      for(const wt of w.room.weights){
        if(wt.state!=='hang')continue;
        const box={x:wt.x-wt.w/2,y:wt.y-0.5,w:wt.w,h:wt.h+0.5};
        const nx=clamp(ox,box.x,box.x+box.w),ny=clamp(oy,box.y,box.y+box.h);
        const inRing=Math.hypot(nx-ox,ny-oy)<CFG.player.pulseRing&&(nx-p.cx)*dir>-0.8;
        if(inRing||aabb(hb,{x:wt.x-0.4,y:wt.cableTop,w:0.8,h:wt.y-wt.cableTop})||aabb(hb,box)){
          wt.state='fall';wt.vy=0;hitAny=true;
          g.audio.hitMetal();g.camera.addShake(0.4);
          g.particles.burst(wt.x,wt.y-0.3,22,{kind:'spark',col:'#ffe6a3',spd:8,life:0.55,size:0.06,add:true});
          g.tutorial.notify('weight');
        }
      }
    }
    const ox=p.cx+dir*0.6,oy=p.cy;
    for(const pr of w.projectiles){
      if(pr.back)continue;
      const inBox=aabb(hb,{x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2});
      if(pr.reflect&&(inBox||Math.hypot(pr.x-ox,pr.y-oy)<C.pulseRing)&&w.boss&&!w.boss.dead){
        /* отражение: осколок летит обратно в ядро Архивариуса */
        const bx=w.boss.coreX,by=w.boss.coreY,d=Math.hypot(bx-pr.x,by-pr.y)||1;
        pr.vx=(bx-pr.x)/d*17;pr.vy=(by-pr.y)/d*17;pr.back=true;pr.life=3;hitAny=true;
        g.audio.hitMetal();g.tutorial.notify('reflect');
        g.particles.burst(pr.x,pr.y,16,{kind:'spark',col:'#cfe6ee',spd:7,life:0.45,size:0.06,add:true});
        continue;}
      if(inBox){pr.life=0;pr.dead=true;hitAny=true;
        g.particles.burst(pr.x,pr.y,10,{kind:'spark',col:'#ffd27a',spd:5,life:0.4,size:0.05,add:true});}
    }
    if(hitAny){g.hitstop(CFG.hsPulse);g.camera.addShake(0.4);}
    g.particles.spawn({kind:'ring',x:p.cx+dir*0.6,y:p.cy,ringR:3.6,life:0.34,size:0.1,col:'#dff0f6',add:true,a:0.8});
    g.particles.spawn({kind:'shock',x:p.cx+dir*0.6,y:p.cy,ringR:3.0,life:0.3,size:0.08,col:'#ffffff',add:true,a:0.5});
    for(let i=0;i<10;i++)g.particles.spawn({kind:'steam',x:p.cx+dir*(0.6+Math.random()*1.6),
      y:p.cy+(Math.random()-0.5)*1.6,vx:dir*(5+Math.random()*7),vy:(Math.random()-0.5)*3,
      life:0.45,size:0.24,grow:0.7,col:'#cfe6ee',drag:3});
    g.renderer.glowAdd(p.cx+dir*1.4,p.cy,1.6,'#cfe6ee',0.6);
  }
  damagePlayer(dmg,srcX){
    const p=this.game.world.player;if(!p)return false;
    return p.hurtBy(dmg,srcX===undefined?p.cx-1:srcX);
  }
  contactDamage(p,e,dmg){
    if(p.invuln>0||p.dead)return;
    if(aabb(p.rect(),e.rect()))this.damagePlayer(dmg||e.dmg,e.cx);
  }
}
