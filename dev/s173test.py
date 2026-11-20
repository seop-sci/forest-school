# 5.3.0.3 시험: 미니게임 터지는 효과(효과층 7단계, FXO)
# 보는 것
#  1) 엔진이 없으면 그림판(canvas.fxo)이 없고 퍼즐은 예전 잎 효과(.pz-leaf)
#  2) 엔진이 있으면 퍼즐 줄을 지울 때 퍼즐 판 위 canvas.fxo(누르기 통과)에 깨진 조각이 생기고 예전 잎 효과는 나오지 않아요
#  3) 합치기에서 합치면 합치기 판으로 그림판이 옮겨 가고 빛 고리와 별 조각이 생겨요
#  4) 다 끝나면 조각이 사라지고 그리기를 멈춰요(raf 0). 얻는 값(pzPlace)은 엔진과 상관없이 같아요
#  5) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s173test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

ROOT = pathlib.Path(__file__).resolve().parent.parent
PIXI = (ROOT / 'img' / 'lib' / 'pixi.min.js').as_uri()
ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files']
FILL = f"""(() => {{ const F = {F}, cur = F.S.pz.cur, N = F.PZ.N; for (let j = 0; j < N * N; j++) cur.b[j] = 0; for (let j = 1; j < N; j++) cur.b[j] = 1 + (j % 4); cur.tray[0] = {{ c: [[0, 0]], k: 3 }}; }})()"""

async def run(b, pixi):
    s = base(tier=2, tg=5); s['q']['m'] = 150; s['q']['seen'] = 150
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;" + (("window.FS_IMG_BASE = %s;" % json.dumps((ROOT / 'img').as_uri() + '/')) + f"window.FS_PIXI_SRC = {json.dumps(PIXI)};" if pixi else ''))
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(s)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(4000); await pg.evaluate(CLEAN)
    await pg.evaluate(f"(() => {{ document.querySelectorAll('.overlay').forEach(o => o.hidden = true); {F}.rt4.modalOpen = null; {F}.pzOpen(); }})()")
    await pg.wait_for_timeout(1500)
    await pg.evaluate("document.querySelectorAll('.sheet').forEach(o => o.hidden = true)")
    await pg.evaluate(FILL); await pg.evaluate(f"{F}.pzOpen()"); await pg.wait_for_timeout(800)
    gain = await pg.evaluate(f"(() => {{ const F = {F}, r = F.pzPlace(F.S.pz.cur, 0, 0, 0); F.pzAfterPlaceT(r); return [r.n, r.gain]; }})()")
    await pg.wait_for_timeout(250)
    r = await pg.evaluate(f"""(() => {{ const c = document.querySelector('canvas.fxo'); return {{ cv: !!c, host: c ? c.parentElement.id : '', pe: c ? getComputedStyle(c).pointerEvents : '', parts: {F}.FXO.parts.length, leaf: document.querySelectorAll('.pz-leaf').length }}; }})()""")
    out = {'gain': gain, 'pz': r}
    await pg.wait_for_timeout(1500)
    out['pzEnd'] = await pg.evaluate(f"[{F}.FXO.parts.length, {F}.FXO.raf]")
    await pg.evaluate(f"{F}.pzClose && {F}.pzClose()"); await pg.wait_for_timeout(400)
    await pg.evaluate(f"(() => {{ document.querySelectorAll('.overlay').forEach(o => o.hidden = true); {F}.rt4.modalOpen = null; {F}.mgOpen(); }})()")
    await pg.wait_for_timeout(1200)
    await pg.evaluate(f"(() => {{ const F = {F}, c = F.mgCells(); c[20] = 'a3'; c[21] = 'a3'; F.mgSetCells(c); F.mgRenderBoardT(); F.mgDrop(20, 21); F.mgRenderBoardT(); }})()")
    await pg.wait_for_timeout(120)
    out['mg'] = await pg.evaluate(f"(() => {{ const c = document.querySelector('canvas.fxo'); return [c ? c.parentElement.id : '', {F}.FXO.parts.length, {F}.FXO.rings.length, {F}.mgCells()[21]]; }})()")
    out['errs'] = errs[:3]
    await ctx.close(); return out

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        a = await run(b, False); print('엔진 없음', a)
        c = await run(b, True); print('엔진 있음', c)
        if a['pz']['cv'] or a['pz']['leaf'] < 1: bad.append(f'엔진 없을 때 예전 잎 효과 {a["pz"]}')
        if not (c['pz']['cv'] and c['pz']['host'] == 'pzPop' and c['pz']['pe'] == 'none' and c['pz']['parts'] >= 8 and c['pz']['leaf'] == 0): bad.append(f'퍼즐 깨진 조각 {c["pz"]}')
        if c['pzEnd'] != [0, 0]: bad.append(f'퍼즐 효과가 끝나면 멈춤 {c["pzEnd"]}')
        if c['mg'][0] != 'mgGrid' or c['mg'][1] < 5 or c['mg'][2] < 1 or c['mg'][3] != 'a4': bad.append(f'합치기 빛 고리 {c["mg"]}')
        if a['gain'] != c['gain'] or a['gain'][0] != 1: bad.append(f'퍼즐 값이 다름 {a["gain"]} {c["gain"]}')
        bad += [f'(엔진 없음) {e}' for e in a['errs']] + [f'(엔진 있음) {e}' for e in c['errs']]
        await b.close()
    print('\n'.join(bad) if bad else 'PASS')

asyncio.run(main())
