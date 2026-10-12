import { chromium } from 'playwright';
const pv = 'preview_theme_id=195111911690';
const b = await chromium.launch();
const pages = (process.env.PAGES||'/products/couverture-lestee-7-11-15kg-grandes-dimensions').split(',');
for (const [i,u] of pages.entries()) for (const [tag, w, h] of [['d',1440,1100],['m',390,844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale:'fr-FR' });
  const p = await ctx.newPage();
  await p.goto(`https://comptoir-sante-beaute.com${u}?${pv}`, { waitUntil: 'networkidle' }).catch(()=>{});
  await p.addStyleTag({content:'#preview-bar-iframe,iframe[id*=preview]{display:none!important}'}).catch(()=>{});
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `tests/shot-${i}-${tag}-top.png` });
  const y = await p.evaluate(()=>{const e=document.querySelector('.lc4p-acc');return e?e.getBoundingClientRect().top+scrollY-120:0;});
  await p.evaluate(y=>window.scrollTo(0,y),y); await p.waitForTimeout(600);
  await p.screenshot({ path: `tests/shot-${i}-${tag}-desc.png` });
  await ctx.close();
}
await b.close();
