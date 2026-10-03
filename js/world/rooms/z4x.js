"use strict";
/* ============================== ROOMS · Z4 · МЕХАНИЗМ ПЕЧАТИ (расширение) ============================== */
/* Три магистрали под давлением открывают подъёмник Предпечатья к ходу Регулятора: зубчатый зал →
   маятниковая шахта → анкерный зал → часовая башня → циферблат (выхлоп) → каморка смотрителя →
   ворота Архива (только выхлопом). Камера давления, мехи и противовесы — в стороне, с наградами. */
/* пресс: шток падает по ритму (опасность с телеграфом) */
const PRESS=(x,y,w,h,per,off)=>({x:x,y:y,w:w,h:h,kind:'steam',look:'press',per:per||2.4,on:0.55,off:off||0});
Object.assign(ROOMDEFS,{
z4_gearworks:gs=>({id:'z4_gearworks',zone:'seal',sub:'gears',name:'ЗУБЧАТЫЙ ЗАЛ',w:60,h:24,
  art:RB.art('seal','gears'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,21,60,3,'lead'),P(10,18.6,5),P(18,16.2,5),P(26,13.8,5),P(34,11.4,5),P(42,9,6),S(50,9,10,0.8,'lead'));
    R.hazards=[PRESS(19.6,9.4,1.8,6.8,2.6,0),PRESS(35.6,4.6,1.8,6.8,2.6,1.3)];
    R.doors=[Object.assign(RB.L(21,'z4_antechamber','ПРЕДПЕЧАТЬЕ'),{elevator:true}),RB.R(R,9,'z4_pendulum','МАЯТНИКОВАЯ ШАХТА'),
      RB.hatch(30,21,'z4_pressure','КАМЕРА ДАВЛЕНИЯ')];
    RB.lore(R,gs,22,45,9);
    R.enemies.push({type:'clockmaker',x:40,y:21-2.1,patrol:[34,48],amb:true},{type:'clockmaker',x:27,y:13.8-2.1,patrol:[26.2,30.6],amb:true},
      {type:'lampada',x:14,y:8,amb:true});
    R.lights=[lit(6,4,9,'#cfe6ff',0.6),lit(22,4,9,'#cfe6ff',0.6),lit(38,4,9,'#cfe6ff',0.6),lit(54,6,7,'#f2e6c0',0.7),lit(30,20,4,'#8fb6c9',0.5)];
    R.emitters=[{type:'dust',rate:10},{type:'spark',x:20.5,y:9.4,rate:0.6},{type:'spark',x:36.5,y:4.6,rate:0.6}];
    R.extraGame=(c,L,r)=>{for(const [x,y,w] of [[10,18.6,5],[18,16.2,5],[26,13.8,5],[34,11.4,5],[42,9,6]])Kit.gear(c,x+w/2,y+1.4,1.4,16,r()*TAU,'#4a4a44');
      Kit.sign(c,51,5.6,5.2,0.85,'МАЯТНИКОВАЯ ШАХТА →','#c9a227','#191612',1101);};
  }}),
