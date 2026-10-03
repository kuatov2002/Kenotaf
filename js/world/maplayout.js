"use strict";
/* ============================== MAP LAYOUT ============================== */
/* Положение каждой комнаты на схеме мира (левый верхний угол, метры). Размеры — из самих комнат.
   Аркология читается как подъём: Отстойник внизу слева → Соты → Эдем → Печать вверху справа.
   Схема, а не точная геометрия: двери соединяются линиями, комнаты не обязаны касаться. */
const MAPLAYOUT={
  /* ЗОНА I · ОТСТОЙНИК */
  z1_vent:[84,389],z1_start:[54,426],z1_hub:[101,397],z1_cellar:[101,441],z1_drain:[123,443],
  z1_sluice:[141,397],z1_gallery:[-3,426],z1_charge:[-73,426],z1_quiet:[281,420],z1_pipes:[312,384],z1_boiler:[115,370],z1_foundry:[170,356],z1_canal:[168,463],z1_shrine:[216,486],z1_cache:[196,343],z1_east:[140,423],z1_arena:[181,420],z1_safe:[216,424],z1_boss:[242,419],
  /* ЗОНА II · ЖИЛЫЕ СОТЫ */
  z2_escalator:[192,389],z2_atrium:[238,330],z2_apartment:[235,308],z2_stairwell:[277,346],
  z2_turbine:[300,352],z2_boss:[357,384],z2_post:[183,297],z2_overgrown:[196,326],z2_market:[116,300],z2_school:[60,280],z2_laundry:[150,270],z2_roofs:[295,293],z2_chapel:[250,250],z2_censor:[357,340],z2_quiet:[392,367],z2_printing:[130,325],z2_nursery:[40,262],z2_vault:[412,326],
  /* ЗОНА III · САДЫ ЭДЕМА */
  z3_airlock:[389,280],z3_greenhouse:[424,261],z3_collector:[479,277],z3_dome:[488,240],z3_intake:[395,212],z3_orchard:[361,249],z3_apiary:[312,262],z3_roots:[362,297],z3_canal:[423,299],z3_herbarium:[493,302],z3_sunhall:[543,282],z3_shed:[598,290],z3_boss:[633,278],z3_quiet:[692,290],z3_vineyard:[461,212],z3_seedvault:[372,323],z3_hive:[300,244],
  /* ЗОНА IV · ПЕЧАТЬ */
  z4_antechamber:[543,196],z4_exam_a:[543,180],z4_exam_b:[592,159],z4_exam_c:[590,199],z4_gearworks:[640,185],z4_pendulum:[703,163],z4_escapement:[731,206],z4_clocktower:[790,150],z4_boss:[820,131],z4_quiet:[872,140],z4_gate:[900,108],z4_pressure:[642,213],z4_vault:[686,232],z4_bellows:[670,137],z4_counter:[740,166],z4_bell:[818,111],
  z5_hall:[944,96],z5_busts:[994,100],z5_stacks:[1058,74],z5_reading:[1092,62],z5_council:[1150,56],z5_crypt:[1200,64],z5_lift:[1254,34],z5_boss:[1280,10],z5_broadcast:[944,60],z5_private:[1066,44],
  /* ИСПЫТАТЕЛЬНЫЕ СТЕНДЫ */
  z1_trial:[54,366],z2_trial:[187,243],z3_trial:[488,205],z4_trial:[615,128],z5_trial:[983,58],
  /* СНАРУЖИ */
  z5_surface:[1290,-30]
};
/* тайники: на скопированной схеме зоны их нет, пока курьер сам туда не войдёт (у двери — обрубок с «?») */
const MAPSECRET={z1_drain:1,z2_overgrown:1,z3_intake:1,z1_shrine:1,z1_cache:1,z2_printing:1,z2_nursery:1,z2_vault:1,z3_seedvault:1,z3_hive:1,z4_vault:1,z4_bell:1,z5_private:1};
/* цвет заливки комнаты на схеме по зоне */
const MAPTINT={sump:'#5a4636',hives:'#5c3a34',eden:'#6f7a46',seal:'#4e5868',archive:'#5a4a36',surface:'#6f8ea6'};
