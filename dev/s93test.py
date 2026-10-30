# 2.2.0 시험: 야간 건물 건설 이벤트
# 보는 것
#  1) 20~24시(한국 시간) 겹친 시간 셈: 19~21시 1시간, 23~1시 1시간, 이틀 8시간
#  2) 공사 끝 시각 당기기: 야간 30분이면 30분 당겨져요. 건설 부스터와 겹치면 둘 다 당겨서 +200%. 낮에는 그대로
#  3) 자리 비운 동안: 전날 19시에 셈하고 다음 날 1시에 켜면 4시간 당겨져요. 공사가 시작하기 전 시간은 안 쳐요
#  4) 핫픽스 off에 night가 있으면 당기지 않아요
#  5) 홈 칩: 초등학교부터 늘 '매일 20~24시 건설 가속 이벤트', 이벤트 중에는 '야간 건설 +100%, n 남음'. 유치원에는 줄이 없어요
#  6) 시작 알림은 하루 한 번, 건설 부스터 설명에 '+100%'와 '매일 20~24시', '2배' 글자 없음
#  7) 저장 nb 읽기, 390 밝은과 360 어두운 화면에서 칩이 넘치지 않아요. 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s93test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)) out.push((el.id || el.className) + ' ' + Math.round(r.left) + '~' + Math.round(r.right)); }); return out; })"""
# 한국 시간 2026-11-02(월) h시 m분 = UTC h-9
K = "((d, h, m) => Date.UTC(2026, 10, d, h - 9, m || 0))"
H = 3600000


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
            ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S, K = {K}, H = {H}; {js} }})()")
            if w == 390:
                # 1) 겹친 시간
                r = await ev("return [F.nbOverlap(K(2, 19), K(2, 21)) / H, F.nbOverlap(K(2, 23), K(3, 1)) / H, F.nbOverlap(K(2, 0), K(4, 0)) / H, F.nbOverlap(K(2, 10), K(2, 19)) / H, F.nbOverlap(K(2, 21), K(2, 20))];")
                print('겹친 시간', r)
                ok(r == [1, 1, 8, 0, 0], f'겹친 시간 셈 {r}')
                # 2) 공사 당기기
                r = await ev("""S.tier = 1; S.tg = 0; S.sem = 0; S.budget = 1e15; S.bd = {}; S.ff = {};
                  for (const k of ['classroom', 'cafeteria', 'library', 'playground', 'science']) { S.f[k] = 8; S.fu[k] = S.fu[k].map(() => 8); }
                  const t0 = K(2, 19, 30); F.rt.fakeNow = t0; S.ff = Object.fromEntries(F.facKeys().map(k => [k, F.gameToday()])); S.cb = { until: 0, at: t0 }; S.nb = { at: t0, seen: '' };
                  F.buyFacility('library'); const e0 = S.bd.library.e;
                  F.rt.fakeNow = K(2, 19, 50); F.cbApply(); F.nbApply(); const day = e0 - S.bd.library.e;   // 낮(19시대): 그대로
                  F.rt.fakeNow = K(2, 20, 20); F.cbApply(); F.nbApply(); const n30 = e0 - S.bd.library.e;   // 야간 20분
                  const on = F.nbOn(), add1 = F.conAdd();
                  F.cbBuy('m30'); const add2 = F.conAdd();
                  F.rt.fakeNow = K(2, 20, 40); F.cbApply(); F.nbApply(); const both = e0 - S.bd.library.e;   // 부스터와 야간 20분: 40분 더
                  return { day: day / 60000, n30: n30 / 60000, both: both / 60000, on, add1, add2 };""")
                print('당기기', r)
                ok(r['day'] == 0 and r['n30'] == 20 and r['both'] == 60 and r['on'] and r['add1'] == 100 and r['add2'] == 200, f'공사 당기기 {r}')
                # 3) 자리 비운 동안
                r = await ev("""S.bd = {}; S.cb = { until: 0, at: 0 }; const t0 = K(3, 19); F.rt.fakeNow = t0; S.nb = { at: t0, seen: '' };
                  S.ff = Object.fromEntries(F.facKeys().map(k => [k, F.gameToday()])); S.f.cafeteria = 8; F.buyFacility('cafeteria'); const e0 = S.bd.cafeteria.e;
                  S.bd.cafeteria.e = e0 + 30 * H; const e1 = S.bd.cafeteria.e;   // 오래 걸리는 공사로 바꿔서 끝나지 않게
                  F.rt.fakeNow = K(4, 1); F.nbApply(); const away = (e1 - S.bd.cafeteria.e) / H;
                  // 21시에 시작한 공사는 21~24시 3시간만
                  S.bd.library = { L: 9, s: K(4, 21), e: K(4, 21) + 30 * H }; S.nb.at = K(4, 19); const le = S.bd.library.e;
                  F.rt.fakeNow = K(5, 2); F.nbApply(); const late = (le - S.bd.library.e) / H;
                  return { away, late };""")
                print('자리 비움', r)
                ok(r['away'] == 4 and r['late'] == 3, f'자리 비운 동안 {r}')
                # 4) 핫픽스 끄기
                r = await ev("""S.bd = { library: { L: 9, s: K(6, 19), e: K(6, 19) + 30 * H } }; S.nb.at = K(6, 19); const e0 = S.bd.library.e;
                  F.Live.off.add('night'); F.rt.fakeNow = K(6, 22); F.nbApply(); const d = e0 - S.bd.library.e, on = F.nbOn();
                  F.Live.off.delete('night'); return { d, on };""")
                ok(r['d'] == 0 and r['on'] is False, f'핫픽스 끄기 {r}')
                # 6) 알림 하루 한 번
                r = await ev("""S.nb.seen = ''; F.rt.fakeNow = K(7, 20, 5); const shown = []; const ot = F.toast;
                  F.nbNotice(); const s1 = S.nb.seen; F.nbNotice(); const s2 = S.nb.seen;
                  F.rt.fakeNow = K(8, 15); S.nb.seen = ''; F.nbNotice(); const s3 = S.nb.seen;
                  return { s1, s2, s3 };""")
                ok(r['s1'] == '2026-11-07' and r['s2'] == '2026-11-07' and r['s3'] == '', f'시작 알림 {r}')
                # 7) 저장
                r = await ev("""const a = F.sanitize({ ...JSON.parse(JSON.stringify(S)), nb: { at: 'x', seen: 5 } }), b = F.sanitize({ ...JSON.parse(JSON.stringify(S)), nb: undefined });
                  return [a.nb.at, a.nb.seen, b.nb.at, b.nb.seen];""")
                ok(r == [0, '', 0, ''], f'저장 읽기 {r}')
            # 5) 칩
            r = await ev("""S.tier = 0; S.bd = {}; S.cb = { until: 0, at: 0 }; F.rt.fakeNow = K(9, 14); F.renderMap(); F.ffRender(true);
              const kd = document.querySelector('#ffChip'), k0 = kd.hidden || !kd.querySelector('.nb');
              S.tier = 1; S.tg = 0; S.ff = {}; for (const k of ['classroom', 'cafeteria', 'library', 'playground', 'science']) { S.f[k] = 8; S.fu[k] = S.fu[k].map(() => 8); }
              S.ff = Object.fromEntries(['classroom', 'cafeteria', 'library', 'playground', 'science'].map(k => [k, F.gameToday()]));
              F.renderMap(); F.ffRender(true); const day = kd.hidden ? '' : kd.textContent;
              F.rt.fakeNow = K(9, 21, 30); F.ffRender(true); const night = kd.textContent;
              return { k0, day, night };""")
            print(w, '칩', r)
            ok(r['k0'], '유치원에도 야간 건설 줄이 보여요')
            ok('매일 20~24시 건설 가속 이벤트' in r['day'], f'낮 칩 {r}')
            ok('야간 건설 +100%' in r['night'] and '2시간 30분' in r['night'], f'밤 칩 {r}')
            await pg.evaluate(CLEAN); await pg.wait_for_timeout(600)
            await pg.screenshot(path=f's93_chip_{w}.png')
            o = await pg.evaluate(OVER + "('#ffChip, #ffChip *')"); ok(not o, f'{w} 칩이 넘쳐요 {o}')
            # 6) 부스터 설명
            r = await ev("""S.budget = 1e15; F.rt.fakeNow = K(10, 14); S.bd = { library: { L: 9, s: K(10, 13), e: K(10, 18) } }; F.openSheet('library'); F.conRender(true);
              const box = document.querySelector('#conCb'); box.dataset.key = ''; F.conRender(true); return box.textContent;""")
            ok('+100%' in r and '매일 20~24시' in r and '2배' not in r, f'부스터 설명 {r}')
            if w == 360:
                await pg.wait_for_timeout(400); await pg.screenshot(path='s93_sheet_360.png')
                o = await pg.evaluate(OVER + "('#conCb, #conCb *')"); ok(not o, f'부스터 칸이 넘쳐요 {o}')
            ok(not errs, f'{w} 페이지 오류 {errs}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

if __name__ == "__main__": asyncio.run(main())
