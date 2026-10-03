"use strict";
/* ============================== ROOMS · Z2 ============================== */
Object.assign(ROOMDEFS,{
z2_escalator:gs=>({id:'z2_escalator',zone:'hives',name:'МЁРТВЫЙ ЭСКАЛАТОР',w:44,h:26,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    R.solids=[S(-2,-2,48,2.4,'concrete'),S(-2,0,2,26,'concrete'),S(44,0,2,26,'concrete'),S(0,23,44,3,'carpet')];
    /* застывшие ступени по 0.5 — проходятся шагом (авто-подъём), без прыжков */
    for(let i=1;i<=31;i++)R.solids.push(S(6+(i-1)*0.9375,23-0.5*i,0.94,0.5,'steel',{step:true}));
    R.solids.push(S(35.06,7.0,8.94,0.6,'concrete'));
    R.doors=[{x:0.0,y:20.9,w:1.2,h:2.1,to:'z1_sluice',label:'ШЛЮЗ',elevator:true},
      {x:4.2,y:20.9,w:1.4,h:2.1,to:'z2_market',label:'РЫНОК'},
      {x:42.4,y:4.9,w:1.4,h:2.1,to:'z2_atrium',label:'СОТЫ-АТРИУМ'}];
    R.checkpoint={x:3,y:23,h:1.7,lit:gs.cp.room==='z2_escalator'};
    R.enemies=gs.flags.esc_clear?[]:[{type:'aristocrat',x:38,y:4.65,patrol:[36,42]}];
    R.clearFlag='esc_clear';
    R.enemies.push({type:'lampada',x:22,y:5,amb:true});
    R.lights=[lit(6,4,8,'#d9a441',0.85),lit(18,4,8,'#d9a441',0.8),lit(30,4,8,'#d9a441',0.85),
      lit(40,5,7,'#d9a441',0.9),lit(1.4,21.6,3,'#d9a441',0.5),lit(43,5.6,3,'#d9a441',0.5),
      lit(14,17,6,'#ffcf8a',0.4),lit(26,11,6,'#ffcf8a',0.4)];
    R.emitters=[{type:'dust',rate:30},{type:'drip',x:12,y:3,rate:1.2}];
    R.extraGame=(c,L,r)=>{
      c.fillStyle='#2a2020';c.beginPath();c.moveTo(5.4,23);c.lineTo(36,7.4);c.lineTo(36,8.6);c.lineTo(6.6,23.6);c.closePath();c.fill();
      c.strokeStyle='#4a3b38';c.lineWidth=0.14;
      c.beginPath();c.moveTo(5.4,21.4);c.lineTo(35.4,6.2);c.stroke();
      c.beginPath();c.moveTo(6.6,24.4);c.lineTo(36.6,9.0);c.stroke();
      Kit.railing(c,35.1,7.0,8.9,0.95,'#4a3b38');
      for(let i=0;i<6;i++)Kit.poster(c,3+i*7,3.2+r(),2.0,2.8,(i*13)|0);
      Kit.stencil(c,4,8.6,'ТИШИНА — ПОРЯДОК',0.7,'rgba(216,164,65,.4)',0.4);
      Kit.stencil(c,36.4,5.6,'ВОПРОСЫ О ПОВЕРХНОСТИ ЗАДАЮТ ОДИН РАЗ',0.3,'rgba(200,69,47,.5)',0.5);
      Kit.stencil(c,24,6.2,'СОТЫ B · ЯРУС 12',0.6,'rgba(216,164,65,.35)',0.35);
      Kit.stencil(c,30,20.2,'НЕ ШУМЕТЬ',0.6,'rgba(200,69,47,.45)',0.45);
      for(let i=0;i<6;i++){const x=4+i*7;
        c.fillStyle='#2a2020';c.fillRect(x-0.05,2.4,0.1,0.6);
        c.fillStyle='#f0c96a';c.beginPath();c.ellipse(x,3.2,0.22,0.32,0,0,TAU);c.fill();
        c.fillStyle='rgba(255,240,190,.6)';c.beginPath();c.ellipse(x-0.06,3.1,0.08,0.14,0,0,TAU);c.fill();}
      for(let i=0;i<160;i++){c.fillStyle='rgba(240,220,170,'+(r()*0.16)+')';
        c.beginPath();c.arc(r()*L.w,r()*L.h,0.03+r()*0.05,0,TAU);c.fill();}
      Kit.furniture(c,10,22.6,'tv',3);Kit.furniture(c,3.6,22.6,'chair',4);
      Kit.oilStain(c,20,22.94,1.6,rng(5));
    };
  }}),
z2_atrium:gs=>({id:'z2_atrium',zone:'hives',name:'СОТЫ-АТРИУМ',w:36,h:44,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    /* три яруса галерей, между ними — угловые лестничные марши (по 2.2–2.4, в прыжок) */
    R.solids=[S(-2,-3,40,3,'concrete'),S(-2,0,2,44,'concrete'),S(36,0,2,44,'concrete'),S(0,41,36,3,'concrete'),
      P(0,35,13,0.4),P(23,35,13,0.4),P(0,26,11,0.4),P(25,26,11,0.4),P(0,17,12,0.4),P(24,17,12,0.4),
      P(11,39,14,0.4),P(12.2,36.8,2.6,0.34),P(21.2,36.8,2.6,0.34),
      P(32.8,32.8,3.2,0.34),P(28.8,30.6,3.2,0.34),P(32.8,28.4,3.2,0.34),
      P(28.8,23.8,3.2,0.34),P(32.8,21.6,3.2,0.34),P(28.8,19.4,3.2,0.34),
      P(4.6,32.8,3.0,0.34),P(0.6,30.6,3.0,0.34),P(4.6,28.4,3.0,0.34),
      P(0.6,23.8,3.0,0.34),P(4.6,21.6,3.0,0.34),P(0.6,19.4,3.0,0.34)];
    R.doors=[{x:0.0,y:32.9,w:1.2,h:2.1,to:'z2_escalator',label:'ЭСКАЛАТОР'},
      {x:10.4,y:32.9,w:1.4,h:2.1,to:'z2_laundry',link:'laundry_sc',label:'ПРАЧЕЧНАЯ',latch:'laundry_latch',msg:'ПРОХОД ЗАВАЛЕН. ЗА ЗАВАЛОМ — ЗАСОВ.'},
      {x:34.6,y:23.9,w:1.4,h:2.1,to:'z2_stairwell',label:'ЛЕСТНИЧНАЯ КЛЕТЬ'},
      {x:34.6,y:14.9,w:1.4,h:2.1,to:'z2_apartment',link:'apt_up',label:'КВАРТИРЫ · ВЕРХ'},
      {x:0.2,y:14.9,w:1.3,h:2.1,to:'z2_post',label:'ГЛАВПОЧТАМТ'},
      /* кв. 14-Б: опечатана Цензурой, из-под двери тянет жёлтой пыльцой — видно задолго до фильтра */
      {x:7.2,y:23.9,w:1.4,h:2.1,to:'z2_overgrown',label:'КВ. 14-Б'}];
    R.checkpoint={x:3.4,y:35,h:1.7,lit:gs.cp.room==='z2_atrium'};
    R.mapPlate={kind:'mapplate',x:6.8,y:35,flag:'map_hives',title:'СХЕМА СОТ'};
    R.station={kind:'station',station:'atrium',x:30.5,y:35,tubeTop:26.5};
    R.enemies=gs.flags.atrium_clear?[]:[{type:'aristocrat',x:27,y:23.65,patrol:[25.5,33.5]}];
    R.clearFlag='atrium_clear';
    R.enemies.push({type:'lampada',x:17.5,y:21,amb:true},{type:'lampada',x:22,y:10,amb:true},{type:'mokrica',x:26,y:34.38,patrol:[24,35],amb:true});
    R.lights=[lit(6,33.4,9,'#d9a441',0.9),lit(29,33.4,9,'#d9a441',0.9),
      lit(5,24.4,8,'#d9a441',0.75,{flicker:1.1}),lit(30,24.4,8,'#d9a441',0.8),
      lit(6,15.6,8,'#d9a441',0.7),lit(29,15.6,8,'#d9a441',0.7,{flicker:0.6}),
      lit(18,40,9,'#d9a441',0.5),lit(1.4,15.6,4,'#c8452f',0.5,{flicker:1.7}),lit(34,30,5,'#ffcf8a',0.45),lit(2,30,5,'#ffcf8a',0.45),
      lit(7.9,25.2,2.8,'#d8e07a',0.55,{flicker:0.9})];
    R.emitters=[{type:'dust',rate:34},{type:'drip',x:14,y:26.4,rate:0.5},{type:'drip',x:24,y:35.4,rate:0.7},
      {type:'pollen',x:7.9,y:25.7,rate:2.4,sw:1.8}];
    R.machines=[{kind:'swayCab',x:16.4,y:6,w:3.4,h:4.0,len:14,amp:0.05}];
    R.extraGame=(c,L,r)=>{
      const real=R.doors;
      for(let tier=0;tier<3;tier++){
        const y=[32.9,23.9,14.9][tier];
        for(let i=0;i<5;i++){
          const xl=0.6+i*2.4,xr=25.4+i*2.2;
          if(!real.some(d=>Math.abs(d.y-y)<0.5&&Math.abs(d.x-xl)<1.8))Kit.doorUnit(c,xl,y,1.3,2.1,(tier*100+i*7+13),{seed:tier*10+i});
          if(!real.some(d=>Math.abs(d.y-y)<0.5&&Math.abs(d.x-xr)<1.8))Kit.doorUnit(c,xr,y,1.3,2.1,(tier*100+i*7+63),{seed:tier*20+i+30});}
        Kit.railing(c,0,y+2.1,13,0.95,'#4a3b38');Kit.railing(c,23,y+2.1,13,0.95,'#4a3b38');}
      for(const s of R.solids)if(s.ow&&s.w<4)Kit.railing(c,s.x,s.y,s.w,0.6,'#4a3b38');
      Kit.cable(c,18.0,0,18.0,6,0.4,0.1,'#2b2119');
      Kit.stencil(c,1.2,31.6,'ЯРУС 12 · СОТЫ B',0.5,'rgba(216,164,65,.35)',0.35);
      Kit.stencil(c,26,22.4,'ЯРУС 13',0.5,'rgba(216,164,65,.3)',0.3);
      Kit.stencil(c,26,13.4,'ЯРУС 14',0.5,'rgba(216,164,65,.3)',0.3);
      Kit.poster(c,16,30.4,1.6,2.2,7);Kit.poster(c,19,30.6,1.4,2.0,8);Kit.poster(c,15,21.4,1.6,2.2,9);
      Kit.furniture(c,8,34.6,'tv',11);Kit.furniture(c,4,34.6,'chair',12);
      Kit.furniture(c,26,34.6,'plant',13);Kit.furniture(c,27,25.6,'table',14);
      Kit.clothesline(c,13,33.0,23,33.4,3);Kit.clothesline(c,11,24.0,25,24.4,4);
      /* кв. 14-Б: сорванная лента Цензуры, жёлтый налёт на пороге, номер */
      const dg=c.createLinearGradient(0,24.4,0,26);dg.addColorStop(0,'rgba(216,224,122,0)');dg.addColorStop(1,'rgba(216,224,122,.35)');
      c.fillStyle=dg;c.fillRect(6.4,24.4,3.0,1.6);
      c.fillStyle='rgba(216,224,122,.4)';c.fillRect(6.2,25.86,3.4,0.14);
      c.save();c.translate(7.0,24.6);c.rotate(0.5);c.fillStyle='#b8402c';c.fillRect(-0.06,-0.1,1.0,0.2);
      c.fillStyle='rgba(240,226,207,.75)';c.font='600 0.13px Oswald';c.fillText('ЦЕНЗУРА',0.08,0.05);c.restore();
      c.save();c.translate(8.8,25.2);c.rotate(-0.9);c.fillStyle='#b8402c';c.fillRect(-0.5,-0.1,0.7,0.2);c.restore();
      Kit.stencil(c,7.3,23.5,'14-Б',0.34,'rgba(216,204,178,.7)',0.7);
      Kit.rubble(c,10,40.0,16,1.0,rng('at1'),'ply');
      Kit.furniture(c,14,40.4,'table',21);Kit.furniture(c,20,40.4,'chair',22);
      for(let i=0;i<14;i++)Kit.poster(c,13+r()*9,2+r()*36,0.9+r()*0.6,1.2+r()*0.6,(i*17)|0);
    };
  }}),
