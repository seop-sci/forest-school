# 2.3.4 시험: 동아리 대항전 '모두 연습' 단추를 실제로 눌러요
# 보는 것
#  1) 동아리실 맨 위 대항전 칸(#cgBox)의 '모두 연습'을 손가락으로 누르면 연습이 돼요(예전에는 #clubBody에만 연결돼 반응이 없었어요)
#  2) 메인 퀘스트 cg1(대항전 연습하기) 진행이 1이 되고, 단추가 '오늘 연습 끝'으로 바뀌어요
#  3) 같은 날 다시 누르면 연습 수가 늘지 않아요
#  4) 390 밝은, 360 어두운 화면, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s106test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
MID = """S.tier = 2; S.tg = 0; for (const k of F.facKeys()) { S.f[k] = Math.max(S.f[k] || 0, 5); } F.rosterEnsure(true); F.clubAuto(true);"""


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg); print('  틀림:', msg)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S; {js} }})()")
            await ev(MID + " S.cg.wk = -1; F.cgSync(true); S.cg.pd = ''; S.cg.st.p = 0; F.setTab('club'); F.renderClub(); return 1;")
            await pg.wait_for_timeout(400)
            btn = pg.locator('#cgBox [data-cg="prac"]')
            ok(await btn.count() == 1, f'{w} 모두 연습 단추가 없어요')
            await btn.scroll_into_view_if_needed(); await btn.tap(); await pg.wait_for_timeout(400)
            r = await ev("const q = F.MAIN.find(x => x.id === 'cg1'); return { p: S.cg.st.p, pd: S.cg.pd === F.gameToday(), prac: S.cg.prac.reduce((a, b) => a + b, 0), m: F.qMeasure(q), t: document.querySelector('#cgBox [data-cg=\"prac\"]').textContent };")
            print(w, '누름', r)
            ok(r['p'] == 1 and r['pd'] and r['prac'] > 0 and r['m'] >= 1, f'{w} 눌러도 연습이 안 돼요 {r}')
            ok('오늘 연습 끝' in r['t'], f'{w} 단추 글이 그대로예요 {r}')
            await pg.locator('#cgBox [data-cg="prac"]').tap(force=True); await pg.wait_for_timeout(300)
            r2 = await ev("return S.cg.st.p;")
            ok(r2 == 1, f'{w} 하루에 두 번 연습했어요 {r2}')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
