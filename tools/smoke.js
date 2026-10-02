/* Smoke-тест: игра грузится (http и file://) без ошибок; каждая комната строится, живёт 5 с симуляции
   с «бешеным» вводом и рендерится; каждая дверь ведёт в комнату, где игрок появляется не внутри стены.
   node tools/smoke.js            — полный прогон
   node tools/smoke.js z2_atrium  — только указанные комнаты */
'use strict';
const path=require('path');
const {ROOT,serve,launch,openGame}=require('./lib');

(async()=>{
  const only=process.argv.slice(2);
  const {srv,url}=await serve();
  let fail=0;
  const {browser,page,errors}=await launch();
  try{
    /* 1. загрузка по file:// — двойной клик по index.html должен работать */
    await openGame(page,'file://'+path.join(ROOT,'index.html'));
    if(errors.length){console.log('FILE:// ERRORS',errors);fail++;errors.length=0;}
    else console.log('ok   file:// boot');
    /* 2. загрузка по http */
    await openGame(page,url);
    if(errors.length){console.log('HTTP ERRORS',errors);fail++;errors.length=0;}
    else console.log('ok   http boot');
    const ids=await page.evaluate(()=>Object.keys(ROOMDEFS));
    for(const id of ids){
      if(only.length&&only.indexOf(id)<0)continue;
      const r=await page.evaluate(id=>{
        const g=game,out={id,err:null,doors:[],stuck:[]};
        try{
          g.gs.reset();for(const k in ABILITIES)g.gs.abilities[k]=true;
          document.getElementById('menu').classList.add('hidden');
          g.hud.show(true);g.state='play';g.timeScale=1;g.input.enabled=true;g.input.clearAll();
          const R0=new Room(ROOMDEFS[id],g.gs);R0.id=id;
          const d0=R0.doors[0],a=d0?doorArrival(R0,d0):{x:2,y:2};
          g.world.load(id,a.x,a.y);
          /* 5 с симуляции: бег туда-обратно, прыжки, удары, импульс, рывок */
          const I=g.input,codes=['KeyA','KeyD','Space','KeyS'];
          for(let i=0;i<600;i++){
            I.k=Object.create(null);
            const ph=(i/90|0)%4;I.k[ph<2?'KeyD':'KeyA']=true;if(i%37<10)I.k.Space=true;
            if(i%23===0)I.press('jump');if(i%31===0)I.press('attack');if(i%97===0)I.press('pulse');if(i%71===0)I.press('dash');
            g.world.update(1/120);g.camera.update(1/120,g.world.player,g.world.room,g.vw,g.vh,g.ppm);
            if(i%120===0)g.render(1/60);
          }
          g.render(1/60);
          /* каждая дверь: целевая комната строится, точка появления свободна */
          for(const d of g.world.room.doors){
            if(!d.to||!ROOMDEFS[d.to])continue;
            const R=new Room(ROOMDEFS[d.to],g.gs);R.id=d.to;
            const td=pairDoor(R,id,d);
            const arr=td?doorArrival(R,td):{x:d.tx,y:d.ty};
            const box={x:arr.x,y:arr.y,w:CFG.player.w,h:CFG.player.h};
            const inSolid=R.solids.some(s=>!s.ow&&!s.hidden&&aabb(box,s));
            out.doors.push(d.to+(td?'':'(tx)'));
            if(inSolid||arr.x===undefined||isNaN(arr.y))out.stuck.push(d.label+'→'+d.to);
          }
        }catch(e){out.err=e.stack||String(e);}
        return out;
      },id);
      const bad=r.err||errors.length||r.stuck.length;
      console.log((bad?'FAIL ':'ok   ')+id.padEnd(16)+' doors→ '+r.doors.join(', ')+(r.stuck.length?'  STUCK: '+r.stuck.join('; '):''));
      if(r.err)console.log(r.err);
      if(errors.length){console.log(errors.join('\n'));errors.length=0;}
      if(bad)fail++;
    }
  }finally{await browser.close();srv.close();}
  console.log(fail?('\nSMOKE: '+fail+' FAIL'):'\nSMOKE: ALL OK');
  process.exit(fail?1:0);
})();
