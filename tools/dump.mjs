import fs from 'fs';
const cols=process.argv.slice(2); const out={};
for(const c of cols){
  for(let page=1;page<20;page++){
    const r=await fetch(`https://comptoir-sante-beaute.com/collections/${c}/products.json?limit=250&page=${page}`,{headers:{'user-agent':'Mozilla/5.0'}});
    if(!r.ok){console.log(c,page,r.status);break;}
    const j=await r.json(); if(!j.products.length)break;
    for(const p of j.products){ if(!out[p.handle]) out[p.handle]={id:p.id,handle:p.handle,title:p.title,vendor:p.vendor,type:p.product_type,tags:p.tags,options:p.options.map(o=>({name:o.name,values:o.values})),price:p.variants[0]?.price,body:p.body_html,cols:[]}; out[p.handle].cols.push(c); }
    console.log(c,page,j.products.length);
  }
}
fs.mkdirSync('dump',{recursive:true});
fs.writeFileSync('dump/products.json',JSON.stringify(Object.values(out)));
console.log('total',Object.keys(out).length);
