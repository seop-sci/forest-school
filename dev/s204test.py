# 204번 시험: 건물 창에서 단짝 모두 쓰다듬기
# 1) 오늘 안 쓰다듬은 단짝이 둘 넘으면 건물 창 '여기 있는 친구' 아래에 모두 쓰다듬기 단추(남은 수와 함께)
# 2) 누르면 남은 단짝을 한 번에 쓰다듬고(도감 모두 쓰다듬기와 같은 값) 단추가 숨어요
# 3) 하나만 남았거나 다 쓰다듬었으면 단추가 없어요
# 4) 360px 어두운 화면, 390px 밝은 화면에서 넘침 없음, 체험학습 출발 단추는 경로를 고르기 전에 꺼진 모양
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, F, OVER
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, sch in ((360, 'dark'), (390, 'light')):
            ctx, pg, errs = await ctxpage(b, w, 800, sch, base(tier=1, tg=2, students=60))
            await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
            r = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), o={{}};
              for (const k of Object.keys(S.fr)) S.fr[k].pat = '';
              o.left0 = F.frPatLeft().length;
              F.openSheet('classroom'); await sl(500);
              const pa = document.querySelector('#sheetPatAll'); o.show = !pa.hidden; o.txt = pa.textContent;
              const p0 = S.frc.pat; pa.click(); await sl(400);
              o.left1 = F.frPatLeft().length; o.patN = S.frc.pat - p0; o.hid = pa.hidden;
              const ks = Object.keys(S.fr); for (const k of ks) S.fr[k].pat = F.gameToday(); S.fr[ks[0]].pat = '';
              F.openSheet('cafeteria'); await sl(400); o.one = document.querySelector('#sheetPatAll').hidden;
              return o; }}""")
            c.ok(r['left0'] >= 2 and r['show'] and f"{r['left0']}명" in r['txt'], f'{w} 단추 보임 {r}')
            c.ok(r['left1'] == 0 and r['patN'] == r['left0'] and r['hid'], f'{w} 한 번에 쓰다듬기 {r}')
            c.ok(r['one'], f'{w} 하나만 남으면 단추 없음 {r}')
            over = await pg.evaluate(OVER, '#sheetPatAll, #sheetFriend')
            c.ok(not over, f'{w} 넘침 {over}')
            await pg.evaluate(CLEAN)
            await pg.evaluate("window.__forest.openTrip()"); await pg.wait_for_timeout(500)
            await pg.locator('[data-trip="hill"]').click(); await pg.wait_for_timeout(300)
            r = await pg.evaluate("""()=>{ const b = document.querySelector('#tripBody [data-trip-depart]'), cs = getComputedStyle(b), acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
              return { dis: b.disabled, bg: cs.backgroundColor }; }""")
            r2 = await pg.evaluate("""()=>{ document.querySelector('#tripBody input[type=radio]').click(); const b = document.querySelector('#tripBody [data-trip-depart]'); return { dis: b.disabled, bg: getComputedStyle(b).backgroundColor }; }""")
            c.ok(r['dis'] and not r2['dis'] and r['bg'] != r2['bg'], f'{w} 출발 단추 꺼진 모양 {r} {r2}')
            c.ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
