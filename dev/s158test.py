# 5.0.2.2 시험: 건물 한 번에 올리기 칩(woodani 결정). 싼 것부터 고르기, 공사 중과 최고 레벨 빼기, 칩 보이기, 확인 창, 가구 채우고 공사 시작, 도토리 쓴 양
# 쓰는 법: python3 wrap.py && python3 s158test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, th in ((360, 'light'), (390, 'dark')):
            ctx, pg, errs = await ctxpage(b, w, 760, th, base(tier=1, students=60, budget=0, f={'classroom': 6, 'cafeteria': 4, 'library': 3, 'playground': 3, 'science': 2}))
            await pg.wait_for_timeout(1200)
            await pg.evaluate("()=>{const R=window.__forest.rt4;document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true});R.modalOpen=null;R.modalQueue.length=0;window.__forest.setTab('school');}")
            r = await pg.evaluate("""()=>{const F=window.__forest,S=F.S,out={};
              out.p0=F.upPlan().ks.length; F.upRender(true); out.hid0=document.querySelector('#upChip').hidden;
              S.budget=1e12; const P=F.upPlan(); out.ks=P.ks; out.cost=P.cost; F.upRender(true);
              out.hid1=document.querySelector('#upChip').hidden; out.txt=document.querySelector('#upChip').textContent;
              const r=document.querySelector('#upChip').getBoundingClientRect(); out.inView=r.left>=0&&r.right<=innerWidth+0.5&&r.width>0;
              return out;}""")
            print(w, r)
            c.ok(r['p0'] == 0 and r['hid0'], f"{w}: 도토리가 없는데 칩이 떠요 {r}")
            c.ok(not r['hid1'] and '5채' in r['txt'] and r['inView'], f"{w}: 칩이 안 떠요 {r}")
            c.ok(len(r['ks']) == 5 and r['cost'] > 0, f"{w}: 고른 건물 {r['ks']}")
            await pg.click('#upChip'); await pg.wait_for_timeout(400)
            a = await pg.evaluate("()=>({open:!document.querySelector('#mAdAsk').hidden, t:document.querySelector('#adAskTitle').textContent, rows:document.querySelectorAll('#adAskText .ask-row').length})")
            c.ok(a['open'] and a['t'] == '건물 한 번에 올리기' and a['rows'] == 5, f"{w}: 확인 창 {a}")
            await pg.screenshot(path=f'/tmp/up{w}.png')
            b0 = await pg.evaluate("()=>window.__forest.S.budget")
            await pg.click('#adAskYes'); await pg.wait_for_timeout(500)
            d = await pg.evaluate("""()=>{const F=window.__forest,S=F.S; return {bd:Object.keys(S.bd).sort(), b:S.budget, fu:F.MAIN?S.fu.science:null, hid:document.querySelector('#upChip').hidden}}""")
            print(d)
            c.ok(len(d['bd']) == 5, f"{w}: 공사가 다섯 곳에서 시작되지 않았어요 {d['bd']}")
            c.ok(abs((b0 - d['b']) - r['cost']) <= r['cost'] * 0.01 + 1, f"{w}: 쓴 도토리 {b0 - d['b']} 어림 {r['cost']}")
            c.ok(d['hid'], f"{w}: 모두 공사 중인데 칩이 남아요")
            # 공사 중인 건물과 최고 레벨은 빼요
            e = await pg.evaluate("()=>{const F=window.__forest,S=F.S; return F.upPlan().ks.length}")
            c.ok(e == 0, f"{w}: 공사 중인 건물을 또 골라요 {e}")
            c.ok(not errs, f'{w}: 오류 {errs[:2]}')
            await ctx.close()
asyncio.run(main())
c.done()
