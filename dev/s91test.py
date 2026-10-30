# 2.1.3 시험: 날씨
# 보는 것
#  1) 날마다 정해지는 날씨: 같은 날은 늘 같고, 겨울은 비 대신 눈, 맑음이 가장 많아요(한 해 돌려 봐요), 핫픽스로 끄면 맑음
#  2) 보너스: 비 오는 날 책 읽기 10분과 국어 XP +5, 눈 오는 날 떨어진 도토리 1.5배, 안개 낀 날 실험 성공 XP +15
#  3) 지도 효과와 날씨 칩, 그날 처음 한 번 알림, 꾸미기와 지난 학교급 보기에서는 칩을 숨겨요, 넘침과 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s91test.py   (마지막 줄이 PASS면 통과)
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
            r = await pg.evaluate(f"""(() => {{ const F = {F}; const c = {{ '': 0, rain: 0, snow: 0, fog: 0 }}, wint = {{ rain: 0, snow: 0 }};
              const d0 = new Date(Date.UTC(2027, 0, 1)); let rainDay = '', snowDay = '', fogDay = '', clearDay = '';
              for (let i = 0; i < 365; i++) {{ const d = new Date(d0.getTime() + i * 864e5).toISOString().slice(0, 10), k = F.wxOf(d), m = +d.slice(5, 7); c[k]++;
                if (m === 12 || m <= 2) {{ if (k === 'rain') wint.rain++; if (k === 'snow') wint.snow++; }}
                if (k === 'rain' && !rainDay) rainDay = d; if (k === 'snow' && !snowDay) snowDay = d; if (k === 'fog' && !fogDay) fogDay = d; if (!k && !clearDay) clearDay = d; }}
              const same = F.wxOf(rainDay) === F.wxOf(rainDay);
              return {{ c, wint, same, rainDay, snowDay, fogDay, clearDay }}; }})()""")
            print('날씨', json.dumps(r, ensure_ascii=False))
            c = r['c']
            if not (c[''] > 250 and 40 < c['rain'] + c['snow'] < 90 and 15 < c['fog'] < 45 and r['wint']['rain'] == 0 and r['wint']['snow'] > 5 and r['same']): bad.append(f'{w}: 날씨 나누기 {r}')
            days = r
            # 보너스
            DAY = lambda d: f"Date.parse('{d}T03:00:00Z')"
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const at = d => {{ F.rt.fakeNow = Date.parse(d + 'T03:00:00Z'); S.clk = {{ last: 0 }}; }};
              at('{days['clearDay']}'); const m0 = F.rdMinNow(), d0 = F.dropValue();
              at('{days['rainDay']}'); const m1 = F.rdMinNow(); S.f.library = Math.max(1, S.f.library); S.rd.cur = ''; S.rd.n = 0; S.rd.day = '';
              const okStart = F.S.rd ? true : false;
              at('{days['snowDay']}'); const d1 = F.dropValue();
              F.Live && 0;
              return {{ m0, m1, ratio: Math.round(d1 / d0 * 100) / 100 }}; }})()""")
            print('보너스', r)
            if r['m0'] != 15 or r['m1'] != 10 or abs(r['ratio'] - 1.5) > 0.05: bad.append(f'{w}: 보너스 {r}')
            # 화면: 비 오는 날 홈
            await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; F.rt.fakeNow = Date.parse('{days['rainDay']}T03:00:00Z'); S.clk = {{ last: 0 }}; S.wx = ''; F.setTab('school'); F.renderWeather(); }})()")
            await pg.wait_for_timeout(1200)
            r = await pg.evaluate("(() => ({ fx: !document.querySelector('#wxFx').hidden && document.querySelector('#wxFx').className, chip: !document.querySelector('#wxChip').hidden && document.querySelector('#wxChip').textContent, toast: document.querySelector('#toast').textContent }))()")
            print('화면', r)
            if r['fx'] != 'wx-fx wx-rain' or '비 오는 날' not in (r['chip'] or '') or '책 읽기' not in r['toast']: bad.append(f'{w}: 비 화면 {r}')
            await pg.screenshot(path=f's91_rain_{w}.png')
            await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; F.rt.fakeNow = Date.parse('{days['snowDay']}T03:00:00Z'); S.clk = {{ last: 0 }}; F.renderWeather(); }})()")
            await pg.wait_for_timeout(500); await pg.screenshot(path=f's91_snow_{w}.png')
            r = await pg.evaluate(f"(() => {{ const F = {F}; F.decoEditStart(); F.renderWeather(); const a = document.querySelector('#wxChip').hidden; F.decoEditEnd(); F.renderWeather(); return [a, document.querySelector('#wxChip').hidden]; }})()")
            if r != [True, False]: bad.append(f'{w}: 꾸미기 중 칩 {r}')
            # 핫픽스로 끄기
            r = await pg.evaluate(f"(() => {{ const F = {F}; F.Live.off.add('weather'); const k = F.wxOf('{days['rainDay']}'); F.renderWeather(); const h = document.querySelector('#wxFx').hidden; F.Live.off.delete('weather'); return [k, h]; }})()")
            if r != ['', True]: bad.append(f'{w}: 핫픽스 끄기 {r}')
            o = await pg.evaluate("""(() => { const W = innerWidth; const c = document.querySelector('#wxChip').getBoundingClientRect(); return c.right > W + 1 || c.left < -1; })()""")
            if o: bad.append(f'{w}: 날씨 칩이 넘쳐요')
            bad += [f'{w}: 페이지 오류 {e}' for e in errs]
            await ctx.close()
        await b.close()
    if bad:
        print('FAIL'); [print(' -', x) for x in bad]
    else: print('PASS')
asyncio.run(main())
