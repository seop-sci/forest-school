# 193번 시험(5.4.0.4): 연구소 시간 줄이기와 가독성
# 1) 연구 트리: 연구 중이면 위쪽에 '지금 연구 중' 칸(막대, 남은 시간, 단축권, 정수), 그 아래 '연구할 수 있어요' 칸들, 나무가 한 화면에(내리지 않아도 나무 밑동까지 보여요)
# 2) 단축권 쓰기: 공사와 같은 자동 사용(tkPlan), 다 줄이면 연구가 끝나 칸이 올라가요
# 3) 정수 즉시: 공사와 같은 값(conEssCost), 정수가 줄고 바로 끝나요. 모자라면 그대로
# 4) 논문 쓰기와 조교 파견에도 같은 단추(정수 즉시로 끝남, 조교는 받기로)
# 6) 황금 도토리 60개 넘고 테마가 없으면 한 번만 추천 창(옛 저장에도), 테마가 있으면 안 떠요
# 5) 360px, 390px, 어두운 화면 넘침 없음, 오류 없음
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, OVER
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, th in ((360, 740, 'dark'), (390, 844, 'light')):
            sv = base(tier=5, students=110)
            sv['f'] = {k: 30 for k in ('classroom', 'cafeteria', 'library', 'playground', 'science', 'store', 'dorm', 'union')}; sv['f']['institute'] = 5; sv['f']['gradhall'] = 3
            sv['sem'] = 6
            ctx, pg, errs = await ctxpage(b, w, h, th, sv)
            await pg.wait_for_timeout(1300); await pg.evaluate(CLEAN)
            r = await pg.evaluate("""async()=>{ const F = window.__forest, S = F.S, R = F.rt, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              S.ess = 0; S.budget = 1e40; S.rt5.lv = { class: 2, event: 1, tam: 1 }; S.tk = { m5: 0, m30: 0, h1: 0, h3: 0 };
              S.rt5.cur = { k: 'event', end: F.gameNow() + 2.5 * 3600e3 };
              R.rxTab = 'tree'; F.openRx(); await sl(500);
              const now = document.querySelector('#rxBody .rt-now'), tree = document.querySelector('#rxBody .rt-tree'), can = document.querySelector('#rxBody .rt-can');
              o.now = !!now && !!now.querySelector('[data-lab^="ess:rt"]') && !!now.querySelector('.lab-bar'); o.can = !!can && can.querySelectorAll('button').length > 0;
              o.order = !!now && !!tree && (now.compareDocumentPosition(tree) & 4) > 0;
              const box = document.querySelector('#mRx .modal, #mRx .sheet, #mRx > div'), tb = tree.getBoundingClientRect(); o.treeBottom = Math.round(tb.bottom); o.vh = innerHeight;
              o.ring = !!document.querySelector('#rxBody .rt-node.run');
              // 정수 모자라면 그대로
              now.querySelector('[data-lab^="ess:rt"]').click(); await sl(100); o.poor = !!S.rt5.cur;
              // 단축권: 1시간권 2장 → 2시간 줄어요
              S.tk.h1 = 2; F.renderRx(); await sl(100);
              const left0 = (S.rt5.cur.end - F.gameNow()) / 1000;
              document.querySelector('#rxBody [data-lab^="tk:rt"]').click(); await sl(150);
              o.tkLeft = S.rt5.cur ? Math.round((S.rt5.cur.end - F.gameNow()) / 1000) : -1; o.tkUsed = S.tk.h1; o.cut = Math.round(left0 - o.tkLeft);
              // 정수 즉시
              const need = F.conEssCost(Math.ceil((S.rt5.cur.end - F.gameNow()) / 1000)); S.ess = need + 5; F.renderRx(); await sl(100);
              document.querySelector('#rxBody [data-lab^="ess:rt"]').click(); await sl(300);
              o.done = !S.rt5.cur && F.rtLv('event') === 2 && S.ess === 5; o.need = need;
              // 논문
              S.pp.cur = { k: 'class', end: F.gameNow() + 4 * 3600e3 }; const n0 = S.pp.n; R.rxTab = 'paper'; F.renderRx(); await sl(200);
              o.desk = !!document.querySelector('#rxBody .pp-desk.on [data-lab^="ess:pp"]') && !!document.querySelector('#rxBody .pp-med .lab-bar');
              S.ess = 999; document.querySelector('#rxBody [data-lab^="ess:pp"]').click(); await sl(300); o.pp = !S.pp.cur && S.pp.n === n0 + 1;
              // 조교
              S.ta.seat = [{ b: 'cafeteria' }, { b: '' }]; S.ta.out = [{ i: 0, to: 2, h: 1, end: F.gameNow() + 3 * 3600e3 }]; R.rxTab = 'ta'; F.renderRx(); await sl(200);
              o.taBtn = !!document.querySelector('#rxBody .ta-sp [data-lab="ess:ta:0"]');
              document.querySelector('#rxBody [data-lab="ess:ta:0"]').click(); await sl(300);
              o.ta = S.ta.out.length === 1 && S.ta.out[0].end <= F.gameNow() && !!document.querySelector('#rxBody [data-ta="claim"]');
              R.rxTab = 'tree'; F.renderRx(); await sl(200);
              return o; }""")
            over = await pg.evaluate(OVER, '#rxBody, #rxBody *:not(.rt-node)')  # 칸 둘레 자물쇠 표시는 원래 칸 밖으로 살짝 나와요
            await pg.screenshot(path=f'shots/s193_{w}.png')
            print(w, r)
            c.ok(r['now'] and r['can'] and r['order'] and r['ring'], f'[{w}] 위쪽에 지금 연구 중과 할 수 있는 칸, 그 아래 나무 {r}')
            c.ok(r['treeBottom'] <= r['vh'], f'[{w}] 내리지 않아도 나무 밑동까지 보여요 ({r["treeBottom"]} / {r["vh"]})')
            c.ok(r['poor'], f'[{w}] 정수가 모자라면 그대로')
            c.ok(r['tkUsed'] == 0 and abs(r['cut'] - 7200) <= 3, f'[{w}] 단축권 자동 사용으로 2시간 줄여요 ({r["cut"]}초)')
            c.ok(r['done'] and r['need'] > 0, f'[{w}] 정수 {r["need"]}로 즉시 끝나 칸이 올라가요')
            c.ok(r['desk'] and r['pp'], f'[{w}] 논문 책상 막대와 정수 즉시, 학회 메달 막대')
            c.ok(r['taBtn'] and r['ta'], f'[{w}] 조교 파견도 정수 즉시, 받기 단추')
            c.ok(not over, f'[{w}] 넘침 없음 {over}')
            c.ok(not errs, f'[{w}] 오류 없음 {errs[:3]}')
            await ctx.close()
        for own, gold in (([], 70), (['th:winter:bg'], 70), ([], 40)):
            sv = base(tier=1, students=60); sv['gold'] = gold; sv['cos'] = {'own': own}; sv['u'] = {'boost': True}   # 옛 저장처럼 gtip 없음
            ctx, pg, errs = await ctxpage(b, 390, 844, 'light', sv)
            await pg.wait_for_timeout(1300); await pg.evaluate(CLEAN); await pg.wait_for_timeout(5000)
            r = await pg.evaluate("()=>({ open: !document.querySelector('#mAdAsk').hidden && document.querySelector('#adAskTitle').textContent, tip: window.__forest.S.u.gtip })")
            want = not own and gold >= 60
            if want:
                await pg.screenshot(path='shots/s193_gold.png')
                await pg.click('#adAskYes'); await pg.wait_for_timeout(800)
                r['shop'] = await pg.evaluate("()=>window.__forest.rt4.tab")
            print(own, gold, r)
            c.ok((r['open'] == '황금 도토리가 모였어요') == want and r['tip'] == want and (not want or r['shop'] == 'shop'), f'황금 {gold}, 테마 {own}: 추천 창 {want} {r}')
            c.ok(not errs, f'오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
