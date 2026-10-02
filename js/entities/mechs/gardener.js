"use strict";
/* ============================== САДОВНИК ==============================
   Садовая машина Эдема: низкая белая тележка из эмали и мрамора на двух колёсах, сверху —
   стеклянный колпак с мхом, спереди на штанге — трёхлопастной ротор-косилка, сзади — мотор.
   Узлы: РОТОР (спереди) · МОТОР (сзади, только со спины).
     ротор сломан → косить нечем: тележка держится поодаль и пятится от курьера;
     мотор сломан → еле ползёт, рывок короткий и медленный.
   Атака — «покос»: ротор раскручивается (кольцо на роторе, корпус приседает назад),
   затем рывок вперёд с ротором на уровне колен-груди. Раньше садовник ранил касанием без
   предупреждения — теперь каждый удар читается заранее. */
class Gardener extends MobMech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:1.5,h:1.3,hp:84,dmg:1,aggro:7,mass:1.8,bodyMat:'enamel',blood:'#8a9a6a'},def),x,y);
    this.addNode({id:'blade',hp:50,r:0.36,mat:'steel',coreDmg:15,scrap:3});
    this.addNode({id:'motor',hp:40,r:0.3,mat:'iron',backOnly:true,coreDmg:20,scrap:2});
    this.spin=0;this.spinV=6;this.wheel=0;this.pose(0);
  }
  speed(){return this.has('motor')?2.1:0.6;}
  turnTime(){return this.has('motor')?0.3:0.7;}
  safe(){return super.safe()||!this.has('blade');}
  atk(){
    if(!this.has('blade'))return null;
    const fast=this.has('motor');
    return {kind:'mow',node:this.node('blade'),range:fast?4.2:2.2,minR:0.6,dy:1.6,wind:0.7,hot:0.3,strike:fast?0.42:0.36,rec:0.9,v:fast?9.5:5};
  }
  ai(dt){this.sense(dt);this.fight(dt);
    const tgt=this.state==='wind'?40:this.state==='strike'?46:(this.hunting()?16:6);
    this.spinV=damp(this.spinV,this.has('blade')?tgt:0,4,dt);}
  onWind(A){this.world.game.audio.lampWind();}
  onStrike(A){const g=this.world.game;g.audio.dash();this.vx=this.face*A.v;}
  strikeTick(dt,A){this.vx=this.st<A.strike*0.75?this.face*A.v:damp(this.vx,0,10,dt);
    if(this.onGround&&Math.random()<dt*50)this.world.game.particles.spawn({kind:'debris',x:this.cx+this.face*0.9,y:this.bottom-0.1,vx:-this.face*3,vy:-3,life:0.5,size:0.07,col:'#7a8a4a',g:20});
    if(this.wall===this.face)this.st=Math.max(this.st,A.strike*0.75);}
  strikeBox(A){return {x:this.face>0?this.cx+0.2:this.cx-1.5,y:this.bottom-1.45,w:1.3,h:1.35};}
  onBreak(n){const g=this.world.game;
    if(n.id==='blade')g.audio.clatter('steel',1);
    if(n.id==='motor'){g.audio.steamBurst();g.particles.burst(n.wx,n.wy,14,{kind:'smoke',col:'#2a2622',spd:2,life:1.4,size:0.4,grow:1,drag:1.2});}}
  pose(dt){
    const P=this.P,s=this.state,A=this.atk(),t=this.t;
    this.spin+=(dt||0)*this.spinV;this.wheel+=(dt||0)*this.vx*this.face/0.3;
    const wk=s==='wind'&&A?clamp(this.st/A.wind,0,1):0,sk=s==='strike'?1:0;
    const stun=this.stunT>0||this.openT>0;
    P.lean=-0.12*EZ.out(wk)+0.08*sk+(stun?0.1:0)+this.recoil*0.04;
    P.bob=Math.abs(Math.sin(this.wheel*0.5))*0.015+(wk>0?Math.sin(t*50)*0.01*wk:0);
    /* штанга ротора: от носа вперёд-вверх; в рывке опускается на уровень колен */
    const aa=lerp(-0.5,-0.25,wk)+sk*0.3+(stun?0.5:0);
    P.armA=aa;P.arm0={x:0.55,y:-0.72+P.bob};P.hub={x:P.arm0.x+Math.cos(aa)*0.62,y:P.arm0.y+Math.sin(aa)*0.62};
    const bn=this.node('blade');if(bn){bn.lx=P.hub.x;bn.ly=P.hub.y;}
    const mn=this.node('motor');if(mn){mn.lx=-0.66;mn.ly=-0.62+P.bob;}
  }
  draw(c,t){
    const P=this.P,w=this.w,h=this.h;
    c.save();c.translate(0,-0.3);c.rotate(P.lean);c.translate(0,0.3);
    /* мотор сзади: чугунный короб, выхлопная трубка */
    if(this.has('motor')){MK.box(c,-0.86,-0.86,0.36,0.46,0.06,'iron',{bolts:0.03});
      c.fillStyle='#2b2824';rr(c,-0.8,-1.08,0.08,0.24,0.03);c.fill();
      if(Math.random()<0.05)this.world.game.particles.spawn({kind:'smoke',x:this.cx-this.face*0.76,y:this.bottom-1.1,vx:-this.face*0.4,vy:-0.9,life:1.1,size:0.12,grow:0.5,col:'#3a342c',drag:0.6,a:0.4});}
    else MK.stump(c,-0.66,-0.62+P.bob,0.12,PI,this.node('motor').seed,t,'iron');
    /* корпус: белая эмаль с мраморной прожилкой, латунный кант */
    c.save();rr(c,-0.68,-0.98+P.bob,1.3,0.6,0.18);c.fillStyle=MK.plateGrad(c,'enamel',-0.68,-0.98,1.3,0.6);c.fill();c.clip();
    c.globalAlpha=0.32;c.fillStyle=PAT(c,'marble');c.fillRect(-0.7,-1.0,1.4,0.7);c.globalAlpha=1;
    c.fillStyle='rgba(0,0,0,.25)';c.fillRect(-0.7,-0.5+P.bob,1.4,0.14);c.restore();
    c.strokeStyle=MAT.brass.mid;c.lineWidth=0.035;rr(c,-0.68,-0.98+P.bob,1.3,0.6,0.18);c.stroke();
    for(let i=0;i<4;i++)MK.bolt(c,-0.5+i*0.32,-0.9+P.bob,0.025,'brass');
    /* колпак со мхом */
    /* колпак: непрозрачное зеленоватое стекло (полупрозрачное в контурном спрайте окрасилось бы обводкой) */
    c.save();c.translate(-0.05,-0.98+P.bob);
    const dg=c.createLinearGradient(-0.36,-0.36,0.3,0);dg.addColorStop(0,'#a9bfba');dg.addColorStop(1,'#56706a');
    c.fillStyle=dg;c.beginPath();c.arc(0,0,0.36,PI,TAU);c.closePath();c.fill();
    c.fillStyle='#5d6e34';c.beginPath();c.ellipse(0,0,0.32,0.12,0,PI,TAU);c.fill();
    for(let i=0;i<5;i++){c.fillStyle=i%2?'#8a9a4a':'#6b7a3a';c.beginPath();c.arc(-0.22+i*0.11,-0.06-((i*7)%3)*0.03,0.06,0,TAU);c.fill();}
    c.strokeStyle='#d8e8e6';c.lineWidth=0.025;c.beginPath();c.arc(0,0,0.36,PI,TAU);c.stroke();
    c.restore();
    /* глазок: зелёный в покое, красный на охоте */
    MK.lens(c,0.46,-0.82+P.bob,0.05,this.hunting()?'#ff3b22':'#b8c46a',0.9);
    /* штанга и ротор */
    MK.seg(c,P.arm0.x-0.05,P.arm0.y,P.hub.x,P.hub.y,0.1,'steel',{});
    if(this.has('blade')){c.save();c.translate(P.hub.x,P.hub.y);c.rotate(this.spin);
      const blur=clamp((this.spinV-12)/30,0,1);
      for(let i=0;i<3;i++){c.save();c.rotate(i/3*TAU);
        c.beginPath();c.moveTo(0,-0.05);c.lineTo(0.62,-0.12);c.lineTo(0.67,0);c.lineTo(0.02,0.07);c.closePath();
        c.fillStyle=MK.plateGrad(c,'steel',0,-0.12,0.67,0.19);c.fill();c.restore();}
      MK.joint(c,0,0,0.12,'brass');c.restore();}
    else MK.stump(c,P.hub.x,P.hub.y,0.08,P.armA,this.node('blade').seed,t,'steel');
    c.restore();
    /* колёса */
    for(const [i,x] of [[0,-0.42],[1,0.4]]){c.save();c.translate(x,-0.24);c.rotate(this.wheel);
      c.fillStyle='#22251f';c.beginPath();c.arc(0,0,0.24,0,TAU);c.fill();
      c.fillStyle='#ddd4c0';c.beginPath();c.arc(0,0,0.13,0,TAU);c.fill();
      c.strokeStyle='#8e8a7c';c.lineWidth=0.025;for(let k=0;k<4;k++){c.rotate(PI/2);c.beginPath();c.moveTo(0.03,0);c.lineTo(0.12,0);c.stroke();}
      c.restore();}
  }
  /* поверх контура: блик колпака и размытый диск ротора на оборотах */
  drawFX(c,t){
    const P=this.P;
    c.save();c.translate(0,-0.3);c.rotate(P.lean);c.translate(0,0.3);
    c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(-0.19,-1.2+P.bob,0.07,0.035,-0.5,0,TAU);c.fill();
    if(this.has('blade')){const blur=clamp((this.spinV-12)/30,0,1);
      if(blur>0.05){c.fillStyle=rgba('#e6dfcc',0.22*blur);c.beginPath();c.arc(P.hub.x,P.hub.y,0.67,0,TAU);c.fill();
        c.strokeStyle=rgba('#fff4dc',0.35*blur);c.lineWidth=0.03;c.beginPath();c.arc(P.hub.x,P.hub.y,0.64,0,TAU);c.stroke();}}
    c.restore();
  }
  partDebris(n){
    if(n.id==='blade')return {w:1.0,h:1.0,mass:0.5,mat:'steel',draw:(c,t)=>{for(let i=0;i<3;i++){c.save();c.rotate(i/3*TAU);
      c.beginPath();c.moveTo(0,-0.05);c.lineTo(0.56,-0.11);c.lineTo(0.6,0);c.lineTo(0.02,0.06);c.closePath();c.fillStyle=MK.plateGrad(c,'steel',0,-0.1,0.6,0.17);c.fill();c.restore();}
      MK.joint(c,0,0,0.1,'brass');}};
    if(n.id==='motor')return {w:0.36,h:0.46,mass:0.6,mat:'iron',draw:(c,t)=>{MK.box(c,-0.18,-0.23,0.36,0.46,0.06,'iron',{bolts:0.03});}};
    return null;
  }
  corpseDebris(){
    return {w:1.3,h:0.6,mass:1.6,mat:'enamel',draw:(c,t)=>{
      c.save();c.rotate(0.12);rr(c,-0.62,-0.3,1.24,0.5,0.16);c.fillStyle=MK.plateGrad(c,'enamel',-0.62,-0.3,1.24,0.5);c.fill();
      c.fillStyle='#22251f';c.beginPath();c.arc(-0.36,0.24,0.2,0,TAU);c.arc(0.4,0.24,0.2,0,TAU);c.fill();
      c.fillStyle='rgba(120,140,70,.7)';c.beginPath();c.ellipse(0,-0.3,0.28,0.1,0,PI,TAU);c.fill();c.restore();}};
  }
  spriteBounds(){return {x:this.cx-2.2,y:this.bottom-2.4,w:4.4,h:2.7};}
}
Object.assign(ENEMY_TYPES,{gardener:Gardener});
