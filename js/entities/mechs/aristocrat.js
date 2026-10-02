"use strict";
/* ============================== АРИСТОКРАТ ==============================
   Высокий тонкий автомат-господин жилых сотов: цилиндр, фарфоровая маска, длинный сюртук
   цвета бычьей крови, латунные ноги-ходули. Видит монокль-визором и слышит шум шагов.
   Узлы: ВИЗОР (монокль, стекло) · ТРОСТЬ (клинок в трости).
     визор разбит → слеп: идёт на шум, с ошибкой; тихий курьер (без бега) проходит мимо;
     трость сломана → клинка нет, остаётся короткий толчок ладонью.
   Атака: выпад тростью — замах (клинок выдвигается из трости, кольцо на трости), укол
   на 2.3 м вперёд с подшагом. Прерывание импульсом в окне — клинок уходит в пол, механизм открыт. */
class Aristocrat extends MobMech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.8,h:2.35,hp:70,dmg:1,aggro:6.5,hearing:1.0,mass:1.1,bodyMat:'enamel',blood:'#3a2a2a'},def),x,y);
    this.addNode({id:'visor',hp:30,r:0.21,mat:'glass',coreDmg:12,scrap:2});
    this.addNode({id:'cane',hp:44,r:0.26,mat:'steel',coreDmg:12,scrap:2});
    this.glide=Math.random()*TAU;this.blade=0;this.pose(0);
  }
  get blind(){return !this.has('visor');}
  speed(){return this.blind?1.4:2.6;}
  turnTime(){return this.blind?0.5:0.2;}
  atk(){
    if(this.has('cane'))return {kind:'thrust',node:this.node('cane'),range:2.2,wind:0.55,hot:0.28,strike:0.18,rec:0.6};
    return {kind:'shove',node:this.node('visor'),range:1.2,wind:0.45,hot:0.25,strike:0.12,rec:0.7};
  }
  ai(dt){this.sense(dt);this.fight(dt);}
  onWind(A){this.world.game.audio.deflect();}
  onStrike(A){const g=this.world.game;g.audio.melee();this.vx=this.face*(A.kind==='thrust'?8:3);
    if(A.kind==='thrust')g.particles.burst(this.cx+this.face*1.8,this.bottom-1.45,8,{kind:'spark',col:'#c8452f',spd:5,life:0.3,size:0.04,add:true});}
  strikeTick(dt,A){this.vx=damp(this.vx,0,A.kind==='thrust'?6:10,dt);}
  strikeBox(A){const L=A.kind==='thrust'?2.3:1.2;return {x:this.face>0?this.cx+0.1:this.cx-0.1-L,y:this.bottom-1.95,w:L,h:1.1};}
  onBreak(n){const g=this.world.game;
    if(n.id==='visor'){this.investigate=null;this.alert=Math.min(this.alert,1);g.audio.crack('glass');}
    if(n.id==='cane')g.audio.clatter('steel',1);}
  onInterrupt(n){this.vx=-this.face*2.5;}
  pose(dt){
    const P=this.P,s=this.state,A=this.atk(),t=this.t;
    const moving=Math.abs(this.vx)>0.2&&this.onGround;
    this.glide+=(dt||0)*Math.abs(this.vx)*2.6;
    const wk=s==='wind'?clamp(this.st/A.wind,0,1):0,sk=s==='strike'?1:0,rk=s==='recover'?clamp(1-this.st/A.rec,0,1):0;
    const open=this.openT>0||this.stunT>0||this.pinT>0;
    this.blade=damp(this.blade,(s==='wind'||s==='strike')&&A.kind==='thrust'?1:0,s==='wind'?6:4,dt||1);
    let lean=0.02+Math.sin(t*1.6)*0.015-0.12*EZ.out(wk)+0.26*sk+0.1*rk;
    if(open)lean=0.3+Math.sin(t*7)*0.04;
    if(this.pinT>0)lean=-0.25;
    P.lean=lean;P.hipY=-1.0+(moving?Math.abs(Math.sin(this.glide))*0.03:0)+(open?0.08:0);
    const cs=Math.cos(lean),sn=Math.sin(lean),tp=(x,y)=>({x:x*cs-y*sn,y:P.hipY+x*sn+y*cs});P.tp=tp;
    P.sh=tp(0.1,-0.82);P.head=tp(0.06,-1.08);P.neck=tp(0.04,-0.92);
    /* рука с тростью: покой — трость упирается в пол впереди; замах — отведена назад; укол — вытянута */
    let hx=0.36,hy=-1.02,ca=1.38;
    if(A.kind==='thrust'){hx=lerp(hx,-0.08,EZ.out(wk));hy=lerp(hy,-1.5,wk);ca=lerp(ca,-0.08,EZ.out(wk));
      if(sk){hx=0.62;hy=-1.46;ca=0.0;}else if(rk>0){hx=lerp(0.36,0.58,rk);hy=lerp(-1.02,-1.4,rk);ca=lerp(1.38,0.15,rk);}}
    else{hx=lerp(0.3,0.0,wk)+sk*0.55;hy=-1.3;ca=1.0;}
    if(open){hx=0.3;hy=-0.95;ca=1.5;}
    if(!this.has('cane')){ca=1.3;}
    const L=ik2(P.sh.x,P.sh.y,hx,hy,0.36,0.34,1);P.arm=L;P.ca=ca;
    P.caneTip={x:L.fx+Math.cos(ca)*1.0,y:L.fy+Math.sin(ca)*1.0};
    /* ноги: ходули под полами, мелкий семенящий шаг */
    const legs=[];for(let i=0;i<2;i++){const q=this.glide+(i?PI:0);
      const fx=(i?-0.08:0.1)+(moving?Math.sin(q)*0.16:0),fy=moving?-Math.max(0,Math.cos(q))*0.06:0;
      const K=ik2(i?-0.06:0.06,P.hipY,fx,fy,0.52,0.5,-1);legs.push({hx:i?-0.06:0.06,hy:P.hipY,kx:K.kx,ky:K.ky,fx:K.fx,fy:K.fy});}
    P.legs=legs;
    const vn=this.node('visor');if(vn){vn.lx=P.head.x+0.1;vn.ly=P.head.y+0.02;}
    const cn=this.node('cane');if(cn){cn.lx=(L.fx+P.caneTip.x)/2;cn.ly=(L.fy+P.caneTip.y)/2;}
  }
  draw(c,t){
    const P=this.P,s=this.state;
    c.lineCap='round';
    /* ходули */
    for(const [i,L] of P.legs.entries()){const far=i===1;
      MK.seg(c,L.hx,L.hy,L.kx,L.ky,0.08,far?'iron':'brass',{});MK.seg(c,L.kx,L.ky,L.fx,L.fy-0.03,0.06,far?'iron':'brass',{});
      c.fillStyle='#16100f';rr(c,L.fx-0.1,L.fy-0.07,0.24,0.07,0.03);c.fill();}
    /* дальняя рука — за спиной, по-джентльменски */
    c.save();c.translate(0,P.hipY);c.rotate(P.lean);
    c.strokeStyle='#2a1414';c.lineWidth=0.09;c.beginPath();c.moveTo(-0.08,-0.8);c.lineTo(-0.24,-0.45);c.lineTo(-0.08,-0.3);c.stroke();
    /* сюртук: длинные полы, расширяются книзу; латунные пуговицы; белый шейный платок */
    const sw=Math.sin(this.glide)*0.04*Math.min(1,Math.abs(this.vx));
    c.beginPath();c.moveTo(-0.2,-0.86);c.lineTo(0.2,-0.86);c.lineTo(0.28,-0.1);c.lineTo(0.36+sw,0.48);c.lineTo(0.05,0.44);c.lineTo(-0.18,0.52);c.lineTo(-0.42-sw,0.46);c.lineTo(-0.3,-0.1);c.closePath();
    c.fillStyle=MK.plateGrad(c,'oxblood',-0.4,-0.86,0.8,1.38);c.fill();c.strokeStyle=MAT.oxblood.ed;c.lineWidth=0.03;c.stroke();
    c.save();c.clip();c.fillStyle='rgba(255,220,200,.08)';c.fillRect(-0.4,-0.86,0.14,1.4);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(0.05,-0.1,0.02,0.6);c.restore();
    c.fillStyle='#e8dcc8';c.beginPath();c.moveTo(-0.06,-0.86);c.lineTo(0.12,-0.86);c.lineTo(0.06,-0.62);c.closePath();c.fill();
    for(let i=0;i<3;i++)MK.bolt(c,0.12,-0.56+i*0.17,0.026,'brass');
    c.strokeStyle='#8e2b1e';c.lineWidth=0.05;c.beginPath();c.moveTo(-0.2,-0.84);c.lineTo(0.2,-0.84);c.stroke();
    c.restore();
    /* голова: фарфоровая маска, цилиндр, монокль-визор */
    c.save();c.translate(P.head.x,P.head.y);c.rotate(P.lean*0.5+(this.openT>0?Math.sin(t*6)*0.2:0));
    c.fillStyle='#d8cdb8';c.beginPath();c.ellipse(0,0,0.16,0.19,0,0,TAU);c.fill();
    c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(-0.04,0.03,0.11,0.15,0,0,TAU);c.fill();
    c.strokeStyle='#3a2a2a';c.lineWidth=0.015;c.beginPath();c.moveTo(0.04,0.1);c.lineTo(0.13,0.09);c.stroke();
    c.fillStyle='#241c1c';rr(c,-0.19,-0.2,0.38,0.05,0.02);c.fill();
    MK.box(c,-0.15,-0.56,0.3,0.38,0.04,'soot',{});c.fillStyle='#8e2b1e';c.fillRect(-0.15,-0.26,0.3,0.05);
    c.restore();
    const vn=this.node('visor');
    if(this.has('visor')){MK.lens(c,vn.lx,vn.ly,0.08,this.alert>0?'#ff3b22':'#ffb070',this.alert>0?1:0.6,{rim:'brass'});
      c.strokeStyle=MAT.brass.mid;c.lineWidth=0.012;c.beginPath();c.moveTo(vn.lx+0.09,vn.ly);c.quadraticCurveTo(vn.lx+0.12,vn.ly+0.25,vn.lx,vn.ly+0.4);c.stroke();
      if(this.alert>0)this.world.game.renderer.glowAdd(this.cx+this.face*vn.lx,this.bottom+vn.ly,0.45,'#ff3b22',0.4);}
    else{c.fillStyle='#0b0d0f';c.beginPath();c.arc(vn.lx,vn.ly,0.09,0,TAU);c.fill();MK.cracks(c,vn.lx,vn.ly,0.12,vn.seed,1);}
    /* рука и трость-клинок */
    const L=P.arm;
    c.strokeStyle='#3a1a14';c.lineWidth=0.1;c.beginPath();c.moveTo(P.sh.x,P.sh.y);c.lineTo(L.kx,L.ky);c.lineTo(L.fx,L.fy);c.stroke();
    c.fillStyle='#e8dcc8';c.beginPath();c.arc(L.fx,L.fy,0.05,0,TAU);c.fill();
    if(this.has('cane')){c.save();c.translate(L.fx,L.fy);c.rotate(P.ca);
      c.fillStyle='#16100f';rr(c,-0.06,-0.025,1.0,0.05,0.02);c.fill();
      c.fillStyle='rgba(255,255,255,.18)';c.fillRect(0,-0.022,0.9,0.012);
      MK.joint(c,-0.08,0,0.05,'steel');
      if(this.blade>0.02){c.fillStyle='#d6dde2';c.beginPath();c.moveTo(0.94,-0.02);c.lineTo(0.94+0.62*this.blade,0);c.lineTo(0.94,0.02);c.closePath();c.fill();}
      c.restore();}
    else MK.stump(c,L.fx+0.03,L.fy,0.04,P.ca,this.node('cane').seed,t,'steel');
  }
  partDebris(n){
    if(n.id==='visor')return {w:0.2,h:0.2,mass:0.1,mat:'glass',draw:(c,t)=>{MK.joint(c,0,0,0.09,'brass');c.fillStyle='#0b0d0f';c.beginPath();c.arc(0,0,0.06,0,TAU);c.fill();}};
    if(n.id==='cane')return {w:1.0,h:0.08,mass:0.3,mat:'steel',draw:(c,t)=>{c.fillStyle='#16100f';rr(c,-0.5,-0.025,0.8,0.05,0.02);c.fill();
      c.fillStyle='#d6dde2';c.beginPath();c.moveTo(0.3,-0.02);c.lineTo(0.5,0);c.lineTo(0.3,0.02);c.closePath();c.fill();MK.joint(c,-0.52,0,0.05,'steel');}};
    return null;
  }
  corpseDebris(){
    return {w:1.7,h:0.4,mass:1.6,mat:'enamel',draw:(c,t)=>{
      /* рухнувший сюртук, цилиндр откатился, ходули торчат */
      c.fillStyle=MK.plateGrad(c,'oxblood',-0.8,-0.2,1.5,0.4);rr(c,-0.8,-0.18,1.4,0.36,0.12);c.fill();
      MK.seg(c,0.55,0.05,0.95,-0.12,0.07,'brass',{});MK.seg(c,0.5,0.1,0.92,0.08,0.06,'brass',{});
      c.fillStyle='#d8cdb8';c.beginPath();c.ellipse(-0.88,-0.02,0.16,0.14,0,0,TAU);c.fill();
      MK.box(c,-1.2,-0.22,0.22,0.28,0.04,'soot',{});}};
  }
  spriteBounds(){return {x:this.cx-2.4,y:this.bottom-3.0,w:4.8,h:3.3};}
}
Object.assign(ENEMY_TYPES,{aristocrat:Aristocrat});
