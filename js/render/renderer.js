"use strict";
/* ============================== PARALLAX / RENDERER ============================== */
class ParallaxSystem{
  constructor(game){this.game=game;this.layers=null;}
  dispose(){if(this.layers){for(const k in this.layers){const L=this.layers[k];if(L&&L.cv){L.cv.width=0;L.cv.height=0;}}this.layers=null;}}
  build(room){
    const g=this.game,ppm=g.bakePpm,vw=g.vw/g.ppm,vh=g.vh/g.ppm,out={};
    const defs=[['far',0.14,room.art.far],['bg',0.34,room.art.bg],['mid',0.62,room.art.mid],
      ['game',1.0,room.art.game],['fgd',1.22,room.art.fgd]];
    for(let i=0;i<defs.length;i++){
      const key=defs[i][0],f=defs[i][1],fn=defs[i][2];if(!fn)continue;
      const wm=Math.max(room.w,vw*f)+4*f+3,hm=Math.max(room.h,vh*f)+4*f+3;
      const cv=document.createElement('canvas');
      cv.width=Math.ceil(wm*ppm);cv.height=Math.ceil(hm*ppm);
      const c=cv.getContext('2d');c.setTransform(ppm,0,0,ppm,0,0);
      try{fn(c,{w:cv.width/ppm,h:cv.height/ppm,f:f},room,rng(room.id+key));}
      catch(e){console.error('layer '+key,e);
        /* геометрия не имеет права пропасть из-за ошибки в декоре */
        if(key==='game')try{drawSolids(c,room,room.zone);}catch(e2){}}
      out[key]={cv:cv,f:f};
    }
    this.layers=out;
  }
}
/* Открытые рёбра твёрдой геометрии (кэш на комнату): верх → кромка «по этому ходят»,
   бока/низ → тёмный контур. Рёбра, утопленные в соседний блок, вырезаются. */
