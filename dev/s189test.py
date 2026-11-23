# 189번 시험(5.3.4.8): 생물 도감 150종(새 무리 셋, 작업지시서 111)
# 1) 생물 150종, 열쇠 겹침 없음, 새 60종 모두 그림이 있어요
# 2) 새 생물마다 나오는 때가 있어요(어느 달, 낮이나 밤, 비, 물가 가운데 한 번은 bxOk)
# 3) 도감 생물 칸에 무리 머리 여섯 개, 150칸. 360px, 390px 넘침 없음
# 4) 90종 보상은 그대로 90종에서(150종을 기다리지 않아요). 저장 읽기에 새 생물이 남아요
import asyncio, pathlib
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, OVER
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
c = Checker()
NEW = ['palechub', 'minnow', 'crayfish', 'pondfrog', 'suwontreefrog', 'redbandedsnake', 'flyagaric', 'glowmushroom', 'beautyberry', 'yangsalamander']
async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, th in ((360, 'dark'), (390, 'light')):
            ctx, pg, errs = await ctxpage(b, w, 800, th, base(tier=1))
            await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
            r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              o.n = F.BIO.length; o.uniq = new Set(F.BIO.map(b => b.id)).size;
              const nw = F.BIO.filter(b => b.g >= 3); o.g3 = [3, 4, 5].map(g => F.BIO.filter(b => b.g === g).length);
              o.noImg = F.BIO.filter(b => !F.IMG(b.id)).map(b => b.id);
              // 나오는 때: 2027년 달마다 15일 낮 14시와 밤 21시, 비 오는 날 찾기
              const K = (m, h) => Date.UTC(2027, m - 1, 15, h - 9);
              const rainDay = m => { for (let d = 1; d <= 28; d++) { const t = Date.UTC(2027, m - 1, d, 12); if (F.wxOf && F.wxOf(new Date(t + 9 * 3600e3).toISOString().slice(0, 10)) === 'rain') return d; } return 0; };
              const can = b => { for (let m = 1; m <= 12; m++) { const rd = rainDay(m) || 15; for (const d of [15, rd]) for (const h of [14, 21]) { const t = Date.UTC(2027, m - 1, d, h - 9); for (const wt of [0, 1]) if (F.bxOk(b, t, wt)) return true; } } return false; };
              o.never = F.BIO.filter(b => !can(b)).map(b => b.id);
              o.txt = nw.filter(b => /·|\\{|\\}/.test(b.d + b.nm)).map(b => b.id);
              // 도감
              S.bx.got = Object.fromEntries(F.BIO.slice(0, 120).map(b => [b.id, 2]));
              // 90종 보상
              S.bx.got = Object.fromEntries(F.BIO.slice(0, 89).map(b => [b.id, 1])); S.bx.g = 4; S.bx.sp = [{ i: 1, id: F.BIO[140].id, t: 0 }];
              F.bxTap(1); o.g5 = S.bx.g; F.CLEAN && 0;
              const s2 = F.sanitize(JSON.parse(JSON.stringify(S))); o.keep = !!s2.bx.got[F.BIO[140].id];
              return o; })()""")
            await pg.evaluate(CLEAN)
            r.update(await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              S.bx.got = Object.fromEntries(F.BIO.slice(0, 120).map(b => [b.id, 2]));
              F.setTab('dex'); await sl(200); F.setDexSeg('bx'); await sl(300);
              const pane = document.querySelector('#bxPane'); const h = [...document.querySelectorAll('#bxDexGrid .bx-gh')]; h[3] && h[3].scrollIntoView();
              o.heads = h.map(x => x.textContent); o.cards = document.querySelectorAll('#bxDexGrid .bx-card').length; o.vis = !!pane && !pane.hidden && pane.getBoundingClientRect().width > 0;
              return o; })()"""))
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=str(OUT / f's189_dex_{w}.png'))
            over = await pg.evaluate(OVER, '#bxPane, #bxPane *')
            print(w, {k: v for k, v in r.items()})
            c.ok(r['n'] == 150 and r['uniq'] == 150 and r['g3'] == [20, 25, 22], f'[{w}] 생물 150종, 새 무리 수 {r["g3"]}')
            c.ok(not r['noImg'], f'[{w}] 그림 없는 생물 없음 {r["noImg"]}')
            c.ok(not r['never'], f'[{w}] 나오는 때가 없는 생물 없음 {r["never"]}')
            c.ok(not r['txt'], f'[{w}] 설명에 가운뎃점이나 자리표 없음 {r["txt"]}')
            c.ok(len(r['heads']) == 6 and r['heads'][3] == '물속 생물' and r['cards'] == 150 and r['vis'], f'[{w}] 도감 무리 머리 여섯, 150칸 {r["heads"]}')
            c.ok(r['g5'] == 5 and r['keep'], f'[{w}] 90종 보상은 90종에서, 저장 읽기에 새 생물이 남아요')
            c.ok(not over, f'[{w}] 도감이 넘치지 않아요 {over}')
            c.ok(not errs, f'[{w}] 오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
