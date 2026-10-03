"use strict";
/* ============================== ЗАНАЧКИ И КУРЬЕР 38 ==============================
   Заначки — мелкие тайники за ложными стенами (трещина, сквозняк, глухой звук) и в углах, куда
   не ходят: шов ремонта и чья-то жизнь. Пять из них — Курьера 38, по одной на зону; вместе с его
   мелом они ведут к колесу Печати, где он остался. Его последний цилиндр — у колеса. */
const C38_LAST=[
  '«ЭТО ТРИДЦАТЬ ВОСЬМОЙ. ЕСЛИ ИГЛА ИДЁТ — ЗНАЧИТ, КТО-ТО ДОШЁЛ ДАЛЬШЕ МЕНЯ.»',
  '«СОВЕТА НЕТ. ТАМ ПЛАСТИНКИ. Я СТАВИЛ ИХ ПО ОЧЕРЕДИ, ПОКА НЕ ПОНЯЛ, ЧТО ДОКЛАДЫВАЮ ИГЛЕ.»',
  '«КОЛЕСО ХОДИТ. Я ДЕРЖАЛ ЕГО, СКОЛЬКО МОГ. ОДНОМУ НЕ ДОКРУТИТЬ — ПРУЖИНА ВОЗВРАЩАЕТ.»',
  '«ЛИСТ Я ОТПРАВИЛ ВНИЗ. ПО МЁРТВОЙ ЛИНИИ, БЕЗ АДРЕСА. КОГДА-НИБУДЬ ДАВЛЕНИЕ УПАДЁТ, И ОН ДОЙДЁТ.»',
  '«КОМУ-НИБУДЬ. ВОТ ТЕБЕ.»',
  '«МАМЕ СКАЖИ — Я ВИДЕЛ, ОТКУДА ПЫЛЬЦА. И ЧТО Я НЕ БОЯЛСЯ. ПОЧТИ.»',
  'ИГЛА ДОХОДИТ ДО КОНЦА ДОРОЖКИ И ШУРШИТ. НА СУМКЕ МЕЛОМ: «38 ДОШЁЛ ДО КОЛЕСА».'];
/* заначка: жестянка или свёрток; заначка 38 — с мелом «38» на крышке */
function drawStash(c,it,t){const x=it.x,y=it.y,d=it.def,p=0.5+0.5*Math.sin(t*2.4);
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x,y-0.02,0.5,0.08,0,0,TAU);c.fill();
  const g=c.createLinearGradient(x-0.4,y-0.5,x+0.4,y);g.addColorStop(0,'#8a7a5a');g.addColorStop(1,'#4a3e2c');
  c.fillStyle=g;rr(c,x-0.4,y-0.46,0.8,0.46,0.06);c.fill();
  c.fillStyle='#6a5a40';c.fillRect(x-0.42,y-0.5,0.84,0.08);
  c.strokeStyle='rgba(20,14,8,.7)';c.lineWidth=0.025;c.strokeRect(x-0.4,y-0.46,0.8,0.46);
  if(d.c38){c.fillStyle='rgba(236,234,222,.85)';c.font='500 0.22px Oswald';c.textAlign='center';c.fillText('38',x,y-0.17);c.textAlign='left';}
  c.fillStyle=rgba('#ffcf7a',0.1+0.08*p);c.beginPath();c.arc(x,y-0.3,0.8,0,TAU);c.fill();
  it.world.game.renderer.glowAdd(x,y-0.3,0.8,d.c38?'#e8eadc':'#ffcf7a',0.18+0.1*p);}
/* Курьер 38 у колеса: сидит, привалившись к станине; на коленях — фонограф с цилиндром */
function drawC38(c,it,t,live){const x=it.x,y=it.y;
  c.save();c.translate(x,y);
  c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(0,-0.02,0.9,0.1,0,0,TAU);c.fill();
  /* ноги, корпус, голова — силуэт курьера в той же куртке, что у нашего, только выцветшей */
  c.strokeStyle='#3a3630';c.lineWidth=0.16;c.lineCap='round';
  c.beginPath();c.moveTo(-0.1,-0.25);c.lineTo(0.45,-0.22);c.lineTo(0.75,-0.04);c.stroke();
  c.beginPath();c.moveTo(-0.05,-0.18);c.lineTo(0.4,-0.1);c.lineTo(0.62,0);c.stroke();
  c.fillStyle='#4a453c';rr(c,-0.42,-1.05,0.46,0.86,0.14);c.fill();
  c.fillStyle='#5c3a2a';c.fillRect(-0.44,-0.98,0.12,0.6);   /* ремень сумки */
  c.fillStyle='#3a3630';c.beginPath();c.arc(-0.12,-1.22,0.19,0,TAU);c.fill();
  c.fillStyle='#2a2620';c.fillRect(-0.32,-1.4,0.42,0.1);   /* козырёк фуражки */
  c.fillStyle='rgba(236,234,222,.8)';c.font='500 0.13px Oswald';c.fillText('38',-0.2,-1.3);
  /* сумка у ног и фонограф */
  c.fillStyle='#5c4433';rr(c,0.2,-0.42,0.5,0.4,0.06);c.fill();c.fillStyle='rgba(236,234,222,.75)';c.font='500 0.16px Oswald';c.fillText('38',0.3,-0.16);
  c.fillStyle='#8a6d2a';c.fillRect(-0.9,-0.36,0.5,0.34);c.fillStyle='#b08d3e';c.beginPath();c.moveTo(-0.7,-0.36);c.lineTo(-1.1,-0.9);c.lineTo(-0.7,-1.0);c.closePath();c.fill();
  c.restore();
  if(live){const p=0.5+0.5*Math.sin(t*2.2);c.fillStyle=rgba('#bfefff',0.16*p);c.beginPath();c.arc(x-0.7,y-0.3,0.7,0,TAU);c.fill();
    it.world.game.renderer.glowAdd(x-0.7,y-0.3,0.8,'#9fe6ff',0.35+0.15*p);}}
