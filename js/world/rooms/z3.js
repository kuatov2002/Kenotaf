"use strict";
/* ============================== ROOMS · Z3 ============================== */
Object.assign(ROOMDEFS,{
z3_airlock:gs=>({id:'z3_airlock',zone:'seal',name:'ШЛЮЗ-ТАМБУР',w:30,h:14,
  art:{bg:Art.bgSeal,mid:Art.midSeal,game:Art.gameSeal},
  build(R){
    /* Внутренняя мембрана дезактивации сорвана: камера между двумя рамами полна пыльцы.
       Без фильтра — удушье и откат (облако 14 м, ни прыжком, ни рывком не проскочить).
       Причину видно без слов: облако, сорванная створка, садовник с треснувшим фильтром. */
    R.solids=[S(-2,-2,34,2.4,'lead'),S(-2,0,2,14,'lead'),S(30,0,2,14,'lead'),S(0,11,30,3,'lead')];
    R.pollen=[{x:8,y:0.4,w:14,h:10.6}];
    R.doors=[{x:0.0,y:8.9,w:1.2,h:2.1,to:'z2_quiet',tx:35.8,ty:15.6,label:'ТУРБИННЫЕ ЯРУСЫ',elevator:true},
      {x:28.8,y:8.9,w:1.2,h:2.1,to:'z3_greenhouse',tx:1.8,ty:27.6,label:'ОРАНЖЕРЕИ'}];
    R.checkpoint={x:3,y:11,h:1.7,lit:gs.cp.room==='z3_airlock'};
    R.lights=[lit(4,3.4,7,'#e8e8e8',0.9),lit(15,3.4,8,'#cfe0a0',0.75),lit(26,3.4,7,'#e8e8e8',0.8),
      lit(1.4,9.6,3,'#e8e8e8',0.5),lit(15,9,7,'#b8c46a',0.6,{flicker:0.6}),lit(29,9.6,3,'#cfe0a0',0.6)];
    R.emitters=[{type:'dust',rate:8},{type:'pollen',x:15,y:6,rate:16,sw:12},{type:'pollen',x:15,y:9.5,rate:10,sw:12}];
    const frame=(c,x,seed)=>{Kit.plate(c,x-0.45,0.4,0.9,2.4,'lead',seed,{bolts:true});
      Kit.plate(c,x-0.45,10.2,0.9,0.8,'lead',seed+1,{bolts:true});
      c.fillStyle='#2c2e33';c.fillRect(x-0.35,2.8,0.7,0.14);c.fillRect(x-0.35,10.06,0.7,0.14);};
    R.extraGame=(c,L,r)=>{
      for(let i=0;i<8;i++){const x=2+i*3.6;
        c.fillStyle='#8a8d94';c.fillRect(x-0.08,2.4,0.16,0.5);
        c.fillStyle='#b9bcc2';c.beginPath();c.arc(x,3.0,0.18,0,TAU);c.fill();
        for(let k=0;k<5;k++){c.fillStyle='#5c6067';c.beginPath();c.arc(x-0.14+k*0.07,3.06,0.02,0,TAU);c.fill();}}
      for(let i=0;i<3;i++)Kit.lightStrip(c,2+i*10,2.5,5,0.16);
      Kit.sign(c,1.6,5.6,4.0,0.8,'ДЕЗАКТИВАЦИЯ','#e8e8e8','#22242a',702);
      Kit.sign(c,23.4,5.6,4.4,0.8,'САДЫ ЭДЕМА · ЯРУС +6','#b8c46a','#22242a',703);
      /* знак биоугрозы: респиратор-пиктограмма у входа в камеру, без слов */
      c.save();c.translate(6.2,7.6);
      c.fillStyle='#d9c24a';c.beginPath();c.moveTo(0,-0.75);c.lineTo(0.78,0.6);c.lineTo(-0.78,0.6);c.closePath();c.fill();
      c.fillStyle='#22242a';c.beginPath();c.moveTo(0,-0.55);c.lineTo(0.6,0.48);c.lineTo(-0.6,0.48);c.closePath();c.fill();
      c.fillStyle='#d9c24a';rr(c,-0.26,-0.08,0.52,0.36,0.14);c.fill();
      c.fillStyle='#22242a';c.beginPath();c.arc(-0.1,0.1,0.06,0,TAU);c.arc(0.1,0.1,0.06,0,TAU);c.fill();
      c.fillStyle='#d9c24a';c.fillRect(-0.32,0.02,0.08,0.18);c.fillRect(0.24,0.02,0.08,0.18);
      c.restore();
      for(let i=0;i<8;i++)Kit.bolt(c,2+i*3.8,10.6,0.09);
      Kit.pipe(c,[[0,1.6],[30,1.6]],0.18,'lead',{seed:704,rustN:0});
      /* садовник дошёл до середины камеры: треснувший фильтр рядом, пыльца на плаще */
      Kit.gardener(c,15.6,11,0,-1,0,{});
      c.save();c.translate(17.0,10.72);c.rotate(0.5);
      c.fillStyle='#5c646b';rr(c,-0.22,-0.32,0.44,0.64,0.18);c.fill();
      c.fillStyle='#22262a';c.fillRect(-0.24,-0.06,0.48,0.08);
      c.strokeStyle='#dfe88a';c.lineWidth=0.04;c.beginPath();c.moveTo(-0.1,-0.3);c.lineTo(0.02,-0.08);c.lineTo(-0.06,0.1);c.lineTo(0.08,0.3);c.stroke();
      c.restore();
      for(let i=0;i<40;i++){c.fillStyle='rgba(223,232,138,'+(0.2+r()*0.4)+')';
        c.beginPath();c.arc(14+r()*4,10.6+r()*0.4,0.03+r()*0.05,0,TAU);c.fill();}
    };
    R.extraTop=(c,L,r)=>{
      frame(c,8,705);frame(c,22,707);
      /* левая створка сорвана с верхней петли и висит, правая лежит на полу */
      c.save();c.translate(8.3,2.95);c.rotate(0.42);Kit.plate(c,-0.2,0,0.5,6.4,'lead',709,{bolts:true});
      Kit.hazardTape(c,-0.2,5.9,0.5,0.4);c.restore();
      c.save();c.translate(19.2,10.62);c.rotate(-0.04);Kit.plate(c,-2.6,0,5.2,0.38,'lead',710,{bolts:true});c.restore();
    };
  }}),
z3_greenhouse:gs=>({id:'z3_greenhouse',zone:'eden',name:'ОРАНЖЕРЕИ-ТЕРРАСЫ',w:52,h:34,
  art:{bg:Art.bgEden,mid:Art.midEden,game:Art.gameEden},
  build(R){
    /* хаб Эдема. Дверь к куполу — на высоком уступе справа: туда ведёт только магнитная
       траверса под сводом (виден сразу, работает после подков из коллектора) */
    R.solids=[S(-2,-3,56,3,'marble'),S(-2,0,2,34,'marble'),S(52,0,2,34,'marble'),S(0,30,52,4,'marble'),
      P(4,27.2,13,0.4,'marble'),P(20,27.2,13,0.4,'marble'),P(36,27.2,12,0.4,'marble'),
      P(12,24.4,13,0.4,'marble'),P(28,24.4,13,0.4,'marble'),
      P(0,21.6,17,0.4,'marble'),P(20,21.6,13,0.4,'marble'),P(36,21.6,16,0.4,'marble'),
      S(14,18.8,16,0.8,'marble'),
      P(6,16.2,12,0.4,'marble'),P(24,16.2,12,0.4,'marble'),
      P(16,13.6,12,0.4,'marble'),S(42,12.4,10,0.6,'marble'),
      /* уступ под сводом слева: дверь заборника №3 (дневной свет и пыльца из щели) */
      S(0,10.4,3.8,0.6,'marble')];
    R.magnetRects=[{x:27,y:8.6,w:17.4,h:0.7},{x:4,y:6.8,w:12,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    R.pollen=[{x:40,y:23.4,w:12,h:6.6}];
    R.doors=[{x:0.0,y:27.9,w:1.2,h:2.1,to:'z3_airlock',label:'ТАМБУР'},
      {x:50.8,y:27.9,w:1.2,h:2.1,to:'z3_collector',link:'col_low',label:'КОЛЛЕКТОР'},
      {x:50.6,y:19.5,w:1.4,h:2.1,to:'z3_collector',link:'col_short',label:'СОЛЯРИЙ',latch:'col_latch',msg:'ЗАСОВ — С ТОЙ СТОРОНЫ.'},
      {x:49.6,y:10.3,w:2.4,h:2.1,to:'z3_dome',label:'КУПОЛЬНЫЙ ПОДЪЁМ'},
      {x:0.0,y:8.3,w:1.2,h:2.1,to:'z3_intake',label:'ЗАБОРНИК №3'},
      RB.L(21.6,'z3_orchard','ФРУКТОВЫЙ САД')];
    R.signs=[{x:22.2,y:10.6,keys:['SPACE'],text:'ДЕРЖАТЬ',need:'magnet'},
      {x:22.2,y:10.6,keys:[],text:'ТРАВЕРСА · ДОПУСК: МАГНИТНЫЕ ПОДКОВЫ',needNot:'magnet'}];
    R.checkpoint={x:4,y:30,h:1.7,lit:gs.cp.room==='z3_greenhouse'};
    R.mapPlate={kind:'mapplate',x:7.5,y:30,flag:'map_eden',title:'СХЕМА ЭДЕМА'};
    R.station={kind:'station',station:'eden',x:15.6,y:30,tubeTop:22};
    R.enemies=gs.flags.gh_clear?[]:[{type:'gardener',x:24,y:25.9,patrol:[21,32]},
      {type:'gardener',x:38,y:20.3,patrol:[37,46]},{type:'gardener',x:12,y:14.9,patrol:[7,17]}];
    R.clearFlag='gh_clear';
    R.interactables=gs.loreIds[9]?[]:[{kind:'lore',loreId:9,x:5.6,y:21.6,title:'ЦИЛИНДР №9 · ДНЕВНИК БОТАНИКА',
      text:'«ПОД ЛАМПАМИ-СОЛНЦАМИ САД ЧАХНЕТ ДВЕСТИ ЛЕТ. ПО КАТАЛОГУ — 412 ВИДОВ. ЖИВЫХ ОСТАЛОСЬ СОРОК.»'}];
    R.enemies.push({type:'lampada',x:21,y:3.4,amb:true});
    R.lights=[lit(26,4,18,'#f2d98c',1.15),lit(10,14,12,'#fff2cf',0.7),lit(42,14,12,'#fff2cf',0.7),
      lit(8,28,9,'#ffe6a8',0.6),lit(26,28,10,'#ffe6a8',0.6),lit(44,28,9,'#ffe6a8',0.6),
      lit(16,20,8,'#dff0b0',0.5),lit(38,20,8,'#dff0b0',0.5),
      lit(1.4,28.6,4,'#fff2cf',0.6),lit(35,9.6,7,'#ffe6a3',0.6),lit(47,11,6,'#fff2cf',0.7),
      lit(1.6,9.2,4.5,'#eaf4ff',0.8,{flicker:0.4})];
    R.emitters=[{type:'pollen',rate:30},{type:'leaf',rate:5},{type:'mist',rate:9},{type:'pollen',x:1.4,y:9.0,rate:4,sw:1.2},
      {type:'drip',x:18,y:21.4,rate:0.5},{type:'drip',x:40,y:26.4,rate:0.7}];
    R.extraGame=(c,L,r)=>{
      const cx=26,cy=2,rad=26;
      c.save();c.strokeStyle='rgba(190,190,160,.5)';c.lineWidth=0.24;
      for(let i=0;i<=14;i++){const a=PI+i/14*PI;c.beginPath();c.moveTo(cx,cy);
        c.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*0.7);c.stroke();}
      c.restore();
      Kit.fountain(c,12,30,2.4,{});Kit.fountain(c,30,30,2.0,{dry:true});
      for(let i=0;i<9;i++)Kit.tree(c,3+i*5.4,[30,27.2,21.6,16.2][(i%4)]-0.1,3.4+r()*3.2,(i*41)|0,{sick:i%3===0});
      for(const s of R.solids)if(s.ow){c.fillStyle='rgba(255,255,255,.28)';c.fillRect(s.x,s.y,s.w,0.05);
        Kit.railing(c,s.x,s.y,s.w,0.7,'#cfc9b8');}
      Kit.railing(c,42,12.4,10,0.8,'#cfc9b8');
      Kit.column(c,14.6,12.8,6.0,0.4,{gold:true});Kit.column(c,29.4,12.8,6.0,0.4,{gold:true});
      Kit.fountain(c,22,18.8,1.5,{dry:true});
      for(let i=0;i<340;i++){c.fillStyle='rgba(184,196,106,'+(r()*0.3)+')';
        c.beginPath();c.arc(r()*L.w,r()*L.h,0.03+r()*0.06,0,TAU);c.fill();}
      Kit.stencil(c,3.0,28.8,'ЭДЕМ · ТЕРРАСА 1',0.42,'rgba(120,110,70,.55)',0.55);
      Kit.stencil(c,43.0,11.8,'КУПОЛЬНЫЙ ПОДЪЁМ',0.34,'rgba(120,110,70,.65)',0.65);
      for(let i=0;i<4;i++){const x=6+i*9,y=4+r()*2;
        c.strokeStyle='#c9c3b0';c.lineWidth=0.09;c.beginPath();c.arc(x,y,0.55,0,TAU);c.stroke();
        c.fillStyle='rgba(242,217,140,.35)';c.beginPath();c.arc(x,y,0.46,0,TAU);c.fill();}
      Kit.vine(c,[[6,3],[6.4,8],[5.6,14],[6.2,20]],3);
      Kit.vine(c,[[50,13],[49.4,18],[50.2,22],[49.6,27]],4);
    };
    R.extraTop=(c,L,r)=>{
      for(const m of R.magnetRects){
        Kit.plate(c,m.x,m.y,m.w,m.h,'steel',900+m.x,{rust:0.3,boltStep:0.9});
        Kit.magnetRivets(c,m.x,m.y+m.h-0.5,m.w);
        Kit.stencil(c,m.x+0.3,m.y-0.18,'МАГНИТНАЯ ТРАВЕРСА →',0.3,'rgba(120,110,70,.7)',0.7);}};
  }}),
z3_collector:gs=>({id:'z3_collector',zone:'eden',name:'ЗАТОПЛЕННЫЙ КОЛЛЕКТОР',w:60,h:18,
  art:{bg:Art.bgEden,mid:Art.midEden,game:Art.gameEden},
  build(R){
    const got=gs.flags.got_magnet,beam=!!(gs.flags.gh_beam||got);
    /* канал высотой 1.2 под трубами — ползком/подкатом, весь в пыльце. Посередине —
       вентколонна (можно выпрямиться, фильтр продувается). В конце — солярий. */
    R.solids=[S(-2,-3,64,3,'marble'),S(-2,0,2,18,'marble'),S(60,0,2,18,'marble'),S(0,16,60,2,'marble'),
      S(8,10.8,17,4.0,'concrete'),S(27.4,10.8,16.6,4.0,'concrete')];
    R.pollen=[{x:6.6,y:9.6,w:38.8,h:6.4}];
    R.air=[{x:25,y:1,w:2.4,h:15}];
    R.amb=[96,108,92];
    R.doors=[{x:0.0,y:13.9,w:1.2,h:2.1,to:'z3_greenhouse',link:'col_low',label:'ОРАНЖЕРЕИ'},
      {x:58.6,y:13.9,w:1.4,h:2.1,to:'z3_greenhouse',link:'col_short',label:'ОРАНЖЕРЕИ · ТЕРРАСА',latch:'col_latch',latchHere:true},
      RB.hatch(55.4,16,'z3_canal','ОРОСИТЕЛЬНЫЙ КАНАЛ')];
    R.signs=[{x:26.2,y:7.4,keys:[],text:'ВЕНТКОЛОННА · ПРОДУВКА ФИЛЬТРОВ'}];
    R.pushables=[{x:50,y:14.7,w:4.2,h:1.3,id:'beam',kind:'beam',pushed:beam}];
    R.interactables=[];
    /* старый садовник придавлен балкой; импульс сбрасывает балку, он поднимается и говорит */
    const GX=52.1,F=gs.flags;
    const gT=W=>W.anims.gardener?W.anims.gardener.t:(F.gh_beam?99:-1);
    const pose=T=>T<0?0:T<0.9?0:T<2.1?EZ.io(seg01(T,0.9,2.1)):T<2.3?1:1+EZ.io(seg01(T,2.3,3.3));
    const gdHere=HubNPC.room(gs,'gd')==='z3_collector';
    if(gdHere)R.interactables.push({kind:'talk',x:GX,y:16,w:1.6,h:1.9,flag:'got_magnet',title:'САДОВНИК',speaker:'gardener',ability:'magnet',
      ready:W=>gT(W)>=3.3,
      lines:['…ТРЕТЬИ СУТКИ ПОД БАЛКОЙ. СПАСИБО, КУРЬЕР.','ЧТО У ТЕБЯ В КАРМАНЕ? ПАХНЕТ… ДОЖДЁМ?',
             'ДАЙ ВЗГЛЯНУТЬ. …НЕТ. ТАКОГО ВИДА В ЭДЕМЕ НЕТ.','Я ЗНАЮ ЗДЕСЬ КАЖДЫЙ ЛИСТ. ЭТОТ РОС НЕ ПОД ЛАМПОЙ.',
             'ВОЗЬМИ МОИ ПОДКОВЫ. ПОД СВОДОМ ОНИ ДЕРЖАТ НА ЛАТУНИ.'],
      again:['Я ОСТАНУСЬ. КТО-ТО ДОЛЖЕН ПОЛИВАТЬ ЭТОТ САД.']});
    const beamDraw=(c,x,y,r)=>{c.save();c.translate(x,y);c.rotate(r);
      Kit.plate(c,-2.2,-0.45,4.4,0.9,'steel',801,{rust:0.4});Kit.hazardTape(c,-2.2,-0.45,4.4,0.22);c.restore();};
    R.npcs=[{bounds:()=>({x:GX-3.2,y:12.4,w:6.4,h:4.0}),draw:(c,t)=>{
      const W=game.world,T=gT(W),p=pose(T),pl=W.player;
      const face=p>1.6&&pl?(pl.cx<GX?-1:1):1;
      Kit.gardener(c,GX,16,p,face,t,{boots:!F.got_magnet,reach:T<0});
      if(T<0)beamDraw(c,51.5,15.2,-0.1);}}];
    if(!gdHere)R.npcs=[];
    R.tick=(dt,W)=>{const a=W.anims.beam;if(!a||a.done)return;const g=W.game;
      if(a.cx===undefined){a.cx=51.5;a.cy=15.2;a.r=-0.1;a.vx=a.dir*4.6;a.vy=-7.5;a.vr=a.dir*3.6;}
      a.vy+=40*dt;a.cx+=a.vx*dt;a.cy+=a.vy*dt;a.r+=a.vr*dt;
      a.cx=clamp(a.cx,46.4,57.6);
      if(a.cy+0.45>=16){a.cy=15.55;
        if(a.vy>3){a.vy*=-0.28;a.vr*=0.35;a.vx*=0.55;g.audio.hitMetal();g.camera.addShake(0.35);
          g.particles.burst(a.cx,15.9,10,{kind:'dust',col:'#a8a48a',spd:3,life:0.9,size:0.12,g:6});}
        else{a.vy=0;a.vx=damp(a.vx,0,5,dt);a.vr=0;a.r=damp(a.r,Math.round(a.r/PI)*PI,8,dt);}}
      if(a.t>1.6&&Math.abs(a.vx)<0.05&&a.vy===0){a.done=true;F.gh_beam_x=a.cx;F.gh_beam_r=Math.round(a.r/PI)*PI;g.gs.save();}
    };
    R.dyn=(c,t,W)=>{const a=W.anims.beam;
      if(a&&a.cx!==undefined)beamDraw(c,a.cx,a.cy,a.r);
      else if(F.gh_beam)beamDraw(c,F.gh_beam_x||55.2,15.55,F.gh_beam_r||0);};
    if(!gs.loreIds[10])R.interactables.push({kind:'lore',loreId:10,x:26.2,y:16,title:'ЦИЛИНДР №10 · ЗАПИСКА САНИТАРА',
      text:'«ВОЗДУХОЗАБОРНИК №3 СНОВА ПРИНЁС ПЫЛЬЦУ. В КАТАЛОГЕ ЭДЕМА ТАКОГО ВИДА НЕТ. ПРИКАЗ: ЗАБОРНИК ЗАВАРИТЬ, ЗАПИСЬ УНИЧТОЖИТЬ.»'});
    R.lights=[lit(3,8,7,'#fff2cf',0.7),lit(16,13.6,5,'#b8c46a',0.45),lit(36,13.6,5,'#b8c46a',0.45),
      lit(26.2,6,7,'#cfeaff',0.9),lit(26.2,14,4,'#cfeaff',0.6),lit(52,6,11,'#f2d98c',1.0),lit(57,13,5,'#fff2cf',0.6)];
    R.emitters=[{type:'pollen',rate:22},{type:'pollen',x:16,y:13.2,rate:5},{type:'pollen',x:36,y:13.2,rate:5},
      {type:'airjet',x:26.2,y:15.6,rate:12},{type:'drip',x:12,y:15,rate:0.6},{type:'leaf',rate:2}];
    R.extraGame=(c,L,r)=>{
      /* сырой технический канал под оранжереей: тёмная стена, потёки конденсата */
      c.fillStyle='rgba(26,34,28,.62)';c.fillRect(0,0,44,L.h);
      for(let i=0;i<40;i++){const x=r()*44;c.fillStyle='rgba(120,150,110,'+(r()*0.12)+')';c.fillRect(x,r()*10,0.08,1+r()*4);}
      c.fillStyle='rgba(40,60,40,.35)';c.fillRect(8,14.8,36,1.2);
      Kit.puddle(c,14,15.95,2.4,'#7a9a52');Kit.puddle(c,34,15.95,2.6,'#7a9a52');
      for(let x=8;x<44;x+=3.4)Kit.pipe(c,[[x,10.8],[x+3.4,10.8]],0.34,'steel',{seed:(x*3)|0,rustN:4});
      /* солярий: стеклянный купол, мёртвые лампы-солнца */
      Kit.domeRibs(c,52,16,9,10,0.12);
      for(let i=0;i<3;i++){const x=47+i*5;c.strokeStyle='#c9c3b0';c.lineWidth=0.09;
        c.beginPath();c.arc(x,4,0.5,0,TAU);c.stroke();c.fillStyle='rgba(120,110,80,.4)';c.beginPath();c.arc(x,4,0.42,0,TAU);c.fill();}
      Kit.fountain(c,46,16,1.4,{dry:true});
      Kit.stencil(c,46,9.2,'СОЛЯРИЙ',0.5,'rgba(120,110,70,.6)',0.6);
      c.fillStyle='rgba(200,230,255,.10)';c.fillRect(25,0,2.4,16);
      Kit.vent(c,25.1,2.4,2.2,1.2);
      Kit.stencil(c,24.4,1.8,'ВЕНТКОЛОННА',0.32,'rgba(120,140,160,.75)',0.75);
      for(let i=0;i<4;i++)Kit.tree(c,46+i*4,16,2.4+r()*1.6,(i*61)|0,{sick:true});
    };
    R.extraTop=(c,L,r)=>{
      Kit.hazardTape(c,8,14.5,17,0.3);Kit.hazardTape(c,27.4,14.5,16.6,0.3);
      Kit.stencil(c,9,12.9,'КОЛЛЕКТОР · ВЫСОТА 1.2 М',0.4,'rgba(60,56,40,.8)',0.8);
    };
  }}),
z3_dome:gs=>({id:'z3_dome',zone:'eden',name:'КУПОЛЬНЫЙ ПОДЪЁМ',w:62,h:30,
  art:{bg:Art.bgEden,mid:Art.midEden,game:Art.gameEden},
  build(R){
    /* подъём ПО СВОДУ: три траверсы над пропастью, между ними — площадки отдыха.
       Пролёты 13–14 м: прыжком с рывком не взять, только вниз головой по клёпкам */
    R.solids=[S(-2,-3,66,3,'marble'),S(-2,0,2,30,'marble'),S(62,0,2,30,'marble'),
      S(0,26,9,4,'marble'),P(5,23.6,4,0.4,'marble'),P(0,21.2,5,0.4,'marble'),P(5,18.8,4,0.4,'marble'),
      P(23,17.4,3,0.4,'marble'),P(39.5,16.0,3,0.4,'marble'),S(55.8,14,6.2,0.6,'marble')];
    R.magnetRects=[{x:8,y:13.8,w:15,h:0.7},{x:24.5,y:12.5,w:15,h:0.7},{x:41,y:11.1,w:16,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    R.hazards=[{x:9,y:28.4,w:53,h:1.6,kind:'pit',back:{x:2.6,y:24.32},
      backs:[{minX:23,x:23.9,y:15.72},{minX:39.5,x:40.4,y:14.32}]}];
    R.doors=[{x:0.0,y:23.9,w:1.2,h:2.1,to:'z3_greenhouse',label:'ОРАНЖЕРЕИ'},
      {x:60.6,y:11.9,w:1.4,h:2.1,to:'z4_antechamber',label:'ПЕЧАТЬ',elevator:true,reqFlag:'lead_dome',reqMsg:'ПОДЪЁМНИК ЗАПАЯН СВИНЦОМ'},
      RB.L(21.2,'z3_vineyard','ВИНОГРАДНЫЕ ТЕРРАСЫ')];
    if(!gs.flags.lead_dome)R.pushables.push({kind:'lead',x:59.6,y:11.4,w:2.4,h:2.6,id:'dome_lead',flag:'lead_dome'});
    R.checkpoint={x:3,y:26,h:1.7,lit:gs.cp.room==='z3_dome'};
    R.interactables=[];
    R.enemies.push({type:'lampada',x:14,y:19,amb:true});
    R.lights=[lit(14,13,7,'#f2d98c',0.8),lit(31,11.6,7,'#f2d98c',0.85),lit(48,10.2,7,'#f2d98c',0.8),
      lit(31,3,14,'#fff2cf',0.95),lit(5,23,8,'#ffe6a8',0.7),lit(24.5,16,5,'#ffe6a8',0.65),lit(41,14.6,5,'#ffe6a8',0.65),
      lit(59,11,6,'#e8e8e8',0.75)];
    R.emitters=[{type:'pollen',rate:20},{type:'mist',rate:8},{type:'leaf',rate:3}];
    R.extraTop=(c,L,r)=>{
      for(const m of R.magnetRects){
        Kit.plate(c,m.x,m.y,m.w,m.h,'steel',900+m.x,{rust:0.3,boltStep:0.9});
        Kit.magnetRivets(c,m.x,m.y+m.h-0.5,m.w);
        Kit.stencil(c,m.x+0.3,m.y-0.18,'ТРАВЕРСА',0.28,'rgba(120,110,70,.7)',0.7);}};
    R.extraGame=(c,L,r)=>{
      const g=c.createLinearGradient(0,18,0,30);
      g.addColorStop(0,'rgba(40,50,30,0)');g.addColorStop(1,'rgba(14,18,12,.95)');
      c.fillStyle=g;c.fillRect(9,18,53,12);
      c.save();c.globalAlpha=0.5;
      const sg=c.createRadialGradient(31,2,0,31,2,16);
      sg.addColorStop(0,'rgba(255,248,214,.9)');sg.addColorStop(1,'rgba(242,217,140,0)');
      c.fillStyle=sg;c.beginPath();c.arc(31,2,16,0,TAU);c.fill();c.restore();
      Kit.domeRibs(c,31,30,30,18,0.16);
      for(let i=0;i<12;i++)Kit.tree(c,10+r()*50,30,2.4+r()*3,(i*53)|0,{sick:true});
      for(let i=0;i<260;i++){c.fillStyle='rgba(184,196,106,'+(r()*0.28)+')';
        c.beginPath();c.arc(r()*L.w,r()*L.h,0.03+r()*0.05,0,TAU);c.fill();}
      Kit.fountain(c,4,26,1.4,{dry:true});
      for(const s of R.solids)if(s.ow)Kit.railing(c,s.x,s.y,s.w,0.6,'#cfc9b8');
      Kit.railing(c,55.8,14,6.2,0.8,'#cfc9b8');
      Kit.stencil(c,10,27.2,'СРЫВ = НАЗАД К ПЛОЩАДКЕ',0.34,'rgba(140,80,40,.65)',0.65);
      Kit.stencil(c,55.8,10.6,'ШЛЮЗ · ПЕЧАТЬ',0.36,'rgba(120,110,70,.65)',0.65);
    };
  }}),
});
/* ============================== ВОЗДУХОЗАБОРНИК №3 ============================== */
/* Тайник Эдема над оранжереями (дверь под сводом — только по магнитной траверсе). Тот самый
   заборник №3, через который сверху приходят капсулы «ОТ ПЕЧАТИ» и пыльца (цилиндр №10).
   Его заварили по приказу — сварщик Цензуры так и остался у решётки. Камин на кошках уходит
   в пыльцу (фильтр), наверху — дневной свет сквозь заваренную решётку, клапан MK-II сварщика
   и капсула, застрявшая в решётке: письмо с поверхности. */
Object.assign(ROOMDEFS,{
z3_intake:gs=>({id:'z3_intake',zone:'eden',name:'ВОЗДУХОЗАБОРНИК №3',w:26,h:34,
  art:{bg:Art.bgEden,mid:Art.midEden,game:Art.gameEden},
  build(R){
    const F=gs.flags;
    R.solids=[S(-2,-2,30,2.4,'steel'),S(-2,0,2,34,'steel'),S(26,0,2,34,'steel'),S(0,32,26,2,'rust'),
      /* камин: рифлёные грани внутрь, 3.2 м; под правой стенкой — проход с пола */
      S(5,12,1.2,20,'rust',{grip:'r'}),S(0,10.2,5,21.8,'rust'),S(9.4,10,1.2,19.4,'rust',{grip:'l'}),
      /* площадка сварщика слева, ступени к решётке справа */
      S(0,9.6,5,0.6,'steel'),P(11.4,7.6,2.4,0.34,'steel'),P(15,5.4,3.2,0.34,'steel')];
    R.pollen=[{x:0,y:0.4,w:26,h:18.6}];
    R.amb=[150,156,128];
    R.doors=[{x:24.8,y:29.9,w:1.2,h:2.1,to:'z3_greenhouse',label:'ОРАНЖЕРЕИ'}];
    R.interactables=[];
    if(!F.dash_mk2)R.interactables.push({kind:'salvage',upgrade:'dash_mk2',x:2.6,y:9.6,flag:'dash_mk2_got',
      title:'СВАРЩИК ЦЕНЗУРЫ',lines:['СВАРЩИК В МАСКЕ СИДИТ У РЕШЁТКИ. ШОВ ДОВЕДЁН ДО КОНЦА — ФИЛЬТР НА НЁМ ПУСТОЙ.',
        'ОН ЗАВАРИЛ ЗАБОРНИК И ОСТАЛСЯ ПО ЭТУ СТОРОНУ. НА РАНЦЕ — КЛАПАН DASH ВТОРОЙ СЕРИИ.',
        'КЛАПАН ВСТАЁТ НА МЕСТО СТАРОГО. В ВОЗДУХЕ ТЕПЕРЬ ДВА РЫВКА.']});
    if(!F.got_letter)R.interactables.push({kind:'salvage',x:16.6,y:5.4,flag:'got_letter',title:'КАПСУЛА В РЕШЁТКЕ',
      lines:['КАПСУЛА ЗАСТРЯЛА МЕЖДУ ПРУТЬЯМИ. МЕТКА «ОТ ПЕЧАТИ» — НО ПОЧЕРК НЕ ЦЕНЗУРЫ.',
        '«ЕСЛИ ВЫ ЭТО ЧИТАЕТЕ — ЗАБОРНИК ЕЩЁ ДЫШИТ. ВОЗДУХ НАВЕРХУ ЧИСТЫЙ. ДАВНО.»',
        '«МЫ ШЛЁМ СЕМЕНА И ЛИСТЬЯ, ЧТОБЫ ВЫ ПОВЕРИЛИ. ОТКРОЙТЕ ПЕЧАТЬ. МЫ ЖДЁМ ПО ТУ СТОРОНУ.»']});
    R.lights=[lit(14,3,13,'#eaf4ff',1.15),lit(8,14,8,'#dfe8c0',0.55),lit(2.6,8.4,4,'#ffcf7a',0.45,{flicker:1.1}),
      lit(16.6,4.6,3,'#e8c96a',0.55),lit(20,28,8,'#b8c46a',0.45),lit(24.6,30.6,3,'#fff2cf',0.5)];
    R.emitters=[{type:'pollen',x:14,y:2,rate:16,sw:12},{type:'pollen',x:13,y:14,rate:5,sw:16},
      {type:'leaf',x:14,y:1,rate:0.6,sw:8},{type:'mist',x:13,y:10,rate:3,sw:20},{type:'drip',x:20,y:20,rate:0.4}];
    /* лучи дневного света сквозь решётку: медленно «дышат», в них плывёт пыльца */
    R.dyn=(c,t,W)=>{
      c.save();c.globalCompositeOperation='lighter';
      for(let i=0;i<5;i++){const x0=9+i*2.4,sk=-2.6-i*0.4,a=0.06+0.03*Math.sin(t*0.5+i*1.3);
        const g=c.createLinearGradient(0,0.4,0,22);g.addColorStop(0,'rgba(240,248,255,'+(a*2.2)+')');g.addColorStop(1,'rgba(240,248,255,0)');
        c.fillStyle=g;c.beginPath();c.moveTo(x0,0.4);c.lineTo(x0+1.3,0.4);c.lineTo(x0+1.3+sk+3.4,22);c.lineTo(x0+sk,22);c.closePath();c.fill();}
      c.restore();
      game.renderer.glowAdd(14,1.6,6,'#f4f8ff',0.4+0.08*Math.sin(t*0.7));
      /* капсула поблёскивает, пока не вскрыта */
      if(!F.got_letter){const p=0.5+0.5*Math.sin(t*2.2);c.fillStyle='#c9a227';rr(c,16.0,4.6,1.2,0.62,0.28);c.fill();
        c.fillStyle='rgba(255,255,255,'+(0.3+0.3*p)+')';c.fillRect(16.2,4.72,0.8,0.08);
        c.fillStyle='#7a2418';c.fillRect(16.5,4.9,0.2,0.2);}
    };
    R.extraGame=(c,L,r)=>{
      /* короб заборника: рёбра, потёки, осевшая пыльца */
      c.fillStyle='rgba(40,46,40,.7)';c.fillRect(0,0.4,26,31.6);
      for(let y=2;y<32;y+=2.2){c.fillStyle='rgba(120,130,110,.16)';c.fillRect(0,y,26,0.16);}
      for(let x=1.2;x<26;x+=3.2){c.fillStyle='rgba(20,24,20,.5)';c.fillRect(x,0.4,0.24,31.6);}
      for(let i=0;i<30;i++){c.fillStyle='rgba(200,210,120,'+(0.05+r()*0.12)+')';c.fillRect(r()*26,r()*31,0.12+r()*0.4,0.05);}
      /* небо за решёткой и стоящий вентилятор заборника */
      const sky=c.createLinearGradient(0,0,0,2.4);sky.addColorStop(0,'#cfe4f4');sky.addColorStop(1,'#8fb0cc');
      c.fillStyle=sky;c.fillRect(7.6,0.4,13,2.0);
      c.save();c.beginPath();c.rect(7.6,0.4,13,2.0);c.clip();
      c.translate(14,0.2);c.fillStyle='rgba(60,66,60,.85)';
      for(let i=0;i<7;i++){c.save();c.rotate(i/7*TAU+0.3);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(2.6,-0.9,5.6,-0.2);c.lineTo(5.6,0.6);c.quadraticCurveTo(2.6,0.4,0,0.3);c.closePath();c.fill();c.restore();}
      c.fillStyle='#3a3e38';c.beginPath();c.arc(0,0,0.9,0,TAU);c.fill();c.restore();
      /* заваренная решётка: прутья и светящиеся швы */
      for(let x=7.8;x<20.6;x+=0.7){c.fillStyle='#2b302c';c.fillRect(x,0.4,0.16,2.2);}
      c.fillStyle='#2b302c';c.fillRect(7.6,2.3,13,0.34);c.fillRect(7.6,1.2,13,0.18);
      c.fillStyle='rgba(255,170,90,.55)';for(let x=8;x<20.4;x+=1.4)c.fillRect(x,2.22,0.6,0.08);
      Kit.stencil(c,8,3.4,'ЗАБОРНИК №3 · ЗАВАРЕН ПО ПРИКАЗУ СОВЕТА',0.32,'rgba(200,69,47,.7)',0.7);
      Kit.hazardTape(c,7.6,2.64,13,0.22);
      /* осевшая пыльца и бледные ростки внизу */
      for(let i=0;i<9;i++)Kit.tree(c,12+i*1.4,32-0.05,1.2+r()*1.6,(i*53)|0,{sick:true});
      c.fillStyle='rgba(216,224,122,.25)';c.fillRect(10.6,31.6,15.4,0.4);
      Kit.stencil(c,12.4,27.6,'ВОЗДУХОВОД · ВВЕРХ',0.36,'rgba(150,170,120,.6)',0.6);
      /* сварщик: маска, баллон, горелка; рядом — пустая кассета фильтра */
      c.save();c.translate(2.6,9.6);
      c.fillStyle='#3a3a34';c.beginPath();c.ellipse(0,-0.32,0.75,0.3,0,PI,TAU);c.fill();
      c.fillStyle='#4a4a42';rr(c,-0.6,-1.2,1.0,0.9,0.2);c.fill();
      c.fillStyle='#5c646b';rr(c,-0.9,-1.4,0.42,1.0,0.16);c.fill();c.fillStyle='#8a6d2a';c.fillRect(-0.9,-1.0,0.42,0.08);
      c.fillStyle='#2b2b26';rr(c,-0.24,-1.62,0.62,0.52,0.12);c.fill();
      c.fillStyle='rgba(120,200,160,.35)';c.fillRect(-0.12,-1.46,0.4,0.14);
      c.strokeStyle='#5c646b';c.lineWidth=0.06;c.beginPath();c.moveTo(0.3,-0.7);c.lineTo(1.0,-0.2);c.stroke();
      c.fillStyle='#8a8d7a';c.fillRect(1.0,-0.26,0.3,0.1);
      c.fillStyle='#4a5560';rr(c,1.5,-0.32,0.4,0.3,0.05);c.fill();
      c.restore();
      Kit.stencil(c,0.4,8.6,'ЦЕНЗУРА · СВАРЩИК 7',0.24,'rgba(216,204,178,.55)',0.55);
      Kit.vine(c,[[0.4,12],[1.6,16],[0.8,22]],2101);Kit.vine(c,[[25.6,6],[24.4,12],[25.4,20]],2102);
      Kit.lampCage(c,24.6,29.2,0.26,{glass:'#e8c07a'});
    };
  }})
});
