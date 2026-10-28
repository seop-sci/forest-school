# 2.0.1 시험: 공부 3단계(시험 기간)
# 보는 것
#  1) 시험 주: 4주마다 한 주(gameWeek % 4 === 2), exPrev와 exDays가 맞아요. 유치원에서는 안 열려요
#  2) 자율학습: 시험 주에만, 도서관이 있어야, 하루 한 번. XP는 20 + 도서관 Lv(60까지). 날이 바뀌면 다시
#  3) 성적표: 시험 주에 왔던 학교만, 시험 주가 끝나면 한 장. 등급은 상한 대비 80/60/40%, 자율학습 한 번마다 +3%(5번까지).
#     중학교부터는 학력 0.6 + 명부 평균 0.4(2.1.0, 학력 상한과 명부 90이면 0.96). 받으면 도토리(점수 × 6분치 보정), 모두 A면 황금 3, 15점 이상 1. 두 번 받을 수 없어요
#  4) 상장: 받은 뒤 다음 시험까지 교실 창에 전교 1등. 저장: 망가진 성적표는 버려요
#  5) 390 밝은, 360 어두운 화면에서 시험 창과 공부 탭 시험 줄이 넘치지 않아요(캡처 s77_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s77test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'
# 시험 주로 시계 옮기기(최대 4주)
TO_EX = f"(() => {{ const F = {F}; let n = 0; while (!F.exNow() && n < 5) {{ F.rt.fakeNow = F.gameNow() + 7 * 86400000; n++; }} return n; }})()"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(T.SKIP)
            if w == 390:
                # 1) 시험 주 계산
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const wk = [40, 41, 42, 43, 44, 45, 46].map(F.exIsWeek);
                  F.S.tier = 0; F.exTick(); const k = F.S.ex.cur; return {{ wk, k }}; }})()""")
                print('주', r)
                if r['wk'] != [False, False, True, False, False, False, True] or r['k'] != -1: bad.append(f'시험 주 계산이나 유치원 잠금이 틀려요 {r}')
                await pg.evaluate(TO_EX)
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.f.library = 0; S.students = 100; const out = {{}};
                  F.exTick(); out.cur = S.ex.cur; out.noLib = F.exStudy('math'); S.f.library = 12;
                  const x0 = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.math); out.a = F.exStudy('math'); out.dx = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.math) - x0; out.b = F.exStudy('kor');
                  out.days = F.exDays(); out.prev = F.exPrev();
                  F.rt.fakeNow = F.gameNow() + 86400000; if (F.exNow()) {{ out.c = F.exStudy('kor'); }} else out.c = 32;
                  return out; }})()""")
                print('자율학습', r)
                if r['noLib'] or r['a'] != 32 or r['dx'] != 32 or r['b'] or r['c'] != 32 or not (1 <= r['days'] <= 7): bad.append(f'자율학습이 틀려요 {r}')
                # 3) 성적표
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; for (const k of F.AC.keys) {{ S.ac[k].lv = 16; S.ac[k].xp = 0; }} S.ac.pe.lv = 4; S.ex.ss = 2;
                  const sc = F.AC.keys.map(F.exScore); F.rt.fakeNow = F.gameNow() + 7 * 86400000; F.exTick();
                  const rep = JSON.parse(JSON.stringify(S.ex.rep)); const b0 = S.budget, g0 = S.gold; const c1 = F.exClaim(), c2 = F.exClaim();
                  const top = F.exAwardTop(); return {{ sc, rep, db: S.budget - b0, dg: S.gold - g0, c2, top: !!top, st: S.ex.st }}; }})()""")
                print('성적표', r)
                if [round(x, 2) for x in r['sc']] != [0.86, 0.86, 0.86, 0.86, 0.26] or r['rep']['g'] != ['A', 'A', 'A', 'A', 'D'] or r['rep']['pts'] != 17: bad.append(f'성적이 틀려요 {r}')
                if r['db'] <= 0 or r['dg'] != 1 or r['c2'] is not None or not r['top'] or r['st']['n'] != 1 or r['st']['best'] != 17: bad.append(f'성적표 받기가 틀려요 {r}')
                # 시험 주에 오지 않은 학교는 성적표가 없어요
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.ex.rep = null; S.ex.cur = -1; F.rt.fakeNow = F.gameNow() + 28 * 86400000; while (F.exNow()) F.rt.fakeNow += 7 * 86400000; F.exTick(); return S.ex.rep; }})()""")
                if r is not None: bad.append(f'시험 주에 없던 학교에 성적표가 생겼어요 {r}')
                # 중학교 명부 반반, 모두 A면 황금 3
                await pg.evaluate(TO_EX)
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 2; F.rosterEnsure(); for (const s of S.roster.list) s.a = [90, 90, 90, 90, 90]; for (const k of F.AC.keys) S.ac[k].lv = 30; S.ex.ss = 0;
                  F.exTick(); const sc = F.exScore('math'); F.rt.fakeNow = F.gameNow() + 7 * 86400000; F.exTick(); const g0 = S.gold; F.exClaim(); return {{ sc, g: S.ex.rep.g, dg: S.gold - g0, a: S.ex.st.a }}; }})()""")
                print('중학교', r)
                if abs(r['sc'] - 0.96) > 1e-9 or r['g'] != ['A'] * 5 or r['dg'] != 3 or r['a'] != 1: bad.append(f'중학교 성적이나 모두 A 보상이 틀려요 {r}')
                # 4) 저장
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const d = JSON.parse(JSON.stringify(F.S)); const a = F.sanitize(d);
                  const d2 = JSON.parse(JSON.stringify(F.S)); d2.ex = {{ cur: 'x', ss: 99, day: 3, rep: {{ wk: 5, g: ['A', 'Z', 'A', 'A', 'A'] }}, st: {{ n: 2, best: 99, a: 9 }} }}; const c = F.sanitize(d2);
                  const d3 = JSON.parse(JSON.stringify(F.S)); delete d3.ex; const e = F.sanitize(d3);
                  return {{ keep: JSON.stringify(a.ex.rep) === JSON.stringify(F.S.ex.rep), c: [c.ex.cur, c.ex.ss, c.ex.day, c.ex.rep, c.ex.st.best, c.ex.st.a], e: e.ex.cur }}; }})()""")
                print('저장', r)
                if not r['keep'] or r['c'] != [-1, 7, '', None, 20, 2] or r['e'] != -1: bad.append(f'저장 읽기가 틀려요 {r}')
                await pg.evaluate(f"{F}.rt.fakeNow = null")
            # 5) 화면
            await pg.evaluate(T.CLEAN); await pg.evaluate(TO_EX)
            await pg.evaluate(f"(() => {{ const S = {F}.S; S.tier = 1; S.f.library = 6; S.ex.day = ''; S.ex.rep = null; {F}.exTick(); }})()")
            await pg.evaluate("document.querySelector('[data-tab=\"mini\"]').click()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(() => { const b = document.querySelector('#exRowBtn'), r = b.getBoundingClientRect(); return { hid: b.hidden, go: document.querySelector('#exRowGo').textContent, over: r.right > innerWidth + 1 || r.left < -1 }; })()""")
            print(w, '시험 줄', r)
            if r['hid'] or r['go'] != '자율학습' or r['over']: bad.append(f'{w} 공부 탭 시험 줄이 틀려요 {r}')
            await pg.evaluate(T.CLEAN); await pg.evaluate(f"{F}.openExam()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(() => { const m = document.querySelector('#mExam .modal').getBoundingClientRect(); return { n: document.querySelectorAll('#exSubj .ex-sub').length, over: m.right > innerWidth + 1 || m.left < -1 }; })()""")
            print(w, '시험 창', r)
            if r['n'] != 5 or r['over']: bad.append(f'{w} 시험 창이 틀려요 {r}')
            await pg.screenshot(path=f's77_study_{w}.png')
            await pg.evaluate(f"(() => {{ const F = {F}; F.S.ex.rep = F.exMake(F.exPrev()); F.rt.fakeNow = F.gameNow() + 7 * 86400000; F.renderExam(); }})()"); await pg.wait_for_timeout(300)
            n = await pg.evaluate("document.querySelectorAll('#exReport .ex-row').length")
            if n != 8: bad.append(f'{w} 성적표 줄이 {n}개예요')
            await pg.screenshot(path=f's77_report_{w}.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
