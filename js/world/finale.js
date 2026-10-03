"use strict";
/* ============================== ФИНАЛ ==============================
   Длинная сцена без управления — темп падает, камера дышит, говорит мир. Ни одной склейки: акты
   переходят друг в друга через свет (столп в зале → белое → шахта; верх шахты → белое → рассвет).
     I    ПЕЧАТЬ   — колесо, которое не поворачивали двести четырнадцать лет; расходятся свинец, сталь,
                    бетон; в зал медленно опускается дневной свет — и не жжёт.
     II   ВЗЛЁТ    — площадка колеса — лифт Печати: курьер поднимается в столп света, зал уходит вниз.
     III  ПОДЪЁМ   — шахта сквозь толщу: у каждого слоя — своя строка; мел «38»; свет сверху растёт.
     IV   УТРО     — люк кенотафа. Слепящее белое гаснет в рассвет. Курьер сам (игрок не ведёт) смотрит
                    вверх, идёт по траве, садится, трогает землю — и отпускает лист из капсулы: тот
                    улетает туда, где вырос. Камера отходит: небо, руины старого мира под травой, птицы.
     V    НЕБО     — на гребне камера уходит вверх; строки финала над миром, название.
   Музыка — стиль «финал»: тема впервые получает ответ и мажор, разрастается такт за тактом.
   Пропустить: держать E. */
