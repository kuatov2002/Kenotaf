"use strict";
/* ============================== CAMERA ============================== */
class Camera{
  constructor(){this.x=0;this.y=0;this.zoom=1;this.tzoom=1;this.shake=0;this.shakeT=0;
    this.sx=0;this.sy=0;this.focus=null;this.impulseX=0;this.impulseY=0;this.lookX=0;this.lookY=0;}
  reset(x,y,z){this.x=x;this.y=y;this.zoom=z||1;this.tzoom=z||1;this.shake=0;this.sx=0;this.sy=0;
    this.focus=null;this.impulseX=0;this.impulseY=0;this.lookX=0;this.lookY=0;}
  addShake(a){this.shake=Math.min(2.2,this.shake+a);}
  impulse(x,y){this.impulseX+=x;this.impulseY+=y;}
  update(dt,player,room,vw,vh,ppm){
    const spd=player?Math.abs(player.vx):0,face=player?player.face:1;
    const tlx=face*(1.15+clamp(spd*0.10,0,1.5));
    const tly=player?clamp(player.vy*0.045,-1.2,1.7):0;
    this.lookX=damp(this.lookX,(player&&player.onGround&&spd<0.6)?face*0.9:tlx,4.5,dt);
    this.lookY=damp(this.lookY,tly,4.0,dt);
    let tx,ty;
    if(this.focus){tx=this.focus.x;ty=this.focus.y;}
    else{tx=player.cx+this.lookX;ty=player.cy-0.55+this.lookY;}
    this.zoom=damp(this.zoom,this.tzoom,8,dt);
    const s=ppm*this.zoom,hw=vw/s/2,hh=vh/s/2;
    let cx=tx,cy=ty;
    if(room){
      if(room.w>hw*2)cx=clamp(cx,hw,room.w-hw);else cx=room.w/2;
      if(room.h>hh*2)cy=clamp(cy,hh,room.h-hh);else cy=room.h/2;
    }
    this.x=damp(this.x,cx,player&&player.dashT>0?26:16,dt);
    this.y=damp(this.y,cy,13,dt);
    this.impulseX=damp(this.impulseX,0,10,dt);this.impulseY=damp(this.impulseY,0,10,dt);
    this.shakeT+=dt;if(this.shake>0)this.shake=Math.max(0,this.shake-dt*2.4);
    const sh=this.shake*this.shake;
    this.sx=this.impulseX+Math.sin(this.shakeT*61)*sh*0.3+Math.sin(this.shakeT*23)*sh*0.16;
    this.sy=this.impulseY+Math.cos(this.shakeT*53)*sh*0.26+Math.sin(this.shakeT*31)*sh*0.13;
  }
  get cx(){return this.x+this.sx;}
  get cy(){return this.y+this.sy;}
}
