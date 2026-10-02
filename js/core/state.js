"use strict";
/* ============================== GAMESTATE / SAVE ============================== */
class GameState{
  constructor(){this.reset();}
  reset(){this.abilities={};this.flags={};this.hp=CFG.player.hp;this.energy=CFG.player.energy;this.weld=0;
    this.lore=0;this.loreIds={};this.cp={room:'z1_start',x:3.2,y:9.32};
    this.room='z1_start';this.visited={};this.bosses={};}
  has(a){return !!this.abilities[a];}
  /* пластины куртки (plate_N) — по ячейке сверх базовых */
  maxHp(){let n=0;for(const k in this.flags)if(k.indexOf('plate_')===0&&this.flags[k])n++;return CFG.player.hp+n;}
  weldMax(){return CFG.player.weldMax+(this.flags.weld_kit?50:0);}
  grant(a){this.abilities[a]=true;this.save();}
  flag(k,v){this.flags[k]=v===undefined?true:v;this.save();}
  save(){SaveSystem.write(this);}
  serialize(){return {abilities:this.abilities,flags:this.flags,hp:this.hp,weld:this.weld,lore:this.lore,loreIds:this.loreIds,
    cp:this.cp,room:this.room,visited:this.visited,bosses:this.bosses};}
  deserialize(d){this.abilities=d.abilities||{};this.flags=d.flags||{};this.hp=d.hp||5;this.weld=d.weld||0;this.lore=d.lore||0;
    this.loreIds=d.loreIds||{};this.cp=d.cp||this.cp;this.room=d.room||'z1_start';
    this.visited=d.visited||{};this.bosses=d.bosses||{};}
}
const SaveSystem={
  KEY:'kenotaf_save_v2',
  write(gs){try{localStorage.setItem(this.KEY,JSON.stringify(gs.serialize()));}catch(e){}},
  read(){try{const s=localStorage.getItem(this.KEY)||localStorage.getItem('kenotaf_save_v1');return s?JSON.parse(s):null;}catch(e){return null;}},
  wipe(){try{localStorage.removeItem(this.KEY);localStorage.removeItem('kenotaf_save_v1');}catch(e){}}
};
