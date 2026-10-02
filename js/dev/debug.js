"use strict";
/* ============================== DEBUG ============================== */
class DebugUI{
  constructor(game){this.game=game;this.on=false;this.el=document.getElementById('debug');
    this.fpsEl=document.getElementById('dbgfps');this.tick=0;this.pTick=0;}
  toggle(){this.on=!this.on;this.el.classList.toggle('hidden',!this.on);
    this.fpsEl.classList.toggle('hidden',!this.on);if(this.on)this.build();}
  resetPlayer(){
    if(!this.on)return;
    const g=this.game;
    if(g.state==='play'&&g.world.room){g.world.respawn();g.hud.say('DEBUG · РЕСПОН НА ЧЕКПОИНТЕ','');}
  }
  build(){
    const g=this.game,gs=g.gs,ids=Object.keys(ROOMDEFS),o=g.debugOpts;
    let h='<b>КЕНОТАФ · DEBUG</b> (F1) · F2 = РЕСПОН';
    h+='<div class="row">ROOM <select id="dbgRoom">'+ids.map(i=>'<option '+(i===(g.world.room?g.world.room.id:'')?'selected':'')+'>'+i+'</option>').join('')+'</select><button id="dbgGo">TP</button></div>';
    h+='<div class="row"><button id="dbgAb">ВСЕ СПОСОБНОСТИ</button><button id="dbgHp">HP MAX</button></div>';
    h+='<div class="row"><button id="dbgInv" class="'+(o.invuln?'act':'')+'">INVULN</button>'+
       '<button id="dbgCol" class="'+(o.collision?'act':'')+'">COLLISION</button>'+
       '<button id="dbgPl" class="'+(o.collider?'act':'')+'">PLAYER BOX</button></div>';
    h+='<div class="row"><button id="dbgGates" class="'+(o.gates?'act':'')+'">GATES</button>'+
       '<button id="dbgBounds" class="'+(o.bounds?'act':'')+'">BOUNDS</button></div>';
    h+='<div class="row"><button id="dbgSpawn">SPAWN REPAIRER</button><button id="dbgRestart">RESTART ROOM</button></div>';
    h+='<div class="row">TIMESCALE <input id="dbgTs" type="range" min="0.1" max="2" step="0.1" value="'+g.timeScale.toFixed(1)+'" style="width:86px"><span id="dbgTsv">'+g.timeScale.toFixed(1)+'</span></div>';
    h+='<div class="row"><button id="dbgFlags">DUMP FLAGS</button><button id="dbgWipe">WIPE SAVE</button></div>';
    h+='<div class="row"><button id="dbgReach">ДОСТИЖИМОСТЬ КОМНАТЫ</button></div>';
    h+='<div id="dbgP"></div>';
    h+='<div id="dbgInfo" style="margin-top:4px;color:#7fd8ac"></div>';
    this.el.innerHTML=h;
    const $=id=>document.getElementById(id);
    $('dbgGo').onclick=()=>{g.transition(()=>g.world.load($('dbgRoom').value,3,3));};
    $('dbgAb').onclick=()=>{for(const k in ABILITIES)gs.abilities[k]=true;gs.save();g.hud.syncAbilities();g.world.reload();};
    $('dbgHp').onclick=()=>{gs.hp=gs.maxHp();gs.weld=gs.weldMax();g.hud.syncHp();};
    $('dbgInv').onclick=()=>{o.invuln=!o.invuln;this.build();};
    $('dbgCol').onclick=()=>{o.collision=!o.collision;this.build();};
    $('dbgPl').onclick=()=>{o.collider=!o.collider;this.build();};
    $('dbgGates').onclick=()=>{o.gates=!o.gates;this.build();};
    $('dbgBounds').onclick=()=>{o.bounds=!o.bounds;this.build();};
    $('dbgSpawn').onclick=()=>{const w=g.world;if(!w.room)return;
      w.enemies.push(new Repairer(w,{type:'repairer',patrol:[w.player.x-6,w.player.x+6]},w.player.x+4,w.player.y));};
    $('dbgRestart').onclick=()=>g.world.reload();
    $('dbgTs').oninput=e=>{g.timeScale=parseFloat(e.target.value);$('dbgTsv').textContent=g.timeScale.toFixed(1);};
    $('dbgFlags').onclick=()=>{console.log(JSON.stringify(gs.serialize(),null,1));
      $('dbgInfo').textContent='FLAGS: '+Object.keys(gs.flags).join(', ');};
    $('dbgWipe').onclick=()=>{SaveSystem.wipe();gs.reset();g.hud.syncAbilities();if(g.world.room)g.world.reload();};
    $('dbgReach').onclick=()=>{const w=g.world;if(!w.room)return;
      const ab=Object.keys(gs.abilities).filter(k=>gs.abilities[k]);
      const r=LevelAudit.run(w.room.id,ab,{starts:[{x:w.player.x,y:w.player.y}],max:200});
      w.reload();
      $('dbgInfo').innerHTML='REACH '+r.room+' ['+r.abil+'] st:'+r.states+' '+r.ms+'ms<br>'+
        r.doors.concat(r.inters,r.push).join('<br>');};
  }
  update(dt){
    if(!this.on)return;
    const g=this.game,w=g.world,p=w&&w.player;
    if(p&&w.room)this.fpsEl.textContent='FPS '+g.fps.toFixed(0)+' | '+w.room.id+' | PRT '+g.particles.aliveCount;
    this.tick+=dt;this.pTick+=dt;
    if(this.pTick>0.1){
      this.pTick=0;
      const el=document.getElementById('dbgP');
      if(el&&p)el.textContent=
        'X      '+p.x.toFixed(3)+'\n'+
        'Y      '+p.y.toFixed(3)+'\n'+
        'BOTTOM '+p.bottom.toFixed(3)+'\n'+
        'VX     '+p.vx.toFixed(2)+'\n'+
        'VY     '+p.vy.toFixed(2)+'\n'+
        'GROUND '+(p.onGround?'YES':'no ')+' was:'+(p.wasGrounded?'Y':'n')+' land:'+(p.justLanded?'Y':'n')+'\n'+
        'COYOTE '+Math.max(0,p.coyote).toFixed(3)+'\n'+
        'JBUF   '+Math.max(0,p.jumpBuf).toFixed(3)+'\n'+
        'WALL   '+p.wall+'  wallT:'+Math.max(0,p.wallT).toFixed(2)+'\n'+
        'H      '+p.h.toFixed(2)+'  ceil:'+(p.onCeil?'Y':'n')+'\n'+
        'STATE  '+p.state;
    }
    if(this.tick>0.5){this.tick=0;const i=document.getElementById('dbgInfo');
      if(i&&w&&w.room)i.innerHTML='EN '+w.enemies.filter(e=>!e.dead).length+
        ' | BOSS '+(w.boss?w.boss.hp.toFixed(0):'-')+' | TOK '+w.token+' | CP '+g.gs.cp.room;}
  }
}
