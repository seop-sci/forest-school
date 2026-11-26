# 195번 시험(2026-11-26): 구글 애즈 앱 전환 이벤트(안드로이드 판 window.FOREST_TRACK)
# 1) 가짜 FOREST_TRACK이 있으면: 처음 찾은 생물만 creature_found(이름, 열쇠, 몇 종째), 다시 찾은 생물은 보내지 않아요
# 2) 튜토리얼을 끝까지 보고 처음 보상을 받을 때 tutorial_complete(한 번만)
# 3) FOREST_TRACK이 없는 판(웹, 토스)에서도 같은 동작에 오류가 나지 않아요
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN
c = Checker()
RUN = """async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
  const ids = F.BIO.map(b => b.id);
  S.bx.got = {}; S.bx.g = 0;
  S.bx.sp = [{ i: 1, id: ids[0], t: 0 }]; F.bxTap(1); await sl(100);
  S.bx.sp = [{ i: 2, id: ids[0], t: 0 }]; F.bxTap(2); await sl(100);
  S.bx.sp = [{ i: 3, id: ids[1], t: 0 }]; F.bxTap(3); await sl(100);
  document.querySelectorAll('.overlay').forEach(x => { x.hidden = true; x.classList.remove('open'); }); F.rt.modalOpen = null; F.rt.modalQueue.length = 0;
  S.tut.paid = false; S.tut.nop = false; F.tutStart(2); await sl(200); document.querySelector('#tutNext').click(); await sl(200);
  o.paid = S.tut.paid; o.name0 = F.BIO[0].nm;
  return o; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 1), 2) 가짜 FOREST_TRACK
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=1, students=110))
        await pg.evaluate("window.__fa = []; window.FOREST_TRACK = (n, p, once) => window.__fa.push([n, p || {}, once])")
        await pg.wait_for_timeout(1300); await pg.evaluate(CLEAN)
        o = await pg.evaluate(RUN); ev = await pg.evaluate("window.__fa")
        cf = [e for e in ev if e[0] == 'creature_found']
        c.ok(len(cf) == 2, f'creature_found는 새 생물 두 번만: {cf}')
        if cf:
            c.ok(cf[0][1].get('creature_name') == o['name0'] and cf[0][1].get('dex_count') == 1 and not str(cf[0][1].get('creature_id', '')).startswith('bio_'), f'파라미터: {cf[0]}')
            c.ok(cf[1][1].get('dex_count') == 2, f'두 번째는 2종째: {cf[1]}')
        tc = [e for e in ev if e[0] == 'tutorial_complete']
        c.ok(o['paid'] and len(tc) == 1 and tc[0][2] is True, f'tutorial_complete 한 번(once): {tc}, paid={o["paid"]}')
        c.ok(not errs, f'오류: {errs[:3]}')
        await ctx.close()
        # 3) FOREST_TRACK 없음
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=1, students=110))
        await pg.wait_for_timeout(1300); await pg.evaluate(CLEAN)
        o = await pg.evaluate(RUN)
        c.ok(o['paid'] and not errs, f'FOREST_TRACK 없는 판: paid={o["paid"]}, 오류 {errs[:3]}')
        await ctx.close(); await b.close()
asyncio.run(main())
c.done()
