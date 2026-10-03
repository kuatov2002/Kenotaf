"use strict";
/* ============================== ROOMS · Z1 ============================== */
Object.assign(ROOMDEFS,{
z1_start:gs=>({id:'z1_start',zone:'sump',sub:'pumps',name:'СТАРТОВАЯ НИША',w:44,h:14,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump,fgd:Art.fgdSump},
  build(R){
    /* Урок 1 — тело курьера: каждое препятствие требует ровно одного навыка.
       ящик (прыжок) → компрессор 2.2 (прыжок с удержанием) → обвал с зазором 1.2 (подкат) →
       канава (прыжок через яму) → висячая опора (присед под ней) → дверь (E). Врагов нет. */
    R.solids=[S(-2,-2,46,3.4,'steel'),S(-2,0,2,14,'steel'),S(42,0,2,14,'steel'),
      S(0,11,25,3,'rust'),S(27.4,11,16.6,3,'rust'),S(25,12.4,2.4,1.6,'concrete'),
      S(9.0,9.6,1.6,1.4,'ply'),S(13.4,8.8,2.2,2.2,'steel'),S(19.0,1.4,5.6,8.4,'concrete'),
      /* опора крана висит до 9.6: под ней — только пригнувшись */
      S(29.9,1.4,1.0,8.2,'steel')];
    R.doors=[{x:40.8,y:8.9,w:1.4,h:2.1,to:'z1_gallery',label:'ГАЛЕРЕЯ ЧИСТИЛЬЩИКОВ'}];
    R.signs=[{x:5.6,y:6.6,keys:['A','D'],text:'ИДТИ'},
      {x:9.8,y:5.6,keys:['SPACE'],text:'ПРЫЖОК'},
      {x:14.5,y:4.4,keys:['SPACE'],text:'ДЕРЖАТЬ — ВЫШЕ'},
      {x:16.9,y:7.0,keys:['S'],text:'НА БЕГУ — ПОДКАТ'},
      {x:33.6,y:6.4,keys:['S'],text:'ПРИСЕСТЬ'}];
    R.lights=[lit(4.4,3.0,9,'#ffbe63',1.2,{flicker:1.6}),lit(12,3.4,8.5,'#ffbe63',0.95),
      lit(21.8,10.4,4.2,'#ff9c4a',0.85,{flicker:0.7}),lit(27,3.2,8.5,'#ffbe63',0.9),
      lit(26.2,12.6,3,'#69d68f',0.5),lit(35,3.2,8.5,'#ffbe63',0.85),
      lit(40.6,8.0,5,'#8fd6ff',0.6),lit(21,12.4,6,'#69d68f',0.3)];
    R.emitters=[{type:'drip',x:8.4,y:3.4,rate:0.55},{type:'drip',x:28.2,y:3.2,rate:0.8},{type:'drip',x:26.0,y:3.4,rate:0.6},
      {type:'steam',x:16.6,y:9.4,rate:0.45,s:0.8},{type:'dust',rate:14},{type:'smoke',x:21.8,y:10.6,rate:0.25}];
    R.checkpoint={x:3.2,y:11,h:1.7,lit:gs.cp.room==='z1_start'};
    R.extraGame=(c,L,r)=>{
      Kit.pipe(c,[[2,3.4],[16,3.4],[16,4.6],[30,4.6],[42,4.6]],0.22,'steel',{seed:1,band:2,bandCol:'#7a8a5a'});
      Kit.pipe(c,[[2,2.2],[42,2.2]],0.16,'rust',{seed:2});
      Kit.lampCage(c,4.4,3.0,0.34);Kit.lampCage(c,12,3.4,0.3);Kit.lampCage(c,27,3.2,0.32);Kit.lampCage(c,35,3.2,0.32);
      for(let i=0;i<8;i++){const x=2.4+i*4.6;if(x>18.4&&x<25)continue;
        c.save();c.globalAlpha=0.24+((i*37)%5)*0.03;c.fillStyle='#c9b48a';
        c.beginPath();c.moveTo(x,10.86);c.lineTo(x+0.55,10.66);c.lineTo(x+0.55,10.78);c.lineTo(x+1.1,10.78);
        c.lineTo(x+1.1,10.94);c.lineTo(x+0.55,10.94);c.lineTo(x+0.55,11.06);c.closePath();c.fill();c.restore();}
      Kit.stencil(c,32.6,8.2,'ЭВАКУАЦИЯ →',0.5,'rgba(216,204,178,.5)',0.5);
      Kit.barrel(c,36.2,10.05,0.42,0.95,'#5c4433');Kit.barrel(c,37.1,10.05,0.42,0.95,'#4a3a2c');
      Kit.oilStain(c,12,10.95,1.6,rng(5));Kit.puddle(c,26.2,12.36,2.0);
      Kit.ladder(c,39.4,4.6,6.4,0.55);Kit.vent(c,33,2.2,1.6,1.0);Kit.chain(c,26.4,3.4,3.2,0.11);
      /* канава: залитый водой разрыв в плитах */
      Kit.hazardTape(c,24.6,10.8,0.4,0.3);Kit.hazardTape(c,27.4,10.8,0.4,0.3);
      Kit.stencil(c,24.9,9.7,'РАЗРЫВ ПЛИТ',0.28,'rgba(216,204,178,.45)',0.45);
    };
    R.extraTop=(c,L,r)=>{
      Kit.crate(c,9.0,9.6,1.6,1.4,{seed:2});
      Kit.plate(c,13.4,8.8,2.2,2.2,'steel',613,{rust:0.6,boltStep:0.7});
      Kit.hazardTape(c,13.4,8.8,2.2,0.2);Kit.gauge(c,14.0,9.7,0.3,0.55);Kit.vent(c,14.6,9.5,0.8,0.9);
      Kit.stencil(c,13.6,10.75,'К-2',0.3,'rgba(30,26,20,.75)',0.75);
      /* обвал: перекрытие осело, снизу щель под рост сидящего курьера */
      Kit.rubble(c,19.0,5.6,5.6,3.6,rng('st_rb'),'concrete');
      c.save();c.translate(21.8,8.9);c.rotate(-0.08);Kit.craneGirder(c,-3.4,-0.5,6.8,0.9);c.restore();
      Kit.hazardTape(c,19.0,9.48,5.6,0.32);
      Kit.sign(c,20.2,4.2,3.2,0.8,'ОБВАЛ','#c8452f','#f0e2cf',3);
      for(let i=0;i<3;i++){c.fillStyle='rgba(255,170,90,.5)';const x=20.4+i*1.6;
        c.beginPath();c.moveTo(x,10.1);c.lineTo(x+0.5,10.1);c.lineTo(x+0.25,10.45);c.closePath();c.fill();}
      /* опора: клёпаная балка, низ в жёлтой ленте — пригнись */
      Kit.plate(c,29.9,1.4,1.0,8.2,'steel',611,{rust:0.8,boltStep:0.9});
      Kit.hazardTape(c,29.9,9.25,1.0,0.35);
    };
    R.extraMid=(c,L,r)=>{Kit.tank(c,6,L.h*0.35,3.4,L.h*0.5,{seed:2,label:'Р-12'});
      Kit.tank(c,30,L.h*0.3,2.8,L.h*0.55,{seed:5,label:'Р-13'});};
  }}),
z1_hub:gs=>({id:'z1_hub',zone:'sump',name:'НАСОСНАЯ СТАНЦИЯ',w:36,h:40,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump,fgd:Art.fgdSump},
  build(R){
    R.solids=[S(-2,-3,40,5,'steel'),S(-2,0,2,40,'steel'),S(36,0,2,40,'steel'),
      S(0,34,10,6,'steel'),S(26,34,10,6,'steel'),P(10,34,5,0.42),P(20,34,6,0.42),
      P(24,31,12,0.4),P(28,33,2.4,0.3),P(30.6,32,2.4,0.3),
      P(2,32.4,4,0.36),P(7,31.0,4,0.36),P(2,29.4,4,0.36),P(7,27.8,4,0.36),P(2,26.2,4,0.36),P(0,25,12,0.4),
      P(11,22.8,7,0.36),P(19,20.8,6,0.36),P(26,18.8,10,0.4),P(29.6,25,6.4,0.4)];
    /* под сводом — сплошная балка с латунными клёпками (видна с пола с самого начала).
       Выход из вентшахты наверху слева, награда — ниша справа */
    R.magnetRects=[{x:3,y:3.7,w:31,h:0.6}];
    R.solids.push(S(0,7.1,3,0.5,'steel'),S(33.5,7.4,2.5,0.5,'steel'));
    R.hazards=[{x:10,y:37.4,w:16,h:2.6,kind:'coolant'}];
    R.doors=[
      {x:0.0,y:31.9,w:1.2,h:2.1,to:'z1_charge',label:'ЗАРЯДНАЯ СТАНЦИЯ'},
      {x:34.8,y:28.9,w:1.2,h:2.1,to:'z1_east',tx:1.8,ty:9.6,label:'ВОСТОЧНЫЙ КОРИДОР'},
      {x:34.8,y:16.7,w:1.2,h:2.1,to:'z1_sluice',tx:1.8,ty:7.6,label:'СЕВЕРНЫЙ ШЛЮЗ'},
      {x:34.8,y:22.9,w:1.2,h:2.1,to:'z1_boiler',label:'КОТЕЛЬНАЯ'},
      {x:4.2,y:33.6,w:1.6,h:0.9,down:true,to:'z1_cellar',tx:1.8,ty:4.8,label:'ПОДВАЛ'},
      /* в шахту можно войти всегда: рифлёные стены внутри сами говорят, что нужны кошки */
      {x:0.0,y:22.8,w:1.1,h:2.2,to:'z1_vent',link:'vent_low',label:'ВЕНТШАХТА'},
      {x:0.0,y:5.0,w:1.2,h:2.1,to:'z1_vent',link:'vent_top',label:'ВЕНТШАХТА · ВЕРХ'}];
    R.interactables=gs.flags.got_energy?[]:[{kind:'salvage',upgrade:'energy_cap',x:34.9,y:7.4,flag:'got_energy',
      title:'РЕСИВЕР ДАВЛЕНИЯ',
      lines:['В НИШЕ ПОД СВОДОМ — ЗАПАСНОЙ РЕСИВЕР КРАНОВЩИКОВ.','ЛАТУННЫЙ БАЛЛОН ВСТАЁТ В РАНЕЦ РЯДОМ С КЛАПАНОМ.']}];
    R.enemies.push({type:'mokrica',x:5,y:24.38,patrol:[1.5,10],amb:true});
    R.lights=[lit(6,30.4,9,'#ffbe63',1.0),lit(30,30.2,9,'#ffbe63',1.05),
      lit(6,24.4,8,'#ffbe63',0.85,{flicker:1.2}),lit(30,24.6,8,'#ffa64a',0.8),
      lit(6,18.4,8,'#ffbe63',0.8),lit(30,17.6,9,'#ffbe63',0.9),
      lit(18,38.2,17,'#69d68f',1.15),lit(11,38,10,'#69d68f',0.7),lit(25,38,10,'#69d68f',0.7),
      lit(18,3.2,11,'#c8452f',0.4,{flicker:0.5}),lit(34,29.8,4,'#8fd6ff',0.5),
      lit(34,17.6,4,'#8fd6ff',0.5),lit(2,23.6,4,'#9fe6c0',0.5,{flicker:2.2})];
    R.emitters=[{type:'steam',x:8.5,y:31.6,rate:0.34,s:1.3},{type:'steam',x:27.5,y:31.4,rate:0.4,s:1.2},
      {type:'steam',x:14,y:6.5,rate:0.6,s:1.0},{type:'steam',x:24,y:8.5,rate:0.5,s:0.9},
      {type:'drip',x:11,y:25.4,rate:0.4},{type:'drip',x:22,y:21.2,rate:0.6},
      {type:'drip',x:31,y:31.4,rate:0.35},{type:'dust',rate:26},{type:'coolant',x:18,y:37.4,rate:6}];
    R.checkpoint={x:5,y:34,h:1.7,lit:gs.cp.room==='z1_hub'};
    R.mapPlate={kind:'mapplate',x:7.0,y:34,flag:'map_sump',title:'СХЕМА ЯРУСА −41'};
    R.station={kind:'station',station:'hub',x:9.4,y:34,tubeTop:8.2};
    R.machines=[{kind:'flywheel',x:7.6,y:26,r:2.2,spd:0.7},{kind:'flywheel',x:29.5,y:22,r:1.7,spd:-1.05},
      {kind:'flywheel',x:5.4,y:12,r:1.3,spd:1.5},{kind:'crane',y:8.6,x0:4,x1:30,spd:0.55},
      {kind:'chain',x:12.5,y:4.2,len:5.4,ph:0},{kind:'chain',x:23.5,y:4.2,len:3.6,ph:2},
      {kind:'needle',x:31.6,y:29.2,r:0.42}];
    R.extraGame=(c,L,r)=>{
      Kit.pumpUnit(c,7.6,34,2.5,{seed:3,tag:'Н-01',press:0.74});
      Kit.pumpUnit(c,29.5,34,2.2,{seed:8,tag:'Н-02',press:0.61});
      Kit.pumpUnit(c,5.4,19,1.5,{seed:11,tag:'Н-07',press:0.4});
      Kit.pumpUnit(c,31,15,1.3,{seed:14,tag:'Н-08',press:0.2});
      const cg=c.createLinearGradient(0,35,0,40);
      cg.addColorStop(0,'#123524');cg.addColorStop(.35,'#1d6b45');cg.addColorStop(1,'#0d3a24');
      c.fillStyle=cg;c.fillRect(10,35,16,5);
      c.fillStyle='rgba(140,255,190,.25)';c.fillRect(10,35,16,0.12);
      Kit.hazardTape(c,10,33.9,5,0.2);Kit.hazardTape(c,20,33.9,6,0.2);
      Kit.sign(c,13.2,32.4,3.4,0.8,'ХЛАДАГЕНТ · НЕ ВХОДИТЬ','#69d68f','#0d1a12',4);
      for(let x=0;x<36;x+=10){Kit.craneGirder(c,x+0.4,2.2,9.4,1.5);Kit.magnetRivets(c,x+0.4,3.7,9.4);}
      Kit.craneGirder(c,0,7.6,36,1.2);
      Kit.ladder(c,25.4,31.4,2.6,0.55);Kit.ladder(c,11.4,25.4,2.4,0.5);
      Kit.plate(c,24.4,31.4,11.2,0.5,'steel',21,{rust:0.6});
      Kit.plate(c,0.2,25.4,11.6,0.5,'steel',22,{rust:0.6});
      Kit.plate(c,26.2,19.2,9.4,0.5,'steel',23,{rust:0.6});
      Kit.plate(c,27,29.6,2.2,1.5,'steel',31,{rust:0.7});
      Kit.gauge(c,27.6,30.3,0.3,0.7);Kit.gauge(c,28.5,30.3,0.24,0.4);
      c.fillStyle='#0d0f10';c.fillRect(0,22.6,1.2,2.4);
      c.strokeStyle='#4d545a';c.lineWidth=0.09;
      for(let i=0;i<5;i++){c.beginPath();c.moveTo(0.1,22.8+i*0.5);c.lineTo(1.1,22.75+i*0.5);c.stroke();}
      c.strokeStyle='#6a7178';c.lineWidth=0.1;c.beginPath();c.moveTo(0.2,22.9);c.quadraticCurveTo(0.6,23.6,0.25,24.4);c.stroke();
      c.save();c.beginPath();c.rect(-1.4,17,1.4,9);c.clip();
      c.strokeStyle='#2b3136';c.lineWidth=0.5;
      for(let y=17;y<26;y+=0.6){c.beginPath();c.ellipse(-0.7,y,0.55,0.2,0,0,TAU);c.stroke();}
      c.fillStyle='rgba(159,230,192,.14)';c.fillRect(-1.4,17,1.4,9);c.restore();
      Kit.stencil(c,1.6,24.4,'ВЕНТ · B-2',0.4,'rgba(200,190,170,.42)',0.42);
      Kit.plate(c,33.6,16.2,2.4,3.0,'steel',41,{rust:0.8});
      Kit.hazardTape(c,33.8,16.4,2.0,0.22);
      Kit.stencil(c,29.2,18.0,'СЕВЕРНЫЙ ШЛЮЗ',0.42,'rgba(216,204,178,.45)',0.45);
      Kit.stencil(c,29.0,30.2,'ВОСТОЧНЫЙ КОРИДОР',0.42,'rgba(216,204,178,.45)',0.45);
      Kit.pipe(c,[[34,4],[34,16]],0.3,'rust',{seed:31});
      Kit.pipe(c,[[2.2,4],[2.2,22]],0.26,'steel',{seed:32});
      Kit.pipe(c,[[16,4.3],[16,7.6]],0.2,'steel',{seed:33});
      for(let i=0;i<6;i++)Kit.chain(c,2+i*6,4.2,1+r()*3,0.1);
      for(let i=0;i<5;i++){c.save();c.globalAlpha=0.2;c.fillStyle='#c9b48a';
        const x=6+i*2.4;c.beginPath();c.moveTo(x,33.9);c.lineTo(x+0.5,33.72);c.lineTo(x+0.5,33.82);
        c.lineTo(x+1,33.82);c.lineTo(x+1,33.98);c.lineTo(x+0.5,33.98);c.lineTo(x+0.5,34.08);c.closePath();c.fill();c.restore();}
      Kit.oilStain(c,4,33.95,2.2,rng(77));Kit.oilStain(c,30,33.95,1.8,rng(78));
      Kit.puddle(c,14.5,33.96,1.4);
      Kit.crate(c,8.2,33.0,1.0,1.0,{seed:4});Kit.crate(c,9.3,33.2,0.8,0.8,{seed:5});
      Kit.barrel(c,33,33.05,0.42,0.95,'#5c4433');
      Kit.stencil(c,4.6,33.2,'ПОДВАЛ ↓',0.34,'rgba(216,204,178,.45)',0.45);
      c.fillStyle='#0a0c0c';c.fillRect(4.2,34,1.6,0.5);
    };
    R.extraMid=(c,L,r)=>{
      c.fillStyle='rgba(8,10,10,.85)';c.fillRect(L.w*0.3,L.h*0.55,L.w*0.4,L.h*0.5);
      for(let k=0;k<7;k++){const y=L.h*(0.58+k*0.06);
        c.fillStyle='rgba(40,44,48,.9)';c.fillRect(L.w*0.3,y,L.w*0.4,0.3);
        for(let x=L.w*0.32;x<L.w*0.68;x+=1.4){c.fillStyle='#22262a';c.fillRect(x,y-0.7,0.07,0.7);}}
      for(let i=0;i<40;i++){c.fillStyle='rgba(255,190,99,'+(r()*0.22)+')';
        c.beginPath();c.arc(L.w*0.3+r()*L.w*0.4,L.h*0.56+r()*L.h*0.4,0.08+r()*0.1,0,TAU);c.fill();}
      Kit.tank(c,L.w*0.05,L.h*0.1,4,L.h*0.4,{seed:19,label:'Р-01'});
      Kit.tank(c,L.w*0.78,L.h*0.16,3.4,L.h*0.34,{seed:23,label:'Р-02'});};
  }}),
