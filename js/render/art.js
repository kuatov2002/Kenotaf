"use strict";
/* ============================== ROOM ART ============================== */
const Art={};
/* облик комнаты: зона + поправки подзоны (свет, дымка, пустота) */
function zoneLook(R){if(R._zl)return R._zl;const SB=R.sub&&SUBART[R.sub];
  return R._zl=Object.assign({},ZONES[R.zone]||ZONES.sump,SB&&SB.zone||{},R.look||{});}
/* Твёрдая геометрия — главный «рисунок» уровня. Тело блока тёмное и глубокое (внутрь темнеет),
   открытые грани — светлый карниз с крепежом (по нему ходят), низ — тёмная кромка с подтёками,
   крупные массы несут структуру зоны: клёпаные листы, кирпич, тёсаный камень, свинцовые панели,
   книжные полки. Стиль — по зоне, материал блока (s.mat) задаёт карниз и фактуру. */
const SOLIDSTYLE={
  sump:{body:'#231c17',tex:'rust',texA:0.3,cap:'#5e5146',capHi:'rgba(230,214,190,.35)',capH:0.32,detail:'plates',dark:0.42},
  hives:{body:'#211715',tex:'concrete',texA:0.32,cap:'#5a463c',capHi:'rgba(240,210,180,.3)',capH:0.3,detail:'bricks',dark:0.42},
  eden:{body:'#8e897a',tex:'marble',texA:0.45,cap:'#d8d2c0',capHi:'rgba(255,252,236,.6)',capH:0.34,detail:'ashlar',dark:0.3},
  seal:{body:'#1e2125',tex:'lead',texA:0.4,cap:'#4e5257',capHi:'rgba(230,236,244,.32)',capH:0.26,detail:'panels',dark:0.45},
  archive:{body:'#1a1410',tex:'ply',texA:0.3,cap:'#5a4430',capHi:'rgba(255,220,170,.28)',capH:0.3,detail:'shelves',dark:0.45},
  surface:{body:'#4a4a40',tex:'concrete',texA:0.4,cap:'#6f6a5a',capHi:'rgba(255,255,240,.4)',capH:0.3,detail:'blocks',dark:0.25}
};
const CAPMAT={steel:'#5d646b',rust:'#6b5040',concrete:'#5e5a52',marble:'#d6d0be',lead:'#50555c',ply:'#6a5540',carpet:'#5a3a32',brass:'#8a6d2a',iron:'#4d4943'};
function drawSolids(c,R,zoneKey){
  const r=rng(R.id+'solids'),ST=SOLIDSTYLE[zoneKey]||SOLIDSTYLE.sump;
  const E=buildEdges({solids:R.solids.filter(s=>!s.dyn)});
  for(let si=0;si<R.solids.length;si++){
    const s=R.solids[si];if(s.hidden||s.dyn)continue;
    if(s.ow){
      /* настил: решётка, под ней — кронштейны; светлая кромка */
      c.fillStyle='rgba(0,0,0,.5)';c.fillRect(s.x,s.y+0.08,s.w,s.h+0.14);
      c.fillStyle=PAT(c,zoneKey==='eden'?'marble':'grate');c.fillRect(s.x,s.y,s.w,s.h+0.12);
      c.fillStyle='rgba(255,255,255,.2)';c.fillRect(s.x,s.y,s.w,0.05);
      c.fillStyle='rgba(0,0,0,.55)';c.fillRect(s.x,s.y+s.h+0.07,s.w,0.07);
      for(let x=s.x+0.35;x<s.x+s.w;x+=1.6){c.fillStyle='#262a2e';
        c.beginPath();c.moveTo(x-0.07,s.y+s.h);c.lineTo(x+0.07,s.y+s.h);c.lineTo(x+0.32,s.y+s.h+0.55);c.lineTo(x+0.18,s.y+s.h+0.55);c.closePath();c.fill();}
      continue;}
    const x=s.x,y=s.y,w=s.w,h=s.h,big=w>1.4&&h>1.4;
    c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x+0.08,y+0.1,w,h);
    c.fillStyle=ST.body;c.fillRect(x,y,w,h);
    c.save();c.globalAlpha=ST.texA;c.fillStyle=PAT(c,s.mat||ST.tex);c.fillRect(x,y,w,h);c.restore();
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    /* структура массы */
    if(big){
      if(ST.detail==='plates'){c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=0.05;c.beginPath();
        for(let xx=x+1.8+r()*0.6;xx<x+w-0.2;xx+=2.0+r()*0.8){c.moveTo(xx,y);c.lineTo(xx,y+h);}
        for(let yy=y+1.6;yy<y+h;yy+=1.6){c.moveTo(x,yy);c.lineTo(x+w,yy);}c.stroke();
        c.fillStyle='rgba(255,230,200,.06)';for(let yy=y+1.65;yy<y+h;yy+=1.6)c.fillRect(x,yy,w,0.03);
        for(let xx=x+0.3;xx<x+w;xx+=0.7)for(let yy=y+1.75;yy<y+h;yy+=1.6)if(r()<0.6)Kit.bolt(c,xx,yy,0.04);}
      else if(ST.detail==='bricks'){for(let yy=y+0.4,row=0;yy<y+Math.min(h,3);yy+=0.45,row++){c.fillStyle='rgba(0,0,0,.28)';c.fillRect(x,yy,w,0.05);
        for(let xx=x+(row%2)*0.5;xx<x+w;xx+=1.0)c.fillRect(xx,yy,0.05,0.45);}}
      else if(ST.detail==='ashlar'){c.strokeStyle='rgba(90,84,70,.45)';c.lineWidth=0.045;
        for(let yy=y+0.7,row=0;yy<y+h;yy+=0.7,row++){c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke();
          for(let xx=x+(row%2)*0.75;xx<x+w;xx+=1.5){c.beginPath();c.moveTo(xx,yy-0.7);c.lineTo(xx,yy);c.stroke();}}}
      else if(ST.detail==='panels'){for(let xx=x+0.4;xx<x+w-1.2;xx+=1.8)for(let yy=y+0.6;yy<y+h-1.0;yy+=1.6){
        c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=0.05;c.strokeRect(xx,yy,1.4,1.2);c.strokeStyle='rgba(220,226,236,.07)';c.strokeRect(xx+0.05,yy+0.05,1.4,1.2);
        Kit.bolt(c,xx+0.15,yy+0.15,0.035);Kit.bolt(c,xx+1.25,yy+1.05,0.035);}}
      else if(ST.detail==='shelves'){for(let yy=y+0.5;yy<y+h-0.4;yy+=0.9){c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x+0.2,yy,w-0.4,0.7);
        for(let xx=x+0.25;xx<x+w-0.35;xx+=0.1+r()*0.08){const bh=0.45+r()*0.22;c.fillStyle=['#4a2a1c','#2a3a2a','#3a2a3a','#5a4a2a','#2a2a3a'][(r()*5)|0];c.fillRect(xx,yy+0.7-bh,0.09,bh);}
        c.fillStyle='rgba(255,220,170,.12)';c.fillRect(x+0.2,yy+0.7,w-0.4,0.05);}}
      else if(ST.detail==='blocks'){c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=0.05;for(let yy=y+1;yy<y+h;yy+=1){c.beginPath();c.moveTo(x,yy);c.lineTo(x+w,yy);c.stroke();}}
      /* глубина: к центру массы темнее (ступенчатая внутренняя тень) */
      const steps=[[0.35,0.16],[0.9,0.16],[1.8,0.16],[3.2,0.14]];
      for(const [ins,a] of steps){if(w<ins*2+0.2||h<ins*2+0.2)break;c.fillStyle='rgba(0,0,0,'+(a*ST.dark/0.42)+')';c.fillRect(x+ins,y+ins,w-ins*2,h-ins*2);}
      if(zoneKey!=='eden'&&zoneKey!=='seal'&&zoneKey!=='archive')Kit.grunge(c,x,y,w,h,r,0.4,'#1a120c');
    }else{
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x,y+h*0.5,w,h*0.5);
    }
    c.restore();
  }
  /* карнизы открытых верхних граней: «по этому ходят» */
  for(const e of E.top){const x0=e[0],x1=e[1],y=e[2],w=x1-x0;if(w<0.1)continue;
    const src=R.solids.find(s=>!s.ow&&!s.hidden&&!s.dyn&&Math.abs(s.y-y)<0.01&&s.x<=x0+0.01&&s.x+s.w>=x1-0.01);
    const capH=Math.min(ST.capH,src?src.h*0.5:ST.capH),col=(src&&CAPMAT[src.mat])||ST.cap;
    c.fillStyle=col;c.fillRect(x0,y,w,capH);
    c.fillStyle=ST.capHi;c.fillRect(x0,y,w,0.06);
    c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x0,y+capH-0.05,w,0.05);
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x0,y+capH,w,0.12);
    if(capH>0.2)for(let xx=x0+0.25;xx<x1-0.1;xx+=0.75)Kit.bolt(c,xx,y+capH*0.55,0.035);}
  /* нижние кромки свода: тень и подтёки */
  for(const l of E.line){if(l[1]!==l[3])continue;const y=l[1],x0=Math.min(l[0],l[2]),x1=Math.max(l[0],l[2]);
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x0,y-0.14,x1-x0,0.14);
    for(let xx=x0+0.3;xx<x1;xx+=0.5+r()*1.5){if(r()<0.5)continue;const len=0.15+r()*0.6,g=c.createLinearGradient(0,y,0,y+len);
      g.addColorStop(0,'rgba(20,16,12,.5)');g.addColorStop(1,'rgba(20,16,12,0)');c.fillStyle=g;c.fillRect(xx,y,0.06,len);}}
  /* боковые грани: тонкая светлая фаска */
  for(const l of E.line){if(l[0]!==l[2])continue;const x=l[0],y0=Math.min(l[1],l[3]),y1=Math.max(l[1],l[3]);
    c.fillStyle='rgba(255,240,220,.07)';c.fillRect(x-0.04,y0,0.08,y1-y0);}
}
/* Задняя стена приглушается вуалью ДО реквизита комнаты и твёрдой геометрии:
   стена уходит назад, блоки, по которым бегает игрок, читаются первыми.
   extraTop — детали ПОВЕРХ твёрдых блоков (иначе drawSolids их закрывает). */
