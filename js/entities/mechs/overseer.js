"use strict";
/* ============================== НАДСМОТРЩИК ==============================
   Гусеничный кран Отстойника. Силуэт: низкая гусеничная база; высокая оливковая кабина
   с одной линзой-сенсором; за ней — чугунный противовес с топкой (ядро) и две трубы;
   на поворотной башне — две стрелы-фермы с выдвижными предплечьями и крюками.
   Босс «раздевается» по узлам:
     РУКА (ближняя / дальняя) — гидропривод локтя. Сломан → предплечье с крюком отрывается,
                                ферма виснет плетью: её размах исчезает, удар в пол — одним крюком;
     ГУСЕНИЦЫ — ведущая звезда. Сломана → лента провисает, тарана нет, ползёт и медленно разворачивается;
     СЕНСОР — линза кабины. Разбита → прожектора и гарпуна нет, бьёт вслепую — по шуму, длинными размахами;
     ЯДРО — топка в противовесе, под бронёй. Броня отваливается, когда сломаны две системы.
   Честная геометрия: размах ранит там, где проходит стрела (капсулы фермы, предплечья, крюка);
   гарпун — крюк на тросе, от него уклоняются (рывок рвёт натянутый трос); удар в пол —
   крюки застревают ровно в точке удара. Прерывание: импульс в привод, когда кольцо сомкнулось →
   стрела уходит в пол и застревает. Грузы на тросах (импульс по тросу) падают на кабину. */
