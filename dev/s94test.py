# 2.2.0 시험: 학교 텃밭과 오늘의 급식
# 보는 것
#  1) 밭 칸: 유치원 2, 초등학교 3, 중학교 4. 급식실이 없으면 닫혀요. 학교급에 맞는 작물만 심어요
#  2) 심기 → 물 주기(남은 시간 -20%) → 다 자라면 거두기(물 준 작물 2개, 아니면 1개). 비 오는 날은 저절로 물
#  3) 오늘의 급식: 재료를 쓰고 그날 수업료 +5%(재료 3가지 +8%), 하루 한 번, 처음 메뉴 정수 3, 8가지에 황금 1. 다음 날 효과 끝
#  4) 영양 선생님 Lv.5마다 +1%p, 간식 뽑기와 마을 기부 값은 급식 효과를 빼고 셈
#  5) 메인 퀘스트 gd1, gd2(유치원 2장), 패스 미션 gd, 업적 garden, 저장 읽기
#  6) 창 화면(390 밝은, 360 어두운) 넘침 없음, 급식실 창 단추, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s94test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)) out.push((el.id || el.className) + ' ' + Math.round(r.left) + '~' + Math.round(r.right)); }); return out; })"""
K = "((d, h, m) => Date.UTC(2026, 10, d, h - 9, m || 0))"


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
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S, K = {K}; {js} }})()")
            if w == 390:
                # 1) 칸과 열림
                r = await ev("""F.rt.fakeNow = K(3, 9); S.f.cafeteria = 0; const closed = !F.gdOpen ? null : F.openGd === undefined;
                  const shut = F.gdPlant(0, 'lettuce');
                  S.f.cafeteria = 1; S.tier = 0; F.gdSync(); const n0 = F.gdN(), corn0 = F.gdPlant(0, 'corn');
                  S.tier = 1; const n1 = F.gdN(); S.tier = 2; const n2 = F.gdN(); S.tier = 0; F.gdSync();
                  return { shut, n0, n1, n2, corn0, plots: S.gn.plots.length };""")
                print('칸', r)
                ok(r['shut'] is False and r['n0'] == 2 and r['n1'] == 3 and r['n2'] == 4 and r['corn0'] is False, f'밭 칸과 열림 {r}')
                # 2) 심기, 물, 거두기 (11/3은 비가 아닌 날인지 먼저 확인)
                r = await ev("""const wx = F.wxOf ? F.wxOf('2026-11-03') : '';
                  F.rt.fakeNow = K(3, 9); S.gn.inv = {}; S.gn.st = { h: 0, cook: 0, plant: 0 };
                  const p1 = F.gdPlant(0, 'lettuce'), p2 = F.gdPlant(1, 'carrot'), again = F.gdPlant(0, 'potato');
                  const e0 = S.gn.plots[1].e; F.rt.fakeNow = K(3, 9, 10); F.gdWater(1); const cut = (e0 - S.gn.plots[1].e) / 60000;
                  const early = F.gdHarvest(0);
                  F.rt.fakeNow = K(3, 10, 30); const h1 = F.gdHarvest(0), h2 = F.gdHarvest(1);
                  return { wx, p1, p2, again, cut, early, h1, h2, inv: { ...S.gn.inv }, st: { ...S.gn.st }, ready: F.gdReadyN() };""")
                print('가꾸기', r)
                ok(r['p1'] and r['p2'] and r['again'] is False, f'심기 {r}')
                ok(abs(r['cut'] - 10) < 0.01, f'물 주기 -20%(남은 50분의 20%) {r}')
                ok(r['early'] is False and r['h1'] and r['h2'] and r['inv'] == {'lettuce': 1, 'carrot': 2} and r['st']['h'] == 2, f'거두기 {r}')
                # 3) 오늘의 급식
                r = await ev("""const r0 = F.rate(), m0 = F.gdMult(); const g0 = S.gold, e0 = S.ess;
                  const c1 = F.gdCook('menu_01'), r1 = F.rate(), m1 = F.gdMult(), inv = { ...S.gn.inv }, e1 = S.ess - e0;
                  S.gn.inv = { lettuce: 5, carrot: 5, potato: 5 }; const c2 = F.gdCook('menu_02');
                  F.rt.fakeNow = K(4, 9); const m2 = F.gdMult(), c3 = F.gdCook('menu_09'), m3 = F.gdMult(), pct3 = F.gdPct(F.GD_M.menu_09);
                  // 메뉴 8가지에 황금 1
                  const gg = S.gold; S.gn.menu = Object.fromEntries(['01', '02', '03', '04', '06', '07', '08'].map(n => ['menu_' + n, 1])); S.gn.g8 = false; S.gn.inv = { tomato: 9, lettuce: 9 }; S.tier = 1;
                  F.rt.fakeNow = K(5, 9); const c4 = F.gdCook('menu_05'), g8 = S.gold - gg; S.tier = 0;
                  return { m0, c1, ratio: r1 / r0, m1, inv, e1, c2, m2, c3, m3, pct3, c4, g8, cook: S.gn.st.cook };""")
                print('급식', r)
                ok(r['m0'] == 1 and r['c1'] and abs(r['ratio'] - 1.05) < 1e-9 and r['inv'] == {'lettuce': 0, 'carrot': 1} and r['e1'] == 3, f'첫 급식 +5% {r}')
                ok(r['c2'] is False and r['m2'] == 1 and r['c3'] and abs(r['m3'] - 1.08) < 1e-9 and r['pct3'] == 8, f'하루 한 번, 다음 날 끝, 재료 3가지 +8% {r}')
                ok(r['c4'] and r['g8'] == 1 and r['cook'] == 3, f'메뉴 8가지 황금 {r}')
                # 4) 영양 선생님, 간식과 기부 값
                r = await ev("""S.xt.diet = 10; const pct = F.gdPct(F.GD_M.menu_01); S.xt.diet = 20; const mx = F.gdPct(F.GD_M.menu_09); S.xt.diet = 0;
                  const sb = F.snBase ? F.snBase() : null; return { pct, mx };""")
                ok(r['pct'] == 7 and r['mx'] == 11, f'영양 선생님 {r}')
                # 비 오는 날 저절로 물
                r = await ev("""let day = null; for (let d = 6; d <= 30; d++) { const s = `2026-11-${String(d).padStart(2, '0')}`; if (F.wxOf(s) === 'rain') { day = d; break; } }
                  if (!day) return { day };
                  F.rt.fakeNow = K(day, 9); S.gn.plots[0] = { c: 'potato', s: K(day, 8), e: K(day, 10), w: 0 }; S.gn.wx = ''; F.gdSync();
                  const auto = S.gn.plots[0].w, e = (S.gn.plots[0].e - K(day, 9)) / 60000;
                  const p = F.gdPlant(1, 'lettuce') ? S.gn.plots[1].w : -1;
                  return { day, auto, e, p };""")
                print('비', r)
                ok(r['day'] is None or (r['auto'] == 1 and abs(r['e'] - 48) < 0.01 and r['p'] == 1), f'비 오는 날 물 {r}')
                # 5) 퀘스트, 패스, 업적, 저장
                r = await ev("""const ids = F.MAIN.map(q => q.id), i1 = ids.indexOf('gd1'), i2 = ids.indexOf('gd2');
                  const ch = [F.MAIN[i1].ch, F.MAIN[i2].ch], m1 = F.qMeasure ? F.qMeasure(F.MAIN[i1]) : null, m2 = F.qMeasure ? F.qMeasure(F.MAIN[i2]) : null;
                  const ps = F.PS_M && F.PS_M.gd ? F.PS_M.gd.v() : null, ach = F.ACH ? F.ACH.find(a => a.id === 'garden') : null;
                  const a = F.sanitize({ ...JSON.parse(JSON.stringify(S)), gn: { plots: [{ c: 'xx' }, { c: 'corn', s: 1, e: 2, w: 3 }], inv: { lettuce: 500, bad: 3 }, menu: { menu_01: 2, menu_99: 1 }, today: { day: '2026-11-05', id: 'menu_77' }, g8: 1, st: { h: -4 } } });
                  const b = F.sanitize({ ...JSON.parse(JSON.stringify(S)), gn: undefined });
                  return { i1, i2, ch, m1, m2, ps, ach: ach ? [ach.title, ach.v()] : null, a: a.gn, b: b.gn.plots.length };""")
                print('퀘스트와 저장', {k: v for k, v in r.items() if k != 'a'})
                ok(r['i1'] > 0 and r['i2'] == r['i1'] + 1 and r['ch'] == [2, 2], f'메인 퀘스트 자리 {r}')
                ok(r['m1'] == 2 and r['m2'] == 3, f'메인 퀘스트 셈 {r}')
                ok(r['ps'] == 2 and r['ach'] == ['숲속 요리사', 8], f'패스 미션과 업적 {r}')
                a = r['a']
                ok(a['plots'][0]['c'] == '' and a['plots'][1] == {'c': 'corn', 's': 1, 'e': 2, 'w': 1} and a['inv'] == {'lettuce': 99} and a['menu'] == {'menu_01': 2}
                   and a['today']['id'] == '' and a['g8'] is False and a['st']['h'] == 0 and r['b'] == 0, f'저장 읽기 {a}')
            # 6) 화면
            r = await ev("""S.tier = 1; S.f.cafeteria = Math.max(S.f.cafeteria, 3); F.rt.fakeNow = K(20, 9); F.gdSync();
              S.gn.plots = [{ c: 'lettuce', s: K(20, 8), e: K(20, 8, 20), w: 1 }, { c: 'corn', s: K(20, 8), e: K(20, 11), w: 0 }, { c: '', s: 0, e: 0, w: 0 }];
              S.gn.inv = { lettuce: 3, carrot: 2, potato: 1, corn: 2 }; S.gn.today = { day: '', id: '' };
              F.openGd(); F.rt.gdPick = 2; F.gdRender(true);
              return { plots: document.querySelectorAll('#gdPlots .gd-plot').length, menus: document.querySelectorAll('#gdMenus .gd-menu').length, can: document.querySelectorAll('#gdMenus .gd-menu.can').length, seeds: document.querySelectorAll('#gdPick button:not([aria-disabled="true"])').length };""")
            print(w, '창', r)
            ok(r['plots'] == 3 and r['menus'] == 16 and r['can'] >= 2 and r['seeds'] == 6, f'{w} 창 {r}')
            await pg.wait_for_timeout(500); await pg.screenshot(path=f's94_garden_{w}.png')
            o = await pg.evaluate(OVER + "('#mGd .modal, #mGd .modal *')"); ok(not o, f'{w} 텃밭 창이 넘쳐요 {o[:5]}')
            # 칸 누르기: 거두기 단추
            await pg.click('#gdPlots [data-gd="har"]'); await pg.wait_for_timeout(200)
            r = await ev("return S.gn.inv.lettuce;"); ok(r == 5, f'거두기 단추 {r}')
            await pg.evaluate(CLEAN)
            r = await ev("""F.openSheet('cafeteria'); const b = document.querySelector('#sheetGarden'); return { vis: !b.hidden, tx: b.textContent };""")
            ok(r['vis'] and '학교 텃밭' in r['tx'], f'급식실 창 단추 {r}')
            ok(not errs, f'{w} 페이지 오류 {errs}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

if __name__ == '__main__':
    asyncio.run(main())
