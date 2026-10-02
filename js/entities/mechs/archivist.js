"use strict";
/* ============================== АРХИВАРИУС ==============================
   Последний страж Печати — картотека Совета на ходу. Свинцовый шкаф с ящиками, вместо головы —
   читающий купол, на спине — раструб фонографа: им говорит Совет. Руки — телескопические штанги
   с зажимами для карточек. В груди, за свинцовым стеклом, — ЯДРО: первый цилиндр Совета, запись
   «СНАРУЖИ НИЧЕГО НЕТ». Три фазы — три разных умения:
   I   КАТАЛОГ (под сводом, на рельсе). До него не дотянуться. Он бросает свинцовые пломбы —
       импульс отбивает их обратно, в стекло. Руки бьют в пол по тени (сорвать импульсом в замах —
       рука рухнет и откроется), метут зал низом или по уровню площадок. Сопла пола — бегущей волной.
       Стекло разбито — трос рвётся.
   II  ПАУК (на полу). Руки стали ногами. Бросок через зал — рывок сквозь него (неуязвим), он
       врежется в стену и откроется; хватка — сорвать импульсом; раструб — кольцо голоса, рывок
       сквозь кольцо. Решётка на груди в лоб не берётся: вскрывается прерыванием или ударом о стену.
   III ПРОТИВ (на колесе Печати). Решётка сорвана — он лезет на колесо, пол заливает свинец.
       Ядро на люльке под шкафом — открыто, но по ритму прячется. Островки, крючья, двойной прыжок;
       кольца со словами записи, метла по площадке, капсулы, пар площадки, пока ядро спрятано. */
