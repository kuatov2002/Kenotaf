"use strict";
/* ============================== TUTORIAL ============================== */
/* Контекстные подсказки: появляются там, где навык нужен прямо сейчас, и гаснут,
   как только игрок справился (done). Прогресс хранится во флагах tut_<id>.
   need — способность, when — доп. условие, area — диапазон X комнаты. */
const P_=g=>g.world.player;
const B_=g=>{const b=g.world.boss;return b&&b.activated&&!b.dead?b:null;};
const HINTS=[
  /* HUD-подсказок нет: базовые клавиши — трафареты на стенах первой комнаты,
     новые модули — карточка при получении и первая же преграда, которая без них не берётся */
];

class TutorialSystem{
  constructor(game){this.game=game;this.cur=null;this.counts={};this.doneT=0;}
  notify(ev){this.counts[ev]=(this.counts[ev]||0)+1;}
  count(ev){return this.counts[ev]||0;}
  update(dt){
    const g=this.game,w=g.world,R=w.room,p=w.player,gs=g.gs;
    if(this.doneT>0){this.doneT-=dt;if(this.doneT<=0)g.hud.hint(null);return;}
    /* не спорим с названием комнаты, карточкой модуля и подсказкой «E» у объекта */
    const busy=g.hud.cardT>0||g.hud.abT>0;
    if(g.state!=='play'||!R||!p||g.cinematic.active||p.dead||g.transitionT>=0||busy){
      if(this.cur){this.cur=null;g.hud.hint(null);}return;}
    const promptUp=!!(w.nearInter||w.nearDoor);
    let best=null;
    for(let i=0;i<HINTS.length;i++){
      const h=HINTS[i];
      if(h.room!==R.id||gs.flags['tut_'+h.id])continue;
      if(h.need&&!gs.has(h.need))continue;
      if(h.needNot&&gs.has(h.needNot))continue;
      if(h.done(g)){gs.flags['tut_'+h.id]=true;gs.save();
        if(this.cur===h){this.cur=null;g.hud.hintDone();g.audio.learned();this.doneT=0.9;return;}
        continue;}
      if(h.area&&(p.cx<h.area[0]||p.cx>h.area[1]))continue;
      if(h.when&&!h.when(g))continue;
      if(promptUp&&h.keys.some(a=>a.indexOf('E')>=0))continue;
      if(!best)best=h;
    }
    if(best!==this.cur){this.cur=best;g.hud.hint(best);}
  }
}
