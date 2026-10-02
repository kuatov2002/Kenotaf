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
  tempo(){const b=this.has('balance')?1:0.8+0.4*Math.abs(Math.sin(this.t*0.7));return b*(this.phase>=3?1.4:this.phase>=2?1.2:1);}
  behind(px){return Math.sign(px-this.cx)===-this.face;}
  isWinding(){return /Wind$/.test(this.state);}
  attackUses(n){const s=this.state;
    if(s==='hourWind')return n.id==='hour';if(s==='minuteWind'||s==='minute')return n.id==='minute';
    if(s==='chimeWind'||s==='gearWind')return n.id==='balance'||n.id==='core';return false;}
  cancelAttack(){super.cancelAttack();if(['open','stunWall'].indexOf(this.state)<0){this.state='recover';this.st=0;}}
  threat(){if(super.threat())return true;return ['hour','minute','slide'].indexOf(this.state)>=0;}
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
        if(want!==this.face){this.turnT+=dt;if(this.turnT>0.5/tp){this.face=want;this.turnT=0;g.audio.hydraulic(0.4);}}else this.turnT=0;
        this.vx=damp(this.vx,this.face===want?this.face*(ad>5?2.4:ad<2.4?-1.6:0):0,3,dt);
        /* атака начинается только на долю */
        if(this.cd<=0&&this.face===want&&this.beatT<0.06){
          const o=[];
          if(this.has('hour')&&ad<5)o.push(['hour',2.4]);
          if(this.has('minute')&&ad<6.5)o.push(['minute',2.6]);
          o.push(['chime',ad>4?2.2:1.2]);
          o.push(['gear',ad>5?2:1]);
          if(this.phase>=2&&this.has('minute')&&ad>6)o.push(['slide',2.4]);
          this.state=BossFX.pick(o)+'Wind';this.st=0;this.hitDone=false;g.audio.hydraulic(0.7);}
        break;}
      case 'hourWind':{const Wd=0.95/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('hour'),this.st/Wd,this.st>Wd-0.36);
        if(this.st>=Wd){this.state='hour';this.st=0;const ix=this.cx+this.face*2.6;
          g.audio.explosion();g.audio.mat('brass',1);g.camera.addShake(0.8);g.hitstop(0.05);
          if(aabb({x:ix-1.4,y:this.bottom-2.6,w:2.8,h:2.6},p.rect()))this.damagePlayer();
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
      case 'chimeWind':{const Wd=0.8/tp;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('balance'),this.st/Wd,this.st>Wd-0.3);
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
      case 'recover':this.vx=damp(this.vx,0,7,dt);if(this.st>0.6/tp){this.state='idle';this.st=0;this.cd=(0.6+Math.random()*0.5)*(this.has('balance')?1:1.4);}break;
      default:this.state='idle';this.st=0;
    }
    const broken=this.nodes.filter(n=>!n.core&&n.broken).length,core=this.node('core');
    this.phase=!core.locked?3:(broken>=1||this.integrity()<0.72)?2:1;
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
  pose(dt){
    const P=this.P,s=this.state,t=this.t;dt=dt||0;const tp=this.tempo();
    this.walk+=this.vx*this.face*dt*1.3;this.bal+=dt*tp*(this.has('balance')?6:2+3*Math.abs(Math.sin(t)));
    this.pend=Math.sin(t*2.2*tp)*0.35;
    const kw=W=>clamp(this.st/(W/tp),0,1);
    let ha=-1.4+Math.sin(t*1.3)*0.05,ma=this.state==='minute'?this.ma:-0.4+Math.sin(t*1.1)*0.05;
    if(s==='hourWind')ha=lerp(-1.4,-2.9,EZ.out(kw(0.95)));if(s==='hour')ha=0.6;
    if(s==='minuteWind'||s==='slide')ma=lerp(-0.4,-2.4,EZ.out(s==='slide'?1:kw(0.85)));
    if(s==='chimeWind'||s==='chime'){ha=-2.2;ma=-1.0;}
    if(this.openT>0){ha=-0.6+Math.sin(t*8)*0.1;ma=0.4;}
    this.ha=dt?damp(this.ha,ha,s==='hour'?40:10,dt):ha;if(s!=='minute')this.ma=dt?damp(this.ma,ma,10,dt):ma;
    P.bob=Math.sin(this.walk)*0.05;P.hip=-2.2+P.bob;
    const legs=[];for(let i=0;i<2;i++){const q=this.walk+(i?PI:0),mv=Math.abs(this.vx)>0.3;
      const fx=(i?-0.45:0.45)+(mv?Math.sin(q)*0.4:0),fy=mv?-Math.max(0,Math.cos(q))*0.2:0;
      const K=ik2(i?-0.35:0.35,P.hip,fx,fy,1.2,1.15,-1);legs.push({hx:i?-0.35:0.35,hy:P.hip,kx:K.kx,ky:K.ky,fx:K.fx,fy:K.fy});}
    P.legs=legs;
    P.shH={x:-0.95,y:-4.0+P.bob};P.shM={x:0.95,y:-4.0+P.bob};
    P.hourTip={x:P.shH.x+Math.cos(this.ha)*2.0,y:P.shH.y+Math.sin(this.ha)*2.0};
    P.minTip={x:P.shM.x+Math.cos(this.ma)*5.0,y:P.shM.y+Math.sin(this.ma)*5.0};if(P.minTip.y>-0.1)P.minTip.y=-0.1;
    const hn=this.node('hour');hn.lx=(P.shH.x+P.hourTip.x)/2;hn.ly=(P.shH.y+P.hourTip.y)/2;
    const mn=this.node('minute');mn.lx=P.shM.x+Math.cos(this.ma)*1.4;mn.ly=P.shM.y+Math.sin(this.ma)*1.4;
    const bn=this.node('balance');bn.lx=-1.1;bn.ly=-3.2+P.bob;
    const cn=this.node('core');cn.lx=0;cn.ly=-2.5+P.bob+Math.cos(this.pend)*0.2;
  }
  draw(c,t){
    const P=this.P,bob=P.bob,cn=this.node('core');
    /* ходули */
    for(const [i,L] of P.legs.entries()){const far=i===1;MK.seg(c,L.hx,L.hy,L.kx,L.ky,0.2,far?'iron':'brass',{});MK.seg(c,L.kx,L.ky,L.fx,L.fy-0.1,0.16,far?'iron':'steel',{});
      MK.joint(c,L.kx,L.ky,0.14,'brass');c.fillStyle='#2a2418';rr(c,L.fx-0.3,L.fy-0.14,0.6,0.14,0.05);c.fill();}
    /* балансир на спине */
    if(this.has('balance')){c.save();c.translate(-1.1,-3.2+bob);c.rotate(Math.sin(this.bal)*2.4);
      c.strokeStyle='#c9a227';c.lineWidth=0.1;c.beginPath();c.arc(0,0,0.62,0,TAU);c.stroke();
      for(let i=0;i<3;i++){c.save();c.rotate(i/3*TAU);c.fillStyle='#8a6d2a';c.fillRect(0,-0.03,0.6,0.06);c.restore();}
      c.strokeStyle='rgba(255,236,190,.6)';c.lineWidth=0.02;c.beginPath();for(let a=0;a<TAU*3;a+=0.2){const r=0.05+a*0.025;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.stroke();
      MK.joint(c,0,0,0.12,'steel');c.restore();}
    else MK.stump(c,-0.8,-3.2+bob,0.2,PI,this.node('balance').seed,t,'brass');
    /* корпус напольных часов: тёмный орех, латунные накладки */
    const wg=c.createLinearGradient(-1,0,1,0);wg.addColorStop(0,'#2a160c');wg.addColorStop(0.35,'#5a3220');wg.addColorStop(0.7,'#3a2012');wg.addColorStop(1,'#1e0e08');
    c.fillStyle=wg;rr(c,-0.85,-4.4+bob,1.7,2.4,0.15);c.fill();c.strokeStyle='#120804';c.lineWidth=0.04;rr(c,-0.85,-4.4+bob,1.7,2.4,0.15);c.stroke();
    c.fillStyle=MK.cylGrad(c,'brass',0,-2.05+bob,0,-1.95+bob);c.fillRect(-0.9,-2.08+bob,1.8,0.1);
    /* окно маятника */
    c.fillStyle='#0c0a08';rr(c,-0.5,-3.1+bob,1.0,1.0,0.1);c.fill();
    if(!cn.broken){c.save();rr(c,-0.5,-3.1+bob,1.0,1.0,0.1);c.clip();c.translate(0,-3.1+bob);c.rotate(this.pend);
      c.strokeStyle='#8a6d2a';c.lineWidth=0.05;c.beginPath();c.moveTo(0,0);c.lineTo(0,0.75);c.stroke();
      const pg=c.createRadialGradient(-0.05,0.68,0,0,0.75,0.22);pg.addColorStop(0,'#fff2c6');pg.addColorStop(1,'#8a6d2a');c.fillStyle=pg;c.beginPath();c.arc(0,0.78,0.2,0,TAU);c.fill();c.restore();
      if(cn.locked){c.fillStyle='rgba(180,210,230,.28)';rr(c,-0.5,-3.1+bob,1.0,1.0,0.1);c.fill();}
      else{MK.cracks(c,0,-2.6+bob,0.5,cn.seed,1);this.world.game.renderer.glowAdd(this.cx+this.face*cn.lx,this.bottom+cn.ly,1.0,'#fff2c6',0.4);}}
    /* циферблат-грудь */
    SA.dial(c,0,-3.75+bob,0.6,-PI/2+t*0.02,-PI/2+t*0.24,'#e8e0c8');
    /* голова: купол, колокольцы, линза */
    c.fillStyle=MK.plateGrad(c,'brass',-0.5,-5.0+bob,1.0,0.6);c.beginPath();c.arc(0,-4.4+bob,0.5,PI,0);c.closePath();c.fill();
    for(const sx of [-0.35,0.35]){c.fillStyle='#c9a227';c.beginPath();c.moveTo(sx-0.14,-4.85+bob);c.quadraticCurveTo(sx,-5.15+bob,sx+0.14,-4.85+bob);c.lineTo(sx+0.18,-4.75+bob);c.lineTo(sx-0.18,-4.75+bob);c.closePath();c.fill();}
    MK.lens(c,0.18,-4.6+bob,0.1,this.threat()?'#ff3b22':'#ffcf7a',1);
    /* часовая стрелка — молот */
    MK.joint(c,P.shH.x,P.shH.y,0.2,'brass');
    if(this.has('hour')){const a=this.ha;c.save();c.translate(P.shH.x,P.shH.y);c.rotate(a);
      c.fillStyle=MK.plateGrad(c,'brass',0,-0.14,2,0.28);c.beginPath();c.moveTo(0,-0.1);c.lineTo(1.4,-0.12);c.lineTo(1.4,0.12);c.lineTo(0,0.1);c.closePath();c.fill();
      c.beginPath();c.moveTo(1.3,0);c.lineTo(1.75,-0.42);c.lineTo(2.2,0);c.lineTo(1.75,0.42);c.closePath();c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.03;c.stroke();c.restore();}
    else MK.stump(c,P.shH.x,P.shH.y,0.16,this.ha,this.node('hour').seed,t,'brass');
    /* минутная стрелка — длинный клинок */
    MK.joint(c,P.shM.x,P.shM.y,0.18,'steel');
    if(this.has('minute')){const a=this.ma;c.save();c.translate(P.shM.x,P.shM.y);c.rotate(a);
      c.fillStyle=MK.plateGrad(c,'steel',0,-0.08,5,0.16);c.beginPath();c.moveTo(0,-0.07);c.lineTo(4.4,-0.05);c.lineTo(5.0,0);c.lineTo(4.4,0.05);c.lineTo(0,0.07);c.closePath();c.fill();
      c.strokeStyle='#eef3f6';c.lineWidth=0.02;c.beginPath();c.moveTo(0.2,-0.05);c.lineTo(4.9,-0.01);c.stroke();
      c.fillStyle='#8a6d2a';c.beginPath();c.arc(3.6,0,0.14,0,TAU);c.fill();c.restore();}
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
