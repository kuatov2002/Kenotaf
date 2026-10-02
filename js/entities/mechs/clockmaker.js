"use strict";
/* ============================== ЧАСОВЩИК ==============================
   Узкий автомат-часы Печати: футляр из воронёной стали с латунью, на груди — циферблат,
   в нижнем окне качается маятник, на спине — барабан заводной пружины, на макушке —
   кристалл-резонатор (камертон), которым он выстреливает осколки.
   Узлы: РЕЗОНАТОР (кристалл на голове) · МАЯТНИК (в окне футляра) · ПРУЖИНА (на спине).
     резонатор разбит → стрелять нечем: подходит и рубит руками-стрелками;
     маятник сломан   → ритм сбит: замах то короткий, то длинный, осколки летят вразброс;
     пружина сломана  → завод кончается: ходит и замахивается вдвое медленнее.
   Залп по ритму маятника — веер из трёх осколков. Осколки отбиваются импульсом обратно. */
class Clockmaker extends MobMech{
  constructor(world,def,x,y){
    super(world,Object.assign({w:0.9,h:1.9,hp:72,dmg:1,aggro:11,hearing:0.8,mass:1,bodyMat:'steel',blood:'#5c6067'},def),x,y);
    this.addNode({id:'resonator',hp:34,r:0.24,mat:'glass',coreDmg:12,scrap:2});
    this.addNode({id:'pendulum',hp:40,r:0.26,mat:'brass',coreDmg:10,scrap:2});
    this.addNode({id:'spring',hp:40,r:0.26,mat:'steel',backOnly:true,coreDmg:12,scrap:2});
    this.pend=Math.random()*TAU;this.tick=0;this.windRnd=1;this.pose(0);
  }
  slow(){return this.has('spring')?1:0.5;}
  speed(){return 2.0*this.slow();}
  turnTime(){return this.has('spring')?0.2:0.5;}
  atk(){
    const s=this.slow(),w=this.has('pendulum')?1:this.windRnd;
    if(this.has('resonator'))return {kind:'shard',node:this.node('resonator'),range:12,minR:3.2,dy:7,wind:0.75*w/s,hot:0.3,strike:0.1,rec:1.4/s};
    return {kind:'hands',node:this.has('pendulum')?this.node('pendulum'):null,range:1.5,wind:0.5/s,hot:0.26,strike:0.16,rec:0.8/s};
  }
  ai(dt){this.sense(dt);this.fight(dt);}
  onWind(A){const g=this.world.game;if(A.kind==='shard')g.audio.tone(660,A.wind,'sine',0.02,1320);else g.audio.melee();
    if(!this.has('pendulum'))this.windRnd=0.5+Math.random()*1.1;}
  onStrike(A){
    const g=this.world.game,p=this.world.player;
    if(A.kind==='shard'){const n=this.node('resonator'),sx=n.wx,sy=n.wy,base=Math.atan2(p.cy-sy,p.cx-sx);
      const fan=this.has('pendulum')?[-0.18,0,0.18]:[(Math.random()-0.5)*0.5];
      for(const da of fan){const a=base+da;this.world.projectiles.push({x:sx+Math.cos(a)*0.3,y:sy+Math.sin(a)*0.3,vx:Math.cos(a)*11,vy:Math.sin(a)*11,r:0.17,dmg:1,life:2.4,kind:'shard',rot:0});}
      g.audio.mat('glass',0.6);g.particles.burst(sx,sy,10,{kind:'spark',col:'#cfe6ff',spd:5,life:0.3,size:0.04,add:true});}
    else{g.audio.melee();this.vx=this.face*3;}
  }
  strikeBox(A){if(A.kind!=='hands')return null;return {x:this.face>0?this.cx:this.cx-1.5,y:this.y+0.3,w:1.5,h:1.2};}
  onBreak(n){const g=this.world.game;
    if(n.id==='resonator'){g.audio.crack('glass');g.particles.burst(n.wx,n.wy,20,{kind:'spark',col:'#cfe6ff',spd:6,life:0.5,size:0.05,add:true,g:14});}
    if(n.id==='spring'){g.audio.clatter('steel',1);g.audio.tone(900,0.5,'sine',0.02,200);}
    if(n.id==='pendulum')g.audio.clatter('brass',1);}
  pose(dt){
    const P=this.P,s=this.state,A=this.atk(),t=this.t,sl=this.slow();
    const moving=Math.abs(this.vx)>0.2&&this.onGround;
    const wk=s==='wind'?clamp(this.st/A.wind,0,1):0,sk=s==='strike'?1:0;
    /* маятник: качается всегда (быстрее на охоте и в замахе); сломан — болтается */
    this.pend+=(dt||0)*(this.has('pendulum')?(2.2+(this.hunting()?1.6:0)+wk*4)*sl:0.8);
    const tk=Math.floor(this.pend/PI);if(tk!==this.tick){this.tick=tk;const p=this.world.player;
      if(this.has('pendulum')&&p&&Math.abs(p.cx-this.cx)<10)this.world.game.audio.tone(1900,0.04,'sine',0.006);}
    P.pa=this.has('pendulum')?Math.sin(this.pend)*0.45:0.15+Math.sin(this.pend*3)*0.05;
    P.lean=(A.kind==='shard'?-0.06*wk+0.05*sk:0.12*wk+0.2*sk)+(this.openT>0||this.stunT>0?0.2+Math.sin(t*7)*0.04:0)+this.recoil*0.06;
    P.bob=moving?Math.abs(Math.sin(this.pend*1.5))*0.03:0;P.hipY=-0.82+P.bob;
    const R=(x,y)=>({x:x*Math.cos(P.lean)-y*Math.sin(P.lean),y:P.hipY+x*Math.sin(P.lean)+y*Math.cos(P.lean)});P.R=R;
    /* руки-стрелки: в покое опущены; для ближнего удара — вскинуты и рубят */
    const ra=A.kind==='hands'?lerp(1.2,-1.6,EZ.out(wk))+sk*2.4:1.25+Math.sin(t*1.3)*0.04;
    P.ra=ra;P.sh=R(0.08,-0.92);
    const legs=[];for(let i=0;i<2;i++){const q=this.pend*1.5+(i?PI:0);
      const fx=(i?-0.1:0.12)+(moving?Math.sin(q)*0.16:0),fy=moving?-Math.max(0,Math.cos(q))*0.07:0;
      const K=ik2(i?-0.1:0.1,P.hipY,fx,fy,0.42,0.42,-1);legs.push({hx:i?-0.1:0.1,hy:P.hipY,kx:K.kx,ky:K.ky,fx:K.fx,fy:K.fy});}
    P.legs=legs;
    const rn=this.node('resonator');if(rn){const q=R(0.02,-1.32);rn.lx=q.x;rn.ly=q.y;}
    const pn=this.node('pendulum');if(pn){const piv=R(0,-0.42),q={x:piv.x+Math.sin(P.pa)*0.26,y:piv.y+Math.cos(P.pa)*0.26};P.piv=piv;pn.lx=q.x;pn.ly=q.y;}
    const sn=this.node('spring');if(sn){const q=R(-0.42,-0.62);sn.lx=q.x;sn.ly=q.y;}
  }
  draw(c,t){
    const P=this.P;
    for(const [i,L] of P.legs.entries()){const far=i===1;
      MK.seg(c,L.hx,L.hy,L.kx,L.ky,0.08,far?'iron':'steel',{});MK.seg(c,L.kx,L.ky,L.fx,L.fy-0.03,0.07,far?'iron':'steel',{});
      c.fillStyle=far?'#15171a':'#22252a';rr(c,L.fx-0.12,L.fy-0.07,0.26,0.07,0.03);c.fill();}
    c.save();c.translate(0,P.hipY);c.rotate(P.lean);
    /* пружина на спине: барабан со спиралью */
    if(this.has('spring')){MK.joint(c,-0.42,-0.62,0.22,'steel');c.strokeStyle='#2a2e33';c.lineWidth=0.02;c.beginPath();
      for(let k=0;k<30;k++){const a=k*0.5+this.pend*0.3,r=0.03+k*0.005;k?c.lineTo(-0.42+Math.cos(a)*r,-0.62+Math.sin(a)*r):c.moveTo(-0.42+Math.cos(a)*r,-0.62+Math.sin(a)*r);}c.stroke();}
    else MK.stump(c,-0.36,-0.62,0.1,PI,this.node('spring').seed,t,'steel');
    /* футляр: воронёная сталь, латунные рёбра; окно маятника */
    MK.box(c,-0.32,-1.14,0.64,1.18,0.12,'soot',{seams:[0.5]});
    c.fillStyle=MK.cylGrad(c,'brass',0,-1.16,0,-1.1);c.fillRect(-0.34,-1.16,0.68,0.06);c.fillRect(-0.34,-0.02,0.68,0.06);
    /* циферблат: эмаль, стрелки идут */
    c.fillStyle='#e8e2d4';c.beginPath();c.arc(0,-0.86,0.2,0,TAU);c.fill();c.strokeStyle=MAT.brass.mid;c.lineWidth=0.03;c.stroke();
    c.strokeStyle='#22242a';c.lineWidth=0.025;c.beginPath();c.moveTo(0,-0.86);c.lineTo(Math.cos(this.pend*0.5)*0.15,-0.86+Math.sin(this.pend*0.5)*0.15);c.stroke();
    c.lineWidth=0.035;c.beginPath();c.moveTo(0,-0.86);c.lineTo(Math.cos(this.pend*0.04)*0.1,-0.86+Math.sin(this.pend*0.04)*0.1);c.stroke();
    /* окно маятника (тёмное непрозрачное стекло) */
    c.fillStyle='#0f1316';rr(c,-0.2,-0.58,0.4,0.52,0.06);c.fill();c.strokeStyle=MAT.brass.dk;c.lineWidth=0.03;c.stroke();
    c.restore();
    if(this.has('pendulum')){const n=this.node('pendulum');
      c.strokeStyle=MAT.brass.mid;c.lineWidth=0.025;c.beginPath();c.moveTo(P.piv.x,P.piv.y);c.lineTo(n.lx,n.ly);c.stroke();
      MK.joint(c,n.lx,n.ly,0.1,'brass');}
    /* голова-колпак и кристалл-резонатор */
    c.save();c.translate(0,P.hipY);c.rotate(P.lean);
    MK.box(c,-0.2,-1.3,0.4,0.18,0.06,'steel',{});
    c.restore();
    const rn=this.node('resonator');
    if(this.has('resonator')){c.save();c.translate(rn.lx,rn.ly);c.rotate(P.lean);
      c.fillStyle='#8fb6c9';c.beginPath();c.moveTo(-0.1,0.1);c.lineTo(-0.08,-0.22);c.lineTo(-0.03,-0.22);c.lineTo(-0.03,0.04);c.lineTo(0.03,0.04);c.lineTo(0.03,-0.22);c.lineTo(0.08,-0.22);c.lineTo(0.1,0.1);c.closePath();c.fill();
      c.strokeStyle='#e6f4ff';c.lineWidth=0.015;c.stroke();c.restore();}
    else MK.stump(c,rn.lx,rn.ly+0.06,0.07,-PI/2,rn.seed,t,'glass');
    /* руки-стрелки */
    c.save();c.translate(P.sh.x,P.sh.y);c.rotate(P.ra);
    c.fillStyle='#22252a';c.beginPath();c.moveTo(0,-0.03);c.lineTo(0.62,-0.015);c.lineTo(0.78,0);c.lineTo(0.62,0.015);c.lineTo(0,0.03);c.closePath();c.fill();
    c.fillStyle=MAT.brass.mid;c.beginPath();c.arc(0.6,0,0.04,0,TAU);c.fill();MK.joint(c,0,0,0.05,'brass');c.restore();
  }
  /* свечение кристалла — поверх контура */
  drawFX(c,t){
    if(!this.has('resonator'))return;
    const n=this.node('resonator'),A=this.atk(),wk=this.state==='wind'&&A.kind==='shard'?clamp(this.st/A.wind,0,1):0,k=0.35+0.65*wk;
    c.save();c.globalCompositeOperation='lighter';const gr=c.createRadialGradient(n.lx,n.ly-0.08,0,n.lx,n.ly-0.08,0.22+0.12*wk);
    gr.addColorStop(0,rgba('#ffffff',0.7*k));gr.addColorStop(0.5,rgba('#9fd6ff',0.4*k));gr.addColorStop(1,'rgba(120,190,255,0)');
    c.fillStyle=gr;c.beginPath();c.arc(n.lx,n.ly-0.08,0.22+0.12*wk,0,TAU);c.fill();c.restore();
    this.world.game.renderer.glowAdd(n.wx,n.wy-0.08,0.6+0.6*wk,'#9fd6ff',0.25+0.4*wk);
  }
  partDebris(n){
    if(n.id==='resonator')return {w:0.2,h:0.32,mass:0.1,mat:'glass',draw:(c,t)=>{c.fillStyle='#8fb6c9';c.fillRect(-0.08,-0.16,0.05,0.3);c.fillRect(0.03,-0.16,0.05,0.3);c.fillRect(-0.08,0.1,0.16,0.04);}};
    if(n.id==='pendulum')return {w:0.24,h:0.5,mass:0.2,mat:'brass',draw:(c,t)=>{c.strokeStyle=MAT.brass.mid;c.lineWidth=0.025;c.beginPath();c.moveTo(0,-0.24);c.lineTo(0,0.12);c.stroke();MK.joint(c,0,0.14,0.1,'brass');}};
    if(n.id==='spring')return {w:0.44,h:0.44,mass:0.3,mat:'steel',draw:(c,t)=>{MK.joint(c,0,0,0.2,'steel');}};
    return null;
  }
  corpseDebris(){
    return {w:1.2,h:0.5,mass:1.4,mat:'steel',draw:(c,t)=>{
      c.save();c.rotate(-0.08);MK.box(c,-0.58,-0.22,1.18,0.44,0.1,'soot',{});
      c.fillStyle='#e8e2d4';c.beginPath();c.arc(0.3,0,0.17,0,TAU);c.fill();c.strokeStyle='#22242a';c.lineWidth=0.025;c.beginPath();c.moveTo(0.3,0);c.lineTo(0.42,-0.05);c.stroke();
      c.restore();}};
  }
  spriteBounds(){return {x:this.cx-1.8,y:this.bottom-2.7,w:3.6,h:3.0};}
}
Object.assign(ENEMY_TYPES,{clockmaker:Clockmaker});
