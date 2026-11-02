"""2.3.3 mission migration, assets, event cleanup and mobile UI."""
import asyncio,json
from playwright.async_api import async_playwright
from s4test import ctxpage,base
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch()
  for w,scheme in [(360,'dark'),(390,'light')]:
   ctx,pg,errs=await ctxpage(b,w,844,scheme,base(tier=2,tg=5))
   out=await pg.evaluate('''() => {
    const F=window.__forest,S=F.S,o={};
    S.dm={day:F.gameToday(),list:[{id:'ups',b:S.st.ups,done:false},{id:'trains',b:S.st.trains-2,done:false},{id:'puzzle',b:0,done:true}],bonus:false,swapped:false};
    F.dmDay();o.ids=S.dm.list.map(x=>x.id);o.done=S.dm.list[2].done;
    const g=S.gold;o.swap=F.swapDaily(0);o.again=F.swapDaily(0);o.gold=S.gold===g;
    F.save();o.restore=F.sanitize(JSON.parse(localStorage.getItem('forest-school-v1'))).dm.swapped;
    o.boxes=F.MP_BOX.map(x=>x.at);o.assets=['kinder','elem','middle'].every(t=>['space','retro'].every(k=>!!F.IMG170('map_'+t+'_'+k)));
    S.tut.st='skip';F.rt.tut=null;document.querySelector('#tut').hidden=true;
    document.querySelectorAll('.overlay').forEach(e=>{e.hidden=true;e.classList.remove('open')});F.rt.modalOpen=null;
    F.startFest('show',true);o.lights=!!document.querySelector('#festLighting');return o;
   }''')
   assert out['ids'][0]!='ups' and out['ids'][1]=='trains' and out['done'],out
   assert out['swap'] and not out['again'] and out['gold'] and out['restore'],out
   assert out['boxes']==[100,250,350,500,650] and out['assets'] and out['lights'],out
   await pg.screenshot(path=f'/tmp/s103-show-{w}.png')
   await pg.evaluate('window.__forest.rt.fest.t=0;window.__forest.rt.fest.intro=0')
   await pg.wait_for_timeout(5500)
   assert await pg.evaluate("!document.querySelector('#festLighting')")
   await pg.evaluate('''() => {const F=window.__forest;document.querySelectorAll('.overlay').forEach(e=>{e.hidden=true;e.classList.remove('open')});F.rt.modalOpen=null;F.startFest('photo',true);}''')
   assert await pg.evaluate("!!document.querySelector('#festPhotoDecor')")
   await pg.screenshot(path=f'/tmp/s103-photo-{w}.png')
   assert not errs,errs
   print(w,scheme,json.dumps(out,ensure_ascii=False),flush=True)
   await ctx.close()
  await b.close()
 print('PASS s103',flush=True)
asyncio.run(main())
