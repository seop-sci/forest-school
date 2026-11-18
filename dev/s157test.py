# 5.0.1.4 시험: 동네 등급을 '이번 학기에 올린 평판'으로. 옛 저장(gr0 없음)은 옛 기준, 종업식 뒤에는 새 기준으로 분교부터 차례로, 새 학교급 첫 학기는 옛 기준, 유치원은 그대로
# 쓰는 법: python3 wrap.py && python3 s157test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        f = {'classroom': 20, 'cafeteria': 20, 'library': 20, 'playground': 20, 'science': 20, 'store': 0, 'dorm': 0, 'union': 0, 'institute': 0, 'gradhall': 0}
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=1, tg=1, sem=0, f=f, students=60, budget=1e30, t={'squirrel': 10, 'owl': 10, 'bear': 10}))
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate("""()=>{const F=window.__forest,S=F.S,o={};
          document.querySelectorAll('.overlay').forEach(x=>{x.hidden=true});F.rt4.modalOpen=null;F.rt4.modalQueue.length=0;
          o.gr0=S.gr0; o.on0=F.termOn(); o.old=[1,2,3,4].map(g=>F.townRep(g)); o.rep=F.rep();
          // 새 학기 시작처럼
          S.gr0=F.rep(); S.grade=0; F.checkGrade(); o.g1=S.grade; o.th=[1,2,3,4].map(g=>F.townRep(g)-S.gr0); o.d=F.termRep();
          const steps=[]; for(let i=0;i<12&&S.grade<4;i++){ S.t.squirrel+=1; F.checkGrade(); steps.push(S.grade); } o.steps=steps;
          S.sem=1; o.d2=F.termRep(); o.th2=[1,2,3,4].map(g=>F.townRep(g)-S.gr0);
          // 저장 왕복
          const j=JSON.parse(JSON.stringify(S)); o.san=F.sanitize(j).gr0; delete j.gr0; o.sanOld=F.sanitize(j).gr0; j.gr0='x'; o.sanBad=F.sanitize(j).gr0;
          // 유치원은 옛 기준
          S.tier=0; S.tg=1; S.sem=0; o.kin=F.termOn(); o.kinTh=F.townRep(4);
          return o;}""")
        print(r)
        c.ok(r['gr0'] == -1 and not r['on0'] and r['old'][3] > 150, f"옛 저장은 옛 기준이어야 해요 {r['gr0']} {r['old']}")
        c.ok(r['g1'] == 0 and r['d'] == 16 and r['th'] == [4, 8, 12, 16], f"1학기 기준 {r['th']} 폭 {r['d']} 시작 등급 {r['g1']}")
        c.ok(r['steps'][:8] == [0, 1, 1, 2, 2, 3, 3, 4], f"등급을 차례로 거쳐야 해요 {r['steps']}")
        c.ok(r['d2'] == 12 and r['th2'] == [3, 6, 9, 12], f"2학기 기준 {r['th2']}")
        c.ok(r['san'] >= 0 and r['sanOld'] == -1 and r['sanBad'] == -1, f"저장 {r['san']} {r['sanOld']} {r['sanBad']}")
        c.ok(not r['kin'] and r['kinTh'] == 156, f"유치원 {r['kin']} {r['kinTh']}")
        c.ok(not errs, f'오류 {errs[:2]}')
        await ctx.close()
asyncio.run(main())
c.done()
