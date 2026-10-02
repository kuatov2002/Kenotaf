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

/* ---------- II · ЖИЛЫЕ СОТЫ ---------- */
SA.awning=(c,x,y,w,h,c1,c2)=>{const n=Math.max(2,Math.round(w/0.5));for(let i=0;i<n;i++){c.fillStyle=i%2?c1:c2;
  c.beginPath();c.moveTo(x+i*w/n,y);c.lineTo(x+(i+1)*w/n,y);c.lineTo(x+(i+1)*w/n,y+h);c.quadraticCurveTo(x+(i+0.5)*w/n,y+h+0.18,x+i*w/n,y+h);c.closePath();c.fill();}
  c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x,y,w,0.08);};
SA.garland=(c,x0,y0,x1,y1,sag,col,r)=>{c.strokeStyle='#1c1412';c.lineWidth=0.04;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)/2,(y0+y1)/2+sag,x1,y1);c.stroke();
  for(let k=1;k<9;k++){const t=k/9,x=lerp(x0,x1,t),y=lerp(y0,y1,t)+sag*4*t*(1-t)*0.5+0.12;SA.glow(c,x,y,0.5,col,0.35);c.fillStyle=col;c.beginPath();c.arc(x,y,0.07,0,TAU);c.fill();}};
/* соты-фасады: ячейки квартир, редкие тёплые окна */
SA.honeycomb=(c,x,y,w,h,s,body,win,r,lit)=>{for(let row=0,yy=y;yy<y+h;yy+=s*0.86,row++)for(let xx=x+(row%2)*s*0.5;xx<x+w;xx+=s){
  c.fillStyle=body;c.beginPath();for(let k=0;k<6;k++){const a=PI/6+k*PI/3;c.lineTo(xx+Math.cos(a)*s*0.5,yy+Math.sin(a)*s*0.5);}c.closePath();c.fill();
  if(r()<(lit||0.18)){c.fillStyle=win;c.fillRect(xx-s*0.14,yy-s*0.12,s*0.28,s*0.22);}else{c.fillStyle='rgba(0,0,0,.4)';c.fillRect(xx-s*0.14,yy-s*0.12,s*0.28,s*0.22);}}};
