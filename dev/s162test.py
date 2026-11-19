# 5.1.1.2 시험: 소풍 간 친구(지도에서 숨김)에게 '!' 말풍선이 붙지 않고, 붙어 있던 말풍선은 사라지는지
# 쓰는 법: python3 wrap.py && python3 s162test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sv = base(tier=0, students=40)
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', sv)
        await pg.wait_for_timeout(1500)
        await pg.evaluate(CLEAN)
        r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, R = F.rt4, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
          const vis = k => k.g.style.display !== 'none';
          // 소풍 시작: 앞의 친구들이 지도에서 숨어요
          S.pc.at = F.gameNow(); await sl(1500);
          out.hidden = R.kids.filter(k => !vis(k)).length;
          // 말풍선이 여러 번 떠도 숨은 친구에게는 붙지 않아요
          let bad = 0, n = 0;
          for (let t = 0; t < 40; t++) { if (R.talk) { R.talk.g.remove(); R.talk = null; } R.talkT = 0; R.modalOpen = null; await sl(60); if (R.talk) { n++; if (!vis(R.talk.k)) bad++; } }
          out.n = n; out.bad = bad;
          // 이미 붙어 있던 친구가 숨으면 말풍선도 사라져요
          if (R.talk) { R.talk.g.remove(); R.talk = null; }
          S.pc.at = 0; await sl(1500); R.talkT = 0; await sl(300);
          const T = R.talk; out.had = !!T;
          if (T) { const i = R.kids.indexOf(T.k); T.k.g.style.display = 'none'; await sl(300); out.gone = !R.talk || R.talk !== T; }
          return out; })()""")
        print(r)
        c.ok(r['hidden'] >= 1, f'소풍 간 친구가 숨어요 {r}')
        c.ok(r['n'] >= 5 and r['bad'] == 0, f'숨은 친구에게 말풍선이 붙지 않아요 {r}')
        c.ok(r['had'] and r['gone'], f'숨으면 말풍선도 사라져요 {r}')
        c.ok(not errs, f'오류 {errs[:2]}')
        await ctx.close()
asyncio.run(main())
c.done()