z1_vent:gs=>({id:'z1_vent',zone:'sump',name:'ВЕНТШАХТА B-2',w:12,h:34,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump},
  build(R){
    /* узел В из GDD: спираль вентиляции 25 м вверх; рифлёные стены, ниша-упор посередине.
       Наверху — выход под потолок Насосной (к балкам с клёпками) */
    R.solids=[S(-2,-3,16,3,'steel'),S(-2,0,2,34,'steel'),S(12,0,2,34,'steel'),S(0,31,12,3,'rust'),
      S(3.4,6,1.2,22.4,'rust',{grip:'r'}),S(7.8,6,1.2,25,'rust',{grip:'l'}),
      P(7.0,18,0.8,0.4,'steel'),S(0,6,4.6,0.6,'steel'),
      /* правый столб: наверху — карман за сорванной решёткой, ниже — забит (раньше туда можно было
         сорваться на 25 м без выхода) */
      S(9,8.0,3,23,'rust')];
    /* карман верхней венты: сюда тянет пыльцу с поверхности (см. цилиндр №3) — без фильтра не войти */
    R.pollen=[{x:8.7,y:2.6,w:3.3,h:5.4}];
    if(!gs.flags.got_plate_vent)R.interactables.push({kind:'salvage',upgrade:'plate_vent',x:10.6,y:8.0,flag:'got_plate_vent',
      title:'ПЛАСТИНА КУРТКИ',lines:['В КАРМАНЕ ВЕНТЫ — СЛОЙ ЖЁЛТОЙ ПЫЛЬЦЫ. ПОД НЕЙ — ЧЕЙ-ТО ИНСТРУМЕНТАЛЬНЫЙ ЯЩИК.',
        'НАГРУДНАЯ ПЛАСТИНА МОНТАЖНИКА. ЗАКЛЁПКИ ВСТАЮТ НА МЕСТО.']});
    R.doors=[{x:0.0,y:28.9,w:1.2,h:2.1,to:'z1_hub',link:'vent_low',label:'НАСОСНАЯ'},
      {x:0.0,y:3.9,w:1.2,h:2.1,to:'z1_hub',link:'vent_top',label:'НАСОСНАЯ · ПОД СВОДОМ'}];
    if(!gs.loreIds[3])R.interactables.push({kind:'lore',loreId:3,x:2.6,y:6,title:'ЦИЛИНДР №3 · ПРОБА ВОЗДУХА',
      text:'«ВЕРХНЯЯ ВЕНТА. ВЛАЖНОСТЬ 64%. В ФИЛЬТРЕ — ПЫЛЬЦА НЕИЗВЕСТНОГО ВИДА. ОБРАЗЕЦ ИЗЪЯТ ЦЕНЗУРОЙ.»'});
    R.lights=[lit(6.2,29,6,'#ffbe63',0.8),lit(6.2,21,6,'#9fe6c0',0.6,{flicker:1.6}),lit(6.2,12,6,'#9fe6c0',0.6),
      lit(2.4,4.6,5,'#ffbe63',0.8),lit(6.2,1.5,5,'#cfeaff',0.6),lit(10.5,6,4,'#d8e07a',0.75,{flicker:0.8})];
    R.emitters=[{type:'dust',rate:14},{type:'airjet',x:6.2,y:30,rate:5},{type:'drip',x:5,y:7,rate:0.6},
      {type:'pollen',x:10.4,y:5,rate:7,sw:3}];
    R.extraGame=(c,L,r)=>{
      c.fillStyle='rgba(6,8,8,.6)';c.fillRect(4.6,0,3.2,31);
      c.strokeStyle='#2b3136';c.lineWidth=0.5;
      for(let y=1;y<31;y+=0.9){c.beginPath();c.ellipse(6.2,y,1.4,0.32,0,0,TAU);c.stroke();}
      Kit.stencil(c,0.6,27.6,'ВЕНТ · B-2',0.4,'rgba(200,190,170,.5)',0.5);
      Kit.vent(c,9.4,22,1.8,1.2);
      /* карман: сорванная решётка венты, жёлтый налёт, ящик монтажника */
      c.strokeStyle='#4d545a';c.lineWidth=0.08;for(let i=0;i<5;i++){c.beginPath();c.moveTo(8.9+i*0.12,3.0+i*0.5);c.lineTo(9.6+i*0.16,3.2+i*0.5);c.stroke();}
      c.fillStyle='rgba(216,224,122,.35)';c.fillRect(9,7.3,3,0.7);
      if(!gs.flags.got_plate_vent){Kit.crate(c,10.0,7.3,1.2,0.7,{seed:71,mat:'steel'});}
      Kit.lampCage(c,2.4,4.4,0.26);Kit.pipe(c,[[10.6,0],[10.6,31]],0.2,'rust',{seed:7});
    };
  }}),
