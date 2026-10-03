"use strict";
/* ============================== ЦЕНЗОР-ПРИМАРХ ==============================
   Глава Цензуры: огромный латунный страж. Литой корпус, смотровой купол с ПРОЖЕКТОРОМ,
   гидравлическая КЛЕШНЯ, на спине — БАЛЛОН давления и вторая рука со ШТАМПОМ «ИЗЪЯТО».
   Бой — в широком зале без колонн: прятаться не за что, только читать замахи.
   Узлы:  БРОНЯ (лоб: удар отскакивает) · КЛЕШНЯ · БАЛЛОН (спина) · ШТАМП (вторая рука) ·
          ПРОЖЕКТОР (стекло на куполе) · ЯДРО (топка за бронёй).
   Атаки:
     клешня в пол + волна — перепрыгнуть волну;      пар из баллона — конус вперёд: уйти за спину;
     штамп-прыжок — тень на полу, приземление штампом: клеймо горит на полу; рывок прочь;
     прожектор — луч обходит зал; попал в луч — по курьеру бьют капсулы с потолка (круги на полу);
     (II) таран в стену, сопла пола; (III) залп пломб — их можно отбить импульсом В ЯДРО, серии.
   Окна: импульс в спину рвёт вентиль баллона (раз в 12 с) — оглушение; прерывание любого замаха;
   таран в стену — оглушение. Поломки снимают атаки: без штампа нет прыжка, без прожектора — капсул. */
