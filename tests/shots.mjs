import { chromium } from 'playwright';
import fs from 'fs';
const pv = 'preview_theme_id=195111911690';
const urls = fs.readFileSync('tests/urls.txt','utf8').trim().split('\n');
const b = await chromium.launch();
for (const [i, line] of urls.entries()) {
  const [u, w] = line.split(' ');
  const ctx = await b.newContext({ viewport: { width: +(w||1280), height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(`https://comptoir-sante-beaute.com${u}${u.includes('?')?'&':'?'}${pv}`, { waitUntil: 'networkidle' }).catch(()=>{});
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}window.scrollTo(0,0);});
  await p.addStyleTag({content:'#preview-bar-iframe,iframe[id*=preview]{display:none!important}'}).catch(()=>{});
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `tests/shot-${i}.png`, fullPage: false });
  await p.evaluate(()=>window.scrollTo(0,700)); await p.waitForTimeout(800);
  await p.screenshot({ path: `tests/shot-${i}b.png` });
  await ctx.close();
}
await b.close();
