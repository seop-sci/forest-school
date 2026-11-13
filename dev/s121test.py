# 121번 시험(4.2.0): 황금 도토리 줄이기와 광고 선물 알림
# 받은 황금 도토리가 60개 전이면 그대로, 뒤면 되풀이해 나오는 곳은 숲의 정수 20. 출석 7일째와 주간 마지막 상자는 황금 그대로. 광고를 보면 '광고 선물' 알림
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
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=3, tg=2, students=40))
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.st.gold=10; const g0=S.gold, e0=S.ess; const a=F.goldOr(2); const b=[S.gold-g0, S.ess-e0];
          S.st.gold=60; const g1=S.gold, e1=S.ess; const c=F.goldOr(2, '(시험)'); return {{a, b, c, d:[S.gold-g1, S.ess-e1], n:F.goldOr(0)}}; }})()""")
        print('goldOr', r)
        ok(r['b'] == [2, 0] and r['a']['t'] == '황금 도토리 +2', '60개 전에는 황금'); ok(r['d'] == [0, 40] and r['c']['t'] == '숲의 정수 +40 (시험)', '60개 뒤에는 정수 20배'); ok(r['n'] is None, '0개는 아무것도')
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.st.gold=100; const out=[];
          for (const n of [0, 6]) {{ S.att.n=n; S.att.last=''; const g0=S.gold, e0=S.ess; F.stampAtt && F.stampAtt(); out.push([S.gold-g0, S.ess-e0]); document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); F.rt.modalOpen=null; F.rt.modalQueue.length=0; }}
          return out; }})()""")
        print('출석', r); ok(r == [[0, 20], [1, 0]], '출석은 7일째만 황금')
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); S.gd={{day:'', n:0, shop:0}}; const g0=S.gold; F.adGold(); await sl(1500);
          const t=[...document.querySelectorAll('.toast, #toast, .tst')].map(e=>e.textContent).join('|'); return [S.gold-g0, t]; }})()""")
        print('광고', r); ok(r[0] == 1 and '광고 선물' in r[1], '광고를 보면 황금 +1과 알림')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
