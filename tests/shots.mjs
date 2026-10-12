import { chromium } from 'playwright';
import fs from 'fs';
const pv = 'preview_theme_id=195111911690';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, locale:'fr-FR' });
const p = await ctx.newPage(); const info={};
for (const [i,h] of ['theiere-verre-900ml-infuseur-magnetique','ventilateur-colonne-oscillant-silencieux'].entries()){
await p.goto(`https://comptoir-sante-beaute.com/products/${h}?${pv}`, { waitUntil: 'networkidle' }).catch(()=>{});
await p.addStyleTag({content:'#preview-bar-iframe,iframe[id*=preview]{display:none!important}'}).catch(()=>{});
await p.waitForTimeout(3000);
await p.screenshot({ path: `tests/shot-p${i}-top.png` });
info[h]=await p.evaluate(()=>{const a=document.querySelector('#lc4p-avis');const r=a.getBoundingClientRect();return {h:r.height,text:a.innerText.slice(0,500),summary:(document.querySelector('.grc-product-summary')||{}).innerText}});
await p.evaluate(()=>{const e=document.querySelector('#lc4p-avis');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-130);}); await p.waitForTimeout(1500);
await p.screenshot({ path: `tests/shot-p${i}-avis.png` });
}
fs.writeFileSync('tests/info.json', JSON.stringify(info,null,1));
await b.close();
