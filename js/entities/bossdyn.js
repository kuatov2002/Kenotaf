"use strict";
/* ============================== ДИНАМИКА БОССОВ ==============================
   Общее для активных боссов: босс не ждёт, а давит.
     СВЯЗКА — 2–4 атаки подряд без возврата в простой; между звеньями короткая сцепка (0.15–0.25 с),
       замах звена на 20% быстрее, но телеграф (кольцо на детали) остаётся — импульс в окно срывает
       звено, и вся связка рвётся: контратака — в процессе атаки, а не после неё.
     ПРЕСЛЕДОВАНИЕ — в простое босс идёт на курьера, далёкого догоняет прыжком / тараном.
     РЫК — смена фазы: короткая остановка с выбросом пара, после неё другой ритм.
     ПЕРЕГРЕВ — в последней фазе после длинной связки: механизм стравливает пар, детали вскрыты. */
const BossDyn={
  queue(b,list){b.q=list.slice(1);b.qn=1;return list[0];},
  next(b){if(!b.q||!b.q.length)return null;b.qn=(b.qn||0)+1;return b.q.shift();},
  linking(b){return (b.qn||0)>1;},
  more(b){return !!(b.q&&b.q.length);},
  clear(b){b.q=null;b.qn=0;},
  /* выбор связки по весам: [[['a','b'],вес],...] (нулевые веса отбрасываются) */
  pick(o){const f=o.filter(q=>q[1]>0);if(!f.length)return null;let r=Math.random()*f.reduce((a,q)=>a+q[1],0);
    for(const q of f){r-=q[1];if(r<=0)return q[0];}return f[0][0];},
  /* рык смены фазы: true — фаза только что выросла */
  phaseUp(b){if(b.lastPh===undefined)b.lastPh=b.phase;if(b.phase>b.lastPh){b.lastPh=b.phase;return true;}return false;},
  roar(b,g,col){g.audio.bossRoar();g.camera.addShake(0.8);g.hitstop(0.08);
    g.particles.burst(b.cx,b.cy,40,{kind:'steam',col:col||'#efe8dc',spd:9,life:1.1,size:0.6,grow:1.4,drag:1.5});
    const p=b.world.player;if(p&&Math.abs(p.cx-b.cx)<4.5&&Math.abs(p.cy-b.cy)<3.5){p.vx=Math.sign(p.cx-b.cx||1)*12;p.vy=-7;}}
};
