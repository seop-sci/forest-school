# 2.0.1 시험: 공부 4단계(숲속 대결)
# 보는 것
#  1) 열리는 때: 유치원, 초등 1~2학년 잠김, 초등 3학년(tg 2)부터, 중학교 열림
#  2) 점수식과 승부: 별 × 20 + 주사위(0~60) + 응원, 같은 점수면 별 높은 쪽, 그래도 같으면 내 승. 별 하나 차이 뒤집기(많이 돌려 15~40%), 두 별 차이 10% 아래
#  3) 상대 만들기: 같은 학교 연속 금지, 황금숲은 무지개 리그만, 종목 셋 서로 다름, 상대 별 1~5, 별 합 = 내 가장 좋은 배치 + 리그 보정(3~15)
#  4) 판 끝: 승 +25, 3연승부터 +5씩(최대 +15), 패 −10과 1000 바닥, 첫 승리 도토리 하루 한 번, 주간 리그 하루 25점까지, 리그 승급과 황금(내려가지 않음),
#     이긴 종목 과목 XP 10, 중학교 명부 능력치 +1(학생마다 하루 2번)
#  5) 하루 5판, 날이 바뀌면 다시. 저장 읽기(망가진 값), 퀘스트 bt1 bt2 bt3, 업적 battle league
#  6) 390 밝은, 360 어두운 화면: 고르기, 겨루기, 결과 화면이 넘치지 않아요(캡처 s78_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s78test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'

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
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const o = [];
                  S.tier = 0; S.tg = 3; o.push(F.btOpen()); S.tier = 1; S.tg = 1; o.push(F.btOpen()); S.tg = 2; o.push(F.btOpen()); S.tier = 2; S.tg = 0; o.push(F.btOpen()); S.tier = 1; S.tg = 2; return o; }})()""")
                if r != [False, False, True, True]: bad.append(f'열리는 때가 틀려요 {r}')
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const N = 20000; let w1 = 0, w2 = 0;
                  for (let i = 0; i < N; i++) {{ const a = F.btWin({{ ms: 3, os: 4, md: Math.floor(Math.random() * 61), od: Math.floor(Math.random() * 61), oc: 5 }}, 5); if (a) w1++;
                    const c = F.btWin({{ ms: 3, os: 5, md: Math.floor(Math.random() * 61), od: Math.floor(Math.random() * 61), oc: 5 }}, 5); if (c) w2++; }}
                  return {{ s: F.btScore(3, 10, 4), tie1: F.btWin({{ ms: 4, os: 3, md: 0, od: 20, oc: 0 }}, 0), tie2: F.btWin({{ ms: 3, os: 4, md: 20, od: 0, oc: 0 }}, 0), tie3: F.btWin({{ ms: 3, os: 3, md: 5, od: 5, oc: 2 }}, 2), p1: w1 / N, p2: w2 / N }}; }})()""")
                print('승부', r)
                if r['s'] != 74 or not r['tie1'] or r['tie2'] or not r['tie3'] or not (0.15 < r['p1'] < 0.4) or r['p2'] > 0.1: bad.append(f'점수식이나 승률이 틀려요 {r}')
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; let ok = true, gold = 0, prev = -1, rep = 0, sums = []; S.p.species = 3; for (const k of F.AC.keys) S.ac[k].lv = 9;
                  for (let i = 0; i < 300; i++) {{ S.bt.lg = i % 6; const M = F.btMake(); if (M.si === prev) rep++; prev = M.si; S.bt.last = M.si;
                    if (F.BT_SCH[M.si].gold) {{ gold++; if (S.bt.lg < 5) ok = false; }}
                    if (new Set(M.evs).size !== 3 || M.opp.some(o => o.st < 1 || o.st > 5)) ok = false;
                    const best = F.btBest(M.evs, F.btRoster()).sum, want = Math.max(3, Math.min(15, best + F.BT_LG[S.bt.lg].off + (F.BT_SCH[M.si].gold ? 1 : 0))), got = M.opp.reduce((a, o) => a + o.st, 0);
                    if (Math.abs(got - want) > 1) sums.push([want, got]); }}
                  S.bt.lg = 0; return {{ ok, gold, rep, sums: sums.slice(0, 5), nsum: sums.length }}; }})()""")
                print('상대', r)
                if not r['ok'] or r['rep'] or r['gold'] == 0 or r['nsum'] > 15: bad.append(f'상대 만들기가 틀려요 {r}')
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const out = {{}}; const mk = (w) => {{ const M = F.btMake(); M.me = F.btRoster().slice(0, 3); M.res = [0, 1, 2].map(i => ({{ win: w[i], ms: 3, os: 3, md: 0, od: 0, mc: 0, oc: 0 }})); return M; }};
                  const b0 = S.budget, x0 = F.AC.keys.reduce((a, k) => a + ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += 20 + 5 * n; return t; }})(S.ac[k]), 0);
                  const o1 = F.btFinish(mk([true, true, false])); out.d1 = o1.d; out.acorn = S.budget > b0; out.dx = F.AC.keys.reduce((a, k) => a + ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += 20 + 5 * n; return t; }})(S.ac[k]), 0) - x0;
                  const o2 = F.btFinish(mk([true, false, true])); out.acorn2 = !!o2.acorn;
                  const o3 = F.btFinish(mk([true, true, true])); out.d3 = o3.d;
                  const o4 = F.btFinish(mk([true, true, true])); out.d4 = o4.d;
                  out.lp = S.bt.lp.p; out.up = o4.up; out.lg = S.bt.lg;
                  const o5 = F.btFinish(mk([false, false, true])); out.d5 = o5.d; out.streak = S.bt.streak;
                  S.bt.pts = 1003; const o6 = F.btFinish(mk([false, false, false])); out.floor = S.bt.pts; out.lgKeep = S.bt.lg;
                  const twice = F.btFinish(o6 && mk([true, true, true])); out.st = S.bt.st;
                  return out; }})()""")
                print('판 끝', r)
                if r['d1'] != 25 or not r['acorn'] or r['dx'] != 20 or r['acorn2'] or r['d3'] != 30 or r['d4'] != 35 or r['lp'] != 20 or r['up'] != 1 or r['lg'] != 1: bad.append(f'승리 점수, 연승, 승급이 틀려요 {r}')
                if r['d5'] != -10 or r['streak'] != 0 or r['floor'] != 1000 or r['lgKeep'] != 1: bad.append(f'패배 점수나 리그 유지가 틀려요 {r}')
                # 중학교 명부 성장
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 2; F.rosterEnsure(); const s = S.roster.list[0]; s.a = [50, 50, 50, 50, 50]; const M = F.btMake(); M.me = F.btRoster().slice(0, 3); M.evs = ['math', 'kor', 'sci'];
                  M.res = [0, 1, 2].map(() => ({{ win: true, ms: 3, os: 3, md: 0, od: 0, mc: 0, oc: 0 }})); M.me[1] = M.me[0]; M.me[2] = M.me[0]; F.btFinish(M);
                  return {{ a: s.a.slice(), g: S.bt.grow.m[s.nm], wm: S.bt.st.wm }}; }})()""")
                print('명부', r)
                if sum(r['a']) != 252 or r['g'] != 2 or r['wm'] < 1: bad.append(f'명부 학생 성장(하루 2번)이 틀려요 {r}')
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 2; S.bt.n = 0; S.bt.day = F.gameToday(); const out = [];
                  for (let i = 0; i < 6; i++) {{ F.btOpenScene(); F.btAuto(); out.push(F.btStart()); F.btClose(); }}
                  F.rt.fakeNow = F.gameNow() + 86400000; const left = F.btLeft(); F.rt.fakeNow = null;
                  const d = JSON.parse(JSON.stringify(S)); d.bt = {{ pts: -5, lg: 9, n: 99, day: 4, last: 77, streak: 'x', st: {{ w: 3, l: -1 }} }}; const c = F.sanitize(d).bt;
                  const q = ['bt1', 'bt2', 'bt3'].map(id => F.MAIN.find(x => x.id === id)); const a = ['battle', 'league'].map(id => F.ACH.find(x => x.id === id));
                  return {{ out, left, c: [c.pts, c.lg, c.n, c.day, c.last, c.streak, c.st.w, c.st.l], q: q.map(x => !!x && !!F.qGoal(x)), a: a.map(x => x && x.title) }}; }})()""")
                print('하루', r)
                if r['out'] != [True] * 5 + [False] or r['left'] != 5 or r['c'] != [1000, 5, 5, '', -1, 0, 3, 0] or r['q'] != [True] * 3 or r['a'] != ['승부사', '숲속 챔피언']: bad.append(f'하루 제한, 저장, 퀘스트, 업적이 틀려요 {r}')
                await pg.evaluate(f"{F}.S.bt.n = 0")
            # 6) 화면
            await pg.evaluate(T.CLEAN)
            await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 2; S.bt.n = 0; F.btOpenScene(); F.btAuto(); }})()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(() => { const els = [...document.querySelectorAll('#btScene .bt-row, #btScene .bt-cand, #btGo')]; return { rows: document.querySelectorAll('#btRows .bt-row').length, go: document.querySelector('#btGo').getAttribute('aria-disabled'), over: els.some(el => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1 || r.bottom > innerHeight + 1; }) }; })()""")
            print(w, '고르기', r)
            if r['rows'] != 3 or r['go'] != 'false' or r['over']: bad.append(f'{w} 고르기 화면이 틀려요 {r}')
            await pg.screenshot(path=f's78_pick_{w}.png')
            await pg.evaluate(f"{F}.btStart()"); await pg.wait_for_timeout(1200)
            for i in range(4): await pg.mouse.click(w // 2, 420); await pg.wait_for_timeout(60)
            await pg.screenshot(path=f's78_play_{w}.png')
            await pg.wait_for_timeout(14000)
            ph = await pg.evaluate(f"{F}.btUI.M && {F}.btUI.M.phase")
            if ph != 'result': bad.append(f'{w} 결과 화면으로 안 넘어갔어요 {ph}')
            await pg.screenshot(path=f's78_result_{w}.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
