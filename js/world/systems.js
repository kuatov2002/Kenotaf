"use strict";
/* ============================== ABILITIES / GATES / CHECKPOINT / SALVAGE ============================== */
const ABILITIES={
  pulse:{short:'PULSE',name:'РЕЗАК PUSH-PULSE',keys:[['K'],['C'],['ПКМ']],
    desc:'ДВИГАЕТ ТО, ЧЕГО НЕ СДВИНУТЬ РУКАМИ.'},
  dash:{short:'DASH',name:'КЛАПАН DASH',keys:[['SHIFT'],['L'],['Z']],
    desc:'КОРОТКИЙ РЫВОК. В ВОЗДУХЕ ТОЖЕ.'},
  claws:{short:'CLAWS',name:'КОШКИ КУРЬЕРА',keys:[['SPACE']],
    desc:'ЦЕПЛЯЮТСЯ ЗА РИФЛЁНУЮ СТАЛЬ.'},
  magnet:{short:'MAGNET',name:'МАГНИТНЫЕ ПОДКОВЫ',keys:[['SPACE']],
    desc:'ЛАТУНЬ ПОД СВОДОМ ДЕРЖИТ, ПОКА ДЕРЖИШЬ ПРЫЖОК.'},
  filter:{short:'FILTER',name:'СКАФАНДР MK-II',keys:[],
    desc:'В ПЫЛЬЦЕ МОЖНО ДЫШАТЬ — ПОКА ЕСТЬ ЗАПАС.'}
};
const UPGRADES={
  energy_cap:{name:'РЕСИВЕР ДАВЛЕНИЯ',desc:'ЗАПАС ДАВЛЕНИЯ +50%: ИМПУЛЬСОВ ПОДРЯД — ПЯТЬ ВМЕСТО ТРЁХ.'},
  filter_cap:{name:'ФИЛЬТР · ДОП. КАССЕТА',desc:'ЁМКОСТЬ ФИЛЬТРА MK-II +60%.'}
};
/* ---------- нарратив: вступление и цели ---------- */
const INTRO=[
  {k:'АРКОЛОГИЯ «КЕНОТАФ» · ЯРУС −41',t:'ДВЕСТИ ЧЕТЫРНАДЦАТЬ ЛЕТ НАЗАД МИР НАВЕРХУ СГОРЕЛ. ГОРОД ЖИВЁТ ПОД ЗЕМЛЁЙ, ЗА ПЕЧАТЬЮ.'},
  {k:'ТРЕТЬИ СУТКИ',t:'НАСОСЫ НИЖНЕГО ЯРУСА СТОЯТ. ВОЗДУХ ТЯЖЕЛЕЕТ. СОВЕТ НАВЕРХУ НЕ ОТВЕЧАЕТ.'},
  {k:'КУРЬЕР',t:'НАКАНУНЕ ПНЕВМОПОЧТА ПРИНЕСЛА ТЕБЕ КАПСУЛУ. БЕЗ ОТПРАВИТЕЛЯ. МЕТКА: «ОТ ПЕЧАТИ».'},
  {k:'ВНУТРИ',t:'ЛИСТ. ЖИВОЙ, ЗЕЛЁНЫЙ. ТАКИЕ РАСТУТ ТОЛЬКО В САДАХ ЭДЕМА.',leaf:true},
  {k:'ВВЕРХ',t:'УЗНАЙ, КТО ОСТАНОВИЛ НАСОСЫ. И КТО ПРИСЛАЛ ЛИСТ.'}
];
/* записи курьера: что он знает и о чём догадывается — без инструкций «нажми/иди» */
const OBJECTIVES=[
  {t:'НАСОСЫ ЯРУСА −41 СТОЯТ ТРЕТЬИ СУТКИ. НАВЕРХ ВЕДЁТ НАСОСНАЯ СТАНЦИЯ.',done:gs=>!!gs.visited.z1_hub},
  {t:'ВОСТОЧНЫЙ КОРИДОР ЗАВАЛЕН. НАД ЗАВАЛОМ ХОДИТ КРАН-БАЛКА.',done:gs=>!!gs.flags.east_crane},
  {t:'ЗА КОРИДОРОМ — РЕМОНТНЫЙ ЦЕХ. РЕМОНТНИКИ НЕ ЛЮБЯТ ЧУЖИХ.',done:gs=>!!gs.flags.arena_cleared},
  {t:'В ЦЕХУ ОСТАЛАСЬ ЗАРЯДНАЯ СТАНЦИЯ С РЕЗАКОМ.',done:gs=>gs.has('pulse')},
  {t:'ГРУЗОВОЙ ПУТЬ НАВЕРХ ДЕРЖИТ НАДСМОТРЩИК. ЕГО ГЕРМОЗОНА — ЗА СЕЙФ-КОМНАТОЙ.',done:gs=>!!gs.bosses.overseer},
  {t:'КРАНОВЩИК НОСИЛ НА СЕБЕ КЛАПАН РЫВКА.',done:gs=>gs.has('dash')},
  {t:'СЕВЕРНЫЙ ШЛЮЗ НАСОСНОЙ: ЗА ПРОПАСТЬЮ — ЛИФТ В ЖИЛЫЕ СОТЫ.',done:gs=>!!gs.visited.z2_escalator},
  {t:'В СОТАХ ВСЁ ВЕДЁТ ВВЕРХ ПО ГЛАДКИМ СТЕНАМ. В КВАРТИРАХ ЖИЛИ МОНТАЖНИКИ.',done:gs=>gs.has('claws')},
  {t:'ДАВЛЕНИЕ НА НАШ ЯРУС ИДЁТ ИЗ ТУРБИННОГО ЗАЛА. ТУДА — ЧЕРЕЗ ЛЕСТНИЧНУЮ КЛЕТЬ.',done:gs=>!!gs.visited.z2_turbine},
  {t:'ТУРБИНЫ ПЕРЕКРЫТЫ НА ДВУХ КЛАПАНАХ. ЭТО НЕ АВАРИЯ.',done:gs=>!!gs.flags.turbines_on,
    extra:gs=>((gs.flags.valve_l?1:0)+(gs.flags.valve_r?1:0))+'/2'},
  {t:'ЛИФТ В САДЫ ЭДЕМА ДЕРЖИТ ЦЕНЗОР-ПРИМАРХ.',done:gs=>!!gs.bosses.primarch},
  {t:'ЛИСТЬЯ РАСТУТ ТОЛЬКО В САДАХ ЭДЕМА. ТАМ ДОЛЖНЫ ЗНАТЬ, ОТКУДА ЭТОТ.',done:gs=>!!gs.visited.z3_greenhouse},
  {t:'САДЫ ПУСТЫ. ЕСЛИ КТО-ТО ОСТАЛСЯ — ТО ВНИЗУ, В ТЕХНИЧЕСКИХ КАНАЛАХ.',done:gs=>gs.has('magnet')},
  {t:'САДОВНИК НЕ ЗНАЕТ ЭТОГО ЛИСТА. ВЫШЕ САДОВ — ТОЛЬКО КУПОЛ И ПЕЧАТЬ.',done:gs=>!!gs.visited.z3_dome},
  {t:'КУПОЛ ВЕДЁТ К ШЛЮЗУ ПЕЧАТИ.',done:gs=>!!gs.visited.z4_antechamber},
  {t:'ПЕЧАТЬ ПОДНИМАЮТ ТРИ МАГИСТРАЛИ ДАВЛЕНИЯ.',done:gs=>!!(gs.flags.gaugeA&&gs.flags.gaugeB&&gs.flags.gaugeC),
    extra:gs=>((gs.flags.gaugeA?1:0)+(gs.flags.gaugeB?1:0)+(gs.flags.gaugeC?1:0))+'/3'},
  {t:'ПЕЧАТЬ СТЕРЕЖЁТ АРХИВАРИУС СОВЕТА.',done:gs=>!!gs.flags.archivist_dead},
  {t:'КОЛЕСО ПЕЧАТИ СВОБОДНО.',done:gs=>!!gs.flags.wheel_turned},
  {t:'ЗА ПЕЧАТЬЮ — СВЕТ.',done:()=>false}
];
/* журнал в паузе: две прошлые записи бледно, текущая — ярко */
function journalHTML(gs){let ci=OBJECTIVES.findIndex(o=>!o.done(gs));if(ci<0)ci=OBJECTIVES.length-1;
  let h='<div class="jh">ЗАПИСИ КУРЬЕРА</div>';
  for(let i=Math.max(0,ci-2);i<ci;i++)h+='<p class="old">'+OBJECTIVES[i].t+'</p>';
  const o=OBJECTIVES[ci];h+='<p class="cur">'+o.t+(o.extra?' <b>'+o.extra(gs)+'</b>':'')+'</p>';return h;}