/* РЫНОК: полосатые навесы, гирлянды ламп, ящики пайков, доска «НОРМА» */
SUBART.market={zone:{ambRGB:[150,110,84],haze:'#5a3426',void:'#0b0605',fogA:0.1},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#140c0a'],[0.6,'#2a1612'],[1,'#3a1d14']]);
    SA.honeycomb(c,0,0,L.w,L.h*0.7,2.4,'#1e1210','rgba(255,190,110,.55)',r,0.25);
    for(let i=0;i<5;i++)SA.garland(c,r()*L.w*0.5,L.h*(0.2+r()*0.3),L.w*(0.5+r()*0.5),L.h*(0.2+r()*0.3),2+r()*2,'#ffcf7a',r);
    c.fillStyle='#120a08';c.fillRect(0,L.h*0.72,L.w,L.h*0.28);},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#1a100d'],[1,'#22140f']]);
    for(let x=1;x<L.w;x+=6+r()*3){const w=4+r()*1.5,y=L.h*(0.5+r()*0.1);c.fillStyle='#2a1a15';c.fillRect(x,y,w,L.h-y);
      SA.awning(c,x-0.3,y-0.6,w+0.6,0.7,'#7a2a1c','#b08d3e');
      c.fillStyle='rgba(255,180,100,.18)';c.fillRect(x+0.4,y+0.6,w-0.8,1.2);
      for(let k=0;k<4;k++){c.fillStyle=['#5c4433','#4a3a2c','#6a5540'][k%3];c.fillRect(x+0.3+k*1.0,L.h-1.4-r()*0.6,0.9,1.2);}}
    for(let i=0;i<3;i++)SA.garland(c,0,L.h*(0.25+i*0.1),L.w,L.h*(0.3+i*0.08),1.5,'#ffcf7a',r);},
  mid(c,L,R,r){for(let i=0;i<Math.max(1,L.w/16);i++){const x=3+i*16+r()*5,y=L.h*0.4;
      Kit.plate(c,x,y,3.4,2.2,'ply',(i*7)|0,{rust:0.2});c.fillStyle='#14100c';c.fillRect(x+0.2,y+0.2,3.0,1.8);
      c.fillStyle='rgba(236,234,222,.6)';c.font='500 0.3px Oswald';
      ['НОРМА · ХЛЕБ 200','НОРМА · СВЕЧИ 2','НОРМА · СВЕТ 14 Ч'].forEach((s,k)=>c.fillText(s,x+0.35,y+0.6+k*0.5));}
    for(let i=0;i<6;i++)Kit.clothesline(c,r()*L.w,L.h*0.2+r()*4,r()*L.w,L.h*0.2+r()*4,(i*3)|0);},
  wall(c,L,R,r){c.fillStyle='rgba(40,26,22,.92)';c.fillRect(0,0,L.w,L.h);
    c.save();c.globalAlpha=0.4;c.fillStyle=PAT(c,'wallpaper');c.fillRect(0,0,L.w,L.h);c.restore();
    for(let x=1;x<L.w;x+=8+r()*4){const w=5+r()*1.5,y=L.h-5.2;
      c.fillStyle='rgba(20,12,10,.6)';c.fillRect(x,y,w,5.2);SA.awning(c,x-0.3,y-0.5,w+0.6,0.6,'#8a2e1e','#c9a227');
      for(let k=0;k<Math.floor(w/1.1);k++)Kit.crate(c,x+0.2+k*1.1,L.h-1.4,1.0,0.9,{seed:(x*3+k)|0});}
    for(let i=0;i<L.w/10;i++)Kit.poster(c,r()*(L.w-2),2+r()*4,1.2,1.6,(i*17)|0);
    for(let i=0;i<4;i++)SA.garland(c,r()*L.w*0.4,1.5+r(),L.w*(0.6+r()*0.4),1.5+r(),1.2,'#ffcf7a',r);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w;SA.awning(c,x,0,4,0.9,'#2a0c08','#3a2a10');}
    for(let i=0;i<2;i++)Kit.clothesline(c,r()*L.w,1,r()*L.w,2,(i*5)|0);}
};
/* ШКОЛА: высокие окна с нарисованным небом, закрашенным серым; парты; доска «НЕБО = ПОТОЛОК» */
SUBART.school={zone:{ambRGB:[138,140,124],haze:'#3e4438',void:'#0a0b09',fogA:0.08},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#151713'],[1,'#1d201a']]);
    for(let x=2;x<L.w;x+=7){c.fillStyle='#0c0d0b';rr(c,x,L.h*0.15,4,L.h*0.55,1.8);c.fill();
      const g=c.createLinearGradient(0,L.h*0.15,0,L.h*0.7);g.addColorStop(0,'#3e5a72');g.addColorStop(1,'#5f7a8c');c.fillStyle=g;rr(c,x+0.3,L.h*0.15+0.3,3.4,L.h*0.55-0.6,1.6);c.fill();
      c.fillStyle='rgba(90,92,86,.85)';c.fillRect(x+0.3,L.h*0.28+r()*L.h*0.1,3.4,L.h*0.5);}},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#20231d'],[1,'#191b16']]);
    SA.tiles(c,0,L.h*0.55,L.w,L.h*0.45,1.2,'#2c302a','rgba(0,0,0,.4)',r);
    for(let x=3;x<L.w;x+=8+r()*3){c.fillStyle='#14160f';c.fillRect(x,L.h*0.2,5,2.8);c.strokeStyle='#5a4a30';c.lineWidth=0.15;c.strokeRect(x,L.h*0.2,5,2.8);
      c.strokeStyle='rgba(220,220,210,.35)';c.lineWidth=0.05;c.beginPath();c.arc(x+1.2,L.h*0.2+1.2,0.5,0,TAU);c.moveTo(x+0.4,L.h*0.2+1.2);c.lineTo(x+2,L.h*0.2+1.2);c.stroke();}},
  mid(c,L,R,r){for(let i=0;i<L.w/3;i++){const x=r()*L.w,y=L.h-1.2;c.fillStyle='#2a2218';c.fillRect(x,y,1.4,0.12);c.fillRect(x+0.1,y,0.08,0.8);c.fillRect(x+1.2,y,0.08,0.8);}},
  wall(c,L,R,r){c.fillStyle='rgba(54,58,50,.94)';c.fillRect(0,0,L.w,L.h);
    c.fillStyle='rgba(30,34,28,.9)';c.fillRect(0,L.h*0.58,L.w,L.h*0.42);c.fillStyle='rgba(201,162,39,.25)';c.fillRect(0,L.h*0.58,L.w,0.06);
    for(let x=2;x<L.w;x+=11+r()*4){const y=L.h*0.3;c.fillStyle='#16201a';c.fillRect(x,y,4.6,2.4);c.strokeStyle='#6a5a3a';c.lineWidth=0.12;c.strokeRect(x,y,4.6,2.4);
      c.fillStyle='rgba(230,230,220,.75)';c.font='500 0.34px Oswald';c.fillText(['НЕБО = ПОТОЛОК','ПЕЧАТЬ ХРАНИТ НАС','214 ЛЕТ ТИШИНЫ','ЯРУС — ДОМ'][(r()*4)|0],x+0.3,y+1.1);
      c.font='400 0.24px Oswald';c.fillText('УРОК '+((r()*9|0)+1),x+0.3,y+1.7);}
    /* детские рисунки: солнце, дерево — перечёркнуты красным карандашом */
    for(let i=0;i<L.w/4;i++){const x=1+r()*(L.w-2),y=L.h*(0.12+r()*0.12);c.fillStyle='#d8d0bc';c.save();c.translate(x,y);c.rotate((r()-0.5)*0.2);
      c.fillRect(-0.4,-0.3,0.8,0.6);c.fillStyle='#d8a020';c.beginPath();c.arc(-0.15,-0.1,0.12,0,TAU);c.fill();
      c.strokeStyle='#4a8a3a';c.lineWidth=0.05;c.beginPath();c.moveTo(0.15,0.25);c.lineTo(0.15,0.0);c.stroke();c.fillStyle='#4a8a3a';c.beginPath();c.arc(0.15,-0.03,0.12,0,TAU);c.fill();
      if(r()<0.7){c.strokeStyle='#b0301e';c.lineWidth=0.05;c.beginPath();c.moveTo(-0.35,-0.25);c.lineTo(0.35,0.25);c.moveTo(0.35,-0.25);c.lineTo(-0.35,0.25);c.stroke();}c.restore();}},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w;c.fillStyle='#0a0a08';c.fillRect(x,L.h-2.2,1.6,0.14);c.fillRect(x+0.1,L.h-2.2,0.1,2.2);c.fillRect(x+1.4,L.h-2.2,0.1,2.2);}}
};
/* ЧАСОВНЯ ОСНОВАТЕЛЕЙ: стрельчатые своды, витраж с Печатью-солнцем, свечи, семь ликов */
SUBART.chapel={zone:{ambRGB:[96,84,90],haze:'#3a2a32',void:'#070506',fogA:0.12},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#0c080a'],[1,'#1a1014']]);
    const cx=L.w/2,cy=L.h*0.36,rad=Math.min(L.w,L.h)*0.28;
    for(let i=0;i<12;i++){const a0=i/12*TAU,a1=(i+1)/12*TAU;c.fillStyle=i%2?'rgba(201,162,39,.55)':'rgba(70,140,150,.5)';
      c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,rad,a0,a1);c.closePath();c.fill();}
    c.strokeStyle='#0c080a';c.lineWidth=0.3;for(let i=0;i<12;i++){const a=i/12*TAU;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad);c.stroke();}
    c.beginPath();c.arc(cx,cy,rad,0,TAU);c.stroke();c.fillStyle='#e8c96a';c.beginPath();c.arc(cx,cy,rad*0.22,0,TAU);c.fill();
    SA.glow(c,cx,cy,rad*1.8,'#e8c96a',0.25);
    for(let k=0;k<2;k++){const g=c.createLinearGradient(cx,cy,cx+(k?6:-6),L.h);g.addColorStop(0,'rgba(232,201,106,.18)');g.addColorStop(1,'rgba(232,201,106,0)');
      c.fillStyle=g;c.beginPath();c.moveTo(cx-1,cy);c.lineTo(cx+1,cy);c.lineTo(cx+(k?9:-5),L.h);c.lineTo(cx+(k?5:-9),L.h);c.closePath();c.fill();}},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#120c0e'],[1,'#1a1215']]);
    for(let x=0;x<L.w;x+=6){c.fillStyle='#0e0a0b';c.beginPath();c.moveTo(x,L.h);c.lineTo(x,L.h*0.35);c.quadraticCurveTo(x+3,L.h*0.05,x+6,L.h*0.35);c.lineTo(x+6,L.h);c.lineTo(x+5.2,L.h);c.lineTo(x+5.2,L.h*0.38);c.quadraticCurveTo(x+3,L.h*0.14,x+0.8,L.h*0.38);c.lineTo(x+0.8,L.h);c.closePath();c.fill();}},
  mid(c,L,R,r){for(let i=0;i<7;i++){const x=L.w*(0.1+i*0.13),y=L.h*0.3;c.fillStyle='#1a1214';rr(c,x-0.7,y,1.4,2.0,0.6);c.fill();
      c.fillStyle='#a8842a';c.beginPath();c.arc(x,y+0.7,0.38,0,TAU);c.fill();c.fillStyle='#1a1214';c.fillRect(x-0.2,y+0.6,0.12,0.06);c.fillRect(x+0.08,y+0.6,0.12,0.06);
      SA.glow(c,x,y+0.7,1.0,'#e8c96a',0.15);}},
  wall(c,L,R,r){c.fillStyle='rgba(32,24,28,.95)';c.fillRect(0,0,L.w,L.h);
    for(let x=0;x<L.w;x+=3.2){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,0,0.3,L.h);}
    for(let i=0;i<L.w/5;i++){const x=1+r()*(L.w-2),y=L.h-0.6;for(let k=0;k<6;k++){const cx=x+k*0.18;c.fillStyle='#e8e0c8';c.fillRect(cx,y-0.3-((k*7)%3)*0.1,0.07,0.3+((k*7)%3)*0.1);
      SA.glow(c,cx+0.035,y-0.42,0.35,'#ffcf7a',0.4);}}
    for(let i=0;i<L.w/12;i++)Kit.stencil(c,r()*(L.w-6),2+r()*3,['БЛАГОСЛОВЕН ПОТОЛОК','ПЕЧАТЬ ХРАНИТ','НЕ СПРАШИВАЙ'][(r()*3)|0],0.42,'rgba(232,201,106,.35)',0.4);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<2;i++){const x=r()*L.w;c.fillStyle='#060405';c.fillRect(x,0,1.2,L.h);}}
};
/* ЦЕНЗОРСКАЯ: картотеки до потолка, пневмотрубы, сугробы проштампованной бумаги, зелёные лампы */
SUBART.offices={zone:{ambRGB:[96,112,100],haze:'#2a3a30',void:'#060807',fogA:0.08},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#0b0f0c'],[1,'#141a16']]);
    for(let x=0;x<L.w;x+=2.2){const h=L.h*(0.5+r()*0.4);c.fillStyle='#101511';c.fillRect(x,L.h-h,2,h);
      for(let y=L.h-h+0.3;y<L.h;y+=0.6){c.fillStyle='rgba(180,200,180,.08)';c.fillRect(x+0.2,y,1.6,0.04);c.fillStyle='rgba(201,162,39,.25)';c.fillRect(x+0.9,y+0.2,0.2,0.06);}}},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#121813'],[1,'#0e130f']]);
    for(let i=0;i<L.w/2;i++){const x=r()*L.w;Kit.pipe(c,[[x,0],[x,L.h*(0.3+r()*0.6)]],0.18,'steel',{seed:(i*5)|0,rustN:0});}
    for(let x=1;x<L.w;x+=3){c.fillStyle='#1a221c';c.fillRect(x,L.h*0.45,2.4,L.h*0.55);for(let y=L.h*0.47;y<L.h;y+=0.7){c.fillStyle='#232e26';c.fillRect(x+0.15,y,2.1,0.55);c.fillStyle='#8a6d2a';c.fillRect(x+1.05,y+0.22,0.3,0.08);}}},
  mid(c,L,R,r){for(let i=0;i<Math.max(2,L.w/9);i++){const x=r()*L.w,y=L.h-1.1;c.fillStyle='#2a2218';c.fillRect(x,y,2.2,0.14);c.fillRect(x+0.1,y,0.1,1.1);c.fillRect(x+2.0,y,0.1,1.1);
      c.fillStyle='#2f6b44';c.beginPath();c.moveTo(x+0.6,y-0.5);c.lineTo(x+1.2,y-0.5);c.lineTo(x+1.1,y-0.7);c.lineTo(x+0.7,y-0.7);c.closePath();c.fill();SA.glow(c,x+0.9,y-0.4,1.2,'#9fe6a0',0.25);}},
  wall(c,L,R,r){c.fillStyle='rgba(30,38,32,.94)';c.fillRect(0,0,L.w,L.h);
    for(let x=0;x<L.w;x+=2.6){c.fillStyle='rgba(24,32,26,.9)';c.fillRect(x+0.1,L.h*0.35,2.4,L.h*0.65);
      for(let y=L.h*0.37;y<L.h-0.2;y+=0.62){c.fillStyle='rgba(40,52,44,.9)';c.fillRect(x+0.2,y,2.2,0.52);c.fillStyle='#a8842a';c.fillRect(x+1.1,y+0.22,0.3,0.07);}}
    for(let i=0;i<L.w/6;i++){Kit.stencil(c,r()*(L.w-4),1.5+r()*L.h*0.25,['ИЗЪЯТО','НЕ ВСКРЫВАТЬ','§1','НЕБО — ИЗЪЯТЬ','АРХИВ ЦЕНЗУРЫ'][(r()*5)|0],0.42,'rgba(200,69,47,.4)',0.4);}
    for(let i=0;i<L.w*1.5;i++){c.fillStyle=r()<0.5?'rgba(216,205,182,.55)':'rgba(190,180,160,.45)';c.save();c.translate(r()*L.w,L.h-0.15-r()*0.6);c.rotate((r()-0.5)*1.2);c.fillRect(-0.15,-0.1,0.3,0.2);c.restore();}},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w;Kit.pipe(c,[[x,0],[x,L.h]],0.35,'steel',{seed:(i*9)|0});}}
};
/* КРЫШИ СОТ: обрывы сот-фасадов к пропасти, дымоходы, антенны, бельё; «небо» — тёмный свод с огнями */
SUBART.roofs={zone:{ambRGB:[92,84,108],haze:'#2e2638',void:'#06050a',fogA:0.13},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#07060c'],[0.5,'#120e1a'],[1,'#1e1622']]);
    for(let i=0;i<120;i++){c.fillStyle='rgba(255,220,170,'+(r()*0.5)+')';c.fillRect(r()*L.w,r()*L.h*0.4,0.06,0.06);}
    for(let k=0;k<3;k++){const base=L.h*(0.45+k*0.16);for(let x=-2;x<L.w;x+=5+r()*6){const w=4+r()*5,h=L.h-base+r()*4;
      SA.honeycomb(c,x,base-r()*3,w,h,1.4+k*0.4,shade('#1e1620',k*0.06),'rgba(255,190,110,'+(0.5-k*0.1)+')',r,0.2);}}},
  bg(c,L,R,r){for(let i=0;i<L.w/6;i++){const x=r()*L.w,h=4+r()*8;c.fillStyle='#120e14';c.fillRect(x,L.h-h,1.2,h);c.fillStyle='rgba(255,160,90,.3)';c.fillRect(x+0.3,L.h-h+0.4,0.6,0.3);
      c.strokeStyle='#1a141c';c.lineWidth=0.08;c.beginPath();c.moveTo(x+0.6,L.h-h);c.lineTo(x+0.6,L.h-h-2-r()*2);c.stroke();}},
  mid(c,L,R,r){for(let i=0;i<6;i++)Kit.clothesline(c,r()*L.w,L.h*(0.3+r()*0.3),r()*L.w,L.h*(0.3+r()*0.3),(i*7)|0);},
  wall(c,L,R,r){c.clearRect(0,0,L.w,L.h);
    /* игровой слой открыт — дальние соты видны насквозь; только кладка стен у твёрдых блоков */
    for(const s of R.solids){if(s.ow||s.hidden||s.w>L.w)continue;SA.honeycomb(c,s.x,s.y,s.w,s.h,1.0,'rgba(48,34,40,.95)','rgba(255,190,110,.6)',r,0.12);}},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w,h=3+r()*4;c.fillStyle='#050406';c.fillRect(x,L.h-h,1.6,h);}
    for(let i=0;i<2;i++)Kit.clothesline(c,r()*L.w,0.5,r()*L.w,1.5,(i*13)|0);}
};
/* ПРАЧЕЧНАЯ: пар, барабаны машин, развешанные простыни, мокрый кафель */
SUBART.laundry={zone:{ambRGB:[120,126,134],haze:'#4a5058',void:'#08090a',fogA:0.16},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#101215'],[1,'#1a1d21']]);
    for(let i=0;i<60;i++){c.fillStyle='rgba(220,226,232,'+(r()*0.06)+')';c.beginPath();c.ellipse(r()*L.w,r()*L.h,2+r()*5,1+r()*2,0,0,TAU);c.fill();}
    for(let i=0;i<L.w/3;i++){const x=r()*L.w,y=L.h*(0.1+r()*0.3);c.fillStyle='rgba(200,206,210,.25)';c.fillRect(x,y,1.4+r(),2+r()*2);}},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#16181b'],[1,'#121417']]);SA.tiles(c,0,0,L.w,L.h,1.0,'#262a2e','rgba(0,0,0,.35)',r);
    for(let x=2;x<L.w;x+=5){const y=L.h-3.4;c.fillStyle='#2a2e32';rr(c,x,y,3.4,3.4,0.3);c.fill();c.fillStyle='#14171a';c.beginPath();c.arc(x+1.7,y+1.6,1.1,0,TAU);c.fill();
      c.strokeStyle='#8a9299';c.lineWidth=0.12;c.beginPath();c.arc(x+1.7,y+1.6,1.1,0,TAU);c.stroke();c.fillStyle='rgba(180,200,220,.2)';c.beginPath();c.arc(x+1.4,y+1.3,0.5,0,TAU);c.fill();}},
  mid(c,L,R,r){for(let i=0;i<8;i++){const x=r()*L.w,y=L.h*(0.15+r()*0.25);Kit.clothesline(c,x,y,x+5+r()*5,y+(r()-0.5),(i*11)|0);
      for(let k=0;k<3;k++){c.fillStyle=['#c9c2b0','#a8a090','#d8d0bc'][k];c.fillRect(x+0.6+k*1.6,y+0.3,1.2,1.8+r());}}},
  wall(c,L,R,r){SA.tiles(c,0,0,L.w,L.h,0.8,'rgba(70,76,80,.92)','rgba(0,0,0,.3)',r);
    for(let i=0;i<L.w/3;i++){const x=r()*L.w,g=c.createLinearGradient(0,0,0,L.h);g.addColorStop(0,'rgba(140,160,170,0)');g.addColorStop(1,'rgba(140,160,170,.12)');c.fillStyle=g;c.fillRect(x,0,0.1,L.h);}
    for(let i=0;i<L.w/10;i++)Kit.sign(c,r()*(L.w-3),2+r()*3,2.6,0.7,['ПАР · ОСТОРОЖНО','СМЕНА 3','БЕЛЬЁ СДАВАТЬ'][(r()*3)|0],'#c9a227','#191612',(i*7)|0);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<4;i++){const x=r()*L.w;c.fillStyle='rgba(30,32,34,.95)';c.fillRect(x,0,1.6+r(),2.4+r()*2);}}
};

