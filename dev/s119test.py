# 119번 시험(4.1.2): 학예회(학교 축제, 동아리 공연) 무대가 학생을 가리지 않아요
# 무대, 조명 그늘, 환영회 줄 장식(.kfloor)이 학생 층 맨 아래에 있고, 학생 줄 세우기(0.5초마다)가 지나도 그대로인지 봐요
import asyncio
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
Q = f"""(()=>{{ const F={F}, L=document.querySelector('#kids'), ch=[...L.children], fl=[...L.querySelectorAll(':scope > .kfloor')].map(e=>ch.indexOf(e));
  const ki=F.rt.kids.map(k=>ch.indexOf(k.g)).filter(i=>i>=0); return {{ floor: fl, minKid: Math.min(...ki), n: ki.length, star: !!(F.rt.fest && F.rt.fest.star) }}; }})()"""
async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        fac = dict(classroom=14, cafeteria=12, library=11, playground=8, science=6)
        for t, fid in ((1, 'show'), (4, 'show'), (1, 'welcome')):
            ctx, page, errs = await ctxpage(b, 390, 780, 'light', base(tier=t, tg=4, f=fac, students=60))
            await page.evaluate(f"(()=>{{document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true}}); const F={F}; F.rt.modalOpen=null; F.rt.modalQueue.length=0; F.S.fest.next={{}}; F.startFest('{fid}', true);}})()")
            await page.wait_for_timeout(8500)
            r = await page.evaluate(Q); print(t, fid, r)
            if not r['floor'] or max(r['floor']) > r['minKid'] or r['n'] < 5: bad.append(f'{t} {fid}: 장식이 학생 위에 있어요 {r}')
            if fid == 'show' and not r['star']: bad.append(f'{t}: 무대에 오른 학생이 없어요')
            if errs: bad.append(f'{t} {fid}: 오류 {errs[:2]}')
            await ctx.close()
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
asyncio.run(main())
