"use strict";
/* ============================== INPUT ============================== */
/* Прыжок — только ПРОБЕЛ: W/↑ — направление (удар вверх, взгляд вверх), S/↓ — вниз
   (присед, подкат, в воздухе — удар вниз с отскоком). Q/I — залатать куртку (держать). */
const KEYMAP={jump:['Space'],up:['KeyW','ArrowUp'],down:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],
  right:['KeyD','ArrowRight'],attack:['KeyJ','KeyX'],pulse:['KeyK','KeyC'],
  dash:['KeyL','ShiftLeft','ShiftRight','KeyZ'],use:['KeyE','KeyF'],heal:['KeyQ','KeyI']};
class Input{
  constructor(){
    this.k=Object.create(null);this.p=Object.create(null);this.r=Object.create(null);
    this.pending={};for(const a in KEYMAP)this.pending[a]={n:0,t:-1e9};
    this.ml=false;this.mr=false;this.enabled=true;this.EXPIRY=220;this.skip=false;
    const pv=['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','F1','F2','KeyE','KeyF',
      'KeyJ','KeyK','KeyL','KeyX','KeyC','KeyZ','ShiftLeft','ShiftRight','KeyQ','KeyI'];
    addEventListener('keydown',e=>{
      if(pv.indexOf(e.code)>=0)e.preventDefault();
      if(e.repeat){this.k[e.code]=true;return;}
      this.k[e.code]=true;this.p[e.code]=true;
      if(SKIP_KEYS.indexOf(e.code)>=0)this.skip=true;
      for(const a in KEYMAP)if(KEYMAP[a].indexOf(e.code)>=0)this.press(a);
      if(e.code==='F1')game.debug.toggle();
      if(e.code==='F2')game.debug.resetPlayer();
      if(e.code==='Escape')game.togglePause();
      if(e.code==='KeyM'){game.audio.init();game.audio.toggleMute();}
    });
    addEventListener('keyup',e=>{this.k[e.code]=false;this.r[e.code]=true;});
    addEventListener('blur',()=>this.clearAll());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clearAll();});
    const cv=document.getElementById('game');
    cv.addEventListener('contextmenu',e=>e.preventDefault());
    cv.addEventListener('mousedown',e=>{game.audio.init();
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
  get move(){return this.enabled?((this.down('KeyD','ArrowRight')?1:0)-(this.down('KeyA','ArrowLeft')?1:0)):0;}
  get dn(){return this.down('KeyS','ArrowDown');}
  get up(){return this.down('KeyW','ArrowUp');}
  get healHeld(){return this.down('KeyQ','KeyI');}
  get jumpHeld(){return this.down('Space');}
  endFrame(){this.p=Object.create(null);this.r=Object.create(null);this.skip=false;}
}
const SKIP_KEYS=['KeyE','KeyF','Space','Enter','KeyJ','KeyX'];
