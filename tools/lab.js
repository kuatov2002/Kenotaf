/* Боевая лаборатория: сцена с механизмом, пошаговая симуляция с вводом, раскадровки.
   Используется сценариями tools/combat.js и для ручной отладки анимаций:
     const L=await lab.open(); await L.setup('z1_start',36,9.32,['pulse','dash']); ...
   В странице появляется window.LAB с теми же методами. */
'use strict';
const fs=require('fs');
const {serve,launch,openGame}=require('./lib');

const PAGE=()=>{
  window.LAB={
    setup(room,x,y,ab,flags){const g=game;g.gs.reset();for(const a of (ab||[]))g.gs.abilities[a]=true;
      for(const f of (flags||[]))g.gs.flags[f]=true;
      document.getElementById('menu').classList.add('hidden');document.getElementById('controls').classList.add('hidden');
      g.hud.show(true);g.state='play';g.timeScale=1;g.input.enabled=true;g.input.clearAll();
      g.world.load(room,x,y);g.world.enemies.length=0;g.hud.syncAbilities();g.hud.syncHp();g.timeScale=0;return true;},
    spawn(type,x,y,def){const W=game.world,C=ENEMY_TYPES[type];const e=new C(W,Object.assign({type,patrol:[x-3,x+3]},def||{}),x,y);
      W.enemies.push(e);return W.enemies.length-1;},
    e(i){return game.world.enemies[i===undefined?0:i];},
    /* шаг симуляции (1/120): keys — удерживаемые коды, press — {кадр:[действия]} */
    step(n,keys,press){const g=game,w=g.world;
      for(let i=0;i<n;i++){g.input.k=Object.create(null);(keys||[]).forEach(k=>g.input.k[k]=true);
        if(press&&press[i])press[i].forEach(a=>g.input.press(a));
        const sc=g.slowT>0?g.slowK:1;if(g.slowT>0){g.slowT-=1/120;}
        if(g.hitstopT>0)g.hitstopT-=1/120;else w.update(1/120*sc);
        g.camera.update(1/120,w.player,w.room,g.vw,g.vh,g.ppm);g.hud.update(1/120);g.input.p=Object.create(null);}},
    /* шаг до условия (строка-выражение от e, p) */
    until(cond,max,keys){const f=new Function('e','p','g','return '+cond);let n=0;
      while(n<(max||2400)&&!f(this.e(),game.world.player,game)){this.step(1,keys);n++;}return n;},
    render(){if(this._z)game.camera.zoom=game.camera.tzoom=this._z;game.render(1/60);},
    p(){return game.world.player;},
    zoom(z){this._z=z;game.camera.zoom=game.camera.tzoom=z;},
    /* лист раскадровки: count кадров через every шагов, кроп вокруг цели (метры) */
    sheet(count,every,cols,wM,hM,keysFn,focus){
      const g=game,cv=g.canvas,s=g.ppm*g.camera.zoom,cw=Math.round(wM*s),ch=Math.round(hM*s);
      const rows=Math.ceil(count/cols),S=document.createElement('canvas');S.width=cw*cols;S.height=ch*rows;const sx=S.getContext('2d');
      sx.fillStyle='#000';sx.fillRect(0,0,S.width,S.height);
      for(let i=0;i<count;i++){
        for(let k=0;k<every;k++){const ks=keysFn?keysFn(i*every+k):null;this.step(1,ks&&ks.keys,ks&&ks.press?{0:ks.press}:null);}
        const f=focus?focus():{x:this.e().cx,y:this.e().cy};
        g.camera.focus={x:f.x,y:f.y};g.camera.x=f.x;g.camera.y=f.y;g.camera.sx=0;g.camera.sy=0;
        if(this._z)g.camera.zoom=g.camera.tzoom=this._z;
        g.render(1/60);
        const px=(f.x-g.camera.cx)*s+g.vw/2-cw/2,py=(f.y-g.camera.cy)*s+g.vh/2-ch/2;
        sx.drawImage(cv,px,py,cw,ch,(i%cols)*cw,Math.floor(i/cols)*ch,cw,ch);
        sx.fillStyle='rgba(255,255,255,.7)';sx.font='12px monospace';sx.fillText(String(i*every),(i%cols)*cw+4,Math.floor(i/cols)*ch+14);
      }
      return S.toDataURL('image/png');}
  };
};
async function open(opts={}){
  const {srv,url}=await serve();
  const L=await launch({w:opts.w||1280,h:opts.h||720});
  await openGame(L.page,url);
  await L.page.addStyleTag({content:'#roomcard,#hint,#caption{display:none!important}'});
  await L.page.evaluate(PAGE);
  const api={
    page:L.page,errors:L.errors,
    ev:(fn,arg)=>L.page.evaluate(fn,arg),
    setup:(room,x,y,ab,flags)=>L.page.evaluate(([a,b,c,d,e])=>LAB.setup(a,b,c,d,e),[room,x,y,ab||[],flags||[]]),
    spawn:(type,x,y,def)=>L.page.evaluate(([a,b,c,d])=>LAB.spawn(a,b,c,d),[type,x,y,def||{}]),
    step:(n,keys,press)=>L.page.evaluate(([a,b,c])=>LAB.step(a,b,c),[n,keys||[],press||null]),
    shot:async(path)=>{await L.page.evaluate(()=>LAB.render());await L.page.screenshot({path});},
    sheet:async(path,o)=>{const url=await L.page.evaluate(o.fn,o.arg);fs.writeFileSync(path,Buffer.from(url.split(',')[1],'base64'));},
    close:async()=>{await L.browser.close();srv.close();}
  };
  return api;
}
module.exports={open};
