"use strict";
/* ============================== ЭКЗАМЕН СОВЕТА ==============================
   После финала: пять стражей подряд, на время. Курьер — со всем, что собрал (способности,
   улучшения, надетые модули), но стражи снова на постах. Между залами — только переход:
   ячейки куртки не восстанавливаются, РЕМОНТ — тот, что накопил. Упал — экзамен не сдан.
   Идёт на копии сохранения: настоящий прогресс не трогается. Рекорд и награда — отдельно.
   Награда за первую сдачу: шарф мастера (латунь вместо красного) и рекорд в меню. */
const EXAM_SEQ=['z1_boss','z2_boss','z3_boss','z4_boss','z5_boss'];
const EXAM_KEY='kenotaf_exam';
const CouncilExam={
  on:false,
  rec(){try{return JSON.parse(localStorage.getItem(EXAM_KEY)||'{}')||{};}catch(e){return {};}},
  saveRec(r){try{localStorage.setItem(EXAM_KEY,JSON.stringify(r));}catch(e){}this._m=undefined;},
  master(){if(this._m===undefined)this._m=!!this.rec().done;return this._m;},
  available(){const sv=SaveSystem.read();return !!(sv&&sv.flags&&sv.flags.wheel_turned);},
  /* копия сохранения: всё собранное — с собой, стражи — живы; запись на диск отключена */
  sandbox(){const sv=JSON.parse(JSON.stringify(SaveSystem.read()||{}));const gs=new GameState();gs.deserialize(sv);
    gs.save=()=>{};gs.bosses={};
    for(const k of Object.keys(gs.flags))if(/^boss\d_dead$|^archivist_dead$|^wheel_|^w_drop_|^arch_/.test(k))delete gs.flags[k];
    gs.hp=gs.maxHp();gs.weld=gs.weldMax();gs.heat=0;return gs;},
  entry(id){const R=new Room(ROOMDEFS[id],this.game.gs),d=R.bossDoor||R.doors[0];return {x:2.6,y:d.y+d.h-CFG.player.h-0.02};},
  start(game){this.game=game;if(!this.available())return false;
    this.on=true;this.i=0;this.t=0;this.next=0;this.done=false;game.gs=this.sandbox();game.world.slain={};
    const e=this.entry(EXAM_SEQ[0]);game.begin(EXAM_SEQ[0],e.x,e.y);game.audio.bossRoar&&game.audio.bossRoar();return true;},
  /* кадр мира: время, смена залов после стража, финиш */
  update(W,dt){if(!this.on||this.done)return;const g=this.game;
    if(W.room&&W.room.id===EXAM_SEQ[this.i]&&g.state==='play')this.t+=dt;
    const b=W.boss;
    if(b&&b.done&&!this.next){this.next=2.4;g.hud.say('СТРАЖ '+(this.i+1)+' ИЗ '+EXAM_SEQ.length+' · '+fmtT(this.t),'ЭКЗАМЕН СОВЕТА');}
    if(this.next>0){this.next-=dt;if(this.next<=0){this.i++;
      if(this.i>=EXAM_SEQ.length){this.finish();return;}
      const id=EXAM_SEQ[this.i],e=this.entry(id);g.transition(()=>{W.load(id,e.x,e.y);g.hud.syncHp();});this.next=0;}}
    this.hud();},
  hud(){const el=document.getElementById('trialhud');if(!el)return;const r=this.rec();
    el.classList.add('on','live');el.innerHTML='<b>ЭКЗАМЕН СОВЕТА · СТРАЖ '+Math.min(this.i+1,EXAM_SEQ.length)+' / '+EXAM_SEQ.length+'</b><span class="tt">'+fmtT(this.t)+
      '</span><span>ЛУЧШЕЕ '+fmtT(r.best)+' · ЯЧЕЙКИ НЕ ВОССТАНАВЛИВАЮТСЯ</span>';},
  hide(){const el=document.getElementById('trialhud');if(el)el.classList.remove('on','live');},
  /* упал — экзамен не сдан */
  fail(){if(!this.on)return;this.done=true;this.card(false);},
  finish(){this.done=true;const r=this.rec(),first=!r.done,best=r.best===undefined||this.t<r.best;
    this.saveRec({done:true,best:best?this.t:r.best,runs:(r.runs||0)+1});this.card(true,first,best);},
  card(ok,first,best){const g=this.game;g.state='ending';g.input.enabled=false;g.input.clearAll();this.hide();
    const el=document.getElementById('endcard'),c=el.querySelector('.c'),r=this.rec();
    let html='<h3 class="on">'+(ok?'ЭКЗАМЕН СДАН':'ЭКЗАМЕН НЕ СДАН')+'</h3>';
    html+='<p class="on">'+(ok?'ПЯТЬ СТРАЖЕЙ ЗА '+fmtT(this.t)+(best?' · ЛУЧШЕЕ':' · ЛУЧШЕЕ '+fmtT(r.best)):'СТРАЖ '+(this.i+1)+' ИЗ '+EXAM_SEQ.length+' · '+fmtT(this.t))+'</p>';
    if(ok&&first)html+='<p class="on">НАГРАДА: ШАРФ МАСТЕРА. СОВЕТ НИЧЕГО НЕ ВЫДАЁТ — ЕГО ВЫДАЁТ ПОЧТМЕЙСТЕР.</p>';
    if(!ok)html+='<p class="on">СОВЕТ НЕ ПРИНИМАЕТ ПЕРЕСДАЧ. НО ПОЧТМЕЙСТЕР ПРИНИМАЕТ.</p>';
    html+='<div class="btn on" id="btnEnd">В МЕНЮ</div>';c.innerHTML=html;el.style.opacity=1;el.classList.add('on');
    g.endReady=true;c.querySelector('#btnEnd').onclick=()=>{if(g.state==='ending')g.toMenuState();};},
  /* выход в меню: настоящее сохранение — на место */
  abort(){if(!this.on)return;const g=this.game;this.on=false;this.done=true;this.hide();
    const sv=SaveSystem.read();g.gs=new GameState();if(sv)g.gs.deserialize(sv);}
};
