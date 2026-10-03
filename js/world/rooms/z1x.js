"use strict";
/* ============================== ROOMS · Z1 · ОБУЧЕНИЕ ============================== */
/* Урок 2 и урок 3. Каждый навык встречается так, что без него дальше не пройти,
   и объясняется окружением: трафарет на стене, поведение механизма, результат удара. */
Object.assign(ROOMDEFS,{
/* ---------- УРОК 2: первый механизм, удар, поломка узла ----------
   Низкий коридор — через мокрицу не перепрыгнуть: остаётся бить. Первый же удар по щётке
   отрывает её (узел ломается, деталь отлетает), мокрица без щётки безопасна и пятится.
   Дальше — решётка (удар по предметам), фонарь-колонка у выхода и первая метка Курьера 38. */
z1_gallery:gs=>({id:'z1_gallery',zone:'sump',sub:'workshop',name:'ГАЛЕРЕЯ ЧИСТИЛЬЩИКОВ',w:54,h:16,
  art:RB.art('sump','workshop'),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});
    R.solids.push(S(0,13,54,3,'rust'),
      /* низкий коридор: потолок 2.2 над полом */
      S(14,0.4,14,10.4,'concrete'),
      /* помост для второй мокрицы и ступень к нему */
      P(32,10.6,9,0.4),S(30.4,12.0,1.4,1.0,'ply'));
    RB.grate(R,gs,'ggrate',46,0.4,0.6,12.6,'gallery_grate');
    R.doors=[RB.L(13,'z1_start','СТАРТОВАЯ НИША'),RB.R(R,13,'z1_charge','ЗАРЯДНАЯ СТАНЦИЯ')];
    R.signs=[{x:7.6,y:7.4,keys:['J'],alt:'ЛКМ',text:'УДАР'},
      {x:37,y:6.2,keys:['S','J'],alt:'ЛКМ',text:'В ПРЫЖКЕ — УДАР ВНИЗ',hideFlag:'gallery_grate'}];
    R.enemies.push({type:'mokrica',x:24,y:12.38,patrol:[15.2,26.8],face:-1,amb:true},
      {type:'mokrica',x:37,y:9.98,patrol:[32.4,40.6],amb:true});
    RB.lamp(R,50,13);
    RB.chalk(R,49.4,9.4,'38',{arrow:1,s:0.5});
    R.lights=[lit(5,3,10,'#ffd9a0',1.0),lit(11,2.4,7,'#ffd9a0',0.7,{flicker:1.3}),
      lit(18,11.4,4.5,'#ffb070',0.7),lit(25,11.4,4.5,'#ffb070',0.6,{flicker:0.9}),
      lit(36,4,10,'#ffd9a0',0.95),lit(44,4,8,'#ffbe63',0.8),lit(52.8,11.6,3.5,'#8fd6ff',0.6),lit(1.2,11.6,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:14},{type:'drip',x:21,y:10.9,rate:0.5},{type:'steam',x:43,y:12.6,rate:0.35},{type:'spark',x:30,y:4,rate:0.25}];
    R.extraGame=(c,L,r)=>{
      Kit.pipe(c,[[0,1.4],[54,1.4]],0.2,'steel',{seed:301,band:3,bandCol:'#c9a227'});
      Kit.pipe(c,[[29,1.4],[29,12.8]],0.16,'rust',{seed:302});
      Kit.stencil(c,2.2,9.4,'ГАЛЕРЕЯ ЧИСТИЛЬЩИКОВ · ЯРУС −41',0.4,'rgba(216,204,178,.5)',0.5);
      /* брошенная тележка-уборщик: такие же мокрицы, только мёртвые */
      Kit.plate(c,29.2,11.5,1.6,0.6,'rust',305,{rust:0.9});
      PROP.toolboard(c,3,9.6,2.6,1.4,r);
      Kit.sign(c,8.6,9.4,3.6,0.8,'НИЗКИЙ ПРОЁМ · МОКРИЦЫ','#c9a227','#191612',307);
      Kit.crate(c,42.2,12.0,1.0,1.0,{seed:308});Kit.barrel(c,43.6,12.05,0.42,0.95,'#5c4433');
      /* мёртвый чистильщик у фонаря: смена не кончилась */
      PROP.corpse(c,52.6,13,{face:-1,col:'#41463a',hold:'paper'});
      for(let i=0;i<6;i++)Kit.oilStain(c,2+r()*50,12.95,1+r(),rng(310+i));
      Kit.puddle(c,20,12.96,1.6);
    };
    R.extraTop=(c,L,r)=>{
      /* низкий коридор: бетонная плита свода и её жёлтая кромка — «здесь не прыгнуть» */
      Kit.hazardTape(c,14,10.55,14,0.25);
      for(let x=15;x<27;x+=3)Kit.lampCage(c,x+1,11.1,0.24);
      Kit.plate(c,32,10.9,9,0.5,'steel',309,{rust:0.6});
    };
  }}),