/* Маятниковая шахта: вниз, мимо качающегося маятника. На уступе — последняя метка Курьера 38. */
z4_pendulum:gs=>({id:'z4_pendulum',zone:'seal',sub:'pendulum',name:'МАЯТНИКОВАЯ ШАХТА',w:24,h:46,
  art:RB.art('seal','pendulum'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,8,7,1,'lead'),P(10,11,5),P(16,14.2,6),P(9,17.4,5),P(0,20.6,8),P(8,23.8,5),P(15,27,7),P(7,30.2,5),P(1,33.4,6),
      P(9,36.6,6),P(17,39.8,7),S(0,43,24,3,'lead'));
    RB.ring(R,12,6,'top',5.6);RB.ring(R,6,13,'top',12.6);RB.ring(R,14,21,'top',20.6);RB.ring(R,6,30,'top',29.6);RB.ring(R,14,36,'top',35.6);
    /* маятник: шток от свода, груз качается поперёк шахты на уровне 24–27 */
    const PX=12,PY=0.4,PL=25,AMP=0.62,SP=1.5;
    R.hazards=[{x:0,y:0,w:2.4,h:2.4,kind:'steam',look:'none',ctl:'pend',active:true}];
    R.tick=(dt,W)=>{const a=Math.sin(W.time*SP)*AMP,h=R.hazards[0];h.x=PX+Math.sin(a)*PL-1.2;h.y=PY+Math.cos(a)*PL-1.2;h.active=true;h.warn=false;};
    R.dyn=(c,t,W)=>{const a=Math.sin(W.time*SP)*AMP,bx=PX+Math.sin(a)*PL,by=PY+Math.cos(a)*PL;
      c.strokeStyle='#3a3d44';c.lineWidth=0.22;c.beginPath();c.moveTo(PX,PY);c.lineTo(bx,by);c.stroke();
      c.strokeStyle='rgba(220,226,236,.25)';c.lineWidth=0.06;c.beginPath();c.moveTo(PX-0.05,PY);c.lineTo(bx-0.05,by);c.stroke();
      const g=c.createRadialGradient(bx-0.4,by-0.4,0,bx,by,1.4);g.addColorStop(0,'#c9a227');g.addColorStop(0.6,'#8a6d2a');g.addColorStop(1,'#3a2c0c');
      c.fillStyle=g;c.beginPath();c.arc(bx,by,1.3,0,TAU);c.fill();c.strokeStyle='#2a1e08';c.lineWidth=0.08;c.stroke();
      for(let i=0;i<6;i++){const q=i/6*TAU+t;Kit.bolt(c,bx+Math.cos(q)*0.95,by+Math.sin(q)*0.95,0.07);}
      game.renderer.glowAdd(bx,by,1.6,'#c8452f',0.15);};
    R.doors=[RB.L(8,'z4_gearworks','ЗУБЧАТЫЙ ЗАЛ'),RB.R(R,43,'z4_escapement','АНКЕРНЫЙ ЗАЛ'),RB.L(20.6,'z4_bellows','МЕХИ')];
    RB.lore(R,gs,24,4.5,33.4);
    RB.chalk(R,4,30.2,'ДАЛЬШЕ НЕ ПУСТИЛИ · 38 ↑',{s:0.34});
    R.enemies.push({type:'lampada',x:18,y:10,amb:true},{type:'lampada',x:6,y:38,amb:true});
    R.lights=[lit(4,6,6,'#cfe6ff',0.6),lit(18,12,6,'#cfe6ff',0.5),lit(5,22,6,'#cfe6ff',0.5),lit(18,28,6,'#cfe6ff',0.5),
      lit(4,34,6,'#ffd9a0',0.6),lit(18,41,6,'#cfe6ff',0.5)];
    R.emitters=[{type:'dust',rate:10},{type:'drip',x:6,y:1,rate:0.5}];
    R.extraGame=(c,L,r)=>{Kit.pipe(c,[[1.2,1],[1.2,43]],0.3,'#5d6067',{seed:1110,rustN:0});Kit.pipe(c,[[22.8,1],[22.8,43]],0.3,'#5d6067',{seed:1111,rustN:0});};
  }}),
/* Анкерный зал: прессы бьют по ритму анкерного колеса — идти между ударами. */
z4_escapement:gs=>({id:'z4_escapement',zone:'seal',sub:'gears',name:'АНКЕРНЫЙ ЗАЛ',w:56,h:22,
  art:RB.art('seal','gears'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,19,56,3,'lead'),S(24,16.6,6,2.4,'lead'),S(0,7,8,0.8,'lead'),P(13,16.6,4),P(8,14.2,4),P(13,11.8,4),P(8,9.4,4));
    R.hazards=[PRESS(19.6,12.2,2,6.8,2.0,0),PRESS(33,12.2,2,6.8,2.0,0.5),PRESS(39,12.2,2,6.8,2.0,1.0),PRESS(45,12.2,2,6.8,2.0,1.5)];
    R.doors=[RB.L(19,'z4_pendulum','МАЯТНИКОВАЯ ШАХТА'),RB.R(R,19,'z4_clocktower','ЧАСОВАЯ БАШНЯ'),RB.L(7,'z4_counter','ПРОТИВОВЕСЫ')];
    R.enemies.push({type:'clockmaker',x:27,y:16.6-2.1,patrol:[24.2,29.6],amb:true},{type:'clockmaker',x:50,y:19-2.1,patrol:[44,54],amb:true});
    R.lights=[lit(6,4,8,'#cfe6ff',0.6),lit(20,6,9,'#cfe6ff',0.6),lit(38,6,9,'#cfe6ff',0.6),lit(52,6,8,'#cfe6ff',0.6)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{Kit.gear(c,28,6,4.2,32,0.3,'#3d3a30');Kit.sign(c,30,2,4.6,0.85,'АНКЕР · ШАГ 2.0 С','#c9a227','#191612',1121);};
  }}),
