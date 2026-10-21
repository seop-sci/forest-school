# 32번 묶음 시험: 진짜 교실처럼 그린 시설 방 (가구 수가 레벨 따라 늘어나요)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); out = {}
        for dark in (False, True):
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2600)
            await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
            F = 'window.__forest'
            r = {}
            for k in ('classroom', 'cafeteria', 'library', 'playground', 'science'):
                for lv in (1, 6, 12, 22):
                    fu = [lv, max(0, lv - 1), lv, lv - 1] if lv > 1 else [1, 0, 1, 0]
                    await pg.evaluate(f"{F}.S.tier = 1; {F}.S.budget = 1e12; {F}.S.f.{k} = {lv}; {F}.S.fu.{k} = {fu}; document.querySelector('[data-close-sheet]').click()")
                    await pg.wait_for_timeout(280)
                    await pg.evaluate(f"document.querySelector('#b-{k}').dispatchEvent(new MouseEvent('click',{{bubbles:true}}))"); await pg.wait_for_timeout(420)
                    el = await pg.query_selector('#furScene')
                    await el.screenshot(path=f's32_{k}_{lv}_{"d" if dark else "l"}.png')
                    r[f'{k}{lv}'] = await pg.evaluate("[document.querySelectorAll('#furScene .fur-it').length, document.querySelectorAll('#furScene .fur-tagg').length]")
            # 그림 속 가구를 눌러 올리기
            await pg.evaluate(f"{F}.S.f.classroom = 5; {F}.S.fu.classroom = [4,4,4,4]; document.querySelector('[data-close-sheet]').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('#b-classroom').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('#furScene .fur-it[data-fur=\"0\"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(200)
            await pg.evaluate("document.querySelector('#furScene .fur-tagg[data-fur=\"1\"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(200)
            r['tap'] = await pg.evaluate(f"{F}.S.fu.classroom.join(',')")
            await pg.screenshot(path=f's32_sheet_{"d" if dark else "l"}.png')
            r['errors'] = errs; out['dark' if dark else 'light'] = r
            await ctx.close()
        await b.close(); print(json.dumps(out, ensure_ascii=False))
asyncio.run(main())