z1_cellar:gs=>({id:'z1_cellar',zone:'sump',name:'ПОДВАЛ ХАБА',w:18,h:9,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump},
  build(R){
    /* за штабелем (импульс) — цилиндр и решётка в полу над дренажом: снизу зелёный свет хладагента.
       Решётку берёт только удар вниз в прыжке — первый урок удара вниз */
    R.solids=[S(-2,-2,22,2,'concrete'),S(-2,0,2,9,'concrete'),S(18,0,2,9,'concrete'),S(0,7,14,2,'concrete'),S(16.2,7,1.8,2,'concrete')];
    const blocked=!gs.flags.cellar_open,grate=!gs.flags.cellar_grate;
    if(blocked)R.solids.push(S(8.4,0,1.8,7,'ply',{dyn:true,pid:'ccrates'}));
    if(grate)R.solids.push(S(14,7,2.2,0.45,'steel',{dyn:true,pid:'cgrate'}));
    R.pushables=[];
    if(blocked)R.pushables.push({x:8.4,y:0,w:1.8,h:7,id:'ccrates',kind:'crate',flag:'cellar_open'});
    if(grate)R.pushables.push({x:14,y:7,w:2.2,h:0.45,id:'cgrate',kind:'grate',floor:true,hp:3,flag:'cellar_grate'});
    R.doors=[{x:0.0,y:4.9,w:1.2,h:2.1,to:'z1_hub',tx:5.0,ty:31.8,label:'ХАБ'},
      {x:14,y:8.0,w:2.2,h:1.0,to:'z1_drain',link:'cellar_hole',fall:true,label:'ДРЕНАЖ',reqFlag:'cellar_grate'}];
    R.signs=[{x:12.6,y:2.0,keys:['S','J'],alt:'ЛКМ',text:'В ПРЫЖКЕ — УДАР ВНИЗ',showFlag:'cellar_open',hideFlag:'cellar_grate'}];
    R.enemies.push({type:'mokrica',x:3.4,y:6.38,patrol:[1.6,7.6],amb:true});
    R.lights=[lit(4,3,6,'#ffbe63',0.7,{flicker:1.3}),lit(11,3.4,5,'#69d68f',0.6),lit(15.1,8.4,4.5,'#69d68f',0.9)];
    R.emitters=[{type:'drip',x:6,y:2,rate:0.5},{type:'dust',rate:10},{type:'coolant',x:15.1,y:8.8,rate:2.5,sw:2}];
    R.interactables=gs.loreIds[1]?[]:[{kind:'lore',loreId:1,x:11.4,y:6.4,
      title:'ЦИЛИНДР №1 · ЗАВЕТ ОСНОВАТЕЛЕЙ',
      text:'«МИР НАВЕРХУ СГОРЕЛ. ВОЗДУХ — ЯД. ПЕЧАТЬ — ПОСЛЕДНЯЯ СТЕНА МЕЖДУ НАМИ И ПЕПЛОМ. НЕ ОТКРЫВАТЬ.»'}];
    R.extraGame=(c,L,r)=>{
      c.fillStyle='rgba(30,60,45,.5)';c.fillRect(0,6.5,18,0.6);
      Kit.puddle(c,3,6.9,2.4,'#4a7a5e');Kit.puddle(c,9,6.9,2.0,'#4a7a5e');
      Kit.plate(c,10,5.4,3,1.6,'ply',401,{rust:0.3});
      for(let i=0;i<5;i++){c.strokeStyle='#7a8087';c.lineWidth=0.06;
        c.beginPath();c.moveTo(10.2+r()*2.6,5.6);c.lineTo(10.4+r()*2.6,6.2);c.stroke();}
      Kit.lampCage(c,4,3,0.26);
      Kit.stencil(c,1.6,4.4,'ПОДВАЛ · НЕ ВХОДИТЬ',0.36,'rgba(216,204,178,.5)',0.5);
      Kit.stencil(c,14.2,6.4,'ДРЕНАЖ ↓',0.34,'rgba(150,230,180,.6)',0.6);
      Kit.pipe(c,[[0,1.6],[18,1.6]],0.16,'rust',{seed:42});
      /* провал под решёткой: зелёный отсвет хладагента */
      const g=c.createLinearGradient(0,7,0,9);g.addColorStop(0,'rgba(40,140,90,.5)');g.addColorStop(1,'rgba(10,40,25,.95)');
      c.fillStyle=g;c.fillRect(14,7,2.2,2);
    };
  }}),
