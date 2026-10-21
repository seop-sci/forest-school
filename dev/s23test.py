import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
import s7test as T
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); r = {}
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        sv = T.elem(tg=5, q=T.Q('e43', 0)); sv['q']['mid'] = 'e43'
        await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('s')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('s','1')}" % json.dumps(json.dumps(sv)))
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
        r['btn'] = await pg.evaluate("document.querySelector('#btnSports').textContent")
        await pg.evaluate("document.querySelector('#btnSports').click()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='s23_menu.png')
        for fid in ['picnic', 'welcome', 'show', 'photo']:
            await pg.evaluate(CLEAN)
            await pg.evaluate(f"window.__forest.startFest('{fid}', true)"); await pg.wait_for_timeout(3500)
            hits = 0
            for i in range(10):
                ok = await pg.evaluate("(()=>{const d=[...document.querySelectorAll('.fest-item')].pop(); if(!d) return 0; d.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); return 1})()")
                hits += ok; await pg.wait_for_timeout(350)
            await pg.screenshot(path=f's23_{fid}.png')
            st = await pg.evaluate("window.__forest.rtFest() && [window.__forest.rtFest().n, document.querySelector('#festBar').innerText]")
            await pg.evaluate("window.__forest.rtFest().t = 0.2"); await pg.wait_for_timeout(1200)
            r[fid] = [hits, st, await pg.evaluate("[!document.querySelector('#mSportsEnd').hidden, document.querySelector('#srTitle').textContent, document.querySelector('#srScore').textContent]")]
            await pg.evaluate("document.querySelector('#srGet').click()"); await pg.wait_for_timeout(600)
        r['quest'] = await pg.evaluate("[window.__forest.curMain().id, window.__forest.mainReady()]")
        await pg.evaluate("document.querySelector('#btnSports').click()"); await pg.wait_for_timeout(400)
        r['menu2'] = await pg.evaluate("document.querySelector('#festList').innerText.replace(/\\n+/g,' | ').slice(0,400)")
        await pg.screenshot(path='s23_menu2.png')
        # 운동회도 메뉴에서
        await pg.evaluate(CLEAN); await pg.evaluate("window.__forest.startFest('sports', true)"); await pg.wait_for_timeout(1500)
        r['sports'] = await pg.evaluate("!!window.__forest.rtSports()")
        r['errors'] = errs
        await b.close(); print(json.dumps(r, ensure_ascii=False, indent=1))
asyncio.run(main())
