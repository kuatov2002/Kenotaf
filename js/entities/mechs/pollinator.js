"use strict";
/* ============================== ОПЫЛИТЕЛЬ ==============================
   Садовый дрон Эдема: латунная «пчела» с четырьмя слюдяными крыльями, в брюшке — стеклянный
   мешок с пыльцой, спереди — жало-игла для прививок. Висит над грядками восьмёркой.
   Увидев курьера — заходит на его высоту, отводит брюшко (жало блестит) и бросается по прямой.
   Промах о стену — жало застряло: дрон висит открытым. Каждый второй заход — оставляет облако пыльцы.
   Узлы: КРЫЛЬЯ (сверху) · ЖАЛО (спереди) · МЕШОК (сзади, стекло).
     крылья сломаны → падает и ползает, бросаясь низом;
     жало сломано  → бросаться нечем: держится поодаль и сыплет пыльцу;
     мешок разбит  → лопается облаком прямо на месте, пыльцы больше нет.
   Лёгкий (масса 0.5): импульс уносит его; облако пыльцы импульс сдувает. */
class Pollinator extends Mech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.9,h:0.7,hp:40,dmg:1,aggro:10,mass:0.5,bodyMat:'brass',flying:true,blood:'#9ab84a'},def),x,y);
    this.addNode({id:'wings',hp:20,r:0.32,mat:'glass',coreDmg:14,scrap:2});
    this.addNode({id:'sting',hp:22,r:0.26,mat:'steel',coreDmg:10,scrap:2});
    this.addNode({id:'sac',hp:16,r:0.28,mat:'glass',backOnly:true,coreDmg:12,scrap:2});
    this.home={x:x+this.w/2,y:y+this.h/2};this.state='idle';this.st=0;this.ph=rng(x*17+y*5)()*TAU;
    this.cd=1.0;this.dv={x:1,y:0};this.n=0;this.flap=0;this.P={};this.pose(0);
  }
  safe(){return super.safe()||this.state==='stuck'||this.state==='stun';}
  threat(){return this.state==='wind'||this.state==='dart';}
  isWinding(){return this.state==='wind';}
  cancelAttack(){super.cancelAttack();if(this.state==='wind'||this.state==='dart'){this.state='reel';this.st=0;}}
  crawler(){return !this.has('wings');}
  puff(x,y,r){if(!this.has('sac'))return;BossFX.zone(this.world,{kind:'cloud',x:x,y:y,r:r||1.1,rmax:1.8,life:3.2,arm:0.5});this.world.game.audio.steam(0.3);}
  physics(dt){
    if(this.crawler()){this.flying=false;super.physics(dt);return;}
    if(this.state==='stun'){this.vy+=CFG.gravity*0.5*dt;this.vy=clamp(this.vy,-20,12);}
    else if(this.knockT>0){this.vx=damp(this.vx,0,2.4,dt);this.vy=damp(this.vy,0,2.4,dt);}
    const vx0=this.vx,vy0=this.vy;
    moveBody(this,dt,this.world.room.solids);
    const hit=this.wall||this.ceilHit||this.onGround;
    if(hit&&this.state==='dart'){this.stick();return;}
    const imp=this.lastImp,fresh=imp&&this.world.time-imp.t<0.6;
    if(fresh&&this.slamCd<=0&&!this.dead&&hit&&Math.hypot(vx0,vy0)>CFG.combat.slamSpeed&&this.state!=='stun'){
      this.slamCd=0.7;this.world.game.fx.slam(this.cx,this.cy,'brass',Math.hypot(vx0,vy0));this.state='stun';this.st=0;this.releaseToken();}
  }
  /* жало вошло в стену: висит, дёргается — открыт */
  stick(){const g=this.world.game;this.state='stuck';this.st=0;this.vx=0;this.vy=0;this.releaseToken();
    g.audio.mat('steel',0.8);g.particles.burst(this.cx+this.face*0.5,this.cy,10,{kind:'spark',col:'#ffe6a3',spd:5,life:0.35,size:0.04,add:true,g:12});
    for(const n of this.nodes)if(!n.broken)n.exT=Math.max(n.exT,1.3);}
  ai(dt){
    const p=this.world.player,g=this.world.game;this.st+=dt;this.cd-=dt;
    const see=this.sensePlayer()>0;if(this.alert>0)this.alert-=dt;if(see)this.alert=4;
    const seek=(tx,ty,sp,k)=>{const dx=tx-this.cx,dy=ty-this.cy,d=Math.hypot(dx,dy)||1,v=Math.min(sp,d*2.6);
      this.vx=damp(this.vx,dx/d*v,k,dt);if(!this.crawler())this.vy=damp(this.vy,dy/d*v,k,dt);};
    const armed=this.has('sting');
    switch(this.state){
      case 'idle':
        if(this.crawler()){this.vx=damp(this.vx,Math.sin(this.t*0.7+this.ph)*1.2,3,dt);}
        else seek(this.home.x+Math.sin(this.t*0.8+this.ph)*1.6,this.home.y+Math.sin(this.t*1.6+this.ph)*0.5,2.4,3);
        if(see){this.state='track';this.st=0;}
        break;
      case 'track':{const side=this.cx<p.cx?-1:1,keep=armed?4.2:5.5;
        /* не видно курьера (витрина, уступ) — набирает высоту и обходит сверху */
        const ty=see?(armed?p.cy-0.3:p.y-2.6):Math.min(this.cy,p.y)-2.2;
        seek(p.cx+side*keep,ty,5.2,4);this.face=p.cx>this.cx?1:-1;
        if(this.alert<=0){this.state='idle';this.st=0;this.releaseToken();}
        else if(this.st>0.7&&this.cd<=0&&see&&this.wantAttack()){
          if(armed&&Math.abs(p.cy-this.cy)<3.2&&Math.abs(p.cx-this.cx)<7){this.state='wind';this.st=0;g.audio.tone(520,0.5,'sawtooth',0.012,900);}
          else if(!armed&&this.has('sac')&&Math.abs(p.cx-this.cx)<3){this.puff(this.cx,this.cy+0.6,1.2);this.cd=2.6;this.releaseToken();}}
        break;}
      case 'wind':{const Wd=0.62;this.vx=damp(this.vx,-this.face*1.2,8,dt);if(!this.crawler())this.vy=damp(this.vy,0,8,dt);this.face=p.cx>this.cx?1:-1;
        this.telegraph(this.node('sting'),this.st/Wd,this.st>Wd-0.28);
        if(this.st>=Wd){const dx=p.cx-this.cx,dy=this.crawler()?0:(p.cy-this.cy),d=Math.hypot(dx,dy)||1;
          this.dv={x:dx/d,y:dy/d};this.state='dart';this.st=0;this.hitDone=false;g.audio.dash();}
        break;}
      case 'dart':this.vx=this.dv.x*15;if(!this.crawler())this.vy=this.dv.y*15;
        if(!this.hitDone&&aabb(this.rect(),p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<dt*50)g.particles.spawn({kind:'dust',x:this.cx-this.dv.x*0.5,y:this.cy,vx:-this.dv.x*2,vy:0,life:0.3,size:0.08,col:'#e8d070',g:0});
        if(this.st>0.55){this.state='reel';this.st=0;this.cd=1.2;this.releaseToken();this.n++;if(this.n%2===0)this.puff(this.cx,this.cy,1.0);}
        break;
      case 'stuck':this.vx=0;this.vy=0;if(this.st>1.3){this.state='reel';this.st=0;this.cd=1.0;this.vx=-this.face*3;}break;
      case 'reel':this.vx=damp(this.vx,0,3,dt);if(!this.crawler())this.vy=damp(this.vy,-0.8,3,dt);
        if(this.st>0.45){this.state=this.alert>0?'track':'idle';this.st=0;this.cd=Math.max(this.cd,0.6);this.releaseToken();}break;
      case 'stun':this.vx=damp(this.vx,0,4,dt);if(this.st>1.2){this.state='reel';this.st=0;this.vy=-3;}break;
      default:this.state='track';this.st=0;
    }
  }
  react(h,k){super.react(h,k*1.3);if(!this.dead&&(this.state==='wind'||this.state==='dart')){this.releaseToken();this.state='reel';this.st=0;}}
  onBreak(n){const g=this.world.game;
    if(n.id==='wings'){this.flying=false;this.state='reel';this.st=0;this.releaseToken();g.audio.clatter('glass',0.8);}
    if(n.id==='sac'){this.puff(n.wx,n.wy,1.6);g.audio.mat('glass',1);}
    if(n.id==='sting'&&(this.state==='wind'||this.state==='dart')){this.state='reel';this.st=0;this.releaseToken();}}
  pose(dt){
    this.flap+=(dt||0)*(this.crawler()?0:this.state==='wind'?70:45);
    const wk=this.state==='wind'?clamp(this.st/0.62,0,1):0;this.P.wind=wk;
    this.P.tilt=this.state==='dart'?0.15*Math.sign(this.dv.y||0):(this.state==='stuck'?Math.sin(this.t*30)*0.06:clamp(this.vy*0.03,-0.2,0.2));
    const wn=this.node('wings');wn.lx=-0.05;wn.ly=-this.h-0.18;
    const sn=this.node('sting');sn.lx=0.62+wk*-0.1;sn.ly=-this.h*0.45;
    const bn=this.node('sac');bn.lx=-0.55-wk*0.15;bn.ly=-this.h*0.45;
  }
  draw(c,t){
    const h=this.h,wk=this.P.wind;c.rotate(this.P.tilt);
    if(wk>0)c.translate((Math.random()-0.5)*0.04*wk,0);
    /* лапки */
    c.strokeStyle='#3a2a10';c.lineWidth=0.035;for(const x of [-0.2,0.05,0.28]){c.beginPath();c.moveTo(x,-h*0.25);c.lineTo(x-0.08,-0.02);c.lineTo(x-0.16,0);c.stroke();}
    /* брюшко: полосы латунь/воронёная сталь + стеклянный мешок */
    c.save();c.translate(-0.42-wk*0.15,-h*0.45);c.rotate(-0.15-wk*0.3);
    if(this.has('sac')){const fl=0.6+0.2*Math.sin(t*4+this.ph);c.fillStyle='rgba(210,230,150,.35)';c.beginPath();c.ellipse(-0.12,0,0.34,0.26,0,0,TAU);c.fill();
      c.fillStyle=rgba('#e8d070',fl);c.beginPath();c.ellipse(-0.14,0.06,0.24,0.15,0,0,TAU);c.fill();
      c.strokeStyle='rgba(240,250,220,.7)';c.lineWidth=0.025;c.beginPath();c.ellipse(-0.12,0,0.34,0.26,0,PI*1.1,PI*1.6);c.stroke();}
    else MK.stump(c,0,0,0.1,PI,this.node('sac').seed,t,'brass');
    for(let i=0;i<3;i++){c.fillStyle=i%2?'#2a2620':'#b08d3e';c.beginPath();c.ellipse(0.12+i*0.1,0,0.1,0.22-i*0.02,0,0,TAU);c.fill();}
    c.restore();
    /* грудь и голова */
    c.fillStyle=MK.cylGrad(c,'brass',-0.25,0,0.3,0);c.beginPath();c.ellipse(0.05,-h*0.5,0.3,0.26,0,0,TAU);c.fill();
    c.strokeStyle=MAT.brass.ed;c.lineWidth=0.025;c.stroke();
    c.fillStyle='#2a2620';c.beginPath();c.arc(0.38,-h*0.5,0.16,0,TAU);c.fill();
    MK.lens(c,0.44,-h*0.54,0.07,this.threat()?'#ff3b22':'#9ad070',1);
    /* жало */
    if(this.has('sting')){const k=this.state==='dart'?1:wk;c.fillStyle=MK.plateGrad(c,'steel',0.5,-0.05,0.4,0.1);
      c.beginPath();c.moveTo(0.5,-h*0.45-0.05);c.lineTo(0.9+k*0.12,-h*0.45);c.lineTo(0.5,-h*0.45+0.05);c.closePath();c.fill();}
    else MK.stump(c,0.5,-h*0.45,0.06,0,this.node('sting').seed,t,'steel');
    /* крылья: слюда; на лету — размытые */
    if(this.has('wings')){const a=Math.sin(this.flap)*0.5;
      for(const s of [0,1]){c.save();c.translate(-0.05+s*0.12,-h*0.7);c.rotate(-0.9-a*(s?0.8:1));
        c.fillStyle='rgba(220,235,240,.35)';c.beginPath();c.ellipse(0.3,0,0.34,0.11,0,0,TAU);c.fill();
        c.strokeStyle='rgba(60,50,30,.7)';c.lineWidth=0.02;c.stroke();c.restore();}}
    else MK.stump(c,0,-h*0.75,0.06,-PI/2,this.node('wings').seed,t,'glass');
  }
  partDebris(n){
    if(n.id==='wings')return {w:0.6,h:0.2,mass:0.1,mat:'glass',draw:(c,t)=>{c.fillStyle='rgba(220,235,240,.5)';c.beginPath();c.ellipse(0,0,0.3,0.1,0,0,TAU);c.fill();}};
    if(n.id==='sting')return {w:0.4,h:0.1,mass:0.1,mat:'steel',draw:(c,t)=>{c.fillStyle='#9aa4ac';c.beginPath();c.moveTo(-0.2,-0.04);c.lineTo(0.2,0);c.lineTo(-0.2,0.04);c.closePath();c.fill();}};
    return null;
  }
  corpseDebris(){return {w:0.7,h:0.4,mass:0.4,mat:'brass',draw:(c,t)=>{
    c.fillStyle=MK.cylGrad(c,'brass',-0.3,0,0.3,0);c.beginPath();c.ellipse(0,0,0.32,0.2,0.3,0,TAU);c.fill();
    for(let i=0;i<3;i++){c.fillStyle=i%2?'#2a2620':'#b08d3e';c.beginPath();c.ellipse(-0.3-i*0.09,0.05,0.08,0.16,0,0,TAU);c.fill();}}};}
  spriteBounds(){return {x:this.cx-1.4,y:this.y-1.0,w:2.8,h:this.h+1.4};}
}
Object.assign(ENEMY_TYPES,{pollinator:Pollinator});
