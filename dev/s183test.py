# 183번 시험(5.3.3.1): 홈의 시간 흐름 단추(밤 화면 단추와 합침, 모든 학교급, 언제나)
# 1) 처음에는 '시간 따라'(S.nl 0). 단추를 누르면 0 → 1(밤은 조금 어둡게) → 2(늘 낮) → 0
# 2) 밤(KST 22시)과 노을(17시 30분)에 켜 두면 마을 빛 막이 ph-night, ph-evening, 끄면 늘 ph-day
# 3) 고등학교부터 밤: 늘 낮이면 밝게 보기(nl-light), 단추는 그대로 보여요. 학생이 기숙사에 가는 규칙(hs-night)은 그대로
# 4) 유치원, 초등, 중학, 고등, 대학교 모두에서 같은 결과, 오류 없음, 저장 다시 읽기 뒤에도 꺼져 있어요
import asyncio, pathlib
from playwright.async_api import async_playwright
from testlib import ctxpage, base, F
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
NB_OFF = "(()=>{ window.__forest.Live.off.add('night'); const m = document.querySelector('#mNb'); if (m && m.classList.contains('open')) { m.hidden = true; m.classList.remove('open'); window.__forest.rt.modalOpen = null; } })()"
CLOSE = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt4.modalOpen=null; window.__forest.rt4.modalQueue.length=0;"
NIGHT = "Date.parse('2026-11-23T13:00:00Z')"    # KST 22시
EVE = "Date.parse('2026-11-23T08:30:00Z')"      # KST 17시 30분(11월은 18시부터 밤)
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tier, (w, h, scheme) in ((0, (390, 844, 'light')), (1, (360, 740, 'dark')), (2, (390, 844, 'light')), (3, (390, 844, 'light')), (4, (360, 740, 'dark'))):
            sv = base(tier=tier, tg=0); sv['gfx'] = 1
            ctx, page, errs = await ctxpage(b, w, h, scheme, sv)
            await page.wait_for_timeout(1200); await page.evaluate(NB_OFF); await page.evaluate(CLOSE)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), out={{}};
              const at = t => {{ S.clk.last = 0; F.rt.fakeNow = t; }};   // 게임 시계는 뒤로 가지 않아서 시각을 바꿀 때 마지막 시각을 비워요
              const look = async () => {{ await sl(300); F.renderNight(true); F.wldSync(); F.renderTierDots && F.renderTierDots(); const t=document.querySelector('.wld-tint'), m=document.querySelector('#map'), d=document.querySelector('#tierDots');
                return {{ ph: t ? (t.className.match(/ph-(\\w+)/) || [, ''])[1] : null, hs: m.classList.contains('hs-night'), light: m.classList.contains('nl-light'), nl: !!(d && !d.hidden && d.querySelector('[data-nl]')) }}; }};
              F.setTab('school'); await sl(200); F.renderTierDots(); const btn = () => document.querySelector('#tierDots [data-nl]');
              out.def = [!!btn() && !document.querySelector('#tierDots').hidden, S.nl || 0];
              at({NIGHT}); out.onN = await look(); at({EVE}); out.onE = await look();
              const seq = []; for (let i = 0; i < 3; i++) {{ btn().click(); await sl(120); seq.push(S.nl); }} btn().click(); await sl(120); btn().click(); await sl(120); out.sw = [seq, S.nl];
              at({NIGHT}); out.offN = await look(); at({EVE}); out.offE = await look(); at({NIGHT}); await look();
              return out; }})()""")
            print('학교급', tier, r)
            ok(r['def'] == [True, 0], f'[{tier}] 홈에 시간 흐름 단추가 있고 처음에는 시간 따라')
            ok(r['onN']['ph'] == 'night' and r['onE']['ph'] == 'evening', f'[{tier}] 켜 두면 밤과 노을 빛')
            ok(r['sw'] == [[1, 2, 0], 2], f'[{tier}] 누를 때마다 시간 따라, 밤은 조금 어둡게, 늘 낮')
            ok(r['offN']['ph'] == 'day' and r['offE']['ph'] == 'day', f'[{tier}] 끄면 밤과 노을에도 낮')
            ok(r['offN']['nl'] and r['onE']['nl'], f'[{tier}] 단추는 낮이든 밤이든 늘 보여요')
            if r['onN']['hs']:
                ok(r['offN']['hs'] and r['offN']['light'], f'[{tier}] 고등학교부터 밤: 기숙사 규칙(hs-night)은 그대로, 화면은 밝게')
            await page.screenshot(path=str(OUT / f's183_t{tier}_off_{scheme}.png'))
            r = await page.evaluate(f"(()=>{{ const F={F}; F.save && F.save(); const d = F.sanitize(JSON.parse(localStorage.getItem('forest-school-v1'))); F.rt.fakeNow = 0; F.S.clk.last = 0; return d.nl; }})()")
            ok(r == 2, f'[{tier}] 저장 다시 읽기 뒤에도 늘 낮')
            ok(not errs, f'[{tier}] 오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
