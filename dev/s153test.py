# s153 (5.0.4): 화면 정리
#  1) 고르게 올리기 확인 창: 대원마다 한 줄, 굵은 숫자, 360px 넘침 없음. 다른 확인 창은 예전처럼 글만
#  2) 장비 단추 꾹 누르기(추천 칸과 칸 단추), 테마를 고르면 장비 창의 고른 탭과 추천 칸이 테마 색
#  3) 대학교와 대학원: 구역마다 학생 몫만(체육 구역이 가장 적음), 캠퍼스는 6명, 고등학교는 그대로
#  4) 홈 메인 퀘스트 판이 덜 비침. 미션 보상 창의 에너지와 미션 포인트가 그림
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, F, CLEAN, OVER, Checker

async def main():
    c = Checker()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in (360, 390):
            ctx, pg, errs = await ctxpage(b, w, 800, 'light', base(tier=3, tg=1, budget=3e13))
            await pg.evaluate(f"(() => {{ {CLEAN}; const F = {F}, S = F.S; S.tam.on = true; S.tam.mat = [9999, 9999, 9999, 99]; F.setTab('tam'); }})()"); await pg.wait_for_timeout(900)
            await pg.evaluate(f"(() => {{ {CLEAN}; {F}.tamLvAllAsk(); }})()"); await pg.wait_for_timeout(450)
            r = await pg.evaluate("""(() => { const t = document.querySelector('#adAskText'), m = document.querySelector('#mAdAsk .modal').getBoundingClientRect(), rows = [...t.querySelectorAll('.ask-row')];
              const tops = rows.map(x => Math.round(x.getBoundingClientRect().top));
              return { open: document.querySelector('#mAdAsk').classList.contains('open'), rich: t.classList.contains('ask-rich'), rows: rows.length, tops, bold: t.querySelectorAll('b').length, l: m.left, r: m.right, w: innerWidth,
                over: rows.some(x => x.scrollWidth > x.clientWidth + 1 || x.getBoundingClientRect().right > m.right) }; })()""")
            c.ok(r['open'] and r['rich'] and r['rows'] >= 1 and r['bold'] >= r['rows'] + 2 and len(set(r['tops'])) == r['rows'], f'{w}: 고르게 올리기 창에 대원마다 한 줄 {r}')
            c.ok(r['l'] >= 0 and r['r'] <= r['w'] and not r['over'], f'{w}: 창 넘침 없음')
            lv0 = await pg.evaluate(f"{F}.tamParty().map(sp => {F}.tamMem(sp).lv)")
            await pg.evaluate("document.querySelector('#adAskYes').click()"); await pg.wait_for_timeout(500)
            lv1 = await pg.evaluate(f"{F}.tamParty().map(sp => {F}.tamMem(sp).lv)")
            c.ok(sum(lv1) > sum(lv0), f'{w}: 올리기를 누르면 올라가요 {lv0} → {lv1}')
            # 다른 확인 창은 글만
            r = await pg.evaluate(f"(() => {{ {CLEAN}; {F}.askBox({{ title: 't', text: '첫 문장이에요. 둘째 문장이에요.' }}); const t = document.querySelector('#adAskText'); const o = [t.classList.contains('ask-rich'), t.children.length, t.textContent]; {F}.adAskDone(false); return o; }})()")
            c.ok(r[0] is False and r[1] == 0 and '첫 문장' in r[2], f'{w}: 다른 확인 창은 예전처럼 글만 {r}'); await pg.wait_for_timeout(300)
            # 장비 꾹 누르기
            await pg.evaluate(f"(() => {{ {CLEAN}; {F}.rt4.tamSeg = 'gear'; document.querySelector('#tmSheet').hidden = false; {F}.tamRenderBody(); }})()"); await pg.wait_for_timeout(300)
            g0 = await pg.evaluate(f"JSON.stringify({F}.S.tam.sg)")
            for sel, name in (('.tm-rec [data-tgear]', '추천 칸'), ('.tm-sgc [data-tgear]', '칸 단추')):
                box = await pg.evaluate(f"(() => {{ const b = document.querySelector('{sel}'); b.scrollIntoView({{ block: 'center' }}); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }})()")
                s0 = await pg.evaluate(f"{F}.S.tam.sg.reduce((a, o) => a + Object.values(o).reduce((x, y) => x + y, 0), 0)")
                await pg.mouse.move(box[0], box[1]); await pg.mouse.down(); await pg.wait_for_timeout(1300); await pg.mouse.up(); await pg.wait_for_timeout(250)
                s1 = await pg.evaluate(f"{F}.S.tam.sg.reduce((a, o) => a + Object.values(o).reduce((x, y) => x + y, 0), 0)")
                c.ok(s1 - s0 >= 3, f'{w}: 장비 {name}을 꾹 누르면 계속 올라가요 (+{s1 - s0})')
            s0 = await pg.evaluate(f"{F}.S.tam.sg.reduce((a, o) => a + Object.values(o).reduce((x, y) => x + y, 0), 0)")
            await pg.evaluate("document.querySelector('.tm-sgc [data-tgear]').click()"); await pg.wait_for_timeout(200)
            s1 = await pg.evaluate(f"{F}.S.tam.sg.reduce((a, o) => a + Object.values(o).reduce((x, y) => x + y, 0), 0)")
            c.ok(s1 - s0 == 1, f'{w}: 짧게 누르면 한 단계만 (+{s1 - s0})')
            col = await pg.evaluate("""(() => { const R = document.documentElement, q = s => getComputedStyle(document.querySelector(s)); const a = [q('.tm-tabs button[aria-pressed="true"]').backgroundImage, q('.tm-rec').backgroundImage];
              R.dataset.thUi = 'winter'; const b = [q('.tm-tabs button[aria-pressed="true"]').backgroundImage, q('.tm-rec').backgroundImage, q('.tm-rec .cta').backgroundColor]; R.dataset.thUi = ''; return [a, b]; })()""")
            c.ok(col[0][0] != col[1][0] and col[0][1] != col[1][1], f'{w}: 테마를 고르면 장비 창의 고른 탭과 추천 칸 색이 바뀌어요')
            over = await pg.evaluate(OVER, '.tm-rec, .tm-lvrow, .tm-sgc'); c.ok(not over, f'{w}: 장비 창 넘침 없음 {over}')
            await pg.evaluate(f"(() => {{ {F}.rt4.tamSeg = 'mem'; {F}.tamRenderBody(); }})()"); await pg.wait_for_timeout(250)
            over = await pg.evaluate(OVER, '.tm-rec, .tm-lvrow, .tm-prow, .tm-tips'); c.ok(not over, f'{w}: 대원 창 넘침 없음 {over}')
            lvn = await pg.evaluate("(() => { const e = document.querySelector('.tm-lvn'), r = e.getBoundingClientRect(); return r.height; })()"); c.ok(lvn < 44, f"{w}: '한 번에' 줄이 세로로 쪼개지지 않아요 (높이 {lvn})")
            c.ok(not errs, f'{w}: 오류 없음 {errs[:2]}'); await ctx.close()
        # 3) 구역마다 학생 몫
        for tier, zs in ((4, ['academic', 'life', 'plaza', 'sports']), (5, ['academic', 'life', 'plaza', 'sports', 'lab'])):
            ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=tier, tg=1))
            r = await pg.evaluate(f"""(() => {{ {CLEAN}; const F = {F}, out = {{}}; F.setTab('school'); for (const z of {zs!r}.concat([''])) {{ F.setZone(z); out[z || 'campus'] = [F.rt4.kids.length, [...new Set(F.rt4.kids.map(k => k.sp))].join(',')]; }} return out; }})()""")
            print(tier, r); n = {k: v[0] for k, v in r.items()}
            c.ok(n['campus'] == 6 and all(2 <= n[z] <= 6 for z in zs) and n['sports'] == min(n[z] for z in zs) and n['sports'] < n['academic'], f'학교급 {tier}: 구역마다 학생 몫만, 체육 구역이 가장 적어요 {n}')
            c.ok(12 <= sum(n[z] for z in zs) <= 18, f'학교급 {tier}: 구역을 다 더하면 예전 학생 수쯤 {sum(n[z] for z in zs)}')
            c.ok(len({r[z][1] for z in zs}) >= 3, f'학교급 {tier}: 구역마다 다른 친구가 나와요')
            c.ok(not errs, f'오류 없음 {errs[:2]}'); await ctx.close()
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=3, tg=1))
        n = await pg.evaluate(f"{F}.rt4.kids.length"); c.ok(n == 16, f'고등학교는 그대로 16명 ({n})')
        # 4) 메인 퀘스트 판과 보상 그림
        a = await pg.evaluate("(() => { const m = /\\/ ([\\d.]+)\\)/.exec(getComputedStyle(document.querySelector('.home-qcard')).backgroundColor); return m ? +m[1] : 1; })()")
        c.ok(a >= 0.9, f'메인 퀘스트 판이 덜 비쳐요 (불투명도 {a})')
        r = await pg.evaluate(f"(() => {{ {CLEAN}; const F = {F}, S = F.S; S.dm.list.forEach(x => {{ x.b = -1e9; }}); F.claimMission(0); return 1; }})()"); await pg.wait_for_timeout(700)
        r = await pg.evaluate("[...document.querySelectorAll('#rwList li')].map(li => [li.textContent, !!li.querySelector('.rw-ic img, .rw-ic svg')])")
        print(r); c.ok(any('합치기 에너지' in t and pic for t, pic in r) and any('미션 포인트' in t and pic for t, pic in r), '미션 보상 창의 에너지와 미션 포인트가 그림이에요')
        c.ok(not errs, f'오류 없음 {errs[:2]}'); await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
