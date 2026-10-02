"use strict";
/* ============================== INTERACTABLE / PUSHABLE ============================== */
class Interactable{
  constructor(def,world){this.def=def;this.x=def.x;this.y=def.y;this.w=def.w||1.6;this.h=def.h||1.8;this.world=world;}
  rect(){return {x:this.x-this.w/2,y:this.y-this.h,w:this.w,h:this.h};}
  canUse(gs){const d=this.def;
    if(d.kind==='salvage'||d.kind==='lever'||d.kind==='valve'||d.kind==='gauge'||d.kind==='wheel'||d.kind==='mapplate')return !gs.flags[d.flag];
    if(d.kind==='lore')return !gs.loreIds[d.loreId];
    if(d.kind==='station'||d.kind==='postmaster')return true;
    if(d.kind==='talk'){if(gs.flags[d.flag]&&!d.again)return false;return d.ready?d.ready(this.world):true;}
    if(d.kind==='salvageBlocked'){
      if(gs.flags[d.flag])return false;
      const pb=this.world.pushables.find(p=>p.id===d.need);
      return !pb||pb.pushed;}
    return true;}
  prompt(){const d=this.def;
    if(d.kind==='salvage'||d.kind==='salvageBlocked')return 'САЛЬВАЖ · '+d.title;
    if(d.kind==='lore')return 'ИЗВЛЕЧЬ ЦИЛИНДР';
    if(d.kind==='talk')return 'ГОВОРИТЬ · '+d.title;
    if(d.kind==='wheel')return 'ВРАЩАТЬ КОЛЕСО ПЕЧАТИ';
    if(d.kind==='mapplate')return 'СКОПИРОВАТЬ СХЕМУ · '+d.title;
    if(d.kind==='station')return 'ПНЕВМОПОЧТА · '+(STATIONS[d.station]?STATIONS[d.station].name:'');
    if(d.kind==='postmaster')return 'ГОВОРИТЬ · ПОЧТМЕЙСТЕР';
    return d.label||'ОСМОТРЕТЬ';}
  use(game){
    const gs=game.gs,d=this.def,w=this.world;
    if(!this.canUse(gs))return;
    if(d.kind==='lever'||d.kind==='valve'){
      gs.flag(d.flag);game.audio.lever();game.camera.addShake(0.4);this.usedAt=w.time;
      if(d.kind==='valve'&&d.post){
        /* главный клапан пневмосети: магистраль под давлением — станции оживают по всей аркологии */
        w.later(700,()=>{game.audio.elevator();game.camera.addShake(0.5);});
        game.hud.say('МАГИСТРАЛЬ ПОД ДАВЛЕНИЕМ. ПНЕВМОПОЧТА ЖИВА.','СТАНЦИИ — В ХАБАХ ЗОН');
      }else if(d.kind==='valve'){
        /* два клапана = давление: гермодверь к Примарху открывается сразу, без обходных флагов */
        const n=(gs.flags.valve_l?1:0)+(gs.flags.valve_r?1:0);
        if(n>=2){gs.flag('turbines_on');w.later(900,()=>{game.audio.gate();game.camera.addShake(0.6);});
          game.hud.say('ТУРБИНЫ ПОШЛИ.','ДАВЛЕНИЕ 2/2');}
        else game.hud.say('НА ВЕНТИЛЕ — ПЛОМБА СОВЕТА. ЕГО ЗАКРЫЛИ НАРОЧНО.','ДАВЛЕНИЕ 1/2');
      }
      if(d.sys)w.startAnim(d.sys);
      game.particles.burst(this.x,this.y-1,22,{kind:'spark',col:'#ffcf7a',spd:4,life:0.7,size:0.05,add:true,g:9});
    }else if(d.kind==='station'){
      if(!gs.flags.post_on){game.hud.say('ЛИНИЯ МЕРТВА · МАНОМЕТР НА НУЛЕ','ПНЕВМОПОЧТА');game.audio.denied();return;}
      if(!gs.flags['st_'+d.station]){gs.flag('st_'+d.station);game.audio.checkpoint();
        game.particles.burst(this.x,this.y-1.4,18,{kind:'spark',col:'#9fe0ff',spd:4,life:0.6,size:0.05,add:true,g:6});}
      game.travel.open(d.station);
    }else if(d.kind==='postmaster'){
      const sc=postmasterScene(gs);
      game.cinematic.play({x:this.x,y:this.y,title:'ПОЧТМЕЙСТЕР',lines:sc.lines,upgrades:sc.upgrades,setFlags:sc.flags});
    }else if(d.kind==='mapplate'){
      gs.flag(d.flag);game.audio.lore();game.flash(0.15,'#9fd6ff');
      game.hud.say('СХЕМА СКОПИРОВАНА В ПЛАНШЕТ · ESC — КАРТА',d.title);
    }else if(d.kind==='gauge'){
      gs.flag(d.flag);game.audio.checkpoint();game.flash(0.25);
      game.hud.say(d.label+' · ПОД ДАВЛЕНИЕМ','');
      w.later(900,()=>w.reload());
    }else if(d.kind==='wheel'){
      gs.flag(d.flag);game.audio.wheel();w.wheelSeq=true;w.wheelT=0;
      game.hud.say('КОЛЕСО ИДЁТ. СВИНЕЦ. СТАЛЬ. БЕТОН.','ПЕЧАТЬ СНИМАЕТСЯ');
    }else if(d.kind==='lore'){
      game.salvage.lore({loreId:d.loreId});
      w.interactables=w.interactables.filter(i=>i!==this);
    }else if(d.kind==='talk'){
      if(!gs.flags[d.flag])game.salvage.collect(d);
      else game.cinematic.play({x:d.x,y:d.y,title:d.title,lines:d.again});
    }else if(d.kind==='salvage'||d.kind==='salvageBlocked'){
      if(d.kind==='salvageBlocked'&&!gs.has('pulse')){
        game.hud.say('БАЛКУ НЕ СДВИНУТЬ РУКАМИ. НУЖЕН ИМПУЛЬС РЕЗАКА.','');game.audio.hitMetal();return;}
      game.salvage.collect(d);}
  }
  draw(c,t,gs){
    const d=this.def,live=this.canUse(gs);
    if(!live&&d.kind!=='lever'&&d.kind!=='valve'&&d.kind!=='mapplate')return;
    if(d.kind==='station'){drawStation(c,this,t,gs);return;}
    if(d.kind==='postmaster')return;
    const p=live?0.5+0.5*Math.sin(t*3):0;
    /* 0 → 1: рукоять/штурвал доворачивается за доли секунды после E */
    const k=this.usedAt!==undefined?clamp((this.world.time-this.usedAt)/0.32,0,1):(live?0:1);
    if(d.kind==='lever'){
      Kit.plate(c,this.x-0.5,this.y-1.5,1.0,1.5,'steel',31,{rust:0.6});
      c.save();c.translate(this.x,this.y-0.7);c.rotate(lerp(-0.7,0.9,EZ.back(k)));
      c.strokeStyle='#5c646b';c.lineWidth=0.11;c.beginPath();c.moveTo(0,0);c.lineTo(0,-0.7);c.stroke();
      const g=c.createLinearGradient(-0.16,-0.9,0.16,-0.7);
      g.addColorStop(0,'#e8c96a');g.addColorStop(.5,'#c9a227');g.addColorStop(1,'#6d5416');
      c.fillStyle=g;c.beginPath();c.arc(0,-0.78,0.17,0,TAU);c.fill();c.restore();
      Kit.plate(c,this.x-0.66,this.y-1.82,1.32,0.32,'steel',32,{});
      c.fillStyle='#191612';c.font='500 0.17px Oswald';c.textAlign='center';
      c.fillText(d.plaque||'РЫЧАГ',this.x,this.y-1.6);c.textAlign='left';
      /* сигнальная лампа на щитке: жёлтая — ждёт, зелёная — сработал */
      c.fillStyle=live?rgba('#ffcf7a',0.55+0.4*p):'#69d68f';c.beginPath();c.arc(this.x+0.3,this.y-0.25,0.09,0,TAU);c.fill();
      if(live){c.fillStyle=rgba('#ffe6a3',0.2*p);c.beginPath();c.arc(this.x,this.y-1.0,0.8,0,TAU);c.fill();
        game.renderer.glowAdd(this.x,this.y-1.0,0.9,'#ffcf7a',0.2+0.15*p);}
      else game.renderer.glowAdd(this.x+0.3,this.y-0.25,0.4,'#69d68f',0.3);
    }else if(d.kind==='valve'){
      /* штурвал проворачивается на полтора оборота, из-под фланца бьёт пар */
      Kit.valve(c,this.x,this.y-0.6,0.42,0.2+EZ.io(k)*PI*3,'#b08d3e');
      if(this.usedAt!==undefined&&k<1&&Math.random()<0.5)game.particles.spawn({kind:'steam',x:this.x+(Math.random()-0.5)*0.6,y:this.y-0.3,
        vx:(Math.random()-0.5)*2,vy:-2-Math.random()*2,life:0.7,size:0.25,grow:1.2,col:'#e8e0d0',drag:1.4});
      if(live){c.fillStyle=rgba('#ffe6a3',0.2*p);c.beginPath();c.arc(this.x,this.y-0.6,0.9,0,TAU);c.fill();
        game.renderer.glowAdd(this.x,this.y-0.6,0.9,'#ffcf7a',0.18+0.14*p);}
      else game.renderer.glowAdd(this.x,this.y-0.6,0.6,'#69d68f',0.22);
    }else if(d.kind==='lore'){
      Kit.plate(c,this.x-0.5,this.y-1.1,1.0,1.1,'lead',34,{bolts:true});
      Kit.loreCylinder(c,this.x,this.y-0.75);
      c.fillStyle=rgba('#bfefff',0.18*p);c.beginPath();c.arc(this.x,this.y-0.75,0.9+p*0.15,0,TAU);c.fill();
      game.renderer.glowAdd(this.x,this.y-0.75,0.9,'#9fe6ff',0.5);
    }else if(d.kind==='mapplate'){
      /* схема яруса: латунная рамка, синька с белыми линиями комнат */
      const x=this.x-0.75,y=this.y-2.0;
      Kit.plate(c,x-0.08,y-0.08,1.66,1.16,'steel',777,{rust:0.4,bolts:true});
      c.fillStyle=live?'#16324a':'#1a2630';c.fillRect(x,y,1.5,1.0);
      c.strokeStyle=live?'rgba(220,240,255,.85)':'rgba(220,240,255,.35)';c.lineWidth=0.03;
      c.strokeRect(x+0.12,y+0.5,0.36,0.34);c.strokeRect(x+0.5,y+0.14,0.3,0.7);c.strokeRect(x+0.82,y+0.42,0.52,0.24);
      c.fillStyle=live?rgba('#ffcf7a',0.6+0.4*p):'rgba(255,207,122,.3)';c.beginPath();c.arc(x+0.64,y+0.3,0.05,0,TAU);c.fill();
      if(live)game.renderer.glowAdd(this.x,this.y-1.5,1.0,'#9fd6ff',0.18+0.12*p);
    }else if(d.kind==='gauge'){
      c.fillStyle=rgba('#69d68f',0.18*p);c.beginPath();c.arc(this.x,this.y-0.6,1.0,0,TAU);c.fill();
      c.strokeStyle=rgba('#bfefff',0.4+0.3*p);c.lineWidth=0.05;
      c.beginPath();c.arc(this.x,this.y-0.6,0.7+p*0.1,0,TAU);c.stroke();
      game.renderer.glowAdd(this.x,this.y-0.6,1.0,'#69d68f',0.25+0.15*p);
    }else if(d.kind==='talk'){
      /* «…» над головой: с ним можно поговорить */
      const hy=this.y-2.35+Math.sin(t*2)*0.05;
      c.fillStyle='rgba(12,10,8,.75)';rr(c,this.x-0.42,hy-0.2,0.84,0.4,0.16);c.fill();
      c.strokeStyle=rgba('#e8c96a',0.6+0.3*p);c.lineWidth=0.04;rr(c,this.x-0.42,hy-0.2,0.84,0.4,0.16);c.stroke();
      for(let i=0;i<3;i++){c.fillStyle=rgba('#ffe6a3',0.5+0.5*Math.max(0,Math.sin(t*4-i*0.8)));c.beginPath();c.arc(this.x-0.2+i*0.2,hy,0.055,0,TAU);c.fill();}
      game.renderer.glowAdd(this.x,hy,0.7,'#e8c96a',0.2+0.1*p);
    }else if(d.kind==='wheel'){
      c.fillStyle=rgba('#fff6dd',0.14*p);c.beginPath();c.arc(this.x,this.y-1.2,2.4,0,TAU);c.fill();
    }else if(d.kind==='salvage'||d.kind==='salvageBlocked'){
      c.fillStyle=rgba('#ffcf7a',0.13+0.1*p);c.beginPath();c.arc(this.x,this.y-0.8,1.4+p*0.2,0,TAU);c.fill();
      c.strokeStyle=rgba('#ffe6a3',0.45);c.lineWidth=0.04;
      c.beginPath();c.arc(this.x,this.y-0.8,1.0+p*0.12,0,TAU);c.stroke();
      game.renderer.glowAdd(this.x,this.y-0.8,1.2,'#ffcf7a',0.35+0.15*p);
    }
  }
}
class Pushable{
  constructor(def,world){Object.assign(this,def);this.world=world;this.vx=0;this.vy=0;
    this.pushed=!!def.pushed;this.defY=def.y;this.t=0;this.maxHp=def.hp||1;this.hp=this.maxHp;this.hitT=0;}
  rect(){return {x:this.x,y:this.y,w:this.w,h:this.h};}
  /* решётка: удар гнёт прутья, на последнем ударе она вылетает */
  strike(dir){
    if(this.kind!=='grate'||this.pushed)return false;
    const g=this.world.game;this.hp--;this.hitT=0.18;this.bend=(this.bend||0)+dir;
    g.audio.hitMetal();g.camera.addShake(0.3);g.hitstop(CFG.hsMelee);
    g.particles.burst(this.x+this.w/2,this.world.player.cy,12,{kind:'spark',col:'#ffd27a',spd:6,life:0.4,size:0.05,add:true,g:14});
    if(this.hp<=0)this.world.breakPushable(this,dir);
    return true;
  }
  update(dt){
    this.t+=dt;if(this.hitT>0)this.hitT-=dt;
    if(this.kind==='counterweight'){const a=this.world.anims.blast;
      this.y=this.defY+2.6*(a?EZ.in(seg01(a.t,0.25,2.05)):(this.pushed?1:0));return;}
    if(this.kind!=='core'||this.pushed)return;
    this.vx*=Math.exp(-3.2*dt);this.x+=this.vx*dt;
    this.vy+=52*dt;this.y+=this.vy*dt;
    const sols=this.world.room.solids;
    for(let i=0;i<sols.length;i++){
      const s=sols[i];if(s.hidden||!aabb(this,s))continue;
      if(this.vy>0&&this.y+this.h-this.vy*dt<=s.y+0.25){this.y=s.y-this.h;this.vy=0;}
      else if(this.vy<0){this.y=s.y+s.h;this.vy=0;}
      else if(this.vx>0){this.x=s.x-this.w;this.vx*=-0.2;}
      else if(this.vx<0){this.x=s.x+s.w;this.vx*=-0.2;}}
    if(Math.abs(this.x+this.w/2-this.slotX)<1.0&&Math.abs(this.y+this.h/2-16.0)<1.6){
      this.pushed=true;this.x=this.slotX-this.w/2+0.05;this.y=16.0-this.h/2;this.vx=0;this.vy=0;
      const g=this.world.game;
      g.audio.hitMetal();g.camera.addShake(0.45);g.gs.flag(this.flag);
      const n=this.world.pushables.filter(p=>p.pushed).length;
      g.gs.flags.cores_placed=n;g.gs.save();
      g.hud.say('ЯДРО В ГНЕЗДЕ · '+n+'/3','МАГИСТРАЛЬ C');
      if(n>=3)this.world.later(800,()=>this.world.reload());
    }
  }
  draw(c,t){
    if(this.pushed&&this.kind!=='counterweight')return;
    if(this.kind==='counterweight'){
      const yy=this.y;
      const g=c.createLinearGradient(this.x,0,this.x+this.w,0);
      g.addColorStop(0,'#2b2e32');g.addColorStop(.35,'#5c626a');g.addColorStop(.6,'#454b52');g.addColorStop(1,'#20242a');
      c.fillStyle=g;rr(c,this.x,yy,this.w,this.h,0.08);c.fill();
      c.save();c.globalAlpha=0.2;c.fillStyle=PAT(c,'rust');c.fillRect(this.x,yy,this.w,this.h);c.restore();
      for(let i=0;i<4;i++)Kit.bolt(c,this.x+0.25+(i%2)*(this.w-0.5),yy+0.3+Math.floor(i/2)*(this.h-0.6),0.08);
      if(!this.pushed){
        const p=0.5+0.5*Math.sin(t*3.4),cx=this.x+this.w/2,cy=yy+this.h*0.62;
        c.strokeStyle=rgba('#e8c96a',0.75);c.lineWidth=0.07;
        c.beginPath();c.arc(cx,cy,0.44,0,TAU);c.stroke();
        c.beginPath();c.arc(cx,cy,0.22,0,TAU);c.stroke();
        c.fillStyle=rgba('#ffe6a3',0.45+0.4*p);c.beginPath();c.arc(cx,cy,0.09,0,TAU);c.fill();
        game.renderer.glowAdd(cx,cy,1.0,'#e8c96a',0.25+0.2*p);
      }
    }else if(this.kind==='beam'){
      /* балку рисует сцена садовника (z3_collector) */
    }else if(this.kind==='crate'){
      /* штабель ящиков ровно по габариту коллизии + латунная мишень «бей импульсом» */
      const cols=Math.max(1,Math.round(this.w/1.15)),rows=Math.max(1,Math.round(this.h/1.1));
      const cw=this.w/cols,ch=this.h/rows;
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
        const sd=(i*7+j*13+(this.id.length*3))|0,ix=(j%2)?0.06:-0.04;
        Kit.crate(c,this.x+i*cw+ix+0.03,this.y+j*ch+0.03,cw-0.06,ch-0.06,{seed:sd,mat:(i+j)%3===2?'steel':'ply'});}
      Kit.hazardTape(c,this.x,this.y+this.h*0.5-0.12,this.w,0.24);
      if(this.world.game.gs.has('pulse')){
        const p=0.5+0.5*Math.sin(t*3.4),cx=this.x+this.w/2,cy=this.y+this.h*0.5;
        c.fillStyle='rgba(20,16,10,.8)';c.beginPath();c.arc(cx,cy,0.52,0,TAU);c.fill();
        c.strokeStyle=rgba('#e8c96a',0.8);c.lineWidth=0.07;
        c.beginPath();c.arc(cx,cy,0.44,0,TAU);c.stroke();c.beginPath();c.arc(cx,cy,0.22,0,TAU);c.stroke();
        c.fillStyle=rgba('#ffe6a3',0.45+0.4*p);c.beginPath();c.arc(cx,cy,0.09,0,TAU);c.fill();
        game.renderer.glowAdd(cx,cy,1.0,'#e8c96a',0.25+0.2*p);}
    }else if(this.kind==='grate'&&this.floor){
      /* решётка в полу: прутья поперёк провала, удары сверху прогибают их вниз */
      const dmg=1-this.hp/this.maxHp,sag=dmg*0.22+(this.hitT>0?0.06:0),sh=this.hitT>0?(Math.random()-0.5)*0.05:0;
      c.save();c.translate(sh,0);
      Kit.plate(c,this.x-0.15,this.y-0.05,0.3,this.h+0.1,'steel',641,{bolts:false,rust:0.8});
      Kit.plate(c,this.x+this.w-0.15,this.y-0.05,0.3,this.h+0.1,'steel',642,{bolts:false,rust:0.8});
      c.lineCap='round';
      for(let i=0;i<5;i++){const by=this.y+0.08+i*0.075,mid=this.x+this.w/2;
        c.strokeStyle='#6b4a3a';c.lineWidth=0.07;c.beginPath();c.moveTo(this.x+0.1,by);c.quadraticCurveTo(mid,by+sag*(1+i*0.15),this.x+this.w-0.1,by);c.stroke();}
      for(let i=1;i<5;i++){const bx=this.x+i*this.w/5;c.strokeStyle='#4a3a2e';c.lineWidth=0.06;
        c.beginPath();c.moveTo(bx,this.y+0.05);c.lineTo(bx,this.y+this.h-0.02+sag*0.5);c.stroke();}
      c.restore();
      if(this.hitT>0){c.save();c.globalCompositeOperation='lighter';c.fillStyle=rgba('#ffcf7a',this.hitT*2);
        c.fillRect(this.x,this.y,this.w,this.h);c.restore();}
    }else if(this.kind==='grate'){
      const bend=clamp(this.bend||0,-3,3),sh=this.hitT>0?(Math.random()-0.5)*0.08:0,dmg=1-this.hp/this.maxHp;
      c.save();c.translate(sh,0);
      Kit.plate(c,this.x-0.1,this.y,this.w+0.2,0.3,'steel',631,{bolts:false,rust:0.8});
      Kit.plate(c,this.x-0.1,this.y+this.h-0.3,this.w+0.2,0.3,'steel',632,{bolts:false,rust:0.8});
      for(let k=0;k<5;k++){const by=this.y+0.3+k*(this.h-0.6)/4;
        c.fillStyle='#4a3a2e';c.fillRect(this.x-0.05,by-0.05,this.w+0.1,0.1);}
      c.lineCap='round';
      for(let i=0;i<3;i++){const bx=this.x+0.1+i*(this.w-0.2)/2,mid=this.y+this.h*0.55;
        const off=bend*0.16*dmg*(1+i*0.3);
        c.strokeStyle='#6b4a3a';c.lineWidth=0.11;
        c.beginPath();c.moveTo(bx,this.y+0.3);c.quadraticCurveTo(bx+off*2.2,mid,bx,this.y+this.h-0.3);c.stroke();
        c.strokeStyle='rgba(255,200,150,.18)';c.lineWidth=0.03;
        c.beginPath();c.moveTo(bx-0.03,this.y+0.3);c.quadraticCurveTo(bx+off*2.2-0.03,mid,bx-0.03,this.y+this.h-0.3);c.stroke();}
      c.restore();
      if(this.hitT>0){c.save();c.globalCompositeOperation='lighter';c.fillStyle=rgba('#ffcf7a',this.hitT*2);
        c.fillRect(this.x-0.1,this.y,this.w+0.2,this.h);c.restore();}
    }else if(this.kind==='core'){
      Kit.leadCore(c,this.x+this.w/2,this.y+this.h/2,this.w*0.52);
      const p=0.5+0.5*Math.sin(t*3);
      c.strokeStyle=rgba('#e8c96a',0.28+0.3*p);c.lineWidth=0.05;
      c.beginPath();c.arc(this.x+this.w/2,this.y+this.h/2,this.w*0.78,0,TAU);c.stroke();
    }
  }
}
