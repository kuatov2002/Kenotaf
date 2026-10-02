/* Проверка босса: курьер неуязвим, босс разбужен; N секунд боя без ввода (или с простым «танцем»),
   какие состояния/атаки встретились, были ли ошибки; кадр в png.
   node tools/bosslab.js <комната> <сек> [out.png] [--break id1,id2] [--hp 0.5] [--force state:sec_before_end] [--near dx] [--js "code(b,p,W,g)"] */
'use strict';
const fs=require('fs');
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const a=process.argv.slice(2),room=a[0],sec=+(a[1]||30),out=a[2]&&!a[2].startsWith('--')?a[2]:null;
  const opt=k=>{const i=a.indexOf('--'+k);return i>=0?a[i+1]:null;};
  const {srv,url}=await serve();const L=await launch({w:1280,h:720});
  try{
    await openGame(L.page,url);
    const r=await L.page.evaluate(([room,sec,brk,hpk,kill,force,near,js])=>{
      const g=game;g.gs.reset();for(const k of ABILITY_ORDER)g.gs.abilities[k]=true;
      document.getElementById('menu').classList.add('hidden');g.hud.show(true);g.state='play';g.input.enabled=true;
      const R0=new Room(ROOMDEFS[room],g.gs);const tr=R0.bossTrigger;
      g.world.load(room,tr.x+2,tr.y+tr.h-1.68-0.05);
      const W=g.world,p=W.player,b=W.boss;if(!b)return {err:'no boss'};
      const seen={},log=[];let errs=0;
      for(const id of (brk||'').split(',').filter(Boolean)){const n=b.node(id);if(n)n.hp=n.max*0.05;}
      const steps=Math.round(sec*120);
      for(let i=0;i<steps;i++){
        p.invuln=1e9;g.gs.hp=5;
        const I=g.input;I.k=Object.create(null);
        /* «танец»: бегать туда-обратно около босса, иногда прыгать */
        const ph=((i/240)|0)%4;if(!near)I.k[ph<2?'KeyD':'KeyA']=true;if(i%97===0)I.press('jump');I.k.Space=i%97<30;
        try{W.update(1/120);}catch(e){errs++;if(errs<3)log.push(String(e.stack||e).slice(0,300));}
        if(b.state)seen[b.state]=(seen[b.state]||0)+1;
        if(js&&i===2)(new Function('b','p','W','g',js))(b,p,W,g);
        if(hpk&&i===120){for(const n of b.nodes)if(!n.core)n.hp=n.max*hpk;}
        if(kill&&i===1200){for(const n of b.nodes)if(!n.core&&!n.broken)b.breakNode(n,{dir:1,sx:n.wx,sy:n.wy},false);log.push('broken nodes -> phase '+b.phase);}
        if(kill&&i===2400&&!b.dead){const n=b.nodes.find(q=>q.core);b.breakNode(n,{dir:1,sx:n.wx,sy:n.wy},false);log.push('core broken');}
        if(force&&i===steps-Math.round(+force.split(':')[1]*120)){b.cd=0;b.state=force.split(':')[0];b.st=0;b.hitDone=false;if(near)p.x=b.cx+(+near)-p.w/2;}
        if(b.dead&&!kill)break;
      }
      g.camera.reset(b.cx,b.cy-1,b.camZoom||1);if(!force)for(let i=0;i<30;i++)g.camera.update(1/60,p,W.room,g.vw,g.vh,g.ppm);
      g.render(1/60);
      return {room,boss:b.name,bpos:[b.cx.toFixed(1),b.cy.toFixed(1),b.state],ppos:[p.cx.toFixed(1),p.cy.toFixed(1)],phase:b.phase,dead:b.dead,integrity:b.integrity?b.integrity().toFixed(2):null,
        flags:Object.keys(g.gs.flags).join(','),bosses:Object.keys(g.gs.bosses).join(','),room2:W.room.id,items:W.interactables.map(q=>q.def.title||q.def.kind).join('|'),
        nodes:b.nodes.map(n=>n.id+':'+n.state+(n.locked?'(L)':'')).join(' '),seen,errs,log,proj:W.projectiles.length,zones:(W.zones||[]).length};
    },[room,sec,opt('break'),opt('hp')?+opt('hp'):null,a.includes('--kill'),opt('force'),opt('near'),opt('js')]);
    console.log(JSON.stringify(r,null,1));
    if(out){await L.page.screenshot({path:out});console.log('saved',out);}
    if(L.errors.length)console.log('PAGE ERRORS',L.errors.slice(0,5).join('\n'));
  }finally{await L.browser.close();srv.close();}
})();