z2_apartment:gs=>({id:'z2_apartment',zone:'hives',name:'ОБРУШЕННАЯ КВАРТИРА',w:46,h:17,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    const got=gs.flags.got_claws;
    R.solids=[S(-2,-2,50,2.6,'concrete'),S(-2,0,2,17,'concrete'),S(46,0,2,17,'concrete'),S(0,13.4,46,3.6,'carpet'),
      S(8,11.6,2.6,1.8,'ply'),
      /* обрушенная плита до потолка, внизу щель 1.2 — только подкат/присед */
      S(19.6,0.6,5.8,11.6,'concrete'),
      /* «камин»: рифлёные грани смотрят внутрь, 3.2 между стенами */
      S(38,2.2,1.2,9.2,'concrete',{grip:'r'}),S(42.4,4.4,3.6,9.0,'concrete',{grip:'l'})];
    R.doors=[{x:0.0,y:11.3,w:1.2,h:2.1,to:'z2_laundry',label:'ПРАЧЕЧНАЯ'},
      {x:44.6,y:2.3,w:1.4,h:2.1,to:'z2_atrium',link:'apt_up',label:'АТРИУМ · ВЕРХ'}];
    R.checkpoint={x:2.6,y:13.4,h:1.7,lit:gs.cp.room==='z2_apartment'};
    R.interactables=[];
    if(!got)R.interactables.push({kind:'salvage',ability:'claws',x:31.4,y:12.8,flag:'got_claws',
      title:'КОШКИ КУРЬЕРА',
      lines:['КУРЬЕР У СТЕНЫ. ФОРМЕННАЯ КУРТКА. ОН ДОШЁЛ ДО КРАЯ И СЕЛ.',
             'НА РЕМНЕ — ЛАТУННЫЕ КОГТИ-КРЮКИ. ЗАЩЁЛКА ПОДАЁТСЯ.',
             'КОШКИ САДЯТСЯ НА КРАГИ. РИФЛЁНАЯ СТЕНА БОЛЬШЕ НЕ СТЕНА.']});
    if(!gs.loreIds[6])R.interactables.push({kind:'lore',loreId:6,x:28.2,y:13.4,title:'ЦИЛИНДР №6 · МАРШРУТНЫЙ ЛИСТ',
      text:'«КУРЬЕР 38. ГРУЗ: КАПСУЛА «ОТ ПЕЧАТИ», ВНУТРИ — СЕМЕНА. ВЕЛЕНО СДАТЬ В ЦЕНЗУРУ. ПРИПИСКА ЧУЖОЙ РУКОЙ: «НЕ ВЕРНУЛСЯ».»'});
    R.enemies.push({type:'mokrica',x:13,y:12.78,patrol:[11,18.5],amb:true},{type:'mokrica',x:29,y:12.78,patrol:[26.5,36.5],amb:true});
    R.lights=[lit(5,4,7,'#d9a441',0.7),lit(16,4,7,'#d9a441',0.75,{flicker:1.4}),
      lit(28,4,7,'#d9a441',0.7),lit(38,3.4,6,'#d9a441',0.8),lit(43,3.0,5,'#d9a441',0.6),lit(1.4,12,3,'#d9a441',0.4),
      lit(40.8,10.4,6,'#ffcf8a',0.6),lit(40.8,6,5,'#d9a441',0.5),lit(22.5,12.8,4,'#ff9c4a',0.7,{flicker:0.7})];
    R.emitters=[{type:'dust',rate:26},{type:'drip',x:22,y:11.4,rate:0.8}];
    R.extraGame=(c,L,r)=>{
      Kit.plate(c,0,10.4,19.6,0.16,'ply',501,{bolts:false});Kit.plate(c,25.4,10.4,12.6,0.16,'ply',502,{bolts:false});
      for(let i=0;i<6;i++){const x=2+i*6.2;if(x>17&&x<26)continue;Kit.doorUnit(c,x,10.6,1.3,2.6,(i*9+201),{seed:i+40});}
      Kit.poster(c,11,8.4,1.8,2.4,31);Kit.poster(c,33,8.6,1.6,2.2,32);
      Kit.furniture(c,5,13.2,'table',51);Kit.furniture(c,6.6,13.2,'chair',52);
      Kit.furniture(c,14,13.2,'tv',53);Kit.furniture(c,17,13.2,'plant',54);
      Kit.furniture(c,34.4,13.2,'cage',55);Kit.furniture(c,36,13.2,'toys',56);
      c.save();c.fillStyle='rgba(210,190,150,.26)';c.fillRect(27.4,8.6,2.6,1.9);
      c.strokeStyle='rgba(200,69,47,.5)';c.lineWidth=0.045;
      for(let i=0;i<7;i++){c.beginPath();c.moveTo(27.6+r()*0.4,8.8+r()*1.4);c.lineTo(27.6+r()*2.2,8.8+r()*1.4);c.stroke();}
      c.restore();
      Kit.stencil(c,27.4,8.4,'МАРШРУТЫ · КУРЬЕР 41',0.24,'rgba(216,164,65,.5)',0.5);
      if(!got){
        c.save();c.translate(31.4,13.2);
        c.fillStyle='#3a2f2a';c.beginPath();c.ellipse(0,-0.22,0.85,0.28,0.1,0,TAU);c.fill();
        c.fillStyle='#4a3a30';rr(c,-0.9,-0.5,0.7,0.42,0.12);c.fill();
        c.fillStyle='#6b5a44';c.beginPath();c.arc(-0.95,-0.62,0.24,0,TAU);c.fill();
        c.fillStyle='#c9a227';c.fillRect(-0.2,-0.12,0.5,0.1);
        c.fillStyle='#e8c96a';c.beginPath();c.arc(0.1,-0.24,0.14,0,TAU);c.fill();
        c.beginPath();c.arc(0.34,-0.24,0.14,0,TAU);c.fill();c.restore();
        Kit.stencil(c,30.2,12.2,'КУРЬЕР 41',0.24,'rgba(216,164,65,.5)',0.5);}
      c.fillStyle='rgba(10,7,7,.55)';c.fillRect(39.2,0.6,3.2,12.8);
      Kit.stencil(c,42.6,3.8,'ВЕРХ · АТРИУМ',0.3,'rgba(216,164,65,.55)',0.55);
      Kit.oilStain(c,12,13.34,1.8,rng(61));
      Kit.lampCage(c,5,4,0.3,{glass:'#e8c07a'});Kit.lampCage(c,16,4,0.3,{glass:'#e8c07a'});
      Kit.lampCage(c,28,4,0.3,{glass:'#e8c07a'});Kit.lampCage(c,38,1.8,0.28,{glass:'#e8c07a'});
      Kit.pipe(c,[[0,2.0],[46,2.0]],0.16,'steel',{seed:62});
    };
    R.extraTop=(c,L,r)=>{
      Kit.crate(c,8,11.6,2.6,1.8,{seed:7});
      Kit.rubble(c,19.6,6.4,5.8,5.2,rng('apt_slab'),'concrete');
      c.save();c.translate(22.5,11.3);c.rotate(-0.06);Kit.craneGirder(c,-3.1,-0.45,6.2,0.9);c.restore();
      Kit.hazardTape(c,19.6,11.9,5.8,0.3);
      Kit.stencil(c,20.0,4.6,'ОБВАЛ',0.6,'rgba(235,220,190,.7)',0.7);
      for(let i=0;i<3;i++){c.fillStyle='rgba(255,170,90,.55)';const x=20.6+i*1.6;
        c.beginPath();c.moveTo(x,12.4);c.lineTo(x+0.5,12.4);c.lineTo(x+0.25,12.75);c.closePath();c.fill();}
    };
  }}),
