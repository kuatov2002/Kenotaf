"use strict";
/* ============================== WORLD MAP (пауза) ============================== */
/* Схема-чертёж аркологии. Видны посещённые комнаты (и вся зона, если найдена её «схема яруса»):
   внутри — настоящая геометрия комнаты в масштабе (стены, настилы, хладагент, пыльца), двери,
   чекпоинты и станции пневмопочты. Неисследованный выход — оборванная линия со знаком «?». */
class WorldMap{
  constructor(game){this.game=game;this.cache={};this.whole=false;}
  /* регион схемы — по номеру комнаты (тамбур Эдема нарисован свинцом Печати, но это Эдем) */
  region(id){return {'1':'sump','2':'hives','3':'eden','4':'seal','5':'surface'}[id[1]]||'sump';}
  sig(){const gs=this.game.gs;return JSON.stringify(gs.flags)+JSON.stringify(gs.bosses)+JSON.stringify(gs.abilities);}
  info(id,sig){
    const c=this.cache[id];if(c&&c.sig===sig)return c;
    let R=null;try{R=new Room(ROOMDEFS[id],this.game.gs);R.id=id;}catch(e){return null;}
    const o={sig,id,w:R.w,h:R.h,zone:R.zone,name:R.name,solids:R.solids.filter(s=>!s.hidden),
      doors:R.doors,hazards:R.hazards||[],pollen:R.pollen||[],cp:R.checkpoint,R,
      stations:(R.interactables||[]).filter(d=>d.kind==='station')};
    this.cache[id]=o;return o;
  }
  shown(id){const gs=this.game.gs,r=ROOMDEFS[id];if(!MAPLAYOUT[id]||!r)return false;
    if(gs.visited[id])return true;
    return !!gs.flags['map_'+this.region(id)];}
  zoneOf(id){const c=this.cache[id];if(c)return c.zone;
    return id[1]==='1'?'sump':id[1]==='2'?'hives':id[1]==='3'?(id==='z3_airlock'?'seal':'eden'):id[1]==='4'?'seal':'surface';}
  render(cv){
    const g=this.game,gs=g.gs,dpr=Math.min(window.devicePixelRatio||1,2);
    const cw=Math.round(cv.clientWidth*dpr),ch=Math.round(cv.clientHeight*dpr);
    if(cw<10||ch<10)return;
    if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch;}
    const c=cv.getContext('2d'),W=cw,H=ch,sig=this.sig(),t=performance.now()/1000;
    c.setTransform(1,0,0,1,0,0);
    /* фон: синька технического чертежа */
    const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0d1418');bg.addColorStop(1,'#080c0f');
    c.fillStyle=bg;c.fillRect(0,0,W,H);
    const ids=Object.keys(MAPLAYOUT).filter(id=>this.shown(id));
    const cur=g.world.room?g.world.room.id:null;
    if(cur&&ids.indexOf(cur)<0&&MAPLAYOUT[cur])ids.push(cur);
    if(!ids.length){c.fillStyle='rgba(216,204,178,.5)';c.font=(14*dpr)+'px Oswald';c.textAlign='center';
      c.fillText('СХЕМА ПУСТА',W/2,H/2);return;}
    const infos={};for(const id of ids){const i=this.info(id,sig);if(i)infos[id]=i;}
    /* рамка: все показанные комнаты + запас; масштаб не больше 4 пикс/м, чтобы две комнаты не раздувались */
    /* по умолчанию — текущий регион крупно; клик / Tab — весь мир */
    const reg=cur?this.region(cur):null;
    const focus=Object.keys(infos).filter(id=>this.whole||!reg||this.region(id)===reg);
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const id of (focus.length?focus:Object.keys(infos))){const L=MAPLAYOUT[id],i=infos[id];x0=Math.min(x0,L[0]);y0=Math.min(y0,L[1]);x1=Math.max(x1,L[0]+i.w);y1=Math.max(y1,L[1]+i.h);}
    x0-=6;y0-=8;x1+=6;y1+=4;
    const pad=24*dpr,sc=Math.min((W-pad*2)/Math.max(1,x1-x0),(H-pad*2)/Math.max(1,y1-y0),9*dpr);
    const ox=W/2-((x0+x1)/2)*sc,oy=H/2-((y0+y1)/2)*sc;
    const X=x=>ox+x*sc,Y=y=>oy+y*sc;
    /* сетка 10 м */
    c.strokeStyle='rgba(120,170,200,.06)';c.lineWidth=1;c.beginPath();
    for(let gx=Math.floor((-ox/sc)/10)*10;X(gx)<W;gx+=10){c.moveTo(Math.round(X(gx))+0.5,0);c.lineTo(Math.round(X(gx))+0.5,H);}
    for(let gy=Math.floor((-oy/sc)/10)*10;Y(gy)<H;gy+=10){c.moveTo(0,Math.round(Y(gy))+0.5);c.lineTo(W,Math.round(Y(gy))+0.5);}
    c.stroke();
    /* связи дверей (под комнатами) */
    const done=new Set();
    c.lineCap='round';
    for(const id in infos){const i=infos[id],L=MAPLAYOUT[id];
      for(const d of i.doors){if(!d.to)continue;
        const ax=L[0]+d.x+d.w/2,ay=L[1]+d.y+d.h/2;
        const k=[id,d.to].sort().join('|')+(d.link||'');
        if(infos[d.to]&&MAPLAYOUT[d.to]){
          if(done.has(k))continue;done.add(k);
          const T=infos[d.to],td=pairDoor(T.R,id,d),TL=MAPLAYOUT[d.to];
          const bx=td?TL[0]+td.x+td.w/2:TL[0]+T.w/2,by=td?TL[1]+td.y+td.h/2:TL[1]+T.h/2;
          c.setLineDash(d.elevator?[4*dpr,4*dpr]:[]);
          c.strokeStyle=d.elevator?'rgba(143,214,255,.45)':'rgba(232,201,106,.4)';c.lineWidth=2*dpr;
          c.beginPath();c.moveTo(X(ax),Y(ay));c.lineTo(X(bx),Y(by));c.stroke();c.setLineDash([]);
        }else{
          /* выход в неизвестность: короткий обрубок наружу и «?» */
          const dirx=d.x<0.8?-1:(d.x+d.w>i.w-0.8?1:0),diry=dirx?0:(d.down?1:-1);
          const ex=ax+dirx*5,ey=ay+diry*5;
          c.strokeStyle=g.gates.doorLocked(d)?'rgba(255,110,80,.55)':'rgba(232,201,106,.55)';c.lineWidth=2*dpr;
          c.beginPath();c.moveTo(X(ax),Y(ay));c.lineTo(X(ex),Y(ey));c.stroke();
          c.fillStyle='rgba(232,201,106,.75)';c.font='600 '+Math.round(11*dpr)+'px Oswald';c.textAlign='center';c.textBaseline='middle';
          c.fillText('?',X(ex+dirx*2.2),Y(ey+diry*2.2));
        }
      }}
    /* комнаты */
    for(const id in infos){const i=infos[id],L=MAPLAYOUT[id],vis=!!gs.visited[id]||id===cur;
      const rx=X(L[0]),ry=Y(L[1]),rw=i.w*sc,rh=i.h*sc;
      c.save();c.beginPath();c.rect(rx,ry,rw,rh);c.clip();
      c.fillStyle=vis?rgba(MAPTINT[this.region(id)]||'#555',0.55):'rgba(60,70,80,.18)';c.fillRect(rx,ry,rw,rh);
      if(vis){
        for(const z of i.pollen){c.fillStyle='rgba(206,220,110,.32)';c.fillRect(X(L[0]+z.x),Y(L[1]+z.y),z.w*sc,z.h*sc);}
        for(const h of i.hazards){if(h.kind==='coolant'){c.fillStyle='rgba(105,214,143,.55)';c.fillRect(X(L[0]+h.x),Y(L[1]+h.y),h.w*sc,h.h*sc);}
          else if(h.kind==='pit'){c.fillStyle='rgba(0,0,0,.6)';c.fillRect(X(L[0]+h.x),Y(L[1]+h.y),h.w*sc,h.h*sc);}}
        for(const s of i.solids){c.fillStyle=s.ow?'rgba(20,16,12,.55)':'rgba(14,11,9,.92)';
          c.fillRect(X(L[0]+s.x),Y(L[1]+s.y),Math.max(1,s.w*sc),Math.max(1,(s.ow?Math.max(s.h,0.5):s.h)*sc));}
      }
      c.restore();
      c.strokeStyle=id===cur?'rgba(255,226,150,.95)':(vis?'rgba(232,201,106,.55)':'rgba(170,190,210,.3)');
      c.lineWidth=(id===cur?2.4:1.3)*dpr;if(!vis)c.setLineDash([3*dpr,3*dpr]);
      c.strokeRect(rx+0.5,ry+0.5,rw-1,rh-1);c.setLineDash([]);
      if(!vis)continue;
      /* имя комнаты — если влезает */
      {const fs=Math.round(Math.min(11*dpr,Math.max(7*dpr,sc*1.1)));c.font='500 '+fs+'px Oswald';
        const nm=i.name.split(' · ')[0];
        if(c.measureText(nm).width<rw-8*dpr&&rh>fs*2.2){c.textAlign='left';c.textBaseline='top';
          c.fillStyle='rgba(8,8,8,.55)';c.fillText(nm,rx+5*dpr,ry+4*dpr+1);
          c.fillStyle=id===cur?'#ffe9b0':'rgba(238,226,200,.8)';c.fillText(nm,rx+4*dpr,ry+4*dpr);}}
      /* двери — светлые зарубки на кромке */
      for(const d of i.doors){c.fillStyle=g.gates.doorLocked(d)?'#ff6e50':'#f6e8c6';
        c.fillRect(X(L[0]+d.x),Y(L[1]+d.y),Math.max(2,d.w*sc),Math.max(2,d.h*sc));}
      /* чекпоинт: латунный фонарь (горит, если это точка возврата) */
      if(i.cp){const lit=gs.cp.room===id,cx=X(L[0]+i.cp.x),cy=Y(L[1]+i.cp.y-i.cp.h*0.6);
        c.fillStyle=lit?'#ffcf7a':'rgba(232,201,106,.6)';c.beginPath();c.arc(cx,cy,(lit?4:3)*dpr,0,TAU);c.fill();
        if(lit){c.strokeStyle='rgba(255,207,122,.5)';c.lineWidth=1.5*dpr;c.beginPath();c.arc(cx,cy,7*dpr,0,TAU);c.stroke();}}
      /* станции пневмопочты: капсула */
      for(const s of i.stations){const sx=X(L[0]+s.x),sy=Y(L[1]+s.y-1),on=gs.flags.post_on&&gs.flags['st_'+s.station];
        c.fillStyle=on?'#9fe0ff':'rgba(159,224,255,.35)';rr(c,sx-5*dpr,sy-3*dpr,10*dpr,6*dpr,3*dpr);c.fill();}
    }
    /* подписи зон */
    const zones={};for(const id in infos){const L=MAPLAYOUT[id],rg=this.region(id),z=zones[rg]||(zones[rg]={x:1e9,y:1e9});
      z.x=Math.min(z.x,L[0]);z.y=Math.min(z.y,L[1]);}
    c.textAlign='left';c.textBaseline='bottom';c.font='500 '+Math.round(11*dpr)+'px Oswald';
    for(const z in zones){const Z=ZONES[z];if(!Z)continue;c.fillStyle='rgba(216,204,178,.75)';
      c.fillText((Z.num+' · '+Z.name).split('').join(String.fromCharCode(8202)),X(zones[z].x),Y(zones[z].y)-4*dpr);}
    c.textAlign='right';c.textBaseline='top';c.font='500 '+Math.round(10*dpr)+'px Oswald';c.fillStyle='rgba(216,204,178,.55)';
    c.fillText(this.whole?'ВЕСЬ МИР · КЛИК / TAB — ЗОНА':'ЗОНА · КЛИК / TAB — ВЕСЬ МИР',W-10*dpr,8*dpr);
    /* курьер */
    const p=g.world.player;
    if(cur&&p&&MAPLAYOUT[cur]){const L=MAPLAYOUT[cur],px=X(L[0]+p.cx),py=Y(L[1]+p.cy),k=0.5+0.5*Math.sin(t*5);
      c.fillStyle='rgba(200,69,47,'+(0.25+0.2*k)+')';c.beginPath();c.arc(px,py,(7+3*k)*dpr,0,TAU);c.fill();
      c.fillStyle='#ffdf9a';c.beginPath();c.arc(px,py,3.2*dpr,0,TAU);c.fill();
      c.strokeStyle='#8e2b1e';c.lineWidth=1.6*dpr;c.stroke();}
  }
}
