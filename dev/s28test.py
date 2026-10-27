import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
import s7test as T
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); r = {}
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        sv = T.elem(tg=3, gold=10, q=T.Q('e25', 0)); sv['q']['mid'] = 'e25'
        await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('s')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('s','1')}" % json.dumps(json.dumps(sv)))
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
        # 미션 화면
        await pg.evaluate("document.querySelector('.tab[data-tab=quests]').click()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='s28_missions.png')
        await pg.evaluate("(()=>{const S=window.__forest.S; S.st.picks+=999; S.st.shakes+=999; S.st.ups+=999; S.st.trains+=99; S.st.ads+=99; S.q.subDone+=99; S.st.trips+=9; S.st.sports+=9;})()"); await pg.wait_for_timeout(500)
        for i in range(10):
            await pg.evaluate("(()=>{const b=document.querySelector('#qDaily [data-dm], #qDaily [data-wm]'); if(b) b.click()})()"); await pg.wait_for_timeout(150)
        r['pts'] = await pg.evaluate("[window.__forest.S.wk.pts, window.__forest.S.gold, document.querySelector('.mp-top').textContent]")
        await pg.evaluate("window.__forest.addMP(900)"); await pg.wait_for_timeout(400)
        for i in range(5):
            await pg.evaluate(f"document.querySelector('[data-box=\"{i}\"]').click()"); await pg.wait_for_timeout(200)
        r['boxes'] = await pg.evaluate("[JSON.stringify(window.__forest.S.wk.got), window.__forest.S.cos.hat, window.__forest.S.gold, document.querySelector('#toast').textContent]")
        await pg.evaluate("document.querySelector('#qDaily').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='s28_missions_done.png')
        # 피버 타임
        await pg.evaluate(CLEAN); await pg.evaluate("window.__forest.startFest('picnic', true)"); await pg.wait_for_timeout(1300)
        await pg.screenshot(path='s28_count.png')
        r['intro'] = await pg.evaluate("[document.querySelector('#fvBig').textContent, document.querySelector('.stage').classList.contains('fever'), !document.querySelector('#festBar').hidden, document.querySelectorAll('.fest-item').length]")
        await pg.wait_for_timeout(3500)
        for i in range(4):
            await pg.evaluate("(()=>{const d=[...document.querySelectorAll('.fest-item')].pop(); if(d) d.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))})()"); await pg.wait_for_timeout(500)
        await pg.screenshot(path='s28_fever.png')
        await pg.evaluate("window.__forest.rtFest().t = 0.2"); await pg.wait_for_timeout(500)
        r['end1'] = await pg.evaluate("document.querySelector('#fvBig').textContent")
        await pg.wait_for_timeout(1500)
        r['end2'] = await pg.evaluate("[!document.querySelector('#mSportsEnd').hidden, document.querySelector('.stage').classList.contains('fever')]")
        await pg.evaluate("document.querySelector('#srGet').click()"); await pg.wait_for_timeout(500)
        await pg.evaluate(CLEAN); await pg.evaluate("window.__forest.startFest('sports', true)"); await pg.wait_for_timeout(4500)
        await pg.screenshot(path='s28_sports.png')
        await pg.evaluate("window.__forest.rtSports().t = 0.2"); await pg.wait_for_timeout(2200)
        r['sportsEnd'] = await pg.evaluate("[!document.querySelector('#mSportsEnd').hidden, document.querySelector('#srTitle').textContent]")
        await pg.evaluate("window.__forest.setTab('shop')"); await pg.wait_for_timeout(300)
        r['crownShop'] = await pg.evaluate("!!document.querySelector('[data-buy=\"c:hat:crown\"]')")
        r['errors'] = errs; await b.close(); print(json.dumps(r, ensure_ascii=False, indent=1))
asyncio.run(main())
