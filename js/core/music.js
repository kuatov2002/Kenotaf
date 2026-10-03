"use strict";
/* ============================== МУЗЫКА: СЕКВЕНСОР ==============================
   Лейтмотив «КЕНОТАФ» — шесть нот: взлёт на квинту и сход по ступеням, к тонике не возвращается
   (вопрос без ответа). Ответная фраза приходит только в финале — в мажоре.
   Каждая зона играет тему своим инструментом, ладом и темпом; поверх — слой боя (пульс и ударные),
   у боссов — свои темы из того же мотива (обращение, увеличение, ритм). Часы одни на всю игру:
   смена зоны / боя / босса ждёт границы такта, звучащие ноты дотягиваются — музыка не обрывается
   на переходах, а перетекает. Всё — на нотах ступеней от тоники; лады подменяют терцию и сексту. */
const THEME={n:[0,3,7,5,3,2],d:[2,2,2,3,1,6]};        /* в шестнадцатых: ровно такт */
const ANSWER={n:[0,-2,0,3,2,0],d:[2,2,2,3,1,6]};
const MODES={minor:{3:3,8:8,10:10},dorian:{3:3,8:9,10:10},phrygian:{3:3,8:8,10:10,2:1},
  major:{3:4,8:9,10:11},lydian:{3:4,8:9,10:11,5:6}};
