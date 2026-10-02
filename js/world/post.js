"use strict";
/* ============================== ПНЕВМОПОЧТА ============================== */
/* Совет перекрыл магистраль пневмопочты, чтобы ярусы не переписывались. Курьер её возвращает:
   главный клапан — за сортировочным провалом Главпочтамта (только по магнитным рельсам под сводом).
   Включённая сеть — быстрые переезды между станциями в хабах зон. Станция подключается, когда курьер
   впервые её открывает. Почтмейстер принимает цилиндры с записями и платит за них. */
const STATIONS={
  post:{room:'z2_post',x:5.6,y:16,name:'ГЛАВПОЧТАМТ',zone:'СОТЫ'},
  hub:{room:'z1_hub',x:9.4,y:34,name:'НАСОСНАЯ СТАНЦИЯ',zone:'ОТСТОЙНИК'},
  atrium:{room:'z2_atrium',x:30.5,y:35,name:'СОТЫ-АТРИУМ',zone:'СОТЫ'},
  eden:{room:'z3_greenhouse',x:15.6,y:30,name:'ОРАНЖЕРЕИ',zone:'ЭДЕМ'},
  seal:{room:'z4_antechamber',x:15.8,y:24,name:'ПРЕДПЕЧАТЬЕ',zone:'ПЕЧАТЬ'},
  archive:{room:'z5_hall',x:13,y:21,name:'ПРИХОЖАЯ АРХИВА',zone:'АРХИВ'}
};
const STATION_ORDER=['hub','atrium','post','eden','seal','archive'];

/* Почтмейстер: что сказать и что выдать сейчас. Цилиндры сдаются все сразу, награды — на порогах. */
const POST_REWARDS=[
  {n:3,upgrade:'plate_post1',line:'ТРИ ЗАПИСИ. ДЕРЖИ ПЛАСТИНУ ДЛЯ КУРТКИ — СНЯЛА С КУРЬЕРА 38. ЕМУ УЖЕ НЕ НУЖНА.'},
  {n:7,upgrade:'weld_kit',line:'СЕМЬ. СОВЕТ ВРАЛ АККУРАТНО, НО ВРАЛ. ВОТ СВАРОЧНЫЙ КОМПЛЕКТ — ШОВ ПОЙДЁТ ДАЛЬШЕ.'},
  {n:12,upgrade:'plate_post2',line:'ДВЕНАДЦАТЬ. Я ПЕРЕПИСЫВАЮ ИХ ОТ РУКИ И ШЛЮ ПО ЯРУСАМ. ЕЩЁ ПЛАСТИНА — ТЕБЕ НУЖНЕЕ.'},
  {n:18,upgrade:null,flag:'post_truth',line:'ВОСЕМНАДЦАТЬ. ЭТОГО ХВАТИТ, ЧТОБЫ ПОВЕРИЛИ. ТЕПЕРЬ СКАЖУ, ОТКУДА ТВОЙ ЛИСТ.'},
  {n:30,upgrade:null,flag:'post_all',line:'ВСЕ ТРИДЦАТЬ. ВСЯ ЛОЖЬ — И ВСЕ, КТО ЕЙ НЕ ПОВЕРИЛ. ИХ БЫЛО БОЛЬШЕ, ЧЕМ НАМ ГОВОРИЛИ.'}
];
function postmasterScene(gs){
  const L=[];const ups=[];const flags=[];
  if(!gs.flags.pm_met){
    flags.push('pm_met');
    L.push('КУРЬЕР? ЖИВОЙ? ПОСЛЕДНИЙ ДОХОДИЛ СЮДА ГОД НАЗАД.',
      'ЭТО ГЛАВПОЧТАМТ. БЫЛ. СОВЕТ ПЕРЕКРЫЛ МАГИСТРАЛЬ — ЧТОБЫ ЯРУСЫ НЕ ПЕРЕПИСЫВАЛИСЬ.',
      gs.flags.post_on?'А ТЫ ЕЁ УЖЕ ОТКРЫЛ. СЛЫШУ: КАПСУЛЫ ПОШЛИ.'
        :'ГЛАВНЫЙ КЛАПАН — ЗА СОРТИРОВКОЙ. ПО РЕЛЬСАМ ПОД СВОДОМ. ДЕРЖАТЬСЯ ТАМ НЕ ЗА ЧТО — ЕСЛИ НЕТ ПОДКОВ.',
      'ЦИЛИНДРЫ С ЗАПИСЯМИ НЕСИ МНЕ. Я УМЕЮ ИХ ЧИТАТЬ. И ПЛАЧУ ЗА НИХ — ЧЕМ МОГУ.');
  }
  const had=gs.flags.lore_given||0,have=gs.lore||0;
  if(have>had){
    L.push(have-had===1?'ЕЩЁ ОДИН ЦИЛИНДР. ПОСМОТРИМ…':'ЦИЛИНДРОВ: '+(have-had)+'. ПОСМОТРИМ…');
    for(const r of POST_REWARDS)if(had<r.n&&have>=r.n){L.push(r.line);if(r.upgrade)ups.push(r.upgrade);if(r.flag)flags.push(r.flag);
      if(r.flag==='post_truth')L.push('КАПСУЛЫ «ОТ ПЕЧАТИ» ПРИХОДЯТ СВЕРХУ, ЧЕРЕЗ ЗАБОРНИК №3. ТАМ КТО-ТО ЖИВ.',
        'ЦЕНЗУРА ЗАБИРАЕТ ИХ НЕВСКРЫТЫМИ. ТВОЮ Я НЕ СДАЛА.','Я ОТПРАВИЛА ЕЁ ТЕБЕ. ЛИСТ — ЭТО Я.');}
    gs.flags.lore_given=have;
  }else if(gs.flags.pm_met&&!L.length){
    L.push(have>=12?'ВСЁ ПРОЧИТАНО. ИДИ НАВЕРХ, КУРЬЕР. ПОЧТА НЕ ЖДЁТ.'
      :'НОВЫХ ЦИЛИНДРОВ НЕТ? ПРИНЕСЕНО: '+have+' ИЗ 12. ПОЧТА НЕ ЖДЁТ.');
  }
  return {lines:L,upgrades:ups,flags};
}