/* ---------- УРОК 3: ранец под давлением — импульс, прерывание, рывок ----------
   A. Станция заряжает резак → стена ящиков (немедленный импульс).
   B. Сварщик, прикованный к рельсу, заваривает люк. Горелка под щитком: удар звенит.
      Когда он замахивается на курьера, кольцо сжимается на горелке; импульс в миг,
      когда оно сомкнулось, срывает замах и откидывает щиток — горелку можно сломать.
   C. Вторая станция — клапан рывка.
   D. Испытательный туннель: тяжёлая мокрица-панцирник, свод низкий — не перепрыгнуть,
      в лоб — бронещиток. Только рывок сквозь неё; на выходе след ложится на треснувший
      люк на корме — удар его ломает. Механизм остановлен — стенд пройден, дверь открыта. */
z1_charge:gs=>({id:'z1_charge',zone:'sump',sub:'workshop',name:'ЗАРЯДНАЯ СТАНЦИЯ',w:66,h:18,
  art:RB.art('sump','workshop'),
  build(R){
    const F=gs.flags,welded=!F.charge_weld;
    RB.shell(R,'steel',{ceil:0.4});
    R.solids.push(S(0,15,66,3,'rust'),
      /* B: свод над сварщиком — 2.6 над полом */
      S(18,0.4,13.4,12.0,'concrete'),
      /* D: испытательный туннель — 2.2 над полом */
      S(39,0.4,17,12.4,'steel'));
    RB.crates(R,gs,'ccr',13.2,0.4,2.2,14.6,'charge_crates');
    if(welded&&!F.charge_test)R.solids.push(S(30.8,12.4,0.6,2.6,'steel',{dyn:true,pid:'weldgate'}));
    R.doors=[RB.L(15,'z1_gallery','ГАЛЕРЕЯ'),
      RB.R(R,15,'z1_hub','НАСОСНАЯ СТАНЦИЯ',{reqFlag:'charge_test',reqMsg:'СТЕНД НЕ ПРОЙДЕН · МЕХАНИЗМ НА ИСПЫТАНИИ'})];
    R.clearFlag='charge_test';
    if(!F.charge_test){
      if(welded)R.enemies.push({type:'repairer',variant:'welder',x:29.0,y:15-1.55,patrol:[27,29],face:1});
      R.enemies.push({type:'mokrica',variant:'shell',x:49,y:15-0.95,patrol:[41,54.5],face:-1});}
    RB.salvage(R,gs,{ability:'pulse',x:7.4,y:15,flag:'got_pulse',title:'ЗАРЯДНАЯ СТАНЦИЯ · РЕЗАК',
      lines:['СТАНЦИЯ ПОД НАПРЯЖЕНИЕМ. В ЗАЖИМЕ — РЕЗАК PUSH-PULSE.','ШЛАНГ К РАНЦУ. СТРЕЛКА ДАВЛЕНИЯ ПОЛЗЁТ ВВЕРХ.',
        'РЕЗАК НЕ РЕЖЕТ И НЕ РАНИТ. ОН ТОЛКАЕТ ВСЁ, ЧТО ИМЕЕТ ВЕС.']});
    RB.salvage(R,gs,{ability:'dash',x:34.6,y:15,flag:'got_dash',title:'ЗАРЯДНАЯ СТАНЦИЯ · КЛАПАН',
      lines:['ВТОРАЯ СТАНЦИЯ. ЛАТУННЫЙ КЛАПАН С СОПЛОМ — ЕГО СТАВЯТ НА РАНЦЫ ОБХОДЧИКОВ.',
        'ВРЕЗКА. ЩЕЛЧОК. РАНЕЦ ВЫДЫХАЕТ ПАР НАЗАД.','КЛАПАН ДАЁТ РЫВОК: НА ЕГО ВРЕМЯ КУРЬЕРА НЕ ДОСТАТЬ.']});
    R.signs=[{x:9.6,y:9.2,keys:['K'],alt:'ПКМ',text:'ИМПУЛЬС',need:'pulse',hideFlag:'charge_crates'},
      {x:22.6,y:9.3,keys:['K'],alt:'ПКМ',text:'КОГДА КОЛЬЦО СОМКНЁТСЯ',need:'pulse',hideFlag:'charge_weld'},
      {x:41.5,y:9.6,keys:['SHIFT'],text:'РЫВОК СКВОЗЬ',need:'dash',hideFlag:'charge_test'},
      {x:51,y:9.6,keys:['J'],alt:'ЛКМ',text:'ПО СЛЕДУ НА ТРЕЩИНЕ',need:'dash',hideFlag:'charge_test'}];
    RB.lamp(R,60.5,15);
    RB.chalk(R,58.4,10.6,'38 БЫЛ ЗДЕСЬ',{s:0.36});
    R.tick=(dt,W)=>{
      if(W.game.gs.flags.charge_weld)return;
      const wd=W.enemies.find(e=>e.variant==='welder');
      if(!wd||wd.dead){const g=W.game;g.gs.flag('charge_weld');
        if(R.solids.some(q=>q.pid==='weldgate')){W.removeSolid('weldgate');g.audio.gate();g.camera.addShake(0.4);
          g.particles.burst(31.1,13.6,22,{kind:'spark',col:'#ffcf7a',spd:6,life:0.6,size:0.05,add:true,g:14});
          g.particles.burst(31.1,14,14,{kind:'smoke',col:'#5a4c40',spd:2,life:1.4,size:0.4,grow:0.8,drag:1.4,a:0.5});}}};
    R.dyn=(c,t,W)=>{
      /* люк, который заваривал сварщик: свежий шов светится, пока его варят */
      if(R.solids.some(q=>q.pid==='weldgate')){Kit.plate(c,30.8,12.4,0.6,2.6,'steel',331,{rust:0.4});
        const k=0.5+0.5*Math.sin(t*9);c.fillStyle=rgba('#ffcf7a',0.4+0.4*k);c.fillRect(30.82,12.6,0.06,2.2);
        game.renderer.glowAdd(30.85,13.7,0.9,'#ffb45a',0.3*k);}
    };
    R.lights=[lit(6,3,10,'#dfe8f0',0.9),lit(7.4,12.4,4,'#9fe0ff',0.7),lit(14,3,8,'#ffd9a0',0.7),
      lit(24,11.6,5,'#ffd9a0',0.75),lit(29.5,13.6,3,'#ffb45a',0.8,{flicker:3}),lit(34.6,12.4,4,'#9fe0ff',0.7),
      lit(36,3,8,'#ffd9a0',0.7),lit(45,12,4.5,'#ffd9a0',0.6),lit(52,12,4.5,'#ffd9a0',0.6,{flicker:1.2}),
      lit(60,4,9,'#ffbe63',0.9),lit(64.8,13.6,3.5,'#8fd6ff',0.6)];
    R.emitters=[{type:'dust',rate:16},{type:'steam',x:2,y:14.6,rate:0.4},{type:'steam',x:57,y:14.6,rate:0.3},{type:'drip',x:35,y:1,rate:0.5}];
    R.extraGame=(c,L,r)=>{
      Kit.pipe(c,[[0,1.6],[66,1.6]],0.22,'steel',{seed:321,band:3,bandCol:'#c8452f'});
      PROP.chargeStation(c,7.4,15,!F.got_pulse,'СТАНЦИЯ 1 · ИНСТРУМЕНТ');
      PROP.chargeStation(c,34.6,15,!F.got_dash,'СТАНЦИЯ 2 · КЛАПАНЫ');
      Kit.sign(c,17.6,11.0,3.4,0.75,'СВАРКА · НЕ ПОДХОДИТЬ','#c8452f','#f0e2cf',322);
      Kit.sign(c,38.4,8.2,4.6,0.85,'ИСПЫТАТЕЛЬНЫЙ СТЕНД','#c9a227','#191612',323);
      Kit.stencil(c,40,11.4,'МЕХАНИЗМ НА ИСПЫТАНИИ · НЕ ВХОДИТЬ',0.3,'rgba(216,204,178,.5)',0.5);
      PROP.toolboard(c,2.5,9.6,2.8,1.5,r);PROP.toolboard(c,57.5,9.8,2.6,1.4,r);
      /* рельс сварщика под сводом */
      Kit.pipe(c,[[24,12.6],[31,12.6]],0.08,'steel',{seed:324,rustN:0});
      for(let i=0;i<5;i++)Kit.oilStain(c,2+r()*62,14.95,1+r(),rng(330+i));
      Kit.crate(c,62.5,14.0,1.0,1.0,{seed:325});
    };
    R.extraTop=(c,L,r)=>{
      Kit.hazardTape(c,18,12.15,13.4,0.25);Kit.hazardTape(c,39,12.55,17,0.25);
      for(let x=40;x<55;x+=3.5)Kit.lampCage(c,x+1,13.1,0.24);
    };
  }})
});

