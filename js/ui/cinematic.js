"use strict";
/* ============================== CINEMATIC ============================== */
/* Сцена сальважа идёт в РЕАЛЬНОМ времени (раньше таймлайн тикал в slow-mo x0.2,
   и три фразы растягивались на полминуты). Длительность фразы — по её длине,
   E / SPACE / ЛКМ листает дальше. */
class Cinematic{
  constructor(game){this.game=game;this.active=false;this.def=null;this.li=-1;this.lt=0;this.age=0;this.phase='';}
  lineDur(s){return clamp(0.9+s.length*0.028,1.6,2.8);}
  play(def){
    const g=this.game;
    this.active=true;this.def=def;this.li=-1;this.phase='lines';
    g.timeScale=0.35;g.camera.focus={x:def.x,y:def.y-0.9};g.camera.tzoom=1.45;
    document.getElementById('bars').classList.add('on');
    document.getElementById('caption').classList.add('skip');
    g.input.enabled=false;g.input.clearAll();
    this.next();
  }
  next(){
    const g=this.game,d=this.def,lines=d.lines||[];
    this.li++;this.age=0;
    if(this.li<lines.length){
      g.hud.caption(lines[this.li],d.title||'');g.audio.tone(320+this.li*60,0.3,'sine',0.03,420);
      this.lt=this.lineDur(lines[this.li]);return;}
    this.phase='out';this.lt=0.8;
    g.hud.caption('','');document.getElementById('caption').classList.remove('skip');
    if(d.ability){
      g.abilities.grant(d.ability);
      g.camera.addShake(0.6);
      g.particles.burst(d.x,d.y-0.8,44,{kind:'spark',col:'#ffe6a3',spd:9,life:1.1,size:0.07,add:true,g:12});
      g.particles.spawn({kind:'ring',x:d.x,y:d.y-0.8,ringR:5,life:0.8,size:0.1,col:'#ffcf7a',add:true,a:0.9});
      g.hud.showAbilityCard(d.ability);
    }
    const ups=(d.upgrades||[]).concat(d.upgrade?[d.upgrade]:[]);
    for(const u of ups)grantUpgrade(g,u);
    if(ups.length)g.hud.showUpgradeCard(ups.length>1?{name:ups.map(u=>(UPGRADES[u]||{name:u}).name).join(' + '),
      desc:ups.map(u=>(UPGRADES[u]||{desc:''}).desc).join(' ')}:UPGRADES[ups[0]]);
    for(const f of (d.setFlags||[]))g.gs.flag(f);
  }
  end(){
    const g=this.game,wasActive=this.active;
    this.active=false;g.timeScale=1;g.camera.focus=null;g.camera.tzoom=1;
    document.getElementById('bars').classList.remove('on');
    document.getElementById('caption').classList.remove('skip');
    g.input.enabled=true;g.input.clearAll();
    return wasActive;
  }
  abort(){if(this.active){this.end();this.game.hud.caption('','');}}
  update(dt){
    if(!this.active)return;
    this.lt-=dt;this.age+=dt;
    const skip=this.game.input.skip&&this.age>0.3&&this.phase==='lines';
    if(this.lt<=0||skip){
      if(this.phase==='lines')this.next();
      else if(this.end())this.game.world.reload();
    }
  }
}
