# 2.1.1 시험: 하루 한 번 바로 완공 표시와 건설 가속(도토리)
# 보는 것
#  1) 홈 지도 칩 '오늘 바로 완공 n곳 가능!'과 이름표 배지: 바로 완공을 쓰면 그 건물은 빠지고 n이 줄어요. 유치원에는 안 보여요
#  2) 건설 가속: 30분과 1시간, 도토리 값(수업료 분치), 그동안 공사가 2배(가속 전에 시작한 공사도 가속이 켜진 뒤부터만), 끝나면 1배, 6시간까지
#  3) 저장: cb, ff 읽기
#  4) 390 밝은, 360 어두운 화면에서 칩과 공사 칸의 가속 줄이 넘치지 않아요(캡처 s85_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s85test.py   (마지막 줄이 PASS면 통과)
import asyncio
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
            # 유치원: 칩 없음
            r = await ev("F.ffRender(true); return !document.querySelector('#ffChip').hidden;")
            ok(r is False, '유치원에도 바로 완공 칩이 보여요')
            # 1) 초등학교
            r = await ev("""S.tier = 1; S.tg = 0; S.sem = 0; S.budget = 1e15; S.ff = {}; S.bd = {};
              for (const k of ['classroom', 'cafeteria', 'library', 'playground', 'science']) { S.f[k] = 8; S.fu[k] = S.fu[k].map(() => 8); }
              F.renderMap(); F.ffRender(true);
              const n0 = F.facKeys().filter(F.ffCan).length, chip = document.querySelector('#ffChip'), t0 = chip.textContent, on0 = document.querySelector('#pq-classroom').classList.contains('ff-on');
              F.buyFacility('classroom'); F.ffRender(true);
              return { n0, t0, on0, lv: S.f.classroom, con: F.conOn('classroom'), n1: F.facKeys().filter(F.ffCan).length, t1: chip.textContent, on1: document.querySelector('#pq-classroom').classList.contains('ff-on'), vis: !chip.hidden };""")
            print(w, '바로 완공', r)
            ok(r['n0'] == 5 and '5곳' in r['t0'] and r['on0'], f'처음 칩과 배지 {r}')
            ok(r['lv'] == 9 and not r['con'] and r['n1'] == 4 and '4곳' in r['t1'] and not r['on1'] and r['vis'], f'바로 완공 뒤 {r}')
            await pg.evaluate(T.CLEAN); await pg.wait_for_timeout(1200)
            await pg.screenshot(path=f's85_chip_{w}.png')
            o = await pg.evaluate(OVER + "('#ffChip, #ffChip *')"); ok(not o, f'{w} 칩이 넘쳐요 {o}')
            # 2) 건설 가속
            if w == 390:
                r = await ev("""const t0 = Date.now(); F.rt.fakeNow = t0; S.ff = { library: F.gameToday(), cafeteria: F.gameToday() }; S.cb = { until: 0, at: t0 }; S.bd = {};
                  const it = F.CB.items[0], c = F.cbCost(it);
                  F.buyFacility('library'); const e0 = S.bd.library.e;
                  F.rt.fakeNow = t0 + 60e3; F.cbApply(); const pre = e0 - S.bd.library.e;   // 가속 전 1분: 그대로
                  const b0 = S.budget, ok1 = F.cbBuy('m30'); const paid = b0 - S.budget;
                  F.rt.fakeNow = t0 + 60e3 + 10 * 60e3; F.cbApply(); const mid = e0 - S.bd.library.e;   // 가속 10분: 10분 당겨짐
                  F.buyFacility('cafeteria'); const ce0 = S.bd.cafeteria.e;
                  F.rt.fakeNow = t0 + 60e3 + 40 * 60e3; F.cbApply(); const end = e0 - S.bd.library.e, cad = ce0 - S.bd.cafeteria.e;   // 가속은 31분에 끝: library 30분, 카페는 시작 뒤 20분만
                  const onAfter = F.cbOn();
                  S.cb = { until: 0, at: F.rt.fakeNow }; let n = 0; while (F.cbBuy('h1') && n < 10) n++;
                  const left = F.cbLeft();
                  F.rt.fakeNow = 0; S.bd = {}; S.cb = { until: 0, at: 0 };
                  return { c, paid, ok1, pre, mid, end, cad, onAfter, n, left };""")
                print('가속', r)
                ok(r['ok1'] and abs(r['paid'] - r['c']) < 1 and r['c'] > 0, f'가속 값 {r}')
                ok(r['pre'] == 0 and r['mid'] == 600000 and r['end'] == 1800000 and r['cad'] == 1200000 and not r['onAfter'], f'가속 셈 {r}')
                ok(r['n'] == 6 and r['left'] == 6 * 3600, f'6시간 상한 {r}')
                r = await ev("const d = JSON.parse(JSON.stringify(S)); d.cb = { until: 123, at: 45 }; d.ff = { classroom: '2026-10-29', bogus: 'x' }; const s = F.sanitize(d); return [s.cb, s.ff];")
                ok(r[0] == {'until': 123, 'at': 45} and r[1] == {'classroom': '2026-10-29'}, f'저장 {r}')
            # 4) 공사 칸의 가속 줄
            await ev("S.ff = { library: F.gameToday() }; S.bd = {}; S.f.library = 8; F.buyFacility('library'); F.openSheet('library'); return 1;")
            await pg.wait_for_timeout(600)
            r = await ev("const c = document.querySelector('#conCb'); return { vis: !c.hidden && !document.querySelector('#sheetCon').hidden, n: c.querySelectorAll('[data-cb]').length, t: c.textContent };")
            ok(r['vis'] and r['n'] == 2 and '건설 가속' in r['t'], f'{w} 공사 칸 가속 줄 {r}')
            await pg.evaluate("document.querySelector('#conCb').scrollIntoView({ block: 'center' })"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f's85_sheet_{w}.png')
            o = await pg.evaluate(OVER + "('#conCb, #conCb *')"); ok(not o, f'{w} 가속 줄이 넘쳐요 {o}')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
