"use strict";
/* ============================== ROOMS · Z2 · ЖИЛЫЕ СОТЫ (расширение) ============================== */
/* Путь к кошкам теперь идёт через жилую жизнь яруса: эскалатор → рынок → школа → прачечная →
   квартира (кошки) → атриум. Прямую дверь атриума в квартиры завалило; прачечная открывает её засовом
   изнутри — шорткат. Кошками — клеть, крыши и часовня; гарпуном — сейф Цензуры. */
Object.assign(ROOMDEFS,{
/* Рынок яруса: полосатые навесы, гирлянды ламп, доски «НОРМА». Пайки по норме, свет — по графику.
   В задней стене — свинцовая заглушка, из щели пахнет типографской краской. */
z2_market:gs=>({id:'z2_market',zone:'hives',sub:'market',name:'РЫНОК ЯРУСА',w:64,h:22,
  art:RB.art('hives','market'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(0,19,40,3,'carpet'),S(44,19,20,3,'carpet'),S(40,21.4,4,0.6,'concrete'),
      P(6,15.4,6),P(18,14.2,5),P(30,15.4,6),P(46,15.0,6),P(56,13.6,5));
    R.hazards=[{x:40,y:20.4,w:4,h:1,kind:'pit',back:{x:38.2,y:17.3},backs:[{minX:-99,x:38.2,y:17.3},{minX:42,x:44.4,y:17.3}]}];
    R.doors=[RB.L(19,'z2_escalator','ЭСКАЛАТОР'),RB.R(R,19,'z2_school','ШКОЛА №3'),
      {x:33.2,y:16.9,w:1.4,h:2.1,to:'z2_printing',label:'?',reqFlag:'lead_market',reqMsg:'СВИНЦОВАЯ ЗАГЛУШКА'}];
    if(!gs.flags.lead_market)R.pushables.push({kind:'lead',x:32.9,y:16.6,w:2.0,h:2.4,id:'market_lead',flag:'lead_market'});
    R.enemies.push({type:'mokrica',x:10,y:19-0.62,patrol:[4,14],amb:true},{type:'aristocrat',x:23,y:19-2.35,patrol:[16,30],amb:true},
      {type:'aristocrat',x:53,y:19-2.35,patrol:[46,61],amb:true},{type:'lampada',x:36,y:8,amb:true});
    RB.chalk(R,60,16.4,'38 →',{s:0.42});
    R.lights=[lit(6,6,9,'#ffcf7a',0.8),lit(20,5,9,'#ffcf7a',0.85,{flicker:0.9}),lit(34,6,9,'#ffcf7a',0.8),lit(50,5,9,'#ffcf7a',0.85),
      lit(33.6,18,3,'#ffd9a0',0.6,{flicker:2}),lit(1.2,17,3,'#ffd9a0',0.4),lit(62.8,17,3,'#ffd9a0',0.4),lit(42,20.6,3,'#c8452f',0.4)];
    R.emitters=[{type:'dust',rate:18},{type:'smoke',x:12,y:18,rate:0.15},{type:'drip',x:42,y:1,rate:0.4}];
    R.extraGame=(c,L,r)=>{
      for(const [x,w] of [[6,6],[18,5],[30,6],[46,6],[56,5]]){SA.awning(c,x-0.2,15.4-(x===18?1.2:x===56?1.8:0)-0.6,w+0.4,0.7,'#8a2e1e','#c9a227');}
      Kit.sign(c,24,9.6,4.4,0.9,'РЫНОК · НОРМА ДЛЯ ВСЕХ','#c9a227','#191612',901);
      /* очередь за пайком: пустые карточки на полу, опрокинутая тележка */
      for(let i=0;i<10;i++){c.fillStyle='#d8cdb6';c.save();c.translate(12+i*0.7+r()*0.3,18.92);c.rotate((r()-0.5)*0.6);c.fillRect(-0.12,-0.04,0.24,0.08);c.restore();}
      c.save();c.translate(28,18.4);c.rotate(-0.4);Kit.plate(c,-1,-0.4,2,0.8,'steel',902,{rust:0.7});c.restore();
      PROP.corpse(c,62,19,{face:-1,col:'#5a3a34',helmet:'#2a2420',vest:false});
      Kit.stencil(c,33.0,15.8,'ТИПОГРАФИЯ',0.26,'rgba(216,204,178,.35)',0.35);
    };
  }}),
/* Школа №3: внизу классы, наверху коридор. Окна с нарисованным небом закрашены серым. На стенах —
   детские рисунки солнца и деревьев, перечёркнутые красным. Под сводом — окно в ясли. */
z2_school:gs=>({id:'z2_school',zone:'hives',sub:'school',name:'ШКОЛА №3',w:52,h:26,
  art:RB.art('hives','school'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(0,23,52,3,'concrete'),S(14,12,38,1.2,'concrete'),
      P(8,20.6,4),P(2.5,18.2,4),P(8,15.8,4),P(2.5,13.4,4),
      P(43,9.4,3.4),S(48.6,4.6,3.4,0.6,'concrete'),S(20,21.4,3,1.6,'ply'),S(30,21.4,3,1.6,'ply'));
    R.doors=[RB.L(23,'z2_market','РЫНОК'),RB.R(R,12,'z2_laundry','ПРАЧЕЧНАЯ'),RB.R(R,4.6,'z2_nursery','ЯСЛИ')];
    RB.lamp(R,30,12);RB.lore(R,gs,15,26,23);
    R.enemies.push({type:'aristocrat',x:28,y:23-2.35,patrol:[16,40],amb:true},{type:'aristocrat',x:36,y:12-2.35,patrol:[20,46],amb:true},
      {type:'mokrica',x:46,y:23-0.62,patrol:[42,50],amb:true},{type:'lampada',x:34,y:6,amb:true});
    R.lights=[lit(8,4,8,'#e8ecd8',0.7),lit(24,17,8,'#e8ecd8',0.7),lit(40,17,8,'#e8ecd8',0.7,{flicker:1.5}),
      lit(30,6,9,'#ffd9a0',0.75),lit(48,6,6,'#9fc4e0',0.7),lit(50.3,2.6,3,'#cfe6ff',0.8),lit(1.2,21,3,'#ffd9a0',0.4)];
    R.emitters=[{type:'dust',rate:16}];
    R.extraGame=(c,L,r)=>{
      Kit.plate(c,14,12,38,1.2,'concrete',911,{rust:0.1});
      Kit.sign(c,18,15.0,4.6,0.9,'ШКОЛА №3 · ЯРУС 12','#c9a227','#191612',912);
      for(let i=0;i<5;i++){const x=16+i*7;c.fillStyle='#2a2218';c.fillRect(x,22.0,1.4,0.12);c.fillRect(x+0.1,22,0.08,1);c.fillRect(x+1.2,22,0.08,1);}
      Kit.plate(c,43,9.8,3.4,0.3,'ply',913,{});
      /* окно в ясли: детский мобиль сквозь стекло */
      c.fillStyle='rgba(120,150,180,.35)';c.fillRect(48.6,1.2,3.4,3.4);
      c.strokeStyle='#d8a020';c.lineWidth=0.05;c.beginPath();c.arc(50.3,2.6,0.3,0,TAU);c.stroke();
      Kit.stencil(c,44,8.8,'ЯСЛИ ↗',0.3,'rgba(216,204,178,.4)',0.4);
    };
  }}),
