"use strict";
/* ============================== ROOM BUILDER ==============================
   Короткие помощники для сборки комнат. Двери стоят на кромке пола (fy — верх пола под дверью),
   парная дверь в соседней комнате находится сама (pairDoor: link или единственная обратная).
   Комната получает «подзону» (R.sub) — визуальный язык внутри зоны (js/render/subart.js). */
const RB={
  /* стены и свод; пол — отдельными плитами (в нём бывают провалы и люки) */
  shell(R,mat,o){o=o||{};const w=R.w,h=R.h,ct=o.ceil===undefined?0.4:o.ceil;
    R.solids.push(S(-2,-2.4,w+4,2.4+ct,o.ceilMat||mat),S(-2,0,2,h+2,mat),S(w,0,2,h+2,mat));
    if(o.floor!==undefined)R.solids.push(S(-2,o.floor,w+4,h-o.floor+2,o.floorMat||mat));
    return R;},
  /* двери по краям: левая / правая, на полу fy */
  L(fy,to,label,o){return Object.assign({x:0,y:fy-2.1,w:1.2,h:2.1,to,label},o||{});},
  R(R,fy,to,label,o){return Object.assign({x:R.w-1.2,y:fy-2.1,w:1.2,h:2.1,to,label},o||{});},
  /* люк в полу (E — спуститься) и дыра в своде, куда сваливаются сверху (обратно — только если допрыгнуть) */
  hatch(x,fy,to,label,o){return Object.assign({x:x,y:fy-0.4,w:1.6,h:0.9,down:true,to,label},o||{});},
  top(x,to,label,o){return Object.assign({x:x,y:0.42,w:2.2,h:1.3,to,label},o||{});},
  /* провал в полу: падение — переход (fall) */
  pit(x,fy,w,to,label,o){return Object.assign({x:x,y:fy+0.6,w:w,h:1.0,to,label,fall:true},o||{});},
  lamp(R,x,fy){R.checkpoint={x:x,y:fy,h:1.7};},
  lore(R,gs,id,x,fy){if(!gs.loreIds[id])R.interactables.push({kind:'lore',loreId:id,x:x,y:fy});},
  salvage(R,gs,o){if(!gs.flags[o.flag])R.interactables.push(Object.assign({kind:'salvage'},o));},
  /* рым для гарпуна: mount — откуда растёт кронштейн */
  ring(R,x,y,mount,len){(R.anchors=R.anchors||[]).push({x:x,y:y,mount:mount||'top',len:len});},
  /* свинцовая заглушка: импульс с пробойником выбивает (флаг — навсегда) */
  lead(R,gs,id,x,y,w,h,flag){const f=flag||('lead_'+id);if(gs.flags[f])return;
    R.solids.push(S(x,y,w,h,'lead',{dyn:true,pid:id}));R.pushables.push({kind:'lead',x,y,w,h,id,flag:f});},
  crates(R,gs,id,x,y,w,h,flag){const f=flag||('crates_'+id);if(gs.flags[f])return;
    R.solids.push(S(x,y,w,h,'ply',{dyn:true,pid:id}));R.pushables.push({kind:'crate',x,y,w,h,id,flag:f});},
  grate(R,gs,id,x,y,w,h,flag,floor){const f=flag||('grate_'+id);if(gs.flags[f])return;
    R.solids.push(S(x,y,w,h,'steel',{dyn:true,pid:id}));R.pushables.push({kind:'grate',x,y,w,h,id,hp:3,flag:f,floor:!!floor});},
  /* мелом на стене: метки Курьера 38 — нить, по которой идёт игрок */
  chalk(R,x,y,text,o){(R.chalk=R.chalk||[]).push(Object.assign({x,y,text},o||{}));},
  /* подзона: язык зоны + её вариант (свет, дымка, фон, декор) */
  art(zone,sub,o){o=o||{};const Z={sump:['Sump'],hives:['Hives'],eden:['Eden'],seal:['Seal'],archive:['Archive'],surface:['Surface']}[zone][0];
    return {far:SUBART[sub]&&SUBART[sub].far||null,bg:SUBART[sub]&&SUBART[sub].bg||Art['bg'+Z],mid:SUBART[sub]&&SUBART[sub].mid||Art['mid'+Z],
      game:Art['game'+Z],fgd:o.fgd===false?null:(SUBART[sub]&&SUBART[sub].fgd)||Art['fgd'+Z]||null,
      emit:SUBART[sub]&&SUBART[sub].emit||null,emitF:SUBART[sub]&&SUBART[sub].emitF||0.34};}
};
