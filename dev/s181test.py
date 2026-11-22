# 6.0.0 씨앗 학교 저장 시제품 시험 (Issue #265 단계 1)
# 보는 것
#  1) 표본 저장 40개와 대학원 저장마다: 본교를 접으면(genMake) 접은 본교가 접기 전 저장과 글자 하나까지 같아요
#  2) 꺼내면(genHome) 일부러 바꾸는 세 칸(savedAt 저장 시각, away 자리 비움, clk 게임 시계)만 다르고 나머지는 글자 하나까지 같아요
#  3) 꺼낸 본교를 불러온 것(sanitize)이 '그 본교를 그냥 다시 불러온 것'과 글자 하나까지 같아요. 두 번 왕복해도 같아요
#  4) 새 학교는 유치원, 학교 번호 그대로, 개발자 표시, 저장 글자 수가 서버 한도(200,000자) 아래
#  5) 옛 저장(gen 없음)과 망가진 gen을 받아 줘요(한 겹만, 너무 큰 본교는 버림)
#  6) 개발자 메뉴 두 단추로 실제로 오가요(다시 열기 두 번). 돌아오면 학교급, 도토리, 건물, 학교 번호, 메인 퀘스트가 그대로예요. 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s181test.py   (마지막 줄이 PASS면 통과)
import asyncio, gzip, json
from playwright.async_api import async_playwright
from testlib import URL, F, Checker, base

c = Checker()
PURE = """(d) => { const F = window.__forest, J = JSON.stringify, P = s => JSON.parse(s), out = {};
  const cur = F.sanitize(d), A = P(J(cur));                      // 접기 직전 저장(save가 쓰는 글과 같은 모양)
  const N = F.genMake(cur), Nl = F.sanitize(P(J(N)));             // 새 학교를 저장하고 다시 연 것
  out.fold = J(Nl.gen.home) === J(A);                              // 1) 접은 본교 = 접기 전 저장
  out.newb = [Nl.tier, Nl.pid === A.pid, Nl.u.dev, Nl.gen.n, J(Nl).length];
  const H = F.genHome(Nl), strip = o => { const x = P(J(o)); delete x.savedAt; delete x.away; delete x.clk; return J(x); };
  out.keys = Object.keys(H).filter(k => J(H[k]) !== J(A[k]));      // 2) 달라진 칸
  out.back = strip(H) === strip(A);
  const Hl = F.sanitize(P(J(H))), B = F.sanitize(P(J(Object.assign(P(J(A)), { savedAt: H.savedAt, away: H.away, clk: H.clk })))); // 3)
  out.load = J(Hl) === J(B);
  const N2 = F.sanitize(P(J(F.genMake(Hl)))), H2 = F.genHome(N2);   // 두 번째 왕복
  out.twice = strip(H2) === strip(P(J(Hl)));
  out.size = J(Nl).length; return out; }"""

