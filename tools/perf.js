/* Производительность и утечки на 1920×1080.
   node tools/perf.js --gpu   — настоящая видеокарта (D3D11/ANGLE): FPS настоящего цикла игры (requestAnimationFrame,
                                в headless не ограничен 60 — запас виден) и время отрисовки на CPU;
   node tools/perf.js         — то же программно (SwiftShader): цифры пессимистичны, годятся только для сравнения.
   Затем 60 переходов между комнатами: растёт ли что-нибудь (частицы, обломки, снаряды, зоны, таймеры,
   узлы и таймеры звука, слои параллакса, куча JS). */
'use strict';
const {serve,launch,openGame}=require('./lib');
const ROOMS=['z1_start','z1_hub','z1_foundry','z1_boss','z2_atrium','z2_boss','z3_greenhouse','z3_orchard','z3_boss',
  'z4_antechamber','z4_clocktower','z4_boss','z5_hall','z5_council','z5_boss'];
(async()=>{
  const {srv,url}=await serve();const L=await launch({w:1920,h:1080,gpu:process.argv.includes('--gpu'),args:['--js-flags=--expose-gc']});
  try{
    await openGame(L.page,url);
    const gpu=await L.page.evaluate(()=>{try{const c=document.createElement('canvas').getContext('webgl');const e=c.getExtension('WEBGL_debug_renderer_info');return c.getParameter(e.UNMASKED_RENDERER_WEBGL);}catch(e){return 'нет WebGL';}});
    console.log('графика: '+gpu);
    const res=await L.page.evaluate(async(ROOMS)=>{
      const g=game,W=g.world;g.gs.reset();for(const k of ABILITY_ORDER)g.gs.abilities[k]=true;
      document.getElementById('menu').classList.add('hidden');g.hud.show(true);g.state='play';g.input.enabled=true;
      g.resize();
      const spot=id=>{const R=new Room(ROOMDEFS[id],g.gs);if(R.bossTrigger)return [R.bossTrigger.x+2,R.bossTrigger.y+R.bossTrigger.h-1.72];
        if(R.checkpoint)return [R.checkpoint.x+1.2,R.checkpoint.y-1.72];const d=R.doors[0];return [d.x+(d.x<1?1.6:-1.2),d.y+d.h-1.72];};
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      const out={vw:g.vw,vh:g.vh,rooms:[]};
      /* настоящий цикл игры: кадры считаются по вызовам render, бой идёт сам (курьер неуязвим) */
      for(const id of ROOMS){const [x,y]=spot(id);W.load(id,x,y);W.entryT=9;W.playerActed=true;W.player.invuln=1e9;
        await wait(600);
        const rp=g.render.bind(g);let cnt=0,inR=0,worst=0,last=performance.now();const t0=last;
        g.render=function(dt){const a=performance.now();rp(dt);const b=performance.now();inR+=b-a;cnt++;worst=Math.max(worst,a-last);last=a;};
        await wait(2500);g.render=rp;W.player.invuln=1e9;g.gs.hp=5;
        const el=performance.now()-t0;
        out.rooms.push({id,fps:+(cnt/(el/1000)).toFixed(0),cpu:+(inR/Math.max(1,cnt)).toFixed(2),worst:+worst.toFixed(1),parts:g.particles.aliveCount,ents:W.enemies.length+(W.boss?1:0)});}
      /* утечки: 60 переходов */
      const probe=()=>({parts:g.particles.aliveCount,debris:W.debris.length,proj:W.projectiles.length,zones:(W.zones||[]).length,
        timers:(W.timers||[]).length,audNodes:g.audio.amb?g.audio.amb.nodes.length:0,audTimers:g.audio.amb?g.audio.amb.timers.length:0,
        layers:W.parallax&&W.parallax.layers?Object.keys(W.parallax.layers).length:0,
        heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null});
      if(window.gc)window.gc();
      const a=probe();
      const pair=['z1_hub','z2_atrium','z3_greenhouse','z4_antechamber','z5_hall','z2_boss'];
      for(let n=0;n<60;n++){const id=pair[n%pair.length],[x,y]=spot(id);W.load(id,x,y);await wait(60);}
      await wait(1500);
      if(window.gc)window.gc();await wait(300);if(window.gc)window.gc();
      out.leak={before:a,after:probe()};
      return out;
    },ROOMS);
    console.log('кадр '+res.vw+'×'+res.vh+' · FPS настоящего цикла (60 — цель) · отрисовка на CPU, мс · худший интервал, мс');
    for(const r of res.rooms)console.log('  '+r.id.padEnd(16)+' FPS '+String(r.fps).padStart(4)+'   CPU '+String(r.cpu).padStart(5)+'   худший '+String(r.worst).padStart(6)+'   частиц '+String(r.parts).padStart(4)+'   существ '+r.ents);
    console.log('утечки (до → после 60 переходов):');
    for(const k in res.leak.before)console.log('  '+k.padEnd(10)+' '+res.leak.before[k]+' → '+res.leak.after[k]);
    if(L.errors.length)console.log('ОШИБКИ СТРАНИЦЫ:\n  '+L.errors.slice(0,6).join('\n  '));
  }finally{await L.browser.close();srv.close();}
})();
