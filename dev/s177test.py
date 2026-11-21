# 5.3.2 효과층 최적화 시험. 시간(fps)은 기계마다 흔들려서 출력만 하고, PASS 기준은 흔들리지 않는 것만 봐요
#  1) 그래픽 낮음이면 엔진(pixi)을 받지 않아요(시험판 FS_PIXI_SRC가 있어도)
#  2) 그림판 해상도는 높음이어도 1.5배 이하(화소 비율 3 화면), 보통은 1배
#  3) 쉬는 홈(그릴 생물과 효과가 없음)에서 지도 그림판(canvas.fxl)은 숨어 있어요. 반딧불이 나오면 보이고, 다른 탭으로 가면 숨어요
#  4) 탐험을 나가면 탐험 그림판(fxt, fxg)이 숨어요
#  5) 자동 품질은 '높음'을 고르지 않아요
#  6) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s177test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

ROOT = pathlib.Path(__file__).resolve().parent.parent
PIXI = (ROOT / 'img' / 'lib' / 'pixi.min.js').as_uri()
ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files']
FPS = """async ms => { let n = 0; const t0 = performance.now(); await new Promise(r => { const f = t => { n++; if (t - t0 < ms) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); }); return Math.round(n / ((performance.now() - t0) / 1000)); }"""

async def open_page(b, save):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;" + "window.FS_IMG_BASE = %s;" % json.dumps((ROOT / 'img').as_uri() + '/') + f"window.FS_PIXI_SRC = {json.dumps(PIXI)};")
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(4500); await pg.evaluate(CLEAN)
    return ctx, pg, errs

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        # 1) 낮음
        s = base(tier=1); s['gfx'] = 0
        ctx, pg, errs = await open_page(b, s)
        r = await pg.evaluate(f"[{F}.FXL.st, typeof window.PIXI, !!document.querySelector('canvas.fxl')]")
        print('낮음', r, '초당', await pg.evaluate(FPS, 2000))
        if r != ['', 'undefined', False]: bad.append(f'낮음에서 엔진을 받았어요 {r}')
        r = await pg.evaluate(f"(() => {{ try {{ localStorage.removeItem('forest-school-gfxcap'); }} catch (e) {{}} return {F}.wldAuto(); }})()")
        if r > 1: bad.append(f'자동 품질이 높음 {r}')
        bad += [f'(낮음) {e}' for e in errs[:3]]; await ctx.close()
        # 2) 3) 높음과 보통, 쉬는 홈
        s = base(tier=1); s['gfx'] = 2
        ctx, pg, errs = await open_page(b, s)
        r = await pg.evaluate(f"[{F}.FXL.st, {F}.FXL.app && {F}.FXL.app.renderer.resolution]")
        print('높음', r)
        if r[0] != 'ok' or not r[1] or r[1] > 1.5: bad.append(f'높음 해상도 {r}')
        await pg.evaluate(f"(() => {{ const F = {F}; F.rt4.wldPh = 'day'; F.rt4.wldWx = ''; F.WLD.next = {{ bfly: 1e15, bird: 1e15, leaf: 1e15, ring: 1e15 }}; F.S.gfx = 1; F.wldSync(); }})()")
        await pg.evaluate(f"(() => {{ const F = {F}; F.WLD.parts.slice().forEach(p => p.s.destroy()); F.WLD.parts.length = 0; }})()")
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate(f"[{F}.WLD.parts.length, document.querySelector('canvas.fxl').hidden, {F}.FXL.raf]")
        print('쉬는 홈', r, '초당', await pg.evaluate(FPS, 2000))
        if r[0] != 0 or r[1] is not True: bad.append(f'쉬는 홈에서 그림판이 보여요 {r}')
        await pg.evaluate(f"(() => {{ const F = {F}; F.rt4.wldPh = 'night'; F.wldSync(); }})()"); await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"[{F}.WLD.parts.filter(p => p.kind === 'fly').length, document.querySelector('canvas.fxl').hidden]")
        print('밤 반딧불', r)
        if r[0] < 1 or r[1] is not False: bad.append(f'반딧불이 나오면 그림판이 보여요 {r}')
        await pg.evaluate(f"{F}.setTab('quests')"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("document.querySelector('canvas.fxl').hidden")
        if r is not True: bad.append('다른 탭에서 지도 그림판이 보여요')
        await pg.evaluate(f"{F}.rt4.wldPh = undefined")
        bad += [f'(높음) {e}' for e in errs[:3]]; await ctx.close()
        # 4) 탐험
        s = base(tier=4, tg=1); s['gfx'] = 1
        s['tam'] = {'best': 5, 'party': ['bear', 'rabbit', 'fox'], 'mem': {k: {'lv': 20, 'st': 2, 'sh': 0} for k in ['bear', 'rabbit', 'fox']}, 'seen': 1}
        ctx, pg, errs = await open_page(b, s)
        await pg.evaluate(f"(() => {{ document.querySelectorAll('.overlay').forEach(o => o.hidden = true); {F}.rt4.modalOpen = null; {F}.setTab('tam'); }})()")
        await pg.wait_for_timeout(3500)
        r = await pg.evaluate(f"[{F}.FXT.st, {F}.FXG.st, {F}.FXG.app && {F}.FXG.app.renderer.resolution]")
        print('탐험', r, '초당', await pg.evaluate(FPS, 2000))
        if r[1] != 'ok' or (r[2] or 9) > 1.5: bad.append(f'탐험 그림판 {r}')
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate(f"[!{F}.FXT.app || {F}.FXT.app.canvas.hidden, !{F}.FXG.app || {F}.FXG.app.canvas.hidden]")
        if r != [True, True]: bad.append(f'탐험을 나가도 그림판이 보여요 {r}')
        bad += [f'(탐험) {e}' for e in errs[:3]]; await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else '')
    print('FAIL' if bad else 'PASS')

asyncio.run(main())