const OUTLINE_OFFS=[[-1,0],[1,0],[0,-1],[0,1],[-0.7,-0.7],[0.7,-0.7],[-0.7,0.7],[0.7,0.7]];
function buildEdges(R){
  const sol=R.solids.filter(s=>!s.hidden),solid=sol.filter(s=>!s.ow),top=[],line=[],ow=[];
  const sub=(a0,a1,cov)=>{let segs=[[a0,a1]];
    for(const cv of cov){const out=[];
      for(const sg of segs){if(cv[1]<=sg[0]||cv[0]>=sg[1]){out.push(sg);continue;}
        if(cv[0]>sg[0])out.push([sg[0],cv[0]]);if(cv[1]<sg[1])out.push([cv[1],sg[1]]);}
      segs=out;}
    return segs.filter(sg=>sg[1]-sg[0]>0.05);};
  for(const s of sol){
    if(s.noEdge)continue;
    if(s.ow){ow.push([s.x,s.x+s.w,s.y]);continue;}
    const o=solid.filter(q=>q!==s),e=0.03;
    const yT=s.y-e,yB=s.y+s.h+e,xL=s.x-e,xR=s.x+s.w+e;
    for(const sg of sub(s.x,s.x+s.w,o.filter(q=>q.y<yT&&q.y+q.h>yT).map(q=>[q.x,q.x+q.w])))top.push([sg[0],sg[1],s.y]);
    for(const sg of sub(s.x,s.x+s.w,o.filter(q=>q.y<yB&&q.y+q.h>yB).map(q=>[q.x,q.x+q.w])))line.push([sg[0],s.y+s.h,sg[1],s.y+s.h]);
    for(const sg of sub(s.y,s.y+s.h,o.filter(q=>q.x<xL&&q.x+q.w>xL).map(q=>[q.y,q.y+q.h])))line.push([s.x,sg[0],s.x,sg[1]]);
    for(const sg of sub(s.y,s.y+s.h,o.filter(q=>q.x<xR&&q.x+q.w>xR).map(q=>[q.y,q.y+q.h])))line.push([s.x+s.w,sg[0],s.x+s.w,sg[1]]);
  }
  return {top:top,line:line,ow:ow,src:R.solids};
}
class WorldRenderer{
  constructor(game){this.game=game;
    this.light=document.createElement('canvas');this.lctx=this.light.getContext('2d');
    this.glow=document.createElement('canvas');this.gctx=this.glow.getContext('2d');
    this.bloom=document.createElement('canvas');this.bctx=this.bloom.getContext('2d');
    this.fgc=document.createElement('canvas');this.fgx=this.fgc.getContext('2d');
    this.oa=document.createElement('canvas');this.oax=this.oa.getContext('2d');
    this.ob=document.createElement('canvas');this.obx=this.ob.getContext('2d');
    this.grain=Tex.get('grain');this.grainPat=null;this.vig=null;this.glowSources=[];}
  resize(w,h){
    this.light.width=Math.max(2,w>>1);this.light.height=Math.max(2,h>>1);
    this.glow.width=Math.max(2,w>>2);this.glow.height=Math.max(2,h>>2);
    this.bloom.width=this.glow.width;this.bloom.height=this.glow.height;
    this.fgc.width=w;this.fgc.height=h;
    const v=document.createElement('canvas');v.width=w;v.height=h;const vc=v.getContext('2d');
    const g=vc.createRadialGradient(w/2,h*0.5,Math.min(w,h)*0.42,w/2,h*0.5,Math.max(w,h)*0.82);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.65,'rgba(0,0,0,.12)');g.addColorStop(1,'rgba(0,0,0,.46)');
    vc.fillStyle=g;vc.fillRect(0,0,w,h);this.vig=v;
  }
  beginFrame(){this.glowSources.length=0;}
  glowAdd(x,y,r,col,a){this.glowSources.push({x:x,y:y,r:r,col:col,a:a});}
  worldTransform(c,cam,zoom){const s=this.game.ppm*zoom;
    c.setTransform(s,0,0,s,-cam.cx*s+this.game.vw/2,-cam.cy*s+this.game.vh/2);}
  drawLayerTo(ctx,L,cam,zoom,f){
    const g=this.game,s=g.ppm*zoom,sc=s/g.bakePpm;
    const cx=cam.x+cam.sx*f,cy=cam.y+cam.sy*f;
    ctx.drawImage(L.cv,(-cx*f)*s+g.vw/2,(-cy*f)*s+g.vh/2,L.cv.width*sc,L.cv.height*sc);
  }
  lighting(c,cam,zoom,room,zone,t){
    const g=this.game,L=this.light,l=this.lctx,sc=L.width/g.vw,s=g.ppm*zoom;
    l.setTransform(1,0,0,1,0,0);l.globalCompositeOperation='source-over';
    const A=room.amb||zone.ambRGB;
    l.fillStyle='rgb('+A[0]+','+A[1]+','+A[2]+')';l.fillRect(0,0,L.width,L.height);
    l.globalCompositeOperation='lighter';
    const put=(x,y,r,colHex,inten)=>{
      if(inten<=0.01)return;
      const sx=(x-cam.cx)*s*sc+L.width/2,sy=(y-cam.cy)*s*sc+L.height/2,R=Math.max(4,r*s*sc);
      if(sx<-R||sy<-R||sx>L.width+R||sy>L.height+R)return;
      const gr=l.createRadialGradient(sx,sy,0,sx,sy,R),col=hxc(colHex);
      gr.addColorStop(0,'rgba('+col[0]+','+col[1]+','+col[2]+','+(0.98*inten)+')');
      gr.addColorStop(0.33,'rgba('+col[0]+','+col[1]+','+col[2]+','+(0.44*inten)+')');
      gr.addColorStop(1,'rgba('+col[0]+','+col[1]+','+col[2]+',0)');
      l.fillStyle=gr;l.beginPath();l.arc(sx,sy,R,0,TAU);l.fill();};
    const lights=room.lights;
    for(let i=0;i<lights.length;i++){
      const lt=lights[i];
      const flick=lt.flicker?(0.74+0.26*Math.sin(t*lt.flicker*13+lt.seed)):1;
      put(lt.x,lt.y,lt.r,lt.col||'#ffbe63',(lt.i===undefined?1:lt.i)*flick);
    }
    /* функциональный свет: выходы, рычаги/сальваж и цели всегда подсвечены */
    if(room===g.world.room&&g.state!=='menu'){
      const W=g.world;
      for(const d of room.doors)put(d.x+d.w/2,d.y+d.h*0.45,3.2,g.gates.doorLocked(d)?'#ff8a6a':'#a8d8ff',0.55);
      for(const it of W.interactables)if(it.canUse(g.gs))put(it.x,it.y-0.9,3.0,'#ffd9a0',0.55);
      for(const pb of W.pushables)if(!pb.pushed)put(pb.x+pb.w/2,pb.y+Math.min(pb.h*0.5,1.6),2.8,'#ffd9a0',0.4);
    }
    const p=room.playerRef;
    if(p&&p.bottom!==undefined&&!p.dead){
      /* фонарь курьера: пол и стены вокруг видны в любой комнате */
      const sx=(p.cx-cam.cx)*s*sc+L.width/2,sy=(p.cy-cam.cy)*s*sc+L.height/2,R=5.6*s*sc;
      const gr=l.createRadialGradient(sx,sy,0,sx,sy,R);
      gr.addColorStop(0,'rgba(215,205,185,.42)');gr.addColorStop(0.45,'rgba(200,190,170,.18)');gr.addColorStop(1,'rgba(190,180,160,0)');
      l.fillStyle=gr;l.beginPath();l.arc(sx,sy,R,0,TAU);l.fill();}
    c.save();c.setTransform(1,0,0,1,0,0);
    c.globalCompositeOperation='multiply';c.drawImage(L,0,0,g.vw,g.vh);c.restore();
  }
  bloomPass(c){
    const g=this.game,G=this.glow,x=this.gctx;
    x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,G.width,G.height);
    const cam=g.camera,s=g.ppm*cam.zoom,sc=G.width/g.vw;
    x.globalCompositeOperation='lighter';
    const gs=this.glowSources;
    for(let i=0;i<gs.length;i++){
      const gl=gs[i];
      const sx=(gl.x-cam.cx)*s*sc+G.width/2,sy=(gl.y-cam.cy)*s*sc+G.height/2,R=Math.max(2,gl.r*s*sc);
      if(sx<-R||sy<-R||sx>G.width+R||sy>G.height+R)continue;
      const gr=x.createRadialGradient(sx,sy,0,sx,sy,R);
      gr.addColorStop(0,rgba(gl.col,gl.a));gr.addColorStop(.4,rgba(gl.col,gl.a*0.34));gr.addColorStop(1,rgba(gl.col,0));
      x.fillStyle=gr;x.beginPath();x.arc(sx,sy,R,0,TAU);x.fill();}
    const B=this.bloom,b=this.bctx;
    b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,B.width,B.height);
    b.filter='blur(3px)';b.drawImage(G,0,0);b.filter='none';
    c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='lighter';
    c.globalAlpha=0.85;c.drawImage(B,0,0,g.vw,g.vh);
    c.globalAlpha=0.4;c.drawImage(G,0,0,g.vw,g.vh);c.restore();
  }
  foreground(c,par,cam,zoom,room){
    const L=par.layers&&par.layers.fgd;if(!L)return;
    const g=this.game,F=this.fgc,fx=this.fgx;
    fx.setTransform(1,0,0,1,0,0);fx.clearRect(0,0,F.width,F.height);
    this.drawLayerTo(fx,L,cam,zoom,L.f);
    /* передний план — тёмные силуэты у камеры: глубина есть, внимание не крадёт */
    fx.globalCompositeOperation='source-atop';fx.fillStyle='rgba(7,6,5,.55)';fx.fillRect(0,0,F.width,F.height);
    fx.globalCompositeOperation='source-over';
    const p=room.playerRef;
    if(p&&p.bottom!==undefined){
      const s=g.ppm*zoom,sx=(p.cx-cam.cx)*s+g.vw/2,sy=(p.cy-cam.cy)*s+g.vh/2,R=6.2*s;
      fx.globalCompositeOperation='destination-out';
      const gr=fx.createRadialGradient(sx,sy,R*0.28,sx,sy,R);
      gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');
      fx.fillStyle=gr;fx.beginPath();fx.arc(sx,sy,R,0,TAU);fx.fill();
      fx.globalCompositeOperation='source-over';}
    c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=room.playerRef?0.8:0.96;c.drawImage(F,0,0);c.restore();
  }
  /* ---------- ЧИТАЕМОСТЬ: рисуется ПОСЛЕ light-multiply, темнота её не съедает ---------- */
  readability(c,room,cam,zoom,t){
    const g=this.game,s=g.ppm*zoom,px=1/s,Z=READ[room.zone]||READ.sump;
    const E=(room._edges&&room._edges.src===room.solids)?room._edges:(room._edges=buildEdges(room));
    const hw=g.vw/s/2+1,hh=g.vh/s/2+1,x0=cam.cx-hw,x1=cam.cx+hw,y0=cam.cy-hh,y1=cam.cy+hh;
    const offH=e=>e[1]<x0||e[0]>x1||e[2]<y0||e[2]>y1;
    this.worldTransform(c,cam,zoom);
    c.save();c.lineCap='butt';
    /* тёмный контур блоков + тёмная линия над кромкой: блок отделяется от стены в любом свете */
    c.strokeStyle=Z.out;c.lineWidth=2.4*px;c.beginPath();
    for(const l of E.line){
      if(Math.max(l[0],l[2])<x0||Math.min(l[0],l[2])>x1||Math.max(l[1],l[3])<y0||Math.min(l[1],l[3])>y1)continue;
      c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);}
    for(const e of E.top){if(offH(e))continue;c.moveTo(e[0],e[2]-1.2*px);c.lineTo(e[1],e[2]-1.2*px);}
    for(const e of E.ow){if(offH(e))continue;c.moveTo(e[0],e[2]-1.2*px);c.lineTo(e[1],e[2]-1.2*px);}
    c.stroke();
    /* светлая кромка проходимой поверхности: «по этому можно ходить» */
    c.strokeStyle=rgba(Z.rim,Z.rimA*0.2);c.lineWidth=7*px;c.beginPath();
    for(const e of E.top){if(offH(e))continue;c.moveTo(e[0],e[2]+4.6*px);c.lineTo(e[1],e[2]+4.6*px);}
    c.stroke();
    c.strokeStyle=rgba(Z.rim,Z.rimA);c.lineWidth=2.6*px;c.beginPath();
    for(const e of E.top){if(offH(e))continue;c.moveTo(e[0],e[2]+1.3*px);c.lineTo(e[1],e[2]+1.3*px);}
    for(const e of E.ow){if(offH(e))continue;c.moveTo(e[0],e[2]+1.3*px);c.lineTo(e[1],e[2]+1.3*px);}
    c.stroke();
    /* проходимые снизу настилы: редкие «зубцы» решётки под кромкой */
    c.strokeStyle=rgba(Z.rim,Z.rimA*0.42);c.lineWidth=1.6*px;c.beginPath();
    for(const e of E.ow){if(offH(e))continue;
      for(let x=e[0]+0.25;x<e[1]-0.1;x+=0.55){c.moveTo(x,e[2]+3*px);c.lineTo(x,e[2]+0.24);}}
    c.stroke();
    /* рифлёные грани под когти: латунная насечка-«ёлочка» и светлая кромка. Только на них работают кошки */
    const hasClaws=this.game.gs.has('claws');
    for(const q of room.solids){
      if(!q.grip||q.hidden||q.x>x1||q.x+q.w<x0||q.y>y1||q.y+q.h<y0)continue;
      const faces=q.grip===true?['l','r']:[q.grip];
      for(const f of faces){
        const fx=f==='l'?q.x:q.x+q.w,dir=f==='l'?1:-1;
        c.fillStyle=rgba('#d8b04a',hasClaws?0.9:0.6);
        for(let y=q.y+0.35;y<q.y+q.h-0.15;y+=0.42){
          c.beginPath();c.moveTo(fx+dir*0.05,y);c.lineTo(fx+dir*0.34,y-0.16);c.lineTo(fx+dir*0.34,y-0.04);c.lineTo(fx+dir*0.05,y+0.12);c.closePath();c.fill();}
        c.strokeStyle=rgba('#ffd98a',hasClaws?0.75:0.45);c.lineWidth=2.2*px;
        c.beginPath();c.moveTo(fx-dir*1.1*px,q.y+0.1);c.lineTo(fx-dir*1.1*px,q.y+q.h-0.05);c.stroke();
      }
    }
    c.restore();
    this.doorPlates(c,room,t,s);
    this.signs(c,room,t,s);
  }
  /* табличка над каждым выходом: куда ведёт и открыт ли (зелёная/красная лампа) */
  doorPlates(c,room,t,s){
    const g=this.game,p=room.playerRef;
    c.save();c.textBaseline='middle';c.textAlign='left';c.font='500 0.32px Oswald';
    for(const d of room.doors){
      const locked=g.gates.doorLocked(d),here=!!(p&&p.bottom!==undefined&&aabb(p.rect(),d));
      const mid=d.x+d.w/2,arrow=d.down?'▾ ':(d.x<0.6?'◂ ':(d.x+d.w>room.w-0.6?'▸ ':'▴ '));
      const txt=arrow+(d.down?'ЛЮК · ':d.elevator?'ЛИФТ · ':'')+(d.label||'');
      const tw=c.measureText(txt).width,w=tw+0.66,h=0.5;
      const cx=clamp(mid,w/2+0.15,room.w-w/2-0.15),cy=d.down?d.y+d.h+0.5:d.y-0.55;
      c.fillStyle='rgba(10,9,7,.86)';rr(c,cx-w/2,cy-h/2,w,h,0.06);c.fill();
      c.strokeStyle=locked?'rgba(255,110,80,.8)':(here?'rgba(255,236,190,1)':'rgba(232,201,106,.65)');
      c.lineWidth=(here?2.2:1.4)/s;rr(c,cx-w/2,cy-h/2,w,h,0.06);c.stroke();
      c.fillStyle=locked?'#ffab90':'#f6e8c6';c.fillText(txt,cx-w/2+0.44,cy+0.02);
      const lc=locked?'#ff4a2a':'#69d68f',pulse=here?0.5+0.5*Math.sin(t*6):0.6;
      c.fillStyle=lc;c.beginPath();c.arc(cx-w/2+0.24,cy,0.085,0,TAU);c.fill();
      this.glowAdd(cx-w/2+0.24,cy,0.45,lc,0.35+0.3*pulse);
    }
    c.restore();
  }
  /* обучающие трафареты: подсвеченная табличка с клавишами прямо на стене */
  signs(c,room,t,s){
    const g=this.game,gs=g.gs,list=room.signs,p=room.playerRef;
    if(!list||!list.length)return;
    c.save();c.textBaseline='middle';
    for(const sg of list){
      if(sg.need&&!gs.has(sg.need))continue;
      if(sg.needNot&&gs.has(sg.needNot))continue;
      if(sg.hideFlag&&gs.flags[sg.hideFlag])continue;
      if(sg.showFlag&&!gs.flags[sg.showFlag])continue;
      const near=p&&p.bottom!==undefined?clamp(1-(Math.abs(p.cx-sg.x)-3)/6,0,1):0;
      c.font='500 0.36px Oswald';
      const kw=sg.keys.map(k=>Math.max(0.54,c.measureText(k).width+0.28));
      c.font='400 0.26px Oswald';const altT=sg.alt?'/ '+sg.alt:'',aw=sg.alt?c.measureText(altT).width+0.16:0;
      c.font='500 0.34px Oswald';const tw=c.measureText(sg.text).width;
      const gap=0.1,keysW=kw.reduce((a,b)=>a+b,0)+gap*(kw.length-1);
      const W=0.3+keysW+aw+0.24+tw+0.3,H=0.86,x0=sg.x-W/2,y0=sg.y,ky=y0+H/2;
      c.fillStyle='rgba(12,10,8,'+(0.74+0.14*near)+')';rr(c,x0,y0,W,H,0.08);c.fill();
      c.strokeStyle=rgba('#e8c96a',0.45+0.45*near);c.lineWidth=(1.2+near)/s;rr(c,x0,y0,W,H,0.08);c.stroke();
      let x=x0+0.3;
      for(let i=0;i<sg.keys.length;i++){const w=kw[i];
        c.fillStyle='#211a10';rr(c,x,ky-0.28,w,0.56,0.06);c.fill();
        c.fillStyle='rgba(232,201,106,.55)';c.fillRect(x+0.05,ky+0.2,w-0.1,0.06);
        c.strokeStyle=rgba('#e8c96a',0.9);c.lineWidth=1.3/s;rr(c,x,ky-0.28,w,0.56,0.06);c.stroke();
        c.font='500 0.36px Oswald';c.textAlign='center';c.fillStyle='#fff3d2';c.fillText(sg.keys[i],x+w/2,ky-0.01);
        x+=w+gap;}
      x-=gap;c.textAlign='left';
      if(sg.alt){c.font='400 0.26px Oswald';c.fillStyle='rgba(216,204,178,.8)';c.fillText(altT,x+0.12,ky);x+=aw;}
      c.font='500 0.34px Oswald';c.fillStyle=rgba('#f3e6c8',0.82+0.18*near);c.fillText(sg.text,x+0.24,ky+0.01);
      this.glowAdd(sg.x,ky,W*0.42,'#e8c96a',0.07+0.12*near);
    }
    c.restore();
  }
  /* Контурный рендер: спрайт → offscreen, силуэт цветом контура со сдвигами, сверху спрайт.
     Игрок и враги рисуются ПОСЛЕ света — силуэт читается на любом фоне. */
  outlined(c,b,fn,col,pxw){
    const g=this.game,cam=g.camera,s=g.ppm*cam.zoom,pad=4;
    const W=Math.ceil(b.w*s)+pad*2,H=Math.ceil(b.h*s)+pad*2;
    if(W>2048||H>2048)return;
    const A=this.oa,B=this.ob,ax=this.oax,bx=this.obx;
    if(A.width<W||A.height<H){A.width=B.width=Math.max(W,A.width);A.height=B.height=Math.max(H,A.height);}
    ax.setTransform(1,0,0,1,0,0);ax.globalCompositeOperation='source-over';ax.globalAlpha=1;ax.clearRect(0,0,W,H);
    ax.setTransform(s,0,0,s,pad-b.x*s,pad-b.y*s);
    fn(ax);
    ax.setTransform(1,0,0,1,0,0);
    bx.setTransform(1,0,0,1,0,0);bx.globalCompositeOperation='source-over';bx.clearRect(0,0,W,H);
    bx.drawImage(A,0,0,W,H,0,0,W,H);
    bx.globalCompositeOperation='source-in';bx.fillStyle=col;bx.fillRect(0,0,W,H);
    bx.globalCompositeOperation='source-over';
    const sx=Math.round((b.x-cam.cx)*s+g.vw/2-pad),sy=Math.round((b.y-cam.cy)*s+g.vh/2-pad);
    c.save();c.setTransform(1,0,0,1,0,0);
    for(let i=0;i<8;i++){const o=OUTLINE_OFFS[i];c.drawImage(B,0,0,W,H,sx+o[0]*pxw,sy+o[1]*pxw,W,H);}
    c.drawImage(A,0,0,W,H,sx,sy,W,H);
    c.restore();
  }
  entities(c,room,t){
    const g=this.game,W=g.world,Z=READ[room.zone]||READ.sump,cam=g.camera;
    const calm=rgba(Z.ent,0.55),hot='rgba(255,64,36,.95)';
    for(const e of W.enemies){
      if(e.dead){if(e.deadT<=2.4){this.worldTransform(c,cam,cam.zoom);e.drawBody(c,t);}continue;}
      const thr=e.threat();this.outlined(c,e.spriteBounds(),x=>e.drawBody(x,t),thr?hot:calm,thr?2.6:1.7);
    }
    const b=W.boss;
    if(b&&b.activated&&!b.dead){const thr=b.threat();
      this.outlined(c,b.spriteBounds(),x=>b.drawBody(x,t),thr?hot:calm,thr?3:2);}
    if(room.npcs)for(const n of room.npcs)this.outlined(c,n.bounds(),x=>n.draw(x,t),calm,1.6);
    const p=room.playerRef;
    if(p&&p.bottom!==undefined){
      this.worldTransform(c,cam,cam.zoom);p.drawFx(c,t);
      this.outlined(c,p.spriteBounds(),x=>p.draw(x,t),rgba(Z.ent,0.72),1.8);
      this.worldTransform(c,cam,cam.zoom);p.drawSlash(c,t);
    }
    /* клапаны-отбойники: латунные головки, от которых отскакивают ударом вниз */
    if(room.pogos)for(const q of room.pogos){this.worldTransform(c,cam,cam.zoom);drawPogo(c,q,t);}
  }
  atmosphere(c,zone,t){
    const g=this.game;
    c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='screen';
    for(let i=0;i<2;i++){
      const y=g.vh*(0.38+i*0.28)+Math.sin(t*0.11+i*2)*g.vh*0.05;
      const grd=c.createLinearGradient(0,y-g.vh*0.24,0,y+g.vh*0.24);
      grd.addColorStop(0,rgba(zone.haze,0));
      grd.addColorStop(.5,rgba(zone.haze,zone.fogA*(0.6+0.24*Math.sin(t*0.2+i))));
      grd.addColorStop(1,rgba(zone.haze,0));
      c.fillStyle=grd;c.fillRect(0,y-g.vh*0.24,g.vw,g.vh*0.48);}
    c.restore();
  }
  post(c,zone){
    const g=this.game;
    c.save();c.setTransform(1,0,0,1,0,0);
    if(this.vig){c.globalCompositeOperation='multiply';c.drawImage(this.vig,0,0);}
    c.globalCompositeOperation='overlay';c.globalAlpha=zone.grain;
    if(!this.grainPat)this.grainPat=c.createPattern(this.grain,'repeat');
    const ox=(Math.random()*128)|0,oy=(Math.random()*128)|0;
    c.save();c.translate(-ox,-oy);c.fillStyle=this.grainPat;c.fillRect(0,0,g.vw+128,g.vh+128);c.restore();
    c.restore();
  }
  debugDraw(c,cam,zoom,room){
    const o=game.debugOpts;if(!o.collision&&!o.gates&&!o.bounds&&!o.collider)return;
    this.worldTransform(c,cam,zoom);
    if(o.bounds){c.strokeStyle='#39ff88';c.lineWidth=0.06;c.strokeRect(0,0,room.w,room.h);}
    if(o.collision){
      for(const s of room.solids){c.strokeStyle=s.ow?'#ffd23f':'#39d8ff';c.lineWidth=0.04;c.strokeRect(s.x,s.y,s.w,s.h);}
      for(const h of room.hazards||[]){c.strokeStyle='#ff4a3a';c.lineWidth=0.05;c.strokeRect(h.x,h.y,h.w,h.h);}
      for(const m of room.magnetRects||[]){c.strokeStyle='#c9a227';c.lineWidth=0.05;c.strokeRect(m.x,m.y,m.w,m.h);}
      if(room.bossTrigger){c.strokeStyle='#ff5ad0';c.lineWidth=0.06;
        c.strokeRect(room.bossTrigger.x,room.bossTrigger.y,room.bossTrigger.w,room.bossTrigger.h);}
      for(const e of game.world.enemies){if(e.dead)continue;c.strokeStyle='#ff8a5a';c.lineWidth=0.04;c.strokeRect(e.x,e.y,e.w,e.h);}
    }
    if(o.gates){
      for(const d of room.doors){c.strokeStyle=game.gates.doorLocked(d)?'#ff4a3a':'#39ff88';
        c.lineWidth=0.07;c.strokeRect(d.x,d.y,d.w,d.h);}
      for(const it of game.world.interactables){if(!it.canUse(game.gs))continue;
        c.strokeStyle='#ffe6a3';c.lineWidth=0.06;const r=it.rect();c.strokeRect(r.x,r.y,r.w,r.h);}
    }
    if(o.collider&&room.playerRef&&room.playerRef.bottom!==undefined){
      const p=room.playerRef;
      c.strokeStyle='#ffffff';c.lineWidth=0.035;c.strokeRect(p.x,p.y,p.w,p.h);
      const fy=p.onCeil?p.y:p.bottom;
      c.fillStyle='#ffe663';c.beginPath();c.arc(p.cx,fy,0.075,0,TAU);c.fill();
      c.strokeStyle='#ffe663';c.lineWidth=0.03;c.beginPath();c.moveTo(p.x,fy);c.lineTo(p.x+p.w,fy);c.stroke();
      const gd=nearestGroundBelow(p,room.solids,3.0);
      if(gd!==null){
        c.strokeStyle='rgba(57,255,136,.85)';c.lineWidth=0.03;c.setLineDash([0.12,0.1]);
        c.beginPath();c.moveTo(p.cx,p.bottom);c.lineTo(p.cx,p.bottom+gd);c.stroke();c.setLineDash([]);
        c.fillStyle='rgba(57,255,136,.9)';c.fillRect(p.cx-0.16,p.bottom+gd-0.03,0.32,0.06);}
      const bw=1.7;
      c.fillStyle='rgba(0,0,0,.55)';c.fillRect(p.cx-bw/2,p.y-0.52,bw,0.16);
      c.fillStyle='#39d8ff';c.fillRect(p.cx-bw/2,p.y-0.52,bw*clamp(p.coyote/CFG.player.coyote,0,1),0.07);
      c.fillStyle='#ffd23f';c.fillRect(p.cx-bw/2,p.y-0.43,bw*clamp(p.jumpBuf/CFG.player.jumpBuf,0,1),0.07);
      c.fillStyle='#eafff4';c.font='500 0.22px "JetBrains Mono",monospace';
      c.fillText(p.state+' g:'+(p.onGround?1:0)+' w:'+p.wall,p.cx-bw/2,p.y-0.62);
    }
    c.setTransform(1,0,0,1,0,0);
  }
}