/* ============================== ЗОНА I · ПОСЛЕ НАДСМОТРЩИКА ============================== */
Object.assign(ROOMDEFS,{
/* Тихая комната: диспетчерская крана. Пульт, перфокарты с программой — приказ (№2), окно
   на арену. Фонарь. Отсюда — трубный колодец вверх, к северному шлюзу. */
z1_quiet:gs=>({id:'z1_quiet',zone:'sump',sub:'workshop',name:'ДИСПЕТЧЕРСКАЯ КРАНА',w:28,h:14,quiet:true,
  art:RB.art('sump','workshop'),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});R.solids.push(S(0,11,28,3,'rust'),S(9.4,9.2,4.2,1.8,'steel'));
    R.doors=[RB.L(11,'z1_boss','АРЕНА НАДСМОТРЩИКА'),RB.R(R,11,'z1_pipes','ТРУБНЫЙ КОЛОДЕЦ')];
    RB.lamp(R,18,11);RB.lore(R,gs,2,11.5,9.2);
    RB.chalk(R,24.6,6.2,'38 ↑',{s:0.5});
    R.lights=[lit(6,3,8,'#ffd9a0',0.7),lit(11.5,7.6,4,'#9fe0ff',0.8),lit(18,4,8,'#ffbe63',0.8),lit(26.8,9.6,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:10},{type:'drip',x:22,y:1,rate:0.4}];
    R.extraGame=(c,L,r)=>{
      /* окно на арену: стекло в копоти, за ним — силуэт стрелы крана */
      c.fillStyle='#0b0d0f';rr(c,2.4,3.0,6.2,4.6,0.1);c.fill();
      c.save();rr(c,2.4,3.0,6.2,4.6,0.1);c.clip();
      const g=c.createLinearGradient(0,3,0,7.6);g.addColorStop(0,'#2a2018');g.addColorStop(1,'#120c08');c.fillStyle=g;c.fillRect(2.4,3,6.2,4.6);
      c.strokeStyle='#050404';c.lineWidth=0.25;c.beginPath();c.moveTo(2.2,7.2);c.lineTo(6.8,3.8);c.lineTo(8.8,4.6);c.stroke();
      c.fillStyle='rgba(255,180,90,.12)';c.fillRect(2.4,6.6,6.2,1);c.restore();
      for(let i=0;i<3;i++){c.fillStyle='#22262a';c.fillRect(2.4+i*2.1,3.0,0.12,4.6);}
      Kit.plate(c,2.0,2.6,7.0,0.4,'steel',401,{});Kit.plate(c,2.0,7.6,7.0,0.4,'steel',402,{});
      /* пульт с перфокартами */
      Kit.plate(c,9.4,6.0,4.2,3.2,'steel',403,{rust:0.4,bolts:true});
      for(let i=0;i<6;i++){c.fillStyle=['#69d68f','#ffcf7a','#c8452f'][i%3];c.beginPath();c.arc(9.9+i*0.6,6.5,0.09,0,TAU);c.fill();}
      Kit.gauge(c,10.4,7.6,0.32,0.1);Kit.gauge(c,11.5,7.6,0.32,0.1);Kit.gauge(c,12.6,7.6,0.32,0.1);
      for(let i=0;i<14;i++){c.fillStyle='#d8cdb6';c.save();c.translate(14.2+r()*3,10.9);c.rotate((r()-0.5)*0.6);c.fillRect(-0.18,-0.04,0.36,0.08);c.restore();}
      Kit.stencil(c,9.6,5.6,'ПРОГРАММА КРАНА · −41',0.28,'rgba(216,204,178,.6)',0.6);
      Kit.sign(c,19.6,6.2,3.4,0.8,'ДИСПЕТЧЕР · ТИШИНА','#c9a227','#191612',404);
      Kit.ladder(c,26.2,1.0,10.0,0.55);
    };
  }}),
