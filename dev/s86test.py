# 2.1.2 시험: 마을 기부(설계안 '마을 기부 설계안 (2.1.2)')
# 보는 것
#  1) 값: 단계마다 지금 수업료 × H(n)시간(1, 2, 3, 5, 8, 12, 18, 24, 그 뒤 +6시간), 10%, 50%, 남은 만큼, 모자라면 '있는 만큼'
#  2) 진행은 비율로: 수업료가 올라도 채운 비율은 그대로, 이번 단계를 넘겨서 내지 않아요
#  3) 보상: 1~8단계 숲의 정수 5 × 단계, 9단계부터 5단계마다 황금 도토리 1, 칭호(3단계 마을 후원자, 8단계 황금 나무 주인), 업적 줄(1, 3, 5, 8, 20)
#  4) 지도: 유치원에는 없고 초등학교, 중학교 지도에 기념물. 누르면 기부 창
#  5) 저장 읽기, 메인 퀘스트 vd1(2학년 장), vd2(4학년 장), 값이 유한해요
#  6) 390 밝은, 360 어두운 화면에서 창이 넘치지 않아요(캡처 s86_*), 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s86test.py   (마지막 줄이 PASS면 통과)
import asyncio, math
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
            r = await ev("F.renderMap(); return { open: F.vdOpen(), el: !!document.querySelector('#vdTop [data-vd]') };")
            ok(r == {'open': False, 'el': False}, f'유치원에 기부가 보여요 {r}')
            if w == 390:
                r = await ev("return [1,2,3,4,5,6,7,8,9,10,12].map(F.vdH);")
                ok(r == [1, 2, 3, 5, 8, 12, 18, 24, 30, 36, 48], f'H(n) {r}')
                r = await ev("""S.tier = 1; S.tg = 1; S.budget = 1e12; S.ess = 0; S.vd = { lv: 0, p: 0, sum: 0, n: 0 };
                  const need = F.vdNeed(), b0 = S.budget;
                  F.vdGive(0.1); const p1 = S.vd.p, paid1 = b0 - S.budget;
                  F.vdGive(0.5); const p2 = S.vd.p;
                  const left = F.vdLeft(); F.vdGive('left'); const lv1 = S.vd.lv, p3 = S.vd.p, e1 = S.ess;
                  document.querySelectorAll('.overlay').forEach(o => o.hidden = true);
                  return { need, paid1, p1, p2, left, lv1, p3, e1, n: S.vd.n, sum: S.vd.sum, rate: F.vdNeed() };""")
                print('기부', r)
                ok(abs(r['p1'] - 0.1) < 1e-4 and abs(r['paid1'] - math.ceil(r['need'] * 0.1)) <= 1, f'10% {r}')
                ok(abs(r['p2'] - 0.6) < 1e-4 and abs(r['left'] - r['need'] * 0.4) <= r['need'] * 1e-4 + 2, f'50%와 남은 만큼 {r}')
                ok(r['lv1'] == 1 and r['p3'] == 0 and r['e1'] == 5 and r['n'] == 3, f'1단계 {r}')
                # 비율은 그대로: 수업료가 바뀌어도 p는 안 바뀌어요
                r = await ev("""S.vd.p = 0.3; const p0 = S.vd.p, n0 = F.vdNeed(); S.f.classroom += 10; S.students += 500; const n1 = F.vdNeed(); return { p0, p: S.vd.p, n0, n1, left: F.vdLeft() };""")
                ok(r['p'] == 0.3 and r['n1'] != r['n0'] and abs(r['left'] - r['n1'] * 0.7) <= 2, f'비율 진행 {r}')
                # 모자라면 있는 만큼
                r = await ev("""S.vd.p = 0; S.budget = Math.floor(F.vdNeed() * 0.05); F.openVd(); const t = document.querySelector('#vdBtns').textContent, n = document.querySelectorAll('#vdBtns [data-vdk]').length;
                  const b0 = S.budget; document.querySelector('#vdBtns [data-vdk="all"]').click(); const after = { budget: S.budget, p: S.vd.p }; document.querySelectorAll('.overlay').forEach(o => o.hidden = true); return { t, n, b0, after };""")
                ok(r['n'] == 1 and '있는 만큼' in r['t'] and r['after']['budget'] < 1 and 0.04 < r['after']['p'] < 0.06, f'있는 만큼 {r}')
                r = await ev("S.budget = 0; return [F.vdGive(0.1), F.vdGive('all')];")
                ok(r == [False, False], f'도토리 없을 때 {r}')
                # 보상과 칭호: 2→8단계, 9~15단계
                r = await ev("""S.budget = 1e300; S.ess = 0; S.gold = 0; S.ach.title = ''; S.vd = { lv: 1, p: 0, sum: 0, n: 0 }; const g0 = S.gold;
                  const es = []; for (let i = 2; i <= 8; i++) { const e = S.ess; F.vdGive('left'); es.push(S.ess - e); }
                  const t8 = F.achTitles().map(t => t.id), title = S.ach.title;
                  const gs = []; for (let i = 9; i <= 15; i++) { const g = S.gold; F.vdGive('left'); gs.push(S.gold - g); }
                  document.querySelectorAll('.overlay').forEach(o => o.hidden = true);
                  return { es, t8, title, gs, lv: S.vd.lv, name: F.achTitleName('vdgold'), sum: S.vd.sum, fin: isFinite(S.vd.sum) && isFinite(S.budget) };""")
                print('보상', r)
                ok(r['es'] == [10, 15, 20, 25, 30, 35, 40], f'정수 {r["es"]}')
                ok(r['gs'] == [0, 1, 0, 0, 0, 0, 1], f'황금 도토리 {r["gs"]}')
                ok('vdpatron' in r['t8'] and 'vdgold' in r['t8'] and r['title'] == 'vdpatron' and r['name'] == '황금 나무 주인', f'칭호 {r}')
                ok(r['fin'], '값이 유한하지 않아요')
                r = await ev("F.achSync && F.achSync(true); return [S.ach.hit.donate, F.setTitle('vdgold'), S.ach.title];")
                ok(r[0] == 4 and r[1] is True and r[2] == 'vdgold', f'업적 줄과 칭호 달기 {r}')
                # 저장 읽기
                r = await ev("""const d = JSON.parse(JSON.stringify(S)); d.vd = { lv: 7.6, p: 1.5, sum: 'x', n: -3 }; d.ach.title = 'vdgold'; const s = F.sanitize(d);
                  const d2 = JSON.parse(JSON.stringify(S)); d2.vd = { lv: 2 }; d2.ach.title = 'vdgold'; const s2 = F.sanitize(d2); const d3 = JSON.parse(JSON.stringify(S)); delete d3.vd; const s3 = F.sanitize(d3);
                  return [s.vd, s.ach.title, s2.ach.title, s3.vd];""")
                LK = {'day': '', 'lv': 0, 'need': 0}   # 2.3.1 그날 가격
                ok(r[0] == {'lv': 7, 'p': 0.999999, 'sum': 0, 'n': 0, 'lk': LK} and r[1] == '' and r[2] == '' and r[3] == {'lv': 0, 'p': 0, 'sum': 0, 'n': 0, 'lk': LK}, f'저장 읽기 {r}')
                r = await ev("""const d = JSON.parse(JSON.stringify(S)); d.vd = { lv: 9, p: 0.2, sum: 5, n: 2 }; d.ach.title = 'vdgold'; return F.sanitize(d).ach.title;""")
                ok(r == 'vdgold', f'칭호 저장 {r}')
                # 메인 퀘스트
                r = await ev("""const q1 = F.MAIN.find(q => q.id === 'vd1'), q2 = F.MAIN.find(q => q.id === 'vd2'); S.vd = { lv: 2, p: 0, sum: 0, n: 1 };
                  return [q1 && q1.ch, q2 && q2.ch, F.qMeasure(q1), F.qMeasure(q2), F.qGoal(q2), F.qProg ? F.qProg(q2).text : ''];""")
                print('퀘스트', r)
                ok(r[0] == 6 and r[1] == 8 and r[2] == 1 and r[3] == 2 and r[4] == '마을 기부 3단계', f'퀘스트 {r}')
            # 지도와 창 (초등학교, 중학교)
            for t in (1, 2):
                await ev(f"S.tier = {t}; S.tg = 0; S.budget = 1e15; S.vd = {{ lv: {3 if t == 1 else 8}, p: 0.4, sum: 1, n: 1 }}; F.renderMap(); return 1;")
                await pg.evaluate(T.CLEAN); await pg.wait_for_timeout(900)
                r = await ev("const h = document.querySelector('#vdTop [data-vd]'); return !!h;")
                ok(r, f'{w} 학교급 {t} 지도에 기념물이 없어요')
                await pg.click('#vdTop [data-vd]', force=True); await pg.wait_for_timeout(700)
                r = await ev("return { vis: !document.querySelector('#mVd').hidden, n: document.querySelectorAll('#vdBtns [data-vdk]').length, t: document.querySelector('#vdLead').textContent };")
                ok(r['vis'] and r['n'] == 3, f'{w} 기부 창 {r}')
                await pg.screenshot(path=f's86_modal_{w}_{t}.png')
                o = await pg.evaluate(OVER + "('#mVd .modal, #mVd .modal *:not(svg *)')"); ok(not o, f'{w} 기부 창이 넘쳐요 {o}')
                await ev("document.querySelector('#vdClose').click(); return 1;"); await pg.wait_for_timeout(400)
                await pg.screenshot(path=f's86_map_{w}_{t}.png')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
