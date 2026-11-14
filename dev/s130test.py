# 130번 시험(4.3.1): 탐험 단추 빨간 점과 처음 소개 장면
# 1) 아직 안 연 탐험은 빨간 점  2) 처음 열면 소개 장면(열두 줄)이 뜨고, 끝까지 보면 닫히고 점이 꺼져요
# 3) 보고서가 10분 넘게 쌓이면 다른 탭에서 다시 점  4) 이야기 수첩에서 소개 다시 보기  5) 360px 밝은 화면과 어두운 화면 그림
import asyncio, pathlib
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for scheme in ('light', 'dark'):
            ctx, page, errs = await ctxpage(b, 360, 740, scheme, base(tier=0, tg=0))
            await page.add_init_script("window.__TAM_INTRO = true;")
            await page.evaluate("window.__TAM_INTRO = true")
            await page.wait_for_timeout(1500)
            d0 = await page.evaluate("!document.querySelector('#tamDot').hidden")
            ok(d0, '아직 안 연 탐험은 빨간 점')
            await page.screenshot(path=str(OUT / f's130_dot_{scheme}.png'), clip={'x': 0, 'y': 640, 'width': 360, 'height': 100})
            if scheme == 'dark':
                await ctx.close(); continue
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.setTab('tam'); await sl(400);
              const m=document.querySelector('#mSt'); const open=!m.hidden, head=document.querySelector('#stCh').textContent, step=document.querySelector('#stStep').textContent;
              const dot=!document.querySelector('#tamDot').hidden;
              for (let i=0;i<20 && F.rt4.st;i++) {{ document.querySelector('#stNext').click(); await sl(60); }}
              await sl(400);
              return {{ open, head, step, dot, closed: m.hidden, seen: S.tam.seen, st: !!F.rt4.st, sto: Object.keys(S.sto.seen||{{}}).includes('tam') }}; }})()""")
            print('소개', r)
            ok(r['open'] and r['head'] == '숲속 탐험대' and r['step'] == '1 / 12', '처음 열면 소개 장면 열두 줄')
            ok(not r['dot'], '탐험 화면에서는 점이 꺼져요')
            ok(r['closed'] and r['seen'] == 1 and not r['st'] and not r['sto'], '끝까지 보면 닫히고, 이야기 저장에는 남지 않아요')
            # 다시 열면 소개가 또 뜨지 않아요
            r = await page.evaluate(f"""(async()=>{{ const F={F}, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.setTab('school'); await sl(200); F.setTab('tam'); await sl(400); return {{ st: !!F.rt4.st, open: !document.querySelector('#mSt').hidden }}; }})()""")
            ok(not r['st'] and not r['open'], '두 번째부터는 소개가 뜨지 않아요')
            # 보고서가 쌓이면 다른 탭에서 점
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              F.setTab('school'); S.tam.it = Date.now() - 5*60e3; await sl(2500); const a=!document.querySelector('#tamDot').hidden;
              S.tam.it = Date.now() - 20*60e3; await sl(2500); const b=!document.querySelector('#tamDot').hidden;
              return {{ a, b }}; }})()""")
            print('보고서 점', r)
            ok(not r['a'] and r['b'], '보고서가 10분 넘게 쌓이면 점')
            # 이야기 수첩에서 다시 보기
            r = await page.evaluate(f"""(async()=>{{ const F={F}, sl=ms=>new Promise(r=>setTimeout(r,ms)); const q=document.querySelector('.modal-q, #mTamRep');
              F.openSb(); await sl(300); const btn=document.querySelector('[data-sb="play:tam"]'); if(!btn) return {{ btn: false }};
              btn.click(); await sl(600); const st=F.rt4.st, rep=!!(st && st.replay && st.id==='tam');
              while (F.rt4.st) {{ document.querySelector('#stNext').click(); await sl(40); }}
              return {{ btn: true, rep }}; }})()""")
            print('수첩', r)
            ok(r['btn'] and r.get('rep'), '이야기 수첩에서 소개 다시 보기')
            ok(not errs, f'오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
