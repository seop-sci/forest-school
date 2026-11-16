# s152 (5.0.3): 끝판 오류 둘과 대결 소탕
#  1) 시설 Lv.107, 도토리 10^33 저장을 다시 읽어도 깎이지 않아요(예전에는 Lv.99, 10^30으로 깎였어요). 큰 수 글자가 짧아요
#  2) 박사 8학기(일반 탐험이 끝없는 때)에도 심화 탐험이 열려 있고 단추가 보여요
#  3) 대결 소탕: 1판 하기 전에는 안 되고, 1판 뒤에는 남은 판을 한 번에. 판 수, 점수 오름 한도(판마다 +25 아래, 연승 덤 없음), XP 70%, 360px 넘침
#  4) 새 학교급 입학 창에 부엉이 선생님 안내(대학원에는 없음)
import asyncio, json
from playwright.async_api import async_playwright
from testlib import base, ctxpage, F, CLEAN, OVER, Checker

async def main():
    c = Checker()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 1) 저장 상한
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base())
        r = await pg.evaluate(f"""(() => {{ const F = {F}; const d = JSON.parse(JSON.stringify(F.S)); d.tier = 5; d.tg = 13; for (const k in d.f) d.f[k] = 107; for (const k in d.fu) d.fu[k] = d.fu[k].map(() => 107); d.budget = 1.5e33;
          const s = F.sanitize(d); return {{ f: s.f.classroom, fu: s.fu.classroom[0], b: s.budget, cap: F.SAVE_CAP }}; }})()""")
        print(r); c.ok(r['f'] == 107 and r['fu'] == 107, f"시설과 가구 Lv.107 그대로 {r}"); c.ok(r['b'] == 1.5e33, '도토리 1.5×10^33 그대로')
        r = await pg.evaluate(f"(() => {{ {F}.S.units = 'ko'; return [1.5e33, 2e37, 3e41, 4e45, 5e49].map(n => {F}.fmt(n)); }})()")
        print(r); c.ok(all(x.endswith(u) and len(x) <= 6 for x, u in zip(r, '구간정재극')), f'큰 수 단위 {r}')
        # 2) 박사 8학기 심화 탐험
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 5; S.tg = 5; S.sem = 0; const c7 = F.tamCap(); S.tam.best = c7; S.tam.hc = c7; S.tam.hm = 1; S.tam.hb = 50;
          const open7 = F.tamHOpen(), on7 = F.tamHOn(); S.sem = 1; const c8 = F.tamCap(), open8 = F.tamHOpen(), on8 = F.tamHOn(); S.tam.best = c7 - 1; const below = F.tamHOpen(); S.tam.best = c7;
          S.tam.hc = 0; const nohc = F.tamHOpen(); S.tam.hc = c7; return {{ c7, c8: String(c8), open7, on7, open8, on8, below, nohc }}; }})()""")
        print(r); c.ok(r['c8'] == 'Infinity' and r['open7'] and r['open8'] and r['on8'], f'박사 8학기에도 심화가 열려 있어요 {r}'); c.ok(not r['below'] and not r['nohc'], '마지막 상한에 못 닿았으면 닫혀 있어요')
        await ctx.close()
        # 3) 대결 소탕
        for w in (360, 390):
            ctx, pg, errs = await ctxpage(b, w, 800, 'light', base(tier=2, tg=1))
            await pg.evaluate(f"(() => {{ {CLEAN}; const F = {F}; F.btDay(); F.setTab('mini'); F.renderBtCard(); }})()"); await pg.wait_for_timeout(300)
            r0 = await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; return {{ open: F.btSwOpen(), sw: F.btSweep(), btn: document.querySelector('#btSwBtn').hidden, tx: document.querySelector('#btSwTx').hidden, row: document.querySelector('#btSwRow').hidden, n: S.bt.n }}; }})()")
            c.ok(not r0['open'] and r0['sw'] is None and r0['btn'] and not r0['tx'] and not r0['row'] and r0['n'] == 0, f'{w}: 1판 하기 전에는 소탕이 안 돼요 {r0}')
            over = await pg.evaluate(OVER, '#btCardW, #btCard, #btSwRow'); c.ok(not over, f'{w}: 대결 카드 넘침 없음 {over}')
            r1 = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.bt.n = 1; S.bt.streak = 6; F.renderBtCard(); const pts0 = S.bt.pts, pe0 = S.ac.pe.xp + S.ac.pe.lv * 1e6, st0 = S.bt.st.w + S.bt.st.l, left = F.btLeft();
              const btnTx = document.querySelector('#btSwBtn').textContent, btnHid = document.querySelector('#btSwBtn').hidden; const g = F.btSweep();
              return {{ left, btnTx, btnHid, g, n: S.bt.n, d: S.bt.pts - pts0, plays: S.bt.st.w + S.bt.st.l - st0, after: F.btLeft(), again: F.btSweep(), row: document.querySelector('#btSwRow').hidden, fin: isFinite(S.budget) && isFinite(S.bt.pts) }}; }})()""")
            print(w, r1); g = r1['g']
            c.ok(r1['left'] == 4 and not r1['btnHid'] and '4' in r1['btnTx'], f'{w}: 단추에 남은 4판')
            c.ok(g and g['n'] == 4 and r1['n'] == 5 and r1['plays'] == 4 and r1['after'] == 0 and r1['again'] is None, f'{w}: 남은 4판을 한 번에 끝내요')
            c.ok(g and g['d'] == r1['d'] and r1['d'] <= 25 * g['w'] and r1['d'] >= -10 * g['l'] + 25 * g['w'] - 1e-9 and g['lp'] <= 4 * g['w'], f"{w}: 점수는 이기면 +25, 지면 -10, 연승 덤 없음 {r1['d']} {g}")
            c.ok(r1['row'] and r1['fin'], f'{w}: 다 쓰면 소탕 줄이 사라져요')
            over = await pg.evaluate(OVER, '#btCardW, #btCard'); c.ok(not over, f'{w}: 소탕 뒤 넘침 없음 {over}')
            await pg.evaluate(f"(() => {{ {CLEAN}; const S = {F}.S; S.bt.n = 2; {F}.renderBtCard(); {F}.openBtSw(); }})()"); await pg.wait_for_timeout(400)
            m = await pg.evaluate("(() => { const m = document.querySelector('#mBtSw'), s = m.querySelector('.modal').getBoundingClientRect(); return { open: m.classList.contains('open'), l: s.left, r: s.right, w: innerWidth, tx: document.querySelector('#btSwText').textContent }; })()")
            c.ok(m['open'] and m['l'] >= 0 and m['r'] <= m['w'] and '3판' in m['tx'], f'{w}: 소탕 창이 화면 안에 {m}')
            c.ok(not errs, f'{w}: 오류 없음 {errs[:2]}'); await ctx.close()
        # 4) 입학 창의 부엉이 선생님 안내
        ctx, pg, errs = await ctxpage(b, 360, 800, 'light', base(tier=2, tg=0))
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, out = []; for (const t of [2, 5]) {{ {CLEAN}; S.tier = t; F.showEntrance(100, 30, F.TIERS[t - 1], null, 5); out.push(document.querySelector('#tierFine').textContent); }} {CLEAN}; return out; }})()""")
        print(r); c.ok('부엉이 선생님' in r[0] and '부엉이 선생님' not in r[1], '입학 창 안내: 중학교에는 있고 대학원에는 없어요')
        over = await pg.evaluate(f"(() => {{ const F = {F}; F.S.tier = 2; F.showEntrance(100, 30, F.TIERS[1], null, 5); const m = document.querySelector('#mTier .modal').getBoundingClientRect(); return [m.left >= 0, m.right <= innerWidth, m.bottom <= innerHeight + 1]; }})()")
        c.ok(all(over), f'360: 입학 창이 화면 안에 {over}'); await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
