"use strict";
/* ============================== ФОНАРЬ-КОЛОНКА ==============================
   Чекпоинт = колонка подкачки куртки. Её язык совпадает с HUD: на латунной табличке те же
   скошенные ячейки, что и полоса куртки внизу экрана. Курьер учится без слов:
     • ранен и фонарь в кадре — фонарь «зовёт»: медленные тёплые кольца от колпака;
     • подошёл — колпак разгорается, на табличке загорается выбитая клавиша действия,
       тёплые искры тянутся от фонаря к курьеру, пустые ячейки на табличке мигают;
     • E — шланг колонки цепляется к куртке, ячейки наполняются по одной: на табличке,
       на куртке и в HUD одновременно, с восходящим звоном. Потом — сохранение.
   Отдых возвращает обычных врагов на посты (как раньше). */
const LAMP={reach:1.5,near:4.6,call:24,cell:0.24};
class LampSystem{
  constructor(game){this.game=game;this.seq=null;this.k=0;this.callT=0;this.nearK=0;}
  reset(){this.seq=null;this.k=0;this.callT=0;this.nearK=0;}
  /* E у фонаря: запуск подкачки */
  rest(cp){
    const g=this.game,W=g.world,gs=g.gs,p=W.player;if(this.seq||!p)return;
    g.checkpoints.activate(cp);
    const miss=Math.max(0,gs.maxHp()-gs.hp);
    this.seq={cp,t:0,miss,done:0,dur:0.45+miss*LAMP.cell+0.35};
    p.vx=0;p.restT=this.seq.dur;p.face=cp.x>p.cx?1:-1;
    g.audio.lampHook();
    g.hud.lampRest(true);
  }
  update(dt){
    const g=this.game,W=g.world,R=W.room,p=W.player,gs=g.gs,cp=R&&R.checkpoint;
    if(!cp||!p){this.seq=null;return;}
    const lx=cp.x,ly=cp.y-2.55;
    const d=Math.hypot(p.cx-lx,(p.bottom-cp.y)*1.6);
    this.nearK=damp(this.nearK,d<LAMP.near&&!p.dead?1:0,6,dt);
    const hurt=gs.hp<gs.maxHp();
    /* зов: раненый курьер видит фонарь издалека */
    if(hurt&&!this.seq&&d<LAMP.call&&!W.boss){
      this.callT-=dt;
      if(this.callT<=0){this.callT=2.1;
        g.particles.spawn({kind:'ring',x:lx,y:ly,ringR:3.2+this.nearK,life:1.6,size:0.12,col:'#ffcf7a',add:true,a:0.55});}
      /* искры тянутся к курьеру, когда он рядом */
      if(this.nearK>0.3&&Math.random()<dt*14){const a=Math.random()*TAU,r=0.3;
        g.particles.spawn({kind:'dust',x:lx+Math.cos(a)*r,y:ly+Math.sin(a)*r,vx:(p.cx-lx)*0.9,vy:(p.cy-ly)*0.9-0.5,
          life:1.05,size:0.06,col:'#ffd98a',drag:0.25,add:true,a:0.9});}
    }else this.callT=Math.min(this.callT,0.6);
    const S=this.seq;if(!S)return;
    S.t+=dt;
    /* шланг подцеплен: ячейки по одной */
    const t0=0.45;
    while(S.done<S.miss&&S.t>=t0+S.done*LAMP.cell){
      S.done++;gs.hp=Math.min(gs.maxHp(),gs.hp+1);g.hud.syncHp();g.hud.cellRefill(gs.hp-1);
      g.audio.lampCell(S.done);
      g.particles.spawn({kind:'ring',x:p.cx,y:p.cy,ringR:1.6,life:0.4,size:0.09,col:'#ffcf7a',add:true,a:0.85});
      for(let i=0;i<10;i++){const k=Math.random();
        g.particles.spawn({kind:'spark',x:lerp(lx,p.cx,k),y:lerp(ly,p.cy,k)-Math.sin(k*PI)*0.6,vx:(p.cx-lx)*1.4,vy:(p.cy-ly)*1.4,
          life:0.3,size:0.05,col:'#ffe6a3',add:true});}
    }
    if(S.t>=S.dur){
      this.seq=null;gs.hp=gs.maxHp();g.hud.syncHp();g.hud.lampRest(false);
      W.slain={};gs.save();g.hud.saved();g.audio.checkpoint();
      g.particles.spawn({kind:'ring',x:lx,y:ly,ringR:3.4,life:0.9,size:0.12,col:'#ffcf7a',add:true,a:0.8});
      g.particles.burst(p.cx,p.cy,18,{kind:'dust',col:'#ffd79a',spd:1.4,life:1.2,size:0.05,add:true,drag:1.6,g:-1});
    }
  }
  /* после света: колпак, табличка с ячейками, выбитая клавиша, шланг */
  drawLive(c,R,t){
    const g=this.game,cp=R.checkpoint;if(!cp)return;
    const W=g.world,p=W.player,gs=g.gs,x=cp.x,y=cp.y,nk=this.nearK,S=this.seq;
    const lit=cp.lit||gs.cp.room===R.id,hurt=gs.hp<gs.maxHp(),fl=0.85+0.15*Math.sin(t*7.3)*Math.sin(t*3.1);
    const glow=(lit?0.55:0.3)+0.45*nk+(S?0.35:0);
    /* колпак: тёплое ядро, ореол */
    const ly=y-2.55;
    c.save();c.globalCompositeOperation='lighter';
    const gr=c.createRadialGradient(x,ly,0,x,ly,1.6+0.6*nk);
    gr.addColorStop(0,rgba('#fff2d0',0.85*glow*fl));gr.addColorStop(0.25,rgba('#ffcf7a',0.45*glow));gr.addColorStop(1,'rgba(255,160,60,0)');
    c.fillStyle=gr;c.beginPath();c.arc(x,ly,1.6+0.6*nk,0,TAU);c.fill();c.restore();
    g.renderer.glowAdd(x,ly,2.2+nk,'#ffcf7a',0.4+0.4*glow);
    /* табличка: те же скошенные ячейки, что в HUD; пустые мигают, наполненные горят */
    const n=gs.maxHp(),cw=0.17,gap=0.05,pw=n*(cw+gap)+0.18,px=x-pw/2,py=y-1.62;
    c.fillStyle='rgba(16,12,8,.92)';rr(c,px,py,pw,0.42,0.05);c.fill();
    c.strokeStyle=rgba('#e8c96a',0.55+0.4*nk);c.lineWidth=0.03;rr(c,px,py,pw,0.42,0.05);c.stroke();
    for(let i=0;i<n;i++){const cx=px+0.12+i*(cw+gap),on=i<gs.hp,blink=!on&&(nk>0.2||S)?0.35+0.35*Math.sin(t*6+i):0;
      c.save();c.translate(cx,py+0.1);c.transform(1,0,-0.25,1,0,0);
      c.fillStyle=on?'#ffb45a':rgba('#ffcf7a',0.12+blink);c.fillRect(0,0,cw,0.22);
      c.strokeStyle='rgba(232,201,106,.7)';c.lineWidth=0.018;c.strokeRect(0,0,cw,0.22);c.restore();
      if(on&&nk>0.1)g.renderer.glowAdd(cx+cw/2,py+0.21,0.3,'#ffb45a',0.25*nk);}
    /* выбитая на латуни клавиша действия — только когда курьер рядом */
    if(nk>0.05&&!S){const kx=x,ky=py-0.52,a=clamp(nk,0,1),key=g.input.usingPad()?'Y':'E';
      c.save();c.globalAlpha=a;
      c.fillStyle='#211a10';rr(c,kx-0.26,ky-0.26,0.52,0.52,0.06);c.fill();
      c.fillStyle='rgba(232,201,106,.55)';c.fillRect(kx-0.21,ky+0.18,0.42,0.05);
      c.strokeStyle=rgba('#ffe6a3',0.7+0.3*Math.sin(t*4));c.lineWidth=0.04;rr(c,kx-0.26,ky-0.26,0.52,0.52,0.06);c.stroke();
      c.fillStyle='#fff3d2';c.font='500 0.34px Oswald';c.textAlign='center';c.textBaseline='middle';c.fillText(key,kx,ky);
      c.restore();g.renderer.glowAdd(kx,ky,0.7,'#e8c96a',0.3*a);}
    /* шланг колонки к ранцу курьера */
    if(S&&p){const hx=x+0.2,hy=y-1.1,k=clamp(S.t/0.3,0,1),tx=lerp(hx,p.cx-p.face*0.3,k),ty=lerp(hy,p.bottom-p.h*0.62,k);
      c.strokeStyle='#2b2620';c.lineWidth=0.09;c.beginPath();c.moveTo(hx,hy);c.quadraticCurveTo((hx+tx)/2,Math.max(hy,ty)+0.6,tx,ty);c.stroke();
      c.strokeStyle=rgba('#ffcf7a',0.5+0.4*Math.sin(t*20));c.lineWidth=0.03;c.beginPath();c.moveTo(hx,hy);c.quadraticCurveTo((hx+tx)/2,Math.max(hy,ty)+0.6,tx,ty);c.stroke();
      g.renderer.glowAdd(tx,ty,0.8,'#ffcf7a',0.5);}
    void hurt;
  }
}