/* Часовая башня: подъём всем, что умеет курьер — кошки, подковы, гарпун. Наверху — циферблат. */
z4_clocktower:gs=>({id:'z4_clocktower',zone:'seal',sub:'clock',name:'ЧАСОВАЯ БАШНЯ',w:26,h:52,
  art:RB.art('seal','clock'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,49,26,3,'lead'),P(14,46.6,6),P(6,44.2,6),
      S(6,30,1.2,12,'lead',{grip:'r'}),S(10.4,32,1.2,10,'lead',{grip:'l'}),P(12,29.4,8),
      P(1,25.4,5),P(12,19.8,6),P(3,14.6,6),S(19,10.6,7,0.8,'lead'),P(20,5.8,6,0.6));
    R.magnetRects=[{x:8,y:8.2,w:14,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    RB.ring(R,7,23.5,'left',7);RB.ring(R,10,17.6,'top',2.4);RB.ring(R,10,12.2,'top',2.6);
    R.doors=[RB.L(49,'z4_escapement','АНКЕРНЫЙ ЗАЛ'),RB.R(R,10.6,'z4_boss','ЦИФЕРБЛАТ'),RB.R(R,5.8,'z4_bell','?')];
    RB.lamp(R,21.5,10.6);RB.lore(R,gs,21,16.5,29.4);
    R.enemies.push({type:'lampada',x:16,y:38,amb:true},{type:'lampada',x:16,y:15,amb:true},{type:'clockmaker',x:15,y:29.4-2.1,patrol:[12.4,19.4],amb:true});
    R.lights=[lit(13,46,8,'#cfe6ff',0.6),lit(9,36,6,'#cfe6ff',0.5),lit(16,28,6,'#f2e6c0',0.6),lit(14,20,6,'#e8c96a',0.6),lit(13,12,7,'#cfe6ff',0.6),lit(21.5,8,6,'#ffbe63',0.8),lit(24,4,3,'#ffe6a3',0.7,{flicker:2})];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{for(const m of R.magnetRects){Kit.craneGirder(c,m.x,m.y-1.2,m.w,1.2);Kit.magnetRivets(c,m.x,m.y,m.w);}SA.dial(c,13,40,2.4,-1.2,0.8,'#c8c0a8');
      Kit.sign(c,13,1.6,5.4,0.85,'ЦИФЕРБЛАТ · РЕГУЛЯТОР','#c8452f','#f0e2cf',1131);};
  }}),
/* Циферблат: арена Регулятора за стеклом гигантских часов. */
z4_boss:gs=>({id:'z4_boss',zone:'seal',sub:'clock',name:'ЦИФЕРБЛАТ',w:48,h:28,noCut:true,
  art:RB.art('seal','clock'),
  build(R){
    const dead=gs.bosses.regulator;
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,24,48,4,'lead'),P(6,19.6,6),P(36,19.6,6),P(18,15.6,12));
    R.boss=dead?null:{type:'regulator',x:24,y:24-4.8};
    if(!dead)R.hazards=[10,24,38].map(x=>Object.assign(PRESS(x-1.1,14.4,2.2,9.6,2,0),{ctl:'reg'}));
    R.bossTrigger={x:5,y:12,w:38,h:12};
    R.bossDoor={x:0,y:21.9,w:1.4,h:2.1,active:!dead};
    R.doors=[RB.L(24,'z4_clocktower','ЧАСОВАЯ БАШНЯ'),RB.R(R,24,'z4_quiet','КАМОРКА СМОТРИТЕЛЯ',{reqFlag:'boss4_dead',reqMsg:'ЗАПЕРТО. ЧАСЫ ИДУТ.'})];
    if(dead)RB.salvage(R,gs,{ability:'vjump',x:24,y:24,flag:'got_vjump',title:'ВЫХЛОП РЕГУЛЯТОРА',
      lines:['В ЗАТЫЛКЕ РЕГУЛЯТОРА — ВЕНТИЛЬ СБРОСА ДАВЛЕНИЯ. ОН СТРАВЛИВАЛ ЛИШНЕЕ ВРЕМЯ.','ВЕНТИЛЬ ВСТАЁТ НА РАНЕЦ. В ВОЗДУХЕ МОЖНО ОТТОЛКНУТЬСЯ ЕЩЁ РАЗ — ПАРОМ.']});
    R.lights=[lit(24,6,16,'#f2e6c0',0.8),lit(8,16,8,'#cfe6ff',0.5),lit(40,16,8,'#cfe6ff',0.5),lit(24,22,10,'#ffd9a0',0.4)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{SA.dial(c,24,10,8,-1.0,1.4,'rgba(216,210,192,.35)');};
  }}),
