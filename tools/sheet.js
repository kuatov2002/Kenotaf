/* Лист-обзор комнат: каждая комната целиком (камера «вписать»), миниатюры сеткой в один png.
   node tools/sheet.js out.png [префикс] [--cols 4] [--tw 480]   — например: node tools/sheet.js z3.png z3_ */
'use strict';
const fs=require('fs');
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const a=process.argv.slice(2),out=a[0]||'sheet.png',pre=a[1]&&!a[1].startsWith('--')?a[1]:'';
  const opt=(k,d)=>{const i=a.indexOf('--'+k);return i>=0?+a[i+1]:d;};
  const cols=opt('cols',4),tw=opt('tw',480);
  const {srv,url}=await serve();const L=await launch({w:1280,h:720});
  try{
    await openGame(L.page,url);
    const data=await L.page.evaluate(async([pre,cols,tw])=>{
      const g=game,W=g.world;g.gs.reset();for(const k of ABILITY_ORDER)g.gs.abilities[k]=true;
      document.getElementById('menu').classList.add('hidden');g.hud.show(false);g.state='play';
      const ids=Object.keys(ROOMDEFS).filter(id=>id.startsWith(pre)).sort();
      const th=Math.round(tw*g.vh/g.vw),rows=Math.ceil(ids.length/cols);
      const S=document.createElement('canvas');S.width=cols*tw;S.height=rows*(th+22);const sc=S.getContext('2d');
      sc.fillStyle='#0b0b0c';sc.fillRect(0,0,S.width,S.height);sc.font='600 14px Oswald';sc.textBaseline='top';
      for(let i=0;i<ids.length;i++){const id=ids[i];
        const R0=new Room(ROOMDEFS[id],g.gs),D=R0.doors[0],sp=R0.checkpoint?[R0.checkpoint.x+1,R0.checkpoint.y-1.72]:D?[D.x+(D.x<1?1.6:-1.2),D.y+D.h-1.72]:[3,R0.h-7];
        W.load(id,sp[0],sp[1]);W.entryT=0;
        for(let k=0;k<20;k++)W.update(1/120);
        const z=Math.min(CFG.VIEW_H/W.room.h,(g.vw/g.ppm)/W.room.w)*0.98;
        g.camera.reset(W.room.w/2,W.room.h/2,z);g.camera.tzoom=z;g.camera.zoom=z;
        g.render(1/60);
        const x=(i%cols)*tw,y=Math.floor(i/cols)*(th+22);
        sc.drawImage(g.canvas,0,0,g.vw,g.vh,x,y+22,tw,th);
        sc.fillStyle='#d8ccb2';sc.fillText(id+' · '+W.room.name+' · '+W.room.w+'×'+W.room.h,x+6,y+4);}
      return S.toDataURL('image/png');
    },[pre,cols,tw]);
    fs.writeFileSync(out,Buffer.from(data.split(',')[1],'base64'));console.log('saved',out);
    if(L.errors.length)console.log('ОШИБКИ:\n  '+L.errors.slice(0,5).join('\n  '));
  }finally{await L.browser.close();srv.close();}
})();
