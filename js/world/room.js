"use strict";
/* ============================== ROOM ============================== */
class Room{
  constructor(def,gs){
    const base=def(gs);
    this.enemies=[];this.lights=[];this.emitters=[];this.machines=[];this.interactables=[];
    this.pushables=[];this.hazards=[];this.magnetRects=[];this.doors=[];this.solids=[];this.weights=null;
    this.bossTrigger=null;this.bossDoor=null;this.checkpoint=null;
    this.art=base.art||{bg:Art.bgSump,mid:Art.midSump,game:Art.gameSump};
    Object.assign(this,base);
    this.playerRef=null;this.t=0;
    if(this.build)this.build(this);
    this.solids=this.solids.filter(s=>!s.hidden);
  }
}

/* ---------- пары дверей ---------- */
function pairDoor(R,fromId,d){
  const D=R.doors;
  if(d&&d.link){const m=D.find(o=>o.link===d.link);if(m)return m;}
  const c=D.filter(o=>o.to===fromId);
  return c.length===1?c[0]:null;
}
/* пол под дверью: ближайшая верхняя грань твёрдого/настила у нижней кромки проёма */
function doorFloor(R,d){
  const mx=d.x+d.w/2,base=d.down?d.y+0.4:d.y+d.h;let best=null;
  for(const s of R.solids){if(s.hidden)continue;
    if(mx<s.x-0.6||mx>s.x+s.w+0.6)continue;
    const dd=Math.abs(s.y-base);if(dd<0.75&&(best===null||dd<Math.abs(best-base)))best=s.y;}
  return best;
}
function doorArrival(R,d){
  const pw=CFG.player.w,ph=CFG.player.h,fl=doorFloor(R,d);
  const bottom=fl!==null?fl:(d.down?d.y+0.4:d.y+d.h);
  let x,face=1;
  if(d.x<0.6){x=d.x+d.w+0.3;face=1;}
  else if(d.x+d.w>R.w-0.6){x=d.x-0.3-pw;face=-1;}
  else{x=d.x+d.w/2-pw/2;face=d.x+d.w/2<R.w/2?1:-1;}
  /* не появляться внутри завала/штабеля: сдвиг к центру комнаты */
  for(let k=0;k<20;k++){const p={x:x,y:bottom-ph,w:pw,h:ph};
    if(!R.solids.some(s=>!s.ow&&!s.hidden&&aabb(p,s)))break;x+=face*0.5;}
  return {x:x,y:bottom-ph,face:face};
}
