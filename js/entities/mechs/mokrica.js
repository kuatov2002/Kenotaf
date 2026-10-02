"use strict";
/* ============================== МОКРИЦА ==============================
   Сервисная тележка-уборщик: сегментный панцирь из четырёх пластин на шести лапках, спереди —
   вращающаяся щётка-валик, над ней — глазок. Ползёт по полу, у края и у стены разворачивается.
   Атаки нет: ранит щётка при касании. Первый противник — на ней учатся бить, бить вниз
   с отскоком и ломать деталь.
   Узлы: ЩЁТКА (спереди) · ЛАПЫ (под брюхом).
     щётка сломана → касание безопасно, тележка пятится от курьера;
     лапы сломаны  → волочится на брюхе, высекая искры, еле ползёт. */
class Mokrica extends Mech{
  constructor(world,def,x,y){
    const sh=def.variant==='shell';
    super(world,Object.assign(sh?{w:1.5,h:0.95,hp:90,dmg:1,aggro:6,mass:3,bodyMat:'steel',blood:'#3a3a36',bodyArmor:0}
      :{w:1.1,h:0.62,hp:40,dmg:1,aggro:6,mass:0.8,bodyMat:'rust',blood:'#5a4a30'},def),x,y);
    this.shell=sh;this.S=sh?1.38:1;
    this.face=def.face||(rng(x*17+3)()<0.5?-1:1);
    this.addNode({id:'brush',hp:26,r:0.25*this.S,mat:'steel',coreDmg:14,scrap:2,deflect:sh});
    this.addNode({id:'legs',hp:30,r:0.26*this.S,mat:'steel',coreDmg:14,scrap:2,deflect:sh});
    if(sh){const n=this.addNode({id:'plate',hp:60,r:0.3,mat:'iron',backOnly:true,coreDmg:999,scrap:4});n.hp=n.max*0.42;}
    this.leg=Math.random()*TAU;this.brushA=0;this.skT=0;this.curl=0;this.P={};this.pose(0);
  }
  safe(){return super.safe()||(!this.shell&&!this.has('brush'))||this.curl>0;}
  onBreak(n,h){if(n.id==='plate'&&!this.dead){this.hp=0;this.die(h);}}
  threat(){return this.alert>0&&this.has('brush')&&this.curl<=0&&!super.safe();}
  react(h,k){super.react(h,k);if(!this.dead&&!this.shell)this.curl=0.42;}
  ai(dt){
    const p=this.world.player,R=this.world.room;
    if(this.alert>0)this.alert-=dt;
    if(this.sensePlayer()>0)this.alert=2;
    if(this.curl>0){this.curl-=dt;this.vx=damp(this.vx,0,10,dt);return;}
    const legs=this.has('legs');
    if(this.onGround){
      const fx=this.face>0?this.x+this.w:this.x-0.14,ahead={x:fx,y:this.bottom+0.04,w:0.14,h:0.3};
      const floor=R.solids.some(s=>!s.hidden&&aabb(ahead,s));
      const hz=(R.hazards||[]).some(h=>aabb({x:fx,y:this.y,w:0.14,h:this.h+0.35},h));
      const pt=this.def.patrol,out=pt&&((this.face<0&&this.cx<pt[0])||(this.face>0&&this.cx>pt[1]));
      if(!floor||hz||this.wall===this.face||out)this.face=-this.face;
    }
    /* без щётки — пятится от курьера */
    if(!this.has('brush')&&p&&!p.dead&&Math.abs(p.cx-this.cx)<3.2&&Math.abs(p.cy-this.cy)<2&&(p.cx-this.cx)*this.face>0)this.face=-this.face;
    const spd=this.shell?1.15:(legs?(this.alert>0?2.5:1.5):0.4);
    this.vx=damp(this.vx,this.face*spd,8,dt);
    this.leg+=Math.abs(this.vx)*dt*7;
    this.brushA+=dt*(this.has('brush')?(this.alert>0?24:10):0);
    if(!legs&&Math.abs(this.vx)>0.15&&Math.random()<dt*16)this.world.game.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*0.6,y:this.bottom,
      vx:-this.face*2,vy:-1.5,life:0.25,size:0.035,col:'#ffcf7a',add:true,g:14});
    this.skT-=dt;if(this.skT<=0&&this.onGround){this.skT=0.5+Math.random()*0.4;if(p&&Math.abs(p.cx-this.cx)<9)this.world.game.audio.skitter();}
  }
  pose(dt){
    const P=this.P,cu=this.curl>0?clamp(this.curl/0.42,0,1):0,legs=this.has('legs');
    P.cu=cu;P.sag=legs?0:0.12;P.bob=legs?Math.abs(Math.sin(this.leg))*0.015:0;
    const k=this.S||1;
    const bn=this.node('brush');if(bn){bn.lx=0.47*k;bn.ly=(-0.2+P.sag*0.5)*k;}
    const ln=this.node('legs');if(ln){ln.lx=-0.06*k;ln.ly=(-0.13+P.sag*0.5)*k;}
    const pn=this.node('plate');if(pn){pn.lx=-0.42*k;pn.ly=-0.42*k;}
  }
  draw(c,t){
    if(this.shell){c.save();c.scale(this.S,this.S);this.drawBase(c,t);c.restore();this.drawShell(c,t);return;}
    this.drawBase(c,t);
  }
  /* панцирник: поверх обычной мокрицы — клёпаный бронекожух и треснувший люк на корме */
  drawShell(c,t){const k=this.S;
    c.save();c.scale(k,k);
    c.beginPath();c.moveTo(-0.56,-0.12);c.quadraticCurveTo(-0.5,-0.62,0.0,-0.64);c.quadraticCurveTo(0.42,-0.62,0.5,-0.26);c.lineTo(0.5,-0.12);c.closePath();
    c.fillStyle=MK.plateGrad(c,'steel',-0.56,-0.64,1.06,0.52);c.fill();c.strokeStyle=MAT.steel.ed;c.lineWidth=0.03;c.stroke();
    for(let i=0;i<6;i++)MK.bolt(c,-0.42+i*0.17,-0.5+Math.abs(i-2.5)*0.03,0.022,'steel');
    /* лобовой щиток над щёткой */
    MK.box(c,0.3,-0.42,0.26,0.3,0.04,'steel',{bolts:0.02});
    c.restore();
    const pn=this.node('plate');
    if(pn&&!pn.broken){c.save();c.translate(pn.lx,pn.ly);
      MK.box(c,-0.2,-0.2,0.34,0.36,0.04,'iron',{tex:'rust',texA:0.4});
      MK.cracks(c,-0.03,-0.02,0.24,pn.seed,0.8);
      c.fillStyle=rgba('#ffb45a',0.4+0.3*Math.sin(t*6));c.fillRect(-0.12,0.0,0.18,0.03);c.restore();
      if(Math.random()<0.08)this.world.game.particles.spawn({kind:'steam',x:this.cx+this.face*pn.lx,y:this.bottom+pn.ly,vx:-this.face*0.6,vy:-0.8,life:0.8,size:0.16,grow:0.5,col:'#e8e0d0',drag:1,a:0.5});}
  }
  drawBase(c,t){
    const P=this.P,cu=P.cu,y0=P.sag-P.bob;
    /* лапки: шесть, тонкие стальные; сломаны — обрубки волочатся */
    c.lineCap='round';
    for(let i=0;i<6;i++){const x=-0.42+i*0.16,k=Math.sin(this.leg+i*1.9),far=i%2===1;
      c.strokeStyle=far?'#1f1b17':'#3a332b';c.lineWidth=0.045;
      if(this.has('legs')){c.beginPath();c.moveTo(x,-0.18+y0);c.lineTo(x+0.08+k*0.05,-0.1+y0);c.lineTo(x+0.1+k*0.08,-0.005);c.stroke();}
      else{c.beginPath();c.moveTo(x,-0.14+y0);c.lineTo(x-0.06,-0.04);c.stroke();}}
    /* панцирь: четыре пластины внахлёст, латунная окантовка; сжимается, когда «сворачивается» */
    c.save();c.translate(0,-0.16+y0);c.scale(1,1-cu*0.28);
    for(let i=0;i<4;i++){const x=-0.5+i*0.23,sw=0.31,sh=0.32+0.13*Math.sin((i+0.5)/4*PI);
      c.beginPath();c.ellipse(x+sw/2,0,sw*0.66,sh,0,PI,TAU);c.closePath();
      c.fillStyle=MK.plateGrad(c,'rust',x-0.05,-sh,sw+0.1,sh);c.fill();
      c.strokeStyle=MAT.rust.ed;c.lineWidth=0.025;c.stroke();
      c.strokeStyle=MAT.brass.mid;c.lineWidth=0.025;c.beginPath();c.ellipse(x+sw/2,0,sw*0.62,sh*0.92,0,PI*1.12,PI*1.88);c.stroke();
      c.fillStyle='rgba(255,236,200,.18)';c.beginPath();c.ellipse(x+sw/2-0.04,-sh*0.72,sw*0.2,sh*0.09,0,0,TAU);c.fill();
      MK.bolt(c,x+sw/2,-sh*0.5,0.018,'brass');}
    c.fillStyle='#231d16';c.fillRect(-0.52,-0.02,1.0,0.05);
    c.restore();
    /* голова: короб с глазком и усами-щупами */
    MK.box(c,0.26,-0.4+y0,0.2,0.3,0.05,'iron',{});
    const eye=this.alert>0?1:0.45+0.25*Math.sin(t*4+this.x);
    MK.lens(c,0.38,-0.32+y0,0.045,'#ff3b22',this.has('brush')?eye:0.25);
    c.strokeStyle='#2b241e';c.lineWidth=0.02;
    for(const s of [0,1]){const a=-0.5-s*0.35+Math.sin(t*3+s)*0.12;c.beginPath();c.moveTo(0.42,-0.38+y0);c.quadraticCurveTo(0.6,-0.5+y0,0.42+Math.cos(a)*0.32,-0.38+y0+Math.sin(a)*0.3);c.stroke();}
    /* щётка-валик: латунная ступица, щетина вращается */
    const bn=this.node('brush');
    if(this.has('brush')){const K=this.S||1;c.save();c.translate(bn.lx/K,bn.ly/K);
      c.fillStyle='#2a241c';c.beginPath();c.arc(0,0,0.19,0,TAU);c.fill();
      c.strokeStyle='#6b5a3a';c.lineWidth=0.025;
      for(let i=0;i<12;i++){const a=this.brushA+i/12*TAU;c.beginPath();c.moveTo(Math.cos(a)*0.08,Math.sin(a)*0.08);c.lineTo(Math.cos(a)*0.2,Math.sin(a)*0.2);c.stroke();}
      MK.joint(c,0,0,0.08,'brass');c.restore();}
    else MK.stump(c,bn.lx/(this.S||1)-0.06,bn.ly/(this.S||1),0.07,0,bn.seed,t,'steel');
  }
  partDebris(n){
    if(n.id==='brush')return {w:0.36,h:0.36,mass:0.3,mat:'steel',draw:(c,t)=>{c.fillStyle='#2a241c';c.beginPath();c.arc(0,0,0.17,0,TAU);c.fill();
      c.strokeStyle='#6b5a3a';c.lineWidth=0.025;for(let i=0;i<10;i++){const a=i/10*TAU;c.beginPath();c.moveTo(Math.cos(a)*0.07,Math.sin(a)*0.07);c.lineTo(Math.cos(a)*0.18,Math.sin(a)*0.18);c.stroke();}
      MK.joint(c,0,0,0.07,'brass');}};
    if(n.id==='legs')return {w:0.4,h:0.12,mass:0.2,mat:'steel',draw:(c,t)=>{c.strokeStyle='#3a332b';c.lineWidth=0.045;c.lineCap='round';
      for(let i=0;i<3;i++){c.beginPath();c.moveTo(-0.18+i*0.16,-0.04);c.lineTo(-0.1+i*0.16,0.05);c.stroke();}}};
    return null;
  }
  corpseDebris(){
    return {w:1.0,h:0.36,mass:1.2,mat:'rust',draw:(c,t)=>{
      /* перевёрнутый панцирь: брюхо кверху, лапки поджаты */
      c.save();c.scale(1,-1);c.translate(0,-0.12);
      for(let i=0;i<4;i++){const x=-0.48+i*0.23,sw=0.3,sh=0.26;c.beginPath();c.ellipse(x+sw/2,0,sw*0.66,sh,0,PI,TAU);c.closePath();
        c.fillStyle=MK.plateGrad(c,'rust',x,-sh,sw,sh);c.fill();c.strokeStyle=MAT.rust.ed;c.lineWidth=0.025;c.stroke();}
      c.restore();
      c.strokeStyle='#3a332b';c.lineWidth=0.04;c.lineCap='round';
      for(let i=0;i<6;i++){const x=-0.38+i*0.15;c.beginPath();c.moveTo(x,-0.12);c.lineTo(x+0.04,-0.24-((i*3)%2)*0.04);c.stroke();}}};
  }
  spriteBounds(){const k=this.S||1;return {x:this.cx-1.4*k,y:this.bottom-1.3*k,w:2.8*k,h:1.6*k};}
}
Object.assign(ENEMY_TYPES,{mokrica:Mokrica});
