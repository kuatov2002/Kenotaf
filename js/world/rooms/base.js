"use strict";
/* ============================== ROOMS ============================== */
const S=(x,y,w,h,mat,o)=>Object.assign({x:x,y:y,w:w,h:h,mat:mat||'rust'},o||{});
const P=(x,y,w,h,mat)=>({x:x,y:y,w:w,h:h||0.4,ow:true,mat:mat||'grate'});
const lit=(x,y,r,col,i,o)=>Object.assign({x:x,y:y,r:r,col:col||'#ffbe63',i:i===undefined?1:i,seed:Math.random()*9},o||{});

/* ROOMDEFS заполняется файлами js/world/rooms/z*.js (по зоне на файл) */
const ROOMDEFS={};
