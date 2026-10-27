# 보안 점검 검증 시험 (2026-10-28, 문서 "보안 점검 (2026-10-28)"의 1-1, 1-3, 2-5)
# 이 시험은 "고친 뒤에 나와야 할 바른 동작"을 확인해요. 지금(1.8.0 main) FAIL이면 문서의 문제가 재현된 거예요.
#  1-1) 기기 A는 어제 저장, 서버에는 기기 B의 오늘 저장. A를 켜면 서버(B) 학교를 불러와야 해요(덮어쓰면 FAIL)
#       대조: A 저장에 받지 않은 자리 비움 보상이 있으면(applyAway 대신 showOffline만 불러 save()를 안 해요) 불러오기가 돼요
#  1-3) 보상 창을 닫지 않고 앱을 내렸다 올리기를 두 번(10시간씩): 쌓인 시간이 상한(offlineCapH)을 넘으면 FAIL
#  2-5) 서버 시간은 맞고 기기 시계만 앞으로 돌려 켜기: 보상이 나오면 FAIL. 정말 비운 시간은 받고, 서버 시간을 못 받으면 다음에 받아요
#  2-3) 같은 학교 번호(pid)의 두 줄은 계정이 다르면 둘 다 보여요
# 가짜 Firebase(window.FOREST_FB)를 페이지에 끼워 넣어 실제 initCloud 흐름을 돌려요. targaryen 서버는 쓰지 않아요.
# 쓰는 법: python3 wrap.py && python3 s71test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, time
from playwright.async_api import async_playwright
from s4test import URL

F = 'window.__forest'
H = 3600 * 1000

FAKE_FB = r"""
(() => {
  const srv = JSON.parse(sessionStorage.getItem('__srv') || 'null');
  const log = (p, v) => { const a = JSON.parse(sessionStorage.getItem('__writes') || '[]'); a.push([p, v]); sessionStorage.setItem('__writes', JSON.stringify(a)); };
  const snap = v => ({ val: () => v, exists: () => v != null, forEach() {}, numChildren: () => 0 });
  const ref = p => {
    const r = {
      once: () => Promise.resolve(snap(p === 'forest/saves/u1' ? srv : null)),
      on: (ev, cb) => { if (p === '.info/connected') cb(snap(window.__srvOff !== 'none')); else if (p === '.info/serverTimeOffset') { if (window.__srvOff !== 'none') cb(snap(window.__srvOff || 0)); } else cb(snap(null)); return cb; },
      off() {}, set: v => { log(p, v); return Promise.resolve(); }, update: v => { log(p, v); return Promise.resolve(); },
      remove: () => Promise.resolve(), child: c => ref(p + '/' + c), push: () => ref(p + '/x'),
      orderByChild: () => r, limitToLast: () => r, limitToFirst: () => r, equalTo: () => r, startAt: () => r, endAt: () => r,
      onDisconnect: () => ({ set: () => Promise.resolve(), remove: () => Promise.resolve(), cancel: () => Promise.resolve() })
    };
    return r;
  };
  const user = { uid: 'u1', isAnonymous: true, providerData: [] };
  const db = { ref };
  const database = () => db; database.ServerValue = { TIMESTAMP: 0 };
  const fb = { apps: [], initializeApp() { fb.apps.push(1); }, auth: () => ({ currentUser: user, onAuthStateChanged: cb => { setTimeout(() => cb(user), 0); return () => {}; }, signInAnonymously: () => Promise.resolve({ user }) }), database };
  window.FOREST_FIREBASE = { databaseURL: 'https://fake.example' };
  window.FOREST_FB = Promise.resolve(fb);
})();
"""
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"


async def base_save(b):
    """정상 학교 저장 하나를 얻어요(튜토리얼은 건너뛴 상태)."""
    ctx = await b.new_context(viewport={'width': 390, 'height': 780})
    await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
    pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(2000)
    sv = await pg.evaluate(f"(()=>{{ const S={F}.S; S.tut.st='skip'; S.q.m = Math.max(S.q.m, 3); S.budget = 1000; return JSON.parse(JSON.stringify(S)); }})()")
    await ctx.close()
    return sv


