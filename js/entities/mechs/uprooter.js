"use strict";
/* ============================== КОРЧЕВАТЕЛЬ ==============================
   Садовая машина Эдема: гусеничное шасси, на носу — роторный барабан-рыхлитель на двух рычагах,
   над кабиной — серп-коса на суставчатой руке, за кабиной — стеклянный бак гербицида.
   В кабине за стеклом — барабан каталога: всё, чего в нём нет, машина вырывает с корнем.
   Узлы:  БАРАБАН (нос) · КОСА (рука над кабиной) · БАК (корма, только сзади) · КАТАЛОГ (ядро).
   Атаки (каждая читается заранее):
     коса низом — коса у самой земли, клинок назад: ПЕРЕПРЫГНУТЬ;
     коса верхом — коса над головой: ПРИГНУТЬСЯ / ПОДКАТ;
     таран барабаном — барабан раскручивается, искры: рывок СКВОЗЬ или прочь; в стену — оглушён;
     корчевание — барабан в землю, к курьеру бежит цепочка вспучиваний (трещины за полсекунды);
     гербицид — три облака по фронту; облака жгут, но ИМПУЛЬС сдувает их — обратно в машину:
       облако в баке — бак разъедает, машина задыхается (оглушение);
     (II) швыряет вырванные деревья — круги на полу; (III) серии, ядро открыто.
   Поломки меняют бой: без барабана нет тарана и корчевания; без косы — только барабан;
   без бака — ни облаков, ни удушья. Каталог за стеклом открывается, когда сломаны две системы. */
