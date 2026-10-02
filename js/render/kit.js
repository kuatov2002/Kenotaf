"use strict";
/* ============================== KIT (процедурные пропсы) ============================== */
const Kit={
  bolt(c,x,y,r){c.fillStyle='rgba(0,0,0,.55)';c.beginPath();c.arc(x,y+r*0.25,r,0,TAU);c.fill();
    const g=c.createRadialGradient(x-r*0.4,y-r*0.4,0,x,y,r);g.addColorStop(0,'#9aa1a8');g.addColorStop(.55,'#5f666d');g.addColorStop(1,'#2b3035');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    c.fillStyle='rgba(255,235,200,.35)';c.beginPath();c.arc(x-r*0.3,y-r*0.32,r*0.3,0,TAU);c.fill();},
  grunge(c,x,y,w,h,r,amt,col){for(let i=0;i<amt*40;i++){const px=x+r()*w,py=y+r()*h,rad=r()*0.5+0.08;
    c.fillStyle=col;c.globalAlpha=r()*0.22;c.beginPath();c.ellipse(px,py,rad*r()*3+0.1,rad,0,0,TAU);c.fill();}c.globalAlpha=1;},
  plate(c,x,y,w,h,mat,seed,opts){
    opts=opts||{};const r=rng((seed||7)*13+5);
    c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x+0.05,y+0.07,w,h);
    c.fillStyle=PAT(c,mat||'steel');c.fillRect(x,y,w,h);
    c.fillStyle='rgba(255,255,255,.10)';c.fillRect(x,y,w,0.035);
    c.fillStyle='rgba(255,255,255,.045)';c.fillRect(x,y,0.035,h);
    c.fillStyle='rgba(0,0,0,.42)';c.fillRect(x,y+h-0.05,w,0.05);
    c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x+w-0.05,y,0.05,h);
    if(opts.bolts!==false){const st=opts.boltStep||1.1;
      for(let bx=x+0.16;bx<x+w-0.08;bx+=st){this.bolt(c,bx,y+0.14,0.055);this.bolt(c,bx,y+h-0.14,0.055);}}
    if(opts.rust)this.grunge(c,x,y,w,h,r,opts.rust,'#3a2418');},
  pipe(c,pts,rad,mat,opts){
    opts=opts||{};
    const st=(col,lw,ox,oy)=>{c.save();c.translate(ox||0,oy||0);c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';
      c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.stroke();c.restore();};
    st('rgba(0,0,0,.5)',rad*2.3,0.06,0.09);st('#23282c',rad*2,0,0);st(PAT(c,mat||'steel'),rad*1.86,0,0);
    c.save();c.globalAlpha=0.3;st('#ffffff',rad*0.42,0,-rad*0.55);c.restore();
    c.save();c.globalAlpha=0.35;st('#000000',rad*0.5,0,rad*0.6);c.restore();
    for(let i=0;i<pts.length;i++){
      const p=pts[i],q=pts[i===0?1:(i===pts.length-1?i-1:i+1)],a=Math.atan2(q[1]-p[1],q[0]-p[0]);
      c.save();c.translate(p[0],p[1]);c.rotate(a);
      c.fillStyle='rgba(0,0,0,.4)';c.fillRect(-0.06,-rad*1.35,0.16,rad*2.7);
      c.fillStyle=PAT(c,'steel');c.fillRect(-0.11,-rad*1.28,0.2,rad*2.56);
      c.fillStyle='rgba(255,255,255,.14)';c.fillRect(-0.11,-rad*1.28,0.2,0.03);
      this.bolt(c,-0.01,-rad*1.05,0.045);this.bolt(c,-0.01,rad*1.05,0.045);c.restore();}
    if(opts.band&&pts.length>1){const i=Math.min(opts.band|0,pts.length-2),p=pts[i],q=pts[i+1],a=Math.atan2(q[1]-p[1],q[0]-p[0]);
      c.save();c.translate(p[0],p[1]);c.rotate(a);c.fillStyle=opts.bandCol||'#c9a227';c.globalAlpha=0.85;
      c.fillRect(-0.1,-rad,0.2,rad*2);c.restore();}
    const r=rng(opts.seed||3);
    if(opts.rustN!==0)for(let i=0;i<(opts.rustN||8);i++){
      const p=pts[(r()*pts.length)|0],x=p[0]+(r()-0.5)*1.2,y=p[1]+rad;
      c.fillStyle='rgba(96,54,32,'+(r()*0.35+0.1)+')';
      c.beginPath();c.moveTo(x-0.06,y);c.lineTo(x+0.06,y);c.lineTo(x+0.02,y+r()*1.4+0.3);c.lineTo(x-0.02,y+r()*1.4+0.3);c.fill();}
  },
  bracket(c,x,y,rad){c.fillStyle=PAT(c,'steel');c.fillRect(x-0.1,y-rad*1.6,0.22,rad*3.2);
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+0.12,y-rad*1.6,0.1,rad*3.2);
    this.bolt(c,x,y-rad*1.2,0.05);this.bolt(c,x,y+rad*1.2,0.05);},
  tank(c,x,y,w,h,opts){
    opts=opts||{};const r=rng((opts.seed||11)*17+3);
    c.fillStyle='rgba(0,0,0,.5)';rr(c,x+0.1,y+0.14,w,h,0.2);c.fill();
    const g=c.createLinearGradient(x,0,x+w,0);
    g.addColorStop(0,'#25292d');g.addColorStop(.18,'#4e565d');g.addColorStop(.34,'#6b747c');g.addColorStop(.55,'#454c52');g.addColorStop(1,'#1e2226');
    c.fillStyle=g;rr(c,x,y,w,h,w*0.16);c.fill();
    c.save();rr(c,x,y,w,h,w*0.16);c.clip();
    c.fillStyle=PAT(c,'rust');c.globalAlpha=0.32;c.fillRect(x,y,w,h);c.globalAlpha=1;
    const seams=Math.max(2,Math.round(h/2.2));
    for(let i=1;i<seams;i++){const sy=y+h*i/seams;
      c.fillStyle='rgba(0,0,0,.42)';c.fillRect(x,sy,w,0.05);
      c.fillStyle='rgba(255,255,255,.09)';c.fillRect(x,sy+0.05,w,0.025);
      for(let bx=x+0.2;bx<x+w-0.1;bx+=0.42)this.bolt(c,bx,sy+0.03,0.04);}
    for(let i=0;i<22;i++){const px=x+r()*w,py=y+r()*h;
      c.fillStyle='rgba(90,50,30,'+(r()*0.3+0.08)+')';c.beginPath();c.ellipse(px,py,r()*0.3+0.05,r()*0.9+0.2,0,0,TAU);c.fill();}
    c.restore();
    if(opts.manhole!==false){const mx=x+w*0.5,my=y+h*0.3,mr=Math.min(w*0.22,0.7);
      c.fillStyle='#2c3237';c.beginPath();c.arc(mx,my,mr,0,TAU);c.fill();
      c.strokeStyle='#6c757d';c.lineWidth=0.06;c.beginPath();c.arc(mx,my,mr,0,TAU);c.stroke();
      for(let i=0;i<8;i++){const a=i/8*TAU;this.bolt(c,mx+Math.cos(a)*mr*0.82,my+Math.sin(a)*mr*0.82,0.045);}
      c.fillStyle='rgba(255,255,255,.08)';c.beginPath();c.arc(mx-mr*0.3,my-mr*0.3,mr*0.4,0,TAU);c.fill();}
    if(opts.label){this.plate(c,x+w*0.18,y+h*0.62,w*0.64,0.62,'steel',5,{rust:0.4});
      c.fillStyle='#1a1d20';c.font='700 0.34px Oswald';c.textAlign='center';c.fillText(opts.label,x+w*0.5,y+h*0.62+0.44);c.textAlign='left';}
    c.fillStyle='#5b636a';c.fillRect(x-0.08,y-0.1,w+0.16,0.2);
    c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x-0.08,y-0.1,w+0.16,0.04);},
  gauge(c,x,y,r,val){
    c.save();c.translate(x,y);
    c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.arc(0.03,0.05,r*1.12,0,TAU);c.fill();
    const bg=c.createLinearGradient(-r,-r,r,r);bg.addColorStop(0,'#e0bd55');bg.addColorStop(.4,'#a8842a');bg.addColorStop(1,'#6d5416');
    c.fillStyle=bg;c.beginPath();c.arc(0,0,r*1.12,0,TAU);c.fill();
    for(let i=0;i<8;i++){const a=i/8*TAU;this.bolt(c,Math.cos(a)*r*0.98,Math.sin(a)*r*0.98,r*0.09);}
    c.fillStyle='#e6e2d4';c.beginPath();c.arc(0,0,r*0.86,0,TAU);c.fill();
    c.strokeStyle='#2b2a26';c.lineWidth=r*0.07;
    for(let i=0;i<=10;i++){const a=PI*0.75+i/10*PI*1.5;
      c.beginPath();c.moveTo(Math.cos(a)*r*0.72,Math.sin(a)*r*0.72);c.lineTo(Math.cos(a)*r*(i%5?0.62:0.55),Math.sin(a)*r*(i%5?0.62:0.55));c.stroke();}
    c.strokeStyle='#b03a24';c.lineWidth=r*0.11;c.beginPath();c.arc(0,0,r*0.72,PI*0.75+PI*1.32,PI*0.75+PI*1.5);c.stroke();
    const na=PI*0.75+clamp(val,0,1)*PI*1.5;
    c.strokeStyle='#1c1b18';c.lineWidth=r*0.09;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(na)*r*0.66,Math.sin(na)*r*0.66);c.stroke();
    c.fillStyle='#2b2a26';c.beginPath();c.arc(0,0,r*0.13,0,TAU);c.fill();
    c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=r*0.06;c.beginPath();c.arc(-r*0.2,-r*0.25,r*0.62,PI*1.05,PI*1.35);c.stroke();
    c.restore();},
  valve(c,x,y,r,ang,col){c.save();c.translate(x,y);c.rotate(ang||0);
    c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.arc(0.04,0.06,r,0,TAU);c.fill();
    c.strokeStyle=col||'#a8842a';c.lineWidth=r*0.24;c.beginPath();c.arc(0,0,r*0.82,0,TAU);c.stroke();
    for(let i=0;i<5;i++){const a=i/5*TAU;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r*0.8,Math.sin(a)*r*0.8);c.stroke();}
    c.strokeStyle='rgba(255,240,190,.4)';c.lineWidth=r*0.07;c.beginPath();c.arc(0,0,r*0.82,PI*1.05,PI*1.45);c.stroke();
    c.fillStyle='#6d5416';c.beginPath();c.arc(0,0,r*0.2,0,TAU);c.fill();c.restore();},
  lampCage(c,x,y,r,opts){opts=opts||{};c.save();c.translate(x,y);
    c.fillStyle='#2a2e32';c.fillRect(-0.09,-r*2.6,0.18,r*1.6);
    c.fillStyle='#3b4147';rr(c,-r*1.05,-r*1.05,r*2.1,r*0.5,0.06);c.fill();
    c.fillStyle=opts.glass||'#ffd9a0';c.beginPath();c.arc(0,r*0.25,r*0.78,0,TAU);c.fill();
    c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.arc(-r*0.25,r*0.05,r*0.3,0,TAU);c.fill();
    c.strokeStyle='#22262a';c.lineWidth=r*0.13;
    for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*r*0.42,-r*0.6);c.lineTo(i*r*0.5,r*1.25);c.stroke();}
    c.beginPath();c.moveTo(-r*1.05,r*0.2);c.lineTo(r*1.05,r*0.2);c.stroke();
    c.beginPath();c.moveTo(-r*1.05,r*0.85);c.lineTo(r*1.05,r*0.85);c.stroke();
    c.fillStyle='#3b4147';rr(c,-r*1.15,r*1.15,r*2.3,r*0.34,0.05);c.fill();c.restore();},
  chain(c,x,y,len,link,ang,t){c.save();c.translate(x,y);c.rotate(ang||0);
    const n=Math.max(1,Math.floor(len/(link*1.4)));
    for(let i=0;i<n;i++){const yy=i*link*1.4,sw=Math.sin((t||0)*1.2+i*0.4)*0.015*i;
      c.save();c.translate(sw,yy);if(i%2)c.rotate(PI/2);
      c.strokeStyle='#3a4046';c.lineWidth=link*0.42;c.beginPath();c.ellipse(0,0,link*0.42,link*0.72,0,0,TAU);c.stroke();
      c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=link*0.13;c.beginPath();c.ellipse(-link*0.1,-link*0.15,link*0.36,link*0.6,0,PI*1.1,PI*1.6);c.stroke();
      c.restore();}c.restore();},
  hook(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);
    c.strokeStyle='#4a5158';c.lineWidth=0.16;c.lineCap='round';
    c.beginPath();c.moveTo(0,0);c.lineTo(0,0.5);c.arc(0,0.78,0.28,PI*1.5,PI*0.7,true);c.stroke();c.restore();},
  cable(c,x1,y1,x2,y2,sag,th,col){const mx=(x1+x2)/2,my=(y1+y2)/2+sag;
    c.strokeStyle=col||'#22262a';c.lineWidth=th||0.08;c.lineCap='round';
    c.beginPath();c.moveTo(x1,y1);c.quadraticCurveTo(mx,my+sag,x2,y2);c.stroke();
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=(th||0.08)*0.35;
    c.beginPath();c.moveTo(x1,y1-0.02);c.quadraticCurveTo(mx,my+sag-0.02,x2,y2-0.02);c.stroke();},
  crate(c,x,y,w,h,opts){opts=opts||{};const r=rng((opts.seed||3)*29+1);
    this.plate(c,x,y,w,h,opts.mat||'ply',opts.seed||3,{rust:0.5,boltStep:0.8});
    c.strokeStyle='rgba(40,28,18,.7)';c.lineWidth=0.07;
    c.beginPath();c.moveTo(x+0.08,y+0.08);c.lineTo(x+w-0.08,y+h-0.08);c.moveTo(x+w-0.08,y+0.08);c.lineTo(x+0.08,y+h-0.08);c.stroke();
    if(r()>0.4){c.fillStyle='rgba(200,180,140,.22)';c.font='700 0.3px Oswald';
      c.fillText(['ГРУЗ','41','Я-7','ОСТОРОЖНО'][(r()*4)|0],x+0.2,y+h*0.55);}},
  barrel(c,x,y,r,h,col){c.fillStyle='rgba(0,0,0,.45)';rr(c,x-r+0.06,y+0.08,r*2,h,r*0.3);c.fill();
    const g=c.createLinearGradient(x-r,0,x+r,0);
    g.addColorStop(0,'#20242a');g.addColorStop(.3,col||'#6b4a3a');g.addColorStop(.5,shade(col||'#6b4a3a',0.18));g.addColorStop(1,'#1b1e22');
    c.fillStyle=g;rr(c,x-r,y,r*2,h,r*0.22);c.fill();
    c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x-r,y+h*0.28,r*2,0.07);c.fillRect(x-r,y+h*0.66,r*2,0.07);
    c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x-r*0.5,y,0.09,h);},
  ladder(c,x,y,h,w){w=w||0.5;c.strokeStyle='#4d545a';c.lineWidth=0.09;
    c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h);c.moveTo(x+w,y);c.lineTo(x+w,y+h);c.stroke();
    c.strokeStyle='#5c646b';c.lineWidth=0.06;
    for(let ry=y+0.28;ry<y+h;ry+=0.42){c.beginPath();c.moveTo(x,ry);c.lineTo(x+w,ry);c.stroke();}},
  railing(c,x,y,w,h,col){h=h||0.9;col=col||'#4d545a';
    c.strokeStyle=col;c.lineWidth=0.07;
    c.beginPath();c.moveTo(x,y-h);c.lineTo(x+w,y-h);c.moveTo(x,y-h*0.55);c.lineTo(x+w,y-h*0.55);c.stroke();
    for(let px=x;px<=x+w+0.01;px+=0.85){c.beginPath();c.moveTo(px,y);c.lineTo(px,y-h);c.stroke();}
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=0.025;
    c.beginPath();c.moveTo(x,y-h-0.03);c.lineTo(x+w,y-h-0.03);c.stroke();},
  sign(c,x,y,w,h,text,bg,fg,seed){
    this.plate(c,x,y,w,h,'steel',seed||2,{rust:0.6,boltStep:1.4});
    c.fillStyle=bg||'#c9a227';rr(c,x+0.1,y+0.1,w-0.2,h-0.2,0.04);c.fill();
    const r=rng((seed||2)*7);
    c.fillStyle='rgba(0,0,0,.22)';for(let i=0;i<8;i++)c.fillRect(x+0.1+r()*(w-0.2),y+0.1+r()*(h-0.2),0.2,0.05);
    c.fillStyle=fg||'#191612';c.textAlign='center';c.textBaseline='middle';
    const fs=Math.min(h*0.52,w/Math.max(1,text.length)*1.5);
    c.font='700 '+fs+'px Oswald';c.fillText(text,x+w/2,y+h/2);
    c.textAlign='left';c.textBaseline='alphabetic';},
  stencil(c,x,y,text,size,col,alpha){c.save();c.globalAlpha=alpha===undefined?0.5:alpha;
    c.fillStyle='rgba(0,0,0,.5)';c.font='500 '+size+'px Oswald';c.fillText(text,x+size*0.03,y+size*0.03);
    c.fillStyle=col||'#cbbfa6';c.fillText(text,x,y);c.restore();},
  hazardTape(c,x,y,w,h){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    c.fillStyle=PAT(c,'hazard');c.fillRect(x,y,w,h);
    c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x,y+h-0.04,w,0.04);c.restore();},
  oilStain(c,x,y,w,r){r=r||rng(x*31+y*7);
    c.save();const g=c.createRadialGradient(x,y,0,x,y,w);
    g.addColorStop(0,'rgba(16,14,12,.7)');g.addColorStop(.6,'rgba(24,20,16,.4)');g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g;c.beginPath();c.ellipse(x,y,w,w*0.3,0,0,TAU);c.fill();
    c.globalAlpha=0.2;for(let i=0;i<4;i++){c.beginPath();
      c.ellipse(x+(r()-0.5)*w*1.4,y+(r()-0.5)*w*0.4,w*r()*0.3,w*r()*0.12,0,0,TAU);c.fillStyle='#0d0b09';c.fill();}
    c.restore();},
  puddle(c,x,y,w,col){c.save();const g=c.createRadialGradient(x,y,0,x,y,w);
    g.addColorStop(0,rgba(col||'#6d7d86',0.5));g.addColorStop(1,rgba(col||'#6d7d86',0));
    c.fillStyle=g;c.beginPath();c.ellipse(x,y,w,w*0.24,0,0,TAU);c.fill();
    c.strokeStyle='rgba(255,240,210,.16)';c.lineWidth=0.03;
    c.beginPath();c.ellipse(x-w*0.2,y-w*0.05,w*0.5,w*0.1,0,PI*1.1,PI*1.7);c.stroke();c.restore();},
  rubble(c,x,y,w,h,r,mat){r=r||rng(x*7+y);
    for(let i=0;i<w*h*3;i++){const px=x+r()*w,py=y+h-r()*r()*h*1.25;if(py<y)continue;
      const s=r()*0.5+0.12;
      c.save();c.translate(px,py);c.rotate(r()*TAU);
      c.fillStyle=PAT(c,mat||'concrete');c.beginPath();
      c.moveTo(-s,-s*0.6);c.lineTo(s*0.8,-s);c.lineTo(s,s*0.5);c.lineTo(-s*0.4,s*0.8);c.closePath();c.fill();
      c.fillStyle='rgba(255,255,255,.09)';c.fillRect(-s,-s*0.7,s*1.4,0.04);c.restore();}
    for(let i=0;i<4;i++){const px=x+r()*w;c.strokeStyle='#6a5340';c.lineWidth=0.05;
      c.beginPath();c.moveTo(px,y+h*0.6);c.quadraticCurveTo(px+(r()-0.5)*1.4,y-r()*1.2,px+(r()-0.5)*2,y-r()*1.8);c.stroke();}},
  vent(c,x,y,w,h){this.plate(c,x-0.1,y-0.1,w+0.2,h+0.2,'steel',9,{rust:0.5});
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
    c.fillStyle='#141719';c.fillRect(x,y,w,h);
    for(let ly=y+0.1;ly<y+h;ly+=0.22){c.fillStyle='#3d444a';c.fillRect(x,ly,w,0.12);
      c.fillStyle='rgba(0,0,0,.6)';c.fillRect(x,ly+0.12,w,0.06);
      c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x,ly,w,0.025);}
    c.restore();},
  pumpUnit(c,x,y,s,opts){
    opts=opts||{};const r=rng((opts.seed||5)*19+1);
    c.save();c.translate(x,y);c.scale(s,s);
    c.fillStyle=PAT(c,'concrete');c.fillRect(-2.4,-0.9,4.8,0.9);
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(-2.4,-0.06,4.8,0.06);
    this.hazardTape(c,-2.4,-0.22,4.8,0.16);
    const cg=c.createRadialGradient(-0.4,-2.2,0.2,0,-2,2.1);
    cg.addColorStop(0,'#79838b');cg.addColorStop(.5,'#4d555c');cg.addColorStop(1,'#22272b');
    c.fillStyle=cg;c.beginPath();c.arc(0,-2,1.9,0,TAU);c.fill();
    c.save();c.beginPath();c.arc(0,-2,1.9,0,TAU);c.clip();
    c.fillStyle=PAT(c,'rust');c.globalAlpha=0.3;c.fillRect(-2,-4,4,4);c.globalAlpha=1;c.restore();
    for(let i=0;i<14;i++){const a=i/14*TAU;this.bolt(c,Math.cos(a)*1.68,-2+Math.sin(a)*1.68,0.075);}
    c.fillStyle='#2b3136';c.beginPath();c.arc(0,-2,0.72,0,TAU);c.fill();
    c.strokeStyle='#6f7a82';c.lineWidth=0.08;c.beginPath();c.arc(0,-2,0.72,0,TAU);c.stroke();
    c.fillStyle=PAT(c,'steel');rr(c,1.5,-3.3,3.1,2.5,0.2);c.fill();
    for(let i=0;i<9;i++){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(1.7+i*0.32,-3.3,0.12,2.5);
      c.fillStyle='rgba(255,255,255,.06)';c.fillRect(1.82+i*0.32,-3.3,0.06,2.5);}
    c.fillStyle='#3a4147';rr(c,4.5,-2.9,0.5,1.7,0.1);c.fill();
    this.plate(c,2.1,-2.9,1.1,0.7,'steel',4,{});
    c.fillStyle='#1b1e21';c.font='700 0.34px Oswald';c.fillText(opts.tag||'М-4',2.24,-2.42);
    this.pipe(c,[[0,-3.9],[0,-5.3],[-2.6,-5.3]],0.42,'steel',{seed:2});
    this.pipe(c,[[1.9,-2],[1.9,-0.4],[3.4,-0.4]],0.34,'steel',{seed:3});
    this.gauge(c,-1.5,-3.4,0.34,opts.press===undefined?0.62:opts.press);
    this.valve(c,2.9,-4.2,0.34,0.4);
    this.oilStain(c,0.4,-0.02,1.5,r);
    for(let i=0;i<8;i++){c.fillStyle='rgba(88,50,30,'+(r()*0.3)+')';c.fillRect(-1.8+r()*3.6,-3.6+r(),0.07,r()*0.9+0.2);}
    c.restore();},
  flywheel(c,x,y,r,ang,spokes){
    c.save();c.translate(x,y);c.rotate(ang||0);
    c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.arc(0.05,0.07,r,0,TAU);c.fill();
    const g=c.createRadialGradient(-r*0.3,-r*0.3,r*0.1,0,0,r);
    g.addColorStop(0,'#7d868e');g.addColorStop(.6,'#4b5259');g.addColorStop(1,'#242a2e');
    c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
    c.strokeStyle='#2c3237';c.lineWidth=r*0.16;c.beginPath();c.arc(0,0,r*0.86,0,TAU);c.stroke();
    c.strokeStyle='#5f686f';c.lineWidth=r*0.11;const n=spokes||6;
    for(let i=0;i<n;i++){const a=i/n*TAU;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r*0.82,Math.sin(a)*r*0.82);c.stroke();}
    c.fillStyle='#3a4147';c.beginPath();c.arc(0,0,r*0.22,0,TAU);c.fill();
    for(let i=0;i<10;i++){const a=i/10*TAU;this.bolt(c,Math.cos(a)*r*0.93,Math.sin(a)*r*0.93,r*0.05);}
    c.restore();},
  craneGirder(c,x,y,w,h){c.fillStyle=PAT(c,'steel');c.fillRect(x,y,w,h);
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x,y+h-0.12,w,0.12);
    c.fillStyle='rgba(255,255,255,.1)';c.fillRect(x,y,w,0.06);
    c.strokeStyle='rgba(20,22,25,.85)';c.lineWidth=0.09;
    for(let px=x;px<x+w-0.1;px+=1.0){c.beginPath();c.moveTo(px,y+0.12);c.lineTo(px+1.0,y+h-0.12);
      c.moveTo(px+1.0,y+0.12);c.lineTo(px,y+h-0.12);c.stroke();}
    c.fillStyle='rgba(20,22,25,.6)';c.fillRect(x,y+h*0.42,w,h*0.16);
    for(let px=x+0.3;px<x+w;px+=0.9)this.bolt(c,px,y+0.2,0.055);},
  trolley(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);
    this.plate(c,-0.9,-0.55,1.8,0.9,'steel',8,{rust:0.6});
    c.fillStyle='#2b3136';rr(c,-0.5,0.3,1.0,0.4,0.06);c.fill();
    this.bolt(c,-0.6,-0.75,0.09);this.bolt(c,0.6,-0.75,0.09);c.restore();},
  /* поза p: 0 — лежит ничком, 1 — сидит, 2 — стоит с тростью. Углы: 0 — вверх, PI/2 — вперёд */
  gardener(c,x,y,p,face,t,o){o=o||{};
    const PZ=[{hx:-0.38,hy:-0.2,to:1.5,he:1.42,thB:4.66,shB:4.7,thF:4.78,shF:4.55,uaB:4.6,faB:4.7,uaF:1.55,faF:1.45},
      {hx:-0.15,hy:-0.22,to:0.36,he:0.26,thB:1.25,shB:2.7,thF:1.1,shF:2.55,uaB:3.4,faB:3.3,uaF:2.6,faF:1.6},
      {hx:0,hy:-0.86,to:0.14,he:0.24,thB:3.2,shB:3.14,thF:3.05,shF:3.16,uaB:3.05,faB:2.95,uaF:2.75,faF:2.15}];
    p=clamp(p,0,2);const i=p<1?0:1,u=p<1?p:p-1,A=PZ[i],B=PZ[i+1],G=k=>lerp(A[k],B[k],u);
    const D=a=>[Math.sin(a),-Math.cos(a)],br=Math.sin(t*1.7)*0.012;
    c.save();c.translate(x,y);if(face<0)c.scale(-1,1);
    const hx=G('hx'),hy=G('hy')+br*(p>1.5?1:0.4);
    const limb=(x0,y0,a1,l1,a2,l2,w,col)=>{const d1=D(a1),kx=x0+d1[0]*l1,ky=y0+d1[1]*l1,d2=D(a2),ex=kx+d2[0]*l2,ey=ky+d2[1]*l2;
      c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x0,y0);c.lineTo(kx,ky);c.lineTo(ex,ey);c.stroke();
      return [ex,ey,Math.atan2(d2[0],-d2[1])];};
    const foot=(f)=>{c.save();c.translate(f[0],f[1]);c.rotate(f[2]+PI/2);
      if(o.boots){c.strokeStyle='#c9a227';c.lineWidth=0.07;c.beginPath();c.arc(0.02,0,0.12,PI*0.15,PI*1.85);c.stroke();
        c.fillStyle='#ffe6a3';c.beginPath();c.arc(-0.08,0.05,0.025,0,TAU);c.arc(-0.08,-0.05,0.025,0,TAU);c.fill();}
      else{c.fillStyle='#7a6a58';c.beginPath();c.ellipse(0.04,0,0.14,0.08,0,0,TAU);c.fill();}
      c.restore();};
    const tA=G('to'),td=D(tA),sx=hx+td[0]*0.6,sy=hy+td[1]*0.6,nx=-td[1],ny=td[0];
    foot(limb(hx-nx*0.06,hy-ny*0.06,G('thB'),0.44,G('shB'),0.44,0.17,'#34311f'));
    limb(sx-nx*0.1,sy-ny*0.1,G('uaB'),0.31,G('faB'),0.29,0.13,'#454a2c');
    /* плащ: от плеч до колен, полы расходятся */
    c.fillStyle='#5a5f36';c.beginPath();
    c.moveTo(sx+nx*0.21,sy+ny*0.21);c.lineTo(sx-nx*0.19,sy-ny*0.19);
    c.lineTo(hx-nx*0.25-td[0]*0.34,hy-ny*0.25-td[1]*0.34);c.lineTo(hx+nx*0.28-td[0]*0.38,hy+ny*0.28-td[1]*0.38);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.08)';c.beginPath();c.moveTo(sx+nx*0.21,sy+ny*0.21);c.lineTo(sx+nx*0.12,sy+ny*0.12);
    c.lineTo(hx+nx*0.18-td[0]*0.36,hy+ny*0.18-td[1]*0.36);c.lineTo(hx+nx*0.28-td[0]*0.38,hy+ny*0.28-td[1]*0.38);c.closePath();c.fill();
    /* фартук и ремень с секатором */
    c.fillStyle='#8a7a58';c.beginPath();c.moveTo(sx+nx*0.2-td[0]*0.14,sy+ny*0.2-td[1]*0.14);c.lineTo(sx+nx*0.06-td[0]*0.14,sy+ny*0.06-td[1]*0.14);
    c.lineTo(hx+nx*0.1-td[0]*0.3,hy+ny*0.1-td[1]*0.3);c.lineTo(hx+nx*0.27-td[0]*0.32,hy+ny*0.27-td[1]*0.32);c.closePath();c.fill();
    c.strokeStyle='#2a241a';c.lineWidth=0.06;c.beginPath();c.moveTo(hx+nx*0.26+td[0]*0.1,hy+ny*0.26+td[1]*0.1);c.lineTo(hx-nx*0.22+td[0]*0.1,hy-ny*0.22+td[1]*0.1);c.stroke();
    c.fillStyle='#9aa1a8';c.beginPath();c.arc(hx-nx*0.18+td[0]*0.04,hy-ny*0.18+td[1]*0.04,0.06,0,TAU);c.fill();
    foot(limb(hx+nx*0.06,hy+ny*0.06,G('thF'),0.44,G('shF'),0.44,0.18,'#3d3a26'));
    /* голова: шляпа с полями, респиратор с латунным фильтром */
    const hA=G('he'),hu=D(hA),hf=D(hA+PI/2),cx=sx+hu[0]*0.24,cy=sy+hu[1]*0.24;
    c.fillStyle='#b8987a';c.beginPath();c.arc(cx,cy,0.155,0,TAU);c.fill();
    c.save();c.translate(cx,cy);c.rotate(hA);
    c.fillStyle='#3a3d40';rr(c,0.02,-0.04,0.17,0.15,0.05);c.fill();
    c.fillStyle='#b08d3e';rr(c,0.12,0.04,0.12,0.13,0.04);c.fill();c.fillStyle='rgba(255,230,160,.5)';c.fillRect(0.14,0.06,0.03,0.09);
    c.fillStyle='rgba(180,220,255,.55)';c.beginPath();c.arc(0.06,-0.06,0.035,0,TAU);c.fill();
    c.fillStyle='#6b5a3a';c.beginPath();c.ellipse(0,-0.13,0.32,0.06,0,0,TAU);c.fill();
    c.fillStyle='#5a4a2e';rr(c,-0.15,-0.32,0.3,0.2,0.07);c.fill();
    c.fillStyle='#8a2b1e';c.fillRect(-0.15,-0.18,0.3,0.04);c.restore();
    const hand=limb(sx+nx*0.1,sy+ny*0.1,G('uaF')+(o.reach?Math.sin(t*2.3)*0.12:0),0.31,G('faF')+(o.reach?Math.sin(t*3.1)*0.18:0),0.29,0.13,'#4b5032');
    c.fillStyle='#4a3a2a';c.beginPath();c.arc(hand[0],hand[1],0.07,0,TAU);c.fill();
    /* трость — когда встаёт */
    if(p>1.3){c.globalAlpha=clamp((p-1.3)/0.5,0,1);c.strokeStyle='#6b4a2a';c.lineWidth=0.07;c.beginPath();
      c.moveTo(hand[0],hand[1]-0.08);c.lineTo(hand[0]+0.12,0);c.stroke();c.globalAlpha=1;}
    c.restore();},
  electromagnet(c,x,y,r){c.save();c.translate(x,y);
    const g=c.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#5d666d');g.addColorStop(1,'#25292d');
    c.fillStyle=g;c.beginPath();c.ellipse(0,0,r,r*0.52,0,0,TAU);c.fill();
    c.fillStyle='#3b4249';c.beginPath();c.ellipse(0,r*0.16,r*0.86,r*0.4,0,0,TAU);c.fill();
    c.strokeStyle='#c9a227';c.lineWidth=r*0.1;c.beginPath();c.ellipse(0,r*0.2,r*0.7,r*0.3,0,0,TAU);c.stroke();
    for(let i=0;i<8;i++){const a=i/8*TAU;this.bolt(c,Math.cos(a)*r*0.8,Math.sin(a)*r*0.38,0.06);}
    c.restore();},
  doorUnit(c,x,y,w,h,num,opts){opts=opts||{};const r=rng((opts.seed||1)*37+(num||3));
    c.fillStyle='#241a19';c.fillRect(x-0.14,y-0.14,w+0.28,h+0.14);
    c.fillStyle=PAT(c,'ply');c.fillRect(x,y,w,h);
    c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+w-0.16,y,0.16,h);
    c.fillStyle='rgba(255,240,210,.06)';c.fillRect(x,y,w,0.05);
    c.strokeStyle='rgba(30,18,16,.6)';c.lineWidth=0.05;
    c.strokeRect(x+0.16,y+0.16,w-0.32,h*0.4);c.strokeRect(x+0.16,y+h*0.5,w-0.32,h*0.42);
    if(!opts.noKnob){c.fillStyle='#8a6d3b';c.beginPath();c.arc(x+w-0.28,y+h*0.52,0.07,0,TAU);c.fill();
      c.fillStyle='rgba(255,240,200,.5)';c.beginPath();c.arc(x+w-0.3,y+h*0.5,0.025,0,TAU);c.fill();}
    c.fillStyle='rgba(210,190,150,.5)';c.font='500 0.26px Oswald';
    c.fillText(String(num||((r()*90|0)+10)),x+w*0.5-0.2,y-0.22);
    if(r()>0.7){c.fillStyle='rgba(138,109,59,.18)';c.fillRect(x+0.1,y+h*0.6,w-0.2,0.3);}},
  liftCab(c,x,y,w,h,ang){c.save();c.translate(x+w/2,y);c.rotate(ang||0);c.translate(-w/2,0);
    this.plate(c,0,0,w,h,'steel',12,{rust:0.8});
    c.fillStyle='#151013';c.fillRect(w*0.16,h*0.14,w*0.68,h*0.42);
    c.strokeStyle='#8a6d3b';c.lineWidth=0.07;c.strokeRect(w*0.16,h*0.14,w*0.68,h*0.42);
    this.hazardTape(c,0,h-0.3,w,0.3);
    c.fillStyle='rgba(217,164,65,.5)';c.font='500 0.3px Oswald';c.fillText('ЛИФТ 07',w*0.22,h*0.72);c.restore();},
  clothesline(c,x1,y1,x2,y2,seed){const r=rng((seed||2)*53);
    this.cable(c,x1,y1,x2,y2,0.6,0.035,'#2b2119');
    for(let i=0;i<6;i++){const t=(i+0.5)/6,x=lerp(x1,x2,t),y=lerp(y1,y2,t)+Math.sin(t*PI)*0.6;
      const w=0.4+r()*0.4,h=0.6+r()*0.7;
      c.fillStyle=['#6b5a48','#5a4a44','#7a6a52','#4a3b36','#8a7d5f'][(r()*5)|0];
      c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x+w/2,y);c.lineTo(x+w/2-0.05,y+h);c.lineTo(x-w/2+0.05,y+h);c.fill();
      c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x-w/2,y,w,0.05);}},
  poster(c,x,y,w,h,seed){const r=rng((seed||1)*71);
    c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+0.04,y+0.05,w,h);
    c.fillStyle=['#8a6d3b','#4a2b2b','#6b5a3a'][(r()*3)|0];c.fillRect(x,y,w,h);
    c.fillStyle='rgba(230,215,180,.5)';c.fillRect(x+w*0.12,y+h*0.14,w*0.76,h*0.1);
    c.fillStyle='rgba(230,215,180,.3)';
    for(let i=0;i<4;i++)c.fillRect(x+w*0.12,y+h*(0.34+i*0.1),w*(0.4+r()*0.36),h*0.045);
    c.globalAlpha=0.5;c.fillStyle='#2a1c18';
    for(let i=0;i<6;i++){c.beginPath();c.ellipse(x+r()*w,y+r()*h,r()*w*0.3,r()*h*0.2,r()*3,0,TAU);c.fill();}
    c.globalAlpha=1;
    c.globalCompositeOperation='destination-out';c.beginPath();c.moveTo(x+w,y);
    for(let i=0;i<=5;i++)c.lineTo(x+w-r()*w*0.2,y+h*i/5);
    c.lineTo(x+w,y);c.fill();c.globalCompositeOperation='source-over';},
  furniture(c,x,y,kind,seed){const r=rng((seed||1)*97);
    c.save();c.translate(x,y);
    if(kind==='table'){c.rotate((r()-0.5)*0.5);c.fillStyle=PAT(c,'ply');c.fillRect(-1.1,-0.09,2.2,0.12);
      c.fillStyle='#4a3a2c';c.fillRect(-1.0,0,0.1,0.7);c.fillRect(0.9,0,0.1,0.7);}
    else if(kind==='chair'){c.rotate((r()-0.5)*0.9);c.fillStyle='#4a3a2c';
      c.fillRect(-0.28,-0.5,0.09,0.95);c.fillRect(-0.28,0.02,0.56,0.09);c.fillRect(0.2,0.02,0.08,0.45);}
    else if(kind==='tv'){c.fillStyle='#3a3230';rr(c,-0.6,-0.55,1.2,0.95,0.06);c.fill();
      c.fillStyle='#14181a';rr(c,-0.5,-0.45,1.0,0.68,0.04);c.fill();
      c.strokeStyle='rgba(255,255,255,.07)';c.lineWidth=0.03;c.beginPath();c.moveTo(-0.45,-0.4);c.lineTo(0.1,0.2);c.stroke();}
    else if(kind==='cage'){c.strokeStyle='#8a6d3b';c.lineWidth=0.04;
      c.beginPath();c.arc(0,-0.32,0.34,PI,0);c.stroke();
      for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*0.09,-0.32);c.lineTo(i*0.09,0.1);c.stroke();}
      c.beginPath();c.moveTo(-0.34,-0.32);c.lineTo(0.34,-0.32);c.stroke();}
    else if(kind==='toys'){c.fillStyle='#8a5a3a';c.beginPath();c.arc(0,-0.12,0.14,0,TAU);c.fill();
      c.fillStyle='#6b4a3a';c.fillRect(-0.2,-0.02,0.4,0.1);}
    else if(kind==='plant'){c.fillStyle='#5a4636';rr(c,-0.24,-0.34,0.48,0.4,0.05);c.fill();
      c.strokeStyle='#4a5a3a';c.lineWidth=0.05;
      for(let i=0;i<6;i++){const a=-PI/2+(r()-0.5)*1.8;c.beginPath();c.moveTo(0,-0.3);
        c.quadraticCurveTo(Math.cos(a)*0.2,-0.6,Math.cos(a)*0.42,-0.5-r()*0.4);c.stroke();}}
    c.restore();},
  column(c,x,y,h,r,opts){opts=opts||{};
    const g=c.createLinearGradient(x-r,0,x+r,0);
    g.addColorStop(0,'#8e8a7c');g.addColorStop(.22,'#e2ddd0');g.addColorStop(.5,'#f2eee2');g.addColorStop(.78,'#cfcbbe');g.addColorStop(1,'#7d7969');
    c.fillStyle=g;c.fillRect(x-r,y,r*2,h);
    c.save();c.beginPath();c.rect(x-r,y,r*2,h);c.clip();
    c.fillStyle=PAT(c,'marble');c.globalAlpha=0.3;c.fillRect(x-r,y,r*2,h);c.globalAlpha=1;
    for(let i=0;i<6;i++){const fx=x-r+(i+0.5)*(r*2/6);
      c.fillStyle='rgba(120,116,102,.18)';c.fillRect(fx-0.05,y,0.1,h);
      c.fillStyle='rgba(255,255,255,.22)';c.fillRect(fx+0.05,y,0.05,h);}
    c.restore();
    c.fillStyle='#e6e1d4';rr(c,x-r*1.45,y-r*0.5,r*2.9,r*0.6,0.06);c.fill();
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x-r*1.45,y-r*0.05,r*2.9,r*0.12);
    c.fillStyle='#ded9cc';rr(c,x-r*1.3,y+h-r*0.3,r*2.6,r*0.5,0.05);c.fill();
    if(opts.gold){c.fillStyle='rgba(217,180,92,.5)';c.fillRect(x-r*1.45,y-r*0.16,r*2.9,0.08);}},
  tree(c,x,y,h,seed,opts){opts=opts||{};const r=rng((seed||1)*131);
    c.save();c.translate(x,y);
    const br=(px,py,ang,len,w,d)=>{
      if(d<=0||len<0.16)return;
      const ex=px+Math.cos(ang)*len,ey=py+Math.sin(ang)*len;
      c.strokeStyle=d>2?'#4a3d2e':'#5c4c3a';c.lineWidth=w;c.lineCap='round';
      c.beginPath();c.moveTo(px,py);c.lineTo(ex,ey);c.stroke();
      const n=d>2?2:3;
      for(let i=0;i<n;i++)br(ex,ey,ang+(r()-0.5)*1.5+(i-(n-1)/2)*0.42,len*(0.62+r()*0.16),w*0.6,d-1);
      if(d<=2){const lr=0.5+r()*0.8,sick=opts.sick===undefined?r()>0.55:opts.sick;
        const g=c.createRadialGradient(ex,ey,0,ex,ey,lr);
        if(sick){g.addColorStop(0,'rgba(184,196,106,.85)');g.addColorStop(.55,'rgba(120,140,70,.6)');g.addColorStop(1,'rgba(90,110,60,0)');}
        else{g.addColorStop(0,'rgba(126,160,86,.9)');g.addColorStop(.55,'rgba(90,122,74,.6)');g.addColorStop(1,'rgba(60,86,52,0)');}
        c.fillStyle=g;c.beginPath();c.arc(ex,ey,lr,0,TAU);c.fill();}};
    br(0,0,-PI/2,h*0.34,h*0.055,5);c.restore();},
  fountain(c,x,y,r,opts){opts=opts||{};c.save();c.translate(x,y);
    c.fillStyle='#b9b4a4';c.beginPath();c.ellipse(0,0,r,r*0.3,0,0,TAU);c.fill();
    c.fillStyle='#e0dbcd';c.beginPath();c.ellipse(0,-r*0.12,r,r*0.3,0,0,TAU);c.fill();
    c.fillStyle=opts.dry?'#6d6a5e':'#6d94a0';c.beginPath();c.ellipse(0,-r*0.1,r*0.84,r*0.24,0,0,TAU);c.fill();
    if(!opts.dry){c.fillStyle='rgba(255,255,255,.2)';c.beginPath();c.ellipse(-r*0.2,-r*0.14,r*0.4,r*0.1,0,0,TAU);c.fill();}
    c.fillStyle='#d8d3c8';rr(c,-r*0.16,-r*1.3,r*0.32,r*1.2,0.05);c.fill();
    c.fillStyle='#e6e1d4';c.beginPath();c.ellipse(0,-r*1.3,r*0.42,r*0.14,0,0,TAU);c.fill();c.restore();},
  domeRibs(c,cx,cy,r,n,th){c.save();c.strokeStyle='rgba(220,216,200,.5)';c.lineWidth=th||0.14;
    for(let i=0;i<=n;i++){const a=PI+i/n*PI;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);c.stroke();}
    for(let k=1;k<5;k++){c.beginPath();c.arc(cx,cy,r*k/5,PI,TAU);c.stroke();}c.restore();},
  vine(c,pts,seed){const r=rng((seed||1)*151);
    c.strokeStyle='#4a6438';c.lineWidth=0.07;c.lineCap='round';
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.stroke();
    for(let i=0;i<pts.length*3;i++){const t=r(),idx=Math.min(pts.length-1,Math.floor(t*(pts.length-1)));
      const x=pts[idx][0]+(r()-0.5)*0.4,y=pts[idx][1]+(r()-0.5)*0.4;
      c.fillStyle=r()>0.4?'rgba(122,152,84,.85)':'rgba(184,196,106,.7)';
      c.save();c.translate(x,y);c.rotate(r()*TAU);c.beginPath();c.ellipse(0,0,0.19,0.09,0,0,TAU);c.fill();c.restore();}},
  arch(c,x,y,w,h){c.fillStyle='#08090b';
    c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w*0.5);c.arc(x+w/2,y+w*0.5,w/2,PI,0);c.lineTo(x+w,y+h);c.closePath();c.fill();
    const g=c.createLinearGradient(x,0,x+w,0);
    g.addColorStop(0,'#6d6f74');g.addColorStop(.5,'#8b8e94');g.addColorStop(1,'#4a4c51');
    c.fillStyle=g;
    c.beginPath();c.moveTo(x-0.5,y+h);c.lineTo(x-0.5,y+w*0.5);c.arc(x+w/2,y+w*0.5,w/2+0.5,PI,0);
    c.lineTo(x+w+0.5,y+h);c.lineTo(x+w,y+h);c.lineTo(x+w,y+w*0.5);
    c.arc(x+w/2,y+w*0.5,w/2,0,PI,true);c.lineTo(x,y+h);c.closePath();c.fill();
    c.save();c.beginPath();c.rect(x-0.6,y-1,w+1.2,h+1);c.clip();
    c.fillStyle=PAT(c,'lead');c.globalAlpha=0.35;c.fillRect(x-0.6,y-1,w+1.2,h+2);c.globalAlpha=1;c.restore();
    for(let i=0;i<7;i++){const a=PI+i/6*PI;this.bolt(c,x+w/2+Math.cos(a)*(w/2+0.25),y+w*0.5+Math.sin(a)*(w/2+0.25),0.07);}},
  lightStrip(c,x,y,w,h){c.fillStyle='#2a2c30';c.fillRect(x-0.06,y-0.06,w+0.12,h+0.12);
    c.fillStyle='#f4f6f8';c.fillRect(x,y,w,h);
    c.fillStyle='rgba(255,255,255,.9)';c.fillRect(x,y+h*0.2,w,h*0.4);},
  gear(c,x,y,r,teeth,ang,col){c.save();c.translate(x,y);c.rotate(ang||0);
    c.fillStyle=col||'#8a6d2a';c.beginPath();
    for(let i=0;i<teeth;i++){const a0=i/teeth*TAU,a1=(i+0.34)/teeth*TAU,a2=(i+0.5)/teeth*TAU,a3=(i+0.84)/teeth*TAU;
      c.lineTo(Math.cos(a0)*r,Math.sin(a0)*r);c.lineTo(Math.cos(a1)*r*1.16,Math.sin(a1)*r*1.16);
      c.lineTo(Math.cos(a2)*r*1.16,Math.sin(a2)*r*1.16);c.lineTo(Math.cos(a3)*r,Math.sin(a3)*r);}
    c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(0,0,r*0.72,0,TAU);c.fill();
    c.fillStyle=col||'#8a6d2a';
    for(let i=0;i<5;i++){const a=i/5*TAU;c.save();c.rotate(a);c.fillRect(-r*0.09,0,r*0.18,r*0.72);c.restore();}
    c.fillStyle='rgba(255,240,200,.16)';c.beginPath();c.arc(-r*0.2,-r*0.2,r*0.5,0,TAU);c.fill();
    c.fillStyle='#2c2a24';c.beginPath();c.arc(0,0,r*0.16,0,TAU);c.fill();c.restore();},
  sealWheel(c,x,y,r,ang){c.save();c.translate(x,y);c.rotate(ang||0);
    c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.arc(0.1,0.14,r*1.06,0,TAU);c.fill();
    const g=c.createRadialGradient(-r*0.3,-r*0.3,r*0.1,0,0,r);
    g.addColorStop(0,'#d8b45c');g.addColorStop(.45,'#a8842a');g.addColorStop(1,'#4e3c12');
    c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
    c.fillStyle='#5d6067';c.beginPath();c.arc(0,0,r*0.7,0,TAU);c.fill();
    for(let i=0;i<3;i++){const a=i/3*TAU-PI/2;c.save();c.rotate(a);
      c.fillStyle='#b08d3e';c.fillRect(-r*0.09,0,r*0.18,r*0.7);
      c.fillStyle='#e8e8e8';c.beginPath();c.arc(0,r*0.52,r*0.15,0,TAU);c.fill();
      c.strokeStyle='#2c2a24';c.lineWidth=r*0.03;c.beginPath();c.arc(0,r*0.52,r*0.15,0,TAU);c.stroke();c.restore();}
    c.fillStyle='#8a6d2a';c.beginPath();c.arc(0,0,r*0.2,0,TAU);c.fill();
    for(let i=0;i<14;i++){const a=i/14*TAU;this.bolt(c,Math.cos(a)*r*0.84,Math.sin(a)*r*0.84,r*0.045);}
    c.restore();},
  spikes(c,x,y,w,h){for(let px=x;px<x+w-0.05;px+=0.34){
    const g=c.createLinearGradient(px,y+h,px,y);
    g.addColorStop(0,'#3a3d42');g.addColorStop(.6,'#8e9298');g.addColorStop(1,'#d6dae0');
    c.fillStyle=g;c.beginPath();c.moveTo(px,y+h);c.lineTo(px+0.17,y);c.lineTo(px+0.34,y+h);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.moveTo(px+0.17,y);c.lineTo(px+0.34,y+h);c.lineTo(px+0.24,y+h);c.closePath();c.fill();}},
  leadCore(c,x,y,r){c.save();c.translate(x,y);
    const g=c.createRadialGradient(-r*0.35,-r*0.35,r*0.1,0,0,r);
    g.addColorStop(0,'#7a7d84');g.addColorStop(.5,'#4e5157');g.addColorStop(1,'#23262a');
    c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
    c.strokeStyle='#2c2f34';c.lineWidth=r*0.1;c.beginPath();c.arc(0,0,r*0.94,0,TAU);c.stroke();
    c.fillStyle='#b08d3e';c.beginPath();c.arc(0,-r*0.55,r*0.16,0,TAU);c.fill();
    c.strokeStyle='#3a3d42';c.lineWidth=r*0.14;c.beginPath();c.arc(0,-r*0.55,r*0.26,PI*1.1,PI*1.9);c.stroke();c.restore();},
  checkpointPost(c,x,y,h,lit){c.save();c.translate(x,y);
    c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(0.06,0.04,0.62,0.16,0,0,TAU);c.fill();
    c.fillStyle='#3a3129';rr(c,-0.52,-0.22,1.04,0.26,0.05);c.fill();
    const g=c.createLinearGradient(-0.3,0,0.3,0);
    g.addColorStop(0,'#6d5416');g.addColorStop(.3,'#e8c96a');g.addColorStop(.55,'#c9a227');g.addColorStop(1,'#5c460f');
    c.fillStyle=g;rr(c,-0.26,-h,0.52,h,0.08);c.fill();
    c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=0.03;
    for(let i=1;i<5;i++){c.beginPath();c.moveTo(-0.26,-h*i/5);c.lineTo(0.26,-h*i/5);c.stroke();}
    c.fillStyle='#1b1712';rr(c,-0.17,-h*0.78,0.34,0.5,0.06);c.fill();
    c.fillStyle=lit?'#ffcf7a':'#2f2a22';rr(c,-0.14,-h*0.75,0.28,0.44,0.05);c.fill();
    c.fillStyle='rgba(255,255,255,.28)';c.fillRect(-0.11,-h*0.74,0.06,0.4);
    this.bolt(c,-0.2,-h+0.14,0.05);this.bolt(c,0.2,-h+0.14,0.05);
    this.valve(c,0,-h*0.28,0.17,0.5,'#a8842a');c.restore();},
  loreCylinder(c,x,y){c.save();c.translate(x,y);
    c.fillStyle='rgba(0,0,0,.4)';rr(c,-0.24,-0.1,0.5,0.22,0.08);c.fill();
    const g=c.createLinearGradient(0,-0.16,0,0.16);
    g.addColorStop(0,'#e8c96a');g.addColorStop(.4,'#a8842a');g.addColorStop(1,'#5c460f');
    c.fillStyle=g;rr(c,-0.26,-0.15,0.52,0.3,0.12);c.fill();
    c.fillStyle='rgba(180,240,255,.9)';rr(c,-0.14,-0.09,0.28,0.18,0.07);c.fill();
    c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-0.2,-0.12,0.4,0.03);c.restore();},
  magnetRivets(c,x,y,w){c.fillStyle='#3a3129';c.fillRect(x,y,w,0.5);
    for(let bx=x+0.4;bx<x+w-0.2;bx+=0.75){
      c.fillStyle='#c9a227';c.beginPath();c.arc(bx,y+0.25,0.12,0,TAU);c.fill();
      c.fillStyle='rgba(255,245,205,.65)';c.beginPath();c.arc(bx-0.03,y+0.21,0.045,0,TAU);c.fill();
      c.strokeStyle='rgba(60,45,10,.6)';c.lineWidth=0.02;c.beginPath();c.arc(bx,y+0.25,0.12,0,TAU);c.stroke();}}
};
