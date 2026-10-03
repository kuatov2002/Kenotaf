"use strict";
/* ============================== ИСПЫТАТЕЛЬНЫЕ СТЕНДЫ ==============================
   По одному на зону: необязательная комната-полоса на технику зоны. E у стартового столба — отсчёт,
   звонок в конце — финиш. Стенд учебный: касание опасности (провал, пар, расплав) не ранит, а
   возвращает к столбу — «без урона» и есть условие. Первый чистый проход в норму — модуль ранца.
   Лучший проход записывается (поза 20 раз в секунду) и потом бежит рядом голубым призраком. */
const TRIALS={
  z1_trial:{n:'СТЕНД ОБХОДЧИКОВ',par:7.5,reward:'felt_soles',
    lines:['ЗВОНОК. НА ТАБЛО — ВРЕМЯ, ЛУЧШЕ НОРМЫ ОБХОДЧИКА.','В ШКАФЧИКЕ ПОД ТАБЛО — ВОЙЛОЧНЫЕ ПОДОШВЫ. НАГРАДА ТОМУ, КТО ПРОШЁЛ СТЕНД НЕ ОСТУПИВШИСЬ.']},
  z2_trial:{n:'КРЫШНЫЙ ПРОБЕГ',par:8,reward:'long_cable',
    lines:['ЗВОНОК НАД КРЫШЕЙ. ТАК ЗВОНИЛИ МОНТАЖНИКИ, КОГДА СДАВАЛИ ПРОЛЁТ.','НА КРЮКЕ У ЗВОНКА — БУХТА ДЛИННОГО ТРОСА.']},
  z3_trial:{n:'ТРАВЕРСА ТЕПЛИЦ',par:8,reward:'weld_parry',
    lines:['ЗВОНОК САДОВНИКОВ. ПОД НИМ — ЯЩИК С ИНСТРУМЕНТОМ ТОГО, КТО СТАВИЛ ЭТОТ РЕКОРД.','ОТРАЖАТЕЛЬ: ЩИТОК, КОТОРЫЙ ЛАТАЕТ КУРТКУ ОТ ЧУЖОГО ПРОМАХА.']},
  z4_trial:{n:'ПРОБА ХОДА',par:5.5,reward:'pulse_wide',
    lines:['ХОД ВЫДЕРЖАН. ЧАСОВЩИКИ ЗАПИСЫВАЛИ ТАКИХ В КНИГУ МАСТЕРОВ.','В НИШЕ ПОД ЗВОНКОМ — ШИРОКОЕ СОПЛО ДЛЯ РЕЗАКА.']},
  z5_trial:{n:'ЭКЗАМЕН ПОЧТАЛЬОНА',par:8.5,reward:'vent_burst',
    lines:['ЗВОНОК АРХИВА. ТАК ЗАКРЫВАЛИ ЭКЗАМЕН ПОЧТАЛЬОНА ВЫСШЕГО РАЗРЯДА.','В КОНВЕРТЕ ПОД ЗВОНКОМ — СБРОСНОЙ КЛАПАН И ПОДПИСЬ: «38».']}
};
const GHOST_HZ=20;
function fmtT(t){if(t===undefined||t===null||!isFinite(t))return '—';const m=Math.floor(t/60),s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(2);}
class TrialSystem{
  constructor(game){this.game=game;this.run=null;this.ghost=null;this.T=null;this.id=null;}
  el(){return document.getElementById('trialhud');}
  /* вход в комнату: стенд — табло, призрак лучшего прохода */
  enter(W){this.run=null;const id=W.room&&W.room.id;this.T=TRIALS[id]||null;this.id=this.T?id:null;
    this.ghost=this.T?this.loadGhost(id):null;this.hud();}
  loadGhost(id){try{const s=localStorage.getItem('kenotaf_ghost_'+id);return s?JSON.parse(s):null;}catch(e){return null;}}
  saveGhost(id,g){try{localStorage.setItem('kenotaf_ghost_'+id,JSON.stringify(g));}catch(e){}}
  rec(id){return (this.game.gs.trials||{})[id]||{};}
  hud(){const el=this.el();if(!el)return;
    if(!this.T){el.classList.remove('on');return;}
    const r=this.rec(this.id),run=this.run,t=run?Math.max(0,run.t):null;
    el.classList.add('on');el.classList.toggle('live',!!(run&&run.t>=0));
    el.innerHTML='<b>'+this.T.n+'</b><span class="tt">'+(run?(run.t<0?['МАРШ','ВНИМАНИЕ','НА СТАРТ'][Math.min(2,Math.floor(-run.t/0.4))]:fmtT(t)):'E У СТОЛБА — СТАРТ')+
      '</span><span>ЛУЧШЕЕ '+fmtT(r.best)+' · НОРМА '+fmtT(this.T.par)+(this.game.gs.flags['trial_'+this.id]?' · ✓':' · БЕЗ КАСАНИЙ')+'</span>';}
  /* E у столба: курьер на старте, отсчёт 1.2 с (стоит), потом время пошло */
  arm(W,post){const p=W.player,g=this.game;if(!p||p.dead)return;
    p.x=post.x-p.w/2;p.y=post.y-p.h;p.vx=p.vy=0;p.face=post.def.face||1;p.dashT=0;p.hook=null;
    this.run={t:-1.2,rec:[],acc:0,post};this.lastTick=3;g.audio.tone(440,0.12,'square',0.03);this.hud();}
  update(W,dt){const r=this.run;if(!r||!this.T)return;const p=W.player,g=this.game;if(!p)return;
    if(p.dead){this.run=null;this.hud();return;}
    r.t+=dt;
    if(r.t<0){p.restT=Math.max(p.restT||0,-r.t);p.vx=0;
      const k=Math.ceil(-r.t/0.4);if(k<this.lastTick){this.lastTick=k;g.audio.tone(440,0.12,'square',0.03);}
      this.hud();return;}
    if(this.lastTick>0){this.lastTick=0;p.restT=0;g.audio.tone(880,0.3,'square',0.04);g.camera.addShake(0.15);}
    r.acc+=dt;while(r.acc>=1/GHOST_HZ){r.acc-=1/GHOST_HZ;r.rec.push(this.frame(p));}
    const bell=W.interactables.find(i=>i.def.kind==='trialbell');
    if(bell&&aabb(p.rect(),bell.rect()))this.finish(W,bell);
    else if(r.t>120)this.fail(W,'ВРЕМЯ ВЫШЛО');
    this.hud();}
  /* касание опасности на стенде: без урона — назад к столбу */
  fail(W,why){const g=this.game,p=W.player,post=W.interactables.find(i=>i.def.kind==='trialpost');
    this.run=null;g.audio.denied();g.flash(0.12,'#9fe0ff');
    if(p&&post){p.x=post.x-p.w/2;p.y=post.y-p.h;p.vx=p.vy=0;p.hook=null;p.dashT=0;p.invuln=0.4;p.face=post.def.face||1;}
    g.hud.say(why?'СБРОС · '+why:'СБРОС','СТЕНД');this.hud();}
  finish(W,bell){const g=this.game,gs=g.gs,r=this.run,t=r.t,id=this.id,T=this.T;this.run=null;
    gs.trials=gs.trials||{};const old=gs.trials[id]||{},best=old.best===undefined||t<old.best;
    gs.trials[id]={best:best?t:old.best,runs:(old.runs||0)+1};gs.save();
    if(best){r.rec.push(this.frame(W.player));this.ghost={t,f:r.rec};this.saveGhost(id,this.ghost);}
    g.audio.bell?g.audio.bell():g.audio.tone(1046,1.2,'sine',0.05,0,g.audio.verb);g.camera.addShake(0.25);
    g.particles.spawn({kind:'ring',x:bell.x,y:bell.y-1.6,ringR:2.6,life:0.6,size:0.1,col:'#ffe6a3',add:true,a:0.9});
    const par=t<=T.par;
    g.hud.say(fmtT(t)+(best?' · ЛУЧШЕЕ':'')+(par?' · В НОРМЕ':' · НОРМА '+fmtT(T.par)),T.n);
    if(par&&!gs.flags['trial_'+id]){gs.flag('trial_'+id);
      W.later(700,()=>g.cinematic.play({x:bell.x,y:bell.y,title:'ИСПЫТАНИЕ · '+T.n,lines:T.lines,upgrade:T.reward}));}
    this.hud();}
  /* поза для призрака: только то, что рисует силуэт; локальные суставы — с точностью до сантиметра */
  frame(p){const s=HeroArt.snap(p),R=v=>Math.round(v*100)/100;
    if(!s)return [R(p.cx),R(p.bottom),p.face];const J=s.j;
    return [R(s.x),R(s.y),s.face,s.ceil?1:0,R(s.lean),R(J.tl),R(J.hip.x),R(J.hip.y),R(J.hipB.x),R(J.hipB.y),R(J.legB.kx),R(J.legB.ky),R(J.legB.fx),R(J.legB.fy),
      R(J.hipF.x),R(J.hipF.y),R(J.legF.kx),R(J.legF.ky),R(J.legF.fx),R(J.legF.fy),R(J.head.x),R(J.head.y),R(J.shF.x),R(J.shF.y),
      R(J.armF.kx),R(J.armF.ky),R(J.armF.fx),R(J.armF.fy),R(J.wHead.x),R(J.wHead.y)];}
  pose(f,f2,k){if(!f||f.length<30)return null;const L=(i)=>f2?lerp(f[i],f2[i],k):f[i],P=(a,b)=>({x:f[a],y:f[b]}),K=(a)=>({kx:f[a],ky:f[a+1],fx:f[a+2],fy:f[a+3]});
    return {x:L(0),y:L(1),face:f[2],ceil:!!f[3],lean:f[4],j:{tl:f[5],hip:P(6,7),hipB:P(8,9),legB:K(10),hipF:P(14,15),legF:K(16),head:P(20,21),shF:P(22,23),armF:K(24),wHead:P(28,29)}};}
  /* призрак бежит только во время прохода — рядом, тем же временем */
  ghostAt(t){const G=this.ghost;if(!G||!G.f)return null;const u=t*GHOST_HZ,i=Math.floor(u);if(i<0||i>=G.f.length)return null;
    const f=G.f[i],f2=G.f[i+1],k=u-i;return {pz:this.pose(f,f2,k),x:f2?lerp(f[0],f2[0],k):f[0],y:f2?lerp(f[1],f2[1],k):f[1]};}
  drawGhost(c,t){const r=this.run;if(!r||r.t<0)return;const at=this.ghostAt(r.t);if(!at)return;
    c.save();c.globalCompositeOperation='lighter';
    if(at.pz)HeroArt.silhouette(c,at.pz,'#9fe0ff',0.32);
    else{c.globalAlpha=0.3;c.fillStyle='#9fe0ff';rr(c,at.x-0.3,at.y-1.68,0.6,1.68,0.28);c.fill();}   /* поза не записана — силуэт-капсула */
    c.restore();this.game.renderer.glowAdd(at.x,at.y-1,0.9,'#9fe0ff',0.12);}
}
/* столб и звонок стенда */
function drawTrialPost(c,it,t,gs){const x=it.x,y=it.y,id=it.world.room.id,T=TRIALS[id],run=it.world.game.trials.run;
  Kit.plate(c,x-0.12,y-2.6,0.24,2.6,'steel',901,{rust:0.3});
  Kit.plate(c,x-0.8,y-3.4,1.6,0.9,'steel',902,{bolts:true});
  c.fillStyle='#14110d';c.fillRect(x-0.68,y-3.28,1.36,0.66);
  c.fillStyle=run?'#9fe0ff':'#ffcf7a';c.font='500 0.2px Oswald';c.textAlign='center';
  c.fillText(run?fmtT(Math.max(0,run.t)):'СТАРТ',x,y-3.0);
  c.fillStyle='rgba(216,204,178,.6)';c.font='0.13px Oswald';c.fillText('НОРМА '+fmtT(T?T.par:0),x,y-2.74);c.textAlign='left';
  const p=0.5+0.5*Math.sin(t*3);c.fillStyle=run?'#9fe0ff':rgba('#ffcf7a',0.5+0.5*p);c.beginPath();c.arc(x,y-2.3,0.1,0,TAU);c.fill();
  it.world.game.renderer.glowAdd(x,y-3.0,1.0,run?'#9fe0ff':'#ffcf7a',0.25+0.1*p);}
