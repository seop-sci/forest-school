# 5.3.2 처음 켠 학교 안내(woodani 결정 A): 안내 카드 세 장은 첫 퀘스트(책상 고치기)를 마친 뒤로, 처음에는 손가락과 한 줄만
#  1) 처음 켜면 안내 카드(#tut)가 저절로 뜨지 않고, 교실 위에 '교실을 눌러 보세요'
#  2) 교실 창을 열면 '책상을 눌러 올려요', 책상을 올리면 퀘스트 칸에 '눌러서 보상을 받아요'
#  3) 보상을 받으면(메인 퀘스트 1) 안내 카드가 뜨고 그동안 손가락은 숨어요
#  5) 처음 메인 퀘스트 다섯 개까지 손가락: 급식실 짓기(건물, 짓기 단추), 급식실 가구(가구), 여섯 번째부터는 없어요
#  4) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s178test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from testlib import URL, F

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(4000)
        H = "(() => { const h = document.querySelector('#firstHint'); return h && !h.hidden ? h.textContent : ''; })()"
        r = await pg.evaluate(f"[{F}.S.q.m, !document.querySelector('#tut').hidden, {F}.S.tut.st]"); t = await pg.evaluate(H)
        print('처음', r, t)
        if r[1] or '교실을 눌러' not in t: bad.append(f'처음 화면 {r} {t!r}')
        await pg.evaluate(f"{F}.openSheet('classroom')"); await pg.wait_for_timeout(700)
        t = await pg.evaluate(H); print('교실 창', t)
        if '책상을 눌러' not in t: bad.append(f'교실 창 손가락 {t!r}')
        await pg.evaluate(f"(() => {{ const F = {F}; F.S.budget = Math.max(F.S.budget, 1e4); F.buyFur('classroom', 0); F.closeSheet && F.closeSheet(); }})()"); await pg.wait_for_timeout(300)
        await pg.evaluate(f"(() => {{ const F = {F}; if (F.rt4.sheetKey) {{ const x = document.querySelector('#sheet .sheet-x, #sheetX, .sheet .x'); if (x) x.click(); }} F.rt4.sheetKey = F.rt4.sheetKey && null; }})()")
        await pg.wait_for_timeout(700)
        t = await pg.evaluate(H); print('책상 올린 뒤', t, await pg.evaluate(f"{F}.mainReady()"))
        if '보상' not in t: bad.append(f'보상 받기 손가락 {t!r}')
        await pg.evaluate(f"(() => {{ document.querySelectorAll('.overlay.open').forEach(o => {{ o.hidden = true; o.classList.remove('open'); }}); {F}.rt4.modalOpen = null; document.querySelector('#questBar').click(); }})()")
        await pg.wait_for_timeout(600)
        await pg.evaluate(f"(() => {{ document.querySelectorAll('.overlay.open').forEach(o => {{ if (o.id !== 'tut') {{ o.hidden = true; o.classList.remove('open'); }} }}); if ({F}.rt4.modalOpen && {F}.rt4.modalOpen.id !== 'tut') {{ {F}.rt4.modalOpen = null; }} }})()")
        for _ in range(12):
            if await pg.evaluate("!document.querySelector('#tut').hidden"): break
            await pg.evaluate(f"(() => {{ const F = {F}; if (F.rt4.modalOpen && F.rt4.modalOpen.id !== 'tut') {{ F.rt4.modalOpen.hidden = true; F.rt4.modalOpen.classList.remove('open'); F.rt4.modalOpen = null; }} }})()")
            await pg.wait_for_timeout(500)
        await pg.wait_for_timeout(900)   # 손가락은 0.4초마다 다시 봐요
        r = await pg.evaluate(f"[{F}.S.q.m, !document.querySelector('#tut').hidden, !!(document.querySelector('#firstHint') && !document.querySelector('#firstHint').hidden)]")
        print('보상 뒤', r)
        if r[0] < 1 or not r[1] or r[2]: bad.append(f'보상 받은 뒤 안내 카드와 손가락 {r}')
        # 5) 급식실 짓기(4번째)와 급식실 가구(5번째), 놀이터 짓기(6번째)
        await pg.evaluate(f"(() => {{ const F = {F}; F.tutEnd && F.tutEnd('skip'); document.querySelectorAll('.overlay.open').forEach(o => {{ o.hidden = true; o.classList.remove('open'); }}); F.rt4.modalOpen = null; F.rt4.tut = null; F.S.tut.st = 'done'; F.S.q.m = 3; F.S.q.mb = F.qBase ? F.qBase(F.MAIN[3]) : F.S.q.mb; F.S.budget = 1e6; }})()")
        await pg.wait_for_timeout(900)
        t = await pg.evaluate(H); print('급식실 짓기', t)
        if '급식실을 눌러' not in t: bad.append(f'급식실 짓기 손가락 {t!r}')
        await pg.evaluate(f"{F}.openSheet('cafeteria')"); await pg.wait_for_timeout(700)
        t = await pg.evaluate(H); print('급식실 창', t)
        if '지어요' not in t: bad.append(f'급식실 창 짓기 손가락 {t!r}')
        await pg.evaluate(f"(() => {{ const F = {F}; F.closeSheet && F.closeSheet(); F.rt4.sheetKey = null; F.S.f.cafeteria = 1; delete (F.S.bd || {{}}).cafeteria; F.S.q.m = 4; }})()")
        await pg.evaluate(f"{F}.openSheet('cafeteria')"); await pg.wait_for_timeout(700)
        t = await pg.evaluate(H); print('급식실 가구', t)
        if '가구를 눌러' not in t: bad.append(f'급식실 가구 손가락 {t!r}')
        await pg.evaluate(f"(() => {{ const F = {F}; F.closeSheet && F.closeSheet(); F.rt4.sheetKey = null; F.S.q.m = 5; }})()"); await pg.wait_for_timeout(900)
        r = await pg.evaluate("!!document.querySelector('#firstHint')"); print('여섯 번째', r)
        if r: bad.append('여섯 번째 퀘스트에도 손가락이 남아요')
        bad += [f'오류 {e}' for e in errs[:3]]
        await b.close()
    print('\n'.join(bad) if bad else '')
    print('FAIL' if bad else 'PASS')

asyncio.run(main())
