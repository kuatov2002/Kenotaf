"use strict";
/* ============================== PROPS ==============================
   Реквизит истории: следы жизни и катастрофы. Мёртвые рабочие, брошенные вещи, метки мелом.
   Всё в метрах; рисуется в слой игры (запекается) или живьём, если меняется по флагам. */
const PROP={
  /* тело в спецовке, сидит у стены (face — куда смотрит), на коленях — что-то держит */
  corpse(c,x,y,o){o=o||{};const f=o.face||1,col=o.col||'#3d3a2e';c.save();c.translate(x,y);c.scale(f,1);
    c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(0.2,0,0.8,0.12,0,0,TAU);c.fill();
    /* ноги вытянуты */
    c.strokeStyle=shade(col,-0.2);c.lineWidth=0.17;c.lineCap='round';
    c.beginPath();c.moveTo(-0.05,-0.18);c.lineTo(0.55,-0.12);c.lineTo(0.85,-0.08);c.stroke();
    c.beginPath();c.moveTo(-0.05,-0.12);c.lineTo(0.5,-0.06);c.lineTo(0.78,-0.04);c.stroke();
    c.fillStyle='#1b1915';rr(c,0.74,-0.16,0.2,0.15,0.04);c.fill();
    /* торс, привалился к стене */
    c.save();c.translate(-0.08,-0.2);c.rotate(-0.22);
    c.fillStyle=col;rr(c,-0.2,-0.72,0.42,0.74,0.12);c.fill();
    c.fillStyle='rgba(255,230,190,.08)';c.fillRect(-0.16,-0.68,0.08,0.6);
    if(o.vest!==false){c.fillStyle='#8a6d2a';c.fillRect(-0.18,-0.5,0.38,0.06);}
    /* голова опущена, каска */
    c.fillStyle='#6a5a48';c.beginPath();c.arc(0.06,-0.84,0.15,0,TAU);c.fill();
    c.fillStyle=o.helmet||'#a8842a';c.beginPath();c.ellipse(0.04,-0.92,0.19,0.1,0.3,PI,TAU);c.fill();
    /* руки на коленях */
    c.strokeStyle=shade(col,-0.1);c.lineWidth=0.12;c.beginPath();c.moveTo(0.1,-0.58);c.quadraticCurveTo(0.34,-0.3,0.42,-0.05);c.stroke();
    c.restore();
    if(o.hold==='cylinder'){c.fillStyle='#a8842a';rr(c,0.32,-0.32,0.24,0.14,0.05);c.fill();}
    if(o.hold==='paper'){c.fillStyle='#d8cdb6';c.save();c.translate(0.36,-0.28);c.rotate(0.3);c.fillRect(-0.1,-0.07,0.22,0.15);c.restore();}
    c.restore();},
  /* лежащий скелет в обрывках формы (давно) */
  bones(c,x,y,o){o=o||{};const f=o.face||1;c.save();c.translate(x,y);c.scale(f,1);
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,0.9,0.1,0,0,TAU);c.fill();
    c.fillStyle=o.cloth||'#3a3428';c.beginPath();c.moveTo(-0.6,-0.04);c.quadraticCurveTo(-0.2,-0.3,0.3,-0.12);c.lineTo(0.4,0);c.lineTo(-0.6,0);c.closePath();c.fill();
    c.fillStyle='#d8cfbc';c.beginPath();c.arc(0.55,-0.12,0.13,0,TAU);c.fill();
    c.fillStyle='#2a2620';c.beginPath();c.arc(0.58,-0.13,0.035,0,TAU);c.arc(0.5,-0.14,0.03,0,TAU);c.fill();
    c.strokeStyle='#cfc6b2';c.lineWidth=0.035;
    for(let i=0;i<4;i++){c.beginPath();c.moveTo(-0.15+i*0.1,-0.18);c.quadraticCurveTo(-0.1+i*0.1,-0.06,-0.15+i*0.1,-0.02);c.stroke();}
    c.beginPath();c.moveTo(-0.6,-0.04);c.lineTo(-0.95,-0.02);c.moveTo(-0.55,-0.06);c.lineTo(-0.9,-0.1);c.stroke();
    c.restore();},
  /* зарядная станция инструмента: шкаф, манометры, шланг; on — окно светится (инструмент на месте) */
  chargeStation(c,x,y,on,label){
    Kit.plate(c,x-1.3,y-3.0,2.6,3.0,'steel',(x*7)|0,{rust:0.5,bolts:true});
    c.fillStyle='#14171a';rr(c,x-0.9,y-2.6,1.8,1.4,0.08);c.fill();
    c.fillStyle=on?'rgba(160,220,255,.4)':'rgba(40,60,70,.4)';rr(c,x-0.8,y-2.5,1.6,1.2,0.06);c.fill();
    if(on){c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x-0.7,y-2.45,0.12,1.1);}
    Kit.gauge(c,x-0.7,y-0.75,0.26,on?0.85:0.05);Kit.gauge(c,x+0.0,y-0.75,0.22,on?0.7:0.05);
    c.fillStyle=on?'#69d68f':'#3a2a26';c.beginPath();c.arc(x+0.75,y-0.75,0.1,0,TAU);c.fill();
    Kit.hazardTape(c,x-1.3,y-0.24,2.6,0.24);
    c.strokeStyle='#2b2620';c.lineWidth=0.12;c.beginPath();c.moveTo(x+1.3,y-1.8);c.bezierCurveTo(x+2.2,y-1.6,x+1.8,y-0.4,x+2.4,y-0.1);c.stroke();
    if(label)Kit.stencil(c,x-1.2,y-3.3,label,0.3,'rgba(216,204,178,.55)',0.55);},
  /* шкаф инструментов / доска с ключами */
  toolboard(c,x,y,w,h,r){Kit.plate(c,x,y,w,h,'ply',(x*13)|0,{rust:0.2});
    for(let i=0;i<w/0.45;i++){const tx=x+0.25+i*0.45;c.strokeStyle=['#8a9299','#b08d3e','#5c646b'][i%3];c.lineWidth=0.07;
      c.beginPath();c.moveTo(tx,y+0.25);c.lineTo(tx,y+0.35+(r?r():0.5)*h*0.5);c.stroke();
      c.fillStyle=c.strokeStyle;c.beginPath();c.arc(tx,y+0.25,0.07,0,TAU);c.fill();}}
};
/* метки мелом (Курьер 38 и другие): после света — читаются в темноте, слегка «пыльные» */
function drawChalk(c,R,t){
  const L=R.chalk;if(!L||!L.length)return;
  c.save();c.textBaseline='middle';
  for(const q of L){const s=q.s||0.42;c.save();c.translate(q.x,q.y);c.rotate(q.rot||-0.04);
    c.font='500 '+s+'px Oswald';c.textAlign='center';
    c.fillStyle='rgba(232,232,220,.08)';c.fillText(q.text,0.03,0.03);
    c.fillStyle='rgba(236,234,222,.72)';c.fillText(q.text,0,0);
    if(q.arrow){c.strokeStyle='rgba(236,234,222,.7)';c.lineWidth=0.045;const w=c.measureText(q.text).width/2+0.25,d=q.arrow;
      c.beginPath();c.moveTo(d>0?w:-w,0);c.lineTo(d>0?w+0.6:-w-0.6,0);c.moveTo(d>0?w+0.6:-w-0.6,0);c.lineTo(d>0?w+0.42:-w-0.42,-0.16);
      c.moveTo(d>0?w+0.6:-w-0.6,0);c.lineTo(d>0?w+0.42:-w-0.42,0.16);c.stroke();}
    c.restore();}
  c.restore();
}
