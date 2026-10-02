/* Сводка комнат: размеры, двери (куда, где, условия), фонарь, предметы, враги.
   node tools/rooms.js [префикс]   — например: node tools/rooms.js z2_ */
'use strict';
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const pre=process.argv[2]||'';
  const {srv,url}=await serve();
  const L=await launch({w:800,h:450});
  try{
    await openGame(L.page,url);
    const out=await L.page.evaluate(pre=>{
      const r=[],gs=game.gs;
      for(const id of Object.keys(ROOMDEFS)){if(!id.startsWith(pre))continue;
        const R=new Room(ROOMDEFS[id],gs);R.id=id;
        const f=v=>Math.round(v*10)/10;
        r.push(id+' '+R.zone+'/'+(R.sub||'-')+' '+R.w+'x'+R.h+' «'+R.name+'»'+(R.secret?' SECRET':'')+(R.checkpoint?' LAMP@'+f(R.checkpoint.x):'')+
          '\n   doors: '+R.doors.map(d=>(d.to||'-')+'@'+f(d.x)+','+f(d.y+d.h)+(d.down?'v':'')+(d.fall?'F':'')+(d.oneway?'1w':'')+(d.elevator?'E':'')+
            (d.reqFlag?' req:'+d.reqFlag:'')+(d.reqAbility?' ab:'+d.reqAbility:'')+(d.req?' r:'+d.req:'')+(d.latch?' latch:'+d.latch+(d.latchHere?'(here)':''):'')+(d.link?' ln:'+d.link:'')).join(' | ')+
          '\n   items: '+R.interactables.map(i=>i.kind+(i.ability?':'+i.ability:'')+(i.upgrade?':'+i.upgrade:'')+(i.loreId?':#'+i.loreId:'')+(i.flag?'('+i.flag+')':'')).join(', ')+
          '\n   enemies: '+R.enemies.map(e=>e.type+(e.variant?'/'+e.variant:'')).join(',')+(R.boss?' BOSS:'+R.boss.type:'')+
          (R.anchors?' rings:'+R.anchors.length:'')+(R.magnetRects&&R.magnetRects.length?' magnet:'+R.magnetRects.length:'')+
          (R.solids.some(s=>s.grip)?' grip':'')+(R.pollen&&R.pollen.length?' pollen':''));}
      return r.join('\n');},pre);
    console.log(out);
  }finally{await L.browser.close();srv.close();}
})();
