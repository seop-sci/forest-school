# 2.1.0 시험: 점검 모드(live.json의 maint)
# 보는 것
#  1) 인터넷에서 받은 maint가 있으면 덮개가 떠요(제목, 문구, 끝나는 때). 이 기기에 남긴 것(cache)으로는 뜨지 않아요
#  2) maint가 빠진 live.json을 받으면 덮개가 닫히고 '점검이 끝났어요' 알림. 빈 문구는 점검이 아니에요
#  3) 제목을 3초 안에 다섯 번 누르면 이번만 들어가요. 이 기기에 남기는 live 정리본(Live.clean)에는 maint가 없어요
#  4) 390, 360에서 덮개가 화면을 넘치지 않아요(캡처 s79_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s79test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'
J = "{ v: 2, notices: [], cfg: {}, off: [], maint: { title: '서버 점검', msg: '더 좋은 학교를 위해 점검하고 있어요.', until: '11월 6일 새벽 3시' } }"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(T.SKIP)
            r = await pg.evaluate(f"(() => {{ const F = {F}; F.liveApply({J}, 'cache'); return document.querySelector('#maint').hidden; }})()")
            if r is not True: bad.append(f'{w} 남긴 것으로 점검이 떴어요')
            r = await pg.evaluate(f"""(() => {{ const F = {F}; F.liveApply({J}, 'net'); const el = document.querySelector('#maint');
              return {{ hid: el.hidden, t: document.querySelector('#maintTitle').textContent, m: document.querySelector('#maintMsg').textContent, u: document.querySelector('#maintUntil').textContent, clean: 'maint' in F.Live.clean }}; }})()""")
            print(w, '점검', r)
            if r['hid'] or r['t'] != '서버 점검' or '점검하고' not in r['m'] or '새벽 3시' not in r['u'] or r['clean']: bad.append(f'{w} 점검 덮개가 틀려요 {r}')
            o = await pg.evaluate("(() => { const r = document.querySelector('#maint .maint-card').getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1; })()")
            if o: bad.append(f'{w} 점검 덮개가 넘쳐요')
            await pg.screenshot(path=f's79_{w}.png')
            r = await pg.evaluate(f"""(() => {{ const F = {F}; F.liveApply({{ v: 3, maint: {{ msg: '   ' }} }}, 'net'); return {{ hid: document.querySelector('#maint').hidden, toast: document.querySelector('#toast').textContent }}; }})()""")
            if not r['hid'] or '점검이 끝났어요' not in r['toast']: bad.append(f'{w} 점검 끝이 틀려요 {r}')
            if w == 390:
                r = await pg.evaluate(f"""(() => {{ const F = {F}; F.liveApply({J}, 'net'); const a = document.querySelector('#maint').hidden;
                  for (let i = 0; i < 5; i++) F.maintTap(); const b2 = document.querySelector('#maint').hidden; F.liveApply({J}, 'net'); const c = document.querySelector('#maint').hidden; return [a, b2, c]; }})()""")
                if r != [False, True, True]: bad.append(f'관리자 통과가 틀려요 {r}')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