z2_stairwell:gs=>({id:'z2_stairwell',zone:'hives',name:'ЛЕСТНИЧНАЯ КЛЕТЬ',w:20,h:42,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    /* колодец 24 м: рифлёные стены внутрь, вход снизу под левой стеной, две ниши-упора для отдыха */
    R.solids=[S(-2,-3,24,3,'concrete'),S(-2,0,2,42,'concrete'),S(20,0,2,42,'concrete'),S(0,39,20,3,'concrete'),
      S(7,15,1.2,21.4,'concrete',{grip:'r'}),S(11.4,15,1.2,24,'concrete',{grip:'l'}),
      P(10.4,30,1.0,0.4,'concrete'),P(8.2,23,1.0,0.4,'concrete'),
      P(0,15,20,0.5,'concrete')];
    R.doors=[{x:0.0,y:36.9,w:1.2,h:2.1,to:'z2_atrium',label:'АТРИУМ'},RB.L(15,'z2_roofs','КРЫШИ СОТ'),
      {x:18.6,y:12.9,w:1.4,h:2.1,to:'z2_turbine',label:'ТУРБИННЫЙ ЗАЛ'}];
    R.signs=[{x:4.2,y:30.4,keys:[],text:'КОЛОДЕЦ · ТОЛЬКО ДЛЯ МОНТАЖНИКОВ'}];
    R.checkpoint={x:2.4,y:39,h:1.7,lit:gs.cp.room==='z2_stairwell'};
    R.enemies=gs.flags.stair_clear?[]:[{type:'censor',x:5,y:12.9,patrol:[3,8]},{type:'stamper',x:15,y:12.9,patrol:[13,17]}];
    R.clearFlag='stair_clear';
    R.enemies.push({type:'lampada',x:10,y:6,amb:true});
    R.lights=[lit(3,36,7,'#d9a441',0.7),lit(16,34,6,'#d9a441',0.6),lit(9.8,34,5,'#ffcf8a',0.55),
      lit(9.8,26,5,'#ffcf8a',0.55),lit(9.8,19,5,'#ffcf8a',0.55),lit(9,12,8,'#d9a441',0.85),lit(16,12,6,'#d9a441',0.7),
      lit(9.8,38,4,'#c8452f',0.35)];
    R.emitters=[{type:'dust',rate:26},{type:'drip',x:9.8,y:15.6,rate:0.6}];
    R.extraGame=(c,L,r)=>{
      for(let i=0;i<8;i++)Kit.stencil(c,1.2,37.6-i*3.2,'ЭТАЖ '+(12+i),0.4,'rgba(216,164,65,.34)',0.34);
      for(let i=0;i<34;i++){const x=r()*L.w,y=r()*L.h;
        c.fillStyle='rgba(120,90,70,'+(r()*0.22)+')';c.beginPath();
        c.ellipse(x,y,0.3+r()*0.9,0.2+r()*0.6,r()*3,0,TAU);c.fill();}
      for(let i=0;i<6;i++)Kit.poster(c,13.4+r()*5,18+r()*16,1.1,1.5,(i*13)|0);
      Kit.pipe(c,[[19.2,0],[19.2,42]],0.2,'steel',{seed:71});
      Kit.pipe(c,[[1.6,0],[1.6,36]],0.16,'rust',{seed:72});
      Kit.lampCage(c,3,36,0.28,{glass:'#e8c07a'});Kit.lampCage(c,9,12,0.3,{glass:'#e8c07a'});
      c.fillStyle='rgba(10,8,8,.75)';c.fillRect(8.2,15,3.2,24);
      Kit.stencil(c,8.4,38.2,'КОЛОДЕЦ ↑',0.3,'rgba(216,164,65,.55)',0.55);
      Kit.stencil(c,13,13.6,'ТУРБИНЫ →',0.42,'rgba(216,164,65,.55)',0.55);
      Kit.railing(c,2,15,18,0.9,'#4a3b38');
      Kit.oilStain(c,9,38.9,3,rng(71));
    };
  }}),
