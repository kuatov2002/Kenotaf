"use strict";
/* ============================== PHYSICS ============================== */
class Body{
  constructor(x,y,w,h){this.x=x;this.y=y;this.w=w;this.h=h;this.vx=0;this.vy=0;
    this.onGround=false;this.wall=0;this.ceilHit=false;this.grav=1;this.ground=null;}
  get cx(){return this.x+this.w/2;}
  get cy(){return this.y+this.h/2;}
  get bottom(){return this.y+this.h;}
  rect(){return {x:this.x,y:this.y,w:this.w,h:this.h};}
}
function moveBody(b,dt,solids){
  b.wall=0;b.ceilHit=false;b.onGround=false;b.ground=null;
  const g=b.grav;
  const sp=Math.max(Math.abs(b.vx),Math.abs(b.vy));
  const steps=clamp(Math.ceil(sp*dt/CFG.colStep),1,8),sdt=dt/steps;
  for(let i=0;i<steps;i++){
    if(b.vx!==0){
      b.x+=b.vx*sdt;
      for(let k=0;k<solids.length;k++){
        const s=solids[k];if(s.ow||s.hidden)continue;
        if(!aabb(b,s))continue;
        if(b.vx>0){b.x=s.x-b.w;b.wall=1;}else{b.x=s.x+s.w;b.wall=-1;}
        b.vx=0;
      }
    }
    const pT=b.y,pB=b.y+b.h;
    b.y+=b.vy*sdt*g;
    for(let k=0;k<solids.length;k++){
      const s=solids[k];if(s.hidden||!aabb(b,s))continue;
      if(s.ow){
        if(g>0){if(b.vy>=0&&pB<=s.y+0.06){b.y=s.y-b.h;b.vy=0;b.onGround=true;b.ground=s;}}
        else{if(b.vy<=0&&pT>=s.y+s.h-0.06){b.y=s.y+s.h;b.vy=0;b.onGround=true;b.ground=s;}}
        continue;
      }
      if(g>0){
        if(b.vy>0||(b.vy===0&&pB<=s.y+0.06)){b.y=s.y-b.h;b.vy=0;b.onGround=true;b.ground=s;}
        else if(b.vy<0){b.y=s.y+s.h;b.vy=0;b.ceilHit=true;}
        else{b.y=s.y-b.h;b.vy=0;b.onGround=true;b.ground=s;}
      }else{
        if(b.vy<0||(b.vy===0&&pT>=s.y+s.h-0.06)){b.y=s.y+s.h;b.vy=0;b.onGround=true;b.ground=s;}
        else if(b.vy>0){b.y=s.y-b.h;b.vy=0;b.ceilHit=true;}
        else{b.y=s.y+s.h;b.vy=0;b.onGround=true;b.ground=s;}
      }
    }
  }
}
function groundProbe(b,solids,eps){
  const bot=b.y+b.h,x0=b.x+0.05,x1=b.x+b.w-0.05;let best=null;
  for(let k=0;k<solids.length;k++){
    const s=solids[k];if(s.hidden)continue;
    if(x1<=s.x||x0>=s.x+s.w)continue;
    const top=s.y,d=top-bot;
    if(d>=-0.04&&d<=eps){if(best===null||top<best)best=top;}
    else if(!s.ow&&aabb(b,s)){if(best===null||top<best)best=top;}
  }
  return best;
}
function nearestGroundBelow(b,solids,maxD){
  const bot=b.y+b.h,x0=b.x+0.05,x1=b.x+b.w-0.05;let best=null;
  for(let k=0;k<solids.length;k++){
    const s=solids[k];if(s.hidden)continue;
    if(x1<=s.x||x0>=s.x+s.w)continue;
    const d=s.y-bot;if(d>=-0.05&&d<=maxD&&(best===null||d<best))best=d;
  }
  return best;
}
