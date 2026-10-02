"use strict";
/* ============================== ROOMS · Z3 · САДЫ ЭДЕМА (расширение) ============================== */
/* Путь к Печати идёт через сердце садов: коллектор (подковы) → оросительный канал → гербарий →
   зал ламп-солнц → сарай Корчевателя → его корчевальня (пробойник) → тихий питомник → виноградные
   террасы → купол. Подъёмник к Печати в куполе запаян свинцом — без пробойника не открыть. */
Object.assign(ROOMDEFS,{
/* Фруктовый сад: террасы с деревьями под лампами-солнцами, стремянки, корзины. Люк к корням. */
z3_orchard:gs=>({id:'z3_orchard',zone:'eden',sub:'orchard',name:'ФРУКТОВЫЙ САД',w:60,h:28,
  art:RB.art('eden','orchard'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,25,60,3,'marble'),S(52,21.6,8,3.4,'marble'),S(8,22.6,9,2.4,'marble'),S(24,20.2,10,4.8,'marble'),S(38,22.6,8,2.4,'marble'),
      P(27,17.8,5),P(20,15.4,5),P(4,13,12),P(40,15.4,6));
    R.doors=[RB.L(25,'z3_apiary','ПАСЕКА'),RB.R(R,21.6,'z3_greenhouse','ОРАНЖЕРЕИ'),RB.hatch(18.6,25,'z3_roots','КОРНЕВАЯ ГАЛЕРЕЯ')];
    R.enemies.push({type:'gardener',x:28,y:20.2-1.8,patrol:[25,33],amb:true},{type:'gardener',x:46,y:25-1.8,patrol:[40,51],amb:true},
      {type:'pollinator',x:12,y:8,amb:true},{type:'pollinator',x:44,y:10,amb:true},{type:'lampada',x:34,y:6,amb:true});
    R.lights=[lit(10,3,10,'#fff2c0',0.7),lit(30,3,10,'#fff2c0',0.75),lit(50,3,10,'#fff2c0',0.7),lit(18.6,23.6,3,'#8a7a5a',0.5)];
    R.emitters=[{type:'leaf',rate:3},{type:'pollen',x:20,y:10,rate:2,sw:30},{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{
      for(const [x,y] of [[12,22.6],[29,20.2],[42,22.6],[56,21.6]])SA.fruitTree(c,x,y,6,r,R.wilt);
      Kit.sign(c,30,9.4,4,0.85,'САД · СБОР ПО НОРМЕ','#5a7a3a','#f0f0e0',1001);
      Kit.stencil(c,17.4,23.4,'КОРНИ ↓',0.34,'rgba(60,70,40,.6)',0.6);
    };
  }}),
/* Пасека: стены-соты, пирамида ульев, рой опылителей. Под сводом — дикий улей (выхлоп). */
z3_apiary:gs=>({id:'z3_apiary',zone:'eden',sub:'apiary',name:'ПАСЕКА',w:46,h:26,
  art:RB.art('eden','apiary'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,24,46,2,'marble'),S(6,20,4,4,'ply'),S(14,17,4,7,'ply'),S(22,14,4,10,'ply'),S(30,17,4,7,'ply'),S(38,20,4,4,'ply'),
      P(12,11.4,4),S(0,6.6,5,0.6,'marble'));
    R.doors=[RB.R(R,24,'z3_orchard','ФРУКТОВЫЙ САД'),RB.L(6.6,'z3_hive','?')];
    RB.lore(R,gs,30,42,24);
    R.enemies.push({type:'pollinator',x:16,y:10,amb:true},{type:'pollinator',x:30,y:8,amb:true},{type:'pollinator',x:40,y:12,amb:true},
      {type:'lampada',x:24,y:6,amb:true});
    R.lights=[lit(8,6,9,'#ffcf6a',0.7),lit(24,5,10,'#ffcf6a',0.8),lit(38,6,9,'#ffcf6a',0.7),lit(2.5,4.6,3,'#ffe6a3',0.8,{flicker:2})];
    R.emitters=[{type:'pollen',x:23,y:12,rate:4,sw:20},{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{for(const [x,y,h] of [[6,20,4],[14,17,7],[22,14,10],[30,17,7],[38,20,4]])for(let k=0;k<h;k+=1.0){c.fillStyle=['#c9a227','#b08d3e','#e8c96a'][(k|0)%3];
      rr(c,x+0.05,y+k+0.05,3.9,0.9,0.1);c.fill();c.fillStyle='#2a1a08';c.fillRect(x+1.6,y+k+0.6,0.8,0.1);}
      Kit.plate(c,12,11.7,4,0.3,'brass',1011,{});
      c.fillStyle='rgba(120,80,20,.8)';rr(c,0.5,3.8,3.4,2.8,0.6);c.fill();SA.honeycomb(c,0.6,4,3.2,2.4,0.4,'#c9a227','rgba(255,220,120,.8)',r,0.3);};
  }}),
/* Корневая галерея: под садами — земля, корни, светящиеся грибы. Свинцовая заглушка в стене. */
z3_roots:gs=>({id:'z3_roots',zone:'eden',sub:'roots',name:'КОРНЕВАЯ ГАЛЕРЕЯ',w:58,h:22,
  art:RB.art('eden','roots'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(0,20,58,2,'concrete'),P(10,17.6,4),P(4,15.2,4),P(10,12.8,4),P(4,10.4,4),P(10,8,4),P(4,5.6,4),P(6,3.3,3.6),
      S(24,16,6,4,'concrete'),S(40,17,5,3,'concrete'));
    R.doors=[Object.assign(RB.top(6.2,'z3_orchard','САД'),{h:1.4}),RB.R(R,20,'z3_canal','ОРОСИТЕЛЬНЫЙ КАНАЛ'),
      {x:33.6,y:17.9,w:1.4,h:2.1,to:'z3_seedvault',label:'?',reqFlag:'lead_roots',reqMsg:'СВИНЦОВАЯ ЗАГЛУШКА'}];
    if(!gs.flags.lead_roots)R.pushables.push({kind:'lead',x:33.3,y:17.6,w:2.0,h:2.4,id:'roots_lead',flag:'lead_roots'});
    R.enemies.push({type:'mokrica',x:20,y:20-0.62,patrol:[16,23],amb:true},{type:'mokrica',variant:'shell',x:48,y:20-0.95,patrol:[45,56],amb:true},
      {type:'gardener',x:36,y:20-1.8,patrol:[31,39],amb:true},{type:'lampada',x:28,y:8,amb:true});
    RB.chalk(R,36.6,15.4,'СЕМЕНА',{s:0.4});
    R.lights=[lit(7,5,7,'#7fe0d0',0.6),lit(20,15,6,'#7fe0d0',0.6),lit(34,17,5,'#ffd9a0',0.6,{flicker:2}),lit(48,14,7,'#c090f0',0.5),lit(56.8,18.6,3,'#8fd6ff',0.4)];
    R.emitters=[{type:'drip',x:15,y:1,rate:0.8},{type:'drip',x:30,y:1,rate:0.6},{type:'drip',x:46,y:1,rate:0.7},{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{for(let i=0;i<24;i++){let x=r()*58,y=0.4;c.strokeStyle='#2a2a1e';c.lineWidth=0.12+r()*0.25;c.beginPath();c.moveTo(x,y);
        for(let k=0;k<6;k++){x+=(r()-0.5)*1.6;y+=0.6+r()*1.4;c.lineTo(x,y);}c.stroke();}
      Kit.stencil(c,5,2.6,'САД ↑',0.34,'rgba(127,224,208,.5)',0.5);};
  }}),
/* Оросительный канал: лотки с водой во всю длину, над водой — магнитные рельсы под сводом. */
z3_canal:gs=>({id:'z3_canal',zone:'eden',sub:'irrigation',name:'ОРОСИТЕЛЬНЫЙ КАНАЛ',w:66,h:24,
  art:RB.art('eden','irrigation'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,21,12,3,'marble'),S(54,21,12,3,'marble'),S(12,23.2,42,0.8,'marble'),
      P(8,18.6,4),P(3,16.2,4),P(8,13.8,4),P(3,11.4,4),P(8,9,4),P(3,6.6,3),P(6,4.2,3),
      P(28,7.6,4),S(50,12,16,1,'marble'));
    R.magnetRects=[{x:14,y:1.4,w:14,h:0.7},{x:32,y:1.4,w:18.2,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    R.hazards=[{x:12,y:21.6,w:42,h:1.6,kind:'pit',look:'water',back:{x:10.4,y:19.3},
      backs:[{minX:-99,x:10.4,y:19.3},{minX:24,x:29.6,y:5.9},{minX:42,x:51,y:10.3}]}];
    R.doors=[{x:6,y:0.42,w:2.2,h:2.6,to:'z3_collector',label:'КОЛЛЕКТОР'},RB.L(21,'z3_roots','КОРНЕВАЯ ГАЛЕРЕЯ'),RB.R(R,12,'z3_herbarium','ГЕРБАРИЙ')];
    R.signs=[{x:20,y:4.2,keys:['SPACE'],text:'ДЕРЖАТЬ — НА РЕЛЬСЕ',need:'magnet'}];
    R.enemies.push({type:'lampada',x:22,y:12,amb:true},{type:'lampada',x:40,y:13,amb:true},{type:'pollinator',x:58,y:8,amb:true});
    R.lights=[lit(6,8,8,'#bfeee8',0.6),lit(20,18,9,'#7fe0d0',0.7),lit(40,18,9,'#7fe0d0',0.7),lit(30,6,4,'#ffe6b0',0.6),
      lit(58,9,7,'#ffe6b0',0.6),lit(21,3,5,'#e8c96a',0.5),lit(41,3,5,'#e8c96a',0.5)];
    R.emitters=[{type:'drip',x:20,y:7,rate:1.2},{type:'drip',x:38,y:7,rate:1},{type:'mist',rate:1.5},{type:'dust',rate:6}];
    R.extraGame=(c,L,r)=>{for(const m of R.magnetRects){Kit.craneGirder(c,m.x,m.y-1.2,m.w,1.2);Kit.magnetRivets(c,m.x,m.y,m.w);}
      Kit.plate(c,28,7.9,4,0.3,'brass',1021,{});
      Kit.sign(c,52,9.4,4,0.85,'ГЕРБАРИЙ →','#5a7a3a','#f0f0e0',1022);};
  }}),
/* Гербарий: тишина, стеклянные шкафы с засушенными листьями. Каталог Эдема (№18). Фонарь. */
z3_herbarium:gs=>({id:'z3_herbarium',zone:'eden',sub:'herbarium',name:'ГЕРБАРИЙ',w:44,h:18,
  art:RB.art('eden','herbarium'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,15,44,3,'marble'),S(10,13,4,2,'steel'),S(20,12,4,3,'steel'),S(30,13,4,2,'steel'));
    R.doors=[RB.L(15,'z3_canal','КАНАЛ'),RB.R(R,15,'z3_sunhall','ЗАЛ ЛАМП-СОЛНЦ')];
    RB.lamp(R,5,15);RB.lore(R,gs,18,22,12);
    R.enemies.push({type:'pollinator',x:34,y:7,amb:true});
    RB.elite(R,gs,{type:'gardener',x:26,y:15-1.8,patrol:[16,36],eliteName:'СТАРШИЙ САДОВНИК',eliteFlag:'elite_herb',
      reward:{upgrade:'heavy_fast',x:22,y:12,flag:'got_heavy_fast',title:'ТЯЖЁЛАЯ РУКОЯТЬ',
        lines:['РУКОЯТЬ САДОВОГО СЕКАТОРА, ЗАЛИТАЯ СВИНЦОМ: ЧТОБЫ РЕЗ ШЁЛ С ОДНОГО ЗАМАХА.','НА РЕЗАКЕ КУРЬЕРА ОНА ДЕРЖИТСЯ КАК РОДНАЯ: ЗАРЯЖЕННЫЙ УДАР КОПИТСЯ БЫСТРЕЕ.']}});
    R.lights=[lit(5,4,8,'#ffe6b0',0.7),lit(22,4,9,'#ffe6b0',0.75),lit(38,4,8,'#ffe6b0',0.7),lit(22,10,4,'#bfeee8',0.6)];
    R.emitters=[{type:'dust',rate:12}];
    R.extraGame=(c,L,r)=>{for(const [x,y,w,h] of [[10,13,4,2],[20,12,4,3],[30,13,4,2]]){c.fillStyle='rgba(190,220,210,.35)';c.fillRect(x+0.15,y+0.15,w-0.3,h-0.3);
        c.fillStyle='#7a8a4a';c.beginPath();c.ellipse(x+w/2,y+h/2,0.6,0.3,0.3,0,TAU);c.fill();}
      Kit.sign(c,16,7.6,6,0.9,'ГЕРБАРИЙ · 412 ВИДОВ','#5a7a3a','#f0f0e0',1031);};
  }}),
/* Зал ламп-солнц: искусственное солнце под сводом, пересвет, жар. Лестница площадок вокруг. */
z3_sunhall:gs=>({id:'z3_sunhall',zone:'eden',sub:'sunhall',name:'ЗАЛ ЛАМП-СОЛНЦ',w:52,h:32,
  art:RB.art('eden','sunhall'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,29,52,3,'marble'),P(6,26.6,6),P(14,24.2,6),P(22,21.8,6),P(30,19.4,6),P(38,17,6),P(46,14.6,6),P(38,12.2,6),P(46,9.8,6));
    R.hazards=[{x:26.2,y:6,w:1.6,h:23,kind:'steam',look:'heat',per:3.2,on:0.9,off:0},{x:42.2,y:4,w:1.6,h:25,kind:'steam',look:'heat',per:3.2,on:0.9,off:1.6}];
    R.doors=[RB.L(29,'z3_herbarium','ГЕРБАРИЙ'),RB.R(R,9.8,'z3_shed','САРАЙ')];
    RB.lore(R,gs,20,48.5,9.8);
    R.enemies.push({type:'lampada',x:20,y:12,amb:true},{type:'lampada',x:30,y:8,amb:true},{type:'lampada',x:12,y:16,amb:true},
      {type:'gardener',x:33,y:19.4-1.8,patrol:[30.5,35.5],amb:true});
    R.lights=[lit(26,3,20,'#fff6d8',1.1),lit(10,24,8,'#fff2c0',0.6),lit(40,14,8,'#fff2c0',0.6)];
    R.emitters=[{type:'dust',rate:16},{type:'leaf',rate:1.5}];
    R.extraGame=(c,L,r)=>{Kit.sign(c,2,24,4.2,0.85,'ГРАФИК СВЕТА · 14/10','#5a7a3a','#f0f0e0',1041);};
  }}),
