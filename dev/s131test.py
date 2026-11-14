# 131번 시험(4.3.1): 정수 상점 고침과 숲의 정수로 도토리 바꾸기, 위 칸 학교급 글
# 1) 정수 상점에서 문제집을 사면 '오늘 n권 남았어요'가 바로 줄어요
# 2) 숲의 정수 20개로 도토리(수업료 30분치, 제안), 하루 5번, 수료증 셈(올해 번 도토리)은 그대로, 정수가 모자라면 바뀌지 않아요
# 3) 옛 저장(es.ax 없음)도 받아요  4) 위 칸 글에 '대도시예요!'가 없어요  5) 360px 밝은 화면과 어두운 화면 그림
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
            sv = base(tier=1, tg=0); sv['ess'] = 300; sv['es'] = {'day': '', 'n': 0, 'week': -1, 'g': 0, 'x': 0, 't': 0, 'bf': 0, 'ba': 0}
            ctx, page, errs = await ctxpage(b, 360, 740, scheme, sv)
            await page.wait_for_timeout(1200)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true}}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
              const ax0 = S.es.ax; F.setTab('ess'); await sl(300);
              const txt = () => document.querySelector('#essList').innerText;
              const a = /국어 문제집[\\s\\S]*?오늘 2권 남았어요/.test(txt()); F.acBuyBook('kor'); await sl(200); const b = /국어 문제집[\\s\\S]*?오늘 1권 남았어요/.test(txt());
              return {{ ax0, a, b, top: document.querySelector('#gradeBar') ? (document.querySelector('#barTxt')||{{}}).textContent : '' }}; }})()""")
            print('문제집', r)
            ok(r['ax0'] == 0, '옛 저장도 es.ax 0'); ok(r['a'] and r['b'], '정수 상점에서 문제집을 사면 남은 권수가 바로 줄어요')
            await page.evaluate("document.querySelector('[data-ebuy=\"ax\"]').scrollIntoView({block:'center'})")
            await page.screenshot(path=str(OUT / f's131_ess_{scheme}.png'))
            if scheme == 'dark':
                ok(not errs, f'오류 없음 {errs[:3]}'); await ctx.close(); continue
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); const out=[];
              const g=F.esAxGain(), y0=S.yearEarned;
              for (let i=0;i<6;i++) {{ const e0=S.ess, b0=S.budget; F.pickEss('ax'); await sl(50); const ask=!document.querySelector('#essAsk').hidden; F.buyEss(); await sl(50); out.push([ask, e0-S.ess, Math.round(S.budget-b0)]); }}
              const left=F.esAxLeft(); S.es.ax=0; S.ess=5; const b1=S.budget; F.pickEss('ax'); F.buyEss(); const poor=[S.ess, S.budget-b1];
              return {{ g, out, left, y: S.yearEarned-y0, poor, rate: F.ESHOP.ax }}; }})()""")
            print('바꾸기', r)
            g = r['g']
            ok(all(o[0] and o[1] == 20 and abs(o[2] - g) < g * 0.001 for o in r['out'][:5]) and r['out'][5][1] == 0 and r['out'][5][2] < g * 0.001, '정수 20개로 도토리, 하루 5번(수업료가 그사이 조금 들어와요)')
            ok(r['left'] == 0 and r['y'] < g, '다 바꾸면 0번 남고, 바꾼 도토리는 올해 번 도토리에 들지 않아요')
            ok(r['poor'] == [5, 0], '정수가 모자라면 바뀌지 않아요')
            ok(10 <= g < 1e15, '받는 도토리가 유한하고 알맞아요')
            # 위 칸 글
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S; F.setTab('school'); await new Promise(r=>setTimeout(r,300)); S.rep = 1e9; F.renderHUD(); return [...document.querySelectorAll('.app *')].map(e=>e.childNodes.length===1&&e.firstChild.nodeType===3?e.textContent:'').filter(t=>/퀘스트 \\d+개|열 수 있어요|대도시예요/.test(t)); }})()""")
            print('위 칸', r)
            ok(r and not any('대도시예요' in t for t in r), "위 칸에 '대도시예요!'가 없어요")
            ok(not errs, f'오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
