"use strict";
/* ============================== CONFIG ============================== */
const CFG={
  VIEW_H:18,BAKE_MIN:34,BAKE_MAX:52,gravity:58,apexGrav:0.9,apexWin:3.2,
  player:{w:0.66,h:1.68,crouchH:0.92,
    accel:112,turnAccel:190,airAccel:74,airTurnAccel:124,
    maxRun:9.2,friction:96,airDrag:5,overCap:18,
    jumpV:17.8,jumpCut:0.74,coyote:0.13,jumpBuf:0.15,
    maxFall:30,fastFall:1.8,wallSlideMax:3.6,wallJumpX:11.6,wallJumpY:16.6,
    wallStick:0.16,wallLock:0.2,gripReach:0.16,stepUp:0.62,magReach:3.8,magPull:96,
    slideTime:0.60,slideSpeed:14.5,slideCd:0.18,slideMin:4.2,crouchMax:3.4,
    dashSpeed:26,dashTime:0.22,dashCd:0.42,dashEnd:0.46,
    attackTime:0.26,attackCd:0.30,attackDmg:34,
    pulseCost:30,pulseCd:0.62,pulseRange:3.8,pulseDmg:26,pulseRing:3.7,
    energy:100,energyRegen:26,energyDelay:0.45,hp:5,invuln:1.15,knock:11,
    /* бой HK: удар вниз в воздухе = отскок; отдача при попадании; РЕМОНТ копится ударами, тратится на ячейку */
    pogoV:16.4,recoilG:3.4,recoilA:4.4,slashT:0.16,
    weldMax:100,weldHit:11,weldPulse:0,healCost:50,healTime:0.85,
    /* ключ — тяжёлый инструмент: короткий замах (отклик в том же кадре — поза), удар, отдача, восстановление.
       Тяжёлый удар — удержание после взмаха: набор давления, отпуск — длинный замах и сильная отдача */
    atkWind:0.055,atkRecover:0.15,heavyHold:0.36,heavyWind:0.1,heavyRecover:0.3,heavyRecoil:7.5,heavyMove:0.45,
    evadeIF:0.16},
  /* «ломать, а не убивать» */
  combat:{damagedAt:0.55,exposedMul:2.0,heavyMul:2.2,heavyNodeMul:2.6,bonusMul:1.6,bodyArmor:0.55,nodeLeak:0.25,
    pulseImpulse:16,pulseLift:5,dashShove:9,slamSpeed:8,pinSpeed:10.5,pinT:1.05,slamStunT:0.6,
    interruptOpen:1.5,markT:0.95,perfectWin:0.14,empowerT:1.4,tokenGap:0.3,
    debrisDmg:26,scrapWeld:6,weldHeavy:16,weightDmg:130},
  hsMelee:0.055,hsPulse:0.075,hsHeavy:0.13,hsDash:0.02,
  noiseRun:13,noisePulse:22,colStep:0.18,probeEps:0.1
};
const ZONES={
  sump:{name:'ОТСТОЙНИК',num:'ЗОНА I',ambRGB:[104,90,78],haze:'#5a4636',void:'#0a0806',fogA:0.09,grain:0.045},
  hives:{name:'ЖИЛЫЕ СОТЫ',num:'ЗОНА II',ambRGB:[100,80,74],haze:'#40282a',void:'#080606',fogA:0.1,grain:0.05},
  eden:{name:'САДЫ ЭДЕМА',num:'ЗОНА III',ambRGB:[206,208,184],haze:'#cfd6a2',void:'#2a2c22',fogA:0.12,grain:0.03},
  seal:{name:'ПЕЧАТЬ',num:'ЗОНА IV',ambRGB:[124,128,138],haze:'#5b6068',void:'#07080a',fogA:0.08,grain:0.028},
  surface:{name:'ПОВЕРХНОСТЬ',num:'СНАРУЖИ',ambRGB:[216,226,236],haze:'#cfe0ea',void:'#8fb0cc',fogA:0.06,grain:0.03}
};
/* Читаемость геймплейного слоя по зонам:
   veil — приглушение задней стены (под твёрдой геометрией),
   rim  — кромка проходимой поверхности (рисуется после света),
   out  — тёмный контур твёрдых блоков, body — тон «тела» блока. */
const READ={
  sump:{veil:'rgba(7,6,5,.34)',rim:'#ffd79c',rimA:0.78,out:'rgba(0,0,0,.72)',body:null,ent:'#ffe2b8'},
  hives:{veil:'rgba(9,5,5,.34)',rim:'#ffcf94',rimA:0.78,out:'rgba(0,0,0,.72)',body:null,ent:'#ffe2b8'},
  eden:{veil:'rgba(236,233,214,.3)',rim:'#fff7d8',rimA:0.9,out:'rgba(46,40,22,.82)',body:'rgba(120,112,84,.22)',ent:'#2e2a1a'},
  seal:{veil:'rgba(5,6,8,.3)',rim:'#eef4ff',rimA:0.78,out:'rgba(0,0,0,.75)',body:null,ent:'#e6eef8'},
  surface:{veil:null,rim:'#f6ffe2',rimA:0.6,out:'rgba(30,40,20,.6)',body:null,ent:'#1e2616'}
};
