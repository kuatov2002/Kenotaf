/* Прогон финала в реальном времени: колесо Печати → подъём → поверхность (идти вправо) → небо.
   node tools/finale.js [папка] [--b]   (--b — концовка B: правда сказана ярусам)
   Снимки по ходу; в конце — состояние и текст финала. */
'use strict';
const fs=require('fs'),path=require('path');
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const a=process.argv.slice(2),dir=path.resolve(a[0]&&!a[0].startsWith('--')?a[0]:'finale'),B=a.includes('--b');fs.mkdirSync(dir,{recursive:true});
  const {srv,url}=await serve();const L=await launch({w:1280,h:720});
  const shot=n=>L.page.screenshot({path:path.join(dir,n+'.png')});const wait=ms=>L.page.waitForTimeout(ms);
  try{
    await openGame(L.page,url);
    await L.page.evaluate(B=>{const g=game;g.gs.reset();for(const k of ABILITY_ORDER)g.gs.abilities[k]=true;
      g.gs.flags.archivist_dead=true;g.gs.bosses.archivist=true;if(B){g.gs.flags.broadcast_done=true;g.gs.lore=18;for(let i=1;i<=18;i++)g.gs.loreIds[i]=true;}
      document.getElementById('menu').classList.add('hidden');g.hud.show(true);g.state='play';g.input.enabled=true;
      g.world.load('z5_boss',24,21.6-1.72);},B);
    await wait(800);
    await L.page.evaluate(()=>{const W=game.world,wh=W.interactables.find(i=>i.def.kind==='wheel');wh.use(game);});
    await wait(2600);await shot('1_seal_lead');
    await wait(3600);await shot('2_seal_light');
    await wait(4200);await shot('3_ascent');
    await wait(7000);await shot('4_ascent_late');
    await wait(5600);await shot('5_surface');
    const st0=await L.page.evaluate(()=>({state:game.state,room:game.world.room&&game.world.room.id,act:game.finale.act}));
    /* идти вправо, пока не сработает гребень */
    for(let i=0;i<60;i++){await L.page.evaluate(()=>{game.input.k=Object.create(null);game.input.k.KeyD=true;});await wait(200);
      if(i===14)await shot('6_walk');
      const s=await L.page.evaluate(()=>game.state);if(s==='ending')break;}
    await L.page.evaluate(()=>{game.input.k=Object.create(null);});
    await wait(3500);await shot('7_sky');
    await wait(9000);await shot('8_sky_lines');
    await wait(9000);await shot('9_title');
    const st=await L.page.evaluate(()=>({state:game.state,room:game.world.room.id,act:game.finale.act,people:game.finale.people.length,
      text:document.querySelector('#endcard .c').innerText}));
    console.log(JSON.stringify(st0));console.log(JSON.stringify(st,null,1));
    if(L.errors.length)console.log('ОШИБКИ:\n  '+L.errors.slice(0,6).join('\n  '));
  }finally{await L.browser.close();srv.close();}
})();
