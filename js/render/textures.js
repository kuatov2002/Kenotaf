"use strict";
/* ============================== TEXTURES ============================== */
function PAT(c,name){const cv=c.canvas;if(!cv.__pat)cv.__pat={};
  if(cv.__pat[name])return cv.__pat[name];
  const p=c.createPattern(Tex.get(name),'repeat');cv.__pat[name]=p;return p;}
const Tex={
  cache:{},_soft:{},
  get(n){if(this.cache[n])return this.cache[n];return this.cache[n]=this.make(n);},
  soft(col){
    if(this._soft[col])return this._soft[col];
    const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');
    const g=x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,rgba(col,1));g.addColorStop(0.42,rgba(col,0.44));g.addColorStop(1,rgba(col,0));
    x.fillStyle=g;x.fillRect(0,0,64,64);return this._soft[col]=cv;
  },
  make(n){
    const S=256,cv=document.createElement('canvas');cv.width=cv.height=S;
    const c=cv.getContext('2d'),r=rng('tex'+n);
    const noise=(amt,col)=>{for(let i=0;i<amt;i++){c.fillStyle=col;c.globalAlpha=r()*0.5+0.1;
      c.fillRect(r()*S,r()*S,r()*3+0.4,r()*3+0.4);}c.globalAlpha=1;};
    if(n==='steel'){
      const g=c.createLinearGradient(0,0,S,S);g.addColorStop(0,'#565c63');g.addColorStop(.5,'#454b51');g.addColorStop(1,'#3a4046');
      c.fillStyle=g;c.fillRect(0,0,S,S);
      for(let i=0;i<180;i++){c.strokeStyle='rgba(255,255,255,'+(r()*0.05)+')';c.lineWidth=r()*1.4;const y=r()*S;
        c.beginPath();c.moveTo(0,y);c.lineTo(S,y+(r()-0.5)*5);c.stroke();}
      noise(800,'rgba(0,0,0,.16)');noise(350,'rgba(255,255,255,.05)');
    }else if(n==='rust'){
      const g=c.createLinearGradient(0,0,S,S);g.addColorStop(0,'#6b4a3a');g.addColorStop(.5,'#5b4034');g.addColorStop(1,'#4a352b');
      c.fillStyle=g;c.fillRect(0,0,S,S);
      const cols=['#8a5a3c','#7a4a30','#9c6a44','#5e3a28'];
      for(let i=0;i<60;i++){const x=r()*S,y=r()*S,rad=r()*34+6;
        const rg=c.createRadialGradient(x,y,0,x,y,rad);rg.addColorStop(0,cols[(r()*4)|0]);rg.addColorStop(1,'rgba(0,0,0,0)');
        c.globalAlpha=0.5+r()*0.4;c.fillStyle=rg;c.beginPath();c.arc(x,y,rad,0,TAU);c.fill();}
      c.globalAlpha=1;
      for(let i=0;i<34;i++){c.strokeStyle='rgba(58,34,22,'+(r()*0.5)+')';c.lineWidth=r()*2+0.4;
        const x=r()*S,y=r()*S;c.beginPath();c.moveTo(x,y);c.lineTo(x+(r()-0.5)*40,y+r()*30);c.stroke();}
      noise(1200,'rgba(0,0,0,.2)');noise(260,'rgba(255,220,180,.05)');
    }else if(n==='concrete'){
      c.fillStyle='#54514b';c.fillRect(0,0,S,S);
      for(let i=0;i<110;i++){const x=r()*S,y=r()*S,rad=r()*40+8;
        const rg=c.createRadialGradient(x,y,0,x,y,rad);
        rg.addColorStop(0,r()>0.5?'rgba(90,88,82,.5)':'rgba(50,48,45,.45)');rg.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=rg;c.beginPath();c.arc(x,y,rad,0,TAU);c.fill();}
      for(let i=0;i<8;i++){c.strokeStyle='rgba(28,26,24,'+(r()*0.5+0.2)+')';c.lineWidth=r()*1.6+0.3;
        let x=r()*S,y=r()*S;c.beginPath();c.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-0.5)*54;y+=(r()-0.5)*54;c.lineTo(x,y);}c.stroke();}
      noise(1600,'rgba(0,0,0,.14)');
    }else if(n==='marble'){
      c.fillStyle='#ded9cd';c.fillRect(0,0,S,S);
      for(let i=0;i<24;i++){c.strokeStyle='rgba(150,146,132,'+(r()*0.34+0.06)+')';c.lineWidth=r()*2.6+0.3;
        let x=r()*S,y=r()*S;c.beginPath();c.moveTo(x,y);for(let k=0;k<7;k++){x+=(r()-0.5)*70;y+=(r()-0.35)*46;c.lineTo(x,y);}c.stroke();}
      noise(1000,'rgba(255,255,255,.28)');
    }else if(n==='lead'){
      c.fillStyle='#4d4f55';c.fillRect(0,0,S,S);
      for(let y=0;y<S;y+=64)for(let x=0;x<S;x+=64){
        c.strokeStyle='rgba(0,0,0,.34)';c.lineWidth=1.6;c.strokeRect(x+1,y+1,62,62);
        c.strokeStyle='rgba(255,255,255,.05)';c.beginPath();c.moveTo(x+2,y+62);c.lineTo(x+62,y+62);c.stroke();
        if(r()>0.72){c.fillStyle='rgba(190,180,160,.09)';c.font='700 15px Oswald';
          c.fillText(['ПБ','Св','№'+((r()*90|0)+10),'41'][(r()*4)|0],x+14,y+38);}}
      noise(2000,'rgba(0,0,0,.18)');noise(500,'rgba(255,255,255,.04)');
    }else if(n==='grate'){
      c.clearRect(0,0,S,S);c.fillStyle='#3e444a';c.fillRect(0,0,S,S);
      c.globalCompositeOperation='destination-out';
      for(let y=6;y<S;y+=20)for(let x=((y/20)%2)*10+6;x<S;x+=20){c.beginPath();c.ellipse(x,y,6.4,7.4,0,0,TAU);c.fill();}
      c.globalCompositeOperation='source-over';
      for(let y=6;y<S;y+=20)for(let x=((y/20)%2)*10+6;x<S;x+=20){
        c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=1.2;c.beginPath();c.ellipse(x,y-1,6.4,7.4,0,PI,TAU);c.stroke();}
      noise(450,'rgba(0,0,0,.3)');
    }else if(n==='hazard'){
      c.fillStyle='#1a1712';c.fillRect(0,0,S,S);
      c.save();c.translate(S/2,S/2);c.rotate(-PI/4);c.translate(-S,-S);
      for(let i=0;i<S*3;i+=42){c.fillStyle=(i/42)%2?'#c9a227':'#1a1712';c.fillRect(i,0,21,S*3);}c.restore();
      noise(800,'rgba(0,0,0,.35)');
    }else if(n==='wallpaper'){
      c.fillStyle='#5a3a34';c.fillRect(0,0,S,S);
      for(let x=0;x<S;x+=18){c.fillStyle='rgba(138,109,59,'+(0.06+((x/18)%3)*0.03)+')';c.fillRect(x,0,9,S);}
      for(let i=0;i<40;i++){c.fillStyle='rgba(210,190,150,'+(r()*0.05)+')';c.beginPath();c.arc(r()*S,r()*S,r()*7+2,0,TAU);c.fill();}
      for(let i=0;i<20;i++){c.fillStyle='rgba(20,12,10,'+(r()*0.3)+')';c.beginPath();c.ellipse(r()*S,r()*S,r()*26,r()*16,r()*3,0,TAU);c.fill();}
      noise(1400,'rgba(0,0,0,.16)');
    }else if(n==='ply'){
      c.fillStyle='#6a5540';c.fillRect(0,0,S,S);
      for(let i=0;i<130;i++){c.strokeStyle='rgba(60,44,30,'+(r()*0.3)+')';c.lineWidth=r()*2+0.3;const y=r()*S;
        c.beginPath();c.moveTo(0,y);c.bezierCurveTo(S*0.3,y+(r()-0.5)*10,S*0.6,y+(r()-0.5)*10,S,y+(r()-0.5)*6);c.stroke();}
      noise(800,'rgba(0,0,0,.2)');
    }else if(n==='carpet'){c.fillStyle='#4a2b2b';c.fillRect(0,0,S,S);noise(7000,'rgba(0,0,0,.22)');
      noise(3500,'rgba(160,120,90,.09)');c.strokeStyle='rgba(138,109,59,.2)';c.lineWidth=3;c.strokeRect(10,10,S-20,S-20);}
    else if(n==='grain'){c.clearRect(0,0,S,S);
      for(let i=0;i<12000;i++){const v=r()*255|0;c.fillStyle='rgba('+v+','+v+','+v+','+(r()*0.55)+')';c.fillRect(r()*S,r()*S,1.3,1.3);}}
    return cv;
  }
};
