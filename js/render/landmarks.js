"use strict";
/* ============================== ОРИЕНТИРЫ ЗОН («ОТКРЫТКИ») ==============================
   Большие сооружения за стенами залов — по три на зону. У каждого — место на схеме мира (MAPLAYOUT,
   метры), поэтому из соседних комнат он виден в одной и той же стороне и плывёт медленнее стен:
   глубина LM_F между задником (0.34) и средним планом (0.62). Силуэт тёмный, в дымке зоны,
   с несколькими своими огнями — узнаётся издалека: «насос — значит, хаб рядом».
   Рисуются в метрах сооружения от основания (x — центр, y — низ, вверх — минус). */
const LM_F=0.45;
const LANDMARKS=[
  /* I · ОТСТОЙНИК */
  {id:'pump',zone:'sump',name:'ГЛАВНЫЙ НАСОС',mx:118,my:392,h:30,w:30,draw(c,t,k){
    c.fillStyle=k.dark;c.fillRect(-9,-12,18,12);c.fillRect(-14,-3,28,3);
    c.save();c.translate(0,-20);c.rotate(t*0.08);c.strokeStyle=k.dark;c.lineWidth=1.6;c.beginPath();c.arc(0,0,9,0,TAU);c.stroke();
    for(let i=0;i<8;i++){c.rotate(PI/4);c.fillRect(-0.4,-9,0.8,9);}c.restore();
    c.fillStyle=k.mid;c.beginPath();c.arc(0,-20,2.2,0,TAU);c.fill();
    c.fillStyle=k.dark;for(const x of [-12,10])c.fillRect(x,-30,2,30);
    k.lamp(c,-11,-28,0.6);k.lamp(c,11,-28,0.6);k.lamp(c,0,-6,0.9);}},
  {id:'crane',zone:'sump',name:'КРАН-БАЛКА НАДСМОТРЩИКА',mx:255,my:425,h:32,w:36,draw(c,t,k){
    c.fillStyle=k.dark;c.fillRect(-16,-30,2,30);c.fillRect(14,-30,2,30);c.fillRect(-18,-31,36,2.2);
    c.strokeStyle=k.dark;c.lineWidth=0.4;for(let x=-16;x<16;x+=2.4){c.beginPath();c.moveTo(x,-30);c.lineTo(x+2.4,-28.8);c.stroke();}
    const hx=Math.sin(t*0.12)*8;c.fillRect(hx-1.4,-30,2.8,2);c.beginPath();c.moveTo(hx,-28);c.lineTo(hx,-16);c.lineWidth=0.25;c.stroke();
    c.fillRect(hx-1.8,-16,3.6,2.4);k.lamp(c,hx,-29,0.5,'#ff8a6a');}},
  {id:'chimney',zone:'sump',name:'ТРУБА ЛИТЕЙКИ',mx:162,my:428,h:40,w:10,draw(c,t,k){
    c.fillStyle=k.dark;c.beginPath();c.moveTo(-4,0);c.lineTo(-2.4,-38);c.lineTo(2.4,-38);c.lineTo(4,0);c.closePath();c.fill();
    for(let y=-34;y<0;y+=6){c.fillStyle=k.mid;c.fillRect(-3.2+(-y/38)*-0.6,y,6.4,0.5);}
    k.glow(c,0,-40,4,'#ff7a40',0.35+0.15*Math.sin(t*1.7));k.lamp(c,0,-36,0.5,'#ff5a3a');}},
  /* II · СОТЫ */
  {id:'posttower',zone:'hives',name:'БАШНЯ ПНЕВМОПОЧТЫ',mx:205,my:300,h:34,w:20,draw(c,t,k){
    c.fillStyle=k.dark;c.fillRect(-3,-34,6,34);c.fillRect(-6,-36,12,2);
    for(let i=0;i<6;i++){const x=-9+i*3.6;c.fillRect(x,-30+((i*7)%5),0.7,30-((i*7)%5));}
    for(let i=0;i<5;i++){const u=((t*0.3+i*0.2)%1);k.lamp(c,-9+i*3.6+0.35,-30+u*28,0.25,'#e8c96a');}
    k.lamp(c,0,-35,0.6,'#9fe08a');}},
  {id:'turbines',zone:'hives',name:'ТУРБИНЫ',mx:322,my:345,h:24,w:36,draw(c,t,k){
    for(const x of [-9,9]){c.save();c.translate(x,-12);c.fillStyle=k.dark;c.beginPath();c.arc(0,0,8,0,TAU);c.fill();
      c.rotate(t*0.6*(x>0?1:-1));c.fillStyle=k.mid;for(let i=0;i<6;i++){c.rotate(PI/3);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(3,-3,1,-7);c.lineTo(-1,-6.5);c.closePath();c.fill();}
      c.restore();k.lamp(c,x,-12,0.5);}
    c.fillStyle=k.dark;c.fillRect(-18,-2,36,2);}},
  {id:'spire',zone:'hives',name:'ШПИЛЬ ЧАСОВНИ',mx:226,my:293,h:36,w:11,draw(c,t,k){
    c.fillStyle=k.dark;c.beginPath();c.moveTo(-5,0);c.lineTo(-5,-18);c.lineTo(0,-36);c.lineTo(5,-18);c.lineTo(5,0);c.closePath();c.fill();
    c.fillStyle=k.mid;c.beginPath();c.arc(0,-14,1.8,PI,TAU);c.fill();c.fillRect(-1.8,-14,3.6,3);
    k.glow(c,0,-13,3,'#ffcf8a',0.3);k.lamp(c,0,-34,0.4,'#e8c96a');}},
  /* III · САДЫ ЭДЕМА */
  {id:'dome',zone:'eden',name:'СТЕКЛЯННЫЙ КУПОЛ',mx:520,my:262,h:30,w:36,draw(c,t,k){
    c.strokeStyle=k.dark;c.lineWidth=0.7;for(let i=-4;i<=4;i++){c.beginPath();c.ellipse(0,0,18*Math.abs(Math.cos(i*0.33)),28,0,PI,TAU);c.stroke();}
    c.beginPath();c.ellipse(0,0,18,28,0,PI,TAU);c.lineWidth=1.4;c.stroke();
    for(let y=-24;y<0;y+=6){const w=18*Math.sqrt(1-(y*y)/(28*28));c.lineWidth=0.4;c.beginPath();c.moveTo(-w,y);c.lineTo(w,y);c.stroke();}
    k.glow(c,0,-10,12,'#bfeee8',0.12);}},
  {id:'sunlamps',zone:'eden',name:'ЛАМПЫ-СОЛНЦА',mx:562,my:288,h:28,w:32,draw(c,t,k){
    c.fillStyle=k.dark;c.fillRect(-16,-28,32,1.6);
    for(let i=0;i<4;i++){const x=-12+i*8;c.fillRect(x-0.2,-27,0.4,6);c.beginPath();c.moveTo(x-2.6,-21);c.lineTo(x+2.6,-21);c.lineTo(x+1.4,-23);c.lineTo(x-1.4,-23);c.fill();
      k.glow(c,x,-20,4.5,'#ffe6b0',0.22+0.05*Math.sin(t*0.5+i));k.lamp(c,x,-21,0.8,'#fff2c6');}}},
  {id:'tree',zone:'eden',name:'СТАРОЕ ДРЕВО',mx:380,my:262,h:30,w:22,draw(c,t,k){
    c.fillStyle=k.dark;c.beginPath();c.moveTo(-2,0);c.quadraticCurveTo(-1,-12,-3,-18);c.lineTo(3,-18);c.quadraticCurveTo(1,-12,2,0);c.closePath();c.fill();
    const sw=Math.sin(t*0.4)*0.6;for(const [x,y,r] of [[-6+sw,-22,6],[5+sw,-23,6.5],[0+sw,-28,6],[-9+sw,-17,4],[9+sw,-18,4.5]]){c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
    for(let i=0;i<5;i++)k.lamp(c,-8+i*4+sw,-20-((i*5)%7),0.25,'#c9e08a');}},
  /* IV · ПЕЧАТЬ */
  {id:'dial',zone:'seal',name:'ЦИФЕРБЛАТ',mx:800,my:162,h:36,w:30,draw(c,t,k){
    c.fillStyle=k.dark;c.beginPath();c.arc(0,-18,15,0,TAU);c.fill();c.fillRect(-4,-4,8,4);
    c.strokeStyle=k.mid;c.lineWidth=0.8;c.beginPath();c.arc(0,-18,13,0,TAU);c.stroke();
    for(let i=0;i<12;i++){const a=i*PI/6;c.beginPath();c.moveTo(Math.sin(a)*11,-18-Math.cos(a)*11);c.lineTo(Math.sin(a)*12.6,-18-Math.cos(a)*12.6);c.stroke();}
    c.lineWidth=0.7;const a1=t*0.02,a2=t*0.003;c.strokeStyle='#e8c96a';
    c.beginPath();c.moveTo(0,-18);c.lineTo(Math.sin(a1)*10,-18-Math.cos(a1)*10);c.stroke();c.beginPath();c.moveTo(0,-18);c.lineTo(Math.sin(a2)*6,-18-Math.cos(a2)*6);c.stroke();
    k.glow(c,0,-18,10,'#e8c96a',0.1);}},
  {id:'pendulumbig',zone:'seal',name:'БОЛЬШОЙ МАЯТНИК',mx:712,my:202,h:40,w:16,draw(c,t,k){
    c.fillStyle=k.dark;c.fillRect(-8,-40,16,2);const a=Math.sin(t*0.55)*0.35;
    c.save();c.translate(0,-38);c.rotate(a);c.fillRect(-0.4,0,0.8,30);c.beginPath();c.arc(0,32,4,0,TAU);c.fill();k.lamp(c,0,32,0.6,'#e8c96a');c.restore();}},
  {id:'seal',zone:'seal',name:'ПЕЧАТЬ',mx:881,my:123,h:34,w:32,draw(c,t,k){
    c.fillStyle=k.dark;c.beginPath();c.arc(0,-17,16,0,TAU);c.fill();
    c.strokeStyle=k.mid;c.lineWidth=1.2;for(let i=0;i<8;i++){const a=i*PI/4;c.beginPath();c.moveTo(0,-17);c.lineTo(Math.cos(a)*15,-17+Math.sin(a)*15);c.stroke();}
    c.beginPath();c.arc(0,-17,15,0,TAU);c.stroke();k.glow(c,0,-17,6,'#fff6dd',0.1+0.04*Math.sin(t*0.3));}},
  /* V · АРХИВ */
  {id:'stacks',zone:'archive',name:'БЕСКОНЕЧНЫЕ СТЕЛЛАЖИ',mx:1068,my:89,h:40,w:40,draw(c,t,k){
    c.fillStyle=k.dark;for(let i=0;i<5;i++){const x=-18+i*8;c.fillRect(x,-40,5,40);
      for(let y=-37;y<0;y+=3.4){c.fillStyle=k.mid;c.fillRect(x+0.3,y,4.4,0.3);c.fillStyle=k.dark;}}
    for(let i=0;i<4;i++)k.lamp(c,-14+i*8,-12-((i*13)%20),0.4,'#ffd9a0');}},
  {id:'horn',zone:'archive',name:'РУПОР СОВЕТА',mx:1124,my:73,h:30,w:26,draw(c,t,k){
    c.fillStyle=k.dark;c.fillRect(-1,-14,2,14);c.beginPath();c.moveTo(-1,-14);c.quadraticCurveTo(-4,-22,-14,-30);c.lineTo(-4,-34);c.quadraticCurveTo(-2,-22,1,-15);c.closePath();c.fill();
    c.beginPath();c.ellipse(0,-1,9,1.6,0,0,TAU);c.fill();k.glow(c,-9,-31,5,'#e8c96a',0.15);}},
  {id:'wheel',zone:'archive',name:'КОЛЕСО ПЕЧАТИ',mx:1270,my:52,h:30,w:28,draw(c,t,k){
    c.save();c.translate(0,-15);c.rotate(t*0.01);c.strokeStyle=k.dark;c.lineWidth=2;c.beginPath();c.arc(0,0,13,0,TAU);c.stroke();
    c.lineWidth=0.9;for(let i=0;i<12;i++){c.rotate(PI/6);c.beginPath();c.moveTo(0,0);c.lineTo(0,-13);c.stroke();}c.restore();
    k.glow(c,0,-15,8,'#fff6dd',0.16);}}
];
/* один кадр: в каждом проёме задней стены — дальнее пространство (дымка зоны) и ориентир, плывущий медленнее стены */
function drawLandmarks(c,room,game,t){
  const L=MAPLAYOUT[room.id],W=room._lmWin;if(!L||!W||!W.length)return;const cam=game.camera,s=game.ppm*cam.zoom,vw=game.vw,vh=game.vh,zl=zoneLook(room);
  const wx=L[0]+cam.cx,wy=L[1]+cam.cy,haze=zl.haze||'#8a7a6a',vd=zl.void||'#0a0a0a';
  const hz=hxc(haze),vv=hxc(vd),mx=(i)=>Math.round(vv[i]*0.8+hz[i]*0.2);
  const k={dark:'rgba('+mx(0)+','+mx(1)+','+mx(2)+',.96)',mid:'rgba(255,240,210,.14)',
    lamp:(c2,x,y,r,col)=>{c2.fillStyle=col||'#ffcf8a';c2.globalAlpha=0.9;c2.beginPath();c2.arc(x,y,r,0,TAU);c2.fill();c2.globalAlpha=1;},
    glow:(c2,x,y,r,col,a)=>{const g=c2.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));c2.fillStyle=g;c2.beginPath();c2.arc(x,y,r,0,TAU);c2.fill();}};
  for(const w of W){
    /* проём на экране (игровой слой, f=1) */
    const X=x=>(x-cam.cx)*s+vw/2,Y=y=>(y-cam.cy)*s+vh/2;if(X(w.x0+w.ww)<0||X(w.x0)>vw||Y(w.y1)<0||Y(w.y0)>vh)continue;
    c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.moveTo(X(w.x0),Y(w.y1));c.lineTo(X(w.x0),Y(w.y0+w.ar));
    c.arc(X(w.x0+w.ww/2),Y(w.y0+w.ar),w.ww/2*s,PI,TAU);c.lineTo(X(w.x0+w.ww),Y(w.y1));c.closePath();c.clip();
    const sky=c.createLinearGradient(0,Y(w.y0),0,Y(w.y1));sky.addColorStop(0,rgba(vd,1));sky.addColorStop(0.55,rgba(haze,0.55));sky.addColorStop(1,rgba(haze,0.8));
    c.fillStyle=rgba(vd,1);c.fillRect(X(w.x0)-2,Y(w.y0)-2,w.ww*s+4,(w.y1-w.y0)*s+4);c.fillStyle=sky;c.fillRect(X(w.x0)-2,Y(w.y0)-2,w.ww*s+4,(w.y1-w.y0)*s+4);
    for(const m of w.ms){const sx=vw/2+(m.mx-wx)*LM_F*s,sy=vh/2+(m.my-wy)*LM_F*s,sc=s*LM_F;
      const gy=sy-m.h*sc*0.55,gr=Math.max(m.h,m.w)*sc*0.8,bg=c.createRadialGradient(sx,gy,0,sx,gy,gr);
      c.setTransform(1,0,0,1,0,0);bg.addColorStop(0,rgba(haze,0.5));bg.addColorStop(1,rgba(haze,0));c.fillStyle=bg;c.fillRect(sx-gr,gy-gr,gr*2,gr*2);
      c.setTransform(sc,0,0,sc,sx,sy);m.draw(c,t,k);}
    /* дымка поверх — дальнее всегда чуть растворено */
    c.setTransform(1,0,0,1,0,0);c.fillStyle=rgba(haze,0.12);c.fillRect(X(w.x0)-2,Y(w.y0)-2,w.ww*s+4,(w.y1-w.y0)*s+4);
    c.restore();}
}
/* проём в задней стене зала: стена раскрыта туда, где за ней стоит ориентир (рама — сталь и заклёпки).
   Режется в игровом слое сразу после стены — до дымки, декора, реквизита и геометрии: пол и полки остаются целыми.
   Ориентир плывёт в проёме медленнее стены (LM_F против 1) — так видно, что он далеко */
