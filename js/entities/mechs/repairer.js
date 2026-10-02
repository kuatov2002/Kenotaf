"use strict";
/* ============================== РЕМОНТНИК ==============================
   Сгорбленный ремонтный механизм на обратных коленях. Силуэт: котёл-корпус наклонён вперёд,
   маска сварщика с одним красным глазом, справа — горелка со шлангом от баллона на спине,
   слева — тонкий манипулятор-клешня. Вариант «ключник» (wrench): вместо горелки — бункер
   с гайками на плече, бросает их навесом.
   Узлы:  ГОРЕЛКА / БУНКЕР (оружие) · ПРИВОД (поршни колен) · БАЛЛОН (на спине, только со спины).
   Поломки меняют механизм, а не цифры:
     оружие → рука отрывается, остаётся клешня: короткий выпад вместо факела / броска;
     привод → хромает, медленно разворачивается, без выпада;
     баллон → взрыв пара (оглушение, урон корпусу, толкает курьера, бьёт соседей); факел слабеет.
   Прерывание: импульс в момент, когда кольцо сомкнулось на горелке — факел захлёбывается,
   рука дёргается назад, 1.5 с механизм открыт. Прижатие спиной к стене рвёт баллон. */
class Repairer extends Mech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.95,h:1.55,hp:66,dmg:1,aggro:11,mass:1,bodyMat:'iron',blood:'#6b4a3a'},def),x,y);
    this.thrower=def.type==='wrench';
    this.weapon=this.thrower?'hopper':'torch';
    this.addNode({id:this.weapon,hp:52,r:0.3,mat:'brass',coreDmg:8,scrap:3});
    this.addNode({id:'drive',hp:58,r:0.3,mat:'steel',coreDmg:8,scrap:2});
    this.addNode({id:'tank',hp:30,r:0.3,mat:'brass',backOnly:true,coreDmg:26,scrap:3});
    this.limp=false;this.weakFlame=false;this.hitDone=false;this.flameK=0.1;this.claw=0;
    this.P={};this.legPh=Math.random()*TAU;this.idleT=0;this.patrolPause=0;this.lastTurn=0;this.headPop=null;
    this.pose(0);
  }
  /* --- параметры атак по тому, что уцелело --- */
  atk(){
    if(this.has('torch'))return {kind:'torch',range:this.weakFlame?1.25:1.85,wind:0.62,hot:0.3,strike:0.32,rec:0.5,node:this.node('torch')};
    if(this.has('hopper'))return {kind:'throw',range:9,minR:3.2,wind:0.56,hot:0.3,strike:0.12,rec:0.55,node:this.node('hopper')};
    if(this.limp)return {kind:'swipe',range:1.05,wind:0.5,hot:0.28,strike:0.16,rec:0.6,node:this.node('drive')||null};
    return {kind:'lunge',range:1.45,wind:0.46,hot:0.28,strike:0.18,rec:0.55,node:this.node('drive')};
  }
  attackUses(n){const a=this.atk();return a.node===n;}
  speed(){return this.limp?1.25:2.9;}
  ai(dt){
    const p=this.world.player,g=this.world.game;this.st+=dt;
    if(this.alert>0)this.alert-=dt;
    const d=this.sensePlayer();
    if(d>0){this.alert=4;this.investigate={x:p.cx,y:p.cy,t:4};}
    else if(this.investigate){this.investigate.t-=dt;if(this.investigate.t<=0)this.investigate=null;}
    const A=this.atk(),tx=this.investigate?this.investigate.x:p.cx,dd=Math.abs(tx-this.cx),want=tx>this.cx?1:-1;
    this.cd-=dt;
    /* разворот: с перебитым приводом — медленно (окно зайти за спину) */
    if(this.state!=='wind'&&this.state!=='strike'&&want!==this.face&&(this.alert>0||this.investigate)){
      this.turnT+=dt;if(this.turnT>(this.limp?0.65:0.14)){this.face=want;this.turnT=0;}}
    else this.turnT=0;
    switch(this.state){
      case 'idle':case 'hunt':case 'recover':{
        if(this.state==='recover'){this.vx=damp(this.vx,0,8,dt);if(this.st>A.rec){this.state='hunt';this.st=0;this.releaseToken();}break;}
        if(!(this.alert>0||this.investigate)){this.state='idle';this.patrol_(dt);break;}
        this.state='hunt';
        let tv=0;
        if(A.kind==='throw'){if(dd<A.minR)tv=-this.face*this.speed()*0.7;else if(dd>A.range*0.8)tv=this.face*this.speed();}
        else if(dd>A.range*0.85)tv=this.face*this.speed();
        else if(dd<A.range*0.4)tv=-this.face*this.speed()*0.5;
        /* без токена — держит дистанцию, переминается (ждёт своей очереди) */
        const inRange=A.kind==='throw'?(dd<A.range&&dd>A.minR*0.7):dd<A.range;
        if(inRange&&this.cd<=0&&this.face===want&&this.onGround&&Math.abs(p.cy-this.cy)<(A.kind==='throw'?6:1.8)){
          if(this.wantAttack()){this.state='wind';this.st=0;this.hitDone=false;this.vx=damp(this.vx,0,10,dt);
            if(A.kind==='torch')g.audio.steam(0.4);break;}
          else{tv=(Math.sin(this.t*2.3+this.x)*0.6)*this.speed()*0.3;if(dd<A.range*0.7)tv-=this.face*0.6;}
        }
        this.vx=damp(this.vx,tv,7,dt);
        break;}
      case 'wind':{
        const k=this.st/A.wind;this.vx=damp(this.vx,0,10,dt);
        this.telegraph(A.node,k,this.st>A.wind-A.hot);
        if(A.kind==='torch')this.flameK=lerp(0.12,0.5,k);
        if(this.st>=A.wind){this.state='strike';this.st=0;this.hitDone=false;
          if(A.kind==='torch'){g.audio.steam(1);g.audio.nz(0.32,500,0.5,0.06,'lowpass');}
          else if(A.kind==='throw')this.throwNut(p);
          else{g.audio.melee();this.vx=A.kind==='lunge'?this.face*7.5:this.face*1.5;}}
        break;}
      case 'strike':{
        if(A.kind==='torch'){this.flameK=1;this.vx=damp(this.vx,this.face*0.6,6,dt);
          const L=A.range+0.15,b=this.flameBox(L);
          if(!this.hitDone&&aabb(b,p.rect())){this.hitDone=true;this.damagePlayer();}
          if(Math.random()<0.7)g.particles.spawn({kind:'spark',x:this.cx+this.face*(0.8+Math.random()*L),y:b.y+Math.random()*b.h,
            vx:this.face*(3+Math.random()*4),vy:-1-Math.random()*2,life:0.3,size:0.04,col:'#ffcf7a',add:true,g:6});}
        else if(A.kind==='lunge'||A.kind==='swipe'){this.vx=damp(this.vx,0,A.kind==='lunge'?5:9,dt);
          const hb={x:this.cx+(this.face>0?0.2:-0.2-A.range),y:this.y+0.3,w:A.range,h:this.h*0.7};
          if(!this.hitDone&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}}
        if(this.st>=A.strike){this.state='recover';this.st=0;this.flameK=0.1;this.cd=0.9+Math.random()*0.7;}
        break;}
    }
    if(this.state!=='wind'&&this.state!=='strike')this.flameK=damp(this.flameK,0.1,6,dt);
  }
  patrol_(dt){
    this.releaseToken();
    if(this.patrolPause>0){this.patrolPause-=dt;this.vx=damp(this.vx,0,6,dt);return;}
    const pt=this.patrol;
    if(this.cx<pt[0]-0.3&&this.face<0){this.face=1;this.patrolPause=0.8+Math.random();}
    else if(this.cx>pt[1]+0.3&&this.face>0){this.face=-1;this.patrolPause=0.8+Math.random();}
    this.vx=damp(this.vx,this.face*this.speed()*0.45,5,dt);
  }
  flameBox(L){const yy=this.bottom+this.P.tipY;return {x:this.face>0?this.cx+this.P.tipX:this.cx-this.P.tipX-L,y:yy-0.35,w:L,h:0.7};}
  throwNut(p){
    const g=this.world.game,sx=this.cx+this.face*0.2,sy=this.bottom-1.55;
    const dx=p.cx-sx,dy=p.cy-sy,sp=9.5,tt=Math.max(0.3,Math.abs(dx)/sp);
    this.world.projectiles.push({x:sx,y:sy,vx:Math.sign(dx)*sp,vy:dy/tt-0.5*40*tt,r:0.16,dmg:1,life:3,kind:'nut',rot:0});
    g.audio.melee();this.claw=1;
  }
  /* --- последствия --- */
  onBreak(n,h){
    const g=this.world.game;
    if(n.id==='torch'||n.id==='hopper'){this.flameK=0;g.audio.steam(0.8);}
    if(n.id==='drive'){this.limp=true;g.audio.clatter('steel',1);}
    if(n.id==='tank')this.burstTank();
  }
  /* лопнул баллон: облако пара, механизм оглушён, курьера отбрасывает (без урона), соседей — бьёт */
  burstTank(){
    const g=this.world.game,W=this.world,p=W.player,x=this.cx-this.face*0.4,y=this.bottom-1.15;
    this.weakFlame=true;this.stunT=Math.max(this.stunT,0.9);this.cancelAttack();this.state='recover';
    g.audio.steamBurst();g.audio.explosion();g.camera.addShake(0.8);
    g.particles.burst(x,y,36,{kind:'steam',col:'#efe8dc',spd:7,life:1.4,size:0.55,grow:1.6,drag:1.5,a:0.75});
    g.particles.burst(x,y,16,{kind:'spark',col:'#ffd27a',spd:9,life:0.6,size:0.06,add:true,g:18});
    g.particles.spawn({kind:'shock',x,y,ringR:2.6,life:0.4,size:0.1,col:'#efe8dc',add:true,a:0.8});
    if(p&&!p.dead&&Math.hypot(p.cx-x,p.cy-y)<2.2){p.vx+=Math.sign(p.cx-x||1)*11;p.vy=Math.min(p.vy,-6);}
    for(const e of W.enemies){if(e===this||e.dead||!e.isMech||Math.hypot(e.cx-x,e.cy-y)>2.4)continue;
      e.takeHit({kind:'explosion',dmg:20,hb:e.rect(),sx:x,sy:y,fromX:x,dir:Math.sign(e.cx-x)||1,ky:-3});
      e.impulse(Math.sign(e.cx-x)*7/e.mass,-4,'pulse');}
  }
  onInterrupt(n){
    const g=this.world.game;
    if(n.id==='torch'){this.flameK=0;g.audio.steam(0.6);
      g.particles.burst(n.wx,n.wy,18,{kind:'smoke',col:'#2a2622',spd:2,life:1,size:0.3,grow:0.8,drag:1.4,a:0.6});}
    this.vx=-this.face*3;
  }
  onPin(back){if(back&&this.has('tank')){const n=this.node('tank');this.breakNode(n,{dir:this.face,sx:n.wx,sy:n.wy},false);}}
  onSlam(back){if(back&&this.has('tank')){const n=this.node('tank');n.hp=Math.min(n.hp,n.max*0.4);n.hitT=0.2;}}
  onDeath(h){
    /* голова-маска отскакивает отдельно */
    const P=this.P,W=this.world,dir=(h&&h.dir)||-this.face;
    W.addDebris({x:this.cx+this.face*P.headX,y:this.bottom+P.headY,w:0.34,h:0.3,vx:dir*3+(Math.random()-0.5)*2,vy:-6,vr:dir*12,
      mass:0.4,mat:'iron',hot:2,face:this.face,src:this,draw:(c,t)=>Repairer.drawHead(c,0,0,0,t,0)});
  }
  /* --- поза: точки скелета в локальных осях (x — вперёд, y — вверх отрицательный) --- */
  pose(dt){
    const P=this.P,s=this.state,t=this.t,A=this.atk();
    const moving=Math.abs(this.vx)>0.25&&this.onGround&&this.pinT<=0;
    this.legPh+=Math.abs(this.vx)*dt*(this.limp?2.4:3.3);
    const ph=this.legPh;
    const wk=s==='wind'?clamp(this.st/A.wind,0,1):0,sk=s==='strike'?1:0,rk=s==='recover'?clamp(1-this.st/A.rec,0,1):0;
    const open=this.openT>0||this.stunT>0,pin=this.pinT>0;
    /* корпус: сгорблен вперёд; дыхание; замах — откинуться назад, удар — выпад */
    let lean=0.36+Math.sin(t*2.1)*0.015;
    let hipX=-0.02,hipY=-0.8+Math.sin(t*2.1+1)*0.012;
    if(moving){hipY-=Math.abs(Math.sin(ph))*0.035;lean+=0.05;}
    if(this.limp){lean+=0.12+Math.sin(ph)*0.06;hipY+=0.05+Math.max(0,Math.sin(ph))*0.05;}
    if(A.kind==='torch'||A.kind==='throw'){lean+=-0.2*EZ.out(wk)+0.24*sk+0.1*rk;hipX+=-0.06*wk+0.14*sk;}
    else{lean+=0.18*wk+0.32*sk;hipY+=0.1*wk;hipX+=-0.1*wk+0.22*sk;}
    if(open){lean+=0.26+Math.sin(t*9)*0.04;hipY+=0.08;}
    if(this.stunT>0){lean+=0.2;hipY+=0.1;}
    if(pin){lean-=0.3;hipX-=0.06;}
    lean+=this.recoil*0.12*Math.sign(this.recoilDir*this.face||0);
    P.lean=lean;P.hipX=hipX;P.hipY=hipY;
    const cs=Math.cos(lean),sn=Math.sin(lean);
    const tp=(x,y)=>({x:hipX+x*cs-y*sn,y:hipY+x*sn+y*cs});
    P.tp=tp;
    const sh=tp(0.24,-0.52),shM=tp(0.04,-0.48),hd=tp(0.42,-0.5),tk=tp(-0.36,-0.36);
    P.shX=sh.x;P.shY=sh.y;P.shMX=shM.x;P.shMY=shM.y;P.headX=hd.x;P.headY=hd.y;P.tankX=tk.x;P.tankY=tk.y;
    /* рука с горелкой: плечо → локоть → запястье → сопло */
    let a1,a2;
    if(A.kind==='torch'){a1=lerp(0.9,-0.35,EZ.out(wk))*(1-sk)+0.05*sk;a2=lerp(0.15,-0.55,wk)*(1-sk)+(-0.05)*sk;
      if(rk>0){a1=lerp(0.8,a1,1-rk);a2=lerp(0.2,a2,1-rk);}}
    else if(A.kind==='throw'){a1=lerp(0.9,-1.4,EZ.out(wk))+sk*1.8;a2=lerp(0.2,-0.6,wk);}
    else{a1=1.1;a2=0.4;}
    /* горелка «наготове»: в покое у груди, сопло вниз-вперёд; вперёд уходит только на замахе */
    if(A.kind==='torch'&&s!=='wind'&&s!=='strike'){a1=lerp(1.45,a1,rk);a2=lerp(1.0,a2,rk);}
    if(open){a1=1.3+Math.sin(t*7)*0.1;a2=0.8;}
    if(moving&&s!=='wind'&&s!=='strike'){a1+=Math.sin(ph+PI)*0.18;}
    const L1=0.34,L2=0.32;
    P.elX=sh.x+Math.cos(a1)*L1;P.elY=sh.y+Math.sin(a1)*L1;
    P.wrX=P.elX+Math.cos(a1+a2-0.9)*L2;P.wrY=P.elY+Math.sin(a1+a2-0.9)*L2;
    const rest=A.kind==='torch'&&s!=='wind'&&s!=='strike'?1-rk:0;
    const na=(A.kind==='torch'?lerp(lerp(-0.1,-0.55,wk)*(1-sk),0.45,rest):(a1+a2-0.9));
    P.nozA=this.has('torch')?(open?0.9:na):a1+a2-0.9;
    P.tipX=P.wrX+Math.cos(P.nozA)*0.44;P.tipY=P.wrY+Math.sin(P.nozA)*0.44;
    /* манипулятор (дальняя рука): клешня; выпад — выброс вперёд */
    let m1=1.0+Math.sin(t*1.7)*0.05,m2=0.5;
    if(A.kind==='lunge'||A.kind==='swipe'){m1=lerp(1.0,1.9,EZ.out(wk))*(1-sk)+(-0.15)*sk;m2=lerp(0.5,1.2,wk)*(1-sk)+0.0*sk;}
    if(open){m1=1.4;m2=1.0;}
    P.mElX=shM.x+Math.cos(m1)*0.3;P.mElY=shM.y+Math.sin(m1)*0.3;
    P.mHX=P.mElX+Math.cos(m1+m2-1.1)*0.3;P.mHY=P.mElY+Math.sin(m1+m2-1.1)*0.3;P.mA=m1+m2-1.1;
    this.claw=damp(this.claw,(A.kind==='lunge'||A.kind==='swipe')&&s==='strike'?0:(s==='wind'?1:0.4),12,dt||0.016);
    /* ноги: обратное колено (IK), стопы на земле, шаг по фазе */
    const stride=this.limp?0.16:0.24,lift=this.limp?0.06:0.13;
    const legs=[];
    for(let i=0;i<2;i++){
      const hx=hipX+(i?-0.1:0.1),hy=hipY+0.02;
      let fx=(i?-0.04:0.12),fy=0;
      if(moving){const q=ph+(i?PI:0);fx+=Math.sin(q)*stride*Math.sign(this.vx*this.face||1);fy=-Math.max(0,Math.cos(q))*lift;
        if(this.limp&&i===1){fx=-0.2;fy=0;}}
      if(pin)fx+=0.1;
      const L=ik2(hx,hy,fx,fy,0.44,0.46,1);
      legs.push({hx,hy,kx:L.kx,ky:L.ky,fx:L.fx,fy:L.fy});
    }
    P.legs=legs;
    /* узлы следуют за деталями */
    const tn=this.node(this.weapon);
    if(tn){if(this.weapon==='torch'){tn.lx=(P.wrX+P.tipX)/2;tn.ly=(P.wrY+P.tipY)/2;}else{const hp=tp(0.2,-0.7);tn.lx=hp.x;tn.ly=hp.y;}}
    const dn=this.node('drive');if(dn){dn.lx=(legs[0].kx+legs[1].kx)/2;dn.ly=(legs[0].ky+legs[1].ky)/2;}
    const kn=this.node('tank');if(kn){kn.lx=tk.x;kn.ly=tk.y;}
  }
  safe(){return this.stunT>0||this.pinT>0||this.openT>0;}
  /* --- рисунок --- */
  draw(c,t){
    const P=this.P,s=this.state;
    const pin=this.pinT>0;if(pin){c.save();c.scale(0.9,1.04);}
    /* дальняя нога и манипулятор — темнее (глубина) */
    this.drawLeg(c,P.legs[1],t,true);
    this.drawArmM(c,t);
    /* баллон на спине и шланг к горелке */
    if(this.has('tank'))this.drawTank(c,P.tankX,P.tankY,P.lean,t,this.node('tank'));
    else{MK.stump(c,P.tankX+0.06,P.tankY,0.1,PI*0.9,this.node('tank').seed,t,'brass');}
    /* корпус-котёл */
    c.save();c.translate(P.hipX,P.hipY);c.rotate(P.lean);
    this.drawTorso(c,t);
    c.restore();
    Repairer.drawHead(c,P.headX,P.headY,P.lean,t,this.alert>0?1:0.55,this.openT>0||this.stunT>0);
    if(!(this.openT>0||this.stunT>0))this.world.game.renderer.glowAdd(this.cx+this.face*(P.headX+0.1),this.bottom+P.headY-0.02,0.42,'#ff3b22',this.alert>0?0.55:0.3);
    this.drawLeg(c,P.legs[0],t,false);
    this.drawArmT(c,t);
    if(pin)c.restore();
  }
  drawLeg(c,L,t,far){
    const dim=far?0.38:0;
    MK.seg(c,L.hx,L.hy,L.kx,L.ky,0.15,'iron',{});
    if(this.has('drive'))MK.piston(c,L.hx+0.06,L.hy+0.06,L.kx+0.02,L.ky+0.05,0.07,0.5);
    else if(!far){c.strokeStyle='#5c646b';c.lineWidth=0.05;c.beginPath();c.moveTo(L.hx+0.06,L.hy+0.06);c.lineTo(L.hx+0.14,L.hy+0.2);c.stroke();}
    MK.seg(c,L.kx,L.ky,L.fx,L.fy-0.06,0.12,'steel',{});
    MK.joint(c,L.kx,L.ky,0.085,'brass');
    /* стопа: чугунный башмак с носком */
    c.fillStyle='#2b2824';rr(c,L.fx-0.16,L.fy-0.1,0.34,0.1,0.04);c.fill();
    c.fillStyle='#4d4943';rr(c,L.fx-0.15,L.fy-0.1,0.32,0.04,0.02);c.fill();
    if(dim){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,6,5,'+dim+')';
      c.fillRect(Math.min(L.hx,L.kx,L.fx)-0.3,Math.min(L.hy,L.ky)-0.3,1.0,1.2);c.restore();}
  }
  drawArmM(c,t){
    const P=this.P;
    MK.seg(c,P.shMX,P.shMY,P.mElX,P.mElY,0.09,'steel',{});
    MK.seg(c,P.mElX,P.mElY,P.mHX,P.mHY,0.075,'steel',{});
    MK.joint(c,P.mElX,P.mElY,0.055,'iron');
    /* клешня: два пальца, раскрытие = this.claw */
    c.save();c.translate(P.mHX,P.mHY);c.rotate(P.mA);
    const o=0.25+0.45*this.claw;
    for(const sd of[-1,1]){c.save();c.rotate(sd*o);
      c.fillStyle='#5c646b';c.beginPath();c.moveTo(0,-0.03*sd);c.lineTo(0.2,-0.05*sd);c.lineTo(0.24,0.02*sd);c.lineTo(0.02,0.03*sd);c.closePath();c.fill();
      c.fillStyle='#c9a227';c.fillRect(0.18,-0.03,0.05,0.05);c.restore();}
    MK.joint(c,0,0,0.05,'brass');c.restore();
    c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,6,5,.3)';
    c.fillRect(Math.min(P.shMX,P.mHX)-0.35,Math.min(P.shMY,P.mHY)-0.35,1.0,1.0);c.restore();
  }
  drawTank(c,x,y,lean,t,n){
    c.save();c.translate(x,y);c.rotate(lean*0.6);
    MK.cyl(c,-0.16,-0.34,0.32,0.66,'brass',{bands:[[0.18,0.06,'copper'],[0.74,0.06,'copper']]});
    /* вентиль-барашек и манометр */
    c.fillStyle='#7a2a1c';c.beginPath();c.arc(0,-0.42,0.08,0,TAU);c.fill();
    c.strokeStyle='#ab4a33';c.lineWidth=0.025;for(let i=0;i<4;i++){const a=i*PI/2+t*0.2;c.beginPath();c.moveTo(0,-0.42);c.lineTo(Math.cos(a)*0.1,-0.42+Math.sin(a)*0.1);c.stroke();}
    Kit.gauge(c,0.02,0.02,0.08,0.55+0.1*Math.sin(t*3)-(n&&n.damaged?0.4:0));
    if(n&&n.damaged&&Math.random()<0.35){const g=this.world.game;
      g.particles.spawn({kind:'steam',x:this.cx-this.face*0.5,y:this.bottom+y,vx:-this.face*2,vy:-1,life:0.5,size:0.14,grow:0.5,col:'#efe8dc',drag:2,a:0.6});}
    c.restore();
    /* шланг: от верха баллона через плечо к горелке */
    const P=this.P;
    if(this.has('torch'))MK.hose(c,[[x+0.02,y-0.36],[P.shX-0.3,P.shY-0.5],[P.elX+0.05,P.elY-0.25],[P.wrX,P.wrY]],0.05,'#2f2b28',{ribs:true});
  }
  drawTorso(c,t){
    /* котёл: чугун с ржавыми потёками, латунная грудная пластина, решётка топки (светится ядром) */
    const core=clamp(this.hp/this.maxHp,0,1);
    MK.box(c,-0.42,-0.66,0.82,0.72,0.26,'rust',{tex:'rust',texA:0.35,seams:[0.48]});
    /* объём котла: блик по верху, тень по низу */
    c.save();rr(c,-0.42,-0.66,0.82,0.72,0.26);c.clip();
    const vg=c.createLinearGradient(0,-0.66,0,0.06);vg.addColorStop(0,'rgba(255,214,170,.22)');vg.addColorStop(0.18,'rgba(255,214,170,.06)');
    vg.addColorStop(0.6,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');c.fillStyle=vg;c.fillRect(-0.45,-0.7,0.9,0.8);
    c.fillStyle='rgba(255,230,190,.28)';c.fillRect(-0.3,-0.6,0.5,0.03);c.restore();
    /* латунный пояс-обруч */
    c.fillStyle=MK.cylGrad(c,'brass',0,-0.16,0,-0.08);c.fillRect(-0.42,-0.13,0.82,0.06);
    MK.box(c,0.02,-0.6,0.34,0.3,0.06,'brass',{bolts:0.026});
    Kit.gauge(c,0.19,-0.45,0.09,0.25+0.6*core+0.04*Math.sin(t*5));
    /* топка: решётка, за ней — жар (тусклее, когда корпус на исходе) */
    const fl=0.55+0.25*Math.sin(t*7+this.x)+0.2*Math.sin(t*13);
    c.fillStyle='#120a05';rr(c,-0.26,-0.26,0.36,0.2,0.04);c.fill();
    const g=c.createRadialGradient(-0.08,-0.16,0,-0.08,-0.16,0.24);g.addColorStop(0,rgba('#ffd27a',0.9*fl*(0.35+0.65*core)));g.addColorStop(1,'rgba(200,60,20,0)');
    c.fillStyle=g;rr(c,-0.26,-0.26,0.36,0.2,0.04);c.fill();
    c.strokeStyle='#2b2824';c.lineWidth=0.025;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-0.24+i*0.08,-0.26);c.lineTo(-0.24+i*0.08,-0.06);c.stroke();}
    for(let i=0;i<5;i++)MK.bolt(c,-0.36+i*0.17,-0.62,0.025,'steel');
    /* выхлоп на загривке */
    c.fillStyle='#2b2824';rr(c,-0.3,-0.82,0.1,0.2,0.03);c.fill();
    if(Math.random()<0.06){const P=this.P,pt=P.tp(-0.25,-0.84),g2=this.world.game;
      g2.particles.spawn({kind:'smoke',x:this.cx+this.face*pt.x,y:this.bottom+pt.y,vx:-this.face*0.3,vy:-1,life:1.2,size:0.12,grow:0.5,col:'#3a342c',drag:0.6,a:0.4});}
  }
  static drawHead(c,x,y,lean,t,eye,daze){
    c.save();c.translate(x,y);c.rotate(lean*0.4+(daze?Math.sin(t*6)*0.25:0));
    /* маска сварщика: эмаль с копотью, узкая прорезь, один красный глаз */
    MK.box(c,-0.16,-0.15,0.33,0.29,0.1,'soot',{});
    c.fillStyle='#0b0a09';rr(c,-0.02,-0.06,0.2,0.08,0.03);c.fill();
    MK.lens(c,0.1,-0.02,0.05,'#ff3b22',daze?0.25+0.2*Math.sin(t*20):eye);
    c.fillStyle='#4d4943';c.fillRect(-0.16,0.08,0.33,0.04);
    c.strokeStyle='#2b2824';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.12,-0.15);c.lineTo(-0.2,-0.3);c.stroke();
    c.restore();
    if(eye>0.8&&!daze&&typeof game!=='undefined'){}
  }
  drawArmT(c,t){
    const P=this.P,w=this.weapon;
    MK.seg(c,P.shX,P.shY,P.elX,P.elY,0.12,'iron',{});
    MK.joint(c,P.shX,P.shY,0.09,'brass');
    if(!this.has(w)){
      MK.joint(c,P.elX,P.elY,0.07,'steel');
      MK.stump(c,P.elX,P.elY,0.06,P.nozA+0.6,this.node(w).seed,t,'brass');return;}
    if(w==='torch'){
      MK.seg(c,P.elX,P.elY,P.wrX,P.wrY,0.11,'brass',{ribs:3});
      MK.joint(c,P.elX,P.elY,0.07,'steel');
      /* горелка: латунный корпус + стальное сопло */
      c.save();c.translate(P.wrX,P.wrY);c.rotate(P.nozA);
      MK.box(c,-0.06,-0.07,0.24,0.14,0.04,'brass',{});
      MK.seg(c,0.16,0,0.44,0,0.06,'steel',{});
      c.fillStyle='#1c1a18';c.fillRect(0.42,-0.035,0.04,0.07);
      c.restore();
    }else{
      /* бункер с гайками на плече + метательная лапа */
      MK.seg(c,P.elX,P.elY,P.wrX,P.wrY,0.1,'steel',{});
      MK.joint(c,P.elX,P.elY,0.07,'steel');
      const hp=P.tp(0.2,-0.72);
      c.save();c.translate(hp.x,hp.y);c.rotate(P.lean);
      MK.box(c,-0.15,-0.16,0.3,0.26,0.05,'brass',{bolts:0.022});
      c.fillStyle='#16110c';rr(c,-0.11,-0.15,0.22,0.06,0.02);c.fill();
      for(let i=0;i<3;i++){c.fillStyle='#9aa1a8';c.beginPath();c.arc(-0.07+i*0.07,-0.14,0.035,0,TAU);c.fill();}
      c.restore();
    }
  }
  /* пламя горелки — поверх контура, аддитивно */
  drawFX(c,t){
    if(this.weapon!=='torch'||!this.has('torch'))return;
    const P=this.P,n=this.node('torch');
    /* в окне прерывания / оглушении горелка захлебнулась: ни факела, ни пилотки — только дым */
    if(this.openT>0||this.stunT>0||this.pinT>0)return;
    const fk=this.flameK*(this.weakFlame?0.6:1),len=this.state==='strike'?(this.weakFlame?1.1:1.75):0.18+0.6*fk;
    MK.flame(c,P.tipX,P.tipY,len,P.nozA,clamp(fk,0.12,1),t);
    if(n.damaged&&Math.random()<0.25)MK.flame(c,P.wrX,P.wrY,0.22,P.nozA-1.2,0.6,t);
    const gx=P.tipX+Math.cos(P.nozA)*len*0.35,gy=P.tipY+Math.sin(P.nozA)*len*0.35;
    this.world.game.renderer.glowAdd(this.cx+this.face*gx,this.bottom+gy,0.35+fk*0.75,'#ffb45a',0.25+0.4*fk);
  }
  /* --- обломки --- */
  partDebris(n){
    const t0=this.t;
    if(n.id==='torch')return {w:0.62,h:0.2,mass:0.6,mat:'brass',draw:(c,t)=>{
      MK.seg(c,-0.3,0,0.02,0,0.11,'brass',{ribs:3});MK.box(c,0.0,-0.07,0.2,0.14,0.04,'brass',{});MK.seg(c,0.18,0,0.32,0,0.06,'steel',{});
      MK.wires(c,-0.3,0,PI,n.seed,t,3);}};
    if(n.id==='hopper')return {w:0.32,h:0.28,mass:0.6,mat:'brass',draw:(c,t)=>{MK.box(c,-0.15,-0.13,0.3,0.26,0.05,'brass',{bolts:0.022});}};
    if(n.id==='tank')return {w:0.3,h:0.5,mass:0.5,mat:'brass',flat:false,draw:(c,t)=>{
      MK.cyl(c,-0.15,-0.3,0.3,0.6,'brass',{bands:[[0.2,0.06,'copper']]});
      c.fillStyle='#0d0c0b';c.beginPath();c.moveTo(-0.15,0.0);c.lineTo(-0.04,-0.12);c.lineTo(0.05,0.04);c.lineTo(0.15,-0.08);c.lineTo(0.15,0.3);c.lineTo(-0.15,0.3);c.closePath();c.fill();
      c.strokeStyle='#e8c96a';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.15,0.0);c.lineTo(-0.04,-0.12);c.lineTo(0.05,0.04);c.lineTo(0.15,-0.08);c.stroke();}};
    if(n.id==='drive')return {w:0.36,h:0.12,mass:0.4,mat:'steel',draw:(c,t)=>{MK.piston(c,-0.18,0,0.18,0,0.07,0.2);MK.wires(c,0.18,0,0,n.seed,t,2);}};
    return null;
  }
  corpseDebris(){
    const self=this,lean=this.P.lean;
    return {w:1.0,h:0.5,mass:2.6,mat:'iron',draw:(c,t)=>{
      /* осевший котёл: корпус на боку, ноги подогнуты, топка дотлевает */
      c.save();c.rotate(0.15);
      MK.seg(c,-0.35,0.12,0.0,0.22,0.13,'iron',{});MK.seg(c,0.0,0.22,0.35,0.16,0.11,'steel',{});
      MK.box(c,-0.42,-0.3,0.8,0.5,0.22,'iron',{tex:'rust',texA:0.35,seams:[0.5]});
      MK.box(c,0.02,-0.26,0.3,0.22,0.05,'brass',{});
      const fl=0.3+0.2*Math.sin(t*5+self.x);
      c.fillStyle='#120a05';rr(c,-0.26,-0.06,0.32,0.14,0.04);c.fill();
      c.fillStyle=rgba('#ff8a3a',fl);rr(c,-0.24,-0.04,0.28,0.1,0.03);c.fill();
      c.restore();}};
  }
}
Object.assign(ENEMY_TYPES,{repairer:Repairer,wrench:Repairer});
