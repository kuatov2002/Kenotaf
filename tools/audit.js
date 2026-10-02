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
    const T={doors:R.doors.map(d=>({id:d.label||d.to,to:d.to,r:d,hit:false,stand:false})),
      inters:W.interactables.map(it=>({id:it.def.label||it.def.title||it.def.kind,it:it,hit:false})),
      push:W.pushables.filter(p=>!p.pushed).map(pb=>({id:pb.id,pb:pb,hit:false})),ceil:0,
      targets:(opts.targets||[]).map(q=>({id:q.id,r:q,hit:false}))};
    const mark=p=>{
      const pr=p.rect();
      for(const t of T.doors){if(aabb(pr,t.r)){t.hit=true;if(p.onGround)t.stand=true;}}
      for(const t of T.inters){const r=t.it.rect();if(dist(p.cx,p.cy,r.x+r.w/2,r.y+r.h/2)<2.6)t.hit=true;}
      for(const t of T.push){const b=t.pb;const nx=clamp(p.cx,b.x,b.x+b.w),ny=clamp(p.cy,b.y,b.y+b.h);
        if(Math.hypot(nx-p.cx,ny-p.cy)<3.2)t.hit=true;}
      for(const t of T.targets)if(aabb(pr,t.r))t.hit=true;
      if(p.onCeil)T.ceil++;
    };
    const choke=p=>{if(!pollen.length)return false;
      const hd={x:p.cx-0.1,y:p.y+0.2,w:0.2,h:0.5};
      return !air.some(a=>aabb(hd,a))&&pollen.some(z=>aabb(hd,z));};
    const FI={h:{},p:{},consume(a){if(this.p[a]){this.p[a]=0;return true;}return false;},
      get move(){return (this.h.R?1:0)-(this.h.L?1:0);},get dn(){return !!this.h.D;},get up(){return !!this.h.U;},healHeld:false,get jumpHeld(){return !!this.h.J;},
      attackHeld:false,usingPad(){return false;}};
    const sim=(sx,sy,pol)=>{
      const p=new Player(W,sx,sy);W.player=p;R.playerRef=p;FI.h={};FI.p={};
      for(let i=0;i<10;i++)p.update(DT,FI);
      if(!p.onGround)return null;
      const s={jumped:false,dashed:false,dir:pol.dir,cool:0,ceilT:-1,done:false,fj:-1};
      for(let f=0;f<pol.max;f++){
        pol.fn(f,p,FI,s);
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
      if(has('hook')&&R.anchors&&R.anchors.length)for(const J of [-1,0,8,18,30])for(const after of ['none','dash','jump','chain'])pols.push({dir:d,max:700,fn:(f,p,I,s)=>{
        H(I,true);
        if(J>=0&&f===0)I.p.jump=1;I.h.J=J>=0&&f<36;
        const at=J<0?2:J+1;
        if(!s.hk&&f>=at&&!p.hook){I.p.hook=1;s.hk=1;s.hf=f;return;}
        if(s.hk===1&&p.hook)s.hk=2;
        if(s.hk===2&&!p.hook){s.hk=3;s.rf=f;}
        if(s.hk===3&&!p.onGround){
          if(after==='dash'&&f===s.rf+2&&has('dash'))I.p.dash=1;
          if(after==='jump'&&f===s.rf+3){I.p.jump=1;I.h.J=1;}
          if(after==='jump'&&f>s.rf+3&&f<s.rf+30)I.h.J=1;
          if(after==='chain'&&(f-s.rf)%10===4&&(s.n||0)<4){I.p.hook=1;s.n=(s.n||0)+1;s.hk=1;}}
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
    starts=starts.map(s=>settle(s)).filter(Boolean);
    const key=s=>Math.round(s.x/0.7)+':'+Math.round(s.y*4);
    const seen=new Set(),Q=[];
    for(const s of starts){const k=key(s);if(!seen.has(k)){seen.add(k);Q.push(s);}}
    const maxStates=opts.max||260,tl=opts.timeMs||25000;let n=0;
    while(Q.length&&n<maxStates&&performance.now()-t0<tl){
      const s=Q.shift();n++;
      for(const pol of pols){const e=sim(s.x,s.y,pol);if(!e)continue;const k=key(e);if(!seen.has(k)){seen.add(k);Q.push(e);}}
    }
    return {room:roomId,abil:abil.join('+')||'-',states:n,left:Q.length,ms:Math.round(performance.now()-t0),
      doors:T.doors.map(t=>t.id+(t.stand?' ✓':t.hit?' ~':' ✗')),
      inters:T.inters.map(t=>t.id+(t.hit?' ✓':' ✗')),
      push:T.push.map(t=>t.id+(t.hit?' ✓':' ✗')),ceil:T.ceil>0,
      /* для решателя мира (tools/progress.js): индексы как в R.doors / R.interactables / R.pushables */
      raw:{doors:T.doors.map(t=>t.hit),inters:T.inters.map(t=>t.hit),
        push:T.push.map(t=>({id:t.id,hit:t.hit})),targets:T.targets.map(t=>({id:t.id,hit:t.hit})),
        spots:[...seen].length}};
  }
};
