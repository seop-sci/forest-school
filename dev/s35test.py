# 35번 묶음(1.2.0) 시험: 추천 표시와 초반 준비물(퀘스트를 받으면 다음 퀘스트에 드는 도토리를 채워 줘요)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); out = {}
        for dark, w in ((False, 390), (True, 360)):
            tag = ('d' if dark else 'l') + str(w)
            ctx = await b.new_context(viewport={'width': w, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2600)
            await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
            F = 'window.__forest'
            r = {}
            await pg.wait_for_timeout(1200)
            r['rec0'] = await pg.evaluate(f"[JSON.stringify({F}.recommend()), [...document.querySelectorAll('.plaque.is-rec')].map(e => e.id)]")
            await pg.screenshot(path=f's35_map_{tag}.png')
            await pg.evaluate("document.querySelector('#b-classroom').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(500)
            r['room'] = await pg.evaluate("[[...document.querySelectorAll('#furList .fr-rec')].length, document.querySelectorAll('#furScene .fur-tagg.rec').length]")
            await pg.screenshot(path=f's35_room_{tag}.png')
            await pg.evaluate("document.querySelector('[data-close-sheet]').click()"); await pg.wait_for_timeout(300)
            # 1장을 마치고 2장 첫 퀘스트(부엉이 선생님)로: 준비물로 모자란 도토리를 채워 줘요
            await pg.evaluate(f"const S = {F}.S; S.f.classroom = 3; S.fu.classroom = [3,3,3,3]; S.f.cafeteria = 1; S.fu.cafeteria = [1,1,1,1]; S.f.playground = 1; S.f.library = 1; S.t.squirrel = 2; S.budget = 0; S.q.m = {F}.MAIN.findIndex(q => q.id === 'q6'); S.best = 1;")
            await pg.wait_for_timeout(600)
            need = await pg.evaluate(f"{F}.needCost({F}.MAIN.find(q => q.id === 'q7'))")
            await pg.evaluate(f"{F}.claimMain(null)"); await pg.wait_for_timeout(300)
            r['prep'] = [need, await pg.evaluate(f"[{F}.curMain().id, Math.round({F}.S.budget)]")]
            await pg.evaluate("document.querySelector('.tab[data-tab=teachers]').click()"); await pg.wait_for_timeout(1500)
            r['teacher'] = await pg.evaluate("[...document.querySelectorAll('.tcard.is-rec')].map(c => c.dataset.k)")
            await pg.screenshot(path=f's35_teachers_{tag}.png')
            # 초등학교 2학년부터는 채워 주지 않아요
            r['phase'] = await pg.evaluate(f"(() => {{ const S = {F}.S, a = {F}.prepPhase(); const t = S.tier, g = S.tg; S.tier = 1; S.tg = 1; const b = {F}.prepPhase(); S.tier = t; S.tg = g; return [a, b]; }})()")
            r['errors'] = errs; out[tag] = r
            await ctx.close()
        await b.close(); print(json.dumps(out, ensure_ascii=False, indent=1))
asyncio.run(main())
