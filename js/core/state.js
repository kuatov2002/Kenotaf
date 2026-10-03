"use strict";
/* ============================== GAMESTATE / SAVE ============================== */
class GameState{
  constructor(){this.reset();}
  reset(){this.abilities={};this.flags={};this.hp=CFG.player.hp;this.energy=CFG.player.energy;this.weld=0;this.heat=0;
    this.lore=0;this.loreIds={};this.cp={room:'z1_start',x:3.2,y:9.32};
    this.room='z1_start';this.visited={};this.bosses={};this.equip=[];this.trials={};}
  has(a){return !!this.abilities[a];}
  /* модули ранца: работает только надетый (и найденный) */
  mod(k){return !!this.flags[k]&&this.equip.indexOf(k)>=0;}
  /* гнёзда ранца: три своих, по одному — за Примарха, Корчевателя и Регулятора */
  slots(){return 3+['primarch','uprooter','regulator'].filter(b=>this.bosses[b]).length;}
  ownedMods(){return MODULE_IDS.filter(k=>this.flags[k]);}
  /* пластины куртки (plate_N) — по ячейке сверх базовых */
  /* пластины куртки: две пластины — ещё одна ячейка (нечётная — половина собранной ячейки) */
  plates(){let n=0;for(const k in this.flags)if(k.indexOf('plate_')===0&&this.flags[k])n++;return n;}
  maxHp(){return CFG.player.hp+Math.floor(this.plates()/2);}
  weldMax(){return CFG.player.weldMax+(this.flags.weld_kit?50:0)+(this.flags.weld_kit2?50:0);}
  grant(a){this.abilities[a]=true;this.save();}
  flag(k,v){this.flags[k]=v===undefined?true:v;this.save();}
  save(){SaveSystem.write(this);}
  serialize(){return {abilities:this.abilities,flags:this.flags,hp:this.hp,weld:this.weld,lore:this.lore,loreIds:this.loreIds,
    cp:this.cp,room:this.room,visited:this.visited,bosses:this.bosses,equip:this.equip,trials:this.trials};}
  deserialize(d){this.abilities=d.abilities||{};this.flags=d.flags||{};this.hp=d.hp||5;this.weld=d.weld||0;this.lore=d.lore||0;
    this.loreIds=d.loreIds||{};this.cp=d.cp||this.cp;this.room=d.room||'z1_start';
    this.visited=d.visited||{};this.bosses=d.bosses||{};this.trials=d.trials||{};
    /* старое сохранение (до ранца): найденные улучшения-модули надеваются сами, сколько влезет */
    this.equip=Array.isArray(d.equip)?d.equip.filter(k=>MODULE_IDS.indexOf(k)>=0):this.ownedMods().slice(0,this.slots());}
}
/* Сохранение: основной слот + резервная копия предыдущей записи. Запись — целиком JSON с версией
   и контрольной суммой; битый или чужой слот при чтении пропускается (берётся резерв, затем старые
   форматы v2/v1). Точка возврата в несуществующую комнату (после переделки мира) заменяется на старт. */
const SaveSystem={
  KEY:'kenotaf_save_v3',BAK:'kenotaf_save_v3_bak',OLD:['kenotaf_save_v2','kenotaf_save_v1'],
  sum(str){let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))|0;return h;},
  write(gs){try{const d=JSON.stringify(gs.serialize()),rec=JSON.stringify({v:3,t:Date.now(),c:this.sum(d),d:d});
    const cur=localStorage.getItem(this.KEY);if(cur&&cur!==rec)localStorage.setItem(this.BAK,cur);
    localStorage.setItem(this.KEY,rec);}catch(e){}},
  parse(raw){if(!raw)return null;try{const r=JSON.parse(raw);
    if(r&&r.v===3&&typeof r.d==='string'){if(this.sum(r.d)!==r.c)return null;return this.fix(JSON.parse(r.d));}
    if(r&&r.cp)return this.fix(r);   /* старый формат: сам объект состояния */
    }catch(e){}return null;},
  fix(d){if(!d||typeof d!=='object')return null;
    if(!d.cp||typeof ROOMDEFS==='undefined'||!ROOMDEFS[d.cp.room])d.cp={room:'z1_start',x:3.2,y:9.32};
    if(typeof d.hp!=='number'||d.hp<1)d.hp=CFG.player.hp;return d;},
  read(){try{let d=this.parse(localStorage.getItem(this.KEY));if(d)return d;
    d=this.parse(localStorage.getItem(this.BAK));if(d)return d;
    for(const k of this.OLD){d=this.parse(localStorage.getItem(k));if(d)return d;}}catch(e){}return null;},
  wipe(){try{for(const k of [this.KEY,this.BAK].concat(this.OLD))localStorage.removeItem(k);}catch(e){}}
};
