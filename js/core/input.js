"use strict";
/* ============================== INPUT ============================== */
/* Одно действие — одна клавиша. Исключение — удар и импульс: у них есть и клавиша, и кнопка мыши
   (J / ЛКМ, K / ПКМ), чтобы играть и без мыши. A/D — ход, W — вверх (взгляд, удар вверх),
   S — присед, на бегу подкат, в воздухе удар вниз. SHIFT — рывок, E — действие, R — гарпун,
   Q (держать) — залатать куртку. Стрелки работают только в меню. */
const KEYMAP={jump:['Space'],up:['KeyW'],down:['KeyS'],left:['KeyA'],
  right:['KeyD'],attack:['KeyJ'],pulse:['KeyK'],
  dash:['ShiftLeft','ShiftRight'],use:['KeyE'],heal:['KeyQ'],hook:['KeyR']};
/* геймпад, стандартная раскладка: A — прыжок, X — удар, B — импульс, Y — действие (E), RB/RT — рывок,
   LB/LT (держать) — залатать, стик / крестовина — движение и направление, START / BACK — пауза */
const PAD_ACT={PadA:'jump',PadX:'attack',PadB:'pulse',PadY:'use',PadRB:'dash',PadRT:'hook',PadUp:'up',PadDown:'down'};
class Input{
  constructor(){
    this.k=Object.create(null);this.p=Object.create(null);this.r=Object.create(null);
    this.pending={};for(const a in KEYMAP)this.pending[a]={n:0,t:-1e9};
    this.ml=false;this.mr=false;this.enabled=true;this.EXPIRY=220;this.skip=false;
    const pv=['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','KeyE',
      'KeyJ','KeyK','ShiftLeft','ShiftRight','KeyQ','KeyR'];
    addEventListener('keydown',e=>{
      if(pv.indexOf(e.code)>=0)e.preventDefault();
      this.lastKey=performance.now();
      if(e.repeat){this.k[e.code]=true;return;}
      this.k[e.code]=true;this.p[e.code]=true;
      if(SKIP_KEYS.indexOf(e.code)>=0)this.skip=true;
      for(const a in KEYMAP)if(KEYMAP[a].indexOf(e.code)>=0)this.press(a);
      if(e.code==='Escape')game.togglePause();
      if(e.code==='Tab'&&game.state==='pause'&&game.mapCv){game.map.whole=!game.map.whole;game.map.render(game.mapCv);}
      if(e.code==='KeyM'){game.audio.init();game.audio.toggleMute();}
    });
    addEventListener('keyup',e=>{this.k[e.code]=false;this.r[e.code]=true;});
    addEventListener('blur',()=>this.clearAll());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clearAll();});
    const cv=document.getElementById('game');
    cv.addEventListener('contextmenu',e=>e.preventDefault());
    cv.addEventListener('mousedown',e=>{game.audio.init();this.lastKey=performance.now();
      if(e.button===0){this.ml=true;this.skip=true;this.press('attack');}
      if(e.button===2){this.mr=true;this.press('pulse');}});
    addEventListener('mouseup',e=>{if(e.button===0)this.ml=false;if(e.button===2)this.mr=false;});
  }
  press(a){const e=this.pending[a];if(e){e.n++;e.t=performance.now();}}
  consume(a){const e=this.pending[a];if(!e||e.n<=0)return false;
    if(!this.enabled||performance.now()-e.t>this.EXPIRY){e.n=0;return false;}
    e.n=0;e.t=-1e9;return true;}
  clearAll(){this.k=Object.create(null);this.p=Object.create(null);this.r=Object.create(null);
    this.ml=false;this.mr=false;for(const a in this.pending){this.pending[a].n=0;this.pending[a].t=-1e9;}}
  down(...c){return this.enabled&&c.some(x=>this.k[x]);}
  get move(){return this.enabled?((this.down('KeyD','PadRight')?1:0)-(this.down('KeyA','PadLeft')?1:0)):0;}
  get dn(){return this.down('KeyS','PadDown');}
  get up(){return this.down('KeyW','PadUp');}
  get healHeld(){return this.down('KeyQ','PadLB');}
  get jumpHeld(){return this.down('Space','PadA');}
  get attackHeld(){return this.enabled&&(this.ml||this.down('KeyJ','PadX'));}
  usingPad(){return (this.lastPad||0)>(this.lastKey||0);}
  /* опрос геймпада раз в кадр (до логики): удержание — в k, нажатия — как у клавиатуры */
  pollPad(){
    const pads=navigator.getGamepads?navigator.getGamepads():null,prev=this.pad||(this.pad={});let gp=null;
    if(pads){for(const q of pads)if(q&&q.connected&&q.mapping==='standard'){gp=q;break;}
      if(!gp)for(const q of pads)if(q&&q.connected){gp=q;break;}}
    if(!gp){for(const c in prev){if(prev[c])this.k[c]=false;prev[c]=false;}return;}
    const b=i=>{const q=gp.buttons[i];return !!(q&&(q.pressed||q.value>0.5));};
    const ax=gp.axes[0]||0,ay=gp.axes[1]||0;
    const st={PadLeft:b(14)||ax<-0.4,PadRight:b(15)||ax>0.4,PadUp:b(12)||ay<-0.6,PadDown:b(13)||ay>0.6,
      PadA:b(0),PadB:b(1),PadX:b(2),PadY:b(3),PadLB:b(4)||b(6),PadRB:b(5),PadRT:b(7),PadStart:b(9)||b(8)};
    for(const c in st){const v=st[c];if(v&&!prev[c])this.padDown(c);this.k[c]=v;prev[c]=v;}
  }
  padDown(c){
    const g=game;this.p[c]=true;this.lastPad=performance.now();
    if(c==='PadStart'){g.togglePause();return;}
    if(g.state==='menu'||g.state==='pause'){if(g.menuNav)g.menuNav.pad(c);return;}
    if(g.state==='travel'&&c==='PadB'){g.travel.close();return;}
    if(c==='PadA'||c==='PadX'||c==='PadY')this.skip=true;
    const a=PAD_ACT[c];if(a)this.press(a);
  }
  endFrame(){this.p=Object.create(null);this.r=Object.create(null);this.skip=false;}
}
const SKIP_KEYS=['KeyE','KeyF','Space','Enter','KeyJ','KeyX'];
