# 2.1.0 시험: 공사 시간과 시간 단축권
# 보는 것
#  1) 공사 시간: 유치원 5초, 초등 1~3학년 30분 → 1시간, 4~6학년 1 → 2시간, 중학교 2 → 4시간, 새 건물은 긴 쪽
#  2) 두 학기 2차: 2학기에는 상한이 +2지만 학년 첫 레벨은 그대로, 2학기에 열린 레벨(상한 +1, +2)은 긴 쪽
#  3) 사기: 돈을 내면 공사, 같은 건물은 한 번에 한 레벨, 다른 건물은 동시에, 게임 시계가 지나면 레벨이 올라요
#  4) 단축권: 바로 줄이기 조합(큰 권부터, 자투리는 5분권, 모자라면 조금 넘는 가장 작은 권), 골라서 쓰기
#  5) 저장: 지금 레벨 다음 칸이 아닌 공사, 너무 긴 공사는 버려요. 단축권 장수
#  6) 390 밝은, 360 어두운 화면에서 공사 칸이 넘치지 않아요(캡처 s81_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s81test.py   (마지막 줄이 PASS면 통과)
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
                # 1) 2) 공사 시간
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, o = {{}};
                  S.tier = 0; S.tg = 0; S.sem = 0; o.kinder = F.conSec('library', 5);
                  S.tier = 1; S.tg = 0; o.e1 = [F.conSec('library', 14), F.conSec('library', 16), F.conSec('library', 18), F.conSec('science', 1)];
                  S.sem = 1; o.e1s2 = [F.conSec('library', 14), F.conSec('library', 18), F.conSec('library', 19), F.conSec('library', 20), F.facCap()];
                  S.sem = 0; S.tg = 3; o.e4 = [F.conSec('library', 29), F.conSec('library', 33)];
                  S.tier = 2; S.tg = 0; o.m1 = [F.conSec('library', 14), F.conSec('library', 18), F.conSec('store', 1)];
                  S.tier = 0; S.tg = 0; return o; }})()""")
                print('공사 시간', r)
                if r != {'kinder': 5, 'e1': [1800, 2700, 3600, 3600], 'e1s2': [1800, 3600, 3600, 3600, 20], 'e4': [3600, 7200], 'm1': [7200, 14400, 14400]}:
                    bad.append(f'공사 시간이 틀려요 {r}')
                # 3) 사기와 동시 공사
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, o = {{}}, t0 = Date.now(); F.rt.fakeNow = t0;
                  S.tier = 1; S.tg = 0; S.sem = 0; S.budget = 1e15;
                  for (const k of ['library', 'cafeteria']) {{ S.f[k] = 15; S.fu[k] = S.fu[k].map(() => 15); }}
                  S.budget = 1e13; const b0 = S.budget, c = F.facCost('library');
                  o.a = F.buyFacility('library'); o.paid = b0 - S.budget > 0 && b0 - S.budget <= c * (1 + 1e-9); o.lv = S.f.library; o.again = F.buyFacility('library');
                  o.b = F.buyFacility('cafeteria'); o.both = F.conOn('library') && F.conOn('cafeteria');
                  F.rt.fakeNow = t0 + 2699e3; F.conTick(); o.mid = S.f.library;
                  F.rt.fakeNow = t0 + 2701e3; F.conTick(); o.end = [S.f.library, S.f.cafeteria, F.conOn('library')];
                  return o; }})()""")
                print('사기', r)
                if r != {'a': True, 'paid': True, 'lv': 15, 'again': False, 'b': True, 'both': True, 'mid': 15, 'end': [16, 16, False]}:
                    bad.append(f'공사 사기가 틀려요 {r}')
                # 4) 단축권
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, o = {{}};
                  S.tk = {{ m5: 7, m30: 1, h1: 2, h3: 1 }};
                  const u = p => [p.use.h3, p.use.h1, p.use.m30, p.use.m5, p.left];
                  o.p1 = u(F.tkPlan(7800)); o.p2 = u(F.tkPlan(21000)); o.p3 = u(F.tkPlan(39600));
                  S.tk = {{ m5: 0, m30: 0, h1: 1, h3: 1 }}; o.p4 = u(F.tkPlan(3000));
                  S.tk = {{ m5: 1, m30: 1, h1: 0, h3: 0 }}; S.f.library = 15; S.fu.library = S.fu.library.map(() => 15); delete S.bd.library;
                  F.rt.fakeNow = Date.now(); F.buyFacility('library'); const L = F.conLeft('library');
                  F.tkUse('library', 'm5'); o.cut5 = L - F.conLeft('library'); o.m5 = S.tk.m5;
                  F.tkUseAll('library'); o.after = [F.conOn('library'), S.tk.m30, S.f.library];
                  F.rt.fakeNow = 0; return o; }})()""")
                print('단축권', r)
                if r['p1'] != [0, 2, 0, 2, 0] or r['p2'] != [1, 2, 1, 4, 0] or r['p3'] != [1, 2, 1, 7, 17700] or r['p4'] != [0, 1, 0, 0, 0] or r['cut5'] != 300 or r['m5'] != 0 or r['after'] != [True, 0, 15]:
                    bad.append(f'단축권이 틀려요 {r}')
                # 5) 저장
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const d = JSON.parse(JSON.stringify(F.S)); const n = Date.now();
                  d.f.library = 10; d.f.cafeteria = 10; d.f.classroom = 10;
                  d.bd = {{ library: {{ L: 11, s: n, e: n + 6e5 }}, cafeteria: {{ L: 13, s: n, e: n + 6e5 }}, classroom: {{ L: 11, s: n, e: n + 40 * 86400000 }} }};
                  d.tk = {{ m5: 3.7, m30: -2, h1: 'x', h3: 2 }};
                  const s = F.sanitize(d); return [Object.keys(s.bd), s.tk]; }})()""")
                print('저장', r)
                if r != [['library'], {'m5': 3, 'm30': 0, 'h1': 0, 'h3': 2}]: bad.append(f'공사 저장 읽기가 틀려요 {r}')
            # 6) 공사 칸 화면
            await pg.evaluate(T.CLEAN)
            await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 0; S.sem = 0; S.budget = 1e15; S.tk = {{ m5: 20, m30: 1, h1: 1, h3: 0 }};
              S.f.library = 10; S.fu.library = S.fu.library.map(() => 10); delete S.bd.library; F.rt.fakeNow = 0; F.buyFacility('library'); F.openSheet('library'); }})()""")
            await pg.wait_for_timeout(500)
            r = await pg.evaluate("""(() => { const c = document.querySelector('#sheetCon'), s = document.querySelector('#sheetWrap .sheet'); s.scrollTop = s.scrollHeight;
              const out = [...c.querySelectorAll('button')].some(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; });
              return { shown: !c.hidden, buy: document.querySelector('#sheetBuy').hidden, tks: c.querySelectorAll('.con-tk').length, plan: document.querySelector('#conPlan').textContent, out }; })()""")
            print(w, '공사 칸', r)
            if not r['shown'] or not r['buy'] or r['tks'] != 4 or not r['plan'] or r['out']: bad.append(f'{w} 공사 칸이 틀려요 {r}')
            await pg.wait_for_timeout(300); await pg.screenshot(path=f's81_con_{w}.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
