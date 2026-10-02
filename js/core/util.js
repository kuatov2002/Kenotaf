"use strict";
/* ==========================================================================
   КЕНОТАФ. Итерация: PHYSICS / INPUT / STABILITY PASS.
   - Player visual anchor = physical BOTTOM (feet == collider bottom).
   - Input: pending action queue с timestamp + expiry; полная очистка на blur.
   - Jump flow: intent -> buffer -> integrate -> collide -> grounded -> consume.
   - moveBody(): substeps (анти-tunneling), one-way resolution, ground probe.
   - Crouch/slide через setH() с сохранением bottom; low-ceiling safe.
   - Camera X damp 16 / Y damp 13, speed-scaled look-ahead.
   - Audio: stop/disconnect старых ambient nodes.
   - World.later(): все отложенные колбэки привязаны к token + room id.
   - Hazard update order: machines/hazards -> player -> enemies -> events.
   - Boss: явный bossTrigger.
   - Perf: soft-sprite кэш частиц, кэш grain pattern.
   Итерация: READABILITY / ONBOARDING PASS (фидбэк плейтеста).
   - Геометрия читается всегда: кромки твёрдых поверхностей, игрок/враги/цели
     рисуются ПОСЛЕ light-multiply с контуром; фон задней стены приглушён.
   - Двери только по E. Катсцены в реальном времени, пропуск по E.
   - TutorialSystem: контекстные подсказки с клавишами + ситуации немедленного
     применения каждой новой способности.
   - Звук: мягкий генеративный эмбиент вместо пилы, громкость в паузе.
   ========================================================================== */

/* ============================== UTIL ============================== */
const TAU=Math.PI*2,PI=Math.PI;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const damp=(a,b,l,dt)=>a+(b-a)*(1-Math.exp(-l*dt));
const smoothstep=t=>t*t*(3-2*t);
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=(typeof seed==='string'?hashStr(seed):seed)>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hx(h){if(h[0]==='#')h=h.slice(1);if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
const _hc={};function hxc(h){let v=_hc[h];if(!v)v=_hc[h]=hx(h);return v;}
function rgba(h,a){const c=(typeof h==='string')?hxc(h):h;return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}
function shade(h,f){const c=hxc(h),g=v=>Math.round(f>0?lerp(v,255,f):lerp(v,0,-f));return 'rgb('+g(c[0])+','+g(c[1])+','+g(c[2])+')';}
function rr(c,x,y,w,h,r){r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);c.beginPath();c.moveTo(x+r,y);
  c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
/* кривые для сценических анимаций (0..1 → 0..1) */
const EZ={io:x=>x<0.5?2*x*x:1-Math.pow(-2*x+2,2)/2,out:x=>1-(1-x)*(1-x),in:x=>x*x,
  back:x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);},
  bounce:x=>{const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+0.75;
    if(x<2.5/d)return n*(x-=2.25/d)*x+0.9375;return n*(x-=2.625/d)*x+0.984375;}};
const seg01=(T,a,b)=>clamp((T-a)/(b-a),0,1);
function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function dist(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}
function losCheck(w,x1,y1,x2,y2){const n=Math.ceil(dist(x1,y1,x2,y2)/0.6);
  for(let i=1;i<n;i++){const t=i/n,x=lerp(x1,x2,t),y=lerp(y1,y2,t);
    for(const s of w.room.solids)if(!s.ow&&x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h)return false;}
  return true;}
/* двухзвенный IK: от корня (hx,hy) к цели (fx,fy), звенья l1,l2; bend ±1 — сторона сгиба.
   Возвращает сустав (kx,ky) и достижимую цель (fx,fy) */
function ik2(hx,hy,fx,fy,l1,l2,bend){
  let dx=fx-hx,dy=fy-hy,d=Math.hypot(dx,dy)||1e-4;const mx=l1+l2-1e-3;
  if(d>mx){dx*=mx/d;dy*=mx/d;d=mx;}
  const a=Math.atan2(dy,dx),b=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),k=a+bend*b;
  return {kx:hx+Math.cos(k)*l1,ky:hy+Math.sin(k)*l1,fx:hx+dx,fy:hy+dy};
}
/* кратчайшая разность углов */
function angDiff(a,b){let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;}
