# 5.2.1 시험: 효과층(PixiJS, src/js/40b-fx-layer.js)
# 보는 것
#  1) 엔진 파일을 못 받으면(시험판 기본) 효과층이 꺼지고 예전 참나무 흔들기(.shake)와 도토리 줍기가 그대로
#  2) 엔진이 있으면 지도 바로 뒤에 canvas.fxl(누르기 통과)이 생기고, 참나무를 누르면 용수철 흔들림(가로 띠마다 위쪽일수록 많이 휘어요, 밑동 띠는 그대로), 잎, 떨어지는 도토리(그동안 SVG 도토리 숨김)
#  3) 도토리가 다 떨어지면 SVG 도토리가 다시 보이고, 주우면 값은 예전과 같고 날아가는 도토리가 끝나면 그리기를 멈춰요(raf 0)
#  4) 학교 탭을 떠나면 효과를 지우고, '움직임 줄이기'면 효과층을 켜지 않아요
#  5) 페이지 오류 없음
#  6) 5.3.0.2 겨울 테마면 잎 대신 흰 눈가루
# 쓰는 법: python3 wrap.py && python3 s168test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

PIXI = (pathlib.Path(__file__).resolve().parent.parent / 'img' / 'lib' / 'pixi.min.js').as_uri()
ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
TAP = "document.querySelector('#oak').dispatchEvent(new MouseEvent('click',{bubbles:true}))"

