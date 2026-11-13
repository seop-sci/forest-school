# 126번 시험(4.2.0): 이야기 장면 둘째 그림(작업지시서 71)
# 그림 71장이 img/story에 있고, 장면 가운데 줄부터 둘째 그림으로 바뀌어요(중심 이야기, 곁가지). 그림이 없는 장면은 첫 그림 그대로
import asyncio, pathlib
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    names = [f'st_ch{c:02d}_{k}2' for c in range(1, 25) for k in 'oc'] + [f'st_side_{s}_{i}' for s, n in [('nap', 4), ('honey', 4), ('acorn', 4), ('sloth', 4), ('mole', 4), ('deer', 3)] for i in range(1, n + 1)]
    miss = [n for n in names if not (ROOT / 'img/story' / (n + '.webp')).exists()]
    ok(len(names) == 71 and not miss, f'그림 71장 {miss[:5]}')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=1, tg=1))
        async def run(id):
            return await page.evaluate(f"""(async()=>{{ const F={F}, sl=ms=>new Promise(r=>setTimeout(r,ms)); window.FS_IMG_BASE='../img/';
              const pics=()=>[...document.querySelectorAll('#stPic img')].map(i=>i.src.split('/').pop().split('.')[0] + (i.classList.contains('on') ? '+' : ''));
              F.stPlay('{id}', true); await sl(700); const a=pics(), R=F.rt4.st, mid=R.mid, n=R.lines.length;
              while (F.rt4.st && F.rt4.st.i < mid - 1) F.stNext(); await sl(100); const b=pics();
              if (F.rt4.st && !F.rt4.st.lines[F.rt4.st.i].pick) F.stNext(); await sl(900); const c=pics();
              while (F.rt4.st) {{ const L=F.rt4.st.lines[F.rt4.st.i]; if (L.pick) {{ document.querySelector('[data-stp]').click(); await sl(50); continue; }} F.stNext(); }}
              await sl(300); return {{a, b, c, mid, n}}; }})()""")
        r = await run('o0'); print('1장 여는 장면', r)
        ok(r['a'] == ['st_ch01'] or r['a'] == ['st_ch01_o'], '처음에는 첫 그림') ; ok(r['b'] == r['a'], '가운데 전까지 그대로'); ok(r['c'][-1] == 'st_ch01_o2+', '가운데부터 둘째 그림')
        r = await run('c23'); print('24장 닫는 장면', r); ok(r['c'][-1] == 'st_ch24_c2+', '24장 닫는 장면 둘째 그림')
        r = await run('side:mole:2'); print('곁가지', r); ok(r['a'] == ['st_side_mole'] and r['c'][-1] == 'st_side_mole_3+', '곁가지 3화 둘째 그림')
        r = await page.evaluate(f"(()=>{{ const F={F}; const ok=F.stPlay('recap', true); const h=document.querySelector('#stCh').textContent; while (F.rt4.st) F.stNext(); return [ok, h]; }})()")
        print('지금까지의 이야기', r); ok(r == [True, '지금까지의 이야기'], '요약 장면도 열려요')
        ok(not [e for e in errs if 'story' not in e], f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