/* Прачечная: пар из прессов (ритм), простыни на верёвках, барабаны машин — по ним вниз.
   Засов на двери в атриум — с этой стороны: открыть — и до кошек короче. */
z2_laundry:gs=>({id:'z2_laundry',zone:'hives',sub:'laundry',name:'ПРАЧЕЧНАЯ',w:48,h:20,
  art:RB.art('hives','laundry'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(0,17,48,3,'concrete'),S(0,9.8,8,0.8,'concrete'),P(9,12.2,3),S(16,14.6,3.4,2.4,'steel'),S(33,14.6,3.4,2.4,'steel'));
    R.hazards=[{x:12.6,y:11,w:2,h:6,kind:'steam',per:2.6,on:0.8,off:0},{x:27,y:11,w:2,h:6,kind:'steam',per:2.6,on:0.8,off:1.3},
      {x:39,y:11,w:2,h:6,kind:'steam',per:2.2,on:0.7,off:0.5}];
    R.doors=[RB.L(9.8,'z2_school','ШКОЛА'),RB.R(R,17,'z2_apartment','КВАРТИРЫ'),
      {x:22.2,y:14.9,w:1.4,h:2.1,to:'z2_atrium',link:'laundry_sc',label:'АТРИУМ',latch:'laundry_latch',latchHere:true}];
    R.enemies.push({type:'mokrica',x:24,y:17-0.62,patrol:[20,26],amb:true},{type:'repairer',x:42,y:17-1.55,patrol:[37,46],amb:true},
      {type:'lampada',x:30,y:6,amb:true});
    R.lights=[lit(4,6,8,'#dfe8f0',0.7),lit(17.7,10,6,'#dfe8f0',0.6),lit(34.7,10,6,'#dfe8f0',0.6),lit(22.9,15.6,3,'#ffd9a0',0.6),
      lit(46.8,15.6,3,'#ffd9a0',0.4)];
    R.emitters=[{type:'steam',x:17.7,y:14.4,rate:0.6,s:1.2},{type:'steam',x:34.7,y:14.4,rate:0.6,s:1.2},{type:'mist',rate:2},{type:'drip',x:10,y:1,rate:0.8},{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{
      for(const x of [16,33]){c.fillStyle='#14171a';c.beginPath();c.arc(x+1.7,15.8,1.0,0,TAU);c.fill();c.strokeStyle='#8a9299';c.lineWidth=0.12;c.beginPath();c.arc(x+1.7,15.8,1.0,0,TAU);c.stroke();}
      for(const x of [12.6,27,39]){Kit.plate(c,x-0.4,16.4,2.8,0.6,'steel',(x*3)|0,{rust:0.4});Kit.stencil(c,x-0.2,10.4,'ПРЕСС',0.28,'rgba(216,204,178,.5)',0.5);}
      Kit.stencil(c,20.8,13.6,'АТРИУМ · ЗАСОВ',0.26,'rgba(216,204,178,.5)',0.5);
      Kit.plate(c,9,12.5,3,0.3,'steel',931,{});
    };
  }}),
/* Крыши сот: обрывы фасадов над пропастью, дымоходы с рифлёными стенками, рымы бельевых растяжек.
   Отсюда — к часовне Основателей. */
z2_roofs:gs=>({id:'z2_roofs',zone:'hives',sub:'roofs',name:'КРЫШИ СОТ',w:64,h:30,
  art:RB.art('hives','roofs'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(56,15,8,15,'concrete'),S(39,13,11,17,'concrete'),S(42,5,1,5.4,'concrete',{grip:'l'}),
      S(30,6,9,24,'concrete',{grip:'r'}),S(0,9,18,21,'concrete'));
    RB.ring(R,24,3.2,'top',2.8);
    R.hazards=[{x:0,y:28,w:64,h:2,kind:'pit',back:{x:56.5,y:13.3},
      backs:[{minX:-99,x:16,y:7.3},{minX:18,x:30.6,y:4.3},{minX:39,x:44,y:11.3},{minX:50,x:56.6,y:13.3}]}];
    R.doors=[RB.R(R,15,'z2_stairwell','ЛЕСТНИЧНАЯ КЛЕТЬ'),RB.L(9,'z2_chapel','ЧАСОВНЯ ОСНОВАТЕЛЕЙ')];
    RB.lamp(R,46,13);
    R.enemies.push({type:'lampada',x:52,y:6,amb:true},{type:'lampada',x:22,y:12,amb:true},{type:'aristocrat',x:34,y:6-2.35,patrol:[31,38],amb:true});
    RB.chalk(R,6,6.8,'38 ←',{s:0.42});
    R.lights=[lit(46,9,8,'#ffcf7a',0.8),lit(34,3,7,'#ffcf7a',0.6),lit(10,5,8,'#ffcf7a',0.6),lit(60,11,6,'#ffcf7a',0.6),
      lit(24,3,4,'#e8c96a',0.6),lit(40,10,4,'#ffd9a0',0.4)];
    R.emitters=[{type:'smoke',x:44,y:12.6,rate:0.3},{type:'smoke',x:12,y:8.6,rate:0.25},{type:'dust',rate:10},{type:'wind',rate:12}];
    R.extraGame=(c,L,r)=>{
      Kit.cable(c,18,5,30,4.5,1.2,0.05,'#2a2420');Kit.cable(c,39,5,56,10,1.6,0.05,'#2a2420');
      for(const x of [44,48,58])Kit.pipe(c,[[x,13],[x,10.4]],0.3,'steel',{seed:(x*7)|0});
      Kit.sign(c,2,4.2,3.8,0.85,'ЧАСОВНЯ ← ТИШИНА','#c9a227','#191612',951);
    };
  }}),
