/* Внедряется в страницу игры инструментом tools/progress.js.
   Даёт решателю мира доступ к комнатам в произвольном состоянии прогресса. */
'use strict';
window.ProgressProbe={
  /* временно подменить состояние сохранения, выполнить fn, вернуть всё как было */
  withState(st,fn){
    const gs=game.gs,keep={ab:gs.abilities,fl:gs.flags,bo:gs.bosses,lo:gs.loreIds};
    gs.abilities={};for(const a of st.ab)gs.abilities[a]=true;
    gs.flags=Object.assign({},st.flags);gs.bosses=Object.assign({},st.bosses);gs.loreIds=Object.assign({},st.lore);
    try{return fn();}finally{gs.abilities=keep.ab;gs.flags=keep.fl;gs.bosses=keep.bo;gs.loreIds=keep.lo;}
  },
  build(id){const R=new Room(ROOMDEFS[id],game.gs);R.id=id;return R;},
  info(id,st){
    return this.withState(st,()=>{
      const R=this.build(id),W=game.world;
      const inters=R.interactables.map((d,i)=>{
        let can=true;
        if(d.kind==='salvage'||d.kind==='lever'||d.kind==='valve'||d.kind==='gauge'||d.kind==='wheel')can=!game.gs.flags[d.flag];
        else if(d.kind==='lore')can=!game.gs.loreIds[d.loreId];
        else if(d.kind==='talk')can=!game.gs.flags[d.flag];
        else if(d.kind==='stash')can=!game.gs.flags['stash_'+d.id];
        return {i,kind:d.kind,flag:d.flag||null,ability:d.ability||null,upgrade:d.upgrade||null,loreId:d.loreId||null,
          need:d.need||null,can,title:d.title||d.label||d.kind,id:d.id||null};});
      return {id,w:R.w,h:R.h,
        doors:R.doors.map((d,i)=>({i,to:d.to||null,label:d.label||'',locked:game.gates.doorLocked(d),latch:d.latch||null,latchHere:!!d.latchHere,
          oneway:d.oneway||null})),
        inters,
        push:R.pushables.filter(p=>!p.pushed).map(p=>({id:p.id,kind:p.kind,flag:p.flag||null})),
        waves:!!R.waves,clearFlag:R.clearFlag||null,guards:R.enemies.filter(e=>!e.amb).map(e=>e.variant||e.type),
        boss:R.boss?R.boss.type:null,trigger:R.bossTrigger||null};
    });
  },
  audit(id,st,starts,opts){
    return this.withState(st,()=>{
      const g=game,W=g.world;
      const keep={st:g.state,od:g.onPlayerDeath,room:W.room,pl:W.player,it:W.interactables,pu:W.pushables,
        ps:g.particles.spawn,pb:g.particles.burst,ar:g.audio.ready};
      g.particles.spawn=()=>null;g.particles.burst=()=>{};g.audio.ready=false;g.state='play';g.onPlayerDeath=()=>{};
      try{
        const R=this.build(id),targets=[];
        if(R.bossTrigger)targets.push(Object.assign({id:'boss'},R.bossTrigger));
        const r=LevelAudit.bfs(id,st.ab,Object.assign({starts,targets,max:(opts&&opts.max)||1400,timeMs:(opts&&opts.timeMs)||60000},opts||{}));
        return {states:r.states,left:r.left,ms:r.ms,raw:r.raw,traps:r.traps,fragile:r.fragile};
      }finally{g.state=keep.st;g.onPlayerDeath=keep.od;W.room=keep.room;W.player=keep.pl;W.interactables=keep.it;
        W.pushables=keep.pu;if(W.room)W.room.playerRef=W.player;g.particles.spawn=keep.ps;g.particles.burst=keep.pb;g.audio.ready=keep.ar;}
    });
  },
  /* где окажется игрок, войдя в дверь i комнаты id */
  arrival(id,i,st){
    return this.withState(st,()=>{
      const A=this.build(id),d=A.doors[i];if(!d||!d.to)return null;
      const B=this.build(d.to),td=pairDoor(B,id,d);
      const a=td?doorArrival(B,td):{x:d.tx,y:d.ty};
      return {to:d.to,x:a.x,y:a.y,paired:!!td};
    });
  },
  /* точка на полу под (x,y): куда встанет игрок, оказавшийся здесь (например, после боя с боссом) */
  floorAt(id,x,y,st){
    return this.withState(st,()=>{
      const R=this.build(id);let best=null;
      for(const s of R.solids){if(s.hidden||x<s.x||x>s.x+s.w||s.y<y)continue;if(best===null||s.y<best)best=s.y;}
      return best===null?null:{x:x-CFG.player.w/2,y:best-CFG.player.h};
    });
  },
  sources(){const o={};for(const k in ROOMDEFS)o[k]=ROOMDEFS[k].toString();return o;}
};