z4_quiet:gs=>({id:'z4_quiet',zone:'seal',sub:'gears',name:'КАМОРКА СМОТРИТЕЛЯ',w:24,h:14,quiet:true,noCut:true,
  art:RB.art('seal','gears'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});R.solids.push(S(0,11,24,3,'lead'),S(15,9.6,4,1.4,'ply'));
    R.doors=[RB.L(11,'z4_boss','ЦИФЕРБЛАТ'),RB.R(R,11,'z4_gate','ВОРОТА АРХИВА')];
    RB.lamp(R,8,11);RB.chalk(R,17,6,'ЗДЕСЬ 38 НЕ БЫЛ',{s:0.36});
    R.lights=[lit(8,3,8,'#ffbe63',0.8),lit(17,8,4,'#ffd9a0',0.6)];
    R.extraGame=(c,L,r)=>{Kit.plate(c,15,9.6,4,1.4,'ply',1141,{});SA.dial(c,4,5,1.2,0.4,2.0,'#c8c0a8');
      for(let i=0;i<5;i++){c.fillStyle='#d8cdb6';c.fillRect(15.3+i*0.7,9.3,0.5,0.3);}};
  }}),
/* Ворота Архива: стена уступов, последние — выше любого прыжка. Только выхлопом. */
z4_gate:gs=>({id:'z4_gate',zone:'seal',sub:'gears',name:'ВОРОТА АРХИВА',w:40,h:30,
  art:RB.art('seal','gears'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,27,40,3,'lead'),P(4,24.6,5),P(11,22.2,5),P(18,19.8,5),P(25,17.4,5),P(31,13.8,4,0.6,'lead'),P(35.5,10.6,4.5,0.6,'lead'),P(30,8,10,0.6));
    R.doors=[RB.L(27,'z4_quiet','КАМОРКА'),RB.R(R,8,'z5_hall','АРХИВ СОВЕТА')];
    R.signs=[{x:24,y:10,keys:['SPACE','SPACE'],text:'В ВОЗДУХЕ — ЕЩЁ РАЗ',need:'vjump'}];
    R.enemies.push({type:'lampada',x:20,y:12,amb:true},{type:'clockmaker',x:20,y:27-2.1,patrol:[10,30],amb:true});
    R.lights=[lit(8,20,8,'#cfe6ff',0.5),lit(22,14,8,'#cfe6ff',0.5),lit(35,6,8,'#ffcf8a',0.8)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{Kit.arch(c,32,1.4,7,6.6);Kit.stencil(c,31,1.2,'АРХИВ СОВЕТА · ВХОД ВОСПРЕЩЁН',0.3,'rgba(232,201,106,.5)',0.5);};
  }}),
/* ---------- в стороне ---------- */
z4_pressure:gs=>({id:'z4_pressure',zone:'seal',sub:'pressure',name:'КАМЕРА ДАВЛЕНИЯ',w:40,h:20,
  art:RB.art('seal','pressure'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,17,40,3,'lead'),P(6,14.6,5),P(14,12.2,5),P(22,9.8,5),P(30,7.4,4),P(29,5.0,4));
    R.hazards=[{x:11.6,y:10,w:1.6,h:7,kind:'steam',per:2.2,on:0.7},{x:19.6,y:8,w:1.6,h:9,kind:'steam',per:2.2,on:0.7,off:1.1},{x:27.6,y:6,w:1.6,h:11,kind:'steam',per:2.2,on:0.7}];
    R.doors=[Object.assign(RB.top(29.8,'z4_gearworks','ЗУБЧАТЫЙ ЗАЛ'),{h:3.2}),
      {x:36,y:14.9,w:1.4,h:2.1,to:'z4_vault',label:'?',reqFlag:'lead_press',reqMsg:'СВИНЦОВАЯ ЗАГЛУШКА'}];
    if(!gs.flags.lead_press)R.pushables.push({kind:'lead',x:35.7,y:14.6,w:2.0,h:2.4,id:'press_lead',flag:'lead_press'});
    R.enemies.push({type:'clockmaker',x:20,y:17-2.1,patrol:[14,26],amb:true});
    R.lights=[lit(10,6,8,'#ffb090',0.6),lit(26,6,8,'#ffb090',0.6),lit(36.7,15.6,3,'#ffd9a0',0.6)];
    R.emitters=[{type:'steam',x:8,y:16.6,rate:0.4},{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{Kit.sign(c,2,8,4.4,0.85,'ДАВЛЕНИЕ · 41 АТМ','#c8452f','#f0e2cf',1151);};
  }}),