z1_east:gs=>({id:'z1_east',zone:'sump',name:'ВОСТОЧНЫЙ КОРИДОР',w:38,h:15,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump,fgd:Art.fgdSump},
  build(R){
    const cleared=gs.flags.east_crane;
    R.solids=[S(-2,-2,42,3.4,'steel'),S(-2,0,2,15,'steel'),S(38,0,2,15,'steel'),S(0,12,38,3,'rust')];
    /* завал рисуется живьём (R.dyn), коллизия оседает вместе с ним */
    R.solids.push(cleared?S(17,11.5,5,0.5,'concrete',{dyn:true,pid:'eastpile'}):S(17,3.4,5,8.6,'concrete',{dyn:true,pid:'eastpile'}));
    /* осевший завал — две низкие ступени: перешагивается без прыжка */
    if(cleared)R.solids.push(S(18.2,11.1,2.6,0.4,'concrete',{dyn:true,pid:'eastpile2'}));
    if(cleared)R.solids.push(S(26.8,5.95,5.4,1.4,'steel',{dyn:true,pid:'eastslab'}));
    R.doors=[{x:0.0,y:9.9,w:1.2,h:2.1,to:'z1_hub',tx:33.4,ty:28.6,label:'НАСОСНАЯ'},
      {x:36.8,y:9.9,w:1.2,h:2.1,to:'z1_arena',tx:1.8,ty:17.6,label:'РЕМОНТНЫЙ ЦЕХ'},
      {x:31.2,y:11.6,w:1.6,h:0.9,down:true,to:'z1_drain',link:'drain_up',label:'ДРЕНАЖ',latch:'drain_latch',msg:'ЛЮК ЗАДРАЕН СНИЗУ.'}];
    R.enemies.push({type:'mokrica',x:8,y:11.38,patrol:[3,15],amb:true},{type:'wrench',x:26,y:10.45,patrol:[23,35],amb:true});
    R.lights=[lit(5,4.4,10,'#ffbe63',0.95),lit(14,4.2,9.5,'#ffbe63',0.85,{flicker:1.1}),
      lit(24,4.4,10,'#ffa64a',0.9),lit(33,4.2,10,'#ffbe63',0.9),
      lit(9,11.4,5,'#ffb070',0.55),lit(28,11.4,5,'#ffb070',0.5),
      lit(19.5,10,5,'#69d68f',0.4),lit(1.4,10.8,3.5,'#8fd6ff',0.5),lit(37,10.8,3.5,'#8fd6ff',0.5)];
    R.emitters=[{type:'steam',x:9,y:11.4,rate:0.4},{type:'drip',x:22,y:3.6,rate:0.7},
      {type:'dust',rate:16},{type:'spark',x:28,y:6,rate:0.5}];
    R.interactables=[{kind:'lever',x:11.6,y:12,label:'АВАРИЙНЫЙ СБРОС',
      plaque:'КРАН-БАЛКА · СБРОС ЗАВАЛА',flag:'east_crane',sys:'crane'}];
    /* ---- сцена: магнит хватает стальную крышку завала, тележка стаскивает её вправо,
       лишённый крышки завал оседает слева направо; крышка остаётся висеть над коридором ---- */
    const FL=12,rb=rng('east_chunks'),CH=[],NZ=[];
    for(let i=0;i<=12;i++)NZ.push(rb());
    const mound=x=>Math.max(0,1-Math.pow((x-19.5)/3.4,4));
    for(let i=0;i<120;i++){const x0=16.95+rb()*5.1,y0=7.2+rb()*4.7,x1=clamp(x0+(rb()-0.5)*2.4,16.3,22.7);
      CH.push({x0:x0,y0:y0,x1:x1,y1:FL-0.06-rb()*Math.max(0.1,0.9*mound(x1)),s:0.14+rb()*0.34,r0:rb()*TAU,r1:rb()*TAU,
        t0:1.35+(x0-16.8)/5.4*1.15+rb()*0.3,mat:rb()<0.2?'rust':'concrete'});}
    const trolX=T=>19.5+10*EZ.io(seg01(T,1.0,3.0));
    const chainL=T=>0.05+0.25*EZ.bounce(seg01(T,2.25,2.95));
    const coll=T=>EZ.io(seg01(T,1.5,3.0));
    const GIR=[{a:[19.2,8.4,0.32],b:[18.2,11.08,-0.06],t:[1.85,2.35],w:6.4,h:0.9},{a:[19.8,10.5,-0.22],b:[20.9,11.48,0.03],t:[2.1,2.5],w:5.6,h:0.8}];
    const T_=W=>W.anims.crane?W.anims.crane.t:(gs.flags.east_crane?99:0);
    R.tick=(dt,W)=>{
      const a=W.anims.crane;if(!a||a.done)return;const T=a.t,g=W.game;
      a.th=a.th||0;a.om=a.om||0;
      /* груз на цепи — маятник, раскачку даёт ускорение тележки */
      const h=1/60,xa=(trolX(T+h)-2*trolX(T)+trolX(T-h))/(h*h),Lp=1.7;
      a.om+=(-(58/Lp)*Math.sin(a.th)-(xa/Lp)*Math.cos(a.th)-1.8*a.om)*dt;a.th+=a.om*dt;
      /* пока крышка лежит на завале — она ползёт ровно, качаться начинает, только когда сошла с него */
      if(trolX(T)-2.7<22.3){a.th=damp(a.th,0,30,dt);a.om=0;}
      if(T>3.6){a.th=damp(a.th,0,3,dt);a.om=damp(a.om,0,3,dt);}
      W.setSolid('eastpile',s=>{const k=coll(T),top=FL-lerp(8.6,0.5,k);s.y=top;s.h=FL-top;s.noEdge=T<3.0;});
      if(T>3.0&&!R.solids.some(q=>q.pid==='eastpile2')&&!aabb(W.player.rect(),{x:18.2,y:11.1,w:2.6,h:0.4})){
        R.solids.push(S(18.2,11.1,2.6,0.4,'concrete',{dyn:true,pid:'eastpile2'}));R._edges=null;}
      const cue=(at,fn)=>{a.f=a.f||{};if(T>=at&&!a.f[at]){a.f[at]=1;fn();}};
      cue(0.3,()=>{g.camera.focus={x:21,y:7.6};});
      [0.35,0.85,1.35].forEach(q=>cue(q,()=>{g.audio.tone(560,0.22,'square',0.018,0);W.later(230,()=>g.audio.tone(420,0.26,'square',0.018,0));}));
      cue(0.5,()=>{g.audio.tone(90,0.9,'sawtooth',0.03,160);});
      cue(1.0,()=>{g.audio.gate();g.camera.addShake(0.35);});
      cue(1.95,()=>{g.audio.nz(0.9,170,0.4,0.13,'lowpass');g.audio.tone(52,0.8,'sine',0.11,30);g.camera.addShake(0.75);
        g.particles.burst(18.4,11.4,26,{kind:'smoke',col:'#6a5c4c',spd:4.5,life:1.8,size:0.6,grow:1.4,drag:1.6,a:0.55});});
      cue(2.45,()=>{g.audio.nz(0.7,200,0.4,0.11,'lowpass');g.camera.addShake(0.6);
        g.particles.burst(20.8,11.5,22,{kind:'smoke',col:'#6a5c4c',spd:4,life:1.6,size:0.55,grow:1.3,drag:1.6,a:0.5});
        for(let i=0;i<16;i++)g.particles.spawn({kind:'debris',x:18+Math.random()*4,y:10.6+Math.random(),vx:(Math.random()-0.5)*8,vy:-2-Math.random()*5,
          g:30,life:1+Math.random()*0.6,size:0.08+Math.random()*0.12,col:'#7a6c5c',rot:Math.random()*6,vr:(Math.random()-0.5)*12,drag:0.4});});
      cue(3.0,()=>{g.audio.hitMetal();g.camera.addShake(0.3);});
      cue(3.4,()=>{g.camera.focus=null;});
      /* крышка скребёт по завалу — искры по нижней кромке */
      if(T>1.0&&T<2.4&&Math.random()<0.6){const x=trolX(T)-2.7+Math.random()*2;
        g.particles.spawn({kind:'spark',x:clamp(x,16.8,22.2),y:7.1,vx:(Math.random()-0.2)*4,vy:-1-Math.random()*3,life:0.45,size:0.05,col:'#ffcf7a',add:true,g:16});}
      if(T>0.4&&T<1.0&&Math.random()<0.35)g.particles.spawn({kind:'dust',x:17+Math.random()*5,y:7.2,vx:0,vy:1,life:0.9,size:0.08,col:'#8a7a6a',g:10});
      if(T>=4.4){a.done=true;a.th=0;g.camera.focus=null;
        const p=W.player,slab={x:26.8,y:5.95,w:5.4,h:1.4};
        if(!aabb(p.rect(),slab)){R.solids.push(S(26.8,5.95,5.4,1.4,'steel',{dyn:true,pid:'eastslab'}));R._edges=null;}else a.done=false;}
    };
    R.dyn=(c,t,W)=>{
      const T=T_(W),a=W.anims.crane,k=coll(T);
      /* масса завала: от потолочной пробки до холма по колено */
      c.beginPath();c.moveTo(16.4,FL);
      for(let i=0;i<=12;i++){const x=16.4+i*(6.2/12),m=mound(x),hh=lerp(4.95*(0.9+0.1*NZ[i])*Math.min(1,m*2.4),0.92*m,k);c.lineTo(x,FL-hh);}
      c.lineTo(22.6,FL);c.closePath();
      c.save();c.fillStyle=PAT(c,'concrete');c.fill();c.clip();
      /* светлый бетон сверху, тень к полу: куча читается и в полумраке */
      const sg=c.createLinearGradient(0,FL-1.2-4*(1-k),0,FL);sg.addColorStop(0,'rgba(190,172,148,.38)');sg.addColorStop(0.6,'rgba(120,104,86,.18)');sg.addColorStop(1,'rgba(10,8,6,.55)');
      c.fillStyle=sg;c.fillRect(16,6,7,6.2);c.restore();
      /* глыбы: каждая падает по-своему, когда над ней проходит край крышки */
      for(const q of CH){const d=Math.max(0.04,q.y1-q.y0),ft=Math.sqrt(2*d/40),u=clamp((T-q.t0)/ft,0,1);
        let y=q.y0+(q.y1-q.y0)*u*u;const bt=T-q.t0-ft;if(u>=1&&bt<0.3)y-=Math.sin(bt/0.3*PI)*0.1*d/4;
        const x=lerp(q.x0,q.x1,EZ.out(u)),r=lerp(q.r0,q.r1,u),s=q.s;
        c.save();c.translate(x,y);c.rotate(r);c.fillStyle=PAT(c,q.mat);c.beginPath();
        c.moveTo(-s,-s*0.6);c.lineTo(s*0.8,-s);c.lineTo(s,s*0.5);c.lineTo(-s*0.4,s*0.8);c.closePath();c.fill();
        c.fillStyle='rgba(200,184,160,.3)';c.beginPath();c.moveTo(-s,-s*0.6);c.lineTo(s*0.8,-s);c.lineTo(s*0.5,-s*0.3);c.lineTo(-s*0.6,-s*0.2);c.closePath();c.fill();
        c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.moveTo(s,s*0.5);c.lineTo(-s*0.4,s*0.8);c.lineTo(-s*0.2,s*0.5);c.closePath();c.fill();
        c.strokeStyle='rgba(255,240,210,.22)';c.lineWidth=0.03;c.beginPath();c.moveTo(-s,-s*0.6);c.lineTo(s*0.8,-s);c.stroke();c.restore();}
      for(const gd of GIR){const u=seg01(T,gd.t[0],gd.t[1]),e=EZ.bounce(u);
        c.save();c.translate(lerp(gd.a[0],gd.b[0],EZ.out(u)),lerp(gd.a[1],gd.b[1],e));c.rotate(lerp(gd.a[2],gd.b[2],e));
        Kit.craneGirder(c,-gd.w/2,-gd.h/2,gd.w,gd.h);c.restore();}
      /* тележка, цепь, магнит и крышка */
      const tx=trolX(T),L=chainL(T),th=a&&!a.done?(a.th||0):Math.sin(t*0.9)*0.004;
      Kit.trolley(c,tx,4.0,1.2);
      const live=a&&!a.done&&T<4.4;
      if(live){const bl=0.5+0.5*Math.sin(T*14);c.fillStyle=rgba('#ffb03a',0.5+0.5*bl);c.beginPath();c.arc(tx+0.85,3.55,0.13,0,TAU);c.fill();
        game.renderer.glowAdd(tx+0.85,3.55,2.2,'#ffa640',0.25+0.45*bl);}
      c.save();c.translate(tx,4.8);c.rotate(th);
      Kit.chain(c,0,0,L+0.3,0.13,0,t);
      const my=L+0.45;Kit.electromagnet(c,0,my,0.85);
      if(T>0.4){const on=seg01(T,0.4,0.9)*(T<4.4?1:0.3),fl=0.7+0.3*Math.sin(t*40);
        c.save();c.globalCompositeOperation='lighter';c.fillStyle=rgba('#9fd6ff',0.35*on*fl);
        c.beginPath();c.ellipse(0,my+0.35,0.8,0.18,0,0,TAU);c.fill();c.restore();}
      const jit=T>0.4&&T<1.0?(Math.random()-0.5)*0.05:0;
      Kit.plate(c,-2.7+jit,my+0.42,5.4,1.4,'steel',51,{rust:0.9});
      Kit.hazardTape(c,-2.7+jit,my+1.56,5.4,0.26);
      Kit.stencil(c,-1.2,my+1.25,'КРЫШКА ШАХТЫ 3',0.26,'rgba(235,220,190,.55)',0.55);
      c.restore();
      if(T>0.4){const on=seg01(T,0.4,0.9)*(T<4.4?1:0.3);const wx=tx-Math.sin(th)*(L+0.8),wy=4.8+Math.cos(th)*(L+0.8);
        game.renderer.glowAdd(wx,wy,1.3,'#9fd6ff',0.35*on);}
    };
    R.extraGame=(c,L,r)=>{
      Kit.craneGirder(c,0,3.0,38,1.0);
      Kit.pipe(c,[[0,1.6],[38,1.6]],0.24,'steel',{seed:5,band:3,bandCol:'#c8452f'});
      Kit.pipe(c,[[2,2.4],[2,12]],0.18,'rust',{seed:6});Kit.pipe(c,[[35,2.4],[35,12]],0.18,'rust',{seed:7});
      Kit.lampCage(c,5,4.4,0.3);Kit.lampCage(c,14,4.2,0.3);Kit.lampCage(c,24,4.4,0.3);Kit.lampCage(c,33,4.2,0.3);
      Kit.plate(c,11.0,10.4,1.6,1.6,'steel',61,{rust:0.6});
      Kit.stencil(c,11.05,10.2,'АВАР. СБРОС',0.24,'rgba(220,200,150,.6)',0.6);
      Kit.sign(c,3.2,7.0,3.2,0.85,'ОСТОРОЖНО · КРАН-БАЛКА','#c9a227','#191612',8);
      Kit.sign(c,30.2,7.0,3.4,0.85,'РЕМОНТНЫЙ ЦЕХ →','#c9a227','#191612',9);
      Kit.vent(c,26,2.0,1.6,0.9);
      Kit.oilStain(c,20,11.95,2.0,rng(31));Kit.puddle(c,8,11.96,1.2);Kit.chain(c,31,3.0,2.6,0.1);
    };
    R.extraMid=(c,L,r)=>{Kit.tank(c,4,3,3,L.h*0.5,{seed:41,label:'Р-21'});
      Kit.tank(c,30,2,3.4,L.h*0.6,{seed:43,label:'Р-22'});};
  }}),
