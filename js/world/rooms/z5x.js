"use strict";
/* ============================== ROOMS · Z5 · АРХИВ СОВЕТА ============================== */
/* Последняя зона. Тишина, полки до свода, фонограммы. Здесь собирается правда: Совет — семь
   фонографов, записанных впрок; склеп основателя — его последняя запись; Печать открывается
   изнутри одним человеком. Хранитель всего этого — Архивариус. */
Object.assign(ROOMDEFS,{
z5_hall:gs=>({id:'z5_hall',zone:'archive',sub:'reading',name:'ПРИХОЖАЯ АРХИВА',w:46,h:24,
  art:RB.art('archive','reading'),
  build(R){
    RB.shell(R,'ply',{ceil:0.4});
    R.solids.push(S(0,21,46,3,'ply'),P(30,18.6,5),P(36,16.2,5),P(30,13.8,5),S(38,9,8,0.8,'ply'));
    RB.ring(R,35,7.6,'top',7.2);
    R.doors=[RB.L(21,'z4_gate','ВОРОТА'),RB.R(R,21,'z5_busts','ГАЛЕРЕЯ ОСНОВАТЕЛЕЙ'),RB.R(R,9,'z5_broadcast','ВЕЩАТЕЛЬНАЯ')];
    RB.lamp(R,5,21);
    R.mapPlate={kind:'mapplate',x:9,y:21,flag:'map_archive',title:'СХЕМА АРХИВА'};
    R.station={kind:'station',station:'archive',x:13,y:21,tubeTop:12};
    R.lights=[lit(5,4,9,'#ffcf8a',0.7),lit(20,4,9,'#ffcf8a',0.6),lit(36,4,9,'#ffcf8a',0.6),lit(42,7,5,'#9fd6ff',0.6)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{Kit.sign(c,16,10,6,0.9,'АРХИВ СОВЕТА · ТИШИНА','#c9a227','#191612',1201);SA.phono(c,24,21,1.4);};
  }}),
z5_busts:gs=>({id:'z5_busts',zone:'archive',sub:'crypt',name:'ГАЛЕРЕЯ ОСНОВАТЕЛЕЙ',w:60,h:22,
  art:RB.art('archive','crypt'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,19,14,3,'marble'),S(19,19,10,3,'marble'),S(35,19,25,3,'marble'),S(14,21.4,5,0.6,'marble'),S(29,21.4,6,0.6,'marble'),
      S(8,16.6,2,2.4,'marble'),S(22,16.6,2,2.4,'marble'),S(40,16.6,2,2.4,'marble'),S(50,16.6,2,2.4,'marble'));
    R.hazards=[{x:14,y:20.4,w:5,h:1.6,kind:'pit',back:{x:12.4,y:17.3},backs:[{minX:-99,x:12.4,y:17.3},{minX:16.5,x:19.4,y:17.3}]},
      {x:29,y:20.4,w:6,h:1.6,kind:'pit',back:{x:27.4,y:17.3},backs:[{minX:-99,x:27.4,y:17.3},{minX:32,x:35.4,y:17.3}]}];
    R.doors=[RB.L(19,'z5_hall','ПРИХОЖАЯ'),RB.R(R,19,'z5_stacks','ХРАНИЛИЩЕ ФОНОГРАММ')];
    R.enemies.push({type:'censor',variant:'elite',elite:true,eliteName:'СТРАЖ КАТАЛОГА',x:45,y:19-2.05,patrol:[36,56],amb:true},{type:'clockmaker',x:24,y:19-2.1,patrol:[20,28],amb:true},
      {type:'lampada',x:32,y:8,amb:true});
    R.lights=[lit(9,12,6,'#ffcf8a',0.7),lit(23,12,6,'#ffcf8a',0.7),lit(41,12,6,'#ffcf8a',0.7),lit(51,12,6,'#ffcf8a',0.7)];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{for(const x of [9,23,41,51]){c.fillStyle='#8a8478';c.beginPath();c.arc(x,14.8,0.7,0,TAU);c.fill();
        c.fillStyle='#6a6458';rr(c,x-0.9,15.4,1.8,1.2,0.4);c.fill();c.fillStyle='#4a4438';c.fillRect(x-0.35,14.7,0.18,0.08);c.fillRect(x+0.17,14.7,0.18,0.08);}
      Kit.stencil(c,20,6,'ОНИ ХРАНИЛИ НАС',0.6,'rgba(232,201,106,.35)',0.4);};
  }}),
z5_stacks:gs=>({id:'z5_stacks',zone:'archive',sub:'stacks',name:'ХРАНИЛИЩЕ ФОНОГРАММ',w:30,h:46,
  art:RB.art('archive','stacks'),
  build(R){
    RB.shell(R,'ply',{ceil:0.4});
    R.solids.push(S(0,43,30,3,'ply'),P(14,40.6,6),P(6,38.2,6),P(14,35.8,6),P(13.4,33.4,3),
      S(12,18,1.2,13,'ply',{grip:'r'}),S(16.4,20,1.2,11,'ply',{grip:'l'}),P(4,17.6,8),S(22,12.2,8,0.8,'ply'));
    R.magnetRects=[{x:6,y:9.4,w:18.2,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    R.doors=[RB.L(43,'z5_busts','ГАЛЕРЕЯ'),RB.R(R,12.2,'z5_reading','ЧИТАЛЬНЫЙ ЗАЛ')];
    RB.lore(R,gs,25,6.5,17.6);
    R.enemies.push({type:'lampada',x:20,y:28,amb:true},{type:'lampada',x:10,y:12,amb:true},{type:'clockmaker',x:16,y:40.6-2.1,patrol:[14.4,19.6],amb:true});
    R.lights=[lit(15,40,8,'#ffcf8a',0.6),lit(9,32,7,'#ffcf8a',0.6),lit(14,24,6,'#ffcf8a',0.5),lit(8,15,6,'#ffcf8a',0.6),lit(26,10,6,'#ffcf8a',0.6)];
    R.emitters=[{type:'dust',rate:12}];
    R.extraGame=(c,L,r)=>{for(const m of R.magnetRects){Kit.craneGirder(c,m.x,m.y-1.2,m.w,1.2);Kit.magnetRivets(c,m.x,m.y,m.w);}};
  }}),
z5_reading:gs=>({id:'z5_reading',zone:'archive',sub:'reading',name:'ЧИТАЛЬНЫЙ ЗАЛ',w:54,h:22,
  art:RB.art('archive','reading'),
  build(R){
    RB.shell(R,'ply',{ceil:0.4});
    R.solids.push(S(0,19,54,3,'ply'),P(30,16.6,5),P(36,14.2,5),P(30,11.8,5),P(21,9.4,8),S(0,7.2,4,0.8,'ply'),
      S(10,17.6,4,1.4,'ply'),S(42,17.6,4,1.4,'ply'));
    R.magnetRects=[{x:4,y:4.6,w:18,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    R.doors=[RB.L(19,'z5_stacks','ХРАНИЛИЩЕ'),RB.R(R,19,'z5_council','ЗАЛ СОВЕТА'),
      Object.assign(RB.L(7.2,'z5_private','?'),{reqFlag:'lead_private',reqMsg:'СВИНЦОВАЯ ЗАГЛУШКА'})];
    if(!gs.flags.lead_private)R.pushables.push({kind:'lead',x:0,y:4.8,w:1.6,h:2.4,id:'priv_lead',flag:'lead_private'});
    RB.lamp(R,26,19);RB.lore(R,gs,27,44,17.6);
    R.enemies.push({type:'scribe',x:16,y:19-2.35,patrol:[6,22],amb:true},{type:'mailbot',x:48,y:19-1.55,patrol:[40,52],amb:true},{type:'chandler',x:34,y:6,amb:true});
    R.lights=[lit(12,15,6,'#9fe6a0',0.6),lit(44,15,6,'#9fe6a0',0.6),lit(26,4,10,'#ffcf8a',0.7),lit(2,5.6,3,'#ffd9a0',0.6,{flicker:2})];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{for(const m of R.magnetRects){Kit.craneGirder(c,m.x,m.y-1.2,m.w,1.2);Kit.magnetRivets(c,m.x,m.y,m.w);}
      for(const x of [10,42]){c.fillStyle='#2f6b44';c.beginPath();c.moveTo(x+1.5,17.0);c.lineTo(x+2.5,17.0);c.lineTo(x+2.3,16.7);c.lineTo(x+1.7,16.7);c.closePath();c.fill();}};
  }}),
/* Зал Совета: семь кресел, на каждом — фонограф. Пластинки записаны двести лет назад. */
z5_council:gs=>({id:'z5_council',zone:'archive',sub:'council',name:'ЗАЛ СОВЕТА',w:46,h:28,
  art:RB.art('archive','council'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,25,46,3,'marble'),S(17,22.6,12,2.4,'marble'),P(8,20.2,6),P(32,20.2,6));
    R.doors=[RB.L(25,'z5_reading','ЧИТАЛЬНЫЙ ЗАЛ'),RB.R(R,25,'z5_crypt','СКЛЕП ОСНОВАТЕЛЕЙ')];
    RB.lore(R,gs,11,23,22.6);
    R.interactables.push({kind:'talk',x:20,y:22.6,w:2,h:1.8,flag:'council_heard',title:'СЕМЬ ФОНОГРАФОВ',again:['ИГЛЫ СТОЯТ НА ПОСЛЕДНЕЙ ДОРОЖКЕ. ЗАСЕДАНИЕ — ЧЕРЕЗ МЕСЯЦ.'],
      lines:['ПОД КАЖДЫМ КРЕСЛОМ — ФОНОГРАФ. ИГЛЫ ОПУЩЕНЫ. КУРЬЕР ТРОГАЕТ РЫЧАГ.',
        'ГОЛОС ПЕРВЫЙ: «ПРОТИВ». ВТОРОЙ: «ПРОТИВ». ТРЕТИЙ, ЧЕТВЁРТЫЙ, ПЯТЫЙ: «ПРОТИВ».',
        'ШЕСТОЙ: «ПРОТИВ». СЕДЬМОЙ — ДОЛГОЕ ШИПЕНИЕ, ПОТОМ: «ПРОТИВ».',
        'В КРЕСЛАХ НИКОГО. СОВЕТ — ЭТО ПЛАСТИНКИ. ЗАПИСАНЫ ДВЕСТИ ЛЕТ НАЗАД.']});
    if(!gs.flags.elite_council)R.enemies.push({type:'censor',variant:'elite',elite:true,eliteName:'СТРАЖ СОВЕТА',eliteFlag:'elite_council',x:10,y:25-2.05,patrol:[3,15],
      mini:{k:'ЗОНА V · ЗАЛ СОВЕТА',e:'ПОСЛЕДНИЙ ПОСТ У ПЛАСТИНОК',l:'«СОВЕТ НЕ ПРИНИМАЕТ.»',addons:['parry','paper'],prop:'buckler'}});
    R.enemies.push({type:'keeper',x:36,y:25-2.05,patrol:[30,43],amb:true});
    R.lights=[lit(23,6,14,'#e8c96a',0.8),lit(11,18,6,'#ffcf8a',0.5),lit(35,18,6,'#ffcf8a',0.5)];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{for(let i=0;i<7;i++){const a=PI+0.25+i/6*(PI-0.5),x=23+Math.cos(a)*14,y=24.6+Math.sin(a)*4;
        c.fillStyle='#3a2418';rr(c,x-0.7,y-1.8,1.4,1.8,0.4);c.fill();c.fillStyle='#7a2a1c';rr(c,x-0.55,y-1.6,1.1,1.0,0.3);c.fill();SA.phono(c,x,y-0.1,0.7);}
      Kit.plate(c,17,22.6,12,2.4,'brass',1211,{bolts:true});Kit.stencil(c,18.4,24.2,'ЗА — 0 · ПРОТИВ — 7',0.42,'rgba(30,24,16,.7)',0.7);};
  }}),
/* Склеп Основателей: семь саркофагов. Седьмой открыт — в нём фонограф, а не тело. */
z5_crypt:gs=>({id:'z5_crypt',zone:'archive',sub:'crypt',name:'СКЛЕП ОСНОВАТЕЛЕЙ',w:50,h:22,quiet:true,
  art:RB.art('archive','crypt'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,19,50,3,'marble'));
    for(let i=0;i<7;i++)R.solids.push(S(6+i*5.6,17.6,3.6,1.4,'marble'));
    R.doors=[RB.L(19,'z5_council','ЗАЛ СОВЕТА'),RB.R(R,19,'z5_lift','ПОДЪЁМНИК ПЕЧАТИ')];
    RB.lamp(R,3,19);RB.lore(R,gs,26,41.4,17.6);
    R.lights=[lit(25,6,14,'#cfd6e8',0.6),lit(41,15,5,'#ffcf7a',0.7,{flicker:1.4})];
    R.emitters=[{type:'dust',rate:6}];
    R.extraGame=(c,L,r)=>{for(let i=0;i<7;i++){const x=6+i*5.6;Kit.plate(c,x,17.6,3.6,1.4,'marble',1220+i,{});
        if(i<6){c.fillStyle='#8a8478';rr(c,x-0.1,17.0,3.8,0.7,0.2);c.fill();Kit.stencil(c,x+0.3,18.4,'ОСНОВАТЕЛЬ '+(i+1),0.24,'rgba(40,40,40,.6)',0.6);}
        else{c.save();c.translate(x+3.4,16.6);c.rotate(0.5);c.fillStyle='#8a8478';rr(c,-1.8,-0.3,3.8,0.6,0.2);c.fill();c.restore();SA.phono(c,x+1.8,17.6,0.8);}}};
  }}),
/* Подъёмник Печати: последний подъём всем, что есть. Наверху — фонарь перед Залом Печати. */
z5_lift:gs=>({id:'z5_lift',zone:'archive',sub:'stacks',name:'ПОДЪЁМНИК ПЕЧАТИ',w:22,h:48,
  art:RB.art('archive','stacks'),
  build(R){
    RB.shell(R,'ply',{ceil:0.4});
    R.solids.push(S(0,45,22,3,'ply'),P(12,42.6,6),P(4,40.2,6),S(4,23,1.2,14.8,'ply',{grip:'r'}),S(8.4,25,1.2,12.8,'ply',{grip:'l'}),
      P(10,24.6,6),P(17,20.6,5),S(8,16.2,8,0.8,'ply'),S(0,11.6,3,0.8,'ply'),S(5,7,17,0.8,'ply'));
    R.magnetRects=[{x:2,y:9,w:14,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    RB.ring(R,16,18,'top',2.4);RB.ring(R,6,4.6,'top',4.2);
    R.doors=[RB.L(45,'z5_crypt','СКЛЕП'),RB.R(R,7,'z5_boss','ЗАЛ ПЕЧАТИ')];
    RB.lamp(R,14,7);
    R.enemies.push({type:'lampada',x:14,y:32,amb:true},{type:'lampada',x:6,y:16,amb:true});
    R.lights=[lit(11,42,7,'#ffcf8a',0.6),lit(6,30,6,'#ffcf8a',0.5),lit(14,22,6,'#ffcf8a',0.5),lit(9,12,6,'#ffcf8a',0.5),lit(14,4,7,'#fff6dd',0.8)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{for(const m of R.magnetRects){Kit.craneGirder(c,m.x,m.y-1.2,m.w,1.2);Kit.magnetRivets(c,m.x,m.y,m.w);}};
  }}),
/* Зал Печати: над полом — Колесо, к нему прикован Архивариус. За Колесом — свет. */
z5_boss:gs=>({id:'z5_boss',zone:'archive',sub:'council',name:'ЗАЛ ПЕЧАТИ',w:50,h:34,noCut:true,
  art:RB.art('archive','council',{fgd:false}),
  build(R){
    const dead=!!gs.flags.archivist_dead,done=gs.flags.wheel_turned;
    /* зал Печати: под сводом — рельс картотеки, в центре — колесо Печати над площадкой,
       по краям — ложи писцов, между ними — крючья старых люстр. Пол — свинцовые плиты над тиглем. */
    RB.shell(R,'lead',{ceil:0.4});
    R.solids.push(S(0,30,50,4,'lead'),P(4,25.6,6,0.4,'brass'),P(40,25.6,6,0.4,'brass'),P(19,21.6,12,0.4,'brass'));
    RB.ring(R,14.2,17.4,'top',17);RB.ring(R,35.8,17.4,'top',17);
    R.doors=[RB.L(30,'z5_lift','ПОДЪЁМНИК')];
    if(!dead){R.boss={type:'archivist',x:25,y:7};R.bossTrigger={x:4,y:10,w:42,h:20};R.bossDoor={x:0,y:27.9,w:1.4,h:2.1,active:true};
      R.hazards=[4,10,16,30,36,42].map(x=>({x:x,y:27.8,w:2.6,h:2.2,kind:'steam',ctl:'arch'}))
        .concat([19.2,25.2].map(x=>({x:x,y:17.8,w:5.6,h:3.8,kind:'steam',ctl:'arch3'})));}
    if(dead&&!done)R.interactables.push({kind:'wheel',x:25,y:21.6,label:'КОЛЕСО ПЕЧАТИ',flag:'wheel_turned'});
    R.machines=[{kind:'sealwheel',x:25,y:15.2,r:4.2,turned:done},{kind:'archivist',x:25,y:8,alive:dead}];
    R.lights=[lit(25,15,14,done?'#fff6dd':'#a09070',done?1.3:0.7),lit(7,10,9,'#ffcf8a',0.5),lit(43,10,9,'#ffcf8a',0.5),lit(25,28,12,'#ffd9a0',0.4),
      lit(7,24.6,4,'#ffcf8a',0.4),lit(43,24.6,4,'#ffcf8a',0.4)];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{
      /* рельс картотеки */
      c.fillStyle='#24262a';c.fillRect(5,3.1,40,0.5);c.fillStyle='#8a6d2a';c.fillRect(5,3.05,40,0.08);
      for(let x=6;x<45;x+=3){c.fillStyle='#1a1c20';c.fillRect(x,0.4,0.18,2.8);}
      Kit.stencil(c,16,32.6,'ПЕЧАТЬ · ОТКРЫВАЕТСЯ ИЗНУТРИ',0.5,'rgba(232,201,106,.4)',0.4);
      /* ложи писцов */
      for(const x0 of [4,40]){c.fillStyle='#2a1c18';c.fillRect(x0,26.0,6,0.5);c.strokeStyle='#8a6d2a';c.lineWidth=0.07;
        c.beginPath();c.moveTo(x0,24.7);c.lineTo(x0+6,24.7);c.stroke();for(let i=0;i<=8;i++){c.beginPath();c.moveTo(x0+i*0.75,24.7);c.lineTo(x0+i*0.75,25.6);c.stroke();}}
      /* тигель под полом: швы плит */
      c.strokeStyle='rgba(20,20,24,.8)';c.lineWidth=0.05;for(let x=10;x<=40;x+=2.5){c.beginPath();c.moveTo(x,30);c.lineTo(x,30.6);c.stroke();}
    };
  }}),
/* Вещательная: массив громкоговорителей всех ярусов. Сказать в него можно то, что знаешь. */
z5_broadcast:gs=>({id:'z5_broadcast',zone:'archive',sub:'broadcast',name:'ВЕЩАТЕЛЬНАЯ',w:36,h:20,
  art:RB.art('archive','broadcast'),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});
    R.solids.push(S(0,17,36,3,'steel'),S(22,15.4,6,1.6,'steel'));
    R.doors=[RB.L(17,'z5_hall','ПРИХОЖАЯ')];
    RB.lore(R,gs,28,10,17);
    R.interactables.push({kind:'broadcast',x:25,y:15.4,w:2.4,h:2,label:'ВЕЩАТЕЛЬНЫЙ МАССИВ'});
    R.lights=[lit(18,4,10,'#9fd6ff',0.7),lit(25,13,5,'#69d68f',0.7)];
    R.emitters=[{type:'dust',rate:6}];
    R.extraGame=(c,L,r)=>{Kit.plate(c,22,15.4,6,1.6,'steel',1231,{bolts:true});for(let i=0;i<8;i++){c.fillStyle=['#69d68f','#ffcf7a','#c8452f'][i%3];c.beginPath();c.arc(22.6+i*0.65,16,0.08,0,TAU);c.fill();}
      for(let i=0;i<5;i++)SA.phono(c,4+i*6,8,1.6);};
  }}),
z5_private:gs=>({id:'z5_private',zone:'archive',sub:'reading',name:'ЛИЧНЫЙ АРХИВ ОСНОВАТЕЛЯ',w:22,h:14,secret:true,noCut:true,
  art:RB.art('archive','reading',{fgd:false}),
  build(R){
    RB.shell(R,'ply',{ceil:0.4});R.solids.push(S(0,11,22,3,'ply'));
    R.doors=[RB.R(R,11,'z5_reading','ЧИТАЛЬНЫЙ ЗАЛ')];
    RB.salvage(R,gs,{upgrade:'plate_founder',x:6,y:11,flag:'got_plate_founder',title:'ПЛАСТИНА КУРТКИ',
      lines:['ПИСЬМА ОСНОВАТЕЛЯ — САМОМУ СЕБЕ. «ЕСЛИ КТО-ТО ДОЙДЁТ СЮДА — ЗНАЧИТ, ПЕЧАТЬ БЫЛА ЛИШНЕЙ.»',
        'НА ЕГО ПАРАДНОМ МУНДИРЕ — ЛАТУННАЯ ПЛАСТИНА. ТЕПЕРЬ ОНА НА КУРЬЕРЕ.']});
    R.lights=[lit(11,3,8,'#ffcf8a',0.9)];
    R.extraGame=(c,L,r)=>{for(let i=0;i<40;i++){c.fillStyle='#d8cdb6';c.save();c.translate(2+r()*18,10.9-r()*0.3);c.rotate((r()-0.5)*0.8);c.fillRect(-0.15,-0.1,0.3,0.2);c.restore();}
      c.fillStyle='#3a2a1a';c.fillRect(12,7.6,5,3.4);c.fillStyle='#7a2a1c';c.fillRect(12.4,8,4.2,1.6);};
  }})
});
