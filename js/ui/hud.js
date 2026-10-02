"use strict";
/* ============================== HUD ============================== */
class HUD{
  constructor(game){
    this.game=game;
    this.el={hud:document.getElementById('hud'),hp:document.getElementById('hpCells'),
      en:document.getElementById('enFill'),ab:document.getElementById('abRow'),
      prompt:document.getElementById('prompt'),promptT:document.querySelector('#prompt span'),
      cap:document.getElementById('caption'),capT:document.querySelector('#caption .t'),
      capS:document.querySelector('#caption .s'),card:document.getElementById('roomcard'),
      cardZ:document.querySelector('#roomcard .z'),cardN:document.querySelector('#roomcard .n'),
      boss:document.getElementById('bossbar'),bossN:document.querySelector('#bossbar .nm'),
      bossF:document.querySelector('#bossbar .fill'),lore:document.getElementById('loreN'),
      hint:document.getElementById('hint'),hintK:document.querySelector('#hint .keys'),
      hintT:document.querySelector('#hint .tt'),abc:document.getElementById('abcard')};
    this.abT=0;
    this.capT0=0;this.cardT=0;this._p=null;this._hp=-1;this.buildHp();this.buildAb();
  }
  buildHp(){this.el.hp.innerHTML='';this.cells=[];
    for(let i=0;i<this.game.gs.maxHp();i++){const d=document.createElement('div');d.className='cell';d.innerHTML='<i></i>';
      this.el.hp.appendChild(d);this.cells.push(d);}}
  buildAb(){
    const icons={
      pulse:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><path d="M3 12h5l2-4 3 8 2-4h6"/></svg>',
      dash:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><path d="M4 8h10M4 12h14M4 16h8"/><path d="M18 6l4 6-4 6"/></svg>',
      claws:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><path d="M6 3v8a6 6 0 0012 0V3M10 3v7M14 3v7"/></svg>',
      magnet:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><path d="M5 4v9a7 7 0 0014 0V4h-5v9a2 2 0 01-4 0V4z"/></svg>',
      filter:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><circle cx="12" cy="13" r="6"/><path d="M9 7V4h6v3M12 10v6M9 13h6"/></svg>',
      hook:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><circle cx="17" cy="6" r="3"/><path d="M15 8L5 18M5 18v-4M5 18h4"/></svg>',
      breaker:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><rect x="4" y="4" width="16" height="16"/><path d="M12 4l-2 6 4 3-3 7M4 12l6-2M20 9l-6 4"/></svg>',
      vjump:'<svg viewBox="0 0 24 24" fill="none" stroke="#e8c96a" stroke-width="1.6"><path d="M12 3l-5 6h3v5h4V9h3z"/><path d="M8 18c1 2 3 2 4 0s3-2 4 0M7 21h10"/></svg>'};
    this.el.ab.innerHTML='';this.abEls={};
    for(const k of ABILITY_ORDER){
      const d=document.createElement('div');d.className='ab';
      d.innerHTML=icons[k]+'<span>'+ABILITIES[k].short+'</span>';d.title=ABILITIES[k].name;
      this.el.ab.appendChild(d);this.abEls[k]=d;}
  }
  syncHp(){const gs=this.game.gs,hp=gs.hp;if(this.cells.length!==gs.maxHp())this.buildHp();
    for(let i=0;i<this.cells.length;i++)this.cells[i].classList.toggle('off',i>=hp);}
  syncAbilities(){const gs=this.game.gs;
    for(const k in this.abEls)this.abEls[k].classList.toggle('on',!!gs.has(k));
    this.el.lore.textContent=gs.lore;}
  energy(v){this.el.en.style.width=clamp(v,0,100)+'%';}
  /* подкачка у фонаря: ячейка вспыхивает по очереди, вся полоса тёплая, пока шланг подцеплен */
  cellRefill(i){const c=this.cells[i];if(!c)return;c.classList.remove('refill');void c.offsetWidth;c.classList.add('refill');}
  lampRest(on){this.el.hp.classList.toggle('resting',!!on);}
  /* сохранение: латунная шестерня в углу на пару секунд — без текста поверх игры */
  saved(){const el=this._sv||(this._sv=document.getElementById('saved'));if(!el)return;
    el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(this._svT);this._svT=setTimeout(()=>el.classList.remove('on'),2200);}
  prompt(text){
    if(!text){if(this._p!==null){this.el.prompt.classList.remove('on');this._p=null;}return;}
    if(this._p!==text){this.el.promptT.textContent=text;this._p=text;}
    this.el.prompt.classList.add('on');
  }
  say(t,s){this.el.capT.textContent=t;this.el.capS.textContent=s||'';
    this.el.cap.classList.add('on');this.capT0=3.6;}
  caption(t,s){if(!t){this.el.cap.classList.remove('on');return;}
    this.el.capT.textContent=t;this.el.capS.textContent=s||'';this.el.cap.classList.add('on');this.capT0=999;}
  showLore(text,title){this.say(text,title||'ЦИЛИНДР ЛОРА');this.capT0=9;this.syncAbilities();}
  showAbilityCard(key,o){const ab=Object.assign({},ABILITIES[key]||{},o||{});if(!ab.name)return;const el=this.el.abc;
    el.querySelector('.k').textContent=ab.kicker||'МОДУЛЬ УСТАНОВЛЕН';
    el.querySelector('.n').textContent=ab.name;el.querySelector('.keys').innerHTML=keysHTML(ab.keys);
    el.querySelector('.d').textContent=ab.desc;el.classList.add('on');this.abT=5.5;}
  showUpgradeCard(u){if(!u)return;const el=this.el.abc;
    el.querySelector('.k').textContent='УЛУЧШЕНИЕ';el.querySelector('.n').textContent=u.name;
    el.querySelector('.keys').innerHTML='';el.querySelector('.d').textContent=u.desc;el.classList.add('on');this.abT=5;}
  hint(h){const el=this.el.hint;
    if(!h){el.classList.remove('on','done');return;}
    this.el.hintK.innerHTML=keysHTML(h.keys);this.el.hintT.textContent=h.text;
    el.classList.remove('done');el.classList.add('on');}
  hintDone(){this.el.hint.classList.add('done');}
  roomCard(z,n){this.el.cardZ.textContent=z;this.el.cardN.textContent=n;
    this.el.card.classList.add('on');this.cardT=3.4;}
  bossOn(name){this.el.bossN.textContent=name;this.el.boss.classList.add('on');}
  boss(name,v){this.el.bossN.textContent=name;this.el.bossF.style.width=clamp(v*100,0,100)+'%';
    this.el.boss.classList.add('on');}
  bossOff(){this.el.boss.classList.remove('on');}
  show(v){this.el.hud.classList.toggle('hidden',!v);}
  update(dt){
    if(this.capT0>0){this.capT0-=dt;if(this.capT0<=0)this.el.cap.classList.remove('on');}
    if(this.cardT>0){this.cardT-=dt;if(this.cardT<=0)this.el.card.classList.remove('on');}
    if(this.abT>0){this.abT-=dt;if(this.abT<=0)this.el.abc.classList.remove('on');}
    /* цель не висит на экране. Только если игрок долго топчется без продвижения —
       один раз тихо напоминаем, что записи курьера есть в паузе */
    const ob=currentObjective(this.game.gs),el=this._obEl||(this._obEl=document.getElementById('obj'));
    if(ob!==this._ob){this._ob=ob;this._obIdle=0;this._obShown=false;}
    if(this.game.state==='play')this._obIdle=(this._obIdle||0)+dt;
    if(this._obIdle>150&&!this._obShown){this._obShown=true;el.classList.add('on');this._obT=7;}
    if(this._obT>0){this._obT-=dt;if(this._obT<=0)el.classList.remove('on');}
    const g=this.game;
    /* ранен — пустые ячейки тлеют: их можно наполнить */
    {const hurt=g.gs.hp<g.gs.maxHp()&&g.state==='play';if(this._hurt!==hurt){this._hurt=hurt;this.el.hp.classList.toggle('hurt',hurt);}}
    if(g.world&&g.world.player&&!g.world.player.dead){
      this.energy(g.world.player.energy/g.world.player.maxEnergy()*100);
      if(this._hp!==g.gs.hp){this._hp=g.gs.hp;this.syncHp();}
    }
    if(g.world&&!g.world.boss)this.bossOff();
    {const gs=g.gs,wl=this._wl||(this._wl=document.getElementById('weldLine')),wf=this._wf||(this._wf=document.getElementById('weldFill'));
      const k=clamp((gs.weld||0)/gs.weldMax(),0,1);if(this._wk!==k){this._wk=k;wf.style.width=(k*100)+'%';}
      wl.classList.toggle('ready',(gs.weld||0)>=CFG.player.healCost&&gs.hp<gs.maxHp());}
    if(g.world&&g.world.room){
      const hasF=g.gs.has('filter'),fl=this._flt||(this._flt=document.getElementById('fltLine'));
      fl.classList.toggle('hidden',!hasF);
      if(hasF){const k=clamp((g.world.filter===undefined?100:g.world.filter)/g.world.filterCap(),0,1);
        (this._fltF||(this._fltF=document.getElementById('fltFill'))).style.width=(k*100)+'%';
        fl.classList.toggle('low',k<0.28&&!!g.world.inPollen);}
    }
    let pr=null;
    if(g.world&&!g.cinematic.active){
      /* у фонаря подсказка — на нём самом (выбитая клавиша, мигающие ячейки), не текстом */
      if(g.world.nearRest)pr=null;
      else if(g.world.nearInter)pr=g.world.nearInter.prompt();
      else if(g.world.nearDoor){
        const nd=g.world.nearDoor,d=nd.d;
        if(nd.locked)pr=(d.reqMsg||d.msg||'ЗАБЛОКИРОВАНО');
        else if(d.latch&&d.latchHere&&!g.gs.flags[d.latch])pr='ОТОДВИНУТЬ ЗАСОВ · '+(d.label||'');
        else if(d.down)pr='ЛЮК · '+(d.label||'');
        else if(d.elevator)pr='ЛИФТ · '+(d.label||'');
        else pr='ВОЙТИ · '+(d.label||'');
      }
    }
    this.prompt(pr);
    /* подсказка клавиши — под то устройство, которым играют сейчас */
    {const pad=g.input.usingPad();if(this._pad!==pad){this._pad=pad;
      const k=document.querySelector('#prompt kbd'),c=document.querySelector('#caption .k b');
      if(k)k.textContent=pad?'Y':'E';if(c)c.textContent=pad?'A':'E';}}
  }
}
