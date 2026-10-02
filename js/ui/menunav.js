"use strict";
/* ============================== MENU NAV ============================== */
/* Меню, экран управления и пауза без мыши: ↑/↓ (W/S, крестовина, стик) — выбор, ENTER/ПРОБЕЛ/E или A —
   нажать, BACKSPACE или B — назад. В паузе Y геймпада переключает схему зона / весь мир.
   Фокус выглядит как наведение мышью; по умолчанию — «ПРОДОЛЖИТЬ», а не «НАЧАТЬ СПУСК» (тот стирает
   сохранение). */
class MenuNav{
  constructor(game){
    this.game=game;this.scr=null;this.i=-1;
    addEventListener('keydown',e=>{
      const s=this.game.state;if(s!=='menu'&&s!=='pause')return;
      const m={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Enter:'ok',Space:'ok',KeyE:'ok',Backspace:'back'}[e.code];
      if(!m||(e.repeat&&m!=='up'&&m!=='down'))return;
      e.preventDefault();this.act(m);
    });
  }
  screen(){
    const g=this.game,$=id=>document.getElementById(id),on=id=>!$(id).classList.contains('hidden');
    if(g.state==='pause')return $('pause');
    if(g.state==='menu'){if(on('controls'))return $('controls');if(on('menu'))return $('menu');}
    return null;
  }
  list(scr){return [...scr.querySelectorAll('.btn')].filter(b=>!b.classList.contains('dim')&&b.offsetParent!==null);}
  paint(L){L.forEach((b,k)=>b.classList.toggle('focus',k===this.i));}
  /* раз в кадр: сменился экран — поставить фокус по умолчанию */
  sync(){
    const scr=this.screen();
    if(scr===this.scr)return scr;
    document.querySelectorAll('.btn.focus').forEach(b=>b.classList.remove('focus'));
    this.scr=scr;this.i=-1;
    if(scr){const L=this.list(scr),c=L.findIndex(b=>b.id==='btnContinue'||b.id==='btnResume'||b.id==='btnBack');
      this.i=c>=0?c:0;this.paint(L);}
    return scr;
  }
  act(m){
    const scr=this.sync();if(!scr)return;
    const L=this.list(scr);if(!L.length)return;
    if(m==='back'){
      if(scr.id==='controls')document.getElementById('btnBack').click();
      else if(scr.id==='pause')this.game.togglePause();
      return;}
    if(this.i<0||this.i>=L.length)this.i=0;
    if(m==='up')this.i=(this.i+L.length-1)%L.length;
    else if(m==='down')this.i=(this.i+1)%L.length;
    else if(m==='ok'){const b=L[this.i];this.game.audio.init();this.scr=null;if(b)b.click();return;}
    this.paint(L);this.game.audio.tone(520,0.05,'sine',0.02);
  }
  pad(c){
    const m={PadUp:'up',PadDown:'down',PadA:'ok',PadB:'back'}[c];if(m){this.act(m);return;}
    const g=this.game;
    if(c==='PadY'&&g.state==='pause'&&g.mapCv){g.map.whole=!g.map.whole;g.map.render(g.mapCv);}
  }
}
