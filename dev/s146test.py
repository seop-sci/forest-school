# 5.0.1 시험: 순위표 보조 줄은 유치원~고등학교만(대학교, 대학원 줄 없음), 학교 파워는 고등학교 끝쯤(RKF.hsRef 4500) 아래,
# 그리고 누가 보든 똑같아요(내 학교급, 내 점수, 계정과 상관없이). 대결 순위 보조 줄도 같아요
# 쓰는 법: python3 wrap.py && python3 s146test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage
bad = []
sigs, bsigs = set(), set()
JS = """(mine => { const F = window.__forest; F.Rank.state = 'on'; F.Rank.uid = 'u' + Math.random(); F.rt.rkMax = {};
  const rows = F.rkFill('all', [], mine).filter(x => x.nx); F.rt.rkMax = {};
  const bt = F.rkFill('bt', [], 50).filter(x => x.nx);
  return { n: rows.length, maxTier: Math.max(...rows.map(x => x.tier)), maxScore: Math.max(...rows.map(x => x.score)), minScore: Math.min(...rows.map(x => x.score)),
    sig: rows.map(x => x.name + x.score + x.tier).join(','), bsig: bt.map(x => x.name + x.bt).join(','), btMin: Math.min(...bt.map(x => x.bt)), btMax: Math.max(...bt.map(x => x.bt)) }; })"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tier in (2, 3, 4, 5):
            ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=tier, students=60))
            await pg.wait_for_timeout(800)
            r = await pg.evaluate(JS, 12000 if tier % 2 else 900)
            print(tier, {k: v for k, v in r.items() if 'sig' not in k})
            sigs.add(r['sig']); bsigs.add(r['bsig'])
            if r['n'] < 10: bad.append(f'{tier} 줄 수 {r["n"]}')
            if r['maxTier'] > 3: bad.append(f'{tier} 고등학교보다 높은 보조 줄 {r["maxTier"]}')
            if r['maxScore'] > 4500: bad.append(f'{tier} 보조 줄 점수가 너무 큼 {r["maxScore"]}')
            if r['btMin'] < 900 or r['btMax'] > 1500: bad.append(f'{tier} 대결 보조 줄 점수 {r["btMin"]}~{r["btMax"]}')
            if errs: bad.append(f'페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    if len(sigs) != 1 or len(bsigs) != 1: bad.append(f'보조 줄이 사람마다 달라요 {len(sigs)} {len(bsigs)}')
    print('FAIL' if bad else 'PASS', *bad, sep='\n')
asyncio.run(main())
