"use strict";
/* ============================== NODES ==============================
   Узел — система механизма (оружие, привод, баллон, сенсор, броня, ядро).
   Состояния: NORMAL → DAMAGED (≤55% прочности: трещины, искры) → EXPOSED (вскрыт на время:
   янтарь, двойной урон) → BROKEN (деталь отрывается, механизм реально теряет способность).
   Подсветка — только когда узел уязвим: телеграф атаки (сжимающееся кольцо = окно прерывания),
   вскрытие после прерывания / удара о стену, след рывка. Постоянного интерфейса нет.
   Координаты: lx, ly — локальные (от ног механизма, x — вперёд по взгляду), wx, wy — мировые. */
class Node{
  constructor(o){
    this.id='';this.hp=40;this.r=0.3;this.mat='steel';this.armor=1;this.backOnly=false;this.frontOnly=false;
    this.core=false;this.coreDmg=0;this.locked=false;this.lx=0;this.ly=0;this.part=null;
    Object.assign(this,o);
    this.max=this.hp;this.broken=false;this.exT=0;this.markT=0;this.markA=0;this.hitT=0;
    this.tele=0;this.teleHot=false;this.wx=0;this.wy=0;this.fxT=Math.random();
    this.seed=(o&&o.seed)||((Math.random()*1e6)|0);
  }
  get damaged(){return !this.broken&&this.hp<=this.max*CFG.combat.damagedAt;}
  get exposed(){return !this.broken&&this.exT>0;}
  get state(){return this.broken?'broken':this.exT>0?'exposed':this.damaged?'damaged':'normal';}
  /* 0 — целый, 1 — на грани: для тяжести трещин */
  get wear(){return this.broken?1:clamp(1-this.hp/this.max,0,1);}
}
/* Визуальный слой узлов — рисуется в локальной системе механизма (после тела).
   e — механизм (face/cx/bottom), t — время */
function drawNodeFX(c,e,t){
  const W=e.world;
  for(const n of e.nodes){
    if(n.broken||n.hidden)continue;
    const x=n.lx,y=n.ly,r=n.r,wx=e.cx+e.face*x,wy=e.bottom+y;
    /* DAMAGED: трещины по детали (сид узла — рисунок постоянный) */
    if(n.wear>0.2)MK.cracks(c,x,y,r*1.05,n.seed,clamp((n.wear-0.2)*1.4,0,1));
    /* вспышка попадания */
    if(n.hitT>0){c.save();c.globalCompositeOperation='lighter';
      c.fillStyle=rgba('#fff4dc',n.hitT*3.2);c.beginPath();c.arc(x,y,r*1.15,0,TAU);c.fill();c.restore();}
    /* телеграф: сжимающееся кольцо — когда оно сомкнулось на детали, окно прерывания открыто */
    if(n.tele>0){const k=n.tele,R=r*(1.1+1.5*(1-k)),hot=n.teleHot;
      c.save();c.globalCompositeOperation='lighter';
      c.strokeStyle=rgba(hot?'#ffe2a0':'#ffb45a',hot?0.95:0.35+0.4*k);c.lineWidth=hot?0.07:0.045;
      c.beginPath();c.arc(x,y,R,0,TAU);c.stroke();
      if(hot){const p=0.5+0.5*Math.sin(t*40);
        const g=c.createRadialGradient(x,y,0,x,y,r*1.6);g.addColorStop(0,rgba('#fff0c8',0.75));g.addColorStop(0.5,rgba('#ffb45a',0.4+0.2*p));g.addColorStop(1,'rgba(255,120,40,0)');
        c.fillStyle=g;c.beginPath();c.arc(x,y,r*1.6,0,TAU);c.fill();}
      c.restore();
      W.game.renderer.glowAdd(wx,wy,r*(hot?2.6:1.8),'#ffb45a',hot?0.7:0.3*k);}
    /* EXPOSED: ровное янтарное свечение + скобы-уголки вокруг */
    if(n.exT>0){const a=clamp(n.exT/0.25,0,1),p=0.5+0.5*Math.sin(t*9);
      c.save();c.globalCompositeOperation='lighter';
      const g=c.createRadialGradient(x,y,r*0.2,x,y,r*1.7);g.addColorStop(0,rgba('#ffe6a3',0.55*a));g.addColorStop(0.6,rgba('#ffa040',(0.25+0.15*p)*a));g.addColorStop(1,'rgba(255,120,40,0)');
      c.fillStyle=g;c.beginPath();c.arc(x,y,r*1.7,0,TAU);c.fill();
      c.strokeStyle=rgba('#ffd27a',0.85*a);c.lineWidth=0.045;const q=r*1.12,L=r*0.38;
      for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){c.beginPath();c.moveTo(x+sx*q,y+sy*(q-L));c.lineTo(x+sx*q,y+sy*q);c.lineTo(x+sx*(q-L),y+sy*q);c.stroke();}
      c.restore();
      W.game.renderer.glowAdd(wx,wy,r*2.6,'#ffb45a',0.45*a);}
    /* след рывка: бело-голубой разрез поперёк детали, гаснет */
    if(n.markT>0){const a=clamp(n.markT/CFG.combat.markT,0,1),L=r*1.9;
      c.save();c.globalCompositeOperation='lighter';c.translate(x,y);c.rotate(n.markA*e.face);
      c.strokeStyle=rgba('#dff4ff',0.95*a);c.lineWidth=0.06+0.05*a;c.beginPath();c.moveTo(-L,0);c.lineTo(L,0);c.stroke();
      c.strokeStyle=rgba('#7fd0ff',0.5*a);c.lineWidth=0.2*a;c.beginPath();c.moveTo(-L*0.8,0);c.lineTo(L*0.8,0);c.stroke();
      c.restore();W.game.renderer.glowAdd(wx,wy,r*2.2,'#9fe0ff',0.5*a);}
  }
}
