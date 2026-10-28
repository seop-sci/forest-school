# 2.0.1 시험: 공부 탭(과목 5개 학교 학력)
# 보는 것
#  1) 새 저장: ac 다섯 과목 Lv.1, 상한 유치원 10. acGain으로 레벨업, 상한에서 멈추고 XP는 모아 둠, 학교급이 오르면(acAll) 풀림
#  2) 퍼즐 pzFinish: 보상 판은 50점마다 1 XP(판당 30까지), 연습 판은 0. 합치기 주문: 단계 × 2 × 개수(주문당 40까지)
#  3) 문제집: 정수 10에 +50, 과목마다 하루 2권, 정수 부족이면 안 됨, 날이 바뀌면 다시 2권
#  4) 수업료 배수 acMult(합 × 0.1%), 평판 acRepOf(10레벨마다 +1), 동아리 수학부(5곳, clubTuitionMult에 포함)
#  5) 옛 저장(ac 없음): 퍼즐 판 수 × 8, 합치기 주문 × 8로 환산. 명부 네 칸 저장은 수학 칸을 채움
#  6) 메인 퀘스트 sa1~sa5 qMeasure, qGoal, goTo. 공부 탭에 과목 5줄과 문제집 단추가 보임
#  7) 390 밝은, 360 어두운 화면에서 공부 탭이 넘치지 않아요(캡처 s75_390.png, s75_360.png). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s75test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
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
                # 1) 새 저장과 레벨 곡선, 상한
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const lv0 = F.AC.keys.map(k => S.ac[k].lv), cap = F.acCap();
                  F.acGain('math', 20); const a = S.ac.math.lv; F.acGain('math', 5); const b2 = S.ac.math.lv;   // 20+5*1 = 25에서 Lv.2
                  F.acGain('math', 100000); const c = S.ac.math.lv, left = S.ac.math.xp;
                  S.tier = 1; const up = F.acAll(); const d = S.ac.math.lv; S.tier = 0;
                  return {{ lv0, cap, a, b2, c, left, up, d, sum: F.acSum() }}; }})()""")
                print('레벨', r)
                if r['lv0'] != [1, 1, 1, 1, 1] or r['cap'] != 10 or r['a'] != 1 or r['b2'] != 2 or r['c'] != 10 or r['left'] <= 0 or r['d'] != 20 or r['up'] != 10: bad.append(f'레벨 곡선이나 상한이 틀려요 {r}')
                # 2) 퍼즐과 합치기 XP
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 2; F.acAll(); const x0 = S.ac.math.xp + 0;
                  const g = F.pzFreshGame(true); g.score = 1234; const r1 = F.pzFinish(g);
                  const g2 = F.pzFreshGame(false); g2.score = 1234; const r2 = F.pzFinish(g2);
                  const g3 = F.pzFreshGame(true); g3.score = 9000; const r3 = F.pzFinish(g3);
                  return {{ x1: r1.xp, x2: r2.xp, x3: r3.xp }}; }})()""")
                print('퍼즐 XP', r)
                if r['x1'] != 24 or r['x2'] != 0 or r['x3'] != 30: bad.append(f'퍼즐 XP가 틀려요 {r}')
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const a0 = S.ac.art.lv * 1000 + S.ac.art.xp;
                  S.mg.orders = [{{ it: [{{ k: 'a', n: 5, c: 2 }}], who: 'rabbit' }}];
                  const cells = F.mgCells(); let put = 0; for (let i = 0; i < cells.length && put < 2; i++) if (cells[i] === '..') {{ cells[i] = 'a5'; put++; }} F.mgSetCells(cells);
                  const ok = F.mgClaimOrder(0); const a1 = S.ac.art.lv * 1000 + S.ac.art.xp;
                  return {{ ok, got: S.ac.st.xp, d: a1 - a0 }}; }})()""")
                print('합치기 XP', r)
                if not r['ok'] or r['d'] != 20: bad.append(f'합치기 XP가 틀려요(5단계 × 2 × 2개 = 20) {r}')
                await pg.evaluate(T.CLEAN)
                # 3) 문제집
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.ess = 25; const l0 = F.acBkLeft('kor'), x0 = S.ac.kor.xp + S.ac.kor.lv * 1000;
                  const b1 = F.acBuyBook('kor'), b2 = F.acBuyBook('kor'), b3 = F.acBuyBook('kor'); const l1 = F.acBkLeft('kor'), ess = S.ess;
                  S.ess = 100; const b4 = F.acBuyBook('kor'); const bk = S.ac.st.bk;
                  F.rt.fakeNow = F.gameNow() + 86400000; const l2 = F.acBkLeft('kor'); F.rt.fakeNow = null;
                  return {{ l0, b1, b2, b3, l1, ess, b4, bk, l2, lv: S.ac.kor.lv }}; }})()""")
                print('문제집', r)
                if r['l0'] != 2 or not r['b1'] or not r['b2'] or r['b3'] or r['l1'] != 0 or r['ess'] != 5 or r['b4'] or r['bk'] != 2 or r['l2'] != 2: bad.append(f'문제집이 틀려요 {r}')
                await pg.evaluate(T.CLEAN)
                # 4) 수업료, 평판, 수학부
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 2; for (const k of F.AC.keys) {{ S.ac[k].lv = 30; S.ac[k].xp = 0; }}
                  const m = F.acMult(), rp = F.acRepOf(S), n = F.CLUBS.length, abil = F.ABIL.slice();
                  F.rosterEnsure(); const five = S.roster.list.every(s => s.a.length === 5); const kid = S.roster.list[0];
                  F.clubAuto(true); const mat = F.clubMembers(4).length; const tm = F.clubTuitionMult();
                  return {{ m, rp, n, abil, five, a: kid.a, mat, tm, pct4: F.clubPct(4) }}; }})()""")
                print('수업료', r)
                if abs(r['m'] - 1.15) > 1e-9 or r['rp'] != 15 or r['n'] != 5 or r['abil'] != ['과학', '체육', '국어', '미술', '수학'] or not r['five']: bad.append(f'수업료 배수나 과목이 틀려요 {r}')
                tm2 = await pg.evaluate(f"1 + ({F}.clubPct(0) + {F}.clubPct(2) + {F}.clubPct(4)) / 100")
                if min(r['a']) < 70 or r['mat'] < 1 or abs(r['tm'] - tm2) > 1e-9: bad.append(f'명부 시작 능력(학력 30이면 70 이상)이나 수학부가 틀려요 {r}')
                # 5) 옛 저장 환산
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const d = JSON.parse(JSON.stringify(F.S)); delete d.ac; d.tier = 1; d.st.pz = 50; d.mg.st.orders = 10;
                  d.roster.list = [{{ sp: 'rabbit', nm: '도토리', a: [50, 50, 50, 50], c: 0, cw: 0 }}];
                  const s = F.sanitizeOnly ? F.sanitizeOnly(d) : null; const s2 = {{}}; s2.tier = 1; F.sanitizeAc(d, s2);
                  const r2 = {{}}; return {{ math: s2.ac.math.lv, mx: s2.ac.math.xp, art: s2.ac.art.lv, ax: s2.ac.art.xp, kor: s2.ac.kor.lv }}; }})()""")
                print('옛 저장', r)
                # 수학 400 XP: Lv.1→2 25, →3 30, →4 35, →5 40, →6 45, →7 50, →8 55, →9 60 (합 340) 남은 60, →10 65 안 됨 → Lv.9
                if r['math'] != 9 or r['mx'] != 60 or r['art'] != 3 or r['ax'] != 25 or r['kor'] != 1: bad.append(f'옛 저장 환산이 틀려요 {r}')
                r = await pg.evaluate(f"""(() => {{ const F = {F}; F.S.tier = 2; const d = JSON.parse(JSON.stringify(F.S));
                  d.roster.list = [{{ sp: 'rabbit', nm: '도토리', a: [50, 50, 50, 50], c: 0, cw: 0 }}]; d.club.shown = [1, 0, 0, 0];
                  const S = F.sanitize(d); return {{ a: S.roster.list[0].a, shown: S.club.shown, lv: S.ac.math.lv }}; }})()""")
                print('옛 명부', r)
                if len(r['a']) != 5 or not (1 <= r['a'][4] <= 100) or r['shown'] != [1, 0, 0, 0, 0] or r['lv'] != 30: bad.append(f'옛 명부 수학 칸이나 발표회 칸이 틀려요 {r}')
                # 6) 메인 퀘스트
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const out = {{}};
                  for (const id of ['sa1', 'sa2', 'sa3', 'sa4', 'sa5']) {{ const q = F.MAIN.find(q => q.id === id); out[id] = q ? [q.ch, F.qGoal(q), F.qMeasure(q)] : null; }}
                  const z1 = F.MAIN.find(q => q.id === 'z1'); out.z1 = z1.title;
                  F.goTo(F.MAIN.find(q => q.id === 'sa2')); out.tab = F.rt.tab; return out; }})()""")
                print('퀘스트', r)
                if any(r[k] is None for k in ['sa1', 'sa2', 'sa3', 'sa4', 'sa5']) or r['sa1'][2] != 30 or r['tab'] != 'mini' or '수학 공부' not in r['z1']: bad.append(f'퀘스트가 틀려요 {r}')
                await pg.wait_for_timeout(300)
            # 7) 공부 탭 화면
            await pg.evaluate(f"{F}.rt.cereOn = false"); await pg.evaluate(T.CLEAN)
            await pg.evaluate(f"(() => {{ const F = {F}; F.S.ess = 123; document.querySelector('[data-tab=\"mini\"]').click(); }})()"); await pg.wait_for_timeout(500)
            r = await pg.evaluate("""(() => { const rows = document.querySelectorAll('#acList .ac-row').length, bk = document.querySelectorAll('#acList [data-book]').length;
              const tab = document.querySelector('[data-tab="mini"]').textContent.trim(), ttl = document.querySelector('#ttlMini').textContent.trim();
              const over = [...document.querySelectorAll('#panelMini .ac-row, #panelMini .mini-card')].some(el => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; });
              return { rows, bk, tab, ttl, over }; })()""")
            print(w, '화면', r)
            if r['rows'] != 5 or r['bk'] != 5 or r['tab'] != '공부' or r['ttl'] != '공부' or r['over']: bad.append(f'{w} 공부 탭 화면이 틀려요 {r}')
            await pg.screenshot(path=f's75_{w}.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