/* Часовня Основателей: семь ликов над алтарём, витраж — Печать как солнце. Исповедник-цензор
   стережёт алтарь. Проповедь (№17) — на кафедре. */
z2_chapel:gs=>({id:'z2_chapel',zone:'hives',sub:'chapel',name:'ЧАСОВНЯ ОСНОВАТЕЛЕЙ',w:44,h:30,
  art:RB.art('hives','chapel'),
  build(R){
    const clear=gs.flags.chapel_clear;
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(0,27,44,3,'marble'),S(36,10.2,8,0.8,'marble'),S(4,25.4,8,1.6,'marble'),
      P(28,24.6,5),P(34,22.2,5),P(28,19.8,5),P(34,17.4,5),P(28,15,5),P(34,12.6,4));
    R.doors=[RB.R(R,10.2,'z2_roofs','КРЫШИ СОТ')];
    R.clearFlag='chapel_clear';
    if(!clear)R.enemies.push({type:'censor',variant:'elite',x:18,y:27-2.05,patrol:[12,26]});
    else RB.salvage(R,gs,{upgrade:'plate_chapel',x:8,y:25.4,flag:'got_plate_chapel',title:'ПЛАСТИНА КУРТКИ',
      lines:['НА АЛТАРЕ, ПОД ПОКРОВОМ, — ЛАТУННАЯ ПЛАСТИНА С ГРАВИРОВКОЙ: «ЗА ВЕРНОСТЬ ЯРУСУ».','ТЕПЕРЬ ОНА ДЕРЖИТ ДАВЛЕНИЕ В КУРТКЕ ТОГО, КТО УШЁЛ С ЯРУСА.']});
    RB.lore(R,gs,17,14,27);
    R.lights=[lit(22,8,14,'#e8c96a',0.7),lit(8,22,6,'#ffcf7a',0.8,{flicker:2}),lit(14,24,5,'#ffcf7a',0.6,{flicker:2.4}),
      lit(40,8,5,'#ffcf7a',0.5),lit(30,20,6,'#e8c96a',0.4)];
    R.emitters=[{type:'dust',rate:14}];
    R.extraGame=(c,L,r)=>{
      Kit.plate(c,4,25.4,8,1.6,'brass',961,{bolts:true});
      c.fillStyle='#e8e0c8';for(let i=0;i<14;i++)c.fillRect(4.4+i*0.52,24.9-((i*7)%3)*0.1,0.08,0.5);
      Kit.stencil(c,15,23.0,'КАФЕДРА',0.3,'rgba(232,201,106,.4)',0.4);
    };
  }}),
