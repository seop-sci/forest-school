# 190번 시험(5.4.0.2): 공사 덧그림 자리와 토스 저장 모으기
# 1) 모든 학교급과 대학교 구역에서 공사 덧그림(con_)이 건물 그림과 같은 자리(건설 가속 때도). 예전에는 가속 때 흔들기 기준점이 기울임과 눌림에 걸려 운동장과 기숙사가 아래로 밀렸어요
# 2) 토스(window.AIT): 저장할 때마다 토스 저장소로 보내지 않고 20초에 한 번 모아 보내요. 화면을 내리면 바로 보내요
import asyncio, json
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, URL
c = Checker()
KEYS = ('classroom', 'cafeteria', 'library', 'playground', 'science', 'store', 'dorm', 'union', 'institute', 'gradhall')
FAKE_AIT = """window.__aitSet = 0; window.AIT = { ads: false, testAd: true, adReady: () => false, preload: () => {}, showAd: d => d({ earned: false }),
  storage: { getItem: () => Promise.resolve(null), setItem: () => { window.__aitSet++; return Promise.resolve(); } },
  setScore: () => Promise.resolve(), openBoard: () => Promise.resolve(), close: () => Promise.resolve(), safeArea: () => null, subscribeSafe: () => () => {}, userKey: async () => '', serverTime: null };"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tier, zone in ((0, None), (1, None), (2, None), (3, None), (4, 'academic'), (4, 'life'), (4, 'sports'), (4, 'plaza'), (5, 'lab')):
            kw = dict(tier=tier, students=110)
            if zone: kw['zone'] = zone
            sv = base(**kw); sv['f'] = {k: max(3, sv['f'].get(k, 0)) for k in KEYS}
            ctx, pg, errs = await ctxpage(b, 360, 780, 'light', sv)
            await pg.wait_for_timeout(1300); await pg.evaluate(CLEAN)
            r = await pg.evaluate("""async()=>{ const F = window.__forest, S = F.S, now = Date.now(), bad = []; let n = 0;
              for (const k of Object.keys(F.FAC)) { if (!document.getElementById('b-' + k)) continue; S.bd[k] = { L: S.f[k] + 1, s: now, e: now + 3600e3 }; }
              F.conRender(true); await new Promise(r => setTimeout(r, 300));
              for (const fast of [0, 1]) {
                document.querySelectorAll('.con').forEach(c => c.classList.toggle('fast', !!fast)); await new Promise(r => setTimeout(r, 50));
                document.querySelectorAll('.con .con-art').forEach(c => { n++; const g = c.closest('[id^=b-]'), bi = g.querySelector('.built .bimg'), a = c.getBoundingClientRect(), q = bi.getBoundingClientRect();
                  if (Math.abs(a.y - q.y) > 1 || Math.abs(a.x - q.x) > 1 || Math.abs(a.height - q.height) > 1) bad.push([g.id, fast, Math.round(a.x - q.x), Math.round(a.y - q.y)]); }); }
              return { n, bad }; }""")
            print(tier, zone, r)
            c.ok(r['n'] > 0 and not r['bad'], f'{tier} {zone or ""} 공사 덧그림이 건물과 같은 자리 {r}')
            c.ok(not errs, f'{tier} {zone or ""} 오류 없음 {errs[:2]}')
            await ctx.close()
        # 토스 저장 모으기
        ctx = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        await ctx.add_init_script(FAKE_AIT)
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(base(tier=2))))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        r = await pg.evaluate("""async()=>{ const F = window.__forest, o = {}; const sl = ms => new Promise(r => setTimeout(r, ms));
          o.ait = document.documentElement.classList.contains('ait');
          await sl(25000); window.__aitSet = 0;   // 켤 때 모인 것은 지나 보내요
          for (let i = 0; i < 20; i++) F.save();
          o.now = window.__aitSet;
          o.ls = localStorage.getItem('forest-school-v1') === JSON.stringify(F.S);
          await sl(21000); o.after = window.__aitSet;
          F.save(); F.save(Date.now()); o.hide = window.__aitSet - o.after;
          return o; }""")
        print('toss', r)
        c.ok(r['ait'], '토스 판으로 켜졌어요')
        c.ok(r['now'] == 0 and r['ls'], f'저장 20번에 토스 저장소로 바로 보내지 않고 이 기기에는 바로 저장 {r}')
        c.ok(r['after'] == 1, f'20초 뒤 한 번만 모아 보내요 {r}')
        c.ok(r['hide'] == 1, f'내리거나 닫을 때(save(at))는 바로 보내요 {r}')
        c.ok(not errs, f'토스 판 오류 없음 {errs[:2]}')
        await ctx.close(); await b.close()
    c.done()
asyncio.run(main())