/* Сарай Корчевателя: инструменты, ящики гербицида; на крюке — форменная куртка Курьера 38. */
z3_shed:gs=>({id:'z3_shed',zone:'eden',sub:'shed',name:'САРАЙ КОРЧЕВАТЕЛЯ',w:32,h:14,quiet:true,
  art:RB.art('eden','shed',{fgd:false}),
  build(R){
    RB.shell(R,'ply',{ceil:0.4});R.solids.push(S(0,11,32,3,'ply'),S(24,9.6,4,1.4,'ply'));
    R.doors=[RB.L(11,'z3_sunhall','ЗАЛ ЛАМП-СОЛНЦ'),RB.R(R,11,'z3_boss','КОРЧЕВАЛЬНЯ')];
    RB.lamp(R,7,11);RB.lore(R,gs,19,18,11);
    RB.chalk(R,14,6.6,'38',{s:0.5});
    R.lights=[lit(7,3,8,'#ffd9a0',0.8),lit(18,4,7,'#ffd9a0',0.6,{flicker:1.6}),lit(30,9,3,'#c8452f',0.5)];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{
      /* куртка Курьера 38 на крюке: та же, что у курьера, только выцветшая */
      c.strokeStyle='#4a3a2a';c.lineWidth=0.06;c.beginPath();c.moveTo(16.4,5.4);c.lineTo(16.4,6);c.stroke();
      c.fillStyle='#4a4436';c.beginPath();c.moveTo(15.6,6.1);c.lineTo(17.2,6.1);c.lineTo(17.4,8.4);c.lineTo(15.4,8.4);c.closePath();c.fill();
      c.fillStyle='#7a2418';c.fillRect(15.9,6.1,1.0,0.18);c.fillStyle='#a8842a';c.fillRect(15.8,7.0,0.28,0.18);
      for(let i=0;i<3;i++)Kit.barrel(c,24.4+i*1.2,9.1,0.4,0.95,'#5a7a3a');Kit.stencil(c,24,8.6,'ГЕРБИЦИД',0.3,'rgba(240,240,220,.6)',0.6);
      Kit.sign(c,26,3.6,4.4,0.85,'КОРЧЕВАЛЬНЯ →','#c8452f','#f0e2cf',1051);};
  }}),