z1_arena:gs=>({id:'z1_arena',zone:'sump',name:'РЕМОНТНАЯ АРЕНА',w:32,h:23,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump},
  build(R){
    const cleared=gs.flags.arena_cleared,got=gs.flags.got_nozzle;
    R.solids=[S(-2,-2,36,3,'steel'),S(-2,0,2,23,'steel'),S(32,0,2,23,'steel'),S(0,20,32,3,'rust'),
      P(4,17.2,4.4,0.4),P(23.6,17.2,4.4,0.4),P(11,14.4,10,0.4),
      S(6,18.6,2.0,1.4,'ply'),S(24,18.6,2.0,1.4,'ply')];
    /* ворота в сейф-комнату завалены ящиками до потолка платформы: сразу после
       получения резака его нужно применить, иначе из цеха не выйти */
    const crates=!gs.flags.arena_crates;
    if(crates)R.solids.push(S(28.6,15.6,3.4,4.4,'ply',{dyn:true,pid:'acrates'}));
    R.pushables=crates?[{kind:'crate',x:28.6,y:15.6,w:3.4,h:4.4,id:'acrates',flag:'arena_crates'}]:[];
    R.signs=[{x:25.6,y:12.2,keys:['K'],alt:'ПКМ',text:'ИМПУЛЬС',need:'pulse',hideFlag:'arena_crates'}];
    R.doors=[{x:0.0,y:17.9,w:1.2,h:2.1,to:'z1_east',tx:36.2,ty:9.6,label:'КОРИДОР'},
      {x:30.8,y:17.9,w:1.2,h:2.1,to:'z1_safe',tx:1.8,ty:9.0,label:'СЕЙФ-КОМНАТА',reqFlag:'arena_cleared',
        reqMsg:'ВОРОТА ЗАКЛИНЕНО. ВНУТРИ КТО-ТО ЕЩЁ РАБОТАЕТ.'}];
    R.waves=cleared?null:[
      {n:3,types:['repairer','repairer','wrench'],x:[6,16,25],y:18.2},
      {n:3,types:['repairer','wrench','repairer'],x:[8,20,27],y:18.2},
      {n:2,types:['wrench','repairer'],x:[13,22],y:18.2}];
    R.waveFlag='arena_entered';R.clearFlag='arena_cleared';
    R.lights=[lit(6,6,11,'#ffbe63',0.9),lit(16,5,12,'#ffa64a',1.0,{flicker:1.4}),lit(26,6,11,'#ffbe63',0.9),
      lit(11,14,6,'#8fd6ff',0.5),lit(16,19.4,8,'#ff9c4a',0.7,{flicker:0.6}),lit(6,18.4,6,'#ffb070',0.45),lit(26,18.4,6,'#ffb070',0.45),
      lit(1.4,18.6,3,'#69d68f',0.4),lit(30.6,18.6,3,'#69d68f',0.4)];
    R.emitters=[{type:'spark',x:9,y:16.6,rate:1.4},{type:'spark',x:23,y:16.6,rate:1.1},
      {type:'steam',x:2,y:19,rate:0.5},{type:'dust',rate:20},{type:'smoke',x:16,y:19.6,rate:0.4}];
    R.interactables=(cleared&&!got)?[{kind:'salvage',upgrade:'pulse_power',x:16,y:19.0,flag:'got_nozzle',
      title:'ФОРСУНКА РЕЗАКА',
      lines:['ЗАРЯДНАЯ СТАНЦИЯ ЦЕХА РАСКРЫВАЕТСЯ. ВНУТРИ — ШИРОКАЯ ЛАТУННАЯ ФОРСУНКА.',
             'ОНА НАВИНЧИВАЕТСЯ НА СОПЛО РЕЗАКА. ИМПУЛЬС ДОСТАЁТ ДАЛЬШЕ И БЬЁТ ТЯЖЕЛЕЕ.']}]:[];
    R.extraGame=(c,L,r)=>{
      for(let i=0;i<4;i++)Kit.chain(c,5+i*7,3,3+r()*4,0.11);
      Kit.plate(c,4,16.6,4.4,0.6,'steel',71,{rust:0.7});Kit.plate(c,23.6,16.6,4.4,0.6,'steel',72,{rust:0.7});
      Kit.vent(c,4.6,15.2,1.4,0.8);Kit.vent(c,25,15.2,1.4,0.8);
      Kit.gauge(c,8.6,16.2,0.28,0.5);Kit.gauge(c,26.2,16.2,0.28,0.3);
      Kit.plate(c,1,19.0,4,1.0,'ply',81,{rust:0.3});Kit.plate(c,27,19.0,4,1.0,'ply',82,{rust:0.3});
      for(let i=0;i<7;i++)Kit.oilStain(c,2+r()*28,19.94,1.2+r()*1.6,rng(i*13));
      if(!got){
        Kit.plate(c,14.4,17.2,3.2,2.8,'steel',91,{rust:0.6});
        c.fillStyle='#1b1e21';rr(c,15.0,17.8,2.0,1.5,0.08);c.fill();
        c.fillStyle='rgba(255,190,99,.35)';rr(c,15.1,17.9,1.8,1.3,0.06);c.fill();
        Kit.gauge(c,14.7,17.5,0.2,0.9);
        Kit.stencil(c,14.5,20.5,'СТАНЦИЯ ЗАРЯДКИ · ИНСТРУМЕНТ',0.26,'rgba(216,204,178,.55)',0.55);
        Kit.hazardTape(c,14.4,19.75,3.2,0.2);
        c.save();c.translate(16,18.5);
        c.fillStyle='#3a4046';rr(c,-0.3,-0.1,0.7,0.22,0.06);c.fill();
        c.fillStyle='#c9a227';rr(c,0.28,-0.14,0.22,0.3,0.04);c.fill();
        c.fillStyle='#22262a';c.fillRect(-0.24,-0.04,0.16,0.1);c.restore();
      }else{
        Kit.plate(c,14.4,17.2,3.2,2.8,'steel',91,{rust:0.9});
        c.fillStyle='#121416';rr(c,15.0,17.8,2.0,1.5,0.08);c.fill();
        Kit.stencil(c,14.7,20.5,'СТАНЦИЯ ПУСТА',0.28,'rgba(216,204,178,.4)',0.4);}
      Kit.sign(c,28.0,16.0,3.4,0.8,'ЦЕХ РЕМОНТА','#c8452f','#f0e2cf',13);
      Kit.lampCage(c,6,6,0.34);Kit.lampCage(c,16,5,0.38);Kit.lampCage(c,26,6,0.34);
      Kit.crate(c,9.4,19.0,1.0,1.0,{seed:17});Kit.crate(c,21.4,19.0,1.0,1.0,{seed:18});
      Kit.pipe(c,[[0,2.2],[32,2.2]],0.2,'steel',{seed:4});
    };
    R.extraMid=(c,L,r)=>{Kit.pumpUnit(c,6,L.h*0.86,1.6,{seed:51,tag:'ПР-3'});
      Kit.pumpUnit(c,26,L.h*0.86,1.6,{seed:53,tag:'ПР-4'});};
  }}),
