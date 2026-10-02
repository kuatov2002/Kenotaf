"use strict";
/* ============================== ЛАМПАДА ==============================
   Летучий соглядатай Цензуры: латунная чаша с огнём на трёх цепях под винтом.
   Висит на посту; увидев курьера — заходит сверху-сбоку, телеграфирует (огонь белеет,
   чаша дрожит, винт воет) и пикирует по прямой. Промах о стену или пол — оглушена и падает.
   Сверху её бьют ударом вниз — отскок: над провалами лампада — ступенька.
   Узлы: ВИНТ (сверху) · ЧАША (огонь, снизу).
     винт сломан → падает камнем и разбивается о пол (горящие угли);
     чаша сломана → огонь вываливается, пике больше не обжигает — лампада держится поодаль.
   Импульс: лёгкая (масса 0.6) — её уносит; врезалась в стену — оглушена. */
class Lampada extends Mech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.86,h:0.9,hp:46,dmg:1,aggro:10.5,mass:0.6,bodyMat:'brass',flying:true,blood:'#7a3a22'},def),x,y);
    this.addNode({id:'rotor',hp:22,r:0.3,mat:'steel',coreDmg:18,scrap:2});
    this.addNode({id:'bowl',hp:28,r:0.32,mat:'brass',coreDmg:10,scrap:2});
    this.home={x:x+this.w/2,y:y+this.h/2};this.state='idle';this.st=0;this.ph=rng(x*31+y*7)()*TAU;
    this.rot=0;this.cd=0.8;this.dv={x:0,y:1};this.fire=1;this.P={};this.pose(0);
  }
  lit(){return this.has('bowl');}
  safe(){return super.safe()||this.state==='stun'||this.state==='fall'||!this.lit();}
  threat(){return this.lit()&&(this.state==='wind'||this.state==='dive');}
  isWinding(){return this.state==='wind';}
  cancelAttack(){super.cancelAttack();if(this.state==='wind'||this.state==='dive'){this.state='reel';this.st=0;}}
  /* оглушение: винт заглох, падает, пока не раскрутится */
  bonk(){const g=this.world.game;this.state='stun';this.st=0;this.vx*=-0.3;this.vy=-2.6;this.cd=1.2;this.releaseToken();
    g.audio.mat('brass',0.8);g.camera.addShake(0.25);
    g.particles.burst(this.cx,this.cy,14,{kind:'spark',col:'#ffcf7a',spd:6,life:0.45,size:0.05,add:true,g:14});}
  physics(dt){
    const fall=this.state==='stun'||this.state==='fall';
    if(fall){this.vy+=CFG.gravity*(this.state==='fall'?1:0.55)*dt;this.vy=clamp(this.vy,-20,this.state==='fall'?26:14);}
    else if(this.knockT>0){this.vx=damp(this.vx,0,2.2,dt);this.vy=damp(this.vy,0,2.2,dt);}
    const sp=Math.hypot(this.vx,this.vy),vx0=this.vx,vy0=this.vy;
    moveBody(this,dt,this.world.room.solids);
    const hit=this.wall||this.ceilHit||this.onGround;
    if(this.state==='fall'&&this.onGround){this.crash();return;}
    if(hit&&(this.state==='dive'||(this.state==='reel'&&sp>9)))this.bonk();
    /* врезалась в стену с разгона от импульса — оглушение (как у прочих механизмов) */
    const imp=this.lastImp,fresh=imp&&this.world.time-imp.t<0.6;
    if(fresh&&this.slamCd<=0&&!this.dead&&hit&&Math.hypot(vx0,vy0)>CFG.combat.slamSpeed&&this.state!=='stun'){
      this.slamCd=0.7;const g=this.world.game;g.fx.slam(this.cx,this.cy,'brass',Math.hypot(vx0,vy0));this.bonk();}
  }
  /* винт сломан: камнем вниз, о пол — вдребезги */
  crash(){
    const g=this.world.game;g.audio.explosion();g.camera.addShake(0.5);
    g.particles.burst(this.cx,this.bottom,20,{kind:'spark',col:'#ffb45a',spd:7,life:0.7,size:0.06,add:true,g:20});
    g.particles.burst(this.cx,this.bottom,10,{kind:'smoke',col:'#2a2622',spd:2,life:1.4,size:0.4,grow:0.9,drag:1.2});
    this.hp=0;this.die({dir:Math.sign(this.vx)||-this.face});
  }
  ai(dt){
    const p=this.world.player,g=this.world.game;this.st+=dt;this.cd-=dt;
    if(this.state==='fall')return;
    const seek=(tx,ty,sp,k)=>{const dx=tx-this.cx,dy=ty-this.cy,d=Math.hypot(dx,dy)||1,v=Math.min(sp,d*2.4);
      this.vx=damp(this.vx,dx/d*v,k,dt);this.vy=damp(this.vy,dy/d*v,k,dt);};
    const see=this.sensePlayer()>0;
    if(this.alert>0)this.alert-=dt;
    if(see)this.alert=4;
    /* без огня — держится поодаль, над курьером не зависает */
    const keep=this.lit()?1.8:4.5,alt=this.lit()?2.6:4.2;
    switch(this.state){
      case 'idle':
        seek(this.home.x+Math.sin(this.t*0.55+this.ph)*1.1,this.home.y+Math.sin(this.t*1.3+this.ph)*0.3,2.2,3);
        if(see){this.state='track';this.st=0;}
        break;
      case 'track':{
        const side=this.cx<p.cx?-1:1;
        seek(p.cx+side*keep,p.y-alt,5.4,4);
        this.face=p.cx>this.cx?1:-1;
        if(this.alert<=0){this.state='home';this.st=0;this.releaseToken();}
        else if(this.lit()&&this.st>0.8&&this.cd<=0&&see&&Math.abs(this.cx-p.cx)<4&&this.cy<p.cy-0.8&&this.wantAttack()){
          this.state='wind';this.st=0;g.audio.lampWind();}
        break;}
      case 'wind':
        this.vx=damp(this.vx,0,9,dt);this.vy=damp(this.vy,-1.4,9,dt);this.face=p.cx>this.cx?1:-1;
        this.telegraph(this.node('bowl'),this.st/0.58,this.st>0.58-0.28);
        if(this.st>0.58){const dx=p.cx-this.cx,dy=p.cy+0.2-this.cy,d=Math.hypot(dx,dy)||1;
          this.dv={x:dx/d,y:dy/d};this.state='dive';this.st=0;g.audio.lampDive();}
        break;
      case 'dive':
        this.vx=this.dv.x*17;this.vy=this.dv.y*17;
        if(Math.random()<dt*70)g.particles.spawn({kind:'spark',x:this.cx,y:this.cy-0.3,vx:-this.dv.x*3,vy:-this.dv.y*3,life:0.3,size:0.05,col:'#ffb45a',add:true});
        if(this.st>0.62){this.state='rise';this.st=0;this.cd=1.3;this.releaseToken();}
        break;
      case 'rise':
        seek(this.cx-this.dv.x*1.5,Math.min(this.cy,p.y-alt),4.2,3);
        if(this.st>0.7){this.state=this.alert>0?'track':'home';this.st=0;}
        break;
      case 'reel':
        this.vx=damp(this.vx,0,3.2,dt);this.vy=damp(this.vy,0,3.2,dt);
        if(this.st>0.42){this.state='track';this.st=0;this.cd=Math.max(this.cd,0.7);this.alert=4;this.releaseToken();}
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
      default:this.state='track';this.st=0;
    }
  }
  /* удар сбивает замах и отбрасывает (лёгкая) */
  react(h,k){super.react(h,k*1.3);if(!this.dead&&this.state!=='stun'&&this.state!=='fall'){if(this.state==='wind'||this.state==='dive')this.releaseToken();this.state='reel';this.st=0;}}
  onBreak(n){
    const g=this.world.game;
    if(n.id==='rotor'){this.state='fall';this.st=0;this.flying=false;this.releaseToken();g.audio.clatter('steel',1);}
    if(n.id==='bowl'){this.releaseToken();if(this.state==='wind'||this.state==='dive'){this.state='reel';this.st=0;}
      /* угли вываливаются */
      g.particles.burst(n.wx,n.wy,24,{kind:'spark',col:'#ffb45a',spd:5,life:0.9,size:0.06,add:true,g:22});
      g.particles.burst(n.wx,n.wy,8,{kind:'smoke',col:'#2a2622',spd:1.5,life:1.2,size:0.3,grow:0.8,drag:1.2});}
  }
  pose(dt){
    const P=this.P,s=this.state;
    P.wind=s==='wind'?clamp(this.st/0.58,0,1):0;
    P.tilt=s==='dive'?Math.atan2(this.dv.y,Math.abs(this.dv.x))*0.35-0.2:(s==='stun'||s==='fall'?Math.sin(this.t*9)*0.25:clamp(this.vx*this.face*0.03,-0.2,0.2));
    this.rot+=(dt||0)*(!this.has('rotor')?0:s==='dive'?42:s==='stun'?3:s==='wind'?60:20);
    this.fire=damp(this.fire,this.lit()?(s==='stun'?0.25:1):0,6,dt||1);
    const rn=this.node('rotor');if(rn){rn.lx=0;rn.ly=-this.h-0.45;}
    const bn=this.node('bowl');if(bn){bn.lx=0;bn.ly=-this.h*0.32;}
  }
  draw(c,t){
    const P=this.P,w=this.w,h=this.h,st=this.state,wind=P.wind;
    if(wind>0)c.translate((Math.random()-0.5)*0.06*wind,(Math.random()-0.5)*0.05*wind);
    c.rotate(P.tilt);
    const hy=-h-0.45;
    /* винт: ступица, лопасти (размытый диск на ходу) */
    if(this.has('rotor')){
      MK.box(c,-0.15,hy-0.08,0.3,0.18,0.06,'iron',{});
      c.save();c.translate(0,hy-0.08);
      const bl=Math.cos(this.rot)*0.64;
      c.fillStyle='#8a7444';c.fillRect(-Math.abs(bl),-0.025,Math.abs(bl)*2,0.05);
      MK.joint(c,0,0,0.06,'brass');c.restore();
    }else MK.stump(c,0,hy,0.08,-PI/2,this.node('rotor').seed,t,'steel');
    /* три цепи к чаше */
    c.strokeStyle='#4a3d26';c.lineWidth=0.035;c.setLineDash([0.05,0.04]);
    for(const sx of [-0.36,0,0.36]){c.beginPath();c.moveTo(0,hy+0.1);c.lineTo(sx,-h*0.52);c.stroke();}
    c.setLineDash([]);
    /* чаша: латунь, красное стекло, огонь */
    if(this.has('bowl')){
      c.fillStyle='#7a2418';c.beginPath();c.ellipse(0,-h*0.52,w*0.42,h*0.12,0,0,TAU);c.fill();
      c.beginPath();c.moveTo(-w*0.46,-h*0.52);c.quadraticCurveTo(-w*0.4,-0.05,0,0);c.quadraticCurveTo(w*0.4,-0.05,w*0.46,-h*0.52);c.closePath();
      c.fillStyle=MK.cylGrad(c,'brass',-w*0.46,0,w*0.46,0);c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.025;c.stroke();
      c.fillStyle='#3a2a10';c.fillRect(-w*0.46,-h*0.55,w*0.92,0.06);
      for(const sx of [-0.25,0,0.25])MK.bolt(c,sx,-h*0.4,0.025,'brass');
      c.beginPath();c.moveTo(-0.08,0);c.lineTo(0.08,0);c.lineTo(0,0.18);c.closePath();c.fillStyle=MAT.brass.mid;c.fill();
    }else{
      /* пустой подвес: обрывки цепей качаются */
      c.strokeStyle='#4a3d26';c.lineWidth=0.035;for(const sx of [-0.3,0.3]){c.beginPath();c.moveTo(sx,-h*0.52);c.lineTo(sx+Math.sin(t*3+sx)*0.08,-h*0.2);c.stroke();}
    }
  }
  /* огонь — поверх контура, аддитивно */
  drawFX(c,t){
    /* размытый диск винта — поверх контура (полупрозрачное в спрайте окрасилось бы обводкой) */
    if(this.has('rotor')&&this.state!=='stun'&&this.state!=='fall'){c.save();c.rotate(this.P.tilt);
      c.fillStyle='rgba(220,210,180,.22)';c.beginPath();c.ellipse(0,-this.h-0.53,0.68,0.07,0,0,TAU);c.fill();c.restore();}
    const P=this.P,h=this.h,fl=this.fire*(0.6+0.15*Math.sin(t*11+this.ph))+P.wind*0.6;if(fl<0.03)return;
    c.save();c.rotate(P.tilt);
    const fc=P.wind>0.5?'#fff2d6':(this.alert>0?'#ff6a3a':'#ffb45a');
    c.globalCompositeOperation='lighter';
    c.fillStyle=rgba(fc,0.85*clamp(fl,0,1));c.beginPath();c.moveTo(-0.14,-h*0.55);
    c.quadraticCurveTo(0,-h*0.55-0.5*fl-0.1,0.14,-h*0.55);c.closePath();c.fill();
    c.fillStyle=rgba('#fff4d8',0.6*clamp(fl,0,1));c.beginPath();c.moveTo(-0.06,-h*0.55);c.quadraticCurveTo(0,-h*0.55-0.26*fl,0.06,-h*0.55);c.closePath();c.fill();
    c.restore();
    this.world.game.renderer.glowAdd(this.cx,this.y+0.3,0.9+P.wind*0.8,fc,0.3+0.35*P.wind+0.1*this.fire);
  }
  partDebris(n){
    if(n.id==='rotor')return {w:0.7,h:0.12,mass:0.2,mat:'steel',draw:(c,t)=>{c.fillStyle='#8a7444';c.fillRect(-0.34,-0.025,0.68,0.05);MK.joint(c,0,0,0.07,'iron');}};
    if(n.id==='bowl')return {w:0.7,h:0.36,mass:0.4,mat:'brass',draw:(c,t)=>{
      c.beginPath();c.moveTo(-0.36,-0.12);c.quadraticCurveTo(-0.3,0.2,0,0.24);c.quadraticCurveTo(0.3,0.2,0.36,-0.12);c.closePath();
      c.fillStyle=MK.cylGrad(c,'brass',-0.36,0,0.36,0);c.fill();c.fillStyle='#3a2a10';c.fillRect(-0.36,-0.14,0.72,0.05);}};
    return null;
  }
  corpseDebris(){
    return {w:0.7,h:0.4,mass:0.6,mat:'brass',draw:(c,t)=>{
      /* смятая чаша на боку, угли тлеют */
      c.save();c.rotate(0.5);
      c.beginPath();c.moveTo(-0.34,-0.14);c.quadraticCurveTo(-0.28,0.18,0,0.2);c.quadraticCurveTo(0.26,0.16,0.3,-0.1);c.closePath();
      c.fillStyle=MK.cylGrad(c,'brass',-0.34,0,0.34,0);c.fill();c.restore();
      const fl=0.3+0.25*Math.sin(t*6+this.x);c.fillStyle=rgba('#ff8a3a',fl);c.beginPath();c.arc(-0.12,0.08,0.06,0,TAU);c.arc(0.05,0.1,0.05,0,TAU);c.fill();}};
  }
  spriteBounds(){return {x:this.cx-1.3,y:this.y-1.2,w:2.6,h:this.h+1.8};}
}
Object.assign(ENEMY_TYPES,{lampada:Lampada});
