"use strict";
/* ============================== ПОЧТМЕЙСТЕР И САДОВНИК В ХАБАХ ==============================
   Они не стоят на месте: идут следом за курьером, из хаба в хаб, ближе к Печати.
   Почтмейстер — с главпочтамта (после встречи) в Оранжереи, Предпечатье, Прихожую архива.
   Садовник — из коллектора (отдав подковы) в Оранжереи, после Корчевателя — в Предпечатье,
   после Регулятора — в Прихожую. У каждого — своё: она считает цилиндры и метки 38 и знает,
   где курьер что-то пропустил; он слышит сквозняк в стенах и знает про заначки. */
const HUB_SPOT={
  z3_greenhouse:{pm:{x:18.4,y:30,face:1},gd:{x:22.6,y:30,face:-1}},
  z4_antechamber:{pm:{x:26.6,y:24,face:-1},gd:{x:31.4,y:24,face:-1}},
  z5_hall:{pm:{x:18.2,y:21,face:-1},gd:{x:22.8,y:21,face:-1}}
};
const HubNPC={
  /* где сейчас стоит персонаж */
  room(gs,who){const V=gs.visited,F=gs.flags,B=gs.bosses;
    if(who==='pm'){if(!F.post_on)return 'z2_post';
      if(V.z5_hall)return 'z5_hall';if(V.z4_antechamber)return 'z4_antechamber';if(V.z3_greenhouse)return 'z3_greenhouse';return 'z2_post';}
    if(!F.got_magnet||!F.gard_moved)return 'z3_collector';
    if(B.regulator)return 'z5_hall';if(B.uprooter)return 'z4_antechamber';return 'z3_greenhouse';},
  /* вход в комнату: хаб — поставить тех, кто сюда переехал */
  place(W){const gs=W.game.gs,id=W.room.id,S=HUB_SPOT[id];
    if(gs.flags.got_magnet&&id!=='z3_collector'&&!gs.flags.gard_moved)gs.flags.gard_moved=true;
    if(!S)return;
    for(const who of ['pm','gd']){if(this.room(gs,who)!==id)continue;const s=S[who];
      W.interactables.push(new Interactable({kind:'hubtalk',who,x:s.x,y:s.y,w:1.8,h:2.2},W));
      (W.room.npcs=W.room.npcs||[]).push({bounds:()=>({x:s.x-1.8,y:s.y-3.7,w:3.6,h:3.9}),draw:(c,t)=>{
        const p=W.player,look=p&&Math.abs(p.cx-s.x)<4.5?(p.cx<s.x?-1:1):0;
        if(who==='pm')drawPostmaster(c,s.x,s.y-1.2,t,look);
        else Kit.gardener(c,s.x,s.y,2,look||s.face,t,{});}});}},
  /* в пройденных залах зоны: где ещё что-то лежит (сальваж, цилиндр, заначка) */
  missed(gs,zone,kinds){const out=[];
    for(const id in MAPLAYOUT){if(!gs.visited[id]||!ROOMDEFS[id])continue;let R;try{R=new Room(ROOMDEFS[id],gs);}catch(e){continue;}
      if(R.zone!==zone||R.trial)continue;
      for(const d of R.interactables){
        if(kinds.indexOf(d.kind)<0)continue;
        if(d.kind==='salvage'&&gs.flags[d.flag])continue;if(d.kind==='lore'&&gs.loreIds[d.loreId])continue;
        if(d.kind==='stash'&&gs.flags['stash_'+d.id])continue;
        out.push({room:id,name:R.name,kind:d.kind});break;}}
    return out;},
  lines(game,who){const gs=game.gs,id=game.world.room.id,zone=game.world.room.zone,L=[];
    const lore=gs.lore||0,marks=gs.flags.c38_marks||0,mods=gs.ownedMods().length;
    const trialsLeft=Object.keys(TRIALS).filter(t=>gs.visited[t]&&!gs.flags['trial_'+t]);
    if(who==='pm'){
      L.push({z3_greenhouse:'ПЕРЕБРАЛАСЬ ПОБЛИЖЕ К СВЕТУ. СТАНЦИЯ ТУТ ЖИВАЯ — ПИСЬМА БУДУТ.',
        z4_antechamber:'ПОД САМОЙ ПЕЧАТЬЮ ДАВЛЕНИЕ ЛУЧШЕ. ДА И ТЕБЯ ОТСЮДА ВИДНО.',
        z5_hall:'В АРХИВЕ ЛЕЖАТ МОИ НЕДОСТАВЛЕННЫЕ КАПСУЛЫ. Я ПРИШЛА ЗА НИМИ. И ЗА ТОБОЙ ПРИСМОТРЕТЬ.'}[id]||'КУРЬЕР.');
      if(gs.flags.c38_met)L.push('ТЫ НАШЁЛ ЕГО. …СПАСИБО, ЧТО НЕ ОСТАВИЛ ЕГО ТАМ ОДНОГО.');
      else if(marks>0)L.push('ТЫ ИДЁШЬ ПО ЕГО МЕЛУ — МЕТОК УЖЕ '+marks+'. ТРИДЦАТЬ ВОСЬМОЙ ПИСАЛ ДОРОГУ ДЛЯ ТОГО, КТО ПОЙДЁТ СЛЕДОМ.');
      L.push('ЦИЛИНДРОВ У ТЕБЯ '+lore+' ИЗ '+LORE_TOTAL+'. '+(lore>=BROADCAST_N?'ЭТОГО ХВАТИТ, ЧТОБЫ ЯРУСЫ ПОВЕРИЛИ.':'ЕЩЁ '+(BROADCAST_N-lore)+' — И ЯРУСЫ ПОВЕРЯТ.'));
      if(mods>gs.slots())L.push('В РАНЦЕ '+mods+' МОДУЛЕЙ, А ГНЁЗД '+gs.slots()+'. НЕ НОСИ ВСЁ — НОСИ ТО, ЧЕМ ДЕРЁШЬСЯ.');
      if(trialsLeft.length)L.push('СТЕНД «'+TRIALS[trialsLeft[0]].n+'» ЕЩЁ ЖДЁТ ТВОЕГО ВРЕМЕНИ. ТАМ НЕ РАНЯТ — ТАМ УЧАТ.');
      const m=this.missed(gs,zone,['salvage','lore']);
      L.push(m.length?'ПО ЗОНЕ ГОВОРЯТ: В «'+m[0].name+'» ТЫ ЧТО-ТО ОСТАВИЛ.':'ТУТ ТЫ ВСЁ ПОДОБРАЛ. '+currentObjective(gs));
    }else{
      L.push({z3_greenhouse:'ПОЛИВАЮ, ЧТО ЕЩЁ МОЖНО. ЛАМПЫ ГРЕЮТ, НО НЕ СВЕТЯТ.',
        z4_antechamber:'КОРЧЕВАТЕЛЬ ЗАТИХ. Я ПРИНЁС СЮДА СЕМЕНА: ПУСТЬ ПЕЧАТЬ ВИДИТ, ЧТО МЫ НЕ СДАЛИСЬ.',
        z5_hall:'АРХИВ ПАХНЕТ ПЫЛЬЮ И ЧЕРНИЛАМИ. ПЫЛЬЦА — ТОЖЕ ЧЕРНИЛА, ЕСЛИ УМЕТЬ ЧИТАТЬ.'}[id]||'КУРЬЕР.');
      const found=Object.keys(gs.flags).filter(k=>k.indexOf('stash_')===0).length;
      L.push('ГДЕ ИЗ СТЕНЫ ТЯНЕТ СКВОЗНЯКОМ — ТАМ ПУСТОТА. СТУКНИ КЛЮЧОМ: ПУСТАЯ СТЕНА ОТВЕЧАЕТ ГЛУХО.'+(found?' ЗАНАЧЕК У ТЕБЯ УЖЕ '+found+'.':''));
      const m=this.missed(gs,zone,['stash']);
      if(m.length)L.push('В «'+m[0].name+'» СКВОЗИТ. Я БЫ ПОСЛУШАЛ ТАМ СТЕНЫ.');
      if(marks>=3&&!gs.flags.c38_met)L.push('ТОТ МАЛЬЧИК, ТРИДЦАТЬ ВОСЬМОЙ, ПРЯТАЛ СВОЁ ПО ДОРОГЕ. ЗНАЧИТ, СОБИРАЛСЯ ВЕРНУТЬСЯ.');
      if(gs.bosses.uprooter)L.push('САДЫ ДЫШАТ ЛЕГЧЕ. ТВОЙ ЛИСТ Я ПОМНЮ НА ОЩУПЬ — ТАКИЕ РАСТУТ ПОД НАСТОЯЩИМ НЕБОМ.');
    }
    return L;}
};
