/* Снимок экрана игры для проверки глазами.
   node tools/shot.js out.png [room x y] [--ab pulse,dash] [--js "код"] [--menu] [--w 1920 --h 1080] [--steps 60]
   Без комнаты — главное меню. --js выполняется в странице после загрузки комнаты (game доступен). */
'use strict';
const path=require('path');
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const a=process.argv.slice(2),out=a[0]||'shot.png';
  const opt=k=>{const i=a.indexOf('--'+k);return i>=0?a[i+1]:null;};
  const pos=a.slice(1).filter((v,i,arr)=>!v.startsWith('--')&&!(i>0&&arr[i-1].startsWith('--')));
  const {srv,url}=await serve();
  const L=await launch({w:+(opt('w')||1280),h:+(opt('h')||720)});
  try{
    await openGame(L.page,url);
    await L.page.evaluate(()=>{window.__step=(n)=>{const g=game;for(let i=0;i<n;i++){g.input.pollPad=()=>{};g.frame(g.__ts=(g.__ts||1000)+16.667);}};
      window.requestAnimationFrame=()=>0;});
    if(pos[0]){
      await L.page.evaluate(([room,x,y,ab])=>{const g=game;g.gs.reset();for(const k of ab)if(k)g.gs.abilities[k]=true;
        document.getElementById('menu').classList.add('hidden');g.hud.show(true);g.state='play';g.timeScale=1;g.input.clearAll();
        g.world.load(room,+x,+y);g.hud.syncAbilities();g.hud.syncHp();g.last=0;},[pos[0],pos[1]||3,pos[2]||3,(opt('ab')||'').split(',')]);
    }
    if(opt('js'))await L.page.evaluate(new Function(opt('js')));
    await L.page.evaluate(n=>window.__step(n),+(opt('steps')||40));
    if(opt('js2'))await L.page.evaluate(new Function(opt('js2')));
    await L.page.screenshot({path:out});
    if(L.errors.length)console.log('ERRORS',L.errors.join('\n'));
    console.log('saved',path.resolve(out));
  }finally{await L.browser.close();srv.close();}
})();
