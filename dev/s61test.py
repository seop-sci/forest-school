# 1.7.4 시험: 도토리로 숲의 정수 바꾸기 (정수 상점 '바꾸기' 칸)
# 보는 것
#  1) 값은 수업료 60분치(nice(rate * 3600), 10 이상), 바꾸면 도토리가 그만큼 줄고 정수 +10, 하루 5번까지(6번째는 막혀요)
#  2) 도토리가 모자라면 안 바뀌어요. 날이 바뀌면 다시 5번
#  3) 거꾸로 바꿔도 남는 게 없어요(정수 20개로 사는 도토리 묶음 30분치 < 정수 20개를 만드는 데 드는 120분치)
#  4) 옛 저장(es.x 없음)도 0으로 받아 줘요. 저장했다 불러와도 오늘 바꾼 횟수가 남아요
#  5) 정수 상점 화면에 '바꾸기' 칸이 보이고 넘치지 않아요(360 어두운, 390 밝은). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s61test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(SKIP)
            if w == 390:
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.budget = 1e12; S.ess = 0;
                  const cost = F.esExCost(), want = Math.max(10, Math.round(F.rate() * 3600)), out = [];
                  for (let i = 0; i < 6; i++) {{ const b0 = S.budget, e0 = S.ess; F.pickEss('ex'); F.buyEss(); out.push([b0 - S.budget, S.ess - e0]); }}
                  return {{ cost, rate: F.rate(), left: F.esExLeft(), x: S.es.x, out, ess: S.ess }}; }})()""")
                print('바꾸기', json.dumps(r))
                c = r['cost']
                if not (isinstance(c, (int, float)) and c >= 10 and c < 1e15): bad.append(f'값 이상 {c}')
                if abs(c - max(10, r['rate'] * 3600)) > max(10, r['rate'] * 3600) * 0.2: bad.append(f'값이 60분치가 아니에요 {c} / rate {r["rate"]}')
                if r['out'][:5] != [[c, 10]] * 5: bad.append(f'다섯 번 바꾸기: {r["out"][:5]}')
                if r['out'][5] != [0, 0] or r['left'] != 0 or r['x'] != 5 or r['ess'] != 50: bad.append(f'여섯 번째가 막히지 않아요: {r}')
                # 저장 → 불러오기, 옛 저장, 날 바뀜, 도토리 모자람
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S;
                  const back = F.sanitize(JSON.parse(JSON.stringify(S))).es.x;
                  const old = JSON.parse(JSON.stringify(S)); delete old.es.x; const oldX = F.sanitize(old).es.x;
                  S.es.day = '2000-01-01'; const leftNew = F.esExLeft();
                  S.budget = 0; const e0 = S.ess; F.pickEss('ex'); F.buyEss(); const poor = [S.ess - e0, S.budget];
                  const arb = F.ESHOP.acorn.ess * (F.ESHOP.ex.min / F.ESHOP.ex.n) > F.ESHOP.acorn.min;
                  return {{ back, oldX, leftNew, poor, arb }}; }})()""")
                print('저장과 날', json.dumps(r))
                if r['back'] != 5 or r['oldX'] != 0 or r['leftNew'] != 5 or r['poor'] != [0, 0] or not r['arb']: bad.append(f'저장/날/모자람/거꾸로: {r}')
            # 화면: 정수 상점의 바꾸기 칸
            await pg.evaluate(f"(() => {{ {F}.S.budget = 1e9; {F}.setTab('ess'); }})()"); await pg.wait_for_timeout(500)
            r = await pg.evaluate("""(() => { const b = document.querySelector('[data-ebuy="ex"]'); if (!b) return null; const row = b.closest('.sb'), W = innerWidth;
              const over = [...row.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > W + 1 || q.left < -1); }).length;
              return { text: row.textContent.replace(/\\s+/g, ' ').trim(), over, h: Math.round(row.getBoundingClientRect().height) }; })()""")
            print(w, scheme, '화면', json.dumps(r, ensure_ascii=False))
            if not r or '숲의 정수 10개' not in r['text'] or r['over']: bad.append(f'{w} 바꾸기 칸: {r}')
            await pg.screenshot(path=f's61_{w}.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('FAIL ' + ' | '.join(bad) if bad else 'PASS')

asyncio.run(main())