/* Корчевальня: арена Корчевателя. Над полем — рельс кормовой лебёдки, по краям — гряды. */
z3_boss:gs=>({id:'z3_boss',zone:'eden',sub:'orchard',name:'КОРЧЕВАЛЬНЯ',w:56,h:26,noCut:true,
  art:RB.art('eden','orchard'),
  build(R){
    const dead=gs.bosses.uprooter;
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,22,56,4,'marble'),P(8,17.6,6),P(42,17.6,6),P(24,13.6,8));
    R.boss=dead?null:{type:'uprooter',x:32,y:22-3.4};
    R.bossTrigger={x:6,y:12,w:44,h:10};
    R.bossDoor={x:0,y:19.9,w:1.4,h:2.1,active:!dead};
    R.doors=[RB.L(22,'z3_shed','САРАЙ'),RB.R(R,22,'z3_quiet','ПИТОМНИК',{reqFlag:'boss3_dead',reqMsg:'ВОРОТА ЗАРОСЛИ. КОРЧЕВАТЕЛЬ ЕЩЁ РАБОТАЕТ.'})];
    if(dead)RB.salvage(R,gs,{ability:'breaker',x:28,y:22,flag:'got_breaker',title:'ПРОБОЙНИК КОРЧЕВАТЕЛЯ',
      lines:['В ГРУДИ КОРЧЕВАТЕЛЯ — ПОРШНЕВОЙ ПРОБОЙНИК. ИМ ОН ВЫРЫВАЛ ИЗ ЗЕМЛИ ВСЁ, ЧЕГО НЕТ В КАТАЛОГЕ.',
        'ОН ВСТАЁТ НА СОПЛО РЕЗАКА. ИМПУЛЬС ТЕПЕРЬ ПРОБИВАЕТ СВИНЕЦ.']});
    R.lights=[lit(12,4,12,'#fff2c0',0.8),lit(28,3,14,'#fff2c0',0.9),lit(44,4,12,'#fff2c0',0.8),lit(28,20,10,'#ffd9a0',0.4)];
    R.emitters=[{type:'leaf',rate:2},{type:'pollen',x:28,y:12,rate:1.5,sw:40},{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{Kit.craneGirder(c,0,1.2,56,1.0);for(const x of [10,46])SA.fruitTree(c,x,17.6,5,r,R.wilt);
      if(dead){for(let i=0;i<10;i++)SA.wild(c,4+r()*48,22,5,r);}};
  }}),