const ARC={FY:30,RAIL:3.4,RB:13.6,WX:25,WY:15.2,WB:18.4};
class Archivist extends MechBoss{
  constructor(world,x,y){
    super(world,{type:'archivist',w:3.6,h:4.4,hp:999,mass:9,bodyMat:'iron',name:'АРХИВАРИУС'},x,y);
    this.addNode({id:'glass',hp:160,r:0.8,mat:'glass',coreDmg:0,scrap:4});
    this.addNode({id:'handL',hp:150,r:0.62,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'handR',hp:150,r:0.62,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'horn',hp:140,r:0.62,mat:'brass',coreDmg:0,scrap:4});
    this.addNode({id:'cage',hp:200,r:0.82,mat:'iron',deflect:true,coreDmg:0,scrap:5,hidden:true});
    this.addNode({id:'core',hp:420,r:0.64,mat:'glass',core:true,locked:true,scrap:12,stump:false});
    this.md='rail';this.face=-1;this.cd=1.8;this.jt=0;this.jdir=1;this.walk=0;this.P={};this.woke=false;
    this.x=ARC.WX-this.w/2;this.y=ARC.RB-this.h;
    const hs=(sx)=>({x:this.cx+sx*2.4,y:16,tx:this.cx+sx*2.4,ty:16,k:5,fall:false,vy:0,surf:0});
    this.hand={L:hs(-1),R:hs(1)};this.act=null;this.turnT=0;this.drawerK=1;this.coreT=0;this.lead=null;this.said={};
    this.pose(0);
  }
  des(){return this.phase>=3?1.3:this.phase>=2?1.18:1;}
  /* камера: под сводом — шире и выше, на полу — ближе, на колесе — на колесо */
  get camZoom(){return this.md==='rail'||this.md==='drop'?0.64:this.md==='floor'?0.74:0.68;}
  camFrame(){if(this.md==='rail'||this.md==='drop')return {x:this.cx,y:this.bottom,w:0.3};
    if(this.md==='wheel'||this.md==='climb')return {x:ARC.WX,y:ARC.WB,w:0.3};return null;}
  /* до тела дотронуться можно только на полу: шкаф под сводом и на колесе — не обжигает */
  safe(){return super.safe()||this.md!=='floor';}
  threat(){if(super.threat())return true;return ['slam','sweep','lunge','grab'].indexOf(this.state)>=0;}
  isWinding(){return /Wind$/.test(this.state);}
  attackUses(n){const s=this.state,a=this.act;
    if((s==='slamWind'||s==='sweepWind')&&a)return n.id==='hand'+a.h;
    if(s==='grabWind')return n.id==='handL'||n.id==='handR';
    if(s==='hornWind'||s==='volleyWind'||s==='contraWind'||s==='dropsWind')return n.id==='horn'||n.id==='glass';
    if(s==='lungeWind')return n.id==='cage';
    return false;}
  cancelAttack(){super.cancelAttack();
    if(['open','stunWall','fall','climb','stuck'].indexOf(this.state)<0){this.state='recover';this.st=0;this.act=null;}}
  get coreX(){const n=this.node(this.has('glass')?'glass':this.has('cage')?'cage':'core');return n.wx;}
  get coreY(){const n=this.node(this.has('glass')?'glass':this.has('cage')?'cage':'core');return n.wy;}
  /* стекло берёт только отражённое; решётка — отражённое вполсилы, остальное — когда вскрыта */
  hitNode(n,h,behind){const g=this.world.game;
    if(n.id==='glass'&&h.kind!=='reflect'){n.hitT=0.08;g.fx.deflect(n.wx,n.wy,'glass');this.react(h,0.2);
      if(!this.said.glass){this.said.glass=1;g.hud.say('СВИНЦОВОЕ СТЕКЛО. ЕГО ПРОБЬЁТ ТОЛЬКО ЕГО ЖЕ ПЛОМБА.','');}return 'deflect';}
    if(n.id==='cage'&&h.kind==='reflect'&&n.exT<=0){h=Object.assign({},h,{dmg:h.dmg*0.5});n.exT=0.01;const r=super.hitNode(n,h,behind);n.exT=0;return r;}
    return super.hitNode(n,h,behind);}
  /* поверхность под точкой x (пол, площадки) — куда падает рука */
  surfAt(x,y0){let fy=ARC.FY;for(const s of this.world.room.solids){if(s.hidden||x<s.x||x>s.x+s.w)continue;if(s.y>=y0&&s.y<fy)fy=s.y;}return fy;}
  pSurf(){const p=this.world.player;return p.onGround?p.bottom:this.surfAt(p.cx,p.bottom-0.2);}
  handsUp(){return ['L','R'].filter(k=>this.has('hand'+k));}
  ai(dt){
    const p=this.world.player,g=this.world.game,W=this.world;
    this.st+=dt;this.cd-=dt;this.jt+=dt;
    if(!this.woke){this.woke=true;this.state='wake';this.st=0;}
    this.jets(dt);
    if(this.md==='rail')this.aiRail(dt,p,g,W);
    else if(this.md==='drop'){this.state='fall';}
    else if(this.md==='floor')this.aiFloor(dt,p,g,W);
    else if(this.md==='climb')this.aiClimb(dt,p,g,W);
    else if(this.md==='wheel')this.aiWheel(dt,p,g,W);
    this.updateLead(dt);
  }
  /* ---------- общие атаки рук ---------- */
  restHands(dt){const H=this.hand,t=this.t;
    if(this.md==='rail'){for(const k of ['L','R']){const h=H[k],s=k==='L'?-1:1;if(this.act&&this.act.h===k)continue;
      h.tx=this.cx+s*2.5+Math.sin(t*0.9+s)*0.3;h.ty=16.4+Math.sin(t*1.3+s)*0.4;h.k=5;}}
    else if(this.md==='floor'){for(const k of ['L','R']){const h=H[k],s=k==='L'?-1:1;if(this.act&&this.act.h===k)continue;
      const q=this.walk+(s>0?0:PI);h.tx=this.cx+s*2.3+Math.sin(q)*0.45;h.ty=ARC.FY-0.35-Math.max(0,Math.cos(q))*0.5;h.k=14;}}
    else if(this.md==='wheel'){for(const k of ['L','R']){const h=H[k],s=k==='L'?-1:1;if(this.act&&this.act.h===k)continue;
      const a=-PI/2+s*1.1+Math.sin(t*0.6)*0.08;h.tx=ARC.WX+Math.cos(a)*4.3;h.ty=ARC.WY+Math.sin(a)*4.3;h.k=6;}}
  }
  startSlam(k){const p=this.world.player;this.act={h:k,tx:clamp(p.cx,2,48)};this.state='slamWind';this.st=0;this.hitDone=false;
    this.world.game.audio.hydraulic(0.9);}
  startSweep(k){const p=this.world.player,sy=this.pSurf();const dir=p.cx<25?1:-1;
    this.act={h:k,dir:dir,x0:dir>0?1.6:48.4,y:sy-0.75};this.state='sweepWind';this.st=0;this.hitDone=false;
    this.world.game.audio.hydraulic(0.7);this.world.game.audio.elevator();}
  tickSlam(dt,p,g,W){if(['slamWind','slam','stuck'].indexOf(this.state)<0||!this.act||!this.act.h)return false;const a=this.act,h=this.hand[a.h],des=this.des();
    if(this.state==='slamWind'){const Wd=(this.md==='rail'?1.05:0.85)/des,k=this.st/Wd;
      if(k<0.65)a.tx=damp(a.tx,clamp(p.cx,2,48),4,dt);
      h.tx=a.tx;h.ty=this.md==='rail'?21.2:ARC.FY-5.6;h.k=8;
      this.telegraph(this.node('hand'+a.h),k,this.st>Wd-0.32);
      if(this.st>=Wd){this.state='slam';this.st=0;h.fall=true;h.vy=10;h.x=a.tx;h.surf=this.surfAt(a.tx,h.y+0.3);g.audio.steam(0.5);}
      return true;}
    if(this.state==='slam'){if(!h.fall){this.state='stuck';this.st=0;}return true;}
    if(this.state==='stuck'){const n=this.node('hand'+a.h);if(n&&!n.broken)n.exT=Math.max(n.exT,0.1);
      if(this.st>1.25){this.state='recover';this.st=0;this.act=null;}return true;}
    return false;}
  handImpact(k,h){const g=this.world.game,W=this.world,p=W.player;
    g.audio.explosion();g.audio.mat('brass',1);g.camera.addShake(0.7);g.hitstop(0.04);
    g.particles.burst(h.x,h.surf,24,{kind:'debris',col:'#6a6a70',spd:8,life:0.9,size:0.13,g:30});
    g.particles.spawn({kind:'shock',x:h.x,y:h.surf-0.1,ringR:2.6,life:0.3,size:0.08,col:'#cfe6ff',add:true,a:0.6});
    for(let i=0;i<10;i++)g.particles.spawn({kind:'debris',x:h.x+(Math.random()-0.5)*1.4,y:h.surf-0.2,vx:(Math.random()-0.5)*6,vy:-4-Math.random()*5,
      life:1.4,size:0.12,col:'#e8e0cc',g:14,rot:Math.random()*6,vr:(Math.random()-0.5)*10});
    if(!p.dead&&Math.abs(p.cx-h.x)<1.8&&p.bottom>h.surf-2.4&&p.bottom<=h.surf+0.3)this.damagePlayer(1,h.x);
    if(h.surf>=ARC.FY-0.01)for(const s of [-1,1])W.projectiles.push({x:h.x+s*1.2,y:ARC.FY-0.4,vx:s*7.5,vy:0,r:0.42,dmg:1,life:this.md==='rail'?1.3:2.0,kind:'wave'});
    const n=this.node('hand'+k);if(n&&!n.broken)n.exT=Math.max(n.exT,1.25);}
  tickSweep(dt,p,g,W){if(['sweepWind','sweep'].indexOf(this.state)<0||!this.act||!this.act.h)return false;const a=this.act,h=this.hand[a.h],des=this.des();
    if(this.state==='sweepWind'){const Wd=1.15/des;h.tx=a.x0;h.ty=a.y;h.k=7;
      this.telegraph(this.node('hand'+a.h),this.st/Wd,this.st>Wd-0.32);
      if(this.st>=Wd){this.state='sweep';this.st=0;h.x=a.x0;h.y=a.y;g.audio.dash();}
      return true;}
    if(this.state==='sweep'){h.x+=a.dir*(15+3*(des-1))*dt;h.tx=h.x;h.ty=a.y;h.y=a.y;h.k=40;
      if(Math.random()<dt*50)g.particles.spawn({kind:'spark',x:h.x,y:h.y+0.5,vx:-a.dir*4,vy:-1,life:0.3,size:0.05,col:'#ffcf7a',add:true,g:10});
      const pr=p.rect();if(!this.hitDone&&!p.dead&&h.x+0.7>pr.x&&h.x-0.7<pr.x+pr.w&&h.y+0.62>pr.y&&h.y-0.62<pr.y+pr.h){this.hitDone=true;this.damagePlayer(1,h.x-a.dir);}
      if((a.dir>0&&h.x>48.4)||(a.dir<0&&h.x<1.6)){this.state='recover';this.st=0;this.act=null;}
      return true;}
    return false;}
  /* залп свинцовых пломб: отбить импульсом — в стекло / решётку / ядро */
  tickVolley(dt,p,g,W){const des=this.des();
    if(this.state==='volleyWind'){const Wd=0.85/des,src=this.has('horn')&&this.md!=='rail'?this.node('horn'):this.node(this.has('glass')?'glass':'horn');
      this.telegraph(src,this.st/Wd,this.st>Wd-0.3);
      if(this.st>=Wd){this.state='volley';this.st=0;this.act={n:0,src:src};}
      return true;}
    if(this.state==='volley'&&this.act&&this.act.src){const a=this.act,N=this.phase>=3?4:3;
      if(a.n<N&&this.st>=a.n*0.32){const s=a.src,tx=clamp(p.cx+p.vx*0.25+(a.n-1)*0.8,1.5,48.5),ty=this.pSurf()-0.5;
        BossFX.seal(W,s.wx,s.wy,tx,ty,{T:this.md==='rail'?1.15:0.95,rdmg:50});a.n++;g.audio.mat('iron',0.8);g.audio.steam(0.3);}
      if(this.st>N*0.32+0.4){this.state='recover';this.st=0;this.act=null;}
      return true;}
    return false;}
  /* ---------- фаза I: под сводом ---------- */
  aiRail(dt,p,g,W){const des=this.des(),dd=p.cx-this.cx;
    if(this.tickSlam(dt,p,g,W)||this.tickSweep(dt,p,g,W)||this.tickVolley(dt,p,g,W)){this.vx=damp(this.vx,0,4,dt);this.restHands(dt);return;}
    this.restHands(dt);
    switch(this.state){
      case 'wake':this.vx=0;if(this.st>1.2){this.state='idle';this.st=0;this.cd=0.5;g.audio.bossRoar();g.camera.addShake(0.6);}break;
      case 'idle':{this.face=dd>0?1:-1;
        const tx=clamp(p.cx-Math.sign(dd||1)*3,8,42);this.vx=damp(this.vx,clamp((tx-this.cx)*1.2,-3.2,3.2),3,dt);
        if(this.cd<=0){const o=[],hs=this.handsUp();
          if(hs.length)o.push(['slam',3]);if(hs.length)o.push(['sweep',1.8]);
          if(this.has('glass'))o.push(['volley',this.said.vol?2.2:4]);
          if(!o.length)o.push(['volley',1]);
          const pk=BossFX.pick(o);
          if(pk==='slam'){const k=hs.sort((a,b)=>Math.abs(this.hand[a].x-p.cx)-Math.abs(this.hand[b].x-p.cx))[0];this.startSlam(k);}
          else if(pk==='sweep')this.startSweep(hs[(Math.random()*hs.length)|0]);
          else{this.state='volleyWind';this.st=0;this.said.vol=1;g.audio.tone(330,0.5,'sine',0.03,660);}}
        break;}
      case 'recover':this.vx=damp(this.vx,0,4,dt);if(this.st>0.6/des){this.state='idle';this.st=0;this.cd=(0.7+Math.random()*0.6)/des;}break;
      default:this.state='idle';this.st=0;
    }
  }
  /* стекло разбито: трос рвётся, шкаф падает */
  fallDown(){const g=this.world.game;this.cancelAttack();this.act=null;this.md='drop';this.state='fall';this.st=0;this.vy=-3;this.vx=0;
    for(const k of ['L','R']){const h=this.hand[k];h.fall=false;}
    g.audio.bossRoar();g.audio.mat('steel',1);g.camera.addShake(1.0);
    g.hud.say('«ВЫ НЕ ИМЕЕТЕ ПРАВА ЭТО СЛЫШАТЬ.»','АРХИВАРИУС');
    g.particles.burst(this.cx,ARC.RAIL+0.4,30,{kind:'spark',col:'#ffd27a',spd:9,life:0.8,size:0.06,add:true,g:20});}
  land(){const g=this.world.game,W=this.world,p=W.player;this.md='floor';this.state='recover';this.st=-0.8;this.phase=2;
    const cg=this.node('cage');cg.hidden=false;this.jt=0;
    g.audio.explosion();g.audio.explosion();g.camera.addShake(1.4);g.hitstop(0.12);
    g.particles.burst(this.cx,ARC.FY,60,{kind:'debris',col:'#6a6a70',spd:12,life:1.2,size:0.16,g:30});
    g.particles.burst(this.cx,ARC.FY-0.3,30,{kind:'smoke',col:'#3a3a40',spd:4,life:1.8,size:0.9,grow:1.2,drag:1.3,a:0.5});
    BossFX.ring(W,this.cx,ARC.FY-0.5,{vr:12,rmax:13,band:0.6,ground:true,col:'#cfe6ff'});
    if(Math.abs(p.cx-this.cx)<2.4&&p.bottom>ARC.FY-4)this.damagePlayer(1,this.cx);}
  /* ---------- фаза II: паук ---------- */
  aiFloor(dt,p,g,W){const des=this.des(),dd=p.cx-this.cx,ad=Math.abs(dd),want=dd>0?1:-1;
    if(this.tickSlam(dt,p,g,W)||this.tickSweep(dt,p,g,W)||this.tickVolley(dt,p,g,W)){this.vx=damp(this.vx,0,8,dt);this.restHands(dt);return;}
    this.restHands(dt);
    const H=this.hand,hs=this.handsUp();
    switch(this.state){
      case 'idle':{
        if(want!==this.face){this.turnT+=dt;if(this.turnT>0.45/des){this.face=want;this.turnT=0;g.audio.hydraulic(0.5);}}else this.turnT=0;
        const spd=(hs.length===2?3.0:hs.length?2.4:1.8)*des;
        this.vx=damp(this.vx,this.face===want&&ad>3.4?this.face*spd:0,3,dt);this.walk+=dt*Math.abs(this.vx)*1.3;
        if(this.cd<=0&&this.face===want){const o=[];
          if(ad>4.5)o.push(['lunge',2.6]);
          if(hs.length&&ad<4.2)o.push(['grab',3]);
          if(this.has('horn'))o.push(['horn',2.2]);
          if(ad>5)o.push(['volley',1.2]);
          if(hs.length)o.push(['slam',1.4]);
          if(hs.length&&ad>3)o.push(['sweep',1]);
          const pk=BossFX.pick(o);
          if(pk==='slam'){const k=hs.sort((a,b)=>Math.abs(H[a].x-p.cx)-Math.abs(H[b].x-p.cx))[0];this.startSlam(k);}
          else if(pk==='sweep')this.startSweep(hs[(Math.random()*hs.length)|0]);
          else{this.state=pk+'Wind';this.st=0;this.hitDone=false;
            if(pk==='lunge'){g.audio.hydraulic(1);g.audio.elevator();}else if(pk==='grab')g.audio.hydraulic(0.8);
            else if(pk==='horn')g.audio.tone(140,0.9,'sawtooth',0.03,70);else g.audio.tone(330,0.5,'sine',0.03,660);}}
        break;}
      case 'lungeWind':{const Wd=0.85/des;this.vx=damp(this.vx,-this.face*1.2,6,dt);
        this.telegraph(this.node('cage'),this.st/Wd,this.st>Wd-0.32);
        if(this.st>=Wd){this.state='lunge';this.st=0;this.hitDone=false;g.audio.dash();}
        break;}
      case 'lunge':{this.vx=this.face*13.5;this.walk+=dt*16;
        if(Math.random()<dt*60)g.particles.spawn({kind:'dust',x:this.cx-this.face*1.6,y:this.bottom,vx:-this.face*3,vy:-1.4,life:0.6,size:0.2,col:'#6a6a70',g:4});
        if(this.wall!==0||this.x<=0.1||this.x+this.w>=this.world.room.w-0.1){
          g.audio.explosion();g.camera.addShake(1.1);g.hitstop(0.1);this.vx=0;
          g.particles.burst(this.cx+this.face*1.8,this.cy,30,{kind:'debris',col:'#6a6a70',spd:9,life:1,size:0.16,g:26});
          for(let i=0;i<14;i++)g.particles.spawn({kind:'debris',x:this.cx,y:this.cy-1,vx:(Math.random()-0.5)*7,vy:-3-Math.random()*5,life:1.6,size:0.12,col:'#e8e0cc',g:12,rot:Math.random()*6,vr:(Math.random()-0.5)*10});
          this.state='stunWall';this.st=0;const cg=this.node('cage');if(!cg.broken)cg.exT=Math.max(cg.exT,1.7);
          for(const k of ['L','R']){const n=this.node('hand'+k);if(!n.broken)n.exT=Math.max(n.exT,1.7);}}
        else if(this.st>3.6){this.state='recover';this.st=0;}
        break;}
      case 'stunWall':this.vx=0;if(this.st>1.7){this.state='recover';this.st=0;}break;
      case 'grabWind':{const Wd=0.75/des;this.vx=damp(this.vx,0,8,dt);
        for(const k of hs){const h=H[k];h.tx=this.cx+this.face*1.6;h.ty=ARC.FY-4.2+(k==='L'?-0.4:0.4);h.k=9;
          this.telegraph(this.node('hand'+k),this.st/Wd,this.st>Wd-0.3);}
        if(this.st>=Wd){this.state='grab';this.st=0;g.audio.mat('brass',1);g.audio.hydraulic(1);
          const hb={x:this.face>0?this.cx+1.2:this.cx-1.2-3.2,y:ARC.FY-3.4,w:3.2,h:3.4};
          if(!p.dead&&aabb(hb,p.rect())&&this.damagePlayer(1,this.cx)){p.vx=this.face*15;p.vy=-9;}}
        break;}
      case 'grab':for(const k of hs){const h=H[k];h.tx=this.cx+this.face*3.0;h.ty=ARC.FY-1.4;h.k=22;}
        if(this.st>0.45){this.state='recover';this.st=0;}break;
      case 'hornWind':{const Wd=1.0/des;this.vx=damp(this.vx,0,8,dt);this.telegraph(this.node('horn'),this.st/Wd,this.st>Wd-0.34);
        if(this.st>=Wd){this.state='horn';this.st=0;this.act={n:0};}
        break;}
      case 'horn':{const a=this.act,N=this.phase>=2&&this.des()>1.1?2:1,hn=this.node('horn');
        if(a&&a.n<N&&this.st>=a.n*0.55){a.n++;BossFX.ring(W,hn.wx,hn.wy,{vr:10,rmax:24,band:0.6,col:'#cfe6ff',label:a.n===1?'ТИШЕ':'ТИШЕ'});
          g.audio.tone(110,0.7,'sawtooth',0.04,55);g.camera.addShake(0.4);}
        if(this.st>N*0.55+0.3){this.state='recover';this.st=0;this.act=null;}
        break;}
      case 'recover':this.vx=damp(this.vx,0,6,dt);if(this.st>0.65/des){this.state='idle';this.st=0;this.cd=(0.6+Math.random()*0.5)/des;}break;
      case 'fall':break;
      default:this.state='idle';this.st=0;
    }
  }
  /* решётка сорвана: лезет на колесо, пол заливает свинец */
  startClimb(){const g=this.world.game,W=this.world,R=W.room;this.cancelAttack();this.act=null;this.md='climb';this.state='climb';this.st=0;
    this.cl={x0:this.cx,b0:this.bottom};const c=this.node('core');c.locked=false;
    g.audio.bossRoar();g.camera.addShake(1.0);g.hud.say('«СНАРУЖИ НИЧЕГО НЕТ. СНАРУЖИ НИЧЕГО НЕТ. СНАРУЖИ…»','АРХИВАРИУС');
    this.lead={x:10,y:30.6,w:30,h:0.1,kind:'leadwarn',look:'molten',ctl:'archlead',k:0,
      back:{x:6.6-0.4,y:25.6-1.72},backs:[{minX:0,x:6.2,y:25.6-1.72},{minX:25,x:42.6,y:25.6-1.72}]};
    R.hazards.push(this.lead);}
  aiClimb(dt,p,g,W){const T=1.5,k=clamp(this.st/T,0,1),c=this.cl;
    const x=lerp(c.x0,ARC.WX,EZ.io(k)),b=lerp(c.b0,ARC.WB,EZ.io(k))-Math.sin(k*PI)*3.5;
    this.x=x-this.w/2;this.y=b-this.h;this.vx=0;this.vy=0;this.face=p.cx>this.cx?1:-1;
    for(const kk of ['L','R']){const h=this.hand[kk],s=kk==='L'?-1:1;h.tx=ARC.WX+s*4.3;h.ty=ARC.WY;h.k=4;}
    if(k>=1){this.md='wheel';this.phase=3;this.state='recover';this.st=0;this.coreT=0;g.audio.mat('brass',1);g.camera.addShake(0.6);}}
  /* свинец поднимается: сначала трещины светятся, потом заливает центр зала */
  updateLead(dt){const L=this.lead;if(!L)return;L.k+=dt;
    if(L.k<2.2){L.y=30.6;L.h=0.1;L.kind='leadwarn';return;}
    const r=EZ.out(clamp((L.k-2.2)/2.4,0,1));L.y=30.4-1.5*r;L.h=30.6-L.y+0.6;L.kind=L.y<29.95?'pit':'leadwarn';}
  /* ---------- фаза III: на колесе ---------- */
  aiWheel(dt,p,g,W){const des=this.des(),R=W.room;
    /* ритм люльки: ядро открыто 5 с, спрятано 2.4 с */
    this.coreT+=dt;const cyc=this.coreT%7.4,open=cyc<5.0;this.drawerK=damp(this.drawerK,open?1:0,7,dt);
    const cn=this.node('core');cn.locked=this.drawerK<0.55;
    if(Math.abs(cyc-5.0)<dt*1.01)g.audio.hydraulic(0.7);
    /* пар площадки под колесом — пока ядро спрятано */
    const J=(R.hazards||[]).filter(h=>h.ctl==='arch3'),hc=cyc-5.0;
    J.forEach((h,i)=>{const half=(p.cx<ARC.WX?0:1)===i;h.warn=!open&&hc<0.8&&half;h.active=!open&&hc>=0.8&&hc<2.2&&half;
      if(h.active&&Math.random()<dt*60)g.particles.spawn({kind:'steam',x:h.x+Math.random()*h.w,y:h.y+h.h,vx:(Math.random()-0.5)*1.4,vy:-7-Math.random()*4,life:0.8,size:0.45,grow:1.3,col:'#e8e0d0',drag:0.8});});
    this.face=p.cx>this.cx?1:-1;
    if(this.tickSweep(dt,p,g,W)||this.tickVolley(dt,p,g,W)){this.restHands(dt);return;}
    this.restHands(dt);
    switch(this.state){
      case 'idle':if(this.cd<=0){const o=[['contra',2.6],['drops',1.8],['volley',1.5]],hs=this.handsUp();
          if(hs.length)o.push(['sweep',2.4]);
          const pk=BossFX.pick(o);
          if(pk==='sweep')this.startSweep(hs[(Math.random()*hs.length)|0]);
          else{this.state=pk+'Wind';this.st=0;g.audio.tone(pk==='contra'?160:330,0.6,'sine',0.03,pk==='contra'?80:660);}}
        break;
      case 'contraWind':{const Wd=0.9/des;this.telegraph(this.node('horn'),this.st/Wd,this.st>Wd-0.3);
        if(this.st>=Wd){this.state='contra';this.st=0;this.act={n:0};}break;}
      case 'contra':{const a=this.act,WD=['СНАРУЖИ','НИЧЕГО','НЕТ'];
        if(a&&a.n<3&&this.st>=a.n*0.6){const x=this.has('horn')?this.node('horn').wx:this.cx,y=this.has('horn')?this.node('horn').wy:this.cy;
          BossFX.ring(W,x,y,{vr:8.5,rmax:30,band:0.55,col:'#ffe6a3',label:WD[a.n]});a.n++;g.audio.tone(120,0.6,'sawtooth',0.035,60);g.camera.addShake(0.3);}
        if(this.st>2.0){this.state='recover';this.st=0;this.act=null;}break;}
      case 'dropsWind':{const Wd=0.7/des;this.telegraph(this.node('horn'),this.st/Wd,this.st>Wd-0.28);
        if(this.st>=Wd){this.state='drops';this.st=0;
          const xs=[p.cx,p.cx-3.2,p.cx+3.2,p.cx+(Math.random()<0.5?-6:6)];
          xs.forEach((x,i)=>BossFX.drop(W,clamp(x,1.5,48.5),{look:'capsule',r:0.42,rad:1.3,delay:0.7+i*0.18}));g.audio.mat('brass',0.6);}
        break;}
      case 'drops':if(this.st>0.8){this.state='recover';this.st=0;}break;
      case 'recover':if(this.st>0.6/des){this.state='idle';this.st=0;this.cd=(0.5+Math.random()*0.5)/des;}break;
      default:this.state='idle';this.st=0;
    }
  }
  /* сопла пола: фаза I — бегущая волна раз в 9 с; фаза II — весь пол, раз в 7.5 с; дальше — под свинцом */
  jets(dt){const R=this.world.room,g=this.world.game,J=(R.hazards||[]).filter(h=>h.ctl==='arch');
    for(const h of J){h.warn=false;h.active=false;}
    if(this.md==='rail'){const T=this.jt%9;if(T<dt)this.jdir=-this.jdir;
      for(let k=0;k<J.length;k++){const st=3+k*0.45,h=J[this.jdir>0?k:J.length-1-k];if(T>=st&&T<st+0.7)h.warn=true;else if(T>=st+0.7&&T<st+1.4)h.active=true;}}
    else if(this.md==='floor'){const T=this.jt%7.5;for(const h of J){h.warn=T>=5&&T<6;h.active=T>=6&&T<7.3;}}
    for(const h of J)if(h.active&&Math.random()<dt*60)g.particles.spawn({kind:'steam',x:h.x+Math.random()*h.w,y:h.y+h.h,
      vx:(Math.random()-0.5)*1.4,vy:-6-Math.random()*4,life:0.7,size:0.45,grow:1.3,col:'#e8e0d0',drag:0.8});}
  physics(dt){
    if(this.md==='floor'){super.physics(dt);return;}
    if(this.md==='drop'){this.vy+=CFG.gravity*dt;this.y+=this.vy*dt;if(this.bottom>=ARC.FY){this.y=ARC.FY-this.h;this.vy=0;this.land();}return;}
    if(this.md==='rail'){this.vy=0;this.x+=this.vx*dt;this.x=clamp(this.x,7-this.w/2,43-this.w/2);this.y=ARC.RB-this.h;return;}
    if(this.md==='wheel'){this.vx=0;this.vy=0;this.x=ARC.WX-this.w/2;this.y=ARC.WB-this.h+Math.sin(this.t*1.1)*0.06;}
  }
  onBreak(n,h){const g=this.world.game;
    if(n.core){super.onBreak(n,h);return;}
    g.audio.bossRoar();
    if(n.id==='glass'){g.audio.mat('glass',1);g.flash(0.25,'#bfe3ff');this.world.later(500,()=>{if(!this.dead)this.fallDown();});}
    if(n.id==='cage'){g.audio.clatter('iron',1);this.world.later(400,()=>{if(!this.dead)this.startClimb();});}
    if(n.id==='handL'||n.id==='handR'){const k=n.id.slice(4);if(this.act&&this.act.h===k){this.act=null;this.state='recover';this.st=0;}}
    if(n.id==='horn')g.hud.say('РАСТРУБ СМЯТ. СОВЕТ ГОВОРИТ ШЁПОТОМ.','');
  }
  onInterrupt(n){const g=this.world.game;
    /* сорванный замах руки: рука рушится и лежит открытой */
    if(n.id==='handL'||n.id==='handR'){const k=n.id.slice(4),h=this.hand[k];h.fall=true;h.vy=4;h.surf=this.surfAt(h.x,h.y+0.3);this.act={h:k,dropped:true};
      n.exT=Math.max(n.exT,2.0);}
    if(this.md==='floor'){const cg=this.node('cage');if(!cg.broken&&!cg.hidden)cg.exT=Math.max(cg.exT,1.8);}
    if(n.id==='horn')g.audio.tone(90,0.5,'square',0.03,40);
  }
  onDeath(h){const g=this.world.game;if(this.lead){this.lead.kind='leadwarn';}
    g.hud.say('ЦИЛИНДР ТРЕСНУЛ. ЗАПИСЬ ОБОРВАЛАСЬ НА СЛОВЕ «СНАРУЖИ».','');}
  /* ---------- поза: руки (мир) → узлы (локально) ---------- */
  pose(dt){
    const P=this.P,t=this.t,H=this.hand;dt=dt||0;
    for(const k of ['L','R']){const h=H[k];
      if(h.fall){h.vy+=60*dt;h.y+=h.vy*dt;if(h.y+0.5>=h.surf){h.y=h.surf-0.5;h.fall=false;h.vy=0;if(dt)this.handImpact(k,h);}}
      else if(dt){h.x=damp(h.x,h.tx,h.k,dt);h.y=damp(h.y,h.ty,h.k,dt);}}
    /* после сорванного замаха рука лежит, пока окно не закроется */
    if(this.act&&this.act.dropped&&this.state!=='open'){this.act=null;}
    if(this.act&&this.act.dropped){const h=H[this.act.h];h.tx=h.x;h.ty=h.y;}
    const L=(wx,wy)=>({x:(wx-this.cx)*this.face,y:wy-this.bottom});
    P.sh={L:L(this.cx-1.75,this.bottom-3.5),R:L(this.cx+1.75,this.bottom-3.5)};
    P.hd={L:L(H.L.x,H.L.y),R:L(H.R.x,H.R.y)};
    for(const k of ['L','R']){const n=this.node('hand'+k);n.lx=P.hd[k].x;n.ly=P.hd[k].y;}
    const chest={x:0.25,y:-2.3};
    for(const id of ['glass','cage']){const n=this.node(id);n.lx=chest.x;n.ly=chest.y;}
    const cn=this.node('core');
    if(this.md==='wheel'){const d=this.drawerK;cn.lx=0;cn.ly=lerp(-1.2,1.25,d);}else{cn.lx=chest.x;cn.ly=chest.y;}
    const hn=this.node('horn');hn.lx=0.95;hn.ly=-6.05+Math.sin(t*1.2)*0.05;
  }
  /* ---------- рисунок ---------- */
  draw(c,t){
    const s=this.state,cn=this.node('core'),thr=this.threat();
    /* люлька с цилиндром (фаза III) — под шкафом */
    if(this.md==='wheel'||this.md==='climb'){const y=cn.ly;
      c.strokeStyle='#2a2620';c.lineWidth=0.08;c.beginPath();c.moveTo(-0.5,-0.4);c.lineTo(-0.5,y);c.moveTo(0.5,-0.4);c.lineTo(0.5,y);c.stroke();
      MK.box(c,-0.75,y-0.2,1.5,0.4,0.08,'brass',{});
      if(!cn.broken){const pl=0.6+0.3*Math.sin(t*5);c.fillStyle='#14161a';rr(c,-0.5,y-0.78,1.0,0.6,0.08);c.fill();
        const gr=c.createLinearGradient(0,y-0.78,0,y-0.18);gr.addColorStop(0,rgba('#fff6dd',pl));gr.addColorStop(1,rgba('#9fd6ff',0.7*pl));
        c.fillStyle=gr;rr(c,-0.42,y-0.72,0.84,0.48,0.06);c.fill();c.fillStyle='#c9a227';c.fillRect(-0.46,y-0.76,0.08,0.56);c.fillRect(0.38,y-0.76,0.08,0.56);
        this.world.game.renderer.glowAdd(this.cx,this.bottom+y-0.45,1.4,'#bfe3ff',0.45*pl*this.drawerK);}}
    /* задние ноги-тумбы (на полу) */
    if(this.md==='floor'||this.md==='drop'){for(const x of [-1.3,1.1]){c.fillStyle='#24262a';rr(c,x-0.22,-0.7,0.44,0.7,0.06);c.fill();c.fillStyle='#8a6d2a';c.fillRect(x-0.3,-0.12,0.6,0.12);}}
    /* шкаф: свинец, ящики картотеки */
    const g=c.createLinearGradient(-1.8,-4.4,1.8,-0.6);g.addColorStop(0,'#7c8189');g.addColorStop(0.5,'#4f545b');g.addColorStop(1,'#2a2d32');
    c.fillStyle=g;rr(c,-1.8,-4.5,3.6,3.9,0.16);c.fill();c.strokeStyle='#1a1c20';c.lineWidth=0.05;c.stroke();
    for(let r=0;r<4;r++)for(let q=0;q<3;q++){const x=-1.62+q*1.1,y=-4.32+r*0.92;if(q>=1&&r>=1&&r<=2)continue;
      const open=((r*3+q)*7)%5===0?0.12:0;
      c.fillStyle='#3a3e44';rr(c,x,y,0.98,0.8,0.05);c.fill();c.strokeStyle='#202226';c.lineWidth=0.03;c.stroke();
      c.fillStyle='#e8e0cc';c.fillRect(x+0.28,y+0.14-open,0.42,0.18+open);c.fillStyle='#8a6d2a';c.fillRect(x+0.36,y+0.46,0.26,0.07);
      if(open){c.fillStyle='#d8cdb6';for(let i=0;i<3;i++)c.fillRect(x+0.2+i*0.2,y-0.08,0.16,0.14);}}
    /* грудное окно: стекло / решётка / пустая оправа */
    const cx=0.25,cy=-2.3;
    c.fillStyle='#14161a';c.beginPath();c.arc(cx,cy,0.9,0,TAU);c.fill();
    if(this.md!=='wheel'&&this.md!=='climb'&&!cn.broken){const pl=0.6+0.3*Math.sin(t*3);
      const gr=c.createRadialGradient(cx,cy,0,cx,cy,0.75);gr.addColorStop(0,rgba('#fff6dd',pl));gr.addColorStop(0.6,rgba('#9fd6ff',0.7*pl));gr.addColorStop(1,'rgba(60,90,120,.2)');
      c.fillStyle=gr;c.beginPath();c.arc(cx,cy,0.75,0,TAU);c.fill();
      c.fillStyle='#c9a227';c.fillRect(cx-0.42,cy-0.5,0.84,0.12);c.fillRect(cx-0.42,cy+0.38,0.84,0.12);
      c.fillStyle=rgba('#fff2d0',0.8*pl);c.fillRect(cx-0.34,cy-0.38,0.68,0.76);
      this.world.game.renderer.glowAdd(this.cx+this.face*cx,this.bottom+cy,1.6,'#bfe3ff',0.35*pl);}
    if(this.has('glass')){c.fillStyle='rgba(70,90,110,.55)';c.beginPath();c.arc(cx,cy,0.82,0,TAU);c.fill();
      c.strokeStyle='rgba(220,240,255,.6)';c.lineWidth=0.04;c.beginPath();c.arc(cx,cy,0.66,PI*1.1,PI*1.5);c.stroke();}
    else{c.strokeStyle='rgba(200,220,235,.7)';c.lineWidth=0.03;for(let i=0;i<7;i++){const a=i/7*TAU;c.beginPath();c.moveTo(cx+Math.cos(a)*0.9,cy+Math.sin(a)*0.9);c.lineTo(cx+Math.cos(a+0.2)*0.66,cy+Math.sin(a+0.2)*0.7);c.stroke();}}
    if(this.has('cage')&&!this.node('cage').hidden){c.strokeStyle='#1c1a18';c.lineWidth=0.12;
      for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(cx+i*0.3,cy-0.86);c.lineTo(cx+i*0.3,cy+0.86);c.stroke();}
      c.beginPath();c.moveTo(cx-0.86,cy);c.lineTo(cx+0.86,cy);c.stroke();
      c.strokeStyle='#5a5048';c.lineWidth=0.05;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(cx+i*0.3-0.03,cy-0.84);c.lineTo(cx+i*0.3-0.03,cy+0.84);c.stroke();}}
    c.strokeStyle='#b08d3e';c.lineWidth=0.12;c.beginPath();c.arc(cx,cy,0.92,0,TAU);c.stroke();
    for(let i=0;i<8;i++){const a=i/8*TAU;MK.bolt(c,cx+Math.cos(a)*1.04,cy+Math.sin(a)*1.04,0.05,'brass');}
    Kit.stencil(c,-1.6,-0.9,'КАТАЛОГ · СОВЕТ',0.18,'rgba(232,201,106,.55)',0.5);
    /* читающий купол */
    c.save();c.translate(0,-4.5);c.beginPath();c.arc(0,0,0.95,PI,0);c.closePath();
    c.fillStyle=MK.plateGrad(c,'brass',-0.95,-0.95,1.9,0.95);c.fill();c.strokeStyle=MAT.brass.ed;c.lineWidth=0.04;c.stroke();
    const eye=thr?'#ff3b22':(s==='stunWall'||s==='open'?'#69d68f':'#fff2c0');
    MK.lens(c,0.32,-0.38,0.2,eye,1);c.restore();
    this.world.game.renderer.glowAdd(this.cx+this.face*0.32,this.bottom-4.88,0.9,eye,0.5);
    /* раструб фонографа */
    if(this.has('horn')){c.save();c.strokeStyle='#5a4420';c.lineWidth=0.22;c.beginPath();c.moveTo(-0.9,-4.6);c.quadraticCurveTo(-1.2,-5.9,0.2,-6.0);c.stroke();
      c.translate(0.95,-6.05);c.rotate(-0.25);
      const hg=c.createLinearGradient(-0.8,0,0.5,0);hg.addColorStop(0,'#5a4420');hg.addColorStop(0.6,'#c9a227');hg.addColorStop(1,'#f0d27a');
      c.fillStyle=hg;c.beginPath();c.moveTo(-0.8,-0.1);c.quadraticCurveTo(0.1,-0.2,0.4,-0.75);c.lineTo(0.55,0.75);c.quadraticCurveTo(0.1,0.2,-0.8,0.1);c.closePath();c.fill();
      c.fillStyle='#1a140c';c.beginPath();c.ellipse(0.48,0,0.12,0.72,0,0,TAU);c.fill();c.restore();}
    else MK.stump(c,-0.4,-5.2,0.16,-1.2,this.node('horn').seed,t,'brass');
  }
  /* руки рисуются поверх (через весь зал они не помещаются в спрайт с обводкой) */
  drawOverlay(c,t){
    if(this.dead)return;
    const H=this.hand,P=this.P,thr=this.threat();
    c.save();
    /* трос и тележка на рельсе */
    if(this.md==='rail'||this.md==='drop'){const top=this.bottom-4.5-0.9;
      if(this.md==='rail'){c.strokeStyle='#1c1c20';c.lineWidth=0.09;for(const s of [-0.9,0.9]){c.beginPath();c.moveTo(this.cx+s,top);c.lineTo(this.cx+s*0.6,ARC.RAIL+0.5);c.stroke();}
        MK.box(c,this.cx-1.2,ARC.RAIL-0.1,2.4,0.7,0.1,'steel',{bolts:0.04});
        for(const s of [-0.7,0.7]){c.fillStyle='#2a2620';c.beginPath();c.arc(this.cx+s,ARC.RAIL-0.1,0.26,0,TAU);c.fill();}}}
    for(const k of ['L','R']){const n=this.node('hand'+k),h=H[k],sx=this.cx+(k==='L'?-1.75:1.75),sy=this.bottom-3.5;
      MK.joint(c,sx,sy,0.24,'brass');
      if(n.broken){MK.stump(c,sx,sy,0.18,Math.atan2(h.y-sy,h.x-sx),n.seed,t,'steel');continue;}
      const dx=h.x-sx,dy=h.y-sy,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
      /* телескоп: три колена */
      const hot=n.teleHot||(thr&&this.act&&this.act.h===k);
      c.strokeStyle=hot?'rgba(255,64,36,.9)':'rgba(10,10,12,.85)';c.lineCap='round';c.lineWidth=0.42;c.beginPath();c.moveTo(sx,sy);c.lineTo(h.x,h.y);c.stroke();
      const segs=[[0,0.4,0.3,'steel'],[0.38,0.75,0.22,'steel'],[0.73,1,0.15,'brass']];
      for(const q of segs)MK.seg(c,sx+dx*q[0],sy+dy*q[0],sx+dx*q[1],sy+dy*q[1],q[2],q[3],{});
      for(const q of [0.39,0.74])MK.joint(c,sx+dx*q,sy+dy*q,0.12,'brass');
      c.save();c.translate(h.x,h.y);c.rotate(Math.atan2(uy,ux));
      c.fillStyle='rgba(10,10,12,.85)';rr(c,-0.3,-0.62,1.05,1.24,0.12);c.fill();
      MK.box(c,-0.24,-0.5,0.5,1.0,0.08,'brass',{bolts:0.04});
      for(const sd of [-1,1]){c.fillStyle=MK.plateGrad(c,'steel',0,-0.5,0.7,1);c.beginPath();c.moveTo(0.2,sd*0.42);c.lineTo(0.68,sd*0.3);c.lineTo(0.7,sd*0.12);c.lineTo(0.22,sd*0.18);c.closePath();c.fill();}
      c.fillStyle='#e8e0cc';c.fillRect(0.3,-0.16,0.5,0.32);c.fillStyle='#7a2a1c';c.fillRect(0.34,-0.06,0.4,0.04);
      c.restore();
      if(this.state==='slamWind'&&this.act&&this.act.h===k){const fy=this.surfAt(this.act.tx,h.y+0.3),k2=clamp(this.st/(1.05/this.des()),0,1);
        c.fillStyle=rgba('#000',0.25+0.3*k2);c.beginPath();c.ellipse(this.act.tx,fy-0.05,1.0+0.8*k2,0.2,0,0,TAU);c.fill();
        c.strokeStyle=rgba('#ff5a3a',0.35+0.55*k2);c.lineWidth=0.07;c.beginPath();c.ellipse(this.act.tx,fy-0.05,1.8,0.26,0,0,TAU);c.stroke();}}
    /* свинец: перед заливкой трещины пола светятся */
    if(this.lead&&this.lead.k<2.2){const a=0.3+0.5*Math.abs(Math.sin(t*8));c.strokeStyle=rgba('#ff8a3a',a);c.lineWidth=0.08;
      for(let i=0;i<9;i++){const x=10.6+i*3.3;c.beginPath();c.moveTo(x,ARC.FY);c.lineTo(x+0.8,ARC.FY-0.1);c.lineTo(x+1.6,ARC.FY);c.stroke();}
      this.world.game.renderer.glowAdd(25,ARC.FY,12,'#ff8a3a',0.25*a);}
    c.restore();
    super.drawOverlay(c,t);
  }
  partDebris(n){
    if(n.id==='handL'||n.id==='handR')return {w:1.0,h:1.0,mass:1.2,mat:'brass',draw:(c,t)=>{MK.box(c,-0.24,-0.5,0.5,1.0,0.08,'brass',{bolts:0.04});c.fillStyle='#e8e0cc';c.fillRect(0.1,-0.16,0.5,0.32);}};
    if(n.id==='horn')return {w:1.2,h:1.4,mass:0.8,mat:'brass',draw:(c,t)=>{c.fillStyle='#c9a227';c.beginPath();c.moveTo(-0.6,-0.1);c.lineTo(0.4,-0.7);c.lineTo(0.5,0.7);c.lineTo(-0.6,0.1);c.closePath();c.fill();}};
    if(n.id==='glass')return {w:0.8,h:0.8,mass:0.3,mat:'glass',draw:(c,t)=>{c.fillStyle='rgba(120,150,175,.8)';c.beginPath();c.moveTo(-0.4,-0.2);c.lineTo(0.3,-0.4);c.lineTo(0.4,0.3);c.lineTo(-0.2,0.4);c.closePath();c.fill();}};
    if(n.id==='cage')return {w:1.6,h:1.6,mass:1.4,mat:'iron',draw:(c,t)=>{c.strokeStyle='#2a2622';c.lineWidth=0.12;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*0.3,-0.8);c.lineTo(i*0.3,0.8);c.stroke();}}};
    return null;
  }
  corpseDebris(){
    return {w:3.6,h:2.0,mass:8,mat:'iron',draw:(c,t)=>{
      const g=c.createLinearGradient(-1.8,-1,1.8,1);g.addColorStop(0,'#5f646b');g.addColorStop(1,'#2a2d32');c.fillStyle=g;rr(c,-1.8,-1,3.6,2,0.14);c.fill();
      for(let q=0;q<3;q++){c.fillStyle='#3a3e44';rr(c,-1.62+q*1.1,-0.8,0.98,0.7,0.05);c.fill();c.fillStyle='#e8e0cc';c.fillRect(-1.34+q*1.1,-0.66,0.42,0.16);}
      c.fillStyle='#14161a';c.beginPath();c.arc(0.2,0.45,0.42,0,TAU);c.fill();}};
  }
  spriteBounds(){return {x:this.cx-3.2,y:this.bottom-7.6,w:6.4,h:this.md==='wheel'||this.md==='climb'?10:8.2};}
}
