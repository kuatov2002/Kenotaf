"use strict";
/* ============================== НАДСМОТРЩИК ==============================
   Крановщик Отстойника: гусеничная база, кабина с линзой-сенсором, две стрелы с крюками,
   за кабиной — топка-ядро под бронёй. Босс «раздевается» по узлам:
     РУКА (ближняя / дальняя) — привод локтя стрелы. Сломана → стрела падает, её размах исчезает,
                                удар крюками в пол — одним крюком;
     ГУСЕНИЦЫ — ведущая звезда. Сломаны → тарана нет, ползёт и медленно разворачивается;
     СЕНСОР — линза кабины. Разбита → захвата нет, бьёт вслепую, по шуму, широкими дугами;
     ЯДРО — топка за бронёй. Броня отваливается, когда сломаны две системы. Ядро разбито — конец.
   Прерывание: импульс в привод в момент, когда кольцо сомкнулось → стрела уходит в пол и
   застревает, 1.5 с босс открыт. Удар крюками в пол и таран в стену тоже открывают узлы.
   Грузы на тросах (импульс по тросу) падают на кабину — бьют ближайшую систему. */
class Overseer extends MechBoss{
  constructor(world,x,y){
    super(world,{type:'overseer',w:5.2,h:3.6,hp:999,mass:6,bodyMat:'iron',name:'НАДСМОТРЩИК'},x,y);
    this.addNode({id:'armR',hp:150,r:0.48,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'armL',hp:150,r:0.48,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'treads',hp:170,r:0.55,mat:'rubber',coreDmg:0,scrap:3});
    this.addNode({id:'sensor',hp:90,r:0.36,mat:'glass',coreDmg:0,scrap:2});
    this.addNode({id:'core',hp:220,r:0.6,mat:'copper',core:true,locked:true,scrap:8,stump:false});
    this.P={arms:{}};this.tread=0;this.lead='armR';this.stuckArm=null;this.cd=1.6;this.blindX=x;this.hitDone=false;
    this.face=-1;this.dormant=true;this.pose(0);
  }
  arm(id){return this.has(id);}
  armsLeft(){return (this.has('armR')?1:0)+(this.has('armL')?1:0);}
  attackUses(n){
    const s=this.state;
    if(s==='sweepWind'||s==='sweep')return n.id===this.lead;
    if(s==='slamWind')return n.id==='armR'||n.id==='armL';
    if(s==='chargeWind'||s==='charge')return n.id==='treads';
    if(s==='grabWind'||s==='grab')return n.id==='sensor';
    return false;
  }
  isWinding(){return /Wind$/.test(this.state);}
  cancelAttack(){super.cancelAttack();if(this.state!=='open'&&this.state!=='stuck'&&this.state!=='stunWall'){this.state='recover';this.st=0;}}
  threat(){if(super.threat())return true;return ['sweep','charge','grab','vent'].indexOf(this.state)>=0;}
  /* --- ИИ --- */
  ai(dt){
    const p=this.world.player,g=this.world.game,R=this.world.room;
    this.st+=dt;this.cd-=dt;
    const blind=!this.has('sensor'),treads=this.has('treads');
    /* вслепую — цель по шуму, с ошибкой, и обновляется редко */
    if(blind){if(Math.random()<dt*(p.noiseLevel>0.4?2.5:0.6))this.blindX=p.cx+(Math.random()-0.5)*4.5;}
    else this.blindX=p.cx;
    const tx=this.blindX,dd=Math.abs(tx-this.cx),want=tx>this.cx?1:-1;
    const des=this.nodes.find(n=>n.core&&!n.locked)?1.6:1;   /* ядро открыто — злее */
    switch(this.state){
      case 'idle':{
        if(want!==this.face){this.turnT+=dt;if(this.turnT>(treads?0.5:1.3)/des){this.face=want;this.turnT=0;}}else this.turnT=0;
        const spd=(treads?2.3:0.8)*des;
        this.vx=damp(this.vx,this.face===want?this.face*(dd>5.5?spd:(dd<2.6?-spd*0.4:0.35*spd)):0,3,dt);
        if(this.cd<=0&&this.face===want){
          const o=[];
          if(this.armsLeft()){if(dd<6.8)o.push(['sweep',3]);if(dd<5.5)o.push(['slam',this.armsLeft()===2?2.2:1.2]);}
          if(treads&&dd>4.5)o.push(['charge',2.2]);
          if(!blind&&this.armsLeft()&&dd>3.2&&dd<11)o.push(['grab',1.4]);
          if(!this.armsLeft()&&!treads)o.push(['vent',3]);
          if(!o.length)o.push(['vent',1]);
          let tot=o.reduce((a,b)=>a+b[1],0),r=Math.random()*tot,pick=o[0][0];
          for(const q of o){r-=q[1];if(r<=0){pick=q[0];break;}}
          this.begin(pick);
        }
        break;}
      case 'sweepWind':{const W=0.8/des;this.vx=damp(this.vx,0,6,dt);
        this.telegraph(this.node(this.lead),this.st/W,this.st>W-0.36);
        if(this.st>=W){this.state='sweep';this.st=0;this.hitDone=false;g.audio.melee();g.audio.heavy();g.camera.addShake(0.5);}
        break;}
      case 'sweep':{this.vx=damp(this.vx,this.face*3.2,3,dt);
        const reach=blind?7.2:6.0,hb={x:this.cx+(this.face>0?0:-reach),y:this.y-0.8,w:reach,h:this.h+1.0};
        if(!this.hitDone&&this.st>0.08&&this.st<0.3&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}
        if(this.st>0.1&&this.st<0.14)g.particles.burst(this.cx+this.face*4,this.bottom-0.4,20,{kind:'spark',col:'#ff9c4a',spd:9,life:0.5,size:0.07,add:true,g:22});
        if(this.st>0.45){this.state='recover';this.st=0;this.lead=this.lead==='armR'&&this.has('armL')?'armL':(this.has('armR')?'armR':'armL');}
        break;}
      case 'slamWind':{const W=0.95/des;this.vx=damp(this.vx,0,7,dt);
        const lead=this.node(this.has('armR')?'armR':'armL');this.telegraph(lead,this.st/W,this.st>W-0.36);
        if(this.st>=W)this.slam();
        break;}
      case 'stuck':{this.vx=damp(this.vx,0,12,dt);
        if(Math.random()<0.3)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*2,y:this.y+0.8,vx:0,vy:-2,life:0.8,size:0.3,grow:0.6,col:'#e8e0d0',drag:1});
        if(this.st>1.9){this.state='recover';this.st=0;this.cd=0.9/des;}
        break;}
      case 'chargeWind':{const W=1.1/des;this.vx=damp(this.vx,-this.face*1.0,4,dt);
        this.telegraph(this.node('treads'),this.st/W,this.st>W-0.4);
        if(Math.random()<0.6)g.particles.spawn({kind:'smoke',x:this.cx-this.face*2.4,y:this.bottom-0.4,vx:-this.face*2,vy:-1,life:1,size:0.5,grow:1,col:'#3a322a',drag:1});
        if(this.st>=W){this.state='charge';this.st=0;this.hitDone=false;g.audio.dash();}
        break;}
      case 'charge':{this.vx=this.face*12;
        if(!this.hitDone&&aabb(this.rect(),p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<0.6)g.particles.spawn({kind:'dust',x:this.cx-this.face*2.4,y:this.bottom,vx:-this.face*3,vy:-1.4,life:0.6,size:0.2,col:'#7a6c5c',g:4});
        if(this.wall!==0||this.x<=0.05||this.x+this.w>=R.w-0.05){
          g.audio.explosion();g.camera.addShake(1.3);g.hitstop(0.1);this.vx=0;
          g.particles.burst(this.cx+this.face*2.6,this.cy,30,{kind:'debris',col:'#6b5a44',spd:9,life:1,size:0.16,g:26});
          this.state='stunWall';this.st=0;
          for(const n of this.nodes)if(!n.broken&&!n.locked&&(n.id==='treads'||n.id==='sensor'))n.exT=Math.max(n.exT,1.9);}
        else if(this.st>3.5){this.state='recover';this.st=0;}
        break;}
      case 'stunWall':{this.vx=0;
        if(Math.random()<0.25)g.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*3,y:this.y-0.2,vx:0,vy:-1,life:0.5,size:0.05,col:'#ffe6a3',add:true});
        if(this.st>1.7){this.state='recover';this.st=0;this.cd=1.0/des;}
        break;}
      case 'grabWind':{const W=0.72/des;this.vx=damp(this.vx,0,6,dt);
        this.telegraph(this.node('sensor'),this.st/W,this.st>W-0.34);
        if(this.st>=W){this.state='grab';this.st=0;g.audio.elevator();}
        break;}
      case 'grab':{this.vx=damp(this.vx,0,6,dt);
        if(this.st<0.6&&!p.dead){const hx=this.cx+this.face*1.4,dx=hx-p.cx,dy=(this.cy-0.4)-p.cy,d=Math.hypot(dx,dy)||1;
          if(d<12){p.vx+=dx/d*26*dt;p.vy+=dy/d*18*dt;p.grabbed=0.1;
            g.particles.spawn({kind:'spark',x:p.cx+(Math.random()-0.5),y:p.cy,vx:dx/d*4,vy:dy/d*4,col:'#c8452f',life:0.25,size:0.05,add:true});}}
        else{this.lead=this.has('armR')?'armR':'armL';this.state='sweepWind';this.st=0.35;}
        break;}
      case 'ventWind':{const W=0.8;this.vx=damp(this.vx,0,6,dt);
        this.telegraph(this.node('core'),this.st/W,this.st>W-0.35);
        if(this.st>=W){this.state='vent';this.st=0;this.hitDone=false;g.audio.steamBurst();g.camera.addShake(0.6);}
        break;}
      case 'vent':{const hb={x:this.cx-4,y:this.y-1,w:8,h:this.h+1};
        if(!this.hitDone&&this.st>0.1&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<0.9)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*5,y:this.y+0.5,vx:(Math.random()-0.5)*8,vy:-3-Math.random()*4,life:0.8,size:0.6,grow:1.4,col:'#efe8dc',drag:1.2});
        if(this.st>0.7){this.state='recover';this.st=0;}
        break;}
      case 'recover':this.vx=damp(this.vx,0,8,dt);if(this.st>0.6){this.state='idle';this.st=0;this.cd=(0.7+Math.random()*0.6)/des;}break;
      default:this.state='idle';this.st=0;
    }
    this.phase=(this.state==='stuck'||this.state==='stunWall'||this.openT>0||this.nodes.some(n=>n.core&&!n.locked))?2:1;
  }
  begin(k){
    const g=this.world.game;this.st=0;this.hitDone=false;
    if(k==='sweep'){this.lead=this.has(this.lead)?this.lead:(this.has('armR')?'armR':'armL');this.state='sweepWind';}
    else if(k==='slam'){this.state='slamWind';}
    else if(k==='charge'){this.state='chargeWind';g.audio.elevator();}
    else if(k==='grab'){this.state='grabWind';}
    else{this.state='ventWind';}
  }
  /* удар крюками в пол: волны по полу, крюки застревают (стрелы открыты) */
  slam(){
    const g=this.world.game,p=this.world.player,ix=this.cx+this.face*2.9,two=this.armsLeft()===2;
    g.audio.explosion();g.camera.addShake(1.0);g.hitstop(0.06);
    if(aabb({x:ix-1.8,y:this.bottom-2.4,w:3.6,h:2.4},p.rect()))this.damagePlayer();
    for(const s of (two?[-1,1]:[this.face]))this.world.projectiles.push({x:ix+s*1.4,y:this.bottom-0.4,vx:s*8,vy:0,r:0.45,dmg:1,life:2.6,kind:'wave'});
    g.particles.burst(ix,this.bottom,30,{kind:'debris',col:'#8a7a6a',spd:8,life:0.9,size:0.14,g:30});
    this.state='stuck';this.st=0;this.stuckArm='both';
    for(const id of ['armR','armL'])if(this.has(id))this.node(id).exT=Math.max(this.node(id).exT,1.9);
  }
  /* --- последствия --- */
  onInterrupt(n){
    const g=this.world.game;
    if(n.id==='armR'||n.id==='armL'){this.stuckArm=n.id;g.audio.explosion();g.camera.addShake(0.8);
      g.particles.burst(this.cx+this.face*2.6,this.bottom,24,{kind:'debris',col:'#8a7a6a',spd:7,life:0.9,size:0.13,g:28});}
    else this.stuckArm=null;
  }
  onBreak(n,h){
    const g=this.world.game;
    if(n.core){super.onBreak(n,h);return;}
    if(n.id===this.lead)this.lead=n.id==='armR'?'armL':'armR';
    if(n.id==='sensor')this.blindX=this.cx;
    g.audio.bossRoar();
    const broken=this.nodes.filter(q=>!q.core&&q.broken).length,core=this.node('core');
    if(broken>=2&&core.locked){
      /* броня топки отваливается: ядро открыто */
      core.locked=false;core.exT=2.5;
      const W=this.world,bx=this.cx-this.face*1.5,by=this.bottom-2.0;
      for(let i=0;i<2;i++)W.addDebris({x:bx,y:by-0.4+i*0.8,w:0.9,h:0.5,vx:-this.face*(3+Math.random()*3),vy:-5-Math.random()*3,vr:(Math.random()-0.5)*10,
        mass:1.2,mat:'iron',hot:2,face:this.face,src:this,draw:(c)=>{MK.box(c,-0.45,-0.25,0.9,0.5,0.06,'iron',{tex:'rust',texA:0.4,bolts:0.04});Kit.hazardTape(c,-0.45,0.1,0.9,0.15);}});
      g.fx.breakNode(bx,by,'iron',false,true);
    }
  }
  /* груз упал на кабину: бьёт ближайшую систему, оглушает, вскрывает всё */
  weightHit(wt){
    const g=this.world.game,ix=wt.x,iy=this.y;
    let best=null,bd=1e9;
    for(const n of this.nodes){if(n.broken||n.locked)continue;const d=Math.hypot(n.wx-ix,(n.wy-iy)*0.5);if(d<bd){bd=d;best=n;}}
    if(best)this.hitNode(best,{kind:'weight',dmg:CFG.combat.weightDmg,hb:this.rect(),sx:best.wx,sy:best.wy,fromX:ix,dir:0,ky:0},true);
    if(this.dead)return;
    this.cancelAttack();this.state='stunWall';this.st=0;
    for(const n of this.nodes)if(!n.broken&&!n.locked)n.exT=Math.max(n.exT,2.0);
    g.particles.burst(ix,iy,40,{kind:'spark',col:'#ffb45a',spd:12,life:0.9,size:0.08,add:true,g:20});
  }
  onDeath(h){
    const W=this.world,P=this.P;
    /* кабина-рубка отлетает отдельно, линза гаснет */
    W.addDebris({x:this.cx+this.face*0.4,y:this.bottom-2.3,w:1.8,h:1.2,vx:-this.face*2+(Math.random()-0.5)*3,vy:-7,vr:this.face*3,mass:3,mat:'iron',hot:5,
      face:this.face,src:this,draw:(c,t)=>{MK.box(c,-0.9,-0.6,1.8,1.2,0.18,'iron',{tex:'rust',texA:0.4,seams:[0.5]});
        c.fillStyle='#0b0a09';c.beginPath();c.arc(0.45,-0.05,0.3,0,TAU);c.fill();MK.cracks(c,0.45,-0.05,0.3,77,1);}});
  }
  /* --- поза --- */
  armPose(id,s,k){
    /* a — угол стрелы от горизонтали вперёд (вниз +), b — сгиб локтя */
    const near=id==='armR',ph=this.t*1.3+(near?0:1.7);
    let a=-0.55+Math.sin(ph)*0.05,b=1.55;
    const lead=this.lead===id,wk=k;
    if(s==='sweepWind'&&lead){a=lerp(-0.55,-2.05,EZ.out(wk));b=lerp(1.55,0.5,wk);}
    else if(s==='sweep'&&lead){const q=clamp(this.st/0.3,0,1);a=lerp(-2.05,0.95,EZ.out(q));b=lerp(0.5,0.15,q);}
    else if(s==='slamWind'){a=lerp(-0.55,-2.15,EZ.out(wk));b=lerp(1.55,0.35,wk);}
    else if(s==='stuck'||(this.openT>0&&this.stuckArm===id)||(this.openT>0&&this.stuckArm==='both')){a=1.12;b=0.12;}
    else if(s==='chargeWind'||s==='charge'){a=-1.0;b=2.1;}
    else if((s==='grabWind'||s==='grab')&&near){a=lerp(-0.55,-0.08,EZ.out(wk));b=lerp(1.55,0.05,wk);}
    else if(s==='stunWall'||this.stunT>0){a=0.75+Math.sin(this.t*9+ph)*0.05;b=1.05;}
    else if(s==='ventWind'||s==='vent'){a=-1.3;b=1.9;}
    if(this.recoil>0)a+=this.recoil*0.15;
    return {a,b};
  }
  pose(dt){
    const P=this.P,s=this.state;
    const kmap={sweepWind:0.8,slamWind:0.95,chargeWind:1.1,grabWind:0.72,ventWind:0.8};
    const des=this.nodes.find(n=>n.core&&!n.locked)?1.6:1;
    const k=kmap[s]?clamp(this.st/(kmap[s]/des),0,1):0;
    this.tread+=this.vx*(dt||0)*1.4;
    P.bob=Math.sin(this.t*2.2)*0.03+(s==='charge'?Math.sin(this.t*30)*0.03:0);
    P.lean=(s==='chargeWind'?-0.05*k:0)+(s==='charge'?0.06:0)+(s==='sweep'?0.05:0)+(s==='stunWall'||this.stunT>0?0.08:0)+this.recoil*0.03;
    const shR={x:0.6,y:-2.15+P.bob},shL={x:-0.2,y:-2.78+P.bob};
    for(const id of ['armR','armL']){
      const sh=id==='armR'?shR:shL,q=this.armPose(id,s,k),L1=1.75,L2=1.3;
      const el={x:sh.x+Math.cos(q.a)*L1,y:sh.y+Math.sin(q.a)*L1};
      const hk={x:el.x+Math.cos(q.a+q.b)*L2,y:el.y+Math.sin(q.a+q.b)*L2};
      if(hk.y>0){hk.y=0;}   /* крюк не уходит под пол */
      P.arms[id]={sh,el,hk,a:q.a,b:q.b};
      const n=this.node(id);if(n){n.lx=el.x;n.ly=el.y;}
    }
    const tn=this.node('treads');tn.lx=1.95;tn.ly=-0.62;
    const sn=this.node('sensor');sn.lx=1.08;sn.ly=-2.38+P.bob;
    const cn=this.node('core');cn.lx=-1.45;cn.ly=-1.95+P.bob;
  }
  /* --- рисунок --- */
  draw(c,t){
    const P=this.P,s=this.state,bob=P.bob;
    c.save();c.rotate(P.lean);
    /* дальняя стрела — за корпусом */
    this.drawArm(c,'armL',t,true);
    /* топка-ядро за кабиной: броня или открытый жар */
    this.drawCore(c,t,bob);
    /* корпус: чугун, ржавчина, латунный кант, предупреждающая лента */
    MK.box(c,-1.55,-2.98+bob,2.95,1.86,0.28,'iron',{tex:'rust',texA:0.32,seams:[0.33,0.7]});
    c.save();rr(c,-1.55,-2.98+bob,2.95,1.86,0.28);c.clip();
    const vg=c.createLinearGradient(0,-2.98,0,-1.1);vg.addColorStop(0,'rgba(255,220,180,.18)');vg.addColorStop(0.25,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.4)');
    c.fillStyle=vg;c.fillRect(-1.6,-3.0+bob,3.1,1.9);c.restore();
    c.fillStyle=MK.cylGrad(c,'brass',0,-1.42+bob,0,-1.3+bob);c.fillRect(-1.55,-1.42+bob,2.95,0.1);
    Kit.hazardTape(c,-1.45,-1.32+bob,2.75,0.18);
    for(let i=0;i<9;i++)MK.bolt(c,-1.4+i*0.33,-2.86+bob,0.04,'steel');
    /* кабина: латунная рама, линза-сенсор (стекло) */
    MK.box(c,0.35,-2.92+bob,1.05,1.15,0.14,'brass',{bolts:0.035});
    c.fillStyle='#14171a';rr(c,0.45,-2.82+bob,0.85,0.95,0.1);c.fill();
    const sn=this.node('sensor'),lit=this.has('sensor');
    if(lit){const hot=s==='grabWind'||s==='grab';
      MK.lens(c,sn.lx,sn.ly,0.27,hot?'#ffe2a0':(this.threat()?'#ff3b22':'#ff6a3a'),hot?1:0.85,{rim:'steel'});
      this.world.game.renderer.glowAdd(this.cx+this.face*sn.lx,this.bottom+sn.ly,0.9,hot?'#ffcf7a':'#ff3b22',0.5);}
    else{c.fillStyle='#0b0d0f';c.beginPath();c.arc(sn.lx,sn.ly,0.27,0,TAU);c.fill();MK.cracks(c,sn.lx,sn.ly,0.3,sn.seed,1);
      MK.wires(c,sn.lx,sn.ly+0.1,PI/2,sn.seed,t,3);}
    /* крыша: труба с дымом, маяк */
    MK.cyl(c,-0.95,-3.62+bob,0.34,0.72,'iron',{bands:[[0.1,0.06,'brass']]});
    if(Math.random()<0.18){const g=this.world.game;g.particles.spawn({kind:'smoke',x:this.cx+this.face*(-0.78),y:this.bottom-3.65+bob,
      vx:-this.face*0.5,vy:-1.4,life:2,size:0.3,grow:0.9,col:'#2f2a24',drag:0.8,a:0.5});}
    const bk=0.5+0.5*Math.sin(t*(this.activated?6:1.5));
    c.fillStyle=rgba(this.activated?'#ff4a2a':'#5a3020',0.5+0.5*bk);c.beginPath();c.arc(-0.1,-3.08+bob,0.09,0,TAU);c.fill();
    if(this.activated)this.world.game.renderer.glowAdd(this.cx+this.face*-0.1,this.bottom-3.08+bob,0.5,'#ff4a2a',0.4*bk);
    /* гусеничная база */
    this.drawTreads(c,t);
    /* ближняя стрела — поверх */
    this.drawArm(c,'armR',t,false);
    c.restore();
  }
  drawCore(c,t,bob){
    const n=this.node('core');
    if(n.locked){
      /* броня топки: две плиты на болтах */
      MK.box(c,-1.95,-2.75+bob,0.62,1.5,0.1,'iron',{tex:'rust',texA:0.4,bolts:0.04});
      for(let i=0;i<4;i++){c.fillStyle='rgba(255,120,40,'+(0.25+0.15*Math.sin(t*4+i))+')';c.fillRect(-1.9,-2.5+i*0.32+bob,0.5,0.05);}
    }else if(!n.broken){
      const p=0.5+0.5*Math.sin(t*7);
      c.fillStyle='#120a05';rr(c,-2.0,-2.7+bob,0.75,1.45,0.14);c.fill();
      const g=c.createRadialGradient(n.lx,n.ly,0,n.lx,n.ly,0.75);g.addColorStop(0,'#fff2d0');g.addColorStop(0.35,rgba('#ffb45a',0.95));g.addColorStop(1,'rgba(160,50,10,.2)');
      c.fillStyle=g;c.beginPath();c.arc(n.lx,n.ly,0.5+0.05*p,0,TAU);c.fill();
      c.strokeStyle='#b08d3e';c.lineWidth=0.08;c.beginPath();c.arc(n.lx,n.ly,0.58,0,TAU);c.stroke();
      MK.cracks(c,n.lx,n.ly,0.6,n.seed,n.wear);
      this.world.game.renderer.glowAdd(this.cx+this.face*n.lx,this.bottom+n.ly,1.8,'#ffb45a',0.6+0.3*p);
    }
  }
  drawTreads(c,t){
    const tn=this.node('treads'),ok=!tn.broken;
    /* гусеница: резиновая лента-петля, траки бегут по фазе */
    c.fillStyle='#1d1b19';rr(c,-2.35,-1.12,4.7,1.12,0.5);c.fill();
    c.strokeStyle='#3a3530';c.lineWidth=0.08;rr(c,-2.35,-1.12,4.7,1.12,0.5);c.stroke();
    const ph=((this.tread%0.36)+0.36)%0.36;
    c.fillStyle='#4d4741';
    for(let x=-2.1+ph;x<2.1;x+=0.36){c.fillRect(x,-1.12,0.18,0.1);c.fillRect(x,-0.1,0.18,0.1);}
    for(const wx of [-1.55,-0.52,0.52,1.55]){MK.joint(c,wx,-0.56,0.36,'iron');
      c.save();c.translate(wx,-0.56);c.rotate(this.tread*1.6);c.strokeStyle='#2b2824';c.lineWidth=0.05;
      for(let i=0;i<3;i++){c.rotate(TAU/3);c.beginPath();c.moveTo(0,0);c.lineTo(0.3,0);c.stroke();}c.restore();}
    /* ведущая звезда (узел ГУСЕНИЦЫ) */
    if(ok){c.save();c.translate(tn.lx,tn.ly);c.rotate(this.tread*1.6);
      MK.joint(c,0,0,0.42,'brass');c.fillStyle='#6d5416';
      for(let i=0;i<8;i++){const a=i/8*TAU;c.save();c.rotate(a);c.fillRect(0.36,-0.06,0.14,0.12);c.restore();}
      c.restore();}
    else{MK.stump(c,tn.lx,tn.ly,0.3,0,tn.seed,t,'rubber');
      c.fillStyle='#1d1b19';c.save();c.translate(2.3,-0.1);c.rotate(0.6);c.fillRect(0,0,0.9,0.12);c.restore();}
    /* юбка */
    MK.box(c,-2.28,-1.3,4.56,0.32,0.08,'iron',{tex:'rust',texA:0.4});
    for(let i=0;i<10;i++)MK.bolt(c,-2.1+i*0.46,-1.14,0.035,'steel');
  }
  drawArm(c,id,t,far){
    const A=this.P.arms[id],n=this.node(id);if(!A)return;
    const sh=A.sh,el=A.el,hk=A.hk;
    /* плечо (поворотный узел на корпусе) */
    MK.joint(c,sh.x,sh.y,0.3,'iron');
    if(!n||n.broken){
      MK.stump(c,sh.x+Math.cos(A.a)*0.25,sh.y+Math.sin(A.a)*0.25,0.16,A.a,n?n.seed:5,t,'iron');
      if(far){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,6,5,.35)';c.fillRect(sh.x-0.6,sh.y-0.6,1.2,1.2);c.restore();}
      return;}
    /* стрела-ферма: два пояса + раскосы, латунные клёпки */
    c.save();c.translate(sh.x,sh.y);c.rotate(A.a);
    const L1=Math.hypot(el.x-sh.x,el.y-sh.y);
    MK.seg(c,0,-0.13,L1,-0.13,0.09,'iron',{});MK.seg(c,0,0.13,L1,0.13,0.09,'iron',{});
    c.strokeStyle='#4d4943';c.lineWidth=0.05;
    for(let x=0.1;x<L1-0.1;x+=0.3){c.beginPath();c.moveTo(x,-0.13);c.lineTo(x+0.15,0.13);c.lineTo(x+0.3,-0.13);c.stroke();}
    c.restore();
    /* привод локтя — узел РУКА: латунный цилиндр с поршнем */
    MK.piston(c,sh.x+Math.cos(A.a)*0.4,sh.y+Math.sin(A.a)*0.4,el.x,el.y,0.16,0.5);
    MK.joint(c,el.x,el.y,0.3,'brass');
    /* предплечье и крюк */
    MK.seg(c,el.x,el.y,hk.x,hk.y,0.17,'steel',{ribs:3});
    c.save();c.translate(hk.x,hk.y);c.rotate(A.a+A.b-PI/2);
    MK.joint(c,0,0,0.14,'steel');
    c.strokeStyle='#2b3035';c.lineWidth=0.2;c.lineCap='round';c.beginPath();c.moveTo(0,0.05);c.lineTo(0,0.35);
    c.arc(0.2,0.35,0.2,PI,PI*0.1,true);c.stroke();
    c.strokeStyle='#8a9299';c.lineWidth=0.08;c.beginPath();c.moveTo(-0.04,0.08);c.lineTo(-0.04,0.35);c.arc(0.2,0.35,0.24,PI,PI*0.1,true);c.stroke();
    c.restore();
    const hot=(this.state==='grabWind'||this.state==='grab')&&id==='armR';
    if(hot)this.world.game.renderer.glowAdd(this.cx+this.face*hk.x,this.bottom+hk.y,0.7,'#c8452f',0.5);
    if(far){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,6,5,.32)';
      c.fillRect(Math.min(sh.x,el.x,hk.x)-0.5,Math.min(sh.y,el.y,hk.y)-0.5,Math.abs(hk.x-sh.x)+Math.abs(el.x-sh.x)+1.2,4);c.restore();}
  }
  /* --- обломки --- */
  partDebris(n){
    const A=this.P.arms[n.id];
    if(A)return {w:1.6,h:0.5,mass:1.6,mat:'iron',draw:(c,t)=>{
      MK.seg(c,-0.8,-0.1,0.4,-0.1,0.09,'iron',{});MK.seg(c,-0.8,0.1,0.4,0.1,0.09,'iron',{});
      MK.joint(c,0.45,0,0.22,'brass');MK.seg(c,0.45,0,0.9,0.25,0.14,'steel',{});
      c.strokeStyle='#2b3035';c.lineWidth=0.16;c.lineCap='round';c.beginPath();c.arc(1.0,0.45,0.16,-PI/2,PI*0.6);c.stroke();
      MK.wires(c,-0.8,0,PI,n.seed,t,3);}};
    if(n.id==='sensor')return {w:0.5,h:0.5,mass:0.4,mat:'glass',draw:(c,t)=>{MK.joint(c,0,0,0.3,'steel');c.fillStyle='#0b0d0f';c.beginPath();c.arc(0,0,0.22,0,TAU);c.fill();MK.cracks(c,0,0,0.25,n.seed,1);}};
    if(n.id==='treads')return {w:0.8,h:0.8,mass:1.2,mat:'brass',flat:false,draw:(c,t)=>{MK.joint(c,0,0,0.38,'brass');c.fillStyle='#6d5416';
      for(let i=0;i<8;i++){c.save();c.rotate(i/8*TAU);c.fillRect(0.32,-0.05,0.12,0.1);c.restore();}}};
    return null;
  }
  corpseDebris(){
    return {w:4.4,h:1.6,mass:9,mat:'iron',draw:(c,t)=>{
      c.fillStyle='#1d1b19';rr(c,-2.2,-0.1,4.4,0.9,0.4);c.fill();
      for(const wx of [-1.4,-0.45,0.5,1.45])MK.joint(c,wx,0.35,0.3,'iron');
      MK.box(c,-1.5,-0.8,2.8,0.8,0.2,'iron',{tex:'rust',texA:0.45,seams:[0.4]});
      Kit.hazardTape(c,-1.4,-0.2,2.6,0.16);
      const fl=0.35+0.25*Math.sin(t*4);c.fillStyle='#120a05';rr(c,-1.3,-0.65,0.6,0.4,0.08);c.fill();
      c.fillStyle=rgba('#ff8a3a',fl);rr(c,-1.25,-0.6,0.5,0.3,0.06);c.fill();}};
  }
  spriteBounds(){return {x:this.cx-5.4,y:this.y-3.2,w:10.8,h:this.h+3.8};}
}
