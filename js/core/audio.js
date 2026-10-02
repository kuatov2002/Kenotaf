"use strict";
/* ============================== AUDIO ============================== */
const mtof=m=>440*Math.pow(2,(m-69)/12);
/* Генеративный эмбиент по зонам. Всё мягкое: пэды sine/triangle через lowpass,
   редкие «колокольчики» через эхо, шумовая подложка машин с медленным дыханием.
   Никаких голых пил/квадратов — они и резали уши в прошлой версии. */
const MUSIC={
  sump:{chords:[[45,52,57,60],[41,48,53,57],[43,50,55,59],[40,47,52,55]],dur:10,pad:850,padG:0.0105,
    bells:[57,60,62,64,67,69,72],bellEvery:[4,9],bellG:0.013,bed:{lp:170,g:0.05,lfo:0.06},drone:[33,0.02],
    clank:[7,15],drip:[2.5,6]},
  hives:{chords:[[50,57,62,65],[46,53,58,62],[43,50,55,58],[45,52,57,61]],dur:12,pad:720,padG:0.0095,
    bells:[62,65,67,69,72,74,77],bellEvery:[3,7],bellG:0.012,bed:{lp:130,g:0.034,lfo:0.04},drone:[38,0.014],
    creak:[9,18]},
  eden:{chords:[[48,55,59,64],[45,52,55,60],[41,48,52,57],[41,48,50,56]],dur:10,pad:1250,padG:0.0085,
    bells:[72,74,76,79,81,84],bellEvery:[3,6],bellG:0.0095,bed:{lp:300,g:0.016,lfo:0.08},air:0.005},
  seal:{chords:[[40,47,52,59],[41,48,53,57],[40,47,52,55],[38,45,50,57]],dur:14,pad:600,padG:0.008,
    bells:[64,65,71,72,76],bellEvery:[6,12],bellG:0.01,bed:{lp:110,g:0.03,lfo:0.03},drone:[28,0.022],tick:1.0},
  surface:{chords:[[48,55,60,64],[43,50,55,59],[45,52,57,60],[41,48,53,57]],dur:8,pad:1700,padG:0.0095,
    bells:[72,74,76,79,81],bellEvery:[2.5,5],bellG:0.0105,bed:{lp:800,g:0.018,lfo:0.12},air:0.01}
};
const rnd=(a,b)=>a+Math.random()*(b-a);
class AudioSystem{
  constructor(){this.ctx=null;this.muted=false;this.zone='';this.ready=false;this.amb=null;this.ambId=0;
    this.vol={master:0.8,music:0.55,sfx:0.8};
    try{const v=JSON.parse(localStorage.getItem('kenotaf_audio')||'null');
      if(v)for(const k in this.vol)if(typeof v[k]==='number')this.vol[k]=clamp(v[k],0,1);}catch(e){}}
  init(){
    if(this.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ctx=this.ctx=new AC();if(ctx.state==='suspended')ctx.resume();
    this.master=ctx.createGain();this.master.gain.value=this.muted?0:this.vol.master;
    /* общий lowpass срезает шипение сверху, компрессор мягкий */
    this.air=ctx.createBiquadFilter();this.air.type='lowpass';this.air.frequency.value=7000;this.air.Q.value=0.4;
    this.comp=ctx.createDynamicsCompressor();
    this.comp.threshold.value=-20;this.comp.knee.value=18;this.comp.ratio.value=3.5;
    this.comp.attack.value=0.006;this.comp.release.value=0.25;
    this.comp.connect(this.air);this.air.connect(this.master);this.master.connect(ctx.destination);
    this.sfx=ctx.createGain();this.sfx.gain.value=this.vol.sfx;this.sfx.connect(this.comp);
    this.mus=ctx.createGain();this.mus.gain.value=this.vol.music;this.mus.connect(this.comp);
    /* эхо-пространство: две затухающие линии задержки с lowpass в петле */
    this.verb=ctx.createGain();
    const line=(t,fb)=>{const d=ctx.createDelay(1.5);d.delayTime.value=t;
      const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=1500;
      const g=ctx.createGain();g.gain.value=fb;
      this.verb.connect(d);d.connect(f);f.connect(g);g.connect(d);f.connect(this.mus);};
    line(0.29,0.42);line(0.43,0.34);
    const sr=ctx.sampleRate,n=ctx.createBuffer(1,sr*2,sr),d=n.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=n;
    this.ready=true;this.zone='';
    const inRoom=game&&game.world&&game.world.room&&game.state!=='menu';
    this.setZone(inRoom?game.world.room.zone:'sump');
  }
  setVol(k,v){
    this.vol[k]=clamp(v,0,1);
    try{localStorage.setItem('kenotaf_audio',JSON.stringify(this.vol));}catch(e){}
    if(!this.ready)return;const t=this.t();
    if(k==='master'&&!this.muted)this.master.gain.setTargetAtTime(this.vol.master,t,0.05);
    if(k==='music')this.mus.gain.setTargetAtTime(this.vol.music,t,0.05);
    if(k==='sfx')this.sfx.gain.setTargetAtTime(this.vol.sfx,t,0.05);
  }
  toggleMute(){this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:this.vol.master;
    document.getElementById('btnMute').textContent=this.muted?'×':'♪';}
  t(){return this.ctx.currentTime;}
  env(node,a,d,peak,dest){const gn=this.ctx.createGain(),t=this.t();gn.gain.setValueAtTime(0.0001,t);
    gn.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+a);
    gn.gain.exponentialRampToValueAtTime(0.0001,t+a+d);node.connect(gn);gn.connect(dest||this.sfx);return gn;}
  /* пила/квадрат всегда идут через lowpass — тёплый тон без «зуда» */
  tone(f,dur,type,peak,slide,dest){if(!this.ready||this.muted)return;
    const o=this.ctx.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f,this.t());
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),this.t()+dur);
    let src=o;
    if(type==='sawtooth'||type==='square'){const lp=this.ctx.createBiquadFilter();lp.type='lowpass';
      lp.frequency.value=Math.min(1600,Math.max(f,slide||0)*2.4);lp.Q.value=0.3;o.connect(lp);src=lp;}
    this.env(src,0.008,dur,peak||0.2,dest);o.start();o.stop(this.t()+dur+0.1);}
  nz(dur,freq,q,peak,type,dest){if(!this.ready||this.muted)return;
    const s=this.ctx.createBufferSource();s.buffer=this.noise;s.loop=true;
    const f=this.ctx.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=Math.min(freq,5000);f.Q.value=q||1;
    s.connect(f);this.env(f,0.005,dur,peak||0.2,dest);s.start(0,Math.random()*1.5);s.stop(this.t()+dur+0.12);}
  jump(){this.tone(250,0.12,'triangle',0.055,400);this.nz(0.07,650,1.0,0.026);}
  land(v){const k=clamp(v/26,0.15,1);this.tone(90,0.12,'sine',0.05+0.12*k,50);this.nz(0.09,300,0.8,0.02+0.07*k,'lowpass');}
  step(){this.nz(0.05,380+Math.random()*180,1.4,0.018);}
  slide(){this.nz(0.4,800,0.6,0.04);this.tone(120,0.3,'triangle',0.02,80);}
  skid(){this.nz(0.12,650,1.1,0.026);}
  dash(){if(!this.ready||this.muted)return;this.nz(0.26,420,0.5,0.08,'lowpass');
    const s=this.ctx.createBufferSource();s.buffer=this.noise;
    const f=this.ctx.createBiquadFilter();f.type='bandpass';f.Q.value=1.4;
    f.frequency.setValueAtTime(300,this.t());f.frequency.exponentialRampToValueAtTime(1300,this.t()+0.24);
    s.connect(f);this.env(f,0.01,0.26,0.06);s.start();s.stop(this.t()+0.35);}
  melee(){this.nz(0.12,1000,0.8,0.04);this.tone(280,0.08,'triangle',0.02,140);}
  /* взмах ключом: свист воздуха, вверх — выше, вниз — ниже */
  slash(dir){const f=dir==='up'?1350:dir==='down'?700:1000;
    this.nz(0.11,f,0.9,0.045);this.tone(dir==='up'?360:dir==='down'?220:280,0.08,'triangle',0.02,dir==='up'?520:140);}
  pogo(){const r=0.95+Math.random()*0.1;this.tone(880*r,0.18,'sine',0.035,1320*r);this.tone(440*r,0.12,'triangle',0.02,660*r);}
  weld(){if(!this.ready||this.muted)return;this.nz(0.85,2600,0.6,0.03);this.nz(0.85,5200,1.2,0.012);
    for(let i=0;i<6;i++)setTimeout(()=>this.nz(0.05,3000+Math.random()*2000,2,0.02),i*120+Math.random()*60);}
  heal(){this.tone(523,0.4,'sine',0.04,659,this.verb);setTimeout(()=>this.tone(784,0.5,'sine',0.032,0,this.verb),90);
    this.nz(0.2,1400,1.4,0.02);}
  hit(){this.tone(150,0.14,'triangle',0.1,60);this.nz(0.1,760,0.9,0.07);}
  hitMetal(){const r=0.94+Math.random()*0.12;
    this.tone(520*r,0.32,'sine',0.03,470*r);this.tone(1270*r,0.2,'sine',0.011,1180*r);
    this.nz(0.05,1400,1.2,0.028);this.tone(170,0.14,'triangle',0.05,90);}
  pulse(){this.tone(70,0.4,'sine',0.16,34);this.nz(0.32,420,0.5,0.09,'lowpass');this.tone(640,0.16,'triangle',0.024,220);}
  hurt(){this.tone(250,0.26,'triangle',0.1,90);this.nz(0.18,480,0.7,0.06,'lowpass');}
  death(){this.tone(180,1.0,'triangle',0.12,40);this.nz(0.9,300,0.4,0.07,'lowpass');}
  gate(){this.tone(60,1.4,'sawtooth',0.07,44);this.nz(1.2,220,0.4,0.08,'lowpass');
    setTimeout(()=>this.hitMetal(),260);setTimeout(()=>this.hitMetal(),700);}
  lever(){this.hitMetal();setTimeout(()=>this.nz(0.5,180,0.5,0.07,'lowpass'),80);}
  checkpoint(){this.nz(0.08,1100,2,0.032);this.tone(440,0.5,'sine',0.045,660);
    setTimeout(()=>this.tone(660,0.6,'sine',0.032,880),110);}
  pickup(){if(!this.ready)return;[0,150,300,480].forEach((d,i)=>setTimeout(()=>this.tone([392,523,659,784][i],0.7,'sine',0.045,0,this.verb),d));
    [0,150,300,480].forEach((d,i)=>setTimeout(()=>this.tone([392,523,659,784][i],0.6,'sine',0.04),d));
    this.nz(0.6,650,0.6,0.03,'lowpass');}
  lore(){this.tone(660,0.4,'sine',0.035,880);this.nz(0.12,1300,2,0.014);}
  /* лампада: замах — нарастающий вой винта, пике — свист; мокрица — сухой стрёкот лапок */
  lampWind(){this.tone(380,0.58,'sawtooth',0.026,1250);this.nz(0.58,2000,3,0.018);}
  lampDive(){this.nz(0.32,900,0.8,0.05);this.tone(1000,0.26,'triangle',0.02,320);}
  skitter(){this.nz(0.05,2600+Math.random()*900,3,0.01);}
  enemyDie(){this.tone(220,0.4,'triangle',0.06,60);this.nz(0.4,700,0.5,0.08,'lowpass');}
  bossRoar(){this.tone(58,1.6,'sawtooth',0.14,38);this.nz(1.4,200,0.4,0.1,'lowpass');this.tone(116,1.2,'triangle',0.04,58);}
  explosion(){this.nz(0.9,170,0.3,0.22,'lowpass');this.tone(50,0.9,'sine',0.18,26);}
  door(){this.nz(0.5,170,0.6,0.07,'lowpass');this.tone(70,0.5,'sawtooth',0.04,52);}
  elevator(){this.tone(48,2.4,'sawtooth',0.06,64);this.nz(2.2,260,0.4,0.05,'lowpass');}
  steam(p){this.nz(0.7,1000,0.5,0.03*p);}
  wheel(){this.tone(40,3.4,'sawtooth',0.1,70);this.nz(3.2,200,0.3,0.08,'lowpass');
    [0,900,1800].forEach(d=>setTimeout(()=>this.hitMetal(),d));}
  sky(){[262,330,392,523].forEach((f,i)=>setTimeout(()=>this.tone(f,3.2,'sine',0.04,0,this.verb),i*420));}
  denied(){this.tone(180,0.12,'triangle',0.04,120);}
  learned(){this.tone(660,0.18,'sine',0.028,880);setTimeout(()=>this.tone(990,0.3,'sine',0.022,0,this.verb),90);}
  stopAmbient(){
    const old=this.amb;if(!old)return;this.amb=null;old.dead=true;
    for(let i=0;i<old.timers.length;i++)clearTimeout(old.timers[i]);
    const kill=()=>{for(let i=0;i<old.nodes.length;i++){const n=old.nodes[i];
        try{n.onended=null;}catch(e){}try{if(n.stop)n.stop();}catch(e){}try{n.disconnect();}catch(e){}}
      old.nodes.length=0;try{old.g.disconnect();}catch(e){}};
    if(!this.ready){kill();return;}
    try{const t=this.t();old.g.gain.cancelScheduledValues(t);old.g.gain.setTargetAtTime(0.0001,t,0.4);}catch(e){}
    setTimeout(kill,1900);
  }
  setZone(z){
    if(!this.ready||this.zone===z)return;
    this.zone=z;this.stopAmbient();
    const M=MUSIC[z];if(!M)return;
    const ctx=this.ctx,g=ctx.createGain();g.gain.value=0.0001;g.connect(this.mus);
    const send=ctx.createGain();send.gain.value=0.3;g.connect(send);send.connect(this.verb);
    const A={g:g,nodes:[send],timers:[],dead:false,id:++this.ambId,ci:0};this.amb=A;
    /* одноразовая цепочка: после окончания источника всё отключается и забывается */
    const own=(src,chain)=>{const all=[src].concat(chain);for(const n of all)A.nodes.push(n);
      src.onended=()=>{for(const n of all){try{n.disconnect();}catch(e){}const i=A.nodes.indexOf(n);if(i>=0)A.nodes.splice(i,1);}};};
    const later=(sec,fn)=>{const id=setTimeout(()=>{if(!A.dead)fn();},sec*1000);
      A.timers.push(id);if(A.timers.length>64)A.timers.splice(0,32);};
    const noiseBed=(type,freq,q,gain,lfoHz)=>{
      const s=ctx.createBufferSource();s.buffer=this.noise;s.loop=true;
      const f1=ctx.createBiquadFilter();f1.type=type;f1.frequency.value=freq;f1.Q.value=q;
      const f2=ctx.createBiquadFilter();f2.type='lowpass';f2.frequency.value=Math.max(freq*1.6,200);f2.Q.value=0.3;
      const bg=ctx.createGain();bg.gain.value=gain;
      const lfo=ctx.createOscillator();lfo.frequency.value=lfoHz;const lg=ctx.createGain();lg.gain.value=gain*0.45;
      lfo.connect(lg);lg.connect(bg.gain);s.connect(f1);f1.connect(f2);f2.connect(bg);bg.connect(g);
      s.start(0,Math.random()*1.5);lfo.start();A.nodes.push(s,f1,f2,bg,lfo,lg);};
    if(M.bed)noiseBed('lowpass',M.bed.lp,0.5,M.bed.g,M.bed.lfo);
    if(M.air)noiseBed('bandpass',1700,0.5,M.air,0.09);
    if(M.drone){const f=mtof(M.drone[0]);
      [[1,1],[1.5,0.42],[2,0.22]].forEach(p=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=f*p[0];
        o.detune.value=(Math.random()-0.5)*8;const og=ctx.createGain();og.gain.value=M.drone[1]*p[1];
        o.connect(og);og.connect(g);o.start();A.nodes.push(o,og);});}
    const pad=()=>{
      const ch=M.chords[A.ci++%M.chords.length],t0=ctx.currentTime+0.05,dur=M.dur,att=dur*0.38,rel=dur*0.55;
      for(let i=0;i<ch.length;i++){
        const f=mtof(ch[i]),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=M.pad;lp.Q.value=0.5;
        const vg=ctx.createGain(),pk=M.padG*(i===0?1.15:1);
        vg.gain.setValueAtTime(0.0001,t0);vg.gain.linearRampToValueAtTime(pk,t0+att);
        vg.gain.setValueAtTime(pk,t0+dur);vg.gain.linearRampToValueAtTime(0.0001,t0+dur+rel);
        lp.connect(vg);vg.connect(g);
        const o1=ctx.createOscillator(),o2=ctx.createOscillator();
        o1.type='triangle';o2.type='sine';o1.frequency.value=f;o2.frequency.value=f;
        o1.detune.value=-5+(Math.random()-0.5)*4;o2.detune.value=5+(Math.random()-0.5)*4;
        o1.connect(lp);o2.connect(lp);o1.start(t0);o2.start(t0);o1.stop(t0+dur+rel+0.1);o2.stop(t0+dur+rel+0.1);
        own(o1,[o2,lp,vg]);}
      later(dur,pad);};
    const pluck=(f,gain,decay,wet)=>{
      const t0=ctx.currentTime+0.02,vg=ctx.createGain();
      vg.gain.setValueAtTime(0.0001,t0);vg.gain.exponentialRampToValueAtTime(gain,t0+0.012);
      vg.gain.exponentialRampToValueAtTime(0.0001,t0+decay);
      const o=ctx.createOscillator(),o2=ctx.createOscillator(),h=ctx.createGain();
      o.type='sine';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2.001;h.gain.value=0.22;
      o.connect(vg);o2.connect(h);h.connect(vg);vg.connect(g);
      const w=ctx.createGain();w.gain.value=wet;vg.connect(w);w.connect(this.verb);
      o.start(t0);o2.start(t0);o.stop(t0+decay+0.1);o2.stop(t0+decay+0.1);own(o,[o2,h,vg,w]);};
    const bell=()=>{
      if(Math.random()<0.72){
        const m=M.bells[(Math.random()*M.bells.length)|0];pluck(mtof(m),M.bellG,2.8,0.7);
        if(Math.random()<0.4){const m2=M.bells[(Math.random()*M.bells.length)|0];
          later(rnd(0.3,0.7),()=>pluck(mtof(m2),M.bellG*0.75,2.4,0.8));}}
      later(rnd(M.bellEvery[0],M.bellEvery[1]),bell);};
    const burst=(freq,q,gain,dec,wet,sweep)=>{
      const s=ctx.createBufferSource();s.buffer=this.noise;const t0=ctx.currentTime+0.02;
      const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(freq,t0);
      if(sweep)f.frequency.exponentialRampToValueAtTime(sweep,t0+dec);
      const vg=ctx.createGain();vg.gain.setValueAtTime(0.0001,t0);vg.gain.exponentialRampToValueAtTime(gain,t0+0.02);
      vg.gain.exponentialRampToValueAtTime(0.0001,t0+dec);
      const w=ctx.createGain();w.gain.value=wet;
      s.connect(f);f.connect(vg);vg.connect(g);vg.connect(w);w.connect(this.verb);
      s.start(t0,Math.random()*1.5);s.stop(t0+dec+0.1);own(s,[f,vg,w]);};
    if(M.clank){const clank=()=>{burst(rnd(260,420),3,0.03,0.6,0.9);later(rnd(M.clank[0],M.clank[1]),clank);};later(rnd(3,7),clank);}
    if(M.creak){const creak=()=>{burst(rnd(260,340),6,0.014,1.1,0.6,rnd(150,200));later(rnd(M.creak[0],M.creak[1]),creak);};later(rnd(4,9),creak);}
    if(M.drip){const drip=()=>{const f=rnd(850,1200),t0=ctx.currentTime+0.02,o=ctx.createOscillator(),vg=ctx.createGain();
        o.type='sine';o.frequency.setValueAtTime(f,t0);o.frequency.exponentialRampToValueAtTime(f*0.7,t0+0.07);
        vg.gain.setValueAtTime(0.0001,t0);vg.gain.exponentialRampToValueAtTime(0.008,t0+0.005);
        vg.gain.exponentialRampToValueAtTime(0.0001,t0+0.09);
        const w=ctx.createGain();w.gain.value=1;o.connect(vg);vg.connect(w);w.connect(this.verb);
        o.start(t0);o.stop(t0+0.12);own(o,[vg,w]);later(rnd(M.drip[0],M.drip[1]),drip);};later(rnd(1,3),drip);}
    if(M.tick){let k=0;const tick=()=>{burst(k++%2?1050:1300,7,0.009,0.03,0.25);later(M.tick,tick);};later(0.5,tick);}
    pad();later(rnd(1.5,3.5),bell);
    try{g.gain.setTargetAtTime(1,this.t(),1.3);}catch(e){g.gain.value=1;}
  }
}
