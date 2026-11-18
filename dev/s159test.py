# 5.0.3 시험: 탐험 장난꾸러기 공격 자세(작업지시서 92 그림 28장)와 주간 리그 진행 점수 하루 상한, 높은 학교급 학생 부탁 미션 수
# 쓰는 법: python3 wrap.py && python3 s159test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, F
c = Checker()
REG = ['ground', 'garden', 'pond', 'library', 'yard', 'tower', 'lab']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=4, tg=1))
        await pg.wait_for_timeout(1200)
        # 1. 그림 28장이 다 있어요
        miss = await pg.evaluate(f"""()=>{{const F={F}; const R={REG}; const out=[]; for(const r of R){{ for(const i of [1,2,3]) if(!F.IMG('ex3_mob_'+r+'_'+i+'_atk')) out.push(r+i); if(!F.IMG('ex3_boss_'+r+'_atk')) out.push('boss '+r); }} return out;}}""")
        c.ok(not miss, f'공격 그림이 없어요 {miss}')
        # 2. 탐험에서 장난꾸러기가 칠 때 그림이 _atk로 바뀌어요
        r = await pg.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); document.querySelectorAll('.overlay').forEach(o=>o.hidden=true); F.rt4.modalOpen=null;
          S.tam.seen=1; F.setTab('tam'); await sl(300); let seen=false; const A=new Set(); for(const r of ["ground", "garden", "pond", "library", "yard", "tower", "lab"]){{ for(const i of [1,2,3]) A.add(F.IMG('ex3_mob_'+r+'_'+i+'_atk')); A.add(F.IMG('ex3_boss_'+r+'_atk')); }}
          for (let k=0;k<400 && !seen;k++) {{ await sl(100); seen=[...document.querySelectorAll('#panelTam img')].some(im=>A.has(im.src)||A.has(im.getAttribute('src'))); }}
          return seen; }})()""")
        c.ok(r, '장난꾸러기가 칠 때 공격 그림으로 바뀌지 않아요')
        # 3. 리그 진행 점수 하루 30점
        r = await pg.evaluate(f"""()=>{{ const F={F}, S=F.S; F.setTab('school'); const p0=S.lg.pts; for(let i=0;i<20;i++) F.addLeague(3, true); const a=S.lg.pts-p0; F.addLeague(20, true); const b2=S.lg.pts-p0; F.addLeague(10); const c2=S.lg.pts-p0;
          S.lg.dq.day='2000-01-01'; F.addLeague(20, true); const d=S.lg.pts-p0; return {{a,b:b2,c:c2,d, n4:F.MISSIONS.subs.n, w4:F.WMISSIONS?F.WMISSIONS.subs.n:-1}}; }}""")
        print(r)
        c.ok(r['a'] == 30 and r['b'] == 30, f"진행 점수 상한 {r}")
        c.ok(r['c'] == 40, f"미션 같은 점수는 상한 없이 {r}")
        c.ok(r['d'] == 60, f"날이 바뀌면 다시 30점 {r}")
        c.ok(r['n4'] == 1 and r['w4'] in (5, -1), f"대학교 부탁 미션 수 {r}")
        r2 = await pg.evaluate(f"""()=>{{ const F={F}, S=F.S; S.tier=2; const n=F.MISSIONS.subs.n; S.tier=4; return n; }}""")
        c.ok(r2 == 2, f'중학교 부탁 미션 수 {r2}')
        # 4. 옛 저장(dq 없음)도 읽어요
        r3 = await pg.evaluate(f"""()=>{{ const F={F}; const o=JSON.parse(JSON.stringify(F.S)); delete o.lg.dq; const s=F.sanitize(o); return s.lg.dq && s.lg.dq.p===0; }}""")
        c.ok(r3, '옛 저장에서 dq 기본값이 없어요')
        c.ok(not errs, f'오류 {errs[:2]}')
        await ctx.close()
asyncio.run(main())
c.done()
