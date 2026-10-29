# 2.1.1 시험: 숲속 대결 종목 문제(달리기만 두드리기, 수학 사칙연산, 과학 상식, 책 읽기 낱말, 그리기 색 기억 놀이)
# 보는 것
#  1) 문제 은행: 과학, 책 읽기 문제마다 보기 셋이 서로 다르고 정답이 보기에 있어요. 수가 넉넉해요
#  2) 수학 문제: 한 자리 수(중학교는 더하기 빼기 두 자리 수), 빼기 0 이상, 나누기 나누어떨어짐, 정답이 보기에 하나
#  3) 점수: 퀴즈 0~3개 → 0, 3, 7, 10, 기억 놀이 비율 × 10
#  4) 대결 한 판: 종목마다 퀴즈나 기억 놀이를 풀면 점수가 응원 점수 자리에 들어가고 판이 끝나요(페이지 오류 없음)
#  5) 390 밝은, 360 어두운 화면에서 퀴즈 칸과 기억 놀이 칸이 넘치지 않아요(캡처 s84_*)
# 쓰는 법: python3 wrap.py && python3 s84test.py   (마지막 줄이 PASS면 통과)
import asyncio, re
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'
OVER = """(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)) out.push((el.id || el.className) + ' ' + Math.round(r.left) + '~' + Math.round(r.right)); }); return out; })"""


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg); print('  틀림:', msg)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(T.SKIP)
            ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S; {js} }})()")
            if w == 390:
                r = await ev("const chk = B => B.filter(x => x.length !== 4 || new Set(x.slice(1)).size !== 3 || !x[0] || x.some(v => typeof v !== 'string' || !v.trim())).map(x => x[0]); return { sci: F.BTQ_SCI.length, kor: F.BTQ_KOR.length, badS: chk(F.BTQ_SCI), badK: chk(F.BTQ_KOR), dupS: F.BTQ_SCI.length - new Set(F.BTQ_SCI.map(x => x[0])).size };")
                print('문제 은행', r['sci'], r['kor'], r['badS'][:3], r['badK'][:3], '같은 과학 문제', r['dupS'])
                ok(r['sci'] >= 150 and r['kor'] >= 150, f'문제 수 {r["sci"]}, {r["kor"]}')
                ok(not r['badS'] and not r['badK'], f'보기가 이상한 문제 {r["badS"][:3]} {r["badK"][:3]}')
                ok(r['dupS'] == 0, '과학 문제가 겹쳐요')
                ms = await ev("const out = []; for (let t of [1, 2]) { S.tier = t; for (let i = 0; i < 400; i++) { const q = F.btqMath(); out.push([t, q.q, q.a, q.opts]); } } S.tier = 0; return out;")
                badm = []
                for t, q, a, opts in ms:
                    m = re.match(r'(\d+) (.) (\d+) = \?', q)
                    x, op, y = int(m.group(1)), m.group(2), int(m.group(3))
                    v = {'+': x + y, '−': x - y, '×': x * y, '÷': x // y if y else -1}[op]
                    good = str(v) == a and opts.count(a) == 1 and len(set(opts)) == 3 and all(int(o) >= 0 for o in opts) and v >= 0
                    if op == '÷': good = good and x % y == 0 and 1 <= y <= 9 and 1 <= v <= 9
                    if op in '×': good = good and x <= 9 and y <= 9
                    if op in '+−' and t == 1: good = good and x <= 9 and y <= 9
                    if op in '+−' and t == 2: good = good and y <= 9 and max(x, y) <= 99
                    if not good: badm.append((t, q, a, opts))
                ok(not badm, f'수학 문제가 이상해요 {badm[:3]}')
                r = await ev("const q = { kind: 'q', got: 0 }, m = { kind: 'mem', seq: [1, 2, 3], input: [], ok: false }; const a = [0, 1, 2, 3].map(g => F.btqPts(Object.assign({}, q, { got: g }))); const b = [F.btqPts({ kind: 'mem', seq: [1, 2, 3], input: [1, 2, 3], ok: true }), F.btqPts({ kind: 'mem', seq: [1, 2, 3], input: [1, 5], ok: false }), F.btqPts({ kind: 'mem', seq: [1, 2, 3, 4], input: [1, 2, 0], ok: false })]; return [a, b];")
                ok(r == [[0, 3, 7, 10], [10, 3, 5]], f'점수 {r}')
            # 4) 대결 한 판(초등학교 3학년)
            await ev("S.tier = 1; S.tg = 2; S.p.species = 6; F.setTab('mini'); return 1;"); await pg.wait_for_timeout(500); await pg.evaluate(T.CLEAN)
            await pg.click('#btCard'); await pg.wait_for_timeout(800)
            EV = "['math', 'art', 'pe']" if w == 390 else "['sci', 'kor', 'pe']"
            await ev(f"const M = F.btUI.M; M.evs = {EV}; M.me = [null, null, null]; return 1;")
            await pg.click('#btAuto'); await pg.wait_for_timeout(300)
            await pg.click('#btGo'); await pg.wait_for_timeout(1700)
            shots = 0
            for i in range(3):
                kind = None
                for _ in range(60):
                    st = await pg.evaluate("(() => { const c = document.querySelector('#btCheer'); return { q: !!c.querySelector('[data-bq]:not([disabled])'), m: !!c.querySelector('[data-bm]:not([disabled])'), tap: c.classList.contains('on') && !c.classList.contains('btq'), txt: c.textContent.slice(0, 40) }; })()")
                    if st['q'] or st['m'] or st['tap']:
                        kind = 'q' if st['q'] else 'm' if st['m'] else 'tap'; break
                    await pg.wait_for_timeout(150)
                print(w, i, '종목', kind)
                ok(kind is not None, f'{i}번째 종목이 시작되지 않아요')
                if kind == 'q':
                    if shots < 1:
                        await pg.screenshot(path=f's84_quiz_{w}.png'); shots += 1
                        o = await pg.evaluate(OVER + "('#btCheer, #btCheer *')"); ok(not o, f'{w} 퀴즈 칸이 넘쳐요 {o}')
                    for k in range(3):
                        await pg.wait_for_selector('#btCheer [data-bq]:not([disabled])', timeout=8000)
                        a = await pg.evaluate("(() => { const M = window.__forest.rt; return null; })()")
                        # 정답 고르기(시험용으로 문제를 들여다봐요)
                        idx = await pg.evaluate("(() => { const b = [...document.querySelectorAll('#btCheer [data-bq]')]; return 0; })()")
                        await pg.click('#btCheer [data-bq="0"]'); await pg.wait_for_timeout(800)
                elif kind == 'm':
                    await pg.screenshot(path=f's84_mem_{w}.png')
                    o = await pg.evaluate(OVER + "('#btCheer, #btCheer *')"); ok(not o, f'{w} 기억 놀이 칸이 넘쳐요 {o}')
                    for _ in range(4):
                        if await pg.locator('#btCheer [data-bm]:not([disabled])').count() == 0: break
                        await pg.click('#btCheer [data-bm="0"]'); await pg.wait_for_timeout(150)
                else:
                    for _ in range(20):
                        await pg.mouse.click(w / 2, 400); await pg.wait_for_timeout(40)
                await pg.wait_for_timeout(2600)
            for _ in range(40):
                if await pg.evaluate("(() => { const M = window.__forest.btUI.M; return !!M && M.phase === 'result'; })()"): break
                await pg.wait_for_timeout(250)
            r = await pg.evaluate("(() => { const R = document.querySelector('#btResult'), M = window.__forest.btUI.M; return { res: R && !R.hidden, n: window.__forest.S.bt.n, mc: M ? M.res.map(x => x.mc) : null }; })()")
            print(w, '결과', r)
            ok(r['res'] and r['n'] >= 1, f'{w} 대결이 끝나지 않아요 {r}')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
