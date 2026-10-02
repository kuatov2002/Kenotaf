"use strict";
/* ============================== НАСТРОЙКИ · УПРАВЛЕНИЕ · ЗАПИСИ ============================== */
/* Экран настроек открывается из главного меню и из паузы. Каждая строка — кнопка: ←/→ меняют
   значение, ENTER — следующее значение, клик по ◂ / ▸ — то же мышью. */
class SettingsUI{
  constructor(game){this.game=game;this.el=document.getElementById('settings');this.from=null;
    document.getElementById('btnSetBack').onclick=()=>this.close();
    document.addEventListener('fullscreenchange',()=>{const fs=!!document.fullscreenElement;
      if(Settings.get('fullscreen')!==fs){Settings.set('fullscreen',fs);this.build();}});}
  rows(){return [
    {k:'master',name:'ГРОМКОСТЬ · ОБЩАЯ',vol:true},
    {k:'music',name:'ГРОМКОСТЬ · МУЗЫКА',vol:true},
    {k:'sfx',name:'ГРОМКОСТЬ · ЗВУКИ',vol:true},
    {k:'shake',name:'ТРЯСКА ЭКРАНА',opts:[['off','ВЫКЛ'],['weak','СЛАБАЯ'],['normal','ОБЫЧНАЯ']]},
    {k:'difficulty',name:'СЛОЖНОСТЬ',opts:[['easy','ЛЕГКО'],['normal','НОРМАЛЬНО'],['hard','СЛОЖНО']],
      note:{easy:'МЕХАНИЗМЫ СЛАБЕЕ, ЗАМАХИ ДОЛЬШЕ, КАСАНИЕ НЕ РАНИТ',normal:'КАК ЗАДУМАНО',hard:'МЕХАНИЗМЫ КРЕПЧЕ И БЫСТРЕЕ, УДАР СНИМАЕТ ДВЕ ЯЧЕЙКИ'}},
    {k:'subs',name:'СУБТИТРЫ ЗАПИСЕЙ',opts:[[true,'ВКЛ'],[false,'ВЫКЛ']]},
    {k:'res',name:'РАЗРЕШЕНИЕ',opts:RES_OPTS.map(r=>[r.k,r.name])},
    {k:'fullscreen',name:'ПОЛНЫЙ ЭКРАН',opts:[[false,'ВЫКЛ'],[true,'ВКЛ']]}];}
  val(r){if(r.vol)return Math.round(this.game.audio.vol[r.k]*100)+'%';
    const v=Settings.get(r.k),o=r.opts.find(q=>q[0]===v);return o?o[1]:String(v);}
  build(){
    const box=document.getElementById('setList');box.innerHTML='';
    for(const r of this.rows()){
      const b=document.createElement('div');b.className='btn opt';b.dataset.opt=r.k;
      b.innerHTML='<span class="on">'+r.name+'</span><span class="ov"><i data-d="-1">◂</i><b>'+this.val(r)+'</b><i data-d="1">▸</i></span>'+
        (r.note?'<span class="onote">'+(r.note[Settings.get(r.k)]||'')+'</span>':'');
      b.onclick=e=>{const d=e.target&&e.target.dataset&&e.target.dataset.d;this.change(r.k,d?+d:1);};
      box.appendChild(b);}
  }
  change(k,dir){
    const g=this.game,r=this.rows().find(q=>q.k===k);if(!r)return;
    if(r.vol){g.audio.init();g.audio.setVol(k,clamp(Math.round((g.audio.vol[k]+dir*0.05)*20)/20,0,1));}
    else{const i=r.opts.findIndex(q=>q[0]===Settings.get(k)),n=r.opts.length,v=r.opts[((i<0?0:i)+dir+n)%n][0];
      Settings.set(k,v);this.apply(k,v);}
    const el=document.querySelector('#setList [data-opt="'+k+'"]');
    if(el){el.querySelector('.ov b').textContent=this.val(r);const nt=el.querySelector('.onote');if(nt&&r.note)nt.textContent=r.note[Settings.get(k)]||'';}
  }
  apply(k,v){
    const g=this.game;
    if(k==='shake'&&v!=='off'){g.camera.addShake(1.2);}
    if(k==='res')g.resize();
    if(k==='fullscreen'){try{
      if(v&&!document.fullscreenElement){const p=document.documentElement.requestFullscreen();if(p&&p.catch)p.catch(()=>{Settings.set('fullscreen',false);this.build();});}
      else if(!v&&document.fullscreenElement)document.exitFullscreen();}catch(e){}}
  }
  open(from){this.from=from;this.build();this.el.classList.remove('hidden');
    document.getElementById(from).classList.add('hidden');}
  close(){this.el.classList.add('hidden');if(this.from)document.getElementById(this.from).classList.remove('hidden');this.from=null;}
}
/* ---------- экран управления: собирается из таблицы (новые модули появляются по мере получения) ---------- */
const CONTROLS=[
  ['A / D · ← →','ДВИЖЕНИЕ'],
  ['SPACE','ПРЫЖОК · ДЕРЖАТЬ — ВЫШЕ'],
  ['S / ↓','ПРИСЕД · НА БЕГУ — ПОДКАТ · В ВОЗДУХЕ С УДАРОМ — УДАР ВНИЗ С ОТСКОКОМ'],
  ['W / ↑','ВЗГЛЯД ВВЕРХ · С УДАРОМ — УДАР ВВЕРХ'],
  ['J / X / ЛКМ','УДАР КЛЮЧОМ · ДЕРЖАТЬ ПОСЛЕ ВЗМАХА — ТЯЖЁЛЫЙ УДАР'],
  ['K / C / ПКМ','ИМПУЛЬС РЕЗАКА · БЕЗ УРОНА · В МИГ, КОГДА КОЛЬЦО СОМКНУЛОСЬ НА ДЕТАЛИ, — СРЫВАЕТ АТАКУ',null,'pulse'],
  ['L / SHIFT / Z','РЫВОК · НЕУЯЗВИМ, СКВОЗЬ МЕХАНИЗМЫ · ОСТАВЛЯЕТ СЛЕД НА ТРЕСНУВШЕЙ ДЕТАЛИ: СЛЕДУЮЩИЙ УДАР ЕЁ ЛОМАЕТ',null,'dash'],
  ['U / V','ГАРПУН · К ЛАТУННОМУ РЫМУ В ПРЕДЕЛАХ ТРОСА',null,'hook'],
  ['Q / I (ДЕРЖАТЬ)','ЗАЛАТАТЬ КУРТКУ · ТРАТИТ РЕМОНТ, КОТОРЫЙ КОПИТСЯ УДАРАМИ'],
  ['E / F','ДВЕРИ · РЫЧАГИ · ЦИЛИНДРЫ · У ФОНАРЯ — ПОДКАЧАТЬ КУРТКУ И СОХРАНИТЬСЯ'],
  ['ESC','ПАУЗА · КАРТА · ЗАПИСИ'],
  ['M','ЗВУК ВКЛ / ВЫКЛ'],
  ['ГЕЙМПАД','A ПРЫЖОК · X УДАР · B ИМПУЛЬС · Y ДЕЙСТВИЕ · RB РЫВОК · RT ГАРПУН · LB / LT (ДЕРЖАТЬ) ЗАЛАТАТЬ · START ПАУЗА']
];
function buildControls(gs){
  const box=document.getElementById('ctrlGrid');if(!box)return;let h='';
  for(const r of CONTROLS){if(r[3]&&gs&&!gs.has(r[3])&&!(gs.abilities&&Object.keys(gs.abilities).length>3))continue;
    h+='<b>'+r[0]+'</b><i>'+r[1]+'</i>';}
  box.innerHTML=h;
}
/* ---------- записи: собранные цилиндры (фонограммы) ---------- */
class ArchiveUI{
  constructor(game){this.game=game;this.el=document.getElementById('archive');this.sel=0;
    document.getElementById('btnArchBack').onclick=()=>this.close();}
  open(){const gs=this.game.gs,ids=Object.keys(LORE).map(Number).sort((a,b)=>a-b);
    const list=document.getElementById('archList');list.innerHTML='';this.ids=[];
    for(const id of ids){const has=!!gs.loreIds[id];
      const b=document.createElement('div');b.className='btn arc'+(has?'':' dim');b.dataset.arch=String(this.ids.length);
      b.textContent=has?('№'+id+' · '+LORE[id].title):('№'+id+' · · ·');
      b.onclick=()=>this.show(+b.dataset.arch);
      if(has)this.ids.push(id);list.appendChild(b);}
    document.getElementById('archInfo').textContent='ЦИЛИНДРЫ · '+(gs.lore||0)+' / '+ids.length;
    this.el.classList.remove('hidden');document.getElementById('pause').classList.add('hidden');
    this.show(0);}
  show(i){const id=this.ids&&this.ids[i],t=document.getElementById('archText');
    if(id===undefined){t.innerHTML='<p class="em">ЦИЛИНДРОВ ПОКА НЕТ. ИЩИ ЛАТУННЫЕ ФОНОГРАММЫ С ГОЛУБЫМ СВЕЧЕНИЕМ.</p>';return;}
    const L=LORE[id];t.innerHTML='<div class="at">№'+id+' · '+L.title+'</div><p>'+L.text+'</p>'+(L.where?'<div class="aw">'+L.where+'</div>':'');}
  close(){this.el.classList.add('hidden');document.getElementById('pause').classList.remove('hidden');}
}
