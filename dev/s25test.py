import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
import s7test as T
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); r = {}
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        sv = T.elem(tg=1, budget=1e15, f=dict(classroom=23, cafeteria=16, library=15, playground=16, science=10), q=T.Q('e19', 0)); sv['q']['mid'] = 'e19'
        await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('s')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('s','1')}" % json.dumps(json.dumps(sv)))
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
        r['cap0'] = await pg.evaluate("window.__forest.facCap()")
        await pg.evaluate("document.querySelector('#b-classroom').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(500)
        r['sheet'] = await pg.evaluate("[document.querySelector('#sheetSub').textContent, document.querySelector('#sheetBuyLabel').textContent, document.querySelector('#effNext').textContent, document.querySelector('#sheetNeed').textContent]")
        await pg.screenshot(path='s25_sheet.png')
        await pg.evaluate("document.querySelector('[data-close-sheet]').click()"); await pg.wait_for_timeout(300)
        r['grad'] = await pg.evaluate("[window.__forest.canGraduate(), window.__forest.S.grade]")
        await pg.evaluate("window.__forest.graduate()"); await pg.wait_for_timeout(1200)
        r['after'] = await pg.evaluate("[JSON.stringify(window.__forest.S.f), JSON.stringify(window.__forest.S.t), window.__forest.S.budget > 1e14, window.__forest.facCap(), window.__forest.S.grade, document.querySelector('#gradNew').textContent, document.querySelector('#gradRec').textContent]")
        await pg.screenshot(path='s25_grad.png')
        r['errors'] = errs; await b.close(); print(json.dumps(r, ensure_ascii=False, indent=1))
asyncio.run(main())
