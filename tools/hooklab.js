/* Траектория гарпуна: курьер в точке (x,y), держит направление, прыгает, на кадре fire стреляет гарпуном;
   путь рисуется поверх комнаты (точки — каждые 1/30 с, жёлтые — на тросе, голубые — после отпускания).
   node tools/hooklab.js out.png <комната> <x> <y> [dir=1] [fire=12] [--chain] [--nojump]
   --chain — после отпускания стрелять снова по следующему рыму; --rev N — с кадра N держать обратное направление */
'use strict';
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const a=process.argv.slice(2),out=a[0],room=a[1],x=+a[2],y=+a[3],dir=+(a[4]||1),fire=+(a[5]||12);
  const chain=a.includes('--chain'),nojump=a.includes('--nojump'),ri=a.indexOf('--rev'),rev=ri>=0?+a[ri+1]:-1;
  const {srv,url}=await serve();const L=await launch({w:1280,h:720});
  try{
    await openGame(L.page,url);
    const r=await L.page.evaluate(([room,x,y,dir,fire,chain,nojump,rev])=>{
      const g=game,W=g.world;g.gs.reset();for(const k of ABILITY_ORDER)g.gs.abilities[k]=true;
      document.getElementById('menu').classList.add('hidden');g.hud.show(false);g.state='play';g.input.enabled=true;
      W.load(room,x,y);W.enemies.length=0;const p=W.player;for(let i=0;i<20;i++)W.update(1/120);
      const I=g.input,pts=[];let st='run',n=0,land=null,maxX=p.cx,minY=p.cy;
      for(let f=0;f<480;f++){I.k=Object.create(null);const dd=rev>=0&&f>=rev?-dir:dir;I.k[dd>0?'KeyD':'KeyA']=true;
        if(f===2&&!nojump){I.press('jump');}
        I.k.Space=!nojump&&f<30;
        if(f===fire||(chain&&st==='free'&&!p.hook&&n<4&&f%6===0&&!p.onGround)){I.press('hook');if(st!=='run')n++;}
        for(let k=0;k<2;k++)W.update(1/120);
        if(p.hook)st='rope';else if(st==='rope')st='free';
        pts.push([p.cx,p.cy,st==='rope'?1:st==='free'?2:0]);maxX=dir>0?Math.max(maxX,p.cx):Math.min(maxX,p.cx);minY=Math.min(minY,p.cy);
        if(f>fire+6&&p.onGround&&!p.hook){land={x:+p.cx.toFixed(2),y:+p.bottom.toFixed(2)};break;}
        if(p.dead)break;}
      const R=W.room,z=Math.min(CFG.VIEW_H/R.h,(g.vw/g.ppm)/R.w)*0.98;
      g.camera.reset(R.w/2,R.h/2,z);g.camera.zoom=z;g.camera.tzoom=z;g.render(1/60);
      g.state='lab';const c=g.ctx||g.canvas.getContext('2d');g.renderer.worldTransform(c,g.camera,z);
      for(const q of pts){c.fillStyle=q[2]===1?'#ffd23a':q[2]===2?'#5ad0ff':'#ffffff';c.beginPath();c.arc(q[0],q[1],0.12,0,TAU);c.fill();}
      for(const an of (R.anchors||[])){c.strokeStyle='#ff4a3a';c.lineWidth=0.06;c.beginPath();c.arc(an.x,an.y,HOOK.reach,0,TAU);c.stroke();}
      c.setTransform(1,0,0,1,0,0);const img=g.canvas.toDataURL('image/png');
      return {img,land,maxX:+maxX.toFixed(2),minY:+minY.toFixed(2),dead:p.dead,anchors:(R.anchors||[]).map(q=>[q.x,q.y])};
    },[room,x,y,dir,fire,chain,nojump,rev]);
    const img=r.img;delete r.img;console.log(JSON.stringify(r));require('fs').writeFileSync(out,Buffer.from(img.split(',')[1],'base64'));console.log('saved',out);
  }finally{await L.browser.close();srv.close();}
})();
