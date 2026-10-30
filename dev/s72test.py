# Codex 검토(PR #47, 2026-10-28) 10개 항목 확인 시험
# 문서 "Codex 검토 요청 (PR #47, 2.0.0)"에 Codex가 돌려준 재현 방법을 그대로 따라 해요. 고친 뒤에 나와야 할 바른 동작이면 통과예요.
#  1) 서버 시간을 받은 뒤 기기 시계를 하루 앞으로: 게임 시계는 흐른 시간만큼만 가요(서버 시간을 다시 받도록 부탁해요)
#  2) 규칙 파일은 rules_sec.js가 봐요(이 시험 밖)
#  3) 기기 A를 내려 둔 사이 B가 서버에 올림 → A를 다시 켜면 서버 학교(B)를 불러오고 A의 옛 학교로 덮지 않아요
#  4) 이 기기 저장 시각만 하루 미래, 서버는 오늘 정상 저장 → 서버 학교를 불러와요
#  5) 학교 파워가 크게(+5,000) 오르면 규칙이 받아 주는 만큼씩 나눠 올려요(모두 받아 줌)
#  6) 서버 시간을 기다리는 동안 1분 놀고 2시간 내려 두기 → 3시간 모두 자리 비움으로 쳐요
#  7) 핫픽스로 이벤트를 껐다가 같은 주에 다시 켜도 도장과 상자 기록이 그대로예요
#  8) 지난 회차 도장 6개 상태로 다음 주 월요일에 바로 도장 → 새 회차 도장 1개째, 지난 회차 모자는 주지 않아요
#  9) 공지 날짜가 배열이면 그 공지만 빼요(공지 창이 열려요)
# 10) 큰 핫픽스(공지 10개 × 20줄 × 200글자)도 이 기기에 남긴 것을 다음에 읽을 수 있어요
# 쓰는 법: python3 wrap.py && python3 s72test.py   (마지막 줄이 PASS면 통과)
import asyncio, calendar, json, time
from playwright.async_api import async_playwright
from s4test import URL

F = 'window.__forest'
H = 3600 * 1000
DAY = 24 * H

# 가짜 Firebase: 서버 저장은 sessionStorage '__srv'에 있고, 올리면 바뀌어요. 쓴 기록은 '__writes'
FAKE_FB = r"""
(() => {
  const getSrv = () => JSON.parse(sessionStorage.getItem('__srv') || 'null');
  const log = (p, v) => { const a = JSON.parse(sessionStorage.getItem('__writes') || '[]'); a.push([p, v]); sessionStorage.setItem('__writes', JSON.stringify(a)); };
  const snap = v => ({ val: () => v, exists: () => v != null, forEach() {}, numChildren: () => 0 });
  const ref = p => {
    const r = {
      once: () => { const s = getSrv(); return Promise.resolve(snap(p === 'forest/saves/u1' ? s : p === 'forest/saves/u1/at' ? (s ? s.at : null) : p === 'forest/saves/u1/r' ? (s && s.r != null ? s.r : null) : p === '.info/serverTimeOffset' ? 0 : null)); },
      // 2.2.0 검토 2: 저장 리비전 트랜잭션(서버 값으로 부르고, undefined면 그만둬요)
      transaction: fn => { const s = getSrv(); const v = fn(p === 'forest/saves/u1' && s ? JSON.parse(JSON.stringify(s)) : null);
        if (v === undefined) return Promise.resolve({ committed: false, snapshot: snap(s) });
        log(p, v); if (p === 'forest/saves/u1') sessionStorage.setItem('__srv', JSON.stringify(v)); return Promise.resolve({ committed: true, snapshot: snap(v) }); },
      on: (ev, cb) => { if (p === '.info/connected') cb(snap(true)); else if (p === '.info/serverTimeOffset') cb(snap(0)); else cb(snap(null)); return cb; },
      off() {}, set: v => { log(p, v); if (p === 'forest/saves/u1') sessionStorage.setItem('__srv', JSON.stringify(v)); return Promise.resolve(); },
      update: v => { log(p, v); return Promise.resolve(); },
      remove: () => Promise.resolve(), child: c => ref(p + '/' + c), push: () => ref(p + '/x'),
      orderByChild: () => r, limitToLast: () => r, limitToFirst: () => r, equalTo: () => r, startAt: () => r, endAt: () => r,
      onDisconnect: () => ({ set: () => Promise.resolve(), remove: () => Promise.resolve(), cancel: () => Promise.resolve() })
    };
    return r;
  };
  const user = { uid: 'u1', isAnonymous: true, providerData: [] };
  const db = { ref, goOffline() {}, goOnline() {} };
  const database = () => db; database.ServerValue = { TIMESTAMP: 0 };
  const fb = { apps: [], initializeApp() { fb.apps.push(1); }, auth: () => ({ currentUser: user, onAuthStateChanged: cb => { setTimeout(() => cb(user), 0); return () => {}; }, signInAnonymously: () => Promise.resolve({ user }) }), database };
  window.FOREST_FIREBASE = { databaseURL: 'https://fake.example' };
  window.FOREST_FB = Promise.resolve(fb);
  window.__hid = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__hid });
})();
"""
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"


