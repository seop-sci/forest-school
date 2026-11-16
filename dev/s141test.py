# 5.0.0 시험: 대학교 학위수여식 뒤 대학원(석사 1학기)으로 가면 캠퍼스, 건물, 도토리, 명부를 그대로 이어 가고 연구 구역이 열려요
# 연구소와 연구동 값은 대학교 최대 레벨쯤부터, 연구 트리는 정수와 도토리를 쓰고 시간이 지나면 칸이 채워져요
# 쓰는 법: python3 wrap.py && python3 s141test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage
bad = []
def ok(c, m):
    if not c: bad.append(m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in (360, 390):
            sv = base(tier=4, students=90)
            sv['f'] = {'classroom': 35, 'cafeteria': 35, 'library': 35, 'playground': 35, 'science': 35, 'store': 35, 'dorm': 35, 'union': 35}
            ctx, pg, errs = await ctxpage(b, w, 800, 'light', sv)
            await pg.wait_for_timeout(1200)
            r = await pg.evaluate("""(async()=>{const F=window.__forest,S=F.S,sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
              S.tg=3; S.sem=1; S.grade=4; S.q.m=F.MAIN.findIndex(q=>q.id==='un42'); S.budget=1e30; S.ess=1000;
              const before={f:JSON.stringify(S.f), b:S.budget, roster:(S.roster||[]).length, perk:JSON.stringify(S.p.perk)};
              const can=F.canPromote(); F.promote(); await sl(400);
              document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
              const f2=Object.assign({}, S.f); delete f2.institute; delete f2.gradhall; const f1=JSON.parse(before.f); delete f1.institute; delete f1.gradhall;
              const out={can, tier:S.tier, keepF:JSON.stringify(f1)===JSON.stringify(f2), keepB:S.budget>=before.b*0.99, roster:(S.roster||[]).length===before.roster, perk:JSON.stringify(S.p.perk)===before.perk,
                year:document.querySelector('#yearNow').textContent, q:F.MAIN[S.q.m]&&F.MAIN[S.q.m].id, cap:F.facCap()};
              // 연구 구역과 연구소 값
              F.setZone('lab'); await sl(600); out.zone=S.zone; out.instCost=F.facCost('institute'); out.unionCost35=0;
              S.f.institute=1; out.rtOpen=!!document; const e0=S.ess; out.rtStart=F.rtStart('class'); out.ess=e0-S.ess;
              S.rt5.cur.end=Date.now()-1; await sl(1600); out.rtLv=F.rtLv('class');
              return out;})()""")
            print(w, r)
            ok(r['can'], '대학교 4학년 2학기에 학위수여식을 열 수 없어요')
            ok(r['tier'] == 5 and r['keepF'] and r['keepB'] and r['roster'] and r['perk'], f'대학원으로 이어 가지 않았어요: {r}')
            ok(r['year'] == '석사 1학기', f'학기 글: {r["year"]}')
            ok(r['q'] in ('un42', 'gr1'), f'메인 퀘스트: {r["q"]}')   # 학위수여식 보상을 먼저 받고 입학식(gr1)
            ok(r['cap'] == 40, f'대학원 상한: {r["cap"]}')
            ok(r['zone'] == 'lab', '연구 구역에 들어가지 못해요')
            ok(r['instCost'] > 0 and r['instCost'] < float('inf'), f'연구소 값: {r["instCost"]}')
            ok(r['rtStart'] and r['ess'] == 50 and r['rtLv'] == 1, f'연구 트리: {r}')
            ok(not errs, f'오류 {errs[:2]}')
            await ctx.close()
        # 대학교에서는 연구 구역이 잠겨 있어요
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=4))
        await pg.wait_for_timeout(1000)
        z = await pg.evaluate("(async()=>{const F=window.__forest; F.setZone('lab'); await new Promise(r=>setTimeout(r,400)); return F.S.zone;})()")
        ok(z != 'lab', '대학교에서 연구 구역에 들어가져요')
        await ctx.close()
    print('\n'.join(bad) if bad else 'PASS')
asyncio.run(main())
