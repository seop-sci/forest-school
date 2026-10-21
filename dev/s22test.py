import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
import s7test as T
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
async def page(b, sv, w=390, h=844):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('s')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('s','1')}" % json.dumps(json.dumps(sv)))
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
    return ctx, pg, errs
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); r = {}
        # 1. 예전 7장 q26에 있던 3학년 학교
        sv = T.elem(tg=2); sv['q']['mid'] = 'q26'; sv['q'].pop('qv', None)
        ctx, pg, errs = await page(b, sv)
        r['mig'] = await pg.evaluate("[window.__forest.curMain().id, window.__forest.qNo(window.__forest.S.q.m)]")
        await pg.evaluate("document.querySelector('.tab[data-tab=quests]').click()"); await pg.wait_for_timeout(400)
        r['next'] = await pg.evaluate("(document.querySelector('.ch-next')||{}).textContent")
        await pg.reload(); await pg.wait_for_timeout(1200)
        r['mig2'] = await pg.evaluate("window.__forest.curMain().id")
        r['errs1'] = errs; await ctx.close()
        # 2. 체험학습 버스
        sv = T.elem(tg=2, q=T.Q('e20', 0)); sv['q']['mid'] = 'e20'
        ctx, pg, errs = await page(b, sv)
        await pg.evaluate("document.querySelector('#scroller').scrollTop = 9999")
        n0 = await pg.evaluate("window.__forest.rt.kids.length")
        await pg.evaluate("document.querySelector('#btnTrip').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('[data-trip=hill]').click()"); await pg.wait_for_timeout(2300)
        await pg.screenshot(path='s22_bus_go.png')
        await pg.wait_for_timeout(5000)
        r['kidsAway'] = [n0, await pg.evaluate("window.__forest.rt.kids.length"), await pg.evaluate("window.__forest.S.trip.kids"), await pg.evaluate("!!document.querySelector('.bus')")]
        await pg.evaluate("window.__forest.S.trip.end = Date.now()"); await pg.wait_for_timeout(500)
        await pg.evaluate("document.querySelector('#btnTrip').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#tripGet').click()"); await pg.wait_for_timeout(2400)
        await pg.screenshot(path='s22_bus_back.png')
        await pg.wait_for_timeout(3500)
        r['kidsBack'] = [await pg.evaluate("window.__forest.rt.kids.length"), await pg.evaluate("window.__forest.S.trip.kids"), await pg.evaluate("!!document.querySelector('.bus')")]
        r['errs2'] = errs; await ctx.close()
        # 3. 운동회
        sv = T.elem(tg=3, q=T.Q('e25', 0)); sv['q']['mid'] = 'e25'
        ctx, pg, errs = await page(b, sv)
        r['sportsBtn'] = await pg.evaluate("[!document.querySelector('#btnSports').hidden, document.querySelector('#btnSports').textContent]")
        await pg.evaluate("document.querySelector('#btnSports').click()"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('[data-fest=sports]').click()"); await pg.wait_for_timeout(3500)
        for i in range(6):
            await pg.evaluate("(()=>{const d=document.querySelector('.drop'); if(d) d.dispatchEvent(new MouseEvent('click',{bubbles:true}))})()"); await pg.wait_for_timeout(500)
        await pg.screenshot(path='s22_sports_run.png')
        r['mid'] = await pg.evaluate("[document.querySelector('#sportsBar').innerText, window.__forest.rtSports() && window.__forest.rtSports().blue]")
        await pg.evaluate("window.__forest.rtSports().t = 0.3"); await pg.wait_for_timeout(1200)
        r['end'] = await pg.evaluate("[!document.querySelector('#mSportsEnd').hidden, document.querySelector('#srTitle').textContent, document.querySelector('#srScore').textContent, document.querySelector('#sportsBar').hidden]")
        await pg.screenshot(path='s22_sports_end.png')
        await pg.evaluate("document.querySelector('#srGet').click()"); await pg.wait_for_timeout(800)
        r['after'] = await pg.evaluate("[document.querySelector('#toast').textContent, document.querySelector('#btnSports').textContent, window.__forest.S.st.sports, window.__forest.mainReady()]")
        r['errs3'] = errs; await ctx.close()
        await b.close(); print(json.dumps(r, ensure_ascii=False, indent=1))
asyncio.run(main())
