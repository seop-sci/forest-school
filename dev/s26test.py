import asyncio, json, subprocess, time
from playwright.async_api import async_playwright
import s7test as T
from s7test import device, api, dump, HERE, PORT
# 1.5.6: 숨은 퀘스트 탭 대신 홈 지도 오른쪽의 퀘스트 단추로 열어요 (1.6.0 브랜치처럼 숨은 탭이 없어도 돌아요)
def side(tab, label):
    return f"""(()=>{{ const F=window.__forest; if (F && F.setTab) F.setTab('school');
  const b=document.querySelector('[aria-label="{label}"]')||document.querySelector('.map-right [data-tab={tab}]')||document.querySelector('.tab[data-tab={tab}]');
  if (b) {{ b.click(); return 'btn'; }} F.setTab('{tab}'); return 'set'; }})()"""
OPEN_Q = side('quests', '퀘스트 전체 보기')
OPEN_RANK = side('rank', '랭킹')
async def main():
    srv = subprocess.Popen(['node', str(HERE/'fbtest'/'fbserver.js'), str(HERE/'gh'), str(PORT), str(HERE/'gh_database.rules.json')], stdout=subprocess.PIPE)
    time.sleep(1); out = {}
    try:
        api('/__seed', {'reset': True, 'path': 'forest/rank/other1', 'value': {'name': '졸린 다람쥐', 'score': 50, 'at': 1, 'tier': 1, 'year': 2, 'ws': 0, 'lp': 0, 'week': 0}})
        async with async_playwright() as p:
            b = await p.chromium.launch()
            sv = T.base(gold=10, q=T.Q('q16', 16), rank={'name': '용감한 수달', 'joined': True, 'sent': -1, 'by': '', 'asked': True})
            ctx, pg, errs, _ = await device(b, seed=sv)
            await pg.wait_for_timeout(2500)
            await pg.evaluate("document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')})")
            await pg.evaluate(OPEN_Q); await pg.wait_for_timeout(500)
            r = {'missions': await pg.evaluate("document.querySelector('#qDaily').innerText.replace(/\\n+/g,' | ')")}
            await pg.screenshot(path='s26_missions.png')
            # 미션 하나 채우기: 도토리 줍기/시설 고치기 같은 카운터를 직접 올려요
            await pg.evaluate("""(()=>{const s=JSON.parse(localStorage.getItem('forest-school-v1'));})()""")
            r['dots'] = await pg.evaluate("!document.querySelector('#qDot').hidden")
            r['errors'] = errs; await ctx.close()
            # 시험 손잡이로 진행
            ctx = await b.new_context(viewport={'width': 390, 'height': 844})
            await ctx.add_init_script("window.__FOREST_TEST = true; if(!sessionStorage.getItem('s')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('s','1')}" % json.dumps(json.dumps(sv)))
            await ctx.route('https://www.gstatic.com/firebasejs/**', lambda route: route.fulfill(status=200, content_type='text/javascript', body=T.MOCK if route.request.url.endswith('firebase-app-compat.js') else '/* mock */'))
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(T.ORIGIN + '/'); await pg.wait_for_timeout(2500)
            await pg.evaluate("document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0")
            await pg.evaluate(OPEN_Q); await pg.wait_for_timeout(300)
            await pg.evaluate("(()=>{const S=window.__forest.S; S.st.picks+=99; S.st.shakes+=99; S.st.ups+=99; S.st.trains+=99; S.st.ads+=99; S.q.subDone+=99; S.st.trips+=9; S.st.sports+=9;})()"); await pg.wait_for_timeout(500)
            for i in range(3):
                await pg.evaluate("document.querySelector('[data-dm]') && document.querySelector('[data-dm]').click()"); await pg.wait_for_timeout(250)
            await pg.evaluate("document.querySelector('[data-dm=bonus]') && document.querySelector('[data-dm=bonus]').click()"); await pg.wait_for_timeout(400)
            r['after'] = await pg.evaluate("[document.querySelector('#qDaily').innerText.replace(/\\n+/g,' | '), window.__forest.S.gold, window.__forest.S.lg.pts]")
            await pg.screenshot(path='s26_missions_done.png')
            await pg.evaluate(OPEN_RANK); await pg.wait_for_timeout(3500)
            r['rank'] = await pg.evaluate("[document.querySelector('#rankScoreLab').textContent, document.querySelector('#rankScore').textContent, document.querySelector('#rankPos').textContent, document.querySelector('#rankList').innerText.replace(/\\n+/g,' | ')]")
            await pg.screenshot(path='s26_league.png')
            await pg.evaluate("document.querySelector('[data-rv=all]').click()"); await pg.wait_for_timeout(500)
            r['all'] = await pg.evaluate("[document.querySelector('#rankScoreLab').textContent, document.querySelector('#rankList').innerText.replace(/\\n+/g,' | ')]")
            d = dump()['forest']['rank']
            r['server'] = {k: [v.get('name'), v.get('lp'), v.get('week'), v.get('ws')] for k, v in d.items()}
            r['errors2'] = errs; await b.close()
    finally:
        srv.kill()
    print(json.dumps(out | r, ensure_ascii=False, indent=1))
    # 4.3.1: PASS 줄. 미션을 받으면 리그 점수가 오르고, 리그와 전체 순위가 보이고, 서버에 이번 주 점수가 올라가고, 오류가 없어야 해요
    a = out | r; bad = []
    if a.get('errors') or a.get('errors2'): bad.append(f"오류 {(a.get('errors') or a.get('errors2'))[:2]}")
    if not (a.get('after') and a['after'][2] > 0): bad.append(f"리그 점수가 오르지 않았어요 {a.get('after')}")
    if not (a.get('rank') and a['rank'][3] and a.get('all') and a['all'][1]): bad.append('순위표가 비었어요')
    if not any(v[2] and v[3] for v in a.get('server', {}).values()): bad.append(f"서버에 이번 주 점수가 없어요 {a.get('server')}")
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
asyncio.run(main())