/* Цензорская: картотеки до потолка, сугробы проштампованной бумаги, зелёные лампы.
   Через шахту пневмотруб — рымы к двери сейфа, где лежат изъятые капсулы. */
z2_censor:gs=>({id:'z2_censor',zone:'hives',sub:'offices',name:'ЦЕНЗОРСКАЯ',w:52,h:24,
  art:RB.art('hives','offices'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(0,21,52,3,'concrete'),S(0,6,10,0.8,'concrete'),S(12,15,3,6,'steel'),S(22,12,3,9,'steel'),S(34,15,3,6,'steel'),
      S(46,8.4,6,0.8,'concrete'),P(10,18.6,2),P(4,16.2,4),P(8,13.8,3),P(3,11.4,3),P(7,9,3));
    RB.ring(R,31,6.5,'top',6.1);RB.ring(R,39,4.6,'top',4.2);
    R.doors=[RB.L(6,'z2_turbine','ТУРБИННЫЙ ЗАЛ'),RB.R(R,8.4,'z2_vault','СЕЙФ ЦЕНЗУРЫ')];
    RB.lamp(R,5,21);RB.lore(R,gs,16,44,21);
    R.enemies.push({type:'censor',x:28,y:21-2.05,patrol:[18,40],amb:true},{type:'aristocrat',x:16,y:21-2.35,patrol:[11,20],amb:true},
      {type:'aristocrat',x:44,y:21-2.35,patrol:[40,50],amb:true},{type:'lampada',x:20,y:6,amb:true});
    R.lights=[lit(5,3,7,'#9fe6a0',0.6),lit(13.5,13,4,'#9fe6a0',0.7),lit(23.5,10,4,'#9fe6a0',0.7),lit(35.5,13,4,'#9fe6a0',0.7),
      lit(44,18,6,'#9fe6a0',0.6),lit(49,6,4,'#ffd9a0',0.6),lit(31,5,3,'#e8c96a',0.5),lit(39,3.5,3,'#e8c96a',0.5)];
    R.emitters=[{type:'dust',rate:16}];
    R.extraGame=(c,L,r)=>{
      for(const [x,y,h] of [[12,15,6],[22,12,9],[34,15,6]]){for(let k=0;k<h/0.6;k++){c.fillStyle='#232e26';c.fillRect(x+0.1,y+0.1+k*0.6,2.8,0.5);c.fillStyle='#8a6d2a';c.fillRect(x+1.35,y+0.32+k*0.6,0.3,0.07);}}
      Kit.sign(c,15,3.4,4.4,0.9,'ЦЕНЗУРА · ТИШИНА','#c8452f','#f0e2cf',971);
      Kit.stencil(c,44.2,6.6,'СЕЙФ · ДОСТУП ЗАКРЫТ',0.28,'rgba(200,69,47,.5)',0.5);
      for(const x of [31,39])Kit.pipe(c,[[x,0.4],[x,1.6]],0.14,'steel',{seed:(x*3)|0});
      PROP.corpse(c,49,21,{face:-1,col:'#3a4a3e',helmet:'#2a2420',hold:'paper'});
    };
  }}),
