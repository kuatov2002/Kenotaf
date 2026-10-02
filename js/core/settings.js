"use strict";
/* ============================== SETTINGS ==============================
   Настройки игрока: тряска, сложность, субтитры записей, разрешение, полноэкранный режим.
   Громкость хранит AudioSystem (kenotaf_audio). Всё — в localStorage, отдельно от сохранения. */
const SHAKE={
  /* cap — потолок амплитуды в экранных пикселях, k — пикселей на единицу «силы» события,
     dur — длительность толчка; события слабее floor пикселя не трясут вовсе */
  off:{cap:0,k:0,dur:0,floor:99},
  weak:{cap:2,k:1.8,dur:0.08,floor:0.6},
  normal:{cap:3,k:2.6,dur:0.1,floor:0.5}
};
/* сложность: здоровье и сила механизмов, урон по курьеру */
const DIFFICULTY={
  easy:{name:'ЛЕГКО',hp:0.72,node:0.75,dmgTaken:1,windup:1.18,contact:false},
  normal:{name:'НОРМАЛЬНО',hp:1,node:1,dmgTaken:1,windup:1,contact:true},
  hard:{name:'СЛОЖНО',hp:1.3,node:1.25,dmgTaken:2,windup:0.9,contact:true}
};
const Settings={
  KEY:'kenotaf_settings_v1',
  d:{shake:'weak',difficulty:'normal',subs:true,res:'auto',fullscreen:false},
  load(){try{const v=JSON.parse(localStorage.getItem(this.KEY)||'null');
    if(v)for(const k in this.d)if(v[k]!==undefined&&typeof v[k]===typeof this.d[k])this.d[k]=v[k];}catch(e){}
    if(!SHAKE[this.d.shake])this.d.shake='weak';if(!DIFFICULTY[this.d.difficulty])this.d.difficulty='normal';
    if(!RES_OPTS.some(r=>r.k===this.d.res))this.d.res='auto';},
  save(){try{localStorage.setItem(this.KEY,JSON.stringify(this.d));}catch(e){}},
  get(k){return this.d[k];},
  set(k,v){this.d[k]=v;this.save();},
  shake(){return SHAKE[this.d.shake]||SHAKE.weak;},
  diff(){return DIFFICULTY[this.d.difficulty]||DIFFICULTY.normal;}
};
/* внутреннее разрешение холста (высота в пикселях); auto — по окну, но не выше 1080 */
const RES_OPTS=[{k:'auto',name:'АВТО'},{k:'720',name:'1280×720',h:720},{k:'900',name:'1600×900',h:900},{k:'1080',name:'1920×1080',h:1080}];
Settings.load();
