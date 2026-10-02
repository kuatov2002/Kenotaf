/* Решатель прогрессии мира: что достижимо из старта на настоящей физике игрока.
   Неподвижная точка по способностям / флагам / боссам: комнаты аудируются (js/dev/audit.js, BFS по
   точкам приземления), достигнутые рычаги / сальваж / цели импульса меняют состояние, комнаты,
   зависящие от изменившегося флага, перепроверяются.
     node tools/progress.js                 — полный прогон + проверки «без способности X финал недостижим»
     node tools/progress.js --deny filter   — прогон, в котором игрок отказывается брать фильтр
     node tools/progress.js --quick         — только полный прогон
   Код выхода 1, если нарушен инвариант метроидвании (финал достижим без обязательной способности). */
'use strict';
const path=require('path');
const {serve,launch,openGame}=require('./lib');

const ALL_AB=['pulse','dash','claws','magnet','filter'];
const PAR=4;   /* параллельных вкладок */

async function makeWorkers(url,n){
  const ws=[];
  for(let i=0;i<n;i++){const L=await launch({w:960,h:540});await openGame(L.page,url);
    await L.page.addScriptTag({path:path.join(__dirname,'progress-page.js')});ws.push(L);}
  return ws;
}

async function solve(ws,opts){
  const deny=new Set(opts.deny||[]),log=opts.log||(()=>{});
  const st={ab:[],flags:{},bosses:{},lore:{}};
  const P=ws[0].page;
  const src=await P.evaluate(()=>ProgressProbe.sources());
  const entries={},key=p=>Math.round(p.x/0.7)+':'+Math.round(p.y*4);
  const addEntry=(room,p)=>{(entries[room]=entries[room]||{});const k=key(p);if(entries[room][k])return false;entries[room][k]={x:p.x,y:p.y};return true;};
  addEntry('z1_start',{x:3.2,y:9.32});
  let dirty=new Set(['z1_start']);
  const visited=new Set(),events=[],warn=[];
  let ending=false,iter=0,audits=0;
  const dependents=name=>{const base=name.replace(/_?\d+$/,'');
    return Object.keys(entries).filter(r=>src[r]&&(src[r].indexOf(name)>=0||(base!==name&&src[r].indexOf(base)>=0)));};
  while(dirty.size&&iter<200){
    iter++;
    const batch=[...dirty];dirty=new Set();
    const snap=JSON.parse(JSON.stringify(st));
    /* аудит пачки комнат параллельно */
    const results=[];
    for(let b=0;b<batch.length;b+=ws.length){
      const part=batch.slice(b,b+ws.length);
      results.push(...await Promise.all(part.map(async(room,k)=>{
        const pg=ws[k].page;
        const info=await pg.evaluate(([r,s])=>ProgressProbe.info(r,s),[room,snap]);
        const starts=Object.values(entries[room]);
        const au=await pg.evaluate(([r,s,st0])=>ProgressProbe.audit(r,s,st0),[room,snap,starts]);
        audits++;return {room,info,au};
      })));
    }
    const changed=new Set();
    const setFlag=(k,why)=>{if(st.flags[k])return;st.flags[k]=true;changed.add(k);events.push(why);};
    for(const {room,info,au} of results){
      visited.add(room);
      if(au.left>0)warn.push(room+': BFS не исчерпан (осталось '+au.left+' состояний)');
      /* двери */
      for(const d of info.doors){
        if(!au.raw.doors[d.i]||d.locked||!d.to)continue;
        if(d.latch&&d.latchHere)setFlag(d.latch,'засов '+d.latch+' открыт ('+room+')');
        const a=await P.evaluate(([r,i,s])=>ProgressProbe.arrival(r,i,s),[room,d.i,snap]);
        if(a&&addEntry(d.to,a)){dirty.add(d.to);}
      }
      /* интерактивы */
      for(const it of info.inters){
        if(!au.raw.inters[it.i]||!it.can)continue;
        const tag=room+' · '+it.title;
        if(it.kind==='salvage'){
          if(it.ability){if(deny.has(it.ability))continue;
            if(st.ab.indexOf(it.ability)<0){st.ab.push(it.ability);changed.add('@ab');events.push('+ '+it.ability.toUpperCase()+'  ('+tag+')');}}
          if(it.flag)setFlag(it.flag,'flag '+it.flag+' ('+tag+')');
          if(it.upgrade)setFlag(it.upgrade,'+ upgrade '+it.upgrade+' ('+tag+')');
        }else if(it.kind==='talk'){
          if(!st.flags.gh_beam)continue;   /* садовник под балкой: говорит, только когда балку сбили */
          if(it.ability&&!deny.has(it.ability)&&st.ab.indexOf(it.ability)<0){st.ab.push(it.ability);changed.add('@ab');
            events.push('+ '+it.ability.toUpperCase()+'  ('+tag+')');}
          if(it.flag&&!deny.has(it.ability))setFlag(it.flag,'flag '+it.flag+' ('+tag+')');
        }else if(it.kind==='lore'){if(!st.lore[it.loreId]){st.lore[it.loreId]=true;events.push('  цилиндр №'+it.loreId+' ('+room+')');}}
        else if(it.kind==='lever'||it.kind==='gauge'||it.kind==='valve'){setFlag(it.flag,'flag '+it.flag+' ('+tag+')');
          if(st.flags.valve_l&&st.flags.valve_r)setFlag('turbines_on','flag turbines_on');}
        else if(it.kind==='wheel'){setFlag(it.flag,'КОЛЕСО ПЕЧАТИ ('+tag+')');setFlag('wheel_open','wheel_open');ending=true;}
      }
      /* цели импульса / удара */
      const hasPulse=st.ab.indexOf('pulse')>=0;
      const reached=new Set(au.raw.push.filter(p=>p.hit).map(p=>p.id));
      let cores=0;
      for(const pb of info.push){
        if(!reached.has(pb.id))continue;
        if(pb.kind==='grate'){if(pb.flag)setFlag(pb.flag,'flag '+pb.flag+' (удар)');continue;}
        if(!hasPulse)continue;
        if(pb.kind==='counterweight')setFlag('blast_open','flag blast_open (импульс)');
        else if(pb.kind==='beam')setFlag('gh_beam','flag gh_beam (импульс по балке)');
        else if(pb.kind==='crate'&&pb.flag)setFlag(pb.flag,'flag '+pb.flag+' (импульс)');
        else if(pb.kind==='core'){setFlag(pb.flag,'flag '+pb.flag);cores++;}
      }
      if(cores){const n=Object.keys(st.flags).filter(k=>/^core_\d$/.test(k)).length;
        if(n>=3&&!st.flags.cores_placed){st.flags.cores_placed=3;changed.add('cores_placed');events.push('flag cores_placed=3');}}
      /* волны и бои */
      if(info.waves&&info.clearFlag)setFlag(info.clearFlag,'арена '+room+' зачищена');
      const trig=(au.raw.targets||[]).find(t=>t.id==='boss');
      if(info.boss&&trig&&trig.hit){
        const b=info.boss,tr=info.trigger;
        /* после боя игрок стоит где-то на арене: точка входа на полу под центром зоны боя */
        const post=async()=>{const s2=JSON.parse(JSON.stringify(st));
          const p=await P.evaluate(([r,x,y,s])=>ProgressProbe.floorAt(r,x,y,s),[room,tr.x+tr.w/2,tr.y,s2]);
          if(p&&addEntry(room,p))dirty.add(room);};
        if(b==='overseer'&&hasPulse&&!st.bosses.overseer){st.bosses.overseer=true;changed.add('overseer');setFlag('boss1_dead','БОСС Надсмотрщик');await post();}
        if(b==='primarch'&&!st.bosses.primarch){st.bosses.primarch=true;changed.add('primarch');setFlag('boss2_dead','БОСС Примарх');setFlag('turbines_on','turbines_on');await post();}
        if(b==='archivist'&&hasPulse&&!st.bosses.archivist){st.bosses.archivist=true;changed.add('archivist');setFlag('archivist_dead','БОСС Архивариус');await post();}
      }
    }
    /* что перепроверить */
    for(const c of changed){
      if(c==='@ab'){for(const r of Object.keys(entries))dirty.add(r);continue;}
      for(const r of dependents(c))dirty.add(r);
    }
    log('  итерация '+iter+': аудитов '+results.length+', способности ['+st.ab.join(',')+'], в очереди '+dirty.size);
  }
  return {ab:st.ab,flags:st.flags,bosses:st.bosses,lore:Object.keys(st.lore).length,visited:[...visited].sort(),
    ending,events,warn,audits,iter};
}

