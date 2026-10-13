import { chromium } from 'playwright';
import fs from 'fs';
const pv = 'preview_theme_id=195111911690';
const b = await chromium.launch();
const pages = (process.env.PAGES || '/products/couverture-lestee-7-11-15kg-grandes-dimensions,/products/scandi-lampe-led-macaron').split(',');
const info = {};
for (const vp of [{ n: 'm', w: 390, h: 844 }, { n: 'd', w: 1440, h: 900 }]) {
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, locale: 'fr-FR', isMobile: vp.n === 'm', hasTouch: vp.n === 'm', deviceScaleFactor: vp.n === 'm' ? 2 : 1 });
  const p = await ctx.newPage();
  for (const [i, path] of pages.entries()) {
    await p.goto(`https://comptoir-sante-beaute.com${path}${path.includes('?') ? '&' : '?'}${pv}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await p.addStyleTag({ content: '#preview-bar-iframe,iframe[id*=preview]{display:none!important}' }).catch(() => {});
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `tests/x-${vp.n}-${i}-a.png` });
    for (const y of [800, 1700, 2600]) {
      await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(900);
      await p.screenshot({ path: `tests/x-${vp.n}-${i}-${y}.png` });
    }
    info[`${vp.n}-${i}`] = await p.evaluate(() => ({ h: document.body.scrollHeight, sticky: !!document.querySelector('.lc4p-sticky'), stickyVis: (() => { const s = document.querySelector('.lc4p-sticky'); return s ? getComputedStyle(s).transform + ' ' + s.className : null; })() }));
  }
  await ctx.close();
}
fs.writeFileSync('tests/info.json', JSON.stringify(info, null, 1));
await b.close();
