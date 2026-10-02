"use strict";
/* ============================== ROOMS · Z4 ============================== */
Object.assign(ROOMDEFS,{
z4_antechamber:gs=>({id:'z4_antechamber',zone:'seal',name:'ПРЕДПЕЧАТЬЕ',w:44,h:28,
  art:{bg:Art.bgSeal,mid:Art.midSeal,game:Art.gameSeal},
  build(R){
    const done=gs.flags.wheel_turned;
    /* к магистрали B — два симметричных марша по 2.4 */
    R.solids=[S(-2,-3,48,3,'lead'),S(-2,0,2,28,'lead'),S(44,0,2,28,'lead'),S(0,24,44,4,'lead'),
      P(9,21.6,3.5,0.4,'lead'),P(12.8,19.2,3.2,0.4,'lead'),P(31.5,21.6,3.5,0.4,'lead'),P(28,19.2,3.2,0.4,'lead'),
      P(16,16.8,12,0.4,'lead')];
    R.doors=[{x:0.0,y:21.9,w:1.2,h:2.1,to:'z3_dome',label:'ЭДЕМ',elevator:true},
      {x:5.4,y:21.9,w:2.6,h:2.1,to:'z4_exam_a',link:'a_low',label:'МАГИСТРАЛЬ A'},
      {x:20.7,y:14.7,w:2.6,h:2.1,to:'z4_exam_b',link:'b_low',label:'МАГИСТРАЛЬ B'},
      {x:36.4,y:21.9,w:2.6,h:2.1,to:'z4_exam_c',label:'МАГИСТРАЛЬ C'}];
    R.checkpoint={x:3,y:24,h:1.7,lit:gs.cp.room==='z4_antechamber'};
    const ready=gs.flags.gaugeA&&gs.flags.gaugeB&&gs.flags.gaugeC,arch=!!gs.flags.archivist_dead;
    R.interactables=(ready&&arch&&!done)?[{kind:'wheel',x:22,y:24,label:'КОЛЕСО ПЕЧАТИ',flag:'wheel_turned'}]:[];
    /* финал: три магистрали под давлением будят Архивариуса над Колесом */
    if(ready&&!arch){
      R.boss={type:'archivist',x:19.8,y:3.6};R.bossTrigger={x:1.4,y:2,w:41.2,h:22};
      R.hazards=[3,8.5,14,27.5,33,38.5].map(x=>({x:x,y:21.8,w:2.6,h:2.2,kind:'steam',ctl:'arch'}));
    }
    R.machines=[{kind:'sealwheel',x:22,y:19.4,r:3.0,turned:done},{kind:'archivist',x:22,y:8.0,alive:done}];
    R.lights=[lit(22,19.4,13,done?'#fff6dd':'#7f8792',done?1.35:0.55),
      lit(6,4,9,'#e8e8e8',0.6),lit(38,4,9,'#e8e8e8',0.6),lit(22,3,10,'#e8e8e8',0.5),
      lit(7,20,6,'#8fb6c9',0.4),lit(37,20,6,'#8fb6c9',0.4),
      lit(6.7,22.0,4,gs.flags.gaugeA?'#69d68f':'#c8452f',0.85),
      lit(25.6,14.4,4,gs.flags.gaugeB?'#69d68f':'#c8452f',0.85),
      lit(37.7,22.0,4,gs.flags.gaugeC?'#69d68f':'#c8452f',0.85),lit(1.4,22.6,3,'#e8e8e8',0.5)];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{
      Kit.arch(c,5.0,18.4,3.4,5.6);Kit.arch(c,20.3,11.2,3.4,5.6);Kit.arch(c,36.0,18.4,3.4,5.6);
      Kit.stencil(c,4.4,17.6,'МАГИСТРАЛЬ A · ПАР',0.3,'rgba(220,225,235,.55)',0.55);
      Kit.stencil(c,18.4,10.6,'МАГИСТРАЛЬ B · ЗАМКИ',0.3,'rgba(220,225,235,.55)',0.55);
      Kit.stencil(c,35.4,17.6,'МАГИСТРАЛЬ C · АРХИВ',0.3,'rgba(220,225,235,.55)',0.55);
      Kit.plate(c,17,22.6,10,1.0,'lead',950,{bolts:true});
      Kit.stencil(c,17.8,23.3,'ТРИ МАГИСТРАЛИ ДАВЛЕНИЯ',0.44,'rgba(232,232,232,.75)',0.75);
      const arr=[gs.flags.gaugeA,gs.flags.gaugeB,gs.flags.gaugeC];
      [[6.7,22.0],[25.6,14.4],[37.7,22.0]].forEach((p,i)=>{
        Kit.plate(c,p[0]-0.9,p[1]-0.9,1.8,1.8,'lead',960+i,{bolts:true});
        Kit.gauge(c,p[0],p[1],0.55,arr[i]?0.88:0.0);});
      for(let i=0;i<4;i++)Kit.lightStrip(c,3+i*11,2.6,7,0.18);
      for(let i=0;i<3;i++)Kit.lightStrip(c,6+i*14,24.2,4,0.12);
      c.fillStyle='rgba(200,205,215,.07)';c.font='500 0.4px Oswald';
      for(let i=0;i<16;i++)c.fillText(['Св-41','ПЕЧАТЬ','ГЕРМЕТИЧНО','№'+((r()*90|0)+10)][(r()*4)|0],2+r()*40,4+r()*18);
      c.save();c.globalAlpha=0.55;
      c.fillStyle='#2c2e33';rr(c,18,5.0,8,7,0.6);c.fill();
      Kit.gear(c,22,8.6,3.4,30,0.2,'#3a3d44');
      c.fillStyle='#22242a';rr(c,20.4,6.2,3.2,4.0,0.4);c.fill();
      for(let i=0;i<6;i++){const a=-PI*0.8+i*0.32;
        c.strokeStyle='#2c2e33';c.lineWidth=0.22;c.beginPath();c.moveTo(22,8.0);
        c.lineTo(22+Math.cos(a)*4.2,8.0+Math.sin(a)*3.2);c.stroke();}
      c.fillStyle=done?'rgba(255,246,221,.9)':'rgba(90,96,106,.6)';
      c.beginPath();c.arc(21.3,7.0,0.16,0,TAU);c.arc(22.7,7.0,0.16,0,TAU);c.fill();
      c.restore();
      Kit.stencil(c,18.0,4.4,'АРХИВАРИУС · ЗАМУРОВАН',0.3,'rgba(200,205,215,.4)',0.4);
      for(let i=0;i<20;i++)Kit.bolt(c,2+r()*40,24.1,0.08);
      Kit.pipe(c,[[0,3.4],[44,3.4]],0.3,'lead',{seed:970,rustN:0});
      Kit.pipe(c,[[0,25.4],[44,25.4]],0.24,'lead',{seed:971,rustN:0});
    };
  }}),
z4_exam_a:gs=>({id:'z4_exam_a',zone:'seal',name:'ЭКЗАМЕН A · ПАРОВОЙ КЛАПАН',w:46,h:13,
  art:{bg:Art.bgSeal,mid:Art.midSeal,game:Art.gameSeal},
  build(R){
    R.solids=[S(-2,-2,50,2.4,'lead'),S(-2,0,2,13,'lead'),S(46,0,2,13,'lead'),S(0,10.6,46,2.4,'lead'),
      P(14,9.0,4,0.4,'lead'),P(30,9.0,4,0.4,'lead')];
    R.hazards=[];
    for(let i=0;i<6;i++)R.hazards.push({x:6+i*6.4,y:2.4,w:1.1,h:8.2,kind:'steam',per:2.4,off:i*0.4,on:0.75});
    R.doors=[{x:0.0,y:8.5,w:1.2,h:2.1,to:'z4_antechamber',link:'a_low',label:'ПРЕДПЕЧАТЬЕ'},
      {x:44.4,y:8.5,w:1.4,h:2.1,to:'z4_antechamber',link:'a_end',label:'ПРЕДПЕЧАТЬЕ'}];
    R.interactables=gs.flags.gaugeA?[]:[{kind:'gauge',x:42.4,y:10.4,label:'МАНОМЕТР A',flag:'gaugeA'}];
    R.checkpoint={x:2.4,y:10.6,h:1.7,lit:gs.cp.room==='z4_exam_a'};
    R.lights=[lit(6,3,7,'#e8e8e8',0.75),lit(20,3,7,'#e8e8e8',0.75),lit(34,3,7,'#e8e8e8',0.75),
      lit(42.4,9.6,4,gs.flags.gaugeA?'#69d68f':'#c8452f',0.9),lit(1.4,9.2,3,'#e8e8e8',0.5)];
    R.emitters=[{type:'dust',rate:8}];
    R.extraGame=(c,L,r)=>{
      for(let i=0;i<6;i++){const x=6+i*6.4;
        c.fillStyle='#5d6067';rr(c,x-0.5,2.4,1.1,0.7,0.1);c.fill();
        c.fillStyle='#33363c';rr(c,x-0.36,3.0,0.82,0.3,0.06);c.fill();
        c.fillStyle='#8a8d94';c.fillRect(x-0.62,2.3,1.34,0.14);
        Kit.hazardTape(c,x-0.9,10.2,1.9,0.24);
        for(let k=0;k<4;k++)Kit.bolt(c,x-0.4+k*0.26,2.6,0.05);}
      for(let i=0;i<5;i++)Kit.lightStrip(c,2+i*9,2.5,5,0.16);
      Kit.plate(c,41.4,9.0,2.4,1.6,'lead',980,{bolts:true});
      Kit.gauge(c,42.6,9.8,0.5,gs.flags.gaugeA?0.9:0.0);
      Kit.stencil(c,41.4,8.6,'МАГИСТРАЛЬ A',0.28,'rgba(232,232,232,.6)',0.6);
      Kit.stencil(c,2.6,7.6,'ОКНО 0.75 С · РЫВОК',0.4,'rgba(232,232,232,.5)',0.5);
      Kit.pipe(c,[[0,1.6],[46,1.6]],0.28,'lead',{seed:981,rustN:0});
    };
  }}),
z4_exam_b:gs=>({id:'z4_exam_b',zone:'seal',name:'ЭКЗАМЕН B · ШАХТА ЗАМКОВ',w:26,h:36,
  art:{bg:Art.bgSeal,mid:Art.midSeal,game:Art.gameSeal},
  build(R){
    /* экзамен на ДВЕ способности: траверса над шипами → рифлёный колодец → траверса над пустотой.
       Манометр — в самом конце, наверху */
    R.solids=[S(-2,-3,30,3,'lead'),S(-2,0,2,36,'lead'),S(26,0,2,36,'lead'),
      S(0,32,5,4,'lead'),S(20,32,6,4,'lead'),S(5,34.6,15,1.4,'lead'),
      S(19.6,14,1.2,12.8,'concrete',{grip:'r'}),S(24,10,1.2,22,'concrete',{grip:'l'}),
      P(23,23,1.0,0.4,'concrete'),S(16.5,14,3.1,0.6,'lead'),S(0,12.6,3,0.6,'lead')];
    R.magnetRects=[{x:4,y:27.1,w:17,h:0.7},{x:2,y:9.1,w:15,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    R.hazards=[{x:5,y:33.4,w:15,h:1.2,kind:'pit',back:{x:2,y:30.32}}];
    R.doors=[{x:0.0,y:29.9,w:1.2,h:2.1,to:'z4_antechamber',link:'b_low',label:'ПРЕДПЕЧАТЬЕ'},
      {x:0.0,y:10.5,w:1.2,h:2.1,to:'z4_antechamber',link:'b_top',label:'ПРЕДПЕЧАТЬЕ'}];
    R.interactables=gs.flags.gaugeB?[]:[{kind:'gauge',x:1.6,y:12.6,label:'МАНОМЕТР B',flag:'gaugeB'}];
    R.checkpoint={x:2.6,y:32,h:1.7,lit:gs.cp.room==='z4_exam_b'};
    R.lights=[lit(3,29,6,'#e8e8e8',0.65),lit(12,25,7,'#8fb6c9',0.6),lit(22.4,28,5,'#e8e8e8',0.6),
      lit(22.4,19,5,'#e8e8e8',0.6),lit(18,12,6,'#8fb6c9',0.6),lit(9,7.5,7,'#8fb6c9',0.6),
      lit(1.6,11.6,4,gs.flags.gaugeB?'#69d68f':'#c8452f',0.9),lit(12,33.6,6,'#c8452f',0.4)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraTop=(c,L,r)=>{for(const m of R.magnetRects){Kit.plate(c,m.x,m.y,m.w,m.h,'steel',990+m.y,{rust:0.2,boltStep:0.9});
        Kit.magnetRivets(c,m.x,m.y+m.h-0.5,m.w);}};
    R.extraGame=(c,L,r)=>{
      Kit.spikes(c,5,33.2,15,1.4);
      for(let i=0;i<5;i++)Kit.stencil(c,6+i*3,32.6,'ЗАМОК '+(i+1),0.28,'rgba(232,232,232,.4)',0.4);
      c.fillStyle='rgba(8,9,11,.6)';c.fillRect(20.8,10,3.2,22);
      Kit.plate(c,0.3,10.8,2.4,1.6,'lead',995,{bolts:true});
      Kit.gauge(c,1.5,11.6,0.45,gs.flags.gaugeB?0.9:0.0);
      Kit.stencil(c,0.3,10.4,'МАГИСТРАЛЬ B',0.26,'rgba(232,232,232,.65)',0.65);
      for(let i=0;i<6;i++){const x=(i%2)?1.0:15.2,y=30-i*4.2;
        Kit.gear(c,x,y,0.55,12,i*0.4,'#5d6067');c.fillStyle='#33363c';c.fillRect(x-0.08,y,0.16,1.2);}
      for(let i=0;i<3;i++)Kit.lightStrip(c,4+i*6,1.2,4,0.14);
      Kit.pipe(c,[[25.6,0],[25.6,36]],0.22,'lead',{seed:996,rustN:0});
    };
  }}),
z4_exam_c:gs=>({id:'z4_exam_c',zone:'seal',name:'ЭКЗАМЕН C · ЗАЛ АРХИВОВ',w:42,h:20,
  art:{bg:Art.bgSeal,mid:Art.midSeal,game:Art.gameSeal},
  build(R){
    R.solids=[S(-2,-2,46,2.4,'lead'),S(-2,0,2,20,'lead'),S(42,0,2,20,'lead'),S(0,17,42,3,'lead'),
      P(8,13.4,6,0.4,'lead'),P(28,13.4,6,0.4,'lead')];
    R.doors=[{x:0.0,y:14.9,w:1.2,h:2.1,to:'z4_antechamber',tx:37.4,ty:21.6,label:'ПРЕДПЕЧАТЬЕ'}];
    R.pushables=[];
    for(let i=0;i<3;i++){if(gs.flags['core_'+i])continue;
      R.pushables.push({x:6+i*11,y:15.6,w:1.4,h:1.4,id:'core'+i,kind:'core',slotX:34.05+i*2.4,flag:'core_'+i});}
    R.enemies=gs.flags.c_clear?[]:[{type:'clockmaker',x:20,y:15.0,patrol:[10,32]},
      {type:'clockmaker',x:30,y:11.4,patrol:[26,36]}];
    R.clearFlag='c_clear';
    R.interactables=((gs.flags.cores_placed||0)>=3&&!gs.flags.gaugeC)?
      [{kind:'gauge',x:38.6,y:16.6,label:'МАНОМЕТР C',flag:'gaugeC'}]:[];
    if(!gs.loreIds[12])R.interactables.push({kind:'lore',loreId:12,x:4.6,y:17,title:'ЦИЛИНДР №12 · ТЕЛЕМЕТРИЯ ПОВЕРХНОСТИ',
      text:'«ЗАПИСЬ ЗА ВЧЕРА: +22°C, ВЕТЕР ЮГО-ЗАПАДНЫЙ, ОБЛАЧНОСТЬ 30%. ТРАВА. ПТИЦЫ. ДАТЧИКИ ИСПРАВНЫ 214 ЛЕТ. ЧИТАЛ ТОЛЬКО СОВЕТ.»'});
    R.checkpoint={x:2.6,y:17,h:1.7,lit:gs.cp.room==='z4_exam_c'};
    R.lights=[lit(8,4,8,'#e8e8e8',0.7),lit(21,3.4,9,'#e8e8e8',0.75),lit(34,4,8,'#e8e8e8',0.7),
      lit(38.6,16,4,gs.flags.gaugeC?'#69d68f':'#c8452f',0.9),lit(35,15.4,4,'#8fb6c9',0.5),lit(1.4,15.6,3,'#e8e8e8',0.5)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{
      for(let i=0;i<5;i++){const x=3+i*8;
        Kit.plate(c,x,9.0,3.4,8.0,'lead',1000+i,{bolts:true});
        for(let k=0;k<5;k++){
          c.fillStyle='#22242a';c.fillRect(x+0.2,9.4+k*1.5,3.0,0.14);
          for(let j=0;j<5;j++){const cx=x+0.4+j*0.6,cy=9.3+k*1.5;
            const g2=c.createLinearGradient(cx,cy,cx+0.3,cy);
            g2.addColorStop(0,'#6d5416');g2.addColorStop(.4,'#c9a227');g2.addColorStop(1,'#4e3c12');
            c.fillStyle=g2;rr(c,cx,cy-0.5,0.3,0.5,0.1);c.fill();}}}
      for(let i=0;i<3;i++){const x=34+i*2.4;
        c.fillStyle='#22242a';rr(c,x-0.8,15.0,1.7,2.0,0.16);c.fill();
        c.strokeStyle='#b08d3e';c.lineWidth=0.1;c.strokeRect(x-0.8,15.0,1.7,2.0);
        if(gs.flags['core_'+i])Kit.leadCore(c,x+0.05,16.0,0.72);
        Kit.stencil(c,x-0.8,14.7,'ГНЕЗДО '+(i+1),0.22,'rgba(232,232,232,.5)',0.5);}
      for(let i=0;i<4;i++)Kit.lightStrip(c,3+i*11,2.5,6,0.16);
      Kit.plate(c,37.4,15.4,2.4,1.6,'lead',1010,{bolts:true});
      Kit.gauge(c,38.6,16.2,0.5,gs.flags.gaugeC?0.9:0.0);
      Kit.stencil(c,37.4,15.0,'МАГИСТРАЛЬ C',0.28,'rgba(232,232,232,.6)',0.6);
      Kit.stencil(c,2.6,13.6,'ЯДРА ИДУТ ТОЛЬКО ИМПУЛЬСОМ',0.36,'rgba(232,232,232,.5)',0.5);
      Kit.pipe(c,[[0,1.6],[42,1.6]],0.26,'lead',{seed:1011,rustN:0});
      for(let i=0;i<10;i++)Kit.bolt(c,2+i*4,17.1,0.08);
    };
  }}),
});