z1_safe:gs=>({id:'z1_safe',zone:'sump',name:'СЕЙФ-КОМНАТА',w:22,h:14,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump},
  build(R){
    const open=gs.flags.blast_open;
    R.solids=[S(-2,-2,26,2.6,'steel'),S(-2,0,2,14,'steel'),S(22,0,2,14,'steel'),S(0,11.4,22,2.6,'rust')];
    /* дверь — живой блок: едет вверх синхронно с падением противовеса (R.tick) */
    R.solids.push(S(13.4,open?-6.2:2.6,1.6,8.8,'steel',{dyn:true,pid:'blast'}));
    const T_=W=>W.anims.blast?W.anims.blast.t:(gs.flags.blast_open?99:0);
    const doorY=T=>lerp(2.6,-6.2,EZ.io(seg01(T,0.35,2.15)));
    R.tick=(dt,W)=>{const a=W.anims.blast;if(!a||a.done)return;const T=a.t,g=W.game;
      W.setSolid('blast',s=>{s.y=doorY(T);});
      const cue=(at,fn)=>{a.f=a.f||{};if(T>=at&&!a.f[at]){a.f[at]=1;fn();}};
      cue(0.3,()=>{g.audio.gate();});
      cue(2.05,()=>{g.audio.hitMetal();g.audio.nz(0.6,160,0.5,0.12,'lowpass');g.audio.tone(48,0.6,'sine',0.12,30);g.camera.addShake(0.85);
        g.particles.burst(11.15,12.0,22,{kind:'dust',col:'#8a7a6a',spd:4,life:1.2,size:0.14,g:10});
        g.particles.burst(14.2,11.2,10,{kind:'dust',col:'#8a7a6a',spd:2,life:0.9,size:0.1,g:8});});
      if(T>0.4&&T<2.1&&Math.random()<0.5){const y=doorY(T)+8.8;
        if(y>0.7)g.particles.spawn({kind:'spark',x:13.4+Math.random()*1.6,y:Math.min(y,11.3),vx:(Math.random()-0.5)*3,vy:-1,life:0.4,size:0.04,col:'#ffcf7a',add:true,g:14});}
      if(T>0.3&&T<2.1)g.camera.addShake(0.05);
      if(T>=2.6)a.done=true;
    };
    R.dyn=(c,t,W)=>{const T=T_(W),dy=doorY(T),k=EZ.io(seg01(T,0.35,2.15));
      /* шестерня-барабан: трос от противовеса наматывается, дверной трос сматывается */
      const cw=W.pushables.find(p=>p.kind==='counterweight'),cy=cw?cw.y:8.0;
      c.strokeStyle='#5c646b';c.lineWidth=0.16;c.beginPath();c.moveTo(11.15,cy+0.05);c.lineTo(11.15,4.2);c.lineTo(13.8,4.0);c.stroke();
      Kit.gear(c,14.2,4.0,0.42,12,0.3+k*9,'#8a6d2a');
      c.save();c.beginPath();c.rect(13.2,0.6,2.0,10.8);c.clip();
      Kit.cable(c,14.2,4.0,14.2,Math.max(dy,0.6),0.02,0.07,'#2b3035');
      Kit.plate(c,13.4,dy,1.6,8.8,'steel',101,{rust:0.7,boltStep:0.7});
      Kit.hazardTape(c,13.4,dy+8.4,1.6,0.4);Kit.hazardTape(c,13.4,dy+0.2,1.6,0.4);
      Kit.stencil(c,13.5,dy+4.6,'BLAST',0.42,'rgba(230,220,190,.7)',0.7);
      for(let i=0;i<6;i++)Kit.bolt(c,13.7+(i%2)*1.0,dy+1+i*1.3,0.09);
      c.restore();
      Kit.gauge(c,3.0,9.4,0.32,lerp(0.05,0.9,k));Kit.gauge(c,3.8,9.4,0.24,lerp(0.02,0.8,k));
    };
    R.pushables=[{x:10.4,y:8.0,w:1.5,h:1.9,id:'counterweight',kind:'counterweight',pushed:open}];
    R.interactables=[];RB.lore(R,gs,13,6.2,11.4);
    R.doors=[{x:0.0,y:9.3,w:1.2,h:2.1,to:'z1_arena',tx:30.2,ty:17.6,label:'АРЕНА'},
      {x:20.8,y:9.3,w:1.2,h:2.1,to:'z1_boss',tx:1.8,ty:19.6,label:'АРЕНА НАДСМОТРЩИКА',reqFlag:'blast_open',
        reqMsg:'BLAST-ДВЕРЬ · НА ПРОТИВОВЕСЕ'}];
    R.lights=[lit(4,4,7,'#ffbe63',0.85),lit(11,4,6,'#ffa64a',0.8,{flicker:0.9}),
      lit(18,4,7,'#ffbe63',0.85),lit(14.2,9,4,'#c8452f',0.5,{flicker:0.4}),lit(1.4,10,3,'#8fd6ff',0.4)];
    R.emitters=[{type:'steam',x:8,y:10.6,rate:0.45},{type:'dust',rate:14},{type:'drip',x:16,y:2.8,rate:0.8}];
    R.extraGame=(c,L,r)=>{
      Kit.plate(c,12.6,2.4,0.8,9.0,'steel',102,{rust:0.8});
      Kit.plate(c,15.0,2.4,0.8,9.0,'steel',103,{rust:0.8});
      c.fillStyle='#121416';c.fillRect(9.8,6.6,2.8,4.0);
      Kit.plate(c,9.6,6.4,3.2,0.3,'steel',104,{});Kit.plate(c,9.6,10.4,3.2,0.3,'steel',105,{});
      Kit.stencil(c,9.9,6.2,'ПРОТИВОВЕС 4Т',0.26,'rgba(216,204,178,.55)',0.55);
      Kit.pipe(c,[[0,2.0],[22,2.0]],0.22,'steel',{seed:9});
      Kit.pipe(c,[[17,2.2],[17,11]],0.18,'rust',{seed:10});
      Kit.lampCage(c,4,4,0.3);Kit.lampCage(c,18,4,0.3);
      Kit.sign(c,2.4,7.6,3.6,0.85,'ГЕРМОЗОНА · НАДСМОТРЩИК','#c8452f','#f0e2cf',17);
      Kit.plate(c,2.4,8.8,2.0,1.3,'steel',110,{rust:0.6});
      Kit.oilStain(c,6,11.35,1.6,rng(61));
    };
    R.extraMid=(c,L,r)=>{Kit.tank(c,3,3,2.6,L.h*0.4,{seed:61,label:'Д-4'});};
  }}),