z2_turbine:gs=>({id:'z2_turbine',zone:'hives',name:'ТУРБИННЫЙ ЗАЛ',w:54,h:24,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    const vL=gs.flags.valve_l,vR=gs.flags.valve_r,on=vL&&vR;
    /* КЛАПАН I (слева): лестница из настилов → стартовый уступ → пролёт 10 м над паровой шахтой
       (только прыжок+рывок) → уступ клапана. КЛАПАН II (справа): рифлёный колодец → галерея. */
    R.solids=[S(-2,-2,58,3,'concrete'),S(-2,0,2,24,'concrete'),S(54,0,2,24,'concrete'),S(0,21,54,3,'steel'),
      S(0,11.4,4.4,0.8,'steel'),
      P(17.6,18.6,3,0.4),P(14,16.2,3,0.4),P(17.6,13.8,3,0.4),P(14.6,11.4,4.6,0.4),
      S(40.6,1,1.2,17.2,'concrete',{grip:'r'}),S(45,4.6,1.2,13.6,'concrete',{grip:'l'}),
      P(41.8,12.8,1.0,0.4,'concrete'),S(46.2,4.6,7.8,0.6,'steel')];
    R.hazards=[{x:8.4,y:4.4,w:2.0,h:16.6,kind:'steam',per:3.0,off:0,on:0.9}];
    R.doors=[{x:0.0,y:18.9,w:1.2,h:2.1,to:'z2_stairwell',label:'КЛЕТЬ'},RB.R(R,4.6,'z2_censor','ЦЕНЗОРСКАЯ'),
      {x:52.6,y:18.9,w:1.4,h:2.1,to:'z2_boss',label:'ЗАЛ ПРИМАРХА',reqFlag:'turbines_on',
        reqMsg:'ГЕРМОДВЕРЬ · ДАВЛЕНИЕ НА НУЛЕ'}];
    R.interactables=[];
    R.interactables.push({kind:'valve',x:2.2,y:11.4,label:'КЛАПАН I',flag:'valve_l'});
    R.interactables.push({kind:'valve',x:51,y:4.6,label:'КЛАПАН II',flag:'valve_r'});
    R.tick=(dt,W)=>{for(const m of R.machines)if(m.kind==='turbines')m.on=!!gs.flags.turbines_on;};
    R.dyn=(c,t,W)=>{const f=gs.flags,on=!!f.turbines_on;
      for(let k=0;k<2;k++){const ok=k?f.valve_r:f.valve_l,x=48.0+k*2.6;
        c.fillStyle='#1b1712';c.beginPath();c.arc(x,15.9,0.42,0,TAU);c.fill();
        c.fillStyle=ok?'#69d68f':'#c8452f';c.beginPath();c.arc(x,15.9,0.3,0,TAU);c.fill();
        game.renderer.glowAdd(x,15.9,0.7,ok?'#69d68f':'#c8452f',0.35);}
      Kit.sign(c,24.6,9.6,8.2,0.9,on?'ДАВЛЕНИЕ В НОРМЕ':'ДАВЛЕНИЕ НА НУЛЕ',on?'#69d68f':'#c8452f','#12100c',85);
      for(let i=0;i<3;i++)Kit.gauge(c,24+i*6-1.6,16.4,0.3,on?0.82:0.02);
    };
    if(!gs.loreIds[7])R.interactables.push({kind:'lore',loreId:7,x:3.6,y:21,title:'ЦИЛИНДР №7 · ЖУРНАЛ МАШИНИСТА',
      text:'«ЯРУС −41 ПОЛУЧИЛ КАПСУЛУ. ПРИКАЗ СОВЕТА: ДАВЛЕНИЕ НА −41 ПЕРЕКРЫТЬ ДО ОСОБОГО РАСПОРЯЖЕНИЯ. ПЕРЕКРЫЛ. ПРОСТИТЕ.»'});
    R.signs=[{x:7.8,y:6.4,keys:[],text:'КЛАПАН I ◂ ПРОЛЁТ'},
      {x:43.4,y:19.4,keys:[],text:'КЛАПАН II ▴'}];
    R.checkpoint={x:3,y:21,h:1.7,lit:gs.cp.room==='z2_turbine'};
    R.machines=[{kind:'turbines',on:on,xs:[24,30,36],y:21}];
    R.enemies.push({type:'repairer',x:28,y:19.45,patrol:[22,40],amb:true},{type:'lampada',x:33,y:8,amb:true});
    R.lights=[lit(8,6,9,'#d9a441',0.8),lit(22,5,10,'#d9a441',0.85),lit(34,6,9,'#d9a441',0.8),
      lit(2.2,10.4,4.5,'#ff9c4a',0.85),lit(51,3.8,4.5,'#ff9c4a',0.85),lit(16.9,10.6,4,'#ffcf8a',0.6),
      lit(30,20.4,9,on?'#ffe0a0':'#8a6d3b',on?0.9:0.4),lit(43.4,15,5,'#ffcf8a',0.5),lit(48,19.6,5,'#d9a441',0.6),
      lit(9.4,20,4,'#e8f0f6',0.4)];
    R.emitters=[{type:'dust',rate:22},{type:'steam',x:28,y:20.4,rate:0.5},{type:'steam',x:9.4,y:20.6,rate:0.6}];
    R.extraGame=(c,L,r)=>{
      for(let i=0;i<3;i++){
        const x=24+i*6,y=21;
        const g=c.createLinearGradient(x-2.6,0,x+2.6,0);
        g.addColorStop(0,'#4a3a18');g.addColorStop(.3,'#b08d3e');g.addColorStop(.5,'#d8b45c');g.addColorStop(1,'#3a2e12');
        c.fillStyle=g;rr(c,x-2.6,y-5.4,5.2,5.4,0.6);c.fill();
        c.save();rr(c,x-2.6,y-5.4,5.2,5.4,0.6);c.clip();
        c.fillStyle=PAT(c,'rust');c.globalAlpha=0.22;c.fillRect(x-2.6,y-5.4,5.2,5.4);c.restore();
        c.fillStyle='#2a2118';c.beginPath();c.ellipse(x,y-2.7,1.5,1.5,0,0,TAU);c.fill();
        c.strokeStyle='#8a6d2a';c.lineWidth=0.16;c.beginPath();c.arc(x,y-2.7,1.5,0,TAU);c.stroke();
        for(let k=0;k<10;k++){const a=k/10*TAU;Kit.bolt(c,x+Math.cos(a)*1.7,y-2.7+Math.sin(a)*1.7,0.07);}
        Kit.stencil(c,x-0.8,y-0.5,'Т-'+(i+1),0.4,'rgba(230,210,160,.5)',0.5);
        Kit.pipe(c,[[x,y-5.4],[x,y-7.2],[x+3.0,y-7.2]],0.3,'steel',{seed:i+80});}
      /* паровая шахта под пролётом */
      c.fillStyle='#141012';c.fillRect(8.0,20.4,2.8,0.6);Kit.hazardTape(c,7.6,20.6,3.6,0.3);
      Kit.stencil(c,6.8,4.0,'ПАР · ПРОРЫВ',0.34,'rgba(200,69,47,.6)',0.6);
      Kit.lampCage(c,8,6,0.34,{glass:'#e8c07a'});Kit.lampCage(c,22,5,0.38,{glass:'#e8c07a'});
      Kit.lampCage(c,34,6,0.34,{glass:'#e8c07a'});
      Kit.pipe(c,[[0,2.4],[40,2.4]],0.24,'steel',{seed:81,band:4,bandCol:'#8a6d3b'});
      Kit.pipe(c,[[2.2,2.6],[2.2,10.6]],0.2,'steel',{seed:82});Kit.pipe(c,[[51,1.6],[51,3.8]],0.2,'steel',{seed:83});
      Kit.railing(c,0,11.4,4.4,0.9,'#4a3b38');Kit.railing(c,46.2,4.6,7.8,0.9,'#4a3b38');
      c.fillStyle='rgba(10,8,8,.6)';c.fillRect(41.8,1,3.2,17.2);
      /* табло давления у гермодвери: две лампы = два клапана */
      Kit.plate(c,46.6,14.2,6.0,3.0,'steel',84,{rust:0.4});
      Kit.stencil(c,47.0,14.9,'ГЕРМОДВЕРЬ · ДАВЛЕНИЕ',0.3,'rgba(230,215,180,.75)',0.75);
      for(let k=0;k<2;k++)Kit.stencil(c,48.0+k*2.6-0.36,17.0,k?'II':'I',0.36,'rgba(230,215,180,.75)',0.75);
      for(let i=0;i<6;i++)Kit.oilStain(c,12+r()*30,20.94,1.4+r(),rng(80+i));
    };
  }}),