/* Тихий питомник: после Корчевателя сквозь трещины лезут дикие жёлтые цветы. Фонарь. */
z3_quiet:gs=>({id:'z3_quiet',zone:'eden',sub:'herbarium',name:'ТИХИЙ ПИТОМНИК',w:26,h:14,quiet:true,noCut:true,
  art:RB.art('eden','herbarium'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});R.solids.push(S(0,11,26,3,'marble'));
    R.doors=[RB.L(11,'z3_boss','КОРЧЕВАЛЬНЯ'),RB.R(R,11,'z3_vineyard','ВИНОГРАДНЫЕ ТЕРРАСЫ')];
    RB.lamp(R,13,11);RB.chalk(R,6,7.2,'38 ДОШЁЛ ДО САДОВ',{s:0.36});
    R.lights=[lit(13,3,9,'#fff2c0',0.8),lit(4,9,4,'#ffd83a',0.4)];
    R.emitters=[{type:'pollen',x:13,y:8,rate:2,sw:20},{type:'dust',rate:6}];
    R.extraGame=(c,L,r)=>{for(let i=0;i<14;i++)SA.wild(c,1+r()*24,11,5,r);for(let i=0;i<8;i++){c.fillStyle='#8a6d4a';rr(c,2+i*3,10.2,1.2,0.8,0.1);c.fill();SA.wild(c,2.6+i*3,10.2,4,r);}};
  }}),
