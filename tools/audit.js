"use strict";
/* ============================== LEVEL AUDIT (инструмент разработки) ==============================
   В игру не входит: tools/progress.js внедряет этот файл в страницу. */
/* Проверка проходимости на РЕАЛЬНОЙ физике игрока. Из точки входа перебираются
   макро-манёвры (шаг, прыжок с края, прыжок с рывком, отскоки когтями, магнит),
   BFS по точкам приземления. Ответ: какие двери / объекты / цели импульса достижимы
   с данным набором способностей. Враги и боссы не учитываются, опасности = провал. */
const LevelAudit={
  run(roomId,abil,opts){
    opts=opts||{};
    const g=game,W=g.world,gs=g.gs;
    const keep={ab:gs.abilities,fl:gs.flags,st:g.state,od:g.onPlayerDeath,room:W.room,pl:W.player,
      it:W.interactables,pu:W.pushables,ps:g.particles.spawn,pb:g.particles.burst,ar:g.audio.ready};
    gs.abilities={};for(const a of abil)gs.abilities[a]=true;
    gs.flags=Object.assign({},keep.fl,opts.flags||{});
    g.particles.spawn=()=>null;g.particles.burst=()=>{};g.audio.ready=false;g.state='play';g.onPlayerDeath=()=>{};
    try{return this.bfs(roomId,abil,opts);}
    finally{gs.abilities=keep.ab;gs.flags=keep.fl;g.state=keep.st;g.onPlayerDeath=keep.od;
      W.room=keep.room;W.player=keep.pl;W.interactables=keep.it;W.pushables=keep.pu;
      if(W.room)W.room.playerRef=W.player;g.particles.spawn=keep.ps;g.particles.burst=keep.pb;g.audio.ready=keep.ar;}
  },
  bfs(roomId,abil,opts){
    const g=game,W=g.world,DT=1/120,t0=performance.now();
    const R=new Room(ROOMDEFS[roomId],g.gs);R.id=roomId;W.room=R;
    W.interactables=R.interactables.map(d=>new Interactable(d,W));
    W.pushables=R.pushables.map(d=>new Pushable(d,W));
    const hz=R.hazards.filter(h=>h.kind!=='steam'||opts.steam);R.hazards=[];
    const has=a=>abil.indexOf(a)>=0;
    /* без фильтра облако пыльцы непроходимо (как в игре: удушье и откат к краю облака);
       продувочная колонна (R.air) защищает и без фильтра */
    const pollen=has('filter')?[]:(R.pollen||[]),air=R.air||[];
    const T={doors:R.doors.map(d=>({id:d.label||d.to,to:d.to,r:d,hit:false,stand:false,open:!game.gates.doorLocked(d)||!!d.fall})),
      inters:W.interactables.map(it=>({id:it.def.label||it.def.title||it.def.kind,it:it,hit:false})),
      push:W.pushables.filter(p=>!p.pushed).map(pb=>({id:pb.id,pb:pb,hit:false})),ceil:0,
      targets:(opts.targets||[]).map(q=>({id:q.id,r:q,hit:false}))};
    /* попадания копятся в H (текущий прогон); в T — только подтверждённые */
    let H=null;
    const mark=p=>{
      const pr=p.rect(),h=H||(H={});
      T.doors.forEach((t,i)=>{if(aabb(pr,t.r)){h['d'+i]=1;if(p.onGround)h['s'+i]=1;}});
      T.inters.forEach((t,i)=>{const r=t.it.rect();if(dist(p.cx,p.cy,r.x+r.w/2,r.y+r.h/2)<2.6)h['i'+i]=1;});
      T.push.forEach((t,i)=>{const b=t.pb;const nx=clamp(p.cx,b.x,b.x+b.w),ny=clamp(p.cy,b.y,b.y+b.h);
        if(Math.hypot(nx-p.cx,ny-p.cy)<3.2)h['p'+i]=1;});
      T.targets.forEach((t,i)=>{if(aabb(pr,t.r))h['t'+i]=1;});
      if(p.onCeil)T.ceil++;
    };
    const commit=h=>{for(const k in h){const i=+k.slice(1),c=k[0];
      if(c==='d')T.doors[i].hit=true;else if(c==='s')T.doors[i].stand=true;else if(c==='i')T.inters[i].hit=true;
      else if(c==='p')T.push[i].hit=true;else if(c==='t')T.targets[i].hit=true;}};
    const choke=p=>{if(!pollen.length)return false;
      const hd={x:p.cx-0.1,y:p.y+0.2,w:0.2,h:0.5};
      return !air.some(a=>aabb(hd,a))&&pollen.some(z=>aabb(hd,z));};
    const FI={h:{},p:{},consume(a){if(this.p[a]){this.p[a]=0;return true;}return false;},
      get move(){return (this.h.R?1:0)-(this.h.L?1:0);},get dn(){return !!this.h.D;},get up(){return !!this.h.U;},healHeld:false,get jumpHeld(){return !!this.h.J;},
      attackHeld:false,usingPad(){return false;}};
    /* pert: {dx — сдвиг старта, skew — на сколько кадров (1/60) запаздывают все нажатия после первого} */
    const sim=(sx,sy,pol,pert)=>{
      H={};
      const p=new Player(W,sx+(pert?pert.dx||0:0),sy);W.player=p;R.playerRef=p;FI.h={};FI.p={};
      for(let i=0;i<10;i++)p.update(DT,FI);
      if(!p.onGround){H=null;return pert?'nostart':null;}
      const s={jumped:false,dashed:false,dir:pol.dir,cool:0,ceilT:-1,done:false,fj:-1};
      const skew=pert?pert.skew||0:0,pend=[];let first=true;
      for(let f=0;f<pol.max;f++){
        if(skew){const P0=Object.assign({},FI.p);pol.fn(f,p,FI,s);
          for(const k in FI.p){if(FI.p[k]&&!P0[k]){if(first)first=false;else{pend.push({k,at:f+skew});FI.p[k]=0;}}}
          for(let i=pend.length-1;i>=0;i--)if(pend[i].at<=f){FI.p[pend[i].k]=1;pend.splice(i,1);}}
        else pol.fn(f,p,FI,s);
        if(s.done&&p.onGround&&!p.onCeil){FI.h.L=false;FI.h.R=false;}
        for(let k=0;k<2;k++){p.update(DT,FI);
          if(p.y>R.h+1||p.x<-3||p.x>R.w+3)return null;
          for(let i=0;i<hz.length;i++)if(aabb(p,hz[i]))return null;
          if(choke(p))return null;
          mark(p);}
        if(s.done&&p.onGround&&!p.onCeil&&!p.crouch&&Math.abs(p.vx)<0.05)return {x:p.x,y:p.y};
      }
      return p.onGround&&!p.onCeil&&!p.crouch?{x:p.x,y:p.y}:null;
    };
    const pols=[];
    for(const d of [-1,1]){
      const H=(I,on)=>{I.h.L=on&&d<0;I.h.R=on&&d>0;};
      for(const T2 of [10,40])pols.push({dir:d,max:200,fn:(f,p,I,s)=>{H(I,f<T2);if(f>=T2)s.done=true;}});
      const dashes=has('dash')?[-1,7,13,20]:[-1];
      for(const J of dashes)pols.push({dir:d,max:320,fn:(f,p,I,s)=>{H(I,true);
        if(!s.jumped){if(!p.onGround&&f>1){I.p.jump=1;I.h.J=1;s.jumped=true;s.fj=f;}if(f>220)s.done=true;}
        else{I.h.J=(f-s.fj)<40;if(J>=0&&!s.dashed&&f-s.fj>=J){I.p.dash=1;s.dashed=true;}if(f-s.fj>4)s.done=true;}}});
      pols.push({dir:d,max:200,fn:(f,p,I,s)=>{H(I,true);if(f===8)I.p.jump=1;I.h.J=f>=8&&f<48;if(f>12)s.done=true;}});
      pols.push({dir:d,max:200,fn:(f,p,I,s)=>{if(f===0)I.p.jump=1;I.h.J=f<40;H(I,true);if(f>4)s.done=true;}});
      pols.push({dir:d,max:200,fn:(f,p,I,s)=>{if(f===0)I.p.jump=1;I.h.J=f<40;H(I,f>=14);if(f>4)s.done=true;}});
      pols.push({dir:d,max:200,fn:(f,p,I,s)=>{if(f===0)I.p.jump=1;I.h.J=f<3;H(I,true);if(f>4)s.done=true;}});
      if(has('dash'))pols.push({dir:d,max:200,fn:(f,p,I,s)=>{H(I,true);if(f===2)I.p.dash=1;if(f>8)s.done=true;}});
      /* подкат на бегу и «гусиный шаг» под низкими перекрытиями */
      for(const T2 of [40,110])pols.push({dir:d,max:260,fn:(f,p,I,s)=>{H(I,f<T2);I.h.D=f>=8&&f<T2;if(f>=T2){I.h.D=false;s.done=true;}}});
      /* ползти по низкому каналу, пока над головой не освободится место */
      pols.push({dir:d,max:900,fn:(f,p,I,s)=>{
        if(s.done){H(I,false);I.h.D=false;return;}
        H(I,true);I.h.D=f>=8;
        const t={x:p.x+0.03,y:p.bottom-CFG.player.h+0.02,w:p.w-0.06,h:CFG.player.h-0.04};
        const free=!R.solids.some(q=>!q.ow&&!q.hidden&&aabb(t,q));
        if(!free)s.blk=true;
        if(s.blk&&free&&f>12){s.done=true;H(I,false);I.h.D=false;}}});
      /* отскок от клапанов-отбойников: прыжок (или шаг с края), над головкой — удар вниз */
      if(R.pogos&&R.pogos.length)for(const J of [true,false])for(const lag of [0,12])pols.push({dir:d,max:520,fn:(f,p,I,s)=>{
        H(I,f>=lag);
        if(J&&f===0)I.p.jump=1;I.h.J=J&&f<30;
        const tg=R.pogos.find(q=>Math.abs(q.x-p.cx)<0.75&&q.y-p.bottom>-0.25&&q.y-p.bottom<1.6);
        I.h.D=!!tg&&!p.onGround;
        if(s.cool>0)s.cool--;
        if(tg&&!p.onGround&&p.vy>-3&&s.cool<=0){I.p.attack=1;s.cool=14;}
        if(f>8&&p.onGround)s.done=true;}});
      if(has('claws')){
        for(const flip of [true,false])pols.push({dir:d,max:700,fn:(f,p,I,s)=>{
          if(s.cool>0)s.cool--;
          I.h.L=s.dir<0;I.h.R=s.dir>0;
          if(!s.jumped){if(f===3||(!p.onGround&&f>0)){I.p.jump=1;s.jumped=true;s.fj=f;}I.h.J=1;return;}
          I.h.J=1;
          if(!p.onGround&&p.gripDir!==0&&s.cool===0){I.p.jump=1;if(flip)s.dir=-p.gripDir;s.cool=7;}
          if(f-s.fj>8)s.done=true;}});
      }
      /* гарпун: с места или из прыжка (на разной высоте); после отпускания — цепочка к следующему рыму,
         рывок или выхлоп дальше по ходу */
      if(has('hook')&&R.anchors&&R.anchors.length)for(const J of [-1,0,8,18,30])for(const after of ['none','brake','dash','jump','chain','flip'])pols.push({dir:d,max:700,fn:(f,p,I,s)=>{
        I.h.L=s.dir<0;I.h.R=s.dir>0;
        if(J>=0&&f===0)I.p.jump=1;I.h.J=J>=0&&f<36;
        const at=J<0?2:J+1;
        if(!s.hk&&f>=at&&!p.hook){I.p.hook=1;s.hk=1;s.hf=f;return;}
        if(s.hk===1&&p.hook)s.hk=2;
        if(s.hk===2&&!p.hook){s.hk=3;s.rf=f;}
        if(s.hk===3&&after==='brake'){I.h.L=false;I.h.R=false;}
        if(s.hk===3&&!p.onGround){
          if(after==='dash'&&f===s.rf+2&&has('dash'))I.p.dash=1;
          if(after==='jump'&&f===s.rf+3){I.p.jump=1;I.h.J=1;}
          if(after==='jump'&&f>s.rf+3&&f<s.rf+30)I.h.J=1;
          if(after==='chain'&&(f-s.rf)%10===4&&(s.n||0)<4){I.p.hook=1;s.n=(s.n||0)+1;s.hk=1;}
          if(after==='flip'&&f===s.rf+2&&(s.n||0)<3){s.dir=-s.dir;s.n=(s.n||0)+1;}
          if(after==='flip'&&f===s.rf+5&&(s.n||0)<=3){I.p.hook=1;s.hk=1;}}
        if(s.hk>=1&&f>at+6)s.done=true;}});
      /* выхлоп: второй прыжок в воздухе на разной высоте, иногда с рывком следом */
      if(has('vjump'))for(const J2 of [6,14,24,34])for(const dsh of (has('dash')?[false,true]:[false]))pols.push({dir:d,max:400,fn:(f,p,I,s)=>{
        H(I,true);if(f===0)I.p.jump=1;
        if(f===J2){I.p.jump=1;}
        I.h.J=f<J2+40;
        if(dsh&&f===J2+10)I.p.dash=1;
        if(f>J2+2)s.done=true;}});
      if(has('magnet'))for(const T2 of [25,80,220])for(const mov of [false,true])pols.push({dir:d,max:520,fn:(f,p,I,s)=>{
        if(f===0)I.p.jump=1;
        if(p.onCeil){if(s.ceilT<0)s.ceilT=f;I.h.J=0;H(I,f-s.ceilT<T2);if(f-s.ceilT>=T2){I.p.jump=1;s.done=true;}}
        else if(s.ceilT<0){I.h.J=1;H(I,mov);if(f>100)s.done=true;}
        else{I.h.J=0;H(I,false);s.done=true;}}});
    }
    let starts=opts.starts;
    if(!starts){const ds=R.doors.filter(d=>!opts.from||(d.label||'').indexOf(opts.from)>=0||d.to===opts.from);
      starts=(ds.length?ds:R.doors).slice(0,opts.from?1:99).map(d=>doorArrival(R,d));}
    /* вход сверху (провал, люк в своде): игрок прибывает в воздухе — сперва дать ему упасть */
    const settle=s=>{const p=new Player(W,s.x,s.y);W.player=p;R.playerRef=p;FI.h={};FI.p={};
      for(let i=0;i<720;i++){p.update(DT,FI);
        if(p.y>R.h+1||hz.some(h=>aabb(p,h))||choke(p))return null;
        mark(p);if(p.onGround&&i>2)return {x:p.x,y:p.y};}
      return null;};
    H={};starts=starts.map(s=>settle(s)).filter(Boolean);commit(H);H=null;
    const key=s=>Math.round(s.x/0.7)+':'+Math.round(s.y*4);
    const seen=new Set(),Q=[],pos={},E={},startKeys=new Set(),exitK=new Set();
    for(const s of starts){const k=key(s);startKeys.add(k);if(!seen.has(k)){seen.add(k);Q.push(s);pos[k]=s;}}
    const maxStates=opts.max||260,tl=opts.timeMs||25000;let n=0;
    while(Q.length&&n<maxStates&&performance.now()-t0<tl){
      const s=Q.shift(),sk=key(s);n++;const out=E[sk]=[];
      for(let pi=0;pi<pols.length;pi++){const pol=pols[pi];const e=sim(s.x,s.y,pol);const h=H;H=null;
        const ek=e?key(e):null,hk=h&&Object.keys(h).length?h:null;
        if(!opts.strict&&hk)commit(hk);
        if(hk&&Object.keys(hk).some(q=>q[0]==='d'&&T.doors[+q.slice(1)].open))exitK.add(sk);
        if(!e&&!hk)continue;
        out.push({pi,ek,h:hk});
        if(e&&!seen.has(ek)){seen.add(ek);Q.push(e);pos[ek]=e;}}
    }
    /* ЛОВУШКИ: состояния, откуда ни одним манёвром не добраться до двери (только смерть / сброс) */
    const canExit=new Set(exitK);{let ch=true;while(ch){ch=false;
      for(const sk in E){if(canExit.has(sk))continue;if(E[sk].some(q=>q.ek&&canExit.has(q.ek))){canExit.add(sk);ch=true;}}}}
    const traps=[...seen].filter(k=>E[k]&&!canExit.has(k)).map(k=>({x:+pos[k].x.toFixed(1),y:+pos[k].y.toFixed(1)}));
    /* СТРОГО: переход засчитывается, только если он не требует пиксельной точности —
       повторяется при сдвиге старта на ±0.3 м и при запаздывании нажатий на 3 кадра (50 мс) */
    let strictN=0,fragile=0,checks=0;
    if(opts.strict){
      const near=(a,b)=>a&&b&&Math.abs(a.x-b.x)<=1.05&&Math.abs(a.y-b.y)<=0.35;
      const PERT=[{dx:-0.3},{dx:0.3},{skew:3}];
      const robust=(s,ed)=>{checks++;let ok=0,valid=0;const need=ed.h?Object.keys(ed.h).filter(q=>q[0]!=='s'):[];
        for(const pt of PERT){const e=sim(s.x,s.y,pols[ed.pi],pt);const h=H||{};H=null;if(e==='nostart')continue;valid++;
          const landOk=!ed.ek||near(e,pos[ed.ek]),hitOk=need.every(q=>h[q]);if(landOk&&hitOk)ok++;}
        return ok>=2||(valid<=1&&ok>=valid&&valid>0);};
      const S=new Set(),SQ=[];for(const k of startKeys)if(pos[k]&&!S.has(k)){S.add(k);SQ.push(k);}
      const doneHit=new Set();
      while(SQ.length&&performance.now()-t0<tl*3){const sk=SQ.shift(),s=pos[sk];
        for(const ed of (E[sk]||[])){
          const newState=ed.ek&&!S.has(ed.ek),newHit=ed.h&&Object.keys(ed.h).some(q=>!doneHit.has(q));
          if(!newState&&!newHit)continue;
          if(!robust(s,ed)){fragile++;continue;}
          if(ed.h){commit(ed.h);for(const q in ed.h)doneHit.add(q);}
          if(newState){S.add(ed.ek);SQ.push(ed.ek);}}}
      strictN=S.size;}
    return {room:roomId,abil:abil.join('+')||'-',states:n,left:Q.length,ms:Math.round(performance.now()-t0),
      traps,strict:!!opts.strict,strictStates:strictN,fragile,checks,
      doors:T.doors.map(t=>t.id+(t.stand?' ✓':t.hit?' ~':' ✗')),
      inters:T.inters.map(t=>t.id+(t.hit?' ✓':' ✗')),
      push:T.push.map(t=>t.id+(t.hit?' ✓':' ✗')),ceil:T.ceil>0,
      /* для решателя мира (tools/progress.js): индексы как в R.doors / R.interactables / R.pushables */
      raw:{doors:T.doors.map(t=>t.hit),inters:T.inters.map(t=>t.hit),
        push:T.push.map(t=>({id:t.id,hit:t.hit})),targets:T.targets.map(t=>({id:t.id,hit:t.hit})),
        spots:[...seen].length}};
  }
};