/* Кабинет Примарха: тихая комната после боя. Фонарь, устав Цензуры (№8), лифт в Сады. */
z2_quiet:gs=>({id:'z2_quiet',zone:'hives',sub:'offices',name:'КАБИНЕТ ПРИМАРХА',w:26,h:14,quiet:true,
  art:RB.art('hives','offices'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});R.solids.push(S(0,11,26,3,'carpet'),S(14,9.8,4,1.2,'ply'));
    R.doors=[RB.L(11,'z2_boss','ЗАЛ ПРИМАРХА'),Object.assign(RB.R(R,11,'z3_airlock','САДЫ ЭДЕМА'),{elevator:true,w:1.6,x:24.2,y:8.6,h:2.4})];
    RB.lamp(R,8,11);RB.lore(R,gs,8,16,9.8);
    RB.chalk(R,21.4,6.4,'38 ↑ САДЫ',{s:0.4});
    R.lights=[lit(8,3,8,'#ffbe63',0.8),lit(16,7,5,'#9fe6a0',0.7),lit(24.6,9,3,'#8fd6ff',0.6)];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{Kit.plate(c,14,9.8,4,1.2,'ply',981,{});c.fillStyle='#2f6b44';c.beginPath();c.moveTo(15.4,9.2);c.lineTo(16.4,9.2);c.lineTo(16.2,8.9);c.lineTo(15.6,8.9);c.closePath();c.fill();
      Kit.poster(c,4,4,1.6,2.2,982);Kit.poster(c,10.5,4.2,1.6,2.2,983);
      Kit.plate(c,23.4,7.6,2.6,3.4,'steel',984,{rust:0.4});Kit.stencil(c,22.6,7.2,'ЛИФТ → САДЫ',0.3,'rgba(216,204,178,.6)',0.6);};
  }}),
/* ---------- тайники ---------- */
z2_printing:gs=>({id:'z2_printing',zone:'hives',sub:'market',name:'ТАЙНАЯ ТИПОГРАФИЯ',w:22,h:12,secret:true,
  art:RB.art('hives','market',{fgd:false}),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});R.solids.push(S(0,10,22,2,'concrete'),S(10,8.4,4,1.6,'steel'));
    R.doors=[RB.L(10,'z2_market','РЫНОК')];
    RB.salvage(R,gs,{upgrade:'plate_print',x:17,y:10,flag:'got_plate_print',title:'ПЛАСТИНА КУРТКИ',
      lines:['РУЧНОЙ ПРЕСС, ЛИСТОВКИ ПАЧКАМИ: «ПОД ПЕЧАТЬЮ — НЕБО». ИХ ТАК И НЕ РАЗДАЛИ.','В ЯЩИКЕ НАБОРЩИКА — ЛАТУННАЯ ПЛАСТИНА. ЛИСТОВКУ — ЗА ПАЗУХУ.']});
    R.lights=[lit(11,3,9,'#ffd9a0',0.9,{flicker:1.4}),lit(17,8,4,'#ffcf7a',0.6)];
    R.extraGame=(c,L,r)=>{Kit.plate(c,10,7.4,4,2.6,'iron',991,{rust:0.6,bolts:true});c.fillStyle='#14100c';c.fillRect(10.4,7.8,3.2,0.6);
      for(let i=0;i<30;i++){c.fillStyle='#d8cdb6';c.save();c.translate(2+r()*18,9.9-r()*0.3);c.rotate((r()-0.5)*0.8);c.fillRect(-0.18,-0.12,0.36,0.24);c.restore();}
      c.fillStyle='rgba(30,26,22,.85)';c.font='500 0.32px Oswald';c.fillText('ПОД ПЕЧАТЬЮ — НЕБО',3,5);c.fillText('ПОД ПЕЧАТЬЮ — НЕБО',3,5.6);};
  }}),
