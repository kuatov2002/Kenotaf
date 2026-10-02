"use strict";
/* ============================== ЦЕНЗОР ==============================
   Приземистый латунный страж: литой корпус на коротких ногах, шлем с красной прорезью,
   гидравлическая клешня, на спине — баллон давления. Элита: в лоб его не взять.
   Узлы: БРОНЯ (лобовая плита: удар отскакивает, пока не вскрыта) · КЛЕШНЯ (оружие) ·
         БАЛЛОН (на спине) · ЯДРО (топка за бронёй — открыто, когда броня сорвана).
   Как его ломать:
     со спины — баллон: лопнул → облако пара, страж оглушён и вскрыт (броня бьётся вдвое);
     импульс в окно замаха клешни — клешня в пол, страж открыт;
     броня сорвана → видна топка: удары в ядро идут в корпус целиком;
     клешня сломана → остаётся таран плечом, короткий и медленный.
   Тяжёлый (масса 3): импульс его не уносит — лишь сбивает с шага. */
class Censor extends MobMech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:1.25,h:2.05,hp:150,dmg:1,aggro:10,mass:3,bodyMat:'brass',bodyArmor:0.35,blood:'#8a6d3b'},def),x,y);
    this.addNode({id:'armor',hp:80,r:0.42,mat:'iron',frontOnly:true,deflect:true,coreDmg:0,scrap:3});
    this.addNode({id:'claw',hp:70,r:0.36,mat:'brass',coreDmg:15,scrap:3});
    this.addNode({id:'tank',hp:30,r:0.32,mat:'steel',backOnly:true,coreDmg:20,scrap:2});
    this.addNode({id:'core',hp:60,r:0.3,mat:'copper',core:true,locked:true,scrap:5,stump:false});
    this.walk=Math.random()*TAU;this.pose(0);
  }
  /* рядовой механизм с ядром: ядро сломано — конец */
  onBreakCore(h){if(!this.dead){this.hp=0;this.die(h);}}
  speed(){return 2.0;}
  turnTime(){return 0.42;}
  atk(){
    if(this.has('claw'))return {kind:'slam',node:this.node('claw'),range:2.5,wind:0.8,hot:0.34,strike:0.22,rec:0.75};
    return {kind:'ram',node:this.has('armor')?this.node('armor'):this.node('core'),range:1.6,wind:0.7,hot:0.3,strike:0.3,rec:0.9};
  }
  ai(dt){this.sense(dt);this.fight(dt);}
  onWind(A){this.world.game.audio.hydraulic(0.6);}
  onStrike(A){const g=this.world.game;
    if(A.kind==='slam'){g.audio.mat('brass',1);g.audio.explosion();g.camera.addShake(0.5);
      const ix=this.cx+this.face*1.9;g.particles.burst(ix,this.bottom,18,{kind:'debris',col:'#8a7a6a',spd:6,life:0.8,size:0.12,g:26});
      g.particles.burst(ix,this.bottom-0.1,10,{kind:'spark',col:'#ffb45a',spd:7,life:0.4,size:0.05,add:true,g:20});}
    else{g.audio.melee();this.vx=this.face*7;}}
  strikeTick(dt,A){this.vx=damp(this.vx,0,A.kind==='ram'?4:10,dt);}
  strikeBox(A){if(A.kind==='slam'){if(this.st>0.08)return null;return {x:this.face>0?this.cx+0.3:this.cx-2.6,y:this.bottom-1.9,w:2.3,h:1.9};}
    return {x:this.face>0?this.cx:this.cx-1.4,y:this.y+0.2,w:1.4,h:this.h-0.2};}
  /* импульс в спину срывает вентиль баллона сразу */
  applyPulse(p,dir){
    const behind=Math.sign(p.cx-this.cx)===-this.face;
    if(behind&&this.has('tank')){const n=this.node('tank');this.breakNode(n,{dir,sx:n.wx,sy:n.wy},false);}
    super.applyPulse(p,dir);
  }
  onBreak(n,h){
    const g=this.world.game;
    if(n.core){this.onBreakCore(h);return;}
    if(n.id==='tank')this.burstTank();
    if(n.id==='armor'){const c=this.node('core');c.locked=false;c.exT=Math.max(c.exT,2.2);g.audio.clatter('iron',1);}
    if(n.id==='claw')g.audio.clatter('brass',1);
  }
  /* лопнул баллон: пар, оглушение, всё вскрыто */
  burstTank(){
    const g=this.world.game,x=this.cx-this.face*0.6,y=this.bottom-1.4;
    this.cancelAttack();this.stunT=Math.max(this.stunT,2.6);this.state='recover';g.tutorial.notify('tank');
    for(const n of this.nodes)if(!n.broken&&!n.locked)n.exT=Math.max(n.exT,2.6);
    g.audio.steamBurst();g.audio.explosion();g.camera.addShake(0.7);g.hitstop(CFG.hsHeavy);
    g.particles.burst(x,y,30,{kind:'steam',col:'#e8e0d0',spd:5,life:1.6,size:0.6,grow:1.6,drag:1.6});
    g.particles.burst(x,y,18,{kind:'spark',col:'#ffd27a',spd:9,life:0.6,size:0.06,add:true,g:20});
  }
  onInterrupt(n){if(n.id==='claw'){const g=this.world.game,ix=this.cx+this.face*1.6;g.audio.mat('brass',1);
    g.particles.burst(ix,this.bottom,14,{kind:'debris',col:'#8a7a6a',spd:5,life:0.7,size:0.1,g:26});}}
  pose(dt){
    const P=this.P,s=this.state,A=this.atk(),t=this.t;
    const moving=Math.abs(this.vx)>0.25&&this.onGround;
    this.walk+=(dt||0)*Math.abs(this.vx)*2.6;
    const wk=s==='wind'?clamp(this.st/A.wind,0,1):0,sk=s==='strike'?1:0,rk=s==='recover'?clamp(1-this.st/A.rec,0,1):0;
    const stun=this.stunT>0||this.openT>0;
    P.bob=moving?Math.abs(Math.sin(this.walk))*0.04:Math.sin(t*1.8)*0.012;
    P.lean=(A.kind==='slam'?-0.08*wk+0.16*sk+0.1*rk:0.2*wk+0.3*sk)+(stun?0.18+Math.sin(t*8)*0.03:0)+this.recoil*0.05;
    /* клешня: плечо у верха корпуса; замах — вверх и назад; удар — в пол перед собой */
    let a=0.55,b=0.75;
    if(A.kind==='slam'){a=lerp(0.55,-1.5,EZ.out(wk));b=lerp(0.75,0.3,wk);if(sk){a=0.95;b=0.35;}else if(rk>0){a=lerp(0.55,0.95,rk);b=lerp(0.75,0.35,rk);}}
    if(this.openT>0&&this.has('claw')){a=1.0;b=0.4;}
    else if(stun){a=1.15;b=0.6;}
    if(moving&&s!=='wind'&&s!=='strike')a+=Math.sin(this.walk)*0.08;
    P.hipY=-0.75+P.bob;
    const sh={x:0.42,y:-1.48+P.bob},el={x:sh.x+Math.cos(a)*0.62,y:sh.y+Math.sin(a)*0.62},hd={x:el.x+Math.cos(a+b)*0.6,y:el.y+Math.sin(a+b)*0.6};
    P.sh=sh;P.el=el;P.hand=hd;P.ca=a+b;P.open=A.kind==='slam'?(s==='wind'?wk:(sk?0.15:0.5)):0.5;
    const legs=[];for(let i=0;i<2;i++){const q=this.walk+(i?PI:0);
      const fx=(i?-0.2:0.24)+(moving?Math.sin(q)*0.2:0),fy=moving?-Math.max(0,Math.cos(q))*0.1:0;
      const K=ik2(i?-0.22:0.22,P.hipY,fx,fy,0.44,0.42,-1);legs.push({hx:i?-0.22:0.22,hy:P.hipY,kx:K.kx,ky:K.ky,fx:K.fx,fy:K.fy});}
    P.legs=legs;
    /* точки корпуса: от таза, с наклоном */
    const R=(x,y)=>({x:x*Math.cos(P.lean)-y*Math.sin(P.lean),y:P.hipY+x*Math.sin(P.lean)+y*Math.cos(P.lean)});P.R=R;
    const an=this.node('armor');if(an){const q=R(0.33,-0.46);an.lx=q.x;an.ly=q.y;}
    const cn=this.node('core');if(cn){const q=R(0.31,-0.46);cn.lx=q.x;cn.ly=q.y;}
    const tn=this.node('tank');if(tn){const q=R(-0.66,-0.53);tn.lx=q.x;tn.ly=q.y;}
    const kn=this.node('claw');if(kn){kn.lx=(el.x+hd.x)/2;kn.ly=(el.y+hd.y)/2;}
  }
  draw(c,t){
    const P=this.P,stun=this.stunT>0||this.openT>0;
    /* ноги: короткие, толстые, латунные поршни */
    for(const [i,L] of P.legs.entries()){const far=i===1;
      MK.seg(c,L.hx,L.hy,L.kx,L.ky,0.2,far?'iron':'brass',{});MK.seg(c,L.kx,L.ky,L.fx,L.fy-0.08,0.17,far?'iron':'steel',{});
      MK.joint(c,L.kx,L.ky,0.11,far?'iron':'brass');
      c.fillStyle=far?'#1c1810':'#2b2418';rr(c,L.fx-0.2,L.fy-0.12,0.42,0.12,0.04);c.fill();}
    c.save();c.translate(0,P.hipY);c.rotate(P.lean);
    /* баллон на спине */
    if(this.has('tank')){MK.cyl(c,-0.86,-0.92,0.4,0.78,'steel',{bands:[[0.15,0.06,'brass'],[0.8,0.06,'brass']]});
      Kit.gauge(c,-0.66,-0.53,0.09,stun?0.05:0.8+0.05*Math.sin(t*5));
      c.fillStyle='#c8452f';c.beginPath();c.arc(-0.66,-0.98,0.06,0,TAU);c.fill();}
    else{MK.stump(c,-0.62,-0.53,0.14,PI,this.node('tank').seed,t,'steel');
      if(Math.random()<0.25)this.world.game.particles.spawn({kind:'steam',x:this.cx-this.face*0.7,y:this.cy-0.4,vx:-this.face*0.6,vy:-1.2,life:1.0,size:0.26,grow:0.6,col:'#cfc9b8',drag:1.4});}
    /* корпус: литая латунь, клёпки, топка под бронёй */
    MK.box(c,-0.56,-1.0,1.06,1.1,0.3,'brass',{tex:'rust',texA:0.2,seams:[0.5]});
    c.save();rr(c,-0.56,-1.0,1.06,1.1,0.3);c.clip();
    const vg=c.createLinearGradient(0,-1.0,0,0.1);vg.addColorStop(0,'rgba(255,240,200,.25)');vg.addColorStop(0.3,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.4)');
    c.fillStyle=vg;c.fillRect(-0.6,-1.0,1.2,1.12);c.restore();
    for(let i=0;i<4;i++)MK.bolt(c,-0.42+i*0.26,-0.9,0.035,'steel');
    c.fillStyle=MK.cylGrad(c,'iron',0,-0.1,0,-0.02);c.fillRect(-0.56,-0.1,1.06,0.08);
    /* ядро: решётка топки (видна, когда броня сорвана) */
    const cn=this.node('core');
    if(!cn.locked&&!cn.broken){const fl=0.6+0.3*Math.sin(t*9);
      c.fillStyle='#120a05';rr(c,0.12,-0.64,0.38,0.34,0.06);c.fill();
      const gr=c.createRadialGradient(0.31,-0.47,0,0.31,-0.47,0.3);gr.addColorStop(0,rgba('#fff2d0',fl));gr.addColorStop(0.5,rgba('#ffb45a',0.8*fl));gr.addColorStop(1,'rgba(160,50,10,.2)');
      c.fillStyle=gr;rr(c,0.12,-0.64,0.38,0.34,0.06);c.fill();
      c.strokeStyle='#2b2418';c.lineWidth=0.025;for(let i=0;i<4;i++){c.beginPath();c.moveTo(0.16+i*0.1,-0.64);c.lineTo(0.16+i*0.1,-0.3);c.stroke();}
      this.world.game.renderer.glowAdd(this.cx+this.face*cn.lx,this.bottom+cn.ly,0.9,'#ffb45a',0.45*fl);}
    /* лобовая броня: чугунная плита на болтах */
    if(this.has('armor'))MK.box(c,0.1,-0.86,0.46,0.8,0.08,'iron',{tex:'rust',texA:0.4,bolts:0.04,seams:[0.5]});
    else{c.fillStyle='#2b2418';c.fillRect(0.14,-0.84,0.06,0.76);}
    /* шлем с прорезью */
    c.save();c.translate(0.04,-1.0);
    c.beginPath();c.arc(0,0,0.36,PI,0);c.closePath();c.fillStyle=MK.plateGrad(c,'brass',-0.36,-0.36,0.72,0.36);c.fill();
    c.strokeStyle=MAT.brass.ed;c.lineWidth=0.03;c.stroke();
    c.fillStyle='#1a1512';c.fillRect(-0.3,-0.14,0.6,0.1);
    c.fillStyle=rgba(stun?'#69d68f':(this.threat()?'#ff3b22':'#c8452f'),stun?0.4:0.9);c.fillRect(-0.02,-0.12,0.3,0.06);
    c.fillStyle='rgba(255,255,255,.2)';c.beginPath();c.arc(-0.12,-0.24,0.08,0,TAU);c.fill();
    c.restore();
    c.restore();
    if(!stun)this.world.game.renderer.glowAdd(this.cx+this.face*0.2,this.bottom-1.86,0.4,'#c8452f',this.alert>0?0.45:0.2);
    /* клешня */
    this.drawClaw(c,t);
  }
  drawClaw(c,t){
    const P=this.P;
    MK.joint(c,P.sh.x,P.sh.y,0.16,'iron');
    if(!this.has('claw')){MK.stump(c,P.sh.x+0.1,P.sh.y+0.05,0.1,0.6,this.node('claw').seed,t,'brass');return;}
    MK.seg(c,P.sh.x,P.sh.y,P.el.x,P.el.y,0.2,'brass',{ribs:3});
    MK.piston(c,P.sh.x+0.05,P.sh.y+0.12,P.el.x,P.el.y+0.08,0.1,0.5);
    MK.seg(c,P.el.x,P.el.y,P.hand.x,P.hand.y,0.17,'steel',{});
    MK.joint(c,P.el.x,P.el.y,0.12,'brass');
    c.save();c.translate(P.hand.x,P.hand.y);c.rotate(P.ca);
    const o=0.25+0.45*P.open;
    for(const sd of [-1,1]){c.save();c.rotate(sd*o);
      c.beginPath();c.moveTo(0,-0.05*sd);c.lineTo(0.42,-0.1*sd);c.lineTo(0.5,0.02*sd);c.lineTo(0.04,0.06*sd);c.closePath();
      c.fillStyle=MK.plateGrad(c,'brass',0,-0.1,0.5,0.16);c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.02;c.stroke();c.restore();}
    MK.joint(c,0,0,0.1,'steel');c.restore();
  }
  partDebris(n){
    if(n.id==='armor')return {w:0.5,h:0.86,mass:1.0,mat:'iron',draw:(c,t)=>{MK.box(c,-0.23,-0.43,0.46,0.86,0.08,'iron',{tex:'rust',texA:0.4,bolts:0.04});}};
    if(n.id==='claw')return {w:0.9,h:0.4,mass:0.8,mat:'brass',draw:(c,t)=>{MK.seg(c,-0.4,0,0.1,0,0.16,'steel',{});
      for(const sd of [-1,1]){c.save();c.translate(0.12,0);c.rotate(sd*0.4);c.fillStyle=MK.plateGrad(c,'brass',0,-0.1,0.5,0.16);
        c.beginPath();c.moveTo(0,-0.05*sd);c.lineTo(0.4,-0.1*sd);c.lineTo(0.46,0.02*sd);c.lineTo(0.04,0.06*sd);c.closePath();c.fill();c.restore();}
      MK.wires(c,-0.4,0,PI,n.seed,t,3);}};
    if(n.id==='tank')return {w:0.4,h:0.7,mass:0.5,mat:'steel',draw:(c,t)=>{MK.cyl(c,-0.2,-0.35,0.4,0.7,'steel',{bands:[[0.2,0.06,'brass']]});
      c.fillStyle='#0d0c0b';c.beginPath();c.moveTo(-0.2,0.05);c.lineTo(-0.05,-0.08);c.lineTo(0.08,0.06);c.lineTo(0.2,-0.04);c.lineTo(0.2,0.35);c.lineTo(-0.2,0.35);c.closePath();c.fill();}};
    return null;
  }
  corpseDebris(){
    return {w:1.4,h:0.8,mass:3,mat:'brass',draw:(c,t)=>{
      MK.box(c,-0.6,-0.4,1.1,0.76,0.24,'brass',{tex:'rust',texA:0.3});
      c.save();c.translate(0.62,-0.1);c.beginPath();c.arc(0,0,0.3,PI,0);c.closePath();c.fillStyle=MK.plateGrad(c,'brass',-0.3,-0.3,0.6,0.3);c.fill();
      c.fillStyle='#1a1512';c.fillRect(-0.24,-0.12,0.48,0.08);c.restore();
      const fl=0.3+0.2*Math.sin(t*5+this.x);c.fillStyle='#120a05';rr(c,-0.2,-0.2,0.36,0.26,0.05);c.fill();c.fillStyle=rgba('#ff8a3a',fl);rr(c,-0.17,-0.17,0.3,0.2,0.04);c.fill();}};
  }
  spriteBounds(){return {x:this.cx-2.6,y:this.bottom-3.4,w:5.2,h:3.7};}
}
Object.assign(ENEMY_TYPES,{censor:Censor});
