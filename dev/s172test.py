# 5.3.0.2 시험: 탐험 오르는 길(효과층 6단계, 작업지시서 105, 105-2)
# 보는 것
#  1) 엔진이 없으면(시험판 기본) 바닥 그림판(canvas.fxg)이 없고 무대는 예전 겹 배경 그대로
#  2) 엔진이 있으면 겹 배경 바로 위, 대원 아래에 canvas.fxg(누르기 통과)가 생기고 무대에 g6, 바닥과 사선 길이 깔려요
#  3) 길을 따라 흐르게 하면 바닥과 길 무늬 자리가 바뀌고, 문을 부르면 문이 생겼다가 지나가요. 탭을 떠나면 그리기를 멈춰요(raf 0)
#  4) 높이(지역 안 층)에 따라 먼 풍경이 내려가고 구름이 짙어져요
#  5) 탐험 탭을 떠나면 그리기를 멈추고, 움직임 줄이기면 켜지 않아요
#  6) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s172test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

ROOT = pathlib.Path(__file__).resolve().parent.parent
PIXI = (ROOT / 'img' / 'lib' / 'pixi.min.js').as_uri()
ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files']

async def open_page(b, pixi, reduced=False):
    s = base(tier=4, tg=1); s['tam'] = {'best': 5, 'party': ['bear', 'rabbit', 'fox'], 'mem': {k: {'lv': 20, 'st': 2, 'sh': 0} for k in ['bear', 'rabbit', 'fox']}, 'seen': 1}
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True, reduced_motion='reduce' if reduced else 'no-preference')
    await ctx.add_init_script("window.__FOREST_TEST = true;" + (("window.FS_IMG_BASE = %s;" % json.dumps((ROOT / 'img').as_uri() + '/')) + f"window.FS_PIXI_SRC = {json.dumps(PIXI)};" if pixi else ''))   # 그림 폴더를 주면 엔진 파일도 받아져서, 엔진 없음은 주지 않아요
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(s)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(3600); await pg.evaluate(CLEAN)
    await pg.evaluate(f"(() => {{ document.querySelectorAll('.overlay').forEach(o => o.hidden = true); {F}.rt4.modalOpen = null; {F}.setTab('tam'); }})()")
    return ctx, pg, errs

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        # 1) 엔진 없음
        ctx, pg, errs = await open_page(b, False)
        await pg.wait_for_timeout(2500)
        r = await pg.evaluate("[!!document.querySelector('canvas.fxg'), document.querySelector('#tmStage').classList.contains('g6'), document.querySelector('#tmStage').classList.contains('lay')]")
        print('엔진 없음', r)
        if r != [False, False, True]: bad.append(f'엔진 없을 때 예전 겹 배경 {r}')
        bad += [f'(엔진 없음) {e}' for e in errs[:3]]; await ctx.close()
        # 2) 엔진 있음
        ctx, pg, errs = await open_page(b, True)
        for _ in range(60):
            if await pg.evaluate("document.querySelector('#tmStage').classList.contains('g6')"): break
            await pg.wait_for_timeout(200)
        r = await pg.evaluate(f"""(() => {{ const c = document.querySelector('canvas.fxg'); return {{ g6: document.querySelector('#tmStage').classList.contains('g6'), cv: !!c && !c.hidden, after: !!c && c.previousElementSibling && c.previousElementSibling.classList.contains('tm-bgs'), pe: c ? getComputedStyle(c).pointerEvents : '', floor: !!{F}.FXG.floor, path: !!{F}.FXG.path, reg: {F}.FXG.reg }}; }})()""")
        print('엔진 있음', r)
        if r != {'g6': True, 'cv': True, 'after': True, 'pe': 'none', 'floor': True, 'path': True, 'reg': 'ground'}: bad.append(f'바닥 그림판 {r}')
        # 3) 흐르기와 문
        await pg.wait_for_timeout(3000)
        a = await pg.evaluate(f"[{F}.FXG.floor.tilePosition.x, {F}.FXG.floor.tilePosition.y, {F}.FXG.path.tilePosition.y]")
        await pg.evaluate(f"{F}.fxgRun(600, 300, true)")
        g = await pg.evaluate(f"!!{F}.FXG.gate")
        await pg.wait_for_timeout(1200)
        c = await pg.evaluate(f"[{F}.FXG.floor.tilePosition.x, {F}.FXG.floor.tilePosition.y, {F}.FXG.path.tilePosition.y, {F}.FXG.raf]")
        print('흐르기', a, c, '문', g)
        if not g: bad.append('문이 생기지 않음')
        if abs(c[0] - a[0]) < 20 or abs(c[1] - a[1]) < 20 or abs(c[2] - a[2]) < 50: bad.append(f'바닥과 길이 흐르지 않음 {a} {c}')
        # 4) 높이
        await pg.evaluate(f"{F}.fxgHeight(45)")
        h = await pg.evaluate(f"[document.querySelector('.tm-bg.cur .ly.far').style.translate, {F}.FXG.cloud ? {F}.FXG.cloud.alpha : -1]")
        print('높이', h)
        if not h[0] or h[0].startswith('0px 0') or h[1] <= 0: bad.append(f'높이에 따라 먼 풍경과 구름 {h}')
        # 5) 탭을 떠나면 멈춤
        await pg.evaluate(f"{F}.fxgRun(2000, 800, false)"); await pg.wait_for_timeout(100)
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(400)
        r = await pg.evaluate(f"[{F}.FXG.raf, {F}.FXG.run > 1.5]")
        print('탭 떠남', r)
        if r[0]: bad.append(f'탭을 떠나도 그리기 {r}')
        bad += [f'(엔진 있음) {e}' for e in errs[:3]]; await ctx.close()
        # 움직임 줄이기
        ctx, pg, errs = await open_page(b, True, reduced=True)
        await pg.wait_for_timeout(3000)
        r = await pg.evaluate("[document.querySelector('#tmStage').classList.contains('g6'), !!document.querySelector('canvas.fxg:not([hidden])')]")
        print('움직임 줄이기', r)
        if r != [False, False]: bad.append(f'움직임 줄이기면 끄기 {r}')
        bad += [f'(움직임 줄이기) {e}' for e in errs[:3]]; await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else 'PASS')

asyncio.run(main())
