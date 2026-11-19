# 5.1.1.2 시험: 지도에서 누르는 자리 겹침
# 1) 선생님 머리 위 곁가지 잎사귀가 건물 이름표 아래에 깔려도(유치원 곰 선생님과 급식실 이름표 등) 잎사귀를 누르면 이야기가 열리고 건물 창은 열리지 않는지
# 2) 매나 뱀이 들어온 동안에는 건물(그림, 이름표)을 눌러도 건물 창이 열리지 않고, 쫓아낸 뒤에는 다시 열리는지
# 쓰는 법: python3 wrap.py && python3 s164test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN
c = Checker()
SETUP = """(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms));
  S.t.owl = 9; S.t.bear = 9; S.t.squirrel = 12; S.sto.side = {}; F.sideMap(); await sl(200);
  const b = document.querySelector('#m-%s .sd-bub .sd-hit'); if (!b) return null; const r = b.getBoundingClientRect();
  const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2, top = document.elementFromPoint(x, y);
  return { x, y, under: !!(top && top.closest('#plaques')) }; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in (360, 390):
            # 1) 잎사귀
            for who, side in (('bear', 'honey'), ('squirrel', 'acorn'), ('owl', 'nap')):
                ctx, pg, errs = await ctxpage(b, w, 800, 'light', base(tier=0, students=40))
                await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
                r = await pg.evaluate(SETUP % who)
                c.ok(r is not None, f'{w}px {who} 잎사귀가 떠요')
                if r:
                    await pg.mouse.click(r['x'], r['y']); await pg.wait_for_timeout(500)
                    st = await pg.evaluate("(()=>{ const R = window.__forest.rt4; return { st: R.st ? R.st.id : '', sheet: R.sheetKey || '' }; })()")
                    print(w, who, r, st)
                    c.ok(st['st'].startswith('side:' + side) and not st['sheet'], f'{w}px {who} 잎사귀를 누르면 이야기(이름표 아래 {r["under"]}) {st}')
                c.ok(not errs, f'{w}px 오류 {errs[:2]}')
                await ctx.close()
            # 2) 매나 뱀
            for kind in ('snake', 'hawk'):
                ctx, pg, errs = await ctxpage(b, w, 800, 'light', base(tier=0, students=40))
                await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
                pt = await pg.evaluate("""(()=>{ const out = {}; for (const k of ['library', 'cafeteria']) { const h = document.querySelector('#b-' + k + ' .hit').getBoundingClientRect(), q = document.querySelector('#pq-' + k).getBoundingClientRect();
                  out[k] = [(h.left + h.right) / 2, h.top + h.height * 0.35]; out['pq-' + k] = [(q.left + q.right) / 2, (q.top + q.bottom) / 2]; } return out; })()""")
                await pg.evaluate(f"window.__forest.startTrial('{kind}')"); await pg.wait_for_timeout(300)
                opened = []
                for k, (x, y) in pt.items():
                    on = await pg.evaluate("([x,y])=>{ const el = document.elementFromPoint(x, y); return !!(el && el.closest('.trial')); }", [x, y])
                    if on: continue   # 침입자 바로 위는 건너뛰어요
                    await pg.mouse.click(x, y); await pg.wait_for_timeout(250)
                    s = await pg.evaluate("window.__forest.rt4.sheetKey || ''")
                    if s: opened.append((k, s)); await pg.evaluate("window.__forest.rt4.sheetKey = null")
                on = await pg.evaluate("!!window.__forest.rt4.trial")
                await pg.evaluate("(()=>{ const F = window.__forest; const T = F.rt4.trial; if (T) { T.hp = 1; T.st = T.st === 'shadow' ? 'fly' : T.st; F.hitTrial(); } })()"); await pg.wait_for_timeout(600)
                await pg.evaluate("document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; }); window.__forest.rt4.modalOpen = null; window.__forest.rt4.paused = false;")
                x, y = pt['library']; await pg.mouse.click(x, y); await pg.wait_for_timeout(300)
                after = await pg.evaluate("window.__forest.rt4.sheetKey || ''")
                print(w, kind, on, opened, after)
                c.ok(on and not opened, f'{w}px {kind} 동안 건물이 열리지 않아요 {opened}')
                c.ok(after == 'library', f'{w}px {kind} 쫓아낸 뒤 건물이 열려요 {after}')
                c.ok(not errs, f'{w}px 오류 {errs[:2]}')
                await ctx.close()
        # 3) 중학교 부엉이 잎사귀가 지도 밖 단추(복도, 학교 행사)에 가려지지 않아요
        for w in (360, 390):
            ctx, pg, errs = await ctxpage(b, w, 800, 'light', base(tier=2, students=40))
            await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
            await pg.evaluate(SETUP % 'owl')
            cov = await pg.evaluate("""(()=>{ const b = document.querySelector('#m-owl .sd-bub .sd-hit'); if (!b) return -1; const r = b.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, rr = r.width / 2 * 0.8; let n = 0;
              for (const [dx, dy] of [[0,0],[rr,0],[-rr,0],[0,rr],[0,-rr]]) { const el = document.elementFromPoint(cx + dx, cy + dy); if (!el || !el.closest('#map')) n++; } return n; })()""")
            print(w, '중학교 부엉이 가림', cov)
            c.ok(cov == 0, f'{w}px 중학교 부엉이 잎사귀가 단추에 가려지지 않아요 {cov}')
            await ctx.close()
asyncio.run(main())
c.done()
