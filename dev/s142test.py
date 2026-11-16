# 5.0.0 시험: 대학원이면 캠퍼스와 구역 다섯 곳이 대학원판 지도(map_*_grad[_테마])와 대학원판 참나무 층을 써요. 대학교는 그대로
# 쓰는 법: python3 wrap.py && python3 s142test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import base, ctxpage
bad = []
JS = """(async (th) => { const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms));
  document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; }); F.rt4.modalOpen = null; F.rt4.modalQueue.length = 0;
  window.FS_IMG_BASE = '../img/'; S.cos.th = Object.assign({}, S.cos.th, { bg: th });
  const out = [];
  for (const z of ['', 'academic', 'life', 'plaza', 'sports', 'lab']) {
    if (z) F.setZone(z, true); else F.setZone('', true);
    F.setMapArt(); F.layoutOak(); await sl(1500); F.layoutOak(); await sl(300);
    const el = [...document.querySelectorAll('.mapimg')].find(e => getComputedStyle(e).display !== 'none');
    const h = el ? el.getAttribute('href') : '', im = new Image(); im.src = h; await im.decode().catch(() => {});
    out.push({ z: z || 'campus', key: el && el.dataset.key, w: im.naturalWidth, oak: !!F.mapOak() });
  }
  return out; })"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tier, w, shot in ((5, 390, True), (4, 360, False)):
            sv = base(tier=tier, students=90)
            ctx, pg, errs = await ctxpage(b, w, 800, 'light', sv)
            await pg.wait_for_timeout(1200)
            for th in ('', 'winter', 'space'):
                r = await pg.evaluate(JS, th)
                print(tier, th or 'base', [(x['z'], x['key'], x['w'], x['oak']) for x in r])
                for x in r:
                    want = ('map_campus' if x['z'] == 'campus' else 'map_zone_' + x['z']) + ('_grad' if tier >= 5 else '') + ('_' + th if th else '')
                    if tier == 4 and x['z'] == 'lab': continue
                    if x['key'] != want: bad.append(f"{tier} {th} {x['z']} 지도 {x['key']} (바라는 것 {want})")
                    if x['w'] != 1024: bad.append(f"{tier} {th} {x['z']} 지도를 못 받음")
                    if x['z'] != 'campus' and not x['oak']: bad.append(f"{tier} {th} {x['z']} 참나무 층 없음")
                if shot and th in ('', 'space'):
                    await pg.evaluate("window.__forest.setZone('', true)"); await pg.wait_for_timeout(1500)
                    await pg.screenshot(path=f'/tmp/s142_{th or "base"}_campus.png')
                    await pg.evaluate("window.__forest.setZone('academic', true)"); await pg.wait_for_timeout(1500)
                    await pg.screenshot(path=f'/tmp/s142_{th or "base"}_academic.png')
            if errs: bad.append(f'페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('FAIL' if bad else 'PASS', *bad, sep='\n')
asyncio.run(main())
