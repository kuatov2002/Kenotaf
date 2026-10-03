"use strict";
/* ============================== PLAYER ==============================
   PHYSICS: top = y, bottom = y + h.
   VISUAL : origin = (cx, bottom) — feet точно на физическом bottom.  */
class Player extends Body{
  constructor(world,x,y){
    super(x,y,CFG.player.w,CFG.player.h);
    this.world=world;this.face=1;this.state='idle';this.t=0;
    this.coyote=0;this.jumpBuf=0;this.didJump=false;this.jumpCutDone=true;
    this.wasGrounded=false;this.justLanded=false;this.justLeftGround=false;this.fallV=0;
    this.crouch=false;this.slideT=0;this.slideCd=0;
    this.dashT=0;this.dashCd=0;this.airDash=this.airDashes();
    this.atkT=0;this.atkCd=0;this.pulseCd=0;this.pulseT=0;
    this.invuln=0;this.hurtT=0;this.dead=false;this.deadT=0;
    this.energy=CFG.player.energy;this.energyDelay=0;this.noiseLevel=0;
    this.onCeil=false;this.gravDir=1;this.ceiling=null;this.magPull=null;this.gripDir=0;
    this.wallT=0;this.wallDir=0;this.wallLock=0;this.landT=0;this.jumpStretch=0;this.stepT=0;this.grabbed=0;
    this.scarf=[];for(let i=0;i<6;i++)this.scarf.push({x:x,y:y,vx:0,vy:0});
    this.healT=0;this.slashT=0;this.slashDir='side';this.slashFace=1;this.pogoT=0;this.lookT=0;this.lookV=0;
    /* удар фазами: замах → удар → восстановление; тяжёлый — удержание после взмаха */
    this.atkPhase=null;this.atkPT=0;this.atkDir='side';this.atkHeavy=false;this.chargeT=0;this.charged=false;
    /* уклонение: возраст рывка/подката, флаг идеального уклонения, бонус к следующему удару */
    this.dashId=0;this.evAge=9;this.evIF=0;this.pfDone=false;this.empowerT=0;this.slideAge=9;this.hitHeavyT=0;
    /* гарпун (трос к рыму) и выхлоп (прыжок в воздухе) */
    this.hook=null;this.hookCd=0;this.hookMiss=0;this.flingT=0;this.airJump=this.airJumps();this.vjT=0;
  }
  airJumps(){const w=this.world;return w&&w.game&&w.game.gs.has('vjump')?1:0;}
  maxEnergy(){return this.world.game.gs.flags.energy_cap?150:CFG.player.energy;}
  /* рывков в воздухе: клапан MK-II (заборник №3) даёт второй */
  airDashes(){const w=this.world;return w&&w.game&&w.game.gs.flags.dash_mk2?2:1;}
  setH(nh){
    if(Math.abs(nh-this.h)<1e-4)return true;
    const ny=this.bottom-nh;
    const test={x:this.x+0.03,y:ny+0.02,w:this.w-0.06,h:nh-0.04};
    const sols=this.world.room.solids;
    for(let i=0;i<sols.length;i++){const s=sols[i];if(s.hidden||s.ow)continue;if(aabb(test,s))return false;}
    this.y=ny;this.h=nh;return true;
  }
  doJump(){
    const C=CFG.player,g=this.world.game;
    this.vy=-C.jumpV*this.gravDir;
    this.onGround=false;this.coyote=0;this.jumpBuf=0;this.didJump=true;
    this.jumpCutDone=false;this.jumpStretch=0.14;this.airDash=this.airDashes();this.airJump=this.airJumps();
    g.audio.jump();
    this.noiseLevel=Math.max(this.noiseLevel,0.3);
    g.particles.burst(this.cx,this.onCeil?this.y:this.bottom,9,
      {kind:'dust',col:'#7a6c5c',spd:2.6,life:0.42,size:0.08,g:8,ang:this.gravDir>0?-PI/2:PI/2,spread:PI*1.2});
  }
  doWallJump(dir){
    const C=CFG.player,g=this.world.game;
    this.vy=-C.wallJumpY;this.vx=-dir*C.wallJumpX;this.face=-dir;
    this.jumpBuf=0;this.didJump=true;this.coyote=0;this.jumpCutDone=false;
    this.wallT=0;this.wallLock=C.wallLock;this.airDash=this.airDashes();this.airJump=this.airJumps();this.jumpStretch=0.12;
    g.audio.jump();
    g.particles.burst(this.cx+dir*0.35,this.cy,12,{kind:'spark',col:'#ffd27a',spd:5,life:0.4,size:0.05,add:true,g:10});
  }
  update(dt,inp){
    const w=this.world,g=w.game,gs=g.gs,C=CFG.player;
    this.t+=dt;
    if(this.dead){this.deadT+=dt;this.fallV=this.vy;moveBody(this,dt,w.room.solids);this.updateScarf(dt);return;}
    if(this.invuln>0)this.invuln-=dt;
    if(this.hurtT>0)this.hurtT-=dt;
    if(this.atkCd>0)this.atkCd-=dt;
    if(this.atkT>0)this.atkT-=dt;
    if(this.pulseCd>0)this.pulseCd-=dt;
    if(this.pulseT>0)this.pulseT-=dt;
    if(this.slideCd>0)this.slideCd-=dt;
    if(this.dashCd>0)this.dashCd-=dt;
    if(this.hookCd>0)this.hookCd-=dt;if(this.flingT>0)this.flingT-=dt;if(this.hookMiss>0)this.hookMiss-=dt;if(this.vjT>0)this.vjT-=dt;
    if(this.wallLock>0)this.wallLock-=dt;
    if(this.grabbed>0)this.grabbed-=dt;
    if(this.landT>0)this.landT-=dt;
    if(this.jumpStretch>0)this.jumpStretch-=dt;
    if(this.energyDelay>0)this.energyDelay-=dt;
    else this.energy=Math.min(this.maxEnergy(),this.energy+C.energyRegen*dt);
    if(this.jumpBuf>0)this.jumpBuf-=dt;
    if(this.slashT>0){this.slashT-=dt;
      if(this.slashDir==='down'&&!this.slashPogo&&!this.onGround&&this.vy>-3&&this.world.game.combat.slashValve(this)){this.slashPogo=true;this.pogo();}}
    if(this.pogoT>0)this.pogoT-=dt;
    if(this.restT>0)this.restT-=dt;
    this.evAge+=dt;if(this.evIF>0)this.evIF-=dt;if(this.empowerT>0)this.empowerT-=dt;
    if(this.hitHeavyT>0)this.hitHeavyT-=dt;
    /* анимация: фаза шага, стояние, след рывка, призрак уклонения */
    this.runPh=(this.runPh||0)+dt*Math.abs(this.vx)*1.32;
    this.idleT=this.state==='idle'?(this.idleT||0)+dt:0;
    if(this.dashT>0){this.trailT=(this.trailT||0)-dt;if(this.trailT<=0){this.trailT=0.03;const s=HeroArt.snap(this);
      if(s){s.a=0.5;(this.trail=this.trail||[]).push(s);if(this.trail.length>7)this.trail.shift();}}}
    if(this.trail&&this.trail.length){for(const q of this.trail)q.a-=dt*2.4;this.trail=this.trail.filter(q=>q.a>0);}
    if(this.ghosts&&this.ghosts.length){for(const q of this.ghosts)q.a-=dt*1.5;this.ghosts=this.ghosts.filter(q=>q.a>0);}
    const canAct=this.hurtT<=0&&g.state==='play'&&!(this.restT>0);

    /* 1. INPUT -> INTENT */
    if(inp.consume('jump')&&canAct)this.jumpBuf=C.jumpBuf;
    /* буфер ввода: нажатие ждёт в очереди (до 220 мс), пока действие не станет доступным —
       удар, нажатый за мгновение до конца восстановления, не теряется */
    const dashReq=canAct&&!this.onCeil&&gs.has('dash')&&this.dashCd<=0&&(this.onGround||this.airDash>0)&&inp.consume('dash');
    if(dashReq&&this.hook)this.hook=null;
    const holdDn=inp.dn;
    /* РЕМОНТ: держать Q/I стоя на месте — сварка шва на куртке, ячейка за порцию РЕМОНТА */
    const healing=this.updateHeal(dt,inp,canAct&&!dashReq&&this.jumpBuf<=0);
    const mv=(this.wallLock>0||healing||this.restT>0)?0:inp.move;this.mvIn=inp.move;
    /* взгляд вверх/вниз: стоишь и держишь ↑ (или сидишь) — камера заглядывает туда */
    const still=this.onGround&&Math.abs(this.vx)<0.4&&!healing;
    this.lookT=still&&(inp.up||this.crouch)?(this.lookT||0)+dt:0;
    this.lookV=this.lookT>0.42?(inp.up?-1:1):0;

    if(this.onCeil){this.hook=null;this.magnetUpdate(dt,inp,mv);return;}

    /* 2. CROUCH / SLIDE (bottom фиксирован) */
    if(this.onGround&&holdDn&&!this.crouch&&this.slideCd<=0){
      if(this.setH(C.crouchH)){
        this.crouch=true;
        if(Math.abs(this.vx)>C.slideMin){
          this.slideT=C.slideTime;this.evAge=0;this.evIF=C.evadeIF;this.pfDone=false;
          this.vx=(this.vx>0?1:-1)*C.slideSpeed;
          g.audio.slide();this.noiseLevel=0;
          g.particles.burst(this.cx,this.bottom,14,{kind:'dust',col:'#6b5f52',spd:3.2,life:0.55,size:0.09,g:6,
            ang:this.vx>0?PI:0,spread:1.1});
          g.camera.addShake(0.1);
        }
      }
    }
    if(this.crouch){
      if(this.slideT>0){
        this.slideT-=dt;
        if(Math.random()<0.45)g.particles.spawn({kind:'dust',x:this.cx-this.face*0.4,y:this.bottom-0.04,
          vx:-this.face*1.6,vy:-0.4,life:0.45,size:0.08,col:'#6b5f52',g:3});
        if(this.slideT<=0||Math.abs(this.vx)<2.4)this.slideT=0;
      }
      if(!holdDn&&this.slideT<=0&&this.setH(C.h))this.crouch=false;
    }else if(this.h!==C.h)this.setH(C.h);

    /* 3. HORIZONTAL */
    const sliding=this.slideT>0,pulled=!!(this.hook&&this.hook.mode==='pull');
    if(this.dashT<=0&&!sliding&&!pulled){
      if(mv!==0){
        const opp=(mv>0)!==(this.vx>0)&&Math.abs(this.vx)>0.35;
        const a=this.onGround?(opp?C.turnAccel:C.accel):(opp?C.airTurnAccel:C.airAccel);
        /* присед: не разгоняться выше crouchMax (подкат — быстрый, «гусиный шаг» — медленный) */
        if(!(this.crouch&&!opp&&Math.abs(this.vx)>=C.crouchMax))this.vx+=mv*a*dt;
        if(opp&&this.onGround&&Math.abs(this.vx)>5&&Math.random()<0.35){
          g.particles.spawn({kind:'dust',x:this.cx,y:this.bottom,vx:-mv*2,vy:-0.6,life:0.35,size:0.08,col:'#7a6c5c',g:5});
          if(Math.random()<0.14)g.audio.skid();
        }
        this.face=mv>0?1:-1;
      }else{
        /* после гарпуна — разгон сохраняется: в воздухе почти без торможения */
        const f=this.onGround?C.friction:(this.flingT>0?C.airDrag*0.2:C.airDrag);
        if(Math.abs(this.vx)<=f*dt)this.vx=0;else this.vx-=(this.vx>0?1:-1)*f*dt;
      }
      let cap=sliding?C.slideSpeed:(this.crouch?C.crouchMax:C.maxRun*(this.chargeT>0.12?C.heavyMove:1));
      if(this.flingT>0&&!this.onGround&&mv*this.vx>=0)cap=Math.max(cap,Math.abs(this.vx));
      if(Math.abs(this.vx)>cap)this.vx=damp(this.vx,(this.vx>0?1:-1)*cap,C.overCap,dt);
    }else if(sliding){
      this.vx=damp(this.vx,0,1.6,dt);
      if(Math.abs(this.vx)>0.5)this.face=this.vx>0?1:-1;
    }

    /* 4. DASH */
    if(dashReq){
      if(!this.onGround)this.airDash--;
      this.dashT=C.dashTime;this.dashCd=0.1;this.dashId++;this.evAge=0;this.evIF=0;this.pfDone=false;
      this.chargeT=0;this.charged=false;if(this.atkPhase==='wind')this.atkPhase=null;
      this.dashX0=this.cx;this.dashY0=this.cy;
      const d=mv!==0?mv:this.face;this.face=d>0?1:-1;
      this.vx=d*C.dashSpeed;this.vy=0;this.slideT=0;
      g.audio.dash();g.camera.addShake(0.3);g.camera.impulse(-d*0.4,0);g.hitstop(CFG.hsDash);
      this.noiseLevel=0.6;
      g.particles.burst(this.cx,this.cy,20,{kind:'steam',col:'#dff0f6',spd:5,life:0.4,size:0.3,grow:0.8,drag:3,
        ang:d>0?PI:0,spread:1.1});
      g.particles.spawn({kind:'ring',x:this.cx,y:this.cy,ringR:1.8,life:0.3,size:0.1,col:'#cfe6ee',add:true,a:0.5});
    }
    if(this.dashT>0){
      this.dashT-=dt;this.vy=0;
      if(Math.random()<0.9)g.particles.spawn({kind:'steam',x:this.cx-this.face*0.5,y:this.cy+(Math.random()-0.5)*0.7,
        vx:-this.face*3,vy:(Math.random()-0.5),life:0.32,size:0.24,grow:0.5,col:'#cfe6ee',drag:2.2});
      if(this.dashT<=0){this.vx*=C.dashEnd;this.dashCd=C.dashCd*(gs.flags.dash_cd?0.55:1);}
    }

    /* 4b. ГАРПУН: трос к латунному рыму, лебёдка тянет курьера к нему */
    if(canAct&&gs.has('hook')&&this.hookCd<=0&&!this.onCeil&&!healing&&!this.hook&&inp.consume('hook'))this.fireHook();
    if(this.hook)this.updateHook(dt);
    this.hookAim=gs.has('hook')&&!this.hook&&!this.onCeil?this.hookTarget():null;
    const pulling=!!(this.hook&&this.hook.mode==='pull');
    /* 5. GRAVITY */
    if(this.dashT<=0&&!pulling){
      let gr=CFG.gravity*this.gravDir;
      if(!this.onGround&&holdDn&&!sliding)gr*=C.fastFall;
      if(this.wallT>0&&this.vy>0)gr*=0.28;
      if(Math.abs(this.vy)<CFG.apexWin)gr*=CFG.apexGrav;
      this.vy+=gr*dt;
      this.vy=clamp(this.vy,-C.maxFall,C.maxFall);
    }

    /* 6. JUMP (до интеграции = мгновенный отклик на земле) */
    this.didJump=false;
    if(this.jumpBuf>0&&canAct){
      if(this.onGround||this.coyote>0)this.doJump();
      else if(this.wallT>0&&gs.has('claws')&&!sliding)this.doWallJump(this.wallDir||this.wall||this.face);
      else if(this.airJump>0&&!this.onCeil&&!this.hook&&this.dashT<=0)this.doAirJump();
    }
    if(!this.jumpCutDone&&!inp.jumpHeld){
      this.jumpCutDone=true;
      if(this.vy*this.gravDir<0)this.vy*=C.jumpCut;
    }

    /* 7. INTEGRATE + COLLIDE */
    this.fallV=this.vy;
    this.physics(dt);

    /* 8. GROUNDED STATE */
    const wasG=this.wasGrounded;
    this.justLanded=!wasG&&this.onGround;
    this.justLeftGround=wasG&&!this.onGround;
    this.wasGrounded=this.onGround;
    if(this.onGround){this.coyote=C.coyote;this.airDash=this.airDashes();this.airJump=this.airJumps();this.wallT=0;}
    else{
      if(this.justLeftGround&&!this.didJump)this.coyote=C.coyote;
      else if(!this.didJump)this.coyote-=dt;
    }
    if(this.justLanded){
      const v=Math.abs(this.fallV);
      this.landT=v>10?0.2:0.11;
      if(v>5){
        g.audio.land(v);
        g.camera.addShake(clamp(v*0.016,0,0.26));
        g.camera.impulse(0,clamp(v*0.006,0,0.1));
        g.particles.burst(this.cx,this.bottom,Math.round(clamp(v*0.9,6,18)),
          {kind:'dust',col:'#7a6c5c',spd:v*0.22,life:0.5,size:0.1,g:8,ang:-PI/2,spread:PI*1.3});
      }
    }
    /* 9. BUFFERED JUMP после collision */
    if(this.jumpBuf>0&&canAct&&this.onGround&&!this.didJump&&!(this.crouch&&holdDn))this.doJump();

    /* когти: цепляются ТОЛЬКО за рифлёные стены (grip) и по близости, без упора в стену —
       так прыжок «от стены к стене» срабатывает надёжно, а границы уровня не лазаются */
    const gd=(!this.onGround&&this.dashT<=0&&gs.has('claws'))?this.gripProbe():0;
    this.gripDir=gd;
    if(gd!==0){
      this.wallT=C.wallStick;this.wallDir=gd;
      const into=mv===gd||this.vx*gd>0.5;
      if(into&&this.vy>C.wallSlideMax)this.vy=C.wallSlideMax;
      if(this.vy>1&&Math.random()<0.3)
        g.particles.spawn({kind:'spark',x:this.cx+gd*0.34,y:this.cy+0.4,
          vx:-gd*1.2,vy:1.4,life:0.3,size:0.04,col:'#ffd27a',add:true,g:8});
    }else if(this.wallT>0){this.wallT-=dt;if(this.wallT<0)this.wallT=0;}

    /* магнитная тяга: латунная клёпка над головой притягивает, пока держишь прыжок */
    this.magPull=null;
    if(gs.has('magnet')&&!this.onGround&&this.gravDir>0&&this.slideT<=0&&this.dashT<=0){
      const m=this.magnetAbove();
      if(m&&(inp.jumpHeld||this.vy<0)){this.magPull=m;this.vy=Math.max(this.vy-C.magPull*dt,-15);}
    }

    /* magnet attach — после collision (известен ceiling contact) */
    if(gs.has('magnet')&&!this.onGround&&this.gravDir>0&&this.slideT<=0){
      const rects=w.room.magnetRects;
      if(rects)for(let i=0;i<rects.length;i++){
        const m=rects[i];
        if(this.cx<m.x-0.25||this.cx>m.x+m.w+0.25)continue;
        const cb=m.y+m.h;
        if((this.ceilHit||this.vy<=2.0)&&this.y>=cb-0.7&&this.y<=cb+0.34){
          this.onCeil=true;this.ceiling=m;this.gravDir=-1;this.jumpBuf=0;
          this.y=cb;this.vy=0;this.vx*=0.4;
          if(!this.setH(C.h)){this.onCeil=false;this.gravDir=1;}
          g.audio.hitMetal();g.tutorial.notify('magnet');
          g.particles.burst(this.cx,this.y,12,{kind:'spark',col:'#ffe6a3',spd:3.4,life:0.4,size:0.05,add:true,g:8});
          break;
        }
      }
    }

    /* combat: направление удара — ↑ вверх, ↓ в воздухе вниз (отскок от того, что ударил), иначе вбок.
       Отклик в том же кадре — поза замаха; удар — через atkWind. Удержание после взмаха — тяжёлый удар */
    if(canAct&&this.atkCd<=0&&!sliding&&!healing&&this.atkPhase!=='wind'&&inp.consume('attack')){
      const dir=inp.up?'up':(!this.onGround&&holdDn?'down':'side');
      this.startSwing(dir,false);
    }
    this.updateSwing(dt,inp,canAct&&!sliding&&!healing);
    if(canAct&&gs.has('pulse')&&this.pulseCd<=0&&!healing&&inp.consume('pulse')){
      if(this.energy>=C.pulseCost){
        this.energy-=C.pulseCost;this.energyDelay=C.energyDelay;
        this.pulseCd=C.pulseCd;this.pulseT=0.28;
        g.audio.pulse();g.camera.addShake(0.34);g.camera.impulse(-this.face*0.22,0);
        /* ранец стравливает давление: пар из вентиля назад-вверх */
        for(let i=0;i<8;i++)g.particles.spawn({kind:'steam',x:this.cx-this.face*0.42,y:this.bottom-this.h*0.72,vx:-this.face*(1.5+Math.random()*2.5),vy:-1.5-Math.random()*2,
          life:0.45,size:0.18,grow:0.6,col:'#dff0f6',drag:2.4,a:0.7});
        this.noiseLevel=1;g.combat.pulse(this);w.emitNoise(this.cx,this.cy,CFG.noisePulse);
      }else g.audio.denied();
    }

    /* noise & steps */
    this.noiseLevel=Math.max(0,this.noiseLevel-dt*0.9);
    if(this.onGround&&Math.abs(this.vx)>5.5)this.noiseLevel=Math.max(this.noiseLevel,0.85);
    else if(this.onGround&&Math.abs(this.vx)>1)this.noiseLevel=Math.max(this.noiseLevel,0.15);
    if(sliding)this.noiseLevel=0;
    if(this.onGround&&Math.abs(this.vx)>2){
      this.stepT-=dt*Math.abs(this.vx);
      if(this.stepT<=0){this.stepT=3.2;g.audio.step();
        g.particles.spawn({kind:'dust',x:this.cx-this.face*0.3,y:this.bottom,vx:-this.face*0.6,vy:-0.3,
          life:0.4,size:0.06,col:'#6b5f52',g:2});}
    }

    /* застрял в геометрии (дверь, подвижный блок, присед под плитой) — выталкивание */
    if(!this.onCeil&&!this.hook){const sols=w.room.solids,me={x:this.x+0.04,y:this.y+0.04,w:this.w-0.08,h:this.h-0.08};
      const inside=sols.some(s=>!s.ow&&!s.hidden&&aabb(me,s));
      if(inside){this.stuckT=(this.stuckT||0)+dt;
        if(this.stuckT>0.2){this.stuckT=0;let done=false;
          const free=(x,y)=>{const r={x:x+0.02,y:y+0.02,w:this.w-0.04,h:this.h-0.04};return !sols.some(s=>!s.ow&&!s.hidden&&aabb(r,s));};
          for(let d=0.25;d<=2.5&&!done;d+=0.25)for(const [ox,oy] of [[0,-d],[-d,0],[d,0],[0,d],[-d,-d],[d,-d]])
            if(free(this.x+ox,this.y+oy)){this.x+=ox;this.y+=oy;this.vx=0;this.vy=Math.min(this.vy,0);done=true;break;}
          if(!done&&w.arrive){this.x=w.arrive.x-this.w/2;this.y=w.arrive.y-this.h/2;this.vx=0;this.vy=0;}}}
      else this.stuckT=0;}
    /* hazards (состояние уже посчитано в World.updateHazards) */
    const hz=w.room.hazards;
    if(hz)for(let i=0;i<hz.length;i++){
      const h=hz[i];
      if(!aabb(this,h))continue;
      if(h.kind==='pit'&&h.back){this.pitFall(h);return;}
      if(h.kind==='coolant'||h.kind==='pit'){this.kill();return;}
      if(h.kind==='spikes'){g.combat.damagePlayer(1,this.cx);this.vy=-13;this.y-=0.35;}
      else if(h.kind==='steam'&&h.active)g.combat.damagePlayer(1,this.cx);
    }
    /* ниже комнаты — смерть, кроме провала в дыру-переход (шторка уже закрывается) */
    if(this.y>w.room.h+6&&!w.exiting)this.kill();

    this.updateScarf(dt);
    if(this.hurtT>0)this.state='hurt';
    else if(this.dashT>0)this.state='dash';
    else if(sliding)this.state='slide';
    else if(this.crouch)this.state='crouch';
    else if(this.atkT>0)this.state='attack';
    else if(!this.onGround)this.state=(this.vy*this.gravDir<0)?'jump':'fall';
    else if(Math.abs(this.vx)>0.6)this.state='run';
    else this.state='idle';
  }
  startSwing(dir,heavy){
    const C=CFG.player,g=this.world.game;
    this.atkPhase='wind';this.atkPT=heavy?C.heavyWind:C.atkWind;this.atkDir=dir;this.atkHeavy=heavy;
    this.atkT=this.atkPT+0.2;this.atkCd=heavy?C.heavyWind+0.2:C.attackCd;this.slashFace=this.face;this.slashDir=dir;
    this.noiseLevel=Math.max(this.noiseLevel,0.5);
    if(heavy)g.audio.heavy();else g.audio.slash(dir);
  }
  updateSwing(dt,inp,ok){
    const C=CFG.player,g=this.world.game;
    if(this.atkPhase==='wind'){
      this.atkPT-=dt;
      if(this.atkPT<=0){
        const bonus=this.empowerT>0;
        this.slashT=C.slashT*(this.atkHeavy?1.5:1);this.slashPogo=false;this.slashDir=this.atkDir;this.slashFace=this.face;this.slashHeavy=this.atkHeavy;
        const hit=g.combat.melee(this,this.atkDir,{heavy:this.atkHeavy,bonus});
        if(bonus&&hit)this.empowerT=0;
        if(this.atkHeavy){this.hitHeavyT=0.2;g.camera.addShake(0.25);
          if(this.onGround)g.particles.burst(this.cx+this.face*0.6,this.bottom,10,{kind:'dust',col:'#7a6c5c',spd:3.5,life:0.45,size:0.1,g:8,ang:-PI/2,spread:PI});}
        this.atkPhase='recover';this.atkPT=this.atkHeavy?C.heavyRecover:C.atkRecover;
      }
    }else if(this.atkPhase==='recover'){this.atkPT-=dt;if(this.atkPT<=0)this.atkPhase=null;}
    /* тяжёлый удар: держишь атаку после взмаха — давление в ранце растёт; отпустил заряженным — удар */
    const held=inp.attackHeld&&ok&&this.atkDir==='side'&&this.atkPhase!=='wind';
    if(held&&(this.atkPhase==='recover'||this.atkPhase===null)&&this.slashFace===this.face){
      const was=this.chargeT;this.chargeT+=dt;
      if(was<0.12&&this.chargeT>=0.12)g.audio.charge();
      if(!this.charged&&this.chargeT>=C.heavyHold*(g.gs.flags.heavy_fast?0.6:1)){this.charged=true;g.audio.chargeFull();
        g.particles.spawn({kind:'ring',x:this.cx,y:this.cy,ringR:1.6,life:0.3,size:0.08,col:'#ffcf7a',add:true,a:0.8});}
      if(this.chargeT>0.12&&Math.random()<dt*30)g.particles.spawn({kind:'steam',x:this.cx-this.face*0.45,y:this.bottom-this.h*0.7,
        vx:-this.face*1.5,vy:-1.5,life:0.4,size:0.18,grow:0.5,col:'#dff0f6',drag:2,a:0.6});
    }else if(this.chargeT>0){
      if(this.charged&&ok&&!inp.attackHeld)this.startSwing('side',true);
      this.chargeT=0;this.charged=false;
    }
  }
  /* идеальное уклонение: рывок или подкат за мгновение до удара — вспышка, замедление,
     мгновенное восстановление и бонус к следующему удару. Без текста */
  perfectEvade(srcX){
    const g=this.world.game,C=CFG.combat;
    this.pfDone=true;this.empowerT=C.empowerT;this.dashCd=0;this.airDash=this.airDashes();this.pulseCd=0;
    this.energy=Math.min(this.maxEnergy(),this.energy+20);
    g.slowmo(0.14,0.22);g.flash(0.14,'#dff4ff');g.audio.evade();g.camera.addShake(0.2);
    g.particles.spawn({kind:'ring',x:this.cx,y:this.cy,ringR:2.4,life:0.35,size:0.08,col:'#dff4ff',add:true,a:0.9});
    for(let i=0;i<10;i++)g.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*0.6,y:this.y+Math.random()*this.h,
      vx:(this.cx<srcX?-1:1)*(2+Math.random()*4),vy:(Math.random()-0.5)*3,life:0.35,size:0.045,col:'#dff4ff',add:true});
    const gh=HeroArt.snap(this);this.ghosts=gh?[Object.assign(gh,{a:0.85})]:[];
  }
  /* выхлоп ранца: второй прыжок в воздухе — струя пара вниз */
  doAirJump(){
    const C=CFG.player,g=this.world.game;
    this.vy=-C.jumpV*0.9;this.airJump--;this.jumpBuf=0;this.didJump=true;this.jumpCutDone=false;this.jumpStretch=0.14;this.vjT=0.3;
    g.audio.vjump();this.noiseLevel=Math.max(this.noiseLevel,0.5);
    g.particles.spawn({kind:'ring',x:this.cx,y:this.bottom,ringR:1.5,life:0.32,size:0.08,col:'#dff0f6',add:true,a:0.7});
    for(let i=0;i<12;i++)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*0.5,y:this.bottom-0.2,vx:(Math.random()-0.5)*4,vy:4+Math.random()*5,
      life:0.45,size:0.26,grow:0.9,col:'#dff0f6',drag:2.6,a:0.75});
  }
  /* гарпун: лучший рым впереди/сверху в пределах троса и в прямой видимости */
  hookTarget(){
    const A=this.world.room.anchors;if(!A||!A.length)return null;
    let best=null,bs=1e9;
    for(const a of A){if(a.hidden)continue;const dx=a.x-this.cx,dy=a.y-this.cy,d=Math.hypot(dx,dy);
      if(d>HOOK.reach||d<1.0)continue;
      if(dx*this.face<-1.0&&Math.abs(dx)>1.0)continue;
      if(!losCheck(this.world,this.cx,this.cy-0.3,a.x,a.y))continue;
      /* рым выше головы — в приоритете (он поднимает); на уровне ног — только если других нет */
      const s=(dy<-0.8?0:6)+d*0.35+dy*0.6-(dx*this.face>0?0.6:0);
      if(s<bs){bs=s;best=a;}}
    return best;
  }
  fireHook(){
    const g=this.world.game,a=this.hookTarget();this.hookCd=0.28;
    if(!a){this.hookMiss=0.2;g.audio.hookMiss();return;}
    this.dashT=0;this.slideT=0;if(this.crouch&&this.setH(CFG.player.h))this.crouch=false;
    const dx0=a.x-this.cx;
    this.hook={a,mode:'fly',t:0,len:0,d0:Math.hypot(dx0,a.y-this.cy),stuck:0,
      vert:Math.abs(dx0)<1.3,s:Math.abs(dx0)<1.3?this.face:(dx0>0?1:-1)};
    this.face=a.x>=this.cx?1:-1;g.audio.harpoon();this.noiseLevel=Math.max(this.noiseLevel,0.5);
    g.tutorial.notify('hook');
  }
  /* полёт троса → лебёдка разгоняет к рыму → курьер ПРОЛЕТАЕТ его: как только пересёк вертикаль рыма
     (или подлетел вплотную), трос отпускает, а разгон остаётся — дуга вперёд и вверх.
     Рым прямо над головой — подъём и выброс выше рыма (на уступ). Прыжок — отпустить раньше, с добавкой вверх. */
  updateHook(dt){
    const g=this.world.game,H=this.hook,C=CFG.player;H.t+=dt;
    if(H.mode==='fly'){H.len+=dt*80;
      if(H.len>=H.d0){H.mode='pull';H.t=0;g.audio.hookBite();
        g.particles.burst(H.a.x,H.a.y,10,{kind:'spark',col:'#ffe6a3',spd:4,life:0.3,size:0.05,add:true,g:8});}
      return;}
    const tx=H.a.x,ty=H.a.y+(H.vert?0.2:0.55),dx=tx-this.cx,dy=ty-this.cy,d=Math.hypot(dx,dy)||1e-3;
    const fling=(up)=>{const sp=Math.hypot(this.vx,this.vy);
      this.hook=null;this.hookCd=0.16;this.airDash=this.airDashes();this.airJump=this.airJumps();
      if(H.vert){this.vx=this.vx*0.3+this.face*2.5;this.vy=-Math.max(12.5,up);}
      else if(this.mvIn&&this.mvIn!==H.s){this.vx=this.mvIn*7;this.vy=-Math.max(10.5,up);this.face=this.mvIn;}   /* держишь назад — выброс вверх и назад */
      else{this.vx=H.s*Math.max(Math.abs(this.vx)*0.85,sp*0.7,12);this.vy=Math.min(this.vy*0.35,-Math.max(7.5,up));this.face=H.s;}
      this.flingT=0.45;this.jumpCutDone=true;g.audio.snap();
      g.particles.burst(this.cx,this.cy,10,{kind:'steam',col:'#dff0f6',spd:4,life:0.35,size:0.22,grow:0.6,drag:2.5});};
    if(this.jumpBuf>0){this.jumpBuf=0;fling(C.jumpV*0.8);this.didJump=true;g.audio.jump();return;}
    /* «пролетел рым» — только на его высоте: крутой трос, пересечённый далеко внизу, тянет дальше вверх */
    const crossed=!H.vert&&Math.abs(dy)<2.2&&(H.s>0?this.cx>tx:this.cx<tx);
    if(crossed||d<(H.vert?0.9:1.25)||H.t>1.3){fling(0);return;}
    const sp=Math.min(HOOK.speed,13+H.t*65);
    this.vx=damp(this.vx,dx/d*sp,16,dt);this.vy=damp(this.vy,dy/d*sp,16,dt);this.face=H.vert?this.face:H.s;
    /* упёрся (стена, край) — трос не тянет сквозь сталь: отпускает с тем, что набрано */
    const prog=(H.pd===undefined?d:H.pd)-d;H.pd=d;
    if(prog<sp*dt*0.15&&H.t>0.12){H.stuck+=dt;if(H.stuck>0.12){fling(0);return;}}else H.stuck=0;
    if(Math.random()<dt*40)g.particles.spawn({kind:'spark',x:this.cx,y:this.cy,vx:-dx/d*3,vy:-dy/d*3,life:0.2,size:0.035,col:'#ffe6a3',add:true});
  }
  /* сварка шва: стоя, не в рывке, есть порция РЕМОНТА и есть что латать. Урон прерывает (порция не тратится) */
  updateHeal(dt,inp,ok){
    const g=this.world.game,gs=g.gs,C=CFG.player;
    const can=ok&&inp.healHeld&&this.onGround&&!this.onCeil&&this.dashT<=0&&this.slideT<=0&&
      gs.weld>=C.healCost&&gs.hp<gs.maxHp();
    if(!can){this.healT=0;return false;}
    if(this.healT===0)g.audio.weld();
    this.healT=(this.healT||0)+dt;
    this.vx=damp(this.vx,0,14,dt);
    if(Math.random()<dt*40)g.particles.spawn({kind:'spark',x:this.cx+this.face*0.32+(Math.random()-0.5)*0.2,y:this.bottom-this.h*0.62+(Math.random()-0.5)*0.3,
      vx:(Math.random()-0.5)*5,vy:-1-Math.random()*4,life:0.3,size:0.04,col:Math.random()<0.5?'#ffe6a3':'#9fe0ff',add:true,g:14});
    if(this.healT>=C.healTime*(gs.flags.heal_fast?0.55:1)){
      this.healT=0;gs.weld-=C.healCost;gs.hp=Math.min(gs.maxHp(),gs.hp+1);g.hud.syncHp();
      g.audio.heal();g.camera.addShake(0.15);
      g.particles.spawn({kind:'ring',x:this.cx,y:this.cy,ringR:2.2,life:0.45,size:0.1,col:'#ffcf7a',add:true,a:0.8});
      g.particles.burst(this.cx,this.cy,16,{kind:'spark',col:'#ffe6a3',spd:4,life:0.5,size:0.05,add:true,g:6});}
    return true;
  }
  /* отскок от удара вниз: фиксированная высота, освежает рывок в воздухе */
  pogo(){
    const g=this.world.game,C=CFG.player;
    this.vy=-C.pogoV*this.gravDir;this.jumpCutDone=true;this.coyote=0;this.airDash=this.airDashes();this.airJump=this.airJumps();this.pogoT=0.18;
    this.dashT=0;g.audio.pogo();g.camera.addShake(0.12);
    g.particles.burst(this.cx,this.bottom+0.2,10,{kind:'spark',col:'#ffe6a3',spd:4,life:0.3,size:0.05,add:true,g:10,ang:PI/2,spread:PI*0.9});
  }
  magnetUpdate(dt,inp,mv){
    const w=this.world,g=w.game,C=CFG.player,m=this.ceiling;
    if(!m||(w.room.magnetRects||[]).indexOf(m)<0){this.detach();return;}
    if(this.invuln>0)this.invuln-=dt;
    if(this.hurtT>0)this.hurtT-=dt;
    if(this.jumpBuf>0)this.jumpBuf-=dt;
    if(mv!==0){this.vx+=mv*C.accel*0.6*dt;this.vx=clamp(this.vx,-C.maxRun*0.75,C.maxRun*0.75);this.face=mv>0?1:-1;}
    else this.vx=damp(this.vx,0,11,dt);
    const px=this.x;
    this.x+=this.vx*dt;
    const sols=w.room.solids;
    for(let i=0;i<sols.length;i++){
      const s=sols[i];if(s.hidden||s.ow||s===m)continue;
      if(!aabb(this,s))continue;
      if(this.x>px)this.x=s.x-this.w;else this.x=s.x+s.w;
      this.vx=0;
    }
    this.y=m.y+m.h;
    if(this.cx<m.x-0.2||this.cx>m.x+m.w+0.2||this.hurtT>0){this.detach();return;}
    /* прыжок уже лежит в буфере (update съел нажатие раньше) — по нему и отцепляемся */
    if(this.jumpBuf>0||inp.consume('jump')){this.jumpBuf=0;this.detach(true);g.tutorial.notify('detach');return;}
    if(inp.dn){this.detach(false);g.tutorial.notify('detach');return;}
    if(Math.random()<0.22)g.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*0.5,y:this.y,
      vy:-0.6,life:0.3,size:0.04,col:'#ffe6a3',add:true});
    this.noiseLevel=Math.max(0,this.noiseLevel-dt);
    if(Math.abs(this.vx)>1.5){this.stepT-=dt*Math.abs(this.vx);if(this.stepT<=0){this.stepT=3.4;g.audio.step();}}
    this.updateScarf(dt);
    this.state='ceil';
  }
  detach(jump){
    this.onCeil=false;this.ceiling=null;this.gravDir=1;
    if(jump){this.vy=9.5;this.didJump=true;this.jumpCutDone=false;this.jumpBuf=0;this.world.game.audio.jump();}
  }
  /* рифлёная стена вплотную слева/справа (grip:true — обе грани, 'l'/'r' — только левая/правая) */
  gripProbe(){
    const sols=this.world.room.solids,y0=this.y+0.2,y1=this.bottom-0.25,R=CFG.player.gripReach;
    for(let i=0;i<sols.length;i++){
      const s=sols[i];if(!s.grip||s.hidden||s.ow)continue;
      if(y1<=s.y||y0>=s.y+s.h)continue;
      if((s.grip===true||s.grip==='l')&&Math.abs(s.x-(this.x+this.w))<R)return 1;
      if((s.grip===true||s.grip==='r')&&Math.abs(s.x+s.w-this.x)<R)return -1;
    }
    return 0;
  }
  /* ближайшая магнитная траверса прямо над головой в пределах тяги */
  magnetAbove(){
    const rects=this.world.room.magnetRects;if(!rects)return null;
    let best=null,bd=1e9;
    for(let i=0;i<rects.length;i++){const m=rects[i],cb=m.y+m.h;
      if(this.cx<m.x-0.2||this.cx>m.x+m.w+0.2)continue;
      const d=this.y-cb;if(d<-0.4||d>CFG.player.magReach)continue;
      if(d<bd){bd=d;best=m;}}
    return best;
  }
  physics(dt){
    const sols=this.world.room.solids,vx0=this.vx,grounded=this.wasGrounded&&this.gravDir>0;
    moveBody(this,dt,sols);
    /* авто-подъём на невысокую ступень (эскалатор, обломки) без прыжка */
    if(this.wall!==0&&grounded&&this.dashT<=0){
      const dir=this.wall,C=CFG.player,pr={x:dir>0?this.x+this.w:this.x-0.08,y:this.bottom-C.stepUp-0.02,w:0.08,h:C.stepUp};
      let top=null,tall=false;
      for(let i=0;i<sols.length;i++){const s=sols[i];if(s.ow||s.hidden||!aabb(pr,s))continue;
        if(s.y<this.bottom-C.stepUp)tall=true;else if(top===null||s.y<top)top=s.y;}
      if(!tall&&top!==null&&top<this.bottom-0.01){
        const test={x:this.x+dir*0.1,y:top-this.h-0.02,w:this.w,h:this.h};
        let free=true;for(let i=0;i<sols.length;i++){const s=sols[i];if(!s.ow&&!s.hidden&&aabb(test,s)){free=false;break;}}
        if(free){this.y=top-this.h;this.x+=dir*0.1;this.vx=vx0;this.vy=0;this.onGround=true;this.wall=0;}
      }
    }
    if(!this.onGround&&this.gravDir>0&&this.vy>=-0.05){
      const gy=groundProbe(this,sols,CFG.probeEps);
      if(gy!==null){this.y=gy-this.h;this.vy=0;this.onGround=true;}
    }
  }
  neckPos(){
    if(this._neck&&!this.dead)return this._neck;
    return this.onCeil?{x:this.cx-this.face*0.16,y:this.y+this.h*0.78}
                      :{x:this.cx-this.face*0.16,y:this.bottom-this.h*0.8};
  }
  updateScarf(dt){
    const n=this.neckPos();
    this.scarf[0].x=n.x;this.scarf[0].y=n.y;
    const gd=this.onCeil?-26:26;
    for(let i=1;i<this.scarf.length;i++){
      const p=this.scarf[i],q=this.scarf[i-1];
      p.vy+=gd*dt;p.vx+=-this.vx*dt*3.4;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      const dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy)||1,L=0.24;
      p.x=q.x+dx/d*L;p.y=q.y+dy/d*L;
      p.vx*=0.86;p.vy*=0.86;
    }
  }
  /* срыв в пропасть с точкой возврата: −1 давление-ячейка, курьер у края (как в GDD: не смерть) */
  pitFall(h){
    const g=this.world.game;
    g.gs.hp--;g.hud.syncHp();
    g.audio.hurt();g.flash(0.55,'#000');g.camera.addShake(0.5);
    if(g.gs.hp<=0){this.kill();return;}
    this.crouch=false;this.h=CFG.player.h;
    /* возврат туда, откуда прыгал: точка отката, ближайшая к последней твёрдой опоре курьера.
       Раньше выбиралась по месту падения — сорвался за серединой пропасти и оказался на дальнем краю:
       ошибка переносила через препятствие */
    const ss=this.world.safeSpot,cands=[h.back].concat(h.backs||[]).filter(Boolean),dd=q=>Math.hypot(q.x-ss.x,q.y-ss.y);
    const bk=ss&&cands.length?cands.reduce((a,q)=>dd(q)<dd(a)?q:a):((h.backs||[]).filter(q=>this.cx>=q.minX).pop()||h.back);
    if(this.onCeil)this.detach(false);
    this.x=bk.x;this.y=bk.y;this.vx=0;this.vy=0;this.dashT=0;this.slideT=0;
    this.invuln=Math.max(this.invuln,1.0);this.coyote=0;this.jumpBuf=0;
  }
  /* удушье в пыльце: кашель, −1 ячейка, откат на последний пол в чистом воздухе.
     Облако без фильтра — стена, которую видно до того, как появится чем её пройти */
  choke(spot){
    const g=this.world.game;
    if(this.dead||g.state!=='play')return;
    g.gs.hp--;g.hud.syncHp();
    g.audio.hurt();g.audio.nz(0.5,900,0.7,0.06,'bandpass');g.flash(0.45,'#7a8a2a');g.camera.addShake(0.45);
    g.particles.burst(this.cx,this.y+0.4,18,{kind:'dust',col:'#dfe88a',spd:3,life:0.8,size:0.07,add:true,drag:1.4});
    if(g.gs.hp<=0){this.kill();return;}
    if(this.onCeil)this.detach(false);
    this.crouch=false;this.h=CFG.player.h;
    if(spot){this.x=spot.x;this.y=spot.y;}
    this.vx=0;this.vy=0;this.dashT=0;this.slideT=0;this.coyote=0;this.jumpBuf=0;
    this.invuln=Math.max(this.invuln,1.0);this.hurtT=0.3;
  }
  kill(){
    if(this.dead)return;
    this.dead=true;this.deadT=0;const g=this.world.game;
    g.audio.death();g.camera.addShake(0.9);
    g.particles.burst(this.cx,this.cy,30,{kind:'debris',col:'#4a3a30',spd:8,life:1.4,size:0.12,g:26});
    g.onPlayerDeath();
  }
  hurtBy(dmg,srcX){
    const g=this.world.game;
    /* рывок = уклонение: на время рывка (и первые мгновения подката) курьер неуязвим.
       Если удар пришёлся на самое начало уклонения — идеальное уклонение */
    if(!this.dead&&g.state==='play'&&(this.dashT>0||this.evIF>0)){
      if(!this.pfDone&&this.evAge<=perfectWin(g.gs))this.perfectEvade(srcX);
      return false;}
    if(this.invuln>0||this.dead||g.state!=='play')return false;
    /* сложность: «сложно» — удар снимает две ячейки */
    g.gs.hp=Math.max(0,g.gs.hp-Settings.diff().dmgTaken);this.invuln=CFG.player.invuln;this.hurtT=0.34;this.healT=0;
    this.atkPhase=null;this.chargeT=0;this.charged=false;this.hurtDir=this.cx<srcX?-1:1;
    this.vx=this.hurtDir*CFG.player.knock*1.15;
    this.vy=this.gravDir>0?-7.5:7.5;
    if(this.onCeil)this.detach(true);
    this.dashT=0;this.slideT=0;this.hook=null;
    g.audio.hurt();g.camera.addShake(0.75);g.hitstop(0.09);g.flash(0.32,'#8a1a10');
    g.particles.burst(this.cx,this.cy,16,{kind:'spark',col:'#c8452f',spd:6,life:0.5,size:0.06,add:true,g:14});
    g.hud.syncHp();
    if(g.gs.hp<=0)this.kill();
    return true;
  }
  draw(c,t){
    /* шарф — мировые координаты: два тона, к концу сужается, кончик бахромой */
    const S=this.scarf;
    c.save();c.lineCap='round';c.lineJoin='round';
    for(let i=1;i<S.length;i++){const w=0.15*(1-i/S.length*0.55);
      c.strokeStyle='#7a2418';c.lineWidth=w+0.02;c.beginPath();c.moveTo(S[i-1].x,S[i-1].y);c.lineTo(S[i].x,S[i].y);c.stroke();
      c.strokeStyle='#a8382a';c.lineWidth=w*0.55;c.beginPath();c.moveTo(S[i-1].x,S[i-1].y-0.015);c.lineTo(S[i].x,S[i].y-0.015);c.stroke();}
    const e=S[S.length-1],q=S[S.length-2],ang=Math.atan2(e.y-q.y,e.x-q.x);
    c.strokeStyle='#7a2418';c.lineWidth=0.025;
    for(const o of [-0.5,0,0.5]){c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+Math.cos(ang+o)*0.12,e.y+Math.sin(ang+o)*0.12);c.stroke();}
    c.restore();
    c.save();
    if(this.onCeil){c.translate(this.cx,this.y);c.scale(1,-1);}   /* feet = потолок */
    else c.translate(this.cx,this.bottom);                        /* feet = физ. bottom */
    if(this.face<0)c.scale(-1,1);
    if(this.invuln>0&&this.hurtT<=0&&Math.floor(t*22)%2===0)c.globalAlpha=0.42;
    let sx=1,sy=1;
    if(this.landT>0){const k=this.landT/0.2;sx=1+0.14*k;sy=1-0.14*k;}
    else if(this.jumpStretch>0){const k=this.jumpStretch/0.14;sx=1-0.08*k;sy=1+0.1*k;}
    else if(this.dashT>0){sx=1.08;sy=0.95;}
    if(sx!==1||sy!==1)c.scale(sx,sy);
    HeroArt.draw(c,this,t);
    c.restore();
    /* удар по курьеру: белая вспышка силуэта в первые доли секунды */
    if(this.hurtT>0.2){c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=clamp((this.hurtT-0.2)*6,0,0.75);
      const m=this.spriteBounds();c.fillStyle='#fff4e6';c.fillRect(m.x,m.y,m.w,m.h);c.restore();}
  }
  /* габарит спрайта для контурного рендера (шарф, антенна, перевёрнутая поза на своде) */
  spriteBounds(){return {x:this.cx-1.7,y:this.y-0.9,w:3.4,h:this.h+1.8};}
  /* эффекты поверх: следы рывка, кольца шума, свет фонаря */
  /* дуга удара: толстый полумесяц перед курьером + шлейф; вспыхивает целиком и гаснет за ~0.16 с */
  drawSlash(c,t){
    if(this.healT>0){
      /* сварка шва: голубое пятно дуги у груди, вокруг — сходящееся кольцо */
      const k=clamp(this.healT/CFG.player.healTime,0,1),hx=this.cx+this.face*0.3,hy=this.bottom-this.h*0.6;
      c.save();c.globalCompositeOperation='lighter';
      const fl=0.6+0.4*Math.sin(t*90);
      const g=c.createRadialGradient(hx,hy,0,hx,hy,0.5);g.addColorStop(0,'rgba(220,245,255,'+(0.9*fl)+')');g.addColorStop(1,'rgba(120,200,255,0)');
      c.fillStyle=g;c.beginPath();c.arc(hx,hy,0.5,0,TAU);c.fill();
      c.strokeStyle='rgba(255,207,122,'+(0.25+0.5*k)+')';c.lineWidth=0.06;
      c.beginPath();c.arc(this.cx,this.cy,2.2-1.5*k,0,TAU);c.stroke();
      c.restore();
      this.world.game.renderer.glowAdd(hx,hy,1.2,'#9fe0ff',0.5*fl);
    }
    /* заряд тяжёлого удара: голова ключа наливается жаром */
    if(this.chargeT>0.12&&this._wHead){const k=clamp((this.chargeT-0.12)/(CFG.player.heavyHold-0.12),0,1),w=this._wHead,fl=this.charged?0.75+0.25*Math.sin(t*40):k;
      c.save();c.globalCompositeOperation='lighter';const gr=c.createRadialGradient(w.x,w.y,0,w.x,w.y,0.32+0.2*k);
      gr.addColorStop(0,rgba('#fff2d0',0.8*fl));gr.addColorStop(0.4,rgba('#ffb45a',0.55*fl));gr.addColorStop(1,'rgba(255,120,40,0)');
      c.fillStyle=gr;c.beginPath();c.arc(w.x,w.y,0.32+0.2*k,0,TAU);c.fill();c.restore();
      this.world.game.renderer.glowAdd(w.x,w.y,0.8+0.6*k,'#ffb45a',0.5*fl);}
    /* импульс: вспышка у сопла резака */
    if(this.pulseT>0.14&&this._gaunt){const q=this._gaunt,k=clamp((this.pulseT-0.14)/0.14,0,1),ax=q.x+Math.cos(q.a)*this.face*0.4,ay=q.y+Math.sin(q.a)*0.4;
      c.save();c.globalCompositeOperation='lighter';const gr=c.createRadialGradient(ax,ay,0,ax,ay,0.55);
      gr.addColorStop(0,rgba('#ffffff',0.9*k));gr.addColorStop(0.4,rgba('#cfe6ee',0.6*k));gr.addColorStop(1,'rgba(140,210,240,0)');
      c.fillStyle=gr;c.beginPath();c.arc(ax,ay,0.55,0,TAU);c.fill();c.restore();}
    if(this.slashT<=0)return;
    const T=CFG.player.slashT,u=this.slashT/T,a=clamp(u*1.5,0,1),grow=clamp((1-u)*4,0.6,1);
    const dir=this.slashDir,f=this.slashFace;
    const rot=dir==='up'?-PI/2:dir==='down'?PI/2:(f>0?0:PI);
    const ox=this.cx,oy=dir==='down'?this.bottom-0.3:dir==='up'?this.y+0.5:this.y+this.h*0.45;
    const R=1.72*grow,r=1.16*grow,sw=1.18;
    const crescent=(ang,al,col)=>{c.save();c.rotate(ang);
      const g=c.createRadialGradient(0.25,0,r*0.75,0.25,0,R);
      g.addColorStop(0,'rgba('+col+',0)');g.addColorStop(0.45,'rgba('+col+','+(0.55*al)+')');g.addColorStop(1,'rgba(255,255,255,'+al+')');
      c.fillStyle=g;c.beginPath();c.arc(0,0,R,-sw,sw);c.arc(0.58,0,r,sw*0.92,-sw*0.92,true);c.closePath();c.fill();c.restore();};
    c.save();c.translate(ox,oy);c.rotate(rot);
    if(dir==='side'&&f<0)c.scale(1,-1);
    c.globalCompositeOperation='lighter';
    crescent(-0.35,0.28*a,'255,190,110');   /* шлейф: остаток взмаха чуть позади */
    crescent(0,0.95*a,'255,226,170');
    c.strokeStyle='rgba(255,255,255,'+(0.85*a)+')';c.lineWidth=0.06;c.beginPath();c.arc(0,0,R,-sw*0.95,sw*0.95);c.stroke();
    c.restore();
    const hx=dir==='side'?this.cx+f*1.3:this.cx,hy=dir==='up'?this.y-0.9:dir==='down'?this.bottom+0.9:this.y+this.h*0.45;
    this.world.game.renderer.glowAdd(hx,hy,1.6,'#ffe6a3',0.45*a);
  }
  drawFx(c,t){
    const g=this.world.game,h=this.h;
    /* трос гарпуна: от наруча к крюку (в полёте — до головы троса) */
    if(this.hook||this.hookMiss>0){const H=this.hook,ox=this.cx+this.face*0.25,oy=this.bottom-h*0.62;
      let ex,ey;if(H){const a=H.a,k=H.mode==='fly'?clamp(H.len/H.d0,0,1):1;ex=lerp(ox,a.x,k);ey=lerp(oy,a.y,k);}
      else{const k=Math.sin(clamp(this.hookMiss/0.2,0,1)*PI);ex=ox+this.face*3.2*k;ey=oy-2.4*k;}
      c.strokeStyle='#2b2620';c.lineWidth=0.07;c.beginPath();c.moveTo(ox,oy);c.lineTo(ex,ey);c.stroke();
      c.strokeStyle='rgba(255,230,170,.75)';c.lineWidth=0.025;c.beginPath();c.moveTo(ox,oy-0.02);c.lineTo(ex,ey-0.02);c.stroke();
      c.fillStyle='#c9a227';c.beginPath();c.moveTo(ex,ey-0.14);c.lineTo(ex+0.12,ey+0.08);c.lineTo(ex-0.12,ey+0.08);c.closePath();c.fill();
      g.renderer.glowAdd(ex,ey,0.6,'#ffe6a3',0.4);}
    if(this.vjT>0){c.save();c.globalCompositeOperation='lighter';const k=this.vjT/0.3;
      const gr=c.createLinearGradient(0,this.bottom,0,this.bottom+1.4);gr.addColorStop(0,rgba('#e8f6ff',0.6*k));gr.addColorStop(1,'rgba(160,210,240,0)');
      c.fillStyle=gr;c.beginPath();c.moveTo(this.cx-0.18,this.bottom-0.1);c.lineTo(this.cx+0.18,this.bottom-0.1);c.lineTo(this.cx+0.45,this.bottom+1.4);c.lineTo(this.cx-0.45,this.bottom+1.4);c.closePath();c.fill();c.restore();}
    if(!this.onCeil&&this.wasGrounded){
      c.save();c.globalCompositeOperation='lighter';
      c.fillStyle='rgba(255,206,140,.10)';
      c.beginPath();c.ellipse(this.cx,this.bottom+0.02,0.42,0.09,0,0,TAU);c.fill();
      c.restore();
    }
    g.renderer.glowAdd(this.cx+this.face*0.14,this.bottom-h*0.96,0.55,'#ffbe63',0.55);
    /* след рывка: силуэты-призраки по пути, бело-голубые, гаснут */
    if(this.trail&&this.trail.length){c.save();c.globalCompositeOperation='lighter';
      for(const q of this.trail)HeroArt.silhouette(c,q,'#7fd0ff',q.a*0.45);c.restore();}
    /* идеальное уклонение: яркий призрак на месте, где курьера «задели» */
    if(this.ghosts&&this.ghosts.length){c.save();c.globalCompositeOperation='lighter';
      for(const q of this.ghosts)HeroArt.silhouette(c,q,'#e8f8ff',q.a*0.7);c.restore();}
    /* сопло ранца на рывке: короткий голубой факел назад */
    if(this.dashT>0&&this._nozzle){const n=this._nozzle,k=clamp(this.dashT/CFG.player.dashTime,0,1);
      c.save();c.globalCompositeOperation='lighter';c.translate(n.x,n.y);if(this.face<0)c.scale(-1,1);
      const L=0.9+0.5*k,gr=c.createLinearGradient(0,0,-L,0);gr.addColorStop(0,rgba('#f4fbff',0.9));gr.addColorStop(0.3,rgba('#9fe0ff',0.7));gr.addColorStop(1,'rgba(80,160,255,0)');
      c.fillStyle=gr;c.beginPath();c.moveTo(0,-0.07);c.quadraticCurveTo(-L*0.5,-0.2,-L,0);c.quadraticCurveTo(-L*0.5,0.2,0,0.07);c.closePath();c.fill();c.restore();
      g.renderer.glowAdd(n.x,n.y,1.0,'#9fe0ff',0.5*k);}
    if(this.magPull){
      /* магнитная тяга: латунные дуги от подков к траверсе */
      const m=this.magPull,top=m.y+m.h;
      c.save();c.globalCompositeOperation='lighter';
      for(let i=0;i<3;i++){const ox=(i-1)*0.22,ph=t*30+i*2;
        c.strokeStyle=rgba('#ffe6a3',0.35+0.25*Math.sin(ph));c.lineWidth=0.05;c.beginPath();c.moveTo(this.cx+ox,this.y);
        for(let k=1;k<=5;k++){const yy=lerp(this.y,top,k/5);c.lineTo(this.cx+ox+Math.sin(ph+k*1.7)*0.16,yy);}c.stroke();}
      c.restore();g.renderer.glowAdd(this.cx,(this.y+top)/2,1.0,'#e8c96a',0.35);
    }
    if(this.noiseLevel>0.18){
      c.save();c.globalCompositeOperation='lighter';
      for(let i=0;i<2;i++){const rr2=((t*2.6+i*0.5)%1)*6;
        c.strokeStyle=rgba('#cfe6ee',this.noiseLevel*0.16*(1-rr2/6));c.lineWidth=0.06;
        c.beginPath();c.arc(this.cx,this.cy,rr2,0,TAU);c.stroke();}
      c.restore();
    }
  }
}
