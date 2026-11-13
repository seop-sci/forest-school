# 124번 시험(4.2.0): 숲속 합치기 주문을 채우고 건네도 판이 움직이지 않아요 (지섭 제보: 화면이 들썩)
# '건네기' 줄이 생기고 사라질 때 주문 줄 높이와 판 위치가 그대로인지, 360px과 390px
import asyncio
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, sc in [(360, 740, 'light'), (390, 844, 'dark')]:
            ctx, page, errs = await ctxpage(b, w, h, sc, base(tier=2, tg=1))
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              const R=s=>{{const e=document.querySelector(s).getBoundingClientRect(); return [Math.round(e.top),Math.round(e.height)];}};
              S.mg.seen=1; F.mgSetCells(F.mgEmptyBoard()); F.mgOpen(); await sl(300);
              S.mg.orders=[{{it:[{{k:'a',n:3,c:1}}],who:'rabbit'}},{{it:[{{k:'a',n:6,c:1}}],who:'fox'}},{{it:[{{k:'m',n:6,c:1}}],who:'bear'}}];
              F.mgRenderAll(); await sl(100); const a=[R('#mgOrders'), R('#mgBoard')];
              const c=F.mgCells(); c[30]='a3'; F.mgSetCells(c); F.mgRenderAll(); await sl(100); const b=[R('#mgOrders'), R('#mgBoard')], okN=document.querySelectorAll('.mg-order.ok').length;
              const n=document.querySelector('.mg-order.ok .mo-n').getBoundingClientRect(), rw=document.querySelector('.mg-order.ok .mo-rw').getBoundingClientRect();
              F.mgClaimOrder(0); await sl(100); const d=[R('#mgOrders'), R('#mgBoard')];
              return {{a, b, d, okN, cover: n.top < rw.bottom - 1}}; }})()""")
            print(w, sc, r)
            ok(r['okN'] == 1, f'{w}px 건넬 수 있는 주문 하나')
            ok(r['a'] == r['b'] == r['d'], f'{w}px 주문 줄과 판이 그대로')
            ok(not r['cover'], f'{w}px 건네기 줄이 보상 숫자를 가리지 않음')
            ok(not errs, f'페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