/* Трубный колодец: 30 м вверх по рымам гарпуна. Старая лестница обрывается на полпути —
   там, где перестал лезть тот, кто оставил записку (№14). Наверху — правый берег шлюза. */
z1_pipes:gs=>({id:'z1_pipes',zone:'sump',sub:'drains',name:'ТРУБНЫЙ КОЛОДЕЦ',w:18,h:42,
  art:RB.art('sump','drains'),
  build(R){
    RB.shell(R,'rust',{ceil:0.4});
    R.solids.push(S(0,39,18,3,'rust'),S(0,10,7.2,1.0,'steel'),
      P(11,34.6,7),P(0,28.8,7),P(11,23.2,7),P(0,17.4,7),P(4.2,14.9,2.6),P(0.6,12.5,2.6));
    RB.ring(R,9,32,'top',1.0);RB.ring(R,8.5,26.5,'top',1.0);RB.ring(R,10,21,'top',1.0);RB.ring(R,8.5,15,'top',1.0);RB.ring(R,8.0,9.0,'top',1.0);
    R.doors=[RB.L(39,'z1_quiet','ДИСПЕТЧЕРСКАЯ'),RB.L(10,'z1_sluice','СЕВЕРНЫЙ ШЛЮЗ')];
    RB.lore(R,gs,14,14.6,23.2);
    R.enemies.push({type:'lampada',x:13,y:13,amb:true});
    R.lights=[lit(9,37,7,'#ffbe63',0.8),lit(14,31,5,'#69d68f',0.5),lit(4.5,26,5,'#ffbe63',0.6,{flicker:1.2}),
      lit(14,20,5,'#9fe6c0',0.55),lit(4,15,5,'#ffbe63',0.6),lit(3.5,8,6,'#8fd6ff',0.7)];
    R.emitters=[{type:'drip',x:6,y:1,rate:0.8},{type:'drip',x:13,y:12,rate:0.5},{type:'steam',x:16,y:38.6,rate:0.3},{type:'dust',rate:12}];
    R.extraGame=(c,L,r)=>{
      /* фоновые трубы-поперечины, к ним прикручены рымы */
      for(const y of [31,25.5,20,14,7.2])Kit.pipe(c,[[0,y],[18,y]],0.16,'steel',{seed:(y*7)|0});
      for(const x of [1.2,16.6])Kit.pipe(c,[[x,1],[x,39]],0.28,'rust',{seed:(x*11)|0,band:4,bandCol:'#69d68f'});
      /* лестница: скобы снизу до 41-й, выше — сорвана */
      for(let i=0;i<41;i++){const y=38.6-i*0.38;if(y<23.4)break;c.strokeStyle=i%7===0?'#5a4a3a':'#4a3e32';c.lineWidth=0.07;
        c.beginPath();c.moveTo(13.2,y);c.lineTo(14.2,y);c.stroke();}
      c.strokeStyle='#3a3128';c.lineWidth=0.09;c.beginPath();c.moveTo(13.2,38.8);c.lineTo(13.2,23.4);c.moveTo(14.2,38.8);c.lineTo(14.2,23.4);c.stroke();
      c.beginPath();c.moveTo(13.2,23.4);c.lineTo(12.7,22.0);c.moveTo(14.2,23.4);c.lineTo(14.6,22.4);c.stroke();
      Kit.stencil(c,14.4,24.4,'41',0.34,'rgba(236,234,222,.55)',0.55);
      PROP.bones(c,15.8,23.2,{face:-1,cloth:'#3a3a2e'});
      Kit.stencil(c,1.6,9.6,'ШЛЮЗ →',0.36,'rgba(150,230,180,.5)',0.5);
      Kit.vent(c,6,36,1.6,1.0);Kit.vent(c,12,5,1.4,0.9);
    };
  }}),