/* ---------- проёмы в стене игрового слоя ----------
   Стена не сплошная: в ней арки, окна, проёмы — сквозь них видны дальние слои (глубина).
   Края проёма — пилястры/рамы; проём не ставится там, где стоит дверь. */
SA.cut=function(c,L,R,r,o){
  const ev=o.every||10,w=o.w||4,y0=o.y0===undefined?2:o.y0,y1=o.y1===undefined?L.h*0.62:o.y1,kind=o.kind||'arch';
  const doors=R.doors||[];
  for(let x=(o.off===undefined?ev*0.5:o.off);x+w<L.w-0.5;x+=ev){
    if(doors.some(d=>d.x<x+w+1.5&&d.x+d.w>x-1.5&&d.y<y1))continue;
    const h=y1-y0;
    c.save();c.globalCompositeOperation='destination-out';c.fillStyle='#000';c.beginPath();
    if(kind==='arch'){c.moveTo(x,y1);c.lineTo(x,y0+w*0.5);c.arc(x+w/2,y0+w*0.5,w/2,PI,0);c.lineTo(x+w,y1);c.closePath();}
    else if(kind==='window'){rr(c,x,y0,w,h,0.2);}
    else{c.rect(x,y0,w,h);}
    c.fill();c.restore();
    /* рама: тёмный кант и светлая фаска по внутренней кромке */
    c.save();c.strokeStyle=o.frame||'rgba(10,8,6,.9)';c.lineWidth=0.22;c.beginPath();
    if(kind==='arch'){c.moveTo(x,y1);c.lineTo(x,y0+w*0.5);c.arc(x+w/2,y0+w*0.5,w/2,PI,0);c.lineTo(x+w,y1);}
    else if(kind==='window'){rr(c,x,y0,w,h,0.2);}
    else c.rect(x,y0,w,h);
    c.stroke();c.strokeStyle=o.edge||'rgba(255,230,190,.12)';c.lineWidth=0.05;c.stroke();
    if(o.sill){c.fillStyle=o.sill;c.fillRect(x-0.2,y1-0.12,w+0.4,0.18);}
    if(o.bars){c.strokeStyle='rgba(12,10,8,.85)';c.lineWidth=0.08;c.beginPath();for(let bx=x+w/(o.bars+1);bx<x+w-0.05;bx+=w/(o.bars+1)){c.moveTo(bx,y0+(kind==='arch'?w*0.2:0));c.lineTo(bx,y1);}c.stroke();}
    c.restore();
  }
};
/* настройки проёмов и заливочного света по подзонам */
const SUBCUT={
  workshop:{kind:'window',every:11,w:5,y0:2.2,y1:7.2,bars:3,sill:'#3a3a35'},
  drains:{kind:'arch',every:12,w:5,y0:3,y1:12,frame:'rgba(8,12,10,.9)'},
  foundry:{kind:'arch',every:13,w:6,y0:4,y1:14,frame:'rgba(10,4,2,.95)',edge:'rgba(255,150,80,.25)'},
  boiler:{kind:'rect',every:12,w:5,y0:2,y1:9,bars:2},
  market:{kind:'rect',every:12,w:6,y0:3,y1:10,frame:'rgba(14,8,6,.9)'},
  school:{kind:'window',every:10,w:3.4,y0:2.2,y1:8.6,bars:1,sill:'#4a4a40'},
  chapel:{kind:'arch',every:9,w:3.6,y0:3,y1:14,frame:'rgba(8,5,6,.95)',edge:'rgba(232,201,106,.2)'},
  offices:{kind:'rect',every:9,w:2.4,y0:1.4,y1:9},
  laundry:{kind:'window',every:12,w:4,y0:2,y1:7,bars:2}
};
for(const k in SUBCUT){const S0=SUBART[k];if(!S0||!S0.wall)continue;const base=S0.wall,o=SUBCUT[k];
  S0.wall=(c,L,R,r)=>{base(c,L,R,r);if(!R.noCut)SA.cut(c,L,R,r,Object.assign({},o,R.cut||{}));};}
