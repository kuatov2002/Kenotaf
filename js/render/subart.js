"use strict";
/* ============================== SUBZONE ART ==============================
   Каждая подзона — свой визуальный язык внутри зоны: палитра, дымка, свет и композиция фона.
   Слои: far (0.14) — силуэты в дымке и источник света; bg (0.34) — дальние конструкции;
   mid (0.62) — ближние машины; wall — реквизит игрового слоя (до твёрдой геометрии);
   fgd (1.22) — тёмные силуэты у камеры. zone — поправки к ZONES (ambRGB, haze, void, fogA).
   Всё рисуется один раз при входе в комнату (запекается в слой). */
const SA={
  vgrad(c,L,stops){const g=c.createLinearGradient(0,0,0,L.h);for(const s of stops)g.addColorStop(s[0],s[1]);c.fillStyle=g;c.fillRect(0,0,L.w,L.h);},
  glow(c,x,y,r,col,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(0.4,rgba(col,a*0.35));g.addColorStop(1,rgba(col,0));
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();},
  band(c,L,y,h,col,a){const g=c.createLinearGradient(0,y-h,0,y+h);g.addColorStop(0,rgba(col,0));g.addColorStop(0.5,rgba(col,a));g.addColorStop(1,rgba(col,0));
    c.fillStyle=g;c.fillRect(0,y-h,L.w,h*2);},
  /* кирпич: ряды со смещением, швы, пятна копоти */
  bricks(c,x,y,w,h,bw,bh,base,mortar,r,soot){
    c.fillStyle=base;c.fillRect(x,y,w,h);
    c.fillStyle=mortar;for(let yy=y;yy<y+h;yy+=bh)c.fillRect(x,yy,w,bh*0.12);
    for(let row=0,yy=y;yy<y+h;yy+=bh,row++){const off=(row%2)*bw*0.5;
      for(let xx=x-off;xx<x+w;xx+=bw){c.fillRect(Math.max(x,xx),yy,bh*0.12,bh);
        if(r()<0.35){c.fillStyle='rgba(0,0,0,'+(r()*0.18)+')';c.fillRect(Math.max(x,xx)+0.03,yy+bh*0.12,Math.min(bw,x+w-xx)-0.06,bh*0.88);c.fillStyle=mortar;}
        if(r()<0.08){c.fillStyle='rgba(255,220,180,.05)';c.fillRect(Math.max(x,xx)+0.03,yy+bh*0.12,bw-0.06,bh*0.3);c.fillStyle=mortar;}}}
    if(soot)for(let i=0;i<w/3;i++){const sx=x+r()*w,g=c.createLinearGradient(0,y,0,y+h);
      g.addColorStop(0,'rgba(10,8,6,'+(0.25+r()*0.35)+')');g.addColorStop(1,'rgba(10,8,6,0)');c.fillStyle=g;c.fillRect(sx,y,0.8+r()*2.4,h*(0.4+r()*0.6));}},
  /* кафель: эмалевые квадраты, сколы, потёки ржавчины */
  tiles(c,x,y,w,h,s,base,line,r){
    c.fillStyle=base;c.fillRect(x,y,w,h);c.strokeStyle=line;c.lineWidth=0.035;c.beginPath();
    for(let xx=x;xx<=x+w;xx+=s){c.moveTo(xx,y);c.lineTo(xx,y+h);}for(let yy=y;yy<=y+h;yy+=s){c.moveTo(x,yy);c.lineTo(x+w,yy);}c.stroke();
    for(let i=0;i<w*h*0.06;i++){const tx=x+Math.floor(r()*w/s)*s,ty=y+Math.floor(r()*h/s)*s;
      c.fillStyle=r()<0.5?'rgba(0,0,0,.22)':'rgba(255,255,255,.06)';c.fillRect(tx+0.02,ty+0.02,s-0.04,s-0.04);}
    for(let i=0;i<w/2;i++){const sx=x+r()*w,sy=y+r()*h*0.5,g=c.createLinearGradient(0,sy,0,sy+2+r()*4);
      g.addColorStop(0,'rgba(110,60,30,.4)');g.addColorStop(1,'rgba(110,60,30,0)');c.fillStyle=g;c.fillRect(sx,sy,0.08+r()*0.12,6);}},
  /* силуэт механизма-ремонтника на крюке (сборочный конвейер) */
  hungMech(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=col;c.strokeStyle=col;c.lineWidth=0.06;
    c.beginPath();c.moveTo(0,-3);c.lineTo(0,-0.2);c.stroke();
    rr(c,-0.45,-0.2,0.9,0.75,0.2);c.fill();c.beginPath();c.arc(0,0.85,0.32,0,TAU);c.fill();
    c.beginPath();c.moveTo(-0.3,0.5);c.lineTo(-0.5,1.5);c.lineTo(-0.3,2.1);c.moveTo(0.3,0.5);c.lineTo(0.45,1.4);c.lineTo(0.65,2.0);c.stroke();
    c.beginPath();c.moveTo(0.4,0.2);c.lineTo(0.95,0.7);c.lineTo(1.1,1.2);c.stroke();c.restore();},
  /* перспективные арки туннеля к точке схода */
  tunnel(c,cx,cy,n,w0,h0,col,line){for(let i=n;i>=1;i--){const k=i/n,w=w0*k,h=h0*k;
    c.fillStyle=shade(col,-0.5+0.5*(1-k));c.beginPath();c.moveTo(cx-w/2,cy+h*0.5);c.lineTo(cx-w/2,cy-h*0.1);
    c.quadraticCurveTo(cx-w/2,cy-h*0.5,cx,cy-h*0.5);c.quadraticCurveTo(cx+w/2,cy-h*0.5,cx+w/2,cy-h*0.1);c.lineTo(cx+w/2,cy+h*0.5);c.closePath();c.fill();
    c.strokeStyle=line;c.lineWidth=0.12*k+0.04;c.stroke();}}
};
const SUBART={};
/* ---------- I · ОТСТОЙНИК ---------- */
/* МАСТЕРСКИЕ: кафельные ремонтные цеха, ряды рабочих ламп, на крюках — недособранные механизмы */
SUBART.workshop={zone:{ambRGB:[122,114,100],haze:'#4c4840',void:'#0a0908'},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#151311'],[0.6,'#1d1a16'],[1,'#121110']]);
    for(let k=0;k<3;k++){const y=L.h*(0.18+k*0.22);for(let x=-2;x<L.w+2;x+=3.2+k){SA.glow(c,x+r(),y,1.4-k*0.3,'#ffd9a0',0.18-k*0.04);
      c.fillStyle='rgba(255,226,170,.5)';c.fillRect(x+r()-0.4+k*0.1,y,0.8-k*0.2,0.08);}}
    for(let i=0;i<L.w/2.6;i++)SA.hungMech(c,i*2.6+r()*1.2,L.h*0.45+r()*L.h*0.1,0.7+r()*0.4,'rgba(20,18,16,.85)');
    c.fillStyle='#0d0c0a';c.fillRect(0,L.h*0.82,L.w,L.h*0.18);},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#1c1916'],[1,'#141210']]);
    SA.tiles(c,0,L.h*0.3,L.w,L.h*0.7,1.4,'#3a3a35','rgba(0,0,0,.45)',r);
    for(let x=2;x<L.w;x+=9+r()*5){c.fillStyle='#22201c';c.fillRect(x,0,1.2,L.h);c.fillStyle='rgba(255,255,255,.04)';c.fillRect(x,0,0.12,L.h);}
    for(let i=0;i<L.w/6;i++)SA.hungMech(c,r()*L.w,L.h*0.25+r()*L.h*0.2,1.0+r()*0.5,'rgba(14,13,11,.9)');
    Kit.craneGirder(c,0,L.h*0.12,L.w,0.8);},
  mid(c,L,R,r){for(let i=0;i<Math.max(1,L.w/14);i++){const x=3+i*14+r()*4;
      Kit.plate(c,x,L.h*0.5,3.2,L.h*0.5,'steel',(i*11)|0,{rust:0.4});
      for(let k=0;k<4;k++){c.fillStyle='#1a1916';c.fillRect(x+0.3,L.h*0.55+k*1.3,2.6,0.12);
        for(let j=0;j<5;j++){c.fillStyle=['#8a9299','#b08d3e','#717a82'][(j+k)%3];c.fillRect(x+0.45+j*0.5,L.h*0.55+k*1.3-0.5,0.08,0.5);}}}
    for(let i=0;i<5;i++)Kit.chain(c,r()*L.w,0,2+r()*5,0.11);},
  wall(c,L,R,r){
    SA.tiles(c,0,0,L.w,L.h,0.9,'rgba(64,64,58,.9)','rgba(0,0,0,.38)',r);
    c.fillStyle='rgba(30,26,22,.55)';c.fillRect(0,L.h*0.62,L.w,L.h*0.38);
    c.fillStyle='rgba(201,162,39,.35)';c.fillRect(0,L.h*0.62,L.w,0.08);
    for(let i=0;i<L.w/9;i++){const x=1+r()*(L.w-3),y=L.h*0.35+r()*L.h*0.2;
      if(r()<0.5){Kit.plate(c,x,y,2.2,1.3,'ply',(i*7)|0,{rust:0.2});
        for(let k=0;k<5;k++){c.strokeStyle='#22262a';c.lineWidth=0.07;c.beginPath();c.moveTo(x+0.3+k*0.4,y+0.3);c.lineTo(x+0.3+k*0.4,y+0.9+r()*0.2);c.stroke();}}
      else Kit.stencil(c,x,y,['ЦЕХ ОБСЛУЖИВАНИЯ','ПРОВЕРЬ ДАВЛЕНИЕ','ПОСТ 3','МЕХАНИЗМ — ДРУГ ЯРУСА'][(r()*4)|0],0.42,'rgba(216,204,178,.4)',0.4);}
    for(let x=2;x<L.w;x+=6+r()*3){Kit.lampCage(c,x,1.6+r()*0.6,0.26);}
    for(let i=0;i<L.w/12;i++)Kit.oilStain(c,r()*L.w,L.h-0.5-r()*2,0.8+r(),r);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++)Kit.chain(c,r()*L.w,0,L.h*(0.2+r()*0.3),0.2);
    for(let i=0;i<2;i++)SA.hungMech(c,r()*L.w,L.h*0.12,1.8,'rgba(8,7,6,1)');}
};
/* НАСОСНЫЕ: как было — ряды насосов и маховики (язык зоны по умолчанию) */
SUBART.pumps={zone:{}};
/* ДРЕНАЖИ: мокрый бетон, зелёный хладагент, туннели к точке схода, капель */
SUBART.drains={zone:{ambRGB:[78,100,86],haze:'#2f4a3a',void:'#050806',fogA:0.12},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#0a0f0c'],[0.7,'#10201a'],[1,'#1a3a2a']]);
    const n=Math.max(1,Math.round(L.w/30));for(let i=0;i<n;i++){const cx=(i+0.5)*L.w/n+(r()-0.5)*4,cy=L.h*0.62;
      SA.tunnel(c,cx,cy,7,L.w/n*0.9,L.h*0.9,'#2a332e','rgba(140,255,190,.06)');
      SA.glow(c,cx,cy+L.h*0.12,L.h*0.35,'#69d68f',0.32);
      c.fillStyle='rgba(120,240,170,.22)';c.fillRect(cx-L.w/n*0.3,cy+L.h*0.32,L.w/n*0.6,0.12);}},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#0e1311'],[1,'#13201a']]);
    for(let x=0;x<L.w;x+=7+r()*4){const w=3+r()*2;c.fillStyle='#1c2420';c.beginPath();c.moveTo(x,L.h);c.lineTo(x,L.h*0.45);
      c.arc(x+w/2,L.h*0.45,w/2,PI,0);c.lineTo(x+w,L.h);c.closePath();c.fill();
      c.strokeStyle='rgba(140,200,170,.1)';c.lineWidth=0.18;c.stroke();
      const g=c.createLinearGradient(0,L.h*0.45,0,L.h);g.addColorStop(0,'rgba(60,140,95,0)');g.addColorStop(1,'rgba(60,160,105,.28)');c.fillStyle=g;c.fillRect(x+0.2,L.h*0.45,w-0.4,L.h*0.55);}
    for(let i=0;i<4;i++){const y=1+r()*L.h*0.3;Kit.pipe(c,[[0,y],[L.w,y+(r()-0.5)]],0.3+r()*0.2,'rust',{seed:i+80});}},
  mid(c,L,R,r){for(let i=0;i<Math.max(1,L.w/18);i++){const x=4+i*18+r()*5;Kit.plate(c,x,L.h*0.45,3.6,L.h*0.55,'concrete',(i*13)|0,{rust:0.3});
      Kit.valve(c,x+1.8,L.h*0.6,0.7,r()*TAU,'#8a6d2a');
      c.fillStyle='rgba(105,214,143,.25)';c.fillRect(x+0.4,L.h-1.6,2.8,1.6);}
    for(let i=0;i<14;i++){const x=r()*L.w;c.strokeStyle='rgba(159,196,208,.18)';c.lineWidth=0.03;c.beginPath();c.moveTo(x,0);c.lineTo(x,r()*L.h*0.6);c.stroke();}},
  wall(c,L,R,r){c.fillStyle='rgba(40,46,42,.92)';c.fillRect(0,0,L.w,L.h);
    c.save();c.globalAlpha=0.35;c.fillStyle=PAT(c,'concrete');c.fillRect(0,0,L.w,L.h);c.restore();
    for(let x=0;x<L.w;x+=4){c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=0.05;c.beginPath();c.moveTo(x,0);c.lineTo(x,L.h);c.stroke();}
    /* потёки и водоросли — по стене вниз к уровню воды */
    for(let i=0;i<L.w*0.8;i++){const x=r()*L.w,y=r()*L.h*0.6,len=1+r()*5,g=c.createLinearGradient(0,y,0,y+len);
      g.addColorStop(0,'rgba(60,110,80,.0)');g.addColorStop(0.5,'rgba(60,120,80,'+(0.15+r()*0.2)+')');g.addColorStop(1,'rgba(60,110,80,0)');
      c.fillStyle=g;c.fillRect(x,y,0.1+r()*0.25,len);}
    c.fillStyle='rgba(70,140,100,.18)';c.fillRect(0,L.h*0.7,L.w,0.25);
    for(let i=0;i<L.w/10;i++)Kit.vent(c,r()*(L.w-2),1+r()*L.h*0.4,1.2+r(),0.8);
    for(let i=0;i<L.w/14;i++)Kit.stencil(c,r()*(L.w-4),2+r()*L.h*0.4,['КАНАЛ '+((r()*9|0)+1),'ХЛАДАГЕНТ','СЛИВ','НЕ ПИТЬ'][(r()*4)|0],0.42,'rgba(150,230,180,.38)',0.4);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w;Kit.pipe(c,[[x,0],[x+(r()-0.5)*2,L.h]],0.5+r()*0.3,'rust',{seed:i+90});}
    for(let i=0;i<20;i++){const x=r()*L.w;c.strokeStyle='rgba(20,40,30,.8)';c.lineWidth=0.06;c.beginPath();c.moveTo(x,0);c.quadraticCurveTo(x+0.3,1,x,1.5+r()*2);c.stroke();}}
};
/* ЛИТЕЙКА: копоть, кирпич, оранжевое жерло печи, ковши на цепях, жар */
SUBART.foundry={zone:{ambRGB:[150,96,64],haze:'#5a2e18',void:'#0b0503',fogA:0.1,grain:0.05},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#120806'],[0.6,'#2a1208'],[1,'#4a1e0a']]);
    const n=Math.max(1,Math.round(L.w/34));
    for(let i=0;i<n;i++){const cx=(i+0.5)*L.w/n,cy=L.h*0.78,w=Math.min(L.w/n*0.6,16),h=L.h*0.5;
      SA.glow(c,cx,cy,h*1.2,'#ff7a2a',0.45);
      c.fillStyle='#160a06';c.beginPath();c.moveTo(cx-w,L.h);c.lineTo(cx-w,cy-h*0.4);c.quadraticCurveTo(cx,cy-h*1.1,cx+w,cy-h*0.4);c.lineTo(cx+w,L.h);c.closePath();c.fill();
      const g=c.createRadialGradient(cx,cy,0,cx,cy,w*0.6);g.addColorStop(0,'#ffe0a0');g.addColorStop(0.35,'#ff9c3a');g.addColorStop(1,'#7a2a08');
      c.fillStyle=g;c.beginPath();c.moveTo(cx-w*0.5,L.h);c.lineTo(cx-w*0.5,cy-h*0.1);c.quadraticCurveTo(cx,cy-h*0.55,cx+w*0.5,cy-h*0.1);c.lineTo(cx+w*0.5,L.h);c.closePath();c.fill();}
    for(let i=0;i<L.w/5;i++){const x=r()*L.w;Kit.chain(c,x,0,L.h*(0.2+r()*0.4),0.16);}
    for(let i=0;i<60;i++){c.fillStyle='rgba(255,170,80,'+(r()*0.5)+')';c.fillRect(r()*L.w,r()*L.h,0.06,0.06);}},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#140a07'],[1,'#22100a']]);
    SA.bricks(c,0,0,L.w,L.h,1.6,0.7,'#2a1610','rgba(10,5,3,.9)',r,true);
    for(let x=3;x<L.w;x+=11+r()*6){const w=4+r()*2;c.fillStyle='#0c0604';c.beginPath();c.moveTo(x,L.h);c.lineTo(x,L.h*0.55);c.arc(x+w/2,L.h*0.55,w/2,PI,0);c.lineTo(x+w,L.h);c.closePath();c.fill();
      SA.glow(c,x+w/2,L.h*0.85,w*0.9,'#ff8a3a',0.35);}
    for(let i=0;i<Math.max(2,L.w/16);i++){const x=r()*L.w;c.fillStyle='#120806';c.fillRect(x,0,1.4,L.h*0.5);
      c.fillStyle='rgba(255,140,60,.12)';c.fillRect(x+1.1,0,0.3,L.h*0.5);}},
  mid(c,L,R,r){for(let i=0;i<Math.max(1,L.w/15);i++){const x=4+i*15+r()*5,y=L.h*(0.25+r()*0.2);
      Kit.chain(c,x,0,y,0.15);c.save();c.translate(x,y);
      c.fillStyle='#1d140f';c.beginPath();c.moveTo(-1.3,0);c.lineTo(1.3,0);c.lineTo(0.9,1.6);c.lineTo(-0.9,1.6);c.closePath();c.fill();
      c.fillStyle='#ff9c3a';c.fillRect(-1.2,0.02,2.4,0.16);SA.glow(c,0,0,1.6,'#ff8a3a',0.35);
      c.strokeStyle='#3a2a20';c.lineWidth=0.12;c.strokeRect(-1.3,0,2.6,1.6);c.restore();}
    for(let i=0;i<Math.max(1,L.w/20);i++){const x=r()*L.w;for(let k=0;k<4;k++)Kit.plate(c,x,L.h-1.2-k*1.0,2.4,0.9,'iron',(i*5+k)|0,{rust:0.8});}},
  wall(c,L,R,r){SA.bricks(c,0,0,L.w,L.h,1.2,0.55,'rgba(52,30,22,.95)','rgba(14,8,5,.95)',r,true);
    c.fillStyle='rgba(255,120,40,.06)';c.fillRect(0,L.h*0.55,L.w,L.h*0.45);
    for(let i=0;i<L.w/8;i++){const x=r()*(L.w-2),y=L.h*0.3+r()*L.h*0.3;
      if(r()<0.4)Kit.sign(c,x,y,2.6,0.7,['ЖАР · НЕ ПОДХОДИТЬ','ЛИТЬЁ ИДЁТ','НОРМА — ПРЕДЕЛ'][(r()*3)|0],'#c8452f','#f0e2cf',(i*9)|0);
      else{for(let k=0;k<3;k++)Kit.plate(c,x+k*0.7,y+0.6,0.6,0.5,'iron',(i*3+k)|0,{rust:0.9});}}
    for(let i=0;i<L.w/6;i++)Kit.oilStain(c,r()*L.w,L.h-0.5-r()*1.5,1+r()*1.5,r);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<4;i++)Kit.chain(c,r()*L.w,0,L.h*(0.3+r()*0.4),0.22);
    for(let i=0;i<2;i++){const x=r()*L.w;c.fillStyle='#080403';c.fillRect(x,0,1.6,L.h);}}
};
/* КОТЕЛЬНЫЕ: огромные клёпаные котлы, красные манометры, пар, кирпич */
SUBART.boiler={zone:{ambRGB:[130,100,84],haze:'#4a2a22',void:'#0a0605'},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#120c0a'],[1,'#26140f']]);
    for(let i=0;i<Math.max(2,L.w/12);i++){const x=i*12+r()*3,w=8+r()*3,y=L.h*(0.25+r()*0.15);
      const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#160d0a');g.addColorStop(0.35,'#3a2a22');g.addColorStop(0.55,'#2a1d18');g.addColorStop(1,'#120a08');
      c.fillStyle=g;rr(c,x,y,w,L.h-y,w*0.45);c.fill();
      for(let k=1;k<4;k++){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,y+(L.h-y)*k/4,w,0.18);}
      SA.glow(c,x+w*0.5,y+2,1.2,'#ff5a3a',0.4);}
    for(let i=0;i<40;i++){c.fillStyle='rgba(230,220,200,'+(r()*0.06)+')';c.beginPath();c.ellipse(r()*L.w,r()*L.h*0.6,2+r()*4,1+r()*2,0,0,TAU);c.fill();}},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#160e0b'],[1,'#1e120e']]);SA.bricks(c,0,0,L.w,L.h,1.8,0.8,'#2a1a14','rgba(8,5,4,.9)',r,true);
    for(let i=0;i<Math.max(1,L.w/14);i++)Kit.tank(c,2+i*14+r()*4,L.h*0.3,5+r()*2,L.h*0.7,{seed:(i*7)|0,label:'КОТЁЛ '+(i+1)});},
  mid(c,L,R,r){for(let i=0;i<Math.max(1,L.w/10);i++){const x=r()*L.w,y=L.h*(0.3+r()*0.4);
      Kit.plate(c,x,y,1.6,1.1,'steel',(i*5)|0,{rust:0.5});Kit.gauge(c,x+0.5,y+0.55,0.3,0.6+r()*0.35);Kit.gauge(c,x+1.15,y+0.55,0.24,0.8+r()*0.2);
      SA.glow(c,x+0.8,y+0.5,1,'#ff5a3a',0.1);}
    for(let i=0;i<5;i++){const y=1+r()*L.h*0.4;Kit.pipe(c,[[0,y],[L.w*0.4,y],[L.w*0.4,y+2],[L.w,y+2]],0.25+r()*0.2,'steel',{seed:i+40,band:2,bandCol:'#c8452f'});}},
  wall(c,L,R,r){SA.bricks(c,0,0,L.w,L.h,1.3,0.6,'rgba(58,36,28,.95)','rgba(16,9,7,.95)',r,true);
    for(let i=0;i<L.w/10;i++){const x=1+r()*(L.w-3),y=L.h*0.3+r()*L.h*0.25;Kit.plate(c,x,y,1.4,1.0,'steel',(i*3)|0,{rust:0.6});
      Kit.gauge(c,x+0.7,y+0.5,0.32,0.5+r()*0.5);}
    for(let i=0;i<L.w/16;i++)Kit.sign(c,r()*(L.w-3),2+r()*3,2.8,0.7,['ДАВЛЕНИЕ · ВЫСОКОЕ','КОТЁЛ ПОД НАДЗОРОМ','ПРЕДЕЛ — 41 АТМ'][(r()*3)|0],'#c9a227','#191612',(i*13)|0);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const y=r()*L.h*0.4;Kit.pipe(c,[[0,y],[L.w,y+(r()-0.5)*2]],0.5,'steel',{seed:i+70});}}
};
