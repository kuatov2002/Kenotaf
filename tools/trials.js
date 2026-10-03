/* Испытательные стенды: «идеальный ввод» проходит каждую полосу в норму и без касаний.
   Бот — реактивная политика на настоящей физике (кадр 1/120): видит курьера, рымы, клапаны, пар.
   Проверяет: старт у столба (отсчёт), финиш у звонка, время ≤ нормы, награда-модуль выдана,
   рекорд и призрак записаны; второй проход рисует призрака.
   node tools/trials.js [z1_trial ...] */
'use strict';
const lab=require('./lab');
const AB={z1_trial:['pulse','dash'],z2_trial:['pulse','dash','hook','claws'],z3_trial:['pulse','dash','hook','claws','magnet','filter'],
  z4_trial:['pulse','dash','hook','claws','magnet','filter','breaker','vjump'],z5_trial:['pulse','dash','hook','claws','magnet','filter','breaker','vjump']};
/* политики: fn(p,W,s,f) → {keys:[...], press:[...]} */
const BOTS={
  z1_trial:`(p,W,s,f)=>{const k=['KeyA'],pr=[],u=W.time%2.4;
    if(!s.ph)s.ph='run';
    if(s.ph==='run'){if(p.onGround&&p.cx<46.9&&p.cx>45){pr.push('jump');}k.push('Space');if(p.onGround&&p.cx<40)s.ph='steam';}
    else if(s.ph==='steam'){if(p.cx>38.7)return {keys:k,press:pr};
      k.length=0;if(u>0.90&&u<1.0&&p.dashCd<=0){k.push('KeyA');pr.push('dash');s.ph='pogo';}}
    else if(s.ph==='pogo'){k.push('Space');if(p.onGround&&p.cx<31.8&&p.cx>30.5&&!s.j){pr.push('jump');s.j=1;}
      const q=(W.room.pogos||[]).find(q=>Math.abs(q.x-p.cx)<0.7&&q.y-p.bottom>-0.25&&q.y-p.bottom<1.6);
      if(q&&!p.onGround&&p.vy>-3&&(s.cool||0)<=0){k.push('KeyS');pr.push('attack');s.cool=20;}
      if(s.cool>0)s.cool--;
      if(p.onGround&&p.cx<15.2)s.ph='end';}
    else{k.push('Space');if(p.onGround&&p.cx<12.4&&p.cx>11.6)pr.push('jump');}
    return {keys:k,press:pr};}`,
  z2_trial:`(p,W,s,f)=>{const k=['KeyA'],pr=[];
    if(!s.ph)s.ph='run';
    if(s.ph==='run'){k.push('Space');if(p.onGround&&p.cx<50.6){pr.push('jump');s.ph='hook';s.t=f;}}
    else if(s.ph==='hook'){k.push('Space');if(f-s.t===6)pr.push('hook');if(f-s.t>8&&!p.hook&&!s.h2&&p.cx<44){pr.push('hook');s.h2=1;}
      if(p.onGround&&p.cx<34)s.ph='chim';}
    else if(s.ph==='chim'){if(p.cx>26.6){return {keys:k,press:pr};}
      /* под правой стеной дымохода → внутрь, прыжок, кошки: отскоки от стены к стене */
      k.length=0;if(!s.in){k.push('KeyA');if(p.cx<24.6){s.in=1;pr.push('jump');s.dir=-1;}return {keys:k,press:pr};}
      k.push('Space');k.push(s.dir<0?'KeyA':'KeyD');
      if(!p.onGround&&p.gripDir!==0&&(s.cool||0)<=0){pr.push('jump');s.dir=-p.gripDir;s.cool=8;}
      if(s.cool>0)s.cool--;
      if(p.onGround&&!s.in2){pr.push('jump');}
      if(p.bottom<6.6&&p.cx<21.8){s.ph='roof';}}
    else{k.push('Space');if(p.onGround&&p.cx<14.6&&p.cx>13.6)pr.push('jump');}
    return {keys:k,press:pr};}`,
  z3_trial:`(p,W,s,f)=>{const k=['KeyD'],pr=[];
    if(!s.ph)s.ph='rail1';
    if(s.ph==='rail1'){if(p.onGround&&p.cx>7.6){pr.push('jump');}k.push('Space');if(p.onCeil&&p.ceiling===W.room.magnetRects[0]){s.ph='c1';}}
    else if(s.ph==='c1'){if(p.cx>18.4){pr.push('jump');s.ph='gap';s.t=f;}}
    else if(s.ph==='gap'){k.push('Space');if(f-s.t===2)pr.push('dash');if(p.onCeil&&p.ceiling===W.room.magnetRects[1])s.ph='c2';}
    else if(s.ph==='c2'){if(p.cx>34.2){pr.push('jump');s.ph='isl';}}
    else if(s.ph==='isl'){k.push('Space');if(p.onGround&&p.cx>39.4){pr.push('jump');s.ph='hk';s.t=f;}}
    else if(s.ph==='hk'){k.push('Space');if(f-s.t===6)pr.push('hook');}
    return {keys:k,press:pr};}`,
  z4_trial:`(p,W,s,f)=>{const k=['KeyA','Space'],pr=[];
    if(!s.ph)s.ph='go';
    /* край → прыжок → гарпун; трос отпустил — сразу следующий рым впереди: три рыма одним жестом */
    if(p.onGround&&!p.hook&&Math.abs(p.cx-44.4)<0.6&&!s.j){pr.push('jump');s.j=f;}
    if(!p.onGround&&!p.hook&&p.hookCd<=0){const a=p.hookTarget();if(a&&a!==s.last&&a.x<p.cx){pr.push('hook');s.last=a;}}
    return {keys:k,press:pr};}`,
  z5_trial:`(p,W,s,f)=>{const k=['KeyD'],pr=[];
    if(!s.ph)s.ph='pogo';
    if(s.ph==='pogo'){k.push('Space');if(p.onGround&&p.cx>7.4&&p.cx<9&&!s.j){pr.push('jump');s.j=1;}
      const q=(W.room.pogos||[]).find(q=>Math.abs(q.x-p.cx)<0.7&&q.y-p.bottom>-0.25&&q.y-p.bottom<1.6);
      if(q&&!p.onGround&&p.vy>-3&&(s.cool||0)<=0){k.push('KeyS');pr.push('attack');s.cool=20;}if(s.cool>0)s.cool--;
      if(p.onGround&&p.cx>20.5)s.ph='rail';}
    else if(s.ph==='rail'){k.push('Space');if(p.onGround&&p.cx>22.4)pr.push('jump');if(p.onCeil)s.ph='c';}
    else if(s.ph==='c'){if(p.cx>35.8){pr.push('jump');s.ph='floor';}}
    else if(s.ph==='floor'){k.push('Space');if(p.onGround&&p.cx>39.6){pr.push('jump');s.ph='hk';s.t=f;}}
    else if(s.ph==='hk'){k.push('Space');if(f-s.t===5)pr.push('hook');if(p.onGround&&p.cx>47&&p.bottom<10.8)s.ph='top';}
    else{k.push('Space');if(p.onGround&&p.cx>49.6&&!s.v){pr.push('jump');s.v=f;}if(s.v&&f-s.v===10)pr.push('jump');if(s.v&&f-s.v>12&&!s.d&&p.bottom<6.9&&p.vy>-5){pr.push('dash');s.d=1;}}
    return {keys:k,press:pr};}`
};
(async()=>{
  const only=process.argv.slice(2).filter(a=>!a.startsWith('--')),L=await lab.open();let bad=0;
  try{
    for(const id of Object.keys(BOTS)){if(only.length&&only.indexOf(id)<0)continue;
      const r=await L.ev(([id,ab,src])=>{const g=game,bot=eval(src);
        try{localStorage.removeItem('kenotaf_ghost_'+id);}catch(e){}
        LAB.setup(id,4,4,ab);const W=g.world;W.load(id,4,4);g.gs.trials={};delete g.gs.flags['trial_'+id];g.trials.enter(W);
        const post=W.interactables.find(i=>i.def.kind==='trialpost');post.use(g);
        const p=W.player,s={},fails0=0;let f=0,fails=0;const of=g.trials.fail.bind(g.trials);g.trials.fail=(w,why)=>{fails++;of(w,why);};
        const run=()=>{while(f<120*40&&g.trials.run){f++;const pz=(g.trials.run.t>=0)?bot(p,W,s,f):{keys:[],press:[]};
          LAB.step(1,pz.keys,pz.press.length?{0:pz.press}:null);if(fails)break;}};
        run();const fin=g.trials.run===null;for(let i=0;i<150;i++)LAB.step(1);let n=0;while(g.cinematic.active&&n<3000){g.cinematic.update(1/60);n++;}
        const rec=g.trials.rec(id),T=TRIALS[id];
        const res={id,best:rec.best,par:T.par,fails,reward:!!g.gs.flags['trial_'+id]&&!!g.gs.flags[T.reward],ghost:!!(g.trials.ghost&&g.trials.ghost.f&&g.trials.ghost.f.length>20),x:+p.cx.toFixed(1),y:+p.bottom.toFixed(1),ph:s.ph};
        /* второй проход: призрак виден рядом */
        g.cinematic.abort();LAB.step(60);const post2=W.interactables.find(i=>i.def.kind==='trialpost');post2.use(g);let gh=0;for(let i=0;i<300;i++){LAB.step(1);if(g.trials.run&&g.trials.run.t>0.2){if(g.trials.ghostAt(g.trials.run.t))gh++;}}
        res.ghostDrawn=gh>0;g.trials.fail=of;return res;},[id,AB[id],BOTS[id]]);
      const ok=r.best!==undefined&&r.best<=r.par&&r.fails===0&&r.reward&&r.ghost&&r.ghostDrawn;if(!ok)bad++;
      console.log((ok?'ok   ':'FAIL ')+id.padEnd(10)+' '+JSON.stringify(r));}
    if(L.errors.length){bad++;console.log('ERRORS\n'+L.errors.join('\n'));}
  }finally{await L.close();}
  console.log(bad?'TRIALS: '+bad+' FAIL':'TRIALS: ALL OK');process.exit(bad?1:0);
})();
