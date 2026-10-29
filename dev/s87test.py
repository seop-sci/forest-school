# 2.1.2 시험: 매점 간식 뽑기(설계안 '매점 간식 뽑기 설계안 (2.1.2)')
# 보는 것
#  1) 여는 때: 유치원, 초등학교에는 없고 중학교 매점(Lv.1 이상) 창에 '간식 뽑기' 줄
#  2) 값: 수업료(특식 데이, 기분 배수 빼고) 30분치, 10번 270분치. 모자라면 못 뽑아요
#  3) 확률과 천장: 희귀 약 8%(2만 번), 희귀 없이 20번 뒤 21번째는 희귀
#  4) 기분: 일반 +1, 희귀 +3, 하루 10칸, 날이 바뀌면 0, 1칸마다 수업료 +1%
#  5) 보상: 처음 일반 정수 2, 처음 희귀 황금 1, 희귀 중복 정수 3, 20종 다 모으면 황금 3과 황금 기계(한 번)
#  6) 도감 탭 '간식', 업적 줄(5, 10, 14, 17, 20, 칭호 매점 단골), 메인 퀘스트 sn1(중1), sn2(중2), 저장 읽기
#  7) 390 밝은, 360 어두운 화면에서 뽑기 창, 도감이 넘치지 않아요(캡처 s87_*), 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s87test.py   (마지막 줄이 PASS면 통과)
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
            r = await ev("const a = F.snOpen(); S.tier = 1; const b = F.snOpen(); S.tier = 2; S.f.store = 0; const c = F.snOpen(); S.f.store = 5; const d = F.snOpen(); S.tier = 0; return [a, b, c, d];")
            ok(r == [False, False, False, True], f'여는 때 {r}')
            if w == 390:
                r = await ev("""S.tier = 2; S.tg = 0; S.f.store = 8; S.sn = { got: {}, day: F.gameToday(), mood: 0, pity: 0, n: 0, gold: false };
                  const base = F.snBase(), c1 = F.snCost(false), c10 = F.snCost(true);
                  S.sn.mood = 7; const base7 = F.snBase(), m7 = F.snMult(); S.sn.mood = 0;
                  return { base, c1, c10, base7, m7, r30: c1 / (base * 1800), r270: c10 / (base * 16200) };""")
                ok(abs(r['r30'] - 1) < 1e-3 and abs(r['r270'] - 1) < 1e-3 and abs(r['base7'] / r['base'] - 1) < 0.02 and abs(r['m7'] - 1.07) < 1e-9, f'값 {r}')
                r = await ev("S.budget = F.snCost(false) - 1; const n0 = S.sn.n, out = F.snDraw(false); return [out, S.sn.n === n0];")
                ok(r[0] is None and r[1], f'모자랄 때 {r}')
                # 확률과 천장(snPick만)
                r = await ev("""const s0 = JSON.parse(JSON.stringify(S.sn)); S.sn.pity = 0; let rare = 0, maxRun = 0, run = 0; const N = 20000;
                  for (let i = 0; i < N; i++) { const it = F.snPick(); if (it.rare) { rare++; maxRun = Math.max(maxRun, run); run = 0; } else run++; }
                  S.sn.pity = 20; const forced = F.snPick().rare, pity0 = S.sn.pity; S.sn = s0; return { p: rare / N, maxRun, forced, pity0 };""")
                print('확률', r)
                ok(0.07 < r['p'] < 0.11 and r['maxRun'] <= 20 and r['forced'] and r['pity0'] == 0, f'확률과 천장 {r}')
                # 기분과 보상
                r = await ev("""S.budget = 1e300; S.ess = 0; S.gold = 0; S.sn = { got: {}, day: F.gameToday(), mood: 0, pity: 0, n: 0, gold: false };
                  const r0 = F.rate(); const out = F.snDraw(false); const it = out[0].it, mood1 = S.sn.mood, e1 = S.ess, g1 = S.gold;
                  for (let i = 0; i < 3; i++) F.snDraw(true);
                  const mood = S.sn.mood, r1 = F.rate();
                  S.sn.day = '2000-01-01'; F.snSync(); const after = S.sn.mood;
                  return { rare: it.rare, mood1, e1, g1, mood, ratio: r1 / r0, after, n: S.sn.n };""")
                print('기분', r)
                ok(r['mood1'] == (3 if r['rare'] else 1) and (r['e1'] == 2 if not r['rare'] else r['g1'] == 1), f'처음 한 번 {r}')
                ok(r['mood'] == 10 and r['after'] == 0 and r['n'] == 31, f'기분 칸 {r}')
                ok(1.05 < r['ratio'] < 1.2, f'수업료 배수 {r}')
                # 중복과 다 모음
                r = await ev("""S.ess = 0; S.gold = 0; S.sn = { got: {}, day: F.gameToday(), mood: 0, pity: 0, n: 0, gold: false };
                  F.SN_ALL.slice(0, 19).forEach(x => S.sn.got[x.id] = 1);   // 하나(snack_r6)만 빠짐
                  const g0 = S.gold; let draws = 0; while (!S.sn.gold && draws < 400) { F.snDraw(false); draws++; }
                  const gold = S.sn.gold, cnt = F.snCount(); const g1 = S.gold; const before = S.gold; F.snDraw(true); const twice = S.sn.gold;
                  return { gold, cnt, g1, draws, twice };""")
                print('다 모음', r)
                ok(r['gold'] and r['cnt'] == 20 and r['g1'] >= 4 and r['twice'], f'다 모음 {r}')
                r = await ev("""S.ess = 0; S.sn.pity = 20; S.sn.got = {}; F.SN_ALL.forEach(x => S.sn.got[x.id] = 1); const out = F.snDraw(false); return [out[0].it.rare, S.ess];""")
                ok(r == [True, 3], f'희귀 중복 {r}')
                r = await ev("F.achSync && F.achSync(true); return S.ach.hit.snack;")
                ok(r == 5, f'업적 줄 {r}')
                # 저장 읽기
                r = await ev("""const d = JSON.parse(JSON.stringify(S)); d.sn = { got: { snack_01: 3.7, nope: 5, snack_r1: -2 }, day: '2026-10-29xx', mood: 99, pity: 50, n: 'x', gold: true }; const s = F.sanitize(d);
                  const d2 = JSON.parse(JSON.stringify(S)); delete d2.sn; const s2 = F.sanitize(d2); return [s.sn, s2.sn];""")
                ok(r[0] == {'got': {'snack_01': 3}, 'day': '2026-10-29', 'mood': 10, 'pity': 20, 'n': 0, 'gold': False} and r[1] == {'got': {}, 'day': '', 'mood': 0, 'pity': 0, 'n': 0, 'gold': False}, f'저장 읽기 {r}')
                r = await ev("""const q1 = F.MAIN.find(q => q.id === 'sn1'), q2 = F.MAIN.find(q => q.id === 'sn2'); return [q1 && q1.ch, q2 && q2.ch, F.qMeasure(q2), F.qGoal(q2), F.qProg(q2).text];""")
                print('퀘스트', r)
                ok(r[0] == 12 and r[1] == 13 and r[2] == 20 and r[3] == '간식 도감 10종', f'퀘스트 {r}')
            # 화면
            await ev("S.tier = 2; S.tg = 0; S.budget = 1e15; S.f.store = 8; S.sn = { got: { snack_01: 2, snack_r2: 1 }, day: F.gameToday(), mood: 4, pity: 3, n: 3, gold: false }; F.renderMap(); return 1;")
            await pg.evaluate(T.CLEAN); await pg.wait_for_timeout(700)
            await ev("F.openSheet('store'); return 1;"); await pg.wait_for_timeout(800)
            r = await ev("const b = document.querySelector('#sheetSnack'); return !b.hidden && b.textContent.includes('간식 뽑기');")
            ok(r, f'{w} 매점 창에 간식 뽑기 줄이 없어요')
            await pg.click('#sheetSnack'); await pg.wait_for_timeout(900)
            ok(await ev("return !document.querySelector('#mSn').hidden;"), f'{w} 뽑기 창이 안 열려요')
            await pg.click('#snBtns [data-sn="10"]'); await pg.wait_for_timeout(1800)
            r = await ev("return document.querySelectorAll('#snStage .sn-card').length;")
            ok(r == 10, f'{w} 10번 결과 {r}')
            await pg.screenshot(path=f's87_modal_{w}.png')
            o = await pg.evaluate(OVER + "('#mSn .modal, #mSn .modal *:not(svg *):not(.ell)')"); ok(not o, f'{w} 뽑기 창이 넘쳐요 {o}')
            await pg.click('#snDexBtn'); await pg.wait_for_timeout(900)
            r = await ev("return { pane: !document.querySelector('#snPane').hidden, n: document.querySelectorAll('#snDexGrid .sn-card').length, seg: !document.querySelector('#dsegSn').hidden };")
            ok(r == {'pane': True, 'n': 20, 'seg': True}, f'{w} 간식 도감 {r}')
            await pg.screenshot(path=f's87_dex_{w}.png')
            o = await pg.evaluate(OVER + "('#snPane, #snPane *, #dexSeg, #dexSeg *')"); ok(not o, f'{w} 간식 도감이 넘쳐요 {o}')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
