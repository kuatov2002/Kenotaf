"use strict";
/* ============================== ИСПЫТАТЕЛЬНЫЕ СТЕНДЫ (по одному на зону) ==============================
   Необязательные комнаты-полосы: техника зоны одной связкой, на время (js/world/trials.js).
   Каждая полоса проходима в обе стороны: сорвался — не ловушка, а сброс к столбу. */
const trialPit=(x,y,w,back)=>({x,y,w,h:1.2,kind:'pit',look:'coolant',back});
Object.assign(ROOMDEFS,{
/* I · ОТСТОЙНИК — рывок, пар с паузой, клапаны-отбойники над провалом, пирамида ящиков */
z1_trial:gs=>({id:'z1_trial',zone:'sump',sub:'workshop',name:'СТЕНД ОБХОДЧИКОВ',w:58,h:18,trial:true,
  art:RB.art('sump','workshop'),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});
    const back={x:52,y:15-1.68};
    R.solids.push(S(46,15,12,3,'rust'),S(39.5,16.8,6.5,1.2,'rust'),S(31,15,8.5,3,'rust'),S(15,16.8,16,1.2,'rust'),
      S(11.5,13,3.5,5,'steel'),S(8,11,3.5,7,'steel'),S(4.5,13,3.5,5,'steel'),S(0,15,4.5,3,'rust'));
    R.hazards=[trialPit(39.5,15.6,6.5,back),trialPit(15,15.6,16,back),
      {x:33.4,y:4.5,w:1.3,h:10.5,kind:'steam',per:2.4,on:0.9,off:0},{x:36.2,y:4.5,w:1.3,h:10.5,kind:'steam',per:2.4,on:0.9,off:1.2}];
    R.pogos=[{x:27,y:13.2,r:0.5,len:3.6},{x:23,y:12.8,r:0.5,len:4.0},{x:19,y:13.2,r:0.5,len:3.6}];
    R.doors=[RB.R(R,15,'z1_boiler','КОТЕЛЬНАЯ')];
    R.interactables.push({kind:'trialpost',x:52,y:15,w:1.4,h:3.4,face:-1},{kind:'trialbell',x:2.2,y:15,w:1.8,h:3.4});
    R.lights=[lit(52,4,9,'#ffd9a0',0.9),lit(35,3,8,'#ff9a5a',0.6),lit(23,6,9,'#ffd9a0',0.7),lit(9.8,5,7,'#ffd9a0',0.8),lit(2.2,10,4,'#ffe6a3',0.9),lit(56.8,13,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:12},{type:'steam',x:34,y:4.6,rate:0.4},{type:'steam',x:36.8,y:4.6,rate:0.4}];
    R.extraGame=(c,L,r)=>{
      Kit.stencil(c,44,7.4,'СТЕНД ОБХОДЧИКОВ · ДОПУСК К МАГИСТРАЛИ',0.36,'rgba(216,204,178,.5)',0.5);
      Kit.sign(c,32,8.2,6,0.8,'ПРОДУВКА · ПРОХОД В ПАУЗУ','#c8452f','#f0e2cf',911);
      Kit.sign(c,20,7.6,8,0.8,'НАД ПРОВАЛОМ — ТОЛЬКО ПО КЛАПАНАМ','#c9a227','#191612',912);
      Kit.pipe(c,[[0,1.4],[58,1.4]],0.2,'steel',{seed:913,band:3,bandCol:'#c9a227'});
      /* табло обходчиков: фамилии мелом, лучшие времена — красным */
      Kit.plate(c,4.6,4.2,3.2,2.2,'steel',914,{bolts:true});c.fillStyle='#14110d';c.fillRect(4.8,4.4,2.8,1.8);
      c.fillStyle='rgba(232,224,208,.55)';c.font='0.18px Oswald';['ГРИШИН  0:07','ЛАПИНА  0:07','38       0:05'].forEach((s,i)=>c.fillText(s,5.0,4.75+i*0.42));
    };
  }}),
