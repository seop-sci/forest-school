# 1.8.0 시험: 숲속 합치기 부스터 (숲의 정수 고정값, 2026-10-27 지섭 결정)
# (1) 에너지 +20: 정수 5, 하루 3번, 100을 넘어도 돼요
# (2) 행운의 생산기: 정수 8, 하루 1번, 다음 30번은 한 단계 높게(Lv.1 생산기면 모두 2단계), 31번째부터 원래대로
# (3) 정수가 모자라면 안 사져요, 다음 날 횟수가 다시 차요
# (4) 저장: 옛 저장(bst 없음)은 기본값, 망가진 값은 바로잡기, 저장 후 다시 읽어도 행운 남은 횟수 그대로
# (5) 화면: 360px 어두운 화면, 390px 밝은 화면에서 부스터 창과 아래 칸이 넘치지 않는지
# 쓰는 법: python3 wrap.py && python3 s67test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, calendar
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
NOON = calendar.timegm((2026, 11, 3, 3, 0, 0)) * 1000

async def boot(ctx, save=None):
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    if save is not None: await pg.add_init_script(f"localStorage.setItem('forest-school-v1', {json.dumps(json.dumps(save))});")
    await pg.goto(URL); await pg.wait_for_timeout(3000)
    await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; F.rt.fakeNow = {NOON}; S.clk.last = 0; S.mg.seen = true; }})()")
    return pg, errs

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg, errs = await boot(ctx)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          F.mgOpen(); S.ess = 100; S.mg.e = 90;
          out.buys = []; for (let i = 0; i < 4; i++) out.buys.push(F.mgBuyBoost('energy'));
          out.e = S.mg.e; out.ess = S.ess; out.left = F.mgBstLeft('energy');
          return out; }})()""")
        if r['buys'] != [True, True, True, False] or r['e'] != 150 or r['ess'] != 85 or r['left'] != 0: fails.append(f'에너지 +20 {r}')
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          S.ess = 20; S.mg.e = 200; F.mgSetCells(F.mgEmptyBoard());
          out.buy = F.mgBuyBoost('lucky'); out.again = F.mgBuyBoost('lucky'); out.ess = S.ess; out.luck = S.mg.bst.luck;
          const lv = []; for (let i = 0; i < 31; i++) {{ const before = F.mgCells(); F.mgTapGen(0); const after = F.mgCells(); const j = after.findIndex((c, k) => c !== before[k]); lv.push(Number(after[j][1])); const cc = F.mgCells(); cc[j] = '..'; F.mgSetCells(cc); }}
          out.first30 = [...new Set(lv.slice(0, 30))]; out.last = lv[30]; out.luckEnd = S.mg.bst.luck;
          return out; }})()""")
        if not r['buy'] or r['again'] or r['ess'] != 12 or r['luck'] != 30: fails.append(f'행운 사기 {r}')
        if r['first30'] != [2] or r['last'] != 1 or r['luckEnd'] != 0: fails.append(f'행운 30번 {r}')
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          out.lucky0 = F.mgBuyBoost('lucky');                              // 오늘 이미 1번
          S.ess = 3; out.poor = F.mgBuyBoost('energy');                    // 정수 모자람 (다음 날)
          F.rt.fakeNow = {NOON} + 86400000; S.clk.last = 0;
          out.poor = F.mgBuyBoost('energy'); out.ess = S.ess;
          S.ess = 50; out.next = F.mgBuyBoost('lucky'); out.nl = F.mgBstLeft('energy');
          return out; }})()""")
        if r['lucky0'] or r['poor'] or r['ess'] != 3 or not r['next'] or r['nl'] != 3: fails.append(f'횟수와 정수 {r}')
        # 저장
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S;
          const a = F.sanitize(JSON.parse(JSON.stringify(S))).mg.bst;
          const d = JSON.parse(JSON.stringify(S)); delete d.mg.bst; const b = F.sanitize(d).mg.bst;
          const e = JSON.parse(JSON.stringify(S)); e.mg.bst = {{ day: 5, lucky: -3, energy: 'x', luck: 9999 }}; const c = F.sanitize(e).mg.bst;
          return {{ a, b, c }}; }})()""")
        if r['a']['luck'] != 30: fails.append(f'저장 다시 읽기 {r}')
        if r['b'] != {'day': '', 'lucky': 0, 'energy': 0, 'luck': 0}: fails.append(f'옛 저장 {r}')
        if r['c'] != {'day': '', 'lucky': 0, 'energy': 0, 'luck': 30}: fails.append(f'망가진 저장 {r}')
        if errs: fails.append(f'오류 {errs}')
        # 화면
        for w, dark in ((360, True), (390, False)):
            c2 = await b.new_context(viewport={'width': w, 'height': 760}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
            await c2.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg2, e2 = await boot(c2)
            await pg2.evaluate(f"(()=>{{ const F={F}, S=F.S; S.ess = 30; F.mgOpen(); S.mg.bst.luck = 12; F.mgRenderAll(); }})()")
            await pg2.wait_for_timeout(300)
            r = await pg2.evaluate("""(()=>{ const f = document.querySelector('#mgFoot'), fr = f.getBoundingClientRect(); const over = [...f.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > fr.right + 1 || r.left < fr.left - 1); }).map(el => el.className || el.tagName); return { over, sw: document.documentElement.scrollWidth }; })()""")
            await pg2.screenshot(path=f's67_foot_{w}.png')
            if r['over'] or r['sw'] > w: fails.append(f'{w}px 아래 칸 넘침 {r}')
            await pg2.evaluate(f"{F}.mgOpenBoost()")
            await pg2.wait_for_timeout(300)
            r = await pg2.evaluate("""(()=>{ const s = document.querySelector('#mgBoostSheet'), sr = s.getBoundingClientRect(); const over = [...s.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > sr.right + 1 || r.left < sr.left - 1); }).map(el => el.className || el.tagName); return { over, top: sr.top }; })()""")
            await pg2.screenshot(path=f's67_sheet_{w}.png')
            if r['over'] or r['top'] < 0: fails.append(f'{w}px 부스터 창 넘침 {r}')
            if e2: fails.append(f'{w}px 오류 {e2}')
            await c2.close()
        await b.close()
    print('\n'.join(fails) if fails else 'PASS')

asyncio.run(main())
