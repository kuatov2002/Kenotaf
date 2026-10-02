"use strict";
/* ============================== ROOMS · Z5 ============================== */
Object.assign(ROOMDEFS,{
z5_surface:gs=>({id:'z5_surface',zone:'surface',name:'ПОВЕРХНОСТЬ',w:64,h:22,
  art:{bg:Art.bgSurface,mid:Art.midSurface,game:Art.gameSurface},
  build(R){
    R.solids=[S(-2,-2,68,3,'concrete',{noGrass:true}),S(-2,0,2,22,'concrete',{noGrass:true}),
      S(64,0,2,22,'concrete',{noGrass:true}),S(0,17,64,5,'concrete')];
    R.emitters=[{type:'windseed',rate:14},{type:'leaf',rate:2}];
    R.trigger={x:46,once:'ending'};
    R.extraGame=(c,L,r)=>{
      Kit.plate(c,0.4,13.4,5,3.6,'concrete',1100,{bolts:true});
      c.fillStyle='#2a2c26';c.fillRect(1.4,14.0,3,3.0);
      Kit.hazardTape(c,1.4,13.8,3,0.24);
      Kit.stencil(c,1.0,13.2,'ВЫХОД 41 · АРКОЛОГИЯ',0.3,'rgba(40,44,36,.7)',0.7);
      for(let i=0;i<60;i++){const x=r()*L.w;
        c.strokeStyle='rgba(90,120,60,.5)';c.lineWidth=0.05;c.beginPath();c.moveTo(x,17);
        c.quadraticCurveTo(x+0.1,16.6,x+0.3,16.4-r()*0.3);c.stroke();}
    };
  }})
});