/* II · СОТЫ — пролёт на гарпуне над провалом, дымоход на кошках, прыжок по крыше */
z2_trial:gs=>({id:'z2_trial',zone:'hives',sub:'roofs',name:'КРЫШНЫЙ ПРОБЕГ',w:60,h:24,trial:true,
  art:RB.art('hives','roofs'),
  build(R){
    RB.shell(R,'concrete',{ceil:0.4});
    const back={x:55,y:21-1.68};
    R.solids.push(S(50,21,10,3,'concrete'),S(34,22.8,16,1.2,'concrete'),S(0,21,34,3,'concrete'),
      /* дымоход: левая стена рифлёная справа, правая — слева; под обеими — проход 2.2 м */
      S(20.6,6.4,1.2,12.4,'concrete',{grip:'r'}),S(25.4,5,1.2,13.8,'concrete',{grip:'l'}),
      /* крыша над дымоходом: два ската с разрывом */
      S(13.6,6.4,7,0.8,'concrete'),S(2,6.4,6.6,0.8,'concrete'));
    RB.ring(R,45,13.5,'top',13.1);RB.ring(R,38.5,13.5,'top',13.1);
    R.hazards=[trialPit(34,21.6,16,back)];
    R.doors=[RB.R(R,21,'z2_chapel','ЧАСОВНЯ ОСНОВАТЕЛЕЙ')];
    R.interactables.push({kind:'trialpost',x:55,y:21,w:1.4,h:3.4,face:-1},{kind:'trialbell',x:4.2,y:6.4,w:1.8,h:3.4});
    R.lights=[lit(55,8,9,'#ffd9a0',0.85),lit(42,6,10,'#ffcf7a',0.75),lit(23,10,7,'#ffb070',0.7),lit(11,3,8,'#ffd9a0',0.8),lit(4,4,4,'#ffe6a3',0.9),lit(58.8,19,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:10},{type:'smoke',x:23,y:2,rate:0.3}];
    R.extraGame=(c,L,r)=>{
      Kit.stencil(c,46,10,'ПРОЛЁТ № 7 · СДАЧА МОНТАЖНИКАМИ',0.36,'rgba(216,204,178,.5)',0.5);
      Kit.sign(c,27.2,14,4.4,0.7,'ДЫМОХОД · КОШКИ','#c9a227','#191612',921);
      /* бельё и антенны на крыше: здесь сушили и чинили */
      c.strokeStyle='rgba(190,180,160,.6)';c.lineWidth=0.03;c.beginPath();c.moveTo(2,4.2);c.quadraticCurveTo(5,5,8.6,4.2);c.stroke();
      for(let i=0;i<4;i++){c.fillStyle=['#8a6f5a','#6f7f86','#a8936e','#7a5f6a'][i];c.fillRect(2.6+i*1.5,4.4+Math.sin(i)*0.1,0.6,0.8);}
    };
  }}),
