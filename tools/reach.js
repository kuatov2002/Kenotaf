/* Достижимость дверей, предметов и целей импульса в комнатах на настоящей физике (tools/audit.js).
   node tools/reach.js z1_pipes:hook,dash z1_boiler:pulse,dash,vjump ...
   Флаги: комната:способности:флаг1+флаг2 ; --from <метка двери> — стартовать только от неё.
   --strict — засчитывать только переходы без пиксельной точности (сдвиг старта ±0.3 м, нажатия +50 мс);
   всегда печатаются ловушки — места, откуда ни одним манёвром не выйти к двери. */
'use strict';
const path=require('path');
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const args=process.argv.slice(2).filter(a=>!a.startsWith('--')),strict=process.argv.includes('--strict');
  const {srv,url}=await serve();
  const L=await launch({w:960,h:540});
  try{
    await openGame(L.page,url);
    await L.page.addScriptTag({path:path.join(__dirname,'audit.js')});
    for(const a of args){
      const [room,ab,fl,from]=a.split(':');
      const r=await L.page.evaluate(([room,ab,fl,from,strict])=>{
        const flags={},bo={};for(const f of (fl||'').split('+'))if(f){if(f.indexOf('B_')===0)bo[f.slice(2)]=true;else flags[f]=true;}
        const kb=game.gs.bosses;game.gs.bosses=bo;
        game.state='play';
        const o={flags,max:900,timeMs:60000,strict};if(from&&from[0]==='@'){const q=from.slice(1).split(',').map(Number);o.starts=[{x:q[0],y:q[1]}];}else if(from)o.from=from;
        const res=LevelAudit.run(room,(ab||'').split(',').filter(Boolean),o);
        game.gs.bosses=kb;return res;},[room,ab,fl,from,strict]);
      console.log('== '+r.room+(from?' from '+from:'')+' ['+r.abil+'] states:'+r.states+' left:'+r.left+' '+r.ms+'ms'+(r.strict?' · строго: '+r.strictStates+' сост., хрупких переходов '+r.fragile+' из '+r.checks:''));
      if(r.traps.length)console.log('  ЛОВУШКИ: '+r.traps.map(t=>t.x+','+t.y).join('  '));
      console.log('  doors: '+r.doors.join(' | '));
      if(r.inters.length)console.log('  items: '+r.inters.join(' | '));
      if(r.push.length)console.log('  push : '+r.push.join(' | '));
      if(r.unused&&r.unused.length)console.log('  НЕ РАБОТАЕТ: '+r.unused.join(' · '));
    }
    if(L.errors.length)console.log('ERRORS',L.errors.join('\n'));
  }finally{await L.browser.close();srv.close();}
})();
