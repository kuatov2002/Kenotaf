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
    this.gates=new GateSystem(this);
    this.checkpoints=new CheckpointSystem(this);
    this.salvage=new SalvageSystem(this);
    this.abilities=new AbilitySystem(this);
    this.cinematic=new Cinematic(this);
    this.tutorial=new TutorialSystem(this);
    this.map=new WorldMap(this);
    this.travel=new TravelMenu(this);
    this.menuNav=new MenuNav(this);
    this.debug=new DebugUI(this);
    this.debugOpts={invuln:false,collision:false,gates:false,bounds:false,collider:false};
    this.state='menu';this.timeScale=1;this.hitstopT=0;this.acc=0;this.last=0;this.fps=60;
    this.transitionT=-1;this.transitionCb=null;this.vw=0;this.vh=0;this.ppm=40;this.bakePpm=40;
    this.menuT=0;this.menuRoom=null;this.menuPar=null;
    this.resize();
    addEventListener('resize',()=>this.resize());
    this.bindUI();
    const sv=SaveSystem.read();
    if(sv)this.gs.deserialize(sv);
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
    $('btnStart').onclick=()=>{this.audio.init();SaveSystem.wipe();this.gs.reset();this.hud.syncAbilities();
      this.playIntro(()=>this.begin('z1_start',3.2,9.3));};
    $('btnContinue').onclick=()=>{this.audio.init();
      const sv=SaveSystem.read();if(sv)this.gs.deserialize(sv);
      this.hud.syncAbilities();this.begin(this.gs.cp.room,this.gs.cp.x,this.gs.cp.y);};
    $('intro').onclick=()=>{if(this.state==='intro'&&this.introT>0.3)this.introNext();};
    $('btnCtrls').onclick=()=>{$('menu').classList.add('hidden');$('controls').classList.remove('hidden');};
    $('btnBack').onclick=()=>{$('controls').classList.add('hidden');$('menu').classList.remove('hidden');};
    $('btnResume').onclick=()=>this.togglePause();
    $('btnToMenu').onclick=()=>this.toMenuState();
    $('btnWipe').onclick=()=>{SaveSystem.wipe();this.gs.reset();this.hud.syncAbilities();this.toMenuState();};
    $('btnPause').onclick=()=>this.togglePause();
    $('btnMute').onclick=()=>{this.audio.init();this.audio.toggleMute();};
    $('btnContinue').classList.toggle('dim',!SaveSystem.read());
    /* громкость: общая / музыка / эффекты — в паузе и на экране управления */
    const rows=[['master','ОБЩАЯ'],['music','МУЗЫКА'],['sfx','ЭФФЕКТЫ']];
    document.querySelectorAll('[data-snd]').forEach(box=>{
      box.innerHTML='';
      for(const [k,lbl] of rows){
        const l=document.createElement('label');l.textContent=lbl;
        const r=document.createElement('input');r.type='range';r.min='0';r.max='100';r.step='1';
        r.value=String(Math.round(this.audio.vol[k]*100));r.dataset.k=k;
        const v=document.createElement('span');v.textContent=r.value;
        r.oninput=()=>{this.audio.init();this.audio.setVol(k,(+r.value)/100);
          document.querySelectorAll('[data-snd] input[data-k="'+k+'"]').forEach(o=>{if(o!==r)o.value=r.value;});
          document.querySelectorAll('[data-snd] span[data-k="'+k+'"]').forEach(o=>o.textContent=r.value);};
        v.dataset.k=k;box.append(l,r,v);}
    });
  }
  toMenuState(){
    this.cinematic.abort();
    this.state='menu';this.timeScale=1;
    document.getElementById('pause').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    /* концовка ставила inline opacity:1 — без сброса чёрный экран оставался поверх меню */
    const ec=document.getElementById('endcard');ec.classList.remove('on');ec.style.opacity='';
    document.getElementById('btnContinue').classList.toggle('dim',!SaveSystem.read());
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
    if(this.state==='play'){
      this.state='pause';
      document.getElementById('pause').classList.remove('hidden');
      if(this.world.room)document.getElementById('pauseInfo').textContent=
        ZONES[this.world.room.zone].name+' · '+this.world.room.name;
      document.getElementById('journal').innerHTML=journalHTML(this.gs);
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
  flash(a,col){const f=document.getElementById('flash');
    f.style.background=col||'#fff';f.style.transition='none';f.style.opacity=a;
    void f.offsetWidth;f.style.transition='opacity .55s ease';f.style.opacity=0;}
  hitstop(t){this.hitstopT=Math.max(this.hitstopT,t);}
  onPlayerDeath(){
    this.gs.hp=this.gs.maxHp();this.world.slain={};
    this.transition(()=>{this.world.load(this.gs.cp.room,this.gs.cp.x,this.gs.cp.y);this.hud.syncHp();});
  }
  ending(){
    this.state='ending';this.input.enabled=false;this.input.clearAll();
    const el=document.getElementById('endcard'),c=el.querySelector('.c');
    const b=this.gs.lore>=9;
    const lines=['ТРАВА. ВЕТЕР. ОБЛАКА. ЛИСТ ИЗ КАПСУЛЫ БЫЛ ОТСЮДА.','МИР НЕ КОНЧИЛСЯ. ПЕЧАТЬ БЫЛА НЕ ЩИТОМ, А ЗАМКОМ.',
      b?'ТЫ ЗНАЕШЬ ДОСТАТОЧНО. ВЕЩАТЕЛЬНЫЙ МАССИВ В ПРЕДПЕЧАТЬЕ ОТВЕТИТ.':'ТЫ ВЫШЕЛ ОДИН. ВНИЗУ ВСЁ ЕЩЁ ВЕРЯТ В КОНЕЦ СВЕТА — ЦИЛИНДРОВ МАЛО, ЧТОБЫ ДОКАЗАТЬ ОБРАТНОЕ.',
      b?'ТЕЛЕМЕТРИЯ ПОВЕРХНОСТИ УХОДИТ НА ВСЕ ЯРУСЫ. ЭКРАНЫ ЗАГОРАЮТСЯ ОДНИМ НЕБОМ.':
        'КЕНОТАФ — ПАМЯТНИК ТОМУ, ЧЕГО НЕ БЫЛО. ТЕПЕРЬ ЭТО ПРОСТО ДВЕРЬ. И ОНА ОТКРЫТА.'];
    if(this.gs.flags.got_letter)lines.push('НА ГРЕБНЕ — ДЫМ КОСТРА. ТЕ, КТО ПИСАЛ В ЗАБОРНИК, ВСЁ ЕЩЁ ЖДУТ.');
    let html='<h3>КЕНОТАФ</h3>';
    lines.forEach(l=>html+='<p>'+l+'</p>');
    html+='<div class="btn" id="btnEnd">В МЕНЮ</div>';
    html+='<div style="margin-top:16px;font-size:11px;letter-spacing:.3em;color:#6d6455">ЦИЛИНДРОВ: '+
      this.gs.lore+' / 12 · '+(b?'КОНЦОВКА B':'КОНЦОВКА A')+'</div>';
    c.innerHTML=html;
    el.style.opacity=1;el.classList.add('on');
    const h3=c.querySelector('h3');setTimeout(()=>h3.classList.add('on'),400);
    c.querySelectorAll('p').forEach((p,i)=>setTimeout(()=>p.classList.add('on'),1600+i*1800));
    const btn=c.querySelector('#btnEnd');
    /* выход: клик по кнопке или E / ПРОБЕЛ / ENTER, как только она проявилась */
    this.endReady=false;btn.onclick=()=>{if(this.state==='ending')this.toMenuState();};
    setTimeout(()=>{btn.classList.add('on');this.endReady=true;},1600+lines.length*1800+400);
    this.audio.sky();
  }
  resize(){
    const dpr=Math.min(window.devicePixelRatio||1,1.3);
    let h=Math.round(Math.min(innerHeight*dpr,1150));
    let w=Math.round(h*(innerWidth/Math.max(1,innerHeight)));
    h=clamp(h,420,1150);w=clamp(w,600,2600);
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
        this.acc+=dt*this.timeScale;
        const STEP=1/120;let n=0;
        while(this.acc>=STEP&&n<8){
          if(!this.cinematic.active)this.world.update(STEP);
          else{this.particles.update(STEP);this.world.time+=STEP;this.world.updateMachines(STEP);}
          this.acc-=STEP;n++;}
        if(n>=8)this.acc=0;
      }
      this.camera.update(dt,this.world.player,this.world.room,this.vw,this.vh,this.ppm);
      this.hud.update(dt);
      this.tutorial.update(dt);
    }else if(this.state==='travel'){
      /* меню пневмопочты: мир замер, частицы дотлевают */
      this.travel.update();this.particles.update(dt);this.hud.update(dt);
    }else if(this.state==='ending'){
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
    this.debug.update(dt);
    this.render(dt);
    this.input.endFrame();
  }
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
    const c=this.ctx,inMenu=this.state==='menu'||this.state==='intro';
    const room=inMenu?this.menuRoom:this.world.room;
    const par=inMenu?this.menuPar:this.world.parallax;
    c.setTransform(1,0,0,1,0,0);
    if(!room||!par||!par.layers){c.fillStyle='#05060a';c.fillRect(0,0,this.vw,this.vh);return;}
    const zone=ZONES[room.zone]||ZONES.sump;
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
    const GL=par.layers.game;
    if(GL)this.renderer.drawLayerTo(c,GL,cam,zoom,1);
    /* мир в метрах */
    this.renderer.worldTransform(c,cam,zoom);
    drawLightShafts(c,room,t);
    if(!inMenu)drawWorldDyn(c,room,t,this.gs);
    this.particles.render(c,'norm');
    c.setTransform(1,0,0,1,0,0);
    this.renderer.lighting(c,cam,zoom,room,zone,t);
    if(!inMenu){
      /* после света: цели, угрозы, кромки, таблички, персонажи с контуром */
      this.renderer.worldTransform(c,cam,zoom);
      drawWorldLive(c,room,t,this.gs);
      this.renderer.readability(c,room,cam,zoom,t);
      this.renderer.entities(c,room,t);
    }
    this.renderer.worldTransform(c,cam,zoom);
    this.particles.render(c,'add');
    c.setTransform(1,0,0,1,0,0);
    this.renderer.foreground(c,par,cam,zoom,room);
    this.renderer.atmosphere(c,zone,t);
    this.renderer.bloomPass(c);
    this.renderer.post(c,zone);
    if(!inMenu)this.renderer.debugDraw(c,cam,zoom,room);
    c.setTransform(1,0,0,1,0,0);
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
