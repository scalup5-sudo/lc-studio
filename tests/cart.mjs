import { chromium } from 'playwright';
const base = 'https://comptoir-sante-beaute.com';
const pv = 'preview_theme_id=195111911690';
const b = await chromium.launch(); const ctx = await b.newContext({ locale: 'fr-FR' }); const p = await ctx.newPage();
const log = (...a) => console.log(...a);
p.on('response', r => { if (r.url().includes('/cart')) log('RESP', r.status(), r.request().method(), r.url()); });
async function cart(tag){ const j = await p.evaluate(async()=> (await fetch('/cart.js')).json()); log(tag, 'items', j.item_count, j.items.map(i=>i.handle+' x'+i.quantity).join(' | ')); }
await p.goto(`${base}/?${pv}`, { waitUntil: 'domcontentloaded' }); await cart('start');
for (const h of ['theiere-verre-900ml-infuseur-magnetique','ventilateur-colonne-oscillant-silencieux','couverture-lestee-7-11-15kg-grandes-dimensions']) {
  await p.goto(`${base}/products/${h}?${pv}`, { waitUntil: 'domcontentloaded' });
  const btn = p.locator('[data-lc4p-add]');
  log(h, 'button', await btn.count(), await btn.first().isDisabled().catch(()=>'?'), 'select', await p.locator('[data-lc4p-variant]').count());
  await Promise.all([p.waitForLoadState('domcontentloaded'), btn.first().click()]).catch(e=>log('click err', e.message));
  await p.waitForTimeout(2500); log('url after', p.url()); await cart('after '+h);
}
// carte collection
await p.goto(`${base}/collections/theieres?${pv}`, { waitUntil: 'domcontentloaded' });
const f = p.locator('.lc4-card__form button'); log('card buttons', await f.count());
if (await f.count() > 1) { await f.nth(1).click(); await p.waitForTimeout(2500); log('url after card', p.url()); await cart('after card'); }
await p.goto(`${base}/cart?${pv}`, { waitUntil: 'domcontentloaded' });
await p.screenshot({ path: 'cart.png', fullPage: true });
log('cart html lines', await p.locator('.lc4k-item').count());
await b.close();
