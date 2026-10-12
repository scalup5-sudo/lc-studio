import { chromium } from 'playwright';
import fs from 'fs';
const pv = 'preview_theme_id=195111911690';
const b = await chromium.launch();
const info = {};
const pages = [
  ['home', '/'],
  ['prod', '/products/couverture-lestee-7-11-15kg-grandes-dimensions'],
  ['coll', '/collections/au-calme'],
];
const probe = () => {
  const q = (s) => document.querySelector(s);
  const box = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), y: Math.round(r.top + scrollY), txt: (e.innerText || '').slice(0, 300) }; };
  const fl = [...document.querySelectorAll('body *')].filter(e => { const s = getComputedStyle(e); return s.position === 'fixed' && /grc|guaranteed|avis/i.test(e.className + ' ' + e.id + ' ' + (e.src || '')); }).map(e => ({ tag: e.tagName, cls: String(e.className).slice(0, 80), id: e.id, r: e.getBoundingClientRect().toJSON() }));
  return {
    heroes: document.querySelectorAll('.lc4-stage__title').length,
    floating: fl,
    siteRating: box('.grc-site-rating'),
    footIframe: box('.lc-avis__carousel'),
    footIframeEl: !!q('.lc-avis__carousel iframe'),
    proof: box('#lc4-avis'),
    jdgm: box('.lc4-proof__jdgm'),
    jdgmItems: document.querySelectorAll('.lc4-proof__jdgm .jdgm-carousel-item').length,
    agStars: document.querySelectorAll('.lc4-rating--ag').length,
    agStarsFilled: [...document.querySelectorAll('.lc4-rating--ag')].filter(e => e.children.length).length,
    jdgmBadges: document.querySelectorAll('.lc4-rating.jdgm-widget').length,
  };
};
for (const vp of [{ n: 'd', w: 1440, h: 1000 }, { n: 'm', w: 390, h: 844 }]) {
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, locale: 'fr-FR', isMobile: vp.n === 'm' });
  const p = await ctx.newPage();
  for (const [k, path] of pages) {
    if (vp.n === 'm' && k === 'coll') continue;
    await p.goto(`https://comptoir-sante-beaute.com${path}?${pv}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await p.addStyleTag({ content: '#preview-bar-iframe,iframe[id*=preview]{display:none!important}' }).catch(() => {});
    await p.waitForTimeout(3000);
    await p.screenshot({ path: `tests/s-${vp.n}-${k}-top.png` });
    // scroll progressively so lazy widgets load
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } });
    await p.waitForTimeout(2500);
    info[`${vp.n}-${k}`] = await p.evaluate(probe);
    for (const sel of ['#lc4-avis', '.lc-avis']) {
      const ok = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); return true; }, sel);
      if (ok) { await p.waitForTimeout(1800); await p.screenshot({ path: `tests/s-${vp.n}-${k}-${sel.replace(/[#.]/g, '')}.png` }); }
    }
  }
  await ctx.close();
}
fs.writeFileSync('tests/info.json', JSON.stringify(info, null, 1));
await b.close();
