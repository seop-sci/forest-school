# 5.1.1.2 시험: 참나무를 흔들어 떨어진 도토리가 '건물 n채 올리기' 같은 지도 위 단추 밑에 오지 않는지 (360px, 390px)
# 쓰는 법: python3 wrap.py && python3 s163test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, tier, z in ((360, 800, 0, 1), (390, 844, 1, 1), (390, 844, 0, 1), (390, 900, 0, 1), (390, 844, 0, 1.6), (360, 740, 1, 1.8)):
            sv = base(tier=tier, students=40)
            ctx, pg, errs = await ctxpage(b, w, h, 'light', sv)
            await pg.wait_for_timeout(1500)
            await pg.evaluate(CLEAN)
            r = await pg.evaluate(("""(async()=>{ const F = window.__forest, S = F.S, R = F.rt4, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
              S.budget = 1e30; F.renderHUD(); await sl(1500);
              if (%s > 1) { const o = document.querySelector('#upChip').getBoundingClientRect(); F.zoomAt(%s, o.left + o.width / 2, o.top); await sl(1800); } const c = document.querySelector('#upChip'); out.shown = !c.hidden;
              const cr = c.getBoundingClientRect(); out.chip = [cr.left, cr.top, cr.right, cr.bottom].map(Math.round);
              let hit = 0, n = 0;
              for (let t = 0; t < 40; t++) { R.drops.forEach(d => d.g.remove()); R.drops.length = 0; F.spawnDrop(true); await sl(20);
                const d = R.drops[R.drops.length - 1]; if (!d) continue; n++;
                const q = d.g.querySelector('.drop-ring').getBoundingClientRect(), x = (q.left + q.right) / 2, y = (q.top + q.bottom) / 2;
                const fr = document.querySelector('.frame').getBoundingClientRect();
                const bs = [...document.querySelectorAll('.frame button, .frame [role="button"]')].filter(e => !e.hidden && e.offsetWidth && !e.closest('svg') && !e.closest('[hidden]')).map(e => e.getBoundingClientRect()).filter(r => r.width && r.bottom > fr.top && r.top < fr.bottom);
                if (bs.some(r => x > r.left - 4 && x < r.right + 4 && y > r.top - 4 && y < r.bottom + 4)) { hit++; out.at = [Math.round(x), Math.round(y)]; } }
              out.n = n; out.hit = hit; return out; })()""") % (z, z))
            print(w, tier, z, r)
            await pg.screenshot(path=f's163_{w}_{tier}_{z}.png')
            c.ok(r['shown'] and r['chip'][2] > 0 and r['n'] >= 30 and r['hit'] == 0, f'{w}px 도토리가 단추 밑에 오지 않아요 {r}')
            c.ok(not errs, f'{w}px 오류 {errs[:2]}')
            await ctx.close()
asyncio.run(main())
c.done()
