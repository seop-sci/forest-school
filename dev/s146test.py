# 5.0.1 시험: 순위표 보조 줄은 고등학교까지만(대학교, 대학원 줄 없음), 학교 파워는 고등학교 끝쯤(4500)을 넘는 기준으로 크지 않아요
# 쓰는 법: python3 wrap.py && python3 s146test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import base, ctxpage
bad = []
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tier in (2, 3, 4, 5):
            ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=tier, students=60))
            await pg.wait_for_timeout(800)
            r = await pg.evaluate("""(mine => { const F = window.__forest; F.Rank.state = 'on'; F.rt.rkMax = {};
              const rows = F.rkFill('all', [], mine).filter(x => x.nx);
              return { n: rows.length, maxTier: Math.max(...rows.map(x => x.tier)), maxScore: Math.max(...rows.map(x => x.score)), minScore: Math.min(...rows.map(x => x.score)) }; })""", 12000)
            print(tier, r)
            if r['n'] < 10: bad.append(f'{tier} 줄 수 {r}')
            if r['maxTier'] > 3: bad.append(f'{tier} 고등학교보다 높은 보조 줄 {r}')
            if r['maxTier'] > tier: bad.append(f'{tier} 내 학교급보다 높은 줄 {r}')
            if r['maxScore'] > 4500 * 1.1: bad.append(f'{tier} 보조 줄 점수가 너무 큼 {r}')
            if errs: bad.append(f'페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('FAIL' if bad else 'PASS', *bad, sep='\n')
asyncio.run(main())