function drawTrialBell(c,it,t,gs){const x=it.x,y=it.y,done=gs.flags['trial_'+it.world.room.id];
  Kit.plate(c,x-0.1,y-3.2,0.2,3.2,'steel',903,{rust:0.4});Kit.plate(c,x-0.6,y-3.3,1.2,0.16,'steel',904,{});
  const sw=Math.sin(t*1.4)*0.06;c.save();c.translate(x,y-3.14);c.rotate(sw);
  const gr=c.createLinearGradient(-0.4,0,0.4,0);gr.addColorStop(0,'#6d5416');gr.addColorStop(.45,'#e8c96a');gr.addColorStop(1,'#7a5f1c');
  c.fillStyle=gr;c.beginPath();c.moveTo(-0.16,0.04);c.quadraticCurveTo(-0.2,0.4,-0.42,0.66);c.lineTo(0.42,0.66);c.quadraticCurveTo(0.2,0.4,0.16,0.04);c.closePath();c.fill();
  c.fillStyle='#3a2c10';c.beginPath();c.arc(0,0.72,0.08,0,TAU);c.fill();c.restore();
  if(done){c.fillStyle='#69d68f';c.beginPath();c.arc(x,y-1.0,0.08,0,TAU);c.fill();}
  it.world.game.renderer.glowAdd(x,y-2.6,1.4,'#ffe6a3',0.25+0.1*Math.sin(t*2));}
