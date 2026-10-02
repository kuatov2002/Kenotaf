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
  des(){return this.phase>=3?1.35:this.phase>=2?1.15:1;}
  behind(px){return Math.sign(px-this.cx)===-this.face;}
  isWinding(){return /Wind$/.test(this.state);}
  attackUses(n){const s=this.state;
    if(s==='lowWind'||s==='highWind'||s==='low'||s==='high')return n.id==='scythe';
    if(s==='tillWind'||s==='till'||s==='uprootWind')return n.id==='drum';
    if(s==='sprayWind')return n.id==='tank';return false;}
  cancelAttack(){super.cancelAttack();if(['open','stunWall','choke'].indexOf(this.state)<0){this.state='recover';this.st=0;}}
  threat(){if(super.threat())return true;return ['low','high','till','uproot','throw'].indexOf(this.state)>=0;}
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
        if(want!==this.face){this.turnT+=dt;if(this.turnT>(0.75/des)){this.face=want;this.turnT=0;g.audio.hydraulic(0.6);}}else this.turnT=0;
        const spd=1.7*des;this.vx=damp(this.vx,this.face===want?this.face*(ad>6?spd:ad<3.6?-spd*0.6:0.4*spd):0,2.4,dt);
        if(this.cd<=0&&this.face===want){
          const o=[],sc=this.has('scythe'),dr=this.has('drum'),tk=this.has('tank');
          if(sc&&ad<6.2){o.push(['low',2.2]);o.push(['high',2.2]);}
          if(dr&&ad>4.5)o.push(['till',2.4]);
          if(dr&&ad>3)o.push(['uproot',1.8]);
          if(tk&&ad<10)o.push(['spray',this.phase>=2?2:1.4]);
          if(this.phase>=2)o.push(['throw',1.6]);
          if(!o.length)o.push(['throw',1]);
          this.begin(BossFX.pick(o));}
        break;}
      case 'lowWind':case 'highWind':{const Wd=0.85/des,low=this.state==='lowWind';this.vx=damp(this.vx,0,7,dt);
        this.telegraph(this.node('scythe'),this.st/Wd,this.st>Wd-0.36);
        if(this.st>=Wd){this.state=low?'low':'high';this.st=0;this.hitDone=false;g.audio.heavy();g.audio.melee();g.camera.addShake(0.3);}
        break;}
      case 'low':case 'high':{this.vx=damp(this.vx,this.face*2.2,4,dt);
        const low=this.state==='low',hb={x:this.face>0?this.cx-0.5:this.cx-6.3,y:low?this.bottom-1.15:this.bottom-2.7,w:6.8,h:low?1.15:1.55};
        if(!this.hitDone&&this.st>0.05&&this.st<0.3&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}
        if(low&&this.st<0.25&&Math.random()<dt*60)g.particles.spawn({kind:'leaf',x:this.cx+this.face*(1+Math.random()*5),y:this.bottom-0.2,vx:this.face*4,vy:-3,life:1.2,size:0.14,col:'#6f9a4a',rot:Math.random()*6,vr:8,drag:0.8,a:0.9});
        if(this.st>0.45){
          /* серия: в фазе II после низа сразу верх (и наоборот) */
          if(this.phase>=2&&this.combo<1&&this.has('scythe')){this.combo++;this.state=low?'highWind':'lowWind';this.st=0.35;}
          else{this.combo=0;this.state='recover';this.st=0;}}
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
      case 'recover':this.vx=damp(this.vx,0,6,dt);if(this.st>0.65){this.state='idle';this.st=0;this.cd=(0.7+Math.random()*0.6)/des;}break;
      default:this.state='idle';this.st=0;
    }
    const broken=this.nodes.filter(n=>!n.core&&n.broken).length,core=this.node('core');
    this.phase=!core.locked?3:(broken>=1||this.integrity()<0.72)?2:1;
  }
  begin(k){const g=this.world.game;this.st=0;this.hitDone=false;
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
    else if(s==='high'){const k=clamp(this.st/0.2,0,1);sa=lerp(-2.9,-1.2,EZ.out(k));sb=lerp(0.4,-0.1,k);}
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
    const P=this.P,bob=P.bob,cn=this.node('core');
    /* гусеницы */
    c.fillStyle='#1d1b17';rr(c,-2.7,-1.05,5.1,1.05,0.5);c.fill();
    c.strokeStyle='#3a3630';c.lineWidth=0.06;for(let i=0;i<14;i++){const x=-2.5+((i*0.36+this.tread*0.6)%4.9+4.9)%4.9;c.beginPath();c.moveTo(x,-1.05);c.lineTo(x,-0.92);c.moveTo(x,-0.13);c.lineTo(x,0);c.stroke();}
    for(let i=0;i<6;i++)MK.joint(c,-2.1+i*0.86,-0.52,0.3,'iron');
    /* бак гербицида (корма): зелёное стекло, жидкость плещется */
    if(this.has('tank')){const tn=this.node('tank');
      c.fillStyle='#1a2a12';rr(c,-3.05,-3.0,0.95,2.05,0.3);c.fill();
      const lv=-1.2-1.4*clamp(tn.hp/tn.max,0.15,1)+Math.sin(t*3)*0.04;
      const lg=c.createLinearGradient(0,lv,0,-1.0);lg.addColorStop(0,'#c8e04a');lg.addColorStop(1,'#4a6a1a');c.fillStyle=lg;
      c.save();rr(c,-3.0,-2.95,0.85,1.95,0.28);c.clip();c.fillRect(-3.0,lv,0.85,3);c.restore();
      c.strokeStyle='rgba(220,255,200,.5)';c.lineWidth=0.04;rr(c,-3.0,-2.95,0.85,1.95,0.28);c.stroke();
      c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-2.9,-2.8,0.08,1.6);
      for(const y of [-2.7,-1.25]){c.fillStyle=MK.cylGrad(c,'brass',-3.08,0,-2.05,0);c.fillRect(-3.08,y,1.03,0.1);}
      MK.hose(c,[[-2.55,-3.0],[-2.2,-3.4],[-1.4,-3.2]],0.07,'#2f2b28',{ribs:true});}
    else MK.stump(c,-2.2,-1.9,0.3,PI,this.node('tank').seed,t,'glass');
    /* корпус: оливковая краска садовых машин, латунные полосы каталога */
    MK.box(c,-2.25,-2.75+bob,4.0,1.85,0.32,'olive',{tex:'rust',texA:0.25,seams:[0.33,0.66],bolts:0.05});
    c.fillStyle='rgba(255,246,214,.12)';c.fillRect(-2.1,-2.65+bob,3.7,0.05);
    for(let i=0;i<3;i++){c.fillStyle=MK.cylGrad(c,'brass',0,-1.4+bob,0,-1.3+bob);c.fillRect(-2.25,-1.45+bob-i*0.42,4.0,0.07);}
    Kit.stencil(c,-1.9,-1.05+bob,'ЭДЕМ · К-1',0.28,'rgba(232,224,190,.55)',0.55);
    /* кабина с барабаном каталога за стеклом */
    MK.box(c,-1.25,-3.75+bob,1.75,1.1,0.18,'olive',{bolts:0.04});
    c.fillStyle='#0d120a';rr(c,-1.05,-3.6+bob,1.35,0.8,0.08);c.fill();
    if(!cn.broken){const k=cn.locked?0.35:0.8+0.2*Math.sin(t*9);
      c.save();rr(c,-1.05,-3.6+bob,1.35,0.8,0.08);c.clip();
      c.fillStyle='#3a2a14';c.fillRect(-0.85,-3.45+bob,0.95,0.5);
      for(let i=0;i<8;i++){const y=-3.43+bob+((i*0.07+t*0.4)%0.5);c.fillStyle=rgba('#e8d8a8',0.6*k);c.fillRect(-0.8,y,0.85,0.025);}
      c.restore();
      if(cn.locked){c.fillStyle='rgba(160,210,230,.35)';rr(c,-1.05,-3.6+bob,1.35,0.8,0.08);c.fill();c.strokeStyle='rgba(220,240,255,.6)';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.9,-3.5+bob);c.lineTo(-0.6,-3.0+bob);c.stroke();}
      else{MK.cracks(c,-0.35,-3.2+bob,0.6,cn.seed,1);this.world.game.renderer.glowAdd(this.cx+this.face*cn.lx,this.bottom+cn.ly,1.2,'#ffe6a3',0.4*k);}}
    MK.lens(c,0.35,-3.85+bob,0.12,this.threat()?'#ff3b22':'#ffcf7a',0.9);
    /* барабан-рыхлитель на рычагах */
    const D=P.drum;
    if(this.has('drum')){MK.seg(c,1.5,-1.7+bob,D.x,D.y,0.3,'steel',{});MK.piston(c,1.4,-1.2+bob,D.x-0.2,D.y+0.1,0.14,0.6);
      c.save();c.translate(D.x,D.y);c.fillStyle=MK.cylGrad(c,'iron',-0.7,0,0.7,0);c.beginPath();c.arc(0,0,0.62,0,TAU);c.fill();
      for(let i=0;i<8;i++){const a=this.drumA+i/8*TAU;c.save();c.rotate(a);c.fillStyle=MK.plateGrad(c,'steel',0.4,-0.08,0.5,0.16);
        c.beginPath();c.moveTo(0.45,-0.08);c.lineTo(0.95,-0.02);c.lineTo(0.92,0.06);c.lineTo(0.45,0.08);c.closePath();c.fill();c.restore();}
      MK.joint(c,0,0,0.22,'brass');c.restore();}
    else MK.stump(c,1.6,-1.6+bob,0.24,0.3,this.node('drum').seed,t,'steel');
    /* коса */
    MK.joint(c,P.sh.x,P.sh.y,0.22,'iron');
    if(this.has('scythe')){MK.seg(c,P.sh.x,P.sh.y,P.el.x,P.el.y,0.24,'olive',{ribs:3});MK.joint(c,P.el.x,P.el.y,0.18,'brass');
      MK.seg(c,P.el.x,P.el.y,P.tip.x,P.tip.y,0.14,'steel',{});
      const a=Math.atan2(P.tip.y-P.el.y,P.tip.x-P.el.x);c.save();c.translate(P.tip.x,P.tip.y);c.rotate(a);
      c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(0.9,-0.4,1.9,0.5);c.quadraticCurveTo(0.9,-0.05,0.05,0.22);c.closePath();
      c.fillStyle=MK.plateGrad(c,'steel',0,-0.4,1.9,0.9);c.fill();c.strokeStyle='#e8eef2';c.lineWidth=0.03;c.beginPath();c.moveTo(0.1,0);c.quadraticCurveTo(0.9,-0.38,1.85,0.45);c.stroke();c.restore();}
    else MK.stump(c,P.sh.x+0.1,P.sh.y,0.18,P.sa,this.node('scythe').seed,t,'brass');
  }
  drawFX(c,t){
    /* след косы и искры барабана — поверх */
    const s=this.state,P=this.P;
    if((s==='low'||s==='high')&&this.st<0.25){c.save();c.globalCompositeOperation='lighter';const a=1-this.st/0.25;
      c.strokeStyle=rgba('#e8f6ff',0.6*a);c.lineWidth=0.18;c.beginPath();
      if(s==='low'){c.moveTo(-0.4,-0.6);c.quadraticCurveTo(3,-1.2,6.2,-0.5);}else{c.moveTo(-0.4,-2.6);c.quadraticCurveTo(3,-3.0,6.2,-2.0);}
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
  if(!pr.hit&&pr.t<0.3&&p&&!p.dead&&Math.abs(p.cx-pr.x)<pr.r+0.3&&p.bottom>pr.fy-pr.h&&p.y<pr.fy){if(p.hurtBy(pr.dmg,pr.x))pr.hit=true;}
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
