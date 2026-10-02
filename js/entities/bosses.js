"use strict";
/* ============================== BOSSES ============================== */
/* Каждый босс уязвим только в «окне», которое читается без текста:
   Архивариус — отражённые импульсом осколки. Надсмотрщик и Примарх — механизмы с узлами
   (js/entities/mechs/overseer.js, primarch.js). */
class Boss extends Enemy{
  constructor(world,def,x,y){super(world,def,x,y);this.phase=1;this.activated=false;this.armorSay=-9;
    this.phaseAt=def.phaseAt||[];this.state='idle';this.st=0;this.cd=1.4;this.quietT=0;this.nudged={};}
  /* одна короткая фраза, если 40 с боя прошли без единого настоящего попадания */
  nudge(){return '';}
  armor(){return 1;}
  armorMsg(){return 'БРОНЯ ДЕРЖИТ.';}
  setState(s){this.state=s;this.st=0;}
  /* raw — урон от окружения (груз, отражённый осколок), мимо брони */
  hurt(dmg,kx,ky,raw){
    if(this.dead)return;
    const a=raw?1:this.armor(),g=this.world.game;
    if(raw)this.quietT=0;
    if(a<0.5){
      this.hp-=dmg*a;this.flash=0.05;g.audio.hitMetal();g.hitstop(0.03);
      const p=this.world.player;
      g.particles.burst(clamp(p.cx,this.x,this.x+this.w),this.cy,10,{kind:'spark',col:'#ffe6a3',spd:6,life:0.35,size:0.05,add:true,g:12});
      if(this.hp<=0)this.die();
      return;}
    this.quietT=0;
    super.hurt(dmg*a,kx*0.06,ky*0.02);
  }
  die(){
    if(this.dead)return;
    super.die();
    const g=this.world.game;
    g.audio.explosion();g.camera.addShake(1.8);g.hitstop(0.3);g.flash(0.5);
    g.particles.burst(this.cx,this.cy,60,{kind:'debris',col:'#5c4a38',spd:12,life:1.8,size:0.24,g:28});
    g.particles.burst(this.cx,this.cy,40,{kind:'spark',col:'#ffb45a',spd:14,life:1,size:0.09,add:true,g:18});
    g.particles.burst(this.cx,this.cy,24,{kind:'smoke',col:'#2a2622',spd:3,life:3,size:1.2,grow:1.4,drag:1.1});
    g.hud.bossOff();
    g.hud.say(this.name+' · ОСТАНОВЛЕН.','');
  }
  update(dt){
    super.update(dt);
    if(this.dead)return;
    if(this.activated){this.quietT+=dt;
      if(this.quietT>40&&!this.nudged[this.phase]){const m=this.nudge();this.nudged[this.phase]=1;if(m)this.world.game.hud.say(m,'');}}
    this.world.game.hud.boss(this.name,this.hp/this.maxHp);
    let ph=1;for(const f of this.phaseAt)if(this.hp/this.maxHp<=f+1e-6)ph++;
    while(this.phase<ph){this.phase++;this.onPhase(this.phase);}
  }
  onPhase(n){}
}