/* ============================== КОТЕЛЬНЫЕ (необязательная петля) ============================== */
/* Котельная: два котла с паровыми продувками между ними (ритм), ключник на котле.
   Под сводом справа — ниша кочегаров с тёплым светом: видно сразу, достать — только выхлопом. */
z1_boiler:gs=>({id:'z1_boiler',zone:'sump',sub:'boiler',name:'КОТЕЛЬНАЯ',w:52,h:22,
  art:RB.art('sump','boiler'),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});
    R.solids.push(S(0,19,52,3,'rust'),S(5.2,17.4,1.4,1.6,'ply'),S(7,15.6,9,3.4,'steel'),S(16,17.6,1.1,1.4,'ply'),S(19,14.4,10,4.6,'steel'),
      P(31,12.4,6),P(38,10.6,6),S(44.6,6,7.4,0.8,'steel'),S(40.2,16.6,1.6,2.4,'ply'),
      /* над котлом 3 — мостки к испытательному стенду обходчиков */
      P(3.4,13.4,2.4),P(0,11.2,3.2));
    R.hazards=[{x:17.3,y:12,w:1.6,h:7,kind:'steam',per:2.8,on:0.9,off:0},{x:33,y:13,w:2,h:6,kind:'steam',per:2.4,on:0.8,off:1.2}];
    R.doors=[RB.L(19,'z1_hub','НАСОСНАЯ СТАНЦИЯ'),RB.R(R,19,'z1_foundry','ЛИТЕЙНЫЙ ЦЕХ'),RB.R(R,6,'z1_cache','НИША КОЧЕГАРОВ'),
      RB.L(11.2,'z1_trial','СТЕНД ОБХОДЧИКОВ')];
    R.enemies.push({type:'wrench',x:22,y:14.4-1.55,patrol:[20,27.5],amb:true},{type:'riveter',x:42,y:19-1.55,patrol:[36,49],amb:true},
      {type:'lampada',x:40,y:5,amb:true});
    R.lights=[lit(4,4,8,'#ffbe63',0.8),lit(11.5,12,7,'#ff7a4a',0.7,{flicker:0.6}),lit(24,10,8,'#ff7a4a',0.7,{flicker:0.8}),
      lit(17.4,18,4,'#e8e0d0',0.4),lit(34,18,4,'#e8e0d0',0.4),lit(41,6,7,'#ffbe63',0.7),
      lit(48.4,4.4,4.5,'#ffcf7a',1.0,{flicker:1.4}),lit(1.2,17,3,'#8fd6ff',0.5),lit(50.8,17,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'steam',x:11.5,y:15.4,rate:0.3},{type:'steam',x:24,y:14.2,rate:0.3},{type:'smoke',x:28,y:3,rate:0.3},{type:'dust',rate:14}];
    R.extraGame=(c,L,r)=>{
      Kit.tank(c,7,6.4,9,9.2,{seed:501,label:'КОТЁЛ 3'});Kit.tank(c,19,4.6,10,9.8,{seed:502,label:'КОТЁЛ 4'});
      Kit.pipe(c,[[11.5,6.4],[11.5,1.2]],0.4,'steel',{seed:503});Kit.pipe(c,[[24,4.6],[24,1.2]],0.45,'steel',{seed:504});
      for(const x of [17.5,34])Kit.pipe(c,[[x-1,19],[x-1,11],[x+1,11],[x+1,19]],0.14,'rust',{seed:(x*3)|0});
      Kit.sign(c,15.2,10.0,4.6,0.8,'ПРОДУВКА · ЖДИ ПАУЗУ','#c8452f','#f0e2cf',505);
      Kit.plate(c,31,12.8,6,0.4,'steel',506,{rust:0.6});Kit.plate(c,38,11.0,6,0.4,'steel',507,{rust:0.6});
      /* ниша кочегаров: лавка, кружки, гамак — тёплый свет из-под свода */
      c.fillStyle='rgba(30,18,10,.85)';c.fillRect(44.6,1.0,7.4,5.0);
      Kit.lampCage(c,48.4,2.0,0.3);c.strokeStyle='#6a5a40';c.lineWidth=0.06;c.beginPath();c.moveTo(45,2.2);c.quadraticCurveTo(47.5,4.2,51,2.4);c.stroke();
      Kit.crate(c,49.2,5.0,1.0,1.0,{seed:508});Kit.barrel(c,46.2,5.05,0.38,0.9,'#5c4433');
      Kit.stencil(c,44.8,7.6,'КОЧЕГАРЫ',0.3,'rgba(255,207,122,.4)',0.4);
      for(let i=0;i<6;i++)Kit.oilStain(c,1+r()*50,18.95,1+r(),rng(510+i));
    };
  }}),