/* заливочный свет подзоны: мягкие широкие источники под сводом — комната не тонет во мраке */
const SUBFILL={workshop:['#e8e0d0',0.35],drains:['#69d68f',0.25],foundry:['#ff8a3a',0.4],boiler:['#ff7a4a',0.3],
  market:['#ffcf7a',0.35],school:['#e8ecd8',0.35],chapel:['#e8c96a',0.25],offices:['#9fe6a0',0.25],roofs:['#ffcf7a',0.2],laundry:['#dfe8f0',0.35]};
function subFill(R){const f=R.sub&&SUBFILL[R.sub];if(!f||R.noFill)return;
  for(let x=6;x<R.w;x+=12)R.lights.push(lit(x,Math.min(R.h*0.35,6),Math.max(10,R.h*0.6),f[0],f[1]));}

/* ---------- излучение: то, что светится само (окна, жерла, витражи, гирлянды) ----------
   Запекается в отдельный слой и кладётся ПОСЛЕ света аддитивно — свет комнаты его не гасит.
   emitF — параллакс слоя (как у фона, где эти огни стоят). */
SA.win=(c,x,y,w,h,col,a)=>{c.fillStyle=rgba(col,a);c.fillRect(x,y,w,h);SA.glow(c,x+w/2,y+h/2,Math.max(w,h)*1.6,col,a*0.35);};
SUBART.workshop.emitF=0.34;
SUBART.workshop.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);
  for(let x=2;x<L.w;x+=5+r()*2){const y=L.h*(0.14+r()*0.04);SA.glow(c,x,y,2.4,'#ffe2b0',0.22);c.fillStyle='rgba(255,236,200,.65)';c.fillRect(x-0.5,y,1.0,0.07);}};