function finishGameLayer(c,L,R,r,zoneKey){
  const V=READ[zoneKey];
  if(V&&V.veil){c.fillStyle=V.veil;c.fillRect(0,0,L.w,L.h);}
  if(R.extraGame)R.extraGame(c,L,r);
  drawSolids(c,R,zoneKey);
  if(R.extraTop)R.extraTop(c,L,r);
}
function decorSump(c,L,R,r){
  for(let i=0;i<5;i++){
    const y=0.6+r()*3.2,rad=0.16+r()*0.3,pts=[[0,y]];let x=0;
    while(x<L.w){const nx=x+2+r()*5;pts.push([nx,y+(r()-0.5)*0.5]);x=nx;}
    pts.push([L.w,y]);
    Kit.pipe(c,pts,rad,r()>0.6?'rust':'steel',{seed:i+1,band:1+((r()*3)|0),bandCol:r()>0.5?'#c9a227':'#7a8a5a'});
    for(let b=2;b<L.w;b+=3.4+r()*2)Kit.bracket(c,b,y,rad);}
  for(let i=0;i<6;i++){const x1=r()*L.w,y1=1+r()*4;
    Kit.cable(c,x1,y1,x1+3+r()*9,y1+(r()-0.5)*2,0.6+r()*1.6,0.05+r()*0.05,'#1d2124');}
  for(let i=0;i<Math.max(2,L.w/26);i++){
    const x=2+r()*(L.w-4),y=3+r()*Math.max(2,L.h-8);
    if(r()>0.45){Kit.plate(c,x,y,1.5+r(),1.1+r()*0.5,'steel',(i*13)|0,{rust:0.7});
      Kit.gauge(c,x+0.5,y+0.55,0.26,r());Kit.gauge(c,x+1.1,y+0.55,0.2,r());}
    else Kit.vent(c,x,y,1.2+r(),0.7+r()*0.4);}
  const sg=['ВЫСОКОЕ ДАВЛЕНИЕ','НЕ КУРИТЬ','ОПАСНО','ЯРУС −41','ХЛАДАГЕНТ','ЭВАКУАЦИЯ →','НЕ ВЛЕЗАЙ'];
  for(let i=0;i<Math.max(2,L.w/30);i++){
    const x=2+r()*(L.w-5),y=2+r()*Math.max(2,L.h-6),w=1.7+r()*1.2;
    if(r()>0.5)Kit.sign(c,x,y,w,0.62,sg[(r()*sg.length)|0],'#c9a227','#191612',(i*7)|0);
    else Kit.stencil(c,x,y,sg[(r()*sg.length)|0],0.55,'rgba(210,200,175,.4)',0.42);}
  for(let i=0;i<L.w/14;i++)Kit.oilStain(c,r()*L.w,L.h-0.6-r()*2,0.7+r()*1.6,r);
  for(let i=0;i<3;i++){const x=3+r()*Math.max(2,L.w-6),y=1.6+r()*2;
    c.fillStyle='#22262a';c.fillRect(x-0.05,y,0.1,0.4);
    c.strokeStyle='#3a4046';c.lineWidth=0.05;c.beginPath();c.arc(x,y+0.6,0.28,0,TAU);c.stroke();
    c.fillStyle='rgba(180,200,210,.18)';c.beginPath();c.moveTo(x-0.2,y+0.5);c.lineTo(x+0.1,y+0.9);c.lineTo(x-0.1,y+1.0);c.fill();}
}
Art.bgSump=(c,L,R,r)=>{
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'#1a1512');g.addColorStop(.45,'#241c17');g.addColorStop(.8,'#2a211a');g.addColorStop(1,'#1d2a20');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  for(let i=0;i<Math.ceil(L.w/7)+2;i++){
    const x=i*7-3+r()*2,w=3.2+r()*2.6,h=L.h*(0.4+r()*0.4),y=L.h-h+r()*2;
    const gg=c.createLinearGradient(x,0,x+w,0);
    gg.addColorStop(0,'#171a1c');gg.addColorStop(.3,'#2c3338');gg.addColorStop(.5,'#343c42');gg.addColorStop(1,'#14181a');
    c.fillStyle=gg;rr(c,x,y,w,h,w*0.2);c.fill();
    c.fillStyle='rgba(0,0,0,.3)';for(let s=1;s<4;s++)c.fillRect(x,y+h*s/4,w,0.08);
    if(r()>0.55){c.fillStyle='rgba(255,190,99,.16)';c.fillRect(x+w*0.3,y+h*0.2,w*0.4,h*0.08);}}
  for(let i=0;i<6;i++){const y=r()*L.h;
    c.fillStyle='rgba(20,23,25,.85)';c.fillRect(0,y,L.w,0.22+r()*0.4);
    c.fillStyle='rgba(255,255,255,.04)';c.fillRect(0,y,L.w,0.05);}
  c.strokeStyle='rgba(16,18,20,.7)';c.lineWidth=0.16;
  for(let x=0;x<L.w;x+=2.2){c.beginPath();c.moveTo(x,L.h*0.2);c.lineTo(x+2.2,L.h*0.34);c.stroke();}
  for(let i=0;i<12;i++){c.fillStyle='rgba(200,69,47,.45)';c.beginPath();c.arc(r()*L.w,r()*L.h*0.8,0.16,0,TAU);c.fill();}
  const cg=c.createLinearGradient(0,L.h*0.72,0,L.h);
  cg.addColorStop(0,'rgba(60,150,95,0)');cg.addColorStop(1,'rgba(80,200,120,.26)');
  c.fillStyle=cg;c.fillRect(0,L.h*0.72,L.w,L.h*0.28);
  c.fillStyle='rgba(90,70,54,.16)';c.fillRect(0,0,L.w,L.h);
};
Art.midSump=(c,L,R,r)=>{
  for(let i=0;i<Math.max(1,Math.floor(L.w/22));i++)
    Kit.pumpUnit(c,4+i*20+r()*6,L.h-2,1.9+r()*0.7,{seed:(i*31)|0,tag:'Н-'+(i*3+1),press:0.3+r()*0.5});
  for(let i=0;i<Math.max(1,Math.floor(L.w/16));i++)
    Kit.tank(c,8+i*15+r()*4,L.h*0.16+r()*2,3+r()*1.6,L.h*0.5,{seed:(i*17)|0,label:'Р-'+(10+i)});
  if(L.w>14){const y=L.h*0.14+r()*1.4;Kit.craneGirder(c,0,y,L.w,1.1);
    Kit.trolley(c,L.w*(0.3+r()*0.4),y+1.1,1);Kit.chain(c,L.w*0.45,y+1.6,3+r()*2,0.14);}
  for(let i=0;i<5;i++)Kit.chain(c,r()*L.w,r()*L.h*0.3,2+r()*5,0.1+r()*0.06);
  for(let i=0;i<Math.floor(L.w/12);i++){
    const x=i*12+r()*3;
    c.fillStyle='#25292d';c.fillRect(x,0,1.1,L.h);
    c.fillStyle='rgba(255,255,255,.05)';c.fillRect(x,0,0.1,L.h);
    c.save();c.globalAlpha=0.4;c.fillStyle=PAT(c,'rust');c.fillRect(x,0,1.1,L.h);c.restore();
    for(let y=1;y<L.h;y+=2.4){c.fillStyle='#1d2124';c.fillRect(x-0.14,y,1.38,0.24);
      Kit.bolt(c,x+0.1,y+0.12,0.05);Kit.bolt(c,x+1.0,y+0.12,0.05);}}
  decorSump(c,L,R,r);
};
Art.gameSump=(c,L,R,r)=>{
  {const SB=R.sub&&SUBART[R.sub];if(SB&&SB.wall){c.clearRect(0,0,L.w,L.h);SB.wall(c,L,R,r);finishGameLayer(c,L,R,r,'sump');return;}}
  c.clearRect(0,0,L.w,L.h);
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'rgba(20,17,14,.92)');g.addColorStop(.5,'rgba(28,23,18,.86)');g.addColorStop(1,'rgba(18,15,12,.92)');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  c.save();c.globalAlpha=0.2;c.fillStyle=PAT(c,'rust');c.fillRect(0,0,L.w,L.h);c.restore();
  for(let x=0;x<L.w;x+=3.2){
    c.strokeStyle='rgba(0,0,0,.34)';c.lineWidth=0.05;c.beginPath();c.moveTo(x,0);c.lineTo(x,L.h);c.stroke();
    c.strokeStyle='rgba(255,255,255,.025)';c.beginPath();c.moveTo(x+0.05,0);c.lineTo(x+0.05,L.h);c.stroke();}
  for(let y=0;y<L.h;y+=2.6){c.strokeStyle='rgba(0,0,0,.26)';c.lineWidth=0.04;
    c.beginPath();c.moveTo(0,y);c.lineTo(L.w,y);c.stroke();}
  for(let i=0;i<3;i++){const x=2+r()*(L.w-4);
    c.fillStyle='#2b3035';c.fillRect(x,0,0.5,L.h);
    c.fillStyle='rgba(255,255,255,.05)';c.fillRect(x,0,0.07,L.h);
    for(let y=0.6;y<L.h;y+=1.6){c.fillStyle='#1d2124';c.fillRect(x-0.07,y,0.64,0.16);}}
  decorSump(c,L,R,r);
  finishGameLayer(c,L,R,r,'sump');
};
Art.fgdSump=(c,L,R,r)=>{
  c.clearRect(0,0,L.w,L.h);
  for(let i=0;i<4;i++){const x=r()*L.w;
    Kit.pipe(c,[[x,0],[x+(r()-0.5)*3,L.h]],0.4+r()*0.3,'rust',{seed:i+40});}
  for(let i=0;i<3;i++)Kit.chain(c,r()*L.w,0,L.h*(0.4+r()*0.4),0.2);
  Kit.vent(c,r()*(L.w-3),L.h-3.4,3,2);
};
function decorHives(c,L,R,r){
  const rows=Math.max(1,Math.floor(L.h/3.4));
  for(let i=0;i<Math.floor(L.w/2.4);i++)for(let k=0;k<rows;k++){
    if(r()>0.72)continue;
    const x=i*2.4+r()*0.4,y=k*3.4+r()*0.5+1;
    if(x+1.2>L.w||y+2.4>L.h)continue;
    if(r()>0.3)Kit.doorUnit(c,x,y,1.1,2.3,(i*10+k*3+11),{seed:(i*7+k)|0});
    else{c.fillStyle='#1a1214';c.fillRect(x,y,1.1,2.3);c.strokeStyle='#3a2a26';c.lineWidth=0.06;c.strokeRect(x,y,1.1,2.3);}}
  const txt=['ТИШИНА — ПОРЯДОК','ЯРУС 12','СОТЫ B','ЭВАКУАЦИЯ ↓','НЕ ШУМЕТЬ','СВЕТ ПО ГРАФИКУ'];
  for(let i=0;i<L.w/9;i++){const x=r()*L.w,y=r()*L.h;
    if(r()>0.5)Kit.poster(c,x,y,1.1+r()*0.5,1.5+r()*0.5,(i*13)|0);
    else Kit.stencil(c,x,y,txt[(r()*txt.length)|0],0.5,'rgba(216,164,65,.32)',0.4);}
  for(let i=0;i<4;i++)Kit.clothesline(c,r()*L.w*0.5,r()*L.h,r()*L.w*0.5+4+r()*5,r()*L.h+(r()-0.5)*2,(i*5)|0);
  for(let i=0;i<L.w/12;i++)Kit.furniture(c,r()*L.w,L.h-0.4-r()*2,['table','chair','tv','toys','plant'][(r()*5)|0],i);
}
Art.bgHives=(c,L,R,r)=>{
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'#0e0a0a');g.addColorStop(.5,'#1a1113');g.addColorStop(1,'#120c0d');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  for(let k=0;k<8;k++){const y=k*(L.h/8);
    c.fillStyle='rgba(30,20,20,.9)';c.fillRect(0,y,L.w,0.3);
    for(let x=0;x<L.w;x+=1.7){
      if(r()>0.4){c.fillStyle='rgba(50,32,30,.85)';c.fillRect(x,y+0.5,0.9,1.7);}
      if(r()>0.86){c.fillStyle='rgba(217,164,65,.2)';c.fillRect(x+0.1,y+0.7,0.7,1.2);}}}
  for(let k=0;k<4;k++){const y=L.h*(0.2+k*0.22);
    c.fillStyle='rgba(20,14,14,.8)';c.fillRect(0,y,L.w,0.5);
    c.strokeStyle='rgba(60,40,38,.7)';c.lineWidth=0.08;
    for(let x=0;x<L.w;x+=1.1){c.beginPath();c.moveTo(x,y);c.lineTo(x,y-0.7);c.stroke();}}
  for(let i=0;i<30;i++){c.fillStyle='rgba(217,164,65,.3)';c.beginPath();c.arc(r()*L.w,r()*L.h,0.1+r()*0.12,0,TAU);c.fill();}
  c.fillStyle='rgba(64,40,42,.2)';c.fillRect(0,0,L.w,L.h);
};
Art.midHives=(c,L,R,r)=>{
  for(let k=0;k<Math.floor(L.h/6)+1;k++){
    const y=k*6+r()*2;if(y>L.h)continue;
    c.fillStyle='#241a19';c.fillRect(0,y,L.w,0.42);
    c.fillStyle='rgba(255,255,255,.05)';c.fillRect(0,y,L.w,0.06);
    for(let x=0;x<L.w;x+=1.2){c.fillStyle='#2e2120';c.fillRect(x,y-0.85,0.09,0.85);}
    c.fillStyle='#332523';c.fillRect(0,y-0.9,L.w,0.09);}
  for(let i=0;i<Math.floor(L.w/14)+1;i++){
    const x=i*14+r()*4;
    Kit.doorUnit(c,x,L.h-3.2+r(),1.5,2.8,(i*17+3),{seed:i});
    if(r()>0.5)Kit.furniture(c,x+2.4,L.h-0.6,['tv','table','plant'][(r()*3)|0],i);}
  for(let i=0;i<5;i++)Kit.clothesline(c,r()*L.w,r()*L.h,r()*L.w+5,r()*L.h+(r()-0.5)*2,i+7);
  decorHives(c,L,R,r);
  for(let i=0;i<12;i++){const x=r()*L.w,y=r()*L.h;
    c.fillStyle='rgba(90,58,52,.35)';c.beginPath();c.moveTo(x,y);c.lineTo(x+0.5+r()*0.4,y);
    c.lineTo(x+0.4,y+0.8+r()*1.4);c.lineTo(x+0.1,y+0.6+r());c.fill();}
};
Art.gameHives=(c,L,R,r)=>{
  {const SB=R.sub&&SUBART[R.sub];if(SB&&SB.wall){c.clearRect(0,0,L.w,L.h);SB.wall(c,L,R,r);finishGameLayer(c,L,R,r,'hives');return;}}
  c.clearRect(0,0,L.w,L.h);
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'rgba(16,11,12,.9)');g.addColorStop(.6,'rgba(28,20,20,.86)');g.addColorStop(1,'rgba(14,10,10,.92)');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  c.save();c.globalAlpha=0.42;c.fillStyle=PAT(c,'wallpaper');c.fillRect(0,0,L.w,L.h);c.restore();
  c.fillStyle='rgba(42,29,26,.6)';c.fillRect(0,L.h*0.74,L.w,L.h*0.26);
  c.fillStyle='rgba(255,255,255,.04)';c.fillRect(0,L.h*0.74,L.w,0.06);
  for(let i=0;i<3;i++){const x=1+i*(L.w/3)+r()*2;Kit.pipe(c,[[x,0],[x,L.h]],0.14+r()*0.1,'steel',{seed:i+60});}
  decorHives(c,L,R,r);
  finishGameLayer(c,L,R,r,'hives');
};
Art.bgEden=(c,L,R,r)=>{
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'#e9e6cf');g.addColorStop(.45,'#dfe0c4');g.addColorStop(1,'#b9c39a');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  const cx=L.w*0.5,cy=L.h*0.78,rad=Math.max(L.w,L.h)*0.9;
  c.save();c.beginPath();c.arc(cx,cy,rad,PI,TAU);c.clip();
  const gg=c.createLinearGradient(0,cy-rad,0,cy);
  gg.addColorStop(0,'#f6f2dd');gg.addColorStop(1,'#c9d3a8');
  c.fillStyle=gg;c.fillRect(0,0,L.w,L.h);
  c.strokeStyle='rgba(150,150,120,.4)';c.lineWidth=0.22;
  for(let i=0;i<=18;i++){const a=PI+i/18*PI;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad);c.stroke();}
  for(let k=1;k<7;k++){c.beginPath();c.arc(cx,cy,rad*k/7,PI,TAU);c.stroke();}
  for(let i=0;i<50;i++){c.fillStyle='rgba(190,200,160,'+(r()*0.18)+')';
    c.beginPath();c.ellipse(r()*L.w,r()*L.h*0.7,r()*3,r()*2,0,0,TAU);c.fill();}
  c.restore();
  const sx=L.w*0.5,sy=L.h*0.1;
  const sg=c.createRadialGradient(sx,sy,0,sx,sy,L.h*0.45);
  sg.addColorStop(0,'rgba(255,248,214,1)');sg.addColorStop(.18,'rgba(242,217,140,.85)');
  sg.addColorStop(.5,'rgba(242,217,140,.22)');sg.addColorStop(1,'rgba(242,217,140,0)');
  c.fillStyle=sg;c.beginPath();c.arc(sx,sy,L.h*0.45,0,TAU);c.fill();
  c.fillStyle='#fff8dc';c.beginPath();c.arc(sx,sy,L.h*0.05,0,TAU);c.fill();
  for(let k=0;k<4;k++){const y=L.h*(0.45+k*0.14);
    c.fillStyle='rgba(216,211,200,'+(0.45+k*0.1)+')';c.fillRect(0,y,L.w,L.h*0.055);
    for(let x=0;x<L.w;x+=3+r()*4){c.save();c.globalAlpha=0.4+k*0.12;
      Kit.tree(c,x+r()*2,y,3+r()*3,(x*7+k)|0,{sick:r()>0.4});c.restore();}}
  c.fillStyle='rgba(207,214,162,.28)';c.fillRect(0,0,L.w,L.h);
};
Art.midEden=(c,L,R,r)=>{
  for(let i=0;i<Math.max(2,L.w/12);i++)Kit.column(c,i*12+r()*4,L.h*0.25+r()*2,L.h*0.5,0.42,{gold:r()>0.6});
  for(let i=0;i<3;i++)Kit.fountain(c,3+r()*(L.w-6),L.h-1-r()*3,1.6+r(),{dry:r()>0.55});
  for(let i=0;i<Math.max(3,L.w/9);i++)Kit.tree(c,r()*L.w,L.h-0.5,4+r()*5,(i*29)|0,{sick:r()>0.45});
  for(let i=0;i<7;i++){const x=r()*L.w,pts=[[x,0]];let y=0;
    while(y<L.h*(0.3+r()*0.5)){y+=0.6+r();pts.push([x+(r()-0.5)*1.4,y]);}
    Kit.vine(c,pts,(i*11)|0);}
  for(let i=0;i<4;i++){const x=r()*L.w,y=1+r()*3;
    c.strokeStyle='#c9c3b0';c.lineWidth=0.09;c.beginPath();c.arc(x,y,0.55,0,TAU);c.stroke();
    c.fillStyle='rgba(242,217,140,.35)';c.beginPath();c.arc(x,y,0.46,0,TAU);c.fill();}
  for(let i=0;i<200;i++){c.fillStyle='rgba(184,196,106,'+(r()*0.32)+')';
    c.beginPath();c.arc(r()*L.w,r()*L.h,0.03+r()*0.05,0,TAU);c.fill();}
};
Art.gameEden=(c,L,R,r)=>{
  {const SB=R.sub&&SUBART[R.sub];if(SB&&SB.wall){c.clearRect(0,0,L.w,L.h);SB.wall(c,L,R,r);finishGameLayer(c,L,R,r,'eden');return;}}
  c.clearRect(0,0,L.w,L.h);
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'rgba(240,236,220,.5)');g.addColorStop(.6,'rgba(221,216,200,.44)');g.addColorStop(1,'rgba(182,179,162,.5)');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  c.save();c.globalAlpha=0.32;c.fillStyle=PAT(c,'marble');c.fillRect(0,0,L.w,L.h);c.restore();
  for(let x=0;x<L.w;x+=3){c.strokeStyle='rgba(140,136,120,.3)';c.lineWidth=0.045;
    c.beginPath();c.moveTo(x,0);c.lineTo(x,L.h);c.stroke();
    c.fillStyle='rgba(255,255,255,.14)';c.fillRect(x+0.04,0,0.05,L.h);}
  for(let i=0;i<22;i++){const x=r()*L.w,y=r()*L.h;
    const rg=c.createRadialGradient(x,y,0,x,y,1+r()*2);
    rg.addColorStop(0,'rgba(150,168,90,.3)');rg.addColorStop(1,'rgba(150,168,90,0)');
    c.fillStyle=rg;c.beginPath();c.arc(x,y,1+r()*2,0,TAU);c.fill();}
  for(let i=0;i<12;i++){const x=r()*L.w,y=r()*L.h;
    c.strokeStyle='rgba(110,106,92,.24)';c.lineWidth=0.05;c.beginPath();c.moveTo(x,y);
    for(let k=0;k<5;k++)c.lineTo(x+(r()-0.5)*2.4,y+r()*2.2);c.stroke();}
  for(let i=0;i<34;i++){const x=r()*L.w,y=L.h-r()*1.6;
    c.fillStyle='rgba(90,122,74,'+(r()*0.3)+')';c.beginPath();c.ellipse(x,y,0.4+r()*0.6,0.16+r()*0.2,0,0,TAU);c.fill();}
  finishGameLayer(c,L,R,r,'eden');
};
Art.bgSeal=(c,L,R,r)=>{
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'#191b1f');g.addColorStop(.5,'#121417');g.addColorStop(1,'#08090b');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  c.save();c.globalAlpha=0.5;c.fillStyle=PAT(c,'lead');c.fillRect(0,0,L.w,L.h);c.restore();
  for(let i=0;i<Math.max(2,L.w/16);i++){
    const x=i*16+r()*4,w=7+r()*3;
    c.fillStyle='#050607';
    c.beginPath();c.moveTo(x,L.h);c.lineTo(x,L.h*0.35);c.arc(x+w/2,L.h*0.35,w/2,PI,0);c.lineTo(x+w,L.h);c.closePath();c.fill();
    c.strokeStyle='rgba(140,145,155,.22)';c.lineWidth=0.3;c.stroke();}
  const cx=L.w*0.5,cy=L.h*0.4;
  c.save();c.globalAlpha=0.5;
  Kit.gear(c,cx,cy,Math.min(L.w,L.h)*0.22,26,0.3,'#3d3a30');
  Kit.gear(c,cx-L.w*0.19,cy+L.h*0.1,Math.min(L.w,L.h)*0.11,18,0.7,'#33302a');
  Kit.gear(c,cx+L.w*0.18,cy-L.h*0.08,Math.min(L.w,L.h)*0.09,14,0.2,'#33302a');
  c.restore();
  for(let i=0;i<6;i++){c.fillStyle='rgba(232,232,232,.1)';c.fillRect(0,L.h*(0.1+i*0.16),L.w,0.14);}
  c.fillStyle='rgba(91,96,104,.12)';c.fillRect(0,0,L.w,L.h);
};
Art.midSeal=(c,L,R,r)=>{
  for(let i=0;i<3;i++){const y=1+i*1.6+r();
    Kit.pipe(c,[[0,y],[L.w,y]],0.42,'#5d6067',{seed:i+70,rustN:0});
    for(let x=2;x<L.w;x+=4){Kit.bracket(c,x,y,0.44);c.fillStyle='#b08d3e';c.fillRect(x-0.3,y-0.7,0.6,0.2);}}
  for(let i=0;i<Math.max(2,L.w/14);i++){
    const x=2+i*13+r()*3,y=3+r()*Math.max(2,L.h-8);
    Kit.plate(c,x,y,2.2,1.6,'lead',i*3,{bolts:true});
    Kit.gauge(c,x+0.7,y+0.8,0.4,r()*0.2);Kit.gauge(c,x+1.5,y+0.8,0.3,r()*0.15);
    Kit.gear(c,x+1.1,y+0.35,0.3,12,r()*TAU,'#8a6d2a');}
  for(let i=0;i<Math.max(1,L.w/20);i++)Kit.arch(c,i*20+r()*6,L.h*0.35,6,L.h*0.6);
  for(let i=0;i<Math.floor(L.h/7)+1;i++)Kit.lightStrip(c,L.w*0.1,2+i*7,L.w*0.8,0.16);
};
Art.gameSeal=(c,L,R,r)=>{
  {const SB=R.sub&&SUBART[R.sub];if(SB&&SB.wall){c.clearRect(0,0,L.w,L.h);SB.wall(c,L,R,r);finishGameLayer(c,L,R,r,'seal');return;}}
  c.clearRect(0,0,L.w,L.h);
  c.fillStyle='rgba(14,16,19,.86)';c.fillRect(0,0,L.w,L.h);
  c.save();c.globalAlpha=0.5;c.fillStyle=PAT(c,'lead');c.fillRect(0,0,L.w,L.h);c.restore();
  for(let x=0;x<L.w;x+=2.6){c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=0.06;
    c.beginPath();c.moveTo(x,0);c.lineTo(x,L.h);c.stroke();
    c.strokeStyle='rgba(220,225,235,.06)';c.lineWidth=0.03;
    c.beginPath();c.moveTo(x+0.06,0);c.lineTo(x+0.06,L.h);c.stroke();}
  for(let y=0;y<L.h;y+=2.2){c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=0.05;
    c.beginPath();c.moveTo(0,y);c.lineTo(L.w,y);c.stroke();}
  c.fillStyle='rgba(200,205,215,.07)';c.font='500 0.5px Oswald';
  for(let i=0;i<12;i++)c.fillText(['Св-41','ПЕЧАТЬ','№'+((r()*90|0)+10),'ГЕРМЕТИЧНО'][(r()*4)|0],r()*L.w,r()*L.h);
  finishGameLayer(c,L,R,r,'seal');
};
Art.bgSurface=(c,L,R,r)=>{
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'#9fc4dd');g.addColorStop(.42,'#cfe0e6');g.addColorStop(.62,'#e8e4cd');g.addColorStop(1,'#b9c79a');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  const sx=L.w*0.74,sy=L.h*0.16;
  const sg=c.createRadialGradient(sx,sy,0,sx,sy,L.h*0.55);
  sg.addColorStop(0,'rgba(255,252,235,.95)');sg.addColorStop(.2,'rgba(255,244,205,.5)');sg.addColorStop(1,'rgba(255,244,205,0)');
  c.fillStyle=sg;c.beginPath();c.arc(sx,sy,L.h*0.55,0,TAU);c.fill();
  for(let i=0;i<14;i++){const x=r()*L.w*1.2-L.w*0.1,y=L.h*(0.05+r()*0.3),s=2+r()*6;
    c.fillStyle='rgba(255,255,255,'+(0.35+r()*0.4)+')';
    for(let k=0;k<6;k++){c.beginPath();c.ellipse(x+k*s*0.35+(r()-0.5)*s*0.3,y+(r()-0.5)*s*0.18,s*(0.4+r()*0.3),s*(0.2+r()*0.14),0,0,TAU);c.fill();}}
  for(let layer=0;layer<3;layer++){
    c.fillStyle=['rgba(120,140,120,.5)','rgba(96,120,96,.6)','rgba(74,100,74,.75)'][layer];
    const base=L.h*(0.56+layer*0.07);
    c.beginPath();c.moveTo(0,L.h);
    for(let x=0;x<=L.w;x+=1.5)c.lineTo(x,base-Math.sin(x*0.06+layer*2)*(2.4-layer*0.5)-Math.sin(x*0.021+layer)*3.2);
    c.lineTo(L.w,L.h);c.closePath();c.fill();}
};
Art.midSurface=(c,L,R,r)=>{
  for(let i=0;i<Math.max(4,L.w/8);i++)Kit.tree(c,r()*L.w,L.h*0.78+r()*1.5,4+r()*4,(i*37)|0,{sick:false});
  c.fillStyle='#9a968a';c.fillRect(L.w*0.05,L.h*0.6,6,3.2);
  c.fillStyle='rgba(0,0,0,.25)';c.fillRect(L.w*0.05,L.h*0.6+2.8,6,0.4);
  c.fillStyle='#3a3a36';c.fillRect(L.w*0.05+2,L.h*0.6+1,2,2.2);
  Kit.stencil(c,L.w*0.05+0.4,L.h*0.6+0.8,'ВЫХОД 41',0.5,'rgba(40,40,36,.6)',0.6);
  for(let i=0;i<1200;i++){const x=r()*L.w,y=L.h*0.72+r()*L.h*0.28;
    c.strokeStyle='rgba('+(70+r()*60|0)+','+(110+r()*70|0)+','+(50+r()*40|0)+',.55)';
    c.lineWidth=0.035;c.beginPath();c.moveTo(x,y);
    c.quadraticCurveTo(x+(r()-0.5)*0.2,y-0.2,x+(r()-0.5)*0.4,y-0.3-r()*0.3);c.stroke();}
  for(let i=0;i<100;i++){c.fillStyle=['#e8dcc0','#d8b85c','#c98a8a','#e6e6e0'][(r()*4)|0];
    c.beginPath();c.arc(r()*L.w,L.h*0.74+r()*L.h*0.24,0.05+r()*0.05,0,TAU);c.fill();}
};
Art.gameSurface=(c,L,R,r)=>{
  c.clearRect(0,0,L.w,L.h);
  const g=c.createLinearGradient(0,0,0,L.h);
  g.addColorStop(0,'rgba(207,224,230,.25)');g.addColorStop(.6,'rgba(223,230,210,.2)');g.addColorStop(1,'rgba(143,160,106,.35)');
  c.fillStyle=g;c.fillRect(0,0,L.w,L.h);
  if(R.extraGame)R.extraGame(c,L,r);
  drawSolids(c,R,'surface');
  for(const s of R.solids){
    if(s.ow||s.noGrass||s.hidden)continue;
    c.fillStyle='#6f8a4c';c.fillRect(s.x,s.y,s.w,0.22);
    c.fillStyle='#87a35c';
    for(let x=s.x;x<s.x+s.w;x+=0.16){const hh=0.12+((x*13.7)%1)*0.22;c.fillRect(x,s.y-hh,0.06,hh+0.1);}}
};
