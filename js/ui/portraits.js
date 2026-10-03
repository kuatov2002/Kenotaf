"use strict";
/* ============================== ПОРТРЕТЫ ==============================
   Ручная ключевая графика для реплик: курьер, почтмейстер, садовник, Курьер 38, Совет.
   Каждый — бюст в латунной раме на тёмном фоне со своим светом (лампа, теплица, фонограф).
   Рисуются в поле 100×100, дышат (лёгкий сдвиг) и моргают. Цвета — те же, что у фигур в мире. */
const PORTRAITS={
  courier:{name:'КУРЬЕР',light:'#ffbe63',bg:['#2a2118','#0c0a08']},
  postmaster:{name:'ПОЧТМЕЙСТЕР',light:'#ffd9a0',bg:['#26242a','#0b0a0c']},
  gardener:{name:'САДОВНИК',light:'#bfeee8',bg:['#1f2a1c','#090c08']},
  c38:{name:'КУРЬЕР 38',light:'#9fe6ff',bg:['#1a2228','#08090b']},
  council:{name:'СОВЕТ',light:'#e8c96a',bg:['#2a2216','#0c0a06']}
};
const Portraits={
  draw(cv,key,t){const P=PORTRAITS[key];if(!cv||!P)return;const c=cv.getContext('2d'),W=cv.width,H=cv.height;
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);c.setTransform(W/100,0,0,H/100,0,0);
    const br=Math.sin(t*1.5)*0.6,blink=((t*0.37)%1)>0.96;
    /* фон: виньетка и свет персонажа сбоку */
    c.save();c.beginPath();c.arc(50,50,46,0,TAU);c.clip();
    const g=c.createRadialGradient(36,34,4,50,50,60);g.addColorStop(0,P.bg[0]);g.addColorStop(1,P.bg[1]);c.fillStyle=g;c.fillRect(0,0,100,100);
    const lg=c.createRadialGradient(18,40,0,18,40,60);lg.addColorStop(0,rgba(P.light,0.35));lg.addColorStop(1,rgba(P.light,0));c.fillStyle=lg;c.fillRect(0,0,100,100);
    c.translate(0,br);
    this[key](c,t,blink,P);
    c.restore();
    /* латунная рама */
    c.setTransform(W/100,0,0,H/100,0,0);
    c.strokeStyle='#6d5416';c.lineWidth=5;c.beginPath();c.arc(50,50,47,0,TAU);c.stroke();
    c.strokeStyle='#e8c96a';c.lineWidth=1.2;c.beginPath();c.arc(50,50,45.2,0,TAU);c.stroke();
    c.strokeStyle='rgba(255,240,200,.35)';c.lineWidth=0.8;c.beginPath();c.arc(50,50,48.8,PI*1.1,PI*1.6);c.stroke();
    for(let i=0;i<4;i++){const a=PI/4+i*PI/2;c.fillStyle='#c9a227';c.beginPath();c.arc(50+Math.cos(a)*47,50+Math.sin(a)*47,1.6,0,TAU);c.fill();}},
  /* общий бюст: плечи-силуэт */
  shoulders(c,col,col2){const g=c.createLinearGradient(0,70,0,100);g.addColorStop(0,col);g.addColorStop(1,col2);c.fillStyle=g;
    c.beginPath();c.moveTo(14,100);c.quadraticCurveTo(16,74,36,70);c.lineTo(64,70);c.quadraticCurveTo(84,74,86,100);c.closePath();c.fill();},
  courier(c,t,blink){
    this.shoulders(c,'#45382a','#2c241a');
    c.fillStyle='#3a2f23';c.beginPath();c.ellipse(50,71,15,5,0,0,TAU);c.fill();   /* воротник */
    c.fillStyle='#c9a227';c.fillRect(57,80,6,7);c.fillStyle='#2b2318';c.fillRect(58.5,82,3,3);   /* латунная бирка */
    c.fillStyle='#8a2b1e';c.beginPath();c.moveTo(38,70);c.quadraticCurveTo(50,78,62,70);c.lineTo(60,66);c.quadraticCurveTo(50,72,40,66);c.closePath();c.fill();   /* шарф */
    c.fillStyle='#a07d62';c.beginPath();c.ellipse(50,52,13,15,0,0,TAU);c.fill();   /* лицо в тени шлема */
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(50,46,14,9,0,0,TAU);c.fill();
    /* шлем: кожаный купол, латунный обод */
    c.fillStyle='#3a332a';c.beginPath();c.ellipse(50,38,17,15,0,PI,TAU);c.fill();c.fillRect(33,37,34,5);
    c.fillStyle='#4d453a';c.beginPath();c.ellipse(48,33,12,8,-0.2,PI,TAU);c.fill();
    c.fillStyle='#8a6d3b';c.fillRect(32,40,36,3);
    /* фонарь-визор: тёплый свет */
    const eg=c.createRadialGradient(58,48,0,58,48,10);eg.addColorStop(0,'#ffecb4');eg.addColorStop(0.5,'rgba(255,190,99,.85)');eg.addColorStop(1,'rgba(255,150,60,0)');
    c.fillStyle=eg;c.beginPath();c.arc(58,48,10,0,TAU);c.fill();
    c.fillStyle='#ffdf9a';c.beginPath();c.ellipse(58,48,5,blink?0.8:3.4,0,0,TAU);c.fill();
    c.fillStyle='#2b2620';c.beginPath();c.moveTo(42,44);c.lineTo(66,45);c.lineTo(65,47);c.lineTo(42,46);c.fill();
    c.fillStyle='#4a3a2e';c.beginPath();c.ellipse(43,48,3,blink?0.6:2,0,0,TAU);c.fill();   /* второй глаз в тени */
    /* антенна с огоньком */
    c.strokeStyle='#7a8087';c.lineWidth=1.2;c.beginPath();c.moveTo(38,28);c.lineTo(30,12);c.stroke();
    c.fillStyle=rgba('#c8452f',0.6+0.4*Math.sin(t*4));c.beginPath();c.arc(30,11,2,0,TAU);c.fill();},
  postmaster(c,t,blink){
    this.shoulders(c,'#33405a','#1a2130');
    for(let i=0;i<2;i++){c.fillStyle='#c9a227';c.beginPath();c.arc(50,82+i*9,1.6,0,TAU);c.fill();}
    c.fillStyle='#77736a';c.beginPath();c.moveTo(30,74);c.quadraticCurveTo(50,90,70,74);c.lineTo(66,68);c.quadraticCurveTo(50,80,34,68);c.closePath();c.fill();   /* шаль */
    c.fillStyle='#d2b49a';c.fillRect(45,62,10,8);
    c.fillStyle='#e0c4a8';c.beginPath();c.ellipse(50,50,14,16,0,0,TAU);c.fill();
    c.fillStyle='#bdbab2';c.beginPath();c.arc(36,46,7,0,TAU);c.fill();c.beginPath();c.arc(64,46,6,0,TAU);c.fill();   /* седые волосы */
    c.fillStyle='#cfccc4';c.beginPath();c.ellipse(50,38,15,7,0,PI,TAU);c.fill();
    /* фуражка с латунным рожком */
    c.fillStyle='#232c3c';c.beginPath();c.moveTo(34,36);c.lineTo(36,26);c.lineTo(64,26);c.lineTo(66,36);c.closePath();c.fill();
    c.fillStyle='#161c27';c.beginPath();c.ellipse(54,37,17,3,0,0,TAU);c.fill();
    c.strokeStyle='#e8c96a';c.lineWidth=1.4;c.beginPath();c.arc(50,31,3,0.2,PI*1.6);c.stroke();
    /* очки и взгляд поверх них */
    c.strokeStyle='#b08d3e';c.lineWidth=1.1;c.beginPath();c.arc(44,50,4.5,0,TAU);c.stroke();c.beginPath();c.arc(56,50,4.5,0,TAU);c.stroke();
    c.beginPath();c.moveTo(48.5,50);c.lineTo(51.5,50);c.stroke();
    c.fillStyle='#3a3028';for(const x of [44,56]){c.beginPath();c.ellipse(x,51,1.6,blink?0.3:1.5,0,0,TAU);c.fill();}
    c.fillStyle='rgba(220,240,255,.55)';c.fillRect(41.5,47.5,1.5,1.5);c.fillRect(53.5,47.5,1.5,1.5);
    c.strokeStyle='#8a6a52';c.lineWidth=0.9;c.beginPath();c.moveTo(46,59);c.quadraticCurveTo(50,61,54,59);c.stroke();
    c.strokeStyle='rgba(120,90,70,.4)';c.lineWidth=0.5;c.beginPath();c.moveTo(39,55);c.lineTo(41,57);c.moveTo(61,55);c.lineTo(59,57);c.stroke();},
  gardener(c,t,blink){
    this.shoulders(c,'#5a5f36','#34311f');
    c.fillStyle='#8a7a58';c.fillRect(42,74,16,26);   /* фартук */
    c.fillStyle='#b8987a';c.beginPath();c.ellipse(50,52,13,15,0,0,TAU);c.fill();
    c.fillStyle='#9aa1a8';c.beginPath();c.moveTo(38,56);c.quadraticCurveTo(50,76,62,56);c.quadraticCurveTo(50,64,38,56);c.fill();   /* борода */
    /* респиратор на шее, латунный фильтр */
    c.fillStyle='#3a3d40';c.beginPath();c.ellipse(50,68,8,4,0,0,TAU);c.fill();c.fillStyle='#b08d3e';c.beginPath();c.arc(50,68,2.6,0,TAU);c.fill();
    /* шляпа с полями */
    c.fillStyle='#4b5032';c.beginPath();c.ellipse(50,38,26,5,0,0,TAU);c.fill();
    c.fillStyle='#5a4a2e';c.beginPath();c.moveTo(37,38);c.quadraticCurveTo(38,22,50,22);c.quadraticCurveTo(62,22,63,38);c.closePath();c.fill();
    c.fillStyle='#8a2b1e';c.fillRect(37,34,26,3);
    /* лист за лентой: тот самый вид, которого нет в каталоге */
    c.fillStyle='#6f9a4a';c.beginPath();c.moveTo(60,34);c.quadraticCurveTo(70,24,74,22);c.quadraticCurveTo(70,32,60,34);c.fill();
    c.strokeStyle='#c9e08a';c.lineWidth=0.6;c.beginPath();c.moveTo(60,34);c.lineTo(73,23);c.stroke();
    c.fillStyle='#4a3a2a';for(const x of [45,55]){c.beginPath();c.ellipse(x,48,1.8,blink?0.3:1.6,0,0,TAU);c.fill();}
    c.strokeStyle='#6b5a3a';c.lineWidth=1;c.beginPath();c.moveTo(42,44);c.lineTo(47,45);c.moveTo(53,45);c.lineTo(58,44);c.stroke();},
  c38(c,t,blink){
    this.shoulders(c,'#4a453c','#25221d');
    c.fillStyle='#5c3a2a';c.beginPath();c.moveTo(30,74);c.lineTo(36,72);c.lineTo(70,100);c.lineTo(62,100);c.closePath();c.fill();   /* ремень сумки */
    c.fillStyle='#bfa890';c.beginPath();c.ellipse(50,53,12,15,0,0,TAU);c.fill();
    c.fillStyle='rgba(240,240,232,.25)';c.beginPath();c.ellipse(44,58,4,2.5,0.3,0,TAU);c.fill();   /* меловая пыль на щеке */
    /* фуражка с «38» мелом */
    c.fillStyle='#3a3630';c.beginPath();c.moveTo(36,40);c.lineTo(38,28);c.lineTo(62,28);c.lineTo(64,40);c.closePath();c.fill();
    c.fillStyle='#2a2620';c.beginPath();c.ellipse(53,41,16,3,0,0,TAU);c.fill();
    c.fillStyle='rgba(236,234,222,.85)';c.font='500 9px Oswald';c.textAlign='center';c.fillText('38',50,37);c.textAlign='left';
    /* усталые глаза, синий свет фонографа снизу */
    c.fillStyle='#2a2a30';for(const x of [45,55]){c.beginPath();c.ellipse(x,51,1.7,blink?0.3:1.3,0,0,TAU);c.fill();}
    c.strokeStyle='rgba(60,50,45,.6)';c.lineWidth=0.7;c.beginPath();c.moveTo(42,54);c.quadraticCurveTo(45,55.5,48,54);c.moveTo(52,54);c.quadraticCurveTo(55,55.5,58,54);c.stroke();
    c.strokeStyle='#6a5244';c.lineWidth=0.9;c.beginPath();c.moveTo(46,61);c.lineTo(54,61);c.stroke();
    const bg=c.createLinearGradient(0,100,0,50);bg.addColorStop(0,'rgba(159,230,255,.35)');bg.addColorStop(1,'rgba(159,230,255,0)');c.fillStyle=bg;c.fillRect(0,50,100,50);},
  council(c,t){
    /* лица нет: пластинка на диске граммофона, рупор, игла. Этикетка «СОВЕТ» вращается */
    c.fillStyle='#14110c';c.beginPath();c.arc(44,60,28,0,TAU);c.fill();
    c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=0.6;for(let r=8;r<28;r+=2.2){c.beginPath();c.arc(44,60,r,0,TAU);c.stroke();}
    c.save();c.translate(44,60);c.rotate(t*1.2);c.fillStyle='#8a2b1e';c.beginPath();c.arc(0,0,8,0,TAU);c.fill();
    c.fillStyle='#e8c96a';c.font='500 4px Oswald';c.textAlign='center';c.fillText('СОВЕТ',0,1.4);c.restore();
    c.fillStyle='#000';c.beginPath();c.arc(44,60,1,0,TAU);c.fill();
    c.strokeStyle='rgba(255,240,200,.18)';c.lineWidth=2;c.beginPath();c.arc(44,60,20,-1.2,-0.6);c.stroke();
    /* рупор */
    const hg=c.createLinearGradient(56,14,90,40);hg.addColorStop(0,'#6d5416');hg.addColorStop(0.5,'#e8c96a');hg.addColorStop(1,'#7a5f1c');
    c.fillStyle=hg;c.beginPath();c.moveTo(60,46);c.lineTo(64,40);c.quadraticCurveTo(70,22,92,12);c.lineTo(96,34);c.quadraticCurveTo(76,34,66,48);c.closePath();c.fill();
    c.strokeStyle='#3a2c10';c.lineWidth=1.2;c.beginPath();c.moveTo(62,44);c.lineTo(52,52);c.stroke();}
};
