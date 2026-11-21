# 5.2.2 시험: 탐험 효과층(PixiJS, src/js/40b-fx-layer.js의 FXT)
# 보는 것
#  1) 엔진 파일이 없으면 탐험 효과층이 켜지지 않고 전투는 오류 없이 그대로
#  2) 엔진이 있으면 탐험 무대(#tmFx) 맨 앞에 canvas.fxt(누르기 통과)가 생기고, 전투 중 맞으면 반짝이가 생겨요
#  3) 강한 한 방은 반짝이가 더 많고 충격 고리, 쓰러지면 도토리와 재료가 바닥(floor)에 튀어요
#  4) 효과가 끝나면 그리기를 멈추고(raf 0), 학교 탭으로 가면 지워요
#  5) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s169test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

PIXI = (pathlib.Path(__file__).resolve().parent.parent / 'img' / 'lib' / 'pixi.min.js').as_uri()
ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
OPEN = f"(() => {{ const F = {F}; document.querySelectorAll('.overlay').forEach(o => o.hidden = true); F.rt4.modalOpen = null; F.S.tam.seen = 1; F.setTab('tam'); }})()"

async def open_page(b, pixi):
    save = base(tier=4, tg=1); save['tam'] = {'best': 3, 'party': ['bear', 'cat', 'fox', 'duck', 'dog'], 'mem': {k: {'lv': 150, 'st': 5, 'sh': 0} for k in ['bear', 'cat', 'fox', 'duck', 'dog']}, 'seen': 1}
    save['gfx'] = 1   # 5.3.2: 그래픽 낮음이면 엔진을 받지 않아요(이 기계는 코어 2개라 자동이 낮음)
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;" + (f"window.FS_PIXI_SRC = {json.dumps(PIXI)};" if pixi else ''))
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' and 'ERR_FILE_NOT_FOUND' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto(URL); await pg.wait_for_timeout(3600); await pg.evaluate(CLEAN)
    return ctx, pg, errs

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        # 1) 엔진 없음
        ctx, pg, errs = await open_page(b, False)
        await pg.evaluate(OPEN); await pg.wait_for_timeout(5000)
        r = await pg.evaluate(f"(() => ({{ st: {F}.FXT.st, on: {F}.fxTamOn(), cv: !!document.querySelector('canvas.fxt'), mobs: document.querySelectorAll('#tmM .tm-f').length }}))()")
        print('엔진 없음', r)
        if r['st'] or r['on'] or r['cv']: bad.append(f'엔진 없을 때 탐험 효과층이 꺼져야 해요 {r}')
        bad += [f'(엔진 없음) {e}' for e in errs[:3]]; await ctx.close()
        # 2) 엔진 있음
        ctx, pg, errs = await open_page(b, True)
        await pg.evaluate(OPEN)
        seen = 0
        for _ in range(250):
            seen = max(seen, await pg.evaluate(f"{F}.FXT.parts.length"))
            if seen >= 5: break
            await pg.wait_for_timeout(60)
        r = await pg.evaluate(f"""(() => {{ const c = document.querySelector('canvas.fxt'); return {{ st: {F}.FXT.st, on: {F}.fxTamOn(), first: !!c && c.parentElement.id === 'tmFx' && c.parentElement.firstElementChild === c, pe: c ? getComputedStyle(c).pointerEvents : '' }}; }})()""")
        print('엔진 있음', r, '전투 중 반짝이', seen)
        if r != {'st': 'ok', 'on': True, 'first': True, 'pe': 'none'}: bad.append(f'탐험 효과층 켜기 {r}')
        if seen < 5: bad.append(f'전투 중 맞을 때 반짝이가 없어요 {seen}')
        # 3) 손으로: 보통 한 방, 강한 한 방, 쓰러짐
        r = await pg.evaluate(f"""(async () => {{ const F = {F}, sl = ms => new Promise(r => setTimeout(r, ms)); await sl(1500); F.FXT.parts.forEach(p => p.s.destroy()); F.FXT.parts.length = 0;
          const m = document.querySelector('#tmM .tm-f'); if (!m) return null;
          F.fxTamHitT(m, false, false, 1); const a = F.FXT.parts.length, ra = F.FXT.rings.length;
          F.fxTamHitT(m, true, false, 1); const b = F.FXT.parts.length - a, rb = F.FXT.rings.length - ra;
          const n0 = F.FXT.parts.length; F.fxTamDropT(m, 1); const drop = F.FXT.parts.slice(n0).filter(p => p.floor != null).length;
          return {{ a, b, ra, rb, drop }}; }})()""")
        print('손으로', r)
        if not r or r['a'] < 10 or r['b'] <= r['a'] or r['ra'] != 0 or r['rb'] != 1 or r['drop'] < 6: bad.append(f'반짝이, 고리, 쓰러짐 {r}')
        # 4) 학교 탭으로 가면 지워요, 효과가 끝나면 멈춰요
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate(f"(() => ({{ parts: {F}.FXT.parts.length, rings: {F}.FXT.rings.length, raf: {F}.FXT.raf }}))()")
        print('학교 탭', r)
        if r != {'parts': 0, 'rings': 0, 'raf': 0}: bad.append(f'탭을 떠나면 지우고 멈추기 {r}')
        bad += [f'(엔진 있음) {e}' for e in errs[:3]]; await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else 'PASS')

asyncio.run(main())
