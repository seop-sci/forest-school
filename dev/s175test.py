# 5.3.1 시험: 마을 층(src/js/40c-world.js)과 함께 넣은 것들
# 보는 것
#  1) 그래픽 품질: 옛 저장은 자동(-1), 설정 단추 셋이 지금 단계와 맞고, 누르면 저장돼요. 낮음이면 마을 층이 멈춰요
#  2) 하루의 빛 막(.wld-tint)이 시각에 맞고, 비와 눈은 그날 게임 날씨(wxOf)를 따라요. 날씨 효과를 끄면(S.wxOff) 맑음
#  3) 엔진이 있으면 비 오는 날 빗방울과 빗소리(rt.ambWx), 예전 CSS 비는 숨겨요(.frame.wld-on)
#  4) 사진 모드: 글과 단추가 숨고 시간과 날씨를 고를 수 있고, 닫으면 돌아와요. 다른 탭으로 가면 저절로 닫혀요
#  5) 학생 뒷모습: 위로 걷는 학생은 chb_ 그림, 멈추면 앞모습
#  6) 학교급 구름 막(wldCurtain)이 잠깐 떴다 사라져요
#  7) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s175test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

ROOT = pathlib.Path(__file__).resolve().parent.parent
PIXI = (ROOT / 'img' / 'lib' / 'pixi.min.js').as_uri()
ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files']

