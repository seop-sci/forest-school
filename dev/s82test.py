# 2.1.0 시험: 경제 정리와 상점 리모델링, 숲속 소풍, 칭찬 스티커판
# 보는 것
#  1) 꾸미기 백화점: 테마 세트 60(배경 산 사람 50), 낱개 칸은 못 사요, 옷 세트 25(산 조각 옛 값만큼 빼요), 마크 특별판 30, 놓친 이벤트 장식 20, 부스터 없음
#  2) 문방구: 단축권(하루 5번 합쳐서), 수업료 2배 1시간, 자리 비운 보상 2배(다음 받기 2배), 밤 모드 150, 도토리 묶음과 황금 묶음 없음
#  3) 이름 바꾸기 값 5 + 바꾼 횟수
#  4) 숲속 소풍: 3명, 하루 한 번, 그동안 수업료 −3명, 15분 뒤 보상, 도시락 정수 15, 희귀 열매로 일반 장식
#  5) 칭찬 스티커판: 유치원 잠금, 하루 5장, 20장이면 상(도토리나 황금 2), 새 판
#  6) 저장: tk 글자(옛 토스 사용자 키)는 tkey로, pc, sk, cos.mkx, cos.night, awx 읽기
#  7) 390 밝은, 360 어두운 화면에서 세 가게, 소풍 창, 스티커판 창이 넘치지 않아요(캡처 s82_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s82test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(T.SKIP)
            if w == 390:
                # 1) 꾸미기 백화점
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, o = {{}};
                  S.gold = 1000; S.cos.own = ['th:spring:bg', 'hat:cap'];
                  o.set = [F.thSetPrice('spring'), F.thSetPrice('summer')];
                  o.slot = F.shopItem('t:summer:classroom').price;
                  F.pickShop('t:summer:classroom'); o.slotPick = F.rt.shopPick;
                  F.pickShop('s:spring'); F.buyShop(); o.springOwn = ['bg','classroom','cafeteria','library','science','playground'].every(x => S.cos.own.includes('th:spring:' + x)); o.gold1 = S.gold;
                  o.ofBall = F.shopItem('o:ball').price; o.ofSnow = F.shopItem('o:snow').price;
                  F.pickShop('o:ball'); F.buyShop(); o.wear = [S.cos.hat, S.cos.neck]; o.gold2 = S.gold;
                  F.pickShop('m:gold'); F.buyShop(); o.mkx = S.cos.mkx; o.gold3 = S.gold;
                  o.boost = F.shopItem('b:feast'); o.restock = F.GSHOP.evDeco;
                  F.renderShop(); o.noBoost = !document.querySelector('#shopList [data-buy^="b:"]');
                  return o; }})()""")
                print('백화점', r)
                if r != {'set': [50, 60], 'slot': 0, 'slotPick': '', 'springOwn': True, 'gold1': 950, 'ofBall': 17, 'ofSnow': 25, 'wear': ['cap', 'bandana'], 'gold2': 933, 'mkx': 'gold', 'gold3': 903, 'boost': None, 'restock': 20, 'noBoost': True}:
                    bad.append(f'꾸미기 백화점이 틀려요 {r}')
                # 2) 문방구 3) 이름 바꾸기
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, o = {{}};
                  S.ess = 1000; S.tk = {{ m5: 0, m30: 0, h1: 0, h3: 0 }}; S.es.day = ''; F.rt.fakeNow = 0;
                  for (let i = 0; i < 6; i++) {{ F.pickEss('tk:m5'); F.buyEss(); }}
                  o.tk = S.tk.m5; o.ess1 = S.ess;
                  const f0 = S.hd.feastUntil; F.pickEss('bf'); F.buyEss(); o.feast = Math.round((S.hd.feastUntil - Math.max(f0, Date.now())) / 60000);
                  F.pickEss('ba'); F.buyEss(); o.awx = S.awx;
                  S.pending = 1000; S.pendingSec = 3600; const b0 = S.budget; F.grantOffline(1); o.away = Math.round(S.budget - b0); o.awx2 = S.awx;
                  F.pickEss('night'); F.buyEss(); o.night = [S.cos.night, S.ess];
                  o.old = [F.essItem('acorn'), F.essItem('gold')];
                  S.rank.name = '졸린 다람쥐 12'; S.rank.ren = 0; o.nick = [F.nickPrice()]; S.rank.ren = 3; o.nick.push(F.nickPrice());
                  return o; }})()""")
                print('문방구', r)
                if r != {'tk': 50, 'ess1': 925, 'feast': 60, 'awx': 1, 'away': 2000, 'awx2': 0, 'night': [True, 762], 'old': [None, None], 'nick': [5, 8]}:
                    bad.append(f'문방구나 이름 값이 틀려요 {r}')
                # 4) 숲속 소풍
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, o = {{}}, t0 = Date.now(); F.rt.fakeNow = t0;
                  S.tier = 0; S.f.playground = 3; S.students = 30; S.pc = {{ day: '', at: 0, kids: [], lunch: false, berry: 0, st: {{ n: 0, ess: 0, berry: 0 }} }}; S.ess = 100;
                  const r0 = F.rate(), sp = Object.keys(F.S.dex ? {{}} : {{}});
                  o.start = F.pcStart(['rabbit', 'fox', 'bear'].slice(0, 3), true); o.ess = S.ess;
                  o.away = Math.round(100 * F.rate() / r0); o.again = F.pcStart(['rabbit'], false);
                  const b0 = S.budget; F.rt.fakeNow = t0 + 14 * 60000; o.mid = F.pcSettle();
                  F.rt.fakeNow = t0 + 15 * 60000 + 1000; o.done = F.pcSettle(); o.got = S.budget > b0; o.n = S.pc.st.n; o.back = Math.round(100 * F.rate() / r0);
                  S.pc.berry = 1; S.ess = 0; F.pickDeco('bench'); o.berry = F.buyDecoBerry(); o.bench = S.deco.own.bench; o.berryLeft = S.pc.berry;
                  F.rt.fakeNow = 0; return o; }})()""")
                print('소풍', r)
                if not (r['start'] and r['ess'] == 85 and r['away'] < 100 and r['again'] is False and r['mid'] is False and r['done'] and r['got'] and r['n'] == 1 and r['back'] == 100 and r['berry'] and r['bench'] == 1 and r['berryLeft'] == 0):
                    bad.append(f'숲속 소풍이 틀려요 {r}')
                # 5) 칭찬 스티커판
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, o = {{}};
                  S.tier = 0; S.sk = {{ day: '', n: 0, cur: [], mo: 0, done: [], st: {{ all: 0, boards: 0 }} }}; o.kinder = F.skAdd();
                  S.tier = 1; let n = 0; for (let i = 0; i < 8; i++) if (F.skAdd()) n++; o.day = n;
                  S.sk.day = ''; S.sk.cur = Array(19).fill(0); o.full0 = F.skFull(); F.skAdd(); o.full = F.skFull(); o.more = F.skAdd();
                  const g = S.gold; o.prize = F.skPrize('gold'); o.gold = S.gold - g; o.after = [S.sk.cur.length, S.sk.done.length, S.sk.st.boards];
                  S.tier = 0; return o; }})()""")
                print('스티커판', r)
                if r != {'kinder': None, 'day': 5, 'full0': False, 'full': True, 'more': None, 'prize': True, 'gold': 2, 'after': [0, 1, 1]}:
                    bad.append(f'칭찬 스티커판이 틀려요 {r}')
                # 6) 저장
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const d = JSON.parse(JSON.stringify(F.S));
                  d.tk = 'toss-user-key'; d.awx = 9; d.cos.mkx = 'ribbon'; d.cos.night = true; d.cos.own = ['mkx:gold'];
                  d.pc = {{ day: '2026-10-29', at: 5, kids: ['rabbit', 3, 'fox'], lunch: true, berry: -2 }}; d.sk = {{ n: 99, cur: [1, 9, 2], done: [{{ mo: 13, d: '2026-10-29', s: [0] }}] }};
                  const s = F.sanitize(d); return [s.tkey, s.tk, s.awx, s.cos.mkx, s.cos.night, s.pc.kids, s.pc.berry, s.sk.n, s.sk.cur, s.sk.done[0].mo]; }})()""")
                print('저장', r)
                if r != ['toss-user-key', {'m5': 0, 'm30': 0, 'h1': 0, 'h3': 0}, 3, '', False, ['rabbit', 'fox'], 0, 5, [1, 2], 12]:
                    bad.append(f'저장 읽기가 틀려요 {r}')
            # 7) 화면
            await pg.evaluate(T.CLEAN)
            await pg.evaluate(f"""(() => {{ const S = {F}.S; S.tier = 1; S.f.playground = 3; S.f.classroom = 3; S.gold = 500; S.ess = 500; }})()""")
            for tab, lst in (('shop', '#shopList'), ('ess', '#essList'), ('deco', '#decoList')):
                await pg.evaluate(f"{F}.setTab('{tab}')"); await pg.wait_for_timeout(400)
                o = await pg.evaluate(f"""(() => {{ const L = document.querySelector('{lst}'); const out = [...L.querySelectorAll('button, .sb')].filter(e => {{ const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }}).length; return {{ n: L.children.length, out }}; }})()""")
                print(w, tab, o)
                await pg.screenshot(path=f's82_{w}_{tab}.png')
                if not o['n'] or o['out']: bad.append(f'{w} {tab} 가게 화면이 이상해요 {o}')
            await pg.evaluate(f"{F}.setTab('school')"); await pg.evaluate(T.CLEAN)
            for opener, mid in (('openPicnic', '#mPicnic'), ('openSticker', '#mSticker')):
                await pg.evaluate(f"(() => {{ {F}.rt.modalOpen = null; {F}.{opener}(); }})()"); await pg.wait_for_timeout(500)
                o = await pg.evaluate(f"""(() => {{ const m = document.querySelector('{mid}'); const s = m.querySelector('.modal').getBoundingClientRect(); return {{ open: !m.hidden, out: s.right > innerWidth + 1 || s.left < -1 }}; }})()""")
                print(w, mid, o)
                await pg.screenshot(path=f's82_{w}_{mid[2:]}.png')
                if not o['open'] or o['out']: bad.append(f'{w} {mid} 창이 이상해요 {o}')
                await pg.evaluate(T.CLEAN)
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else 'FAIL')
    raise SystemExit(1 if bad else 0)

asyncio.run(main())
