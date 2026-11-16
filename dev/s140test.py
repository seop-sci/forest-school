# 4.4.1.1 시험: 대학교 구역 지도 네 장은 장식 개수를 함께 세요(한 구역에 놓은 장식을 다른 구역에 또 놓을 수 없어요)
# 쓰는 법: python3 wrap.py && python3 s140test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage
bad = []
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=4, zone='academic'))
        r = await pg.evaluate("""(async()=>{const F=window.__forest,S=F.S,sl=ms=>new Promise(r=>setTimeout(r,ms)),Z=F.ZONE0;
          document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
          const id='bench'; S.deco.own={}; S.deco.own[id]=1; for(let z=0;z<4;z++) S.deco.lay[Z+z]=S.deco.lay[Z+z].map(()=>'');
          const out={id}; F.setZone('academic'); await sl(300); out.a=F.decoPut(0,id);
          F.setZone('life'); await sl(300); out.b=F.decoPut(0,id); out.usedLife=F.decoUsed(Z+1,id,-1);
          F.setZone('academic'); await sl(300); out.c=F.decoPut(1,id);   // 같은 구역 다른 자리도 안 돼요
          out.d=F.decoPut(0,'');   // 빼면
          F.setZone('life'); await sl(300); out.e=F.decoPut(0,id);   // 다른 구역에 놓을 수 있어요
          out.lay=[0,1,2,3].map(z=>S.deco.lay[Z+z].filter(x=>x===id).length);
          // 옛 저장: 네 구역에 하나씩 놓여 있었으면 앞 구역 하나만 남아요
          for(let z=0;z<4;z++) S.deco.lay[Z+z][0]=id; F.save&&F.save(); return out;})()""")
        print(r)
        if not r['a'] or r['b'] or r['c'] or not r['d'] or not r['e'] or r['lay'] != [0, 1, 0, 0] or r['usedLife'] != 1: bad.append(f'구역끼리 함께 세지 않아요: {r}')
        if errs: bad.append(f'오류 {errs[:2]}')
        await ctx.close()
        # 옛 저장 읽기: 네 구역에 벤치가 하나씩 놓여 있고 가진 벤치는 2개
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=4))
        info = await pg.evaluate("()=>({Z:window.__forest.ZONE0, n:window.__forest.S.deco.lay.map(a=>a.length)})")
        await ctx.close()
        lay = [[''] * n for n in info['n']]
        for z in range(4): lay[info['Z'] + z][0] = 'bench'
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=4, deco={'own': {'bench': 2}, 'lay': lay, 'nm': '', 'mk': None}))
        r2 = await pg.evaluate("()=>{const F=window.__forest,S=F.S,Z=F.ZONE0; return [0,1,2,3].map(z=>S.deco.lay[Z+z].filter(x=>x==='bench').length);}")
        print('옛 저장', r2)
        if r2 != [1, 1, 0, 0]: bad.append(f'옛 저장에서 넘친 장식이 남아요: {r2}')
        await ctx.close()
    print('\n'.join(bad) if bad else 'PASS')
asyncio.run(main())
