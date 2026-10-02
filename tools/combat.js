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
  game.debugOpts.invuln=true;let both=0,any=0;
  for(let i=0;i<1200;i++){LAB.step(1);const aa=a.state==='wind'||a.state==='strike',bb=b.state==='wind'||b.state==='strike';
    if(aa&&bb)both++;if(aa||bb)any++;}
  game.debugOpts.invuln=false;
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