async def main():
    raw = json.load(gzip.open('golden/saves.json.gz')); items = raw if isinstance(raw, list) else list(raw.values())
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(); await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        samples = []
        for it in items:
            d = it.get('save', it) if isinstance(it, dict) else it
            samples.append(json.loads(d) if isinstance(d, str) else d)
        # 대학원 박사 학위 뒤처럼 꾸민 저장도 하나
        samples.append(await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; S.tier=5; S.tg=5; S.sem=1; S.grade=4; S.budget=1e33; for (const k of Object.keys(S.f)) S.f[k]=70; S.q.m=F.MAIN.length; S.pp.n=12; S.ta.mem=40; return JSON.parse(JSON.stringify(S)); }})()"))
        mx = 0
        for i, d in enumerate(samples):
            r = await pg.evaluate(PURE, d)
            mx = max(mx, r['size'])
            ok = r['fold'] and r['back'] and r['load'] and r['twice'] and set(r['keys']) <= {'savedAt', 'away', 'clk'} and r['newb'][0] == 0 and r['newb'][1] and r['newb'][2] and r['size'] < 200000
            c.ok(ok, f'표본 {i} 왕복 {r}')
        print(f'표본 {len(samples)}개 왕복: 접은 본교 같음, 꺼낸 본교는 savedAt, away, clk 말고 같음, 불러온 것 같음, 두 번 왕복 같음. 새 학교 저장 가장 긴 것 {mx:,}자')
        # 5) 옛 저장과 망가진 gen
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, J=JSON.stringify, d = JSON.parse(J(S)); const o = {{}};
          delete d.gen; o.old = J(F.sanitize(d).gen);
          d.gen = 5; o.num = J(F.sanitize(d).gen);
          d.gen = {{ n: 'x', home: [1, 2] }}; o.arr = J(F.sanitize(d).gen);
          d.gen = {{ n: 3, home: {{ tier: 2, gen: {{ n: 1, home: {{ tier: 1 }} }} }} }}; const g = F.sanitize(d).gen; o.deep = [g.n, g.home && g.home.tier, g.home && g.home.gen && g.home.gen.home];
          d.gen = {{ n: 1, home: {{ junk: 'x'.repeat(160000) }} }}; o.big = J(F.sanitize(d).gen);
          d.gen = {{ n: -4, home: null }}; o.neg = J(F.sanitize(d).gen);
          return o; }})()""")
        print('옛 저장과 망가진 gen', r)
        c.ok(r['old'] == '{"v":1,"n":0,"home":null}', f'옛 저장 {r["old"]}')
        c.ok(r['num'] == '{"v":1,"n":0,"home":null}' and r['arr'] == '{"v":1,"n":0,"home":null}', f'망가진 gen {r}')
        c.ok(r['deep'] == [3, 2, None], f'한 겹만 {r["deep"]}')
        c.ok(r['big'] == '{"v":1,"n":1,"home":null}', f'너무 큰 본교 {r["big"]}')
        c.ok(r['neg'] == '{"v":1,"n":0,"home":null}', f'음수 {r["neg"]}')
        await ctx.close()
        # 6) 개발자 메뉴로 실제 왕복(다시 열기 두 번)
        sv = base(tier=2, tg=1, budget=4.2e9, f=dict(classroom=14, cafeteria=12, library=11, playground=8, science=6, store=3))
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(sv)))
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        before = await pg.evaluate(f"(()=>{{ const S={F}.S; return {{ tier: S.tier, tg: S.tg, budget: S.budget, f: S.f, pid: S.pid, m: S.q.m, dev: S.u.dev }}; }})()")
        snap = await pg.evaluate(f"(()=>{{ const F={F}; F.save(); return localStorage.getItem('forest-school-v1'); }})()")
        await pg.evaluate("document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; document.querySelector('#devBox').hidden=false")
        async with pg.expect_navigation(): await pg.evaluate("document.querySelector('#devGenGo').click()")
        await pg.wait_for_timeout(2500)
        mid = await pg.evaluate(f"(()=>{{ const S={F}.S; return {{ tier: S.tier, pid: S.pid, dev: S.u.dev, n: S.gen.n, homeTier: S.gen.home && S.gen.home.tier, homeBudget: S.gen.home && S.gen.home.budget, len: localStorage.getItem('forest-school-v1').length, bak: (JSON.parse(localStorage.getItem('forest-school-bak') || '[]').filter(x => x.why === '바꾸기 전 이 기기 학교').length) }}; }})()")
        print('새 유치원', mid)
        c.ok(mid['tier'] == 0 and mid['pid'] == before['pid'] and mid['dev'] and mid['homeTier'] == before['tier'] and mid['homeBudget'] >= before['budget'], f'접고 새 유치원 {mid}')   # 켜 둔 동안 수업료가 들어와서 도토리는 줄지 않았는지만 봐요
        c.ok(mid['bak'] > 0, f'접기 전 자동 보관 {mid["bak"]}')
        await pg.evaluate("document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; document.querySelector('#devBox').hidden=false")
        await pg.wait_for_timeout(1200)
        vis = await pg.evaluate("!document.querySelector('#devGenBack').hidden")
        c.ok(vis, '되돌아오기 단추가 보여요')
        async with pg.expect_navigation(): await pg.evaluate("document.querySelector('#devGenBack').click()")
        await pg.wait_for_timeout(2500)
        after = await pg.evaluate(f"(()=>{{ const S={F}.S; return {{ tier: S.tier, tg: S.tg, budget: S.budget, f: S.f, pid: S.pid, m: S.q.m, dev: S.u.dev, home: S.gen.home, pending: S.pending, pendingSec: S.pendingSec }}; }})()")
        print('돌아온 본교', {k: after[k] for k in ('tier', 'tg', 'budget', 'pid', 'm', 'dev', 'home')})
        c.ok(all(after[k] == before[k] for k in ('tier', 'tg', 'f', 'pid', 'm', 'dev')) and after['home'] is None and mid['homeBudget'] <= after['budget'] < mid['homeBudget'] * 1.5, f'돌아온 본교 {before} → {after}')   # 도토리: 접을 때보다 줄지 않고(켜 둔 몇 초 수업료만큼만 늘어요)
        c.ok(after['pending'] == 0 and after['pendingSec'] == 0, f'돌아올 때 자리 비운 보상이 생기면 안 돼요 {after["pending"]}, {after["pendingSec"]}')
        c.ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    c.done()

asyncio.run(main())
