"use strict";
/* ============================== MECH KIT ==============================
   Процедурные детали механизмов. Свет — сверху-слева: у каждой детали тело с градиентом
   по короткой оси, светлая кромка, тень снизу, крепёж. Всё в локальных метрах (как Kit).
   Материалы — язык мира: латунь (то, с чем взаимодействуют), сталь, ржавчина, чугун, медь,
   резина, стекло (сенсоры), эмаль. */
const MAT={
  brass:{hi:'#fff2c6',lt:'#e8c96a',mid:'#b08d3e',dk:'#6d5416',ed:'#2e2208'},
  steel:{hi:'#eef3f6',lt:'#aab3bb',mid:'#717a82',dk:'#3a4046',ed:'#171a1d'},
  rust:{hi:'#e8a878',lt:'#a8714a',mid:'#7a4f33',dk:'#4a2f1f',ed:'#1e120b'},
  iron:{hi:'#bab3a8',lt:'#77716a',mid:'#4d4943',dk:'#2b2824',ed:'#110f0d'},
  copper:{hi:'#ffd8b4',lt:'#d38d5c',mid:'#a0603a',dk:'#5c3420',ed:'#24120a'},
  rubber:{hi:'#77706a',lt:'#4d4741',mid:'#302c29',dk:'#1d1b19',ed:'#0b0a09'},
  glass:{hi:'#ffffff',lt:'#c4e6ff',mid:'#6f9ab4',dk:'#2c4656',ed:'#0e1a22'},
  enamel:{hi:'#fbf3e6',lt:'#ddd2bd',mid:'#ab9b82',dk:'#6b5e4a',ed:'#2a241b'},
  oxblood:{hi:'#f0a088',lt:'#ab4a33',mid:'#7a2a1c',dk:'#4a160e',ed:'#1a0604'},
  soot:{hi:'#6a645c',lt:'#3e3a35',mid:'#2a2724',dk:'#191715',ed:'#090807'},
  /* заводская краска крановой техники: оливковая, выгоревшая — отделяет корпус от латунных узлов */
  olive:{hi:'#cfcca2',lt:'#8a875f',mid:'#5d5b3e',dk:'#373623',ed:'#14140b'}
};
const MK={
  m(mat){return typeof mat==='string'?(MAT[mat]||MAT.steel):mat;},
  /* градиент «цилиндр» поперёк оси (x0,y0)→(x1,y1): тёмный край, блик, полутон, тёмный край */
  cylGrad(c,mat,x0,y0,x1,y1){const m=this.m(mat),g=c.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0,m.dk);g.addColorStop(0.16,m.mid);g.addColorStop(0.3,m.hi);g.addColorStop(0.44,m.lt);
    g.addColorStop(0.78,m.mid);g.addColorStop(1,m.ed);return g;},
  /* градиент «пластина»: свет сверху-слева */
  plateGrad(c,mat,x,y,w,h){const m=this.m(mat),g=c.createLinearGradient(x,y,x+w*0.6,y+h);
    g.addColorStop(0,m.lt);g.addColorStop(0.45,m.mid);g.addColorStop(1,m.dk);return g;},
  bolt(c,x,y,r,mat){const m=this.m(mat||'steel');
    c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.arc(x+r*0.15,y+r*0.25,r,0,TAU);c.fill();
    const g=c.createRadialGradient(x-r*0.35,y-r*0.35,0,x,y,r);g.addColorStop(0,m.hi);g.addColorStop(0.5,m.mid);g.addColorStop(1,m.ed);
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();},
  /* скруглённая пластина с фаской: тело, кромка-блик, тень, болты по углам */
  box(c,x,y,w,h,r,mat,o){o=o||{};const m=this.m(mat);
    rr(c,x,y,w,h,r);c.fillStyle=this.plateGrad(c,m,x,y,w,h);c.fill();
    c.save();rr(c,x,y,w,h,r);c.clip();
    if(o.tex){c.globalAlpha=o.texA||0.22;c.fillStyle=PAT(c,o.tex);c.fillRect(x,y,w,h);c.globalAlpha=1;}
    c.fillStyle='rgba(255,255,255,.16)';c.fillRect(x,y,w,Math.min(0.05,h*0.2));
    c.fillStyle='rgba(0,0,0,.32)';c.fillRect(x,y+h-Math.min(0.06,h*0.25),w,Math.min(0.06,h*0.25));
    if(o.seams)for(const s of o.seams){c.fillStyle='rgba(0,0,0,.42)';c.fillRect(x+s*w-0.012,y,0.024,h);
      c.fillStyle='rgba(255,255,255,.1)';c.fillRect(x+s*w+0.012,y,0.012,h);}
    c.restore();
    c.strokeStyle=m.ed;c.lineWidth=o.lw||0.035;rr(c,x,y,w,h,r);c.stroke();
    if(o.bolts){const b=o.bolts===true?0.045:o.bolts,i=Math.max(b*1.6,Math.min(w,h)*0.18);
      this.bolt(c,x+i,y+i,b,o.boltMat);this.bolt(c,x+w-i,y+i,b,o.boltMat);
      if(h>i*3){this.bolt(c,x+i,y+h-i,b,o.boltMat);this.bolt(c,x+w-i,y+h-i,b,o.boltMat);}}},
  /* вертикальный цилиндр (баллон, бак): крышки-эллипсы, бандажи */
  cyl(c,x,y,w,h,mat,o){o=o||{};const m=this.m(mat),cap=w*0.22;
    c.fillStyle=this.cylGrad(c,m,x,0,x+w,0);
    c.beginPath();c.moveTo(x,y+cap);c.lineTo(x,y+h-cap);c.ellipse(x+w/2,y+h-cap,w/2,cap,0,PI,0,true);
    c.lineTo(x+w,y+cap);c.ellipse(x+w/2,y+cap,w/2,cap,0,0,PI,true);c.closePath();c.fill();
    c.strokeStyle=m.ed;c.lineWidth=0.03;c.stroke();
    c.fillStyle=m.lt;c.beginPath();c.ellipse(x+w/2,y+cap,w/2*0.92,cap*0.8,0,0,TAU);c.fill();
    c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(x+w/2-w*0.12,y+cap-cap*0.2,w*0.18,cap*0.35,0,0,TAU);c.fill();
    for(const b of (o.bands||[])){const bm=this.m(b[2]||'brass'),by=y+h*b[0];
      c.fillStyle=this.cylGrad(c,bm,x-0.02,0,x+w+0.02,0);c.fillRect(x-0.02,by,w+0.04,b[1]);
      c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x-0.02,by+b[1]-0.015,w+0.04,0.015);}},
  /* звено конечности от (x1,y1) до (x2,y2): скруглённый брус с затенением поперёк оси */
  seg(c,x1,y1,x2,y2,w,mat,o){o=o||{};const m=this.m(mat),a=Math.atan2(y2-y1,x2-x1),L=Math.hypot(x2-x1,y2-y1);
    c.save();c.translate(x1,y1);c.rotate(a);
    const g=c.createLinearGradient(0,-w/2,0,w/2);g.addColorStop(0,m.lt);g.addColorStop(0.25,m.hi);g.addColorStop(0.5,m.mid);g.addColorStop(1,m.ed);
    c.fillStyle=g;rr(c,-w*0.15,-w/2,L+w*0.3,w,w*(o.round===undefined?0.45:o.round));c.fill();
    c.strokeStyle=m.ed;c.lineWidth=0.025;rr(c,-w*0.15,-w/2,L+w*0.3,w,w*(o.round===undefined?0.45:o.round));c.stroke();
    if(o.ribs)for(let i=1;i<o.ribs;i++){const px=L*i/o.ribs;c.fillStyle='rgba(0,0,0,.35)';c.fillRect(px-0.012,-w/2,0.024,w);}
    c.restore();},
  /* шарнир: диск с радиальным светом и болтом-осью */
  joint(c,x,y,r,mat){const m=this.m(mat||'steel');
    const g=c.createRadialGradient(x-r*0.35,y-r*0.4,0,x,y,r);g.addColorStop(0,m.hi);g.addColorStop(0.45,m.mid);g.addColorStop(1,m.ed);
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.strokeStyle=m.ed;c.lineWidth=0.02;c.stroke();
    this.bolt(c,x,y,r*0.38,'steel');},
  /* поршень: тёмная гильза + хромированный шток (ext 0..1 — выдвижение) */
  piston(c,x1,y1,x2,y2,w,ext){const a=Math.atan2(y2-y1,x2-x1),L=Math.hypot(x2-x1,y2-y1),sl=L*(0.5+0.12*(1-ext));
    c.save();c.translate(x1,y1);c.rotate(a);
    const gr=c.createLinearGradient(0,-w*0.3,0,w*0.3);gr.addColorStop(0,'#f2f6f8');gr.addColorStop(0.5,'#9aa3aa');gr.addColorStop(1,'#3a4046');
    c.fillStyle=gr;c.fillRect(sl-0.02,-w*0.22,L-sl+0.02,w*0.44);
    const gs=c.createLinearGradient(0,-w/2,0,w/2);gs.addColorStop(0,'#5c646b');gs.addColorStop(0.3,'#8a9299');gs.addColorStop(1,'#1f2326');
    c.fillStyle=gs;rr(c,0,-w/2,sl,w,w*0.2);c.fill();
    c.fillStyle='#b08d3e';c.fillRect(sl-0.05,-w/2,0.05,w);c.restore();},
  /* шланг по точкам: тень, тело, блик, рёбра оплётки */
  hose(c,pts,w,col,o){o=o||{};
    const path=()=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
      if(pts.length===3)c.quadraticCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1]);
      else if(pts.length===4)c.bezierCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);
      else for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);};
    c.lineCap='round';c.lineJoin='round';
    path();c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=w*1.25;c.stroke();
    path();c.strokeStyle=col||'#2f2b28';c.lineWidth=w;c.stroke();
    path();c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=w*0.28;c.save();c.translate(0,-w*0.22);c.stroke();c.restore();
    if(o.ribs){c.setLineDash([0.02,0.07]);path();c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=w*1.02;c.stroke();c.setLineDash([]);}},
  /* стеклянный сенсор: тёмная оправа, линза, светящийся зрачок, блик */
  lens(c,x,y,r,col,k,o){o=o||{};
    c.fillStyle='#16191c';c.beginPath();c.arc(x,y,r*1.25,0,TAU);c.fill();
    this.joint(c,x,y,r*1.18,o.rim||'brass');
    c.fillStyle='#0b0d0f';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    if(k>0){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba('#ffffff',0.9*k));g.addColorStop(0.35,rgba(col,0.95*k));g.addColorStop(1,rgba(col,0.1*k));
      c.fillStyle=g;c.beginPath();c.arc(x,y,r*0.92,0,TAU);c.fill();}
    c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(x-r*0.38,y-r*0.42,r*0.3,r*0.16,-0.6,0,TAU);c.fill();},
  /* трещины: ломаные лучи от центра (k — тяжесть 0..1), сид — чтобы не «кипели» */
  cracks(c,x,y,r,seed,k){if(k<=0)return;const R=rng(seed);
    c.save();c.lineCap='round';c.lineJoin='round';
    const n=2+Math.round(k*4);
    for(let i=0;i<n;i++){let a=R()*TAU,px=x+Math.cos(a)*r*0.15,py=y+Math.sin(a)*r*0.15;
      c.beginPath();c.moveTo(px,py);const L=r*(0.5+R()*0.7)*(0.6+k*0.6),st=3+((R()*3)|0);
      for(let s=0;s<st;s++){a+=(R()-0.5)*1.1;px+=Math.cos(a)*L/st;py+=Math.sin(a)*L/st;c.lineTo(px,py);}
      c.strokeStyle='rgba(0,0,0,.85)';c.lineWidth=0.034;c.stroke();
      c.strokeStyle='rgba(255,226,170,.28)';c.lineWidth=0.012;c.save();c.translate(0.012,0.012);c.stroke();c.restore();}
    c.restore();},
  /* оборванные провода из гнезда: висят, концы искрят */
  wires(c,x,y,ang,seed,t,n){const R=rng(seed);n=n||3;
    const cols=['#c8452f','#e8c96a','#3a6fa8','#2b2b26'];
    for(let i=0;i<n;i++){const a=ang+(R()-0.5)*1.2,L=0.18+R()*0.22,sw=Math.sin(t*3+i*2)*0.05;
      const ex=x+Math.cos(a)*L+sw,ey=y+Math.sin(a)*L+L*0.6;
      c.strokeStyle=cols[i%cols.length];c.lineWidth=0.028;c.lineCap='round';
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a)*L*0.6,y+Math.sin(a)*L*0.4,ex,ey);c.stroke();
      if(Math.sin(t*17+i*5+seed)>0.86){c.fillStyle='#fff3c8';c.beginPath();c.arc(ex,ey,0.035,0,TAU);c.fill();}}},
  /* культя: тёмное гнездо, рваная кромка листа, провода */
  stump(c,x,y,r,ang,seed,t,mat){const m=this.m(mat||'steel'),R=rng(seed);
    c.fillStyle='#0d0c0b';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    c.beginPath();for(let i=0;i<=10;i++){const a=i/10*TAU,rr2=r*(1.1+R()*0.35);
      const px=x+Math.cos(a)*rr2,py=y+Math.sin(a)*rr2;i?c.lineTo(px,py):c.moveTo(px,py);}
    c.closePath();c.strokeStyle=m.lt;c.lineWidth=0.04;c.stroke();
    c.fillStyle='rgba(255,140,60,.55)';c.beginPath();c.arc(x,y,r*0.35,0,TAU);c.fill();
    this.wires(c,x,y,ang,seed+7,t,3);},
  /* факел горелки: синее ядро + рыжий язык (аддитивно); len — длина, k — сила 0..1 */
  flame(c,x,y,len,ang,k,t){if(k<=0.01)return;
    c.save();c.translate(x,y);c.rotate(ang);c.globalCompositeOperation='lighter';
    const L=len*(0.92+0.08*Math.sin(t*40)),W=0.12+0.1*k;
    const g=c.createLinearGradient(0,0,L,0);g.addColorStop(0,rgba('#fff8e8',0.95*k));g.addColorStop(0.18,rgba('#ffcf7a',0.85*k));
    g.addColorStop(0.6,rgba('#ff7a2a',0.55*k));g.addColorStop(1,'rgba(255,80,20,0)');
    c.fillStyle=g;c.beginPath();c.moveTo(0,-W*0.4);c.quadraticCurveTo(L*0.5,-W*(1.1+0.2*Math.sin(t*31)),L,0);
    c.quadraticCurveTo(L*0.5,W*(1.1+0.2*Math.cos(t*29)),0,W*0.4);c.closePath();c.fill();
    const b=c.createLinearGradient(0,0,L*0.45,0);b.addColorStop(0,rgba('#e8f6ff',k));b.addColorStop(1,'rgba(120,190,255,0)');
    c.fillStyle=b;c.beginPath();c.moveTo(0,-W*0.22);c.quadraticCurveTo(L*0.25,-W*0.35,L*0.45,0);c.quadraticCurveTo(L*0.25,W*0.35,0,W*0.22);c.closePath();c.fill();
    c.restore();},
  /* раскрытая панель (EXPOSED): откинутая крышка + янтарное нутро */
  hatch(c,x,y,w,h,open,mat,t){const m=this.m(mat||'steel');
    if(open>0){const p=0.5+0.5*Math.sin(t*8);
      c.fillStyle='#120b05';rr(c,x,y,w,h,0.04);c.fill();
      const g=c.createRadialGradient(x+w/2,y+h/2,0,x+w/2,y+h/2,Math.max(w,h)*0.7);
      g.addColorStop(0,rgba('#ffe6a3',0.9*open));g.addColorStop(0.5,rgba('#ffb45a',(0.55+0.2*p)*open));g.addColorStop(1,'rgba(200,80,20,0)');
      c.fillStyle=g;rr(c,x,y,w,h,0.04);c.fill();}
    c.save();c.translate(x,y);c.rotate(-open*1.9);this.box(c,0,-0.02,w,h*(1-open*0.55),0.03,m,{});c.restore();}
};
