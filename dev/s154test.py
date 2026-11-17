# 5.0.1.1 시험: 숨은 생물(생물 탐사) 자리를 건물이나 참나무가 덮지 않는지, 대학교 생활 구역 매점 앞 생물을 누르면 매점 창이 아니라 생물 창이 열리는지
# 쓰는 법: python3 wrap.py && python3 s154test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tier, zone in ((2, None), (3, None), (4, 'academic'), (4, 'life'), (4, 'plaza'), (5, 'life')):
            kw = dict(tier=tier, students=110)
            if zone: kw['zone'] = zone
            ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(**kw))
            await pg.wait_for_timeout(1200)
            r = await pg.evaluate("""async()=>{const F=window.__forest,S=F.S,R=F.rt4,sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true});R.modalOpen=null;R.modalQueue.length=0;
              F.bxSync(); const n=F.BX_SPOT[S.bx.m]; S.bx.sp=n.map((_,i)=>({i,id:'bio_sparrow',t:0})); F.renderDeco(true); await sl(300);
              const res=[...document.querySelectorAll('#bxG .bx-hit')].map(h=>{const r=h.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e&&e.closest('[data-bx]')?'ok':(e?(e.closest('[id]')||{}).id:'off')});
              return {n:n.length,res};}""")
            print(tier, zone, r)
            c.ok(r['res'] and all(x == 'ok' for x in r['res']), f'{tier} {zone} 생물 자리가 가려요 {r["res"]}')
            if zone == 'life':
                h = await pg.evaluate("()=>{const r=document.querySelector('#bxG .bx-hit[data-bx=\"2\"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")
                await pg.touchscreen.tap(h[0], h[1]); await pg.wait_for_timeout(700)
                st = await pg.evaluate("()=>({bx:!document.querySelector('#mBx').hidden, sheet:window.__forest.rt4.sheetKey||null})")
                print(' 누름', st)
                c.ok(st['bx'] and not st['sheet'], f'{tier} 생활 구역 매점 앞 생물을 눌렀는데 {st}')
            c.ok(not errs, f'오류 {errs[:2]}')
            await ctx.close()
asyncio.run(main())
c.done()
