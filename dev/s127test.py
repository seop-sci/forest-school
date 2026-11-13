# 127번 시험(4.2.0): 대축제 사흘 동안 캠퍼스 지도와 구역 다섯 곳 모두 만국기 (대축제 설계 8절)
# 대축제 날에는 캠퍼스, 학술, 생활, 체육 구역에 만국기(광장은 축제 모습 그대로), 대축제가 아닌 축제 날과 다른 날에는 광장 말고 없음
import asyncio
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
CLOCK = lambda day, h=10: f"(()=>{{ const F={F}; F.rt.fakeNow=Date.parse('{day}T00:00:00Z')-9*3600000+{h}*3600000; F.fvSync(); return F.gameToday(); }})()"
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        fac = dict(classroom=14, cafeteria=12, library=11, playground=8, science=6, union=1, store=5, dorm=3)
        ctx, page, errs = await ctxpage(b, 360, 740, 'dark', base(tier=4, tg=2, f=fac, students=40))
        async def count(day):
            await page.evaluate(CLOCK(day))
            out = {}
            for z in ['', 'academic', 'life', 'sports', 'plaza']:
                out[z or 'campus'] = await page.evaluate(f"""(()=>{{ const F={F}; F.setTab('school'); F.setZone('{z}', true); F.fvMap(true);
                  return [...document.querySelectorAll('#fvTop image')].filter(i=>i.getAttribute('href')===F.IMG('fv_bunting')).length; }})()""")
            return out
        r = await count('2026-11-20'); print('매주 축제 금요일', r); ok(r['plaza'] == 1 and sum(r.values()) == 1, '매주 축제 날에는 광장만')
        r = await count('2026-11-27'); print('대축제 금요일', r); ok(all(v >= 1 for v in r.values()), '대축제 날 다섯 곳 모두 만국기')
        r2 = await page.evaluate(f"(()=>{{ const F={F}; F.S.tier=3; F.fvMap(true); const n=document.querySelectorAll('#fvTop image').length; F.S.tier=4; return n; }})()")
        ok(r2 == 0, '고등학교에서는 만국기 없음')
        r = await count('2026-11-29'); print('대축제 일요일', r); ok(all(v >= 1 for v in r.values()), '대축제 일요일도')
        r = await count('2026-11-30'); print('월요일', r); ok(r['plaza'] == 1 and sum(r.values()) == 1, '대축제가 끝난 월요일(매주 축제 날)에는 광장만')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
