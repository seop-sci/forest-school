# 도감 '모두 쓰다듬기': 오늘 아직 안 쓰다듬은 단짝을 한 번에(하나씩과 같은 값)
# 보는 것
#  1) 단짝이 있고 오늘 안 쓰다듬은 친구가 있으면 학생 머리줄에 '모두 쓰다듬기 n명' 단추
#  2) 누르면 그 친구들 모두 오늘 쓰다듬음, 친밀도는 하나씩과 같은 만큼(BF.pat), 쓰다듬은 횟수(S.frc.pat)도 n만큼, 단추는 사라져요
#  3) 하나를 먼저 쓰다듬으면 단추 숫자가 하나 줄어요. 360px에서 머리줄이 넘치지 않아요
#  4) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s176test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 360, 'height': 780})
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(base(tier=2))))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(CLEAN)
        n = await pg.evaluate(f"(() => {{ const F = {F}; F.frSync(); return F.frList().length; }})()")
        print('단짝', n)
        await pg.evaluate(f"{F}.setTab('dex')"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("(() => { const b = document.querySelector('[data-fr-pat-all]'); return b ? b.textContent : ''; })()")
        print('단추', t)
        if f'{n}명' not in t: bad.append(f'모두 쓰다듬기 단추 {t!r} (단짝 {n})')
        sp0 = await pg.evaluate(f"{F}.frList()[0]")
        await pg.evaluate(f"{F}.frPat('{sp0}', null, null, true)"); await pg.wait_for_timeout(200)
        t = await pg.evaluate("(() => { const b = document.querySelector('[data-fr-pat-all]'); return b ? b.textContent : ''; })()")
        if f'{n - 1}명' not in t: bad.append(f'하나 쓰다듬은 뒤 단추 {t!r}')
        ov = await pg.evaluate("(() => { const h = document.querySelector('[data-fr-pat-all]').closest('.dex-h'); return h.scrollWidth <= h.clientWidth + 1; })()")
        if not ov: bad.append('360px에서 학생 머리줄이 넘쳐요')
        before = await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; return [S.frc.pat, F.frList().map(sp => S.fr[sp].p)]; }})()")
        await pg.evaluate(CLEAN); await pg.evaluate("document.querySelector('[data-fr-pat-all]').click()"); await pg.wait_for_timeout(300)
        after = await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; return [S.frc.pat, F.frList().map(sp => S.fr[sp].p), F.frPatLeft().length, !!document.querySelector('[data-fr-pat-all]'), F.BF.pat]; }})()")
        print('전', before, '후', after)
        if after[0] - before[0] != n - 1: bad.append(f'쓰다듬은 횟수 {before[0]} → {after[0]}')
        if after[2] != 0 or after[3]: bad.append(f'다 쓰다듬은 뒤 남은 {after[2]}, 단추 {after[3]}')
        grow = [a - b0 for a, b0 in zip(after[1], before[1])]
        if any(g != after[4] for g in grow[1:]): bad.append(f'친밀도 늘어난 만큼 {grow} (하나씩은 {after[4]})')
        bad += [f'오류 {e}' for e in errs[:3]]
        await b.close()
    print('\n'.join(bad) if bad else '')
    print('FAIL' if bad else 'PASS')

asyncio.run(main())