function currentObjective(gs){for(const o of OBJECTIVES)if(!o.done(gs))return o.t+(o.extra?' · '+o.extra(gs):'');return '';}
/* [[A,D],[←,→]] → [A][D] / [←][→] */
function keysHTML(alts){
  return (alts||[]).map(a=>a.map(k=>'<kbd class="kc">'+k+'</kbd>').join('')).join('<span class="or">/</span>');
}
class AbilitySystem{
  constructor(game){this.game=game;}
  has(a){return this.game.gs.has(a);}
  grant(a){const gs=this.game.gs;gs.abilities[a]=true;gs.save();
    this.game.hud.syncAbilities();this.game.audio.pickup();this.game.flash(0.38);}
}
class GateSystem{
  constructor(game){this.game=game;}
  /* засов (latch): шорткат открывается только с той стороны, где висит засов (latchHere) —
     с другой стороны дверь видна запертой, пока её не откроют изнутри */
  doorLocked(d){const gs=this.game.gs;
    if(d.locked||!d.to)return true;
    if(d.latch&&!d.latchHere&&!gs.flags[d.latch])return true;
    if(d.reqAbility&&!gs.has(d.reqAbility))return true;
    if(d.req==='filter')return !gs.has('filter');
    if(d.reqFlag)return !gs.flags[d.reqFlag];
    return false;}
  tryDoor(d){const g=this.game;
    if(d.latch&&!g.gs.flags[d.latch]){
      if(!d.latchHere){g.hud.say(d.msg||'ЗАПЕРТО С ТОЙ СТОРОНЫ.','');g.audio.hitMetal();return false;}
      g.gs.flag(d.latch);g.audio.lever();g.camera.addShake(0.35);}
    if(d.locked||!d.to){g.hud.say(d.msg||d.reqMsg||'ПРОХОД ЗАКРЫТ.','');g.audio.hitMetal();return false;}
    if(d.reqAbility&&!g.gs.has(d.reqAbility)){g.hud.say(d.reqMsg||'ПРОХОД ЗАКРЫТ.','');g.audio.hitMetal();return false;}
    if(d.req==='filter'&&!g.gs.has('filter')){
      g.hud.say('КУРТКА НЕ ГЕРМЕТИЧНА.','');
      g.audio.hitMetal();return false;}
    if(d.reqFlag&&!g.gs.flags[d.reqFlag]){
      g.hud.say(d.reqMsg||'ЗАБЛОКИРОВАНО.','');g.audio.hitMetal();return false;}
    return true;}
}
class CheckpointSystem{
  constructor(game){this.game=game;}
  activate(cp){const gs=this.game.gs,room=this.game.world.room;
    if(gs.cp.room===room.id&&Math.abs(gs.cp.x-cp.x)<0.2)return;
    cp.lit=true;gs.cp={room:room.id,x:cp.x,y:cp.y-cp.h};gs.save();
    this.game.audio.checkpoint();
    this.game.particles.burst(cp.x,cp.y-cp.h*0.55,26,{kind:'dust',col:'#ffd79a',spd:1.6,life:1.1,size:0.05,add:true,drag:1.6});
    this.game.particles.spawn({kind:'ring',x:cp.x,y:cp.y-cp.h*0.55,ringR:2.4,life:0.7,size:0.1,col:'#ffcf7a',add:true,a:0.7});
  }
}
class SalvageSystem{
  constructor(game){this.game=game;}
  collect(def){const gs=this.game.gs;if(gs.flags[def.flag])return;
    gs.flag(def.flag);this.game.cinematic.play(def);}
  lore(def){const gs=this.game.gs;
    if(gs.loreIds[def.loreId]){this.game.hud.say('ЦИЛИНДР УЖЕ ИЗВЛЕЧЁН','');return;}
    gs.loreIds[def.loreId]=true;gs.lore++;gs.save();
    this.game.audio.lore();this.game.hud.showLore(def.text,def.title);}
}
