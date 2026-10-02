/* Производительность и утечки на 1920×1080 (headless, программная отрисовка — цифры пессимистичны).
   node tools/perf.js            — время кадра (обновление 2×1/120 + отрисовка) по комнатам всех зон и боссам;
                                  затем 60 переходов между комнатами: растёт ли что-нибудь (частицы, обломки,
                                  снаряды, узлы звука, таймеры, слои параллакса, куча JS). */
'use strict';
const {serve,launch,openGame}=require('./lib');
const ROOMS=['z1_start','z1_hub','z1_foundry','z1_boss','z2_atrium','z2_boss','z3_greenhouse','z3_orchard','z3_boss',
  'z4_antechamber','z4_clocktower','z4_boss','z5_hall','z5_council','z5_boss'];
(async()=>{
  const {srv,url}=await serve();const L=await launch({w:1920,h:1080,args:['--js-flags=--expose-gc']});
  try{
    await openGame(L.page,url);
    const res=await L.page.evaluate(async(ROOMS)=>{
      const g=game,W=g.world;g.gs.reset();for(const k of ABILITY_ORDER)g.gs.abilities[k]=true;
      document.getElementById('menu').classList.add('hidden');g.hud.show(true);g.state='play';g.input.enabled=true;
      g.resize();
      const spot=id=>{const R=new Room(ROOMDEFS[id],g.gs);if(R.bossTrigger)return [R.bossTrigger.x+2,R.bossTrigger.y+R.bossTrigger.h-1.72];
        if(R.checkpoint)return [R.checkpoint.x+1.2,R.checkpoint.y-1.72];const d=R.doors[0];return [d.x+(d.x<1?1.6:-1.2),d.y+d.h-1.72];};
      const frame=()=>{const t0=performance.now();
        for(let k=0;k<2;k++){W.update(1/120);}g.camera.update(1/60,W.player,W.room,g.vw,g.vh,g.ppm);g.hud.update(1/60);g.render(1/60);
        return performance.now()-t0;};
      const out={vw:g.vw,vh:g.vh,rooms:[]};
      for(const id of ROOMS){const [x,y]=spot(id);W.load(id,x,y);W.entryT=9;W.playerActed=true;
        for(let i=0;i<40;i++)frame();
        const ts=[];for(let i=0;i<180;i++){W.player.invuln=1e9;g.gs.hp=5;ts.push(frame());}
        ts.sort((a,b)=>a-b);const avg=ts.reduce((a,b)=>a+b,0)/ts.length;
        out.rooms.push({id,avg:+avg.toFixed(2),p95:+ts[Math.floor(ts.length*0.95)].toFixed(2),parts:g.particles.aliveCount,ents:W.enemies.length+(W.boss?1:0)});}
      /* утечки: туда-обратно 60 раз */
      const probe=()=>({parts:g.particles.aliveCount,debris:W.debris.length,proj:W.projectiles.length,zones:(W.zones||[]).length,
        timers:(W.timers||[]).length,audNodes:g.audio.amb?g.audio.amb.nodes.length:0,audTimers:g.audio.amb?g.audio.amb.timers.length:0,
        layers:W.parallax&&W.parallax.layers?Object.keys(W.parallax.layers).length:0,
        heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null});
      if(window.gc)window.gc();
      const a=probe();
      const pair=['z1_hub','z2_atrium','z3_greenhouse','z4_antechamber','z5_hall','z2_boss'];
      for(let n=0;n<60;n++){const id=pair[n%pair.length],[x,y]=spot(id);W.load(id,x,y);for(let i=0;i<8;i++)frame();}
      for(let i=0;i<240;i++)frame();
      if(window.gc)window.gc();await new Promise(r=>setTimeout(r,300));if(window.gc)window.gc();
      out.leak={before:a,after:probe()};
      return out;
    },ROOMS);
    console.log('кадр '+res.vw+'×'+res.vh+' (мс на кадр: обновление+отрисовка; 16.7 мс = 60 FPS)');
    for(const r of res.rooms)console.log('  '+r.id.padEnd(16)+' среднее '+String(r.avg).padStart(6)+'   95% '+String(r.p95).padStart(6)+'   частиц '+String(r.parts).padStart(4)+'   существ '+r.ents);
    console.log('утечки (до → после 60 переходов):');
    for(const k in res.leak.before)console.log('  '+k.padEnd(10)+' '+res.leak.before[k]+' → '+res.leak.after[k]);
    if(L.errors.length)console.log('ОШИБКИ СТРАНИЦЫ:\n  '+L.errors.slice(0,6).join('\n  '));
  }finally{await L.browser.close();srv.close();}
})();
