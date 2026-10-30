# 2.1.3 시험: 학부모 쪽지 이야기
# 보는 것
#  1) 처음에는 첫 통, 게임 주가 바뀔 때마다 한 통(같은 주에는 더 안 와요), 열두 통에서 멈춰요
#  2) 새 편지 칩을 누르면 읽고 숲의 정수 2, 다시 읽으면 정수는 없어요. 편지함에서 앞뒤로 넘겨요, 졸업 편지 창은 그대로
#  3) 옛 저장 바로잡기, 화면 넘침 없음, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s92test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.pl = {{ got: 0, read: 0, wk: -1 }}; const at = d => {{ F.rt.fakeNow = Date.parse(d + 'T03:00:00Z'); S.clk = {{ last: 0 }}; }};
              at('2026-11-03'); F.plSync(); const a = S.pl.got; F.plSync(); const b2 = S.pl.got;
              at('2026-11-10'); F.plSync(); const c = S.pl.got;
              for (let i = 0; i < 20; i++) {{ at(new Date(Date.UTC(2026, 10, 17 + i * 7)).toISOString().slice(0, 10)); F.plSync(); }}
              return {{ a, b: b2, c, end: S.pl.got, n: F.PL.list.length }}; }})()""")
            print('받기', r)
            if r != {'a': 1, 'b': 1, 'c': 2, 'end': 12, 'n': 12}: bad.append(f'{w}: 받기 {r}')
            await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; S.pl = {{ got: 3, read: 1, wk: F.gameWeek ? 0 : 0 }}; S.pl.wk = 1e6; F.setTab('school'); F.renderPLetter(); }})()")
            await pg.wait_for_timeout(400)
            r0 = await pg.evaluate("!document.querySelector('#plChip').hidden")
            e0 = await pg.evaluate(f"{F}.S.ess")
            await pg.evaluate("document.querySelector('#plChip').click()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate(f"""(() => ({{ open: !document.querySelector('#mLetter').hidden, title: document.querySelector('#ltTitle').textContent, text: document.querySelector('#ltText').innerText, read: {F}.S.pl.read, ess: {F}.S.ess, pg: document.querySelector('#ltPg').textContent, nav: !document.querySelector('#ltNav').hidden }}))()""")
            print('읽기', json.dumps(r, ensure_ascii=False)[:300])
            if not r0 or not r['open'] or r['read'] != 2 or r['ess'] - e0 != 2 or '드림' not in r['text'] or r['pg'] != '2 / 12' or not r['nav']: bad.append(f'{w}: 읽기 {r}')
            await pg.screenshot(path=f's92_letter_{w}.png')
            await pg.click('#ltPrev'); await pg.wait_for_timeout(200)
            r = await pg.evaluate(f"({{ pg: document.querySelector('#ltPg').textContent, ess: {F}.S.ess, prev: document.querySelector('#ltPrev').disabled }})")
            if r['pg'] != '1 / 12' or r['ess'] - e0 != 2 or not r['prev']: bad.append(f'{w}: 앞 편지 {r}')
            o = await pg.evaluate("""(() => { const W = innerWidth; return [...document.querySelectorAll('#mLetter *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && e.offsetParent !== null && (q.right > W + 1 || q.left < -1); }).length; })()""")
            if o: bad.append(f'{w}: 편지 창이 {o}곳 넘쳐요')
            await pg.click('#ltClose'); await pg.wait_for_timeout(200)
            # 졸업 편지는 그대로
            r = await pg.evaluate(f"""(() => {{ const F = {F}; F.openLetter && F.openLetter({{ ltr: {{ nm: '달래', txt: '고마워요' }} }}); return {{ nav: document.querySelector('#ltNav').hidden, btn: document.querySelector('#ltClose').textContent, t: document.querySelector('#ltTitle').textContent }}; }})()""")
            if r != {'nav': True, 'btn': '고마워!', 't': '달래의 졸업 편지'}: bad.append(f'{w}: 졸업 편지 {r}')
            await pg.evaluate(CLEAN)
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const d = JSON.parse(JSON.stringify(S)); d.pl = {{ got: 99, read: 120, wk: 'x' }}; const s2 = F.sanitize(d); return [s2.pl.got, s2.pl.read, s2.pl.wk]; }})()""")
            if r != [12, 12, -1]: bad.append(f'{w}: 옛 저장 {r}')
            bad += [f'{w}: 페이지 오류 {e}' for e in errs]
            await ctx.close()
        await b.close()
    if bad:
        print('FAIL'); [print(' -', x) for x in bad]
    else: print('PASS')
asyncio.run(main())