/* Виноградные террасы: подъём обратно к куполу — лестница гряд, камин лоз (кошки), рымы под сводом. */
z3_vineyard:gs=>({id:'z3_vineyard',zone:'eden',sub:'orchard',name:'ВИНОГРАДНЫЕ ТЕРРАСЫ',w:24,h:46,noCut:true,
  art:RB.art('eden','orchard'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    R.solids.push(S(0,43,24,3,'marble'),P(14,40.6,5),P(8,38.2,5),P(14,35.8,5),
      S(8,18,1.2,16,'marble',{grip:'r'}),S(12.4,20,1.2,14,'marble',{grip:'l'}),P(2,17.6,6),S(0,8,6,1,'marble'));
    RB.ring(R,10,11.5,'top',11.1);RB.ring(R,5,5.6,'top',5.2);
    R.doors=[RB.L(43,'z3_quiet','ПИТОМНИК'),RB.L(8,'z3_dome','КУПОЛЬНЫЙ ПОДЪЁМ')];
    R.enemies.push({type:'lampada',x:16,y:28,amb:true},{type:'pollinator',x:6,y:12,amb:true});
    R.lights=[lit(12,40,8,'#fff2c0',0.7),lit(10,26,7,'#fff2c0',0.6),lit(6,14,7,'#fff2c0',0.6),lit(3,6,5,'#fff2c0',0.7)];
    R.emitters=[{type:'leaf',rate:2},{type:'dust',rate:6}];
    R.extraGame=(c,L,r)=>{for(let i=0;i<8;i++){const x=r()*24;Kit.vine(c,[[x,0.4],[x+(r()-0.5),8],[x+(r()-0.5)*2,16],[x,24]],(i*7)|0);}};
  }}),
