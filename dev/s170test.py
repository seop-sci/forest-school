# 5.3.0 시험: 학교 행사 효과층(src/js/40b-fx-layer.js의 FXE)
# 보는 것
#  1) 엔진이 없어도(시험판 기본) 행사를 눌러 얻는 값과 개수가 예전 그대로이고 오류가 없어요
#  2) 엔진이 있으면 행사 물건을 누를 때 효과 조각이 생기고, 얻는 값은 엔진이 없을 때와 같아요
#  3) 운동회 공 넣기, 청팀 점수 효과가 나오고 값은 그대로예요
#  4) 행사가 끝나면 학생 몸(기울기, 점프, 찌그러짐)이 원래대로 돌아오고, 효과가 끝나면 그리기를 멈춰요(raf 0)
#  5) 불꽃(fxeFirework)이 조각을 만들고 사라져요
# 쓰는 법: python3 wrap.py && python3 s170test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

PIXI = (pathlib.Path(__file__).resolve().parent.parent / 'img' / 'lib' / 'pixi.min.js').as_uri()
ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
HIT = "(() => { const it = [...document.querySelectorAll('.fest-item')].pop(); if (!it) return null; const a = %s.S.budget, n = %s.rt4.fest.n; it.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); return [%s.S.budget - a, %s.rt4.fest.n - n]; })()" % (F, F, F, F)

async def open_page(b, pixi):
    save = base(tier=1, tg=5); save['q']['m'] = 120; save['q']['seen'] = 120
    save['gfx'] = 1   # 5.3.2: 그래픽 낮음이면 엔진을 받지 않아요(이 기계는 코어 2개라 자동이 낮음)
    save['f']['playground'] = max(save['f'].get('playground', 8), 8)
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;" + (f"window.FS_PIXI_SRC = {json.dumps(PIXI)};" if pixi else ''))
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' and 'ERR_FILE_NOT_FOUND' not in m.text and 'ERR_TUNNEL' not in m.text else None)
    await pg.goto(URL); await pg.wait_for_timeout(3600); await pg.evaluate(CLEAN)
    await pg.evaluate(f"(() => {{ const d = new Date(); d.setUTCHours(3, 0, 0, 0); {F}.rt4.fakeNow = d.getTime(); }})()")   # 낮 12시(한국)
    await pg.evaluate("document.querySelectorAll('.overlay').forEach(o => o.hidden = true)")
    return ctx, pg, errs

async def fest_run(pg, fid):
    await pg.evaluate(f"(() => {{ {F}.rt4.modalOpen = null; {F}.startFest('{fid}', true); }})()")
    await pg.wait_for_timeout(3200)
    got = []
    for _ in range(8):
        r = await pg.evaluate(HIT)
        if r: got.append(r)
        await pg.wait_for_timeout(250)
    return got

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        res = {}
        for pixi in (False, True):
            ctx, pg, errs = await open_page(b, pixi)
            st = await pg.evaluate(f"{F}.FXL.st")
            if (st == 'ok') != pixi: bad.append(f'엔진 상태 {pixi} {st}')
            got = await fest_run(pg, 'welcome')
            parts = await pg.evaluate(f"{F}.FXL.parts.length")
            print('엔진' if pixi else '엔진 없음', '누름', got[:3], '조각', parts)
            got = [g for g in got if g[1]]   # 사라지는 중인 물건을 누르면 0이에요(예전과 같아요)
            if len(got) < 2 or any(n != 1 for _, n in got): bad.append(f'행사 누르기 개수 {pixi} {got}')
            res[pixi] = [v for v, _ in got]
            if pixi and parts < 3: bad.append(f'엔진 있을 때 효과 조각 {parts}')
            if not pixi and parts: bad.append(f'엔진 없을 때 조각이 생김 {parts}')
            # 행사 끝내기
            await pg.evaluate(f"(() => {{ const R = {F}.rt4.fest; R.n = 99; R.t = 0.05; }})()")
            for _ in range(40):
                await pg.wait_for_timeout(300)
                if not await pg.evaluate(f"!!{F}.rt4.fest"): break
            r = await pg.evaluate(f"(() => ({{ fest: !!{F}.rt4.fest, body: {F}.rt4.kids.filter(k => (k.lean || 0) || (k.jY || 0) || (k.sq || 0)).length, beams: !!{F}.FXE.beams }}))()")
            print('행사 끝', r)
            if r['fest'] or r['body'] or r['beams']: bad.append(f'행사 끝나면 원래대로 {pixi} {r}')
            await pg.evaluate("document.querySelectorAll('.overlay').forEach(o => o.hidden = true)")
            if pixi:
                # 운동회
                await pg.evaluate(f"(() => {{ {F}.rt4.modalOpen = null; {F}.startSports(true); }})()")
                for _ in range(20):
                    if await pg.evaluate("!!document.querySelector('.drop')"): break
                    await pg.wait_for_timeout(300)
                print('운동회 시작', await pg.evaluate(f"[!!{F}.rt4.sports, {F}.S.sports && {F}.S.sports.next, {F}.gameNow()]"))
                r = await pg.evaluate(f"(() => {{ const d = document.querySelector('.drop'); if (!d) return null; const v = {F}.dropValue(), a = {F}.S.budget; d.dispatchEvent(new MouseEvent('click', {{ bubbles: true }})); return {{ ok: !!{F}.rt4.sports, parts: {F}.FXL.parts.length, d: {F}.S.budget - a, v }}; }})()")
                print('운동회', r)
                if not r or not r['ok']: bad.append(f'운동회가 열리지 않음 {r}')
                elif r['parts'] < 3: bad.append(f'운동회 청팀 효과 {r}')
                await pg.evaluate(f"(() => {{ const R = {F}.rt4.sports; if (R) R.t = 0.05; }})()")
                for _ in range(40):   # 기기가 바쁘면 끝나기까지 오래 걸려요
                    await pg.wait_for_timeout(300)
                    if not await pg.evaluate(f"!!{F}.rt4.sports"): break
                r = await pg.evaluate(f"(() => ({{ sp: !!{F}.rt4.sports, body: {F}.rt4.kids.filter(k => (k.lean || 0) || (k.jY || 0) || (k.sq || 0)).length }}))()")
                print('운동회 끝', r)
                if r['body']: bad.append(f'운동회 끝나면 몸 원래대로 {r}')
                # 불꽃
                n = await pg.evaluate(f"(() => {{ {F}.fxeFirework(180, 200); return {F}.FXL.parts.length; }})()")
                print('불꽃 조각', n)
                if n < 10: bad.append(f'불꽃 조각 {n}')
                for _ in range(40):
                    await pg.wait_for_timeout(300)
                    if not await pg.evaluate(f"{F}.FXL.parts.length + {F}.FXL.falls.length + {F}.FXL.flys.length"): break
                await pg.wait_for_timeout(200)
                r = await pg.evaluate(f"(() => ({{ parts: {F}.FXL.parts.length, raf: {F}.FXL.raf }}))()")
                print('멈춤', r)
                if r != {'parts': 0, 'raf': 0}: bad.append(f'효과가 끝나면 그리기 멈춤 {r}')
            bad += [f'({"엔진" if pixi else "엔진 없음"}) {e}' for e in errs[:3]]
            await ctx.close()
        a, c = res.get(False, []), res.get(True, [])
        if a and c and abs(a[0] - c[0]) > 1e-6 * max(1, a[0]): bad.append(f'얻는 값이 다름 {a[0]} {c[0]}')
        await b.close()
    print('\n'.join(bad) if bad else 'PASS')

asyncio.run(main())
