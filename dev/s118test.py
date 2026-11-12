# 118번 시험(4.1.2): 관리자가 랭킹 화면에서 남의 줄을 지우기 (가짜 Firebase 서버의 규칙 검사 포함)
# 관리자가 아니면 단추가 없고, 관리자는 두 번 눌러 지워요. 내 줄과 화면에만 있는 줄에는 단추가 없어요
import asyncio, json, time, subprocess
from playwright.async_api import async_playwright
import s7test
from s7test import HERE, PORT, api, dump, device, wait_cloud, kinder

Q = """(() => ({ rows: [...document.querySelectorAll('#rankList .rk')].map(li => li.querySelector('.rk-name span').textContent),
  dels: [...document.querySelectorAll('#rankList .rk-del')].map(b => [b.closest('.rk').querySelector('.rk-name span').textContent, b.textContent]),
  wide: Math.max(0, ...[...document.querySelectorAll('#rankList .rk')].map(li => li.scrollWidth - li.clientWidth)) }))()"""
async def rank_all(page):
    await page.tap('.tab[data-tab="school"]'); await page.tap('.tab[data-tab="rank"]'); await page.wait_for_timeout(600)
    await page.evaluate("document.querySelector('#rankView [data-rv=all]').click()"); await page.wait_for_timeout(1500)

async def main():
    srv = subprocess.Popen(['node', str(HERE / 'fbtest' / 'fbserver.js'), str(HERE / 'gh'), str(PORT), str(HERE / 'gh_database.rules.json')],
                           cwd=str(HERE / 'fbtest'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    s7test.wait_server(); res = {}
    try:
        now = int(time.time() * 1000)
        for uid, nm, sc in (('uFake', '가짜 일등', 49000), ('uGood', '착한 교장', 1200)):
            api('/__seed', {'path': f'/forest/rank/{uid}', 'value': {'name': nm, 'score': sc, 'at': now - 60000, 'tier': 0, 'year': 1}})
        async with async_playwright() as p:
            b = await p.chromium.launch()
            ctx, page, errs, navs = await device(b, seed=kinder())
            await wait_cloud(page); await rank_all(page)
            res['notAdmin'] = await page.evaluate(Q)
            res['notAdminDelete'] = await page.evaluate("""(async () => { try { await firebase.database().ref('forest/rank/uGood').remove(); return 'removed'; } catch (e) { return 'blocked'; } })()""")
            uid = await page.evaluate("firebase.auth().currentUser.uid")
            api('/__seed', {'path': f'/forest/adminUids/{uid}', 'value': True})
            await page.reload(); await page.wait_for_timeout(900); await wait_cloud(page); await rank_all(page)
            res['admin'] = await page.evaluate(Q)
            await page.screenshot(path='s118_admin.png')
            idx = "[...document.querySelectorAll('#rankList .rk-del')].find(b => b.closest('.rk').querySelector('.rk-name span').textContent === '가짜 일등')"
            await page.evaluate(idx + ".click()"); await page.wait_for_timeout(300)
            res['sure'] = await page.evaluate(Q)
            res['serverMid'] = sorted((dump()['forest'].get('rank') or {}).keys())
            res['looked'] = await page.evaluate("!!document.querySelector('#tierView:not([hidden]) .look, .lookbar:not([hidden])')")
            await page.screenshot(path='s118_sure.png')
            await page.evaluate(idx + ".click()"); await page.wait_for_timeout(1500)
            res['after'] = await page.evaluate(Q)
            res['server'] = sorted((dump()['forest'].get('rank') or {}).keys())
            res['errors'] = errs
            await ctx.close(); await b.close()
    finally:
        srv.kill()
    print(json.dumps(res, ensure_ascii=False, indent=1))
    sure = dict(res['sure']['dels'])
    ok = (not res['notAdmin']['dels'] and '가짜 일등' in res['notAdmin']['rows'] and res['notAdminDelete'] == 'blocked'
          and sorted(n for n, _ in res['admin']['dels']) == ['가짜 일등', '착한 교장'] and res['admin']['wide'] == 0
          and sure.get('가짜 일등') == '한 번 더 누르면 지워요' and sure.get('착한 교장') == '이 줄 지우기' and 'uFake' in res['serverMid']
          and 'uFake' not in res['server'] and 'uGood' in res['server'] and '가짜 일등' not in res['after']['rows'] and '착한 교장' in res['after']['rows']
          and not res['errors'])
    print('PASS' if ok else 'FAIL')
asyncio.run(main())
