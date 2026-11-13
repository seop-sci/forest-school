# 122번 시험(4.2.0): 연구 투자 (학과 사무실)
# 값은 열린 때의 수업료로 정해지고 수업료가 올라도 그대로, 올리면 그때 수업료로 다음 값. 효과: 공부 경험치 +2%, 공사 시간 -0.5%, 받는 정수 +1%(상한). 옛 저장, 360px 창
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
        fac = dict(classroom=14, cafeteria=12, library=11, playground=8, science=6)
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=4, tg=2, f=fac, students=40))
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.f.union=1; const r0=F.rate(); const c0=F.rxCost('build');
          const r1=F.rate(); S.rx.c.build=c0+777; const c1=F.rxCost('build')-777; S.rx.c.build=c0;
          S.budget=c0*10; const a=F.rxUp('build'); const c2=F.rxCost('build');
          return {{r0, r1, c0, c1, a, lv:S.rx.lv.build, c2, want:Math.round(r1*7200*1.25), pct:F.rxPct('build')}}; }})()""")
        print('값', r)
        ok(r['c0'] == r['c1'], '정해 둔 값은 다시 셈하지 않고 그대로(저장에 남아요)'); ok(r['a'] and r['lv'] == 1 and r['pct'] == 0.5, '올리면 레벨 1, 공사 -0.5%')
        ok(abs(r['c2'] - r['want']) / r['want'] < 0.06, '다음 값은 그때 수업료로(1.25배)')
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.rx.lv={{study:10, build:100, ess:50}}; const e0=S.ess; F.addEss(100); const e=S.ess-e0;
          const before=S.ac.st.xp; const g=F.acGain('math', 100); return [F.rxPct('study'), F.rxPct('build'), F.rxPct('ess'), e, g, S.ac.st.xp-before]; }})()""")
        print('효과', r); ok(r[:3] == [20, 30, 30] and r[3] == 130 and r[4] == 120 and r[5] == 120, '효과와 상한')
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.rx.lv={{study:1}}; F.openDept(); const m=document.querySelector('#mDept .modal');
          return [document.querySelectorAll('#dpBody [data-dp^="rx:"]').length, m.scrollWidth>m.clientWidth+1, document.querySelector('#dpBody').textContent.includes('연구 투자')]; }})()""")
        print('창', r); ok(r == [3, False, True], '학과 사무실에 연구 세 줄, 360px에서 넘치지 않음')
        await page.wait_for_timeout(400); await page.screenshot(path='s122_dept.png')
        r = await page.evaluate(f"""(()=>{{ const F={F}; return [F.sanitize ? 1 : 0]; }})()""")
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