const PRI_S=1.25;
class Primarch extends MechBoss{
  constructor(world,x,y){
    super(world,{type:'primarch',w:4.0,h:4.25,hp:999,mass:8,bodyMat:'brass',name:'ЦЕНЗОР-ПРИМАРХ'},x,y);
    this.addNode({id:'armor',hp:230,r:0.68,mat:'iron',frontOnly:true,deflect:true,coreDmg:0,scrap:4});
    this.addNode({id:'claw',hp:250,r:0.6,mat:'brass',coreDmg:0,scrap:5});
    this.addNode({id:'tank',hp:120,r:0.55,mat:'steel',backOnly:true,coreDmg:0,scrap:4});
    this.addNode({id:'stamp',hp:190,r:0.6,mat:'iron',coreDmg:0,scrap:4});
    this.addNode({id:'lamp',hp:90,r:0.36,mat:'glass',coreDmg:0,scrap:2});
    this.addNode({id:'core',hp:400,r:0.6,mat:'copper',core:true,locked:true,scrap:10,stump:false});
    this.behindT=0;this.walk=0;this.jt=0;this.cd=1.6;this.stunHits=0;this.camZoom=0.92;this.woke=false;this.P={};
    this.popCd=0;this.beam=null;this.combo=0;this.leap=null;
    this.face=-1;this.pose(0);
  }
  /* звено связки замахивается на 20% быстрее; телеграф остаётся */
  des(){return (this.phase>=3?1.4:this.phase>=2?1.18:1)*(BossDyn.linking(this)?1.2:1);}
  /* связки: ближе — клешня и пар, средняя — прыжок со штампом и таран, далеко — догнать */
  pickString(ad){const ph=this.phase,cl=this.has('claw'),tk=this.has('tank'),st=this.has('stamp'),lp=this.has('lamp');
    const o=[];
    if(ad<4.8){o.push([['slam','breath'],cl&&tk?3:0],[['slam','slam'],cl?(ph>=2?2.4:1.4):0],[['breath','stomp'],tk?1.6:0],
      [['stomp','charge'],cl?0:2.2],[['slam','leap'],cl&&st&&ph>=2?1.6:0],[['slam','breath','slam'],cl&&tk&&ph>=3?2:0]);}
    else if(ad<10){o.push([['leap','slam'],st&&cl?2.6:0],[['leap','breath'],st&&tk?1.6:0],[['charge'],1.5],
      [['search','leap'],lp&&st&&ph>=2?1.6:0],[['seal','leap'],ph>=3&&st?2:0],[['charge','slam'],cl&&ph>=2?1.4:0]);}
    else o.push([['leap'],st?2.6:0],[['charge'],2],[['search','charge'],lp&&ph>=2?1.6:0],[['seal','leap'],ph>=3?1.8:0]);
    return BossDyn.pick(o)||['charge'];}
  begin(pick){const g=this.world.game;this.state=pick+'Wind';this.st=0;this.hitDone=false;
    if(pick==='slam')g.audio.hydraulic(1);else if(pick==='breath')g.audio.steam(0.6);else if(pick==='charge')g.audio.elevator();
    else if(pick==='leap'){g.audio.hydraulic(1);g.audio.steam(0.8);}else if(pick==='search')g.audio.tone(220,0.6,'sine',0.03,440);}
  behind(px){return Math.sign(px-this.cx)===-this.face;}
  safe(){return super.safe()||this.state==='stun';}
  threat(){if(super.threat())return true;return ['slam','breath','charge','leap','land'].indexOf(this.state)>=0;}
  isWinding(){return /Wind$/.test(this.state);}
  attackUses(n){const s=this.state;
    if(s==='slamWind')return n.id==='claw';if(s==='breathWind'||s==='breath')return n.id==='tank';
    if(s==='chargeWind'||s==='charge')return n.id==='armor';if(s==='leapWind')return n.id==='stamp';
    if(s==='searchWind'||s==='search')return n.id==='lamp';if(s==='sealWind')return n.id==='claw'||n.id==='core';return false;}
  cancelAttack(){super.cancelAttack();this.beam=null;BossDyn.clear(this);if(['open','stun','stunWall'].indexOf(this.state)<0){this.state='recover';this.st=0;}}
  /* импульс в спину срывает вентиль баллона — но не чаще раза в 12 с */
  applyPulse(p,dir,pw){
    if(this.activated&&this.behind(p.cx)&&this.has('tank')&&this.state!=='stun'&&this.popCd<=0&&this.state!=='leap'){this.popTank();return;}
    super.applyPulse(p,dir,pw);
  }
  popTank(){
    const g=this.world.game,tn=this.node('tank');
    this.cancelAttack();this.state='stun';this.st=0;this.vx=0;this.stunHits=0;this.popCd=12;
    tn.hp=Math.min(tn.hp,tn.max*0.45);tn.hitT=0.3;
    for(const n of this.nodes)if(!n.broken&&!n.locked)n.exT=Math.max(n.exT,1.8);
    g.audio.explosion();g.audio.steamBurst();g.camera.addShake(0.8);g.hitstop(0.1);g.tutorial.notify('ptank');
    g.particles.burst(tn.wx,tn.wy,40,{kind:'steam',col:'#e8e0d0',spd:6,life:1.6,size:0.6,grow:1.6,drag:1.6});
    g.particles.burst(tn.wx,tn.wy,20,{kind:'spark',col:'#ffd27a',spd:9,life:0.6,size:0.06,add:true,g:20});
  }
  /* в оглушении — два удара, потом стряхивает оцепенение паром */
  hitNode(n,h,behind){const r=super.hitNode(n,h,behind);
    if(!this.dead&&this.state==='stun'&&(r==='node'||r==='break')){this.stunHits++;if(this.stunHits>=2)this.shrug();}
    return r;}
  shrug(){const g=this.world.game,p=this.world.player;
    this.state='recover';this.st=0;this.stunHits=0;g.audio.bossRoar();g.camera.addShake(0.7);
    for(const n of this.nodes)n.exT=Math.min(n.exT,0.3);
    g.particles.burst(this.cx,this.cy,36,{kind:'steam',col:'#efe8dc',spd:9,life:0.9,size:0.5,grow:1.4,drag:1.6});
    if(Math.abs(p.cx-this.cx)<4.4&&Math.abs(p.cy-this.cy)<3.4){p.vx=Math.sign(p.cx-this.cx||1)*15;p.vy=-9;}}
  ai(dt){
    const p=this.world.player,g=this.world.game,W=this.world,R=W.room;
    this.st+=dt;this.cd-=dt;if(this.popCd>0)this.popCd-=dt;
    if(!this.woke){this.woke=true;this.state='wake';this.st=0;}
    const dd=p.cx-this.cx,ad=Math.abs(dd),des=this.des();
    /* сопла пола (фаза II+): красное предупреждение → пар */
    const vents=(R.hazards||[]).filter(h=>h.ctl==='primarch');
    if(this.phase>=2){this.jt+=dt;const per=this.phase>=3?3.0:3.8,cyc=this.jt%per;
      vents.forEach((h,i)=>{const off=this.phase>=3?(i%2)*per*0.5:0,c2=(cyc+off)%per;h.warn=c2>1.4&&c2<2.1;h.active=c2>=2.1&&c2<3.0;
        if(h.active&&Math.random()<dt*70)g.particles.spawn({kind:'steam',x:h.x+Math.random()*h.w,y:h.y+h.h,
          vx:(Math.random()-0.5)*1.4,vy:-9-Math.random()*5,life:0.9,size:0.5,grow:1.4,col:'#e8e0d0',drag:0.8});});}
    else for(const h of vents){h.warn=false;h.active=false;}
    switch(this.state){
      case 'wake':this.vx=0;if(this.st>1.0){this.state='idle';this.st=0;this.cd=0.6;g.audio.bossRoar();g.camera.addShake(0.6);}break;
      case 'idle':{
        /* разворот медленный (окно для баллона), но после разворота — сразу связка */
        if(this.behind(p.cx)){this.behindT+=dt;if(this.behindT>(this.phase>=3?0.38:this.phase>=2?0.48:0.7)){this.face=-this.face;this.behindT=0;this.cd=Math.min(this.cd,0.05);g.audio.hydraulic(0.6);}}
        else this.behindT=0;
        /* преследование: идёт на курьера, а не ждёт его */
        const spd=this.phase>=3?4.2:this.phase>=2?3.5:2.7;
        this.vx=damp(this.vx,this.behind(p.cx)?0:this.face*(ad>3.0?spd:0),3,dt);
        if(this.cd<=0&&!this.behind(p.cx))this.begin(BossDyn.queue(this,this.pickString(ad)));
        break;}
      /* рык: фаза сменилась — пар из всех швов, отброс, дальше другой ритм */
      case 'roar':this.vx=0;if(this.st>1.0){this.state='idle';this.st=0;this.cd=0.15;}break;
      /* перегрев после длинной связки (фаза III): стравливает пар, детали вскрыты */
      case 'overheat':this.vx=damp(this.vx,0,8,dt);
        if(Math.random()<dt*50)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*2.6,y:this.y+0.4,vx:(Math.random()-0.5)*2,vy:-3-Math.random()*2,life:0.9,size:0.45,grow:1,col:'#efe8dc',drag:1.2});
        if(this.st>1.5){this.state='idle';this.st=0;this.cd=0.2;}break;
      case 'slamWind':{const Wd=0.9/des;this.vx=damp(this.vx,0,7,dt);
        this.telegraph(this.node('claw'),this.st/Wd,this.st>Wd-0.36);
        if(this.st>=Wd){this.state='slam';this.st=0;g.audio.explosion();g.audio.mat('brass',1);g.camera.addShake(0.8);
          const hb={x:this.face>0?this.cx+0.4:this.cx-4.6,y:this.y-0.4,w:4.2,h:this.h+0.8};
          if(aabb(hb,p.rect()))this.damagePlayer();
          g.particles.burst(this.cx+this.face*3,this.bottom,26,{kind:'debris',col:'#8a7a6a',spd:8,life:0.9,size:0.14,g:30});
          W.projectiles.push({x:this.cx+this.face*2.6,y:this.bottom-0.4,vx:this.face*9,vy:0,r:0.45,dmg:1,life:2.6,kind:'wave'});
          if(this.phase>=3)W.projectiles.push({x:this.cx-this.face*1.6,y:this.bottom-0.4,vx:-this.face*9,vy:0,r:0.45,dmg:1,life:2.6,kind:'wave'});}
        break;}
      case 'slam':this.vx=0;if(this.st>0.25){
        /* (III) серия: после удара клешнёй — сразу пар */
        if(this.phase>=3&&this.combo<1&&this.has('tank')){this.combo++;this.state='breathWind';this.st=0.3;}else{this.combo=0;this.state='recover';this.st=0;}}break;
      case 'breathWind':{const Wd=0.75/des;this.vx=damp(this.vx,0,7,dt);
        this.telegraph(this.node('tank'),this.st/Wd,this.st>Wd-0.34);
        if(this.st>=Wd){this.state='breath';this.st=0;g.audio.steamBurst();}
        break;}
      case 'breath':{this.vx=0;
        const hb={x:this.face>0?this.cx+1:this.cx-7,y:this.y+0.2,w:6,h:2.4};
        if(!this.hitDone&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<dt*110)g.particles.spawn({kind:'steam',x:this.cx+this.face*1.4,y:this.y+0.9,vx:this.face*(9+Math.random()*4),
          vy:(Math.random()-0.5)*2,life:0.6,size:0.4,grow:1.4,col:'#efe8dc',drag:1.2});
        if(this.st>1.1){this.state='recover';this.st=0;}
        break;}
      /* штамп-прыжок: присел, тень на полу под курьером, прыжок, приземление штампом */
      case 'leapWind':{const Wd=0.85/des;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('stamp'),this.st/Wd,this.st>Wd-0.34);
        if(this.st>=Wd){const tx=clamp(p.cx,10.6,R.w-10.6);this.leap={x0:this.cx,tx:tx,t:0,T:0.8/Math.min(des,1.2)};this.state='leap';this.st=0;this.face=tx>this.cx?1:-1;
          g.audio.dash();g.audio.steamBurst();g.particles.burst(this.cx,this.bottom,24,{kind:'steam',col:'#efe8dc',spd:6,life:0.8,size:0.5,grow:1.2,drag:1.6});}
        break;}
      case 'leap':{const L=this.leap;L.t+=dt;const k=clamp(L.t/L.T,0,1);
        const nx=lerp(L.x0,L.tx,EZ.io(k));this.vx=0;this.x=nx-this.w/2;this.vy=0;this.y=18-this.h-Math.sin(k*PI)*7.5;
        if(k>=1){this.state='land';this.st=0;this.y=18-this.h;
          g.audio.explosion();g.audio.mat('iron',1);g.camera.addShake(1.0);g.hitstop(0.06);
          if(aabb({x:this.cx-2.6,y:this.bottom-3.6,w:5.2,h:3.6},p.rect()))this.damagePlayer();
          BossFX.zone(W,{kind:'brand',x:this.cx+this.face*1.6,y:18,r:1.6,life:2.6,arm:0.15,text:'ИЗЪЯТО'});
          for(const s of [-1,1])W.projectiles.push({x:this.cx+s*2.2,y:this.bottom-0.4,vx:s*8,vy:0,r:0.45,dmg:1,life:1.8,kind:'wave'});
          g.particles.burst(this.cx,this.bottom,40,{kind:'debris',col:'#8a7a6a',spd:10,life:1,size:0.15,g:28});}
        break;}
      case 'land':this.vx=0;if(this.st>(BossDyn.more(this)?0.35:0.6)){this.state='recover';this.st=0;}break;
      /* прожектор: луч обходит зал; задержался в луче — капсулы на голову */
      case 'searchWind':{const Wd=0.6;this.vx=0;this.telegraph(this.node('lamp'),this.st/Wd,this.st>Wd-0.3);
        if(this.st>=Wd){this.state='search';this.st=0;this.beam={a:-this.face,lock:0,fired:0};}
        break;}
      case 'search':{this.vx=0;const B=this.beam;if(!B){this.state='recover';break;}
        const T=2.6/Math.min(des,1.3),k=this.st/T,lx=this.node('lamp').wx,ly=this.node('lamp').wy;
        B.x=lerp(1,R.w-1,this.face>0?k:1-k);B.ly=ly;B.lx=lx;
        const inBeam=Math.abs(p.cx-B.x)<1.4;
        if(inBeam){B.lock+=dt;if(B.lock>0.35&&B.fired<(this.phase>=3?4:3)){B.lock=0;B.fired++;g.audio.tone(880,0.2,'square',0.02);
          BossFX.drop(W,clamp(p.cx+p.vx*0.4,2,R.w-2),{look:'capsule',r:0.45,rad:1.3,delay:0.65});}}
        else B.lock=Math.max(0,B.lock-dt);
        if(this.st>=T){this.beam=null;this.state='recover';this.st=0;}
        break;}
      case 'sealWind':{const Wd=0.8/des;this.vx=damp(this.vx,0,7,dt);this.telegraph(this.has('claw')?this.node('claw'):this.node('core'),this.st/Wd,this.st>Wd-0.32);
        if(this.st>=Wd){this.state='seal';this.st=0;const n=3,cx=this.cx+this.face*1.2,cy=this.bottom-2.6;
          for(let i=0;i<n;i++)BossFX.seal(W,cx,cy,p.cx+(i-1)*2.2,18-0.4,{T:0.9+i*0.12,rdmg:60});
          g.audio.mat('iron',1);g.audio.steam(0.6);}
        break;}
      case 'seal':this.vx=0;if(this.st>0.6){this.state='recover';this.st=0;}break;
      case 'chargeWind':{const Wd=0.7/des;this.vx=damp(this.vx,-this.face*0.8,6,dt);
        this.telegraph(this.node('armor')||this.node('core'),this.st/Wd,this.st>Wd-0.34);
        if(this.st>=Wd){this.state='charge';this.st=0;this.hitDone=false;g.audio.dash();}
        break;}
      case 'charge':{this.vx=this.face*11;
        if(!this.hitDone&&aabb(this.rect(),p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<dt*60)g.particles.spawn({kind:'dust',x:this.cx-this.face*1.4,y:this.bottom,vx:-this.face*3,vy:-1.4,life:0.6,size:0.2,col:'#7a6c5c',g:4});
        if(this.wall!==0||this.x<=0.05||this.x+this.w>=R.w-0.05){
          g.audio.explosion();g.camera.addShake(1.0);g.hitstop(0.1);this.vx=0;
          g.particles.burst(this.cx+this.face*1.6,this.cy,26,{kind:'debris',col:'#6b5a44',spd:9,life:1,size:0.16,g:26});
          this.state='stunWall';this.st=0;
          for(const n of this.nodes)if(!n.broken&&!n.locked&&(n.id==='armor'||n.id==='claw'||n.id==='stamp'))n.exT=Math.max(n.exT,1.6);}
        else if(this.st>5.5){this.state='recover';this.st=0;}
        break;}
      case 'stunWall':this.vx=0;if(this.st>1.4){this.state='recover';this.st=0;}break;
      case 'stompWind':{const Wd=0.6/des;this.vx=damp(this.vx,0,7,dt);
        this.telegraph(this.node('armor')||this.node('core'),this.st/Wd,this.st>Wd-0.3);
        if(this.st>=Wd){this.state='stomp';this.st=0;g.audio.explosion();g.camera.addShake(0.6);
          if(Math.abs(p.cx-this.cx)<3.4&&p.bottom>this.bottom-1.2)this.damagePlayer();
          g.particles.burst(this.cx,this.bottom,30,{kind:'dust',col:'#7a6c5c',spd:7,life:0.8,size:0.2,g:10});}
        break;}
      case 'stomp':if(this.st>0.3){this.state='recover';this.st=0;}break;
      case 'stun':
        this.vx=damp(this.vx,0,8,dt);
        if(Math.random()<dt*40)g.particles.spawn({kind:'steam',x:this.cx-this.face*1.4,y:this.cy-0.4,vx:-this.face*1.5,vy:-1.5,life:1.0,size:0.4,grow:0.8,col:'#cfc9b8',drag:1.2});
        if(this.st>1.7){this.state='recover';this.st=0;this.stunHits=0;}
        break;
      case 'recover':{this.vx=damp(this.vx,0,6,dt);
        /* связка: следующее звено после короткой сцепки; лицом к курьеру */
        if(BossDyn.more(this)){if(this.st>0.2){this.face=p.cx>this.cx?1:-1;this.begin(BossDyn.next(this));}break;}
        if(this.st>0.42/Math.min(des,1.2)){const n=this.qn||0;BossDyn.clear(this);
          if(this.phase>=3&&n>=3){this.state='overheat';this.st=0;g.audio.steamBurst();for(const q of this.nodes)if(!q.broken&&!q.locked)q.exT=Math.max(q.exT,1.5);break;}
          this.state='idle';this.st=0;this.cd=(0.3+Math.random()*0.35)/des;}
        break;}
      default:this.state='idle';this.st=0;
    }
    const core=this.node('core'),broken=this.nodes.filter(n=>!n.core&&n.broken).length;
    this.phase=(this.integrity()<0.38||(!core.locked&&broken>=3))?3:(!core.locked||this.integrity()<0.66||broken>=2)?2:1;
    if(this.state!=='leap'&&!this.dead&&BossDyn.phaseUp(this)){this.cancelAttack();this.state='roar';this.st=0;BossDyn.roar(this,g);}
  }
  physics(dt){if(this.state==='leap')return;super.physics(dt);}
  onBreak(n,h){
    const g=this.world.game;
    if(n.core){super.onBreak(n,h);return;}
    g.audio.bossRoar();
    if(n.id==='armor'){const c=this.node('core');c.locked=false;c.exT=Math.max(c.exT,2.6);g.audio.clatter('iron',1);}
    if(n.id==='tank'){g.audio.steamBurst();
      g.particles.burst(n.wx,n.wy,30,{kind:'steam',col:'#efe8dc',spd:7,life:1.2,size:0.5,grow:1.4,drag:1.5});}
    if(n.id==='lamp'){this.beam=null;g.audio.mat('glass',1);}
  }
  onInterrupt(n){
    const g=this.world.game;
    if(n.id==='claw'){g.audio.explosion();g.camera.addShake(0.6);
      g.particles.burst(this.cx+this.face*2.6,this.bottom,20,{kind:'debris',col:'#8a7a6a',spd:7,life:0.9,size:0.13,g:28});}
    if(n.id==='tank')g.audio.steam(1);
    if(n.id==='lamp')this.beam=null;
  }
  onDeath(h){
    const W=this.world,P=this.P,q0=P.R(0.1,-1.85),q={x:q0.x*PRI_S,y:q0.y*PRI_S};
    W.addDebris({x:this.cx+this.face*q.x,y:this.bottom+q.y,w:1.4,h:0.8,vx:-this.face*2+(Math.random()-0.5)*3,vy:-7,vr:this.face*3,mass:2,mat:'brass',hot:4,
      face:this.face,src:this,draw:(c,t)=>{c.beginPath();c.arc(0,0.3,0.7,PI,0);c.closePath();c.fillStyle=MK.plateGrad(c,'brass',-0.7,-0.4,1.4,0.7);c.fill();
        c.fillStyle='#1a1512';c.beginPath();c.arc(0,0.3,0.48,PI,0);c.closePath();c.fill();MK.cracks(c,0,0.05,0.4,51,1);}});
  }
  pose(dt){
    const P=this.P,s=this.state,t=this.t,des=this.des();
    const moving=Math.abs(this.vx)>0.3&&this.onGround;
    this.walk+=(dt||0)*this.vx*this.face*1.4;
    const k=(W)=>clamp(this.st/(W/des),0,1);
    const slamK=s==='slamWind'?k(0.9):0,slamS=s==='slam'?1:0,brK=s==='breathWind'?k(0.75):(s==='breath'?1:0);
    const chK=s==='chargeWind'?k(0.7):0,stun=s==='stun'||s==='stunWall'||this.openT>0;
    const lpK=s==='leapWind'?k(0.85):0,air=s==='leap';
    P.bob=moving?Math.abs(Math.sin(this.walk))*0.06:Math.sin(t*1.6)*0.02;
    P.lean=(-0.06*slamK+0.14*slamS)+(0.08*brK)+(0.14*chK+(s==='charge'?0.16:0))+(stun?0.16+Math.sin(t*6)*0.03:0)+this.recoil*0.04+(air?-0.1:0);
    P.hipY=-1.25+P.bob+lpK*0.35;
    const R=(x,y)=>({x:x*Math.cos(P.lean)-y*Math.sin(P.lean),y:P.hipY+x*Math.sin(P.lean)+y*Math.cos(P.lean)});P.R=R;
    let a=0.6,b=0.8;
    a=lerp(a,-1.6,EZ.out(slamK));b=lerp(b,0.35,slamK);
    if(slamS){a=1.0;b=0.3;}
    if(stun){a=1.25;b=0.5;}
    if(s==='charge'||s==='chargeWind'){a=0.1;b=0.5;}
    if(s==='sealWind'||s==='seal'){a=-0.9;b=-0.2;}
    if(moving&&!slamK&&!stun)a+=Math.sin(this.walk)*0.08;
    const sh=R(0.95,-1.45),el={x:sh.x+Math.cos(a)*1.1,y:sh.y+Math.sin(a)*1.1},hd={x:el.x+Math.cos(a+b)*1.0,y:el.y+Math.sin(a+b)*1.0};
    P.sh=sh;P.el=el;P.hand=hd;P.ca=a+b;P.open=slamK>0?slamK:(slamS?0.1:0.45);
    /* рука штампа: над спиной; на прыжке штамп опущен под корпус */
    let sa=-2.0+Math.sin(t*1.2)*0.06;if(s==='leapWind')sa=lerp(-2.0,-2.8,EZ.out(lpK));if(air||s==='land')sa=1.35;if(stun)sa=-1.4;
    const ssh=R(-0.7,-1.7);P.ssh=ssh;P.sa=dt?damp(P.sa===undefined?sa:P.sa,sa,air?20:8,dt):sa;
    P.stamp={x:ssh.x+Math.cos(P.sa)*1.7,y:ssh.y+Math.sin(P.sa)*1.7};
    const legs=[];for(let i=0;i<2;i++){const q=this.walk+(i?PI:0);
      const fx=(i?-0.5:0.55)+(moving?Math.sin(q)*0.3:0),fy=moving?-Math.max(0,Math.cos(q))*0.14:(air?-0.5:0);
      const K=ik2(i?-0.5:0.5,P.hipY,fx,fy,0.68,0.66,-1);legs.push({hx:i?-0.5:0.5,hy:P.hipY,kx:K.kx,ky:K.ky,fx:K.fx,fy:K.fy});}
    P.legs=legs;
    const an=this.node('armor');{const q=R(0.95,-0.9);an.lx=q.x;an.ly=q.y;}
    const cn=this.node('core');{const q=R(0.8,-0.9);cn.lx=q.x;cn.ly=q.y;}
    const tn=this.node('tank');{const q=R(-1.42,-1.0);tn.lx=q.x;tn.ly=q.y;}
    const kn=this.node('claw');kn.lx=(el.x+hd.x)/2;kn.ly=(el.y+hd.y)/2;
    const sn=this.node('stamp');sn.lx=P.stamp.x;sn.ly=P.stamp.y;
    const ln=this.node('lamp');{const q=R(0.12,-2.62);ln.lx=q.x;ln.ly=q.y;}
    /* масштаб 1.25: рисунок и узлы растут вместе (draw масштабирует холст) */
    for(const n of this.nodes){n.lx*=PRI_S;n.ly*=PRI_S;}
  }
  draw(c,t){
    c.scale(PRI_S,PRI_S);
    const P=this.P,s=this.state,stun=s==='stun'||s==='stunWall'||this.openT>0;
    /* рука штампа (за корпусом) */
    MK.joint(c,P.ssh.x,P.ssh.y,0.22,'iron');
    if(this.has('stamp')){MK.seg(c,P.ssh.x,P.ssh.y,P.stamp.x,P.stamp.y,0.26,'iron',{ribs:3});
      c.save();c.translate(P.stamp.x,P.stamp.y);c.rotate(P.sa+PI/2);
      MK.box(c,-0.62,-0.2,1.24,0.5,0.06,'iron',{tex:'rust',texA:0.3,bolts:0.04});
      c.fillStyle='#7a2a1c';c.fillRect(-0.56,0.3,1.12,0.16);
      c.save();c.scale(1,-1);c.fillStyle='rgba(255,180,120,.6)';c.font='600 0.16px Oswald';c.textAlign='center';c.fillText('ИЗЪЯТО',0,-0.34);c.restore();
      c.restore();}
    else MK.stump(c,P.ssh.x,P.ssh.y,0.18,P.sa,this.node('stamp').seed,t,'iron');
    for(const [i,L] of P.legs.entries()){const far=i===1;
      MK.seg(c,L.hx,L.hy,L.kx,L.ky,0.34,far?'iron':'brass',{});MK.seg(c,L.kx,L.ky,L.fx,L.fy-0.14,0.28,far?'iron':'steel',{});
      MK.piston(c,L.hx+(far?-0.1:0.1),L.hy+0.12,(L.kx+L.fx)/2,(L.ky+L.fy)/2-0.12,0.09,0.55);
      MK.joint(c,L.kx,L.ky,0.2,far?'iron':'brass');
      c.fillStyle=far?'#1c1810':'#2b2418';c.beginPath();c.moveTo(L.fx-0.42,L.fy);c.lineTo(L.fx-0.36,L.fy-0.26);c.lineTo(L.fx+0.32,L.fy-0.26);c.quadraticCurveTo(L.fx+0.56,L.fy-0.22,L.fx+0.52,L.fy);c.closePath();c.fill();
      MK.bolt(c,L.fx-0.18,L.fy-0.12,0.035,'brass');MK.bolt(c,L.fx+0.2,L.fy-0.12,0.035,'brass');}
    c.save();c.translate(0,P.hipY);c.rotate(P.lean);
    if(this.has('tank')){MK.cyl(c,-1.82,-1.85,0.8,1.6,'steel',{bands:[[0.12,0.07,'brass'],[0.82,0.07,'brass']]});
      Kit.gauge(c,-1.42,-1.1,0.16,stun?0.05:(s==='breathWind'?0.5+0.45*clamp(this.st/0.75,0,1):0.6+0.05*Math.sin(t*4)));
      c.fillStyle=this.popCd>0?'#5a3a30':'#c8452f';c.beginPath();c.arc(-1.42,-1.93,0.1,0,TAU);c.fill();}
    else{MK.stump(c,-1.2,-1.0,0.24,PI,this.node('tank').seed,t,'steel');
      if(Math.random()<0.2)this.world.game.particles.spawn({kind:'steam',x:this.cx-this.face*1.3,y:this.cy-0.5,vx:-this.face*0.8,vy:-1.4,life:1.1,size:0.36,grow:0.7,col:'#cfc9b8',drag:1.3});}
    for(const [x,h] of [[-1.0,1.05],[-0.62,0.8]]){MK.cyl(c,x,-1.8-h,0.24,h+0.3,'iron',{bands:[[0.1,0.05,'brass']]});
      c.fillStyle='#120e0a';c.beginPath();c.ellipse(x+0.12,-1.8-h,0.13,0.05,0,0,TAU);c.fill();
      for(let i=0;i<2;i++){const k=((t*0.7+i*0.5+x)%1+1)%1;c.fillStyle=rgba('#2a2622',0.32*(1-k));c.beginPath();c.arc(x+0.12-k*0.4,-1.95-h-k*1.1,0.1+k*0.3,0,TAU);c.fill();}}
    if(this.has('tank'))MK.hose(c,[[-1.42,-1.85],[-1.25,-2.05],[-0.95,-1.7]],0.08,'#2f2b28',{ribs:true});
    MK.box(c,-1.15,-1.8,2.25,1.9,0.42,'brass',{tex:'rust',texA:0.2,seams:[0.35,0.7]});
    c.save();rr(c,-1.15,-1.8,2.25,1.9,0.42);c.clip();
    for(let i=0;i<6;i++){const x=-1.0+i*0.38+((i*29)%5)*0.03,g=c.createLinearGradient(0,-1.7,0,-0.2);g.addColorStop(0,'rgba(80,40,16,0)');g.addColorStop(0.35,'rgba(80,40,16,.32)');g.addColorStop(1,'rgba(80,40,16,0)');
      c.fillStyle=g;c.fillRect(x,-1.7,0.05+((i*7)%3)*0.02,1.5);}
    for(let i=0;i<7;i++)MK.bolt(c,-0.98+i*0.33,-0.28,0.04,'steel');c.restore();
    c.save();rr(c,-1.15,-1.8,2.25,1.9,0.42);c.clip();
    const vg=c.createLinearGradient(0,-1.8,0,0.1);vg.addColorStop(0,'rgba(255,240,200,.25)');vg.addColorStop(0.3,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');
    c.fillStyle=vg;c.fillRect(-1.2,-1.8,2.4,1.92);c.restore();
    for(let i=0;i<6;i++)MK.bolt(c,-0.95+i*0.36,-1.66,0.05,'steel');
    c.fillStyle=MK.cylGrad(c,'iron',0,-0.12,0,0.0);c.fillRect(-1.15,-0.12,2.25,0.12);
    Kit.stencil(c,-1.0,-0.3,'ЦЕНЗУРА',0.2,'rgba(40,20,10,.5)',0.5);
    c.fillStyle='#15100a';rr(c,-0.55,-1.68,0.9,0.28,0.06);c.fill();
    c.strokeStyle='#8a6d2a';c.lineWidth=0.04;for(let i=0;i<6;i++){c.beginPath();c.moveTo(-0.48+i*0.15,-1.66);c.lineTo(-0.48+i*0.15,-1.42);c.stroke();}
    if(this.state==='breathWind'||this.state==='breath'){c.fillStyle=rgba('#ffd27a',0.5);rr(c,-0.55,-1.68,0.9,0.28,0.06);c.fill();}
    const cn=this.node('core');
    if(!cn.locked&&!cn.broken){const fl=0.6+0.3*Math.sin(t*8);
      c.fillStyle='#120a05';rr(c,0.42,-1.28,0.76,0.76,0.1);c.fill();
      const gr=c.createRadialGradient(0.8,-0.9,0,0.8,-0.9,0.55);gr.addColorStop(0,rgba('#fff2d0',fl));gr.addColorStop(0.5,rgba('#ffb45a',0.85*fl));gr.addColorStop(1,'rgba(160,50,10,.25)');
      c.fillStyle=gr;rr(c,0.42,-1.28,0.76,0.76,0.1);c.fill();
      c.strokeStyle='#2b2418';c.lineWidth=0.04;for(let i=0;i<5;i++){c.beginPath();c.moveTo(0.48+i*0.15,-1.28);c.lineTo(0.48+i*0.15,-0.52);c.stroke();}
      this.world.game.renderer.glowAdd(this.cx+this.face*cn.lx,this.bottom+cn.ly,1.4,'#ffb45a',0.4*fl);}
    if(this.has('armor'))MK.box(c,0.36,-1.52,0.86,1.3,0.12,'iron',{tex:'rust',texA:0.45,bolts:0.06,seams:[0.5]});
    c.save();c.translate(0.12,-1.82);
    c.beginPath();c.arc(0,0,0.8,PI,0);c.closePath();c.fillStyle=MK.plateGrad(c,'brass',-0.8,-0.8,1.6,0.8);c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.04;c.stroke();
    const dg=c.createLinearGradient(-0.6,-0.7,0.4,0);dg.addColorStop(0,'#a9c4cf');dg.addColorStop(1,'#3d5560');
    c.fillStyle=dg;c.beginPath();c.arc(0,0,0.62,PI,0);c.closePath();c.fill();
    c.strokeStyle='#d8eef6';c.lineWidth=0.03;c.beginPath();c.arc(0,0,0.62,PI*1.1,PI*1.45);c.stroke();
    const eye=stun?'#69d68f':(this.threat()?'#ff3b22':'#c8452f'),bk=s==='breathWind'||s==='breath';
    MK.lens(c,0.18,-0.28,0.14,bk?'#ffd27a':eye,stun?0.4:1);
    /* прожектор на макушке купола */
    if(this.has('lamp')){c.fillStyle='#2b2418';rr(c,-0.28,-0.95,0.56,0.22,0.06);c.fill();
      const on=s==='search'||s==='searchWind';c.fillStyle=on?'#fff6d8':'#8aa4b0';c.beginPath();c.arc(0,-0.84,0.18,0,TAU);c.fill();
      c.strokeStyle='#c9a227';c.lineWidth=0.04;c.beginPath();c.arc(0,-0.84,0.2,0,TAU);c.stroke();}
    c.restore();
    c.restore();
    if(!stun)this.world.game.renderer.glowAdd(this.cx+this.face*(P.R(0.3,-2.1).x)*PRI_S,this.bottom+P.R(0.3,-2.1).y*PRI_S,0.8,bk?'#ffd27a':'#c8452f',0.4);
    MK.joint(c,P.sh.x,P.sh.y,0.26,'iron');
    c.save();c.translate(P.sh.x,P.sh.y);c.beginPath();c.arc(0,0.02,0.46,PI*1.05,PI*1.95);c.lineTo(0.38,0.12);c.lineTo(-0.38,0.12);c.closePath();
    c.fillStyle=MK.plateGrad(c,'brass',-0.46,-0.46,0.92,0.6);c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.03;c.stroke();
    for(const q of [-0.28,0,0.28])MK.bolt(c,q,-0.3+Math.abs(q)*0.3,0.035,'steel');c.restore();
    if(this.has('claw')){
      MK.seg(c,P.sh.x,P.sh.y,P.el.x,P.el.y,0.34,'brass',{ribs:3});
      MK.piston(c,P.sh.x+0.1,P.sh.y+0.22,P.el.x,P.el.y+0.14,0.16,0.5);
      MK.seg(c,P.el.x,P.el.y,P.hand.x,P.hand.y,0.28,'steel',{});
      MK.joint(c,P.el.x,P.el.y,0.2,'brass');
      c.save();c.translate(P.hand.x,P.hand.y);c.rotate(P.ca);
      const o=0.25+0.5*P.open;
      for(const sd of [-1,1]){c.save();c.rotate(sd*o);
        c.beginPath();c.moveTo(0,-0.08*sd);c.lineTo(0.72,-0.18*sd);c.lineTo(0.84,0.03*sd);c.lineTo(0.06,0.1*sd);c.closePath();
        c.fillStyle=MK.plateGrad(c,'brass',0,-0.18,0.84,0.28);c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.03;c.stroke();c.restore();}
      MK.joint(c,0,0,0.16,'steel');c.restore();}
    else MK.stump(c,P.sh.x+0.18,P.sh.y+0.08,0.16,0.6,this.node('claw').seed,t,'brass');
  }
  /* луч прожектора и тень прыжка — поверх (в мировых координатах) */
  drawOverlay(c,t){super.drawOverlay(c,t);if(this.dead)return;
    const B=this.beam,R=this.world.room;
    if(B&&B.x!==undefined){c.save();c.globalCompositeOperation='lighter';const fy=18;
      const g=c.createLinearGradient(B.lx,B.ly,B.x,fy);g.addColorStop(0,'rgba(255,246,214,.45)');g.addColorStop(1,'rgba(255,246,214,.12)');
      c.fillStyle=g;c.beginPath();c.moveTo(B.lx-0.15,B.ly);c.lineTo(B.lx+0.15,B.ly);c.lineTo(B.x+1.4,fy);c.lineTo(B.x-1.4,fy);c.closePath();c.fill();
      c.fillStyle=rgba('#fff6d8',0.3+0.4*Math.min(1,B.lock/0.35));c.beginPath();c.ellipse(B.x,fy-0.05,1.4,0.2,0,0,TAU);c.fill();c.restore();
      this.world.game.renderer.glowAdd(B.x,fy-0.5,1.8,'#fff6d8',0.4);}
    if(this.state==='leap'&&this.leap){const L=this.leap,k=clamp(L.t/L.T,0,1);
      c.fillStyle=rgba('#000',0.25+0.35*k);c.beginPath();c.ellipse(L.tx,18-0.05,1.2+1.4*k,0.22,0,0,TAU);c.fill();
      c.strokeStyle=rgba('#ff5a3a',0.4+0.5*k);c.lineWidth=0.07;c.beginPath();c.ellipse(L.tx,18-0.05,2.6,0.28,0,0,TAU);c.stroke();}
  }
  partDebris(n){
    if(n.id==='armor')return {w:0.86,h:1.3,mass:2,mat:'iron',draw:(c,t)=>{MK.box(c,-0.43,-0.65,0.86,1.3,0.12,'iron',{tex:'rust',texA:0.45,bolts:0.06});}};
    if(n.id==='claw')return {w:1.6,h:0.6,mass:2,mat:'brass',draw:(c,t)=>{MK.seg(c,-0.7,0,0.1,0,0.28,'steel',{});
      for(const sd of [-1,1]){c.save();c.translate(0.12,0);c.rotate(sd*0.4);c.beginPath();c.moveTo(0,-0.08*sd);c.lineTo(0.66,-0.16*sd);c.lineTo(0.76,0.03*sd);c.lineTo(0.06,0.1*sd);c.closePath();
        c.fillStyle=MK.plateGrad(c,'brass',0,-0.16,0.76,0.26);c.fill();c.restore();}MK.wires(c,-0.7,0,PI,n.seed,t,3);}};
    if(n.id==='tank')return {w:0.8,h:1.5,mass:1.2,mat:'steel',draw:(c,t)=>{MK.cyl(c,-0.4,-0.75,0.8,1.5,'steel',{bands:[[0.15,0.07,'brass']]});
      c.fillStyle='#0d0c0b';c.beginPath();c.moveTo(-0.4,0.05);c.lineTo(-0.1,-0.12);c.lineTo(0.15,0.08);c.lineTo(0.4,-0.06);c.lineTo(0.4,0.75);c.lineTo(-0.4,0.75);c.closePath();c.fill();}};
    if(n.id==='stamp')return {w:1.3,h:0.6,mass:1.6,mat:'iron',draw:(c,t)=>{MK.box(c,-0.62,-0.25,1.24,0.5,0.06,'iron',{bolts:0.04});c.fillStyle='#7a2a1c';c.fillRect(-0.56,0.2,1.12,0.12);}};
    if(n.id==='lamp')return {w:0.4,h:0.4,mass:0.3,mat:'glass',draw:(c,t)=>{c.fillStyle='#8aa4b0';c.beginPath();c.arc(0,0,0.18,0,TAU);c.fill();MK.cracks(c,0,0,0.2,n.seed,1);}};
    return null;
  }
  corpseDebris(){
    return {w:3.0,h:1.4,mass:7,mat:'brass',draw:(c,t)=>{
      MK.box(c,-1.4,-0.7,2.6,1.3,0.36,'brass',{tex:'rust',texA:0.3,seams:[0.4,0.7]});
      const fl=0.3+0.2*Math.sin(t*4);c.fillStyle='#120a05';rr(c,0.3,-0.4,0.66,0.6,0.08);c.fill();c.fillStyle=rgba('#ff8a3a',fl);rr(c,0.36,-0.34,0.54,0.48,0.06);c.fill();
      MK.seg(c,-1.2,0.5,-0.5,0.62,0.3,'iron',{});MK.seg(c,0.6,0.55,1.3,0.6,0.3,'iron',{});}};
  }
  spriteBounds(){return {x:this.cx-6.3,y:this.bottom-8,w:12.6,h:8.6};}
}
