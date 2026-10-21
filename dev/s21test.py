import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
import s7test as T
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); out = {}
        for sc in ('light', 'dark'):
            ctx = await b.new_context(viewport={'width': 360, 'height': 760}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=sc)
            sv = T.elem(gold=300, tg=2, q=T.Q('e20', 0)); sv['q']['mid'] = 'e20'
            await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('s')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('s','1')}" % json.dumps(json.dumps(sv)))
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(1500)
            await pg.evaluate("document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0")
            r = {'btn': await pg.evaluate("[!document.querySelector('#btnTrip').hidden, document.querySelector('#btnTrip').textContent]"),
                 'quest': await pg.evaluate("document.querySelector('#questBar') && document.querySelector('#questBar').innerText.slice(0,60)"),
                 'gradLock': await pg.evaluate("window.__forest.yearLocked()")}
            await pg.screenshot(path=f's21_school_{sc}.png')
            await pg.evaluate("document.querySelector('#btnTrip').click()"); await pg.wait_for_timeout(400)
            await pg.screenshot(path=f's21_trip_list_{sc}.png', full_page=False)
            await pg.evaluate("document.querySelector('[data-trip=hill]').click()"); await pg.wait_for_timeout(400)
            r['going'] = await pg.evaluate("document.querySelector('#tripBody').innerText.slice(0,80)")
            await pg.screenshot(path=f's21_trip_go_{sc}.png')
            await pg.evaluate("document.querySelector('#tripAd').click()"); await pg.wait_for_timeout(5800)
            await pg.evaluate("document.querySelector('#adDone').click()"); await pg.wait_for_timeout(800)
            r['afterAd'] = await pg.evaluate("[!document.querySelector('#mTrip').hidden, document.querySelector('#tripBody').innerText.slice(0,60), document.querySelector('#toast').textContent]")
            await pg.evaluate("document.querySelector('#tripAd') && document.querySelector('#tripAd').click()"); await pg.wait_for_timeout(5800)
            await pg.evaluate("document.querySelector('#adDone') && document.querySelector('#adDone').click()"); await pg.wait_for_timeout(1000)
            r['back'] = await pg.evaluate("[document.querySelector('#tripBody').innerText.slice(0,60), document.querySelector('#tripN').textContent]")
            await pg.screenshot(path=f's21_trip_back_{sc}.png')
            await pg.evaluate("document.querySelector('#tripGet').click()"); await pg.wait_for_timeout(600)
            r['claimed'] = await pg.evaluate("[document.querySelector('#toast').textContent, window.__forest.S.st.trips, window.__forest.S.trip.souv]")
            await pg.screenshot(path=f's21_trip_after_{sc}.png')
            await pg.evaluate("document.querySelector('#tripClose').click()"); await pg.wait_for_timeout(400)
            r['questAfter'] = await pg.evaluate("document.querySelector('#questBar').innerText.slice(0,60)")
            # 테마 한 번에 바꾸기
            await pg.evaluate("document.querySelector('.tab[data-tab=shop]').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('[data-buy=\"s:spring\"]').click()"); await pg.wait_for_timeout(100)
            await pg.evaluate("document.querySelector('#shopYes').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('[data-buy=\"s:xmas\"]').click()"); await pg.wait_for_timeout(100)
            await pg.evaluate("document.querySelector('#shopYes').click()"); await pg.wait_for_timeout(300)
            r['applyBtn'] = await pg.evaluate("[...document.querySelectorAll('[data-apply]')].map(b=>b.textContent)")
            await pg.evaluate("document.querySelector('[data-apply=spring]').click()"); await pg.wait_for_timeout(300)
            r['applied'] = await pg.evaluate("[JSON.stringify(window.__forest.S.cos.th), [...document.querySelectorAll('[data-apply]')].map(b=>b.textContent)]")
            await pg.evaluate("document.querySelector('[data-apply=spring]').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f's21_apply_{sc}.png')
            r['errors'] = errs; out[sc] = r; await ctx.close()
        await b.close(); print(json.dumps(out, ensure_ascii=False, indent=1))
asyncio.run(main())