/* Литейный цех: верхние мостки (к котельной) и нижний пол с канавами расплава (к каналу).
   Самоубийцы с раскалёнными зарядами — первый враг, который сам идёт на сближение. */
z1_foundry:gs=>({id:'z1_foundry',zone:'sump',sub:'foundry',name:'ЛИТЕЙНЫЙ ЦЕХ',w:64,h:30,
  art:RB.art('sump','foundry'),
  build(R){
    RB.shell(R,'rust',{ceil:0.4});
    R.solids.push(
      /* верхние мостки с разрывами: прыжок, затем рывок */
      P(0,12,20),P(26,12,18),P(50,12,14),
      /* лестница уступов справа: снизу наверх */
      P(55,24.4,6),P(50,21.8,5),P(56,19.2,6),P(50.6,16.6,5),P(56.4,14.2,5.6));
    const molt=(x,w)=>({x:x,y:27.2,w:w,h:2.8,kind:'pit',look:'molten',back:{x:x-1.4,y:25.3},backs:[{minX:-99,x:x-1.4,y:25.3},{minX:x+w/2,x:x+w+0.6,y:25.3}]});
    R.hazards=[molt(14,4),molt(30,4),molt(42,4)];
    /* пол — плиты с разрывами: под ними канавы расплава */
    R.solids.push(S(0,27,14,3,'rust'),S(18,27,12,3,'rust'),S(34,27,8,3,'rust'),S(46,27,18,3,'rust'),
      S(14,29.2,4,1,'rust'),S(30,29.2,4,1,'rust'),S(42,29.2,4,1,'rust'));
    R.doors=[RB.L(12,'z1_boiler','КОТЕЛЬНАЯ'),RB.L(27,'z1_canal','ОТСТОЙНЫЙ КАНАЛ')];
    RB.lamp(R,6,27);RB.lore(R,gs,29,35,12);
    R.enemies.push({type:'bomber',x:23,y:27-1.55,patrol:[19,28.5],amb:true},
      {type:'bomber',x:58,y:12-1.55,patrol:[52,62],amb:true},{type:'lampada',x:46,y:18,amb:true});
    RB.elite(R,gs,{type:'repairer',variant:'welder',x:36,y:12-1.55,patrol:[28,42],eliteName:'БРИГАДИР ЛИТЕЙКИ',
      mini:{k:'ЗОНА I · ЛИТЕЙНЫЙ ЦЕХ',e:'СТАРШИЙ СВАРЩИК ЦЕХА',l:'«ПЛАН ПО ЛИТЬЮ ВЫПОЛНЕН НА ДВЕСТИ ЛЕТ ВПЕРЁД.»',addons:['rivet','brand'],prop:'gun'},eliteFlag:'elite_foundry',
      reward:{upgrade:'mark_long',x:38,y:12,flag:'got_mark_long',title:'ЖИРНЫЙ МЕЛ',
        lines:['В НАГРУДНОМ КАРМАНЕ БРИГАДИРА — БРУСОК ЖИРНОГО МЕЛА. ИМ РАЗМЕЧАЛИ БРАК.','ТЕПЕРЬ БРАК РАЗМЕЧАЕТ КУРЬЕР: СЛЕД РЫВКА НА ДЕТАЛИ ДЕРЖИТСЯ ДОЛЬШЕ.']}});
    R.lights=[lit(16,26,7,'#ff8a3a',1.1),lit(32,26,7,'#ff8a3a',1.1),lit(44,26,7,'#ff8a3a',1.1),
      lit(8,6,9,'#ffbe63',0.7),lit(30,6,9,'#ffbe63',0.7),lit(56,6,9,'#ffbe63',0.7),lit(6,24.6,5,'#ffcf7a',0.6),
      lit(23,18,8,'#ff7a3a',0.5,{flicker:0.7}),lit(1.2,25.6,3,'#8fd6ff',0.5),lit(1.2,10.6,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'smoke',x:16,y:26,rate:0.6},{type:'smoke',x:32,y:26,rate:0.6},{type:'smoke',x:44,y:26,rate:0.6},
      {type:'spark',x:22,y:4,rate:0.4},{type:'dust',rate:12}];
    R.extraGame=(c,L,r)=>{
      for(const [x,w] of [[0,20],[26,18],[50,14]]){Kit.plate(c,x,12.3,w,0.35,'iron',(x*3)|0,{rust:0.8});Kit.railing(c,x,12.0,w,0.9,'#3a2a20');}
      /* ковши над канавами: раскалённый край */
      for(const x of [16,32,44]){Kit.chain(c,x,1,8,0.14);c.save();c.translate(x,9.2);
        c.fillStyle='#1d140f';c.beginPath();c.moveTo(-1.2,0);c.lineTo(1.2,0);c.lineTo(0.8,1.5);c.lineTo(-0.8,1.5);c.closePath();c.fill();
        c.fillStyle='#ff9c3a';c.fillRect(-1.1,0.02,2.2,0.14);c.restore();}
      Kit.sign(c,2,8.2,3.6,0.8,'ЛИТЬЁ · КАСКИ','#c8452f','#f0e2cf',601);
      Kit.sign(c,24,22.6,4.4,0.8,'РАСПЛАВ · НЕ ВХОДИТЬ','#c8452f','#f0e2cf',602);
      for(let i=0;i<5;i++)Kit.plate(c,48+i*0.8,26.0,0.7,1.0,'iron',610+i,{rust:0.9});
      PROP.corpse(c,10.4,27,{face:1,col:'#3a2a20',helmet:'#7a6a50'});
    };
  }}),
