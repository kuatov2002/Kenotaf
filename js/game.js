"use strict";
/* ============================== GAME ============================== */
class Game{
  constructor(){
    this.canvas=document.getElementById('game');
    this.ctx=this.canvas.getContext('2d',{alpha:false});
    this.input=new Input();
    this.audio=new AudioSystem();
    this.gs=new GameState();
    this.particles=new ParticleSystem(1200);
    this.camera=new Camera();
    this.renderer=new WorldRenderer(this);
    this.world=new World(this);
    this.hud=new HUD(this);
    this.combat=new Combat(this);
    this.fx=new CombatFX(this);
    this.gates=new GateSystem(this);
    this.checkpoints=new CheckpointSystem(this);
    this.lamps=new LampSystem(this);
    this.salvage=new SalvageSystem(this);
    this.abilities=new AbilitySystem(this);
    this.cinematic=new Cinematic(this);this.finale=new Finale(this);
    this.tutorial=new TutorialSystem(this);
    this.map=new WorldMap(this);
    this.travel=new TravelMenu(this);
    this.menuNav=new MenuNav(this);
    this.state='menu';this.timeScale=1;this.hitstopT=0;this.acc=0;this.last=0;this.fps=60;this.slowT=0;this.slowK=1;
    this.transitionT=-1;this.transitionCb=null;this.vw=0;this.vh=0;this.ppm=40;this.bakePpm=40;
    this.menuT=0;this.menuRoom=null;this.menuPar=null;
    this.resize();
    addEventListener('resize',()=>this.resize());
    this.bindUI();
    const sv=SaveSystem.read();
    if(sv)this.gs.deserialize(sv);
    if(Settings.get('fullscreen'))Settings.set('fullscreen',false);   /* полноэкранный режим браузер даёт только по жесту игрока */
    this.buildMenuScene();
    requestAnimationFrame(ts=>this.frame(ts));
  }
  buildMenuScene(){
    this.menuRoom=new Room(ROOMDEFS.z1_hub,this.gs);
    this.menuRoom.playerRef=null;
    if(this.menuPar)this.menuPar.dispose();
    this.menuPar=new ParallaxSystem(this);
    this.menuPar.build(this.menuRoom);
  }
  bindUI(){
    const $=id=>document.getElementById(id);
    this.settingsUI=new SettingsUI(this);this.archiveUI=new ArchiveUI(this);this.packUI=new PackUI(this);this.trials=new TrialSystem(this);
    const startNew=()=>{this.audio.init();SaveSystem.wipe();this.gs.reset();this.hud.syncAbilities();this.hud.buildHp();
      $('confirm').classList.add('hidden');this.playIntro(()=>this.begin('z1_start',3.2,9.3));};
    $('btnStart').onclick=()=>{if(SaveSystem.read()){$('menu').classList.add('hidden');$('confirm').classList.remove('hidden');}else startNew();};
    $('btnNewYes').onclick=startNew;
    $('btnNewNo').onclick=()=>{$('confirm').classList.add('hidden');$('menu').classList.remove('hidden');};
    $('btnContinue').onclick=()=>{this.audio.init();
      const sv=SaveSystem.read();if(!sv)return;this.gs.reset();this.gs.deserialize(sv);this.gs.hp=this.gs.maxHp();
      this.hud.syncAbilities();this.hud.buildHp();this.begin(this.gs.cp.room,this.gs.cp.x,this.gs.cp.y);};
    $('intro').onclick=()=>{if(this.state==='intro'&&this.introT>0.3)this.introNext();};
    /* после финала: пять стражей подряд на время (js/world/exam.js) */
    $('btnExam').onclick=()=>{this.audio.init();CouncilExam.start(this);};
    this.examButton();
    $('btnCtrls').onclick=()=>{buildControls(SaveSystem.read()?this.gs:null);$('menu').classList.add('hidden');$('controls').classList.remove('hidden');};
    $('btnBack').onclick=()=>{$('controls').classList.add('hidden');$('menu').classList.remove('hidden');};
    $('btnSettings').onclick=()=>this.settingsUI.open('menu');
    $('btnPauseSet').onclick=()=>this.settingsUI.open('pause');
    $('btnArchive').onclick=()=>this.archiveUI.open();
    $('btnPack').onclick=()=>this.packUI.open();
    $('btnResume').onclick=()=>this.togglePause();
    /* страховка от застревания: вернуться к точке входа в зал (не в бою с боссом и не на арене) */
    $('btnUnstuck').onclick=()=>{if($('btnUnstuck').classList.contains('dim'))return;this.togglePause();this.world.unstuck();};
    $('btnToMenu').onclick=()=>{this.gs.save();this.toMenuState();};
    $('btnPause').onclick=()=>this.togglePause();
    $('btnMute').onclick=()=>{this.audio.init();this.audio.toggleMute();};
    $('btnContinue').classList.toggle('dim',!SaveSystem.read());
    $('loreT').textContent=LORE_TOTAL;
    /* сохранение не теряется при закрытии вкладки: мир и так пишется флагами сразу, здесь — страховка */
    const flush=()=>{if(this.state==='play'||this.state==='pause'||this.state==='travel')this.gs.save();};
    addEventListener('pagehide',flush);addEventListener('beforeunload',flush);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){flush();if(this.state==='play')this.togglePause();}});
  }
  /* кнопка экзамена: только после финала; под ней — рекорд */
  examButton(){const b=document.getElementById('btnExam');if(!b)return;const on=CouncilExam.available(),r=CouncilExam.rec();
    b.classList.toggle('hidden',!on);b.innerHTML='ЭКЗАМЕН СОВЕТА'+(r.best!==undefined?'<small>РЕКОРД '+fmtT(r.best)+(r.done?' · ШАРФ МАСТЕРА':'')+'</small>':'');}
  toMenuState(){
    CouncilExam.abort();
    this.finale.end();document.getElementById('endcard').classList.remove('sky');
    this.cinematic.abort();
    this.state='menu';this.timeScale=1;
    for(const id of ['pause','settings','archive','pack','controls','confirm'])document.getElementById(id).classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    /* концовка ставила inline opacity:1 — без сброса чёрный экран оставался поверх меню */
    const ec=document.getElementById('endcard');ec.classList.remove('on');ec.style.opacity='';
    document.getElementById('btnContinue').classList.toggle('dim',!SaveSystem.read());
    this.examButton();
    this.hud.show(false);this.hud.hint(null);this.input.enabled=true;this.input.clearAll();
    this.camera.reset(18,24,1.14);
    this.audio.setZone('sump');
    this.particles.clear();
    this.buildMenuScene();
  }
  begin(room,x,y){
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('controls').classList.add('hidden');
    const ec=document.getElementById('endcard');ec.classList.remove('on');ec.style.opacity='';
    this.hud.show(true);this.state='play';this.timeScale=1;
    this.input.enabled=true;this.input.clearAll();
    this.transition(()=>{this.world.load(room,x,y);this.hud.syncAbilities();this.hud.syncHp();});
  }
  /* вступление: карточки текста, E/Space/клик — дальше, Esc — пропустить */
  playIntro(cb){
    const el=document.getElementById('intro');
    document.getElementById('menu').classList.add('hidden');
    el.classList.remove('hidden');this.state='intro';this.introI=-1;this.introCb=cb;this.introT=0;this.introNext();
  }
  introNext(){
    const el=document.getElementById('intro'),it=el.querySelector('.it');
    this.introI++;this.introT=0;
    if(this.introI>=INTRO.length){this.introEnd();return;}
    const c=INTRO[this.introI];
    it.classList.remove('on');el.querySelector('.ik').textContent=c.k;
    el.querySelector('.leaf').classList.toggle('on',!!c.leaf);
    setTimeout(()=>{it.textContent=c.t;it.classList.add('on');},180);
    this.audio.tone(330+this.introI*40,0.5,'sine',0.025,0,this.audio.verb);
  }
  introEnd(){
    if(this.state!=='intro')return;
    document.getElementById('intro').classList.add('hidden');this.state='menu';
    const cb=this.introCb;this.introCb=null;if(cb)cb();
  }
  togglePause(){
    if(this.state==='travel'){this.travel.close();return;}
    if(this.state==='intro'){this.introEnd();return;}
    if(this.state==='pause'&&!document.getElementById('pack').classList.contains('hidden')){this.packUI.close();return;}
    if(this.state==='pause'&&(this.settingsUI.from||!document.getElementById('archive').classList.contains('hidden'))){
      if(this.settingsUI.from)this.settingsUI.close();else this.archiveUI.close();return;}
    if(this.state==='menu'){const $=id=>document.getElementById(id);
      if(this.settingsUI.from){this.settingsUI.close();return;}
      if(!$('controls').classList.contains('hidden')){$('btnBack').click();return;}
      if(!$('confirm').classList.contains('hidden')){$('btnNewNo').click();return;}
      return;}
    if(this.state==='play'){
      this.state='pause';
      document.getElementById('pause').classList.remove('hidden');
      if(this.world.room)document.getElementById('pauseInfo').textContent=
        ZONES[this.world.room.zone].name+' · '+this.world.room.name;
      document.getElementById('journal').innerHTML=journalHTML(this.gs);
      Portraits.draw(document.getElementById('jpt'),'courier',performance.now()/1000);
      document.getElementById('btnUnstuck').classList.toggle('dim',!this.world.canUnstuck());
      if(!this.mapCv){this.mapCv=document.getElementById('mapcv');
        this.mapCv.addEventListener('click',()=>{this.map.whole=!this.map.whole;this.map.render(this.mapCv);});}
      requestAnimationFrame(()=>this.map.render(this.mapCv));
      this.input.enabled=false;this.input.clearAll();
    }else if(this.state==='pause'){
      this.state='play';
      document.getElementById('pause').classList.add('hidden');
      this.input.enabled=true;this.input.clearAll();
    }
  }
  enterRoom(d){
    if(!this.gates.tryDoor(d))return;
    this.tutorial.notify('door');
    this.transition(()=>{
      if(d.elevator)this.audio.elevator();else this.audio.door();
      this.world.load(d.to,d.tx,d.ty,false,{from:this.world.room.id,door:d});
    });
  }
  transition(cb){if(this.transitionT>=0)return;this.transitionT=0;this.transitionCb=cb;}
  /* вспышки щадят глаза: не ярче 0.35, если это не сцена (force) */
  flash(a,col,force){if(!force)a=Math.min(a,0.35);const f=document.getElementById('flash');
    f.style.background=col||'#fff';f.style.transition='none';f.style.opacity=a;
    void f.offsetWidth;f.style.transition='opacity .55s ease';f.style.opacity=0;}
  hitstop(t){this.hitstopT=Math.max(this.hitstopT,t);}
  /* замедление времени (идеальное уклонение, прерывание): реальные секунды, множитель */
  slowmo(t,k){this.slowT=Math.max(this.slowT,t);this.slowK=Math.min(this.slowT>t?this.slowK:1,k);}
  onPlayerDeath(){
    if(CouncilExam.on&&!CouncilExam.done){CouncilExam.fail();return;}   /* экзамен: упал — не сдан */
    this.gs.hp=this.gs.maxHp();this.world.slain={};this.gs.heat=0;
    this.transition(()=>{this.world.load(this.gs.cp.room,this.gs.cp.x,this.gs.cp.y);this.hud.syncHp();});
  }
  ending(){
    this.state='ending';this.input.enabled=false;this.input.clearAll();
    const el=document.getElementById('endcard'),c=el.querySelector('.c');
    /* B — правда сказана всем ярусам (вещательный массив); A — курьер вышел один */
    const F=this.gs.flags,b=!!F.broadcast_done;
    /* то, что сцена уже сказала (трава, лист, «он прочитал»), здесь не повторяется */
    const lines=['МИР НЕ КОНЧИЛСЯ. ПЕЧАТЬ БЫЛА НЕ ЩИТОМ, А ЗАМКОМ.'];
    if(b)lines.push('ГОЛОСА С ЦИЛИНДРОВ ИДУТ ПО ВСЕМ ЯРУСАМ. ВНИЗУ ОТКРЫВАЮТ ГЕРМОДВЕРИ — НЕ ПО ПРИКАЗУ.',
      'КЕНОТАФ — ПАМЯТНИК ТОМУ, ЧЕГО НЕ БЫЛО. ТЕПЕРЬ ЭТО ПРОСТО ДВЕРЬ. ЗА ТОБОЙ ИДУТ.');
    else lines.push('ТЫ ВЫШЕЛ ОДИН. ВНИЗУ ВСЁ ЕЩЁ ВЕРЯТ В КОНЕЦ СВЕТА: ИМ НИКТО НЕ СКАЗАЛ.',
      'ДВЕРЬ ОТКРЫТА. НО ЧТОБЫ ВЫЙТИ, НАДО ЗНАТЬ, ЧТО ОНА ЕСТЬ.');
    if(F.post_all)lines.push('ПОЧТМЕЙСТЕР ПЕРЕПИСАЛА ВСЕ ТРИДЦАТЬ ЗАПИСЕЙ. ИХ ЧИТАЮТ ВСЛУХ НА КАЖДОМ ЯРУСЕ.');
    if(F.got_letter)lines.push('НА ГРЕБНЕ — ДЫМ КОСТРА. ТЕ, КТО ПИСАЛ В ЗАБОРНИК, ВСЁ ЕЩЁ ЖДУТ.');
    if(F.c38_met)lines.push('ТРИДЦАТЬ ВОСЬМОЙ НЕ ДОШЁЛ ГОД НАЗАД. ЕГО ЛИСТ ДОНЁС ДРУГОЙ КУРЬЕР.');
    let html='';
    lines.forEach(l=>html+='<p>'+l+'</p>');
    html+='<h3>КЕНОТАФ</h3><p class="cr">КОНЕЦ</p>';
    html+='<div class="btn" id="btnEnd">В МЕНЮ</div>';
    html+='<div class="foot" style="margin-top:16px;font-size:11px;letter-spacing:.3em;color:#e8dcc0">ЦИЛИНДРОВ: '+
      this.gs.lore+' / '+LORE_TOTAL+' · '+(b?'КОНЦОВКА B · ПРАВДА':'КОНЦОВКА A · ДВЕРЬ')+'</div>';
    c.innerHTML=html;
    el.classList.add('sky');el.style.opacity=1;el.classList.add('on');this.finale.startSky();
    const ps=[...c.querySelectorAll('p')],h3=c.querySelector('h3');
    /* медленно: по строке в три с половиной секунды, название — после паузы */
    ps.forEach((p,i)=>setTimeout(()=>p.classList.add('on'),3500+i*3500));
    setTimeout(()=>h3.classList.add('on'),3500+(ps.length-1)*3500+1500);
    const btn=c.querySelector('#btnEnd');
    /* выход: клик по кнопке или E / ПРОБЕЛ / ENTER, как только она проявилась */
    this.endReady=false;btn.onclick=()=>{if(this.state==='ending')this.toMenuState();};
    setTimeout(()=>{btn.classList.add('on');const f=c.querySelector('.foot');if(f)f.classList.add('on');this.endReady=true;},3500+lines.length*3500+3500);
    this.audio.sky();
  }
  resize(){
    /* внутреннее разрешение: «авто» — по окну, но не выше 1080 строк; иначе — выбранное */
    const dpr=Math.min(window.devicePixelRatio||1,1.5),ro=RES_OPTS.find(r=>r.k===Settings.get('res'));
    let h=ro&&ro.h?ro.h:Math.round(Math.min(innerHeight*dpr,1080));
    let w=Math.round(h*(innerWidth/Math.max(1,innerHeight)));
    h=clamp(h,420,1080);w=clamp(w,600,2600);
    this.canvas.width=w;this.canvas.height=h;
    this.vw=w;this.vh=h;
    this.ppm=h/CFG.VIEW_H;
    this.bakePpm=clamp(Math.round(this.ppm),CFG.BAKE_MIN,CFG.BAKE_MAX);
    this.renderer.resize(w,h);
    if(this.world.room&&this.state!=='menu'){this.world.parallax.dispose();this.world.parallax.build(this.world.room);}
    if(this.menuPar&&this.menuRoom){this.menuPar.dispose();this.menuPar.build(this.menuRoom);}
  }
  frame(ts){
    requestAnimationFrame(t=>this.frame(t));
    if(!this.last)this.last=ts;
    let dt=(ts-this.last)/1000;this.last=ts;
    dt=Math.min(dt,0.05);
    this.fps=lerp(this.fps,1/Math.max(dt,0.0001),0.08);
    this.input.pollPad();this.menuNav.sync();
    /* transition (механические шторки) */
    if(this.transitionT>=0){
      this.transitionT+=dt;
      const T=this.transitionT,D=1.05,el=document.getElementById('trans');
      const p=clamp(T/(D*0.45),0,1),q=clamp((T-D*0.55)/(D*0.45),0,1);
      const open=smoothstep(p)*(1-smoothstep(q));
      el.style.opacity=1;
      el.querySelector('.t').style.transform='translateY('+(-100+open*100)+'%)';
      el.querySelector('.b').style.transform='translateY('+(100-open*100)+'%)';
      if(T>D*0.5&&this.transitionCb){const cb=this.transitionCb;this.transitionCb=null;cb();}
      if(T>D){this.transitionT=-1;el.style.opacity=0;}
    }
    if(this.state==='play'&&this.world.room&&this.world.player){
      this.cinematic.update(dt);
      if(this.hitstopT>0)this.hitstopT-=dt;
      else{
        if(this.slowT>0){this.slowT-=dt;if(this.slowT<=0)this.slowK=1;}
        this.acc+=dt*this.timeScale*(this.slowT>0?this.slowK:1);
        const STEP=1/120;let n=0;
        while(this.acc>=STEP&&n<8){
          if(!this.cinematic.active)this.world.update(STEP);
          else{this.particles.update(STEP);this.world.time+=STEP;this.world.updateMachines(STEP);}
          this.acc-=STEP;n++;}
        if(n>=8)this.acc=0;
      }
      if(this.finale.active)this.finale.update(dt);
      this.camera.update(dt,this.world.player,this.world.room,this.vw,this.vh,this.ppm);
      this.hud.update(dt);
      this.tutorial.update(dt);
    }else if(this.state==='travel'){
      /* меню пневмопочты: мир замер, частицы дотлевают */
      this.travel.update();this.particles.update(dt);this.hud.update(dt);
    }else if(this.state==='finale'){
      /* подъём: свой кадр, мир стоит */
      this.finale.update(dt);
    }else if(this.state==='ending'){
      /* небо: мир живёт (ветер, птицы, люди из люка), камера уходит вверх */
      this.finale.update(dt);this.world.time+=dt;this.particles.update(dt);if(this.world.updateEmitters)this.world.updateEmitters(dt);
      this.camera.update(dt,this.world.player,this.world.room,this.vw,this.vh,this.ppm);
      if(this.endReady&&this.input.skip){this.endReady=false;this.toMenuState();}
    }else if(this.state==='intro'){
      this.introT+=dt;
      if((this.input.skip&&this.introT>0.4)||this.introT>9)this.introNext();
      this.menuT+=dt;this.particles.update(dt);
    }else if(this.state==='menu'){
      this.menuT+=dt;
      this.camera.x=18+Math.sin(this.menuT*0.06)*7.5;
      this.camera.y=23+Math.sin(this.menuT*0.045)*8;
      this.camera.zoom=damp(this.camera.zoom,1.16,2,dt);
      this.camera.sx=Math.sin(this.menuT*0.7)*0.02;this.camera.sy=0;
      if(this.menuRoom){this.menuRoom.t=this.menuT;
        const ms=this.menuRoom.machines||[];
        for(let i=0;i<ms.length;i++){const m=ms[i];
          if(m.kind==='flywheel')m.a=(m.a||0)+m.spd*dt;
          else if(m.kind==='crane'){if(m.x===undefined){m.x=m.x0;m.dir=1;}
            m.x+=m.spd*m.dir*dt;if(m.x>m.x1)m.dir=-1;if(m.x<m.x0)m.dir=1;}
          else if(m.kind==='needle')m.v=(m.v||0)+dt;}
      }
      this.particles.update(dt);
      this.menuEmit(dt);
    }else if(this.state!=='play'){
      this.particles.update(dt);
      if(this.world.room&&this.world.player)this.camera.update(dt,this.world.player,this.world.room,this.vw,this.vh,this.ppm);
    }
    /* схема в паузе живая: пульсирует точка курьера */
    if(this.state==='pause'&&this.mapCv&&(this._mapT=(this._mapT||0)+dt)>0.05){this._mapT=0;this.map.render(this.mapCv);}
    this.musicTick(dt);
    this.render(dt);
    this.input.endFrame();
  }
  /* музыка: что играть — решает состояние мира; часы секвенсора идут сами и меняют тему на границе такта */
  musicTick(dt){const A=this.audio;if(!A.music)return;
    let want='menu',fight=0,phase=1;const W=this.world;
    if(this.state==='finale'||this.state==='ending'||this.finale.active)want='finale';
    else if((this.state==='play'||this.state==='pause'||this.state==='travel')&&W.room){
      const b=W.boss;
      if(b&&b.activated&&!b.dead){want=STYLES['boss_'+b.type]?'boss_'+b.type:'boss_mini';phase=b.phase||1;}
      else if(W.miniBoss&&!W.miniBoss.dead&&W.miniBoss.engaged){want='boss_mini';phase=W.miniBoss.phase||1;}
      else{want=W.room.zone==='surface'?'surface':(STYLES[W.room.zone]?W.room.zone:'sump');
        const p=W.player;let k=0;
        if(p)for(const e of W.enemies){if(e.dead)continue;const d=Math.hypot(e.cx-p.cx,e.cy-p.cy);
          if(d<18&&(e.alert>0||e.state==='wind'||e.state==='strike'))k=Math.max(k,1-d/26);}
        /* бой держится 4 с после последнего признака — слой не мигает */
        if(k>0.25)this.fightHold=4;else if(this.fightHold>0)this.fightHold-=dt;
        fight=this.fightHold>0?1:0;}}
    A.music.set(want,fight,phase);A.music.update(dt);}
  menuEmit(dt){
    this._me=(this._me||0)+dt;
    if(this._me>0.07){
      this._me=0;
      this.particles.spawn({kind:'steam',x:this.camera.cx+(Math.random()-0.5)*30,y:this.camera.cy+10,
        vx:(Math.random()-0.5)*0.5,vy:-1.2,life:5,size:1.2,grow:1.2,col:'#6a5a4a',drag:0.4,a:0.16});
      this.particles.spawn({kind:'dust',x:this.camera.cx+(Math.random()-0.5)*30,y:this.camera.cy+(Math.random()-0.5)*16,
        vx:(Math.random()-0.5)*0.2,vy:(Math.random()-0.5)*0.2,life:6,size:0.05,col:'#ffcf7a',drag:0.1,a:0.4,add:true});
    }
  }
  render(dt){
    if(this.state==='finale'){this.finale.drawScreen(this.ctx,dt);return;}
    const c=this.ctx,inMenu=this.state==='menu'||this.state==='intro';
    const room=inMenu?this.menuRoom:this.world.room;
    const par=inMenu?this.menuPar:this.world.parallax;
    c.setTransform(1,0,0,1,0,0);
    if(!room||!par||!par.layers){c.fillStyle='#05060a';c.fillRect(0,0,this.vw,this.vh);return;}
    const zone=zoneLook(room);
    const t=room.t=(room.t||0)+dt*(inMenu?1:this.timeScale);
    const cam=this.camera,zoom=cam.zoom;
    this.renderer.beginFrame();
    c.fillStyle=zone.void;c.fillRect(0,0,this.vw,this.vh);
    /* FAR / BG / MID + атмосферная перспектива */
    const seq=[['far',0.34],['bg',0.2],['mid',0.1]];
    for(let i=0;i<seq.length;i++){
      const L=par.layers[seq[i][0]];if(!L)continue;
      this.renderer.drawLayerTo(c,L,cam,zoom,L.f);
      c.save();c.setTransform(1,0,0,1,0,0);
      c.fillStyle=rgba(zone.haze,seq[i][1]);c.fillRect(0,0,this.vw,this.vh);c.restore();
    }
    /* ориентиры зоны — в проёмах задней стены, за игровым слоем (js/render/landmarks.js) */
    if(!inMenu)drawLandmarks(c,room,this,t);
    const GL=par.layers.game;
    if(GL)this.renderer.drawLayerTo(c,GL,cam,zoom,1);
    /* мир в метрах */
    this.renderer.worldTransform(c,cam,zoom);
    drawLightShafts(c,room,t);
    if(!inMenu)drawWorldDyn(c,room,t,this.gs);
    const vs=this.ppm*zoom,pv={x0:cam.cx-this.vw/vs/2,x1:cam.cx+this.vw/vs/2,y0:cam.cy-this.vh/vs/2,y1:cam.cy+this.vh/vs/2};
    this.particles.render(c,'norm',pv);
    c.setTransform(1,0,0,1,0,0);
    this.renderer.lighting(c,cam,zoom,room,zone,t);
    if(par.layers.emit){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=0.85;
      this.renderer.drawLayerTo(c,par.layers.emit,cam,zoom,par.layers.emit.f);c.restore();}
    if(!inMenu){
      /* после света: цели, угрозы, кромки, таблички, персонажи с контуром */
      this.renderer.worldTransform(c,cam,zoom);
      drawWorldLive(c,room,t,this.gs);
      this.renderer.readability(c,room,cam,zoom,t);
      this.renderer.entities(c,room,t);
    }
    this.renderer.worldTransform(c,cam,zoom);
    this.particles.render(c,'add',pv);
    if(this.finale.active&&!inMenu){this.renderer.worldTransform(c,cam,zoom);this.finale.drawWorld(c,t);}
    c.setTransform(1,0,0,1,0,0);
    if(!inMenu)this.renderer.distortPass(c,dt);
    this.renderer.foreground(c,par,cam,zoom,room);
    this.renderer.atmosphere(c,zone,t);
    this.renderer.bloomPass(c);
    this.renderer.post(c,zone);
    c.setTransform(1,0,0,1,0,0);
    if(this.finale.active)this.finale.drawOverlay(c);
    if(!inMenu&&this.world.stage)BossStage.draw(c,this.world);
    if(!inMenu&&this.world.inPollen&&this.state==='play'){
      /* в пыльце края экрана зеленеют тем сильнее, чем меньше заряд фильтра */
      const k=1-clamp((this.world.filter||0)/this.world.filterCap(),0,1);
      const g=c.createRadialGradient(this.vw/2,this.vh/2,this.vh*0.25,this.vw/2,this.vh/2,this.vh*0.85);
      g.addColorStop(0,'rgba(170,190,60,0)');g.addColorStop(1,'rgba(150,175,40,'+(0.16+0.3*k)+')');
      c.fillStyle=g;c.fillRect(0,0,this.vw,this.vh);
    }
    if(!inMenu&&this.gs.hp<=1&&this.state==='play'){
      const p=0.5+0.5*Math.sin(t*4);
      const g=c.createRadialGradient(this.vw/2,this.vh/2,this.vh*0.3,this.vw/2,this.vh/2,this.vh*0.8);
      g.addColorStop(0,'rgba(150,20,10,0)');g.addColorStop(1,'rgba(150,20,10,'+(0.16+0.12*p)+')');
      c.fillStyle=g;c.fillRect(0,0,this.vw,this.vh);
    }
  }
}
