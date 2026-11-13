# 125번 시험(4.2.0): 미션을 누르면 그 일을 하는 곳으로 가요 (지섭 요청)
# 오늘의 미션, 이번 주 미션, 패스 미션, 이벤트 미션 줄에 '가기', 누르면 탭이나 창이 바뀌고 오류가 없어요. 받기나 끝난 미션에는 없어요
import asyncio
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); const RT=window.__forest.rt4; RT.modalOpen=null; RT.modalQueue.length=0; document.querySelectorAll('.pz').forEach(o=>o.hidden=true);"
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        fac = dict(classroom=14, cafeteria=12, library=11, playground=8, science=6, store=5, dorm=3)
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=3, tg=1, f=fac))
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.setTab('quests'); F.renderMissions();
          const q=document.querySelector('#qDaily'); const go=[...q.querySelectorAll('[data-mgo]')].map(e=>e.dataset.mgo);
          const all=q.querySelectorAll('.dm .dm-tx').length; return {{go, all, over:[...q.querySelectorAll('.dm')].some(d=>d.scrollWidth>d.clientWidth+1)}}; }})()""")
        print('퀘스트 탭', r); ok(len(r['go']) >= 5 and not r['over'], '오늘과 이번 주 미션 줄에 가기, 360px에서 넘치지 않음')
        await page.wait_for_timeout(300); await page.screenshot(path='s125_quests.png')
        ids = await page.evaluate(f"Object.keys({F}.MGO).concat(Object.keys({F}.MGO_MINI), Object.keys({F}.MGO_Q))")
        res = {}
        for i in ids:
            await page.evaluate(CLEAN + f" {F}.setTab('school');")
            await page.wait_for_timeout(50)
            r = await page.evaluate(f"""(async()=>{{ const F={F}; const t0=document.querySelector('.tab[aria-selected=true]')?.dataset.tab; const ok=F.missionGo('{i}'); await new Promise(r=>setTimeout(r,250));
              const tab=document.querySelector('.tab[aria-selected=true]')?.dataset.tab, modal=F.rt4.modalOpen ? F.rt4.modalOpen.id : '', scene=[...document.querySelectorAll('.pz')].filter(o=>!o.hidden).map(o=>o.id).join();
              return [ok, tab, modal, scene]; }})()""")
            res[i] = r
        print('가기', res)
        ok(all(v[0] for v in res.values()), '모든 미션이 갈 곳이 있음')
        ok(res['merge'][3] == 'mgScene' and res['pz'][3] == 'pzScene', '퍼즐과 합치기는 바로 열림')
        ok(res['dm'][1] == 'quests' and res['subs'][1] == 'quests', '오늘의 미션과 학생 부탁은 퀘스트 탭')
        ok(res['lab'][2] or res['lab'][1] != 'school', '과학 실험은 실험 창이나 과학실')
        await page.evaluate(CLEAN)
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.setTab('quests'); S.dm.list[0].done=true; document.querySelector('#qDaily').dataset.key=''; F.renderMissions();
          return document.querySelector('#qDaily .dm.done .dm-tx[data-mgo]') ? 1 : 0; }})()""")
        ok(r == 0, '끝난 미션에는 가기가 없음')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