/* меню переезда: список подключённых станций, ↑/↓ — выбор, E/ПРОБЕЛ — ехать, ESC — назад */
class TravelMenu{
  constructor(game){this.game=game;this.el=null;this.list=[];this.sel=0;this.from=null;}
  open(from){
    const g=this.game,gs=g.gs;
    this.from=from;this.list=STATION_ORDER.filter(k=>k!==from&&gs.flags['st_'+k]);
    if(!this.list.length){g.hud.say('ДРУГИХ СТАНЦИЙ В СЕТИ НЕТ. ПОДКЛЮЧИ ИХ — ОТКРОЙ ЛЮК НА МЕСТЕ.','ПНЕВМОПОЧТА');return;}
    this.sel=0;this.el=this.el||document.getElementById('travel');
    g.state='travel';g.input.clearAll();g.audio.lever();
    this.render();this.el.classList.remove('hidden');
  }
  render(){
    const st=STATIONS[this.from];
    let h='<div class="tv-k">ПНЕВМОПОЧТА · '+(st?st.name:'')+'</div><div class="tv-l">';
    this.list.forEach((k,i)=>{const s=STATIONS[k];
      h+='<div class="tv-i'+(i===this.sel?' on':'')+'"><b>'+s.name+'</b><span>'+s.zone+'</span></div>';});
    h+='</div><div class="tv-h"><b>↑ ↓</b> ВЫБОР · <b>E</b> / <b>ПРОБЕЛ</b> — ОТПРАВИТЬ КАПСУЛУ · <b>ESC</b> — НАЗАД</div>';
    this.el.querySelector('.tv').innerHTML=h;
  }
  update(){
    const g=this.game,I=g.input;
    I.enabled=true;
    if(I.consume('up')){this.sel=(this.sel+this.list.length-1)%this.list.length;g.audio.tone(520,0.06,'sine',0.02);this.render();}
    if(I.consume('down')){this.sel=(this.sel+1)%this.list.length;g.audio.tone(520,0.06,'sine',0.02);this.render();}
    if(I.consume('use')||I.consume('jump')||I.consume('attack'))this.go(this.list[this.sel]);
  }
  close(){if(this.el)this.el.classList.add('hidden');const g=this.game;if(g.state==='travel'){g.state='play';g.input.clearAll();}}
  go(k){
    const g=this.game,s=STATIONS[k];if(!s)return;
    this.close();g.audio.elevator();g.audio.dash();
    g.transition(()=>{g.world.load(s.room,s.x-CFG.player.w/2,s.y-CFG.player.h);
      const p=g.world.player;g.particles.burst(p.cx,p.cy,26,{kind:'steam',col:'#dff0f6',spd:5,life:0.7,size:0.4,grow:1,drag:2});
      g.audio.hitMetal();});
  }
}