z1_boss:gs=>({id:'z1_boss',zone:'sump',name:'АРЕНА НАДСМОТРЩИКА',w:36,h:25,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump},
  build(R){
    const dead=gs.bosses.overseer;
    /* Платформы достижимы прыжком (2.4 и ещё 2.6 выше): с них импульс достаёт до грузов.
       После смерти крановщика сброшенные грузы проламывают перекрытие у выхода —
       обратно только рывком (немедленное применение нового клапана). */
    R.solids=[S(-2,-3,40,4.6,'steel'),S(-2,0,2,25,'steel'),S(36,0,2,25,'steel'),
      P(22.0,17.0,3.6,0.4),P(27.0,19.6,4.5,0.4)];
    /* левая верхняя платформа рушится вместе с перекрытием — иначе пролом берётся рывком */
    if(!dead)R.solids.push(P(10.4,17.0,3.6,0.4));
    /* левая нижняя платформа рушится вместе с перекрытием — иначе пролом обходится без рывка */
    if(!dead)R.solids.push(P(4.5,19.6,4.5,0.4));
    if(dead)R.solids.push(S(0,22,2.4,3,'rust'),S(17.4,22,18.6,3,'rust'));
    else R.solids.push(S(0,22,36,3,'rust'));
    if(dead)R.hazards=[{x:2.4,y:24.2,w:15,h:0.8,kind:'pit',back:{x:17.9,y:20.3},backs:[{minX:-9,x:0.9,y:20.3},{minX:9.9,x:17.9,y:20.3}]}];
    R.pit=dead?[2.4,17.4]:null;
    R.signs=dead?[{x:19.6,y:14.4,keys:['R'],text:'ГАРПУН · К РЫМУ',need:'hook'}]:[];
    RB.ring(R,7.2,15.4,'top',13.8);RB.ring(R,13.2,15.4,'top',13.8);
    R.boss=dead?null:{type:'overseer',x:20,y:18.4};
    R.bossTrigger={x:3.4,y:14,w:30,h:8};
    R.bossDoor={x:0.0,y:19.9,w:1.4,h:2.1,active:!dead};
    R.doors=[{x:0.0,y:19.9,w:1.2,h:2.1,to:'z1_safe',tx:20.0,ty:9.0,label:'СЕЙФ-КОМНАТА'},
      {x:34.8,y:19.9,w:1.2,h:2.1,to:'z1_quiet',label:'ДИСПЕТЧЕРСКАЯ',reqFlag:'boss1_dead',reqMsg:'ЗАПЕРТО · КРАН В РАБОТЕ'}];
    R.weights=[6.8,12.2,23.8,29.2].map((x,i)=>({x:x,y:11.6,y0:11.6,w:2.4,h:2.4,cableTop:1.6,state:'hang',id:i,vy:0}));
    for(let i=0;i<4;i++)if(gs.flags['w_drop_'+i])R.weights[i].state='down';
    R.lights=[lit(8,5,12,'#ffbe63',0.85),lit(28,5,12,'#ffbe63',0.85),lit(18,3,14,'#ffa64a',0.75,{flicker:0.5}),
      lit(18,21.4,10,'#ff9c4a',0.65),lit(12,16,6,'#ffcf7a',0.4),lit(24,16,6,'#ffcf7a',0.4),
      lit(1.4,20.6,3.5,'#c8452f',0.6,{flicker:0.3}),lit(34,20.6,3.5,'#8fd6ff',0.45)];
    R.emitters=[{type:'steam',x:4,y:21.4,rate:0.5},{type:'steam',x:32,y:21.4,rate:0.5},
      {type:'spark',x:18,y:2.4,rate:0.7},{type:'dust',rate:22}];
    R.interactables=(dead&&!gs.flags.got_hook)?[{kind:'salvage',ability:'hook',x:19,y:22,flag:'got_hook',
      title:'ГАРПУН КРАНОВЩИКА',
      lines:['СТРЕЛА КРАНОВЩИКА ЛЕЖИТ ПОПЕРЁК ЦЕХА. НА НЕЙ — ЛЕБЁДКА С ГАРПУНОМ.',
             'ЛЕБЁДКУ ЛЕГКО СНЯТЬ: ЧЕТЫРЕ БОЛТА. ТРОС НАМАТЫВАЕТСЯ НА НАРУЧ.',
             'ТОТ, КТО ДЕРЖАЛ ЯРУС, ДАЛ КУРЬЕРУ ВЕРЁВКУ НАВЕРХ.']}]:[];
    R.extraGame=(c,L,r)=>{
      Kit.craneGirder(c,0,0.6,36,1.0);
      /* при живом боссе грузы рисуются динамически (иначе остаются «призраки» после падения) */
      if(dead)for(const w of R.weights){
        if(w.state==='down')continue;
        Kit.cable(c,w.x,w.cableTop,w.x,w.y,0.05,0.09,'#2b3035');
        Kit.plate(c,w.x-w.w/2,w.y,w.w,w.h,'steel',201+w.id,{rust:0.8});
        Kit.hazardTape(c,w.x-w.w/2,w.y+w.h-0.3,w.w,0.3);
        Kit.stencil(c,w.x-0.5,w.y+1.6,'4Т',0.4,'rgba(220,210,180,.45)',0.45);}
      if(!dead)Kit.plate(c,4.5,20.0,4.5,0.5,'steel',210,{rust:0.7});
      Kit.plate(c,27,20.0,4.5,0.5,'steel',211,{rust:0.7});
      if(!dead)Kit.plate(c,10.4,17.4,3.6,0.4,'steel',212,{rust:0.7});Kit.plate(c,22,17.4,3.6,0.4,'steel',213,{rust:0.7});
      for(const x of (dead?[27.5,31]:[5,8.5,27.5,31]))Kit.pipe(c,[[x,20.0],[x,22]],0.08,'steel',{seed:x|0,rustN:0});
      for(const x of (dead?[22.4,25.2]:[10.8,13.6,22.4,25.2]))Kit.pipe(c,[[x,17.4],[x,19.6]],0.07,'steel',{seed:x|0,rustN:0});
      Kit.sign(c,15.9,15.0,4.2,0.9,'ЗОНА РАБОТЫ КРАНА','#c8452f','#f0e2cf',21);
      Kit.lampCage(c,8,5,0.4);Kit.lampCage(c,28,5,0.4);
      for(let i=0;i<5;i++)Kit.oilStain(c,3+r()*30,21.94,1.4+r()*1.8,rng(301+i));
      if(!dead)Kit.rubble(c,15,21.0,3,1.0,rng(302));
      Kit.pipe(c,[[0,2.6],[36,2.6]],0.2,'rust',{seed:22});
      Kit.vent(c,2,3.4,1.6,0.9);Kit.vent(c,32,3.4,1.6,0.9);
      if(gs.bosses.overseer){
        Kit.rubble(c,15,21.0,8,1.2,rng(777),'steel');
        Kit.plate(c,17,19.4,5,2.2,'steel',778,{rust:1});
        c.fillStyle='#121416';rr(c,18.2,19.8,2.6,1.2,0.1);c.fill();
        Kit.oilStain(c,19,21.9,3,rng(779));
        Kit.stencil(c,16.6,19.0,'КРАНОВЩИК · РАЗБИТ',0.34,'rgba(216,204,178,.45)',0.45);}
    };
    R.extraTop=(c,L,r)=>{
      if(!dead)return;
      /* пролом: чёрный провал с рваными кромками плит и арматурой */
      const g=c.createLinearGradient(0,22,0,25);g.addColorStop(0,'rgba(4,4,5,.92)');g.addColorStop(1,'#000');
      c.fillStyle=g;c.fillRect(2.4,21.98,15,3.1);
      const rr2=rng('pit_edges');
      for(const ex of [2.4,17.4]){const s=ex===2.4?1:-1;
        c.fillStyle=PAT(c,'rust');c.beginPath();c.moveTo(ex,22);
        for(let k=0;k<5;k++)c.lineTo(ex+s*(0.15+rr2()*0.6),22+k*0.55+rr2()*0.3);
        c.lineTo(ex,25);c.closePath();c.fill();
        c.strokeStyle='#6a5340';c.lineWidth=0.06;
        for(let k=0;k<4;k++){const y=22.2+k*0.6;c.beginPath();c.moveTo(ex,y);c.lineTo(ex+s*(0.6+rr2()*1.2),y+0.3+rr2()*0.8);c.stroke();}}
      Kit.hazardTape(c,1.0,21.7,1.4,0.3);Kit.hazardTape(c,17.4,21.7,1.4,0.3);
      Kit.stencil(c,8.4,23.4,'ПРОЛОМ',0.5,'rgba(200,69,47,.6)',0.6);
    };
    R.extraMid=(c,L,r)=>{Kit.pumpUnit(c,5,L.h*0.9,1.8,{seed:71,tag:'КР-1'});
      Kit.pumpUnit(c,31,L.h*0.9,1.8,{seed:73,tag:'КР-2'});};
  }}),
z1_sluice:gs=>({id:'z1_sluice',zone:'sump',name:'СЕВЕРНЫЙ ШЛЮЗ',w:48,h:20,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump},
  build(R){
    const bridge=gs.flags.bridge_out;
    R.solids=[S(-2,-2,52,2.4,'steel'),S(-2,0,2,20,'steel'),S(48,0,2,20,'steel'),
      S(0,10,13,10,'steel'),S(29,10,19,10,'steel')];
    RB.ring(R,18.6,4.6,'top',4.2);RB.ring(R,23.6,4.8,'top',4.4);
    /* мост — 4 звена по 3 м, сложены «гармошкой» у правого края; раскрываются как складной метр */
    if(bridge)R.solids.push(Object.assign(P(13,10,16,0.4,'steel'),{dyn:true,pid:'bridge'}));
    const SEG=4,SL=4,HX=29,HY=10,BT=[[0.55,1.15],[1.3,1.9],[2.05,2.65],[2.8,3.4]];
    const T_=W=>W.anims.bridge?W.anims.bridge.t:(gs.flags.bridge_out?99:0);
    const pose=T=>{const out=[];let ax=HX,ay=HY,ang=0;
      for(let i=0;i<SEG;i++){const u=seg01(T,BT[i][0],BT[i][1]),e=i===0?EZ.bounce(u):EZ.back(u);
        if(i===0)ang=lerp(-PI/2,-PI,e);else ang=ang+lerp(PI,0,e)*(1);
        const bx=ax+Math.cos(ang)*SL,by=ay+Math.sin(ang)*SL;out.push({ax:ax,ay:ay,bx:bx,by:by,ang:ang,u:u});ax=bx;ay=by;}
      return out;};
    R.tick=(dt,W)=>{const a=W.anims.bridge;if(!a||a.done)return;const T=a.t,g=W.game;
      const cue=(at,fn)=>{a.f=a.f||{};if(T>=at&&!a.f[at]){a.f[at]=1;fn();}};
      cue(0.25,()=>{g.audio.tone(80,0.6,'sawtooth',0.03,140);});
      BT.forEach((b,i)=>cue(b[1]-0.05,()=>{const P_=pose(b[1]+0.01)[i];
        g.audio.hitMetal();g.camera.addShake(i===SEG-1?0.55:0.28);
        g.particles.burst(P_.bx,P_.by,12,{kind:'spark',col:'#ffcf7a',spd:5,life:0.45,size:0.05,add:true,g:14});
        g.particles.burst(P_.bx,P_.by,6,{kind:'dust',col:'#8a7a6a',spd:2,life:0.8,size:0.1,g:8});
        /* звено легло — по нему уже можно идти */
        const w=SL*(i+1);let s=R.solids.find(q=>q.pid==='bridge');
        if(!s){s=Object.assign(P(HX-w,HY,w,0.4,'steel'),{dyn:true,pid:'bridge'});R.solids.push(s);}else{s.x=HX-w;s.w=w;}R._edges=null;}));
      if(T>=3.7)a.done=true;
    };
    R.dyn=(c,t,W)=>{const T=T_(W),P_=pose(T);
      for(let i=SEG-1;i>=0;i--){const q=P_[i];const off=(T<BT[i][0]&&i>0)?(i%2?0.12:-0.12)*i:0;
        c.save();c.translate(q.ax,q.ay);c.rotate(q.ang);c.scale(1,-1);c.translate(0,off);
        /* ферма: пояса, раскосы, заклёпки; нижняя грань — по оси шарниров */
        c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0.05,-0.02,SL,0.5);
        c.fillStyle=PAT(c,'steel');c.fillRect(0,-0.06,SL,0.14);c.fillRect(0,0.3,SL,0.12);
        c.strokeStyle='#3a4046';c.lineWidth=0.08;c.beginPath();
        for(let x=0;x<SL-0.05;x+=0.75){c.moveTo(x,0.06);c.lineTo(x+0.75,0.32);c.moveTo(x+0.75,0.06);c.lineTo(x,0.32);}c.stroke();
        c.fillStyle='rgba(255,255,255,.14)';c.fillRect(0,-0.06,SL,0.03);
        for(let x=0.2;x<SL;x+=0.6)Kit.bolt(c,x,0.0,0.04);
        Kit.hazardTape(c,SL-0.35,-0.06,0.35,0.14);
        c.fillStyle='#2b3035';c.beginPath();c.arc(0,0.18,0.16,0,TAU);c.fill();c.fillStyle='#c9a227';c.beginPath();c.arc(0,0.18,0.07,0,TAU);c.fill();
        c.restore();}
      /* перила — только на легших звеньях */
      const n=P_.filter((q,i)=>T>=BT[i][1]).length;if(n)Kit.railing(c,HX-SL*n,HY+0.02,SL*n,0.8,'#4d545a');
    };
    R.hazards=[{x:13,y:18.6,w:16,h:1.4,kind:'pit',back:{x:10.6,y:8.3},backs:[{minX:-9,x:10.6,y:8.3},{minX:21,x:29.8,y:8.3}]}];
    R.doors=[{x:0.0,y:7.9,w:1.2,h:2.1,to:'z1_hub',tx:33.4,ty:16.4,label:'НАСОСНАЯ'},
      {x:40.6,y:7.6,w:1.6,h:2.4,to:'z2_escalator',tx:2.2,ty:20.6,label:'ЖИЛЫЕ СОТЫ',elevator:true},
      RB.R(R,10,'z1_pipes','ТРУБНЫЙ КОЛОДЕЦ')];
    R.signs=[{x:7.2,y:5.0,keys:['R'],text:'ГАРПУН · К РЫМУ',need:'hook',hideFlag:'bridge_out'}];
    R.interactables=[{kind:'lever',x:31,y:10,label:'СКЛАДНОЙ МОСТ',
      plaque:'ФЕРМА · ПОСТОЯННОЕ СОЕДИНЕНИЕ',flag:'bridge_out',sys:'bridge'}];
    if(!gs.loreIds[4])R.interactables.push({kind:'lore',loreId:4,x:35.6,y:10,title:'ЦИЛИНДР №4 · ГРАФИК ЛИФТА 07',
      text:'«ПОСЛЕДНИЙ ПОДЪЁМ ВЫШЕ ЭДЕМА — 214 ЛЕТ НАЗАД. ДАЛЬШЕ ГРАФИК ПУСТ.»'});
    R.enemies.push({type:'lampada',x:21,y:6.5,amb:true},{type:'mokrica',x:36,y:9.38,patrol:[30,44],amb:true});
    R.lights=[lit(4,4,8,'#ffbe63',0.9),lit(13,5,6,'#c8452f',0.7,{flicker:0.8}),
      lit(30,4,9,'#ffbe63',0.9),lit(42,4,7,'#ffbe63',0.8),lit(21,14,10,'#3d6a52',0.5),
      lit(41.4,8.6,4,'#8fd6ff',0.7),lit(1.4,8.6,3,'#8fd6ff',0.4),lit(46.8,8.6,3,'#8fd6ff',0.4)];
    R.emitters=[{type:'wind',rate:26},{type:'steam',x:28,y:9.4,rate:0.4},{type:'dust',rate:12}];
    R.extraGame=(c,L,r)=>{
      const g=c.createLinearGradient(0,2.4,0,20);
      g.addColorStop(0,'#05070a');g.addColorStop(1,'#020304');
      c.fillStyle=g;c.fillRect(13,2.4,16,17);
      for(let i=0;i<70;i++){c.fillStyle='rgba(255,190,99,'+(r()*0.3)+')';
        c.beginPath();c.arc(13+r()*16,3+r()*16,0.05+r()*0.08,0,TAU);c.fill();}
      c.fillStyle='rgba(20,26,30,.9)';
      for(let i=0;i<6;i++)c.fillRect(13.4+i*2.6,4+r()*6,1.2,14);
      Kit.hazardTape(c,11.4,9.6,1.6,0.4);Kit.hazardTape(c,29,9.6,1.6,0.4);
      Kit.stencil(c,8.4,9.2,'КРАЙ · 16 М',0.5,'rgba(230,200,140,.6)',0.6);
      Kit.stencil(c,30.4,9.2,'МОСТ · ПРИВОД',0.44,'rgba(216,204,178,.5)',0.5);
      Kit.plate(c,0,2.4,13,1.0,'steel',301,{rust:0.8});Kit.plate(c,29,2.4,19,1.0,'steel',302,{rust:0.8});
      Kit.craneGirder(c,13,3.0,16,0.9);
      Kit.pipe(c,[[0,1.4],[48,1.4]],0.26,'steel',{seed:31,band:2,bandCol:'#c8452f'});
      Kit.lampCage(c,4,4,0.34);Kit.lampCage(c,30,4,0.34);Kit.lampCage(c,42,4,0.3);
      Kit.sign(c,2.0,5.6,3.8,0.9,'ШЛЮЗ СЕВЕР · ВЫХОД ЗАПРЕЩЁН','#c8452f','#f0e2cf',33);
      Kit.plate(c,39.8,6.6,4.0,4.2,'steel',303,{rust:0.6});
      c.fillStyle='#0e1113';c.fillRect(40.4,7.4,2.8,3.0);
      Kit.hazardTape(c,40.4,7.2,2.8,0.22);
      Kit.stencil(c,39.9,6.4,'ЛИФТ 07 → СОТЫ',0.3,'rgba(216,204,178,.6)',0.6);
      Kit.gauge(c,43.4,9.0,0.24,0.5);
      Kit.plate(c,29.0,9.6,1.6,0.6,'steel',311,{rust:0.8});
      Kit.chain(c,20,2.4,6,0.12);
      for(let i=0;i<4;i++)Kit.oilStain(c,2+r()*44,9.95,1.2+r(),rng(400+i));
    };
    R.extraMid=(c,L,r)=>{
      c.fillStyle='rgba(4,6,8,.9)';c.fillRect(L.w*0.28,L.h*0.4,L.w*0.3,L.h*0.7);
      for(let i=0;i<50;i++){c.fillStyle='rgba(255,190,99,'+(r()*0.25)+')';
        c.beginPath();c.arc(L.w*0.28+r()*L.w*0.3,L.h*0.4+r()*L.h*0.6,0.06+r()*0.09,0,TAU);c.fill();}
      Kit.tank(c,L.w*0.72,L.h*0.2,3,L.h*0.4,{seed:81,label:'Ш-3'});};
  }}),
});
/* ============================== ДРЕНАЖ ХЛАДАГЕНТА ============================== */
/* Урок отскока. Сверху, из подвала, падаешь на площадку. Первый клапан-отбойник — над сухим
   жёлобом: промахнулся — вылез по ступени и пробуй снова. Потом два клапана подряд над
   хладагентом (срыв — ячейка и откат, не смерть). В конце — пластина куртки и люк в Восточный
   коридор: засов на этой стороне, обратно короткой дорогой. */
