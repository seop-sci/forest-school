# 5.0.3.1 시험: 곁가지 이야기 칭호(낮잠 지킴이, 꿀단지 탐정 등)를 눌러서 달 수 있어요. 중학교부터 행사 이름(체육대회, 졸업 앨범 촬영)이 퀘스트와 미션에도 맞아요
# 보는 것: 칭호 칩을 누르면 바뀌어요, 다시 누르면 떼요, 저장 읽기에서 남아요, 랭킹에는 보내지 않아요(서버 규칙이 소문자만 받아요)
# 쓰는 법: python3 wrap.py && python3 s160test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, F, CLEAN
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=2, tg=1))
        await pg.wait_for_timeout(1000)
        ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S; {js} }})()")
        r = await ev("""S.sto.side.nap = { n: 4 }; S.sto.side.honey = { n: 4 }; S.ach.title = '';
          document.querySelectorAll('.overlay').forEach(o => o.hidden = true); F.setTab('dex'); F.setDexSeg('ach');
          return [...document.querySelectorAll('#achTitle [data-title]')].map(b => b.dataset.title);""")
        c.ok('st_nap' in r and 'st_honey' in r, f'이야기 칭호 칩이 안 보여요 {r}')
        await pg.evaluate(CLEAN); await pg.wait_for_timeout(200)
        await pg.click('#achTitle [data-title="st_nap"]', force=True); await pg.wait_for_timeout(200)
        r = await ev("return [S.ach.title, document.querySelector('#achTitle [data-title=\"st_nap\"]').classList.contains('on')];")
        c.ok(r == ['st_nap', True], f'낮잠 지킴이를 누르면 달려야 해요 {r}')
        await pg.click('#achTitle [data-title="st_honey"]', force=True); await pg.wait_for_timeout(200)
        r = await ev("return S.ach.title;")
        c.ok(r == 'st_honey', f'꿀단지 탐정으로 바뀌어야 해요 {r}')
        await pg.click('#achTitle [data-title="st_honey"]', force=True); await pg.wait_for_timeout(200)
        r = await ev("return S.ach.title;")
        c.ok(r == '', f'다시 누르면 떼야 해요 {r}')
        # 다 읽지 않은 이야기 칭호는 못 달아요
        r = await ev("S.sto.side.acorn = { n: 1 }; return [F.setTitle('st_acorn'), S.ach.title];")
        c.ok(r == [False, ''], f'다 읽지 않은 칭호가 달려요 {r}')
        # 저장 읽기
        r = await ev("""const d = JSON.parse(JSON.stringify(S)); d.ach.title = 'st_nap'; const a = F.sanitize(d).ach.title;
          const d2 = JSON.parse(JSON.stringify(S)); d2.ach.title = 'st_nap'; d2.sto.side.nap = { n: 1 }; const b2 = F.sanitize(d2).ach.title; return [a, b2];""")
        c.ok(r == ['st_nap', ''], f'저장 읽기 {r}')
        # 위쪽 칭호 리본
        r = await ev("F.setTitle('st_nap'); F.setTab('school'); return document.querySelector('#hudTitle').textContent;")
        c.ok('낮잠 지킴이' in r, f'위쪽 리본 {r}')
        r = await ev("""const M = id => F.MAIN.find(q => q.id === id); S.tier = 2;
          return [M('j18').title, M('j18').how, M('j26').title, M('hs35').title, F.EV_MEASURE.sports.name(3), FEST.sports.name];""".replace('FEST.', 'F.FEST.'))
        c.ok(r == ['체육대회 열기', '학교 행사 > 체육대회', '졸업 앨범 촬영', '졸업 앨범 촬영', '체육대회 3번 열기', '체육대회'], f'중학교 행사 이름 {r}')
        r = await ev("S.tier = 1; return [F.EV_MEASURE.sports.name(2), F.FEST.sports.name];")
        c.ok(r == ['숲속 운동회 2번 열기', '숲속 운동회'], f'초등학교 행사 이름 {r}')
        r = await ev("""S.tier = 2; F.setTab('school'); S.budget = 0; const n0 = F.upPlan().ks.length;
          let lo = 0, hi = 1e300; for (let k = 0; k < 2000; k++) { const m = (lo + hi) / 2; S.budget = m; if (F.upPlan().ks.length >= 1) hi = m; else lo = m; }
          S.budget = hi; const n1 = F.upPlan().ks.length; F.upRender(true); return { n0, n1, hid: document.querySelector('#upChip').hidden, t: document.querySelector('#upChip').textContent };""")
        c.ok(r['n1'] == 1 and not r['hid'] and '1채' in r['t'], f'한 채만 올릴 수 있어도 칩이 떠요 {r}')
        # 5.1.0.1 주간 상자 보상 그림: 정수와 단축권이 도시락(🍱)으로 나오지 않아요
        r = await ev("""S.tier = 5; S.gold = 999; S.wk.mp = 1e6; S.wk.got = S.wk.got.map(() => false); document.querySelectorAll('.overlay').forEach(o => o.hidden = true); F.rt4.modalOpen = null; F.rt4.modalQueue.length = 0;
          F.claimBox(0); return [...document.querySelectorAll('#rwList li')].map(li => [li.querySelector('.rw-ic').innerHTML.includes('🍱'), li.textContent]);""")
        c.ok(len(r) >= 2 and not any(x[0] and ('정수' in x[1] or '단축권' in x[1]) for x in r), f'주간 상자 그림 {r}')
        c.ok(not errs, f'오류 {errs[:2]}')
        await ctx.close()
asyncio.run(main())
c.done()
