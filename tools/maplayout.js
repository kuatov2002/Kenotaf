/* Схема мира: проверка и раздвижка MAPLAYOUT. Комнаты не должны налезать друг на друга (зазор 3 м).
   node tools/maplayout.js          — список пересечений
   node tools/maplayout.js --fix    — раздвинуть (минимальные сдвиги, порядок сохраняется) и переписать js/world/maplayout.js */
'use strict';
const fs=require('fs'),path=require('path');
const {serve,launch,openGame}=require('./lib');
(async()=>{
  const fix=process.argv.includes('--fix');
  const {srv,url}=await serve();const L=await launch({w:800,h:450});
  try{
    await openGame(L.page,url);
    const rooms=await L.page.evaluate(()=>{const o=[];for(const id in MAPLAYOUT){if(!ROOMDEFS[id])continue;const R=new Room(ROOMDEFS[id],game.gs);
      o.push({id,x:MAPLAYOUT[id][0],y:MAPLAYOUT[id][1],w:R.w,h:R.h});}return o;});
    const M=3,ov=(a,b)=>a.x<b.x+b.w+M&&b.x<a.x+a.w+M&&a.y<b.y+b.h+M&&b.y<a.y+a.h+M;
    const list=()=>{const r=[];for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++)if(ov(rooms[i],rooms[j]))r.push([rooms[i].id,rooms[j].id]);return r;};
    let bad=list();console.log('пересечений: '+bad.length);bad.slice(0,60).forEach(p=>console.log('  '+p.join(' × ')));
    if(fix&&bad.length){
      for(let it=0;it<2000;it++){let moved=false;
        for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){const a=rooms[i],b=rooms[j];if(!ov(a,b))continue;moved=true;
          const px=Math.min(a.x+a.w+M-b.x,b.x+b.w+M-a.x),py=Math.min(a.y+a.h+M-b.y,b.y+b.h+M-a.y);
          const fa=a.id==='z1_start'?0:b.id==='z1_start'?1:0.5;
          if(px<py){const s=(a.x+a.w/2<b.x+b.w/2)?-1:1,d=px+0.5;a.x+=s*d*fa;b.x-=s*d*(1-fa);}
          else{const s=(a.y+a.h/2<b.y+b.h/2)?-1:1,d=py+0.5;a.y+=s*d*fa;b.y-=s*d*(1-fa);}}
        if(!moved){console.log('раздвинуто за '+it+' проходов');break;}}
      bad=list();console.log('осталось пересечений: '+bad.length);
      const file=path.join(__dirname,'..','js','world','maplayout.js');let s=fs.readFileSync(file,'utf8');
      for(const r of rooms){const re=new RegExp('(\\b'+r.id+':\\[)-?[0-9.]+,-?[0-9.]+(\\])');s=s.replace(re,'$1'+Math.round(r.x)+','+Math.round(r.y)+'$2');}
      fs.writeFileSync(file,s);console.log('записано: js/world/maplayout.js');
    }
  }finally{await L.browser.close();srv.close();}
})();
