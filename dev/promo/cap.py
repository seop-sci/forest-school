import asyncio, json, sys, time
sys.path.insert(0,'/home/claude/forest-school/dev')
from playwright.async_api import async_playwright
from s4test import base, BIG
URL='http://localhost:8765/index.html'
W,H,DPR=390,693,1080/390   # 9:16
CLEAN = """(()=>{const F=window.__forest; document.querySelectorAll('.overlay').forEach(o=>o.hidden=true); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
  [...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).position==='fixed'&&/환영|튜토|알려 줄게/.test(e.textContent||'')&&e.children.length<40).forEach(e=>e.style.display='none'); })()"""
async def page_for(b, save, w=W, h=H, scheme='light', extra='', zoom=False):
    if True:
        ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=DPR, is_mobile=True, has_touch=True, color_scheme=scheme)
    await ctx.add_init_script("window.__FOREST_TEST = true;"+extra)
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    css=open('/home/claude/promo/fonts.css').read()
    await ctx.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=css))
    await ctx.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(CLEAN)
    await pg.add_style_tag(content='.ffb,.cz-bdg.ff,#wxFx,#wxChip,#toast{display:none!important}')
    return ctx, pg, errs
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, sv in [('uni', base(tier=4, tg=1, sem=1, grade=4, q={'init':True})), ('kinder', base())]:
            ctx, pg, errs = await page_for(b, sv)
            await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN); await pg.evaluate("document.querySelector('#toast').hidden=true"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'/home/claude/promo/raw/try_{name}.png'); print(name, errs[:2]); await ctx.close()
        await b.close()
if __name__ == '__main__': asyncio.run(main())
