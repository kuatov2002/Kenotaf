"use strict";
/* ============================== ROOMS · Z5 ============================== */
Object.assign(ROOMDEFS,{
z5_surface:gs=>({id:'z5_surface',zone:'surface',name:'ПОВЕРХНОСТЬ',w:64,h:34,
  art:{bg:Art.bgSurface,mid:Art.midSurface,game:Art.gameSurface},
  build(R){
    /* снаружи свода нет: только земля и края мира */
    R.solids=[S(-2,-30,2,64,'concrete',{noGrass:true}),
      S(64,-30,2,64,'concrete',{noGrass:true}),S(0,29,64,5,'concrete')];
    R.emitters=[{type:'windseed',rate:16},{type:'leaf',rate:3}];
    R.trigger={x:46,once:'ending'};
    R.lights=[lit(50,6,30,'#fff6dd',0.9),lit(4,26,6,'#ffe6b0',0.5)];
    R.extraGame=(c,L,r)=>{
      /* кенотаф: бетонный памятник «тому, чего не было»; у основания — люк, откуда вышел курьер */
      const g=c.createLinearGradient(0,0,7,0);g.addColorStop(0,'#8a877c');g.addColorStop(0.5,'#a8a498');g.addColorStop(1,'#6e6b62');
      c.fillStyle=g;c.beginPath();c.moveTo(0.2,29);c.lineTo(0.8,19.5);c.lineTo(3.5,17.4);c.lineTo(6.2,19.5);c.lineTo(6.8,29);c.closePath();c.fill();
      c.strokeStyle='rgba(40,40,36,.45)';c.lineWidth=0.05;for(let i=0;i<6;i++){c.beginPath();c.moveTo(0.5+i*0.3,29-i*1.4);c.lineTo(6.5-i*0.3,29-i*1.4);c.stroke();}
      Kit.stencil(c,1.3,22.6,'КЕНОТАФ',0.55,'rgba(40,40,36,.75)',0.75);
      Kit.stencil(c,1.4,23.4,'ВЫХОД 41 · НЕ ОТКРЫВАТЬ',0.22,'rgba(40,40,36,.6)',0.6);
      c.fillStyle='#1a1a18';rr(c,2.3,26.2,2.4,2.8,0.2);c.fill();
      const lg=c.createLinearGradient(0,26.2,0,29);lg.addColorStop(0,'rgba(255,230,170,.25)');lg.addColorStop(1,'rgba(255,230,170,0)');c.fillStyle=lg;rr(c,2.3,26.2,2.4,2.8,0.2);c.fill();
      c.fillStyle='#5a5852';c.save();c.translate(4.7,26.3);c.rotate(-1.1);c.fillRect(0,-0.15,2.6,0.3);c.restore();
      for(let i=0;i<14;i++){c.strokeStyle='rgba(80,120,60,.7)';c.lineWidth=0.05;const x=0.4+r()*6.2;c.beginPath();c.moveTo(x,29);c.quadraticCurveTo(x+0.2,27.5-r()*3,x+(r()-0.5),25-r()*4);c.stroke();}
      for(let i=0;i<80;i++){const x=r()*L.w;c.strokeStyle='rgba(90,130,60,.5)';c.lineWidth=0.05;c.beginPath();c.moveTo(x,29);
        c.quadraticCurveTo(x+0.1,28.6,x+0.3,28.4-r()*0.3);c.stroke();}
    };
    /* земля, а не бетон: дёрн, глина, камни, корни */
    R.extraTop=(c,L,r)=>{const g=c.createLinearGradient(0,29,0,34);g.addColorStop(0,'#4a5a2a');g.addColorStop(0.12,'#5a4630');g.addColorStop(1,'#2a1e14');
      c.fillStyle=g;c.fillRect(0,29.15,64,4.85);c.fillStyle='#6f8a4c';c.fillRect(0,29,64,0.22);
      for(let i=0;i<90;i++){c.fillStyle=['#6a5a44','#4a3e30','#7a6a52'][(r()*3)|0];c.beginPath();c.ellipse(r()*64,29.8+r()*4,0.1+r()*0.25,0.07+r()*0.14,r()*3,0,TAU);c.fill();}
      c.strokeStyle='rgba(120,96,60,.6)';c.lineWidth=0.05;for(let i=0;i<40;i++){const x=r()*64;c.beginPath();c.moveTo(x,29.3);c.quadraticCurveTo(x+(r()-0.5),30.4,x+(r()-0.5)*1.6,31+r()*2);c.stroke();}};
    /* птицы и ветер: живое небо */
    R.dyn=(c,t,W)=>{for(let i=0;i<9;i++){const ph=i*1.7,x=((t*(2.2+i%3*0.6)+i*9)%84)-10,y=5+Math.sin(t*0.4+ph)*1.5+i%4*1.6,w=Math.sin(t*7+ph)*0.22;
        c.strokeStyle='rgba(40,46,52,.75)';c.lineWidth=0.07;c.beginPath();c.moveTo(x-0.35,y-w);c.quadraticCurveTo(x-0.12,y-0.1,x,y);c.quadraticCurveTo(x+0.12,y-0.1,x+0.35,y-w);c.stroke();}};
  }})
});
