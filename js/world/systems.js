"use strict";
/* ============================== ABILITIES / GATES / CHECKPOINT / SALVAGE ============================== */
const ABILITIES={
  pulse:{short:'PULSE',name:'РЕЗАК PUSH-PULSE',keys:[['K'],['C'],['ПКМ']],
    desc:'ДВИГАЕТ ТО, ЧЕГО НЕ СДВИНУТЬ РУКАМИ.'},
  dash:{short:'DASH',name:'КЛАПАН DASH',keys:[['SHIFT'],['L'],['Z']],
    desc:'КОРОТКИЙ РЫВОК. В ВОЗДУХЕ ТОЖЕ.'},
  hook:{short:'HOOK',name:'ГАРПУН КРАНОВЩИКА',keys:[['U'],['V'],['RT']],
    desc:'ТРОС К ЛАТУННОМУ РЫМУ. ЛЕБЁДКА ТЯНЕТ КУРЬЕРА ДАЛЬШЕ, ЧЕМ ДОСТАНЕТ ПРЫЖОК.'},
  claws:{short:'CLAWS',name:'КОШКИ КУРЬЕРА',keys:[['SPACE']],
    desc:'ЦЕПЛЯЮТСЯ ЗА РИФЛЁНУЮ СТАЛЬ.'},
  magnet:{short:'MAGNET',name:'МАГНИТНЫЕ ПОДКОВЫ',keys:[['SPACE']],
    desc:'ЛАТУНЬ ПОД СВОДОМ ДЕРЖИТ, ПОКА ДЕРЖИШЬ ПРЫЖОК.'},
  filter:{short:'FILTER',name:'СКАФАНДР MK-II',keys:[],
    desc:'В ПЫЛЬЦЕ МОЖНО ДЫШАТЬ — ПОКА ЕСТЬ ЗАПАС.'},
  breaker:{short:'BREAK',name:'ПРОБОЙНИК РЕЗАКА',keys:[['K'],['C'],['ПКМ']],
    desc:'ИМПУЛЬС ПРОБИВАЕТ СВИНЦОВЫЕ ЗАГЛУШКИ С ТРЕЩИНОЙ.'},
  vjump:{short:'VENT',name:'ВЫХЛОП РАНЦА',keys:[['SPACE']],
    desc:'В ВОЗДУХЕ — ЕЩЁ ОДИН ПРЫЖОК: РАНЕЦ СТРАВЛИВАЕТ ПАР ВНИЗ.'}
};
/* порядок модулей в HUD и в решателе прогрессии */
const ABILITY_ORDER=['pulse','dash','hook','claws','filter','magnet','breaker','vjump'];
const UPGRADES={
  energy_cap:{name:'РЕСИВЕР ДАВЛЕНИЯ',desc:'ЗАПАС ДАВЛЕНИЯ +50%: ИМПУЛЬСОВ ПОДРЯД — ПЯТЬ ВМЕСТО ТРЁХ.'},
  filter_cap:{name:'ФИЛЬТР · ДОП. КАССЕТА',desc:'ЁМКОСТЬ ФИЛЬТРА MK-II +60%.'},
  weld_kit:{name:'СВАРОЧНЫЙ КОМПЛЕКТ',desc:'ЗАПАС РЕМОНТА +50%: ТРИ ШВА ВМЕСТО ДВУХ.'},
  dash_mk2:{name:'КЛАПАН DASH · MK-II',desc:'ВТОРОЙ РЫВОК В ВОЗДУХЕ.'},
  pulse_power:{name:'ФОРСУНКА РЕЗАКА',desc:'ИМПУЛЬС ДОСТАЁТ НА ТРЕТЬ ДАЛЬШЕ И ТОЛКАЕТ СИЛЬНЕЕ.'},
  dash_cd:{name:'ОБЛЕГЧЁННЫЙ КЛАПАН',desc:'РЫВОК ПЕРЕЗАРЯЖАЕТСЯ ПОЧТИ ВДВОЕ БЫСТРЕЕ.'},
  evade_win:{name:'ГИРОСКОП ОБХОДЧИКА',desc:'ИДЕАЛЬНОЕ УКЛОНЕНИЕ ЛОВИТСЯ В ПОЛТОРА РАЗА ШИРЕ.'},
  heal_fast:{name:'БЫСТРЫЙ ШОВ',desc:'ЗАЛАТАТЬ КУРТКУ ВЫХОДИТ ВДВОЕ БЫСТРЕЕ.'},
  weld_kit2:{name:'СВАРОЧНЫЙ БАЛЛОН',desc:'ЗАПАС РЕМОНТА ЕЩЁ +50%.'},
  mark_long:{name:'ЖИРНЫЙ МЕЛ',desc:'СЛЕД РЫВКА НА ДЕТАЛИ ДЕРЖИТСЯ ПОЧТИ ВДВОЕ ДОЛЬШЕ.'},
  stun_long:{name:'ЗУБИЛО ЧАСОВЩИКА',desc:'СОРВАННЫЙ ЗАМАХ ДЕРЖИТ МЕХАНИЗМ ОТКРЫТЫМ ДОЛЬШЕ.'},
  heavy_fast:{name:'ТЯЖЁЛАЯ РУКОЯТЬ',desc:'ЗАРЯЖЕННЫЙ УДАР КОПИТСЯ ПОЧТИ ВДВОЕ БЫСТРЕЕ.'},
  scrap_magnet:{name:'МАГНИТ ЛОМА',desc:'ЛОМ ИЗ СЛОМАННЫХ ДЕТАЛЕЙ ЛЕТИТ К КУРЬЕРУ ИЗДАЛЕКА И ДАЁТ БОЛЬШЕ РЕМОНТА.'}
};
/* правду можно сказать ярусам, когда её достаточно */
const BROADCAST_N=18;
/* пластины куртки: любая plate_* — ещё одна ячейка (и сразу полная починка) */
const PLATE_UP={name:'ПЛАСТИНА КУРТКИ',desc:'ДВЕ ПЛАСТИНЫ — ЕЩЁ ОДНА ЯЧЕЙКА ДАВЛЕНИЯ. КУРТКА ЗАЛАТАНА ЦЕЛИКОМ.'};
function grantUpgrade(g,u){
  if(!UPGRADES[u]&&u.indexOf('plate_')===0)UPGRADES[u]=PLATE_UP;
  g.gs.flag(u);g.audio.pickup();g.flash(0.3);
  if(u.indexOf('plate_')===0){g.gs.hp=g.gs.maxHp();g.hud.buildHp();g.hud.syncHp();
    g.hud.say(g.gs.plates()%2?'ПОЛОВИНА ЯЧЕЙКИ. НУЖНА ЕЩЁ ОДНА ПЛАСТИНА.':'ЯЧЕЙКА СОБРАНА. КУРТКА ДЕРЖИТ БОЛЬШЕ.','');}
}
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
  {t:'НАСОСЫ ЯРУСА −41 СТОЯТ ТРЕТЬИ СУТКИ. ВВЕРХ ВЕДЁТ ГАЛЕРЕЯ ОБХОДЧИКОВ.',done:gs=>!!gs.visited.z1_charge},
  {t:'НА ИСПЫТАТЕЛЬНОМ СТЕНДЕ — РЕЗАК И КЛАПАН. МЕХАНИЗМЫ СТЕНДА ЕЩЁ НА ИСПЫТАНИИ.',done:gs=>!!gs.flags.charge_test},
  {t:'НАСОСНАЯ СТАНЦИЯ. ВОСТОЧНЫЙ КОРИДОР ЗАВАЛЕН, НАД ЗАВАЛОМ ХОДИТ КРАН-БАЛКА.',done:gs=>!!gs.flags.east_crane},
  {t:'ЗА КОРИДОРОМ — РЕМОНТНЫЙ ЦЕХ. РЕМОНТНИКИ НЕ ЛЮБЯТ ЧУЖИХ.',done:gs=>!!gs.flags.arena_cleared},
  {t:'ГРУЗОВОЙ ПУТЬ НАВЕРХ ДЕРЖИТ НАДСМОТРЩИК. ЕГО ГЕРМОЗОНА — ЗА СЕЙФ-КОМНАТОЙ.',done:gs=>!!gs.bosses.overseer},
  {t:'ГАРПУН КРАНОВЩИКА ЦЕПЛЯЕТСЯ ЗА РЫМЫ. НАД ПРОПАСТЬЮ ШЛЮЗА ИХ ЦЕЛЫЙ РЯД.',done:gs=>!!gs.visited.z2_escalator},
  {t:'В СОТАХ ВСЁ ВЕДЁТ ВВЕРХ ПО ГЛАДКИМ СТЕНАМ. В КВАРТИРАХ ЖИЛИ МОНТАЖНИКИ.',done:gs=>gs.has('claws')},
  {t:'ДАВЛЕНИЕ НА НАШ ЯРУС ИДЁТ ИЗ ТУРБИННОГО ЗАЛА. ТУДА — ЧЕРЕЗ ЛЕСТНИЧНУЮ КЛЕТЬ.',done:gs=>!!gs.visited.z2_turbine},
  {t:'ТУРБИНЫ ПЕРЕКРЫТЫ НА ДВУХ КЛАПАНАХ. ЭТО НЕ АВАРИЯ.',done:gs=>!!gs.flags.turbines_on,
    extra:gs=>((gs.flags.valve_l?1:0)+(gs.flags.valve_r?1:0))+'/2'},
  {t:'ДАВЛЕНИЕ ДЕРЖИТ НА СЕБЕ ЦЕНЗОР-ПРИМАРХ.',done:gs=>!!gs.bosses.primarch},
  {t:'ЛИСТЬЯ РАСТУТ ТОЛЬКО В САДАХ ЭДЕМА. ШЛЮЗ — ЗА КАБИНЕТОМ ПРИМАРХА.',done:gs=>!!gs.visited.z3_greenhouse},
  {t:'САДЫ ПУСТЫ. ЕСЛИ КТО-ТО ОСТАЛСЯ — ТО ВНИЗУ, В ТЕХНИЧЕСКИХ КАНАЛАХ.',done:gs=>gs.has('magnet')},
  {t:'САДОВНИК НЕ ЗНАЕТ ЭТОГО ЛИСТА. ЗА ЗАЛОМ ЛАМП-СОЛНЦ — САРАЙ КОРЧЕВАТЕЛЯ.',done:gs=>!!gs.bosses.uprooter},
  {t:'ПРОБОЙНИК ВЫБИВАЕТ СВИНЕЦ. ПОДЪЁМНИК КУПОЛА ЗАПАЯН СВИНЦОМ.',done:gs=>!!gs.flags.lead_dome},
  {t:'КУПОЛ ВЕДЁТ К ШЛЮЗУ ПЕЧАТИ.',done:gs=>!!gs.visited.z4_antechamber},
  {t:'ПОДЪЁМНИК ПРЕДПЕЧАТЬЯ ЖДЁТ ДАВЛЕНИЯ ТРЁХ МАГИСТРАЛЕЙ.',done:gs=>!!gs.flags.seal_gauges,
    extra:gs=>((gs.flags.gaugeA?1:0)+(gs.flags.gaugeB?1:0)+(gs.flags.gaugeC?1:0))+'/3'},
  {t:'ХОД ПЕЧАТИ ЗАДАЁТ РЕГУЛЯТОР. ЕГО ЦИФЕРБЛАТ — НАВЕРХУ БАШНИ.',done:gs=>!!gs.bosses.regulator},
  {t:'ЧАСЫ ВСТАЛИ. ЗА НИМИ — ВОРОТА В АРХИВ СОВЕТА.',done:gs=>!!gs.visited.z5_hall},
  {t:'СОВЕТ ЗАСЕДАЕТ В ГЛУБИНЕ АРХИВА. ЕСЛИ ОН ЕЩЁ ЕСТЬ.',done:gs=>!!gs.flags.council_heard},
  {t:'СОВЕТ — ЭТО ПЛАСТИНКИ. ПЕЧАТЬ СТЕРЕЖЁТ АРХИВАРИУС. ПОДЪЁМНИК — ЗА СКЛЕПОМ.',done:gs=>!!gs.flags.archivist_dead},
  {t:'КОЛЕСО ПЕЧАТИ СВОБОДНО.',done:gs=>!!gs.flags.wheel_turned},
  {t:'ЗА ПЕЧАТЬЮ — СВЕТ.',done:()=>false}
];
/* журнал в паузе: две прошлые записи бледно, текущая — ярко */
function journalHTML(gs){let ci=OBJECTIVES.findIndex(o=>!o.done(gs));if(ci<0)ci=OBJECTIVES.length-1;
  let h='<div class="jh">ЗАПИСИ КУРЬЕРА</div>';
  for(let i=Math.max(0,ci-2);i<ci;i++)h+='<p class="old">'+OBJECTIVES[i].t+'</p>';
  const o=OBJECTIVES[ci];h+='<p class="cur">'+o.t+(o.extra?' <b>'+o.extra(gs)+'</b>':'')+'</p>';
  /* побочное: вещательный массив ждёт правды */
  if(gs.visited.z5_broadcast&&!gs.flags.broadcast_done)h+='<p class="old">ВЕЩАТЕЛЬНЫЙ МАССИВ: ЗАПИСЕЙ <b>'+(gs.lore||0)+'/'+BROADCAST_N+'</b> — ТОГДА ПОВЕРЯТ.</p>';
  return h;}
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
    if(d.locked||!d.to||d.oneway)return true;   /* oneway: только вход (дыра в своде) — изнутри не выйти */
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
  /* цилиндр — фонограмма: игла, шорох и далёкий голос; текст — субтитрами (если включены) и в архиве */
  lore(def){const g=this.game,gs=g.gs,L=LORE[def.loreId]||{};
    if(gs.loreIds[def.loreId]){g.hud.say('ЦИЛИНДР УЖЕ ИЗВЛЕЧЁН','');return;}
    gs.loreIds[def.loreId]=true;gs.lore=Object.keys(gs.loreIds).length;gs.save();
    const text=def.text||L.text||'',title='ЦИЛИНДР №'+def.loreId+' · '+(L.title||def.title||'');
    g.audio.lore();g.audio.phono(clamp(text.length*0.055,3,9));
    if(Settings.get('subs'))g.hud.showLore(text,title);
    else{g.hud.say(title,'ЗАПИСЬ — В АРХИВЕ (ESC)');g.hud.syncAbilities();}}
}