async def two_devices(b, base, a_pending):
    now = int(time.time() * 1000)
    a = json.loads(json.dumps(base)); a['budget'] = 111; a['savedAt'] = now - 24 * H   # 기기 A: 어제 마지막 저장
    if a_pending: a['pending'] = 5; a['pendingSec'] = 100
    bsv = json.loads(json.dumps(base)); bsv['budget'] = 999999; bsv['savedAt'] = now - 2 * H   # 기기 B: 오늘 두 시간 전
    srv = {'d': json.dumps(bsv), 'at': bsv['savedAt'], 'v': '1.8.0'}
    ctx = await b.new_context(viewport={'width': 390, 'height': 780})
    await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('seeded')){ localStorage.clear(); localStorage.setItem('forest-school-v1', %s); sessionStorage.setItem('__srv', %s); sessionStorage.setItem('seeded','1'); }"
                              % (json.dumps(json.dumps(a)), json.dumps(json.dumps(srv))))
    await ctx.add_init_script(FAKE_FB)
    pg = await ctx.new_page(); navs = []
    pg.on('framenavigated', lambda f: navs.append(f.url) if f == pg.main_frame else None)
    await pg.goto(URL); await pg.wait_for_timeout(4000)
    r = await pg.evaluate(f"""(()=>{{ const w = JSON.parse(sessionStorage.getItem('__writes') || '[]').filter(x => x[0] === 'forest/saves/u1');
      const first = w[0] ? JSON.parse(w[0][1].d) : null;
      return {{ budget: Math.round({F}.S.budget), cloud: {F}.Cloud.state, pushes: w.length, pushedBudget: first ? Math.round(first.budget) : null,
               pushedAt: w[0] ? w[0][1].at : null, adopted: sessionStorage.getItem('forest-adopt') }}; }})()""")
    r['reloads'] = len(navs) - 1
    r['srvAt'] = bsv['savedAt']
    await ctx.close()
    return r


