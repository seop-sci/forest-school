# s149: 창을 닫기만 하는 단추와 바깥 누르기(data-cm) 57곳이 저마다 제 창을 닫는지 봐요 (5.0.2 개발 기반 정리에서 리스너 하나로 묶었어요)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, CLEAN, Checker

async def main():
    c = Checker()
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base())
        r = await pg.evaluate("""() => { const out = [];
          for (const el of document.querySelectorAll('[data-cm]')) {
            %s;
            const m = document.getElementById(el.dataset.cm); if (!m) { out.push([el.id || el.className, el.dataset.cm, '창이 없어요']); continue; }
            m.hidden = false; m.classList.add('open'); window.__forest.rt.modalOpen = m;
            el.click();
            if (m.classList.contains('open') || window.__forest.rt.modalOpen === m) out.push([el.id || el.className, el.dataset.cm, '안 닫혀요']);
          }
          return { n: document.querySelectorAll('[data-cm]').length, tap: document.querySelectorAll('[data-cm][data-cm-tap]').length, out }; }""" % CLEAN)
        print(r)
        c.ok(r['n'] >= 57, f"data-cm 요소 57개 넘게 (지금 {r['n']})")
        c.ok(not r['out'], f"모두 닫혀요 {r['out'][:5]}")
        c.ok(not errs, f'오류 없음 {errs[:3]}')
        await b.close()
    c.done()
asyncio.run(main())