SUBART.drains.emitF=0.14;
SUBART.drains.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);const n=Math.max(1,Math.round(L.w/30));
  for(let i=0;i<n;i++){const cx=(i+0.5)*L.w/n,cy=L.h*0.62;SA.glow(c,cx,cy+L.h*0.14,L.h*0.3,'#69d68f',0.25);
    c.fillStyle='rgba(140,255,190,.35)';c.fillRect(cx-L.w/n*0.12,cy+L.h*0.3,L.w/n*0.24,0.1);}};
SUBART.foundry.emitF=0.14;
SUBART.foundry.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);const n=Math.max(1,Math.round(L.w/34));
  for(let i=0;i<n;i++){const cx=(i+0.5)*L.w/n,cy=L.h*0.78,w=Math.min(L.w/n*0.6,16),h=L.h*0.5;
    SA.glow(c,cx,cy,h*0.9,'#ff7a2a',0.35);
    const g=c.createRadialGradient(cx,cy,0,cx,cy,w*0.55);g.addColorStop(0,'rgba(255,230,160,.8)');g.addColorStop(0.5,'rgba(255,140,50,.45)');g.addColorStop(1,'rgba(255,90,20,0)');
    c.fillStyle=g;c.beginPath();c.moveTo(cx-w*0.5,L.h);c.lineTo(cx-w*0.5,cy-h*0.1);c.quadraticCurveTo(cx,cy-h*0.55,cx+w*0.5,cy-h*0.1);c.lineTo(cx+w*0.5,L.h);c.closePath();c.fill();}
  for(let i=0;i<80;i++){c.fillStyle='rgba(255,180,90,'+(r()*0.6)+')';c.fillRect(r()*L.w,r()*L.h,0.07,0.07);}};
SUBART.boiler.emitF=0.34;
SUBART.boiler.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);for(let i=0;i<L.w/5;i++){const x=r()*L.w,y=L.h*(0.3+r()*0.5);SA.glow(c,x,y,1.4,'#ff5a3a',0.25);
  c.fillStyle='rgba(255,140,90,.6)';c.beginPath();c.arc(x,y,0.14,0,TAU);c.fill();}};
SUBART.market.emitF=0.14;
SUBART.market.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);
  for(let i=0;i<7;i++){const x0=r()*L.w*0.5,x1=L.w*(0.5+r()*0.5),y=L.h*(0.18+r()*0.35),sag=1.5+r()*2;
    for(let k=1;k<12;k++){const t=k/12,x=lerp(x0,x1,t),yy=y+sag*4*t*(1-t)*0.5;SA.glow(c,x,yy,0.7,'#ffcf7a',0.4);c.fillStyle='rgba(255,236,190,.9)';c.beginPath();c.arc(x,yy,0.07,0,TAU);c.fill();}}
  for(let i=0;i<L.w/2;i++){const x=r()*L.w,y=r()*L.h*0.7;if(r()<0.5)SA.win(c,x,y,0.4,0.3,'#ffb46a',0.5);}};
SUBART.school.emitF=0.14;
SUBART.school.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);
  for(let x=2;x<L.w;x+=7){const g=c.createLinearGradient(0,L.h*0.15,0,L.h*0.3);g.addColorStop(0,'rgba(140,180,220,.35)');g.addColorStop(1,'rgba(140,180,220,0)');
    c.fillStyle=g;c.fillRect(x+0.3,L.h*0.15+0.3,3.4,L.h*0.15);SA.glow(c,x+2,L.h*0.22,3,'#9fc4e0',0.12);}};
SUBART.chapel.emitF=0.14;
SUBART.chapel.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);const cx=L.w/2,cy=L.h*0.36,rad=Math.min(L.w,L.h)*0.28;
  for(let i=0;i<12;i++){const a0=i/12*TAU+0.02,a1=(i+1)/12*TAU-0.02;c.fillStyle=i%2?'rgba(232,201,106,.5)':'rgba(90,190,200,.45)';
    c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,rad*0.95,a0,a1);c.closePath();c.fill();}
  c.fillStyle='rgba(255,240,200,.85)';c.beginPath();c.arc(cx,cy,rad*0.2,0,TAU);c.fill();SA.glow(c,cx,cy,rad*1.9,'#e8c96a',0.28);
  for(let k=0;k<2;k++){const g=c.createLinearGradient(cx,cy,cx+(k?6:-6),L.h);g.addColorStop(0,'rgba(232,201,106,.22)');g.addColorStop(1,'rgba(232,201,106,0)');
    c.fillStyle=g;c.beginPath();c.moveTo(cx-1.5,cy);c.lineTo(cx+1.5,cy);c.lineTo(cx+(k?10:-4),L.h);c.lineTo(cx+(k?4:-10),L.h);c.closePath();c.fill();}};
SUBART.offices.emitF=0.34;
SUBART.offices.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);for(let i=0;i<L.w/4;i++){const x=r()*L.w,y=L.h*(0.4+r()*0.5);SA.glow(c,x,y,1.6,'#9fe6a0',0.22);
  c.fillStyle='rgba(200,255,200,.5)';c.fillRect(x-0.25,y,0.5,0.06);}};
SUBART.roofs.emitF=0.14;
SUBART.roofs.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);
  for(let i=0;i<L.w*1.4;i++){const x=r()*L.w,y=L.h*(0.4+r()*0.55);SA.win(c,x,y,0.28,0.22,r()<0.8?'#ffb46a':'#9fd6ff',0.55);}
  for(let i=0;i<160;i++){c.fillStyle='rgba(255,230,190,'+(r()*0.6)+')';c.fillRect(r()*L.w,r()*L.h*0.4,0.05,0.05);}};
SUBART.laundry.emitF=0.34;
SUBART.laundry.emit=(c,L,R,r)=>{c.clearRect(0,0,L.w,L.h);for(let x=3;x<L.w;x+=8+r()*3){SA.glow(c,x,L.h*0.25,4,'#dfe8f0',0.14);}};
/* яркость подзон: окружающий свет чуть выше, чтобы комнаты читались как картина, а не как подвал */
(()=>{const up={workshop:1.15,drains:1.2,foundry:1.1,boiler:1.15,market:1.2,school:1.15,chapel:1.45,offices:1.35,roofs:1.35,laundry:1.1};
  for(const k in up){const z=SUBART[k]&&SUBART[k].zone;if(z&&z.ambRGB)z.ambRGB=z.ambRGB.map(v=>Math.min(235,Math.round(v*up[k])));}})();
/* световые столбы подзон (поверх фона, до света) */
const SUBSHAFT={workshop:{n:3,col:'255,236,200',a:0.06,w:2.4},foundry:{n:3,col:'255,150,80',a:0.08,w:3},market:{n:4,col:'255,207,122',a:0.06,w:2},
  school:{n:4,col:'200,220,240',a:0.08,w:2.4},chapel:{n:2,col:'232,201,106',a:0.12,w:3.4},laundry:{n:4,col:'220,232,240',a:0.07,w:2.6},drains:{n:2,col:'140,255,190',a:0.05,w:2}};

/* ---------- III · САДЫ ЭДЕМА ----------
   После Корчевателя сад «из каталога» вянет (сереют кроны, никнут цветы), а дикие жёлтые цветы
   из заборника №3 расползаются по трещинам: R.wilt. */
