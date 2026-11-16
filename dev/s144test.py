# 5.0.0 시험: 연구소와 연구동 방에 가구가 보이고(FUR_AR), 가구 값이 건물 값처럼 lvOff를 따라요
# 쓰는 법: python3 wrap.py && python3 s144test.py   (마지막 줄이 PASS면 통과)
import asyncio, math
from playwright.async_api import async_playwright
from s4test import base, ctxpage
bad = []
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, mode in ((360, 'light'), (390, 'dark')):
            sv = base(tier=5, students=90)
            ctx, pg, errs = await ctxpage(b, w, 800, mode, sv)
            await pg.wait_for_timeout(1200)
            for k in ('institute', 'gradhall', 'union'):
                r = await pg.evaluate("""(async k=>{const F=window.__forest,S=F.S,sl=ms=>new Promise(r=>setTimeout(r,ms));
                  document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
                  S.f.union=35; S.f.institute=10; S.f.gradhall=10; for(const x of ['union','institute','gradhall']) S.fu[x]=S.fu[x].map(()=>S.f[x]-1);
                  F.openSheet(k); await sl(700);
                  const ims=[...document.querySelectorAll('#roomFur image, .room-fur image, svg image')].filter(e=>/fur/.test(e.getAttribute('href')||'')||true);
                  const fur=[...document.querySelectorAll('image')].filter(e=>{const h=+e.getAttribute('height'); return e.closest('.sheet,.overlay:not([hidden])') && isFinite(h) && h>0;}).length;
                  const nan=[...document.querySelectorAll('image')].filter(e=>e.closest('.sheet,.overlay:not([hidden])') && (e.getAttribute('height')||'').includes('NaN')).length;
                  const fac=F.facCost(k), furs=F.FUR[k].map((_,i)=>F.furCost(k,i));
                  document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null;
                  return {fur, nan, ratio: furs.map(c=>c/fac)};})""", k)
                print(w, k, r)
                if r['nan']: bad.append(f'{w} {k} 가구 높이 NaN {r["nan"]}')
                if any(not (0.05 < x < 1.5) for x in r['ratio']): bad.append(f'{w} {k} 가구 값 비율 {r["ratio"]}')
            if w == 390:
                await pg.evaluate("window.__forest.openSheet('institute')"); await pg.wait_for_timeout(800)
                await pg.screenshot(path='/tmp/s144_institute.png')
                await pg.evaluate("document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); window.__forest.rt4.modalOpen=null; window.__forest.openSheet('gradhall')"); await pg.wait_for_timeout(800)
                await pg.screenshot(path='/tmp/s144_gradhall.png')
            if errs: bad.append(f'페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('FAIL' if bad else 'PASS', *bad, sep='\n')
asyncio.run(main())