/* III · САДЫ — две латунные траверсы над каналом, гарпун на уступ */
z3_trial:gs=>({id:'z3_trial',zone:'eden',sub:'irrigation',name:'ТРАВЕРСА ТЕПЛИЦ',w:52,h:22,trial:true,
  art:RB.art('eden','irrigation'),
  build(R){
    RB.shell(R,'marble',{ceil:0.4});
    const back={x:4,y:18-1.68};
    R.solids.push(S(0,18,9,4,'marble'),S(9,20.8,27,1.2,'marble'),S(36,18,16,4,'marble'),S(47.5,11.4,4.5,0.8,'marble'));
    R.magnetRects=[{x:7,y:12.3,w:12,h:0.7},{x:23.5,y:12.3,w:11,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    RB.ring(R,45.5,8.6,'top',8.2);
    R.hazards=[trialPit(9,19.6,27,back)];
    R.doors=[RB.L(18,'z3_vineyard','ВИНОГРАДНЫЕ ТЕРРАСЫ')];
    R.interactables.push({kind:'trialpost',x:4,y:18,w:1.4,h:3.4,face:1},{kind:'trialbell',x:50.4,y:11.4,w:1.8,h:3.4});
    R.lights=[lit(4,8,9,'#ffe6b0',0.8),lit(14,10,8,'#bfeee8',0.6),lit(29,10,8,'#bfeee8',0.6),lit(40,10,8,'#ffe6b0',0.7),lit(50,6,5,'#ffe6a3',0.9),lit(1.2,16,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:8},{type:'drip',x:20,y:13.2,rate:0.6},{type:'drip',x:30,y:13.2,rate:0.5}];
    R.extraGame=(c,L,r)=>{
      Kit.stencil(c,10,16.4,'ТРАВЕРСА ПОЛИВАЛЬЩИКОВ · ДЕРЖАТЬСЯ ЗА ЛАТУНЬ',0.34,'rgba(216,230,200,.5)',0.5);
      /* шланги и лейки, забытые на траверсе */
      Kit.pipe(c,[[7,11.6],[19,11.6]],0.08,'steel',{seed:931});Kit.pipe(c,[[23.5,11.6],[34.5,11.6]],0.08,'steel',{seed:932});
      for(const x of [12,17,27,32]){c.fillStyle='rgba(90,120,80,.8)';c.fillRect(x,13.0,0.22,0.5+((x*7)%5)/10);}
    };
  }}),
/* IV · ПЕЧАТЬ — три рыма над пропастью, столбы-островки: гарпун → выхлоп → рывок одним жестом */
z4_trial:gs=>({id:'z4_trial',zone:'seal',sub:'gears',name:'ПРОБА ХОДА',w:52,h:20,trial:true,
  art:RB.art('seal','gears'),
  build(R){
    RB.shell(R,'lead',{ceil:0.4});
    const back={x:48,y:17-1.68};
    R.solids.push(S(44,17,8,3,'lead'),S(7,18.8,37,1.2,'lead'),S(30,12,2,6.8,'steel'),S(18,11,2,7.8,'steel'),S(0,13,7,7,'lead'));
    RB.ring(R,39,8.5,'top',8.1);RB.ring(R,25,6,'top',5.6);RB.ring(R,12,7,'top',6.6);
    R.hazards=[trialPit(7,17.6,37,back)];
    R.doors=[RB.R(R,17,'z4_bellows','МЕХИ')];
    R.interactables.push({kind:'trialpost',x:48,y:17,w:1.4,h:3.4,face:-1},{kind:'trialbell',x:3,y:13,w:1.8,h:3.4});
    R.lights=[lit(48,6,9,'#cfe6ee',0.8),lit(31,6,8,'#ffcf7a',0.6),lit(19,5,8,'#ffcf7a',0.6),lit(3,7,6,'#ffe6a3',0.9),lit(50.8,15,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:8},{type:'spark',x:31,y:12,rate:0.2}];
    R.extraGame=(c,L,r)=>{
      Kit.stencil(c,34,3.6,'ПРОБА ХОДА · МАСТЕРАМ ОДИН ЖЕСТ',0.36,'rgba(207,230,238,.5)',0.5);
      for(const x of [31,19])Kit.plate(c,x-0.9,11.6,1.8,0.4,'steel',940+x,{rust:0.3});
    };
  }}),
/* V · АРХИВ — всё вместе: клапаны, траверса, гарпун, выхлоп на верхнюю полку */
z5_trial:gs=>({id:'z5_trial',zone:'archive',sub:'stacks',name:'ЭКЗАМЕН ПОЧТАЛЬОНА',w:60,h:20,trial:true,
  art:RB.art('archive','stacks'),
  build(R){
    RB.shell(R,'steel',{ceil:0.4});
    const back={x:4,y:17-1.68};
    R.solids.push(S(0,17,8,3,'steel'),S(8,18.8,12,1.2,'steel'),S(20,17,4,3,'steel'),S(24,18.8,13,1.2,'steel'),S(37,17,23,3,'steel'),
      S(47,10.6,4,0.8,'ply'),S(56,7.2,4,0.8,'ply'));
    R.pogos=[{x:11.5,y:14.4,r:0.5,len:4.4},{x:15.5,y:14.0,r:0.5,len:4.8}];
    R.magnetRects=[{x:23,y:11.6,w:13,h:0.7}];
    for(const m of R.magnetRects)R.solids.push(S(m.x,m.y,m.w,m.h,'steel'));
    RB.ring(R,44.5,8,'top',7.6);
    R.hazards=[trialPit(8,17.6,12,back),trialPit(24,17.6,13,back)];
    R.doors=[RB.L(17,'z5_broadcast','ВЕЩАТЕЛЬНАЯ')];
    R.interactables.push({kind:'trialpost',x:4,y:17,w:1.4,h:3.4,face:1},{kind:'trialbell',x:58,y:7.2,w:1.8,h:3.4});
    R.lights=[lit(4,7,8,'#ffe6b0',0.8),lit(14,8,8,'#ffd9a0',0.6),lit(29,7,9,'#ffe6b0',0.7),lit(45,5,8,'#ffd9a0',0.7),lit(58,4.4,4,'#ffe6a3',0.9),lit(1.2,15,3,'#8fd6ff',0.5)];
    R.emitters=[{type:'dust',rate:10}];
    R.extraGame=(c,L,r)=>{
      Kit.stencil(c,24,4,'ЭКЗАМЕН ПОЧТАЛЬОНА ВЫСШЕГО РАЗРЯДА',0.38,'rgba(232,224,208,.5)',0.5);
      for(let i=0;i<6;i++)SA.phono(c,38+i*3.2,14.6,1.2);
    };
  }})
});
