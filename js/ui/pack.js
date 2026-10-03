"use strict";
/* ============================== РАНЕЦ (пауза) ============================== */
/* Модули ранца: гнёзда сверху (3, и по одному за Примарха, Корчевателя, Регулятора), ниже — найденные
   модули. Клик / ENTER — надеть или снять. В бою со стражем, на арене и в волнах ранец не пересобрать. */
class PackUI{
  constructor(game){this.game=game;this.el=document.getElementById('pack');
    document.getElementById('btnPackBack').onclick=()=>this.close();}
  locked(){const W=this.game.world;return !!(W&&((W.boss&&!W.boss.dead&&W.boss.activated)||W.arenaLock||W.bossDoorClosed||
    (W.room&&W.room.waves&&W.waveIdx>=0&&!this.game.gs.flags[W.room.clearFlag])||this.game.trials.run));}
  open(){this.el.classList.remove('hidden');document.getElementById('pause').classList.add('hidden');this.build(0);}
  build(sel){const gs=this.game.gs,own=gs.ownedMods(),list=document.getElementById('packList'),lock=this.locked();
    const sl=document.getElementById('packSlots');sl.innerHTML='';
    for(let i=0;i<6;i++){const k=gs.equip[i],d=document.createElement('div');
      d.className='slot'+(i>=gs.slots()?' shut':k?' on':'');d.textContent=k?UPGRADES[k].name:(i>=gs.slots()?'ЗАПАЯНО':'ПУСТО');sl.appendChild(d);}
    list.innerHTML='';this.ids=[];
    for(const k of MODULE_IDS){const has=own.indexOf(k)>=0;
      const b=document.createElement('div');b.className='btn arc'+(has?'':' dim')+(gs.equip.indexOf(k)>=0?' worn':'');
      b.textContent=has?((gs.equip.indexOf(k)>=0?'● ':'○ ')+UPGRADES[k].name):'· · ·';
      if(has){b.dataset.pack=String(this.ids.length);this.ids.push(k);b.onclick=()=>this.toggle(+b.dataset.pack);}
      list.appendChild(b);}
    document.getElementById('packInfo').textContent='ГНЁЗДА · '+gs.equip.length+' / '+gs.slots()+(lock?' · В БОЮ НЕ ПЕРЕСОБРАТЬ':'');
    this.show(sel||0);}
  show(i){const k=this.ids&&this.ids[i],t=document.getElementById('packText');this.sel=i;
    if(k===undefined){t.innerHTML='<p class="em">МОДУЛЕЙ ПОКА НЕТ. ИХ НОСИТ ЭЛИТА, ИХ ПРЯЧУТ ТАЙНИКИ, ИМИ НАГРАЖДАЮТ ИСПЫТАТЕЛЬНЫЕ СТЕНДЫ.</p>';return;}
    const gs=this.game.gs,on=gs.equip.indexOf(k)>=0;
    t.innerHTML='<div class="at">'+UPGRADES[k].name+(on?' · НАДЕТ':'')+'</div><p>'+UPGRADES[k].desc+'</p><div class="aw">'+
      (this.locked()?'В БОЮ РАНЕЦ НЕ ПЕРЕСОБРАТЬ':on?'ENTER — СНЯТЬ':gs.equip.length<gs.slots()?'ENTER — НАДЕТЬ':'ГНЁЗДА ЗАНЯТЫ — СНИМИ ДРУГОЙ МОДУЛЬ')+'</div>';}
  toggle(i){const g=this.game,gs=g.gs,k=this.ids[i];if(!k)return;
    if(this.locked()){g.audio.denied();return;}
    const at=gs.equip.indexOf(k);
    if(at>=0)gs.equip.splice(at,1);
    else if(gs.equip.length<gs.slots())gs.equip.push(k);
    else{g.audio.denied();this.show(i);return;}
    gs.save();g.audio.tone(at>=0?420:620,0.12,'triangle',0.04,at>=0?300:820);
    this.build(i);
    /* фокус клавиатуры остаётся на том же модуле */
    const L=g.menuNav?g.menuNav.list(this.el):null;if(L){const j=L.findIndex(b=>b.dataset.pack===String(i));if(j>=0){g.menuNav.i=j;g.menuNav.paint(L);}}}
  close(){this.el.classList.add('hidden');document.getElementById('pause').classList.remove('hidden');}
}
