# 1.5.2 시험: 운동장 트랙 색칠 조각이 트랙 아래쪽까지 덮는지, 위쪽 줄 평판 배지
# 쓰는 법: python3 wrap.py && python3 s42test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, dark in ((360, True), (390, False)):
            tag = ('d' if dark else 'l') + str(w)
            ctx = await b.new_context(viewport={'width': w, 'height': 800}, device_scale_factor=2, color_scheme='dark' if dark else 'light')
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(3800)
            await pg.evaluate("document.querySelectorAll('.overlay').forEach(o=>o.hidden=true); const t=document.querySelector('#tut'); if(t) t.hidden=true;")
            # 트랙 조각: 위쪽 절반과 아래쪽 절반에 모두 색칠할 곳이 있어야 해요
            cov = await pg.evaluate("""(async()=>{ const im=new Image(); im.src=window.FS_IMG.roof_field; await im.decode();
              const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0);
              const d=x.getImageData(0,0,c.width,c.height).data, H=c.height, W=c.width; let top=0, bot=0, low=0;
              for(let y=0;y<H;y++) for(let i=0;i<W;i++){ if(d[(y*W+i)*4+3]>128){ if(y<H*0.5) top++; else bot++; if(y>H*0.62) low++; } }
              return [top, bot, low]; })()""")
            if cov[1] < cov[0] * 0.5: fails.append(f'[{tag}] 트랙 아래쪽이 덜 덮여요 {cov}')
            if cov[2] < 500: fails.append(f'[{tag}] 그림 62% 아래 트랙이 비어 있어요 {cov}')
            # 평판 배지: 숫자가 rep()와 같고, 위쪽 줄이 넘치지 않아요
            for tier, rp in ((0, 0), (1, 1)):
                r = await pg.evaluate(f"""(()=>{{ const F={F}; F.S.tier={tier}; F.S.budget=123456789; F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); F.renderHUD();
                  const pill=document.querySelector('#repPill'), pr=pill.getBoundingClientRect(), bt=document.querySelector('.board-top').getBoundingClientRect();
                  const yr=document.querySelector('#yearNow');
                  return [document.querySelector('#vRepTop').textContent, F.rep(), pr.width>0, pr.right<=bt.right+0.5, document.documentElement.scrollWidth<=innerWidth, yr.getClientRects().length]; }})()""")
                if r[0] != await pg.evaluate(f"{F}.S && String(document.querySelector('#vRep').textContent)"): fails.append(f'[{tag}] 평판 배지와 학교 카드 평판이 달라요 {r}')
                if not r[2] or not r[3]: fails.append(f'[{tag}] 평판 배지가 안 보이거나 넘쳐요 {r}')
                if not r[4]: fails.append(f'[{tag}] 화면이 옆으로 넘쳐요')
                if r[5] != 1: fails.append(f'[{tag}] 학년 글자가 두 줄이에요')
            await pg.screenshot(path=f's42_top_{tag}.png', clip={'x': 0, 'y': 0, 'width': w, 'height': 120})
            if errs: fails.append(f'[{tag}] 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else f'FAIL ({len(fails)})')
    sys.exit(1 if fails else 0)

asyncio.run(main())
