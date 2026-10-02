"use strict";
/* ============================== PARTICLES ============================== */
class ParticleSystem{
  /* пул фиксированного размера: свободные ячейки — стек индексов (спаун за O(1)); пул полон — частица не рождается */
  constructor(max){this.max=max;this.list=[];this.free=[];for(let i=0;i<max;i++){this.list.push({alive:false});this.free.push(max-1-i);}this.aliveCount=0;this.view=null;}
  spawn(o){{if(!this.free.length)return null;const i=this.free.pop(),p=this.list[i];
    {p.alive=true;this.aliveCount++;
      p.x=o.x;p.y=o.y;p.vx=o.vx||0;p.vy=o.vy||0;p.life=o.life||1;p.max=p.life;
      p.size=o.size||0.1;p.g=o.g||0;p.drag=o.drag===undefined?0.6:o.drag;p.kind=o.kind||'dust';
      p.col=o.col||'#fff';p.a=o.a===undefined?1:o.a;p.rot=o.rot||0;p.vr=o.vr||0;p.add=!!o.add;
      p.grow=o.grow||0;p.ringR=o.ringR||1;p.noise=o.noise||0;return p;}}return null;}
  burst(x,y,n,o){for(let i=0;i<n;i++){
    const a=o.ang===undefined?Math.random()*TAU:o.ang+(Math.random()-0.5)*(o.spread===undefined?TAU:o.spread);
    const s=(o.spd||4)*(0.35+Math.random()*0.9);
    this.spawn({x:x+(Math.random()-0.5)*(o.jitter||0.2),y:y+(Math.random()-0.5)*(o.jitter||0.2),
      vx:Math.cos(a)*s+(o.vx||0),vy:Math.sin(a)*s+(o.vy||0),life:o.life,size:o.size,g:o.g,drag:o.drag,
      kind:o.kind,col:o.col,a:o.a,add:o.add,grow:o.grow,ringR:o.ringR,noise:o.noise});}}
  update(dt){for(let i=0;i<this.max;i++){const p=this.list[i];if(!p.alive)continue;
    p.life-=dt;if(p.life<=0){p.alive=false;this.aliveCount--;this.free.push(i);continue;}
    p.vy+=p.g*dt;const d=Math.exp(-p.drag*dt);p.vx*=d;p.vy*=d;
    if(p.noise){p.vx+=Math.sin((p.y+p.life)*7)*p.noise*dt;p.vy+=Math.cos((p.x+p.life)*6)*p.noise*dt;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.size+=p.grow*dt;}}
  /* кадр: только то, что в кадре (v — {x0,y0,x1,y1} в метрах) */
  render(c,mode,v){
    for(let i=0;i<this.max;i++){const p=this.list[i];if(!p.alive)continue;
      if((p.add?'add':'norm')!==mode)continue;
      if(v){const m=p.size*2+(p.ringR||0)+0.5;if(p.x<v.x0-m||p.x>v.x1+m||p.y<v.y0-m||p.y>v.y1+m)continue;}
      const t=p.life/p.max,a=p.a*t;if(a<=0.012)continue;
      c.save();c.globalAlpha=clamp(a,0,1);
      if(p.add)c.globalCompositeOperation='lighter';
      c.translate(p.x,p.y);
      const k=p.kind;
      if(k==='spark'){c.strokeStyle=p.col;c.lineWidth=p.size*0.7;c.lineCap='round';
        c.beginPath();c.moveTo(0,0);c.lineTo(-p.vx*0.03,-p.vy*0.03);c.stroke();}
      else if(k==='leaf'){c.rotate(p.rot);c.fillStyle=p.col;c.beginPath();c.ellipse(0,0,p.size,p.size*0.45,0,0,TAU);c.fill();}
      else if(k==='debris'){c.rotate(p.rot);c.fillStyle=p.col;c.fillRect(-p.size*0.5,-p.size*0.5,p.size,p.size);}
      else if(k==='ring'){c.strokeStyle=p.col;c.lineWidth=p.size*0.4*(0.3+t);
        c.beginPath();c.arc(0,0,(1-t)*p.ringR+p.size,0,TAU);c.stroke();}
      else if(k==='shock'){c.strokeStyle=p.col;c.lineWidth=0.12*t+0.02;c.beginPath();c.arc(0,0,(1-t)*p.ringR,0,TAU);c.stroke();}
      else if(k==='steam'||k==='smoke'){c.globalAlpha=clamp(a*0.62,0,1);
        const s2=p.size*2;c.drawImage(Tex.soft(p.col),-p.size,-p.size,s2,s2);}
      else{c.fillStyle=p.col;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();}
      c.restore();}
    c.globalCompositeOperation='source-over';c.globalAlpha=1;}
  clear(){this.free.length=0;for(let i=0;i<this.max;i++){this.list[i].alive=false;this.free.push(this.max-1-i);}this.aliveCount=0;}
}