(async()=>{
  const args=process.argv.slice(2);
  const deny=[];for(let i=0;i<args.length;i++)if(args[i]==='--deny')deny.push(args[++i]);
  const quick=args.indexOf('--quick')>=0;
  const {srv,url}=await serve();
  const ws=await makeWorkers(url,PAR);
  let bad=0;
  const t0=Date.now();
  try{
    const full=await solve(ws,{deny,log:s=>console.log(s)});
    console.log('\n=== '+(deny.length?'БЕЗ '+deny.join(', ').toUpperCase():'ПОЛНЫЙ ПРОГОН')+' ===');
    full.events.forEach(e=>console.log('  '+e));
    console.log('способности: '+full.ab.join(', ')+'   цилиндров: '+full.lore+'/12');
    console.log('комнат достигнуто: '+full.visited.length+'   финал: '+(full.ending?'ДОСТИЖИМ':'недостижим'));
    if(full.warn.length)console.log('ПРЕДУПРЕЖДЕНИЯ:\n  '+[...new Set(full.warn)].join('\n  '));
    console.log('аудитов: '+full.audits+', итераций: '+full.iter+', '+Math.round((Date.now()-t0)/1000)+' с');
    if(!deny.length&&!full.ending){console.log('FAIL: финал недостижим даже со всеми способностями');bad++;}
    if(!deny.length&&!quick){
      /* инвариант метроидвании: без любой из способностей финал недостижим */
      for(const a of ALL_AB){
        const r=await solve(ws,{deny:[a]});
        const ok=!r.ending;
        console.log((ok?'ok   ':'FAIL ')+'без '+a.toUpperCase().padEnd(7)+' финал '+(r.ending?'ДОСТИЖИМ':'недостижим')+
          '; способности: ['+r.ab.join(',')+'], комнат '+r.visited.length);
        if(!ok){bad++;console.log('     путь: '+r.events.filter(e=>/^\+|БОСС|КОЛЕСО/.test(e)).join(' → '));}
      }
    }
  }finally{for(const w of ws)await w.browser.close();srv.close();}
  console.log(bad?'\nPROGRESS: '+bad+' FAIL':'\nPROGRESS: OK');
  process.exit(bad?1:0);
})();