Object.assign(ROOMDEFS,{
z1_drain:gs=>({id:'z1_drain',zone:'sump',name:'ДРЕНАЖ ХЛАДАГЕНТА',w:44,h:16,
  art:{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump,fgd:Art.fgdSump},
  build(R){
    R.solids=[S(-2,-2,48,2.4,'steel'),S(-2,0,2,16,'steel'),S(44,0,2,16,'steel'),
      S(0,10,8,6,'rust'),S(8,13.6,8,2.4,'concrete'),S(8.2,12.2,1.0,1.4,'ply'),
      S(16,10,4,6,'rust'),S(20,14.4,14,1.6,'steel'),S(34,10,10,6,'rust')];
    /* клапаны стоят по дуге прыжка с разбега: прыжок с края → удар вниз → удар вниз → уступ */
    R.pogos=[{x:13,y:11.3,r:0.45,len:2.3},{x:25,y:11.0,r:0.45,len:3.4},{x:31.8,y:11.0,r:0.45,len:3.4}];
    R.hazards=[{x:20,y:13.0,w:14,h:1.4,kind:'pit',look:'coolant',back:{x:17.6,y:8.32}}];
    R.doors=[{x:2.0,y:1.0,w:2.2,h:1.2,to:'z1_cellar',link:'cellar_hole',label:'ПОДВАЛ',oneway:true},
      {x:40.4,y:7.9,w:1.4,h:2.1,to:'z1_east',link:'drain_up',label:'ВОСТОЧНЫЙ КОРИДОР',latch:'drain_latch',latchHere:true},
      RB.R(R,10,'z1_canal','ОТСТОЙНЫЙ КАНАЛ')];
    R.signs=[{x:4.6,y:6.4,keys:['S','J'],alt:'ЛКМ',text:'НАД КЛАПАНОМ — УДАР ВНИЗ'}];
    R.interactables=gs.flags.got_plate_drain?[]:[{kind:'salvage',upgrade:'plate_drain',x:37.4,y:10,flag:'got_plate_drain',
      title:'ПЛАСТИНА КУРТКИ',
      lines:['НА УСТУПЕ — БРЕЗЕНТОВАЯ КУРТКА ДРЕНАЖНИКА. ХОЗЯИНА НЕТ.','НАГРУДНАЯ ПЛАСТИНА ЦЕЛА. ЗАКЛЁПКИ САДЯТСЯ НА ТВОЮ КУРТКУ.']}];
    R.enemies.push({type:'mokrica',x:39,y:9.38,patrol:[35,42.5],amb:true});
    R.lights=[lit(4,4,7,'#ffbe63',0.8,{flicker:1.1}),lit(27,13.4,12,'#69d68f',1.1),lit(12,13,5,'#8a7a5a',0.5),
      lit(38,4.4,7,'#ffbe63',0.85),lit(41.1,7.6,3.5,'#8fd6ff',0.6),lit(3.1,1.6,3,'#69d68f',0.6)];
    R.emitters=[{type:'coolant',x:27,y:13.1,rate:5,sw:14},{type:'drip',x:12,y:1,rate:0.7},{type:'drip',x:30,y:1,rate:0.5},
      {type:'steam',x:22,y:13,rate:0.4},{type:'dust',rate:14}];
    R.extraGame=(c,L,r)=>{
      Kit.pipe(c,[[0,1.4],[44,1.4]],0.26,'rust',{seed:51,band:2,bandCol:'#69d68f'});
      Kit.pipe(c,[[6,2.4],[38,2.4]],0.16,'steel',{seed:52});
      Kit.lampCage(c,4,4,0.3);Kit.lampCage(c,38,4.4,0.3);
      Kit.stencil(c,9.2,9.4,'ЖЁЛОБ · СУХО',0.32,'rgba(216,204,178,.45)',0.45);
      Kit.stencil(c,21.4,9.0,'ХЛАДАГЕНТ · КАНАЛ 3',0.36,'rgba(150,230,180,.55)',0.55);
      Kit.sign(c,16.2,6.6,3.6,0.8,'ОТБОЙНИКИ · НЕ СТОЯТЬ','#c9a227','#191612',511);
      Kit.hazardTape(c,19.6,9.6,0.6,0.4);Kit.hazardTape(c,33.8,9.6,0.6,0.4);
      Kit.ladder(c,40.6,0.4,7.6,0.55);
      /* куртка дренажника на уступе — откуда пластина */
      if(!gs.flags.got_plate_drain){c.fillStyle='#5a4a36';c.beginPath();c.ellipse(37.4,9.85,0.75,0.2,0.05,0,TAU);c.fill();
        c.fillStyle='#c9a227';rr(c,37.2,9.6,0.42,0.24,0.04);c.fill();}
      /* дыра в своде, откуда свалился */
      c.fillStyle='#050706';c.fillRect(2,0.3,2.2,0.7);Kit.hazardTape(c,1.7,0.9,2.8,0.22);
      for(let i=0;i<6;i++)Kit.oilStain(c,1+r()*42,9.95,1+r(),rng(520+i));
    };
    R.extraMid=(c,L,r)=>{Kit.tank(c,6,2,3,L.h*0.6,{seed:53,label:'ДР-3'});Kit.tank(c,30,1.5,3.4,L.h*0.55,{seed:54,label:'ДР-4'});};
  }})
});
