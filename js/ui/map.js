"use strict";
/* ============================== WORLD MAP (пауза) ============================== */
/* Планшет курьера: только то, где он был сам. Комната — контур в масштабе, двери — зарубки,
   связи — линии между дверями. Точки интереса: фонари (отдых), станции пневмопочты, залы стражей,
   тайники. Неисследованный выход — обрубок со знаком «?». Терминал-схема в хабе добавляет одно:
   отметки невзятых находок в уже пройденных залах своего яруса. Мини-карты нет. */
class WorldMap{
  constructor(game){this.game=game;this.cache={};this.whole=false;}
  /* регион схемы — по номеру комнаты (тамбур Эдема нарисован свинцом Печати, но это Эдем) */
  region(id){if(id==='z5_surface')return 'surface';return {'1':'sump','2':'hives','3':'eden','4':'seal','5':'archive'}[id[1]]||'sump';}
  sig(){const gs=this.game.gs;return JSON.stringify(gs.flags)+JSON.stringify(gs.bosses)+JSON.stringify(gs.abilities);}
  info(id,sig){
    const c=this.cache[id];if(c&&c.sig===sig)return c;
    let R=null;try{R=new Room(ROOMDEFS[id],this.game.gs);R.id=id;}catch(e){return null;}
    const o={sig,id,w:R.w,h:R.h,zone:R.zone,name:R.name,solids:R.solids.filter(s=>!s.hidden),
      doors:R.doors,hazards:R.hazards||[],pollen:R.pollen||[],cp:R.checkpoint,R,
      stations:(R.interactables||[]).filter(d=>d.kind==='station')};
    this.cache[id]=o;return o;
  }
  shown(id){const gs=this.game.gs;return !!(MAPLAYOUT[id]&&ROOMDEFS[id]&&gs.visited[id]);}
  zoneOf(id){const c=this.cache[id];if(c)return c.zone;
    return id[1]==='1'?'sump':id[1]==='2'?'hives':id[1]==='3'?(id==='z3_airlock'?'seal':'eden'):id[1]==='4'?'seal':(id==='z5_surface'?'surface':'archive');}
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
          c.strokeStyle=g.gates.doorLocked(d)&&!d.oneway?'rgba(255,110,80,.55)':'rgba(232,201,106,.55)';c.lineWidth=2*dpr;
          c.beginPath();c.moveTo(X(ax),Y(ay));c.lineTo(X(ex),Y(ey));c.stroke();
          c.fillStyle='rgba(232,201,106,.75)';c.font='600 '+Math.round(11*dpr)+'px Oswald';c.textAlign='center';c.textBaseline='middle';
          c.fillText('?',X(ex+dirx*2.2),Y(ey+diry*2.2));
        }
      }}
    /* комнаты: контур и тон зоны, без внутренней геометрии */
    const icon=(kind,x,y,on)=>{const r=4.2*dpr;c.save();c.translate(x,y);
      if(kind==='lamp'){c.fillStyle=on?'#ffcf7a':'rgba(232,201,106,.7)';c.beginPath();c.moveTo(0,-r*1.2);c.lineTo(r*0.8,0);c.lineTo(0,r*1.2);c.lineTo(-r*0.8,0);c.closePath();c.fill();
        if(on){c.strokeStyle='rgba(255,207,122,.5)';c.lineWidth=1.5*dpr;c.beginPath();c.arc(0,0,r*1.9,0,TAU);c.stroke();}}
      else if(kind==='station'){c.fillStyle=on?'#9fe0ff':'rgba(159,224,255,.4)';rr(c,-r*1.2,-r*0.7,r*2.4,r*1.4,r*0.7);c.fill();}
      else if(kind==='boss'){c.strokeStyle=on?'#ff6e50':'rgba(200,190,170,.45)';c.lineWidth=2*dpr;c.beginPath();c.arc(0,0,r*1.5,0,TAU);c.stroke();
        for(let k=0;k<8;k++){const q=k/8*TAU;c.beginPath();c.moveTo(Math.cos(q)*r*1.5,Math.sin(q)*r*1.5);c.lineTo(Math.cos(q)*r*2.1,Math.sin(q)*r*2.1);c.stroke();}
        if(!on){c.beginPath();c.moveTo(-r,-r);c.lineTo(r,r);c.moveTo(r,-r);c.lineTo(-r,r);c.stroke();}}
      else if(kind==='secret'){c.fillStyle='#e8c96a';c.beginPath();for(let k=0;k<10;k++){const q=-PI/2+k/10*TAU,rr2=k%2?r*0.5:r*1.3;c.lineTo(Math.cos(q)*rr2,Math.sin(q)*rr2);}c.closePath();c.fill();}
      else if(kind==='item'){c.fillStyle='#f0e6c8';c.beginPath();c.arc(0,0,r*0.7,0,TAU);c.fill();c.strokeStyle='rgba(240,230,200,.45)';c.lineWidth=1.2*dpr;c.beginPath();c.arc(0,0,r*1.4,0,TAU);c.stroke();}
      c.restore();};
    for(const id in infos){const i=infos[id],L=MAPLAYOUT[id];
      const rx=X(L[0]),ry=Y(L[1]),rw=i.w*sc,rh=i.h*sc,secret=!!MAPSECRET[id];
      c.fillStyle=rgba(MAPTINT[this.region(id)]||'#555',id===cur?0.62:0.42);c.fillRect(rx,ry,rw,rh);
      c.strokeStyle=id===cur?'rgba(255,226,150,.95)':(secret?'rgba(232,201,106,.85)':'rgba(232,201,106,.5)');
      c.lineWidth=(id===cur?2.4:1.3)*dpr;if(secret)c.setLineDash([5*dpr,3*dpr]);
      c.strokeRect(rx+0.5,ry+0.5,rw-1,rh-1);c.setLineDash([]);
      /* имя комнаты — если влезает */
      {const fs=Math.round(Math.min(11*dpr,Math.max(7*dpr,sc*1.1)));c.font='500 '+fs+'px Oswald';
        const nm=i.name.split(' · ')[0];
        if(c.measureText(nm).width<rw-8*dpr&&rh>fs*2.2){c.textAlign='left';c.textBaseline='top';
          c.fillStyle='rgba(8,8,8,.55)';c.fillText(nm,rx+5*dpr,ry+4*dpr+1);
          c.fillStyle=id===cur?'#ffe9b0':'rgba(238,226,200,.8)';c.fillText(nm,rx+4*dpr,ry+4*dpr);}}
      /* двери — зарубки на кромке; запертые — красные */
      for(const d of i.doors){c.fillStyle=g.gates.doorLocked(d)&&!d.oneway?'#ff6e50':'#f6e8c6';
        c.fillRect(X(L[0]+d.x),Y(L[1]+d.y),Math.max(2.5*dpr,d.w*sc),Math.max(2.5*dpr,d.h*sc));}
      /* точки интереса */
      if(i.cp)icon('lamp',X(L[0]+i.cp.x),Y(L[1]+i.cp.y-i.cp.h*0.6),gs.cp.room===id);
      for(const st of i.stations)icon('station',X(L[0]+st.x),Y(L[1]+st.y-1),gs.flags.post_on&&gs.flags['st_'+st.station]);
      if(/_boss$/.test(id))icon('boss',rx+rw/2,ry+rh/2,!!i.R.boss);
      if(secret)icon('secret',rx+rw-8*dpr,ry+8*dpr);
      /* терминал-схема яруса: невзятые цилиндры и находки в пройденных залах */
      if(gs.flags['map_'+this.region(id)])for(const d of (i.R.interactables||[]))
        if(d.kind==='lore'||d.kind==='salvage')icon('item',X(L[0]+d.x),Y(L[1]+d.y-0.8));
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
