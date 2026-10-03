/* Регрессия боя «ломать, а не убивать»: сценарии на настоящей физике и вводе.
   node tools/combat.js [имя_сценария ...]   — код выхода 1, если хоть один сценарий провален */
'use strict';
const lab=require('./lab');

const S={};
/* общий пролог: курьер в стартовой нише (пол y=11, свободно x 32..42), механизм справа */
/* курьер уже «действовал» и в комнате не первую секунду — иначе механизмы честно ждут (см. World.calm) */
const PRE=(room,px,ab)=>`LAB.setup('${room||'z1_start'}',${px||34},11-1.68,${JSON.stringify(ab||['pulse','dash'])});game.world.entryT=9;game.world.playerActed=true;`;

/* пневмопочта как механика: почтмейстер открывает сеть при встрече; со станции в зоне I уходят цилиндры
   (плата — пластина), следующий визит — письмо, следующий — переезд на Главпочтамт */
S.post_net=`LAB.setup('z2_post',38,20-1.68,['pulse','dash']);const g=game,W=g.world;W.load('z2_post',38,20-1.68);
  const pm=W.interactables.find(i=>i.def.kind==='postmaster');pm.use(g);let n=0;while(g.cinematic.active&&n++<400){g.cinematic.update(0.5);}
  const on=!!g.gs.flags.post_on;W.load('z1_hub',9.4,34-1.68);for(let i=1;i<=3;i++)g.gs.loreIds[i]=true;g.gs.lore=3;
  const st=()=>W.interactables.find(i=>i.def.kind==='station');
  const pr1=st().prompt();st().use(g);const ups=(g.cinematic.def&&g.cinematic.def.upgrades)||[];n=0;while(g.cinematic.active&&n++<400)g.cinematic.update(0.5);
  const plate=!!g.gs.flags.plate_post1,letter=!!g.gs.flags.letter_net,pr2=st().prompt();g.gs.flags.st_post=true;
  st().use(g);const menu=g.state==='travel'&&g.travel.list.indexOf('post')>=0;g.travel.go('post');
  return {ok:on&&plate&&letter&&menu&&/ЦИЛИНДР/.test(pr1)&&/ПИСЬМО/.test(pr1)&&/ПЕРЕЕЗД/.test(pr2),info:{on,pr1,plate,pr2,letter,menu,ups}};`;

/* Зал Архивов: убил одного стража, три ядра в гнёзда — после перезагрузки зал пуст, манометр на месте;
   прочитал манометр (ещё одна перезагрузка) — стражи не вернулись */
S.exam_c_cores=`LAB.setup('z4_exam_c',3,17-1.68,['pulse','dash']);const W=game.world;W.load('z4_exam_c',3,17-1.68);W.entryT=9;W.playerActed=true;
  const p=LAB.p();p.invuln=1e9;const n0=W.enemies.length;W.enemies[0].dead=true;
  for(const c of W.pushables.filter(q=>q.kind==='core')){c.x=c.slotX-c.w/2;c.y=16-c.h/2;c.vx=0;c.vy=0;}
  LAB.step(240);p.invuln=1e9;
  const alive1=W.enemies.filter(e=>!e.dead).length,gauge=W.interactables.find(i=>i.def.kind==='gauge');
  if(gauge){p.x=gauge.def.x-0.3;p.y=17-1.68;gauge.use(game);}LAB.step(240);
  const alive2=W.enemies.filter(e=>!e.dead).length;
  return {ok:n0===2&&alive1===0&&alive2===0&&!!gauge&&!!game.gs.flags.c_clear&&game.gs.flags.cores_placed===3,
    info:{n0,alive1,alive2,gauge:!!gauge,clear:!!game.gs.flags.c_clear,cores:game.gs.flags.cores_placed}};`;

/* вода канала: −1 ячейка и откат туда, откуда прыгал (не вперёд, к финишу) */
S.canal_water=`LAB.setup('z3_canal',29.4,7.6-1.68,['pulse','dash','magnet']);const W=game.world,p=LAB.p();LAB.step(30);
  const hp0=game.gs.hp;p.x=45;p.y=19;p.vx=0;p.vy=5;LAB.step(60);const mid={x:+p.x.toFixed(1),hp:game.gs.hp};
  p.x=7.2;p.y=4.2-1.68;p.vx=p.vy=0;p.invuln=0;LAB.step(60);p.x=25;p.y=19;p.vy=5;LAB.step(60);const tow={x:+p.x.toFixed(1)};
  return {ok:hp0-mid.hp===1&&Math.abs(mid.x-29.4)<0.6&&Math.abs(tow.x-7.2)<0.6,info:{hp0,mid,tow}};`;

/* мягкая перезагрузка комнаты (решённая задача) не воскрешает убитых стражей */
S.reload_keeps_dead=`LAB.setup('z2_escalator',3,10,['pulse','dash']);const W=game.world;W.load(W.room.id,W.player.x,W.player.y);
  const g0=W.enemies.filter(e=>!e.key).length;for(const e of W.enemies)e.dead=true;W.reload();
  const back=W.enemies.filter(e=>!e.dead).length;
  return {ok:g0>0&&back===0,info:{guards:g0,back}};`;

/* застрял в геометрии — выталкивает; кнопка паузы возвращает ко входу */
S.unstuck=`LAB.setup('z1_boiler',3,17.3,['pulse','dash']);const W=game.world,p=LAB.p();
  p.x=10;p.y=16.2;LAB.step(60);const sols=W.room.solids,me={x:p.x+0.05,y:p.y+0.05,w:p.w-0.1,h:p.h-0.1};
  const inside=sols.some(s=>!s.ow&&!s.hidden&&aabb(me,s));
  p.x=30;p.y=5;W.unstuck();const back=Math.abs(p.cx-W.arrive.x)<0.1;
  return {ok:!inside&&back,info:{inside,back,x:+p.x.toFixed(2),y:+p.y.toFixed(2)}};`;

/* у двери: механизм рядом ждёт первого действия курьера — ни замаха, ни касания */
S.spawn_grace=`LAB.setup('z1_start',34,11-1.68,['pulse','dash']);game.world.entryT=0;game.world.playerActed=false;game.world.arrive={x:34.4,y:10};
  const e=LAB.e(LAB.spawn('repairer',35.2,11-1.55));e.cd=0;let wound=0;
  for(let i=0;i<360;i++){LAB.step(1);if(e.state==='wind'||e.state==='strike')wound++;}
  return {ok:wound===0&&game.gs.hp===5,info:{wound,hp:game.gs.hp,acted:game.world.playerActed}};`;

S.pulse_no_damage=`${PRE()}
  const i=LAB.spawn('repairer',35.6,11-1.55);const e=LAB.e(i);e.cd=9;LAB.step(2);
  const hp0=e.hp,n0=e.nodes.map(n=>n.hp).join(),x0=e.x;game.world.player.face=1;
  LAB.step(1,[],{0:['pulse']});LAB.step(30);
  return {ok:e.hp===hp0&&e.nodes.map(n=>n.hp).join()===n0&&e.x-x0>1.0,info:{hp0,hp:e.hp,dx:e.x-x0}};`;