z2_boss:gs=>({id:'z2_boss',zone:'hives',name:'ЗАЛ ЦЕНЗОРА-ПРИМАРХА',w:60,h:22,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    const dead=gs.bosses.primarch;
    /* зал заседаний цензуры: пустой паркетный пол 60 м — прятаться не за что.
       По краям — две ложи для публики (низкие, с них видно всё), под сводом — крюки люстр. */
    R.solids=[S(-2,-3,64,3,'concrete'),S(-2,0,2,22,'concrete'),S(60,0,2,22,'concrete'),S(0,18,60,4,'steel'),
      P(2.6,15.6,5.2,0.4,'brass'),P(52.2,15.6,5.2,0.4,'brass')];
    RB.ring(R,21,8.6,'top',8.6);RB.ring(R,39,8.6,'top',8.6);
    R.vents=[15,30,45];
    /* сопла в полу: в фазе II ими управляет сам Примарх (ctl) */
    if(!dead)R.hazards=R.vents.map(x=>({x:x-1.4,y:12.2,w:2.8,h:5.8,kind:'steam',ctl:'primarch'}));
    R.boss=dead?null:{type:'primarch',x:38,y:18-4.25};
    R.bossTrigger={x:5,y:10,w:50,h:8};
    R.bossDoor={x:0.0,y:15.9,w:1.4,h:2.1,active:!dead};
    R.doors=[{x:0.0,y:15.9,w:1.2,h:2.1,to:'z2_turbine',label:'ТУРБИНЫ'},
      {x:58.8,y:15.9,w:1.2,h:2.1,to:'z2_quiet',label:'КАБИНЕТ ПРИМАРХА',
        reqFlag:'boss2_dead',reqMsg:'ЗАПЕРТО. ПРИМАРХ ДЕРЖИТ ДАВЛЕНИЕ НА СЕБЕ.'}];
    R.lights=[lit(6,5,10,'#d9a441',0.85),lit(21,4,11,'#d9a441',0.9),lit(39,4,11,'#d9a441',0.9),lit(54,5,10,'#d9a441',0.85),
      lit(15,16,4,'#ff9c4a',0.45,{flicker:1.2}),lit(30,16,4,'#ff9c4a',0.45,{flicker:0.9}),lit(45,16,4,'#ff9c4a',0.45,{flicker:1.1}),
      lit(1.4,16.6,3,'#d9a441',0.5),lit(58.6,16.6,3,'#d9a441',0.5),lit(30,17,10,'#ffcf8a',0.45)];
    R.emitters=[{type:'dust',rate:26},{type:'steam',x:15,y:17.6,rate:0.2},{type:'steam',x:30,y:17.6,rate:0.2},{type:'steam',x:45,y:17.6,rate:0.2}];
    R.interactables=[];
    if(dead&&!gs.flags.got_filter)R.interactables.push({kind:'salvage',ability:'filter',x:30,y:17.4,flag:'got_filter',
      title:'СКАФАНДР MK-II',
      lines:['СМОТРОВОЙ КУПОЛ ТРЕСНУЛ. ШЛЕМ СНИМАЕТСЯ, КАК КРЫШКА.',
             'ПОД НИМ — ФИЛЬТР ЗАМКНУТОГО ЦИКЛА. ЕЩЁ ТЁПЛЫЙ.',
             'РЕЗИНА САДИТСЯ НА ГОРЛОВИНУ КУРТКИ. ПЫЛЬЦА ТЕПЕРЬ НЕ СТРАШНА.']});
    R.extraTop=(c,L,r)=>{
      /* ложи: латунные перила и бархат */
      for(const x0 of [2.6,52.2]){c.fillStyle='#3a1418';c.fillRect(x0,16.0,5.2,0.5);
        c.strokeStyle='#b08d3e';c.lineWidth=0.08;c.beginPath();c.moveTo(x0,14.7);c.lineTo(x0+5.2,14.7);c.stroke();
        for(let i=0;i<=8;i++){const x=x0+i*0.65;c.beginPath();c.moveTo(x,14.7);c.lineTo(x,15.6);c.stroke();}}
    };
    R.extraGame=(c,L,r)=>{
      Kit.plate(c,0,15.0,60,0.2,'ply',601,{bolts:false});
      for(let i=0;i<15;i++)if(i!==0&&i!==14)Kit.doorUnit(c,2+i*3.9,15.2,1.4,2.6,(i*13+701),{seed:i+80});
      Kit.poster(c,9,11.6,2.0,2.8,91);Kit.poster(c,49,11.8,1.8,2.4,92);Kit.poster(c,27,10.8,2.2,3,93);
      Kit.stencil(c,19,10.4,'ЦЕНЗУРА · ПОРЯДОК · ТИШИНА',0.6,'rgba(216,164,65,.4)',0.4);
      Kit.lampCage(c,6,5,0.36,{glass:'#e8c07a'});Kit.lampCage(c,54,5,0.36,{glass:'#e8c07a'});
      /* люстры на крюках — за них можно зацепиться */
      for(const x of [21,39]){c.strokeStyle='#2a2118';c.lineWidth=0.08;c.beginPath();c.moveTo(x,0);c.lineTo(x,8.2);c.stroke();
        Kit.lampCage(c,x,4,0.42,{glass:'#e8c07a'});}
      Kit.pipe(c,[[0,2.6],[60,2.6]],0.22,'steel',{seed:93});
      /* решётки сопел в паркете */
      for(const x of R.vents){c.fillStyle='#141012';c.fillRect(x-1.4,17.7,2.8,0.3);
        c.strokeStyle='#5a4a30';c.lineWidth=0.06;for(let k=0;k<7;k++){c.beginPath();c.moveTo(x-1.2+k*0.4,17.72);c.lineTo(x-1.2+k*0.4,17.98);c.stroke();}}
      for(let i=0;i<8;i++)Kit.oilStain(c,3+r()*54,17.94,1.4+r(),rng(900+i));
      Kit.hazardTape(c,57.6,17.6,2.4,0.3);
      if(dead){Kit.rubble(c,27,17.2,7,0.9,rng(902),'steel');
        Kit.oilStain(c,30,17.9,3,rng(903));
        Kit.stencil(c,27.4,16.4,'ПРИМАРХ · ОСТАНОВЛЕН',0.34,'rgba(216,164,65,.45)',0.45);}
    };
  }}),
});
/* ============================== ГЛАВПОЧТАМТ ============================== */
/* Вход — бывшая «пневмотруба» атриума. Справа — приёмный зал с конторкой почтмейстера (тихо, чекпоинт).
   Посередине — сортировочный провал 28 м: капсулы падали в жёлоба. Под сводом — магнитный рельс
   капсульной тележки: на ту сторону — только на подковах (латунные клёпки видны с порога).
   Слева — главный клапан пневмосети и станция ГЛАВПОЧТАМТ. */