/* ---------- тайники ---------- */
/* Семенохранилище: семена с поверхности в конвертах, каталог вне каталога. Пластина куртки. */
z3_seedvault:gs=>({id:'z3_seedvault',zone:'eden',sub:'herbarium',name:'СЕМЕНОХРАНИЛИЩЕ',w:24,h:14,secret:true,noCut:true,
  art:RB.art('eden','herbarium',{fgd:false}),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});R.solids.push(S(0,11,24,3,'marble'));
    R.doors=[RB.L(11,'z3_roots','КОРНИ')];
    RB.salvage(R,gs,{upgrade:'plate_seed',x:18,y:11,flag:'got_plate_seed',title:'ПЛАСТИНА КУРТКИ',
      lines:['КОНВЕРТЫ С СЕМЕНАМИ. НА КАЖДОМ — ПОДПИСЬ ОТ РУКИ: «СВЕРХУ». ДАТЫ — ПРОШЛЫЙ ГОД.','ПОД КОНВЕРТАМИ — ЛАТУННАЯ ПЛАСТИНА. КТО-ТО ЖДАЛ, ЧТО СЮДА ДОЙДУТ.']});
    R.lights=[lit(12,3,9,'#ffe6b0',0.8),lit(18,9,4,'#ffd83a',0.6)];
    R.extraGame=(c,L,r)=>{for(let y=1.4;y<9;y+=1.2)for(let x=1;x<16;x+=0.5){c.fillStyle=['#d8cdb6','#c8bca0','#e0d6c0'][((x*3+y)|0)%3];c.fillRect(x,y,0.42,0.9);
      c.fillStyle='rgba(60,50,30,.5)';c.fillRect(x+0.06,y+0.3,0.3,0.04);}
      Kit.stencil(c,16.5,4,'СВЕРХУ',0.42,'rgba(90,120,60,.6)',0.6);};
  }}),
/* Дикий улей: соты, слепленные не по каталогу. Магнит лома. */
z3_hive:gs=>({id:'z3_hive',zone:'eden',sub:'apiary',name:'ДИКИЙ УЛЕЙ',w:20,h:14,secret:true,noCut:true,
  art:RB.art('eden','apiary',{fgd:false}),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});R.solids.push(S(0,11,20,3,'marble'));
    R.doors=[RB.R(R,11,'z3_apiary','ПАСЕКА')];
    RB.salvage(R,gs,{upgrade:'scrap_magnet',x:6,y:11,flag:'got_scrap_magnet',title:'МАГНИТ ЛОМА',
      lines:['ДИКИЕ ОПЫЛИТЕЛИ СЛЕПИЛИ СОТЫ ИЗ ВСЕГО ЖЕЛЕЗНОГО, ЧТО НАШЛИ.','В СЕРДЦЕВИНЕ — МАГНИТ. ЛОМ ИЗ СЛОМАННЫХ ДЕТАЛЕЙ ТЕПЕРЬ ЛЕТИТ К КУРЬЕРУ САМ.']});
    R.enemies.push({type:'pollinator',x:12,y:6,amb:true});
    R.lights=[lit(10,5,9,'#ffcf6a',0.9)];
    R.extraGame=(c,L,r)=>{SA.honeycomb(c,2,1,16,8,0.6,'#8a6d2a','rgba(255,220,120,.8)',r,0.25);};
  }})
});