/* Отстойный канал: тёмные своды, хладагент в лотках. В задней стене — свинцовая заглушка,
   из трещины тянет тёплым светом, мелом рядом: «НЕБО». Пробить — позже, пробойником. */
z1_canal:gs=>({id:'z1_canal',zone:'sump',sub:'drains',name:'ОТСТОЙНЫЙ КАНАЛ',w:56,h:20,
  art:RB.art('sump','drains'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    R.solids.push(S(0,10,8,10,'concrete'),S(8,12.4,4,7.6,'concrete'),S(12,15,8,5,'concrete'),
      S(25,15,9,5,'concrete'),S(38,15,18,5,'concrete'),S(20,18.6,5,1.4,'concrete'),S(34,18.6,4,1.4,'concrete'),P(26,11.2,6));
    const cool=(x,w)=>({x:x,y:16.2,w:w,h:2.4,kind:'pit',look:'coolant',back:{x:x-1.4,y:13.3},backs:[{minX:-99,x:x-1.4,y:13.3},{minX:x+w/2,x:x+w+0.6,y:13.3}]});
    R.hazards=[cool(20,5),cool(34,4)];
    R.doors=[RB.L(10,'z1_drain','ДРЕНАЖ'),RB.R(R,15,'z1_foundry','ЛИТЕЙНЫЙ ЦЕХ'),
      {x:47,y:12.9,w:1.4,h:2.1,to:'z1_shrine',label:'?',reqFlag:'lead_canal',reqMsg:'СВИНЦОВАЯ ЗАГЛУШКА'}];
    if(!gs.flags.lead_canal)R.pushables.push({kind:'lead',x:46.7,y:12.7,w:2.0,h:2.3,id:'canal_lead',flag:'lead_canal'});
    RB.chalk(R,50.4,11.2,'НЕБО',{s:0.48,rot:-0.12});
    R.enemies.push({type:'mokrica',x:15,y:15-0.62,patrol:[12.5,19.5],amb:true},{type:'mokrica',variant:'shell',x:44,y:15-0.95,patrol:[39,54],amb:true},
      {type:'herald',x:30,y:6,amb:true});
    R.lights=[lit(4,4,7,'#ffbe63',0.7,{flicker:1.2}),lit(22.5,17,7,'#69d68f',1.0),lit(36,17,6,'#69d68f',1.0),
      lit(29,8,6,'#ffbe63',0.6),lit(47.6,13.6,3.4,'#ffd9a0',0.8,{flicker:2.2}),lit(54.8,13.6,3,'#8fd6ff',0.5),lit(1.2,8.6,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'coolant',x:22.5,y:16.2,rate:3,sw:5},{type:'coolant',x:36,y:16.2,rate:3,sw:4},{type:'drip',x:10,y:1,rate:0.8},
      {type:'drip',x:28,y:1,rate:0.6},{type:'drip',x:44,y:1,rate:0.7},{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{
      Kit.pipe(c,[[0,2.2],[56,2.2]],0.3,'rust',{seed:701,band:3,bandCol:'#69d68f'});
      Kit.plate(c,26,11.5,6,0.4,'steel',702,{rust:0.6});
      Kit.stencil(c,13,13.4,'ЛОТОК 6',0.4,'rgba(150,230,180,.5)',0.5);
      /* свечи у заглушки: кто-то ходил сюда молиться */
      for(let i=0;i<5;i++){const x=45.6+i*0.24+(i>2?2.4:0);c.fillStyle='#e8e0c8';c.fillRect(x,14.6,0.08,0.4);
        c.fillStyle='rgba(255,207,122,.9)';c.beginPath();c.arc(x+0.04,14.54,0.05,0,TAU);c.fill();}
      Kit.ladder(c,9.0,10.0,2.4,0.5);
    };
  }}),
/* ---------- тайники ---------- */
/* Часовня насосников: свод расписан небом. Голубое, с облаками — то, чего нельзя рисовать.
   Свечные огарки, жестяные лампадки, на полу — инструменты, как подношения. */
z1_shrine:gs=>({id:'z1_shrine',zone:'sump',sub:'drains',name:'ЧАСОВНЯ НАСОСНИКОВ',w:20,h:12,secret:true,look:{ambRGB:[120,130,150]},
  art:RB.art('sump','drains',{fgd:false}),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});R.solids.push(S(0,10,20,2,'concrete'),S(14,9,3,1,'concrete'));
    R.doors=[RB.L(10,'z1_canal','ОТСТОЙНЫЙ КАНАЛ')];
    RB.salvage(R,gs,{upgrade:'plate_shrine',x:15.5,y:9,flag:'got_plate_shrine',title:'ПЛАСТИНА КУРТКИ',
      lines:['НА АЛТАРЕ — НАГРУДНАЯ ПЛАСТИНА, ОТПОЛИРОВАННАЯ РУКАМИ ДО БЛЕСКА.','НАСОСНИКИ ПРИНОСИЛИ СЮДА ЛУЧШЕЕ, ЧТО У НИХ БЫЛО. ВЕРНЁШЬ, КОГДА ДОЙДЁШЬ.']});
    RB.chalk(R,6.4,7.6,'НАД ПЕЧАТЬЮ — НЕБО',{s:0.4});
    R.lights=[lit(10,2,12,'#bfe0ff',0.9),lit(15.5,8,4,'#ffcf7a',0.9,{flicker:2.5}),lit(4,8,4,'#ffcf7a',0.7,{flicker:2.1})];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{
      /* небо на своде: голубое с облаками, по краям — копоть свечей */
      const g=c.createLinearGradient(0,0.4,0,6);g.addColorStop(0,'#6f9cc4');g.addColorStop(0.7,'#a8c6dc');g.addColorStop(1,'rgba(168,198,220,0)');
      c.fillStyle=g;c.fillRect(1,0.4,18,6);
      for(let i=0;i<9;i++){const x=2+r()*16,y=1+r()*3,s=0.8+r()*1.4;c.fillStyle='rgba(255,255,255,.55)';
        for(let k=0;k<4;k++){c.beginPath();c.ellipse(x+k*s*0.4,y+(r()-0.5)*0.3,s*0.5,s*0.25,0,0,TAU);c.fill();}}
      c.fillStyle='#f6e7a8';c.beginPath();c.arc(14,1.8,0.7,0,TAU);c.fill();
      for(let i=0;i<20;i++){c.fillStyle='rgba(20,14,10,'+(r()*0.4)+')';c.beginPath();c.ellipse(1+r()*18,5+r()*1.5,0.6+r(),0.4,0,0,TAU);c.fill();}
      Kit.plate(c,14,8.6,3,0.5,'brass',801,{});
      for(let i=0;i<12;i++){const x=12+r()*7,y=9.6;c.fillStyle='#e8e0c8';c.fillRect(x,y-0.3-r()*0.2,0.07,0.3);}
      for(let i=0;i<5;i++)Kit.oilStain(c,r()*20,9.95,0.8,rng(810+i));
    };
  }}),
