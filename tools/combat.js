/* Регрессия боя «ломать, а не убивать»: сценарии на настоящей физике и вводе.
   node tools/combat.js [имя_сценария ...]   — код выхода 1, если хоть один сценарий провален */
'use strict';
const lab=require('./lab');

const S={};
/* общий пролог: курьер в стартовой нише (пол y=11, свободно x 32..42), механизм справа */
const PRE=(room,px,ab)=>`LAB.setup('${room||'z1_start'}',${px||34},11-1.68,${JSON.stringify(ab||['pulse','dash'])});`;

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

/* ---------- Архивариус (старый босс): импульс без урона не должен сломать его бой ---------- */
S.archivist_reflect=`LAB.setup('z4_antechamber',22,24-1.68,['pulse','dash','claws','magnet','filter'],['gaugeA','gaugeB','gaugeC']);LAB.step(2);
  const b=game.world.boss;if(!b)return {ok:false,info:'no boss'};b.activated=true;b.shotT=0.05;const p=LAB.p();const hp0=b.hp;
  game.world.player.invuln=1e9;let hit=false;
  for(let i=0;i<600&&!hit;i++){LAB.step(1);const o=game.world.projectiles.find(q=>q.kind==='orb'&&!q.back);
    if(o&&Math.hypot(o.x-p.cx,o.y-p.cy)<2.6){p.face=o.x>p.cx?1:-1;LAB.step(1,[],{0:['pulse']});LAB.step(240);hit=b.hp<hp0;}}
  game.world.player.invuln=0;
  return {ok:hit,info:{hp0,hp:b.hp}};`;

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