z4_bellows:gs=>({id:'z4_bellows',zone:'seal',sub:'pressure',name:'МЕХИ',w:44,h:22,
  art:RB.art('seal','pressure'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,19,44,3,'lead'),S(34,16.6,6,2.4,'ply'),S(26,14.2,6,4.8,'ply'),S(18,11.8,6,7.2,'ply'),P(8,9.4,6),
      /* обратный путь с пола под полкой: ступени-ящики к верху мехов (без них низ слева — ловушка) */
      S(12.4,17.2,2.6,1.8,'ply'),S(15,14.6,3,4.4,'ply'),S(24,16.6,2,2.4,'ply'));
    R.hazards=[{x:32.2,y:9,w:1.6,h:10,kind:'steam',per:3.0,on:1.0},{x:24.2,y:7,w:1.6,h:9.6,kind:'steam',per:3.0,on:1.0,off:1.5}];
    R.doors=[RB.R(R,19,'z4_pendulum','МАЯТНИКОВАЯ ШАХТА')];
    RB.salvage(R,gs,{upgrade:'weld_kit2',x:10,y:9.4,flag:'got_weld_kit2',title:'СВАРОЧНЫЙ БАЛЛОН',
      lines:['НАД МЕХАМИ — ПОЛКА СМАЗЧИКА. БАЛЛОН АЦЕТИЛЕНА, ПОЛНЫЙ.','РЕМОНТА ХВАТИТ ЕЩЁ НА ОДИН ШОВ.']});
    R.enemies.push({type:'clockmaker',x:20,y:11.8-2.1,patrol:[18.4,23.6],amb:true},{type:'lampada',x:30,y:6,amb:true});
    R.lights=[lit(30,6,8,'#ffb090',0.6),lit(14,5,8,'#ffb090',0.6),lit(10,6,5,'#ffd9a0',0.7)];
    R.emitters=[{type:'steam',x:37,y:16.2,rate:0.5,s:1.4},{type:'steam',x:21,y:11.4,rate:0.5,s:1.4}];
    R.extraGame=(c,L,r)=>{for(const [x,y,w,h] of [[34,16.6,6,2.4],[26,14.2,6,4.8],[18,11.8,6,7.2]]){c.fillStyle='#4a3a2a';for(let k=0;k<h/0.6;k++){c.fillRect(x-0.2+(k%2)*0.3,y+k*0.6,w+0.4-(k%2)*0.6,0.4);}}};
  }}),
z4_counter:gs=>({id:'z4_counter',zone:'seal',sub:'gears',name:'ПРОТИВОВЕСЫ',w:30,h:34,
  art:RB.art('seal','gears'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,31,30,3,'lead'),S(22,28,8,3,'lead'),P(15,25.6,5),P(22,23.2,5),P(14,20.8,5),P(6,18.4,5),P(14,15.6,4),
      P(18.4,28.6,3.2,0.4,'lead'));   /* ступень с пола к двери: без неё низ комнаты — ловушка */
    RB.ring(R,20,10,'top',9.6);RB.ring(R,26,6,'top',5.6);
    R.doors=[RB.R(R,28,'z4_escapement','АНКЕРНЫЙ ЗАЛ')];
    R.solids.push(S(24,8,6,0.8,'lead'));
    RB.salvage(R,gs,{upgrade:'plate_counter',x:28,y:8,flag:'got_plate_counter',title:'ПЛАСТИНА КУРТКИ',
      lines:['НА ВЕРХНЕЙ БАЛКЕ — ЛАТУННЫЙ КЛИН ПРОТИВОВЕСА, ТОНКИЙ, КАК ЛИСТ.','ОН ДЕРЖАЛ ВЕС ЧАСОВ ДВЕСТИ ЛЕТ. УДЕРЖИТ И ДАВЛЕНИЕ КУРТКИ.']});
    R.enemies.push({type:'lampada',x:10,y:14,amb:true});
    RB.elite(R,gs,{type:'clockmaker',x:8,y:31-1.9,patrol:[2,14],eliteName:'МАСТЕР ХОДА',eliteFlag:'elite_counter',
      reward:{upgrade:'stun_long',x:6,y:31,flag:'got_stun_long',title:'ЗУБИЛО ЧАСОВЩИКА',
        lines:['В ФУТЛЯРЕ МАСТЕРА — ЗУБИЛО ДЛЯ ЗАКЛИНИВАНИЯ ХОДА. ИМ ОСТАНАВЛИВАЛИ ЧАСЫ НА РЕМОНТ.','С НИМ СОРВАННЫЙ ЗАМАХ ДЕРЖИТ МЕХАНИЗМ ОТКРЫТЫМ ДОЛЬШЕ.']}});
    R.lights=[lit(24,26,8,'#cfe6ff',0.5),lit(10,16,8,'#cfe6ff',0.5),lit(26,6,6,'#ffd9a0',0.7)];
    R.machines=[{kind:'chain',x:4,y:0.4,len:7,ph:0},{kind:'chain',x:9,y:0.4,len:6,ph:1}];
    R.extraGame=(c,L,r)=>{for(const x of [3,8])Kit.plate(c,x-1,7.6,2,2.4,'lead',(x*7)|0,{bolts:true});};
  }}),
