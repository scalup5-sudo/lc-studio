import { chromium } from 'playwright';
const pv = 'preview_theme_id=195111911690';
const b = await chromium.launch();
for (const [tag, w, h] of [['d',1440,900],['m',390,844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale:'fr-FR' });
  const p = await ctx.newPage();
  await p.goto(`https://comptoir-sante-beaute.com/?${pv}`, { waitUntil: 'networkidle' }).catch(()=>{});
  await p.addStyleTag({content:'#preview-bar-iframe,iframe[id*=preview]{display:none!important}'}).catch(()=>{});
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));}window.scrollTo(0,0);});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `tests/shot-${tag}-hero.png` });
  const top = await p.evaluate(()=>{const s=document.querySelector('[data-lc-th]');return s? s.getBoundingClientRect().top+scrollY : -1;});
  const hgt = await p.evaluate(()=>{const s=document.querySelector('[data-lc-th]');return s? s.offsetHeight-innerHeight : 0;});
  for (const f of [0, .3, .55, .8, 1]) {
    await p.evaluate(y=>window.scrollTo(0,y), Math.round(top + f*hgt)); await p.waitForTimeout(900);
    await p.screenshot({ path: `tests/shot-${tag}-th${Math.round(f*100)}.png` });
  }
  await ctx.close();
}
await b.close();
