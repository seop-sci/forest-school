# 33번 묶음(1.1.0) 시험: 보충수업 잠깐씩, 도토리 1/10과 1장 퀘스트, 황금 도토리, 요일별 급식, 학교 파워 칠판
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
            r['version'] = await pg.evaluate("document.querySelector('#verRow dd').textContent")
            r['quest0'] = await pg.evaluate(f"[{F}.curMain().id, document.querySelector('#qbTitle').textContent, document.querySelector('#qbHow').textContent]")
            r['rate_start'] = await pg.evaluate(f"{F}.rate()")
            r['board'] = await pg.evaluate("[...document.querySelectorAll('#stats .stat')].map(e => e.innerText.replace(/\\s+/g, ' ').trim())")
            await pg.screenshot(path=f's33_board_{tag}.png', clip={'x': 0, 'y': 0, 'width': w, 'height': 260})
            # 학교 파워가 오르면 +숫자
            p0 = await pg.evaluate(f"{F}.rankScore()")
            await pg.evaluate(f"{F}.S.budget = 1e6; {F}.buyFur('classroom', 0)"); await pg.wait_for_timeout(250)
            r['power'] = [p0, await pg.evaluate(f"{F}.rankScore()"), await pg.evaluate("!!document.querySelector('.pw-pop')"), await pg.evaluate("document.querySelector('#vPower').textContent")]
            # 보충수업: 부엉이 선생님이 있어도 평소에는 숨어 있다가 잠깐 나타나요
            await pg.evaluate(f"{F}.S.u.boost = true; {F}.rt.boostUntil = 0; {F}.rt.boostT = 999")
            await pg.wait_for_timeout(400)
            r['boost_hidden'] = await pg.evaluate("document.querySelector('#btnBoost').hidden")
            await pg.evaluate(f"{F}.rt.boostT = 0.01"); await pg.wait_for_timeout(600)
            r['boost_shown'] = await pg.evaluate("[document.querySelector('#btnBoost').hidden, document.querySelector('#boostN').textContent]")
            await pg.screenshot(path=f's33_boost_{tag}.png', clip={'x': 0, 'y': 240, 'width': w, 'height': 200})
            await pg.evaluate(f"{F}.rt.boostUntil = Date.now() - 1"); await pg.wait_for_timeout(500)
            r['boost_gone'] = await pg.evaluate("document.querySelector('#btnBoost').hidden")
            # 황금 도토리: 상점 광고 버튼 문구
            r['shopAd'] = await pg.evaluate("document.querySelector('#shopAd').textContent")
            # 요일별 급식
            await pg.evaluate(f"{F}.S.f.cafeteria = 3; {F}.S.fu.cafeteria = [3,3,3,3]")
            menus = {}
            for day in range(7):
                await pg.evaluate("""d => { const RD = Date; window.__RD = window.__RD || RD; const base = new window.__RD(2026, 9, 18 + d, 12);
                  window.Date = class extends window.__RD { constructor(...a) { return a.length ? new window.__RD(...a) : new window.__RD(base); } static now() { return window.__RD.now(); } }; }""", day)
                await pg.evaluate("document.querySelector('[data-close-sheet]').click()"); await pg.wait_for_timeout(250)
                await pg.evaluate("document.querySelector('#b-cafeteria').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(350)
                menus[day] = await pg.evaluate("[...document.querySelectorAll('#furScene .fur-menu')].map(t => t.textContent).join(' / ')")
                if day in (0, 1): await (await pg.query_selector('#furScene')).screenshot(path=f's33_menu{day}_{tag}.png')
            await pg.evaluate("window.Date = window.__RD")
            r['menus'] = menus
            r['errors'] = errs; out[tag] = r
            await ctx.close()
        await b.close(); print(json.dumps(out, ensure_ascii=False, indent=1))
asyncio.run(main())