class Uprooter extends MechBoss{
  constructor(world,x,y){
    super(world,{type:'uprooter',w:5.4,h:3.4,hp:999,mass:9,bodyMat:'steel',name:'КОРЧЕВАТЕЛЬ'},x,y);
    this.addNode({id:'drum',hp:200,r:0.75,mat:'steel',coreDmg:0,scrap:5});
    this.addNode({id:'scythe',hp:170,r:0.5,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'tank',hp:110,r:0.6,mat:'glass',backOnly:true,coreDmg:0,scrap:3});
    this.addNode({id:'core',hp:300,r:0.55,mat:'copper',core:true,locked:true,scrap:9,stump:false});
    this.face=-1;this.cd=1.6;this.tread=0;this.drumA=0;this.drumSpin=0.4;this.turnT=0;this.P={sa:-2.2,sb:1.4,slow:false};
    this.camZoom=0.92;this.woke=false;this.combo=0;this.pose(0);
  }
  get coreX(){const n=this.node('core');return n?n.wx:this.cx;}
  get coreY(){const n=this.node('core');return n?n.wy:this.cy;}
  des(){return (this.phase>=3?1.35:this.phase>=2?1.15:1)*(BossDyn.linking(this)?1.2:1);}
  /* связки: коса низ/верх, корчевание с добивкой, облака и таран сквозь них */
  pickString(ad){const ph=this.phase,sc=this.has('scythe'),dr=this.has('drum'),tk=this.has('tank');const o=[];
    if(ad<6.2)o.push([['low','high'],sc?2.6:0],[['high','low'],sc?2:0],[['low','uproot'],sc&&dr?1.4:0],[['spray','till'],tk&&dr?1.2:0],
      [['low','high','till'],sc&&dr&&ph>=3?2:0],[['high','spray'],sc&&tk?1:0]);
    else o.push([['till'],dr?2:0],[['uproot','low'],dr&&sc?2:0],[['spray','till'],tk&&dr?1.6:0],[['throw','uproot'],ph>=2&&dr?1.6:0],
      [['throw','till'],ph>=2&&dr?1.2:0],[['uproot','uproot'],dr&&ph>=3?1.4:0],[['throw'],1]);
    return BossDyn.pick(o)||['throw'];}
  behind(px){return Math.sign(px-this.cx)===-this.face;}
  isWinding(){return /Wind$/.test(this.state);}
  attackUses(n){const s=this.state;
    if(s==='lowWind'||s==='highWind'||s==='low'||s==='high')return n.id==='scythe';
    if(s==='tillWind'||s==='till'||s==='uprootWind')return n.id==='drum';
    if(s==='sprayWind')return n.id==='tank';return false;}
  cancelAttack(){super.cancelAttack();BossDyn.clear(this);if(['open','stunWall','choke'].indexOf(this.state)<0){this.state='recover';this.st=0;}}
  threat(){if(super.threat())return true;return ['low','high','till','uproot','throw','buck'].indexOf(this.state)>=0;}
  safe(){return super.safe()||this.state==='choke';}
  /* облако гербицида, сдутое импульсом обратно: бак разъедает, машина задыхается */
  cloudHit(z){const g=this.world.game,tn=this.node('tank');
    if(tn&&!tn.broken){tn.hp-=48;tn.hitT=0.3;if(tn.hp<=0)this.breakNode(tn,{dir:Math.sign(z.vx)||1,sx:tn.wx,sy:tn.wy},false);}
    if(this.dead)return;
    this.cancelAttack();this.state='choke';this.st=0;this.vx=0;
    for(const n of this.nodes)if(!n.broken&&!n.locked)n.exT=Math.max(n.exT,2.0);
    g.audio.steamBurst();g.audio.mat('glass',1);g.camera.addShake(0.6);g.hitstop(0.08);
    g.particles.burst(this.cx,this.cy,30,{kind:'steam',col:'#9ab84a',spd:5,life:1.4,size:0.6,grow:1.2,drag:1.4,a:0.6});}
  ai(dt){
    const p=this.world.player,g=this.world.game,W=this.world,R=W.room;
    this.st+=dt;this.cd-=dt;const des=this.des();
    if(!this.woke){this.woke=true;this.state='wake';this.st=0;}
    const dd=p.cx-this.cx,ad=Math.abs(dd),want=dd>0?1:-1;
    this.drumSpin=damp(this.drumSpin,(this.state==='tillWind'||this.state==='till')?14:(this.state==='uprootWind'||this.state==='uproot')?9:0.6,3,dt);
    this.drumA+=this.drumSpin*dt;
    switch(this.state){
      case 'wake':this.vx=0;if(this.st>1.3){this.state='idle';this.st=0;this.cd=0.5;g.audio.bossRoar();g.camera.addShake(0.6);}break;
      case 'idle':{
        /* за кормой долго не постоишь: машина дёргается назад гусеницами */
        if(want!==this.face){this.turnT+=dt;
          if(this.turnT>0.55&&ad<4.2&&this.cd<=0.3){this.turnT=0;this.begin('buck');break;}
          if(this.turnT>(0.7/des)){this.face=want;this.turnT=0;this.cd=Math.min(this.cd,0.1);g.audio.hydraulic(0.6);}}else this.turnT=0;
        /* преследование: держит курьера на дистанции косы */
        const spd=(this.phase>=3?3.6:3.0)*Math.min(des,1.2);this.vx=damp(this.vx,this.face===want?this.face*(ad>5.2?spd:ad<2.6?-spd*0.5:0.3*spd):0,3,dt);
        if(this.cd<=0&&this.face===want)this.begin(BossDyn.queue(this,this.pickString(ad)));
        break;}
      /* рывок назад: выхлоп из кормы (телеграф), гусеницы на реверс — корма бьёт */
      case 'buckWind':{const Wd=0.5;this.vx=damp(this.vx,this.face*0.6,6,dt);
        if(Math.random()<dt*40)g.particles.spawn({kind:'smoke',x:this.cx-this.face*2.8,y:this.y+0.6,vx:-this.face*2,vy:-1,life:0.7,size:0.3,grow:0.8,col:'#3a342c',drag:1.2,a:0.6});
        this.telegraph(this.node('tank')&&this.has('tank')?this.node('tank'):this.node('core'),this.st/Wd,this.st>Wd-0.25);
        if(this.st>=Wd){this.state='buck';this.st=0;this.hitDone=false;g.audio.dash();}break;}
      case 'buck':{this.vx=-this.face*9;
        const hb={x:this.face>0?this.x-0.6:this.x+this.w-1.8,y:this.y+0.6,w:2.4,h:this.h-0.6};
        if(!this.hitDone&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}
        if(this.st>0.3||this.wall!==0){this.vx=0;this.state='recover';this.st=0;}break;}
      case 'roar':this.vx=0;if(this.st>1.0){this.state='idle';this.st=0;this.cd=0.15;}break;
      case 'overheat':this.vx=damp(this.vx,0,8,dt);
        if(Math.random()<dt*40)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*4,y:this.y+0.4,vx:0,vy:-3,life:0.9,size:0.45,grow:1,col:'#d8e0c0',drag:1.2});
        if(this.st>1.5){this.state='idle';this.st=0;this.cd=0.2;}break;
      case 'lowWind':case 'highWind':{const Wd=0.85/des,low=this.state==='lowWind';this.vx=damp(this.vx,0,7,dt);
        this.telegraph(this.node('scythe'),this.st/Wd,this.st>Wd-0.36);
        if(this.st>=Wd){this.state=low?'low':'high';this.st=0;this.hitDone=false;g.audio.heavy();g.audio.melee();g.camera.addShake(0.3);}
        break;}
      case 'low':case 'high':{this.vx=damp(this.vx,this.face*2.2,4,dt);
        const low=this.state==='low',hb={x:this.face>0?this.cx-0.5:this.cx-6.3,y:low?this.bottom-1.15:this.bottom-2.0,w:6.8,h:low?1.15:0.75};   /* верх — на уровне головы: присел — прошла над тобой */
        if(!this.hitDone&&this.st>0.05&&this.st<0.3&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}
        if(low&&this.st<0.25&&Math.random()<dt*60)g.particles.spawn({kind:'leaf',x:this.cx+this.face*(1+Math.random()*5),y:this.bottom-0.2,vx:this.face*4,vy:-3,life:1.2,size:0.14,col:'#6f9a4a',rot:Math.random()*6,vr:8,drag:0.8,a:0.9});
        if(this.st>0.4){this.state='recover';this.st=0;}
        break;}
      case 'tillWind':{const Wd=1.05/des;this.vx=damp(this.vx,-this.face*0.8,5,dt);
        this.telegraph(this.node('drum'),this.st/Wd,this.st>Wd-0.38);
        if(Math.random()<dt*50){const dx=this.node('drum').wx;g.particles.spawn({kind:'spark',x:dx,y:this.bottom-0.2,vx:-this.face*4,vy:-2-Math.random()*3,life:0.4,size:0.05,col:'#ffcf7a',add:true,g:16});}
        if(this.st>=Wd){this.state='till';this.st=0;this.hitDone=false;g.audio.dash();g.audio.hydraulic(1);}
        break;}
      case 'till':{this.vx=this.face*11*Math.min(1.2,des);
        if(!this.hitDone&&aabb(this.rect(),p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<dt*70)g.particles.spawn({kind:'debris',x:this.cx+this.face*2.6,y:this.bottom-0.1,vx:-this.face*(3+Math.random()*4),vy:-2-Math.random()*4,life:0.8,size:0.12,col:'#5a4a30',g:26});
        if(this.wall!==0||this.x<=0.05||this.x+this.w>=R.w-0.05){
          g.audio.explosion();g.camera.addShake(1.0);g.hitstop(0.1);this.vx=0;this.state='stunWall';this.st=0;
          g.particles.burst(this.cx+this.face*2.8,this.cy,28,{kind:'debris',col:'#6b5a44',spd:9,life:1,size:0.16,g:26});
          for(const n of this.nodes)if(!n.broken&&!n.locked&&n.id!=='tank')n.exT=Math.max(n.exT,1.9);}
        else if(this.st>3.5){this.state='recover';this.st=0;}
        break;}
      case 'uprootWind':{const Wd=0.8/des;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('drum'),this.st/Wd,this.st>Wd-0.34);
        if(this.st>=Wd){this.state='uproot';this.st=0;g.audio.explosion();g.camera.addShake(0.6);
          const x0=this.node('drum').wx,n=this.phase>=3?9:7;
          for(let i=0;i<n;i++){const x=x0+this.face*(1.4+i*1.6);if(x<1||x>R.w-1)break;
            W.projectiles.push({kind:'erupt',x:x,y:this.bottom,fy:this.bottom,delay:0.45+i*0.17,r:0.7,h:3.0,life:3,dmg:1});}}
        break;}
      case 'uproot':this.vx=0;if(this.st>1.1){this.state='recover';this.st=0;}break;
      case 'sprayWind':{const Wd=0.75/des;this.vx=damp(this.vx,0,7,dt);this.telegraph(this.node('tank'),this.st/Wd,this.st>Wd-0.34);
        if(this.st>=Wd){this.state='spray';this.st=0;g.audio.steamBurst();
          const n=this.phase>=3?4:3;
          for(let i=0;i<n;i++){const x=clamp(this.cx+this.face*(2.8+i*2.4),1.5,R.w-1.5);
            BossFX.zone(W,{kind:'cloud',x:x,y:this.bottom-1.0-((i%2)*0.8),r:0.6,rmax:1.9+0.2*i,life:6,vx:this.face*2});}}
        break;}
      case 'spray':this.vx=0;
        if(this.st<0.4&&Math.random()<dt*80)g.particles.spawn({kind:'steam',x:this.cx-this.face*2.4,y:this.bottom-2.6,vx:this.face*6,vy:-1,life:0.7,size:0.4,grow:1,col:'#9ab84a',drag:1.4,a:0.6});
        if(this.st>0.7){this.state='recover';this.st=0;}break;
      case 'throwWind':{const Wd=0.9/des;this.vx=damp(this.vx,0,7,dt);
        this.telegraph(this.has('scythe')?this.node('scythe'):this.node('core'),this.st/Wd,this.st>Wd-0.3);
        if(this.st>=Wd){this.state='throw';this.st=0;g.audio.hydraulic(1);
          const n=this.phase>=3?3:2;for(let i=0;i<n;i++)BossFX.drop(W,clamp(p.cx+(i-(n-1)/2)*3.2+(Math.random()-0.5),2,R.w-2),{look:'boulder',r:0.7,rad:1.5,delay:0.8+i*0.25});}
        break;}
      case 'throw':this.vx=0;if(this.st>0.6){this.state='recover';this.st=0;}break;
      case 'stunWall':this.vx=0;if(Math.random()<dt*20)g.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*3,y:this.y,vx:0,vy:-1,life:0.5,size:0.05,col:'#ffe6a3',add:true});
        if(this.st>1.8){this.state='recover';this.st=0;}break;
      case 'choke':this.vx=damp(this.vx,0,8,dt);
        if(Math.random()<dt*24)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*4,y:this.y+0.6,vx:0,vy:-1.4,life:1,size:0.4,grow:0.6,col:'#9ab84a',drag:1,a:0.5});
        if(this.st>2.2){this.state='recover';this.st=0;}break;
      case 'recover':{this.vx=damp(this.vx,0,6,dt);
        if(BossDyn.more(this)){if(this.st>0.2){this.face=p.cx>this.cx?1:-1;this.begin(BossDyn.next(this));}break;}
        if(this.st>0.45){const n=this.qn||0;BossDyn.clear(this);
          if(this.phase>=3&&n>=3){this.state='overheat';this.st=0;g.audio.steamBurst();for(const q of this.nodes)if(!q.broken&&!q.locked)q.exT=Math.max(q.exT,1.5);break;}
          this.state='idle';this.st=0;this.cd=(0.3+Math.random()*0.35)/des;}
        break;}
      default:this.state='idle';this.st=0;
    }
    const broken=this.nodes.filter(n=>!n.core&&n.broken).length,core=this.node('core');
    this.phase=!core.locked?3:(broken>=1||this.integrity()<0.72)?2:1;
    if(!this.dead&&BossDyn.phaseUp(this)){this.cancelAttack();this.state='roar';this.st=0;BossDyn.roar(this,g,'#c8d8a0');}
  }
  begin(k){const g=this.world.game;this.st=0;this.hitDone=false;this.turnT=0;
    this.state=k+'Wind';if(k==='till')g.audio.elevator();else if(k==='spray')g.audio.steam(0.6);else g.audio.hydraulic(0.8);}
  onInterrupt(n){const g=this.world.game;
    if(n.id==='drum'){g.audio.explosion();g.particles.burst(n.wx,this.bottom,20,{kind:'debris',col:'#5a4a30',spd:7,life:0.9,size:0.13,g:28});}
    if(n.id==='tank'){g.audio.steam(1);BossFX.zone(this.world,{kind:'cloud',x:this.cx-this.face*2.6,y:this.cy,r:1.2,rmax:2.2,life:2.5,pushed:false});}}
  onBreak(n,h){const g=this.world.game;
    if(n.core){super.onBreak(n,h);return;}
    g.audio.bossRoar();
    if(n.id==='tank'){g.audio.mat('glass',1);for(let i=0;i<2;i++)BossFX.zone(this.world,{kind:'cloud',x:n.wx-this.face*(i*1.5),y:n.wy,r:1.4,rmax:2.6,life:4});}
    const broken=this.nodes.filter(q=>!q.core&&q.broken).length,core=this.node('core');
    if(broken>=2&&core.locked){core.locked=false;core.exT=2.6;g.audio.mat('glass',1);
      g.particles.burst(core.wx,core.wy,30,{kind:'spark',col:'#dff4ff',spd:8,life:0.6,size:0.05,add:true,g:16});
      g.hud.say('СТЕКЛО КАБИНЫ ЛОПНУЛО. БАРАБАН КАТАЛОГА ОТКРЫТ.','');}
  }
  onDeath(h){const W=this.world;
    for(let i=0;i<14;i++)W.game.particles.spawn({kind:'leaf',x:this.cx+(Math.random()-0.5)*4,y:this.y,vx:(Math.random()-0.5)*6,vy:-4-Math.random()*4,life:3,size:0.16,col:Math.random()<0.5?'#ffd83a':'#6f9a4a',rot:Math.random()*6,vr:6,drag:0.5,a:0.9});}
  /* --- поза --- */
  pose(dt){
    const P=this.P,s=this.state,t=this.t;dt=dt||0;
    this.tread+=this.vx*this.face*dt;
    const kw=(W)=>clamp(this.st/(W/this.des()),0,1);
    let sa=-2.2+Math.sin(t*1.4)*0.06,sb=1.5;   /* коса: плечо, локоть (отн. углы) */
    if(s==='lowWind'){const k=kw(0.85);sa=lerp(-2.2,-0.4,EZ.out(k));sb=lerp(1.5,2.6,k);}
    else if(s==='low'){const k=clamp(this.st/0.2,0,1);sa=lerp(-0.4,0.35,EZ.out(k));sb=lerp(2.6,0.4,k);}
    else if(s==='highWind'){const k=kw(0.85);sa=lerp(-2.2,-2.9,EZ.out(k));sb=lerp(1.5,0.4,k);}
    else if(s==='high'){const k=clamp(this.st/0.2,0,1);sa=lerp(-2.9,0.7,EZ.out(k));sb=lerp(0.4,-0.5,k);}
    else if(s==='throwWind'){sa=-3.0;sb=0.6;}
    else if(s==='stunWall'||s==='choke'||this.openT>0){sa=-0.8+Math.sin(t*7)*0.06;sb=1.9;}
    P.sa=dt?damp(P.sa,sa,s==='low'||s==='high'?40:10,dt):sa;P.sb=dt?damp(P.sb,sb,s==='low'||s==='high'?40:10,dt):sb;
    P.lean=(s==='till'?0.05:0)+(s==='stunWall'?-0.05:0)+this.recoil*0.02;
    P.bob=Math.sin(t*2)*0.03+(s==='till'?Math.sin(t*40)*0.04:0);
    const sh={x:0.1,y:-3.5+P.bob},el={x:sh.x+Math.cos(P.sa)*1.6,y:sh.y+Math.sin(P.sa)*1.6},tip={x:el.x+Math.cos(P.sa+P.sb)*1.7,y:el.y+Math.sin(P.sa+P.sb)*1.7};
    if(tip.y>-0.15)tip.y=-0.15;
    P.sh=sh;P.el=el;P.tip=tip;
    const dk=(s==='uprootWind'||s==='uproot')?0.5:0;P.drum={x:2.75,y:-0.75+dk*0.4};
    const dn=this.node('drum');dn.lx=P.drum.x;dn.ly=P.drum.y;
    const sn=this.node('scythe');sn.lx=el.x;sn.ly=el.y;
    const tn=this.node('tank');tn.lx=-2.55;tn.ly=-1.95+P.bob;
    const cn=this.node('core');cn.lx=-0.35;cn.ly=-3.0+P.bob;
  }
  draw(c,t){
    const P=this.P,bob=P.bob,cn=this.node('core'),thr=this.threat(),tr=this.tread;
    /* ---- ходовая: резиновая лента с траками, ведущая звезда, ленивец, катки, грязь ---- */
    c.fillStyle='#16140f';rr(c,-2.75,-1.1,5.25,1.1,0.52);c.fill();
    c.strokeStyle='#2c2822';c.lineWidth=0.11;rr(c,-2.68,-1.03,5.11,0.96,0.46);c.stroke();
    c.strokeStyle='#4a4339';c.lineWidth=0.06;
    for(let i=0;i<16;i++){const x=-2.45+((i*0.33+tr*0.6)%4.95+4.95)%4.95;c.beginPath();c.moveTo(x,-1.1);c.lineTo(x+0.08,-0.96);c.moveTo(x,-0.14);c.lineTo(x+0.08,0);c.stroke();}
    const wheel=(x,r,mat,teeth)=>{c.save();c.translate(x,-0.55);c.rotate(tr*1.2/r);
      if(teeth){c.fillStyle='#3a342a';c.beginPath();for(let i=0;i<20;i++){const q=i/20*TAU,rr2=i%2?r:r*0.86;c.lineTo(Math.cos(q)*rr2,Math.sin(q)*rr2);}c.closePath();c.fill();}
      c.fillStyle=MK.cylGrad(c,mat,-r,0,r,0);c.beginPath();c.arc(0,0,r*0.8,0,TAU);c.fill();
      c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=0.03;c.beginPath();c.arc(0,0,r*0.55,0,TAU);c.stroke();
      for(let k=0;k<5;k++){const q=k/5*TAU;MK.bolt(c,Math.cos(q)*r*0.42,Math.sin(q)*r*0.42,0.03,'steel');}
      MK.joint(c,0,0,r*0.22,'brass');c.restore();};
    wheel(2.05,0.46,'iron',true);wheel(-2.3,0.42,'iron',false);
    for(let i=0;i<4;i++)wheel(-1.35+i*0.82,0.3,'steel',false);
    c.fillStyle='#4a3a20';for(const [x,y,r] of [[-2.2,-0.08,0.16],[-0.6,-0.05,0.12],[0.9,-0.06,0.15],[1.9,-0.95,0.13],[-1.6,-1.0,0.1]]){c.beginPath();c.ellipse(x,y,r*1.4,r,0,0,TAU);c.fill();}
    /* крыло над гусеницей: заклёпки, «зебра» на носу */
    MK.box(c,-2.85,-1.32+bob,5.35,0.3,0.08,'olive',{tex:'rust',texA:0.3,bolts:0.03});
    c.save();rr(c,1.9,-1.32+bob,0.6,0.3,0.06);c.clip();for(let i=0;i<5;i++){c.fillStyle=i%2?'#1a1a14':'#d8b830';c.beginPath();c.moveTo(1.9+i*0.16,-1.32+bob);c.lineTo(2.06+i*0.16,-1.32+bob);c.lineTo(1.9+i*0.16,-1.02+bob);c.lineTo(1.74+i*0.16,-1.02+bob);c.closePath();c.fill();}c.restore();
    /* ---- бак гербицида (корма): зелёное стекло в латунной клетке, жидкость плещется ---- */
    if(this.has('tank')){const tn=this.node('tank');
      c.fillStyle='#1a2a12';rr(c,-3.08,-3.05,1.0,2.1,0.32);c.fill();
      const lv=-1.2-1.4*clamp(tn.hp/tn.max,0.15,1)+Math.sin(t*3)*0.05;
      const lg=c.createLinearGradient(0,lv,0,-1.0);lg.addColorStop(0,'#d8f05a');lg.addColorStop(1,'#3a5a12');c.fillStyle=lg;
      c.save();rr(c,-3.02,-3.0,0.88,2.0,0.29);c.clip();c.fillRect(-3.02,lv,0.88,3);
      for(let i=0;i<4;i++){const by=(-1.1-((t*0.6+i*0.37)%1.6));c.fillStyle='rgba(230,255,170,.5)';c.beginPath();c.arc(-2.7+i*0.15,by,0.04,0,TAU);c.fill();}c.restore();
      c.strokeStyle='rgba(220,255,200,.55)';c.lineWidth=0.04;rr(c,-3.02,-3.0,0.88,2.0,0.29);c.stroke();
      c.fillStyle='rgba(255,255,255,.32)';c.fillRect(-2.92,-2.85,0.08,1.6);
      for(const y of [-2.8,-2.0,-1.2]){c.fillStyle=MK.cylGrad(c,'brass',-3.11,0,-2.05,0);c.fillRect(-3.11,y,1.06,0.1);}
      for(const x of [-3.0,-2.16]){c.fillStyle=MK.cylGrad(c,'brass',x-0.04,0,x+0.04,0);c.fillRect(x-0.04,-3.0,0.08,2.05);}
      c.fillStyle='#c8452f';c.beginPath();c.arc(-2.58,-3.12,0.08,0,TAU);c.fill();
      MK.hose(c,[[-2.55,-3.05],[-2.25,-3.55],[-1.6,-3.35]],0.08,'#2f2b28',{ribs:true});
      MK.hose(c,[[-2.1,-1.3],[-0.8,-0.98+bob],[1.4,-1.05+bob]],0.07,'#34302a',{ribs:true});}
    else MK.stump(c,-2.2,-1.9,0.3,PI,this.node('tank').seed,t,'glass');
    /* ---- корпус: оливковая краска садовых машин, подтёки ржавчины, решётка радиатора, фары ---- */
    MK.box(c,-2.25,-2.75+bob,4.0,1.85,0.32,'olive',{tex:'rust',texA:0.28,seams:[0.33,0.66],bolts:0.05});
    c.save();rr(c,-2.25,-2.75+bob,4.0,1.85,0.32);c.clip();
    for(let i=0;i<7;i++){const x=-2.0+i*0.58+((i*37)%7)*0.04,g=c.createLinearGradient(0,-2.6+bob,0,-1.0+bob);g.addColorStop(0,'rgba(90,50,24,.0)');g.addColorStop(0.3,'rgba(90,50,24,.35)');g.addColorStop(1,'rgba(90,50,24,0)');
      c.fillStyle=g;c.fillRect(x,-2.6+bob,0.06+((i*13)%3)*0.02,1.6);}
    c.fillStyle='rgba(0,0,0,.28)';c.fillRect(-2.25,-1.3+bob,4.0,0.4);c.restore();
    for(let i=0;i<3;i++){c.fillStyle=MK.cylGrad(c,'brass',0,-1.4+bob,0,-1.3+bob);c.fillRect(-2.25,-1.45+bob-i*0.42,4.0,0.07);}
    c.fillStyle='#14120c';rr(c,1.3,-2.55+bob,0.42,1.25,0.06);c.fill();
    c.strokeStyle='#6a6a52';c.lineWidth=0.04;for(let i=0;i<6;i++){c.beginPath();c.moveTo(1.36+i*0.06,-2.5+bob);c.lineTo(1.36+i*0.06,-1.35+bob);c.stroke();}
    for(const y of [-2.35,-1.75]){const on=thr?1:0.6;c.fillStyle='#2a2418';c.beginPath();c.arc(1.82,y+bob,0.17,0,TAU);c.fill();
      c.fillStyle=rgba(thr?'#ffd27a':'#fff2c0',on);c.beginPath();c.arc(1.84,y+bob,0.11,0,TAU);c.fill();
      this.world.game.renderer.glowAdd(this.cx+this.face*1.9,this.bottom+y+bob,0.9,'#fff2c0',0.35*on);}
    Kit.stencil(c,-1.9,-1.05+bob,'ЭДЕМ · К-1',0.28,'rgba(232,224,190,.55)',0.55);
    c.fillStyle=MK.plateGrad(c,'brass',-0.6,-2.2+bob,1.1,0.4);rr(c,-0.6,-2.25+bob,1.1,0.38,0.05);c.fill();
    c.fillStyle='rgba(40,30,10,.7)';c.font='600 0.13px Oswald';c.fillText('КАТАЛОГ ВИДОВ · №1',-0.55,-2.0+bob);
    /* форсунки гербицида под носом */
    for(let i=0;i<3;i++){MK.seg(c,0.9+i*0.25,-1.2+bob,1.15+i*0.25,-0.95+bob,0.07,'brass',{});}
    /* ---- двигатель за кабиной: рёбра охлаждения и выхлопная труба с копотью ---- */
    MK.box(c,-2.15,-3.35+bob,0.95,0.62,0.08,'iron',{bolts:0.03});
    c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=0.03;for(let i=0;i<6;i++){c.beginPath();c.moveTo(-2.05+i*0.14,-3.3+bob);c.lineTo(-2.05+i*0.14,-2.78+bob);c.stroke();}
    MK.cyl(c,-1.95,-4.55+bob,0.24,1.25,'iron',{bands:[[0.15,0.05,'brass'],[0.7,0.05,'brass']]});
    c.fillStyle='#14120e';c.beginPath();c.ellipse(-1.83,-4.55+bob,0.14,0.05,0,0,TAU);c.fill();
    for(let i=0;i<3;i++){const k=(t*0.8+i/3)%1;c.fillStyle=rgba('#2a2622',0.35*(1-k));c.beginPath();c.arc(-1.83-k*0.5,-4.7+bob-k*1.3,0.12+k*0.35,0,TAU);c.fill();}
    /* ---- кабина: козырёк, рамы окон, барабан каталога за стеклом, маячок ---- */
    MK.box(c,-1.25,-3.75+bob,1.75,1.1,0.18,'olive',{bolts:0.04});
    c.fillStyle=MK.plateGrad(c,'olive',-1.45,-4.0+bob,2.2,0.3);c.beginPath();c.moveTo(-1.42,-3.72+bob);c.lineTo(0.75,-3.72+bob);c.lineTo(0.95,-3.88+bob);c.lineTo(-1.35,-3.95+bob);c.closePath();c.fill();
    c.strokeStyle=MAT.olive.ed;c.lineWidth=0.03;c.stroke();
    c.fillStyle='#0d120a';rr(c,-1.05,-3.6+bob,1.35,0.8,0.08);c.fill();
    if(!cn.broken){const k=cn.locked?0.35:0.8+0.2*Math.sin(t*9);
      c.save();rr(c,-1.05,-3.6+bob,1.35,0.8,0.08);c.clip();
      c.fillStyle='#3a2a14';c.fillRect(-0.85,-3.45+bob,0.95,0.5);
      for(let i=0;i<8;i++){const y=-3.43+bob+((i*0.07+t*0.4)%0.5);c.fillStyle=rgba('#e8d8a8',0.6*k);c.fillRect(-0.8,y,0.85,0.025);}
      c.restore();
      if(cn.locked){c.fillStyle='rgba(160,210,230,.35)';rr(c,-1.05,-3.6+bob,1.35,0.8,0.08);c.fill();c.strokeStyle='rgba(220,240,255,.6)';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.9,-3.5+bob);c.lineTo(-0.6,-3.0+bob);c.stroke();}
      else{MK.cracks(c,-0.35,-3.2+bob,0.6,cn.seed,1);this.world.game.renderer.glowAdd(this.cx+this.face*cn.lx,this.bottom+cn.ly,1.2,'#ffe6a3',0.4*k);}}
    c.strokeStyle='#2a2a1c';c.lineWidth=0.06;c.beginPath();c.moveTo(-0.38,-3.6+bob);c.lineTo(-0.38,-2.8+bob);c.stroke();
    MK.lens(c,0.35,-3.85+bob,0.12,thr?'#ff3b22':'#ffcf7a',0.9);
    const bk=0.5+0.5*Math.sin(t*(thr?14:3));c.fillStyle=rgba('#ffb03a',0.4+0.6*bk);c.beginPath();c.arc(-0.6,-4.05+bob,0.09,PI,0);c.fill();
    this.world.game.renderer.glowAdd(this.cx-this.face*0.6,this.bottom-4.05+bob,0.8,'#ffb03a',0.35*bk);
    c.strokeStyle='#2a2a1c';c.lineWidth=0.03;c.beginPath();c.moveTo(0.1,-3.95+bob);c.lineTo(0.15,-4.6+bob);c.stroke();
    /* ---- барабан-рыхлитель: кожух, рычаги с гидравликой, зубья в земле ---- */
    const D=P.drum;
    if(this.has('drum')){MK.seg(c,1.5,-1.7+bob,D.x,D.y,0.34,'steel',{ribs:2});MK.piston(c,1.4,-1.2+bob,D.x-0.2,D.y+0.1,0.16,0.6);
      MK.piston(c,1.6,-2.2+bob,D.x+0.1,D.y-0.5,0.12,0.5);
      c.save();c.translate(D.x,D.y);c.fillStyle=MK.cylGrad(c,'iron',-0.7,0,0.7,0);c.beginPath();c.arc(0,0,0.64,0,TAU);c.fill();
      for(let i=0;i<10;i++){const a=this.drumA+i/10*TAU;c.save();c.rotate(a);c.fillStyle=MK.plateGrad(c,'steel',0.4,-0.08,0.5,0.16);
        c.beginPath();c.moveTo(0.45,-0.09);c.lineTo(0.98,-0.02);c.lineTo(0.94,0.07);c.lineTo(0.45,0.09);c.closePath();c.fill();
        c.fillStyle='#4a3a20';c.beginPath();c.arc(0.7,0.04,0.05,0,TAU);c.fill();c.restore();}
      MK.joint(c,0,0,0.24,'brass');
      c.fillStyle=MK.plateGrad(c,'olive',-1.1,-1.15,2.2,0.6);c.beginPath();c.arc(0,0,1.08,PI*1.08,PI*1.92);c.arc(0,0,0.86,PI*1.92,PI*1.08,true);c.closePath();c.fill();
      c.strokeStyle=MAT.olive.ed;c.lineWidth=0.03;c.stroke();for(let i=0;i<5;i++){const q=PI*1.15+i*0.17*PI;MK.bolt(c,Math.cos(q)*0.97,Math.sin(q)*0.97,0.03,'steel');}
      c.restore();}
    else MK.stump(c,1.6,-1.6+bob,0.24,0.3,this.node('drum').seed,t,'steel');
    /* ---- коса на суставчатой руке с гидравликой ---- */
    MK.box(c,-0.15,-3.75+bob,0.5,0.45,0.1,'iron',{bolts:0.03});
    MK.joint(c,P.sh.x,P.sh.y,0.26,'iron');
    if(this.has('scythe')){MK.seg(c,P.sh.x,P.sh.y,P.el.x,P.el.y,0.28,'olive',{ribs:3});
      MK.piston(c,P.sh.x+0.1,P.sh.y+0.2,(P.sh.x+P.el.x)/2,(P.sh.y+P.el.y)/2+0.12,0.09,0.6);
      MK.joint(c,P.el.x,P.el.y,0.2,'brass');
      MK.seg(c,P.el.x,P.el.y,P.tip.x,P.tip.y,0.16,'steel',{});
      const a=Math.atan2(P.tip.y-P.el.y,P.tip.x-P.el.x);c.save();c.translate(P.tip.x,P.tip.y);c.rotate(a);
      c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(0.9,-0.42,1.95,0.52);c.quadraticCurveTo(0.9,-0.04,0.05,0.24);c.closePath();
      c.fillStyle=MK.plateGrad(c,'steel',0,-0.4,1.9,0.9);c.fill();c.strokeStyle=MAT.steel.ed;c.lineWidth=0.03;c.stroke();
      c.strokeStyle='#f2f6f8';c.lineWidth=0.035;c.beginPath();c.moveTo(0.12,0.02);c.quadraticCurveTo(0.9,-0.38,1.88,0.46);c.stroke();
      MK.bolt(c,0.12,0.08,0.05,'brass');c.restore();}
    else MK.stump(c,P.sh.x+0.1,P.sh.y,0.18,P.sa,this.node('scythe').seed,t,'brass');
  }
  drawFX(c,t){
    /* след косы и искры барабана — поверх */
    const s=this.state,P=this.P;
    if((s==='low'||s==='high')&&this.st<0.25){c.save();c.globalCompositeOperation='lighter';const a=1-this.st/0.25;
      c.strokeStyle=rgba('#e8f6ff',0.6*a);c.lineWidth=0.18;c.beginPath();
      if(s==='low'){c.moveTo(-0.4,-0.6);c.quadraticCurveTo(3,-1.2,6.2,-0.5);}else{c.moveTo(-0.4,-1.9);c.quadraticCurveTo(3,-2.1,6.2,-1.35);}
      c.stroke();c.restore();}
  }
  partDebris(n){
    if(n.id==='drum')return {w:1.4,h:1.4,mass:2.4,mat:'steel',draw:(c,t)=>{c.fillStyle=MK.cylGrad(c,'iron',-0.6,0,0.6,0);c.beginPath();c.arc(0,0,0.6,0,TAU);c.fill();
      for(let i=0;i<8;i++){c.save();c.rotate(i/8*TAU);c.fillStyle='#8a9299';c.fillRect(0.45,-0.07,0.45,0.14);c.restore();}MK.joint(c,0,0,0.2,'brass');}};
    if(n.id==='scythe')return {w:2.4,h:0.8,mass:1.4,mat:'steel',draw:(c,t)=>{MK.seg(c,-1.1,0,0,0,0.14,'steel',{});c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(0.6,-0.3,1.3,0.35);c.quadraticCurveTo(0.6,-0.04,0.03,0.16);c.closePath();c.fillStyle='#aab3bb';c.fill();}};
    if(n.id==='tank')return {w:0.9,h:1.4,mass:1,mat:'glass',draw:(c,t)=>{c.fillStyle='rgba(120,160,60,.6)';rr(c,-0.4,-0.7,0.8,1.4,0.25);c.fill();MK.cracks(c,0,0,0.5,n.seed,1);}};
    return null;
  }
  corpseDebris(){return {w:4.6,h:2.2,mass:10,mat:'steel',draw:(c,t)=>{c.fillStyle='#1d1b17';rr(c,-2.4,0.1,4.8,0.9,0.4);c.fill();
    MK.box(c,-2.1,-1.0,3.8,1.2,0.3,'olive',{tex:'rust',texA:0.4});MK.box(c,-1.1,-1.8,1.6,0.9,0.15,'olive',{});
    for(let i=0;i<6;i++){c.fillStyle='#ffd83a';c.beginPath();c.arc(-1.8+i*0.7,-1.05,0.08,0,TAU);c.fill();}}};}
  spriteBounds(){return {x:this.cx-7.5,y:this.bottom-7.6,w:15,h:8.2};}
}
/* корчевание: вспучивание земли — снаряд-столб с предупреждением трещиной */
const _ubp=updateBossProjectile;
updateBossProjectile=function(W,pr,dt){
  if(pr.kind!=='erupt')return _ubp(W,pr,dt);
  const g=W.game,p=W.player;
  if(pr.delay>0){pr.delay-=dt;if(Math.random()<dt*20)g.particles.spawn({kind:'dust',x:pr.x+(Math.random()-0.5)*1.2,y:pr.fy,vx:0,vy:-1.5,life:0.4,size:0.08,col:'#6a5a3a',g:6});return false;}
  if(!pr.fired){pr.fired=true;pr.t=0;g.audio.nz(0.25,260,0.6,0.08,'lowpass');
    g.particles.burst(pr.x,pr.fy,18,{kind:'debris',col:'#5a4a30',spd:9,life:0.9,size:0.16,g:28,ang:-PI/2,spread:1.2});
    for(let i=0;i<3;i++)g.particles.spawn({kind:'leaf',x:pr.x,y:pr.fy-0.5,vx:(Math.random()-0.5)*4,vy:-6-Math.random()*4,life:1.4,size:0.14,col:'#4a3a20',rot:0,vr:6,drag:0.6,a:0.9});}
  pr.t+=dt;
  const hk=clamp(pr.t/0.12,0,1)*clamp((0.55-pr.t)/0.25,0,1),hh=pr.h*hk;
  if(!pr.hit&&hh>0.3&&p&&!p.dead&&p.x+p.w-0.1>pr.x-0.55&&p.x+0.1<pr.x+0.55&&p.bottom>pr.fy-hh+0.1&&p.y<pr.fy){if(p.hurtBy(pr.dmg,pr.x))pr.hit=true;}
  return pr.t>0.55;
};
const _dbf=drawBossFX;
drawBossFX=function(c,W,t){_dbf(c,W,t);
  for(const pr of W.projectiles){if(pr.kind!=='erupt')continue;
    if(pr.delay>0){const k=clamp(1-pr.delay/0.45,0,1);c.strokeStyle=rgba('#ff8a3a',0.3+0.6*k);c.lineWidth=0.07;c.beginPath();
      c.moveTo(pr.x-0.6,pr.fy-0.02);c.lineTo(pr.x-0.2,pr.fy-0.12*k);c.lineTo(pr.x+0.15,pr.fy-0.04);c.lineTo(pr.x+0.6,pr.fy-0.14*k);c.stroke();}
    else{const k=clamp(pr.t/0.12,0,1)*clamp((0.55-pr.t)/0.25,0,1),h=pr.h*k;
      c.fillStyle='#4a3a24';c.beginPath();c.moveTo(pr.x-0.75,pr.fy);c.lineTo(pr.x-0.35,pr.fy-h);c.lineTo(pr.x+0.1,pr.fy-h*0.85);c.lineTo(pr.x+0.45,pr.fy-h*0.95);c.lineTo(pr.x+0.75,pr.fy);c.closePath();c.fill();
      c.strokeStyle='#2a3a14';c.lineWidth=0.08;c.beginPath();c.moveTo(pr.x,pr.fy);c.quadraticCurveTo(pr.x+0.3,pr.fy-h*0.5,pr.x-0.1,pr.fy-h);c.stroke();}}
};
