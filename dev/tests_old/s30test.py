import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); r = {}
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3500)
        r['shown'] = await pg.evaluate("!document.querySelector('#tut').hidden")
        for i in range(8):
            await pg.screenshot(path=f's30_tut{i}.png')
            r[f's{i}'] = await pg.evaluate("document.querySelector('#tutTitle').textContent")
            if i == 2:
                await pg.tap('#tutLater'); await pg.wait_for_timeout(400)
                r['later'] = await pg.evaluate("[document.querySelector('#tut').hidden, window.__forest.S.tut.st, window.__forest.S.tut.step]")
                await pg.evaluate("document.querySelector('.tab[data-tab=settings]').click()"); await pg.wait_for_timeout(300)
                r['sub'] = await pg.evaluate("document.querySelector('#tutSub').textContent")
                await pg.evaluate("document.querySelector('#optTut').click()"); await pg.wait_for_timeout(500)
                r['resume'] = await pg.evaluate("document.querySelector('#tutStep').textContent")
            await pg.tap('#tutNext'); await pg.wait_for_timeout(450)
        r['end'] = await pg.evaluate("[document.querySelector('#tut').hidden, window.__forest.S.tut.st, window.__forest.S.gold, document.querySelector('#toast').textContent]")
        # 건너뛰기는 두 번 눌러야 하고 보상이 없어요
        await pg.evaluate("window.__forest.S.tut.paid=false; window.__forest.tutStart(0)"); await pg.wait_for_timeout(300)
        await pg.tap('#tutSkip'); await pg.wait_for_timeout(200)
        r['skip1'] = await pg.evaluate("[document.querySelector('#tutSkip').textContent, document.querySelector('#tut').hidden]")
        await pg.tap('#tutSkip'); await pg.wait_for_timeout(300)
        g0 = await pg.evaluate("window.__forest.S.gold")
        await pg.evaluate("window.__forest.tutStart(7)"); await pg.wait_for_timeout(300); await pg.tap('#tutNext'); await pg.wait_for_timeout(300)
        r['skipNoPay'] = [g0, await pg.evaluate("window.__forest.S.gold"), await pg.evaluate("window.__forest.S.tut.nop")]
        r['errors'] = errs; await b.close(); print(json.dumps(r, ensure_ascii=False, indent=1))
asyncio.run(main())