Object.assign(ROOMDEFS,{
z2_post:gs=>({id:'z2_post',zone:'hives',name:'ГЛАВПОЧТАМТ · СОРТИРОВОЧНАЯ',w:48,h:26,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    const on=!!gs.flags.post_on;
    R.solids=[S(-2,-3,52,3.4,'concrete'),S(-2,0,2,26,'concrete'),S(48,0,2,26,'concrete'),
      S(36,20,12,6,'concrete'),S(0,16,8,10,'concrete'),S(8,25,28,1,'steel')];
    R.magnetRects=[{x:7,y:12.4,w:31,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    R.hazards=[{x:8,y:23.6,w:28,h:1.4,kind:'pit',back:{x:37.4,y:18.32}}];
    R.doors=[{x:46.8,y:17.9,w:1.2,h:2.1,to:'z2_atrium',label:'АТРИУМ'}];
    R.checkpoint={x:38.2,y:20,h:1.7,lit:gs.cp.room==='z2_post'};
    const pmHere=HubNPC.room(gs,'pm')==='z2_post';
    R.interactables=[...(pmHere?[{kind:'postmaster',x:41.6,y:20,w:2.4,h:2.4}]:[]),
      /* главный клапан — у конторки: почтмейстер открывает его при первой встрече (или курьер — сам) */
      {kind:'valve',post:true,x:44.8,y:20,label:'ГЛАВНЫЙ КЛАПАН ПНЕВМОСЕТИ',flag:'post_on'},
      {kind:'station',station:'post',x:36.9,y:20,tubeTop:0.4}];
    R.lights=[lit(41.5,15.5,9,'#d9a441',0.95),lit(42.4,17.6,3.2,'#9fe08a',0.7),lit(22,6,12,'#d9a441',0.55,{flicker:0.4}),
      lit(4,12,7,on?'#69d68f':'#c8452f',0.7,{flicker:on?0:0.8}),lit(22,23,10,'#3a2a26',0.6),lit(46,18.6,3,'#d9a441',0.5)];
    R.emitters=[{type:'dust',rate:24},{type:'drip',x:30,y:11.8,rate:0.6},{type:'drip',x:12,y:11.8,rate:0.4}];
    const TUBES=[10.5,16.5,22.5,28.5,34.5];
    R.dyn=(c,t,W)=>{
      /* капсулы в трубах: при живой сети — летят вниз в жёлоба, при мёртвой — висят застрявшие */
      for(let i=0;i<TUBES.length;i++){const x=TUBES[i];
        if(on){for(let k=0;k<2;k++){const u=((t*0.55+i*0.31+k*0.5)%1),y=lerp(0.6,22.4,u);
          c.fillStyle='#c9a227';rr(c,x-0.17,y-0.32,0.34,0.64,0.13);c.fill();
          c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x-0.11,y-0.26,0.05,0.52);}}
        else{const y=6+((i*37)%9);c.fillStyle='#7d6120';rr(c,x-0.17,y-0.32,0.34,0.64,0.13);c.fill();}}
    };
    if(pmHere)R.npcs=[{bounds:()=>({x:39.2,y:15.6,w:4.8,h:4.6}),draw:(c,t)=>{
      const W=game.world,p=W.player,near=p&&Math.abs(p.cx-41.6)<4.5;
      drawPostmaster(c,41.6,18.8,t,near?(p.cx<41.6?-1:1):0);}}];
    R.extraGame=(c,L,r)=>{
      /* стеллаж сортировки за конторкой: ячейки с письмами */
      Kit.plate(c,37,8.6,10.4,6.4,'ply',1201,{bolts:false});
      for(let j=0;j<5;j++)for(let i=0;i<8;i++){const x=37.3+i*1.26,y=8.9+j*1.2;
        c.fillStyle='#16110d';c.fillRect(x,y,1.1,1.0);
        if(((i*7+j*3)%4)!==0){c.fillStyle=((i+j)%3)?'#d8cdb8':'#c9b48a';c.fillRect(x+0.12,y+0.5,0.86,0.42);
          c.fillStyle='rgba(200,69,47,.6)';c.fillRect(x+0.5,y+0.62,0.12,0.1);}}
      Kit.stencil(c,37.2,8.2,'СОРТИРОВКА · ЯРУСЫ −41 … +12',0.3,'rgba(216,164,65,.6)',0.6);
      /* трубы пневмопочты от свода в жёлоба */
      for(const x of TUBES){c.fillStyle='rgba(150,190,210,.09)';c.fillRect(x-0.24,0.4,0.48,22.6);
        c.strokeStyle='rgba(200,225,235,.3)';c.lineWidth=0.05;c.beginPath();c.moveTo(x-0.24,0.4);c.lineTo(x-0.24,23);
        c.moveTo(x+0.24,0.4);c.lineTo(x+0.24,23);c.stroke();
        for(let y=1.2;y<23;y+=2.2){c.fillStyle='#8a6d2a';c.fillRect(x-0.32,y,0.64,0.14);}
        c.fillStyle='#2b2620';c.beginPath();c.moveTo(x-1.2,23.6);c.lineTo(x+1.2,23.6);c.lineTo(x+0.4,25);c.lineTo(x-0.4,25);c.closePath();c.fill();}
      Kit.stencil(c,9,22.2,'ЖЁЛОБ',0.34,'rgba(216,164,65,.4)',0.4);
      /* схема магистрали над клапаном */
      Kit.plate(c,0.6,3.2,6.6,4.4,'steel',1202,{rust:0.3,bolts:true});
      c.fillStyle='#16324a';c.fillRect(0.9,3.5,6,3.8);
      c.strokeStyle='rgba(220,240,255,.7)';c.lineWidth=0.06;c.beginPath();
      c.moveTo(1.4,6.8);c.lineTo(3.0,5.6);c.lineTo(4.4,5.6);c.lineTo(5.6,4.2);c.lineTo(6.4,3.9);c.moveTo(3.0,5.6);c.lineTo(3.0,6.9);c.stroke();
      for(const q of [[1.4,6.8],[3.0,5.6],[4.4,5.6],[5.6,4.2],[6.4,3.9],[3.0,6.9]]){c.fillStyle='#ffcf7a';c.beginPath();c.arc(q[0],q[1],0.09,0,TAU);c.fill();}
      Kit.stencil(c,0.9,3.2,'МАГИСТРАЛЬ · ВСЕ ЯРУСЫ',0.24,'rgba(216,164,65,.6)',0.6);
      Kit.poster(c,24.6,2.2,2.2,3.0,301);
      Kit.stencil(c,12,10.6,'КАПСУЛЬНАЯ ТЕЛЕЖКА · РЕЛЬС ПОД СВОДОМ',0.32,'rgba(216,164,65,.45)',0.45);
      Kit.sign(c,30.2,3.0,5.6,0.9,'ПОЧТА — НЕРВЫ АРКОЛОГИИ','#c9a227','#191612',1203);
      Kit.sign(c,13.0,3.0,7.4,0.9,'ПЕРЕПИСКА МЕЖДУ ЯРУСАМИ ПРЕКРАЩЕНА · СОВЕТ','#c8452f','#f0e2cf',1204);
      Kit.hazardTape(c,34.4,19.6,1.6,0.4);Kit.hazardTape(c,8,15.6,1.4,0.4);
      /* мешки и письма на полу приёмного зала */
      for(let i=0;i<5;i++){const x=44+i*0.7;c.fillStyle=i%2?'#5a4a36':'#6b5a44';
        c.beginPath();c.ellipse(x,19.65,0.42,0.38,0,PI,TAU);c.fill();c.fillRect(x-0.42,19.6,0.84,0.4);}
      for(let i=0;i<18;i++){c.save();c.translate(36.6+r()*11,19.92);c.rotate((r()-0.5)*0.8);
        c.fillStyle=r()<0.5?'#d8cdb8':'#c9b48a';c.fillRect(-0.18,-0.06,0.36,0.12);c.restore();}
      Kit.lampCage(c,22,1.4,0.34,{glass:'#e8c07a'});Kit.lampCage(c,41.5,1.2,0.34,{glass:'#e8c07a'});
      Kit.pipe(c,[[0,1.8],[48,1.8]],0.2,'steel',{seed:1205});
    };
    R.extraTop=(c,L,r)=>{
      for(const m of R.magnetRects){Kit.plate(c,m.x,m.y,m.w,m.h,'steel',1206,{rust:0.3,boltStep:0.9});
        Kit.magnetRivets(c,m.x,m.y+m.h-0.5,m.w);}
    };
    /* левая площадка: туда — только по магнитной траверсе */
    RB.stash(R,gs,{id:'s_post',x:3,y:16,title:'КАПСУЛА БЕЗ АДРЕСА',text:'ЛЕДЕНЕЦ В ФАНТИКЕ: «ПОЧТМЕЙСТЕРУ — ОТ ДЕТЕЙ ЯРУСА −38».'});
  }})
});
/* ============================== КВАРТИРА 14-Б ============================== */
/* Тайник за опечатанной дверью 2-го яруса атриума. Курьер 38 не сдал капсулу «ОТ ПЕЧАТИ» Цензуре —
   принёс матери. Семена взошли без лампы и затянули квартиру пыльцой: без фильтра дальше прихожей
   не пройти (жёлтую дымку видно из атриума задолго до фильтра). Под рухнувшим шкафом — лаз,
   посередине — продувочный стояк (фильтр восполняется), в саду — цилиндр №5 и кассета фильтра на полке. */
