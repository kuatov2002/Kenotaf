"use strict";
/* ============================== ФИНАЛ ==============================
   Четыре акта вместо «перехода на уровень»:
     I   ПЕЧАТЬ — колесо идёт, под сводом расходятся створки: свинец, сталь, бетон; в зал падает
         столп дневного света, курьер поднимает голову.
     II  ПОДЪЁМ — лифт Печати несёт курьера сквозь её толщу: свинец → сталь → бетон → земля с корнями.
         На стенах — меловые «38» и строки тех записей, что курьер сам нашёл. Свет сверху растёт.
     III ПОВЕРХНОСТЬ — люк в бетонном кенотафе, рассвет. Игрок идёт сам; камера с каждым шагом
         отъезжает: небо, солнце, руины старого мира под травой, птицы.
     IV  НЕБО — на гребне камера уходит вверх; строки финала — прямо над миром. Если правда сказана
         ярусам (концовка B), из люка позади выходят люди. Потом — название и титры. */
class Finale{
  constructor(g){this.g=g;this.act=null;this.t=0;this.stage=0;this.lit=0;this.frags=[];this.people=[];}
  get active(){return !!this.act;}
  /* ---------- I · ПЕЧАТЬ ---------- */
  startSeal(){const g=this.g;this.act='seal';this.t=0;this.stage=0;this.lit=0;
    g.input.enabled=false;g.input.clearAll();g.hud.bossOff();
    const gs=g.gs;this.frags=[];for(const id in gs.loreIds){const L=LORE[id];if(L)this.frags.push(L.title);}
    if(this.frags.length<3)this.frags.push('ЗАВЕТ ОСНОВАТЕЛЕЙ','СНАРУЖИ НИЧЕГО НЕТ','КУРЬЕР 38');
    g.audio.tone(55,6,'sawtooth',0.035,41,g.audio.verb);}
  boom(word){const g=this.g,W=g.world;g.audio.explosion();g.audio.tone(60,1.6,'sine',0.06,38,g.audio.verb);g.camera.addShake(0.9);
    g.hud.say(word,'ПЕЧАТЬ');
    for(let i=0;i<46;i++)g.particles.spawn({kind:'debris',x:25+(Math.random()-0.5)*(6+this.stage*3),y:0.8,vx:(Math.random()-0.5)*3,vy:Math.random()*3,
      g:20,life:2.2,size:0.08+Math.random()*0.18,col:['#5a5e66','#7a7e86','#8a857a'][this.stage%3],rot:Math.random()*6,vr:(Math.random()-0.5)*8});
    for(let i=0;i<10;i++)g.particles.spawn({kind:'smoke',x:25+(Math.random()-0.5)*8,y:1.5,vx:(Math.random()-0.5)*1.4,vy:1,life:3,size:1.4,grow:1,col:'#3a3a3e',drag:0.8,a:0.45});}
  /* ---------- общий шаг ---------- */
  update(dt){if(!this.act)return;this.t+=dt;const g=this.g,W=g.world,p=W.player,t=this.t;
    if(this.act==='seal'){
      g.camera.focus={x:25,y:lerp(16,13,clamp(t/3,0,1))};g.camera.tzoom=lerp(0.68,0.56,clamp(t/3,0,1));
      const m=(W.room.machines||[]).find(q=>q.kind==='sealwheel');if(m){m.turned=true;m.a=(m.a||0)+dt*(0.3+t*0.18);}
      if(p){p.lookV=-1;p.vx=0;}
      if(Math.random()<dt*20)g.particles.spawn({kind:'dust',x:25+(Math.random()-0.5)*10,y:17+(Math.random()-0.5)*8,vx:0,vy:-0.4,life:2,size:0.06,col:'#cfc6b0',g:0});
      const marks=[[1.8,'СВИНЕЦ'],[3.4,'СТАЛЬ'],[5.0,'БЕТОН']];
      if(this.stage<3&&t>=marks[this.stage][0])this.boom(marks[this.stage++][1]);
      if(this.stage===3&&t>=5.7){this.stage=4;g.audio.sky();g.hud.say('СВЕТ.','');}
      this.lit=clamp((t-5.7)/2.2,0,1);
      if(this.lit>0&&Math.random()<dt*60)g.particles.spawn({kind:'dust',x:25+(Math.random()-0.5)*7*this.lit,y:2+Math.random()*26,vx:(Math.random()-0.5)*0.3,vy:0.3,life:2.4,size:0.05,col:'#fff6d8',add:true,a:0.8});
      if(t>=8.6){this.act='ascent';this.t=0;g.state='finale';g.camera.focus=null;g.hud.show(false);
        g.audio.tone(98,14,'sine',0.03,196,g.audio.verb);g.audio.tone(147,14,'sine',0.02,294,g.audio.verb);}}
    else if(this.act==='ascent'){
      if(Math.random()<dt*3)g.audio.tone(392+Math.random()*392,1.6,'sine',0.012,0,g.audio.verb);
      if(t>=14){this.act='surface';this.t=0;g.state='play';
        W.load('z5_surface',2.6,29-CFG.player.h);g.camera.reset(6,24,1);g.flash(1,'#ffffff');g.audio.sky();
        g.input.enabled=false;}}
    else if(this.act==='surface'){
      if(t>1.6&&!g.input.enabled){g.input.enabled=true;g.input.clearAll();}
      /* с каждым шагом мир шире: камера отъезжает и поднимается */
      const k=clamp(((p?p.cx:0)-5)/38,0,1);g.camera.tzoom=lerp(1,0.6,EZ.io(k));
      g.camera.focus=p?{x:p.cx+lerp(1,6,k),y:p.cy-lerp(0.6,5,k)}:null;
      if(Math.random()<dt*0.5)g.audio.nz(1.6,600+Math.random()*400,0.6,0.02,'bandpass');}
    else if(this.act==='sky'){
      if(p){p.vx=0;}
      g.camera.focus={x:lerp(this.fx,this.fx+4,EZ.io(clamp(t/6,0,1))),y:lerp(this.fy,this.fy-9,EZ.io(clamp(t/6,0,1)))};
      g.camera.tzoom=lerp(0.6,0.52,clamp(t/6,0,1));
      /* концовка B: из люка выходят люди — по одному */
      if(g.gs.flags.broadcast_done&&t>2.5&&this.people.length<9&&t>2.5+this.people.length*1.1)
        this.people.push({x:3.4,t:0,h:1.45+Math.random()*0.35,sp:1.1+Math.random()*0.5,kid:Math.random()<0.25});
      for(const q of this.people){q.t+=dt;q.x+=q.sp*dt*Math.max(0,1-q.x/40);}}
  }
  /* ---------- рисунок в мировых координатах (зал Печати, поверхность) ---------- */
  drawWorld(c,t){const g=this.g,R=g.world.room;if(!R)return;
    if(this.act==='seal'){
      /* створки под сводом расходятся: свинец, сталь, бетон */
      const cols=['#4a4e56','#6a6e74','#7a766c'];
      for(let i=0;i<3;i++){const open=i<this.stage?EZ.out(clamp((this.t-[1.8,3.4,5.0][i])/1.2,0,1)):0,gap=open*(3.2+i*1.6),y=0.2-i*0.0;
        for(const s of [-1,1]){const x0=25+s*gap,w=12;c.fillStyle=cols[i];c.fillRect(s<0?x0-w:x0,y+i*0.35,w,0.5);
          c.fillStyle='rgba(0,0,0,.4)';c.fillRect(s<0?x0-0.2:x0,y+i*0.35,0.2,0.5);}}
      if(this.stage>=1){const gap=EZ.out(clamp((this.t-1.8)/1.2,0,1))*3.2;
        const gr=c.createLinearGradient(0,0,0,2);gr.addColorStop(0,'rgba(255,250,230,'+(0.2+0.8*this.lit)+')');gr.addColorStop(1,'rgba(255,250,230,0)');
        c.fillStyle=gr;c.fillRect(25-gap,0,gap*2,2);}
      if(this.lit>0){c.save();c.globalCompositeOperation='lighter';
        const w0=3.2*this.lit+0.4,w1=9*this.lit+1,g2=c.createLinearGradient(0,0,0,R.h);
        g2.addColorStop(0,'rgba(255,248,224,'+(0.65*this.lit)+')');g2.addColorStop(1,'rgba(255,240,200,'+(0.18*this.lit)+')');
        c.fillStyle=g2;c.beginPath();c.moveTo(25-w0,0);c.lineTo(25+w0,0);c.lineTo(25+w1,R.h);c.lineTo(25-w1,R.h);c.closePath();c.fill();c.restore();
        g.renderer.glowAdd(25,6,10*this.lit+2,'#fff6d8',0.7*this.lit);}}
    if(R.id==='z5_surface'){
      /* люди из люка (концовка B) */
      for(const q of this.people){const x=q.x,y=29,h=q.kid?q.h*0.65:q.h,ph=q.t*6;c.fillStyle='rgba(40,40,34,.92)';
        c.beginPath();c.arc(x,y-h,h*0.13,0,TAU);c.fill();rr(c,x-h*0.14,y-h*0.88,h*0.28,h*0.5,h*0.06);c.fill();
        c.strokeStyle='rgba(40,40,34,.92)';c.lineWidth=h*0.09;c.beginPath();c.moveTo(x,y-h*0.4);c.lineTo(x+Math.sin(ph)*h*0.16,y);c.moveTo(x,y-h*0.4);c.lineTo(x-Math.sin(ph)*h*0.16,y);c.stroke();}}
  }
  /* ---------- II · ПОДЪЁМ: целиком свой кадр ---------- */
  drawScreen(c,dt){const g=this.g,W=g.vw,H=g.vh,t=this.t,s=H/18,p=g.world.player;
    c.setTransform(1,0,0,1,0,0);
    const lift=t*t*0.9+t*3.5;   /* метров пройдено: разгон */
    const bandH=40,bands=[['СВИНЕЦ','#3a3e46','#5a5e66'],['СТАЛЬ','#2e3236','#6a6e74'],['БЕТОН','#4a4740','#7a766c'],['ЗЕМЛЯ','#2a1e14','#4a3626'],['КОРНИ','#1e1a10','#3a3018']];
    const bi=Math.min(bands.length-1,Math.floor(lift/bandH)),B=bands[bi],light=clamp((t-9)/5,0,1);
    c.fillStyle='#08080a';c.fillRect(0,0,W,H);
    /* стены шахты: слева и справа, уходят вниз; у слоя — своя фактура */
    for(const side of [0,1]){const x0=side?W*0.68:0,w=W*0.32,inner=side?x0:x0+w;const gg=c.createLinearGradient(x0,0,x0+w,0);
      gg.addColorStop(side?0:1,B[2]);gg.addColorStop(side?1:0,B[1]);c.fillStyle=gg;c.fillRect(x0,0,w,H);
      const off=(lift*s)%(2.4*s);c.fillStyle='rgba(0,0,0,.35)';for(let y=-2.4*s+off;y<H;y+=2.4*s)c.fillRect(x0,y,w,0.12*s);
      if(bi===0){c.fillStyle='rgba(200,206,214,.45)';for(let y=-1.2*s+off;y<H;y+=2.4*s)for(let k=0;k<6;k++){c.beginPath();c.arc(x0+(k+0.5)*w/6,y,0.06*s,0,TAU);c.fill();}}
      if(bi===1){c.fillStyle='#24282c';for(let y=-4.8*s+(lift*s)%(4.8*s);y<H;y+=4.8*s){c.fillRect(x0,y,w,0.4*s);c.fillStyle='#4a4e54';c.fillRect(x0,y,w,0.07*s);c.fillStyle='#24282c';}}
      if(bi===2){c.strokeStyle='rgba(120,70,40,.55)';c.lineWidth=0.06*s;for(let k=0;k<4;k++){const yy=((k*5.1*s+lift*s)%(H+3*s))-1.5*s;c.beginPath();c.moveTo(x0,yy);c.lineTo(x0+w,yy+0.3*s);c.stroke();}
        c.strokeStyle='rgba(20,20,18,.45)';c.lineWidth=0.03*s;for(let k=0;k<6;k++){const yy=((k*3.7*s+lift*s)%(H+2*s))-s,xx=x0+((k*0.37)%1)*w;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+0.6*s,yy+0.4*s);c.lineTo(xx+0.4*s,yy+1*s);c.stroke();}}
      if(bi>=3){c.fillStyle='rgba(90,76,60,.8)';for(let k=0;k<14;k++){const yy=((k*2.9*s+lift*s)%(H+2*s))-s,xx=x0+((k*0.61)%1)*w;c.beginPath();c.ellipse(xx,yy,0.25*s,0.16*s,k,0,TAU);c.fill();}
        c.strokeStyle='rgba(140,110,70,.6)';c.lineWidth=0.08*s;for(let k=0;k<6;k++){const yy=((k*7.3*s+lift*s)%(H+4*s))-2*s;c.beginPath();c.moveTo(side?x0+w:x0,yy);
        c.quadraticCurveTo(side?x0+w*0.4:x0+w*0.6,yy+1.4*s,inner,yy+3*s);c.stroke();}}
      /* рабочие лампы проплывают вниз */
      const ly=((lift*s*1.0)%(9*s))-1*s;const lx=side?x0+0.5*s:x0+w-0.5*s;c.fillStyle='#2a2418';c.fillRect(lx-0.15*s,ly-0.1*s,0.3*s,0.2*s);
      const lg2=c.createRadialGradient(lx,ly,0,lx,ly,1.6*s);lg2.addColorStop(0,'rgba(255,200,120,.55)');lg2.addColorStop(1,'rgba(255,200,120,0)');c.fillStyle=lg2;c.beginPath();c.arc(lx,ly,1.6*s,0,TAU);c.fill();}
    c.fillStyle='rgba(232,228,214,.55)';c.font='600 '+Math.round(0.3*s)+'px Oswald';c.textAlign='left';
    c.fillText(B[0]+' · '+Math.round(lift)+' М',W*0.36,H*0.06+0.3*s);
    /* мел на стенах: «38» и строки найденных записей */
    c.font='600 '+Math.round(0.42*s)+'px Oswald';c.textAlign='center';
    for(let i=0;i<10;i++){const yy=((i*6.5*s+lift*s*1.0)%(H+6*s))-3*s,side=i%2,x=side?W*0.84:W*0.16,txt=i%3===0?'38':this.frags[i%this.frags.length];
      c.save();c.translate(x,yy);c.rotate(side?0.03:-0.03);c.fillStyle='rgba(232,228,214,'+(i%3===0?0.5:0.32)+')';c.fillText(txt,0,0);c.restore();}
    /* свет сверху */
    const lg=c.createLinearGradient(0,0,0,H);lg.addColorStop(0,'rgba(255,248,224,'+(0.25+0.75*light)+')');lg.addColorStop(0.6,'rgba(255,240,200,'+(0.1*light)+')');lg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=lg;c.fillRect(W*0.32,0,W*0.36,H);
    /* лифт Печати и курьер на нём — тот же курьер, с шарфом */
    const py=H*0.66;c.fillStyle='#2a2a2c';c.fillRect(W*0.36,py,W*0.28,0.4*s);c.fillStyle='#8a6d2a';c.fillRect(W*0.36,py,W*0.28,0.07*s);
    c.strokeStyle='#1a1a1c';c.lineWidth=0.08*s;for(const x of [W*0.38,W*0.62]){c.beginPath();c.moveTo(x,py);c.lineTo(x,0);c.stroke();}
    if(p){p.lookV=-1;p.vx=0;p.vy=0;p.onGround=true;p.face=1;p.update&&0;
      c.setTransform(s,0,0,s,W/2-p.cx*s,py-p.bottom*s);try{p.updateScarf&&p.updateScarf(dt||1/60);p.draw(c,t);}catch(e){}c.setTransform(1,0,0,1,0,0);}
    /* к концу — белое */
    if(t>12){c.fillStyle='rgba(255,252,240,'+clamp((t-12)/2,0,1)+')';c.fillRect(0,0,W,H);}
  }
  /* ---------- IV · НЕБО ---------- */
  startSky(){const g=this.g,p=g.world.player;this.act='sky';this.t=0;this.fx=p?p.cx+4:46;this.fy=p?p.cy-4:22;this.people=[];
    g.input.enabled=false;g.input.clearAll();}
  end(){this.act=null;this.t=0;this.people=[];const g=this.g;g.camera.focus=null;}
}