S.interrupt=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',35.4,11-1.55));e.cd=0;
  LAB.until("e.state==='wind'&&e.nodes[0].teleHot",600);
  game.world.player.face=1;LAB.step(1,[],{0:['pulse']});LAB.step(2);
  const t=e.node('torch');
  return {ok:e.openT>0&&t.exT>0&&t.damaged&&game.gs.hp===5,info:{state:e.state,openT:e.openT,torch:t.state,hp:game.gs.hp}};`;

S.pulse_early=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',35.4,11-1.55));e.cd=0;
  LAB.until("e.state==='wind'&&e.st>0.08",600);
  const hot=e.nodes[0].teleHot;game.world.player.face=1;LAB.step(1,[],{0:['pulse']});LAB.step(2);
  return {ok:!hot&&e.openT<=0&&e.state!=='wind'&&e.state!=='strike',info:{hot,state:e.state,openT:e.openT}};`;

S.break_torch=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',35.0,11-1.55));e.cd=99;const p=game.world.player;
  for(let k=0;k<6&&e.has('torch');k++){p.face=1;p.x=e.cx-1.15;p.vx=0;LAB.step(1,[],{0:['attack']});LAB.step(45);}
  return {ok:!e.has('torch')&&e.atk().kind!=='torch'&&game.world.debris.length>0,info:{torch:e.node('torch').state,kind:e.atk().kind,debris:game.world.debris.length,hp:e.hp}};`;

S.crouch_hits_drive=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',35.0,11-1.55));e.cd=99;const p=game.world.player;
  p.face=1;p.x=e.cx-1.1;LAB.step(10,['KeyS']);
  const d0=e.node('drive').hp;LAB.step(1,['KeyS'],{0:['attack']});LAB.step(30,['KeyS']);
  return {ok:e.node('drive').hp<d0,info:{d0,d:e.node('drive').hp,crouch:p.crouch}};`;

S.dash_mark_break=`${PRE(null,31)}
  const e=LAB.e(LAB.spawn('repairer',35.0,11-1.55));e.cd=99;const p=game.world.player;
  const dn=e.node('drive');dn.hp=dn.max*0.45;       /* привод уже повреждён */
  p.face=1;p.x=e.cx-2.6;LAB.step(2);LAB.step(1,['KeyD'],{0:['dash']});LAB.step(40);
  const marked=dn.markT>0;
  p.face=-1;p.x=e.cx+0.5;LAB.step(6,['KeyS']);LAB.step(1,['KeyS'],{0:['attack']});LAB.step(20,['KeyS']);
  return {ok:marked&&dn.broken,info:{marked,drive:dn.state,px:p.x,ex:e.cx}};`;

S.perfect_evade=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',35.6,11-1.55));e.cd=0;const p=game.world.player;
  /* курьер в зоне факела; в момент выброса пламени — рывок назад (прочь), пламя ещё накрывает */
  LAB.until("e.state==='wind'&&e.st>=e.atk().wind-0.04",600);
  LAB.step(1,['KeyA'],{0:['dash']});LAB.step(24,['KeyA']);
  return {ok:game.gs.hp===5&&p.empowerT>0,info:{hp:game.gs.hp,emp:p.empowerT,state:e.state}};`;

S.wall_pin=`${PRE(null,38.2)}
  /* механизм спиной к колонне (x=31): курьер справа, импульс влево */
  const e=LAB.e(LAB.spawn('repairer',33.4,11-1.55));e.cd=99;const p=game.world.player;
  LAB.step(4);e.face=1;p.face=-1;p.x=e.cx+1.4;LAB.step(1,[],{0:['pulse']});
  let pinned=false;for(let i=0;i<60;i++){LAB.step(1);if(e.pinT>0)pinned=true;}
  return {ok:pinned&&!e.has('tank'),info:{pinned,tank:e.node('tank').state,x:e.x,wall:e.wall}};`;

S.turn_taking=`${PRE()}
  const a=LAB.e(LAB.spawn('repairer',36.2,11-1.55)),b=LAB.e(LAB.spawn('repairer',32.0,11-1.55));a.cd=0;b.cd=0;
  game.world.player.invuln=1e9;let both=0,any=0;
  for(let i=0;i<1200;i++){LAB.step(1);const aa=a.state==='wind'||a.state==='strike',bb=b.state==='wind'||b.state==='strike';
    if(aa&&bb)both++;if(aa||bb)any++;}
  game.world.player.invuln=0;
  return {ok:both===0&&any>100,info:{both,any}};`;

S.death_debris=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',35.0,11-1.55));e.cd=99;const p=game.world.player;
  for(let k=0;k<14&&!e.dead;k++){p.face=1;p.x=e.cx-1.15;p.vx=0;LAB.step(1,[],{0:['attack']});LAB.step(40);}
  LAB.step(120);
  const W=game.world;
  return {ok:e.dead&&W.debris.some(d=>d.corpse)&&W.debris.length>=3,info:{dead:e.dead,debris:W.debris.length,corpse:W.debris.some(d=>d.corpse),weld:game.gs.weld}};`;

