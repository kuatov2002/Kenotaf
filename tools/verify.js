/* Финальная проверка: меню, тряска, лечение у фонаря, первые десять комнат, первый босс,
   зона II и второй босс, финал (обе концовки). Снимки — в папку (по умолчанию verify/).
   node tools/verify.js [папка]
   Каждый пункт печатает ok / FAIL и цифры; код выхода 1, если что-то провалено. */
'use strict';
const fs=require('fs'),path=require('path');
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const dir=path.resolve(process.argv[2]||'verify');fs.mkdirSync(dir,{recursive:true});
  const {srv,url}=await serve();const L=await launch({w:1280,h:720});
  let bad=0;const report=(ok,name,info)=>{if(!ok)bad++;console.log((ok?'ok   ':'FAIL ')+name.padEnd(34)+' '+(typeof info==='string'?info:JSON.stringify(info)));};
  const shot=async name=>{await L.page.screenshot({path:path.join(dir,name+'.png')});};
  const ev=(fn,arg)=>L.page.evaluate(fn,arg);
  try{
    await openGame(L.page,url);
    /* 1. меню: только название и четыре пункта; отладки нет */
    const menu=await ev(()=>({title:document.querySelector('#menu h1').textContent.trim(),
      btns:[...document.querySelectorAll('#menu .btn')].map(b=>b.textContent.trim()),
      dev:typeof debugOpts!=='undefined'||!!document.getElementById('debug')||typeof LevelAudit!=='undefined'}));
    await shot('01_menu');
    report(menu.title==='КЕНОТАФ'&&menu.btns.join('|')==='НАЧАТЬ|ПРОДОЛЖИТЬ|УПРАВЛЕНИЕ|НАСТРОЙКИ'&&!menu.dev,'меню и отсутствие отладки',menu);
    await L.page.keyboard.press('F1');await L.page.waitForTimeout(200);
    const f1=await ev(()=>({state:game.state,dbg:!!document.querySelector('.debug,#debug,#dbg')}));
    report(f1.state==='menu'&&!f1.dbg,'F1 ничего не открывает',f1);
    /* 2. настройки и тряска: пиксели и длительность для каждого режима */
    await ev(()=>document.getElementById('btnSettings').click());await L.page.waitForTimeout(300);await shot('02_settings');
    const shake=await ev(()=>{const g=game,cam=g.camera,o={};
      for(const v of ['off','weak','normal']){Settings.set('shake',v);const P={cx:10,cy:5,vx:0,vy:0,face:1,onGround:true,lookV:0,dashT:0};cam.reset(10,5,1);cam.shT=0;cam.shAmp=0;cam.impulseX=0;cam.impulseY=0;cam.addShake(1.0);
        let mx=0,t=0;const s=g.ppm*cam.zoom;for(let i=0;i<120;i++){cam.update(1/60,P,null,g.vw,g.vh,g.ppm);const px=Math.hypot(cam.sx,cam.sy)*s;if(px>0.05)t=(i+1)/60;mx=Math.max(mx,px);}
        o[v]={px:+mx.toFixed(2),sec:+t.toFixed(3)};}
      Settings.set('shake','weak');return o;});
    report(shake.off.px===0&&shake.weak.px>=1&&shake.weak.px<=3&&shake.weak.sec>=0.04&&shake.weak.sec<=0.1&&shake.normal.px<=3.01&&shake.normal.sec<=0.1,'тряска: выкл / слабая / обычная',shake);
    await ev(()=>{document.querySelectorAll('.screen').forEach(e=>e.classList.add('hidden'));});
    /* 3. новая игра: вступление → стартовая ниша */
    await ev(()=>{SaveSystem.wipe();document.getElementById('menu').classList.remove('hidden');document.getElementById('btnStart').click();});
    await L.page.waitForTimeout(1200);await shot('03_intro');
    const intro=await ev(()=>game.state);
    for(let i=0;i<8;i++){await L.page.keyboard.press('Enter');await L.page.waitForTimeout(350);}
    await L.page.waitForTimeout(1500);
    const st=await ev(()=>({state:game.state,room:game.world.room&&game.world.room.id}));
    report(intro==='intro'&&st.room==='z1_start','вступление ведёт в стартовую нишу',{intro,...st});
    /* 4. первые десять комнат: вход через настоящую дверь, 2.5 с без ввода — никто не бьёт (честный вход), ошибок нет */
    const path10=['z1_start','z1_gallery','z1_charge','z1_hub','z1_east','z1_arena','z1_safe','z1_boss','z1_quiet','z1_pipes'];
    for(let i=0;i<path10.length;i++){const id=path10[i],from=i?path10[i-1]:null;
      const r=await ev(([id,from])=>{const g=game,W=g.world;g.state='play';g.input.enabled=true;g.gs.hp=g.gs.maxHp();
        for(const a of ['pulse','dash'])g.gs.abilities[a]=true;if(id==='z1_quiet'||id==='z1_pipes')g.gs.abilities.hook=true;
        const R=new Room(ROOMDEFS[id],g.gs);let x=3,y=5;
        const d=from?R.doors.find(q=>q.to===from):null;
        if(d){x=d.x<1?d.x+1.6:(d.x+d.w>R.w-1?d.x-1.2:d.x+d.w/2-0.4);y=d.y+d.h-1.72;}else if(R.checkpoint){x=R.checkpoint.x+1;y=R.checkpoint.y-1.72;}
        W.load(id,x,y);const hp0=g.gs.hp;let err=null;
        try{for(let k=0;k<300;k++){W.update(1/120);}}catch(e){err=String(e);}
        g.camera.reset(W.player.cx,W.player.cy,1);for(let k=0;k<20;k++)g.camera.update(1/60,W.player,W.room,g.vw,g.vh,g.ppm);g.render(1/60);
        return {room:W.room.id,name:W.room.name,hp0,hp:g.gs.hp,enemies:W.enemies.filter(e=>!e.dead).length,boss:!!W.boss,err};},[id,from]);
      await shot('04_'+String(i+1).padStart(2,'0')+'_'+id);
      report(!r.err&&r.hp===r.hp0&&r.room===id,(i+1)+'. '+id+' · '+r.name,{hp:r.hp0+'→'+r.hp,mechs:r.enemies,boss:r.boss,err:r.err});}
    /* 5. лечение у фонаря: 2 ячейки → фонарь → E: ячейки заливаются по одной, видно на снимке */
    const heal=await ev(async()=>{const g=game,W=g.world;W.load('z1_hub',12,32.3);const cp=W.room.checkpoint;
      W.player.x=cp.x-0.4;W.player.y=cp.y-1.72;g.gs.hp=2;g.hud.syncHp();for(let k=0;k<30;k++)W.update(1/120);
      g.input.press('use');const tl=[];let mid=false;
      for(let k=0;k<720;k++){W.update(1/120);if(k%60===0)tl.push(g.gs.hp);
        if(!mid&&g.gs.hp===3){mid=true;g.camera.reset(W.player.cx,W.player.cy,1);for(let q=0;q<20;q++)g.camera.update(1/60,W.player,W.room,g.vw,g.vh,g.ppm);g.render(1/60);await new Promise(r=>setTimeout(r,50));}}
      return {tl,hp:g.gs.hp,max:g.gs.maxHp(),saved:g.gs.cp.room};});
    await shot('05_lamp_heal');
    report(heal.hp===heal.max&&heal.tl[1]<heal.max,'фонарь лечит по ячейке и сохраняет',heal);
    /* 6. первый босс: бой идёт, поломки, смерть, гарпун на месте */
    const boss1=await ev(()=>{const g=game,W=g.world,R0=new Room(ROOMDEFS.z1_boss,g.gs),tr=R0.bossTrigger;
      W.load('z1_boss',tr.x+2,tr.y+tr.h-1.72);const b=W.boss;W.player.invuln=1e9;const seen={};
      for(let k=0;k<1200;k++){W.update(1/120);if(b.state)seen[b.state]=1;}
      g.camera.reset(b.cx,b.cy-1,b.camZoom||1);g.render(1/60);
      return {name:b.name,active:b.activated,states:Object.keys(seen).length,phase:b.phase};});
    await shot('06_boss1_fight');
    const boss1k=await ev(()=>{const g=game,W=g.world,b=W.boss;
      for(const n of b.nodes)if(!n.broken&&!n.core)b.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});
      const c=b.nodes.find(n=>n.core);c.locked=false;b.breakNode(c,{dir:1,sx:c.wx,sy:c.wy});
      for(let k=0;k<400;k++)W.update(1/120);if(g.transitionCb){const cb=g.transitionCb;g.transitionCb=null;cb();}
      for(let k=0;k<200;k++)W.update(1/120);
      return {dead:b.dead,flag:!!g.gs.flags.boss1_dead,item:W.interactables.map(i=>i.def.ability||i.def.title||i.def.kind).join(',')};});
    report(boss1.active&&boss1.states>3&&boss1k.dead&&boss1k.flag&&/hook/.test(boss1k.item),'босс I · '+boss1.name,{...boss1,...boss1k});
    /* 7. зона II: атриум, затем второй босс */
    await ev(()=>{const g=game,W=g.world;W.load('z2_atrium',33,33.3);for(let k=0;k<240;k++)W.update(1/120);
      g.camera.reset(W.player.cx,W.player.cy,1);for(let q=0;q<20;q++)g.camera.update(1/60,W.player,W.room,g.vw,g.vh,g.ppm);g.render(1/60);});
    await shot('07_zone2_atrium');
    const boss2=await ev(()=>{const g=game,W=g.world;for(const a of ['claws'])g.gs.abilities[a]=true;
      const R0=new Room(ROOMDEFS.z2_boss,g.gs),tr=R0.bossTrigger;W.load('z2_boss',tr.x+6,tr.y+tr.h-1.72);const b=W.boss;W.player.invuln=1e9;const seen={};
      for(let k=0;k<2400;k++){W.update(1/120);if(b.state)seen[b.state]=1;}
      g.camera.reset(b.cx-4,b.cy-1,b.camZoom||1);g.render(1/60);
      return {name:b.name,states:Object.keys(seen).sort().join(',')};});
    await shot('08_boss2_fight');
    const boss2k=await ev(()=>{const g=game,W=g.world,b=W.boss;
      for(const n of b.nodes)if(!n.broken&&!n.core)b.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});
      const c=b.nodes.find(n=>n.core);c.locked=false;b.breakNode(c,{dir:1,sx:c.wx,sy:c.wy});
      for(let k=0;k<400;k++)W.update(1/120);
      return {dead:b.dead,flag:!!g.gs.flags.boss2_dead,turbines:!!g.gs.flags.turbines_on};});
    report(boss2k.dead&&boss2k.flag&&boss2.states.split(',').length>6,'босс II · '+boss2.name,{...boss2,...boss2k});
    /* 8. финал: колесо Печати → поверхность → концовка; A и B */
    const fin=await ev(async()=>{const g=game,W=g.world;g.gs.flags.archivist_dead=true;g.gs.bosses.archivist=true;
      W.load('z5_boss',22,21.6-1.72);const wh=W.interactables.find(i=>i.def.kind==='wheel');if(!wh)return {err:'нет колеса'};
      /* вся сцена без управления: печать → взлёт → подъём (свой кадр) → утро (курьер идёт сам) → небо */
      wh.use(g);const acts=[];let simT=0;
      for(let k=0;k<60*240&&g.state!=='ending';k++){if(g.state==='play'){W.update(1/120);W.update(1/120);}g.finale.update(1/60);simT+=1/60;
        if(acts[acts.length-1]!==g.finale.act)acts.push(g.finale.act);}
      window.__acts=acts.concat([g.finale.act]);window.__simT=simT;
      const room=W.room.id;
      const A=document.querySelector('#endcard .c').innerText;
      return {room,state:g.state,A,acts:window.__acts,sec:Math.round(window.__simT),leaf:!!g.finale.leaf||g.finale.knelt};});
    await L.page.waitForTimeout(16000);await shot('09_ending_A');
    const finB=await ev(()=>{const g=game;g.gs.flags.broadcast_done=true;g.gs.lore=18;g.ending();return document.querySelector('#endcard .c').innerText;});
    await L.page.waitForTimeout(18000);await shot('10_ending_B');
    report(fin.room==='z5_surface'&&fin.state==='ending'&&fin.sec>90&&fin.leaf&&/КОНЦОВКА A/.test(fin.A)&&/КОНЦОВКА B/.test(finB),'финал: печать → взлёт → подъём → утро → небо (A и B), без управления',{room:fin.room,state:fin.state,acts:fin.acts,sec:fin.sec,leaf:fin.leaf,err:fin.err});
    console.log('\nфинал A:\n  '+(fin.A||'').split('\n').filter(Boolean).join('\n  '));
    console.log('финал B:\n  '+finB.split('\n').filter(Boolean).join('\n  '));
    if(L.errors.length){bad++;console.log('ОШИБКИ СТРАНИЦЫ:\n  '+L.errors.slice(0,8).join('\n  '));}
    console.log('\nснимки: '+dir);
  }finally{await L.browser.close();srv.close();}
  console.log(bad?'VERIFY: '+bad+' FAIL':'VERIFY: ALL OK');process.exit(bad?1:0);
})();
