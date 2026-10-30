# 2.2.0 검토 시험 (가짜 서버 없이)
#  5) 동아리 발표회 횟수(cg.st.s): 발표회 → cgShow 퀘스트 측정값 1 → 저장을 sanitize로 다시 읽어도 1, 앱을 다시 열어도 1.
#     st.s가 없던 2.2.0 저장은 이번 주 대항전 발표회 수(show 합)를 최소값으로 받아요. 망가진 값은 0
#  추가 1) 숲의 정수(ess)는 읽을 때도 10억이 상한(1e308, Infinity, 음수, 글자는 받지 않아요). 정상 큰 값은 그대로
# 쓰는 법: python3 wrap.py && python3 s99test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
K = "((d, h, m) => Date.UTC(2026, 10, d, h - 9, m || 0))"   # 2026-11-02가 월요일
MID = """S.tier = 2; S.tg = 0; for (const k of F.facKeys()) { S.f[k] = Math.max(S.f[k] || 0, 5); } F.rosterEnsure(true); F.clubAuto(true);"""


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg); print('  틀림:', msg)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script("window.__FOREST_TEST = true; if (!sessionStorage.getItem('s99')) { localStorage.clear(); sessionStorage.setItem('s99', '1'); }")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function('window.__forest && window.__forest.S', timeout=60000); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
        ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S, K = {K}; {js} }})()")
        # 5) 발표회 → 측정값 → sanitize → 다시 열기
        r = await ev("""F.rt.fakeNow = K(2, 9); """ + MID + """ S.cg.wk = -1; F.cgSync(true);
          S.club.last = -1; S.club.wk = -1; const sh = F.clubShowGo(1);
          const q = { t: 'cgShow', n: 1 }, m1 = F.qMeasure(q);
          const back = F.sanitize(JSON.parse(JSON.stringify(S)));
          F.save(); return { sh, m1, s: S.cg.st.s, back: back.cg.st.s, show: S.cg.show[1] };""")
        print('발표회', r)
        ok(r['sh'] and r['m1'] == 1 and r['s'] == 1 and r['back'] == 1, f'발표회 수가 저장 읽기에서 남아요 {r}')
        await pg.reload(); await pg.wait_for_function('window.__forest && window.__forest.S', timeout=60000); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
        r = await ev("return { s: S.cg.st.s, m: F.qMeasure({ t: 'cgShow', n: 1 }), tier: S.tier };")
        print('다시 열기', r)
        ok(r['s'] == 1 and r['m'] == 1 and r['tier'] == 2, f'앱을 다시 열어도 발표회 수 1 {r}')
        # 옛 2.2.0 저장(st.s 없음), 망가진 값
        r = await ev("""const o = JSON.parse(JSON.stringify(S)); o.cg.show = [1, 2, 0, 0, 0]; delete o.cg.st.s; const old = F.sanitize(o).cg.st.s;
          const o2 = JSON.parse(JSON.stringify(S)); o2.cg.st.s = -5; const neg = F.sanitize(o2).cg.st.s;
          const o3 = JSON.parse(JSON.stringify(S)); o3.cg.st.s = 'x'; const str = F.sanitize(o3).cg.st.s;
          const o4 = JSON.parse(JSON.stringify(S)); o4.cg.st.s = 1e99; const big = F.sanitize(o4).cg.st.s;
          const o5 = JSON.parse(JSON.stringify(S)); delete o5.cg; const none = F.sanitize(o5).cg.st;
          return { old, neg, str, big, none };""")
        print('옛 저장', r)
        ok(r['old'] == 3 and r['neg'] == 0 and r['str'] == 0 and r['big'] == 1000000 and r['none'] == {'p': 0, 'n': 0, 's': 0}, f'옛 저장과 망가진 값 {r}')
        # 추가 1) 숲의 정수 상한
        r = await ev("""const t = v => { const o = JSON.parse(JSON.stringify(S)); o.ess = v; return F.sanitize(o).ess; };
          const r = { huge: t(1e308), inf: t(Infinity), neg: t(-3), str: t('99'), ok: t(123456), cap: t(1e9), over: t(1e9 + 5) };
          S.ess = 1e9 - 1; F.addEss(5); r.add = S.ess; return r;""")
        print('정수', r)
        ok(r['huge'] == 1e9 and r['inf'] == 0 and r['neg'] == 0 and r['str'] == 0 and r['ok'] == 123456 and r['cap'] == 1e9 and r['over'] == 1e9 and r['add'] == 1e9, f'정수 상한 {r}')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    print('FAIL' if bad else 'PASS')
    if bad: raise SystemExit(1)

asyncio.run(main())
