/* Упаковка для itch.io: dist/kenotaf-itch.zip, index.html в корне архива, рядом css/ и js/.
   Без зависимостей (zlib из Node). Загрузить на itch: Kind of project — HTML,
   файл отметить «This file will be played in the browser».
     node tools/pack.js */
'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const ROOT=path.resolve(__dirname,'..');
const INCLUDE=['index.html','css','js'];
const OUT=path.join(ROOT,'dist','kenotaf-itch.zip');

function walk(rel,out){
  const abs=path.join(ROOT,rel),st=fs.statSync(abs);
  if(st.isDirectory()){for(const f of fs.readdirSync(abs).sort())walk(path.join(rel,f),out);}
  else out.push(rel);
}
const CRC=(()=>{const t=new Uint32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function dos(d){return {time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),
  date:((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};}

const files=[];for(const r of INCLUDE)walk(r,files);
const locals=[],central=[];let off=0;
for(const rel of files){
  const name=Buffer.from(rel.split(path.sep).join('/'),'utf8');
  const raw=fs.readFileSync(path.join(ROOT,rel)),def=zlib.deflateRawSync(raw,{level:9});
  const crc=crc32(raw),{time,date}=dos(fs.statSync(path.join(ROOT,rel)).mtime);
  const lh=Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);lh.writeUInt16LE(0x0800,6);lh.writeUInt16LE(8,8);
  lh.writeUInt16LE(time,10);lh.writeUInt16LE(date,12);lh.writeUInt32LE(crc,14);
  lh.writeUInt32LE(def.length,18);lh.writeUInt32LE(raw.length,22);lh.writeUInt16LE(name.length,26);lh.writeUInt16LE(0,28);
  locals.push(lh,name,def);
  const ch=Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE(20,4);ch.writeUInt16LE(20,6);ch.writeUInt16LE(0x0800,8);ch.writeUInt16LE(8,10);
  ch.writeUInt16LE(time,12);ch.writeUInt16LE(date,14);ch.writeUInt32LE(crc,16);ch.writeUInt32LE(def.length,20);
  ch.writeUInt32LE(raw.length,24);ch.writeUInt16LE(name.length,28);ch.writeUInt32LE(off,42);
  central.push(ch,name);
  off+=30+name.length+def.length;
}
const cd=Buffer.concat(central),end=Buffer.alloc(22);
end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);
end.writeUInt32LE(cd.length,12);end.writeUInt32LE(off,16);
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,Buffer.concat([...locals,cd,end]));
console.log('dist/kenotaf-itch.zip · файлов: '+files.length+' · '+(fs.statSync(OUT).size/1024).toFixed(1)+' КБ');