function cutLandmarkWindows(c,L,R){const M=MAPLAYOUT[R.id];R._lmWin=[];if(!M||R.trial||typeof game==='undefined'||!game.ppm)return;
  const vw=game.vw/game.ppm,vh=game.vh/game.ppm;
  for(const m of LANDMARKS){if(m.zone!==R.zone)continue;
    const dx=(m.mx-(M[0]+R.w/2))*LM_F,dy=(m.my-(M[1]+R.h/2))*LM_F;
    if(!(Math.abs(dx)<vw/2+8&&dy>-vh/2-2&&dy-m.h*LM_F<vh/2))continue;
    const ww=Math.min(18,m.w*LM_F+5),x0=clamp(R.w/2+dx-ww/2,0.6,Math.max(0.6,R.w-ww-0.6)),y1=clamp(R.h/2+dy+1.5,5,R.h-0.4),y0=clamp(y1-m.h*LM_F-3.5,0.5,y1-4);
    let ar=Math.min(ww/2,(y1-y0)*0.45);
    /* соседний проём уже есть — расширить его, а не резать второй поверх */
    const ov=R._lmWin.find(w=>x0<w.x0+w.ww&&w.x0<x0+ww);
    if(ov){ov.ms.push(m);continue;}
    R._lmWin.push({x0,y0,ww,y1,ar,ms:[m]});
    const shape=()=>{c.beginPath();c.moveTo(x0,y1);c.lineTo(x0,y0+ar);c.arc(x0+ww/2,y0+ar,ww/2,PI,TAU);c.lineTo(x0+ww,y1);c.closePath();};
    c.save();c.globalCompositeOperation='destination-out';shape();c.fill();c.restore();
    /* рама: тень, стальная кромка, заклёпки, подоконник */
    c.save();c.lineJoin='round';c.strokeStyle='rgba(8,7,6,.85)';c.lineWidth=0.8;shape();c.stroke();
    c.strokeStyle='#3e4448';c.lineWidth=0.36;shape();c.stroke();
    c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=0.08;c.beginPath();c.arc(x0+ww/2,y0+ar,ww/2-0.14,PI*1.05,PI*1.5);c.stroke();
    c.fillStyle='#8a6d2a';for(let y=y1-0.7;y>y0+ar;y-=1.7){c.beginPath();c.arc(x0,y,0.08,0,TAU);c.arc(x0+ww,y,0.08,0,TAU);c.fill();}
    c.fillStyle='#26282a';c.fillRect(x0-0.5,y1-0.35,ww+1,0.5);c.fillStyle='rgba(255,255,255,.06)';c.fillRect(x0-0.5,y1-0.35,ww+1,0.06);
    c.restore();}}
/* для проверок: из скольких комнат зоны ориентир виден (камера в центре комнаты, экран 1280×720) */
function landmarkViews(m,vwM,vhM){const out=[];
  for(const id in MAPLAYOUT){const L=MAPLAYOUT[id],R0=ROOMDEFS[id];if(!R0)continue;let R;try{R=new Room(R0,game.gs);}catch(e){continue;}
    if(R.zone!==m.zone||R.trial)continue;
    const dx=(m.mx-(L[0]+R.w/2))*LM_F,dy=(m.my-(L[1]+R.h/2))*LM_F;
    if(Math.abs(dx)<vwM/2+8&&dy>-vhM/2-2&&dy-m.h*LM_F<vhM/2)out.push(id);}
  return out;}