def kst(y, m, d, h=12):
    return calendar.timegm((y, m, d, h, 0, 0)) * 1000 - 9 * H   # 한국 시간 그날 h시


async def base_save(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 780})
    await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
    pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(2000)
    sv = await pg.evaluate(f"(()=>{{ const S={F}.S; S.tut.st='skip'; S.q.m = Math.max(S.q.m, 3); S.budget = 1000; return JSON.parse(JSON.stringify(S)); }})()")
    await ctx.close()
    return sv


async def cloud_page(b, local, srv):
    ctx = await b.new_context(viewport={'width': 390, 'height': 780})
    await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('seeded')){ localStorage.clear(); localStorage.setItem('forest-school-v1', %s); sessionStorage.setItem('__srv', %s); sessionStorage.setItem('seeded','1'); }"
                              % (json.dumps(json.dumps(local)), json.dumps(json.dumps(srv))))
    await ctx.add_init_script(FAKE_FB)
    pg = await ctx.new_page(); navs = []
    pg.on('framenavigated', lambda f: navs.append(f.url) if f == pg.main_frame else None)
    await pg.goto(URL); await pg.wait_for_timeout(3500)
    return ctx, pg, navs


async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        base = await base_save(b)
        now = int(time.time() * 1000)

        # 3) 기기 A를 내려 둔 사이 B가 올림 → A를 다시 켜면 B를 불러와요
        a = dict(base, budget=111, savedAt=now)
        ctx, pg, navs = await cloud_page(b, a, {'d': json.dumps(a), 'at': now, 'v': '2.0.0'})
        await pg.evaluate(CLEAN)
        st = await pg.evaluate(f"{F}.Cloud.state")
        await pg.evaluate("window.__hid = true; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
        bsv = dict(base, budget=999999, savedAt=now + 60000)
        await pg.evaluate("(s) => { sessionStorage.setItem('__srv', s); sessionStorage.setItem('__mark', JSON.parse(sessionStorage.getItem('__writes') || '[]').length); }", json.dumps({'d': json.dumps(bsv), 'at': bsv['savedAt'], 'v': '2.0.0'}))
        await pg.wait_for_timeout(2500)   # 내려 둔 채 1초 타이머가 몇 번 돌아요(그동안 A가 올리면 안 돼요)
        await pg.evaluate("window.__hid = false; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(3500)
        r = await pg.evaluate(f"""(()=>{{ const w = JSON.parse(sessionStorage.getItem('__writes') || '[]').slice(+sessionStorage.getItem('__mark')).filter(x => x[0] === 'forest/saves/u1');
          return {{ budget: Math.round({F}.S.budget), srvBudget: Math.round(JSON.parse(JSON.parse(sessionStorage.getItem('__srv')).d).budget), oldPushes: w.filter(x => JSON.parse(x[1].d).budget < 999999).length }}; }})()""")
        r['cloud0'] = st; r['reloads'] = len(navs) - 1
        print('3) 다시 켜기', json.dumps(r, ensure_ascii=False))
        if r['budget'] < 999999 or r['srvBudget'] < 999999 or r['oldPushes'] > 0: fails.append(f'3) 옛 세션이 서버 학교를 덮어요 {r}')
        await ctx.close()
        # 3) 대조: 아무도 올리지 않았으면 다시 켜도 그대로 이어서 올려요
        ctx, pg, navs = await cloud_page(b, a, {'d': json.dumps(a), 'at': now, 'v': '2.0.0'})
        await pg.evaluate(CLEAN)
        await pg.evaluate("window.__hid = true; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
        await pg.evaluate("window.__hid = false; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(1000)
        r = await pg.evaluate(f"(()=>{{ const F={F}; F.S.budget = 4242; F.save(); F.Cloud.dirty = true; return F.Cloud.fresh; }})()")
        await pg.evaluate(f"{F}.cloudVerify()"); await pg.wait_for_timeout(800)
        await pg.evaluate("window.__hid = true; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(800)
        srvb = await pg.evaluate("Math.round(JSON.parse(JSON.parse(sessionStorage.getItem('__srv')).d).budget)")
        print('3) 대조', {'fresh': r, 'reloads': len(navs) - 1, 'srvBudget': srvb})
        if len(navs) - 1 != 0 or not (4242 <= srvb < 5000): fails.append(f'3) 대조에서 올리지 못해요 fresh={r} reloads={len(navs) - 1} srv={srvb}')   # 올리는 사이 수업료가 조금 들어와요
        await ctx.close()

        # 4) 이 기기 저장 시각만 하루 미래, 서버 B는 오늘 정상 저장
        a = dict(base, budget=111, savedAt=now + DAY)
        bsv = dict(base, budget=999999, savedAt=now - 2 * H)
        ctx, pg, navs = await cloud_page(b, a, {'d': json.dumps(bsv), 'at': bsv['savedAt'], 'v': '2.0.0'})
        r = await pg.evaluate(f"(()=>({{ budget: Math.round({F}.S.budget), srvBudget: Math.round(JSON.parse(JSON.parse(sessionStorage.getItem('__srv')).d).budget) }}))()")
        r['reloads'] = len(navs) - 1
        print('4) 미래 저장 시각', json.dumps(r, ensure_ascii=False))
        if r['budget'] < 999999 or r['srvBudget'] < 999999: fails.append(f'4) 서버 학교(B)를 불러오지 않아요 {r}')
        await ctx.close()

        # 나머지는 한 화면에서
        ctx = await b.new_context(viewport={'width': 390, 'height': 780})
        await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('seeded')){ localStorage.clear(); localStorage.setItem('forest-school-v1', %s); sessionStorage.setItem('seeded','1'); }" % json.dumps(json.dumps(dict(base, savedAt=now))))
        big = {'v': 7, 'cfg': {'pace': 0.3, 'pz.perDay': 12}, 'off': ['merge'],
               'notices': [{'id': f'n{i}', 'date': '2026-10-29', 'tag': '알림', 'title': f'공지 {i}', 'lines': ['가' * 200] * 20} for i in range(10)]}
        await ctx.route('https://live.test/**', lambda route: route.fulfill(status=200, content_type='application/json', body=json.dumps(big, ensure_ascii=False)))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(CLEAN)

        # 1) 서버 시간 뒤 기기 시계를 하루 앞으로
        r = await pg.evaluate(f"""(()=>{{ const F={F}, rt=F.rt, T={kst(2026, 11, 5)}; let asked = 0;
          F.SVR.resync = () => {{ asked++; }};
          rt.fakeNow = T; rt.fakePerf = 1000; F.setServerTime(T);
          const t0 = F.gameNow();
          rt.fakeNow = T + 86400000; rt.fakePerf = 6000;   // 5초 흐르는 사이 기기 시계를 하루 앞으로
          const t1 = F.gameNow(), d1 = F.gameToday();
          return new Promise(ok => setTimeout(() => {{ const out = {{ t0: t0 - T, t1: t1 - T, d1, asked }}; F.SVR.resync = null; rt.fakePerf = undefined; rt.fakeNow = 0; F.SVR.ok = false; F.S.clk.last = 0; ok(out); }}, 50)); }})()""")
        print('1) 게임 시계', r)
        if r['t1'] != 5000 or r['d1'] != '2026-11-05' or r['asked'] != 1: fails.append(f'1) 기기 시계를 바꾸면 게임 시계도 바뀌어요 {r}')

        # 5) 학교 파워 +5,000: 규칙과 같은 계산으로 나눠 올리기 흉내
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, R=F.Rank, rt=F.rt;
          R.uid = 'me'; R.rows = []; S.lg.week = 40; S.lg.pts = 100;
          let srv = {{ score: 10000, lp: 100, week: 40, at: 0 }}; S.rank.by = 'me'; S.rank.sent = 10000; S.rank.sws = 40 * 1e6 + 100;
          rt.fakePerf = 0; R.lastPerf = 0;
          const want = 15000, log = [];
          for (let i = 0; i < 6 && srv.score < want; i++) {{
            rt.fakePerf += 11500 + 300;                         // 다음 올리기까지 11.5초 + 서버까지 0.3초
            const now = rt.fakePerf, c = F.rankCap(), sc = Math.min(want, c.score), lp = Math.min(S.lg.pts, c.lp);
            const dt = now - srv.at, ok = sc <= srv.score + (dt >= 10000 ? 2000 : 0) + dt / 500 && lp <= srv.lp + (dt >= 10000 ? 1000 : 0) + dt / 10000;
            log.push([sc, ok]); if (!ok) break;
            srv = {{ score: sc, lp, week: 40, at: now }}; S.rank.sent = sc; S.rank.sws = 40 * 1e6 + lp; R.lastPerf = now + 200;   // 서버가 받은 뒤 0.2초에 알게 돼요
          }}
          rt.fakePerf = undefined; R.lastPerf = undefined;
          return {{ log, final: srv.score }}; }})()""")
        print('5) 큰 점수 나눠 올리기', r)
        if r['final'] != 15000 or not all(x[1] for x in r['log']) or len(r['log']) > 3: fails.append(f'5) 큰 점수를 나눠 올리지 못해요 {r}')

        # 6) 서버 시간을 기다리며 1분 놀고 2시간 내려 두기
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, rt=F.rt, T0={kst(2026, 11, 5)};
          S.pending = 0; S.pendingSec = 0; F.SVR.ok = false; rt.fakePerf = 0;
          rt.awayWait = {{ from: T0 - 3600000, skip: 0, perf: 0 }};   // 이전 자리 비움 1시간
          rt.fakePerf = 60000;                    // 1분 놀아요
          F.awayHold(true);                       // 내려요
          rt.fakePerf = 60000 + 7200000;          // 2시간
          F.awayHold(false);                      // 다시 올려요
          F.setServerTime(T0 + 60000 + 7200000);  // 이제 서버 시간이 와요
          const out = {{ pendingSec: Math.round(S.pendingSec), wait: !!rt.awayWait }};
          rt.fakePerf = undefined; F.SVR.ok = false; S.clk.last = 0; S.pending = 0; S.pendingSec = 0; return out; }})()""")
        await pg.evaluate(CLEAN)
        print('6) 자리 비움', r)
        if abs(r['pendingSec'] - 3 * 3600) > 5: fails.append(f'6) 내려 둔 시간이 빠져요 {r}')

        # 7) 이벤트를 껐다 같은 주에 켜기
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, rt=F.rt;
          rt.fakeNow = {kst(2026, 11, 4)}; S.clk.last = 0; F.evSync();
          const key = S.ev.cur; S.ev.stamp = {{ n: 5, last: F.gameToday() }}; S.ev.list.forEach(m => m.done = true); S.ev.box = true;
          F.liveApply({{ off: ['event'] }}); F.evSync(); const offStamp = F.claimStamp();
          F.liveApply({{}}); F.evSync();
          const out = {{ same: S.ev.cur === key, n: S.ev.stamp.n, box: S.ev.box, again: F.claimStamp(), offStamp }};
          return out; }})()""")
        await pg.evaluate(CLEAN)
        print('7) 이벤트 잠시 끄기', r)
        if not r['same'] or r['n'] != 5 or not r['box'] or r['again'] or r['offStamp']: fails.append(f'7) 이벤트를 껐다 켜면 기록이 사라져요 {r}')

        # 8) 수확 축제 도장 6개(마지막 11/7) → 11/9 월요일, 회차를 맞추기 전에 바로 도장
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, rt=F.rt;
          rt.fakeNow = {kst(2026, 11, 7)}; S.clk.last = 0; F.evSync();
          const k0 = S.ev.cur; S.ev.stamp = {{ n: 6, last: '2026-11-07' }};
          const own0 = S.cos.own.filter(x => x.startsWith('hat:ev_')).length;
          rt.fakeNow = {kst(2026, 11, 9)}; S.clk.last = 0;
          const got = F.claimStamp();
          return {{ k0, k1: S.ev.cur, n: S.ev.stamp.n, got, hats: S.cos.own.filter(x => x.startsWith('hat:ev_')).length - own0 }}; }})()""")
        await pg.evaluate(CLEAN)
        print('8) 회차 넘어갈 때 도장', r)
        if r['k0'] == r['k1'] or r['n'] != 1 or r['hats'] != 0: fails.append(f'8) 지난 회차 진행으로 새 회차 한정품을 받아요 {r}')
        await pg.evaluate(f"(()=>{{ {F}.rt.fakeNow = 0; {F}.S.clk.last = 0; }})()")

        # 9) 공지 날짜가 배열
        r = await pg.evaluate(f"""(()=>{{ const F={F}, n0 = F.NOTICES.length;
          F.liveApply({{ notices: [{{ id: 'arr', title: '배열 날짜', date: ['2026-10-29'], lines: ['a'] }}, {{ id: 'ok', title: '정상', date: '2026-10-29', lines: ['b'] }}] }});
          let err = ''; try {{ F.openNotice(false); }} catch (e) {{ err = String(e); }}
          const ids = F.NOTICES.map(n => n.id);
          F.liveApply({{}});
          return {{ err, hasArr: ids.includes('live-arr'), hasOk: ids.includes('live-ok') }}; }})()""")
        await pg.evaluate(CLEAN)
        print('9) 공지 날짜 배열', r)
        if r['err'] or r['hasArr'] or not r['hasOk']: fails.append(f'9) 잘못된 공지가 걸러지지 않아요 {r}')

        # 10) 큰 핫픽스를 받아 이 기기에 남기고, 다음에 그것만으로 읽기
        r = await pg.evaluate(f"""(async ()=>{{ const F={F};
          window.FS_LIVE_URL = 'https://live.test/live.json'; await F.liveLoad();
          const raw = localStorage.getItem('forest-live') || '';
          let parsed = null; try {{ parsed = JSON.parse(raw); }} catch (e) {{}}
          F.liveApply({{}});   // 다른 값으로 되돌린 뒤 남긴 것만으로 다시 읽어요
          const ok = parsed ? F.liveApply(parsed, 'cache') : false;
          const out = {{ len: raw.length, parsed: !!parsed, ok, pace: F.CFG.pace, perDay: F.PZ.perDay, merge: F.liveOff('merge'), notices: F.NOTICES.filter(n => n.live).length }};
          F.liveApply({{}}); delete window.FS_LIVE_URL; return out; }})()""")
        print('10) 큰 핫픽스 남기기', r)
        if not r['parsed'] or r['len'] <= 20000 or r['pace'] != 0.3 or r['perDay'] != 12 or not r['merge'] or r['notices'] != 10: fails.append(f'10) 남긴 핫픽스를 다시 읽지 못해요 {r}')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await ctx.close()
        await b.close()
    print('\n'.join(fails) if fails else 'PASS')

asyncio.run(main())
