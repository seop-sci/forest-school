# 2.1.3 시험: 숲속 패스
# 보는 것
#  1) 2026-11-02 전에는 '준비 중', 유치원은 '초등학교부터'. 메인 퀘스트 ps1은 패스가 닫혀 있으면 바로 마쳐요
#  2) 시즌 번호(4주), 오늘 미션 3개와 이번 주 미션 5개, 미션을 하면 받기, 점수
#  3) 광고 2배(이미 받은 오늘 미션도 더해요), 단계 보상 모두 받기(정수, 단축권, 에너지, 문제집, 배지와 칭호, 한정 장식, 한정 가구), 덤 상자
#  4) 시즌이 바뀌면 받을 수 있던 보상을 저절로 받고 새로 시작, 옛 저장 받기
#  5) 화면: 이벤트 창 칸, 트랙, 교실 시즌 가구, 360과 390에서 넘치지 않음, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s88test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel) => { const W = innerWidth; const r = document.querySelector(sel); if (!r) return -1;
  return [...r.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && e.offsetParent !== null && !e.closest('.ps-track') && (q.right > W + 1 || q.left < -1); }).length; }"""
DAY = lambda d: f"Date.parse('{d}T03:00:00Z')"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            # 1) 열기 전
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; F.rt.fakeNow = {DAY('2026-10-30')}; S.clk = {{ last: 0 }};
              const kin = (S.tier = 0, F.psOpen()); S.tier = 1; const before = F.psOpen(), seas = F.psSeason('2026-11-01');
              const q = F.MAIN.find(x => x.id === 'ps1'); const m0 = F.qMeasure(q);
              F.rt.fakeNow = {DAY('2026-11-03')}; S.clk = {{ last: 0 }}; F.psSync(); const after = F.psOpen(), s0 = S.ps.s, m1 = F.qMeasure(q);
              return {{ kin, before, seas, m0, after, s0, m1, s1: F.psSeason('2026-11-30'), s13: F.psSeason('2027-11-01') }}; }})()""")
            print('열기', r)
            if r != {'kin': False, 'before': False, 'seas': -1, 'm0': 1, 'after': True, 's0': 0, 'm1': 0, 's1': 1, 's13': 13}: bad.append(f'{w}: 여는 때 {r}')
            # 2) 미션
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.f.playground = 3; S.ps.day = ''; S.ps.wk = -1; F.psSync();
              const d = S.ps.dl.map(m => m.id), wl = S.ps.wl.map(m => m.id);
              const m = S.ps.dl[0], key = m.id; const bump = n => {{ if (key === 'picks') S.st.picks += n; else if (key === 'shakes') S.st.shakes += n; else if (key === 'dm') S.st.dmDone += n; else if (key === 'pz') S.st.pz = (S.st.pz||0) + n; else if (key === 'mg') S.mg.st.orders += n; else if (key === 'rd') S.rd.st += n; else if (key === 'bt') S.bt.st.w += n; else if (key === 'sk') S.sk.st.all += n; else S.st.sports += n; }};
              const no = F.psClaimMission('d', 0); bump(m.n); const ok = F.psClaimMission('d', 0), again = F.psClaimMission('d', 0);
              return {{ d: d.length, w: wl.length, uniq: new Set(d).size === 3 && new Set(wl).size === wl.length, no, ok, again, pts: S.ps.pts }}; }})()""")
            print('미션', r)
            if r['d'] != 3 or r['w'] < 4 or not r['uniq'] or r['no'] or not r['ok'] or r['again'] or r['pts'] != 30: bad.append(f'{w}: 미션 {r}')
            # 3) 광고 2배, 단계 보상
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; let ok = null; const sa = window.__forest; F.psWatchAd && 0;
              S.ps.ad = ''; const p0 = S.ps.pts;
              S.ps.ad = F.S.ps.day; const add = S.ps.dl.filter(m => m.done).length * F.PS.dP; S.ps.pts += add;
              const e0 = S.ess, g0 = S.gold, t0 = S.tk.m5, mg0 = S.mg.e, xp0 = F.acSum ? 0 : 0;
              S.ps.pts = 3000 + 650; const items = F.psClaimAll(true); {CLEAN};
              const deco = !!S.deco.own['ps_0'], fur = S.ps.fur.includes('psf_0'), sel = S.ps.fsel, titles = F.achTitles().map(t => t.id);
              return {{ p1: p0 + add, lv: F.psLv(), got: S.ps.got === 2 ** 30 - 1, tot: S.ps.tot, ex: S.ps.ex, ess: S.ess - e0, gold: S.gold - g0, tk: S.tk.m5 - t0, mg: S.mg.e - mg0,
                badge: S.ps.badge, deco, fur, sel, title: titles.includes('psnew'), n: items.length, ready: F.psClaimable() }}; }})()""")
            print('보상', r)
            if r['lv'] != 30 or not r['got'] or r['tot'] != 30 or r['ex'] != 2 or r['gold'] != 5 or r['ess'] < 100 or r['tk'] < 9 or r['mg'] < 60 or r['badge'] != 1 or not r['deco'] or not r['fur'] or r['sel'] != 'psf_0' or not r['title']: bad.append(f'{w}: 단계 보상 {r}')
            # 퀘스트, 교실 가구
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const q = F.MAIN.find(x => x.id === 'ps1'); return {{ q: F.qMeasure(q), fur: F.psFurImg('classroom').includes('<image'), other: F.psFurImg('library') }}; }})()""")
            if r != {'q': 30, 'fur': True, 'other': ''}: bad.append(f'{w}: 퀘스트와 가구 {r}')
            # 4) 시즌 넘어감: 받을 수 있던 보상 저절로
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.ps.got = 0; S.ps.pts = 250; const g0 = S.gold, e0 = S.ess;
              F.rt.fakeNow = {DAY('2026-12-01')}; S.clk = {{ last: 0 }}; F.psSync(); const q = F.rt.modalQueue.length + (F.rt.modalOpen && F.rt.modalOpen.id === 'mReward' ? 1 : 0); {CLEAN};
              const d = JSON.parse(JSON.stringify(S)); d.ps.pts = 'x'; d.ps.got = -5; d.ps.dl = [{{ id: 'zz', n: 1 }}, {{ id: 'picks', n: 30, b: 2, done: true }}]; d.ps.fur = ['psf_1', 'bad']; d.ps.fsel = 'psf_9';
              const s2 = F.sanitize(d);
              return {{ s: S.ps.s, pts: S.ps.pts, got: S.ps.got, e: S.ess - e0, q, san: [s2.ps.pts, s2.ps.got, s2.ps.dl.length, s2.ps.fur, s2.ps.fsel] }}; }})()""")
            print('시즌', json.dumps(r, ensure_ascii=False))
            if r['s'] != 1 or r['pts'] != 0 or r['got'] != 0 or r['e'] < 5 or r['q'] < 1 or r['san'] != [0, 0, 1, ['psf_1'], '']: bad.append(f'{w}: 시즌 넘어감 {r}')
            # 5) 화면
            await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; S.ps.pts = 640; S.ps.day = ''; F.psSync(); F.setTab('event'); F.setEvSeg('ps'); }})()")
            await pg.wait_for_timeout(600)
            r = await pg.evaluate("""(() => ({ seg: !document.querySelector('#psBody').hidden && document.querySelector('#evBody').hidden, nodes: document.querySelectorAll('.ps-node').length,
              open: document.querySelectorAll('.ps-node.open').length, btn: !!document.querySelector('[data-ps=all]'), ad: !!document.querySelector('[data-ps=ad]'), ms: document.querySelectorAll('#psBody .dm').length,
              ttl: document.querySelector('.ps-ttl') && document.querySelector('.ps-ttl').innerText }))()""")
            print('화면', json.dumps(r, ensure_ascii=False))
            if not r['seg'] or r['nodes'] != 30 or r['open'] != 6 or not r['btn'] or not r['ad'] or r['ms'] < 7: bad.append(f'{w}: 화면 {r}')
            o = await pg.evaluate(OVER, '#panelEvent')
            if o: bad.append(f'{w}: 패스 화면이 {o}곳 넘쳐요')
            await pg.screenshot(path=f's88_pass_{w}.png')
            await pg.click('[data-ps=all]'); await pg.wait_for_timeout(500)
            r = await pg.evaluate(f"({{ open: !document.querySelector('#mReward').hidden, got: {F}.S.ps.got }})")
            if not r['open'] or r['got'] != 63: bad.append(f'{w}: 받기 단추 {r}')
            await pg.screenshot(path=f's88_reward_{w}.png')
            await pg.evaluate(CLEAN)
            bad += [f'{w}: 페이지 오류 {e}' for e in errs]
            await ctx.close()
        await b.close()
    if bad:
        print('FAIL'); [print(' -', x) for x in bad]
    else: print('PASS')
asyncio.run(main())
