"use strict";
/* ============================== РЕГУЛЯТОР ==============================
   Хранитель хода Печати: напольные часы на латунных ходулях. На груди — циферблат, под ним за
   стеклом качается маятник-сердце (ядро). Руки — стрелки: ЧАСОВАЯ (короткая, тяжёлая, молот),
   МИНУТНАЯ (длинный клинок). На спине — БАЛАНСИР, задающий темп. На макушке — колокольцы.
   Всё, что он делает, — в такт: тиканье слышно, удар всегда на долю.
     часовая — замах вверх, удар в пол, волны в обе стороны: перепрыгнуть волну;
     минутная — клинок обходит дугу перед ним сверху вниз: уйти за спину / рывок сквозь;
     бой — колокольцы, от груди расходятся кольца: рывок сквозь кольцо (неуязвим);
     шестерни — катит две шестерни по полу: импульс отбивает их ему же в ноги;
     (II) шаг-скольжение к курьеру и сразу минутная; (III) «полночь» — прессы зала бьют в такт.
   Балансир сломан — темп сбит: паузы длиннее, но ритм непредсказуем. Маятник открыт после двух поломок. */
class Regulator extends MechBoss{
  constructor(world,x,y){
    super(world,{type:'regulator',w:2.6,h:4.8,hp:999,mass:8,bodyMat:'brass',name:'РЕГУЛЯТОР'},x,y);
    this.addNode({id:'hour',hp:190,r:0.55,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'minute',hp:160,r:0.45,mat:'steel',coreDmg:0,scrap:4});
    this.addNode({id:'balance',hp:120,r:0.6,mat:'brass',backOnly:true,coreDmg:0,scrap:4});
    this.addNode({id:'core',hp:320,r:0.55,mat:'glass',core:true,locked:true,scrap:10,stump:false});
    this.face=-1;this.cd=1.4;this.beat=0;this.beatT=0;this.ha=-1.2;this.ma=-0.3;this.walk=0;this.bal=0;this.pend=0;
    this.camZoom=0.9;this.woke=false;this.turnT=0;this.P={};this.pose(0);
  }
  get coreX(){const n=this.node('core');return n?n.wx:this.cx;}
  get coreY(){const n=this.node('core');return n?n.wy:this.cy;}
  tempo(){const b=this.has('balance')?1:0.8+0.4*Math.abs(Math.sin(this.t*0.7));return b*(this.phase>=3?1.4:this.phase>=2?1.2:1)*(BossDyn.linking(this)?1.15:1);}
  /* связки по долям: молот → клинок, клинок → обратный клинок, скольжение → клинок, бой → шестерни */
  pickString(ad){const ph=this.phase,hr=this.has('hour'),mn=this.has('minute');const o=[];
    if(ad<5.5)o.push([['hour','minute'],hr&&mn?3:0],[['minute','hour'],hr&&mn?2:0],[['minute','minute'],mn?(ph>=2?2.2:1.2):0],
      [['hour','chime'],hr?1.4:0],[['hour','minute','hour'],hr&&mn&&ph>=3?2:0],[['chime'],hr||mn?0:2]);
    else o.push([['slide','minute'],mn&&ph>=2?2.6:0],[['chime','gear'],1.6],[['gear','slide'],mn&&ph>=2?1.6:0],[['gear'],1.2],
      [['march','hour'],hr?2:0],[['march','minute'],mn?2:0],[['chime','slide','minute'],mn&&ph>=3?1.8:0]);
    return BossDyn.pick(o)||['chime'];}
  begin(k){this.state=k+'Wind';this.st=0;this.hitDone=false;this.world.game.audio.hydraulic(0.7);}
  behind(px){return Math.sign(px-this.cx)===-this.face;}
  isWinding(){return /Wind$/.test(this.state);}
  attackUses(n){const s=this.state;
    if(s==='heelWind')return n.id==='balance';
    if(s==='hourWind')return n.id==='hour';if(s==='minuteWind'||s==='minute')return n.id==='minute';
    if(s==='chimeWind'||s==='gearWind')return n.id==='balance'||n.id==='core';return false;}
  cancelAttack(){super.cancelAttack();BossDyn.clear(this);if(['open','stunWall'].indexOf(this.state)<0){this.state='recover';this.st=0;}}
  threat(){if(super.threat())return true;return ['hour','minute','slide','heel','march'].indexOf(this.state)>=0;}
  ai(dt){
    const p=this.world.player,g=this.world.game,W=this.world,R=W.room;
    const tp=this.tempo();this.st+=dt;this.cd-=dt*tp;
    /* тиканье: доля = 0.5 с / темп */
    this.beatT+=dt*tp;if(this.beatT>=0.5){this.beatT-=0.5;this.beat++;g.audio.tone(this.beat%2?1180:980,0.05,'sine',0.02);
      if(this.phase>=3)this.midnightBeat();}
    if(!this.woke){this.woke=true;this.state='wake';this.st=0;}
    const dd=p.cx-this.cx,ad=Math.abs(dd),want=dd>0?1:-1;
    switch(this.state){
      case 'wake':this.vx=0;if(this.st>1.4){this.state='idle';this.st=0;this.cd=0.4;g.audio.bossRoar();for(let i=0;i<3;i++)W.later(i*180,()=>g.audio.tone(1568-i*200,0.6,'sine',0.04,0,g.audio.verb));}break;
      case 'idle':{
        /* за спиной: на долю — удар пяткой назад (балансир на спине — это и цель, и телеграф) */
        if(want!==this.face){this.turnT+=dt;
          if(this.turnT>0.45&&ad<3.2&&this.beatT<0.06){this.turnT=0;this.begin('heel');break;}
          if(this.turnT>0.45/tp){this.face=want;this.turnT=0;this.cd=Math.min(this.cd,0.05);g.audio.hydraulic(0.4);}}else this.turnT=0;
        /* шагает к курьеру, держит дистанцию клинка */
        this.vx=damp(this.vx,this.face===want?this.face*(ad>4.6?3.2*Math.min(tp,1.3):ad<2.2?-1.8:0):0,3.5,dt);
        /* атака начинается только на долю */
        if(this.cd<=0&&this.face===want&&this.beatT<0.06)this.begin(BossDyn.queue(this,this.pickString(ad)));
        break;}
      /* пятка: короткий удар назад ходулей */
      case 'heelWind':{const Wd=0.5/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('balance')&&this.has('balance')?this.node('balance'):this.node('core'),this.st/Wd,this.st>Wd-0.25);
        if(this.st>=Wd){this.state='heel';this.st=0;g.audio.mat('brass',1);g.camera.addShake(0.3);
          this.pose(0);if(this.geoHit(this.legSegs(1),p))this.damagePlayer(1,this.cx);}break;}   /* бьёт сама ходуля, выброшенная назад */
      case 'heel':this.vx=0;if(this.st>0.3){this.state='recover';this.st=0;}break;
      /* марш: три размашистых шага по долям к курьеру (стрелки на взводе) */
      /* марш — несрываемый: ходули на взводе, красное кольцо на корпусе; ответ — рывок сквозь */
      case 'marchWind':{const Wd=0.6/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('core'),this.st/Wd,this.st>Wd-0.3,true);
        if(this.st>=Wd){this.state='march';this.st=0;this.steps=0;}break;}
      case 'march':{const tgt=this.face*7.5;this.vx=damp(this.vx,tgt,6,dt);this.walk+=dt*8;
        if(this.beatT<dt*tp*1.01){this.steps++;g.audio.mat('brass',0.6);g.camera.addShake(0.2);}
        if(this.steps>=3||ad<3.4||this.wall!==0){this.vx*=0.3;this.state='recover';this.st=0.1;}break;}
      case 'roar':this.vx=0;if(this.st>1.0){this.state='idle';this.st=0;this.cd=0.1;}break;
      case 'overheat':this.vx=damp(this.vx,0,8,dt);
        if(Math.random()<dt*40)g.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*1.4,y:this.bottom-2-Math.random()*2,vx:(Math.random()-0.5)*3,vy:-2,life:0.5,size:0.04,col:'#ffe6a3',add:true,g:8});
        if(this.st>1.6){this.state='idle';this.st=0;this.cd=0.2;}break;
      case 'hourWind':{const Wd=0.95/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('hour'),this.st/Wd,this.st>Wd-0.36);
        if(this.st>=Wd){this.state='hour';this.st=0;const ix=this.cx+this.face*2.6;
          g.audio.explosion();g.audio.mat('brass',1);g.camera.addShake(0.8);g.hitstop(0.05);
          /* стрелка выстреливает телескопом и бьёт молотом в пол в тот же кадр, что и урон */
          this.ha=0.83;this.P.hx=1;this.pose(0);
          if(this.geoHit(this.handSegs(),p)||aabb({x:ix-1.0,y:this.bottom-0.8,w:2.0,h:0.8},p.rect()))this.damagePlayer();
          for(const s of [-1,1])W.projectiles.push({x:ix+s*1.3,y:this.bottom-0.4,vx:s*8.5,vy:0,r:0.45,dmg:1,life:2.6,kind:'wave'});
          g.particles.burst(ix,this.bottom,26,{kind:'debris',col:'#8a8478',spd:8,life:0.9,size:0.13,g:30});}
        break;}
      case 'hour':this.vx=0;if(this.st>0.45){this.state='recover';this.st=0;}break;
      case 'minuteWind':{const Wd=0.85/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('minute'),this.st/Wd,this.st>Wd-0.34);
        if(this.st>=Wd){this.state='minute';this.st=0;this.hitDone=false;g.audio.slash('side');g.audio.heavy();}
        break;}
      case 'minute':{this.vx=0;const k=clamp(this.st/0.32,0,1);this.ma=lerp(-2.4,0.75,EZ.io(k));
        /* честная дуга: клинок проходит угол; попадание — если курьер на этом угле и в длину клинка */
        if(!this.hitDone&&k<1){const sh=this.shoulder('minute'),L=5.2,px=(p.cx-sh.x)*this.face,py=p.cy-sh.y,pa=Math.atan2(py,px),pd=Math.hypot(px,py);
          if(pd>0.6&&pd<L+0.4&&Math.abs(angDiff(this.ma,pa))<0.22){this.hitDone=true;this.damagePlayer();}}
        if(this.st>0.6){this.state='recover';this.st=0;}
        break;}
      case 'chimeWind':{const Wd=0.8/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('balance'),this.st/Wd,this.st>Wd-0.3,true);
        if(this.st>=Wd){this.state='chime';this.st=0;const n=this.phase>=3?3:2,cy=this.bottom-3.6;
          for(let i=0;i<n;i++)W.later(i*520/tp,()=>{if(this.dead)return;BossFX.ring(W,this.cx,cy,{vr:7.5*Math.min(1.25,tp),rmax:16,band:0.55,col:'#ffe6a3'});
            g.audio.tone(1568-i*140,0.8,'sine',0.045,0,g.audio.verb);g.audio.tone(784,0.6,'sine',0.03);});}
        break;}
      case 'chime':this.vx=0;if(this.st>0.6+0.5*(this.phase>=3?2:1)){this.state='recover';this.st=0;}break;
      case 'gearWind':{const Wd=0.7/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('core').locked?this.node('balance'):this.node('core'),this.st/Wd,this.st>Wd-0.3);
        if(this.st>=Wd){this.state='gear';this.st=0;g.audio.mat('brass',1);
          const n=this.phase>=2?3:2;for(let i=0;i<n;i++)W.later(i*260,()=>{if(this.dead)return;BossFX.gear(W,this.cx+this.face*1.2,this.bottom-1.0,this.face,{spd:6+i*1.6,bounces:2,r:0.6});});}
        break;}
      case 'gear':this.vx=0;if(this.st>0.8){this.state='recover';this.st=0;}break;
      case 'slideWind':{const Wd=0.55/tp;this.vx=damp(this.vx,-this.face*1,6,dt);this.telegraph(this.node('minute'),this.st/Wd,this.st>Wd-0.25);
        if(this.st>=Wd){this.state='slide';this.st=0;g.audio.dash();}break;}
      case 'slide':{this.vx=this.face*14;const ad2=Math.abs(p.cx-this.cx);
        if(Math.random()<dt*60)g.particles.spawn({kind:'spark',x:this.cx,y:this.bottom,vx:-this.face*5,vy:-1,life:0.3,size:0.05,col:'#ffe6a3',add:true,g:10});
        if(ad2<3.4||this.wall!==0||this.st>0.9){this.vx=0;this.state='minuteWind';this.st=0.85/tp*0.45;}
        break;}
      case 'recover':{this.vx=damp(this.vx,0,7,dt);
        /* следующее звено — на ближайшую долю */
        if(BossDyn.more(this)){if(this.st>0.12&&this.beatT<0.06){this.face=p.cx>this.cx?1:-1;this.begin(BossDyn.next(this));}break;}
        if(this.st>0.4/tp){const n=this.qn||0;BossDyn.clear(this);
          if(this.phase>=3&&n>=3){this.state='overheat';this.st=0;g.audio.steamBurst();for(const q of this.nodes)if(!q.broken&&!q.locked)q.exT=Math.max(q.exT,1.6);break;}
          this.state='idle';this.st=0;this.cd=(0.25+Math.random()*0.35)*(this.has('balance')?1:1.3);}
        break;}
      default:this.state='idle';this.st=0;
    }
    const broken=this.nodes.filter(n=>!n.core&&n.broken).length,core=this.node('core');
    this.phase=!core.locked?3:(broken>=1||this.integrity()<0.72)?2:1;
    if(!this.dead&&BossDyn.phaseUp(this)){this.cancelAttack();this.state='roar';this.st=0;BossDyn.roar(this,g,'#f2e6c0');
      for(let i=0;i<4;i++)W.later(i*120,()=>g.audio.tone(1568-i*180,0.5,'sine',0.04,0,g.audio.verb));}
  }
  /* полночь: прессы зала падают в такт (каждая вторая доля — по очереди) */
  midnightBeat(){const R=this.world.room,pr=(R.hazards||[]).filter(h=>h.ctl==='reg');if(!pr.length)return;
    const i=Math.floor(this.beat/2)%pr.length;for(const h of pr){h.warn=false;h.active=false;h.t=h.t||0;}
    const h=pr[i];h.cycle=0;h.armT=0.5;this.world.later(500,()=>{h.fireT=0.5;});}
  shoulder(id){const P=this.P,s=id==='minute'?P.shM:P.shH;return {x:this.cx+this.face*s.x,y:this.bottom+s.y};}
  onInterrupt(n){const g=this.world.game;if(n.id==='hour'||n.id==='minute'){g.audio.mat('brass',1);this.ma=-0.3;}}
  onBreak(n,h){const g=this.world.game;
    if(n.core){super.onBreak(n,h);return;}
    g.audio.bossRoar();
    if(n.id==='balance'){g.audio.clatter('brass',1);for(let i=0;i<8;i++)W_spring(this.world,n.wx,n.wy);}
    const broken=this.nodes.filter(q=>!q.core&&q.broken).length,core=this.node('core');
    if(broken>=2&&core.locked){core.locked=false;core.exT=2.6;g.audio.mat('glass',1);
      g.particles.burst(core.wx,core.wy,30,{kind:'spark',col:'#dff4ff',spd:8,life:0.6,size:0.05,add:true,g:16});
      g.hud.say('СТЕКЛО КОРПУСА ЛОПНУЛО. МАЯТНИК ОТКРЫТ.','');}
  }
  /* прессы «полночи»: управление из ai, падение — по fireT */
  update(dt){super.update(dt);
    const R=this.world.room;for(const h of (R.hazards||[])){if(h.ctl!=='reg')continue;
      if(h.armT>0){h.armT-=dt;h.warn=true;}else h.warn=false;
      if(h.fireT>0){h.fireT-=dt;h.active=true;}else h.active=false;
      if(this.dead){h.active=false;h.warn=false;}}}
  /* честные попадания по геометрии детали: отрезки [ax,ay,bx,by,радиус] в своих координатах */
  geoHit(segs,p){const r=p.rect();
    for(const [ax,ay,bx,by,rad] of segs){const x0=this.cx+this.face*ax,y0=this.bottom+ay,x1=this.cx+this.face*bx,y1=this.bottom+by,n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/0.2));
      for(let i=0;i<=n;i++){const x=lerp(x0,x1,i/n),y=lerp(y0,y1,i/n),nx=clamp(x,r.x,r.x+r.w),ny=clamp(y,r.y,r.y+r.h);if(Math.hypot(nx-x,ny-y)<=rad)return true;}}
    return false;}
  legSegs(i){const L=this.P.legs[i];return [[L.hx,L.hy,L.kx,L.ky,0.22],[L.kx,L.ky,L.fx,L.fy,0.22],[L.fx,L.fy,L.fx,L.fy,0.34]];}
  handSegs(){const P=this.P,E=2.95*(P.hx||0),c=Math.cos(this.ha),s=Math.sin(this.ha),at=d=>[P.shH.x+c*d,P.shH.y+s*d];
    const a=at(0),h=at(1.78+E);return [[a[0],a[1],h[0],h[1],0.2],[h[0],h[1],h[0],h[1],0.55]];}
  pose(dt){
    const P=this.P,s=this.state,t=this.t;dt=dt||0;const tp=this.tempo();
    this.walk+=this.vx*this.face*dt*1.3;this.bal+=dt*tp*(this.has('balance')?6:2+3*Math.abs(Math.sin(t)));
    this.pend=Math.sin(t*2.2*tp)*0.35;
    const kw=W=>clamp(this.st/(W/tp),0,1);
    let ha=-1.4+Math.sin(t*1.3)*0.05,ma=this.state==='minute'?this.ma:-0.4+Math.sin(t*1.1)*0.05;
    if(s==='hourWind')ha=lerp(-1.4,-2.9,EZ.out(kw(0.95)));if(s==='hour')ha=0.83;
    if(s==='minuteWind'||s==='slide')ma=lerp(-0.4,-2.4,EZ.out(s==='slide'?1:kw(0.85)));
    if(s==='chimeWind'||s==='chime'){ha=-2.2;ma=-1.0;}
    if(this.openT>0){ha=-0.6+Math.sin(t*8)*0.1;ma=0.4;}
    this.ha=dt?damp(this.ha,ha,s==='hour'?40:10,dt):(s==='hour'?this.ha:ha);
    const hx=s==='hour'&&this.st<0.3?1:0;P.hx=dt?damp(P.hx||0,hx,hx?40:7,dt):(P.hx||0);   /* телескоп часовой стрелки */if(s!=='minute')this.ma=dt?damp(this.ma,ma,10,dt):ma;
    P.bob=Math.sin(this.walk)*0.05;P.hip=-2.2+P.bob;
    const legs=[];for(let i=0;i<2;i++){const q=this.walk+(i?PI:0),mv=Math.abs(this.vx)>0.3;
      let fx=(i?-0.45:0.45)+(mv?Math.sin(q)*0.4:0),fy=mv?-Math.max(0,Math.cos(q))*0.2:0;
      if(i===1&&s==='heelWind'){const k=kw(0.5);fx=lerp(fx,0.15,k);fy=lerp(fy,-0.75,k);}   /* ходуля поджата под корпус */
      if(i===1&&s==='heel'){fx=-1.95;fy=-0.45;}                                          /* и выброшена назад вдоль пола */
      const K=ik2(i?-0.35:0.35,P.hip,fx,fy,1.2,1.15,-1);legs.push({hx:i?-0.35:0.35,hy:P.hip,kx:K.kx,ky:K.ky,fx:K.fx,fy:K.fy});}
    P.legs=legs;
    P.shH={x:-0.95,y:-4.0+P.bob};P.shM={x:0.95,y:-4.0+P.bob};
    const hl=2.0+2.95*(P.hx||0);P.hourTip={x:P.shH.x+Math.cos(this.ha)*hl,y:P.shH.y+Math.sin(this.ha)*hl};
    P.minTip={x:P.shM.x+Math.cos(this.ma)*5.0,y:P.shM.y+Math.sin(this.ma)*5.0};if(P.minTip.y>-0.1)P.minTip.y=-0.1;
    const hn=this.node('hour');hn.lx=(P.shH.x+P.hourTip.x)/2;hn.ly=(P.shH.y+P.hourTip.y)/2;
    const mn=this.node('minute');mn.lx=P.shM.x+Math.cos(this.ma)*1.4;mn.ly=P.shM.y+Math.sin(this.ma)*1.4;
    const bn=this.node('balance');bn.lx=-1.1;bn.ly=-3.2+P.bob;
    const cn=this.node('core');cn.lx=0;cn.ly=-2.5+P.bob+Math.cos(this.pend)*0.2;
  }
  draw(c,t){
    const P=this.P,bob=P.bob,cn=this.node('core'),beat=this.beatT||0,thr=this.threat();
    const walnut=(x,y,w,h,r)=>{const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#24130a');g.addColorStop(0.3,'#5c341f');g.addColorStop(0.55,'#6e4028');g.addColorStop(1,'#1c0e07');
      c.fillStyle=g;rr(c,x,y,w,h,r);c.fill();c.save();rr(c,x,y,w,h,r);c.clip();c.globalAlpha=0.18;c.strokeStyle='#120804';c.lineWidth=0.02;
      for(let i=0;i<9;i++){c.beginPath();c.moveTo(x+w*(i/9),y);c.quadraticCurveTo(x+w*(i/9)+0.08,y+h/2,x+w*(i/9)-0.04,y+h);c.stroke();}c.restore();
      c.strokeStyle='#0e0603';c.lineWidth=0.035;rr(c,x,y,w,h,r);c.stroke();};
    const gear=(x,y,r,n,a,col)=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle=col;c.beginPath();
      for(let i=0;i<n*2;i++){const q=i/(n*2)*TAU,rr2=i%2?r:r*0.82;c.lineTo(Math.cos(q)*rr2,Math.sin(q)*rr2);}c.closePath();c.fill();
      c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(0,0,r*0.5,0,TAU);c.fill();c.fillStyle=col;for(let k=0;k<4;k++){c.save();c.rotate(k*PI/2);c.fillRect(-0.02,0,0.04,r*0.7);c.restore();}
      MK.joint(c,0,0,r*0.22,'steel');c.restore();};
    /* ходули: бедро латунь + голень сталь, поршень, пружина у колена, тяжёлый башмак */
    for(const [i,L] of P.legs.entries()){const far=i===1;
      MK.seg(c,L.hx,L.hy,L.kx,L.ky,far?0.32:0.38,far?'iron':'brass',{ribs:2});
      MK.piston(c,L.hx+(far?-0.12:0.12),L.hy+0.15,(L.kx+L.fx)/2,(L.ky+L.fy)/2-0.2,0.08,0.6);
      MK.seg(c,L.kx,L.ky,L.fx,L.fy-0.16,far?0.24:0.28,far?'iron':'steel',{});
      c.strokeStyle=far?'#5a4a2a':'#c9a227';c.lineWidth=0.04;c.beginPath();
      for(let k=0;k<6;k++){const u=k/5,x=lerp(L.kx,L.fx,u*0.4),y=lerp(L.ky,L.fy,u*0.4);c.lineTo(x+(k%2?0.1:-0.1),y);}c.stroke();
      MK.joint(c,L.kx,L.ky,0.22,far?'iron':'brass');
      c.fillStyle=far?'#17120c':'#2a2418';c.beginPath();c.moveTo(L.fx-0.42,L.fy);c.lineTo(L.fx-0.36,L.fy-0.22);c.lineTo(L.fx+0.3,L.fy-0.22);c.quadraticCurveTo(L.fx+0.55,L.fy-0.2,L.fx+0.5,L.fy);c.closePath();c.fill();
      MK.bolt(c,L.fx-0.2,L.fy-0.1,0.035,'brass');MK.bolt(c,L.fx+0.2,L.fy-0.1,0.035,'brass');}
    /* редуктор на поясе: шестерня вертится шагом */
    MK.box(c,-0.75,-2.45+bob,1.5,0.5,0.1,'brass',{tex:'rust',texA:0.2,bolts:0.035});
    gear(0,-2.2+bob,0.3,10,this.walk*0.6,'#8a6d2a');
    /* балансир на спине — в латунной клетке */
    if(this.has('balance')){c.save();c.translate(-1.1,-3.2+bob);
      c.strokeStyle='#6d5416';c.lineWidth=0.06;c.beginPath();c.arc(0,0,0.78,0,TAU);c.stroke();
      for(let i=0;i<6;i++){const q=i/6*TAU;c.beginPath();c.moveTo(Math.cos(q)*0.78,Math.sin(q)*0.78);c.lineTo(Math.cos(q)*0.9,Math.sin(q)*0.9);c.stroke();}
      c.rotate(Math.sin(this.bal)*2.4);
      c.strokeStyle='#e8c96a';c.lineWidth=0.11;c.beginPath();c.arc(0,0,0.62,0,TAU);c.stroke();
      for(let i=0;i<3;i++){c.save();c.rotate(i/3*TAU);c.fillStyle='#b08d3e';c.fillRect(0,-0.035,0.6,0.07);MK.bolt(c,0.62,0,0.05,'brass');c.restore();}
      c.strokeStyle='rgba(255,236,190,.7)';c.lineWidth=0.02;c.beginPath();for(let a=0;a<TAU*3;a+=0.2){const r=0.05+a*0.025;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.stroke();
      MK.joint(c,0,0,0.12,'steel');c.restore();}
    else MK.stump(c,-0.85,-3.2+bob,0.22,PI,this.node('balance').seed,t,'brass');
    /* корпус напольных часов: орех, пилястры, филёнка, латунные уголки */
    const by=bob;walnut(-1.18,-4.55+by,2.36,2.6,0.12);
    for(const sx of [-1,1]){const x=sx*1.02;c.fillStyle=MK.cylGrad(c,'brass',x-0.09,0,x+0.09,0);c.fillRect(x-0.08,-4.4+by,0.16,2.3);
      c.fillStyle='#e8c96a';c.fillRect(x-0.12,-4.45+by,0.24,0.08);c.fillRect(x-0.12,-2.15+by,0.24,0.08);}
    c.strokeStyle='rgba(232,201,106,.55)';c.lineWidth=0.03;rr(c,-0.78,-4.35+by,1.56,2.25,0.08);c.stroke();
    for(const [x,y,sx,sy] of [[-1.18,-4.55,1,1],[1.18,-4.55,-1,1],[-1.18,-1.95,1,-1],[1.18,-1.95,-1,-1]]){c.fillStyle='#c9a227';c.beginPath();c.moveTo(x,y+by);c.lineTo(x+sx*0.3,y+by);c.lineTo(x,y+by+sy*0.3);c.closePath();c.fill();}
    /* дверца маятника: латунная рама, стекло, ключ */
    c.fillStyle='#0b0806';rr(c,-0.55,-3.2+by,1.1,1.1,0.12);c.fill();
    if(!cn.broken){c.save();rr(c,-0.55,-3.2+by,1.1,1.1,0.12);c.clip();c.translate(0,-3.2+by);c.rotate(this.pend);
      c.strokeStyle='#8a6d2a';c.lineWidth=0.05;c.beginPath();c.moveTo(0,0);c.lineTo(0,0.8);c.stroke();
      const pg=c.createRadialGradient(-0.06,0.78,0,0,0.84,0.26);pg.addColorStop(0,'#fff6d8');pg.addColorStop(0.5,'#e8c96a');pg.addColorStop(1,'#6d5416');c.fillStyle=pg;c.beginPath();c.arc(0,0.86,0.23,0,TAU);c.fill();
      c.strokeStyle='rgba(255,246,216,.6)';c.lineWidth=0.02;c.beginPath();c.arc(0,0.86,0.16,0,TAU);c.stroke();c.restore();
      if(cn.locked){c.fillStyle='rgba(170,205,225,.25)';rr(c,-0.55,-3.2+by,1.1,1.1,0.12);c.fill();
        c.strokeStyle='rgba(235,248,255,.65)';c.lineWidth=0.025;c.beginPath();c.moveTo(-0.42,-3.1+by);c.lineTo(-0.12,-2.45+by);c.moveTo(-0.3,-3.12+by);c.lineTo(-0.15,-2.8+by);c.stroke();}
      else{MK.cracks(c,0,-2.65+by,0.55,cn.seed,1);this.world.game.renderer.glowAdd(this.cx+this.face*cn.lx,this.bottom+cn.ly,1.2,'#fff2c6',0.5);}}
    c.strokeStyle='#c9a227';c.lineWidth=0.07;rr(c,-0.55,-3.2+by,1.1,1.1,0.12);c.stroke();
    c.fillStyle='#c9a227';c.beginPath();c.arc(0.42,-2.65+by,0.05,0,TAU);c.fill();c.fillRect(0.405,-2.65+by,0.03,0.09);
    /* циферблат: латунный обод с болтами, римские риски, стрелки показывают свой «час» */
    c.fillStyle=MK.cylGrad(c,'brass',-0.82,-3.8+by,0.82,-3.8+by);c.beginPath();c.arc(0,-3.85+by,0.8,0,TAU);c.fill();
    for(let i=0;i<12;i++){const q=i/12*TAU;MK.bolt(c,Math.cos(q)*0.72,-3.85+by+Math.sin(q)*0.72,0.028,'steel');}
    SA.dial(c,0,-3.85+by,0.62,-PI/2+t*0.02,-PI/2+t*0.24,'#ece4cc');
    c.strokeStyle='#2a2418';c.lineWidth=0.025;for(let i=0;i<12;i++){const q=i/12*TAU,r1=i%3?0.5:0.44;c.beginPath();c.moveTo(Math.cos(q)*r1,-3.85+by+Math.sin(q)*r1);c.lineTo(Math.cos(q)*0.58,-3.85+by+Math.sin(q)*0.58);c.stroke();}
    /* фронтон: карниз, завитки, навершия; в центре — линза и колокола */
    c.fillStyle='#3a2012';rr(c,-1.35,-4.85+by,2.7,0.32,0.06);c.fill();c.fillStyle=MK.cylGrad(c,'brass',0,-4.86+by,0,-4.78+by);c.fillRect(-1.38,-4.88+by,2.76,0.08);
    for(const sx of [-1,1]){c.fillStyle='#4a2a16';c.beginPath();c.moveTo(sx*1.3,-4.85+by);c.quadraticCurveTo(sx*1.25,-5.5+by,sx*0.55,-5.35+by);c.quadraticCurveTo(sx*0.75,-5.0+by,sx*0.4,-4.85+by);c.closePath();c.fill();
      c.strokeStyle='#c9a227';c.lineWidth=0.03;c.stroke();
      c.fillStyle='#e8c96a';c.beginPath();c.arc(sx*1.32,-4.98+by,0.09,0,TAU);c.fill();c.fillRect(sx*1.32-0.03,-5.12+by,0.06,0.1);}
    c.fillStyle=MK.plateGrad(c,'brass',-0.42,-5.45+by,0.84,0.6);c.beginPath();c.arc(0,-4.85+by,0.42,PI,0);c.closePath();c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.03;c.stroke();
    MK.lens(c,0,-5.02+by,0.13,thr?'#ff3b22':'#ffcf7a',1);
    this.world.game.renderer.glowAdd(this.cx,this.bottom-5.02+by,0.8,thr?'#ff3b22':'#ffcf7a',0.4);
    /* колокола на стойке, молоточки бьют на долю */
    c.strokeStyle='#6d5416';c.lineWidth=0.05;c.beginPath();c.moveTo(-0.55,-5.3+by);c.lineTo(0,-5.85+by);c.lineTo(0.55,-5.3+by);c.stroke();
    for(const sx of [-0.42,0.42]){c.fillStyle=MK.cylGrad(c,'brass',sx-0.2,0,sx+0.2,0);c.beginPath();c.moveTo(sx-0.17,-5.38+by);c.quadraticCurveTo(sx,-5.78+by,sx+0.17,-5.38+by);c.lineTo(sx+0.22,-5.28+by);c.lineTo(sx-0.22,-5.28+by);c.closePath();c.fill();
      const ha=beat<0.08?0.5:-0.2;c.save();c.translate(sx*0.5,-5.6+by);c.rotate(sx>0?-ha:ha);c.strokeStyle='#2a2418';c.lineWidth=0.03;c.beginPath();c.moveTo(0,0);c.lineTo(sx*0.4,0.1);c.stroke();
      c.fillStyle='#2a2418';c.beginPath();c.arc(sx*0.42,0.1,0.05,0,TAU);c.fill();c.restore();}
    /* плечи: шестерни-втулки крутятся вместе со стрелками */
    gear(P.shH.x,P.shH.y,0.32,12,this.ha*1.5,'#b08d3e');gear(P.shM.x,P.shM.y,0.28,10,this.ma*1.5,'#8a8f94');
    /* часовая стрелка — молот с ажурной пикой */
    if(this.has('hour')){const a=this.ha;c.save();c.translate(P.shH.x,P.shH.y);c.rotate(a);
      c.fillStyle=MK.plateGrad(c,'brass',0,-0.14,2,0.28);c.beginPath();c.moveTo(-0.45,-0.07);c.lineTo(1.35,-0.11);c.lineTo(1.35,0.11);c.lineTo(-0.45,0.07);c.closePath();c.fill();
      c.beginPath();c.arc(-0.45,0,0.16,0,TAU);c.fill();
      const E=2.95*(P.hx||0);if(E>0.02){c.fillStyle=MK.plateGrad(c,'steel',0,-0.07,2,0.14);c.fillRect(1.2,-0.065,E+0.1,0.13);
        c.fillStyle='#3a2a14';for(let k=1;k<=3;k++)if(E*k/3>0.15)c.fillRect(1.2+E*k/3-0.04,-0.09,0.08,0.18);
        c.fillStyle=MK.plateGrad(c,'brass',0,-0.14,2,0.28);}
      c.save();c.translate(E,0);
      c.beginPath();c.moveTo(1.25,0);c.lineTo(1.75,-0.48);c.lineTo(2.3,0);c.lineTo(1.75,0.48);c.closePath();c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.035;c.stroke();
      c.fillStyle='#1a120a';c.beginPath();c.moveTo(1.55,0);c.lineTo(1.75,-0.2);c.lineTo(1.98,0);c.lineTo(1.75,0.2);c.closePath();c.fill();
      c.restore();c.fillStyle='rgba(255,246,216,.35)';c.fillRect(0,-0.1,1.3,0.03);c.restore();}
    else MK.stump(c,P.shH.x,P.shH.y,0.16,this.ha,this.node('hour').seed,t,'brass');
    /* минутная стрелка — длинный клинок с ажуром и противовесом */
    if(this.has('minute')){const a=this.ma;c.save();c.translate(P.shM.x,P.shM.y);c.rotate(a);
      c.fillStyle=MK.plateGrad(c,'steel',0,-0.08,5,0.16);c.beginPath();c.moveTo(-0.7,-0.06);c.lineTo(4.4,-0.06);c.lineTo(5.0,0);c.lineTo(4.4,0.06);c.lineTo(-0.7,0.06);c.closePath();c.fill();
      c.fillStyle=MK.cylGrad(c,'steel',-0.9,-0.2,-0.5,0.2);c.beginPath();c.arc(-0.72,0,0.17,0,TAU);c.fill();
      c.strokeStyle='#eef3f6';c.lineWidth=0.02;c.beginPath();c.moveTo(0.2,-0.045);c.lineTo(4.9,-0.008);c.stroke();
      c.fillStyle='#1c2024';for(const x of [1.2,2.0,2.8]){c.beginPath();c.ellipse(x,0,0.22,0.035,0,0,TAU);c.fill();}
      c.fillStyle='#8a6d2a';c.beginPath();c.arc(3.6,0,0.15,0,TAU);c.fill();c.fillStyle='#1c2024';c.beginPath();c.arc(3.6,0,0.07,0,TAU);c.fill();c.restore();}
    else MK.stump(c,P.shM.x,P.shM.y,0.14,this.ma,this.node('minute').seed,t,'steel');
  }
  drawFX(c,t){if(this.state==='minute'&&this.st<0.35){const P=this.P,a=1-this.st/0.35;c.save();c.globalCompositeOperation='lighter';
    c.strokeStyle=rgba('#e8f6ff',0.45*a);c.lineWidth=0.5;c.beginPath();c.arc(P.shM.x,P.shM.y,4.6,-2.4,this.ma);c.stroke();c.restore();}}
  partDebris(n){
    if(n.id==='hour')return {w:2.2,h:0.8,mass:1.6,mat:'brass',draw:(c,t)=>{c.fillStyle='#b08d3e';c.fillRect(-1,-0.1,1.4,0.2);c.beginPath();c.moveTo(0.3,0);c.lineTo(0.75,-0.4);c.lineTo(1.2,0);c.lineTo(0.75,0.4);c.closePath();c.fill();}};
    if(n.id==='minute')return {w:3.4,h:0.3,mass:1,mat:'steel',draw:(c,t)=>{c.fillStyle='#aab3bb';c.beginPath();c.moveTo(-1.7,-0.06);c.lineTo(1.4,-0.04);c.lineTo(1.7,0);c.lineTo(1.4,0.04);c.lineTo(-1.7,0.06);c.closePath();c.fill();}};
    if(n.id==='balance')return {w:1.2,h:1.2,mass:0.8,mat:'brass',draw:(c,t)=>{c.strokeStyle='#c9a227';c.lineWidth=0.1;c.beginPath();c.arc(0,0,0.55,0,TAU);c.stroke();}};
    return null;}
  corpseDebris(){return {w:2.2,h:2.2,mass:6,mat:'brass',draw:(c,t)=>{c.fillStyle='#3a2012';rr(c,-0.8,-1.1,1.6,2.2,0.15);c.fill();SA.dial(c,0,-0.6,0.5,1.2,2.4,'#c8c0a8');}};}
  spriteBounds(){return {x:this.cx-6.4,y:this.bottom-10.2,w:12.8,h:10.8};}
}
function W_spring(W,x,y){W.game.particles.spawn({kind:'debris',x,y,vx:(Math.random()-0.5)*8,vy:-3-Math.random()*5,g:26,life:1.2,size:0.08,col:'#c9a227',rot:Math.random()*6,vr:(Math.random()-0.5)*14,drag:0.3});}
