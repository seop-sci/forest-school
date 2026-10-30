# 2.1.3 시험: 반짝 친구
# 보는 것
#  1) 굴리기: 5% 확률, 12번 못 만나면 다음은 꼭, 판다와 강아지는 그 친구가 온 뒤부터, 다 만나면 더 안 와요, 황금 도토리 1
#  2) 종업식 뒤 소개 대화(교감, 반짝 친구, 교감), 대사에 털 색 말이 없어요
#  3) 지도 학생 그림, 도감 반짝 친구 줄, 업적 줄, 명부 r 표시와 옛 저장
#  4) 화면 넘침 없음, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s89test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
COLOR = ['검은', '검정', '흰 ', '하얀', '흰색', '까만', '갈색', '노란', '금빛', '색이 다른', '피부', '색깔']

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const R = Math.random;
              S.p.species = 0; S.rare = {{ got: [], miss: 0 }}; Math.random = () => 0.5; let n = 0; for (let i = 0; i < 12; i++) if (F.rareRoll()) n++;
              const miss = S.rare.miss, g0 = S.gold; const x = F.rareRoll(); const pity = x && x.sp, g1 = S.gold - g0;
              Math.random = () => 0.01; for (let i = 0; i < 20; i++) F.rareRoll(); const noNeed = S.rare.got.slice().sort();
              S.p.species = 4; for (let i = 0; i < 5; i++) F.rareRoll(); const all = S.rare.got.length; const none = F.rareRoll();
              Math.random = R; return {{ n, miss, pity: !!pity, g1, noNeed, all, none }}; }})()""")
            print('굴리기', r)
            if r['n'] != 0 or r['miss'] != 12 or not r['pity'] or r['g1'] != 1 or r['noNeed'] != ['bear', 'chick', 'fox', 'rabbit'] or r['all'] != 6 or r['none'] is not None: bad.append(f'{w}: 굴리기 {r}')
            # 종업식 뒤 대화
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.rare = {{ got: [], miss: 12 }}; S.tier = 1; S.tg = 0; S.sem = 1; S.grade = 4; S.best = 4; S.q.m = F.MAIN.findIndex(q => q.id === 'e12'); S.q.lat = '';
              F.graduate(); return {{ got: S.rare.got.length, q: F.rt.modalQueue.length }}; }})()""")
            if r['got'] != 1: bad.append(f'{w}: 종업식 반짝 친구 {r}')
            lines = []
            for _ in range(10):
                o = await pg.evaluate("(() => { const m = document.querySelector('#mTalk'); if (!m.hidden) return ['talk', document.querySelector('#talkWho').textContent, document.querySelector('#talkText').textContent]; const g = document.querySelector('#gradOk'); if (g && !document.querySelector('#mGrad').hidden) { g.click(); return ['grad']; } const rw = document.querySelector('#rwOk'); if (rw && !document.querySelector('#mReward').hidden) { rw.click(); return ['rw']; } return ['none']; })()")
                if o[0] == 'talk':
                    lines.append(o[1:]); await pg.click('#talkNext')
                elif o[0] == 'none': break
                await pg.wait_for_timeout(250)
            print('대화', json.dumps(lines, ensure_ascii=False))
            rl = [l for l in lines if '반짝' in l[0] or '별빛' in l[1]]
            if len(rl) < 3 or not any(l[0].startswith('반짝 친구') for l in rl): bad.append(f'{w}: 반짝 친구 대화 {lines}')
            txt = await pg.evaluate(f"JSON.stringify({F}.RARE.list) + {F}.rareDexHTML()")
            for c in COLOR:
                if c in txt or any(c in l[1] for l in rl): bad.append(f'{w}: 털 색 말 "{c}"')
            # 지도, 도감, 업적, 명부
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; {CLEAN}; S.rare.got = ['rabbit', 'fox']; const svg = F.kidSVG('rabbit_rare', 0);
              F.setTab('dex'); F.setDexSeg && F.setDexSeg('dex'); const cards = document.querySelectorAll('.dex-card.rare').length, on = document.querySelectorAll('.dex-card.rare.on').length;
              const ach = F.ACH.find(a => a.id === 'rare'), av = ach.v();
              const Rm = Math.random; Math.random = () => 0.05; const kid = F.rosterKid('rabbit', []); Math.random = Rm;
              const d = JSON.parse(JSON.stringify(S)); d.rare = {{ got: ['rabbit', 'zzz', 'rabbit'], miss: 99 }}; const s2 = F.sanitize(d);
              return {{ img: svg.includes('rare-spark') && svg.includes('<image'), cards, on, av, kidR: kid.r === true, san: [s2.rare.got, s2.rare.miss] }}; }})()""")
            print('보이는 곳', json.dumps(r, ensure_ascii=False))
            if not r['img'] or r['cards'] != 6 or r['on'] != 2 or r['av'] != 2 or not r['kidR'] or r['san'] != [['rabbit'], 12]: bad.append(f'{w}: 보이는 곳 {r}')
            await pg.evaluate(CLEAN); await pg.evaluate("document.querySelector('.dex-card.rare') && document.querySelector('.dex-card.rare').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f's89_dex_{w}.png')
            o = await pg.evaluate("""(() => { const W = innerWidth; return [...document.querySelectorAll('#panelDex *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && e.offsetParent !== null && (q.right > W + 1 || q.left < -1); }).length; })()""")
            if o: bad.append(f'{w}: 도감이 {o}곳 넘쳐요')
            bad += [f'{w}: 페이지 오류 {e}' for e in errs]
            await ctx.close()
        await b.close()
    if bad:
        print('FAIL'); [print(' -', x) for x in bad]
    else: print('PASS')
asyncio.run(main())