async def open_page(b, pixi, reduced=False):
    save = base(tier=1); save['q']['m'] = 120; save['q']['seen'] = 120; save['oak'] = 8
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True, reduced_motion='reduce' if reduced else 'no-preference')
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
        await pg.evaluate(TAP); await pg.wait_for_timeout(80)
        r = await pg.evaluate(f"""(() => ({{ st: {F}.FXL.st, on: {F}.fxOn(), cv: !!document.querySelector('canvas.fxl'), shake: document.querySelector('#oakCanopy').classList.contains('shake'), drops: {F}.rt.drops.length }}))()""")
        print('엔진 없음', r)
        if r['st'] != 'no' or r['on'] or r['cv'] or not r['shake'] or r['drops'] != 1: bad.append(f'엔진 없을 때 예전 그대로 {r}')
        await pg.wait_for_timeout(800)
        v, b0, b1 = await pg.evaluate(f"(() => {{ const v = {F}.dropValue(), a = {F}.S.budget; document.querySelector('.drop').dispatchEvent(new MouseEvent('click', {{ bubbles: true }})); return [v, a, {F}.S.budget]; }})()")
        if abs((b1 - b0) - v) > 1e-6 * max(1, v): bad.append(f'엔진 없을 때 줍는 값 {b1 - b0} != {v}')
        bad += [f'(엔진 없음) {e}' for e in errs[:3]]; await ctx.close()
        # 2), 3), 4) 엔진 있음
        ctx, pg, errs = await open_page(b, True)
        r = await pg.evaluate(f"""(() => {{ const c = document.querySelector('canvas.fxl'); return {{ st: {F}.FXL.st, on: {F}.fxOn(), cv: !!c, after: !!c && c.previousElementSibling === document.querySelector('#map'), pe: c ? getComputedStyle(c).pointerEvents : '' }}; }})()""")
        print('엔진 있음', r)
        if r != {'st': 'ok', 'on': True, 'cv': True, 'after': True, 'pe': 'none'}: bad.append(f'효과층 켜기 {r}')
        await pg.evaluate(TAP); await pg.wait_for_timeout(90)
        r = await pg.evaluate(f"""(() => ({{ tr: (u => (u.length ? (u[0].getAttribute('transform') || '') + '/' + (u[u.length - 1].getAttribute('transform') || '') : 'X'))([...document.querySelectorAll('#oakBandG > use')]), shake: document.querySelector('#oakCanopy').classList.contains('shake'), falls: {F}.FXL.falls.length, leaves: {F}.FXL.parts.length, drops: {F}.rt.drops.length, hid: document.querySelector('.drop .drop-fall').style.opacity }}))()""")
        print('누른 뒤', r)
        if not r['tr'].startswith('translate(') or not r['tr'].endswith('/') or r['shake'] or r['falls'] != 1 or r['leaves'] < 6 or r['drops'] != 1 or r['hid'] != '0': bad.append(f'흔들림과 떨어지기 {r}')
        await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"""(() => ({{ falls: {F}.FXL.falls.length, hid: document.querySelector('.drop .drop-fall').style.opacity, tr: (u => (u.length ? (u[0].getAttribute('transform') || '') + '/' + (u[u.length - 1].getAttribute('transform') || '') : 'X'))([...document.querySelectorAll('#oakBandG > use')]) }}))()""")
        print('떨어진 뒤', r)
        if r['falls'] or r['hid'] != '' or r['tr'] != '/': bad.append(f'다 떨어지면 SVG 도토리 보이기와 흔들림 멈춤 {r}')
        v, b0, b1 = await pg.evaluate(f"(() => {{ const v = {F}.dropValue(), a = {F}.S.budget; document.querySelector('.drop').dispatchEvent(new MouseEvent('click', {{ bubbles: true }})); return [v, a, {F}.S.budget]; }})()")
        r = await pg.evaluate(f"(() => ({{ flys: {F}.FXL.flys.length, sparks: {F}.FXL.parts.length }}))()")
        print('주운 뒤', r)
        if r['flys'] != 1 or r['sparks'] < 5: bad.append(f'줍기 날아가기 {r}')
        if abs((b1 - b0) - v) > 1e-6 * max(1, v): bad.append(f'엔진 있을 때 줍는 값 {b1 - b0} != {v}')
        await pg.wait_for_timeout(2000)
        r = await pg.evaluate(f"(() => ({{ flys: {F}.FXL.flys.length, parts: {F}.FXL.parts.length, raf: {F}.FXL.raf }}))()")
        if r != {'flys': 0, 'parts': 0, 'raf': 0}: bad.append(f'효과가 끝나면 그리기 멈춤 {r}')
        # 학교 탭을 떠나면 지워요
        await pg.evaluate(TAP); await pg.wait_for_timeout(60)
        await pg.evaluate(f"{F}.setTab('teachers')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate(f"(() => ({{ falls: {F}.FXL.falls.length, parts: {F}.FXL.parts.length, tr: (u => (u.length ? (u[0].getAttribute('transform') || '') + '/' + (u[u.length - 1].getAttribute('transform') || '') : 'X'))([...document.querySelectorAll('#oakBandG > use')]), op: [...document.querySelectorAll('.drop .drop-fall')].map(e => e.style.opacity) }}))()")
        print('탭 떠남', r)
        if r['falls'] or r['parts'] or r['tr'] != '/' or any(o for o in r['op']): bad.append(f'탭을 떠나면 지우기 {r}')
        # 5.3.0.2 겨울 테마: 잎 대신 흰 눈가루 다섯 알
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(300)
        await pg.evaluate(f"(() => {{ const F = {F}; F.S.cos.th.bg = 'winter'; F.applyThemes(); }})()"); await pg.wait_for_timeout(1500)
        for _ in range(30):
            if not await pg.evaluate(f"{F}.FXL.parts.length"): break
            await pg.wait_for_timeout(200)
        await pg.evaluate(TAP); await pg.wait_for_timeout(60)
        r = await pg.evaluate(f"(() => {{ const P = {F}.FXL.parts; return {{ n: P.filter(q => q.s.tint === 0xffffff).length, green: P.filter(q => q.s.texture === {F}.FXL.tex.fx_leaf_1 || q.s.texture === {F}.FXL.tex.fx_leaf_2).length }}; }})()")   # 떨어진 도토리 먼지는 빼고 세요
        print('겨울', r)
        if r != {'n': 5, 'green': 0}: bad.append(f'겨울 테마는 잎 대신 눈가루 {r}')
        bad += [f'(엔진 있음) {e}' for e in errs[:3]]; await ctx.close()
        # 움직임 줄이기
        ctx, pg, errs = await open_page(b, True, reduced=True)
        r = await pg.evaluate(f"(() => ({{ st: {F}.FXL.st, cv: !!document.querySelector('canvas.fxl') }}))()")
        print('움직임 줄이기', r)
        if r['st'] == 'ok' or r['cv']: bad.append(f'움직임 줄이기면 끄기 {r}')
        bad += [f'(움직임 줄이기) {e}' for e in errs[:3]]; await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else 'PASS')

asyncio.run(main())
