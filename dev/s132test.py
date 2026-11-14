# 132번 시험(4.3.1): 탐험 학년 상한과 기준 수업료로 정하는 대원 레벨 값, 탐험 화면 실시간 빨간 점
# 1) 상한: 유치원 10, 20층 / 초등 25층부터 학기마다 +5 / 중 90 / 고 150 / 대 215층부터 +15, 대학교 4학년 2학기는 끝없이
# 2) 상한에 닿으면 멈추고(cap), 학기가 오르면 다시 걸어요. 2배속 시간은 멈춘 동안 줄지 않아요
# 3) 레벨 값은 부스터와 소풍과 상관없이 같고, 학년이 오르면 지난 레벨이 싸져요. 모두 유한해요
# 4) 정수로 도토리 바꾸기는 수업료 부스터를 켜도 두 배가 되지 않아요  5) 탐험 화면에서 재료를 얻으면 장비 칸 점이 바로 떠요
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=0, tg=0))
        await page.wait_for_timeout(1000)
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S, out=[]; const t0=S.tier, g0=S.tg, s0=S.sem;
          for (const [t,g,sm] of [[0,0,0],[0,1,0],[1,0,0],[1,0,1],[1,5,1],[2,0,0],[2,2,1],[3,0,0],[3,2,1],[4,0,0],[4,3,0],[4,3,1]]) {{ S.tier=t; S.tg=g; S.sem=sm; out.push([t,g,sm,F.tamCap()===Infinity?-1:F.tamCap(),F.tamLvRef()]); }}
          S.tier=t0; S.tg=g0; S.sem=s0; return out; }})()""")
        print('상한', r)
        caps = [x[3] for x in r]
        ok(caps == [10, 20, 25, 30, 80, 90, 140, 150, 200, 215, 305, -1], f'학년 상한 {caps}')
        ok(all(r[i][4] <= r[i + 1][4] for i in range(len(r) - 2)), '기준 레벨은 학년이 오를수록 커져요')
        # 상한에서 멈추고 다시 걷기
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); S.tam.seen=1; F.setTab('tam'); await sl(300);
          S.tam.best = 10; const T=F.rt4.tam; F.tamPh(T,'walk'); const ph1=T.ph; S.tam.spd.sec = 600; await sl(1500); const spd=S.tam.spd.sec, txt=document.querySelector('#tmBest').textContent;
          S.tg = 1; await sl(400); const ph2=T.ph; return {{ ph1, spd, txt, ph2 }}; }})()""")
        print('멈춤', r)
        ok(r['ph1'] == 'cap' and r['spd'] == 600, '상한에서 멈추고 2배속 시간은 그대로')
        ok('학년이 오르면' in r['txt'], '위에 상한 안내')
        ok(r['ph2'] != 'cap', '다음 해가 되면 다시 걸어요')
        # 레벨 값
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S, sp=S.tam.party[0]; S.tam.mem[sp]=Object.assign(S.tam.mem[sp]||{{}},{{lv:30,st:1,sh:0}});
          const a=F.tamLvCost(sp); S.hd.feastUntil=Date.now()+3600e3; const b=F.tamLvCost(sp), ax1=F.esAxGain(); S.hd.feastUntil=0; const ax0=F.esAxGain();
          S.students = 3; const c=F.tamLvCost(sp);
          const t0=S.tier, g0=S.tg; S.tier=1; S.tg=3; const d=F.tamLvCost(sp); S.tier=2; S.tg=0; const e=F.tamLvCost(sp), rate=F.tamBaseRate(); S.tier=t0; S.tg=g0;
          S.tam.mem[sp].lv=1e5; const big=F.tamLvCost(sp); return {{ a, b, c, d, e, ax0, ax1, big, rate }}; }})()""")
        print('레벨 값', r)
        ok(r['a'] == r['b'] == r['c'], '부스터와 학생 수와 상관없이 같은 값')
        ok(abs(r['ax1'] - r['ax0']) <= r['ax0'] * 0.01, '정수로 도토리는 부스터를 켜도 두 배가 아니에요')
        ok(all(0 < r[k] < 1e300 for k in ('a', 'd', 'e', 'big')), '값이 모두 유한해요')
        # 실시간 점
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); S.tam.best=3; S.tam.mat=[0,0,0,0]; F.rt4.tamSeg='mat'; F.setTab('school'); F.setTab('tam'); await sl(300);
          const a=!!document.querySelector('#tmSeg [data-tseg=gear] .tm-dot'); S.tam.mat=[999,999,999,99]; F.tamWin(4); await sl(100);
          const b=!!document.querySelector('#tmSeg [data-tseg=gear] .tm-dot'); return {{ a, b }}; }})()""")
        print('점', r)
        ok(not r['a'] and r['b'], '탐험 화면에서 재료를 얻으면 장비 칸 점이 바로 떠요')
        ok(not errs, f'오류 없음 {errs[:3]}')
        await ctx.close(); await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