async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        base = await base_save(b)

        # 1-1
        r = await two_devices(b, base, a_pending=False)
        print('1-1 기기 A 어제, 서버 B 오늘', json.dumps(r, ensure_ascii=False))
        if r['budget'] < 999999 or r['pushedBudget'] == 111: fails.append(f'1-1 다른 기기의 오늘 저장이 덮여요 {r}')
        r = await two_devices(b, base, a_pending=True)
        print('1-1 대조(A에 받지 않은 보상)', json.dumps(r, ensure_ascii=False))
        if r['budget'] < 999999: fails.append(f'1-1 대조에서도 불러오지 않아요 {r}')

        # 1-3 보상 창을 닫지 않고 10시간씩 두 번 내렸다 올리기
        ctx = await b.new_context(viewport={'width': 390, 'height': 780})
        await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('seeded')){ localStorage.clear(); localStorage.setItem('forest-school-v1', %s); sessionStorage.setItem('seeded','1'); }" % json.dumps(json.dumps(dict(base, savedAt=int(time.time() * 1000)))))
        pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(CLEAN)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.pending = 0; S.pendingSec = 0;
          const capH = F.CFG.offlineCapH + 4 * S.p.perk.night, eff = Math.min(1, 0.3 + 0.15 * S.t.owl), per = () => F.rate() * eff * 3600;
          const out = {{ capH }};
          for (const k of ['once', 'twice']) {{
            F.rt.hiddenAt = Date.now() - 10 * 3600 * 1000;   // 10시간 전에 앱을 내렸어요
            document.dispatchEvent(new Event('visibilitychange'));   // 다시 올려요(보상 창은 닫지 않아요)
            out[k] = {{ pendingSec: Math.round(S.pendingSec), pendingH: +(S.pending / per()).toFixed(2), modal: !document.querySelector('#mOffline').hidden }};
          }}
          return out; }})()""")
        print('1-3 applyAway 두 번', json.dumps(r, ensure_ascii=False))
        if r['twice']['pendingH'] > r['capH'] + 0.05: fails.append(f"1-3 쌓인 보상 {r['twice']['pendingH']}시간치 > 상한 {r['capH']}시간 {r}")
        await ctx.close()

        # 2-5 서버 시간은 맞고(가짜 서버가 진짜 시각을 알려 줘요) 기기 시계만 24시간, 48시간 앞으로 돌려 켜기 두 번
        async def boot(sv, shift_h, srv_off):
            ctx = await b.new_context(viewport={'width': 390, 'height': 780})
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear(); localStorage.setItem('forest-school-v1', %s);"
                                      "(() => { const sh = %d, n = Date.now; Date.now = () => n() + sh; })(); window.__srvOff = %s;"
                                      % (json.dumps(json.dumps(sv)), shift_h * H, json.dumps(srv_off)))
            await ctx.add_init_script(FAKE_FB)
            pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(2500)
            r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const eff = Math.min(1, 0.3 + 0.15 * S.t.owl);
              return {{ shiftH: {shift_h}, pendingH: +(S.pending / (F.rate() * eff * 3600)).toFixed(2), capH: F.CFG.offlineCapH + 4 * S.p.perk.night,
                        awayFrom: S.away ? S.away.from : null, src: F.timeSrc() }}; }})()""")
            nsv = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; S.budget += S.pending; S.pending = 0; S.pendingSec = 0; F.save(); return JSON.parse(localStorage.getItem('forest-school-v1')); }})()")
            await ctx.close()
            return r, nsv
        now = int(time.time() * 1000)
        got = []; sv = dict(base, savedAt=now, pending=0, pendingSec=0)
        for shift_h in (24, 48):
            r, sv = await boot(sv, shift_h, -shift_h * H)
            got.append(r)
        print('2-5 기기 시계만 앞으로 두 번', json.dumps(got, ensure_ascii=False))
        if sum(1 for g in got if g['pendingH'] > 0) >= 1: fails.append(f'2-5 시계를 돌리면 오프라인 보상이 나와요 {got}')
        # 대조: 정말 10시간 비웠으면(시계 그대로) 상한만큼 받아요
        r, _ = await boot(dict(base, savedAt=now - 10 * H, pending=0, pendingSec=0), 0, 0)
        print('2-5 대조(정말 10시간)', json.dumps(r, ensure_ascii=False))
        if abs(r['pendingH'] - r['capH']) > 0.05: fails.append(f'2-5 정말 비운 시간 보상이 안 나와요 {r}')
        # 서버 시간을 못 받으면(오프라인) 기다렸다가 다음에 받아요
        r1, sv2 = await boot(dict(base, savedAt=now - 10 * H, pending=0, pendingSec=0), 0, 'none')
        r2, _ = await boot(sv2, 0, 0)
        print('2-5 오프라인으로 켰다가 다음에 온라인', json.dumps([r1, r2], ensure_ascii=False))
        saved_from = (sv2.get('away') or {}).get('from', 0)
        print('2-5 오프라인 때 저장된 away.from', saved_from)
        if r1['pendingH'] > 0 or not saved_from or abs(r2['pendingH'] - r2['capH']) > 0.05: fails.append(f'2-5 오프라인 기다리기 {r1} {r2} from={saved_from}')

        # 2-3 남의 학교 번호(pid)로 쓴 줄이 피해 학교를 가리지 않아요(계정으로만 묶어요)
        ctx = await b.new_context(viewport={'width': 390, 'height': 780})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, t = Date.now();
          const rows = F.rankRows([['V', {{ name: '피해', score: 900, at: t - 60000, pid: 'VICTIM01' }}], ['A', {{ name: '공격', score: 10, at: t, pid: 'VICTIM01' }}]]);
          return rows.map(r => r.name); }})()""")
        print('2-3 같은 pid 두 줄', r)
        if '피해' not in r: fails.append(f'2-3 피해 학교가 가려져요 {r}')
        await ctx.close()
        await b.close()
    print('\n'.join(fails) if fails else 'PASS')

asyncio.run(main())