z2_nursery:gs=>({id:'z2_nursery',zone:'hives',sub:'school',name:'ЯСЛИ',w:20,h:12,secret:true,
  art:RB.art('hives','school',{fgd:false}),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});R.solids.push(S(0,10,20,2,'concrete'));
    R.doors=[RB.L(10,'z2_school','ШКОЛА')];
    RB.salvage(R,gs,{upgrade:'evade_win',x:14,y:10,flag:'got_evade_win',title:'ГИРОСКОП-ВОЛЧОК',
      lines:['НАД КРОВАТКАМИ — МОБИЛЬ: ЖЕСТЯНОЕ СОЛНЦЕ И ОБЛАКА ИЗ ВАТЫ. ТАК ЗДЕСЬ ЕЩЁ ПОМНИЛИ.','В КРОВАТКЕ — ВОЛЧОК С ЛАТУННЫМ ГИРОСКОПОМ. В РАНЦЕ ОН ДЕРЖИТ РАВНОВЕСИЕ ЛУЧШЕ.']});
    R.lights=[lit(10,3,8,'#ffe6b0',0.9),lit(14,8,4,'#ffd9a0',0.6)];
    R.extraGame=(c,L,r)=>{for(let i=0;i<4;i++){const x=2+i*4.4;c.strokeStyle='#8a6d4a';c.lineWidth=0.06;c.strokeRect(x,8.6,2.6,1.4);
      for(let k=0;k<6;k++){c.beginPath();c.moveTo(x+k*0.5,8.6);c.lineTo(x+k*0.5,10);c.stroke();}}
      c.strokeStyle='#5a4a3a';c.lineWidth=0.03;c.beginPath();c.moveTo(10,0.4);c.lineTo(10,3);c.stroke();
      c.fillStyle='#d8a020';c.beginPath();c.arc(10,3.4,0.42,0,TAU);c.fill();
      for(const [dx,dy] of [[-1.4,0.4],[1.4,0.5],[-0.6,1.1],[0.8,1.2]]){c.fillStyle='#e8e8e0';c.beginPath();c.ellipse(10+dx,3+dy,0.4,0.2,0,0,TAU);c.fill();}};
  }}),
z2_vault:gs=>({id:'z2_vault',zone:'hives',sub:'offices',name:'СЕЙФ ЦЕНЗУРЫ',w:24,h:14,secret:true,
  art:RB.art('hives','offices',{fgd:false}),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});R.solids.push(S(0,11,24,3,'steel'));
    R.doors=[RB.L(11,'z2_censor','ЦЕНЗОРСКАЯ')];
    RB.salvage(R,gs,{upgrade:'heal_fast',x:18,y:11,flag:'got_heal_fast',title:'СВАРОЧНЫЙ НАКОНЕЧНИК',
      lines:['ПОЛКИ ДО СВОДА: КАПСУЛЫ «ОТ ПЕЧАТИ». СОТНИ. НЕВСКРЫТЫЕ, С НОМЕРАМИ ИЗЪЯТИЯ.','НА СТОЛЕ ЦЕНЗОРА — ЕГО ИНСТРУМЕНТ: НАКОНЕЧНИК, КОТОРЫЙ ВАРИТ ВДВОЕ БЫСТРЕЕ.']});
    R.lights=[lit(12,3,9,'#9fe6a0',0.7),lit(18,9,4,'#ffd9a0',0.6)];
    R.extraGame=(c,L,r)=>{for(let y=1;y<10.6;y+=1.0){Kit.plate(c,1,y+0.8,14,0.15,'steel',(y*7)|0,{});
      for(let x=1.3;x<14.6;x+=0.6){c.fillStyle=['#a8842a','#8a6d2a','#c9a227'][((x*7+y)|0)%3];rr(c,x,y+0.4,0.48,0.38,0.12);c.fill();
        c.fillStyle='rgba(160,220,120,.25)';c.fillRect(x+0.14,y+0.48,0.2,0.2);}}
      Kit.stencil(c,16,4,'ИЗЪЯТО · 3 114',0.4,'rgba(200,69,47,.5)',0.5);};
  }})
});