/* Ниша кочегаров: их угол отдыха под самым сводом котельной. Гамак, карты, облегчённый клапан. */
z1_cache:gs=>({id:'z1_cache',zone:'sump',sub:'boiler',name:'НИША КОЧЕГАРОВ',w:16,h:10,secret:true,
  art:RB.art('sump','boiler',{fgd:false}),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});R.solids.push(S(0,8,16,2,'rust'));
    R.doors=[RB.L(8,'z1_boiler','КОТЕЛЬНАЯ')];
    RB.salvage(R,gs,{upgrade:'dash_cd',x:11,y:8,flag:'got_dash_cd',title:'ОБЛЕГЧЁННЫЙ КЛАПАН',
      lines:['В ЯЩИКЕ ПОД ГАМАКОМ — КЛАПАН, ВЫТОЧЕННЫЙ ВРУЧНУЮ. ЛЁГКИЙ, КАК ЖЕСТЬ.','КОЧЕГАРЫ ДЕЛАЛИ СЕБЕ ВЕЩИ ЛУЧШЕ, ЧЕМ ВЫДАВАЛ ЯРУС.']});
    R.lights=[lit(8,2,8,'#ffcf7a',1.0,{flicker:1.6}),lit(1.2,6.6,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:6},{type:'smoke',x:13,y:2,rate:0.2}];
    R.extraGame=(c,L,r)=>{
      Kit.lampCage(c,8,2,0.32);
      c.strokeStyle='#6a5a40';c.lineWidth=0.07;c.beginPath();c.moveTo(3,2.6);c.quadraticCurveTo(6.5,5.2,10,2.8);c.stroke();
      Kit.crate(c,10.4,7.0,1.4,1.0,{seed:901});Kit.barrel(c,13.6,7.05,0.4,0.95,'#5c4433');
      for(let i=0;i<6;i++){c.fillStyle=['#d8cdb6','#c8452f'][i%2];c.save();c.translate(4.5+i*0.3,7.9);c.rotate((r()-0.5)*0.8);c.fillRect(-0.15,-0.04,0.3,0.08);c.restore();}
      Kit.stencil(c,2,5,'ПРЕДЕЛ — ЭТО ПРИВЫЧКА',0.3,'rgba(255,207,122,.45)',0.45);
    };
  }})
});