async def open_page(b, save, pixi):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;" + (("window.FS_IMG_BASE = %s;" % json.dumps((ROOT / 'img').as_uri() + '/')) + f"window.FS_PIXI_SRC = {json.dumps(PIXI)};" if pixi else ''))
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(4200 if pixi else 3000); await pg.evaluate(CLEAN)
    return ctx, pg, errs

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        # 엔진 없음: 저장, 설정, 빛 막, 날씨, 사진 모드, 뒷모습
        s = base(tier=1); s.pop('gfx', None)
        ctx, pg, errs = await open_page(b, s, False)
        r = await pg.evaluate(f"[{F}.S.gfx, {F}.sanitize(Object.assign(JSON.parse(JSON.stringify({F}.S)), {{ gfx: 2 }})).gfx, {F}.sanitize(Object.assign(JSON.parse(JSON.stringify({F}.S)), {{ gfx: 9 }})).gfx]")
        if r != [-1, 2, -1]: bad.append(f'그래픽 저장 {r}')
        await pg.evaluate(f"{F}.setTab('settings')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate(f"(() => {{ const on = [...document.querySelectorAll('#optGfx [data-gfx]')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => +b.dataset.gfx); return [on, {F}.wldLv()]; }})()")
        if len(r[0]) != 1 or r[0][0] != r[1]: bad.append(f'그래픽 단추 표시 {r}')
        await pg.click('#optGfx [data-gfx="1"]')
        r = await pg.evaluate(f"[{F}.S.gfx, JSON.parse(localStorage.getItem('forest-school-v1')).gfx]")
        if r != [1, 1]: bad.append(f'그래픽 보통 누름 {r}')
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate(f"(() => {{ const t = document.querySelector('.wld-tint'); return [!!t, t && t.className, {F}.wldPhase(), {F}.wxOf(), {F}.wldWeather()]; }})()")
        print('빛 막', r)
        wx = r[3] if r[3] in ('rain', 'snow') else ''
        if not r[0] or ('ph-' + r[2]) not in r[1] or r[4] != wx: bad.append(f'빛 막과 날씨 {r}')
        r = await pg.evaluate(f"(() => {{ const S = {F}.S, o = S.wxOff; S.wxOff = true; const w = {F}.wldWeather(); S.wxOff = o; return w; }})()")
        if r != '': bad.append(f'날씨 효과 끔인데 {r}')
        # 사진 모드
        await pg.evaluate(f"{F}.setTab('settings')"); await pg.wait_for_timeout(200)
        await pg.click('#optPhoto'); await pg.wait_for_timeout(500)
        r = await pg.evaluate(f"(() => ({{ photo: {F}.rt4.photo, tab: {F}.rt4.tab, bar: !!document.querySelector('#photoBar'), tabs: getComputedStyle(document.querySelector('.tabs')).visibility, board: getComputedStyle(document.querySelector('.board')).visibility }}))()")
        print('사진 모드', r)
        if r != {'photo': True, 'tab': 'school', 'bar': True, 'tabs': 'hidden', 'board': 'hidden'}: bad.append(f'사진 모드 열기 {r}')
        await pg.click('#phT [data-pht="night"]'); await pg.click('#phW [data-phw="snow"]'); await pg.wait_for_timeout(200)
        r = await pg.evaluate(f"[document.querySelector('.wld-tint').className, {F}.rt4.ambWx]")
        if 'ph-night' not in r[0] or 'wx-snow' not in r[0] or r[1] != 'snow': bad.append(f'사진 모드 시간과 날씨 {r}')
        await pg.click('#phX'); await pg.wait_for_timeout(300)
        r = await pg.evaluate(f"[{F}.rt4.photo, document.body.classList.contains('photo'), !!document.querySelector('#photoBar'), {F}.rt4.wldWx === undefined]")
        if r != [False, False, False, True]: bad.append(f'사진 모드 닫기 {r}')
        await pg.evaluate(f"{F}.photoOpen()"); await pg.evaluate(f"{F}.setTab('teachers')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate(f"[{F}.rt4.photo, document.body.classList.contains('photo')]")
        if r != [False, False]: bad.append(f'다른 탭으로 가면 사진 모드 닫힘 {r}')
        await pg.evaluate(f"{F}.setTab('school')")
        # 학생 뒷모습
        best = 0
        for i in range(25):
            n = await pg.evaluate(f"{F}.rt4.kids.filter(k => k.back && k.im && k.im.getAttribute('href') === {F}.IMG('chb_' + (k.rare ? k.sp + '_rare' : k.sp))).length")
            best = max(best, n)
            if best: break
            await pg.wait_for_timeout(300)
        r = await pg.evaluate(f"{F}.rt4.kids.filter(k => !k.moving && k.back).length")
        print('뒷모습', best, '멈췄는데 뒷모습', r)
        if not best: bad.append('위로 걷는 학생의 뒷모습이 없어요')
        if r: bad.append(f'멈춘 학생 {r}명이 뒷모습')
        # 구름 막
        await pg.evaluate(f"{F}.wldCurtain()"); await pg.wait_for_timeout(200)
        a = await pg.evaluate("document.querySelectorAll('.wld-cur img').length")
        await pg.wait_for_timeout(3100)
        c = await pg.evaluate("document.querySelectorAll('.wld-cur').length")
        if a != 3 or c != 0: bad.append(f'구름 막 {a} {c}')
        bad += [f'(엔진 없음) {e}' for e in errs[:3]]; await ctx.close()
        # 엔진 있음: 비
        s = base(tier=1); s['gfx'] = 2
        ctx, pg, errs = await open_page(b, s, True)
        await pg.evaluate(f"(() => {{ {F}.rt4.wldWx = 'rain'; {F}.rt4.wldPh = 'day'; {F}.wldSync(); }})()"); await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"(() => ({{ st: {F}.WLD.st, rain: {F}.WLD.parts.filter(p => p.kind === 'rain').length, amb: {F}.rt4.ambWx, on: document.querySelector('.frame').classList.contains('wld-on') }}))()")
        print('비', r)
        if r['st'] != 'ok' or r['rain'] < 40 or r['amb'] != 'rain' or not r['on']: bad.append(f'엔진 비 {r}')
        await pg.evaluate(f"(() => {{ {F}.S.gfx = 0; {F}.wldSync(); }})()"); await pg.wait_for_timeout(300)
        r = await pg.evaluate(f"[{F}.WLD.parts.length, document.querySelector('.frame').classList.contains('wld-on'), document.querySelector('.wld-tint').className]")
        if r[0] or r[1] or 'ph-' in r[2]: bad.append(f'낮음이면 멈춤 {r}')
        bad += [f'(엔진 있음) {e}' for e in errs[:3]]; await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else '')
    print('FAIL' if bad else 'PASS')

asyncio.run(main())