/* ступень мотива → полутона в ладу (мотив записан в натуральном миноре) */
function modal(n,mode){const M=MODES[mode]||{},o=Math.floor(n/12)*12,r=((n%12)+12)%12;return o+(M[r]!==undefined?M[r]:r);}
const STYLES={
  menu:   {root:45,mode:'minor',bpm:52,lead:'musicbox',oct:24,arp:null,bass:null,prog:[0,-4,-2,-5],motif:2,dens:0.15,g:0.8},
  sump:   {root:45,mode:'minor',bpm:56,lead:'pipe',oct:12,arp:'clank',bass:'bass',prog:[0,-4,-2,-5],motif:4,dens:0.3},
  hives:  {root:50,mode:'dorian',bpm:62,lead:'musicbox',oct:24,arp:'musicbox',bass:'bass',prog:[0,-4,-7,-2],motif:4,dens:0.35},
  eden:   {root:48,mode:'lydian',bpm:70,lead:'flute',oct:24,arp:'harp',bass:'bass',prog:[0,5,-3,2],motif:4,dens:0.45},
  seal:   {root:40,mode:'phrygian',bpm:72,lead:'bell',oct:24,arp:'tick',bass:'bass',prog:[0,1,0,-2],motif:4,dens:0.6},
  archive:{root:38,mode:'minor',bpm:44,lead:'organ',oct:12,arp:null,bass:'organbass',prog:[0,-2,-4,-5],motif:2,dens:0.1},
  surface:{root:48,mode:'major',bpm:64,lead:'strings',oct:24,arp:'harp',bass:'bass',prog:[0,-5,-3,5],motif:2,dens:0.35,answer:true},
  finale: {root:48,mode:'major',bpm:58,lead:'strings',oct:24,arp:'harp',bass:'bass',prog:[0,-3,5,-5],motif:2,dens:0.25,answer:true,swell:true},
  /* боссы: тема из мотива — у каждого свой приём и тембр; фазы добавляют слои */
  boss_overseer: {root:40,mode:'minor',bpm:100,lead:'brass',oct:12,bass:'sawbass',ost:'theme8',perc:'heavy',prog:[0,0,-4,-2],motif:2},
  boss_primarch: {root:43,mode:'minor',bpm:108,lead:'brass',oct:12,bass:'sawbass',ost:'invert',perc:'march',prog:[0,-2,-4,-5],motif:2,invert:true},
  boss_uprooter: {root:45,mode:'dorian',bpm:116,lead:'pipe',oct:24,bass:'sawbass',ost:'chug',perc:'tractor',prog:[0,-2,0,3],motif:2,steps:12},
  boss_regulator:{root:40,mode:'phrygian',bpm:120,lead:'bell',oct:24,bass:'bass',ost:'clock',perc:'clock',prog:[0,1,-2,0],motif:4,augment:true},
  boss_archivist:{root:38,mode:'minor',bpm:84,lead:'organ',oct:12,bass:'organbass',ost:'choir',perc:'toll',prog:[0,-4,-2,-5],motif:2},
  boss_mini:     {root:42,mode:'phrygian',bpm:104,lead:'brass',oct:12,bass:'sawbass',ost:'theme8',perc:'march',prog:[0,1,0,-2],motif:4}
};
class Music{
  constructor(A){this.A=A;const ctx=this.ctx=A.ctx;
    this.out=ctx.createGain();this.out.gain.value=0.9;this.out.connect(A.mus);
    this.wet=ctx.createGain();this.wet.gain.value=0.35;this.wet.connect(A.verb);this.out.connect(this.wet);
    /* слои: тема зоны, бой, босс — у каждого своя громкость, переходы плавные */
    this.L={};for(const k of ['zone','fight','boss'])
      {const g=ctx.createGain();g.gain.value=0.0001;g.connect(this.out);this.L[k]=g;}
    this.style=null;this.want='menu';this.phase=1;this.fight=0;this.fightT=0;this.step=0;this.bar=0;this.next=0;
    this.styleBars=0;this.mix={zone:0,fight:0,boss:0};}
  t(){return this.ctx.currentTime;}
  /* желаемое: стиль, интенсивность боя (0..1), фаза босса */
  set(want,fight,phase){this.want=want;this.fight=fight||0;this.phase=phase||1;}
  update(dt){const ctx=this.ctx;if(!ctx||ctx.state!=='running')return;
    if(!this.style){this.style=this.want;this.next=this.t()+0.08;}
    const ahead=this.t()+0.18;let n=0;
    while(this.next<ahead&&n++<64){const S=STYLES[this.style]||STYLES.menu,per=S.steps||16;
      if(this.step%per===0){
        /* граница такта: здесь и только здесь меняется стиль (тема не рвётся посреди фразы) */
        if(this.want!==this.style&&(this.bar%2===0||!(STYLES[this.style]||{}).motif||this.want.indexOf('boss')===0||this.style.indexOf('boss')===0)){
          this.style=this.want;this.bar=0;this.step=0;this.styleBars=0;}
        this.mixTo();}
      this.play(STYLES[this.style]||STYLES.menu,this.step,this.bar,this.next);
      const S2=STYLES[this.style]||STYLES.menu,per2=S2.steps||16;
      this.next+=60/S2.bpm/4;this.step++;if(this.step>=per2){this.step=0;this.bar++;this.styleBars++;}}
    if(this.next<this.t()-0.5)this.next=this.t()+0.05;   /* вкладка спала — не догонять */
  }
  mixTo(){const boss=this.style.indexOf('boss')===0,t=this.t(),S=STYLES[this.style]||{};
    const z=boss?0:(S.g||1),f=boss?0:clamp(this.fight,0,1),b=boss?1:0;
    const set=(k,v)=>{if(Math.abs(this.mix[k]-v)<0.01)return;this.mix[k]=v;this.L[k].gain.setTargetAtTime(Math.max(0.0001,v),t,0.9);};
    set('zone',z);set('fight',f*0.9);set('boss',b);}
  /* ---------- инструменты ---------- */
  env(g,t,a,d,peak,hold){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);
    if(hold)g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+(hold||0)+d);}
  osc(type,f,t,stop,dest,det){const o=this.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(det)o.detune.value=det;
    o.connect(dest);o.start(t);o.stop(stop);return o;}
  voice(ins,m,t,dur,vel,layer){const ctx=this.ctx,f=mtof(m),dest=this.L[layer||'zone'],g=ctx.createGain();vel=vel||1;
    const lp=(fr,q)=>{const b=ctx.createBiquadFilter();b.type='lowpass';b.frequency.value=fr;b.Q.value=q||0.5;b.connect(g);return b;};
    let end=t+dur+0.1;
    switch(ins){
      case 'pipe':{const l=lp(1100);this.osc('triangle',f,t,t+dur+1.2,l);this.osc('sine',f*2,t,t+dur+1.2,l);this.env(g,t,0.03,dur+0.9,0.045*vel);end=t+dur+1.3;break;}
      case 'musicbox':{this.osc('sine',f,t,t+1.6,g);const h=ctx.createGain();h.gain.value=0.16;h.connect(g);this.osc('sine',f*3.01,t,t+0.6,h);
        this.env(g,t,0.005,1.4,0.04*vel);end=t+1.7;break;}
      case 'flute':{const o=this.osc('sine',f,t,t+dur+0.6,g),v=ctx.createOscillator(),vg=ctx.createGain();v.frequency.value=5.2;vg.gain.value=f*0.004;
        v.connect(vg);vg.connect(o.frequency);v.start(t);v.stop(t+dur+0.6);this.env(g,t,0.09,dur*0.6+0.4,0.035*vel,dur*0.4);end=t+dur+0.7;break;}
      case 'harp':{this.osc('triangle',f,t,t+1.8,g);this.osc('sine',f*2,t,t+0.9,g);this.env(g,t,0.004,1.6,0.03*vel);end=t+1.9;break;}
      case 'bell':{for(const [k,a] of [[1,1],[2.76,0.35],[5.4,0.12]]){const h=ctx.createGain();h.gain.value=a;h.connect(g);this.osc('sine',f*k,t,t+2.8,h);}
        this.env(g,t,0.004,2.4,0.032*vel);end=t+2.9;break;}
      case 'organ':{for(const [k,a] of [[0.5,0.5],[1,1],[2,0.45],[3,0.2],[4,0.12]]){const h=ctx.createGain();h.gain.value=a;h.connect(g);this.osc('sine',f*k,t,t+dur+1,h);}
        this.env(g,t,0.18,0.9,0.02*vel,dur);end=t+dur+1.2;break;}
      case 'strings':{const l=lp(1500,0.4);this.osc('sawtooth',f,t,t+dur+1.6,l,-7);this.osc('sawtooth',f,t,t+dur+1.6,l,7);
        this.env(g,t,Math.min(0.6,dur*0.4),1.4,0.018*vel,dur*0.6);end=t+dur+1.7;break;}
      case 'brass':{const l=lp(900+700*vel,1);this.osc('sawtooth',f,t,t+dur+0.4,l);this.osc('sawtooth',f*1.003,t,t+dur+0.4,l);
        this.env(g,t,0.04,0.3,0.026*vel,dur*0.7);end=t+dur+0.5;break;}
      case 'bass':{const l=lp(420);this.osc('triangle',f,t,t+dur+0.5,l);this.osc('sine',f/2,t,t+dur+0.5,l);this.env(g,t,0.02,0.4,0.05*vel,dur*0.6);end=t+dur+0.6;break;}
      case 'organbass':{this.osc('sine',f/2,t,t+dur+1,g);this.osc('sine',f,t,t+dur+1,g);this.env(g,t,0.3,0.9,0.03*vel,dur);end=t+dur+1.3;break;}
      case 'sawbass':{const l=lp(260+340*vel,2);this.osc('sawtooth',f,t,t+dur+0.2,l);this.osc('sine',f/2,t,t+dur+0.2,g);this.env(g,t,0.008,0.18,0.05*vel,dur*0.5);end=t+dur+0.3;break;}
      case 'choir':{const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=900;bp.Q.value=1.2;bp.connect(g);
        this.osc('sawtooth',f,t,t+dur+1.5,bp,-9);this.osc('sawtooth',f,t,t+dur+1.5,bp,9);this.env(g,t,0.7,1.2,0.022*vel,dur*0.5);end=t+dur+1.6;break;}
      default:return;}
    g.connect(dest);setTimeout(()=>{try{g.disconnect();}catch(e){}},(end-this.t()+0.3)*1000);
  }
  hit(kind,t,vel,layer){const ctx=this.ctx,A=this.A,dest=this.L[layer||'fight'],g=ctx.createGain();vel=vel||1;g.connect(dest);
    const nz=(type,fr,q,d,pk)=>{const s=ctx.createBufferSource();s.buffer=A.noise;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=fr;f.Q.value=q;
      const e=ctx.createGain();s.connect(f);f.connect(e);e.connect(g);this.env(e,t,0.002,d,pk*vel);s.start(t,Math.random());s.stop(t+d+0.05);};
    switch(kind){
      case 'kick':{const o=ctx.createOscillator();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(38,t+0.22);
        const e=ctx.createGain();o.connect(e);e.connect(g);this.env(e,t,0.003,0.28,0.12*vel);o.start(t);o.stop(t+0.35);break;}
      case 'snare':nz('bandpass',1700,0.8,0.12,0.06);nz('highpass',4200,0.5,0.05,0.02);break;
      case 'hat':nz('highpass',7000,0.6,0.03,0.016);break;
      case 'tick':nz('bandpass',3200,6,0.025,0.03);break;
      case 'anvil':{for(const [k,a] of [[1,1],[2.4,0.5],[3.9,0.25]]){const o=ctx.createOscillator();o.frequency.value=620*k;const e=ctx.createGain();
        o.connect(e);e.connect(g);this.env(e,t,0.002,0.5,0.02*a*vel);o.start(t);o.stop(t+0.6);}nz('bandpass',2400,2,0.04,0.03);break;}
      case 'clank':nz('bandpass',300+Math.random()*120,3,0.4,0.03);break;
      case 'toll':{for(const [k,a] of [[1,1],[2.76,0.4],[5.4,0.15]]){const o=ctx.createOscillator();o.frequency.value=98*k;const e=ctx.createGain();
        o.connect(e);e.connect(g);this.env(e,t,0.004,3.5,0.06*a*vel);o.start(t);o.stop(t+3.6);}break;}}
    setTimeout(()=>{try{g.disconnect();}catch(e){}},(t-this.t()+4)*1000);
  }
  /* ---------- аранжировка: что звучит на шаге step такта bar ---------- */
  play(S,step,bar,t){
    const per=S.steps||16,sd=60/S.bpm/4,ch=S.prog[bar%S.prog.length],R=S.root+ch,boss=this.style.indexOf('boss')===0;
    const layer=boss?'boss':'zone',ph=this.phase;
    /* бас: раз в такт (зона) или остинато (босс / бой) */
    if(S.bass&&!boss&&step===0)this.voice(S.bass,R,t,sd*per*0.9,0.8,'zone');
    /* лейтмотив: раз в motif тактов, двухтактная фраза (вторая — ответ, если положено) */
    const mbar=bar%(S.motif*2||8),phrase=S.answer&&Math.floor(bar/(S.motif||4))%2===1?ANSWER:THEME;
    if(S.lead&&(mbar===0||(S.augment&&mbar===1))){let pos=0;const aug=S.augment?2:1,off=mbar===1?16:0;
      for(let i=0;i<phrase.n.length;i++){const st=pos*aug-off;pos+=phrase.d[i];
        if(st<0||st>=16)continue;
        if((per===16?st:Math.round(st*per/16))===step){let nn=phrase.n[i];if(S.invert)nn=-nn;
          const vel=S.swell?clamp(0.5+this.styleBars*0.06,0.5,1.2):1;
          this.voice(S.lead,S.root+S.oct+modal(nn,S.mode),t,sd*phrase.d[i]*aug*0.95,vel,layer);
          if(S.swell&&this.styleBars>8)this.voice('organ',S.root+12+modal(nn,S.mode),t,sd*phrase.d[i]*0.95,0.6,layer);}}}
    /* перебор: аккордовые ступени, редко, с плотностью стиля */
    if(S.arp&&!boss&&step%2===0&&mbar!==0&&Math.random()<(S.dens||0.3)*(step%4===0?1:0.5)){
      const deg=[0,3,7,12,7,10][((step/2)|0)%6];
      if(S.arp==='clank')this.hit('clank',t,0.6,'zone');
      else if(S.arp==='tick')this.hit('tick',t,0.8,'zone');
      else this.voice(S.arp,R+12+modal(deg,S.mode),t,sd*2,0.6,'zone');}
    if(S.arp==='tick'&&!boss&&step%4===0)this.hit('tick',t,0.5,'zone');
    if(S.swell&&step===0&&this.styleBars>4)this.voice('strings',R+12,t,sd*per,0.5,layer);
    /* слой боя: пульс восьмыми на басу, бочка-малый, тиканье — поверх темы зоны */
    if(!boss&&this.mix.fight>0.02){
      if(step%2===0)this.voice('sawbass',R-12,t,sd*1.6,0.55+(step%8===0?0.3:0),'fight');
      if(step===0||step===8)this.hit('kick',t,0.9);if(step===4||step===12)this.hit('snare',t,0.7);
      if(step%2===1)this.hit('hat',t,0.6);}
    if(!boss)return;
    /* --- босс: остинато и ударные по характеру, фазы добавляют слои --- */
    const B=n=>S.root+modal(n,S.mode);
    if(S.ost==='theme8'&&step%2===0){const n=THEME.n[((step/2)|0)%THEME.n.length];this.voice(S.bass,B(n)-12+ch,t,sd*1.8,0.8,'boss');}
    if(S.ost==='invert'&&step%2===0){const n=-THEME.n[((step/2)|0)%THEME.n.length];this.voice(S.bass,B(n)-12+ch,t,sd*1.8,0.8,'boss');}
    if(S.ost==='chug'&&step%3!==1)this.voice(S.bass,R-12+(step%6===0?0:7),t,sd*1.2,step%6===0?1:0.6,'boss');
    if(S.ost==='clock'){if(step%2===0)this.hit('tick',t,step%4===0?1:0.6,'boss');if(step%4===0)this.voice(S.bass,R-12+(step%8?7:0),t,sd*3,0.8,'boss');}
    if(S.ost==='choir'&&step===0)this.voice('choir',R+12,t,sd*per*0.95,0.8,'boss'),this.voice(S.bass,R,t,sd*per*0.95,0.9,'boss');
    if(S.perc==='heavy'){if(step===0||step===6||step===8||step===14)this.hit('kick',t,1,'boss');if(step===4||step===12)this.hit('anvil',t,0.8,'boss');}
    if(S.perc==='march'){if(step%4===0)this.hit('kick',t,0.9,'boss');if(step%4===2||(ph>=2&&step%2===1))this.hit('snare',t,step%4===2?0.8:0.35,'boss');}
    if(S.perc==='tractor'){if(step%6===0)this.hit('kick',t,1,'boss');if(step%3===2)this.hit('snare',t,0.5,'boss');if(step%2===1)this.hit('hat',t,0.5,'boss');}
    if(S.perc==='clock'&&step===0)this.hit('anvil',t,0.9,'boss');
    if(S.perc==='toll'&&step===0&&bar%2===0)this.hit('toll',t,0.9,'boss');
    /* фаза II: удвоение ударных; фаза III: мотив октавой выше поверх всего */
    if(ph>=2&&step%4===2)this.hit('kick',t,0.6,'boss');
    if(ph>=2&&step%2===1)this.hit('hat',t,0.5,'boss');
    if(ph>=3&&mbar===1){let pos=0;for(let i=0;i<THEME.n.length;i++){if(pos===step)this.voice(S.lead,S.root+S.oct+12+modal(S.invert?-THEME.n[i]:THEME.n[i],S.mode),t,sd*THEME.d[i],0.9,'boss');pos+=THEME.d[i];}}
  }
}
