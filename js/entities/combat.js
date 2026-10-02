"use strict";
/* ============================== COMBAT ==============================
   КЕНОТАФ — «ломать, а не убивать».
     Melee (ключ)   — что я ломаю: удар находит узел механизма под собой (иначе бьёт корпус).
     Pulse (резак)  — где противник: НИ ЕДИНИЦЫ урона. Импульс по массе, срыв замаха, в окно
                      телеграфа — прерывание. Отражает снаряды, швыряет обломки.
     Dash (клапан)  — где я: сквозь механизм; на выходе — след на повреждённом узле.
   Механизмы бьют по очереди (токен атаки): игрок всегда видит, кто сейчас замахивается. */
class Combat{
  constructor(game){this.game=game;this.holder=null;this.nextGrant=0;}
  reset(){this.holder=null;this.nextGrant=0;}
  /* --- очередь атак --- */
  requestToken(e){
    const W=this.game.world;
    if(e.isBoss||e===this.holder)return true;
    if(W.calm(e))return false;
    const h=this.holder;
    if(h&&!h.dead&&h.token&&W.enemies.indexOf(h)>=0)return false;
    if(W.time<this.nextGrant)return false;
    this.holder=e;e.token=true;return true;
  }
  releaseToken(e){if(this.holder===e){this.holder=null;this.nextGrant=this.game.world.time+CFG.combat.tokenGap;}e.token=false;}
  /* рывок сквозь механизм: толчок на входе, след на выходе */
  update(dt){
    const W=this.game.world,p=W.player;if(!p)return;
    const b=W.boss,list=b&&b.isMech&&b.activated&&!b.dead?W.enemies.concat([b]):W.enemies;
    for(const e of list){
      if(!e.isMech||e.dead){e._dashHot=false;continue;}
      const ov=p.dashT>0&&!p.dead&&aabb(p.rect(),e.rect());
      if(ov&&e._dashIn!==p.dashId){e._dashIn=p.dashId;e._dashHot=true;e.dashShove(p);}
      else if(e._dashHot&&!ov){e._dashHot=false;e.dashMark(p);}
    }
  }
  /* удар ключом. sd — 'side' | 'up' | 'down'; o.heavy — тяжёлый (удержание), o.bonus — после идеального уклонения */
  melee(p,sd,o){
    sd=sd||'side';o=o||{};
    const w=this.game.world,g=this.game,C=CFG.player,f=p.face,R=w.room,heavy=!!o.heavy;
    const ext=heavy?0.4:0;
    const hb=sd==='up'?{x:p.cx-0.85-ext*0.5,y:p.y-1.55-ext,w:1.7+ext,h:1.75+ext}
      :sd==='down'?{x:p.cx-0.8-ext*0.5,y:p.bottom-0.25,w:1.6+ext,h:1.8+ext}
      :{x:p.cx+(f>0?0.1:-1.7-ext),y:p.y+0.1-ext*0.3,w:1.7+ext,h:p.h-0.15+ext*0.6};
    const sx=sd==='side'?p.cx+f*(1.0+ext*0.5):p.cx,sy=sd==='up'?p.y-0.7:sd==='down'?p.bottom+0.7:p.y+p.h*0.42;
    const kx=sd==='side'?f*7:0,ky=sd==='up'?-6:sd==='down'?4:-3.4;
    const hit={kind:heavy?'heavy':'melee',sd,dmg:C.attackDmg,hb,sx,sy,fromX:p.cx,dir:sd==='side'?f:0,
      ky:sd==='up'?-5:sd==='down'?3.5:-1.2,heavy,bonus:!!o.bonus};
    let hitAny=false,pogo=false,deflect=false,mechHit=false,plain=false;
    const strike=e=>{
      if(e.isMech){const r=e.takeHit(hit);if(!r)return;
        if(r==='deflect'){deflect=true;}else{hitAny=true;mechHit=true;this.gainWeld(heavy?CFG.combat.weldHeavy:C.weldHit);}
        if(sd==='down')pogo=true;return;}
      e.hurt(C.attackDmg*(heavy?2.2:1)*(o.bonus?1.5:1),kx*(heavy?1.6:1),ky);hitAny=true;plain=true;this.gainWeld(C.weldHit);
      if(sd==='down')pogo=true;
      if(e.type==='censor'&&sd==='side'&&f*e.face<0&&Math.random()<0.35)e.popTank();};
    for(const e of w.enemies){if(e.dead||!aabb(hb,e.isMech?e.hitBounds():e))continue;strike(e);}
    const b=w.boss;
    if(b&&!b.dead&&b.activated&&aabb(hb,b.isMech?b.hitBounds():b)){
      if(b.isMech)strike(b);
      else{if(!(b.onMelee&&b.onMelee(p)))b.hurt(C.attackDmg*(heavy?2:1),kx*0.4,-1);hitAny=true;plain=true;this.gainWeld(C.weldHit);if(sd==='down')pogo=true;}}
    for(const pb of w.pushables){
      if(pb.pushed&&pb.kind!=='counterweight')continue;
      if(!aabb(hb,pb.rect()))continue;
      if(sd==='down')pogo=true;
      if(pb.strike(sd==='side'?f:(sd==='down'?2:-2))){hitAny=true;plain=true;continue;}
      hitAny=true;plain=true;g.audio.hitMetal();
      g.particles.burst(clamp(p.cx,pb.x,pb.x+pb.w),clamp(p.cy,pb.y,pb.y+pb.h),10,{kind:'spark',col:'#ffd27a',spd:5,life:0.35,size:0.05,add:true});
    }
    /* обломки: ключ сдвигает их и отскакивает от них */
    for(const d of w.debris){if(!aabb(hb,d))continue;d.launch(sd==='side'?f*(heavy?14:6):0,sd==='up'?-9:sd==='down'?4:-3);
      if(sd==='down')pogo=true;g.audio.clatter(d.mat,0.8);hitAny=true;plain=true;}
    if(sd==='down'){
      /* клапаны-отбойники и шипы: от них отскакивают, их не ломают */
      for(const q of (R.pogos||[])){const nx=clamp(q.x,hb.x,hb.x+hb.w),ny=clamp(q.y,hb.y,hb.y+hb.h);
        if(Math.hypot(nx-q.x,ny-q.y)<(q.r||0.45)){pogo=true;q.hitT=0.25;g.audio.hitMetal();
          g.particles.burst(q.x,q.y-0.3,12,{kind:'spark',col:'#ffe6a3',spd:5,life:0.35,size:0.05,add:true,g:12});}}
      for(const h of (R.hazards||[]))if((h.kind==='spikes'||h.spiky)&&aabb(hb,{x:h.x,y:h.y-0.2,w:h.w,h:0.8}))pogo=true;
    }
    /* гайки и осколки отбиваются ключом (не волны, не орбы Архивариуса — те только импульсом) */
    for(const pr of w.projectiles){
      if(pr.back||pr.dead||pr.kind==='wave'||pr.kind==='orb'||BOSS_PR[pr.kind])continue;
      if(aabb(hb,{x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2})){pr.life=0;pr.dead=true;hitAny=true;plain=true;g.audio.hitMetal();
        g.particles.burst(pr.x,pr.y,12,{kind:'spark',col:'#ffe6a3',spd:6,life:0.4,size:0.05,add:true,g:12});}
    }
    if(pogo)p.pogo();
    else if((hitAny||deflect)&&sd==='side')p.vx-=f*(heavy?C.heavyRecoil:(p.onGround?C.recoilG:C.recoilA))*(deflect&&!hitAny?1.6:1);
    if(plain&&!mechHit){g.audio.hit();g.hitstop(heavy?0.09:CFG.hsMelee);g.camera.addShake(heavy?0.5:0.3);}
    if(hitAny||deflect)g.camera.impulse(sd==='side'?f*(heavy?0.3:0.16):0,sd==='up'?-0.12:sd==='down'?0.12:0);
    return hitAny;
  }
  gainWeld(n){const gs=this.game.gs;gs.weld=Math.min(gs.weldMax(),(gs.weld||0)+n);}
  /* импульс резака: позиция, траектория, срыв — без урона */
  pulse(p){
    const w=this.game.world,g=this.game,C=CFG.player,dir=p.face,pw=g.gs.flags.pulse_power?1.35:1,PR=C.pulseRange*pw;
    const hb={x:p.cx+(dir>0?0:-PR),y:p.cy-PR*0.55,w:PR,h:PR*1.1};
    let hitAny=false;
    for(const e of w.enemies){
      if(e.dead||!aabb(hb,e))continue;hitAny=true;
      if(e.isMech)e.applyPulse(p,dir,pw);
      else{/* немеханизмы: только толчок */const m=e.mass||1;e.vx+=dir*12/m;e.vy-=4/m;e.alert=6;
        if(e.type==='censor'&&!e.tankBroken)e.popTank();}
    }
    const b=w.boss;
    if(b&&!b.dead&&b.activated&&aabb(hb,b)){hitAny=true;if(b.isMech)b.applyPulse(p,dir,pw);else if(b.onPulse)b.onPulse(p);}
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
      }else if(pb.kind==='lead'&&!pb.pushed){
        hitAny=true;
        if(g.gs.has('breaker')){w.breakPushable(pb,dir);g.audio.breakPart('iron',true);}
        else{pb.hitT=0.25;g.audio.deflect();g.audio.mat('iron',0.6);
          g.particles.burst(clamp(p.cx+dir*1.2,pb.x,pb.x+pb.w),clamp(p.cy,pb.y,pb.y+pb.h),12,{kind:'spark',col:'#dfe4ea',spd:5,life:0.35,size:0.05,add:true,g:12});}
      }else if((pb.kind==='crate'||pb.kind==='grate')&&!pb.pushed&&!pb.floor){
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
        const inRing=Math.hypot(nx-ox,ny-oy)<CFG.player.pulseRing*pw&&(nx-p.cx)*dir>-0.8;
        if(inRing||aabb(hb,{x:wt.x-0.4,y:wt.cableTop,w:0.8,h:wt.y-wt.cableTop})||aabb(hb,box)){
          wt.state='fall';wt.vy=0;hitAny=true;
          g.audio.hitMetal();g.camera.addShake(0.4);
          g.particles.burst(wt.x,wt.y-0.3,22,{kind:'spark',col:'#ffe6a3',spd:8,life:0.55,size:0.06,add:true});
          g.tutorial.notify('weight');
        }
      }
    }
    pulseZones(w,p,dir,hb);
    /* обломки летят — импульс управляет всем, у чего есть масса */
    for(const d of w.debris){if(!aabb(hb,d))continue;d.launch(dir*19,-6);hitAny=true;}
    /* снаряды: отражаются назад; орбы Архивариуса — в ядро */
    const ox=p.cx+dir*0.6,oy=p.cy;
    for(const pr of w.projectiles){
      if(pr.back)continue;
      const inBox=aabb(hb,{x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2}),inRing=Math.hypot(pr.x-ox,pr.y-oy)<C.pulseRing*pw;
      if(pr.reflect&&(inBox||inRing)&&w.boss&&!w.boss.dead){
        const bx=w.boss.coreX,by=w.boss.coreY,d=Math.hypot(bx-pr.x,by-pr.y)||1;
        pr.vx=(bx-pr.x)/d*17;pr.vy=(by-pr.y)/d*17;pr.back=true;pr.life=3;hitAny=true;
        g.audio.hitMetal();g.tutorial.notify('reflect');
        g.particles.burst(pr.x,pr.y,16,{kind:'spark',col:'#cfe6ee',spd:7,life:0.45,size:0.06,add:true});
        continue;}
      if(inBox&&pr.kind==='gear'&&!pr.mine){pr.vx=dir*Math.max(9,Math.abs(pr.vx)*1.3);pr.vy=-6;pr.mine=true;pr.bounces=2;pr.life=4;hitAny=true;
        g.audio.deflect();g.particles.burst(pr.x,pr.y,12,{kind:'spark',col:'#dff0f6',spd:6,life:0.4,size:0.05,add:true});continue;}
      if(inBox&&pr.kind!=='wave'&&!BOSS_PR[pr.kind]){const sp=Math.max(12,Math.hypot(pr.vx,pr.vy)*1.2);
        pr.vx=dir*sp;pr.vy=-Math.abs(pr.vy)*0.2-1;pr.back=true;pr.mine=true;pr.life=2.2;hitAny=true;
        g.audio.deflect();g.particles.burst(pr.x,pr.y,10,{kind:'spark',col:'#ffd27a',spd:5,life:0.4,size:0.05,add:true});}
    }
    if(hitAny){g.hitstop(CFG.hsPulse);g.camera.addShake(0.4);}
    g.particles.spawn({kind:'ring',x:p.cx+dir*0.6,y:p.cy,ringR:3.6*pw,life:0.34,size:0.1,col:'#dff0f6',add:true,a:0.8});
    g.particles.spawn({kind:'shock',x:p.cx+dir*0.6,y:p.cy,ringR:3.0,life:0.3,size:0.08,col:'#ffffff',add:true,a:0.5});
    for(let i=0;i<10;i++)g.particles.spawn({kind:'steam',x:p.cx+dir*(0.6+Math.random()*1.6),
      y:p.cy+(Math.random()-0.5)*1.6,vx:dir*(5+Math.random()*7),vy:(Math.random()-0.5)*3,
      life:0.45,size:0.24,grow:0.7,col:'#cfe6ee',drag:3});
    g.renderer.glowAdd(p.cx+dir*1.4,p.cy,1.6,'#cfe6ee',0.6);
    g.renderer.wave(p.cx+dir*0.6,p.cy,3.8*pw,0.38);
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
