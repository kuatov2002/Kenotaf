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
    this.dashT=0;this.dashCd=0;this.airDash=1;
    this.atkT=0;this.atkCd=0;this.pulseCd=0;this.pulseT=0;
    this.invuln=0;this.hurtT=0;this.dead=false;this.deadT=0;
    this.energy=CFG.player.energy;this.energyDelay=0;this.noiseLevel=0;
    this.onCeil=false;this.gravDir=1;this.ceiling=null;this.magPull=null;this.gripDir=0;
    this.wallT=0;this.wallDir=0;this.wallLock=0;this.landT=0;this.jumpStretch=0;this.stepT=0;this.grabbed=0;
    this.scarf=[];for(let i=0;i<6;i++)this.scarf.push({x:x,y:y,vx:0,vy:0});
  }
  maxEnergy(){return this.world.game.gs.flags.energy_cap?150:CFG.player.energy;}
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
    this.jumpCutDone=false;this.jumpStretch=0.14;this.airDash=1;
    g.audio.jump();
    this.noiseLevel=Math.max(this.noiseLevel,0.3);
    g.particles.burst(this.cx,this.onCeil?this.y:this.bottom,9,
      {kind:'dust',col:'#7a6c5c',spd:2.6,life:0.42,size:0.08,g:8,ang:this.gravDir>0?-PI/2:PI/2,spread:PI*1.2});
  }
  doWallJump(dir){
    const C=CFG.player,g=this.world.game;
    this.vy=-C.wallJumpY;this.vx=-dir*C.wallJumpX;this.face=-dir;
    this.jumpBuf=0;this.didJump=true;this.coyote=0;this.jumpCutDone=false;
    this.wallT=0;this.wallLock=C.wallLock;this.airDash=1;this.jumpStretch=0.12;
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
    if(this.wallLock>0)this.wallLock-=dt;
    if(this.grabbed>0)this.grabbed-=dt;
    if(this.landT>0)this.landT-=dt;
    if(this.jumpStretch>0)this.jumpStretch-=dt;
    if(this.energyDelay>0)this.energyDelay-=dt;
    else this.energy=Math.min(this.maxEnergy(),this.energy+C.energyRegen*dt);
    if(this.jumpBuf>0)this.jumpBuf-=dt;
    const canAct=this.hurtT<=0&&g.state==='play';

    /* 1. INPUT -> INTENT */
    if(inp.consume('jump')&&canAct)this.jumpBuf=C.jumpBuf;
    const dashReq=inp.consume('dash')&&canAct;
    const atkReq=inp.consume('attack')&&canAct;
    const pulseReq=inp.consume('pulse')&&canAct;
    const holdDn=inp.dn;
    const mv=this.wallLock>0?0:inp.move;

    if(this.onCeil){this.magnetUpdate(dt,inp,mv);return;}

    /* 2. CROUCH / SLIDE (bottom фиксирован) */
    if(this.onGround&&holdDn&&!this.crouch&&this.slideCd<=0){
      if(this.setH(C.crouchH)){
        this.crouch=true;
        if(Math.abs(this.vx)>C.slideMin){
          this.slideT=C.slideTime;
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
    const sliding=this.slideT>0;
    if(this.dashT<=0&&!sliding){
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
        const f=this.onGround?C.friction:C.airDrag;
        if(Math.abs(this.vx)<=f*dt)this.vx=0;else this.vx-=(this.vx>0?1:-1)*f*dt;
      }
      const cap=sliding?C.slideSpeed:(this.crouch?C.crouchMax:C.maxRun);
      if(Math.abs(this.vx)>cap)this.vx=damp(this.vx,(this.vx>0?1:-1)*cap,C.overCap,dt);
    }else if(sliding){
      this.vx=damp(this.vx,0,1.6,dt);
      if(Math.abs(this.vx)>0.5)this.face=this.vx>0?1:-1;
    }

    /* 4. DASH */
    if(dashReq&&gs.has('dash')&&this.dashCd<=0&&(this.onGround||this.airDash>0)){
      if(!this.onGround)this.airDash--;
      this.dashT=C.dashTime;this.dashCd=0.1;
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
      if(this.dashT<=0){this.vx*=C.dashEnd;this.dashCd=C.dashCd;}
    }

    /* 5. GRAVITY */
    if(this.dashT<=0){
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
    if(this.onGround){this.coyote=C.coyote;this.airDash=1;this.wallT=0;}
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
          this.onCeil=true;this.ceiling=m;this.gravDir=-1;
          this.y=cb;this.vy=0;this.vx*=0.4;
          if(!this.setH(C.h)){this.onCeil=false;this.gravDir=1;}
          g.audio.hitMetal();g.tutorial.notify('magnet');
          g.particles.burst(this.cx,this.y,12,{kind:'spark',col:'#ffe6a3',spd:3.4,life:0.4,size:0.05,add:true,g:8});
          break;
        }
      }
    }

    /* combat */
    if(atkReq&&this.atkCd<=0&&!sliding){
      this.atkT=C.attackTime;this.atkCd=C.attackCd;
      g.audio.melee();this.noiseLevel=Math.max(this.noiseLevel,0.5);
      g.combat.melee(this);
    }
    if(pulseReq&&gs.has('pulse')&&this.pulseCd<=0){
      if(this.energy>=C.pulseCost){
        this.energy-=C.pulseCost;this.energyDelay=C.energyDelay;
        this.pulseCd=C.pulseCd;this.pulseT=0.28;
        g.audio.pulse();g.camera.addShake(0.34);g.camera.impulse(-this.face*0.22,0);
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
    if(this.y>w.room.h+6)this.kill();

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
    if(inp.consume('jump')){this.detach(true);g.tutorial.notify('detach');return;}
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
    if(!g.debugOpts.invuln){g.gs.hp--;g.hud.syncHp();}
    g.audio.hurt();g.flash(0.55,'#000');g.camera.addShake(0.5);
    if(g.gs.hp<=0){this.kill();return;}
    this.crouch=false;this.h=CFG.player.h;
    /* возврат к последней пройденной площадке (backs отсортированы по minX) */
    const bk=(h.backs||[]).filter(q=>this.cx>=q.minX).pop()||h.back;
    if(this.onCeil)this.detach(false);
    this.x=bk.x;this.y=bk.y;this.vx=0;this.vy=0;this.dashT=0;this.slideT=0;
    this.invuln=Math.max(this.invuln,1.0);this.coyote=0;this.jumpBuf=0;
  }
  /* удушье в пыльце: без отбрасывания, короткая неуязвимость */
  toxic(){
    const g=this.world.game;
    if(this.invuln>0||this.dead||g.debugOpts.invuln||g.state!=='play')return;
    g.gs.hp--;this.invuln=0.35;g.audio.hurt();g.flash(0.3,'#7a8a2a');g.hud.syncHp();
    g.hud.say('ФИЛЬТР ПУСТ.','');
    if(g.gs.hp<=0)this.kill();
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
    /* рывок = уклонение: на время рывка курьер неуязвим (сквозь пар, таран, осколки) */
    if(this.invuln>0||this.dead||this.dashT>0||g.debugOpts.invuln||g.state!=='play')return false;
    g.gs.hp--;this.invuln=CFG.player.invuln;this.hurtT=0.34;
    this.vx=(this.cx<srcX?-1:1)*CFG.player.knock;
    this.vy=this.gravDir>0?-6:6;
    if(this.onCeil)this.detach(true);
    this.dashT=0;this.slideT=0;
    g.audio.hurt();g.camera.addShake(0.75);g.hitstop(0.09);g.flash(0.32,'#8a1a10');
    g.particles.burst(this.cx,this.cy,16,{kind:'spark',col:'#c8452f',spd:6,life:0.5,size:0.06,add:true,g:14});
    g.hud.syncHp();
    if(g.gs.hp<=0)this.kill();
    return true;
  }
  draw(c,t){
    const g=this.world.game,gs=g.gs,h=this.h;
    /* шарф — мировые координаты */
    c.save();
    c.strokeStyle='#8e2b1e';c.lineWidth=0.13;c.lineCap='round';c.lineJoin='round';
    c.beginPath();c.moveTo(this.scarf[0].x,this.scarf[0].y);
    for(let i=1;i<this.scarf.length;i++)c.lineTo(this.scarf[i].x,this.scarf[i].y);
    c.stroke();
    c.strokeStyle='rgba(255,140,110,.3)';c.lineWidth=0.05;c.stroke();
    c.restore();

    c.save();
    if(this.onCeil){c.translate(this.cx,this.y);c.scale(1,-1);}   /* feet = потолок */
    else c.translate(this.cx,this.bottom);                        /* feet = физ. bottom */
    if(this.face<0)c.scale(-1,1);
    if(this.invuln>0&&Math.floor(t*22)%2===0)c.globalAlpha=0.42;

    let sx=1,sy=1;
    if(this.landT>0){const k=this.landT/0.2;sx=1+0.16*k;sy=1-0.16*k;}
    else if(this.jumpStretch>0){const k=this.jumpStretch/0.14;sx=1-0.08*k;sy=1+0.1*k;}
    else if(this.dashT>0){sx=1.1;sy=0.94;}
    if(sx!==1||sy!==1)c.scale(sx,sy);

    const st=this.state;
    const legPh=this.t*11*Math.min(1,Math.abs(this.vx)/8);
    const hipY=-h*0.46,shY=-h*0.84,headY=-h*0.96;

    /* ноги: feet точно в y=0 */
    c.strokeStyle='#2f2b28';c.lineWidth=0.15;c.lineCap='round';
    if(st==='slide'||st==='crouch'){
      const ext=st==='slide'?1:0.45;
      c.beginPath();c.moveTo(-0.06,hipY);c.lineTo(0.16+0.2*ext,-0.14);c.stroke();
      c.beginPath();c.moveTo(0.02,hipY);c.lineTo(0.24+0.24*ext,-0.2);c.stroke();
      if(gs.has('claws')){
        c.fillStyle='#c9a227';
        c.beginPath();c.arc(0.16+0.2*ext,-0.14,0.07,0,TAU);c.fill();
        c.beginPath();c.arc(0.24+0.24*ext,-0.2,0.07,0,TAU);c.fill();
      }else{
        c.fillStyle='#1c1a18';
        c.fillRect(0.1+0.2*ext,-0.2,0.2,0.07);c.fillRect(0.18+0.24*ext,-0.26,0.2,0.07);
      }
    }else{
      for(let i=0;i<2;i++){
        const ph=legPh+i*PI,run=st==='run'?1:0;
        const kx=Math.sin(ph)*0.26*run+(run?0:0.02*(i?1:-1));
        const lift=run?Math.max(0,Math.cos(ph))*0.12:0;
        const fx=kx*1.5,fy=-lift-(st==='jump'?(i?0.12:0.02):0)-(st==='fall'?0.05*i:0);
        c.strokeStyle='#2f2b28';c.lineWidth=0.15;
        c.beginPath();c.moveTo(i?0.09:-0.09,hipY);
        c.lineTo((i?0.09:-0.09)+kx*0.6,hipY+h*0.24-lift*0.5);
        c.lineTo(fx,fy);c.stroke();
        if(gs.has('claws')){
          c.fillStyle='#c9a227';c.beginPath();c.arc(fx,fy-0.02,0.075,0,TAU);c.fill();
          c.strokeStyle='#e8c96a';c.lineWidth=0.03;
          c.beginPath();c.moveTo(fx-0.05,fy);c.lineTo(fx+0.1,fy-0.06);c.stroke();
        }else{
          c.fillStyle='#1c1a18';c.fillRect(fx-0.09,fy-0.07,0.21,0.07);
        }
      }
    }
    /* торс */
    c.save();
    c.rotate(st==='run'?Math.sin(legPh)*0.05:(st==='slide'?-0.32:0));
    const jg=c.createLinearGradient(-0.3,shY,0.3,hipY);
    jg.addColorStop(0,'#5a4a3a');jg.addColorStop(.5,'#453828');jg.addColorStop(1,'#2c241a');
    c.fillStyle=jg;rr(c,-0.26,shY,0.52,hipY-shY+0.06,0.12);c.fill();
    c.save();rr(c,-0.26,shY,0.52,hipY-shY+0.06,0.12);c.clip();
    c.fillStyle=PAT(c,'ply');c.globalAlpha=0.14;c.fillRect(-0.4,shY-0.1,1.0,h);c.restore();
    c.fillStyle='#2b2318';c.fillRect(-0.27,hipY-0.1,0.54,0.11);
    c.fillStyle='#8a6d3b';rr(c,-0.35,hipY-0.16,0.2,0.26,0.04);c.fill();
    c.fillStyle='#c9a227';c.fillRect(-0.33,hipY-0.1,0.16,0.05);
    c.fillStyle='#3a3630';rr(c,-0.45,shY+0.04,0.2,h*0.36,0.07);c.fill();
    c.fillStyle='#4d4840';rr(c,-0.43,shY+0.08,0.16,h*0.13,0.04);c.fill();
    if(gs.has('dash')){
      const bg=c.createLinearGradient(-0.5,0,-0.32,0);
      bg.addColorStop(0,'#6d5416');bg.addColorStop(.4,'#e8c96a');bg.addColorStop(1,'#8a6d2a');
      c.fillStyle=bg;rr(c,-0.52,shY+0.2,0.16,h*0.2,0.07);c.fill();
      c.fillStyle='#3a3630';c.fillRect(-0.48,shY+0.2+h*0.2,0.08,0.1);
      if(this.dashT>0){c.save();c.globalCompositeOperation='lighter';
        c.fillStyle=rgba('#cfe6ee',0.6);c.beginPath();c.arc(-0.46,shY+0.32+h*0.2,0.2,0,TAU);c.fill();c.restore();}
    }
    if(gs.has('filter')){
      c.fillStyle='#5c646b';rr(c,-0.58,shY,0.18,h*0.32,0.08);c.fill();
      c.strokeStyle='#3a4046';c.lineWidth=0.05;
      c.beginPath();c.moveTo(-0.48,shY+0.02);c.quadraticCurveTo(-0.2,shY-0.18,0.02,shY-0.06);c.stroke();
    }
    if(gs.has('pulse')){
      c.fillStyle='#2b2620';rr(c,0.14,hipY-0.14,0.22,0.16,0.04);c.fill();
      c.fillStyle='#5c646b';rr(c,0.18,hipY-0.18,0.26,0.12,0.04);c.fill();
      c.fillStyle='#c9a227';c.fillRect(0.4,hipY-0.16,0.1,0.08);
      if(this.pulseT>0){c.save();c.globalCompositeOperation='lighter';
        c.fillStyle=rgba('#cfe6ee',this.pulseT*2);c.beginPath();c.arc(0.5,hipY-0.12,0.2,0,TAU);c.fill();c.restore();}
    }
    const armA=st==='attack'?(-1.2+(1-this.atkT/CFG.player.attackTime)*2.6):(st==='run'?Math.sin(legPh+PI)*0.5:-0.15);
    c.save();c.translate(0.1,shY+0.1);c.rotate(armA);
    c.strokeStyle='#4a3d2e';c.lineWidth=0.12;c.beginPath();c.moveTo(0,0);c.lineTo(0.3,0.16);c.stroke();
    c.fillStyle='#c9a227';c.beginPath();c.arc(0.33,0.18,0.07,0,TAU);c.fill();
    c.save();c.translate(0.33,0.18);c.rotate(st==='attack'?0.4:0.1);
    if(gs.has('pulse')){
      c.fillStyle='#3a4046';rr(c,-0.04,-0.06,0.42,0.13,0.04);c.fill();
      c.fillStyle='#c9a227';rr(c,0.28,-0.09,0.14,0.19,0.03);c.fill();
      c.fillStyle='#22262a';c.fillRect(0.02,-0.02,0.1,0.05);
      if(this.pulseT>0){c.save();c.globalCompositeOperation='lighter';
        const pg=c.createRadialGradient(0.5,0,0,0.5,0,0.9);
        pg.addColorStop(0,'rgba(220,245,255,.9)');pg.addColorStop(1,'rgba(140,210,240,0)');
        c.fillStyle=pg;c.beginPath();c.arc(0.5,0,0.9,0,TAU);c.fill();c.restore();}
    }else{
      c.strokeStyle='#7a8087';c.lineWidth=0.06;c.beginPath();c.moveTo(0,0);c.lineTo(0.34,0);c.stroke();
      c.strokeStyle='#5c646b';c.lineWidth=0.09;c.beginPath();c.arc(0.36,0.02,0.09,PI*0.6,PI*1.9);c.stroke();
    }
    c.restore();c.restore();
    c.restore();
    /* голова */
    c.fillStyle='#3a332a';c.beginPath();c.ellipse(0.02,headY,0.2,0.19,0,0,TAU);c.fill();
    c.fillStyle='#4d453a';c.beginPath();c.arc(0.02,headY-0.03,0.2,PI,0);c.fill();
    if(gs.has('filter')){
      c.fillStyle='#5c646b';rr(c,0.06,headY-0.02,0.2,0.16,0.06);c.fill();
      c.fillStyle='#22262a';c.beginPath();c.arc(0.24,headY+0.06,0.05,0,TAU);c.fill();
    }
    const eg=c.createRadialGradient(0.14,headY+0.02,0,0.14,headY+0.02,0.13);
    eg.addColorStop(0,'rgba(255,236,180,1)');eg.addColorStop(.45,'rgba(255,190,99,.85)');eg.addColorStop(1,'rgba(255,150,60,0)');
    c.fillStyle=eg;c.beginPath();c.arc(0.14,headY+0.02,0.13,0,TAU);c.fill();
    c.fillStyle='#ffdf9a';c.beginPath();c.ellipse(0.14,headY+0.02,0.075,0.05,0,0,TAU);c.fill();
    c.fillStyle='#2b2620';c.beginPath();
    c.moveTo(-0.02,headY-0.1);c.lineTo(0.26,headY-0.06);c.lineTo(0.24,headY-0.02);c.lineTo(-0.02,headY-0.04);c.fill();
    c.strokeStyle='#7a8087';c.lineWidth=0.03;
    c.beginPath();c.moveTo(-0.14,headY-0.14);c.lineTo(-0.24,headY-0.4);c.stroke();
    c.fillStyle=rgba('#c8452f',0.6+0.4*Math.sin(t*4));c.beginPath();c.arc(-0.24,headY-0.42,0.035,0,TAU);c.fill();
    c.restore();
  }
  /* габарит спрайта для контурного рендера (шарф, антенна, перевёрнутая поза на своде) */
  spriteBounds(){return {x:this.cx-1.7,y:this.y-0.9,w:3.4,h:this.h+1.8};}
  /* эффекты поверх: следы рывка, кольца шума, свет фонаря */
  drawFx(c,t){
    const g=this.world.game,h=this.h;
    if(!this.onCeil&&this.wasGrounded){
      c.save();c.globalCompositeOperation='lighter';
      c.fillStyle='rgba(255,206,140,.10)';
      c.beginPath();c.ellipse(this.cx,this.bottom+0.02,0.42,0.09,0,0,TAU);c.fill();
      c.restore();
    }
    g.renderer.glowAdd(this.cx+this.face*0.14,this.bottom-h*0.96,0.55,'#ffbe63',0.55);
    if(this.dashT>0){
      c.save();c.globalCompositeOperation='lighter';
      const x0=Math.min(this.cx,this.cx-this.face*2.2);
      const tg=c.createLinearGradient(x0,this.cy,x0+2.2,this.cy);
      tg.addColorStop(0,'rgba(160,220,240,0)');tg.addColorStop(1,'rgba(200,240,255,.4)');
      c.fillStyle=tg;c.fillRect(x0,this.y+0.1,2.2,this.h-0.2);
      c.restore();
    }
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
