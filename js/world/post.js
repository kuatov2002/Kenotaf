"use strict";
/* ============================== ПНЕВМОПОЧТА ============================== */
/* Совет перекрыл магистраль пневмопочты, чтобы ярусы не переписывались. Курьер её возвращает:
   главный клапан — за сортировочным провалом Главпочтамта (только по магнитным рельсам под сводом).
   Включённая сеть — быстрые переезды между станциями в хабах зон. Станция подключается, когда курьер
   впервые её открывает. Почтмейстер принимает цилиндры с записями и платит за них. */
const STATIONS={
  post:{room:'z2_post',x:36.9,y:20,name:'ГЛАВПОЧТАМТ',zone:'СОТЫ'},
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
function postmasterScene(gs,byPost){
  const L=[];const ups=[];const flags=[];
  if(!gs.flags.pm_met&&!byPost){
    flags.push('pm_met');
    L.push('КУРЬЕР? ЖИВОЙ? ПОСЛЕДНИЙ ДОХОДИЛ СЮДА ГОД НАЗАД.',
      'ЭТО ГЛАВПОЧТАМТ. СОВЕТ ВЕЛЕЛ ПЕРЕКРЫТЬ МАГИСТРАЛЬ — ЧТОБЫ ЯРУСЫ НЕ ПЕРЕПИСЫВАЛИСЬ. Я ПЕРЕКРЫЛА.');
    if(!gs.flags.post_on){flags.push('post_on');
      L.push('А ТЕПЕРЬ ОТКРЫВАЮ. ГЛАВНЫЙ КЛАПАН — ВОТ ОН, У КОНТОРКИ. СЛЫШИШЬ? КАПСУЛЫ ПОШЛИ.',
        'СТАНЦИИ В ХАБАХ ЗОН ОЖИЛИ. ОТКРЫВАЙ ЛЮКИ — ПЕРЕЕЗД МЕЖДУ НИМИ, А ЦИЛИНДРЫ ШЛИ МНЕ С ЛЮБОЙ.');}
    L.push('ЦИЛИНДРЫ С ЗАПИСЯМИ — МНЕ. Я УМЕЮ ИХ ЧИТАТЬ. И ПЛАЧУ ЗА НИХ — ЧЕМ МОГУ. И ПИШУ — ЖДИ ПИСЕМ.');
  }
  const had=gs.flags.lore_given||0,have=gs.lore||0;
  if(have>had){
    L.push(have-had===1?'ЕЩЁ ОДИН ЦИЛИНДР. ПОСМОТРИМ…':'ЦИЛИНДРОВ: '+(have-had)+'. ПОСМОТРИМ…');
    for(const r of POST_REWARDS)if(had<r.n&&have>=r.n){L.push(r.line);if(r.upgrade)ups.push(r.upgrade);if(r.flag)flags.push(r.flag);
      if(r.flag==='post_truth')L.push('КАПСУЛЫ «ОТ ПЕЧАТИ» ПРИХОДЯТ СВЕРХУ, ЧЕРЕЗ ЗАБОРНИК №3. ТАМ КТО-ТО ЖИВ.',
        'ЦЕНЗУРА ЗАБИРАЕТ ИХ НЕВСКРЫТЫМИ. ТВОЮ Я НЕ СДАЛА.','Я ОТПРАВИЛА ЕЁ ТЕБЕ. ЛИСТ — ЭТО Я.');}
    gs.flags.lore_given=have;
  }else if(gs.flags.pm_met&&!L.length){
    L.push(have>=30?'ВСЁ ПРОЧИТАНО. ИДИ НАВЕРХ, КУРЬЕР. ПОЧТА НЕ ЖДЁТ.'
      :'НОВЫХ ЦИЛИНДРОВ НЕТ? ПРОЧИТАНО: '+have+' ИЗ 30. ПОЧТА НЕ ЖДЁТ.');
  }
  return {lines:L,upgrades:ups,flags};
}

/* ---------- ПОЧТА КАК МЕХАНИКА ----------
   Станция в хабе делает три вещи — и говорит об этом:
     1) ЦИЛИНДРЫ → почтмейстеру: найденные записи уходят капсулой с любой станции, плата приходит обратно;
     2) ПИСЬМА ← от почтмейстера: по одному за визит — она следит за курьером, отвечает на его находки
        и подсказывает, куда дальше (сеть слышит, что творится на ярусах);
     3) ПЕРЕЕЗД между подключёнными станциями.
   Сеть открывает сама почтмейстер при первой встрече (главный клапан — у её конторки). */
const LETTERS=[
  {id:'net',when:gs=>gs.flags.post_on,lines:[
    'КУРЬЕР. ЭТО ПОЧТМЕЙСТЕР. ПИШУ НА ВСЕ СТАНЦИИ СРАЗУ — КАКУЮ-НИБУДЬ ТЫ ОТКРОЕШЬ.',
    'ЛЮК В ХАБЕ — ПЕРЕЕЗД. ЦИЛИНДРЫ ШЛИ МНЕ ОТСЮДА ЖЕ: ПЛАЧУ ОБРАТНОЙ КАПСУЛОЙ.',
    'НЕ ХОДИ ПЕШКОМ ТАМ, ГДЕ ЛЕТЯТ ПИСЬМА.']},
  {id:'primarch',when:gs=>gs.bosses.primarch,lines:[
    'ТУРБИНЫ ГУДЯТ ДО САМОГО ГЛАВПОЧТАМТА. ЗНАЧИТ, ПРИМАРХ ЛЁГ.',
    'ЦЕНЗУРА ВСКРЫВАЛА МОИ КАПСУЛЫ СОРОК ЛЕТ. ТЕПЕРЬ НЕКОМУ.',
    'ЛИСТЬЯ, КАК ТВОЙ, РАСТУТ ВЫШЕ — В САДАХ ЭДЕМА. ШЛЮЗ ТУДА — ЗА ЕГО КАБИНЕТОМ.']},
  {id:'eden',when:gs=>gs.visited.z3_greenhouse,lines:[
    'ТЫ В САДАХ? ВОЗДУХ ТАМ ПАХНЕТ ТАК, БУДТО НАВЕРХУ ЛЕТО.',
    'САДОВНИКИ ПИСАЛИ МНЕ ДО ПРОШЛОГО ГОДА. ПОСЛЕДНЕЕ ПИСЬМО ПРИШЛО ИЗ ТЕХНИЧЕСКИХ КАНАЛОВ, СНИЗУ.',
    'ЕСЛИ КТО-ТО ЖИВ — ОН ТАМ, ПОД ОРАНЖЕРЕЯМИ.']},
  {id:'gardener',when:gs=>gs.has('magnet'),lines:[
    'СТАРИК ЖИВ? Я ТАК И ЗНАЛА. СЕМЕНА, ЧТО ОН ПРОСИЛ, Я ОТПРАВЛЯЛА — ЗНАЧИТ, ДОШЛИ.',
    'ОН НЕ ВЕРИТ, ЧТО НАВЕРХУ ЧТО-ТО РАСТЁТ. А ЛИСТ В ТВОЕЙ КАПСУЛЕ — НЕ ЕГО.']},
  {id:'uprooter',when:gs=>gs.bosses.uprooter,lines:[
    'КОРЧЕВАТЕЛЬ ВЫПАЛЫВАЛ ВСЁ, ЧЕГО НЕТ В КАТАЛОГЕ. ТВОЙ ЛИСТ ОН БЫ ВЫРВАЛ ПЕРВЫМ.',
    'ПОДЪЁМНИК КУПОЛА ЗАПАЯН СВИНЦОМ. ТЕПЕРЬ У ТЕБЯ ЕСТЬ ЧЕМ ЕГО ВЫБИТЬ.']},
  {id:'seal',when:gs=>gs.visited.z4_antechamber,lines:[
    'ПРЕДПЕЧАТЬЕ. ДАЛЬШЕ МОИ КАПСУЛЫ НЕ ХОДЯТ — МАГИСТРАЛИ БЕЗ ДАВЛЕНИЯ.',
    'ТРИ МАНОМЕТРА — ТРИ ЭКЗАМЕНА. СОВЕТ ЛЮБИЛ ЭКЗАМЕНЫ: ИХ ВСЕГДА СДАВАЛИ ДРУГИЕ.']},
  {id:'regulator',when:gs=>gs.bosses.regulator,lines:[
    'ЧАСЫ ВСТАЛИ? ВНИЗУ СТАЛО ТИХО. Я ВПЕРВЫЕ УСЛЫШАЛА, КАК ПОЁТ ВОДА В ТРУБАХ.',
    'АРХИВ СОВЕТА — ЗА ЧАСАМИ. ЕСЛИ НАЙДЁШЬ ТАМ ЛЮДЕЙ — ПРИНЕСИ ИХ ПОЧЕРК.']},
  {id:'archive',when:gs=>gs.visited.z5_hall,lines:[
    'В АРХИВЕ ЛЕЖАТ МОИ СТАРЫЕ КАПСУЛЫ. ВСЕ, ЧТО ЦЕНЗУРА НЕ ДОСТАВИЛА.',
    'УВИДИШЬ СВОЁ ИМЯ НА КОНВЕРТЕ — ЧИТАЙ. ТЕБЕ МОЖНО.']},
  {id:'c38',when:gs=>(gs.flags.c38_marks||0)>=3,lines:[
    'ТЫ ИДЁШЬ ПО ЕГО МЕЛУ, ДА? «38 ДОШЁЛ…» ТРИДЦАТЬ ВОСЬМОЙ БЫЛ МОИМ ЛУЧШИМ КУРЬЕРОМ.',
    'ГОД НАЗАД ОН УНЁС НАВЕРХ ЛИСТ ДЛЯ СОВЕТА. ОБРАТНО НЕ ПРИШЁЛ НИ ОН, НИ ОТВЕТ.',
    'ЕСЛИ НАЙДЁШЬ — НЕ ОСТАВЛЯЙ ЕГО ТАМ ОДНОГО.']},
  {id:'council',when:gs=>gs.flags.council_heard,lines:[
    'СОВЕТ — ПЛАСТИНКИ? ДВЕСТИ ЛЕТ МЫ СЛУШАЛИ ЗАПИСЬ.',
    'КУРЬЕР. ЧТО БЫ ТАМ НИ БЫЛО НАВЕРХУ — ОТКРОЙ. МЫ ДОСТАТОЧНО ЖДАЛИ.']}
];
const PostNet={
  undelivered(gs){return Math.max(0,(gs.lore||0)-(gs.flags.lore_given||0));},
  letter(gs){if(!gs.flags.post_on)return null;for(const L of LETTERS)if(!gs.flags['letter_'+L.id]&&L.when(gs))return L;return null;},
  /* что ждёт на станции (для подсказки у люка и лампы-капсулы) */
  pending(gs){if(!gs.flags.post_on)return '';const n=this.undelivered(gs),L=this.letter(gs);
    return n&&L?'ПИСЬМО · ЦИЛИНДРОВ К ОТПРАВКЕ: '+n:n?'ОТПРАВИТЬ ЦИЛИНДРЫ: '+n:L?'ПИСЬМО ОТ ПОЧТМЕЙСТЕРА':'';},
  /* визит к станции: отправить цилиндры и/или забрать письмо. Возвращает сцену или null (тогда — переезд) */
  visit(game,x,y){const gs=game.gs,lines=[],ups=[],flags=[];
    const n=this.undelivered(gs);
    if(n){lines.push('КАПСУЛА С ЦИЛИНДРАМИ УХОДИТ В ТРУБУ: '+n+'. ЧЕРЕЗ МИНУТУ — ОБРАТНАЯ.');
      const sc=postmasterScene(gs,true);lines.push(...sc.lines);ups.push(...sc.upgrades);flags.push(...sc.flags);}
    const L=this.letter(gs);
    if(L){flags.push('letter_'+L.id);lines.push(...L.lines);}
    if(!lines.length)return null;
    game.audio.elevator();game.audio.hitMetal();
    return {x,y,title:'ПНЕВМОПОЧТА · ПОЧТМЕЙСТЕР',speaker:'postmaster',lines,upgrades:ups,setFlags:flags};}
};

/* меню переезда: список подключённых станций, ↑/↓ — выбор, E/ПРОБЕЛ — ехать, ESC — назад */
class TravelMenu{
  constructor(game){this.game=game;this.el=null;this.list=[];this.sel=0;this.from=null;}
  open(from){
    const g=this.game,gs=g.gs;
    this.from=from;this.list=STATION_ORDER.filter(k=>k!==from&&gs.flags['st_'+k]);
    if(!this.list.length){g.hud.say('ДРУГИХ СТАНЦИЙ В СЕТИ НЕТ. ЛЮК В ХАБЕ КАЖДОЙ ЗОНЫ ПОДКЛЮЧАЕТСЯ, КОГДА ТЫ ЕГО ОТКРОЕШЬ.','ПНЕВМОПОЧТА');return;}
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
