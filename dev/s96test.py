# 2.2.0 시험: 동아리 대항전
# 보는 것
#  1) 중학교부터. 주가 시작하면 상대 학교 7곳과 한 주 점수(우리 예상 점수의 1.22배 ~ 0.72배), 날마다 조금씩 올라요
#  2) 우리 점수 = 별 × 10 + 연습 × 20 + 발표회 × 30. 모두 연습은 하루 한 번(부원 능력치 +2), 발표회를 열면 그 동아리 +30
#  3) 주가 바뀌면 셈: 1등 황금 2와 우승 깃발(1, 3, 6번째), 2~3등 황금 1, 모두 수업료 30분치. 여러 주를 비워도 셈은 한 번
#  4) 동아리실 맨 위 순위표 8줄과 연습 단추, 메인 퀘스트 cg1, cg2(중학교 12장), 패스 미션 cg, 업적 cgwin, 저장 읽기
#  5) 390 밝은, 360 어두운 화면 넘침 없음, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s96test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)) out.push((el.id || el.className) + ' ' + Math.round(r.left) + '~' + Math.round(r.right)); }); return out; })"""
K = "((d, h, m) => Date.UTC(2026, 10, d, h - 9, m || 0))"   # 2026-11-02가 월요일
MID = """S.tier = 2; S.tg = 0; for (const k of F.facKeys()) { S.f[k] = Math.max(S.f[k] || 0, 5); } F.rosterEnsure(true); F.clubAuto(true);"""


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
                # 1) 열림과 새 주
                r = await ev("""F.rt.fakeNow = K(2, 9); S.tier = 1; const elem = F.cgOpen();
                  """ + MID + """ S.cg = JSON.parse(JSON.stringify(S.cg)); S.cg.wk = -1; const first = F.cgSync(true);
                  const n = S.cg.opp.length, fs = S.cg.opp.map(o => o.f).sort((a, b) => b - a), stars = F.CLUBS.reduce((a, _, c) => a + F.clubStars(c), 0);
                  const mon = S.cg.opp.map(o => F.cgOppNow(o)); F.rt.fakeNow = K(5, 9); const thu = S.cg.opp.map(o => F.cgOppNow(o));
                  return { elem, first, n, fs, stars, my: F.cgMy(), up: thu.every((v, i) => v > mon[i]), ratio: fs[0] / fs[6] };""")
                print('새 주', r)
                ok(r['elem'] is False and r['first'] is None and r['n'] == 7 and r['my'] == r['stars'] * 10 and r['up'] and 1.4 < r['ratio'] < 1.9, f'새 주 {r}')
                # 2) 연습과 발표회
                r = await ev("""const my0 = F.cgMy(), a0 = F.clubMembers(0)[0].a[F.CLUBS[0].ab];
                  const p1 = F.cgPractice(), p2 = F.cgPractice(), my1 = F.cgMy(), a1 = F.clubMembers(0)[0].a[F.CLUBS[0].ab];
                  const clubs = F.CLUBS.filter((_, c) => F.clubMembers(c).length).length;
                  S.club.last = -1; S.club.wk = -1; const my2 = F.cgMy(); const sh = F.clubShowGo(1); const my3 = F.cgMy(), st3 = F.clubStars(1);
                  return { p1, p2, d1: my1 - my0, clubs, grow: a1 - a0, sh, show: S.cg.show[1], st: S.cg.st };""")
                print('연습', r)
                ok(r['p1'] and r['p2'] is False and r['grow'] == 2 and r['sh'] and r['show'] == 1 and r['st']['p'] == 1 and r['st'].get('s') == 1, f'연습과 발표회 {r}')
                ok(r['d1'] >= r['clubs'] * 20, f'연습 점수 {r}')
                await pg.evaluate(CLEAN)
                # 3) 주가 바뀌면 셈: 1등이 되게 상대 점수를 낮춰요
                r = await ev("""S.cg.opp.forEach(o => { o.f = 1; }); const g0 = S.gold, b0 = S.budget; F.rt.fakeNow = K(9, 10); const res = F.cgSync(true);
                  const won = { rank: res && res.rank, gold: S.gold - g0, acorn: S.budget > b0, wins: S.cg.wins, flag: S.deco.own.cg_flag_b, prac: S.cg.prac.join(''), newOpp: S.cg.opp.every(o => o.f > 1) };
                  // 꼴찌 주
                  S.cg.opp.forEach(o => { o.f = 1e6; }); const g1 = S.gold; F.rt.fakeNow = K(16, 10); const r2 = F.cgSync(true); const last = { rank: r2.rank, gold: S.gold - g1, wins: S.cg.wins };
                  // 2등 주, 그리고 여러 주 비우기
                  S.cg.opp.forEach((o, i) => { o.f = i ? 1 : 1e6; }); const g2 = S.gold; F.rt.fakeNow = K(30, 10); const r3 = F.cgSync(true); const again = F.cgSync(true);
                  return { won, last, second: { rank: r3.rank, gold: S.gold - g2 }, again, n: S.cg.st.n, pod: S.cg.pod, wk: S.cg.wk === F.gameWeek() };""")
                print('셈', r)
                ok(r['won']['rank'] == 1 and r['won']['gold'] == 2 and r['won']['acorn'] and r['won']['wins'] == 1 and r['won']['flag'] == 1 and r['won']['prac'] == '00000' and r['won']['newOpp'], f'우승 {r["won"]}')
                ok(r['last']['rank'] == 8 and r['last']['gold'] == 0 and r['last']['wins'] == 1, f'꼴찌 {r["last"]}')
                ok(r['second']['rank'] == 2 and r['second']['gold'] == 1 and r['again'] is None and r['n'] == 3 and r['pod'] == 2 and r['wk'], f'2등과 여러 주 {r}')
                # 깃발 셋
                r = await ev("""S.cg.wins = 2; S.cg.opp.forEach(o => { o.f = 1; }); F.rt.fakeNow = Date.UTC(2026, 11, 7, 1); F.cgSync(true); const s = S.deco.own.cg_flag_s;
                  S.cg.wins = 5; S.cg.opp.forEach(o => { o.f = 1; }); F.rt.fakeNow = Date.UTC(2026, 11, 14, 1); F.cgSync(true); return [s, S.deco.own.cg_flag_g, S.cg.wins];""")
                ok(r == [1, 1, 6], f'은, 금 깃발 {r}')
                # 4) 퀘스트, 패스, 업적, 저장
                r = await ev("""const ids = F.MAIN.map(q => q.id), i1 = ids.indexOf('cg1'), i2 = ids.indexOf('cg2');
                  const a = F.sanitize({ ...JSON.parse(JSON.stringify(S)), cg: { wk: 3, opp: [{ k: 'oak', f: 50 }, { k: 'zz', f: 3 }], prac: [9, 1, 'x'], show: [1], pd: 5, res: { rank: 0, my: 4 }, wins: -2, st: { p: 3 } } });
                  const b = F.sanitize({ ...JSON.parse(JSON.stringify(S)), cg: undefined });
                  return { i1, i2, ch: [F.MAIN[i1].ch, F.MAIN[i2].ch], m1: F.qMeasure(F.MAIN[i1]), m2: F.qMeasure(F.MAIN[i2]), ps: F.PS_M.cg.v(), ach: (F.ACH.find(x => x.id === 'cgwin') || {}).title, a: a.cg, b: b.cg.wk };""")
                print('퀘스트와 저장', {k: v for k, v in r.items() if k != 'a'})
                ok(r['i1'] > 0 and r['i2'] > r['i1'] and r['ch'] == [12, 12] and r['m1'] == 1 and r['m2'] == 1 and r['ps'] == 1 and r['ach'] == '대항전 챔피언', f'퀘스트 {r}')
                a = r['a']
                ok(a['wk'] == 3 and a['opp'] == [{'k': 'oak', 'f': 50}] and a['prac'] == [7, 1, 0, 0, 0] and a['show'] == [1, 0, 0, 0, 0] and a['pd'] == '' and a['res']['rank'] == 1 and a['wins'] == 0 and a['st'] == {'p': 3, 'n': 0} and r['b'] == -1, f'저장 읽기 {a}')
            else:
                await ev("F.rt.fakeNow = K(4, 9); " + MID + " F.cgSync(true);")
            # 5) 동아리실 화면
            r = await ev("""F.setTab('club'); F.renderClub(); return { rows: document.querySelectorAll('#cgBox .cg-tab li').length, me: document.querySelectorAll('#cgBox .cg-tab li.me').length, btn: !!document.querySelector('#cgBox [data-cg="prac"]') };""")
            ok(r == {'rows': 8, 'me': 1, 'btn': True}, f'{w} 순위표 {r}')
            await pg.wait_for_timeout(600); await pg.screenshot(path=f's96_club_{w}.png')
            o = await pg.evaluate(OVER + "('#cgBox, #cgBox *')"); ok(not o, f'{w} 대항전 칸이 넘쳐요 {o[:4]}')
            ok(not errs, f'{w} 페이지 오류 {errs}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

if __name__ == '__main__':
    asyncio.run(main())