z4_vault:gs=>({id:'z4_vault',zone:'seal',sub:'pressure',name:'ХРАНИЛИЩЕ КЛЮЧЕЙ',w:22,h:12,secret:true,noCut:true,
  art:RB.art('seal','pressure',{fgd:false}),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});R.solids.push(S(0,10,22,2,'lead'));
    R.doors=[RB.L(10,'z4_pressure','КАМЕРА ДАВЛЕНИЯ')];
    RB.salvage(R,gs,{upgrade:'plate_keys',x:16,y:10,flag:'got_plate_keys',title:'ПЛАСТИНА КУРТКИ',
      lines:['СЕМЬ КРЮЧКОВ ДЛЯ КЛЮЧЕЙ СОВЕТА. ШЕСТЬ ПУСТЫ. НА СЕДЬМОМ — ЛАТУННАЯ ПЛАСТИНА.','КЛЮЧИ УНЕСЛИ ТЕ, КТО ВЫХОДИЛ НАВЕРХ. И НЕ ВЕРНУЛСЯ.']});
    R.lights=[lit(11,3,8,'#ffd9a0',0.8)];
    R.extraGame=(c,L,r)=>{for(let i=0;i<7;i++){const x=4+i*2;Kit.bolt(c,x,4,0.1);c.strokeStyle='#8a6d2a';c.lineWidth=0.06;c.beginPath();c.arc(x,4.4,0.2,0,PI);c.stroke();}};
  }}),
z4_bell:gs=>({id:'z4_bell',zone:'seal',sub:'clock',name:'КОЛОКОЛЬНЯ',w:20,h:16,secret:true,noCut:true,
  art:RB.art('seal','clock',{fgd:false}),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});R.solids.push(S(0,13,20,3,'lead'));
    R.doors=[RB.L(13,'z4_clocktower','ЧАСОВАЯ БАШНЯ')];
    RB.salvage(R,gs,{upgrade:'plate_bell',x:15,y:13,flag:'got_plate_bell',title:'ПЛАСТИНА КУРТКИ',
      lines:['КОЛОКОЛ ЯРУСОВ БЕЗ ЯЗЫКА. ЕГО ВЫНУЛИ, ЧТОБЫ НЕ ЗВОНИЛ.','ИЗ ЯЗЫКА ВЫКОВАНА ПЛАСТИНА. ТЯЖЁЛАЯ И ЧИСТАЯ.']});
    R.lights=[lit(10,4,9,'#ffd9a0',0.8)];
    R.extraGame=(c,L,r)=>{const g=c.createLinearGradient(6,0,14,0);g.addColorStop(0,'#5a4a20');g.addColorStop(0.4,'#c9a227');g.addColorStop(1,'#4a3a10');
      c.fillStyle=g;c.beginPath();c.moveTo(7,9);c.quadraticCurveTo(7,3,10,2.6);c.quadraticCurveTo(13,3,13,9);c.lineTo(14,10.4);c.lineTo(6,10.4);c.closePath();c.fill();
      Kit.chain(c,10,0.4,2.2,0.14);};
  }})
});
