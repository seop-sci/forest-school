# 185번 시험(5.3.4.2): 운동회 달리기 떨림(지글지글)
# 트랙을 도는 학생이 매 프레임 '도착(멈춤)'과 '걷기'를 오가거나 앞모습과 뒷모습 그림을 자꾸 바꾸지 않는지 3초 동안 세요
# 고치기 전: 걷기와 멈춤 바뀜 초당 186번, 그림(href) 바꾸기 초당 69번. 고친 뒤: 0번, 3번 안팎(트랙을 돌며 실제로 방향이 바뀔 때)
import asyncio
from playwright.async_api import async_playwright
from testlib import ctxpage, base, F, Checker
CLOSE = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt4.modalOpen=null; window.__forest.rt4.modalQueue.length=0;"
async def main():
    c = Checker()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for gfx in (2, 0):
            sv = base(tier=2); sv['gfx'] = gfx
            ctx, page, errs = await ctxpage(b, 390, 844, 'light', sv)
            await page.wait_for_timeout(1500); await page.evaluate(CLOSE)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              S.clk.last = 0; F.rt4.fakeNow = Date.parse('2026-11-23T03:00:00Z'); S.sports.next = 0; F.startSports(); await sl(4500);
              let href = 0; const mo = new MutationObserver(L => {{ for (const m of L) if (m.attributeName === 'href') href++; }});
              mo.observe(document.querySelector('#map'), {{ attributes: true, subtree: true, attributeFilter: ['href'] }});
              const kids = F.rt4.kids; let flip = 0, prev = kids.map(k => k.moving); const t0 = performance.now();
              await new Promise(res => {{ const f = () => {{ kids.forEach((k, i) => {{ if (k.moving !== prev[i]) flip++; prev[i] = k.moving; }}); if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(); }}; requestAnimationFrame(f); }});
              mo.disconnect();
              const onTrack = kids.filter(k => k.ang !== undefined && Math.hypot(k.x - k.tx, k.y - k.ty) < 3).length;
              F.rt4.fakeNow = 0; S.clk.last = 0;
              return {{ sports: !!F.rt4.sports, flip: flip / 3, href: href / 3, onTrack, n: kids.length }}; }})()""")
            print('그래픽', gfx, r)
            c.ok(r['sports'], f'[그래픽 {gfx}] 운동회가 열려요')
            c.ok(r['flip'] <= 2, f"[그래픽 {gfx}] 걷기와 멈춤이 오가지 않아요(초당 {r['flip']})")
            c.ok(r['href'] <= 12, f"[그래픽 {gfx}] 앞뒤 그림을 자꾸 바꾸지 않아요(초당 {r['href']})")
            c.ok(r['onTrack'] >= r['n'] - 2, f"[그래픽 {gfx}] 학생이 트랙 위 자리를 따라 달려요({r['onTrack']}/{r['n']})")
            c.ok(not errs, f'[그래픽 {gfx}] 오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