SA.flower=(c,x,y,s,col,wilt)=>{c.strokeStyle=wilt?'#6a5a3a':'#4a7a3a';c.lineWidth=0.04*s;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+(wilt?0.2:0.05)*s,y-0.3*s,x+(wilt?0.25:0)*s,y-(wilt?0.35:0.5)*s);c.stroke();
  const hx=x+(wilt?0.25:0)*s,hy=y-(wilt?0.35:0.5)*s;c.fillStyle=wilt?'#7a6a50':col;for(let k=0;k<5;k++){const a=k/5*TAU;c.beginPath();c.ellipse(hx+Math.cos(a)*0.08*s,hy+Math.sin(a)*0.08*s,0.07*s,0.04*s,a,0,TAU);c.fill();}
  c.fillStyle=wilt?'#4a3a2a':'#f2d98c';c.beginPath();c.arc(hx,hy,0.04*s,0,TAU);c.fill();};
SA.wild=(c,x,y,n,r)=>{for(let i=0;i<n;i++){const xx=x+(r()-0.5)*1.6,s=0.6+r()*0.6;c.strokeStyle='#5a8a3a';c.lineWidth=0.03;c.beginPath();c.moveTo(xx,y);c.lineTo(xx+(r()-0.5)*0.2,y-0.35*s);c.stroke();
  c.fillStyle='#ffd83a';c.beginPath();c.arc(xx+(r()-0.5)*0.2,y-0.35*s,0.07*s,0,TAU);c.fill();}};
SA.fruitTree=(c,x,y,h,r,wilt)=>{c.fillStyle='#4a3a2a';c.beginPath();c.moveTo(x-0.18,y);c.lineTo(x-0.08,y-h*0.55);c.lineTo(x+0.08,y-h*0.55);c.lineTo(x+0.18,y);c.closePath();c.fill();
  c.strokeStyle='#4a3a2a';c.lineWidth=0.08;for(const s of [-1,1]){c.beginPath();c.moveTo(x,y-h*0.45);c.quadraticCurveTo(x+s*h*0.2,y-h*0.6,x+s*h*0.3,y-h*0.75);c.stroke();}
  for(let i=0;i<9;i++){const a=r()*TAU,d=r()*h*0.28;c.fillStyle=wilt?['#7a7050','#8a7a58','#6a6040'][i%3]:['#5a8a3a','#6f9a4a','#4a7a32'][i%3];
    c.beginPath();c.ellipse(x+Math.cos(a)*d,y-h*0.72+Math.sin(a)*d*0.7,h*0.16,h*0.12,0,0,TAU);c.fill();}
  if(!wilt)for(let i=0;i<6;i++){c.fillStyle='#d86a3a';c.beginPath();c.arc(x+(r()-0.5)*h*0.5,y-h*0.65+(r()-0.5)*h*0.3,0.08,0,TAU);c.fill();}};
