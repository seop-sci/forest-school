# 4.4.1 학생 걷는 길: 건물 그림(모두 지은 모습)이 실제로 덮는 자리를 시험 페이지에서 그려 paths/bld_<지도 줄>.png(360x540, 1칸 = 1px, y는 -60부터)로 저장해요.
# 학생 그림은 건물 위에 그려져서, 건물 그림이 덮는 곳(지붕 뒤쪽 길 포함)은 걷지 않아요. gen.py가 이 그림을 읽어요
import asyncio, base64, pathlib, sys, os
HERE = pathlib.Path(__file__).resolve().parent; os.chdir(HERE.parent); sys.path.insert(0, str(HERE.parent))
from playwright.async_api import async_playwright
from s4test import base, ctxpage
F = dict(classroom=30, cafeteria=30, library=30, playground=30, science=30, store=30, dorm=30, union=30)
JS = """async () => { const Fz = window.__forest, gi = Fz.GEO.indexOf(Fz.geo()), L = document.querySelector('#kids'), inv = L.getCTM().inverse();
  const c = document.createElement('canvas'); c.width = 360; c.height = 540; const x = c.getContext('2d');
  const ims = [...document.querySelectorAll('g.bld[id^=b-] image, g#b-next image')].filter(i => { let e = i; while (e && e !== document) { if (getComputedStyle(e).display === 'none' || getComputedStyle(e).visibility === 'hidden') return false; e = e.parentElement; } return true; });
  for (const i of ims) { const u = i.href.baseVal; if (!u) continue; const im = new Image(); im.src = u; await im.decode().catch(() => {}); if (!im.naturalWidth) continue;
    const m = inv.multiply(i.getCTM()), w = +i.getAttribute('width'), h = +i.getAttribute('height'), ix = +i.getAttribute('x') || 0, iy = +i.getAttribute('y') || 0;
    x.setTransform(m.a, m.b, m.c, m.d, m.e, m.f + 60); x.drawImage(im, ix, iy, w, h); }
  return [gi, c.toDataURL('image/png'), ims.length]; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for t, z in [(0, ''), (1, ''), (2, ''), (3, ''), (4, 'academic'), (4, 'life'), (4, 'plaza'), (4, 'sports')]:
            ctx, pg, e = await ctxpage(b, 390, 844, 'light', base(tier=t, zone=z, students=60, f=F))
            await pg.wait_for_timeout(800)
            gi, url, n = await pg.evaluate(JS)
            (HERE / f'bld_{gi}.png').write_bytes(base64.b64decode(url.split(',')[1])); print(t, z, gi, n, e[:2])
            await ctx.close()
        await b.close()
asyncio.run(main())