S.heavy=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',35.0,11-1.55));e.cd=99;const p=game.world.player;
  p.face=1;p.x=e.cx-1.15;const h0=e.hp;
  LAB.step(1,['KeyJ'],{0:['attack']});LAB.step(70,['KeyJ']);const charged=p.charged;
  const h1=e.hp;LAB.step(40);
  return {ok:charged&&(h1-e.hp)>(h0-h1)*2,info:{charged,light:h0-h1,heavy:h1-e.hp}};`;

S.limp=`${PRE()}
  const e=LAB.e(LAB.spawn('repairer',37.5,11-1.55));
  const dn=e.node('drive');e.breakNode(dn,{dir:1,sx:dn.wx,sy:dn.wy});LAB.step(2);
  const x0=e.x;LAB.step(120);
  return {ok:e.limp&&Math.abs(e.x-x0)<2.0&&Math.abs(e.x-x0)>0.3,info:{limp:e.limp,moved:Math.abs(e.x-x0)}};`;

S.input_buffer=`${PRE()}
  /* удар, нажатый до конца отката, не теряется: срабатывает, как только откат кончился */
  const p=game.world.player;p.face=1;LAB.step(1,[],{0:['attack']});
  LAB.until("p.atkCd>0&&p.atkCd<0.08",120);const cd=p.atkCd;LAB.step(1,[],{0:['attack']});
  let again=false;for(let i=0;i<20;i++){LAB.step(1);if(p.atkPhase==='wind'){again=true;break;}}
  return {ok:cd>0&&again,info:{cd:cd.toFixed(3),again}};`;

/* ---------- Надсмотрщик: арена z1_boss (пол y=22), босс проснулся, атаки — вручную ---------- */
const OV=(px)=>`LAB.setup('z1_boss',${px||8},22-1.68,['pulse','dash']);LAB.step(1);
  const b=game.world.boss;b.activated=true;b.woke=true;b.state='idle';b.st=0;b.cd=99;b.face=-1;LAB.step(2);const p=LAB.p();
  const brk=id=>{const n=b.node(id);b.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});};
  /* прогон ИИ: считаем, какие атаки он выбирает */
  const runAI=(sec,place)=>{const seen={};game.world.player.invuln=1e9;b.cd=0;
    for(let i=0;i<sec*120;i++){if(place)place();LAB.step(1);seen[b.state]=(seen[b.state]||0)+1;}
    game.world.player.invuln=0;return seen;};`;

S.ov_interrupt=`${OV()}
  p.x=b.cx-4.4;p.face=1;LAB.step(4);b.begin('sweep');
  LAB.until("g.world.boss.node('armR').teleHot",300);LAB.step(1,[],{0:['pulse']});LAB.step(30);
  const n=b.node('armR'),A=b.P.arms.armR,tip=b.wpt(A.tip);
  return {ok:b.openT>0&&b.stuckArm==='armR'&&n.exT>0&&n.damaged&&tip.y>b.bottom-0.8&&game.gs.hp===5,
    info:{state:b.state,openT:b.openT.toFixed(2),stuck:b.stuckArm,arm:n.state,tipH:(b.bottom-tip.y).toFixed(2),hp:game.gs.hp}};`;

S.ov_sweep_honest=`${OV()}
  /* за пределом стрелы — промах; под стрелой — попадание */
  const far=()=>{p.x=b.cx-7.9;p.vx=0;};far();LAB.step(4);b.begin('sweep');
  for(let i=0;i<180;i++){far();LAB.step(1);}const hpFar=game.gs.hp;
  b.state='idle';b.cd=99;p.invuln=0;LAB.step(60);
  const near=()=>{p.x=b.cx-4.2;p.vx=0;};near();LAB.step(4);b.begin('sweep');
  for(let i=0;i<180;i++){near();LAB.step(1);}
  return {ok:hpFar===5&&game.gs.hp===4,info:{hpFar,hpNear:game.gs.hp}};`;

S.ov_arm_break=`${OV()}
  brk('armR');const seen=runAI(14,()=>{p.x=b.cx-4;});
  return {ok:b.lead==='armL'&&!seen.grabWind&&b.armsLeft()===1&&!!seen.sweepWind,info:{lead:b.lead,seen}};`;

S.ov_treads_break=`${OV()}
  brk('treads');const x0=b.x;const seen=runAI(16,()=>{p.x=b.cx-8;});
  return {ok:!seen.chargeWind&&!seen.charge,info:{seen,moved:(b.x-x0).toFixed(2)}};`;

S.ov_sensor_break=`${OV()}
  brk('sensor');const seen=runAI(16,()=>{p.x=b.cx-6;});
  return {ok:!seen.grabWind&&b.P.lens<0.05,info:{seen,lens:b.P.lens.toFixed(2)}};`;

S.ov_core_unlock=`${OV()}
  const c=b.node('core');const l0=c.locked;brk('sensor');const l1=c.locked;brk('treads');
  return {ok:l0&&l1&&!c.locked&&c.exT>0&&game.world.debris.length>=4,info:{l0,l1,locked:c.locked,debris:game.world.debris.length}};`;

S.ov_weight=`${OV()}
  const wt=game.world.room.weights[2];wt.x=b.cx+0.4;wt.state='fall';wt.vy=0;
  const hp0=b.nodes.map(n=>n.hp).join();LAB.until("game.world.room.weights[2].state==='down'",600);LAB.step(2);
  return {ok:b.state==='stunWall'&&b.nodes.map(n=>n.hp).join()!==hp0&&b.nodes.some(n=>n.exT>0),info:{state:b.state,nodes:b.nodes.map(n=>n.id+':'+Math.round(n.hp)).join(',')}};`;

S.ov_harpoon_dodge=`${OV()}
  p.x=b.cx-7;p.face=1;LAB.step(4);b.begin('grab');
  LAB.until("g.world.boss.harp",300);
  /* гарпун летит — рывок навстречу, сквозь крюк */
  LAB.step(1,['KeyD'],{0:['dash']});LAB.step(30,['KeyD']);
  return {ok:!!(b.harp===null||b.harp.passed)&&game.gs.hp===5&&!(b.harp&&b.harp.mode==='pull'),info:{harp:b.harp&&{mode:b.harp.mode,passed:b.harp.passed},emp:p.empowerT.toFixed(2),hp:game.gs.hp}};`;

S.ov_harpoon_pull=`${OV()}
  p.x=b.cx-7;p.face=1;LAB.step(4);b.begin('grab');const d0=Math.abs(p.cx-b.cx);
  LAB.until("g.world.boss.harp&&g.world.boss.harp.mode==='pull'",300);const pulled=!!b.harp&&b.harp.mode==='pull';
  LAB.step(40);
  return {ok:pulled&&Math.abs(p.cx-b.cx)<d0-1.5,info:{pulled,d0:d0.toFixed(2),d1:Math.abs(p.cx-b.cx).toFixed(2),state:b.state}};`;

S.ov_hit_stuck_arm=`${OV()}
  /* крюки в полу: локоть вынесен за корпус — удар ключом всё равно достаёт */
  p.x=b.cx-7;LAB.step(4);b.begin('slam');LAB.until("g.world.boss.state==='stuck'",400);LAB.step(20);
  const n=b.node('armR'),h0=n.hp;p.x=n.wx-1.3;p.face=1;p.vx=0;p.invuln=1;
  LAB.step(1,[],{0:['attack']});LAB.step(20);
  const outside=n.wx<b.x;
  return {ok:outside&&n.hp<h0,info:{outside,elbowX:n.wx.toFixed(2),bodyX:b.x.toFixed(2),h0,h:n.hp}};`;

S.ov_kill=`${OV()}
  for(const id of ['armR','armL','treads','sensor'])brk(id);LAB.step(30);brk('core');LAB.step(240);
  const W=game.world;
  return {ok:b.dead&&W.debris.some(d=>d.corpse)&&game.gs.bosses.overseer,info:{dead:b.dead,corpse:W.debris.some(d=>d.corpse),flag:!!game.gs.bosses.overseer}};`;

/* ---------- рядовые механизмы: поломка меняет поведение ---------- */
const MOB=(type,x,y)=>`${PRE()}const e=LAB.e(LAB.spawn('${type}',${x||36},${y||'11-2'}));e.cd=99;LAB.step(3);const p=game.world.player;
  const brk=id=>{const n=e.node(id);e.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});};`;

S.mok_brush=`${MOB('mokrica',36,'11-0.62')}
  const s0=e.safe();brk('brush');LAB.step(2);
  return {ok:!s0&&e.safe()&&!e.threat(),info:{s0,safe:e.safe()}};`;

S.lamp_rotor=`${MOB('lampada',36,6.5)}
  brk('rotor');LAB.until("e.dead",600);
  return {ok:e.dead&&game.world.debris.some(d=>d.corpse),info:{dead:e.dead,state:e.state}};`;

S.ari_blind=`${MOB('aristocrat',37,'11-2.35')}
  brk('visor');e.alert=0;e.investigate=null;
  /* тихо стоять — не видит; бег рядом — слышит */
  LAB.step(60);const calm=!e.hunting();p.noiseLevel=1;LAB.step(2);const heard=e.hunting();
  return {ok:e.blind&&calm&&heard,info:{blind:e.blind,calm,heard}};`;

S.cen_front_back=`${MOB('censor',36,'11-2.05')}
  /* в лоб — отскок, броня цела; импульс в спину — баллон рвётся, страж оглушён */
  p.face=1;p.x=e.cx-1.6;p.vx=0;e.face=-1;LAB.step(2);const a0=e.node('armor').hp;
  LAB.step(1,[],{0:['attack']});LAB.step(30);const a1=e.node('armor').hp;
  p.x=e.cx+1.2;p.face=-1;e.face=-1;LAB.step(2);LAB.step(1,[],{0:['pulse']});LAB.step(4);
  return {ok:a1===a0&&!e.has('tank')&&e.stunT>0&&e.node('armor').exT>0,info:{a0,a1,tank:e.node('tank').state,stun:e.stunT.toFixed(2)}};`;

S.gard_blade=`${MOB('gardener',36,'11-1.3')}
  const k0=!!e.atk();brk('blade');
  return {ok:k0&&!e.atk()&&e.safe(),info:{k0,atk:e.atk()}};`;

S.clock_res=`${MOB('clockmaker',37,'11-1.9')}
  const k0=e.atk().kind;brk('resonator');const k1=e.atk().kind;brk('spring');
  return {ok:k0==='shard'&&k1==='hands'&&e.speed()<1.5,info:{k0,k1,spd:e.speed()}};`;

/* ---------- Примарх: арена z2_boss (пол y=18) ---------- */
const PR=`LAB.setup('z2_boss',8,18-1.68,['pulse','dash']);LAB.step(1);
  const b=game.world.boss;b.activated=true;b.woke=true;b.state='idle';b.st=0;b.cd=99;b.face=-1;LAB.step(2);const p=LAB.p();
  const brk=id=>{const n=b.node(id);b.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});};`;

S.pr_tankpop=`${PR}
  p.x=b.cx+2.6;p.face=-1;LAB.step(4);b.face=-1;LAB.step(1,[],{0:['pulse']});LAB.step(3);
  return {ok:b.state==='stun'&&b.node('armor').exT>0&&b.node('tank').damaged,info:{state:b.state,armor:b.node('armor').state,tank:b.node('tank').state}};`;

S.pr_front_deflect=`${PR}
  p.x=b.cx-2.6;p.face=1;p.vx=0;LAB.step(2);const a0=b.node('armor').hp,h0=b.integrity();
  LAB.step(1,[],{0:['attack']});LAB.step(30);
  return {ok:b.node('armor').hp===a0,info:{a0,a:b.node('armor').hp,integ:b.integrity().toFixed(3)}};`;

S.pr_core=`${PR}
  const l0=b.node('core').locked;brk('armor');LAB.step(2);
  game.world.player.invuln=1e9;b.cd=99;let warn=false;for(let i=0;i<480;i++){LAB.step(1);if(game.world.room.hazards.some(h=>h.ctl==='primarch'&&(h.warn||h.active)))warn=true;}game.world.player.invuln=0;
  return {ok:l0&&!b.node('core').locked&&b.phase===2&&warn,info:{l0,locked:b.node('core').locked,phase:b.phase,warn}};`;

S.pr_kill=`${PR}
  for(const id of ['armor','claw','tank'])brk(id);LAB.step(20);brk('core');LAB.step(240);
  return {ok:b.dead&&game.gs.bosses.primarch&&game.world.debris.some(d=>d.corpse),info:{dead:b.dead,flag:!!game.gs.bosses.primarch}};`;

/* ---------- Корчеватель: коса бьёт только там, где лезвие (z3_boss, пол y=22) ---------- */
S.up_scythe_fair=`LAB.setup('z3_boss',30,22-1.68,['pulse','dash']);LAB.step(1);
  const b=game.world.boss,p=LAB.p();b.activated=true;b.woke=true;b.state='idle';b.st=0;b.cd=99;LAB.step(2);
  let hits=0;b.damagePlayer=function(){hits++;};
  const sw=(st,dx,cr)=>{b.x=32-b.w/2;b.vx=0;p.x=32+dx-p.w/2;p.y=22-p.h;p.vx=p.vy=0;LAB.step(cr?20:2,cr?['KeyS']:[]);
    hits=0;const X0=b.cx;b.face=1;b.state=st+'Wind';b.st=0.8;b.hitDone=false;
    for(let i=0;i<80&&b.state!=='recover';i++){p.x=X0+dx-p.w/2;p.vx=0;p.invuln=0;b.cd=99;b.face=1;LAB.step(1,cr?['KeyS']:[]);}
    b.state='idle';b.st=0;LAB.step(30);return hits>0;};
  const r={lowNear:sw('low',3.5),lowFar:sw('low',5.6),highNear:sw('high',3.5),highCrouch:sw('high',4,1),highFar:sw('high',6)};
  return {ok:r.lowNear&&!r.lowFar&&r.highNear&&!r.highCrouch&&!r.highFar,info:r};`;

/* ---------- Архивариус (старый босс): импульс без урона не должен сломать его бой ---------- */
/* опылитель: заходит, телеграфирует жалом, бросается; облако пыльцы — зона */
S.pollinator=`LAB.setup('z3_herbarium',8,15-1.68,['pulse','dash','hook','claws','filter','magnet']);game.world.entryT=9;game.world.playerActed=true;
  game.world.enemies.length=0;const e=LAB.e(LAB.spawn('pollinator',16,10));game.world.player.invuln=1e9;const seen={},tr=[];
  for(let i=0;i<1500;i++){LAB.step(1);seen[e.state]=1;if(i%150===0)tr.push(e.state+'@'+e.cx.toFixed(1)+','+e.cy.toFixed(1)+' cd'+e.cd.toFixed(1)+' see'+e.sensePlayer()+' tok'+game.combat.requestToken(e));}game.world.player.invuln=0;
  return {ok:!!(seen.wind&&seen.dart),info:Object.keys(seen).join(',')+' | '+tr.join(' ')};`;
/* элита: золотой контур, разобрана — награда на месте и флаг */
S.elite_reward=`LAB.setup('z3_herbarium',8,15-1.68,['pulse','dash','hook','claws','filter','magnet']);game.world.entryT=9;game.world.playerActed=true;
  const W=game.world,d=W.room.enemies.find(q=>q.elite);if(!d)return {ok:false,info:'no elite def'};const e=new ENEMY_TYPES[d.type](W,d,d.x,d.y);W.empower(e,d);W.enemies.push(e);const hp=e.nodes[0].max;
  for(const n of e.nodes)if(!n.broken&&!n.locked)e.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});if(!e.dead){e.hp=0;e.die({dir:1});}
  LAB.step(150);const it=game.world.interactables.find(q=>q.def.upgrade==='heavy_fast');
  return {ok:e.dead&&!!game.gs.flags.elite_herb&&!!it&&hp>50,info:{dead:e.dead,flag:!!game.gs.flags.elite_herb,item:!!it,hp}};`;

/* Архивариус: I — пломба, отбитая импульсом, бьёт в стекло (удар по стеклу — отскок);
   II — падение на пол, бросок в стену вскрывает решётку; III — колесо, свинец, ядро; смерть */
const AR=`LAB.setup('z5_boss',12,30-1.68,['pulse','dash','hook','vjump','claws','magnet','filter','breaker']);LAB.step(1);
  const b=game.world.boss;if(!b)return {ok:false,info:'no boss'};b.activated=true;b.woke=true;b.state='idle';b.st=0;b.cd=99;LAB.step(2);const p=LAB.p();
  const brk=id=>{const n=b.node(id);b.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});};`;
S.arc_reflect=AR+`const gl=b.node('glass'),h0=gl.hp;game.world.player.invuln=1e9;b.x=12-b.w/2;b.state='volleyWind';b.st=0;let hit=false;
  for(let i=0;i<900&&!hit;i++){LAB.step(1);const o=game.world.projectiles.find(q=>q.kind==='seal'&&!q.back);
    if(o&&Math.hypot(o.x-p.cx,o.y-p.cy)<2.2){p.face=o.x>p.cx?1:-1;LAB.step(1,[],{0:['pulse']});LAB.step(300);hit=gl.hp<h0;}}
  game.world.player.invuln=0;return {ok:hit,info:{h0,hp:gl.hp}};`;
S.arc_glass_melee=AR+`const gl=b.node('glass'),h0=gl.hp;const r=b.hitNode(gl,{kind:'melee',dmg:34,hb:b.rect(),sx:gl.wx,sy:gl.wy,fromX:gl.wx-1,dir:1},false);
  return {ok:r==='deflect'&&gl.hp===h0,info:{r,hp:gl.hp}};`;
S.arc_fall=AR+`brk('glass');LAB.step(400);const cg=b.node('cage');
  return {ok:b.md==='floor'&&b.phase===2&&!cg.hidden&&!b.dead,info:{md:b.md,ph:b.phase,cage:cg.hidden}};`;
S.arc_lunge=AR+`brk('glass');LAB.step(400);game.world.player.invuln=1e9;p.x=4;b.x=30;b.face=-1;b.state='lungeWind';b.st=0;let seen=false;
  const tr=[];for(let i=0;i<600&&!seen;i++){LAB.step(1);if(i%20===0)tr.push(b.state+':'+b.x.toFixed(1));if(b.state==='stunWall')seen=true;}
  const cg=b.node('cage');game.world.player.invuln=0;return {ok:seen&&cg.exT>0,info:{st:b.state,ex:cg.exT,tr:tr.join(' ')}};`;
S.arc_climb=AR+`brk('glass');LAB.step(400);brk('cage');LAB.step(900);const L=(game.world.room.hazards||[]).find(h=>h.ctl==='archlead');
  return {ok:b.md==='wheel'&&b.phase===3&&L&&L.kind==='pit'&&!b.node('core').broken,info:{md:b.md,ph:b.phase,lead:L&&L.kind}};`;
/* ---------- экономика выбора: перегрев резака ---------- */
/* срыв замаха перегревает резак: +1 заряд */
/* СВЯЗКА: прыжок посреди рывка не пропадает (раньше рывок обнулял vy до конца) и уносит разгон рывка;
   выхлоп в воздухе из рывка; выхлоп после броска гарпуна не гасит бросок; цепочка считает звенья */
S.flow_chains=`if(!ROOMDEFS.__lab)ROOMDEFS.__lab=gs=>({id:'__lab',zone:'sump',name:'СТЕНД',w:60,h:22,noDress:true,build(R){R.solids=[S(-2,-2,64,2.4,'steel'),S(-2,0,2,22,'steel'),S(60,0,2,22,'steel'),S(0,17,60,5,'concrete')];}});
  const ab=['pulse','dash','vjump','hook'],R={};
  const run=(n,keys,press)=>{const p=LAB.p();let top=p.y,land=null,x0=p.x;
    for(let i=0;i<n;i++){LAB.step(1,keys,press&&press[i]?{0:press[i]}:null);top=Math.min(top,p.y);if(land===null&&i>20&&p.onGround)land=p.x-x0;}
    return {rise:+(17-1.68-top).toFixed(2),dist:land===null?null:+land.toFixed(2)};};
  /* обычный прыжок с бега */
  LAB.setup('__lab',6,17-1.68,ab);LAB.p().vx=9.2;R.runJump=run(160,['KeyD','Space'],{0:['jump']});
  /* прыжок на 8-м кадре рывка */
  LAB.setup('__lab',6,17-1.68,ab);LAB.p().vx=9.2;const pr={0:['dash']};pr[8]=['jump'];R.dashJump=run(160,['KeyD','Space'],pr);
  /* в воздухе: рывок, на 6-м кадре — выхлоп */
  LAB.setup('__lab',6,9,ab);let p=LAB.p();LAB.step(4);const pa={0:['dash']};pa[6]=['jump'];const aj0=p.airJump;
  let vyMin=0;for(let i=0;i<20;i++){LAB.step(1,['KeyD','Space'],pa[i]?{0:pa[i]}:null);vyMin=Math.min(vyMin,p.vy);}
  R.air={vyMin:+vyMin.toFixed(1),used:aj0-p.airJump,chain:p.chain};
  /* бросок гарпуна → выхлоп: скорость броска сохраняется */
  LAB.setup('__lab',6,9,ab);p=LAB.p();p.vx=14;p.vy=-6;p.flingT=0.45;p.flingV=14;p.airJump=1;LAB.step(2,['KeyD']);
  LAB.step(1,['KeyD','Space'],{0:['jump']});LAB.step(10,['KeyD','Space']);R.fling={vx:+p.vx.toFixed(1),chain:p.chain};
  const ok=R.dashJump.rise>2&&R.dashJump.dist>R.runJump.dist+1.5&&R.air.vyMin<-8&&R.air.used===1&&R.fling.vx>=12&&R.fling.chain>=1;
  return {ok,info:R};`;

/* РАНЕЦ: гнёзда (3 + боссы), старое сохранение надевает найденное само, модуль работает только надетым,
   у каждого модуля — своё правило и своя цена; в бою ранец не пересобрать */
S.pack_modules=`const g=game,gs=g.gs,R={};
  gs.reset();for(const k of ['mark_long','heavy_fast','stun_long','evade_win','scrap_magnet'])gs.flags[k]=true;
  const old=JSON.parse(JSON.stringify(gs.serialize()));delete old.equip;gs.deserialize(old);
  R.migr=gs.equip.length+'/'+gs.slots();gs.bosses.primarch=gs.bosses.uprooter=gs.bosses.regulator=true;R.slots=gs.slots();
  gs.equip=['evade_win'];R.win=[+perfectWin(gs).toFixed(3)];gs.equip=[];R.win.push(+perfectWin(gs).toFixed(3));
  if(!ROOMDEFS.__lab)ROOMDEFS.__lab=gs=>({id:'__lab',zone:'sump',name:'СТЕНД',w:60,h:22,noDress:true,build(R){R.solids=[S(-2,-2,64,2.4,'steel'),S(-2,0,2,22,'steel'),S(60,0,2,22,'steel'),S(0,17,60,5,'concrete')];}});
  LAB.setup('__lab',20,17-1.68,['pulse','dash','hook','vjump'],['pulse_wide','cold_core','felt_soles','long_cable','weld_parry','vent_burst','ram_valve']);
  const p=LAB.p();LAB.step(5);
  const cost=k=>{gs.equip=k?[k]:[];p.energy=100;p.pulseCd=0;LAB.step(1,[],{0:['pulse']});return +(100-p.energy).toFixed(0);};
  R.cost={base:cost(null),wide:cost('pulse_wide'),cold:cost('cold_core')};
  gs.equip=['cold_core'];gs.heat=0;p.gainHeat(1,p.cx,p.cy);R.coldHeat=gs.heat;gs.equip=[];p.gainHeat(1,p.cx,p.cy);R.heat=gs.heat;
  LAB.step(90);p.x=10;gs.equip=['felt_soles'];p.vx=9;LAB.step(30,['KeyD']);R.feltNoise=+p.noiseLevel.toFixed(2);gs.equip=[];p.x=10;p.vx=9;LAB.step(30,['KeyD']);R.noise=+p.noiseLevel.toFixed(2);
  /* трос: рым в 12 м — без модуля не достать, с модулем достать */
  const W=g.world;p.x=20;p.face=1;W.room.anchors=[{x:p.cx+12*p.face,y:p.cy-1,mount:'top'}];gs.equip=[];R.reach=[!!p.hookTarget()];gs.equip=['long_cable'];R.reach.push(!!p.hookTarget());
  /* ОТРАЖАТЕЛЬ: удар по узлу не даёт ремонта, срыв замаха даёт */
  gs.equip=['weld_parry'];gs.weld=0;const e=LAB.e(LAB.spawn('repairer',p.cx+1.4*p.face,17-1.55));e.face=-p.face;e.alert=5;
  g.combat.melee(p,'side',{});R.weldHit=gs.weld;e.interrupt(e.nodes.find(n=>!n.broken),p);R.weldInt=gs.weld;
  /* таран: рывок сквозь механизм бьёт узел */
  gs.equip=['ram_valve'];e.dead=true;W.enemies.length=0;const e2=LAB.e(LAB.spawn('repairer',30,17-1.55));e2.face=-1;const hp0=e2.nodes.reduce((s,n)=>s+(n.broken?0:n.hp),0);
  p.x=e2.cx-3.5;p.y=17-1.68;p.vx=p.vy=0;p.face=1;p.dashCd=0;p.hurtT=0;p.invuln=1e9;p.atkPhase=null;g.hitstopT=0;g.slowT=0;LAB.step(2);LAB.step(40,['KeyD'],{0:['dash']});
  R.ram=+(hp0-e2.nodes.reduce((s,n)=>s+(n.broken?0:n.hp),0)).toFixed(1);
  /* интерфейс */
  gs.equip=[];g.state='play';g.togglePause();g.packUI.open();const nb=document.querySelectorAll('#packList .btn:not(.dim)').length;
  document.querySelector('#packList .btn:not(.dim)').click();R.ui={owned:nb,worn:gs.equip.length,slot:document.querySelectorAll('#packSlots .slot.on').length};
  g.packUI.close();g.togglePause();
  const ok=R.migr==='3/3'&&R.slots===6&&R.win[0]>R.win[1]&&R.cost.wide===2*R.cost.base&&R.cost.cold===R.cost.base/2&&R.coldHeat===0&&R.heat===1&&
    R.feltNoise<0.45&&R.noise>0.45&&!R.reach[0]&&R.reach[1]&&R.weldHit===0&&R.weldInt>0&&R.ram>0&&R.ui.worn===1&&R.ui.slot===1;
  return {ok,info:R};`;

/* ТАЙНИКИ: ложная стена — три удара (тяжёлый — один, импульс — удар); за ней заначка (шов ремонта);
   мел и заначки 38 считаются; его последний цилиндр у колеса ставит c38_met */
S.secrets=`const g=game,gs=g.gs,R={};
  LAB.setup('z1_cache',3,8-1.68,['pulse','dash']);let W=g.world;const p=LAB.p();LAB.step(5);
  let pb=W.pushables.find(q=>q.kind==='crack');R.crack=!!pb;p.x=pb.x-1.0;p.face=1;p.y=8-1.68;
  const solid=()=>W.room.solids.some(s=>s.pid===pb.id&&!s.hidden);R.solid0=solid();
  for(let i=0;i<3;i++){g.combat.melee(p,'side',{});LAB.step(40);}R.broken=pb.pushed&&!solid()&&!!gs.flags[pb.flag];
  const st=W.interactables.find(i=>i.def.kind==='stash');gs.weld=0;st.use(g);R.weld=gs.weld;R.stash=!!gs.flags['stash_'+st.def.id];
  /* тяжёлый удар — с одного раза; импульс — тоже удар */
  LAB.setup('z2_censor',3,21-1.68,['pulse','dash']);W=g.world;LAB.step(5);pb=W.pushables.find(q=>q.kind==='crack');
  p.x=pb.x+pb.w+0.3;p.face=-1;p.y=21-1.68;g.combat.melee(p,'side',{heavy:true});R.heavy=pb.pushed;
  LAB.setup('z3_apiary',3,24-1.68,['pulse','dash']);W=g.world;LAB.step(5);pb=W.pushables.find(q=>q.kind==='crack');
  const P2=LAB.p();P2.x=pb.x+pb.w+0.3;P2.face=-1;P2.y=24-1.68;const hp0=pb.hp;g.combat.pulse(P2);R.pulse=hp0-pb.hp;
  /* мел 38: подошёл — прочитан */
  LAB.setup('z1_gallery',45,13-1.68,['pulse','dash']);W=g.world;gs.flags.c38_marks=0;const P3=LAB.p();P3.x=48.8;LAB.step(20);R.chalk=gs.flags.c38_marks;
  /* заначка 38 — тоже метка */
  LAB.setup('z1_foundry',60,27-1.68,['pulse','dash'],['crack_n_foundry']);W=g.world;const s38=W.interactables.find(i=>i.def.kind==='stash');
  s38.use(g);let n=0;while(g.cinematic.active&&n<3000){g.cinematic.update(1/60);n++;}R.stash38=gs.flags.c38_marks;
  /* у колеса */
  LAB.setup('z5_boss',3,30-1.68,['pulse','dash'],['archivist_dead']);W=g.world;const c=W.interactables.find(i=>i.def.kind==='c38');
  c.use(g);n=0;while(g.cinematic.active&&n<4000){g.cinematic.update(1/60);n++;}R.met=!!gs.flags.c38_met;
  return {ok:R.crack&&R.solid0&&R.broken&&R.weld>=50&&R.stash&&R.heavy&&R.pulse===1&&R.chalk===1&&R.stash38===1&&R.met,info:R};`;

/* ПОЧТМЕЙСТЕР И САДОВНИК: переезжают в хабы по ходу игры, говорят о находках и подсказывают; в реплике — портрет */
S.hub_npcs=`const g=game,gs=g.gs,R={};
  const kinds=()=>g.world.interactables.filter(i=>i.def.kind==='hubtalk').map(i=>i.def.who).join('+');
  const inPost=()=>g.world.interactables.some(i=>i.def.kind==='postmaster');
  LAB.setup('z2_post',38,20-1.68,['pulse','dash']);R.post0=inPost();
  LAB.setup('z3_greenhouse',8,30-1.68,['pulse','dash'],['post_on','got_magnet','gard_moved']);gs.visited.z3_greenhouse=true;g.world.load('z3_greenhouse',8,30-1.68);R.green=kinds();
  g.world.load('z2_post',38,20-1.68);R.post1=inPost();
  gs.bosses.uprooter=true;gs.visited.z4_antechamber=true;g.world.load('z4_antechamber',3,24-1.68);R.ante=kinds();
  gs.bosses.regulator=true;gs.visited.z5_hall=true;g.world.load('z5_hall',3,21-1.68);R.hall=kinds();
  const t=g.world.interactables.find(i=>i.def.kind==='hubtalk'&&i.def.who==='gd');gs.flags.c38_marks=4;t.use(g);
  R.lines=g.cinematic.def.lines.length;R.portrait=document.getElementById('caption').classList.contains('sp');
  let n=0;while(g.cinematic.active&&n<4000){g.cinematic.update(1/60);n++;}
  /* садовник остаётся в коллекторе, пока курьер не ушёл оттуда */
  LAB.setup('z3_collector',3,16-1.68,['pulse','dash','magnet'],['got_magnet','gh_beam']);R.coll=g.world.interactables.some(i=>i.def.kind==='talk');
  return {ok:R.post0&&R.green==='pm+gd'&&!R.post1&&R.ante==='pm+gd'&&R.hall==='pm+gd'&&R.lines>=3&&R.portrait&&R.coll,info:R};`;

/* ПРИСЛУШАТЬСЯ: разобранный механизм оставляет валик; E — строка, флаг, запись в архиве; второй такой же — без валика */
S.listen=`const g=game,gs=g.gs,R={};
  LAB.setup('z1_start',34,11-1.68,['pulse','dash']);const W=g.world,p=LAB.p();
  const e=LAB.e(LAB.spawn('repairer',37,11-1.55));e.die({dir:1});LAB.step(10);
  const ph=W.interactables.find(i=>i.def.kind==='phono');R.drop=!!ph&&ph.def.key==='repairer';R.floor=ph?+ph.y.toFixed(1):null;
  ph.use(g);R.flag=!!gs.flags.ph_repairer;R.cap=document.querySelector('#caption .s').textContent;
  const e2=LAB.e(LAB.spawn('repairer',38,11-1.55));e2.die({dir:1});R.again=W.interactables.some(i=>i.def.kind==='phono');
  const v=LAB.e(LAB.spawn('stamper',36,11-2.05));v.die({dir:1});R.variant=(W.interactables.find(i=>i.def.kind==='phono')||{def:{}}).def.key;
  g.state='play';g.togglePause();g.archiveUI.open();R.arch=[...document.querySelectorAll('#archList .btn')].some(b=>b.textContent.indexOf('РЕМОНТНИК')>=0);
  g.archiveUI.close();g.togglePause();
  return {ok:R.drop&&R.floor===11&&R.flag&&R.cap.indexOf('ФОНОГРАММА')>=0&&!R.again&&R.variant==='stamper'&&R.arch,info:R};`;

S.heat_gain=`${PRE()}game.gs.heat=0;
  const e=LAB.e(LAB.spawn('repairer',35.4,11-1.55));e.cd=0;
  LAB.until("e.state==='wind'&&e.nodes[0].teleHot",600);game.world.player.face=1;LAB.step(1,[],{0:['pulse']});LAB.step(2);
  return {ok:e.openT>0&&game.gs.heat===1,info:{open:e.openT>0,heat:game.gs.heat}};`;
/* разрыв: заряженный удар на перегреве вырывает бронированный узел в лоб (обычный удар — рикошет) */
S.heat_rupture=`${PR}
  const nb=()=>b.nodes.filter(n=>n.broken).length,heavy=()=>{p.x=b.cx-2.6;p.face=1;p.vx=0;LAB.step(2);LAB.step(1,['KeyJ'],{0:['attack']});LAB.step(70,['KeyJ']);LAB.step(40);};
  game.gs.heat=0;const n0=nb();heavy();const plain=nb()-n0;
  game.gs.heat=1;const n1=nb();heavy();const rup=nb()-n1;
  return {ok:plain===0&&rup===1&&game.gs.heat===0,info:{plain,rup,heat:game.gs.heat,nodes:b.nodes.map(n=>n.id+':'+n.state).join(' ')}};`;
/* разрыв мимо механизма заряд не тратит */
S.heat_keep_on_miss=`${PRE()}game.gs.heat=2;const p=LAB.p();p.face=-1;
  LAB.step(1,['KeyJ'],{0:['attack']});LAB.step(70,['KeyJ']);LAB.step(40);
  return {ok:game.gs.heat===2,info:{heat:game.gs.heat}};`;
/* давления нет — импульс берёт заряд перегрева */
S.heat_pulse=`${PRE()}const p=LAB.p();p.energy=0;p.energyDelay=9;game.gs.heat=1;
  LAB.step(1,[],{0:['pulse']});LAB.step(2);const fired=p.pulseT>0;
  return {ok:fired&&game.gs.heat===0,info:{fired,heat:game.gs.heat}};`;
/* красный телеграф: таран Надсмотрщика импульсом не срывается — только рывок */
S.red_no_interrupt=`${OV()}
  p.x=b.cx-3.2;p.face=1;b.face=-1;b.state='chargeWind';b.st=0;b.cd=99;
  for(let i=0;i<400&&!b.nodes.some(n=>n.teleHot);i++)LAB.step(1);const red=b.nodes.some(n=>n.teleHot&&n.red);
  game.world.player.face=1;game.world.player.invuln=1e9;LAB.step(1,[],{0:['pulse']});LAB.step(4);
  return {ok:red&&b.state!=='open'&&game.gs.heat===0,info:{red,state:b.state}};`;
/* вариации и новый класс: каждый собирается, живёт 6 с перед курьером без ошибок; активные приёмы — срабатывают */
S.variants_all=`if(!ROOMDEFS.__lab)ROOMDEFS.__lab=gs=>({id:'__lab',zone:'sump',name:'СТЕНД',w:60,h:22,noDress:true,build(R){R.solids=[S(-2,-2,64,2.4,'steel'),S(-2,0,2,22,'steel'),S(60,0,2,22,'steel'),S(0,17,60,5,'concrete')];}});
  const keys=Object.keys(VARIANTS).concat(['mailbot']),res={},fired={};let errs=0;
  for(const a in ADDONS)if(ADDONS[a].act){const f=ADDONS[a].act;ADDONS[a].__f=f;ADDONS[a].act=function(...q){fired[a]=1;return f.apply(this,q);};}
  for(const k of keys){LAB.setup('__lab',28,17-1.68,['pulse','dash']);const W=game.world,p=LAB.p();W.entryT=9;W.playerActed=true;
    const fly=['herald','chandelier','chandler','drone'].indexOf(k)>=0,e=new ENEMY_TYPES[k](W,{type:k,patrol:[20,26]},24,fly?(k==='chandelier'?9.5:13.5):15);W.enemies.push(e);e.face=1;e.alert=6;
    for(let i=0;i<120*8;i++){p.invuln=1e9;game.gs.hp=5;if(i%60===0&&k!=='chandelier')p.x=e.cx+(k==='pendulum'?1.6:4)-p.w/2;if(k==='chandelier'&&i===100)p.x=e.cx-p.w/2;
      try{LAB.step(1);}catch(er){errs++;}}
    res[k]=e.dead?'dead':e.state;}
  for(const a in ADDONS)if(ADDONS[a].__f){ADDONS[a].act=ADDONS[a].__f;delete ADDONS[a].__f;}
  const active=Object.keys(ADDONS).filter(a=>ADDONS[a].act);
  return {ok:errs===0&&keys.length===16&&active.filter(a=>fired[a]).length>=active.length-1,info:{errs,fired:Object.keys(fired).join('+'),missing:active.filter(a=>!fired[a]).join('+')}};`;

/* мини-боссы зон: вход на участок — двери заперты, полоса; половина — ярость (чаще приёмы);
   разобран — двери открыты, награда; приёмы реально идут в бою */
S.mini_arenas=`const out=[];
  for(const room of ['z1_foundry','z2_chapel','z3_herbarium','z4_counter','z5_council']){
    LAB.setup(room,4,10,['pulse','dash','hook','claws','filter','magnet','breaker','vjump']);const W=game.world;W.load(room,2,2);
    const m=W.miniBoss;if(!m){out.push({room,err:'нет мини-босса'});continue;}
    W.entryT=9;W.playerActed=true;const p=LAB.p();p.invuln=1e9;
    const acts={};for(const a in ADDONS)if(ADDONS[a].act){const f=ADDONS[a].act;ADDONS[a].__f=f;ADDONS[a].act=function(...q){acts[a]=(acts[a]||0)+1;return f.apply(this,q);};}
    p.x=m.cx+3;p.y=m.bottom-p.h-0.1;p.vy=0;
    for(let i=0;i<120*12;i++){p.invuln=1e9;game.gs.hp=5;LAB.step(1);if(i%90===0){p.x=m.cx+(i%180?3:-3);p.y=m.bottom-p.h-0.1;}}
    const lock=W.arenaLock,eng=!!m.engaged;
    for(const n of m.nodes)if(!n.broken&&!n.core&&n.id!=='core')n.hp=n.max*0.2;m.hp=m.maxHp*0.3;LAB.step(10);const rage=!!m.enraged;
    for(const n of m.nodes)if(!n.broken)m.breakNode(n,{dir:1,sx:n.wx,sy:n.wy});if(!m.dead)m.die({dir:1});LAB.step(30);
    for(const a in ADDONS)if(ADDONS[a].__f){ADDONS[a].act=ADDONS[a].__f;delete ADDONS[a].__f;}
    out.push({room,eng,lock,rage,open:!W.arenaLock,acts:Object.keys(acts).join('+')});}
  return {ok:out.every(o=>o.eng&&o.lock&&o.rage&&o.open&&o.acts),info:out};`;

/* «СНАРУЖИ · НИЧЕГО · НЕТ»: три звона уклоняемы идеальным вводом — рывок ровно перед касанием кольца
   (к ближней стене / к центру площадки), с разных точек арены фазы III. Сложно, но не гарантированный урон */
S.arc_contra_dodge=AR+`brk('glass');LAB.step(400);brk('cage');LAB.step(900);const W=game.world,R=W.room;
  const spots=[[0.6,30],[49.4,30],[25,21.6],[7,25.6],[43,25.6]],res=[];
  for(const [sx,sy] of spots){
    for(const h of R.hazards)if(h.ctl==='arch'||h.ctl==='arch3')h.active=false;
    W.projectiles.length=0;W.zones=[];p.x=sx-p.w/2;p.y=sy-p.h;p.vx=p.vy=0;p.invuln=0;p.dashT=0;p.dashCd=0;game.gs.hp=5;LAB.step(20);
    b.cd=99;BossDyn.clear(b);b.state='contraWind';b.st=0;let hp0=game.gs.hp,dashes=0;
    for(let i=0;i<900;i++){b.cd=99;if(i>300&&!W.projectiles.some(q=>q.kind==='ring'))break;
      for(const h of R.hazards)if(h.ctl==='arch'||h.ctl==='arch3')h.active=false;
      /* идеальный уклонист: время до касания ближайшего кольца */
      let tmin=9;for(const pr of W.projectiles){if(pr.kind!=='ring'||pr.hit)continue;
        const pts=[[p.cx,p.cy],[p.cx,p.y+0.15],[p.cx,p.bottom-0.1],[p.x+0.08,p.cy],[p.x+p.w-0.08,p.cy]];
        for(const q of pts){const d=Math.hypot(q[0]-pr.x,q[1]-pr.y),gap=d-pr.r-pr.band*0.5;if(gap>-0.01)tmin=Math.min(tmin,gap/pr.vr);}}
      const keys=[];let press=null;
      if(tmin<0.05&&p.dashT<=0&&p.dashCd<=0){const onPlat=Math.abs(p.bottom-21.6)<0.2,hx=b.has('horn')?b.node('horn').wx:b.cx;
        let dir=onPlat?(p.cx<25?1:-1):(p.cx<25?-1:1);keys.push(dir>0?'KeyD':'KeyA');press={0:['dash']};dashes++;}
      LAB.step(1,keys,press);}
    res.push({x:sx,y:sy,dmg:hp0-game.gs.hp,dashes});}
  return {ok:res.every(r=>r.dmg===0),info:res};`;
S.arc_kill=AR+`brk('glass');LAB.step(400);brk('cage');LAB.step(500);b.node('core').locked=false;brk('core');LAB.step(60);
  return {ok:b.dead&&!!game.gs.flags.archivist_dead,info:{dead:b.dead,flag:!!game.gs.flags.archivist_dead}};`;

(async()=>{
  const only=process.argv.slice(2);
  const L=await lab.open({w:960,h:540});
  let bad=0;
  try{
    for(const [name,code] of Object.entries(S)){
      if(only.length&&only.indexOf(name)<0)continue;
      let r;
      try{r=await L.ev(new Function(code));}catch(e){r={ok:false,info:String(e.message||e)};}
      if(!r.ok)bad++;
      console.log((r.ok?'ok   ':'FAIL ')+name.padEnd(20)+JSON.stringify(r.info));
      if(L.errors.length){console.log('     errors: '+L.errors.join(' | '));L.errors.length=0;bad++;}
    }
  }finally{await L.close();}
  console.log(bad?'\nCOMBAT: '+bad+' FAIL':'\nCOMBAT: ALL OK');
  process.exit(bad?1:0);
})();
