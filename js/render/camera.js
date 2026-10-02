"use strict";
/* ============================== CAMERA ==============================
   Тряска — в экранных пикселях, не в метрах: короткий толчок 1–3 px на 0.05–0.1 с.
   Силу события (старые единицы 0.1…2.2) настройка переводит в пиксели и режет потолком;
   слабые события (шаг, приземление, лёгкий удар) не трясут вовсе. «Выкл» — камера неподвижна.
   impulse() — направленный толчок (рывок, удар), подчиняется тому же потолку. */
class Camera{
  constructor(){this.x=0;this.y=0;this.zoom=1;this.tzoom=1;
    this.shAmp=0;this.shT=0;this.shDur=0;this.shPh=0;this.shakeT=0;
    this.sx=0;this.sy=0;this.focus=null;this.impulseX=0;this.impulseY=0;this.lookX=0;this.lookY=0;this.ppmz=40;}
  reset(x,y,z){this.x=x;this.y=y;this.zoom=z||1;this.tzoom=z||1;this.shAmp=0;this.shT=0;this.sx=0;this.sy=0;
    this.focus=null;this.impulseX=0;this.impulseY=0;this.lookX=0;this.lookY=0;}
  /* a — сила события; толчок заменяет текущий, только если сильнее его остатка */
  addShake(a){
    const S=Settings.shake();if(!S.cap)return;
    const amp=Math.min(S.cap,a*S.k);if(amp<S.floor)return;
    const left=this.shDur>0?this.shAmp*(this.shT/this.shDur):0;
    if(amp<=left)return;
    this.shAmp=amp;this.shDur=S.dur*(0.6+0.4*Math.min(1,a));this.shT=this.shDur;this.shPh=Math.random()*TAU;
  }
  /* направленный толчок (метры старого масштаба → пиксели), тоже с потолком */
  impulse(x,y){const S=Settings.shake();if(!S.cap)return;
    this.impulseX=clamp(this.impulseX+x*6*S.k/2.2,-S.cap,S.cap);this.impulseY=clamp(this.impulseY+y*6*S.k/2.2,-S.cap,S.cap);}
  update(dt,player,room,vw,vh,ppm){
    const spd=player?Math.abs(player.vx):0,face=player?player.face:1;
    const tlx=face*(1.15+clamp(spd*0.10,0,1.5));
    /* взгляд вверх/вниз (стоишь и держишь ↑ или сидишь) — камера заглядывает на 3.4 м */
    const tly=player?clamp(player.vy*0.045,-1.2,1.7)+(player.lookV||0)*3.4:0;
    this.lookX=damp(this.lookX,(player&&player.onGround&&spd<0.6)?face*0.9:tlx,4.5,dt);
    this.lookY=damp(this.lookY,tly,4.0,dt);
    let tx,ty;
    if(this.focus){tx=this.focus.x;ty=this.focus.y;}
    else{tx=player.cx+this.lookX;ty=player.cy-0.55+this.lookY;
      /* бой с большим боссом: кадр тянется к нему, чтобы замах был виден целиком */
      if(this.frame){tx=lerp(tx,this.frame.x,this.frame.w);ty=lerp(ty,this.frame.y,this.frame.w);}}
    this.zoom=damp(this.zoom,this.tzoom,8,dt);
    const s=ppm*this.zoom,hw=vw/s/2,hh=vh/s/2;this.ppmz=s;
    let cx=tx,cy=ty;
    if(room){
      if(room.w>hw*2)cx=clamp(cx,hw,room.w-hw);else cx=room.w/2;
      if(room.h>hh*2)cy=clamp(cy,hh,room.h-hh);else cy=room.h/2;
    }
    this.x=damp(this.x,cx,player&&player.dashT>0?26:16,dt);
    this.y=damp(this.y,cy,13,dt);
    this.impulseX=damp(this.impulseX,0,14,dt);this.impulseY=damp(this.impulseY,0,14,dt);
    this.shakeT+=dt;
    let px=0,py=0;
    if(this.shT>0){
      this.shT=Math.max(0,this.shT-dt);
      const k=this.shDur>0?this.shT/this.shDur:0,a=this.shAmp*k*k;
      /* два-три качания за толчок, а не дрожь */
      px=Math.sin(this.shakeT*70+this.shPh)*a;py=Math.cos(this.shakeT*57+this.shPh*1.3)*a*0.8;
      if(this.shT<=0)this.shAmp=0;
    }
    px+=this.impulseX;py+=this.impulseY;
    this.sx=px/s;this.sy=py/s;
  }
  get cx(){return this.x+this.sx;}
  get cy(){return this.y+this.sy;}
}
