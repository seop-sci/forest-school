# 4.3.0 숲속 탐험대 균형 재기: 대원 레벨, 장비, 별, 학력에 따라 넘을 수 있는 가장 깊은 층과 한 층 걸리는 시간
# 쓰는 법: cd dev && python3 wrap.py && python3 tamsim.py
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
JS = """(cfg)=>{ const F=window.__forest, S=F.S, out=[];
  for (const c of cfg) {
    S.tam.gear={tool:c.g,bag:c.g,hat:c.g}; for (const k of ['sci','pe','kor','art','math']) if (S.ac[k]) S.ac[k].lv=c.ac;
    S.tam.party=c.party; for (const sp of c.party) S.tam.mem[sp]={lv:c.lv,st:c.st,sh:0};
    const team=F.tamTeam(); let lo=1, hi=4000;
    while (lo<hi) { const mid=Math.ceil((lo+hi)/2); if (F.tamSim(mid, team, 7).win) lo=mid; else hi=mid-1; }
    const t1=F.tamSim(Math.max(1,lo-5), team, 7).t;
    out.push({...c, max: F.tamSim(1,team,7).win ? lo : 0, t: t1, pow: F.tamPow()});
  } return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, page, errs = await ctxpage(b, 390, 800, 'light', base(tier=0, tg=1))
        P3, P5 = ['bear', 'rabbit', 'fox'], ['bear', 'rabbit', 'fox', 'cat', 'chick']
        cfg = [dict(party=P3, lv=lv, g=0, st=1, ac=1) for lv in (1, 5, 10, 20, 30, 40)]
        cfg += [dict(party=P5, lv=lv, g=g, st=st, ac=ac) for lv, g, st, ac in [(30, 10, 2, 20), (50, 20, 3, 40), (80, 30, 4, 60), (120, 40, 5, 80), (200, 60, 5, 100)]]
        r = await page.evaluate(JS, cfg)
        print('대원 | 레벨 | 장비 | 별 | 학력 | 넘는 층 | 그 층 근처 시간(초) | 힘')
        for x in r: print(f"{len(x['party'])} | {x['lv']} | {x['g']} | {x['st']} | {x['ac']} | {x['max']} | {x['t']} | {x['pow']}")
        print('errs', errs[:3])
        await b.close()
asyncio.run(main())
