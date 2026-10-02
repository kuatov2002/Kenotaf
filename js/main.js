"use strict";
/* ============================== BOOT ============================== */
let game;
window.addEventListener('load',()=>{
  game=new Game();
  const first=()=>{game.audio.init();
    removeEventListener('pointerdown',first);removeEventListener('keydown',first);};
  addEventListener('pointerdown',first);addEventListener('keydown',first);
});
