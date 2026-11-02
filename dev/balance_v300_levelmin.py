import asyncio,pathlib,re,json,sys
sys.path.insert(0,'.')
from playwright.async_api import async_playwright
raw=pathlib.Path('forest-school.html').read_text()
html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+raw+'</body></html>'
JS='''()=>{const F=window.__forest,S=F.S,out=[];
 const tiers=[[0,0],[0,1],[1,0],[1,2],[1,5],[2,0],[2,1],[2,2],[3,0],[3,1],[3,2]];
 for(const [tier,tg] of tiers){for(const sem of [0,1]){S.tier=tier;S.tg=tg;S.sem=sem;S.grade=4;
  const cap=F.facCap();const ks=F.facKeys();
  for(const lvFrac of [0.3,0.9]){for(const k of ks){S.f[k]=Math.max(1,Math.round(cap*lvFrac));S.fu[k]=S.fu[k].map(()=>S.f[k]);}
   S.students=F.capacity();const r=F.rate();
   const mins=ks.map(k=>F.facCost(k)/(r*60)).sort((a,b)=>a-b);
   out.push({tier,tg,sem,cap,lvFrac,rate:r,medMin:mins[Math.floor(mins.length/2)],minMin:mins[0],maxMin:mins[mins.length-1]});}}}
 return out;}'''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--no-sandbox']);ctx=await b.new_context()
    await ctx.add_init_script('window.__FOREST_TEST=true;window.requestAnimationFrame=()=>0;window.setInterval=()=>0')
    await ctx.route('**/*',lambda r: r.fulfill(status=200,content_type='text/html',body=html) if r.request.url=='http://a.local/' else r.abort())
    pg=await ctx.new_page();await pg.goto('http://a.local/');await pg.wait_for_function('!!window.__forest')
    res=await pg.evaluate(JS)
    for x in res: print(x['tier'],x['tg'],x['sem'],'cap',x['cap'],'lv%',x['lvFrac'],'min/level med %.1f (%.1f-%.1f)'%(x['medMin'],x['minMin'],x['maxMin']))
    await b.close()
asyncio.run(main())
