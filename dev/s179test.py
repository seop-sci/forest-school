# 5.3.2 졸업 탭 빨간 점: 명예 교장실(수료증)과 기금은 '추천' 칸을 올릴 수 있을 때만(다른 칸만 되면 점 없음)
# 쓰는 법: python3 wrap.py && python3 s179test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(base(tier=2))))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(CLEAN)
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, out = {{}};
          const dot = () => F.gradRecReady();
          let rec, other;
          for (let i = 0; i < 12; i++) {{ const ks = Object.keys(F.PERKS).filter(k => !F.perkMaxed(k)); rec = F.perkRec().k; other = ks.filter(k => k !== rec).sort((a, b) => F.perkCost(a) - F.perkCost(b))[0];
            if (other && F.perkCost(other) < F.perkCost(rec)) break; S.p.perk.schol = (S.p.perk.schol || 0) + 1; }}
          S.fund = 0; S.p.ticket = 0;
          out.rec = rec; out.other = other; out.costs = [F.perkCost(rec), other ? F.perkCost(other) : null];
          if (other && F.perkCost(other) < F.perkCost(rec)) {{ S.p.dip = F.perkCost(other); out.otherOnly = dot(); }}
          S.p.dip = F.perkCost(rec); out.recOk = dot();
          S.p.dip = 0; const fr = F.fpRec().k; S.fund = F.fpCost(fr); out.fundRec = dot();
          return out; }})()""")
        print(r)
        if 'otherOnly' not in r: bad.append(f'추천보다 싼 다른 칸을 못 만들었어요 {r}')
        if r.get('otherOnly') is True: bad.append(f'추천이 아닌 칸만 될 때도 빨간 점 {r}')
        if not r['recOk']: bad.append(f'추천 칸을 올릴 수 있는데 빨간 점이 없어요 {r}')
        if not r['fundRec']: bad.append(f'기금 추천을 올릴 수 있는데 빨간 점이 없어요 {r}')
        bad += [f'오류 {e}' for e in errs[:3]]
        await b.close()
    print('\n'.join(bad) if bad else '')
    print('FAIL' if bad else 'PASS')

asyncio.run(main())
