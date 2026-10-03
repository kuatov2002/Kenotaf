"use strict";
/* ============================== MENU NAV ============================== */
/* Меню, настройки, управление, записи и пауза без мыши: ↑/↓ (W/S, крестовина, стик) — выбор,
   ←/→ — изменить значение настройки, ENTER/ПРОБЕЛ/E или A — нажать, BACKSPACE/ESC или B — назад.
   В паузе Y геймпада переключает схему зона / весь мир. Фокус выглядит как наведение мышью;
   по умолчанию — «ПРОДОЛЖИТЬ», а не «НАЧАТЬ» (тот стирает сохранение). */
const SCREEN_ORDER=['confirm','settings','controls','archive','pack','pause','menu'];
class MenuNav{
  constructor(game){
    this.game=game;this.scr=null;this.i=-1;
    addEventListener('keydown',e=>{
      if(!this.screen())return;
      const m={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
        Enter:'ok',Space:'ok',KeyE:'ok',Backspace:'back'}[e.code];
      if(!m||(e.repeat&&m!=='up'&&m!=='down'&&m!=='left'&&m!=='right'))return;
      e.preventDefault();this.act(m);
    });
  }
  /* верхний видимый экран */
  screen(){
    const g=this.game,$=id=>document.getElementById(id),on=id=>{const el=$(id);return el&&!el.classList.contains('hidden');};
    if(g.state!=='menu'&&g.state!=='pause')return null;
    for(const id of SCREEN_ORDER)if(on(id))return $(id);
    return null;
  }
  list(scr){return [...scr.querySelectorAll('.btn')].filter(b=>!b.classList.contains('dim')&&b.offsetParent!==null);}
  paint(L){L.forEach((b,k)=>b.classList.toggle('focus',k===this.i));
    const f=L[this.i];if(f&&f.scrollIntoView)f.scrollIntoView({block:'nearest'});}
  /* раз в кадр: сменился экран — поставить фокус по умолчанию */
  sync(){
    const scr=this.screen();
    if(scr===this.scr)return scr;
    document.querySelectorAll('.btn.focus').forEach(b=>b.classList.remove('focus'));
    this.scr=scr;this.i=-1;
    if(scr){const L=this.list(scr),c=L.findIndex(b=>/^(btnContinue|btnResume|btnNewNo)$/.test(b.id));
      this.i=c>=0?c:0;this.paint(L);}
    return scr;
  }
  back(scr){
    const g=this.game,id=scr.id;
    if(id==='controls')document.getElementById('btnBack').click();
    else if(id==='settings')g.settingsUI.close();
    else if(id==='archive')g.archiveUI.close();
    else if(id==='pack')g.packUI.close();
    else if(id==='confirm')document.getElementById('btnNewNo').click();
    else if(id==='pause')g.togglePause();
  }
  act(m){
    const scr=this.sync();if(!scr)return;
    if(m==='back'){this.back(scr);return;}
    const L=this.list(scr);if(!L.length)return;
    if(this.i<0||this.i>=L.length)this.i=0;
    const cur=L[this.i];
    if(m==='left'||m==='right'){
      if(cur&&cur.dataset.opt){this.game.settingsUI.change(cur.dataset.opt,m==='left'?-1:1);this.game.audio.tone(600,0.04,'sine',0.02);}
      else if(cur&&cur.dataset.arch!==undefined){this.game.archiveUI.show(+cur.dataset.arch);}
      return;}
    if(m==='up')this.i=(this.i+L.length-1)%L.length;
    else if(m==='down')this.i=(this.i+1)%L.length;
    else if(m==='ok'){this.game.audio.init();this.scr=null;if(cur)cur.click();return;}
    this.paint(L);this.game.audio.tone(520,0.05,'sine',0.02);
    const nf=L[this.i];if(nf&&nf.dataset.arch!==undefined)this.game.archiveUI.show(+nf.dataset.arch);
    if(nf&&nf.dataset.pack!==undefined)this.game.packUI.show(+nf.dataset.pack);
  }
  pad(c){
    const m={PadUp:'up',PadDown:'down',PadLeft:'left',PadRight:'right',PadA:'ok',PadB:'back'}[c];if(m){this.act(m);return;}
    const g=this.game;
    if(c==='PadY'&&g.state==='pause'&&g.mapCv){g.map.whole=!g.map.whole;g.map.render(g.mapCv);}
  }
}