const FIN_ASC=36;   /* длительность подъёма по шахте, с */
class Finale{
  constructor(g){this.g=g;this.act=null;this.t=0;this.stage=0;this.lit=0;this.frags=[];this.people=[];this.said={};this.skipT=0;
    this.si={mv:0,dnk:false,upk:false,get move(){return this.mv;},get dn(){return this.dnk;},get up(){return this.upk;},
      healHeld:false,jumpHeld:false,attackHeld:false,consume(){return false;},usingPad(){return false;}};}
  get active(){return !!this.act;}
  /* ---------- голос за кадром ---------- */
  narEl(){if(this._nar)return this._nar;let el=document.getElementById('nar');
    if(!el){el=document.createElement('div');el.id='nar';el.innerHTML='<div class="nl"></div><div class="nk"></div>';document.getElementById('app').appendChild(el);}
    return this._nar=el;}
  say(text,key){if(key){if(this.said[key])return;this.said[key]=1;}const el=this.narEl(),l=el.querySelector('.nl');
    l.classList.remove('on');clearTimeout(this._nt);
    this._nt=setTimeout(()=>{l.textContent=text;l.classList.add('on');},text?420:0);
    this.g.audio.tone(392,1.2,'sine',0.008,0,this.g.audio.verb);}
  hush(){const el=this.narEl();el.querySelector('.nl').classList.remove('on');}
  at(t0,key,text){if(this.t>=t0)this.say(text,key);}
  cine(on){document.getElementById('bars').classList.toggle('on',on);this.g.hud.show(!on);this.narEl().classList.toggle('on',on);}
  /* ---------- I · ПЕЧАТЬ ---------- */
  startSeal(){const g=this.g;this.act='seal';this.t=0;this.stage=0;this.lit=0;this.said={};this.white=0;this.skipT=0;
    g.input.enabled=false;g.input.clearAll();g.hud.bossOff();g.scriptInput=this.si;this.si.mv=0;this.cine(true);
    const gs=g.gs;this.frags=[];for(const id in gs.loreIds){const L=LORE[id];if(L)this.frags.push(L.title);}
    if(this.frags.length<3)this.frags.push('ЗАВЕТ ОСНОВАТЕЛЕЙ','СНАРУЖИ НИЧЕГО НЕТ','КУРЬЕР 38');
    g.audio.tone(55,6,'sawtooth',0.03,41,g.audio.verb);}
  boom(word){const g=this.g;g.audio.explosion();g.audio.tone(60,1.6,'sine',0.06,38,g.audio.verb);g.camera.addShake(0.7);
    for(let i=0;i<46;i++)g.particles.spawn({kind:'debris',x:25+(Math.random()-0.5)*(6+this.stage*3),y:0.8,vx:(Math.random()-0.5)*3,vy:Math.random()*3,
      g:20,life:2.2,size:0.08+Math.random()*0.18,col:['#5a5e66','#7a7e86','#8a857a'][this.stage%3],rot:Math.random()*6,vr:(Math.random()-0.5)*8});
    for(let i=0;i<10;i++)g.particles.spawn({kind:'smoke',x:25+(Math.random()-0.5)*8,y:1.5,vx:(Math.random()-0.5)*1.4,vy:1,life:3,size:1.4,grow:1,col:'#3a3a3e',drag:0.8,a:0.45});
    const el=this.narEl().querySelector('.nk');el.textContent=word;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');}
  /* ---------- пропуск: держать E ---------- */
  skipCheck(dt){const g=this.g,held=g.input.k.KeyE||g.input.k.PadY;
    this.skipT=held?this.skipT+dt:Math.max(0,this.skipT-dt*2);
    const el=this.narEl().querySelector('.nk');
    if(this.skipT>0.15&&this.act!=='sky'){el.textContent='ДЕРЖИ E — ПРОПУСТИТЬ · '+Math.round(clamp(this.skipT/1.6,0,1)*100)+'%';el.classList.add('on','skip');}
    else el.classList.remove('skip');
    if(this.skipT>=1.6&&this.act!=='sky'){this.skipT=0;this.skip();}}
  skip(){const g=this.g;this.hush();this.white=0;
    if(g.world.room.id!=='z5_surface'){g.state='play';g.world.load('z5_surface',44,29-CFG.player.h);}
    const p=g.world.player;if(p){p.x=46.5;p.y=29-p.h;p.vx=0;}
    g.camera.reset(48,22,0.6);g.gs.flag('ending');g.ending();}
  /* ---------- общий шаг ---------- */
  update(dt){if(!this.act)return;this.t+=dt;const g=this.g,W=g.world,p=W.player,t=this.t,si=this.si;
    this.skipCheck(dt);if(!this.act)return;
    const breathe=Math.sin(g.world.time*0.55)*0.018;
    if(this.act==='seal'){
      /* колесо медленно набирает ход; камера опускается к курьеру и поднимает взгляд вместе с ним */
      const k=clamp(t/6,0,1);g.camera.focus={x:25,y:lerp(16.5,12,EZ.io(clamp((t-11)/7,0,1)))};g.camera.tzoom=lerp(0.74,0.6,EZ.io(k))+breathe;
      const m=(W.room.machines||[]).find(q=>q.kind==='sealwheel');if(m){m.turned=true;m.a=(m.a||0)+dt*(0.06+t*0.03);}
      if(p){si.upk=t>12;p.vx=0;}
      if(Math.random()<dt*14)g.particles.spawn({kind:'dust',x:25+(Math.random()-0.5)*10,y:17+(Math.random()-0.5)*8,vx:0,vy:-0.3,life:2.4,size:0.06,col:'#cfc6b0',g:0});
      this.at(1.0,'s1','ЭТО КОЛЕСО НЕ ПОВОРАЧИВАЛИ ДВЕСТИ ЧЕТЫРНАДЦАТЬ ЛЕТ.');
      const marks=[[4.5,'СВИНЕЦ'],[7.0,'СТАЛЬ'],[9.5,'БЕТОН']];
      if(this.stage<3&&t>=marks[this.stage][0])this.boom(marks[this.stage++][1]);
      this.at(11.0,'s2','ПЕЧАТЬ ЗАКРЫВАЛАСЬ НЕ СНАРУЖИ. ИЗНУТРИ.');
      if(this.stage===3&&t>=12.5){this.stage=4;g.audio.sky();}
      this.lit=clamp((t-12.5)/5.5,0,1);
      this.at(15.2,'s3','СВЕТ.');
      this.at(18.0,'s4','ОН НЕ ЖЁГ.');
      if(this.lit>0&&Math.random()<dt*50)g.particles.spawn({kind:'dust',x:25+(Math.random()-0.5)*7*this.lit,y:2+Math.random()*26,vx:(Math.random()-0.5)*0.3,vy:0.3,life:2.6,size:0.05,col:'#fff6d8',add:true,a:0.8});
      if(t>=21){this.act='rise';this.t=0;this.riseY=p?p.y:20;this.hush();}}
    else if(this.act==='rise'){
      /* площадка колеса — лифт Печати: курьер поднимается в столп, зал уходит вниз */
      const k=EZ.io(clamp(t/10,0,1));
      if(p){p.x=25-p.w/2;p.y=lerp(this.riseY,-6,k);p.vx=0;p.vy=0;si.upk=true;}
      g.camera.focus={x:25,y:(p?p.cy:10)-1.5};g.camera.tzoom=lerp(0.6,0.9,k)+breathe;
      this.lit=1;this.white=clamp((t-7.5)/2.5,0,1);
      this.at(2.0,'r1','ВСЕ ЛИФТЫ АРКОЛОГИИ ХОДИЛИ ВНИЗ.');
      this.at(5.0,'r2','ЭТОТ — ВВЕРХ.');
      if(t>=10){this.act='ascent';this.t=0;g.state='finale';g.camera.focus=null;this.hush();
        g.audio.tone(98,14,'sine',0.02,196,g.audio.verb);}}
    else if(this.act==='ascent'){
      if(Math.random()<dt*2)g.audio.tone(392+Math.random()*392,1.6,'sine',0.008,0,g.audio.verb);
      const bi=this.band(t);
      const LINES=[['a0','СВИНЕЦ ЛИЛИ ОТ ИЗЛУЧЕНИЯ. ИЗЛУЧЕНИЯ НЕ БЫЛО.'],['a1','СТАЛЬ — ЧТОБЫ НИКТО НЕ ВОШЁЛ. И ЧТОБЫ НИКТО НЕ ВЫШЕЛ.'],
        ['a2','БЕТОН — ДЛЯ ВОПРОСОВ. ВОПРОСЫ ЗАЛИВАЛИ ГЛУБЖЕ ВСЕГО.'],['a3','ЗЕМЛЯ НИЧЕГО НЕ ПРЯТАЛА. ОНА ПРОСТО ЖДАЛА.'],
        ['a4','КОРНИ ПРОРОСЛИ СКВОЗЬ ПЕЧАТЬ РАНЬШЕ НАС.']];
      if(t>2.5)this.say(LINES[bi][1],LINES[bi][0]);
      if(g.gs.flags.c38_met&&bi===2)this.at(FIN_ASC*0.5,'a38','ТРИДЦАТЬ ВОСЬМОЙ ДОШЁЛ ДО ЭТОГО МЕСТА. ДАЛЬШЕ — ЗА ДВОИХ.');
      this.at(FIN_ASC-7,'a5','«СНАРУЖИ НИЧЕГО НЕТ», — ГОВОРИЛИ ПЛАСТИНКИ.');
      if(t>=FIN_ASC){this.act='surface';this.t=0;g.state='play';this.hush();this.white=1;
        W.load('z5_surface',3.4,29-CFG.player.h);g.camera.reset(5,25,0.95);g.audio.sky();g.scriptInput=this.si;si.mv=0;}}
    else if(this.act==='surface')this.surface(dt,p,breathe);
    else if(this.act==='sky'){
      if(p){p.vx=0;}
      g.camera.focus={x:lerp(this.fx,this.fx+4,EZ.io(clamp(t/9,0,1))),y:lerp(this.fy,this.fy-10,EZ.io(clamp(t/9,0,1)))};
      g.camera.tzoom=lerp(0.6,0.5,clamp(t/9,0,1))+breathe;
      /* концовка B: из люка выходят люди — по одному */
      if(g.gs.flags.broadcast_done&&t>2.5&&this.people.length<9&&t>2.5+this.people.length*1.1)
        this.people.push({x:3.4,t:0,h:1.45+Math.random()*0.35,sp:1.1+Math.random()*0.5,kid:Math.random()<0.25});
      for(const q of this.people){q.t+=dt;q.x+=q.sp*dt*Math.max(0,1-q.x/40);}}
    if(this.leaf)this.leafStep(dt);
  }
  /* слои шахты: свинец, сталь, бетон, земля, корни — по времени подъёма */
  band(t){return Math.min(4,Math.floor(clamp(t/FIN_ASC,0,0.999)*5));}
  /* ---------- IV · УТРО: сцена ведёт курьера сама ---------- */
  surface(dt,p,breathe){const g=this.g,t=this.t,si=this.si;if(!p)return;
    this.white=Math.max(0,1-t/4);
    const x=p.cx;si.dnk=false;si.upk=false;p.walkCap=2.1;
    /* камера: сначала близко, потом мир шире с каждым шагом */
    const k=clamp((x-4)/40,0,1);g.camera.tzoom=lerp(1.05,0.62,EZ.io(k))+breathe;
    const lf=this.leaf&&this.leaf.t<4.5?this.leaf:null;
    g.camera.focus=lf?{x:lerp(x+1,lf.x,0.6),y:lerp(p.cy-1,lf.y,0.6)}:{x:x+lerp(1,6,k),y:p.cy-lerp(0.8,5.5,k)};
    this.at(4.0,'u1','«СНАРУЖИ НИЧЕГО НЕТ» — ТАК ГОВОРИЛИ ДВЕСТИ ЛЕТ.');
    if(t<8){si.mv=0;si.upk=t>2.5;return;}
    this.at(9.0,'u2','ТРАВА.');
    this.at(11.0,'u3','ВЕТЕР.');
    this.at(13.0,'u4','ОБЛАКА ИДУТ, КУДА ХОТЯТ.');
    /* у первого куста — присесть, тронуть землю, отпустить лист */
    if(!this.knelt){if(x<15.5){si.mv=1;return;}
      if(!this.kneelT)this.kneelT=t;si.mv=0;si.dnk=t-this.kneelT<3.2;
      if(t-this.kneelT>0.6)this.say('ЗЕМЛЯ ТЁПЛАЯ.','u5');
      if(t-this.kneelT>4.0&&!this.leaf){this.leaf={x:p.cx+0.3,y:p.y+0.4,vx:0.6,vy:-0.4,t:0,a:0};g.audio.tone(660,2.4,'sine',0.01,880,g.audio.verb);}
      if(this.leaf&&this.leaf.t>0.8)this.say('ЛИСТ ИЗ КАПСУЛЫ ВОЗВРАЩАЕТСЯ ТУДА, ГДЕ ВЫРОС.','u6');
      if(this.leaf&&this.leaf.t>5.5){this.knelt=true;}
      return;}
    si.mv=1;
    if(x>24)this.say(g.gs.flags.broadcast_done?'ВНИЗУ УЖЕ ЧИТАЮТ ВСЛУХ.':'ВНИЗУ ВСЁ ЕЩЁ ЖДУТ ПИСЕМ.','u7');
    if(x>33)this.say('ЕМУ ВЕЛЕЛИ ВОЗИТЬ ПИСЬМА И НЕ ЧИТАТЬ ИХ.','u8');
    if(x>40)this.say('ОН ПРОЧИТАЛ.','u9');
  }
  leafStep(dt){const L=this.leaf;L.t+=dt;L.a+=dt*(2+Math.sin(L.t*1.3)*1.5);
    L.vx=damp(L.vx,2.2+Math.sin(L.t*0.9)*1.2,0.8,dt);L.vy=damp(L.vy,-1.6+Math.sin(L.t*1.7)*0.9,0.8,dt);L.x+=L.vx*dt;L.y+=L.vy*dt;
    if(L.t>14)this.leaf=null;}
  /* ---------- рисунок в мировых координатах ---------- */
  drawWorld(c,t){const g=this.g,R=g.world.room;if(!R)return;
    if(this.act==='seal'||this.act==='rise'){
      /* створки под сводом расходятся: свинец, сталь, бетон */
      const cols=['#4a4e56','#6a6e74','#7a766c'],T=this.act==='rise'?99:this.t;
      for(let i=0;i<3;i++){const open=i<this.stage||this.act==='rise'?EZ.out(clamp((T-[4.5,7,9.5][i])/1.6,0,1)):0,gap=open*(3.2+i*1.6);
        for(const s of [-1,1]){const x0=25+s*gap,w=12;c.fillStyle=cols[i];c.fillRect(s<0?x0-w:x0,0.2+i*0.35,w,0.5);
          c.fillStyle='rgba(0,0,0,.4)';c.fillRect(s<0?x0-0.2:x0,0.2+i*0.35,0.2,0.5);}}
      if(this.lit>0){c.save();c.globalCompositeOperation='lighter';
        const w0=3.2*this.lit+0.4,w1=9*this.lit+1,g2=c.createLinearGradient(0,-8,0,R.h);
        g2.addColorStop(0,'rgba(255,248,224,'+(0.7*this.lit)+')');g2.addColorStop(1,'rgba(255,240,200,'+(0.16*this.lit)+')');
        c.fillStyle=g2;c.beginPath();c.moveTo(25-w0,-8);c.lineTo(25+w0,-8);c.lineTo(25+w1,R.h);c.lineTo(25-w1,R.h);c.closePath();c.fill();c.restore();
        g.renderer.glowAdd(25,6,10*this.lit+2,'#fff6d8',0.7*this.lit);}
      /* лифт Печати: латунный настил под курьером */
      if(this.act==='rise'){const p=g.world.player;if(p){c.fillStyle='#3a3020';c.fillRect(22,p.bottom,6,0.35);c.fillStyle='#c9a227';c.fillRect(22,p.bottom,6,0.08);
        c.strokeStyle='#1a1a1c';c.lineWidth=0.08;for(const x of [22.3,27.7]){c.beginPath();c.moveTo(x,p.bottom);c.lineTo(x,-10);c.stroke();}}}}
    if(R.id==='z5_surface'&&(this.act==='surface'||this.act==='sky')){
      /* рассвет: солнце медленно встаёт над холмами, свет тёплый и мягкий */
      const k=this.act==='sky'?1:clamp(this.t/40,0,1),sx=54,sy=lerp(24,10,EZ.out(k));
      c.save();c.globalCompositeOperation='lighter';
      const sg=c.createRadialGradient(sx,sy,0,sx,sy,18);sg.addColorStop(0,'rgba(255,236,190,.55)');sg.addColorStop(0.12,'rgba(255,214,150,.22)');sg.addColorStop(1,'rgba(255,190,120,0)');
      c.fillStyle=sg;c.fillRect(sx-18,sy-18,36,36);
      c.fillStyle='rgba(255,248,226,.9)';c.beginPath();c.arc(sx,sy,1.2,0,TAU);c.fill();
      for(let i=0;i<7;i++){const a=PI+0.25+i*0.18+Math.sin(t*0.2+i)*0.03,L=26;c.fillStyle='rgba(255,230,180,.045)';c.beginPath();c.moveTo(sx,sy);
        c.lineTo(sx+Math.cos(a-0.035)*L,sy+Math.sin(a-0.035)*L*-0.6+L*0.5);c.lineTo(sx+Math.cos(a+0.035)*L,sy+Math.sin(a+0.035)*L*-0.6+L*0.5);c.closePath();c.fill();}
      c.restore();g.renderer.glowAdd(sx,sy,9,'#ffe2a8',0.5);}
    if(R.id==='z5_surface'){
      /* люди из люка (концовка B) */
      for(const q of this.people){const x=q.x,y=29,h=q.kid?q.h*0.65:q.h,ph=q.t*6;c.fillStyle='rgba(40,40,34,.92)';
        c.beginPath();c.arc(x,y-h,h*0.13,0,TAU);c.fill();rr(c,x-h*0.14,y-h*0.88,h*0.28,h*0.5,h*0.06);c.fill();
        c.strokeStyle='rgba(40,40,34,.92)';c.lineWidth=h*0.09;c.beginPath();c.moveTo(x,y-h*0.4);c.lineTo(x+Math.sin(ph)*h*0.16,y);c.moveTo(x,y-h*0.4);c.lineTo(x-Math.sin(ph)*h*0.16,y);c.stroke();}}
    /* лист из капсулы — живой, зелёный, уходит по ветру */
    if(this.leaf){const L=this.leaf,a=clamp(L.t*2,0,1)*clamp((14-L.t)/3,0,1);c.save();c.translate(L.x,L.y);c.rotate(Math.sin(L.a)*0.9);c.scale(1,0.55+0.45*Math.cos(L.a*0.7));
      c.globalAlpha=a;c.fillStyle='#5f9a3a';c.beginPath();c.moveTo(-0.28,0);c.quadraticCurveTo(0,-0.2,0.28,0);c.quadraticCurveTo(0,0.2,-0.28,0);c.fill();
      c.strokeStyle='#3a6a22';c.lineWidth=0.025;c.beginPath();c.moveTo(-0.3,0);c.lineTo(0.26,0);c.stroke();c.restore();
      g.renderer.glowAdd(L.x,L.y,0.8,'#d8ffb0',0.25*a);}
  }
  /* поверх кадра (экранные координаты): белое между актами */
  drawOverlay(c){const g=this.g;c.setTransform(1,0,0,1,0,0);
    /* утро: тёплый свет с востока поверх холодной дымки */
    if(this.act==='surface'||this.act==='sky'){const k=this.act==='sky'?1:clamp(this.t/30,0,1),gr=c.createLinearGradient(g.vw,g.vh*0.3,0,g.vh);
      gr.addColorStop(0,'rgba(255,196,130,'+(0.16*k)+')');gr.addColorStop(1,'rgba(255,196,130,0)');c.fillStyle=gr;c.fillRect(0,0,g.vw,g.vh);}
    if(!this.white)return;
    c.fillStyle='rgba(255,252,240,'+clamp(this.white,0,1)+')';c.fillRect(0,0,g.vw,g.vh);}
  /* ---------- III · ПОДЪЁМ: целиком свой кадр ---------- */
  drawScreen(c,dt){const g=this.g,W=g.vw,H=g.vh,t=this.t,s=H/18,p=g.world.player;
    c.setTransform(1,0,0,1,0,0);
    const sp=3.2+2.6*EZ.io(clamp(t/FIN_ASC,0,1)),lift=t*3.2+1.3*t*t/FIN_ASC*2;   /* медленно, к верху — быстрее */
    const bands=[['СВИНЕЦ','#3a3e46','#5a5e66'],['СТАЛЬ','#2e3236','#6a6e74'],['БЕТОН','#4a4740','#7a766c'],['ЗЕМЛЯ','#2a1e14','#4a3626'],['КОРНИ','#1e1a10','#3a3018']];
    const bi=this.band(t),B=bands[bi],light=clamp((t-FIN_ASC*0.55)/(FIN_ASC*0.45),0,1);
    c.fillStyle='#08080a';c.fillRect(0,0,W,H);
    /* середина шахты не чёрная: сверху всегда сочится тёплое — с каждым метром сильнее */
    {const cg=c.createLinearGradient(0,0,0,H);cg.addColorStop(0,'rgba(120,104,80,'+(0.35+0.4*light)+')');cg.addColorStop(1,'rgba(24,20,16,.6)');c.fillStyle=cg;c.fillRect(W*0.32,0,W*0.36,H);}
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
      const ly=((lift*s*1.0)%(9*s))-1*s;const lx=side?x0+0.5*s:x0+w-0.5*s;c.fillStyle='#2a2418';c.fillRect(lx-0.15*s,ly-0.1*s,0.3*s,0.2*s);
      const lg2=c.createRadialGradient(lx,ly,0,lx,ly,1.6*s);lg2.addColorStop(0,'rgba(255,200,120,.55)');lg2.addColorStop(1,'rgba(255,200,120,0)');c.fillStyle=lg2;c.beginPath();c.arc(lx,ly,1.6*s,0,TAU);c.fill();}
    c.fillStyle='rgba(232,228,214,.4)';c.font='600 '+Math.round(0.3*s)+'px Oswald';c.textAlign='left';
    c.fillText(B[0]+' · '+Math.round(lift)+' М',W*0.36,H*0.06+0.3*s);
    /* мел на стенах: «38» и строки найденных записей */
    c.font='600 '+Math.round(0.42*s)+'px Oswald';c.textAlign='center';
    for(let i=0;i<10;i++){const yy=((i*6.5*s+lift*s*1.0)%(H+6*s))-3*s,side=i%2,x=side?W*0.84:W*0.16,txt=i%3===0?'38':this.frags[i%this.frags.length];
      c.save();c.translate(x,yy);c.rotate(side?0.03:-0.03);c.fillStyle='rgba(232,228,214,'+(i%3===0?0.5:0.3)+')';c.fillText(txt,0,0);c.restore();}
    /* свет сверху: темнота медленно сдаётся */
    const lg=c.createLinearGradient(0,0,0,H);lg.addColorStop(0,'rgba(255,248,224,'+(0.12+0.88*light)+')');lg.addColorStop(0.6,'rgba(255,240,200,'+(0.12*light)+')');lg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=lg;c.fillRect(W*0.32,0,W*0.36,H);
    const py=H*0.66;c.fillStyle='#2a2a2c';c.fillRect(W*0.36,py,W*0.28,0.4*s);c.fillStyle='#8a6d2a';c.fillRect(W*0.36,py,W*0.28,0.07*s);
    c.strokeStyle='#1a1a1c';c.lineWidth=0.08*s;for(const x of [W*0.38,W*0.62]){c.beginPath();c.moveTo(x,py);c.lineTo(x,0);c.stroke();}
    if(p){p.lookV=-1;p.vx=0;p.vy=0;p.onGround=true;p.face=1;p.state="idle";p.atkPhase=null;p.slashT=0;
      c.setTransform(s,0,0,s,W/2-p.cx*s,py-p.bottom*s);try{p.updateScarf&&p.updateScarf(dt||1/60);p.draw(c,t);}catch(e){}c.setTransform(1,0,0,1,0,0);}
    /* из белого — в шахту; к верху — снова в белое (там утро) */
    const wa=Math.max(clamp(1-t/2.6,0,1),clamp((t-(FIN_ASC-3))/3,0,1));
    if(wa>0){c.fillStyle='rgba(255,252,240,'+wa+')';c.fillRect(0,0,W,H);}
  }
  /* ---------- V · НЕБО ---------- */
  startSky(){const g=this.g,p=g.world.player;this.act='sky';this.t=0;this.fx=p?p.cx+4:46;this.fy=p?p.cy-4:22;this.people=[];this.white=0;
    g.input.enabled=false;g.input.clearAll();this.hush();g.scriptInput=null;if(p)p.walkCap=0;}
  end(){this.act=null;this.t=0;this.people=[];this.leaf=null;this.knelt=false;this.kneelT=0;this.white=0;const g=this.g;g.camera.focus=null;g.scriptInput=null;
    if(g.world&&g.world.player)g.world.player.walkCap=0;if(this._nar)this._nar.classList.remove('on');document.getElementById('bars').classList.remove('on');}
}
