"use strict";
/* ============================== WORLD ============================== */
/* ярусы глубже — механизмы крепче */
const ZONE_TIER={sump:0,hives:1,eden:2,seal:3,archive:4};
class World{
  constructor(game){this.game=game;this.room=null;this.enemies=[];this.projectiles=[];
    this.pushables=[];this.interactables=[];this.time=0;this.boss=null;this.bossDoorClosed=false;
    this.parallax=new ParallaxSystem(game);this.waveIdx=-1;this.waveT=0;this.doorCd=0;
    this.nearDoor=null;this.nearInter=null;
    this.anims={};
    this.wheelSeq=false;this.wheelT=0;this.wheelDone2=false;
    this.token=0;this.timers=[];
    /* убитые с последнего отдыха: обычные враги возвращаются, когда курьер отдохнул у фонаря или погиб
       (как в HK); стражи с clearFlag и арены — навсегда */
    this.slain={};
    /* обломки механизмов и лом — живут до смены комнаты */
    this.debris=[];this.scrap=new ScrapSystem(this);}
  /* отложенные события в ИГРОВОМ времени: пауза/хитстоп их честно задерживают,
     смена комнаты (token) — отменяет */
  later(ms,fn){this.timers.push({at:this.time+ms/1000,fn:fn,tok:this.token});}
  runTimers(){
    if(!this.timers.length)return;
    const due=this.timers.filter(t=>t.tok===this.token&&this.time>=t.at);
    this.timers=this.timers.filter(t=>t.tok===this.token&&this.time<t.at);
    for(let i=0;i<due.length;i++)due[i].fn();
  }
  emitNoise(x,y,r){for(let i=0;i<this.enemies.length;i++){const e=this.enemies[i];if(e.hear)e.hear(x,y,r);}}
  /* soft: перезагрузка той же комнаты после изменения мира — без карточки,
     без сброса камеры и частиц, с сохранением инерции игрока */
  /* via = {from, door}: игрок выходит из ПАРНОЙ двери целевой комнаты (link или единственная
     дверь, ведущая обратно) и ставится строго на пол под ней — никаких «висящих» координат */
  load(id,px,py,soft,via){
    const g=this.game,gs=g.gs,def=ROOMDEFS[id];
    if(!def){console.error('no room',id);return;}
    const prev=soft&&this.player?{vx:this.player.vx,vy:this.player.vy,face:this.player.face,
      energy:this.player.energy,invuln:this.player.invuln}:null;
    this.token++;
    g.cinematic.abort();
    this.parallax.dispose();
    this.room=new Room(def,gs);this.room.id=id;
    gs.room=id;gs.visited[id]=true;
    this.time=0;this.projectiles.length=0;this.enemies.length=0;
    this.pushables.length=0;this.interactables.length=0;this.debris.length=0;this.scrap.clear();g.combat.reset();this.zones=[];
    this.boss=null;this.stage=null;this.miniBoss=null;this.arenaLock=false;this.bossDoorClosed=false;this.waveIdx=-1;this.waveT=0;this.doorCd=0.35;
    this.anims={};
    this.wheelSeq=false;this.wheelT=0;this.wheelDone2=false;
    this.nearDoor=null;this.nearInter=null;
    let face=1;
    if(via){const td=pairDoor(this.room,via.from,via.door);
      if(td){const a=doorArrival(this.room,td);px=a.x;py=a.y;face=a.face;this.arrivedDoor=td;}}
    this.player=new Player(this,px,py);this.player.face=face;this.player.energy=this.player.maxEnergy();
    this.entryT=0;this.playerActed=false;this.arrive={x:px+CFG.player.w/2,y:py+CFG.player.h/2};g.lamps.reset();
    if(prev){const p=this.player;p.vx=prev.vx;p.vy=prev.vy;p.face=prev.face;p.energy=prev.energy;p.invuln=prev.invuln;}
    /* точка отката при удушье в пыльце: вход в комнату — заведомо чистый воздух */
    if(!soft||!this.safeSpot)this.safeSpot={x:px,y:py};this.chokeT=0;this.exiting=false;
    /* новая комната / респаун — фильтр продут: задохнуться у самой двери было бы нечестно */
    if(!soft)this.filter=this.filterCap();
    this.room.playerRef=this.player;
    for(let i=0;i<this.room.pushables.length;i++)this.pushables.push(new Pushable(this.room.pushables[i],this));
    for(let i=0;i<this.room.interactables.length;i++)this.interactables.push(new Interactable(this.room.interactables[i],this));
    /* обычные (amb) враги, убитые с последнего отдыха, не появляются; стражи с clearFlag — по флагу комнаты */
    const sl=this.slain[id]||{};
    for(let i=0;i<this.room.enemies.length;i++){
      const e=this.room.enemies[i],C=ENEMY_TYPES[e.type];if(!C)continue;
      const key=e.type+'@'+e.x+','+e.y,amb=e.amb||!this.room.clearFlag;
      if(amb&&sl[key])continue;
      const en=new C(this,e,e.x,e.y);if(amb)en.key=key;en.spawnKey=key;this.empower(en,e);this.enemies.push(en);
      /* мини-босс: элита с ареной — два своих приёма поверх базы (js/entities/variants.js) */
      if(e.mini&&e.elite&&typeof applyVariantDef==='function'){applyVariantDef(en,{name:e.eliteName,tint:null,addons:e.mini.addons,prop:e.mini.prop},'mini');en.mini=e.mini;this.miniBoss=en;}}
    if(this.room.boss){
      const b=this.room.boss;
      const BC={overseer:Overseer,primarch:Primarch,archivist:Archivist,uprooter:Uprooter,regulator:Regulator}[b.type];
      if(BC)this.boss=new BC(this,b.x,b.y);
    }
    this.parallax.build(this.room);
    g.trials.enter(this);
    if(!soft){
      g.camera.reset(clamp(px+0.3,1,Math.max(1,this.room.w-1)),clamp(py-1,1,Math.max(1,this.room.h-1)),1);
      g.particles.clear();
      const Z=ZONES[this.room.zone]||ZONES.sump;g.hud.roomCard(Z.num+' · '+Z.name,this.room.name);
    }
    g.audio.setZone(this.room.zone);
    g.hud.syncAbilities();g.hud.syncHp();
    if(this.room.waves&&!gs.flags[this.room.clearFlag]){this.waveIdx=-2;this.waveT=0;}
    if(id==='z5_surface')g.audio.sky();
  }
  /* сценическая анимация: комната сама рисует её в R.dyn по времени anims[key].t */
  startAnim(key,o){const a=Object.assign({t:0},o||{});this.anims[key]=a;return a;}
  setSolid(pid,fn){const s=this.room.solids.find(q=>q.pid===pid);if(s){fn(s);this.room._edges=null;}return s;}
  /* мягкая перезагрузка после решённой задачи (ядра, манометр, рычаг): убитые здесь не встают —
     решение задачи не наказывается новой дракой */
  reload(){if(!this.room)return;
    const dead=new Set(this.enemies.filter(e=>e.dead&&e.spawnKey).map(e=>e.spawnKey));
    this.load(this.room.id,this.player.x,this.player.bottom-CFG.player.h,true);
    if(dead.size)this.enemies=this.enemies.filter(e=>!dead.has(e.spawnKey));}
  removeSolid(pid){this.room.solids=this.room.solids.filter(s=>s.pid!==pid);this.room._edges=null;}
  /* ящики/решётка разлетаются на месте — без перезагрузки комнаты */
  breakPushable(pb,dir){
    const g=this.game;if(pb.pushed)return;pb.pushed=true;
    if(pb.flag)g.gs.flag(pb.flag);
    this.removeSolid(pb.id);
    g.audio.gate();g.camera.addShake(0.75);g.hitstop(0.06);
    const col=pb.kind==='grate'?'#6b4a3a':'#6a5540',n=Math.min(46,10+Math.round(pb.w*pb.h*2.4));
    for(let i=0;i<n;i++)g.particles.spawn({kind:'debris',x:pb.x+Math.random()*pb.w,y:pb.y+Math.random()*pb.h,
      vx:dir*(3+Math.random()*9)+(Math.random()-0.5)*3,vy:-2-Math.random()*7,g:30,life:1.1+Math.random()*0.7,
      size:0.1+Math.random()*0.2,col:col,rot:Math.random()*6,vr:(Math.random()-0.5)*14,drag:0.35});
    g.particles.burst(pb.x+pb.w/2,pb.y+pb.h*0.6,12,{kind:'smoke',col:'#5a4c40',spd:2.4,life:1.6,size:0.5,grow:1.0,drag:1.4,a:0.5});
    g.tutorial.notify('break_'+pb.id);
  }
  /* отдых у фонаря-чекпоинта: куртка подкачана целиком, враги вернутся на посты, сохранение */
  rest(cp){this.game.lamps.rest(cp);}
  /* передышка на входе: первую секунду никто не бьёт; механизмы у самой двери ждут первого
     действия курьера (шаг, прыжок, удар) — нельзя получить урон, ещё не увидев комнату */
  calm(e){if(this.entryT<1.1)return true;
    if(!this.playerActed&&this.arrive&&Math.hypot(e.cx-this.arrive.x,e.cy-this.arrive.y)<7)return true;
    return false;}
  addDebris(o){const d=new Debris(this,o);this.debris.push(d);
    /* не больше 28 обломков: старые мелкие исчезают первыми, корпуса держатся */
    if(this.debris.length>28){const i=this.debris.findIndex(q=>!q.corpse);this.debris.splice(i>=0?i:0,1);}
    return d;}
  respawn(){const g=this.game;g.gs.hp=g.gs.maxHp();this.slain={};
    this.load(g.gs.cp.room,g.gs.cp.x,g.gs.cp.y);g.hud.syncHp();}
  /* глубже к Архиву — механизмы крепче и резче; элита — вдвое крепче, золотой контур, награда */
  empower(en,d){const t=ZONE_TIER[this.room.zone]||0;
    if(!en.isMech||en.isBoss)return;
    if(t){const k=1+0.12*t;for(const n of en.nodes){n.hp*=k;n.max*=k;}en.hp*=k;en.maxHp*=k;en.tierW=1+0.04*t;}
    if(d.elite){en.elite=true;const k=1.8;for(const n of en.nodes){n.hp*=k;n.max*=k;}en.hp*=k;en.maxHp*=k;
      en.tierW=(en.tierW||1)*1.12;en.scrapOnDeath=14;en.eliteName=d.eliteName||'ЭЛИТА';}}
  /* арена мини-босса: вошёл в его участок — двери заперты, полоса, табличка; половина — ярость; разобран — открыто */
  updateMini(dt){const m=this.miniBoss,g=this.game,p=this.player;if(!m)return;
    if(m.dead){if(this.arenaLock){this.arenaLock=false;g.hud.bossOff();g.audio.door();BossStage.end(this);}this.miniBoss=null;return;}
    if(!m.engaged){const d=(m.def&&m.def.patrol)||[m.cx-6,m.cx+6],A={x:d[0]-2,y:m.y-5,w:d[1]-d[0]+4,h:m.h+6};
      if(p&&!p.dead&&aabb(p.rect(),A)&&!this.calm(m)){m.engaged=true;this.arenaLock=true;m.alert=8;m.investigate={x:p.cx,y:p.cy,t:5};
        g.audio.door();g.camera.addShake(0.5);BossStage.intro(this,m,{k:m.mini.k,n:m.eliteName,e:m.mini.e,l:m.mini.l});}
      return;}
    let s=0,w=0;for(const n of m.nodes){s+=n.broken?0:n.hp/n.max;w++;}const k=clamp(0.5*(w?s/w:1)+0.5*m.hp/(m.maxHp||m.hp),0,1);
    g.hud.boss(m.eliteName,k);
    if(!m.enraged&&k<0.5){m.enraged=true;m.tierW=(m.tierW||1)*1.2;m.addonCdK=0.6;m._acd=Math.min(m._acd||0,0.5);g.audio.bossRoar();g.camera.addShake(0.6);
      g.hud.say('В ЯРОСТИ: ЧАЩЕ И БЫСТРЕЕ.',m.eliteName);}}
  onEliteDown(e){const g=this.game,d=e.def||{};if(d.eliteFlag)g.gs.flag(d.eliteFlag);
    g.hud.say(e.eliteName+' · РАЗОБРАН.','');
    const rid=this.room.id;if(d.reward&&!g.gs.flags[d.reward.flag])this.later(900,()=>{if(this.room&&this.room.id===rid)this.interactables.push(new Interactable(Object.assign({kind:'salvage'},d.reward),this));});
    g.gs.save();}
  spawnWave(i){
    const R=this.room,wv=R.waves[i];if(!wv)return;
    for(let k=0;k<wv.n;k++){
      const C=ENEMY_TYPES[wv.types[k]];if(!C)continue;
      const e=new C(this,{type:wv.types[k],patrol:[wv.x[k]-5,wv.x[k]+5]},wv.x[k],(wv.y||18.2)-1.6);this.empower(e,{});
      this.enemies.push(e);
      this.game.particles.burst(e.cx,e.cy,14,{kind:'steam',col:'#8a7a6a',spd:3,life:0.8,size:0.4,grow:0.8,drag:2});
    }
    this.game.audio.door();
    this.game.hud.say('ВОЛНА '+(i+1)+' ИЗ '+R.waves.length,'');
  }
  checkClear(){
    const R=this.room;if(!R.clearFlag)return;
    if(R.waves&&this.waveIdx<R.waves.length-1)return;
    if(this.enemies.some(e=>!e.dead&&!e.key))return;
    if(this.game.gs.flags[R.clearFlag])return;
    this.game.gs.flag(R.clearFlag);
    this.game.audio.checkpoint();
    if(R.waves){this.game.hud.say('ЗАРЯДНАЯ СТАНЦИЯ РАСКРЫТА.','');
      this.later(1200,()=>this.reload());}
  }
  /* Порядок: machines/hazards -> player -> enemies -> boss -> objects -> events */
  update(dt){
    const g=this.game,R=this.room;
    this.time+=dt;
    for(const k in this.anims)this.anims[k].t+=dt;
    if(R.tick)R.tick(dt,this);
    this.updateMachines(dt);
    this.updateHazards();
    this.updateWaves(dt);
    this.player.update(dt,g.scriptInput||g.input);   /* сцена (финал) ведёт курьера сама */
    this.entryT+=dt;
    if(!this.playerActed){const p=this.player,I=g.input;
      if(I.move!==0||p.jumpBuf>0||!p.onGround||p.atkPhase||p.dashT>0||p.pulseT>0||p.crouch||p.healT>0)this.playerActed=true;}
    g.lamps.update(dt);
    this.updatePollen(dt);
    for(let i=0;i<this.enemies.length;i++){const e=this.enemies[i];e.update(dt);
      if(e.elite&&!e.announced&&!e.dead&&e.alert>0){e.announced=true;g.hud.say(e.eliteName,'ЭЛИТА');}}
    this.updateBoss(dt);
    for(let i=0;i<this.debris.length;i++)this.debris[i].update(dt);
    this.scrap.update(dt);
    g.combat.update(dt);
    /* арена Архивариуса: камера отъезжает, чтобы видеть и пол с соплами, и ядро под сводом */
    {const b=this.boss,cz=(b&&b.activated&&!b.dead&&b.camZoom)||1;if(!this.game.cinematic.active)this.game.camera.tzoom=cz;
      this.game.camera.frame=(b&&b.activated&&!b.dead&&b.camFrame)?b.camFrame():null;}
    /* сцена босса: вступление-«открытка» и смена зала в последней фазе (js/world/bossstage.js) */
    if(this.stage)BossStage.update(this,dt);
    this.updateMini(dt);
    this.game.trials.update(this,dt);
    for(let i=0;i<this.pushables.length;i++)this.pushables[i].update(dt);
    this.updateProjectiles(dt);
    updateZones(this,dt);
    this.updateContact();
    this.updateWeights(dt);
    this.updateCheckpoint();
    this.checkDoors(dt);
    if(R.trigger&&this.player.cx>R.trigger.x&&!g.gs.flags[R.trigger.once]){g.gs.flag(R.trigger.once);g.ending();}
    this.updateEmitters(dt);
    g.particles.update(dt);
    this.runTimers();
  }
  /* пыльца: в облаке фильтр MK-II тратится; пустой (или его нет) — удушье: −1 ячейка и откат
     на последний пол в чистом воздухе (как кислота без защиты). Облако — непроходимая стена,
     пока нет фильтра, и ресурс по времени, когда он есть. Вентколонна (R.air) продувает фильтр. */
  filterCap(){return this.game.gs.flags.filter_cap?160:100;}
  updatePollen(dt){
    const R=this.room,p=this.player,g=this.game,gs=g.gs,cap=this.filterCap();
    if(this.filter===undefined||this.filter>cap)this.filter=cap;
    if(!p||p.dead){this.inPollen=false;return;}
    /* сцена (сальваж, разговор) — фильтр не тратится: задохнуться, читая записку, было бы нечестно */
    if(g.cinematic.active){this.chokeT=0;return;}
    const head={x:p.cx-0.1,y:p.y+0.2,w:0.2,h:0.5};
    const inAir=(R.air||[]).some(a=>aabb(head,a));
    const inP=!inAir&&(R.pollen||[]).some(z=>aabb(head,z));
    this.inPollen=inP;this.inAir=inAir;
    /* безопасная точка: твёрдый пол, всё тело с запасом вне облака */
    if(p.onGround&&!p.onCeil&&p.dashT<=0&&!inP){
      const body={x:p.x-0.4,y:p.y-0.4,w:p.w+0.8,h:p.h+0.8};
      if(!(R.pollen||[]).some(z=>aabb(body,z)))this.safeSpot={x:p.x,y:p.bottom-CFG.player.h};
    }
    if(inAir){this.filter=Math.min(cap,this.filter+cap*1.6*dt);this.chokeT=0;}
    else if(inP){
      this.filter=gs.has('filter')?Math.max(0,this.filter-13*dt):0;
      if(this.filter<=0){
        this.chokeT=(this.chokeT||0)+dt;
        if(Math.random()<dt*14)g.particles.spawn({kind:'dust',x:p.cx+p.face*0.2,y:p.y+0.35,vx:p.face*(1+Math.random()*2),
          vy:-0.5-Math.random(),life:0.6,size:0.06,col:'#dfe88a',drag:1.2,a:0.8,add:true});
        if(this.chokeT>0.25){this.chokeT=0;p.choke(this.safeSpot);}
      }else{this.chokeT=0;
        if(this.filter<cap*0.28){this.beepT=(this.beepT||0)-dt;if(this.beepT<=0){this.beepT=0.8;g.audio.denied();}}}
      if(gs.has('filter')&&Math.random()<dt*1.5)g.audio.nz(0.25,1600,0.6,0.012);
    }else{this.filter=Math.min(cap,this.filter+40*dt);this.chokeT=0;}
  }
  updateHazards(){
    const hz=this.room.hazards;if(!hz)return;
    for(let i=0;i<hz.length;i++){
      const h=hz[i];
      if(h.ctl)continue;
      if(h.kind!=='steam'){h.active=false;h.warn=false;continue;}
      const cyc=(this.time+(h.off||0))%(h.per||2.4);
      h.active=cyc<(h.on||0.7);
      h.warn=!h.active&&cyc>(h.per||2.4)-0.5;
      if(h.look==='press'){}
      else if(h.active&&h.look==='heat'){if(Math.random()<0.5)this.game.particles.spawn({kind:'dust',x:h.x+Math.random()*h.w,y:h.y+Math.random()*h.h,
        vx:0,vy:-2-Math.random()*2,life:0.8,size:0.06,col:'#fff2c0',drag:0.4,a:0.8,add:true});}
      else if(h.active&&Math.random()<0.7)
        this.game.particles.spawn({kind:'steam',x:h.x+Math.random()*h.w,y:h.y+h.h,
          vx:(Math.random()-0.5)*1.4,vy:-7-Math.random()*4,life:0.9,size:0.5,grow:1.5,col:'#e8e0d0',drag:0.7});
    }
  }
  updateWaves(dt){
    const R=this.room,g=this.game;
    if(!R.waves||g.gs.flags[R.clearFlag])return;
    if(this.waveIdx===-2){
      if(this.player.cx>4){this.waveIdx=0;this.spawnWave(0);g.gs.flag(R.waveFlag);}
    }else if(this.waveIdx<R.waves.length&&!this.enemies.some(e=>!e.dead)){
      this.waveT+=dt;
      if(this.waveT>1.4){this.waveT=0;this.waveIdx++;
        if(this.waveIdx<R.waves.length)this.spawnWave(this.waveIdx);
        else this.checkClear();}
    }
  }
  /* сброс позиции: курьер возвращается туда, где вошёл в зал */
  canUnstuck(){const R=this.room;return !!(R&&this.player&&!this.player.dead&&!this.arenaLock&&!this.bossDoorClosed&&!(R.waves&&this.waveIdx>=0&&!this.game.gs.flags[R.clearFlag]));}
  unstuck(){if(!this.canUnstuck())return;const p=this.player,a=this.arrive,g=this.game;
    p.x=a.x-p.w/2;p.y=a.y-p.h/2;p.vx=0;p.vy=0;p.hook=null;p.dashT=0;p.invuln=Math.max(p.invuln,0.8);
    g.camera.reset(p.cx,p.cy,g.camera.zoom);g.flash(0.25,'#000');g.audio.door();}
  updateBoss(dt){
    const g=this.game,R=this.room;
    if(!this.boss)return;
    const b=this.boss;
    if(!b.activated){
      const trg=R.bossTrigger;
      if(trg&&aabb(this.player.rect(),trg)){
        b.activated=true;this.bossDoorClosed=true;
        g.audio.bossRoar();g.audio.door();g.camera.addShake(1.0);
        g.hud.bossOn(b.name);
        BossStage.intro(this,b);
        if(R.bossDoor)g.particles.burst(R.bossDoor.x+0.7,R.bossDoor.y+1,22,{kind:'dust',col:'#7a6c5c',spd:4,life:1,size:0.14,g:12});
      }
      /* механизм-босс до боя — спящий: стоит, дышит, линза тлеет */
      if(!b.activated&&b.isMech)b.update(dt);
      return;
    }
    b.update(dt);
    if(b.dead&&this.bossDoorClosed&&!b.done){
      b.done=true;this.bossDoorClosed=false;BossStage.end(this);
      if(b.type==='overseer'){g.gs.bosses.overseer=true;g.gs.flag('boss1_dead');
        for(const wt of R.weights||[])if(wt.state!=='hang')g.gs.flags['w_drop_'+wt.id]=true;
        /* сброшенные грузы проломили перекрытие у выхода: обратно — только рывком */
        this.later(1300,()=>{
          g.audio.explosion();g.camera.addShake(1.6);g.hitstop(0.12);
          for(let i=0;i<40;i++)g.particles.spawn({kind:'debris',x:2.4+Math.random()*15,y:22+Math.random()*0.6,
            vx:(Math.random()-0.5)*5,vy:-2-Math.random()*6,g:30,life:1.4,size:0.12+Math.random()*0.2,col:'#6b4a3a',
            rot:Math.random()*6,vr:(Math.random()-0.5)*10});
          g.particles.burst(9,22,20,{kind:'smoke',col:'#3a322a',spd:3,life:2.2,size:0.8,grow:1.2,drag:1.2,a:0.5});
          g.hud.say('ПЕРЕКРЫТИЕ НЕ ВЫДЕРЖАЛО ГРУЗОВ.','');
          const p=this.player;
          if(p.bottom>20.5&&p.cx>2&&p.cx<17.9){p.x=18;p.vy=-9;p.vx=4;}
        });
      }
      else if(b.type==='archivist'){g.gs.bosses.archivist=true;g.gs.flag('archivist_dead');
        g.hud.say('ПРИВОД АРХИВАРИУСА ЛЁГ МОСТОМ К КОЛЕСУ.','');}
      else if(b.type==='uprooter'){g.gs.bosses.uprooter=true;g.gs.flag('boss3_dead');g.hud.say('КОРЧЕВАТЕЛЬ ЗАМЕР. В КАТАЛОГЕ БОЛЬШЕ НЕКОМУ НАВОДИТЬ ПОРЯДОК.','');}
      else if(b.type==='regulator'){g.gs.bosses.regulator=true;g.gs.flag('boss4_dead');g.hud.say('ЧАСЫ ВСТАЛИ.','');}
      else{g.gs.bosses.primarch=true;g.gs.flag('boss2_dead');g.gs.flag('turbines_on');}
      g.gs.save();g.audio.door();g.hud.bossOff();
      this.later(2600,()=>this.reload());
    }
  }
  updateProjectiles(dt){
    const g=this.game,R=this.room,p=this.player;
    let dirty=false;
    for(let i=0;i<this.projectiles.length;i++){
      const pr=this.projectiles[i];
      /* снаряды боссов (падающие, кольца, шестерни, пломбы, вспучивания) — своя физика */
      if(BOSS_PR[pr.kind]&&!(pr.kind==='seal'&&pr.back)){pr.life-=dt;const done=updateBossProjectile(this,pr,dt);
        if(done||pr.life<=0){pr.dead=true;dirty=true;}continue;}
      pr.life-=dt;pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.rot=(pr.rot||0)+dt*12;
      if(pr.kind==='nut')pr.vy+=40*dt;
      if(pr.kind==='wave'){pr.vy=0;
        if(Math.random()<0.5)g.particles.spawn({kind:'dust',x:pr.x,y:pr.y,vx:0,vy:-2,life:0.4,size:0.14,col:'#8a7a6a',g:4});}
      let hit=false;
      if(pr.mine){
        /* отражённая импульсом гайка / осколок: бьёт механизмы (урон наносит железо) */
        const b=this.boss,list=b&&b.activated&&!b.dead?this.enemies.concat([b]):this.enemies;
        for(const e of list){if(e.dead||!aabb({x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2},e.rect()))continue;
          const dir=Math.sign(pr.vx)||1;
          if(e.isMech)e.takeHit({kind:'reflect',dmg:22,hb:{x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2},sx:pr.x,sy:pr.y,fromX:pr.x-dir,dir,ky:-1});
          else if(!e.isBoss)e.hurt(22,dir*4,-2);
          hit=true;break;}
        if(!hit)for(let k=0;k<R.solids.length;k++){const s=R.solids[k];if(s.hidden||s.ow)continue;
          if(pr.x>s.x-pr.r&&pr.x<s.x+s.w+pr.r&&pr.y>s.y-pr.r&&pr.y<s.y+s.h+pr.r){hit=true;break;}}
        if(pr.kind==='nut')pr.vy+=0;
      }else if(pr.back){
        /* отражённый осколок: летит сквозь всё, бьёт только ядро (доворачивает за движущимся механизмом) */
        const b=this.boss;
        if(b&&!b.dead&&b.isMech){const dx=b.coreX-pr.x,dy=b.coreY-pr.y,d=Math.hypot(dx,dy)||1,sp=Math.max(14,Math.hypot(pr.vx,pr.vy));
          pr.vx=damp(pr.vx,dx/d*sp,7,dt);pr.vy=damp(pr.vy,dy/d*sp,7,dt);}
        if(b&&!b.dead&&b.isMech&&Math.hypot(pr.x-b.coreX,pr.y-b.coreY)<1.4){
          const cn=b.nodes.find(n=>n.core);
          const tgt=cn&&!cn.locked&&!cn.broken?cn:b.nodes.filter(n=>!n.broken&&!n.locked&&!n.hidden).sort((a,c)=>Math.hypot(a.wx-pr.x,a.wy-pr.y)-Math.hypot(c.wx-pr.x,c.wy-pr.y))[0];
          if(tgt)b.hitNode(tgt,{kind:'reflect',dmg:pr.rdmg||45,hb:b.rect(),sx:tgt.wx,sy:tgt.wy,fromX:pr.x-Math.sign(pr.vx||1),dir:Math.sign(pr.vx)||1,ky:0},false);
          g.audio.explosion();g.hitstop(0.08);g.flash(0.18,'#bfe3ff');
          g.particles.burst(pr.x,pr.y,30,{kind:'spark',col:'#dff0ff',spd:9,life:0.7,size:0.07,add:true,g:12});hit=true;}
        else if(b&&!b.dead&&!b.isMech&&Math.hypot(pr.x-b.coreX,pr.y-b.coreY)<1.6){
          b.hurt(1,0,0,true);b.hitT=0.35;g.audio.explosion();g.camera.addShake(0.9);g.hitstop(0.12);g.flash(0.25,'#bfe3ff');
          g.particles.burst(b.coreX,b.coreY,40,{kind:'spark',col:'#dff0ff',spd:10,life:0.8,size:0.07,add:true,g:12});
          const left=Math.ceil(b.hp);
          hit=true;}
      }else{
        for(let k=0;k<R.solids.length;k++){
          const s=R.solids[k];if(s.hidden||s.ow)continue;
          /* волна катится по полу: её останавливают только стены и колонны */
          if(pr.kind==='wave'&&!(s.y<pr.y-0.3&&s.y+s.h>pr.y))continue;
          if(pr.x>s.x-pr.r&&pr.x<s.x+s.w+pr.r&&pr.y>s.y-pr.r&&pr.y<s.y+s.h+pr.r){hit=true;break;}}
        if(!hit&&aabb({x:pr.x-pr.r,y:pr.y-pr.r,w:pr.r*2,h:pr.r*2},p.rect())){p.hurtBy(pr.dmg,pr.x);hit=true;}
      }
      if(hit||pr.life<=0){pr.dead=true;dirty=true;
        g.particles.burst(pr.x,pr.y,8,{kind:'spark',col:'#ffd27a',spd:4,life:0.35,size:0.05,add:true,g:12});}
    }
    if(dirty)this.projectiles=this.projectiles.filter(p=>!p.dead);
  }
  /* касание врага ранит (рывок неуязвим и проходит насквозь; оглушённые и вскрытые — безопасны) */
  updateContact(){
    const p=this.player,g=this.game;
    if(!p||p.dead||p.invuln>0||p.dashT>0)return;
    const pr=p.rect(),inset=r=>({x:r.x+0.12,y:r.y+0.15,w:Math.max(0.1,r.w-0.24),h:Math.max(0.1,r.h-0.2)});
    for(let i=0;i<this.enemies.length;i++){
      const e=this.enemies[i];
      if(e.dead||(e.safe&&e.safe())||this.calm(e)||!Settings.diff().contact)continue;
      if(aabb(inset(e.rect()),pr)){g.combat.contactDamage(p,e,1);return;}
    }
    const b=this.boss;
    if(b&&b.activated&&!b.dead&&!(b.safe&&b.safe())&&aabb(inset(b.rect()),pr))g.combat.damagePlayer(1,b.cx);
  }
  updateWeights(dt){
    const R=this.room,g=this.game;
    if(!R.weights)return;
    for(let i=0;i<R.weights.length;i++){
      const wt=R.weights[i];
      /* промах: кран подаёт груз заново — бой не может «сломаться» */
      if(wt.state==='down'&&wt.rehang>0){wt.rehang-=dt;
        if(wt.rehang<=0&&this.boss&&!this.boss.dead){wt.state='hang';wt.y=wt.y0;wt.vy=0;
          g.audio.lever();g.particles.burst(wt.x,wt.cableTop+0.4,14,{kind:'spark',col:'#ffe6a3',spd:4,life:0.5,size:0.05,add:true,g:8});
}
        continue;}
      if(wt.state!=='fall')continue;
      wt.vy=(wt.vy||0)+42*dt;wt.y+=wt.vy*dt;
      if(Math.random()<0.5)g.particles.spawn({kind:'dust',x:wt.x+(Math.random()-0.5)*2,y:wt.y,
        vy:-1,life:0.5,size:0.1,col:'#8a7a6a',g:2});
      if(wt.y+wt.h>=22){
        wt.y=22-wt.h;wt.state='down';g.audio.explosion();g.camera.addShake(1.7);g.hitstop(0.16);
        g.particles.burst(wt.x,22,44,{kind:'debris',col:'#8a7a6a',spd:11,life:1.3,size:0.2,g:30});
        g.particles.burst(wt.x,22,26,{kind:'dust',col:'#6b5f52',spd:6,life:1.6,size:0.5,grow:1.2,g:6});
        g.particles.spawn({kind:'shock',x:wt.x,y:21.8,ringR:7,life:0.5,size:0.1,col:'#ffcf7a',add:true,a:0.6});
        const hitBoss=this.boss&&!this.boss.dead&&Math.abs(this.boss.cx-wt.x)<3.8;
        if(!hitBoss&&this.boss&&!this.boss.dead)wt.rehang=6;
        if(hitBoss&&this.boss.weightHit){this.boss.weightHit(wt);}
        else if(hitBoss){
          this.boss.hurt(20.5,0,0,true);this.boss.weightHits=(this.boss.weightHits||0)+1;
          g.particles.burst(this.boss.cx,this.boss.cy,40,{kind:'spark',col:'#ffb45a',spd:12,life:0.9,size:0.08,add:true,g:20});
          if(this.boss.hp<=0)this.boss.die();
        }
        if(aabb({x:wt.x-wt.w/2,y:22-wt.h,w:wt.w,h:wt.h},this.player.rect()))this.player.hurtBy(1,wt.x);
      }
    }
  }
  updateCheckpoint(){
    const cp=this.room.checkpoint;if(!cp)return;
    const p=this.player;
    if(!cp.lit&&Math.abs(p.cx-cp.x)<1.5&&Math.abs(p.bottom-cp.y)<2.4)this.game.checkpoints.activate(cp);
  }
  updateMachines(dt){
    const R=this.room,g=this.game,ms=R.machines;
    if(R.pogos)for(const q of R.pogos)if(q.hitT>0)q.hitT-=dt;
    if(ms)for(let i=0;i<ms.length;i++){
      const m=ms[i];
      if(m.kind==='flywheel')m.a=(m.a||0)+m.spd*dt;
      else if(m.kind==='crane'){
        if(m.x===undefined){m.x=m.x0;m.dir=1;}
        m.x+=m.spd*m.dir*dt;
        if(m.x>m.x1)m.dir=-1;if(m.x<m.x0)m.dir=1;
      }
      else if(m.kind==='turbines'){m.sp=damp(m.sp===undefined?(m.on?7:0.15):m.sp,m.on?7:0.15,0.7,dt);m.a=(m.a||0)+m.sp*dt;}
      else if(m.kind==='sealwheel')m.a=(m.a||0)+(m.turned?0.4:0)*dt;
      else if(m.kind==='archivist')m.t=(m.t||0)+dt;
      else if(m.kind==='swayCab')m.a=Math.sin(this.time*0.4+(m.ph||0))*m.amp;
      else if(m.kind==='needle')m.v=(m.v||0)+dt;
      else if(m.kind==='chain')m.a=Math.sin(this.time*0.8+m.ph)*0.05;
    }
    if(this.wheelSeq){
      this.wheelT+=dt;
      if(ms)for(let i=0;i<ms.length;i++)if(ms[i].kind==='sealwheel'){ms[i].turned=true;ms[i].a=(ms[i].a||0)+dt*0.7;}
      if(Math.random()<0.4)g.particles.spawn({kind:'dust',x:22+(Math.random()-0.5)*6,y:22,
        vy:-1.4,life:1.4,size:0.12,col:'#8a8d94',g:2});
      if(this.wheelT>4.2&&!this.wheelDone2){
        this.wheelDone2=true;this.wheelSeq=false;
        g.gs.flag('wheel_open');g.flash(1.0);
        g.hud.say('СВИНЕЦ. СТАЛЬ. БЕТОН. ШЛЮЗЫ УШЛИ ВВЕРХ. СВЕТ.','ПЕЧАТЬ СНЯТА');
        g.transition(()=>g.world.load('z5_surface',3,15.0));
      }
    }
  }
  updateEmitters(dt){
    const R=this.room,g=this.game,cam=g.camera,ex=R.emitters;
    if(!ex)return;
    for(let i=0;i<ex.length;i++){
      const e=ex[i];
      e.acc=(e.acc||0)+dt;
      const iv=1/(e.rate||1);
      let guard=0;
      while(e.acc>iv&&guard++<5){
        e.acc-=iv;
        const x=e.x===undefined?this.player.cx+(Math.random()-0.5)*30:e.x+(Math.random()-0.5)*(e.sw||0.6);
        const y=e.y===undefined?this.player.cy+(Math.random()-0.5)*17:e.y;
        if(x<cam.cx-24||x>cam.cx+24||y<cam.cy-14||y>cam.cy+14)continue;
        switch(e.type){
          case 'steam':g.particles.spawn({kind:'steam',x:x,y:y,vx:(Math.random()-0.5)*0.7,vy:-1.6-Math.random()*1.4,
            life:2.4+Math.random(),size:0.3*(e.s||1),grow:0.85*(e.s||1),col:'#b8ada0',drag:0.7,a:0.4});break;
          case 'smoke':g.particles.spawn({kind:'smoke',x:x,y:y,vx:(Math.random()-0.5)*0.5,vy:-0.9,
            life:3,size:0.4,grow:0.6,col:'#2f2a24',drag:0.8,a:0.38});break;
          case 'drip':g.particles.spawn({kind:'droplet',x:x,y:y,vx:0,vy:0.4,g:26,life:2.2,size:0.055,col:'#9fc4d0',drag:0.02,a:0.8});break;
          case 'spark':if(Math.random()<0.7)g.particles.burst(x,y,4,{kind:'spark',col:'#ffcf7a',spd:4,life:0.5,
            size:0.045,add:true,g:16,ang:-PI/2,spread:2.2});break;
          case 'dust':g.particles.spawn({kind:'dust',x:x,y:y,vx:(Math.random()-0.5)*0.35,vy:(Math.random()-0.5)*0.2,
            life:5+Math.random()*4,size:0.035+Math.random()*0.045,col:'#cbbfa6',drag:0.1,a:0.34,noise:0.4});break;
          case 'pollen':g.particles.spawn({kind:'dust',x:x,y:y,vx:(Math.random()-0.5)*0.4,vy:-0.15+Math.random()*0.3,
            life:7,size:0.05+Math.random()*0.05,col:'#dfe88a',drag:0.12,a:0.6,noise:0.7,add:true});break;
          case 'leaf':g.particles.spawn({kind:'leaf',x:x,y:y,vx:(Math.random()-0.5)*0.8,vy:0.5+Math.random()*0.5,
            life:9,size:0.13+Math.random()*0.1,col:Math.random()>0.5?'#7a9a52':'#b8c46a',drag:0.15,
            rot:Math.random()*TAU,vr:(Math.random()-0.5)*3,noise:1.2,a:0.85});break;
          case 'mist':g.particles.spawn({kind:'steam',x:x,y:y,vx:(Math.random()-0.5)*0.5,vy:-0.2,
            life:6,size:1.6,grow:0.5,col:'#e6ecd0',drag:0.3,a:0.11});break;
          case 'wind':g.particles.spawn({kind:'dust',x:this.player.cx+22,y:this.player.cy+(Math.random()-0.5)*14,
            vx:-9-Math.random()*5,vy:(Math.random()-0.5),life:4,size:0.05,col:'#9fb0b8',drag:0.02,a:0.3});break;
          case 'windseed':g.particles.spawn({kind:'dust',x:this.player.cx-24,y:this.player.cy+(Math.random()-0.5)*10,
            vx:3+Math.random()*3,vy:(Math.random()-0.5)*0.6,life:8,size:0.045,col:'#ffffff',drag:0.02,a:0.5,noise:0.6});break;
          case 'airjet':g.particles.spawn({kind:'dust',x:x+(Math.random()-0.5)*2,y:y,vx:(Math.random()-0.5)*0.3,vy:-6-Math.random()*5,
            life:2.2,size:0.04+Math.random()*0.04,col:'#e6f4ff',drag:0.1,a:0.6,add:true});break;
          case 'coolant':g.particles.spawn({kind:'dust',x:x,y:e.y!==undefined?y:37.3,vx:(Math.random()-0.5)*0.4,vy:-0.5-Math.random()*0.6,
            life:3,size:0.07,col:'#8ff0b4',drag:0.4,a:0.5,add:true,noise:0.5});break;
        }
      }
    }
  }
  /* Двери НИКОГДА не срабатывают сами: только E/F, стоя в проёме. */
  checkDoors(dt){
    const g=this.game,R=this.room,p=this.player;
    this.nearDoor=null;this.nearInter=null;this.nearRest=null;
    if(this.doorCd>0)this.doorCd-=dt;
    const busy=this.bossDoorClosed||this.arenaLock||(R.waves&&this.waveIdx>=0&&!g.gs.flags[R.clearFlag]);
    if(!busy&&!p.dead){
      for(let i=0;i<R.doors.length;i++){
        const d=R.doors[i];
        if(!aabb(p.rect(),d))continue;
        /* провал (fall): переход срабатывает сам, когда курьер падает в дыру — не по E */
        if(d.fall){if(p.vy>0&&this.doorCd<=0&&!g.gates.doorLocked(d)){this.doorCd=0.9;this.exiting=true;g.enterRoom(d);}continue;}
        this.nearDoor={d:d,locked:g.gates.doorLocked(d),down:!!d.down};break;
      }
    }
    /* E — к ближайшему объекту в досягаемости (а не к первому в списке) */
    let best=2.6;
    for(let i=0;i<this.interactables.length;i++){
      const it=this.interactables[i];
      if(!it.canUse(g.gs))continue;
      const r=it.rect(),dd=dist(p.cx,p.cy,r.x+r.w/2,r.y+r.h/2);
      if(dd<best){best=dd;this.nearInter=it;}
    }
    /* фонарь-чекпоинт: E — отдых (полная куртка, враги возвращаются на посты). У самого фонаря
       отдых важнее люка/двери под ногами; объект ближе фонаря — важнее отдыха */
    const cp=R.checkpoint;
    if(cp&&!p.dead&&p.onGround&&!this.boss&&Math.abs(p.bottom-cp.y)<0.6){
      const rd=Math.abs(p.cx-cp.x),interD=this.nearInter?best:99;
      if(rd<1.5&&interD>rd&&(rd<0.9||!this.nearDoor))this.nearRest=cp;}
    if(g.input.consume('use')){
      if(this.nearRest)this.rest(this.nearRest);
      else if(this.nearInter)this.nearInter.use(g);
      else if(this.nearDoor){
        if(this.nearDoor.locked)g.gates.tryDoor(this.nearDoor.d);
        else if(this.doorCd<=0){this.doorCd=0.9;g.enterRoom(this.nearDoor.d);}
      }
    }
  }
}
