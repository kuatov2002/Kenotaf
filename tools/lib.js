/* Общие утилиты dev-инструментов: статический сервер без зависимостей + headless Chromium (Playwright).
   Запуск из корня репозитория: node tools/<скрипт>.js  (нужен playwright: npm i -g playwright) */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');

function loadPlaywright(){
  const tries=['playwright','/opt/node22/lib/node_modules/playwright'];
  for(const t of tries){try{return require(t);}catch(e){}}
  throw new Error('playwright не найден: npm i -g playwright');
}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.png':'image/png','.json':'application/json'};
function serve(){
  return new Promise(res=>{
    const srv=http.createServer((req,rsp)=>{
      let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
      const f=path.join(ROOT,p);
      if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rsp.writeHead(404);rsp.end();return;}
      rsp.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
      fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0,'127.0.0.1',()=>res({srv,url:'http://127.0.0.1:'+srv.address().port+'/index.html'}));
  });
}
async function launch(opts={}){
  const {chromium}=loadPlaywright();
  const exe=['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p=>fs.existsSync(p));
  const b=await chromium.launch(Object.assign({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']},
    exe?{executablePath:exe}:{}));
  const ctx=await b.newContext({viewport:{width:opts.w||1280,height:opts.h||720},ignoreHTTPSErrors:true});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
  return {browser:b,page,errors};
}
/* открыть игру и дождаться готовности (game создан, шрифты загружены или таймаут) */
async function openGame(page,url){
  await page.goto(url);
  await page.waitForFunction(()=>typeof game!=='undefined'&&game&&game.world,null,{timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(300);
}
module.exports={ROOT,serve,launch,openGame};