const OVS={L1:2.1,L2:1.45,EXT:1.05,shR:{x:1.6,y:-1.95},shL:{x:0.98,y:-2.32},piv:-1.35,lens:{x:0.42,y:-3.25},core:{x:-1.9,y:-2.28}};
class Overseer extends MechBoss{
  constructor(world,x,y){
    super(world,{type:'overseer',w:5.2,h:3.6,hp:999,mass:6,bodyMat:'iron',name:'НАДСМОТРЩИК'},x,y);
    this.addNode({id:'armR',hp:150,r:0.5,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'armL',hp:150,r:0.5,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'treads',hp:170,r:0.56,mat:'brass',coreDmg:0,scrap:3});
    this.addNode({id:'sensor',hp:90,r:0.38,mat:'glass',coreDmg:0,scrap:2});
    this.addNode({id:'core',hp:220,r:0.62,mat:'copper',core:true,locked:true,scrap:8,stump:false});
    this.P={arms:{},bob:0,lean:0,lens:0.15,scan:0};this.tread=0;this.lead='armR';this.stuckArm=null;this.cd=1.6;
    this.blindX=x;this.hitDone=false;this.harp=null;this.camZoom=1.12;this.woke=false;this.aimA=0;
    this.face=-1;this.pose(0);
  }
  armsLeft(){return (this.has('armR')?1:0)+(this.has('armL')?1:0);}
  /* ближняя стрела ведёт, если цела (гарпун — только у неё) */
  nearArm(){return this.has('armR')?'armR':(this.has('armL')?'armL':null);}
  attackUses(n){
    const s=this.state;
    if(s==='sweepWind'||s==='sweep')return n.id===this.lead;
    if(s==='slamWind')return n.id==='armR'||n.id==='armL';
    if(s==='chargeWind'||s==='charge')return n.id==='treads';
    if(s==='grabWind'||s==='grab')return n.id==='sensor';
    return false;
  }
  isWinding(){return /Wind$/.test(this.state);}
  cancelAttack(){super.cancelAttack();this.dropHarpoon();
    if(this.state!=='open'&&this.state!=='stuck'&&this.state!=='stunWall'){this.state='recover';this.st=0;}}
  threat(){if(super.threat())return true;return ['sweep','charge','grab','vent'].indexOf(this.state)>=0;}
  /* локальные координаты точки мира (x — вперёд по взгляду) */
  loc(x,y){return {x:(x-this.cx)*this.face,y:y-this.bottom};}
  /* крен верхней части вокруг оси на гусеницах */
  lp(x,y){const a=this.P.lean;if(!a)return {x,y};const c=Math.cos(a),s=Math.sin(a),dy=y-OVS.piv;return {x:x*c-dy*s,y:OVS.piv+x*s+dy*c};}
  wpt(q){const r=this.lp(q.x,q.y);return {x:this.cx+this.face*r.x,y:this.bottom+r.y};}
  /* --- ИИ --- */
  ai(dt){
    const p=this.world.player,g=this.world.game,R=this.world.room;
    this.st+=dt;this.cd-=dt;
    if(!this.woke){this.woke=true;this.state='wake';this.st=0;}
    const blind=!this.has('sensor'),treads=this.has('treads');
    /* вслепую — цель по шуму, с ошибкой, и обновляется редко */
    if(blind){if(Math.random()<dt*(p.noiseLevel>0.4?2.5:0.6))this.blindX=p.cx+(Math.random()-0.5)*4.5;}
    else this.blindX=p.cx;
    const tx=this.blindX,dd=Math.abs(tx-this.cx),want=tx>this.cx?1:-1;
    const des=this.des();
    switch(this.state){
      case 'wake':{this.vx=0;
        if(this.st>0.5&&!this.wk){this.wk=true;g.audio.steamBurst();g.audio.hydraulic(1);g.camera.addShake(0.5);
          for(let i=0;i<16;i++)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*4,y:this.bottom-1.3,vx:(Math.random()-0.5)*7,vy:-1-Math.random()*3,
            life:0.9,size:0.5,grow:1.2,col:'#e8e0d0',drag:1.4});}
        if(this.st>1.3){this.state='idle';this.st=0;this.cd=0.5;}
        break;}
      case 'idle':{
        if(want!==this.face){this.turnT+=dt;if(this.turnT>(treads?0.5:1.3)/des){this.face=want;this.turnT=0;g.audio.hydraulic(0.5);}}else this.turnT=0;
        const spd=(treads?2.3:0.8)*des;
        this.vx=damp(this.vx,this.face===want?this.face*(dd>5.5?spd:(dd<2.8?-spd*0.4:0.35*spd)):0,3,dt);
        if(this.cd<=0&&this.face===want){
          const o=[],arms=this.armsLeft();
          if(arms){if(dd<6.6)o.push(['sweep',3]);if(dd<5.2)o.push(['slam',arms===2?2.2:1.2]);}
          if(treads&&dd>4.5)o.push(['charge',2.2]);
          if(!blind&&this.has('armR')&&dd>3.2&&dd<10.5)o.push(['grab',1.5]);
          if(!arms&&!treads)o.push(['vent',3]);
          if(!o.length)o.push(['vent',1]);
          let tot=o.reduce((a,b)=>a+b[1],0),r=Math.random()*tot,pick=o[0][0];
          for(const q of o){r-=q[1];if(r<=0){pick=q[0];break;}}
          this.begin(pick);
        }
        break;}
      case 'sweepWind':{const W=0.8/des;this.vx=damp(this.vx,0,6,dt);
        this.telegraph(this.node(this.lead),this.st/W,this.st>W-0.36);
        if(this.st>=W){this.state='sweep';this.st=0;this.hitDone=false;this.sparked=false;g.audio.heavy();g.audio.melee();g.camera.addShake(0.35);}
        break;}
      case 'sweep':{this.vx=damp(this.vx,this.face*2.4,3,dt);
        if(!this.hitDone&&this.st>0.03&&this.st<0.34&&this.armHit(this.lead,p)){this.hitDone=true;this.damagePlayer();}
        const A=this.P.arms[this.lead];
        if(A&&!this.sparked&&this.st>0.12){const tp=this.wpt(A.tip);
          if(tp.y>this.bottom-0.9){this.sparked=true;g.camera.addShake(0.6);g.audio.mat('iron',1);
            g.particles.burst(tp.x,this.bottom-0.1,22,{kind:'spark',col:'#ff9c4a',spd:9,life:0.5,size:0.07,add:true,g:22});
            g.particles.burst(tp.x,this.bottom,12,{kind:'debris',col:'#8a7a6a',spd:6,life:0.8,size:0.12,g:28});}}
        if(this.st>0.5){this.state='recover';this.st=0;this.lead=this.lead==='armR'&&this.has('armL')?'armL':(this.has('armR')?'armR':'armL');}
        break;}
      case 'slamWind':{const W=0.95/des;this.vx=damp(this.vx,0,7,dt);
        const lead=this.node(this.has('armR')?'armR':'armL');this.telegraph(lead,this.st/W,this.st>W-0.36);
        if(this.st>=W)this.slam();
        break;}
      case 'stuck':{this.vx=damp(this.vx,0,12,dt);
        if(Math.random()<dt*30)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*2,y:this.bottom-2,vx:0,vy:-2,life:0.8,size:0.3,grow:0.6,col:'#e8e0d0',drag:1});
        if(this.st>1.5&&!this.pulling){this.pulling=true;g.audio.hydraulic(1);}
        if(this.st>1.9){this.state='recover';this.st=0;this.cd=0.9/des;this.stuckArm=null;
          const ix=this.cx+this.face*3.2;g.particles.burst(ix,this.bottom,16,{kind:'debris',col:'#8a7a6a',spd:5,life:0.8,size:0.12,g:28});}
        break;}
      case 'chargeWind':{const W=1.1/des;this.vx=damp(this.vx,-this.face*1.0,4,dt);
        this.telegraph(this.node('treads'),this.st/W,this.st>W-0.4);
        if(Math.random()<dt*70)g.particles.spawn({kind:'smoke',x:this.cx-this.face*2.4,y:this.bottom-0.4,vx:-this.face*2,vy:-1,life:1,size:0.5,grow:1,col:'#3a322a',drag:1});
        if(this.st>=W){this.state='charge';this.st=0;this.hitDone=false;g.audio.dash();}
        break;}
      case 'charge':{this.vx=this.face*12;
        if(!this.hitDone&&aabb(this.rect(),p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<dt*70)g.particles.spawn({kind:'dust',x:this.cx-this.face*2.4,y:this.bottom,vx:-this.face*3,vy:-1.4,life:0.6,size:0.2,col:'#7a6c5c',g:4});
        if(this.wall!==0||this.x<=0.05||this.x+this.w>=R.w-0.05){
          g.audio.explosion();g.camera.addShake(1.3);g.hitstop(0.1);this.vx=0;
          g.particles.burst(this.cx+this.face*2.6,this.cy,30,{kind:'debris',col:'#6b5a44',spd:9,life:1,size:0.16,g:26});
          this.state='stunWall';this.st=0;
          for(const n of this.nodes)if(!n.broken&&!n.locked&&(n.id==='treads'||n.id==='sensor'))n.exT=Math.max(n.exT,1.9);}
        else if(this.st>3.5){this.state='recover';this.st=0;}
        break;}
      case 'stunWall':{this.vx=0;
        if(Math.random()<dt*30)g.particles.spawn({kind:'spark',x:this.cx+(Math.random()-0.5)*3,y:this.y-0.2,vx:0,vy:-1,life:0.5,size:0.05,col:'#ffe6a3',add:true});
        if(this.st>1.7){this.state='recover';this.st=0;this.cd=1.0/des;}
        break;}
      case 'grabWind':{const W=0.72/des;this.vx=damp(this.vx,0,6,dt);
        const sh=this.lp(OVS.shR.x,OVS.shR.y),q=this.loc(p.cx,p.cy);
        this.aimA=damp(this.aimA,clamp(Math.atan2(q.y-sh.y,q.x-sh.x),-0.95,0.55),10,dt);
        this.telegraph(this.node('sensor'),this.st/W,this.st>W-0.34);
        if(this.st>=W)this.fireHarpoon(p);
        break;}
      case 'grab':this.updateHarpoon(dt,p);break;
      case 'ventWind':{const W=0.8;this.vx=damp(this.vx,0,6,dt);
        this.telegraph(this.node('core'),this.st/W,this.st>W-0.35);
        if(this.st>=W){this.state='vent';this.st=0;this.hitDone=false;g.audio.steamBurst();g.camera.addShake(0.6);
          /* пар бьёт из бортов в стороны, по всей высоте — облако там же, где урон */
          for(const s of [-1,1])for(const h of [0.6,1.6,2.6])g.particles.burst(this.cx+s*1.8,this.bottom-h,10,{kind:'steam',col:'#efe8dc',spd:9,life:0.8,size:0.7,grow:1.6,drag:2.4,ang:s>0?0:PI,spread:0.7,jitter:0.6});}
        break;}
      case 'vent':{const hw=lerp(2.6,4,clamp((this.st-0.1)/0.2,0,1)),hb={x:this.cx-hw,y:this.y-1,w:hw*2,h:this.h+1};   /* растёт вместе с облаком */
        if(Math.random()<dt*60){const s=Math.random()<0.5?-1:1;g.particles.spawn({kind:'steam',x:this.cx+s*2.2,y:this.bottom-0.4-Math.random()*2.6,vx:s*(5+Math.random()*4),vy:-0.5,life:0.5,size:0.5,grow:1.6,col:'#efe8dc',drag:2.2});}
        if(!this.hitDone&&this.st>0.1&&aabb(hb,p.rect())){this.hitDone=true;this.damagePlayer();}
        if(Math.random()<dt*110)g.particles.spawn({kind:'steam',x:this.cx+(Math.random()-0.5)*5,y:this.y+0.5,vx:(Math.random()-0.5)*8,vy:-3-Math.random()*4,life:0.8,size:0.6,grow:1.4,col:'#efe8dc',drag:1.2});
        if(this.st>0.7){this.state='recover';this.st=0;}
        break;}
      case 'recover':this.vx=damp(this.vx,0,8,dt);if(this.st>0.6){this.state='idle';this.st=0;this.cd=(0.7+Math.random()*0.6)/des;}break;
      default:this.state='idle';this.st=0;
    }
    this.phase=(this.state==='stuck'||this.state==='stunWall'||this.openT>0||this.nodes.some(n=>n.core&&!n.locked))?2:1;
  }
  des(){return this.nodes.find(n=>n.core&&!n.locked&&!n.broken)?1.6:1;}   /* ядро открыто — злее */
  begin(k){
    const g=this.world.game;this.st=0;this.hitDone=false;this.pulling=false;
    if(k==='sweep'){this.lead=this.has(this.lead)?this.lead:(this.has('armR')?'armR':'armL');this.state='sweepWind';g.audio.hydraulic(0.8);}
    else if(k==='slam'){this.state='slamWind';g.audio.hydraulic(1);}
    else if(k==='charge'){this.state='chargeWind';g.audio.elevator();}
    else if(k==='grab'){this.state='grabWind';this.aimA=-0.3;}
    else{this.state='ventWind';}
  }
  /* удар крюками в пол: волны по полу, крюки застревают в точке удара (стрелы открыты) */
  slam(){
    const g=this.world.game,p=this.world.player,ix=this.cx+this.face*3.2,two=this.armsLeft()===2;
    g.audio.explosion();g.audio.mat('iron',1);g.camera.addShake(1.0);g.hitstop(0.06);
    if(aabb({x:ix-1.4,y:this.bottom-2.6,w:2.8,h:2.6},p.rect()))this.damagePlayer();
    for(const s of (two?[-1,1]:[this.face]))this.world.projectiles.push({x:ix+s*1.4,y:this.bottom-0.4,vx:s*8,vy:0,r:0.45,dmg:1,life:2.6,kind:'wave'});
    g.particles.burst(ix,this.bottom,30,{kind:'debris',col:'#8a7a6a',spd:8,life:0.9,size:0.14,g:30});
    g.particles.burst(ix,this.bottom-0.1,18,{kind:'spark',col:'#ffb45a',spd:10,life:0.5,size:0.06,add:true,g:20});
    g.particles.spawn({kind:'shock',x:ix,y:this.bottom-0.1,ringR:3.2,life:0.3,size:0.08,col:'#ffcf7a',add:true,a:0.6});
    this.state='stuck';this.st=0;this.stuckArm='both';this.pulling=false;
    /* крюки — в полу в тот же кадр, что и урон: хитстоп застывает на касании, а не на замахе */
    for(const id of ['armR','armL'])if(this.P.arms[id])this.P.arms[id].snap=true;
    for(const id of ['armR','armL'])if(this.has(id))this.node(id).exT=Math.max(this.node(id).exT,1.9);
  }
  /* --- гарпун: крюк на тросе. Летит туда, где курьер был; рывок проходит сквозь, натянутый трос рвёт --- */
  fireHarpoon(p){
    const g=this.world.game,A=this.P.arms.armR;
    if(!A||!this.has('armR')){this.state='recover';this.st=0;return;}
    const o=this.wpt(A.hk),tx=p.cx+p.vx*0.1,ty=p.cy,d=Math.hypot(tx-o.x,ty-o.y)||1;
    this.harp={x:o.x,y:o.y,vx:(tx-o.x)/d*30,vy:(ty-o.y)/d*30,mode:'fly',t:0,dist:0,passed:false,pulled:false};
    this.state='grab';this.st=0;g.audio.harpoon();g.camera.addShake(0.3);
    g.particles.burst(o.x,o.y,10,{kind:'spark',col:'#ffd27a',spd:5,life:0.3,size:0.05,add:true,g:10});
  }
  harpSolid(x,y){for(const s of this.world.room.solids){if(s.hidden||s.ow)continue;if(x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h)return true;}return false;}
  updateHarpoon(dt,p){
    const g=this.world.game,H=this.harp,A=this.P.arms.armR;this.vx=damp(this.vx,0,6,dt);
    if(!H||!A||!this.has('armR')){this.dropHarpoon();this.state='recover';this.st=0;return;}
    H.t+=dt;const o=this.wpt(A.hk);
    if(H.mode==='fly'){
      H.x+=H.vx*dt;H.y+=H.vy*dt;H.dist+=30*dt;
      const r=p.rect(),inR=!p.dead&&H.x>r.x-0.3&&H.x<r.x+r.w+0.3&&H.y>r.y-0.3&&H.y<r.y+r.h+0.3;
      if(inR&&!H.passed){
        if(p.dashT>0||p.evIF>0){H.passed=true;if(!p.pfDone&&p.evAge<=perfectWin(g.gs))p.perfectEvade(H.x);}
        else if(p.invuln<=0){H.mode='pull';H.t=0;H.pulled=true;g.audio.hitMetal();g.camera.addShake(0.45);g.hitstop(0.05);
          g.particles.burst(p.cx,p.cy,12,{kind:'spark',col:'#c8452f',spd:5,life:0.35,size:0.05,add:true});}
        else H.passed=true;}
      if(H.mode==='fly'&&(H.dist>10.5||this.harpSolid(H.x,H.y))){
        if(this.harpSolid(H.x,H.y)){g.audio.mat('iron',0.6);g.particles.burst(H.x,H.y,10,{kind:'spark',col:'#ffd27a',spd:5,life:0.35,size:0.05,add:true,g:14});}
        H.mode='reel';H.t=0;}
    }else if(H.mode==='pull'){
      /* рывок — «где я»: натянутый трос не держит */
      if(p.dead||p.dashT>0){H.mode='reel';H.t=0;H.pulled=false;g.audio.snap();
        g.particles.burst(H.x,H.y,14,{kind:'spark',col:'#dff4ff',spd:6,life:0.35,size:0.05,add:true});}
      else{/* лебёдка выбирает трос: скорость курьера задаёт трос, ходьба не спасает — только рывок */
        const gx=this.cx+this.face*3.3,gy=this.bottom-1.0,dx=gx-p.cx,dy=gy-p.cy,d=Math.hypot(dx,dy)||1;
        p.vx=dx/d*11;p.vy=damp(p.vy,dy/d*7-1.5,10,dt);p.grabbed=0.1;H.x=p.cx;H.y=p.cy;
        if(Math.random()<dt*30)g.particles.spawn({kind:'spark',x:p.cx+(Math.random()-0.5)*0.5,y:p.cy,vx:dx/d*4,vy:dy/d*4,col:'#c8452f',life:0.25,size:0.05,add:true});
        if(H.t>0.7||d<0.8){H.mode='reel';H.t=0;}}
    }else{
      const dx=o.x-H.x,dy=o.y-H.y,d=Math.hypot(dx,dy),sp=28*dt;
      if(d<=sp+0.05){const pulled=H.pulled;this.harp=null;
        if(pulled&&this.has(this.nearArm())){this.lead=this.nearArm();this.state='sweepWind';this.st=0.35;this.hitDone=false;}
        else{this.state='recover';this.st=0;}}
      else{H.x+=dx/d*sp;H.y+=dy/d*sp;}
    }
  }
  dropHarpoon(){if(this.harp){this.harp=null;}}
  /* честное попадание стрелой: капсулы фермы, предплечья и крюка против курьера */
  armHit(id,p){
    const A=this.P.arms[id];if(!A||!this.has(id))return false;
    const r=p.rect(),pts=[[A.sh,A.el,0.32],[A.el,A.hk,0.3],[A.hk,A.tip,0.45]];
    for(const [a0,b0,rad] of pts){const a=this.wpt(a0),b=this.wpt(b0),L=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(L/0.2));
      for(let i=0;i<=n;i++){const x=lerp(a.x,b.x,i/n),y=lerp(a.y,b.y,i/n);
        const nx=clamp(x,r.x,r.x+r.w),ny=clamp(y,r.y,r.y+r.h);if(Math.hypot(nx-x,ny-y)<=rad)return true;}}
    return false;
  }
  /* --- последствия --- */
  onInterrupt(n){
    const g=this.world.game;this.dropHarpoon();
    if(n.id==='armR'||n.id==='armL'){this.stuckArm=n.id;g.audio.explosion();g.camera.addShake(0.8);
      const ix=this.cx+this.face*(n.id==='armR'?3.4:2.95);
      g.particles.burst(ix,this.bottom,24,{kind:'debris',col:'#8a7a6a',spd:7,life:0.9,size:0.13,g:28});
      g.particles.burst(ix,this.bottom-0.1,14,{kind:'spark',col:'#ffb45a',spd:8,life:0.45,size:0.06,add:true,g:20});}
    else this.stuckArm=null;
  }
  onBreak(n,h){
    const g=this.world.game;
    if(n.core){super.onBreak(n,h);return;}
    if(n.id===this.lead)this.lead=n.id==='armR'?'armL':'armR';
    if(n.id==='armR')this.dropHarpoon();
    if(n.id==='sensor'){this.blindX=this.cx;g.particles.burst(n.wx,n.wy,24,{kind:'spark',col:'#cfe6ff',spd:7,life:0.5,size:0.05,add:true,g:16});}
    if(n.id==='treads'){g.particles.burst(n.wx,n.wy,16,{kind:'debris',col:'#2b2824',spd:6,life:1,size:0.14,g:26});}
    g.audio.bossRoar();
    const broken=this.nodes.filter(q=>!q.core&&q.broken).length,core=this.node('core');
    if(broken>=2&&core.locked){
      /* броня топки отваливается: ядро открыто */
      core.locked=false;core.exT=2.5;
      const W=this.world,b=this.wpt({x:OVS.core.x,y:OVS.core.y});
      for(let i=0;i<2;i++)W.addDebris({x:b.x,y:b.y-0.35+i*0.7,w:1.0,h:0.62,vx:-this.face*(3+Math.random()*3),vy:-5-Math.random()*3,vr:(Math.random()-0.5)*10,
        mass:1.2,mat:'iron',hot:2,face:this.face,src:this,draw:(c)=>{MK.box(c,-0.5,-0.31,1.0,0.62,0.06,'iron',{tex:'rust',texA:0.4,bolts:0.045});
          c.fillStyle='rgba(255,120,40,.5)';c.fillRect(-0.4,-0.05,0.8,0.05);}});
      g.fx.breakNode(b.x,b.y,'iron',false,true);g.audio.steamBurst();
      for(let i=0;i<14;i++)g.particles.spawn({kind:'steam',x:b.x+(Math.random()-0.5)*0.8,y:b.y+(Math.random()-0.5)*1.2,vx:-this.face*(1+Math.random()*3),vy:-1-Math.random()*2,
        life:0.9,size:0.4,grow:1.1,col:'#efe8dc',drag:1.2});
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
    const W=this.world;this.harp=null;
    /* кабина отлетает отдельно, линза гаснет */
    const cb=this.wpt({x:0.3,y:-3.05});
    W.addDebris({x:cb.x,y:cb.y,w:1.5,h:1.5,vx:-this.face*2+(Math.random()-0.5)*3,vy:-7,vr:this.face*3,mass:3,mat:'iron',hot:5,
      face:this.face,src:this,draw:(c,t)=>{
        c.beginPath();c.moveTo(-0.7,0.75);c.lineTo(-0.7,-0.75);c.lineTo(0.2,-0.75);c.lineTo(0.7,0.4);c.lineTo(0.7,0.75);c.closePath();
        c.fillStyle=MK.plateGrad(c,'olive',-0.7,-0.75,1.4,1.5);c.fill();c.strokeStyle=MAT.olive.ed;c.lineWidth=0.04;c.stroke();
        c.fillStyle='#0b0a09';c.beginPath();c.arc(0.0,-0.05,0.3,0,TAU);c.fill();MK.cracks(c,0,-0.05,0.32,77,1);
        MK.wires(c,0,0.2,PI/2,31,t,3);}});
  }
  /* --- поза --- */
  armTarget(id,s,k){
    const near=id==='armR',ph=this.t*1.3+(near?0:1.7),lead=this.lead===id,br=0.04*Math.sin(ph);
    const ra=(near?-0.95:-1.05)+br,rb=near?2.0:2.1;
    if(!this.has(id))return {a:0.62+Math.sin(ph*0.6)*0.03,b:0,e:0,rate:3};         /* сломанная ферма висит плетью */
    if(!this.activated)return {a:(near?0.2:0.05)+br*0.3,b:near?2.2:2.35,e:0,rate:2};   /* спит: стрелы сложены, крюки на полу */
    if(s==='wake'){const q=clamp(this.st/1.1,0,1);return {a:lerp(near?0.2:0.05,ra-0.3,EZ.out(q)),b:lerp(near?2.2:2.35,rb,q),e:0,rate:6};}
    if(this.harp&&near){const o=this.lp(OVS.shR.x,OVS.shR.y),h=this.loc(this.harp.x,this.harp.y);
      return {a:clamp(Math.atan2(h.y-o.y,h.x-o.x),-1.2,0.9)-0.08,b:0.1,e:this.harp.mode==='fly'?1:0,rate:14};}
    const stuck=s==='stuck'||(this.openT>0&&(this.stuckArm===id||this.stuckArm==='both'));
    if(stuck){const tx=(near?3.4:2.95)+Math.sin(this.t*47)*0.015*(s==='stuck'&&this.st>1.5?1:0);
      return {ik:[tx,-0.08],bend:-1,e:0.35,rate:42};}
    if(s==='sweepWind'&&lead){const e=EZ.out(k),tr=k>0.6?Math.sin(this.t*55)*0.012:0;return {a:lerp(ra,-2.0,e)+tr,b:lerp(rb,0.6,e),e:0,rate:14};}
    if(s==='sweep'&&lead){const q=clamp(this.st/0.24,0,1),e=EZ.out(q),bl=this.has('sensor')?0:0.3,o=this.st>0.24?Math.sin((this.st-0.24)*30)*0.07*Math.exp(-(this.st-0.24)*7):0;
      return {a:lerp(-2.0,0.3,e)+o,b:lerp(0.6,0.06,e),e:clamp(this.st/0.14,0,1)+bl,rate:60};}
    if((s==='sweepWind'||s==='sweep')&&!lead)return {a:ra-0.2,b:rb+0.1,e:0,rate:8};
    if(s==='slamWind'){const e=EZ.out(k);return {a:lerp(ra,near?-2.1:-1.95,e),b:lerp(rb,0.35,e),e:0.3*k,rate:12};}
    if(s==='chargeWind'||s==='charge')return {a:near?-0.3:-0.45,b:1.0,e:0.3,rate:9};
    if(s==='grabWind'&&near){const e=EZ.out(k);return {a:lerp(ra,this.aimA-0.08,e),b:lerp(rb,0.12,e),e:0,rate:12};}
    if(s==='stunWall'||this.stunT>0)return {a:0.15+Math.sin(this.t*9+ph)*0.04,b:1.6,e:0,rate:6};
    if(s==='ventWind'||s==='vent')return {a:-1.6,b:2.3,e:0,rate:8};
    if(this.openT>0)return {a:ra+0.45,b:rb-0.2,e:0,rate:7};
    return {a:ra,b:rb,e:0,rate:s==='recover'?5:8};
  }
  pose(dt){
    const P=this.P,s=this.state,g=this.world.game;
    const kmap={sweepWind:0.8,slamWind:0.95,chargeWind:1.1,grabWind:0.72,ventWind:0.8};
    const k=kmap[s]?clamp(this.st/(kmap[s]/this.des()),0,1):0;
    this.tread+=this.vx*this.face*(dt||0);
    P.bob=this.activated?Math.sin(this.t*2.2)*0.025+(s==='charge'?Math.sin(this.t*30)*0.03:0)+(Math.abs(this.vx)>0.3?Math.sin(this.tread*9)*0.02:0):0;
    const tl=(s==='chargeWind'?-0.05*k:0)+(s==='charge'?0.06:0)+(s==='sweep'?0.04:0)+(s==='stunWall'||this.stunT>0?0.07:0)+this.recoil*0.03;
    P.lean=dt?damp(P.lean,tl,10,dt):tl;
    /* линза: спит — тлеет; проснулся — горит; вслепую — погасла */
    const lt=!this.has('sensor')?0:(!this.activated?0.12:(s==='wake'?(this.st>0.25?(Math.sin(this.st*60)>0||this.st>0.7?1:0.2):0.12):1));
    P.lens=dt?damp(P.lens,lt,s==='wake'?30:6,dt):lt;
    for(const id of ['armR','armL']){
      const sh0=OVS[id==='armR'?'shR':'shL'],sh={x:sh0.x,y:sh0.y+P.bob},q=this.armTarget(id,s,k);
      let ta=q.a,tb=q.b;
      const L2=OVS.L2+(q.e||0)*OVS.EXT;
      if(q.ik){const r=ik2(sh.x,sh.y,q.ik[0],q.ik[1],OVS.L1,L2,q.bend);
        ta=Math.atan2(r.ky-sh.y,r.kx-sh.x);tb=Math.atan2(r.fy-r.ky,r.fx-r.kx)-ta;}
      let A=P.arms[id];
      if(!A||!dt){A=P.arms[id]={a:ta,b:tb,e:q.e||0,trail:[]};}
      else if(A.snap){A.a=ta;A.b=tb;A.e=q.e||0;A.snap=false;}
      else{A.a=damp(A.a,ta,q.rate,dt);A.b=damp(A.b,tb,q.rate,dt);A.e=damp(A.e,q.e||0,q.rate,dt);}
      const l2=OVS.L2+A.e*OVS.EXT,fa=A.a+A.b;
      A.sh=sh;A.el={x:sh.x+Math.cos(A.a)*OVS.L1,y:sh.y+Math.sin(A.a)*OVS.L1};
      A.hk={x:A.el.x+Math.cos(fa)*l2,y:A.el.y+Math.sin(fa)*l2};
      /* крюк не уходит под пол */
      if(A.hk.y>-0.06){A.hk.y=-0.06;}
      A.tip={x:A.hk.x+Math.cos(fa)*0.5+Math.cos(fa+PI/2)*0.25,y:A.hk.y+Math.sin(fa)*0.5+Math.sin(fa+PI/2)*0.25};
      A.L2=l2;A.fa=fa;
      if(dt){A.trail.unshift({x:A.tip.x,y:A.tip.y,mx:lerp(A.el.x,A.hk.x,0.45),my:lerp(A.el.y,A.hk.y,0.45)});if(A.trail.length>7)A.trail.pop();}
      const n=this.node(id);if(n){const e=this.lp(A.el.x,A.el.y);n.lx=e.x;n.ly=e.y;}
    }
    const tn=this.node('treads');tn.lx=1.84;tn.ly=-0.6;
    const sn=this.node('sensor'),sp=this.lp(OVS.lens.x,OVS.lens.y+P.bob);sn.lx=sp.x;sn.ly=sp.y;
    const cn=this.node('core'),cp=this.lp(OVS.core.x,OVS.core.y+P.bob);cn.lx=cp.x;cn.ly=cp.y;
    /* трубы дымят по состоянию: спит — едва, таран и ярость — чёрным столбом */
    if(dt&&!this.dead){const rate=!this.activated?0.6:(s==='chargeWind'||s==='charge'?14:(this.des()>1?7:3));
      if(Math.random()<dt*rate){const st=this.wpt({x:Math.random()<0.5?-2.21:-1.72,y:-4.45+P.bob});
        g.particles.spawn({kind:'smoke',x:st.x,y:st.y,vx:-this.face*0.6+(Math.random()-0.5)*0.4,vy:-1.4-Math.random(),life:2.2,size:0.32,grow:1.0,col:'#2a2520',drag:0.7,a:0.55});}
      if(this.activated&&Math.random()<dt*(this.des()>1?3:0.8)){const st=this.wpt({x:-2.21,y:-4.5+P.bob});
        g.particles.spawn({kind:'spark',x:st.x,y:st.y,vx:(Math.random()-0.5)*1.5,vy:-3-Math.random()*2,life:0.6,size:0.04,col:'#ffb45a',add:true,g:-1});}}
  }
  /* --- рисунок --- */
  draw(c,t){
    const P=this.P,bob=P.bob;
    c.save();c.translate(0,OVS.piv);c.rotate(P.lean);c.translate(0,-OVS.piv);
    this.drawArm(c,'armL',t,true);
    this.drawStacks(c,t,bob);
    this.drawCounter(c,t,bob);
    this.drawCab(c,t,bob);
    this.drawHull(c,t,bob);
    this.drawBow(c,t,bob);
    c.restore();
    this.drawTracks(c,t);
    c.save();c.translate(0,OVS.piv);c.rotate(P.lean);c.translate(0,-OVS.piv);
    this.drawArm(c,'armR',t,false);
    c.restore();
  }
  drawStacks(c,t,bob){
    MK.cyl(c,-2.38,-4.5+bob,0.34,1.6,'iron',{bands:[[0.14,0.06,'brass'],[0.62,0.05,'brass']]});
    MK.cyl(c,-1.87,-4.22+bob,0.3,1.3,'iron',{bands:[[0.16,0.05,'brass']]});
    /* искрогасители */
    for(const [x,y,w] of [[-2.38,-4.5,0.34],[-1.87,-4.22,0.3]]){
      c.fillStyle='#1b1916';c.beginPath();c.moveTo(x-0.05,y+bob);c.lineTo(x+w+0.05,y+bob);c.lineTo(x+w-0.03,y-0.16+bob);c.lineTo(x+0.03,y-0.16+bob);c.closePath();c.fill();
      c.strokeStyle='#4d4943';c.lineWidth=0.02;for(let i=1;i<4;i++){c.beginPath();c.moveTo(x+w*i/4,y+bob);c.lineTo(x+w*i/4,y-0.15+bob);c.stroke();}}
  }
  drawCounter(c,t,bob){
    const n=this.node('core'),y0=-3.12+bob,y1=-1.36,x0=-2.62,x1=-1.12;
    /* рисуем в системе верха (крен уже в трансформе) — координаты узла без крена */
    /* литой противовес: тяжёлый блок со скруглённой спиной */
    c.beginPath();c.moveTo(x1,y1);c.lineTo(x0+0.18,y1);c.quadraticCurveTo(x0,y1,x0,y1-0.2);c.lineTo(x0,y0+0.5);
    c.quadraticCurveTo(x0,y0,x0+0.5,y0);c.lineTo(x1,y0+0.06);c.closePath();
    c.fillStyle=MK.plateGrad(c,'iron',x0,y0,x1-x0,y1-y0);c.fill();
    c.save();c.clip();c.globalAlpha=0.42;c.fillStyle=PAT(c,'rust');c.fillRect(x0,y0,x1-x0,y1-y0);c.globalAlpha=1;
    c.fillStyle='rgba(255,230,190,.12)';c.fillRect(x0,y0,x1-x0,0.06);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x0,y1-0.12,x1-x0,0.12);c.restore();
    c.strokeStyle=MAT.iron.ed;c.lineWidth=0.04;c.stroke();
    for(let i=0;i<5;i++)MK.bolt(c,x0+0.2+i*0.29,y0+0.16,0.045,'steel');
    for(let i=0;i<5;i++)MK.bolt(c,x0+0.2+i*0.29,y1-0.16,0.045,'steel');
    /* топка: броня на болтах (щели светятся) или открытый жар */
    const cx=OVS.core.x,cy=OVS.core.y+bob;
    if(n.locked){
      MK.box(c,cx-0.52,cy-0.62,1.04,1.24,0.08,'iron',{tex:'rust',texA:0.45,bolts:0.05,seams:[0.5]});
      for(let i=0;i<4;i++){const a=0.3+0.2*Math.sin(t*4+i*1.3);c.fillStyle='#120a05';c.fillRect(cx-0.36,cy-0.42+i*0.26,0.72,0.07);
        c.fillStyle=rgba('#ff8a3a',a);c.fillRect(cx-0.34,cy-0.41+i*0.26,0.68,0.05);}
      if(this.activated)this.world.game.renderer.glowAdd(this.cx+this.face*cx,this.bottom+cy,1.0,'#ff8a3a',0.25);
    }else if(!n.broken){
      const p=0.5+0.5*Math.sin(t*7);
      c.fillStyle='#120a05';rr(c,cx-0.52,cy-0.62,1.04,1.24,0.14);c.fill();
      const gr=c.createRadialGradient(cx,cy,0,cx,cy,0.62);gr.addColorStop(0,'#fff4d6');gr.addColorStop(0.3,'#ffcf7a');gr.addColorStop(0.7,rgba('#ff7a2a',0.9));gr.addColorStop(1,'rgba(120,30,8,.6)');
      c.fillStyle=gr;c.beginPath();c.arc(cx,cy,0.5+0.04*p,0,TAU);c.fill();
      /* языки пламени в топке */
      for(let i=0;i<3;i++){const fx=cx-0.25+i*0.25,h=0.28+0.12*Math.sin(t*11+i*2.1);
        c.fillStyle=rgba(i===1?'#fff0c8':'#ffb45a',0.8);c.beginPath();c.moveTo(fx-0.1,cy+0.32);c.quadraticCurveTo(fx,cy+0.3-h*2,fx+0.1,cy+0.32);c.fill();}
      c.strokeStyle=MAT.brass.mid;c.lineWidth=0.09;c.beginPath();c.arc(cx,cy,0.58,0,TAU);c.stroke();
      for(let i=0;i<8;i++){const a=i/8*TAU;MK.bolt(c,cx+Math.cos(a)*0.58,cy+Math.sin(a)*0.58,0.04,'brass');}
      MK.cracks(c,cx,cy,0.6,n.seed,n.wear);
      this.world.game.renderer.glowAdd(this.cx+this.face*cx,this.bottom+cy,1.5,'#ffb45a',0.38+0.18*p);
    }else{c.fillStyle='#0d0907';rr(c,cx-0.52,cy-0.62,1.04,1.24,0.14);c.fill();}
  }
  /* носовой литой блок: держит оба плеча стрел */
  drawBow(c,t,bob){
    const x0=0.68,x1=2.1,y0=-2.66+bob,y1=-1.34;
    c.beginPath();c.moveTo(x0,y1);c.lineTo(x0,y0+0.3);c.quadraticCurveTo(x0,y0,x0+0.35,y0);c.lineTo(x1-0.45,y0+0.06);
    c.quadraticCurveTo(x1,y0+0.14,x1,y0+0.6);c.lineTo(x1,y1);c.closePath();
    c.fillStyle=MK.plateGrad(c,'iron',x0,y0,x1-x0,y1-y0);c.fill();
    c.save();c.clip();c.globalAlpha=0.36;c.fillStyle=PAT(c,'rust');c.fillRect(x0,y0,x1-x0,y1-y0);c.globalAlpha=1;
    c.fillStyle='rgba(255,230,190,.15)';c.fillRect(x0,y0,x1-x0,0.06);c.fillStyle='rgba(0,0,0,.38)';c.fillRect(x0,y1-0.12,x1-x0,0.12);c.restore();
    c.strokeStyle=MAT.iron.ed;c.lineWidth=0.04;c.stroke();
    for(let i=0;i<4;i++)MK.bolt(c,x0+0.2+i*0.33,y0+0.17,0.04,'steel');
    c.fillStyle=MK.cylGrad(c,'brass',0,y1-0.34,0,y1-0.22);c.fillRect(x0,y1-0.34,x1-x0,0.12);
  }
  drawHull(c,t,bob){
    const y0=-2.18+bob,y1=-1.34,x0=-1.86,x1=1.98;
    c.beginPath();c.moveTo(x0,y1);c.lineTo(x1-0.3,y1);c.lineTo(x1,y1-0.3);c.lineTo(x1,y0+0.1);c.lineTo(x1-0.1,y0);c.lineTo(x0,y0);c.closePath();
    c.fillStyle=MK.plateGrad(c,'iron',x0,y0,x1-x0,y1-y0);c.fill();
    c.save();c.clip();c.globalAlpha=0.32;c.fillStyle=PAT(c,'rust');c.fillRect(x0,y0,x1-x0,y1-y0);c.globalAlpha=1;
    c.fillStyle='rgba(255,230,190,.16)';c.fillRect(x0,y0,x1-x0,0.05);c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x0,y1-0.1,x1-x0,0.1);
    c.fillStyle='rgba(0,0,0,.42)';for(const s of [-0.6,0.62])c.fillRect(s-0.012,y0,0.024,y1-y0);c.restore();
    c.strokeStyle=MAT.iron.ed;c.lineWidth=0.04;c.stroke();
    for(let i=0;i<12;i++)MK.bolt(c,x0+0.16+i*0.31,y0+0.1,0.034,'steel');
    /* жалюзи машинного отделения: в ярости и перед выбросом пара светятся */
    const hot=this.state==='ventWind'||this.state==='vent'?1:(this.des()>1?0.6:0.15);
    for(let i=0;i<5;i++){const x=-1.45+i*0.2;c.fillStyle='#0e0c0a';c.fillRect(x,y0+0.3,0.1,0.5);
      c.fillStyle=rgba('#ff8a3a',hot*(0.5+0.3*Math.sin(t*6+i)));c.fillRect(x+0.02,y0+0.34,0.06,0.42);}
  }
  /* кабина-голова в середине: высокая, скошенный лоб; в окне — линза-сенсор */
  drawCab(c,t,bob){
    const y0=-3.96+bob,y1=-2.14+bob,x0=-0.42,x1=1.06,s=this.state;
    const path=()=>{c.beginPath();c.moveTo(x0,y1);c.lineTo(x0,y0+0.1);c.lineTo(x0+0.1,y0);c.lineTo(0.6,y0);c.lineTo(x1,y0+0.74);c.lineTo(x1,y1);c.closePath();};
    path();c.fillStyle=MK.plateGrad(c,'olive',x0,y0,x1-x0,y1-y0);c.fill();
    c.save();path();c.clip();c.globalAlpha=0.3;c.fillStyle=PAT(c,'rust');c.fillRect(x0,y0,x1-x0,y1-y0);c.globalAlpha=1;
    c.fillStyle='rgba(255,240,200,.16)';c.fillRect(x0,y0,x1-x0,0.05);c.fillStyle='rgba(0,0,0,.32)';c.fillRect(x0,y1-0.12,x1-x0,0.12);
    c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x0,y0+1.42,x1-x0,0.025);c.restore();
    path();c.strokeStyle=MAT.olive.ed;c.lineWidth=0.04;c.stroke();
    for(let i=0;i<5;i++)MK.bolt(c,x0+0.14+i*0.3,y0+1.56,0.032,'steel');
    /* окно: тёмное стекло; в нём — линза */
    const wp=()=>{c.beginPath();c.moveTo(-0.24,y0+0.17);c.lineTo(0.55,y0+0.17);c.lineTo(0.9,y0+0.8);c.lineTo(0.9,y0+1.26);c.lineTo(-0.24,y0+1.26);c.closePath();};
    wp();const gg=c.createLinearGradient(-0.2,y0,0.9,y0+1.3);gg.addColorStop(0,'#1f282e');gg.addColorStop(1,'#0b0f12');c.fillStyle=gg;c.fill();
    c.strokeStyle=MAT.brass.dk;c.lineWidth=0.05;c.stroke();
    c.save();wp();c.clip();c.fillStyle='rgba(220,235,245,.07)';c.beginPath();c.moveTo(-0.1,y0+0.17);c.lineTo(0.08,y0+0.17);c.lineTo(-0.16,y0+1.26);c.lineTo(-0.24,y0+1.26);c.closePath();c.fill();c.restore();
    const sn=this.node('sensor'),lx=OVS.lens.x,ly=OVS.lens.y+bob;
    if(this.has('sensor')){const hot=s==='grabWind'||(s==='grab'&&this.harp);
      MK.lens(c,lx,ly,0.3,hot?'#ffe2a0':(this.threat()?'#ff3b22':'#ff6a3a'),this.P.lens*(hot?1:0.9),{rim:'brass'});
      if(this.P.lens>0.05)this.world.game.renderer.glowAdd(this.cx+this.face*lx,this.bottom+ly,1.0,hot?'#ffcf7a':'#ff3b22',0.55*this.P.lens);}
    else{c.fillStyle='#16191c';c.beginPath();c.arc(lx,ly,0.38,0,TAU);c.fill();MK.joint(c,lx,ly,0.36,'brass');
      c.fillStyle='#07090a';c.beginPath();c.arc(lx,ly,0.28,0,TAU);c.fill();MK.cracks(c,lx,ly,0.32,sn.seed,1);MK.wires(c,lx,ly+0.12,PI/2,sn.seed,t,3);}
    /* решётка окна */
    c.strokeStyle='#2b2824';c.lineWidth=0.05;
    for(const x of [-0.06,0.84]){c.beginPath();c.moveTo(x,y0+(x>0.5?0.72:0.17));c.lineTo(x,y0+1.26);c.stroke();}
    /* козырёк, маяк, поручень */
    MK.box(c,x0-0.12,y0-0.16,1.16,0.18,0.05,'iron',{bolts:0.03});
    const bk=0.5+0.5*Math.sin(t*(this.activated?7:1.4)),on=this.activated&&!this.dead;
    MK.box(c,-0.12,y0-0.36,0.26,0.2,0.04,'steel',{});
    c.fillStyle=rgba(on?'#ffb030':'#5a3a20',on?0.55+0.45*bk:0.6);c.beginPath();c.arc(0.01,y0-0.38,0.1,PI,TAU);c.fill();
    if(on)this.world.game.renderer.glowAdd(this.cx+this.face*0.01,this.bottom+y0-0.4,0.7,'#ffb030',0.45*bk);
    c.strokeStyle=MAT.brass.mid;c.lineWidth=0.035;c.beginPath();c.moveTo(x0+0.08,y0+0.3);c.lineTo(x0+0.08,y1-0.1);c.stroke();
  }
  drawTracks(c,t){
    const tn=this.node('treads'),ok=!tn.broken,x0=-2.44,x1=2.44,R=0.6,yc=-0.6,sag=ok?0:0.18;
    /* лента: петля-стадион */
    const loop=()=>{c.beginPath();c.moveTo(x0+R,yc-R);c.lineTo(x1-R,yc-R+sag);c.arc(x1-R,yc+sag*0.5,R-sag*0.5,-PI/2,PI/2);c.lineTo(x0+R,yc+R);c.arc(x0+R,yc,R,PI/2,PI*1.5);c.closePath();};
    loop();c.fillStyle='#141210';c.fill();
    /* траки бегут по периметру (верх — вперёд, низ — назад относительно корпуса) */
    const straight=x1-x0-2*R,per=2*straight+TAU*R,step=0.29,ph=((this.tread%step)+step)%step;
    const at=s=>{s=((s%per)+per)%per;
      if(s<straight)return {x:x0+R+s,y:yc-R+sag*s/straight,a:0};s-=straight;
      if(s<PI*R){const a=-PI/2+s/R;return {x:x1-R+Math.cos(a)*R,y:yc+Math.sin(a)*R,a:a+PI/2};}s-=PI*R;
      if(s<straight)return {x:x1-R-s,y:yc+R,a:PI};s-=straight;
      const a=PI/2+s/R;return {x:x0+R+Math.cos(a)*R,y:yc+Math.sin(a)*R,a:a+PI/2};};
    for(let s=ph;s<per;s+=step){const q=at(s);c.save();c.translate(q.x,q.y);c.rotate(q.a);
      c.fillStyle='#3d3833';c.fillRect(-0.11,-0.07,0.22,0.12);c.fillStyle='#57514a';c.fillRect(-0.11,-0.07,0.22,0.03);
      c.fillStyle='#1b1917';c.fillRect(-0.03,-0.1,0.06,0.04);c.restore();}
    /* опорные катки, ленивец, поддерживающие ролики */
    const spin=this.tread/0.27;
    for(const wx of [-1.3,-0.45,0.4,1.22]){MK.joint(c,wx,-0.3,0.27,'soot');
      c.save();c.translate(wx,-0.3);c.rotate(spin);c.strokeStyle='#4a4540';c.lineWidth=0.05;
      for(let i=0;i<5;i++){c.rotate(TAU/5);c.beginPath();c.moveTo(0.08,0);c.lineTo(0.22,0);c.stroke();}c.restore();
      MK.bolt(c,wx,-0.3,0.07,'brass');}
    for(const wx of [-0.75,0.7])MK.joint(c,wx,-1.08,0.1,'iron');
    MK.joint(c,-1.84,-0.6,0.48,'iron');
    c.save();c.translate(-1.84,-0.6);c.rotate(this.tread/0.48);c.fillStyle='#1c1a17';
    for(let i=0;i<4;i++){c.rotate(TAU/4);c.beginPath();c.ellipse(0.25,0,0.11,0.07,0,0,TAU);c.fill();}c.restore();
    /* рама тележки с облегчающими отверстиями */
    MK.box(c,-1.56,-0.98,3.0,0.42,0.06,'iron',{tex:'rust',texA:0.35});
    for(let i=0;i<4;i++){c.fillStyle='#0d0c0b';c.beginPath();c.ellipse(-1.12+i*0.74,-0.77,0.2,0.1,0,0,TAU);c.fill();
      c.fillStyle='rgba(255,230,190,.12)';c.beginPath();c.ellipse(-1.12+i*0.74,-0.72,0.18,0.05,0,0,PI);c.fill();}
    /* ведущая звезда (узел ГУСЕНИЦЫ) */
    if(ok){c.save();c.translate(tn.lx,tn.ly);c.rotate(this.tread/0.5);
      c.fillStyle=MAT.brass.dk;for(let i=0;i<10;i++){c.save();c.rotate(i/10*TAU);c.beginPath();c.moveTo(0.4,-0.08);c.lineTo(0.56,-0.05);c.lineTo(0.56,0.05);c.lineTo(0.4,0.08);c.fill();c.restore();}
      MK.joint(c,0,0,0.44,'brass');c.fillStyle='rgba(46,34,8,.6)';
      for(let i=0;i<5;i++){c.save();c.rotate(i/5*TAU);c.beginPath();c.ellipse(0.24,0,0.07,0.05,0,0,TAU);c.fill();c.restore();}
      c.restore();}
    else{MK.stump(c,tn.lx,tn.ly,0.3,0,tn.seed,t,'brass');
      /* оборванная лента свисает с носа */
      for(let i=0;i<4;i++){c.save();c.translate(x1-0.1+i*0.08,-0.85+i*0.24);c.rotate(1.2+i*0.15);c.fillStyle='#3d3833';c.fillRect(-0.11,-0.06,0.22,0.12);c.restore();}}
    /* крыло над лентой: лента-предупреждение на носу */
    c.beginPath();c.moveTo(-2.52,-1.46);c.lineTo(2.3,-1.46);c.lineTo(2.62,-1.22);c.lineTo(2.62,-1.12);c.lineTo(-2.52,-1.18);c.closePath();
    c.fillStyle=MK.plateGrad(c,'iron',-2.5,-1.46,5.1,0.34);c.fill();c.strokeStyle=MAT.iron.ed;c.lineWidth=0.035;c.stroke();
    c.save();c.clip();Kit.hazardTape(c,1.7,-1.46,1.0,0.34);c.restore();
    for(let i=0;i<9;i++)MK.bolt(c,-2.32+i*0.5,-1.32,0.033,'steel');
  }
  drawArm(c,id,t,far){
    const A=this.P.arms[id],n=this.node(id);if(!A)return;
    const sh=A.sh,el=A.el,a=A.a,broken=!n||n.broken;
    /* гидроцилиндр плеча: от башни к нижнему поясу фермы */
    const rb={x:sh.x+Math.cos(a)*0.95-Math.sin(a)*0.24,y:sh.y+Math.sin(a)*0.95+Math.cos(a)*0.24};
    MK.piston(c,sh.x-0.12,sh.y+0.62,rb.x,rb.y,0.17,0.5);
    if(!far){MK.hose(c,[[sh.x-0.55,sh.y+0.3],[lerp(sh.x,el.x,0.5)-0.25,lerp(sh.y,el.y,0.5)+0.5],[el.x,el.y+0.1]],0.07,'#26221e',{ribs:true});}
    this.drawBoom(c,sh,el,a,broken);
    MK.joint(c,sh.x,sh.y,0.34,'iron');MK.bolt(c,sh.x,sh.y,0.12,'brass');
    if(broken){MK.stump(c,el.x,el.y,0.22,a,n?n.seed:5,t,'brass');}
    else{
      const fa=A.fa,L2=A.L2,harp=this.harp&&id==='armR';
      /* гидроцилиндр локтя */
      const p1={x:el.x-Math.cos(a)*0.8-Math.sin(a)*0.22,y:el.y-Math.sin(a)*0.8+Math.cos(a)*0.22};
      const p2={x:el.x+Math.cos(fa)*0.6-Math.sin(fa)*0.2,y:el.y+Math.sin(fa)*0.6+Math.cos(fa)*0.2};
      MK.piston(c,p1.x,p1.y,p2.x,p2.y,0.13,0.5);
      /* предплечье: выдвижная балка в гильзе */
      c.save();c.translate(el.x,el.y);c.rotate(fa);
      if(L2>1.05){MK.box(c,0.7,-0.12,L2-0.7,0.24,0.04,'steel',{});c.save();rr(c,0.7,-0.12,L2-0.7,0.24,0.04);c.clip();Kit.hazardTape(c,L2-0.32,-0.12,0.26,0.24);c.restore();}
      MK.box(c,0.05,-0.19,1.3,0.38,0.06,'iron',{tex:'rust',texA:0.35,bolts:0.035});
      c.fillStyle=MK.cylGrad(c,'brass',0,-0.21,0,0.21);c.fillRect(1.24,-0.21,0.1,0.42);
      /* обойма с блоком и крюк */
      MK.box(c,L2-0.08,-0.2,0.34,0.4,0.08,'steel',{});MK.joint(c,L2+0.09,0,0.12,'steel');
      if(!harp)this.drawHook(c,L2+0.22);
      c.restore();
      /* привод локтя — узел РУКА: латунный барабан */
      c.fillStyle='#1d160a';c.beginPath();c.arc(el.x,el.y,0.47,0,TAU);c.fill();
      MK.joint(c,el.x,el.y,0.42,'brass');
      for(let i=0;i<6;i++){const q=i/6*TAU+a;MK.bolt(c,el.x+Math.cos(q)*0.32,el.y+Math.sin(q)*0.32,0.035,'steel');}
      const hot=(this.state==='grabWind'||this.state==='grab')&&id==='armR';
      if(hot&&!harp)this.world.game.renderer.glowAdd(this.cx+this.face*A.hk.x,this.bottom+A.hk.y,0.8,'#c8452f',0.5);
    }
    if(far){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,6,5,.34)';c.fillRect(-6,-7,12,7.5);c.restore();}
  }
  /* ферма: стенка с облегчающими отверстиями, два пояса, раскосы */
  drawBoom(c,sh,el,a,broken){
    const L=OVS.L1,w0=0.26,w1=0.19;
    c.save();c.translate(sh.x,sh.y);c.rotate(a);
    c.beginPath();c.moveTo(0,-w0);c.lineTo(L,-w1);c.lineTo(L,w1);c.lineTo(0,w0);c.closePath();
    const g=c.createLinearGradient(0,-w0,0,w0);g.addColorStop(0,'#3a3631');g.addColorStop(0.5,'#2a2723');g.addColorStop(1,'#191714');c.fillStyle=g;c.fill();
    for(let i=0;i<4;i++){const x=0.36+i*0.44,hw=lerp(w0,w1,x/L)*0.5;c.fillStyle='#0c0b0a';c.beginPath();c.ellipse(x,0,0.15,hw,0,0,TAU);c.fill();}
    c.strokeStyle='#5d5850';c.lineWidth=0.05;c.beginPath();
    for(let i=0;i<5;i++){const x=0.12+i*0.42,y=(i%2?1:-1)*lerp(w0,w1,x/L);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
    MK.seg(c,0,-w0,L,-w1,0.12,'iron',{});MK.seg(c,0,w0,L,w1,0.12,'iron',{});
    for(let i=0;i<6;i++){const x=0.2+i*0.34;MK.bolt(c,x,-lerp(w0,w1,x/L),0.03,'steel');}
    if(broken){c.fillStyle='#0d0c0b';c.beginPath();c.moveTo(L-0.1,-w1);c.lineTo(L+0.15,-w1*0.3);c.lineTo(L-0.05,0.05);c.lineTo(L+0.12,w1);c.lineTo(L-0.15,w1);c.closePath();c.fill();}
    c.restore();
  }
  /* крюк: продолжает предплечье и загибается назад — к корпусу («тянет к себе») */
  drawHook(c,x){
    c.lineCap='round';
    c.strokeStyle='#1a1d20';c.lineWidth=0.26;c.beginPath();c.moveTo(x,0);c.lineTo(x+0.3,0);c.arc(x+0.3,0.3,0.3,-PI/2,PI*0.78,false);c.stroke();
    c.strokeStyle='#6f787f';c.lineWidth=0.1;c.beginPath();c.moveTo(x,-0.03);c.lineTo(x+0.3,-0.03);c.arc(x+0.3,0.3,0.33,-PI/2,PI*0.1,false);c.stroke();
    c.fillStyle='#2b3035';c.beginPath();c.moveTo(x+0.06,0.47);c.lineTo(x+0.2,0.5);c.lineTo(x+0.1,0.66);c.closePath();c.fill();
    c.strokeStyle=MAT.brass.mid;c.lineWidth=0.035;c.beginPath();c.moveTo(x+0.05,0.06);c.lineTo(x+0.12,0.42);c.stroke();
  }
  /* поверх спрайта: прожектор сенсора, мазки стрел, гарпун на тросе */
  drawFX(c,t){
    const P=this.P,s=this.state;
    c.save();c.translate(0,OVS.piv);c.rotate(P.lean);c.translate(0,-OVS.piv);
    /* прожектор: конус ищет курьера; при захвате сужается и белеет */
    if(this.activated&&this.has('sensor')&&P.lens>0.3&&!this.dead){
      const sx=OVS.lens.x,sy=OVS.lens.y+P.bob,p=this.world.player,q=this.loc(p.cx,p.cy),lk=s==='grabWind'||s==='grab';
      const ang=clamp(Math.atan2(q.y-sy,q.x-sx),-0.7,0.9),L=lk?11:8.5,hw=lk?0.07:0.17,al=(lk?0.16:0.07)*P.lens;
      c.save();c.globalCompositeOperation='lighter';c.translate(sx,sy);c.rotate(ang);
      const gr=c.createLinearGradient(0,0,L,0);gr.addColorStop(0,rgba(lk?'#ffe6b0':'#ff9a6a',al*2));gr.addColorStop(1,'rgba(255,120,60,0)');
      c.fillStyle=gr;c.beginPath();c.moveTo(0.1,-0.12);c.lineTo(L,-L*hw);c.lineTo(L,L*hw);c.lineTo(0.1,0.12);c.closePath();c.fill();c.restore();}
    /* мазок: быстрый ход стрелы оставляет веер (принцип смазанного кадра) */
    for(const id of ['armR','armL']){const A=P.arms[id];if(!A||A.trail.length<3||!this.has(id))continue;
      const T=A.trail,d=Math.hypot(T[0].x-T[T.length-1].x,T[0].y-T[T.length-1].y);if(d<1.4)continue;
      const k=clamp((d-1.4)/2.5,0,1);c.save();c.globalCompositeOperation='lighter';
      for(let i=0;i<T.length-1;i++){const a=(1-i/(T.length-1))*0.32*k;
        c.fillStyle=rgba('#e8dcc0',a);c.beginPath();c.moveTo(T[i].x,T[i].y);c.lineTo(T[i+1].x,T[i+1].y);c.lineTo(T[i+1].mx,T[i+1].my);c.lineTo(T[i].mx,T[i].my);c.closePath();c.fill();}
      c.restore();}
    c.restore();
  }
  drawOverlay(c,t){
    super.drawOverlay(c,t);
    /* гарпун: трос от обоймы до крюка, крюк — в мире */
    const H=this.harp,A=this.P.arms.armR;if(!H||!A||this.dead)return;
    const o=this.wpt(A.hk),sag=H.mode==='pull'?0:(H.mode==='reel'?0.5:0.2),mx=(o.x+H.x)/2,my=(o.y+H.y)/2+sag;
    c.save();c.lineCap='round';
    c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=0.16;c.beginPath();c.moveTo(o.x,o.y);c.quadraticCurveTo(mx,my,H.x,H.y);c.stroke();
    c.strokeStyle=H.mode==='pull'?'#e0cfae':'#9aa3aa';c.lineWidth=0.08;c.beginPath();c.moveTo(o.x,o.y);c.quadraticCurveTo(mx,my,H.x,H.y);c.stroke();
    if(H.mode==='pull'){c.strokeStyle=rgba('#ff9c6a',0.35+0.25*Math.sin(t*40));c.lineWidth=0.03;c.stroke();}
    const ang=Math.atan2(H.y-o.y,H.x-o.x);c.translate(H.x,H.y);c.rotate(ang);
    if(Math.cos(ang)<0)c.scale(1,-1);
    this.drawHook(c,-0.25);
    c.restore();
    this.world.game.renderer.glowAdd(H.x,H.y,0.7,'#c8452f',0.45);
  }
  /* --- обломки --- */
  partDebris(n){
    if(n.id==='armR'||n.id==='armL'){const A=this.P.arms[n.id],L2=A?A.L2:OVS.L2;
      return {w:1.9,h:0.6,mass:1.6,mat:'iron',draw:(c,t)=>{
        MK.box(c,-0.9,-0.19,1.3,0.38,0.06,'iron',{tex:'rust',texA:0.35,bolts:0.035});
        if(L2>1.05)MK.box(c,0.35,-0.12,0.5,0.24,0.04,'steel',{});
        MK.box(c,0.75,-0.2,0.34,0.4,0.08,'steel',{});
        c.save();c.translate(0,0);this.drawHook(c,1.02);c.restore();
        MK.wires(c,-0.9,0,PI,n.seed,t,3);}};}
    if(n.id==='sensor')return {w:0.6,h:0.6,mass:0.4,mat:'glass',draw:(c,t)=>{MK.joint(c,0,0,0.34,'brass');c.fillStyle='#0b0d0f';c.beginPath();c.arc(0,0,0.26,0,TAU);c.fill();MK.cracks(c,0,0,0.28,n.seed,1);}};
    if(n.id==='treads')return {w:1.0,h:1.0,mass:1.2,mat:'brass',draw:(c,t)=>{
      c.fillStyle=MAT.brass.dk;for(let i=0;i<10;i++){c.save();c.rotate(i/10*TAU);c.fillRect(0.38,-0.06,0.15,0.12);c.restore();}
      MK.joint(c,0,0,0.42,'brass');}};
    return null;
  }
  corpseDebris(){
    return {w:4.6,h:1.7,mass:9,mat:'iron',draw:(c,t)=>{
      c.fillStyle='#141210';rr(c,-2.3,-0.05,4.6,0.9,0.42);c.fill();
      for(const wx of [-1.4,-0.5,0.4,1.3])MK.joint(c,wx,0.4,0.27,'soot');
      MK.box(c,-2.0,-0.85,3.8,0.85,0.12,'iron',{tex:'rust',texA:0.45,seams:[0.35,0.7]});
      Kit.hazardTape(c,1.0,-0.2,0.9,0.18);
      c.fillStyle='#120a05';rr(c,-1.8,-0.72,0.7,0.5,0.08);c.fill();
      const fl=0.35+0.25*Math.sin(t*4);c.fillStyle=rgba('#ff8a3a',fl);rr(c,-1.74,-0.66,0.58,0.36,0.06);c.fill();
      MK.cyl(c,-1.6,-1.5,0.3,0.7,'iron',{bands:[[0.2,0.05,'brass']]});}};
  }
  spriteBounds(){return {x:this.cx-6,y:this.bottom-6.6,w:12,h:7.0};}
}
