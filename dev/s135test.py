# 135번 시험(4.3.3): 심화 탐험과 필살기 세 박자
# 1) 상한에 닿기 전에는 심화 단추가 없고, 닿으면 생겨요. 심화를 켜면 1층부터, 무대가 보랏빛(hm)
# 2) 심화 1층 장난꾸러기는 상한 층보다 세요. 심화 층을 이기면 도토리와 황금 도토리는 그대로, 재료와 이번 주 심화 기록이 늘어요
# 3) 심화 순위 문서(hf, hq = 주 × 1,000,000 + hf)
# 4) 대학교만 레벨 값 기준점이 상한보다 36층 아래
# 5) 필살기: 모으기 뒤 컷인, 연출 동안 겨루기가 멈춰요. 한 번 본 뒤 생기는 '연출 건너뛰기'를 켜 두면 컷인 없이 빨리 끝나요
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
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
          document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true}}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
          S.tam.seen=1; S.tam.best=5; F.setTab('tam'); await sl(300);
          const before = !document.querySelector('#tmMode').hidden;
          const cap = F.tamCap(); S.tam.best = cap; F.setTab('school'); F.setTab('tam'); await sl(300);
          const shown = !document.querySelector('#tmMode').hidden;
          document.querySelector('[data-tmm="1"]').click(); await sl(300);
          const on = F.tamHOn(), cur = F.tamCurFl(), hm = document.querySelector('#tmStage').classList.contains('hm'), flTx = document.querySelector('#tmFl').textContent;
          const m1 = F.tamMobs(1, true)[0].hp, mc = F.tamMobs(cap + 1, false)[0].hp;
          const b0 = S.budget, g0 = S.gold, mat0 = S.tam.mat.reduce((a,v)=>a+v,0);
          F.tamWinH(1); F.tamWinH(10);
          const mat1 = S.tam.mat.reduce((a,v)=>a+v,0);
          const doc = F.tamHRankDoc();
          return {{ before, cap, shown, on, cur, hm, flTx, m1, mc, b0, b1: S.budget, g0, g1: S.gold, mat0, mat1, hb: S.tam.hb, hw: S.tam.hw.best, hf: F.tamHf(), doc, week: S.lg.week }}; }})()""")
        print('심화', json.dumps(r, ensure_ascii=False))
        ok(not r['before'] and r['shown'], '상한에 닿아야 심화 단추가 생겨요')
        ok(r['on'] and r['cur'] == 1 and r['hm'] and '심화' in r['flTx'], '심화를 켜면 1층부터, 보랏빛 무대')
        ok(r['m1'] > r['mc'], '심화 1층은 상한 바로 위 층보다 세요')
        ok(r['b1'] == r['b0'] and r['g1'] == r['g0'] and r['mat1'] > r['mat0'], '심화는 도토리와 황금 도토리 없이 재료')
        ok(r['hb'] == 10 and r['hw'] == 10 and r['hf'] == 10, '심화 기록과 이번 주 심화 층')
        ok(r['doc']['hq'] == r['week'] * 1000000 + r['doc']['hf'] and 0 <= r['doc']['hf'] <= 10, '심화 순위 문서 모양')
        # 대학교 기준점
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S, t=S.tier, a=F.tamReach(); S.tier=4; const u=F.tamReach(); S.tier=t; return [a,u]; }})()""")
        ok(r == [24, 36], f'기준점은 대학교만 36층 {r}')
        # 필살기: 일반 탐험으로 돌아가 겨루기까지 기다려요
        await page.evaluate(f"(()=>{{ document.querySelector('[data-tmm=\"0\"]').click(); const S={F}.S; S.tam.best=3; S.tam.auto=0; S.tam.skSeen=0; }})()")
        await page.wait_for_function(f"{F}.rt4.tam && {F}.rt4.tam.ph==='fight'", timeout=15000)
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), T=F.rt4.tam, Fi=T.F;
          Fi.M.forEach(m=>{{m.hp*=50;m.mx*=50;m.atk=0}}); Fi.P.forEach(p=>{{p.g=F.TAM.gauge}});
          const ri = Fi.P[0].ri, tog0 = !document.querySelector('#tmSkOff').hidden;
          document.querySelector('.tm-sk[data-tsk="0"]').click(); await sl(300);
          const busy = F.tamSkBusy(), t0 = Fi.t; await sl(600);
          const cut = !document.querySelector('#tmCut').hidden, t1 = Fi.t;
          let n=0; while (F.tamSkBusy() && n<80) {{ await sl(100); n++; }}
          const took = n*100+900, seen = (S.tam.skSeen>>ri)&1;
          const tog1 = !document.querySelector('#tmSkOff').hidden;
          document.querySelector('#tmSkOff').click(); await sl(50);
          Fi.P.forEach(p=>{{p.g=F.TAM.gauge}});
          document.querySelector('.tm-sk[data-tsk="0"]').click(); await sl(250);
          const cut2 = !document.querySelector('#tmCut').hidden;
          let m=0; while (F.tamSkBusy() && m<80) {{ await sl(100); m++; }}
          return {{ busy, cut, paused: t1===t0, took, seen, tog0, tog1, skOff: S.tam.skOff, cut2, took2: m*100+250 }}; }})()""")
        print('필살기', json.dumps(r))
        ok(r['busy'] and r['cut'] and r['paused'], '모으기 뒤 컷인, 연출 동안 겨루기 멈춤')
        ok(1500 <= r['took'] <= 2800, f"필살기 연출은 2초쯤 {r['took']}")
        ok(not r['tog0'] and r['seen'] == 1 and r['tog1'] and r['skOff'] == 1, "'연출 건너뛰기' 단추는 필살기를 한 번 본 뒤에 생기고 켜 둘 수 있어요")
        ok(not r['cut2'] and r['took2'] < r['took'] - 500, '켜 두면 컷인 없이 빨리 끝나요')
        ok(not errs, f'오류 없음 {errs[:2]}')
        await ctx.close(); await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