Object.assign(ROOMDEFS,{
z2_overgrown:gs=>({id:'z2_overgrown',zone:'hives',name:'КВАРТИРА 14-Б',w:34,h:14,
  art:{bg:Art.bgHives,mid:Art.midHives,game:Art.gameHives},
  build(R){
    const got=!!gs.flags.got_filter_cap;
    R.solids=[S(-2,-2,38,2.4,'concrete'),S(-2,0,2,14,'concrete'),S(34,0,2,14,'concrete'),S(0,12,34,2,'carpet'),
      /* обвал перекрытия и упавший шкаф: под ним лаз 1.2 м — ползком или подкатом */
      S(22.8,0.4,3.4,8.8,'concrete'),S(22.2,9.2,4.6,1.6,'ply'),
      /* корни подняли плиту пола; по лозе на лопнувшей трубе — к полке с кассетами */
      S(2.8,10.8,7.4,1.2,'concrete'),P(4.4,8.5,2.8,0.34),S(0,6.1,3.4,0.5,'ply')];
    R.pollen=[{x:0.4,y:0.4,w:27.6,h:11.6}];
    R.air=[{x:13,y:0.4,w:2,h:11.6}];
    R.amb=[98,92,64];
    R.doors=[{x:32.8,y:9.9,w:1.2,h:2.1,to:'z2_atrium',label:'АТРИУМ'}];
    R.interactables=[];
    if(!got)R.interactables.push({kind:'salvage',upgrade:'filter_cap',x:1.7,y:6.1,flag:'got_filter_cap',title:'КАССЕТА ФИЛЬТРА',
      lines:['НА ВЕРХНЕЙ ПОЛКЕ, ПОДАЛЬШЕ ОТ КОРНЕЙ, — ЯЩИК С КАССЕТАМИ. ОНА УХАЖИВАЛА ЗА САДОМ В ФИЛЬТРЕ.',
             'ОДНА КАССЕТА ЕЩЁ В ПЛОМБЕ. ВСТАЁТ В ПАЗ MK-II С ЩЕЛЧКОМ. ДЫШАТЬ ПЫЛЬЦОЙ МОЖНО ДОЛЬШЕ.']});
    if(!gs.loreIds[5])R.interactables.push({kind:'lore',loreId:5,x:11.6,y:12,title:'ЦИЛИНДР №5 · КВАРТИРА 14-Б',
      text:'«СЫН НЕ СДАЛ КАПСУЛУ ЦЕНЗУРЕ — ПРИНЁС МНЕ. СЕМЕНА ВЗОШЛИ ЗА ТРИ ДНЯ, БЕЗ ЛАМПЫ, И ТЯНУТСЯ ВВЕРХ, К ПЕЧАТИ. СЫНА ЗАБРАЛИ. ЦВЕТЫ Я ИМ НЕ ОТДАМ.»'});
    R.lights=[lit(31,7.6,6,'#d9a441',0.7),lit(30.2,11.4,3,'#ffcf8a',0.4),lit(18.4,5.4,7,'#c8b060',0.45,{flicker:1.3}),
      lit(14,5,6,'#cfeaff',0.75),lit(14,11,3.5,'#cfeaff',0.5),
      lit(6.8,2.6,9,'#e8e07a',0.95),lit(4.4,9.6,5,'#d8e07a',0.5),lit(1.7,4.8,3,'#ffcf7a',0.45)];
    R.emitters=[{type:'dust',rate:12},{type:'pollen',x:6.8,y:3,rate:12,sw:7},{type:'pollen',x:18,y:7,rate:6,sw:8},
      {type:'pollen',x:27.4,y:11.4,rate:3,sw:1.2},{type:'airjet',x:14,y:11.8,rate:10},{type:'leaf',x:6.8,y:1.2,rate:0.7,sw:7},
      {type:'drip',x:24.4,y:0.6,rate:0.5}];
    /* головки цветков под трещиной в своде: покачиваются, светятся сами — «растут не под лампой» */
    const HEADS=[[5.6,2.2,0.9,0.0],[7.6,1.6,1.1,1.7],[9.2,3.0,0.8,3.1]];
    R.dyn=(c,t,W)=>{
      for(const [hx,hy,hr,ph] of HEADS){const sw=Math.sin(t*0.7+ph)*0.12,x=hx+sw,y=hy+Math.cos(t*0.5+ph)*0.05;
        c.save();c.translate(x,y);c.rotate(sw*0.6);
        for(let i=0;i<14;i++){const a=i/14*TAU+ph;
          c.fillStyle=i%2?'#e9e2a0':'#d8cf7c';c.beginPath();
          c.ellipse(Math.cos(a)*hr*0.62,Math.sin(a)*hr*0.62,hr*0.42,hr*0.15,a,0,TAU);c.fill();}
        const g=c.createRadialGradient(0,0,0,0,0,hr*0.42);g.addColorStop(0,'#6b5a2a');g.addColorStop(0.7,'#4a3d1c');g.addColorStop(1,'#8a7a3a');
        c.fillStyle=g;c.beginPath();c.arc(0,0,hr*0.42,0,TAU);c.fill();
        c.fillStyle='rgba(255,246,170,.55)';for(let k=0;k<9;k++){const a=k*2.4+ph,rr2=hr*0.3*Math.sqrt((k+1)/9);
          c.fillRect(Math.cos(a)*rr2-0.03,Math.sin(a)*rr2-0.03,0.06,0.06);}
        c.restore();
        game.renderer.glowAdd(x,y,hr*2.2,'#efe58a',0.3+0.1*Math.sin(t*1.3+ph));}
    };
    R.extraGame=(c,L,r)=>{
      /* обои ячейки: выцветший ромб, потёки; ближе к саду — лоза поверх всего */
      c.fillStyle='rgba(62,46,38,.84)';c.fillRect(0,0.4,34,11.6);
      c.strokeStyle='rgba(190,160,120,.13)';c.lineWidth=0.04;
      for(let x=0;x<34;x+=1.2)for(let y=1;y<12;y+=1.2){c.beginPath();c.moveTo(x,y-0.4);c.lineTo(x+0.4,y);c.lineTo(x,y+0.4);c.lineTo(x-0.4,y);c.closePath();c.stroke();}
      for(let i=0;i<14;i++){const x=r()*34;c.fillStyle='rgba(40,30,22,'+(0.1+r()*0.15)+')';c.fillRect(x,0.4,0.1+r()*0.2,2+r()*5);}
      c.fillStyle='rgba(30,22,16,.6)';c.fillRect(0,11.4,34,0.6);
      /* нарисованное окно в гостиной: небо, которого никто не видел */
      Kit.plate(c,16.4,2.6,4.4,3.0,'ply',1301,{bolts:false});
      const sk=c.createLinearGradient(0,2.8,0,5.4);sk.addColorStop(0,'#6f8ea6');sk.addColorStop(1,'#d8c89a');
      c.fillStyle=sk;c.fillRect(16.6,2.8,4.0,2.6);
      c.fillStyle='rgba(255,240,200,.8)';c.beginPath();c.arc(19.6,3.6,0.32,0,TAU);c.fill();
      c.fillStyle='#4a5a3a';c.beginPath();c.moveTo(16.6,5.4);c.quadraticCurveTo(17.6,4.4,18.6,5.0);c.quadraticCurveTo(19.6,4.6,20.6,5.2);c.lineTo(20.6,5.4);c.closePath();c.fill();
      c.fillStyle='#3a2c22';c.fillRect(18.55,2.8,0.1,2.6);c.fillRect(16.6,4.05,4.0,0.1);
      Kit.stencil(c,16.5,6.2,'«ОКНО» · ЗАКАЗ ЖИЛЬЦОВ',0.22,'rgba(216,204,178,.35)',0.35);
      /* прихожая: вешалка с форменной фуражкой, рамка с фото курьера, обувь */
      c.fillStyle='#3a2c22';c.fillRect(29.4,7.0,0.12,5.0);c.fillRect(28.9,7.0,1.1,0.1);
      c.fillStyle='#2b3a4a';c.beginPath();c.ellipse(29.46,7.0,0.42,0.14,0,PI,TAU);c.fill();c.fillRect(29.0,6.98,0.92,0.08);
      c.fillStyle='#c9a227';c.fillRect(29.36,6.82,0.2,0.08);
      c.fillStyle='#4a3a2c';rr(c,30.8,5.4,1.2,1.5,0.06);c.fill();c.fillStyle='#8a7d68';c.fillRect(30.92,5.52,0.96,1.26);
      c.fillStyle='#3a3230';c.beginPath();c.arc(31.4,5.95,0.2,0,TAU);c.fill();c.fillRect(31.12,6.12,0.56,0.66);
      c.fillStyle='#2b3a4a';c.fillRect(31.16,5.72,0.48,0.1);
      c.fillStyle='rgba(20,14,10,.8)';c.fillRect(31.0,6.86,0.8,0.04);
      for(let i=0;i<3;i++){c.fillStyle='#2a2220';c.beginPath();c.ellipse(28.8+i*0.5,11.92,0.22,0.09,0,PI,TAU);c.fill();}
      Kit.stencil(c,30.4,4.6,'14-Б',0.4,'rgba(216,204,178,.6)',0.6);
      /* гостиная: диван, телевизор, стол под лозой */
      c.fillStyle='#5a3a34';rr(c,15.6,10.6,3.6,1.4,0.2);c.fill();c.fillStyle='#6b4840';rr(c,15.4,10.0,0.6,2.0,0.2);c.fill();rr(c,18.8,10.0,0.6,2.0,0.2);c.fill();
      c.fillStyle='#4a302a';rr(c,15.9,9.4,3.0,1.4,0.2);c.fill();
      Kit.furniture(c,21.0,11.8,'tv',1302);Kit.furniture(c,20.4,11.8,'plant',1303);
      /* стояк продувки: решётки в полу и под сводом */
      c.fillStyle='rgba(12,14,16,.75)';c.fillRect(13,0.4,2,11.6);
      Kit.vent(c,13.1,0.5,1.8,0.9);Kit.vent(c,13.1,11.1,1.8,0.8);
      Kit.stencil(c,12.6,1.9,'СТОЯК · ПРОДУВКА',0.24,'rgba(150,180,200,.7)',0.7);
      /* сад: корни через пол, разбитый цветочный ящик, кресло с шалью, лейка */
      c.strokeStyle='#5c4a32';c.lineCap='round';
      for(let i=0;i<9;i++){const x0=6.6+(r()-0.5)*1.2;c.lineWidth=0.08+r()*0.14;c.beginPath();c.moveTo(x0,10.6);
        c.quadraticCurveTo(x0+(r()-0.5)*5,11.4+r()*0.4,x0+(r()-0.5)*9,12.0);c.stroke();}
      c.fillStyle='#6b4a30';c.save();c.translate(6.4,10.7);c.rotate(-0.12);c.fillRect(-1.6,-0.5,3.2,0.5);c.restore();
      c.fillStyle='#3a2a1c';c.fillRect(5.2,10.25,2.6,0.12);
      c.fillStyle='#5a4636';rr(c,10.2,10.4,1.4,1.6,0.25);c.fill();c.fillStyle='#6b5240';rr(c,10.0,9.8,0.5,2.2,0.2);c.fill();
      c.fillStyle='rgba(184,160,110,.8)';c.beginPath();c.moveTo(10.1,9.9);c.quadraticCurveTo(10.9,10.6,11.5,10.3);c.lineTo(11.4,11.0);c.quadraticCurveTo(10.7,11.2,10.1,10.7);c.closePath();c.fill();
      c.fillStyle='#7a8087';c.beginPath();c.ellipse(12.4,11.8,0.32,0.22,0,0,TAU);c.fill();c.fillRect(12.6,11.5,0.4,0.08);
      /* стебли — от корней к трещине в своде */
      for(const [x1,y1,w] of [[5.6,2.2,0.2],[7.6,1.6,0.26],[9.2,3.0,0.18]]){c.strokeStyle='#4a6438';c.lineWidth=w;
        c.beginPath();c.moveTo(6.6,10.6);c.bezierCurveTo(6.6+(x1-6.6)*0.2-0.8,7.2,x1+0.6,5.0,x1,y1+0.3);c.stroke();}
      for(let i=0;i<10;i++){const y=3+r()*7,x=5.6+r()*2.6,a=(r()<0.5?-1:1)*(0.6+r()*0.6);
        c.save();c.translate(x,y);c.rotate(a);c.fillStyle=r()<0.5?'#5a7a42':'#6f8a4a';
        c.beginPath();c.ellipse(0.5,0,0.6,0.2,0,0,TAU);c.fill();c.restore();}
      c.fillStyle='#14100c';c.beginPath();c.moveTo(6.0,0.4);c.lineTo(8.6,0.4);c.lineTo(7.6,1.0);c.lineTo(6.8,0.7);c.closePath();c.fill();
      Kit.vine(c,[[0.4,1.0],[3,1.4],[6,0.9],[10,1.3],[13,0.9]],1304);Kit.vine(c,[[0.6,1.2],[0.8,4],[0.5,6]],1305);
      Kit.vine(c,[[3.6,6.4],[3.4,8.8],[4.6,10.8]],1306);Kit.vine(c,[[15,1.0],[18,1.6],[22,1.0]],1307);
      Kit.vine(c,[[10.4,4],[11.8,6],[12.6,9]],1308);Kit.vine(c,[[16,9.4],[18,9.0],[19.4,10.0]],1309);
      /* лопнувшая труба с лозой — настил к полке */
      Kit.pipe(c,[[3.8,8.7],[7.6,8.7]],0.22,'rust',{seed:1310});Kit.vine(c,[[4.4,8.5],[5.8,8.8],[7.2,8.5]],1311);
      Kit.plate(c,0,6.1,3.4,0.5,'ply',1312,{bolts:false});
      if(!got){c.fillStyle='#4a5560';rr(c,1.1,5.4,1.2,0.7,0.06);c.fill();
        for(let i=0;i<3;i++){c.fillStyle='#d8cf7c';c.fillRect(1.25+i*0.34,5.5,0.22,0.5);}}
    };
    R.extraTop=(c,L,r)=>{
      /* обвал и шкаф поверх твёрдых блоков */
      Kit.rubble(c,22.8,0.4,3.4,8.8,rng('ovg_slab'),'concrete');
      c.save();c.translate(24.5,10.0);c.rotate(0.03);
      c.fillStyle='#5a3e2c';c.fillRect(-2.3,-0.8,4.6,1.6);c.fillStyle='#6b4a34';c.fillRect(-2.2,-0.7,4.4,0.6);
      c.fillStyle='#3a2a1c';c.fillRect(-0.04,-0.7,0.08,1.4);c.fillStyle='#c9a227';c.fillRect(-0.3,-0.2,0.12,0.12);c.fillRect(0.18,-0.2,0.12,0.12);
      c.restore();
      Kit.hazardTape(c,22.2,10.8,4.6,0.18);
      Kit.vine(c,[[22.4,9.4],[24,9.0],[26.6,9.6]],1313);
    };
  }})
});
