# 2.0.1 시험: 공부 2단계(과학 탐구 실험, 책 읽기)
# 보는 것
#  1) 짝 표: 재료 7개로 나오는 결과 카드 20장이 모두 한 번씩, 실패 카드 4장이 모두 나와요. 같은 재료 둘은 실패
#  2) 실험: 유치원에서는 안 열려요. 과학실이 있으면 하루 한 번. 성공은 도토리(수업료 15분치)와 과학 XP 45, 실패는 XP 15(2.1.0), 새 카드는 황금 1.
#     과학실 레벨이 낮으면 잠긴 재료는 못 써요. 날이 바뀌면 다시 할 수 있어요
#  3) 책 읽기: 도서관이 있어야 해요. 한 권씩, 15분 뒤 끝나면 국어 XP 25(2.1.0). 하루 3권. 날이 바뀌면 다시 3권
#  4) 저장: 옛 저장(lab, rd 없음)은 빈 칸으로, 망가진 값은 걸러요. 읽는 중인 책은 저장을 거쳐도 이어져요
#  5) 메인 퀘스트 rd1, lb1과 업적 lab
#  6) 390 밝은, 360 어두운 화면에서 실험 창, 노트, 책 창이 넘치지 않아요(캡처 s76_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s76test.py   (마지막 줄이 PASS면 통과)
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
                # 1) 짝 표
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const out = []; for (let a = 0; a < 7; a++) for (let b = a; b < 7; b++) out.push(F.labOf(a, b));
                  const rs = out.filter(x => x && x[0] === 'r'), fs = new Set(out.filter(x => x && x[0] === 'f'));
                  return {{ n: out.length, none: out.filter(x => !x).length, r: rs.length, ru: new Set(rs).size, f: fs.size, dbl: [0,1,2,3,4,5,6].every(i => F.labOf(i, i)[0] === 'f'), keys: F.LAB_KEYS.length }}; }})()""")
                print('짝', r)
                if r['none'] or r['r'] != 20 or r['ru'] != 20 or r['f'] != 4 or not r['dbl'] or r['keys'] != 24: bad.append(f'짝 표가 틀려요 {r}')
                # 2) 실험
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const out = {{}};
                  out.kinder = F.labRun(0, 2); S.tier = 1; S.f.science = 0; out.noLab = F.labRun(0, 2); S.f.science = 1;
                  out.lock = F.labRun(0, 4);
                  const b0 = S.budget, g0 = S.gold, x0 = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.sci);
                  const r1 = F.labRun(0, 2); out.r1 = r1 && r1.r; out.ok = r1 && r1.ok; out.isNew = r1 && r1.isNew;
                  out.db = S.budget - b0; out.dg = S.gold - g0; out.dx = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.sci) - x0;
                  out.again = F.labRun(1, 3); out.done = F.labDone();
                  F.rt.fakeNow = F.gameNow() + 86400000; out.next = F.labDone();
                  const x1 = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.sci), g1 = S.gold; const r2 = F.labRun(0, 0); out.r2 = r2 && r2.r; out.ok2 = r2 && r2.ok; out.dx2 = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.sci) - x1; out.dg2 = S.gold - g1;
                  F.rt.fakeNow = F.gameNow() + 86400000; const g2 = S.gold; const r3 = F.labRun(2, 0); out.same = r3 && r3.isNew; out.dg3 = S.gold - g2;
                  out.cnt = F.labCount(); out.n = S.lab.st.n; out.minV = Math.max(10, Math.round(F.rate() * 60 * 15 * 2));
                  F.rt.fakeNow = null; return out; }})()""")
                print('실험', r)
                if r['kinder'] or r['noLab'] or r['lock'] or r['r1'] != 'r04' or not r['ok'] or not r['isNew'] or r['db'] <= 0 or r['dg'] != 1 or r['dx'] != 45: bad.append(f'실험 첫날이 틀려요 {r}')
                if r['again'] or not r['done'] or r['next'] or r['r2'] != 'f04' or r['ok2'] or r['dx2'] != 15 or r['dg2'] != 1 or r['same'] or r['dg3'] != 0 or r['cnt'] != 2 or r['n'] != 3: bad.append(f'실험 다음 날이 틀려요 {r}')
                await pg.evaluate(T.CLEAN)
                # 3) 책 읽기
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const out = {{}}; F.rt.fakeNow = Math.floor((F.gameNow() + 9 * 3600000) / 86400000) * 86400000 + 86400000 + 3 * 3600000;   /* 다음 날 한국 시간 한낮에서 시작(게임 시계가 밤이면 자정을 넘어 하루 권수가 다시 차요) */ S.rd.day = ''; S.rd.n = 0; S.f.library = 0; out.noLib = F.rdStart('acorn'); S.f.library = 1;
                  const x0 = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.kor); out.s1 = F.rdStart('acorn'); out.s2 = F.rdStart('sea'); out.left = F.rdLeft();
                  F.rt.fakeNow = F.gameNow() + 14 * 60000; out.early = F.rdSettle();
                  F.rt.fakeNow = F.gameNow() + 2 * 60000; out.fin = F.rdSettle(); out.dx = ((a) => {{ let t = a.xp; for (let n = 1; n < a.lv; n++) t += F.AC.need(n); return t; }})(S.ac.kor) - x0; out.got = S.rd.got.acorn; out.cur = S.rd.cur;
                  F.rdStart('sea'); F.rt.fakeNow = F.gameNow() + 16 * 60000; F.rdSettle(); F.rdStart('dino'); F.rt.fakeNow = F.gameNow() + 16 * 60000; F.rdSettle();
                  out.four = F.rdStart('snow'); out.st = S.rd.st;
                  F.rt.fakeNow = F.gameNow() + 86400000; out.left2 = F.rdLeft(); out.s4 = F.rdStart('snow');
                  const d = JSON.parse(JSON.stringify(S)); const S2 = F.sanitize(d); out.keep = S2.rd.cur; out.keepAt = S2.rd.at === S.rd.at;
                  F.rt.fakeNow = null; return out; }})()""")
                print('책', r)
                if r['noLib'] or not r['s1'] or r['s2'] or r['left'] != 2 or r['early'] or not r['fin'] or r['dx'] != 25 or r['got'] != 1 or r['cur']: bad.append(f'책 읽기가 틀려요 {r}')
                if r['four'] or r['st'] != 3 or r['left2'] != 3 or not r['s4'] or r['keep'] != 'snow' or not r['keepAt']: bad.append(f'책 하루 제한이나 저장이 틀려요 {r}')
                await pg.evaluate(T.CLEAN)
                # 4) 옛 저장과 망가진 값
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const d = JSON.parse(JSON.stringify(F.S)); delete d.lab; delete d.rd; const a = F.sanitize(d);
                  const d2 = JSON.parse(JSON.stringify(F.S)); d2.lab = {{ day: 5, got: {{ r01: 3, zz: 9, r02: -4 }}, pairs: {{ '0+1': 1, 'x': 1 }}, last: {{ a: 0, b: 1, r: 'r09' }}, st: {{ n: 'a', ok: 99 }} }};
                  d2.rd = {{ day: [], n: 99, cur: 'nobook', at: 5, got: {{ acorn: 2, zz: 3 }}, st: -1 }}; const c = F.sanitize(d2);
                  return {{ a: [a.lab.st.n, Object.keys(a.lab.got).length, a.rd.st, a.rd.cur], got: Object.keys(c.lab.got), pairs: Object.keys(c.lab.pairs), last: c.lab.last, st: c.lab.st, rd: [c.rd.n, c.rd.cur, Object.keys(c.rd.got), c.rd.st, c.rd.day] }}; }})()""")
                print('저장', r)
                if r['a'] != [0, 0, 0, ''] or r['got'] != ['r01'] or r['pairs'] != ['0+1'] or r['last'] is not None or r['st'] != {'n': 0, 'ok': 0} or r['rd'] != [5, '', ['acorn'], 0, '']: bad.append(f'저장 읽기가 틀려요 {r}')   # 2.3.0 하루 권수 상한이 국어 선생님 몫 2권만큼 늘어 5
                # 5) 퀘스트와 업적
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const q1 = F.MAIN.find(q => q.id === 'rd1'), q2 = F.MAIN.find(q => q.id === 'lb1');
                  const i1 = F.MAIN.indexOf(q1), z1 = F.MAIN.findIndex(q => q.id === 'z1'), i2 = F.MAIN.indexOf(q2), e1 = F.MAIN.findIndex(q => q.id === 'el1');
                  const a = F.ACH.find(x => x.id === 'lab');
                  const nx = j => {{ j += 1; while (j < F.MAIN.length && F.MAIN[j].step) j += 1; return j; }};   // 2.1.1 한 단계 퀘스트는 건너뛰고 봐요
                  return {{ ok: !!q1 && !!q2, order: i1 === nx(z1) && i2 === nx(e1), m1: F.qMeasure(q1), m2: F.qMeasure(q2), g1: F.qGoal(q1), g2: F.qGoal(q2), ach: a && a.v(), title: a && a.title }}; }})()""")
                print('퀘스트', r)
                if not r['ok'] or not r['order'] or r['m1'] != 3 or r['m2'] != 3 or not r['g1'] or not r['g2'] or r['ach'] != 2 or r['title'] != '꼬마 과학자': bad.append(f'퀘스트나 업적이 틀려요 {r}')
            # 6) 화면
            await pg.evaluate(T.CLEAN)
            await pg.evaluate(f"(() => {{ const S = {F}.S; S.tier = 1; S.f.science = 12; S.f.library = 3; S.lab.day = ''; S.rd.cur = ''; S.rd.n = 0; }})()")
            await pg.evaluate("document.querySelector('[data-tab=\"mini\"]').click()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(() => { const c = ['#rdCard', '#labCard'].map(s => document.querySelector(s));
              return { tags: c.map(x => x.querySelector('.mini-play').textContent), over: c.some(el => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }) }; })()""")
            print(w, '공부 카드', r)
            if r['tags'] != ['고르기', '시작하기'] or r['over']: bad.append(f'{w} 공부 카드가 틀려요 {r}')
            await pg.evaluate(f"{F}.openLab()"); await pg.wait_for_timeout(500)
            await pg.evaluate(f"{F}.labTap(0); {F}.labTap(5)"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("""(() => { const m = document.querySelector('#mLab .modal').getBoundingClientRect(); const ins = document.querySelectorAll('#labIns .lab-in').length, lock = document.querySelectorAll('#labIns .lab-in.lock').length;
              return { ins, lock, over: m.right > innerWidth + 1 || m.left < -1, go: document.querySelector('#labGo').getAttribute('aria-disabled') }; })()""")
            print(w, '실험 창', r)
            if r['ins'] != 7 or r['lock'] != 1 or r['over'] or r['go'] != 'false': bad.append(f'{w} 실험 창이 틀려요 {r}')
            await pg.screenshot(path=f's76_lab_{w}.png')
            await pg.evaluate(f"(() => {{ const F = {F}; F.rt.labView = 'note'; F.S.lab.got.r01 = 1; F.S.lab.got.r11 = 1; F.renderLab(); }})()"); await pg.wait_for_timeout(200)
            n = await pg.evaluate("document.querySelectorAll('#labNote .lab-slot').length")
            if n != 12: bad.append(f'{w} 노트 칸이 {n}개예요')
            await pg.screenshot(path=f's76_note_{w}.png')
            await pg.evaluate(T.CLEAN); await pg.evaluate(f"{F}.openRead()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(() => { const m = document.querySelector('#mRead .modal').getBoundingClientRect(); return { n: document.querySelectorAll('#rdBooks .rd-book').length, over: m.right > innerWidth + 1 || m.left < -1 }; })()""")
            print(w, '책 창', r)
            if r['n'] != 12 or r['over']: bad.append(f'{w} 책 창이 틀려요 {r}')
            await pg.screenshot(path=f's76_read_{w}.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
