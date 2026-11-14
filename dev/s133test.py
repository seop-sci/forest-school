# 133번 시험(4.3.2): 앱(안드로이드, 토스)은 테마 지도와 테마 참나무 층을 웹에서 받아요
# 1) 앱 판에서는 테마 지도 주소가 GitHub Pages, 기본 지도와 고급 지도는 앱 안(img/)
# 2) 웹 판은 모두 img/  3) 앱 묶음(www, dist)에 테마 지도 파일이 없어요(만들어 둔 경우만 봐요)
import asyncio, pathlib, re
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for store in (True, False):
            ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=1, tg=0))
            if store:
                await ctx.add_init_script("window.FOREST_STORE = true;")
                await page.reload(); await page.wait_for_timeout(1200)
            r = await page.evaluate(f"(()=>{{ const F={F}; return ['map_elem_spring','map_elem','map_elem_lux','map_zone_life_xmas'].map(F.mapUrl); }})()")
            print('앱' if store else '웹', r)
            web = 'https://seop-sci.github.io/forest-school/img/maps/'
            if store:
                ok(r[0].startswith(web) and r[3].startswith(web), '앱의 테마 지도는 웹에서')
                ok(r[1].startswith('img/maps/') and r[2].startswith('img/maps/'), '앱의 기본 지도와 고급 지도는 앱 안에서')
            else:
                ok(all(u.startswith('img/maps/') for u in r), '웹은 모두 img/')
            ok(not errs, f'오류 없음 {errs[:2]}')
            await ctx.close()
        await b.close()
    th = re.compile(r'_(spring|summer|autumn|winter|xmas|space|retro)\.webp$')
    for d in (ROOT / 'app' / 'www' / 'img' / 'maps', ROOT / 'toss' / 'dist' / 'img' / 'maps'):
        if d.exists():
            n = [f.name for f in d.iterdir() if th.search(f.name)]
            print(d, len(list(d.iterdir())), '테마', len(n))
            ok(not n and (d / 'map_elem.webp').exists(), f'{d.parent.parent.name} 묶음에 테마 지도가 없고 기본 지도는 있어요')
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
