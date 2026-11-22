# 186번 시험(5.3.4.2): 텃밭 '무료 바로 자라기'가 잘 보이는지(퀘스트 4-5 첫 작물 거두기)
# 1) 무료 횟수가 있으면 자라는 작물 칸에 '⚡ 바로 자라기' 단추가 바로 보이고, 텃밭 위에 안내 한 줄
# 2) 누르면 바로 다 자라고 무료 횟수가 줄어요. 다 쓰면 예전처럼 '시간 줄이기'
# 3) 무료 횟수가 있고 자라는 작물이 있으면 지도 급식실에 텃밭 말풍선
# 4) 360px에서 작물 칸이 넘치지 않아요, 오류 없음
import asyncio, pathlib
from playwright.async_api import async_playwright
from testlib import ctxpage, base, F, Checker
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
CLOSE = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt4.modalOpen=null; window.__forest.rt4.modalQueue.length=0;"
async def main():
    c = Checker(); OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((360, 'light'), (390, 'dark')):
            ctx, page, errs = await ctxpage(b, w, 800, scheme, base(tier=0))
            await page.wait_for_timeout(1500); await page.evaluate(CLOSE)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), o={{}};
              S.gn.free = 1; S.gn.plots.forEach(p => {{ p.c=''; p.s=0; p.e=0; p.w=0; }});
              F.openGd(); await sl(150); o.tip0 = /작물을 심으면/.test((document.querySelector('.gd-free-tip')||{{}}).textContent || '');
              F.gdPlant(0, 'carrot'); F.gdRender(true); F.gdMark(); await sl(150);
              const fb = document.querySelector('#gdPlots [data-gd="free"]');
              o.btn = !!fb && fb.getBoundingClientRect().width > 0; o.tip1 = /⚡ 단추/.test((document.querySelector('.gd-free-tip')||{{}}).textContent || '');
              o.mark = document.getElementById('pq-cafeteria').classList.contains('gd-on');
              const pl = document.querySelector('#gdPlots .gd-plot'); o.over = [...pl.querySelectorAll('*')].filter(x => {{ const a = x.getBoundingClientRect(), q = pl.getBoundingClientRect(); return a.width && (a.right > q.right + 1 || a.left < q.left - 1); }}).length;
              return o; }})()""")
            await page.screenshot(path=str(OUT / f's186_gd_{w}_{scheme}.png'))
            r2 = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelector('#gdPlots [data-gd="free"]').click(); await sl(200); F.gdRender(true); F.gdMark();
              return {{ free: S.gn.free, ready: !!document.querySelector('#gdPlots [data-gd="har"]'), tip: !!document.querySelector('.gd-free-tip') }}; }})()""")
            r3 = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelector('#gdPlots [data-gd="har"]').click(); await sl(100); F.gdPlant(0, 'carrot'); F.gdRender(true); F.gdMark(); await sl(100);
              return {{ cut: !!document.querySelector('#gdPlots [data-gd="cut"]'), free: !!document.querySelector('#gdPlots [data-gd="free"]'), mark: document.getElementById('pq-cafeteria').classList.contains('gd-on') }}; }})()""")
            print(w, scheme, r, r2, r3)
            c.ok(r['tip0'] and r['tip1'], f'[{w}] 텃밭 위 무료 바로 자라기 안내')
            c.ok(r['btn'], f'[{w}] 자라는 작물 칸에 ⚡ 바로 자라기 단추')
            c.ok(r['mark'], f'[{w}] 지도 급식실 텃밭 말풍선')
            c.ok(r['over'] == 0, f'[{w}] 작물 칸이 넘치지 않아요')
            c.ok(r2 == {'free': 0, 'ready': True, 'tip': False}, f'[{w}] 누르면 바로 다 자라고 무료 횟수가 줄어요')
            c.ok(r3['cut'] and not r3['free'] and not r3['mark'], f'[{w}] 다 쓰면 예전처럼 시간 줄이기, 말풍선 없음')
            c.ok(not errs, f'[{w}] 오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
