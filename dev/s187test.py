# 5.3.4.4 시험: Gemini 점검에서 찾은 세 가지
#  1) 논문과 학회 칭호(PP_TITLES)를 단 저장을 다시 읽어도 칭호가 남아요. 조건이 안 되면 떼고, s.pp.med가 망가져도 오류 없이 떼요
#  2) 서버 연결을 쉬던 중(netSleep)에 계정 바꾸기나 로그아웃 앞의 저장(acctSaveFirst)이 서버 확인을 기다린 뒤 올리고 true를 돌려줘요
#     (누르기로 netWake가 먼저 불린 경우와 acctSaveFirst가 직접 깨우는 경우 둘 다). 가짜 Cloud.db로 확인해요.
#     기다리는 동안 저절로 저장(save)이 돌면 확인 끝에 한 번 더 올라갈 수 있어서 올린 횟수는 1번 이상, 리비전은 5 + 올린 횟수로 봐요
#  3) 심화 탐험 순위(rt.rkH)에서 층(hf)만 올라도 순위표가 다시 그려져요
#  4) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s187test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base, Checker

FAKE_DB = """(() => {
  const st = { save: { r: 5, d: '{}', at: 1, v: '0' }, reads: 0, writes: 0 };
  const later = (v, ms) => new Promise(ok => setTimeout(() => ok(v), ms));
  const db = { goOnline() {}, goOffline() {}, __st: st,
    ref(path) { return {
      once() { st.reads += 1; return later({ val: () => path.endsWith('/r') ? st.save.r : JSON.parse(JSON.stringify(st.save)) }, 700); },
      transaction(fn) { const n = fn(JSON.parse(JSON.stringify(st.save))); if (n === undefined) return later({ committed: false, snapshot: { val: () => st.save } }, 50);
        if (path.startsWith('forest/saves/')) { st.save = n; st.writes += 1; } return later({ committed: true, snapshot: { val: () => st.save } }, 50); },
      set() { return Promise.resolve(); } }; } };
  return db; })()"""

async def main():
    c = Checker()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        s = base(tier=5, tg=2)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(s)))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3500); await pg.evaluate(CLEAN)

        # 1) 칭호 읽기
        r = await pg.evaluate(f"""(() => {{ const F = {F}, base = JSON.parse(JSON.stringify(F.S)), out = {{}};
          const rd = (title, pp) => {{ const d = JSON.parse(JSON.stringify(base)); d.ach = Object.assign({{}}, d.ach, {{ title }}); d.pp = pp; try {{ return F.sanitize(d).ach.title; }} catch (e) {{ return 'ERR ' + e.message; }} }};
          const pp = (o) => Object.assign({{ dat: 0, cur: null, n: 0, by: {{}}, day: '', cm: -1, cf: 0, cb: 0, ck: {{}}, med: [], sem: 0 }}, o);
          out.one = rd('paperone', pp({{ n: 1 }}));
          out.none = rd('paperone', pp({{ n: 0 }}));
          out.gold = rd('confgold', pp({{ med: [[3, 3]] }}));
          out.badMed = rd('confgold', pp({{ med: 'xx' }}));
          out.badPp = rd('paperthirty', 'xx');
          out.sem = rd('semfive', pp({{ sem: 6 }}));
          return out; }})()""")
        c.ok(r['one'] == 'paperone', f"첫 논문 칭호가 남아요: {r}")
        c.ok(r['none'] == '', f"논문이 없으면 칭호를 떼요: {r}")
        c.ok(r['gold'] == 'confgold', f"학회 금메달 칭호가 남아요: {r}")
        c.ok(r['badMed'] == '' and r['badPp'] == '', f"망가진 pp에서도 오류 없이 떼요: {r}")
        c.ok(r['sem'] == 'semfive', f"발표왕 칭호가 남아요: {r}")

        # 2) 쉬던 중 계정 바꾸기 앞 저장
        async def acct(press):
            return await pg.evaluate(f"""(async () => {{ const F = {F}, C = F.Cloud, db = {FAKE_DB};
              Object.assign(C, {{ db, uid: 'u1', state: 'on', rev: 5, fresh: true, dirty: false, pushing: false, verifying: false, asleep: false, hold: false, old: false, delLeft: 0, deleting: false }});
              F.netSleep(); const slept = C.asleep;
              if ({'true' if press else 'false'}) document.dispatchEvent(new PointerEvent('pointerdown', {{ bubbles: true }}));
              const fresh0 = C.fresh, t0 = performance.now(), ok = await F.acctSaveFirst();
              const res = {{ slept, fresh0, ok, ms: Math.round(performance.now() - t0), r: db.__st.save.r, writes: db.__st.writes, reads: db.__st.reads, dirty: C.dirty, asleep: C.asleep, fresh: C.fresh }};
              C.state = 'off'; C.db = null; return res; }})()""")
        a1 = await acct(True)
        c.ok(a1['slept'] and not a1['fresh0'] and a1['ok'] and a1['writes'] >= 1 and a1['r'] == 5 + a1['writes'] and not a1['dirty'] and not a1['asleep'], f"누르기로 깨운 뒤 확인을 기다려 올려요: {a1}")
        a2 = await acct(False)
        c.ok(a2['slept'] and a2['ok'] and a2['writes'] >= 1 and a2['r'] == 5 + a2['writes'] and not a2['dirty'] and not a2['asleep'] and a2['reads'] >= 1, f"acctSaveFirst가 직접 깨워 확인 뒤 올려요: {a2}")

        # 3) 심화 탐험 순위
        r3 = await pg.evaluate(f"""(() => {{ const F = {F}, R = F.Rank, rt = F.rt4;
          F.setTab('rank'); R.state = 'on'; R.uid = 'me'; rt.rankView = 'tam'; rt.rkH = 1;
          const row = hf => ({{ id: 'a1', name: '졸린 다람쥐', hf, tf: 3, cf: 0, score: 1, lp: 0, sp: 0, bt: 0, btm: 0, tier: 4, year: 2, sem: 0, title: '', test: false, week: 0 }});
          R.hrows = [row(10)]; F.renderRankPanel(); const a = (document.querySelector('#rankList') || {{}}).textContent || '';
          R.hrows = [row(25)]; F.renderRankPanel(); const b2 = (document.querySelector('#rankList') || {{}}).textContent || '';
          return [a, b2]; }})()""")
        c.ok('10층' in r3[0] and '25층' in r3[1], f"심화 층이 오르면 순위표가 바뀌어요: {r3}")

        c.ok(not errs, f"페이지 오류 없음: {errs[:3]}")
        await b.close()
    c.done()

asyncio.run(main())