/* САД: ряды фруктовых деревьев под лампами-солнцами, лестницы, корзины */
SUBART.orchard={zone:{ambRGB:[214,206,170],haze:'#d8d2a0',void:'#2a2a1c',fogA:0.1},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#e8e0b8'],[0.5,'#d8d2a8'],[1,'#a8b080']]);
    for(let k=0;k<3;k++){const y=L.h*(0.45+k*0.17);c.fillStyle='rgba(150,150,110,'+(0.25+k*0.15)+')';c.fillRect(0,y,L.w,L.h*0.06);
      for(let x=0;x<L.w;x+=2.4+r()*1.6){c.save();c.globalAlpha=0.3+k*0.18;SA.fruitTree(c,x,y,2+k*0.8,r,R.wilt);c.restore();}}
    for(let i=0;i<4;i++)SA.glow(c,L.w*(0.15+i*0.25),L.h*0.08,L.h*0.3,'#fff2c0',0.5);},
  bg(c,L,R,r){for(let x=1;x<L.w;x+=5+r()*3)SA.fruitTree(c,x,L.h-1,5+r()*2,r,R.wilt);
    for(let i=0;i<L.w/8;i++){const x=r()*L.w;c.strokeStyle='#8a6d4a';c.lineWidth=0.1;c.beginPath();c.moveTo(x,L.h);c.lineTo(x+1.2,L.h-5);c.moveTo(x+0.7,L.h);c.lineTo(x+1.9,L.h-5);c.stroke();
      for(let k=1;k<6;k++){c.beginPath();c.moveTo(x+k*0.24,L.h-k);c.lineTo(x+0.7+k*0.24,L.h-k);c.stroke();}}},
  mid(c,L,R,r){for(let i=0;i<L.w/6;i++){const x=r()*L.w;c.fillStyle='#8a6d4a';rr(c,x,L.h-1.0,1.2,0.8,0.1);c.fill();c.strokeStyle='#5a4a30';c.lineWidth=0.04;
      for(let k=0;k<4;k++){c.beginPath();c.moveTo(x+0.1,L.h-0.9+k*0.18);c.lineTo(x+1.1,L.h-0.9+k*0.18);c.stroke();}
      if(!R.wilt)for(let k=0;k<4;k++){c.fillStyle='#d86a3a';c.beginPath();c.arc(x+0.25+k*0.25,L.h-1.05,0.1,0,TAU);c.fill();}}},
  wall(c,L,R,r){c.clearRect(0,0,L.w,L.h);
    for(let x=0;x<L.w;x+=6){Kit.column(c,x+0.4,L.h*0.15,L.h*0.85,0.32,{gold:r()>0.6});}
    for(let i=0;i<L.w/3;i++)SA.flower(c,r()*L.w,L.h-0.2-r()*0.4,1.2+r()*0.6,['#e8a0b0','#f0f0e0','#c8a0e0'][(r()*3)|0],R.wilt);
    if(R.wilt)for(let i=0;i<L.w/6;i++)SA.wild(c,r()*L.w,L.h-0.25,5,r);},
  emitF:0.14,emit(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<4;i++){const x=L.w*(0.15+i*0.25);SA.glow(c,x,L.h*0.06,L.h*0.25,'#fff2c0',0.3);
    c.fillStyle='rgba(255,250,220,.9)';rr(c,x-1,L.h*0.04,2,0.3,0.1);c.fill();}},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w;c.save();c.globalAlpha=0.9;SA.fruitTree(c,x,L.h+1,L.h*0.5,r,R.wilt);c.restore();}}
};
/* ПАСЕКА: латунные соты-стены, ульи-ящики, янтарный свет, рой */
SUBART.apiary={zone:{ambRGB:[200,170,110],haze:'#c89a4a',void:'#1e140a',fogA:0.1},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#3a2810'],[1,'#6a4a1a']]);SA.honeycomb(c,0,0,L.w,L.h,1.6,'#5a3e14','rgba(255,200,90,.7)',r,0.3);},
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'rgba(80,56,20,.0)'],[1,'rgba(60,40,14,.6)']]);
    for(let x=1;x<L.w;x+=3.2+r()*2){const n=2+(r()*4|0);for(let k=0;k<n;k++){const y=L.h-1-k*1.1;c.fillStyle=['#c9a227','#b08d3e','#e8c96a'][k%3];rr(c,x,y-1.0,2.2,1.0,0.1);c.fill();
      c.fillStyle='#2a1a08';c.fillRect(x+0.9,y-0.3,0.4,0.1);}}},
  mid(c,L,R,r){for(let i=0;i<120;i++){c.fillStyle='rgba(40,28,8,.8)';c.beginPath();c.ellipse(r()*L.w,r()*L.h*0.8,0.06,0.04,r()*3,0,TAU);c.fill();}},
  wall(c,L,R,r){c.fillStyle='rgba(120,86,30,.9)';c.fillRect(0,0,L.w,L.h);SA.honeycomb(c,0,0,L.w,L.h,1.0,'rgba(150,110,40,.95)','rgba(255,200,90,.55)',r,0.08);
    for(let i=0;i<L.w/8;i++)Kit.stencil(c,r()*(L.w-4),2+r()*4,['УЛЕЙ '+((r()*40|0)+1),'ТОЛЬКО КАТАЛОГ','МЁД — СОВЕТУ'][(r()*3)|0],0.42,'rgba(60,40,10,.5)',0.5);},
  emitF:0.34,emit(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<L.w;i++){const x=r()*L.w,y=r()*L.h;if(r()<0.4){SA.glow(c,x,y,0.6,'#ffcf6a',0.25);}}},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w;c.fillStyle='rgba(40,26,8,.95)';rr(c,x,L.h-3.5,2.6,3.5,0.2);c.fill();}}
};
/* ОРОСИТЕЛЬНЫЙ КАНАЛ: лотки с водой, шлюзовые затворы, трубы, холодный сине-зелёный свет */
SUBART.irrigation={zone:{ambRGB:[140,176,170],haze:'#5a8a8a',void:'#0a1414',fogA:0.12},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#142224'],[1,'#1e3a3a']]);
    for(let x=0;x<L.w;x+=9){c.fillStyle='#0e1a1a';c.beginPath();c.moveTo(x,L.h);c.lineTo(x,L.h*0.3);c.arc(x+4.5,L.h*0.3,4.5,PI,0);c.lineTo(x+9,L.h);c.lineTo(x+8,L.h);c.lineTo(x+8,L.h*0.32);c.arc(x+4.5,L.h*0.32,3.5,0,PI,true);c.lineTo(x+1,L.h);c.closePath();c.fill();}
    SA.band(c,L,L.h*0.85,L.h*0.12,'#5fc8c0',0.3);},
  bg(c,L,R,r){for(let i=0;i<5;i++){const y=1+r()*L.h*0.4;Kit.pipe(c,[[0,y],[L.w,y+(r()-0.5)*2]],0.35,'#5d6067',{seed:i+300,rustN:0});}
    for(let x=4;x<L.w;x+=14+r()*4){Kit.plate(c,x,L.h*0.45,3,L.h*0.55,'steel',(x*3)|0,{rust:0.3});Kit.valve(c,x+1.5,L.h*0.55,0.8,r()*TAU,'#b08d3e');}},
  mid(c,L,R,r){for(let i=0;i<20;i++){const x=r()*L.w;c.strokeStyle='rgba(180,230,230,.18)';c.lineWidth=0.04;c.beginPath();c.moveTo(x,0);c.lineTo(x,r()*L.h*0.7);c.stroke();}},
  wall(c,L,R,r){c.fillStyle='rgba(120,130,120,.6)';c.fillRect(0,0,L.w,L.h);c.save();c.globalAlpha=0.35;c.fillStyle=PAT(c,'marble');c.fillRect(0,0,L.w,L.h);c.restore();
    for(let i=0;i<L.w*0.7;i++){const x=r()*L.w,y=r()*L.h*0.5,len=1+r()*5,g=c.createLinearGradient(0,y,0,y+len);g.addColorStop(0,'rgba(80,140,100,0)');g.addColorStop(0.5,'rgba(80,150,110,.25)');g.addColorStop(1,'rgba(80,140,100,0)');
      c.fillStyle=g;c.fillRect(x,y,0.12+r()*0.2,len);}
    for(let i=0;i<L.w/12;i++)Kit.stencil(c,r()*(L.w-4),2+r()*L.h*0.4,['ПОЛИВ ПО ГРАФИКУ','ЛОТОК '+((r()*9|0)+1),'ВОДА — СОВЕТУ'][(r()*3)|0],0.42,'rgba(40,70,60,.5)',0.5);},
  emitF:0.14,emit(c,L,R,r){c.clearRect(0,0,L.w,L.h);SA.band(c,L,L.h*0.86,L.h*0.08,'#7fe0d0',0.22);},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<3;i++){const x=r()*L.w;Kit.pipe(c,[[x,0],[x+(r()-0.5),L.h]],0.5,'#4a5058',{seed:i+330,rustN:0});}}
};
/* ГЕРБАРИЙ: стеклянные шкафы с засушенными листьями, латунные рамы, лампы для чтения */
SUBART.herbarium={zone:{ambRGB:[196,192,170],haze:'#b8b48e',void:'#1a1a14',fogA:0.08},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#2a2a20'],[1,'#3a3a2c']]);for(let x=0;x<L.w;x+=3){c.fillStyle='#1e1e16';c.fillRect(x,L.h*0.2,2.6,L.h*0.8);
    for(let y=L.h*0.22;y<L.h;y+=1.2){c.fillStyle='rgba(200,210,180,.12)';c.fillRect(x+0.2,y,2.2,0.9);}}},
  bg(c,L,R,r){for(let x=1;x<L.w;x+=4){Kit.plate(c,x,L.h*0.3,3.4,L.h*0.7,'brass',(x*5)|0,{});c.fillStyle='rgba(180,200,190,.35)';c.fillRect(x+0.2,L.h*0.32,3.0,L.h*0.66);
    for(let y=L.h*0.36;y<L.h-0.6;y+=1.4)for(let k=0;k<2;k++){const lx=x+0.6+k*1.4,ly=y+0.5;c.fillStyle=['#7a8a4a','#9a8a5a','#6a7a3a'][((x+y+k)|0)%3];
      c.beginPath();c.ellipse(lx,ly,0.35,0.18,(r()-0.5),0,TAU);c.fill();c.strokeStyle='rgba(60,50,30,.6)';c.lineWidth=0.02;c.beginPath();c.moveTo(lx-0.3,ly);c.lineTo(lx+0.3,ly);c.stroke();}}},
  mid(c,L,R,r){for(let i=0;i<L.w/10;i++){const x=r()*L.w;c.fillStyle='#3a2a1a';c.fillRect(x,L.h-1.1,2.2,0.12);c.fillRect(x+0.1,L.h-1.1,0.1,1.1);c.fillRect(x+2,L.h-1.1,0.1,1.1);
    c.fillStyle='#d8cdb6';c.fillRect(x+0.4,L.h-1.25,1.2,0.12);}},
  wall(c,L,R,r){c.fillStyle='rgba(206,198,176,.9)';c.fillRect(0,0,L.w,L.h);c.save();c.globalAlpha=0.3;c.fillStyle=PAT(c,'marble');c.fillRect(0,0,L.w,L.h);c.restore();
    for(let i=0;i<L.w/5;i++){const x=r()*(L.w-1.5),y=L.h*(0.2+r()*0.3);Kit.plate(c,x,y,1.3,1.6,'brass',(i*7)|0,{});c.fillStyle='#ece6d4';c.fillRect(x+0.12,y+0.12,1.06,1.36);
      c.fillStyle=['#7a8a4a','#9a7a4a','#5a7a3a'][i%3];c.beginPath();c.ellipse(x+0.65,y+0.75,0.32,0.5,(r()-0.5)*0.6,0,TAU);c.fill();
      c.fillStyle='rgba(60,50,40,.6)';c.font='400 0.12px Oswald';c.fillText('№'+((r()*400|0)+1),x+0.2,y+1.4);}},
  emitF:0.34,emit(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<L.w/6;i++){const x=r()*L.w;SA.glow(c,x,L.h-1.5,1.4,'#ffe6b0',0.25);}},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<2;i++){const x=r()*L.w;c.fillStyle='rgba(40,34,24,.95)';c.fillRect(x,0,1.2,L.h);}}
};
/* КОРНЕВАЯ ГАЛЕРЕЯ: земля и корни под садами, светящиеся грибы, капель — тёмный подсад */
SUBART.roots={zone:{ambRGB:[70,92,96],haze:'#1e3438',void:'#030606',fogA:0.14,grain:0.05},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#0a1212'],[1,'#122022']]);
    for(let i=0;i<30;i++){let x=r()*L.w,y=0;c.strokeStyle='rgba(30,40,36,.9)';c.lineWidth=0.3+r()*0.6;c.beginPath();c.moveTo(x,y);
      while(y<L.h){x+=(r()-0.5)*2;y+=0.8+r()*1.4;c.lineTo(x,y);}c.stroke();}},
  bg(c,L,R,r){for(let i=0;i<40;i++){let x=r()*L.w,y=0;c.strokeStyle='#2a2a20';c.lineWidth=0.15+r()*0.4;c.beginPath();c.moveTo(x,y);
      while(y<L.h*0.8){x+=(r()-0.5)*1.4;y+=0.5+r();c.lineTo(x,y);}c.stroke();}},
  mid(c,L,R,r){for(let i=0;i<L.w/2;i++){const x=r()*L.w,y=r()*L.h;c.fillStyle=r()<0.5?'rgba(120,220,210,.6)':'rgba(190,140,230,.55)';
    c.beginPath();c.ellipse(x,y,0.2,0.1,0,PI,TAU);c.fill();c.fillRect(x-0.03,y,0.06,0.18);}},
  wall(c,L,R,r){c.fillStyle='rgba(28,30,24,.95)';c.fillRect(0,0,L.w,L.h);
    for(let i=0;i<L.w*1.2;i++){let x=r()*L.w,y=r()*L.h*0.3;c.strokeStyle='rgba(60,54,40,.8)';c.lineWidth=0.05+r()*0.2;c.beginPath();c.moveTo(x,y);
      for(let k=0;k<5;k++){x+=(r()-0.5)*1.2;y+=0.4+r()*0.8;c.lineTo(x,y);}c.stroke();}},
  emitF:0.62,emit(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<L.w*0.8;i++){const x=r()*L.w,y=r()*L.h,col=r()<0.5?'#7fe0d0':'#c090f0';SA.glow(c,x,y,0.7,col,0.3);
    c.fillStyle=rgba(col,0.85);c.beginPath();c.ellipse(x,y,0.14,0.07,0,PI,TAU);c.fill();}},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<6;i++){let x=r()*L.w,y=0;c.strokeStyle='#0a0a08';c.lineWidth=0.5+r()*0.6;c.beginPath();c.moveTo(x,y);
    while(y<L.h*0.6){x+=(r()-0.5)*2;y+=1+r();c.lineTo(x,y);}c.stroke();}}
};
/* ЗАЛ ЛАМП-СОЛНЦ: огромное искусственное солнце под сводом, рёбра-рефлекторы, пересвет и марево */
SUBART.sunhall={zone:{ambRGB:[235,226,190],haze:'#fff2c8',void:'#3a3420',fogA:0.16,grain:0.025},
  far(c,L,R,r){SA.vgrad(c,L,[[0,'#f8f0d0'],[0.5,'#e8dcb0'],[1,'#c8c090']]);
    const cx=L.w/2,cy=L.h*0.12;for(let i=0;i<24;i++){const a=PI+i/23*PI;c.strokeStyle='rgba(160,140,90,.35)';c.lineWidth=0.3;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*L.w*0.7,cy+Math.sin(a)*L.w*0.7);c.stroke();}
    SA.glow(c,cx,cy,L.h*0.7,'#fff6d8',0.8);},
  bg(c,L,R,r){for(let x=0;x<L.w;x+=8)Kit.column(c,x+1,L.h*0.2,L.h*0.8,0.5,{gold:true});},
  mid(c,L,R,r){for(let i=0;i<L.w/5;i++)SA.fruitTree(c,r()*L.w,L.h-0.5,3+r()*2,r,true);},
  wall(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<L.w/2;i++)SA.flower(c,r()*L.w,L.h-0.2,1.4,'#f0e0a0',true);
    if(R.wilt)for(let i=0;i<L.w/5;i++)SA.wild(c,r()*L.w,L.h-0.25,4,r);},
  emitF:0.14,emit(c,L,R,r){c.clearRect(0,0,L.w,L.h);const cx=L.w/2,cy=L.h*0.12;
    const g=c.createRadialGradient(cx,cy,0,cx,cy,L.h*0.32);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(0.2,'rgba(255,248,210,.8)');g.addColorStop(1,'rgba(255,240,190,0)');
    c.fillStyle=g;c.beginPath();c.arc(cx,cy,L.h*0.32,0,TAU);c.fill();},
  fgd(c,L,R,r){c.clearRect(0,0,L.w,L.h);for(let i=0;i<2;i++){const x=r()*L.w;Kit.column(c,x,0,L.h,0.8,{gold:true});}}
};
SUBART.shed={zone:{ambRGB:[176,150,116],haze:'#7a6a4a',void:'#140e08',fogA:0.08},
  far:SUBART.orchard.far,
  bg(c,L,R,r){SA.vgrad(c,L,[[0,'#3a2a1a'],[1,'#2a1e12']]);for(let x=0;x<L.w;x+=0.6){c.fillStyle=((x*5)|0)%2?'#3a2a1a':'#33251a';c.fillRect(x,0,0.58,L.h);}},
  mid(c,L,R,r){},
  wall(c,L,R,r){c.fillStyle='rgba(70,50,30,.95)';c.fillRect(0,0,L.w,L.h);for(let x=0;x<L.w;x+=0.5){c.fillStyle='rgba(0,0,0,'+(0.1+r()*0.15)+')';c.fillRect(x,0,0.04,L.h);}
    for(let i=0;i<L.w/2;i++){const x=r()*L.w,y=L.h*(0.25+r()*0.25);c.strokeStyle=['#8a9299','#6a5a40','#b08d3e'][i%3];c.lineWidth=0.08;c.beginPath();c.moveTo(x,y);c.lineTo(x+(r()-0.5)*0.4,y+0.9+r()*0.6);c.stroke();}},
  emitF:0.34,emit(c,L,R,r){c.clearRect(0,0,L.w,L.h);}
};
(()=>{const C={orchard:{kind:'arch',every:12,w:5,y0:3,y1:14},irrigation:{kind:'arch',every:11,w:5,y0:3,y1:14},herbarium:{kind:'window',every:10,w:3,y0:2,y1:9,bars:2},
  apiary:{kind:'rect',every:12,w:4,y0:3,y1:10},roots:{kind:'arch',every:14,w:6,y0:2,y1:14}};
  for(const k in C){const S0=SUBART[k],base=S0.wall,o=C[k];S0.wall=(c,L,R,r)=>{base(c,L,R,r);if(!R.noCut)SA.cut(c,L,R,r,Object.assign({},o,R.cut||{}));};}
  Object.assign(SUBFILL,{orchard:['#fff2c0',0.35],apiary:['#ffcf6a',0.35],irrigation:['#bfeee8',0.3],herbarium:['#ffe6b0',0.35],roots:['#7fe0d0',0.2],sunhall:['#fff6d8',0.5],shed:['#ffd9a0',0.35]});
  Object.assign(SUBSHAFT,{orchard:{n:4,col:'255,246,214',a:0.12,w:3.4},sunhall:{n:6,col:'255,250,220',a:0.16,w:3.8},herbarium:{n:3,col:'255,240,200',a:0.08,w:2.4},
    irrigation:{n:3,col:'200,240,240',a:0.07,w:2.4},apiary:{n:3,col:'255,210,120',a:0.08,w:2.6}});})();
