# 34번 묶음(1.1.0) 시험: 관리자가 테스트 현황 기록을 골라 지우기 (가짜 Firebase 서버의 규칙 검사 포함)
# 2.3.0: 비밀 글자 대신 forest/adminUids/<계정 번호>: true(콘솔에서만 넣어요)인 계정이 관리자예요
import asyncio, json, time, subprocess
from playwright.async_api import async_playwright
from s7test import HERE, PORT, ORIGIN, api, dump, device, wait_cloud, push_now, open_settings, kinder, toast

def stat(pid, name, seen):
    return {'seen': seen, 'pid': pid, 'name': name, 'tier': 0, 'year': 1, 'town': 1, 'play': 600, 'sess': 3, 'v': '1.0.0'}

async def main():
    srv = subprocess.Popen(['node', str(HERE / 'fbtest' / 'fbserver.js'), str(HERE / 'gh'), str(PORT), str(HERE / 'gh_database.rules.json')],
                           cwd=str(HERE / 'fbtest'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    time.sleep(0.8); res = {}
    try:
        now = int(time.time() * 1000)
        for uid, pid, nm, ago in (('uOld1', 'PIDOLD01', '옛날폰', 9e6), ('uOld2', 'PIDOLD01', '옛날폰', 8e6), ('uTab', 'PIDTAB01', '태블릿', 5e6), ('uKeep', 'PIDKEEP1', '친구 학교', 1e6)):
            api('/__seed', {'path': f'/forest/stats/{uid}', 'value': stat(pid, nm, now - int(ago))})
        async with async_playwright() as p:
            b = await p.chromium.launch()
            ctx, page, errs, navs = await device(b, seed=kinder())
            await wait_cloud(page); await push_now(page)
            await open_settings(page)
            for _ in range(5): await page.evaluate("document.querySelector('#verRow').click()")
            await page.wait_for_timeout(200)
            await page.evaluate("document.querySelector('#devStats').click()"); await page.wait_for_timeout(1500)
            q = """(() => ({ key: !document.querySelector('#stKeyForm').hidden, del: document.querySelector('#statsDel').hidden ? null : document.querySelector('#statsDel').textContent,
              rows: document.querySelectorAll('#statsList .st-row').length, picks: document.querySelectorAll('#statsList .st-pick').length }))()"""
            res['before'] = await page.evaluate(q)
            # 관리자가 아니면 지우기 단추가 없고, 남의 기록을 지울 수 없어요(규칙)
            res['notAdminDelete'] = await page.evaluate("""(async () => { try { await firebase.database().ref('forest/stats/uKeep').remove(); return 'removed'; } catch (e) { return 'blocked'; } })()""")
            # 스스로 관리자가 될 수 없어요(adminUids는 쓰기 금지)
            res['selfAdmin'] = await page.evaluate("""(async () => { try { await firebase.database().ref('forest/adminUids/' + firebase.auth().currentUser.uid).set(true); return 'set'; } catch (e) { return 'blocked'; } })()""")
            uid = await page.evaluate("firebase.auth().currentUser.uid")
            api('/__seed', {'path': f'/forest/adminUids/{uid}', 'value': True})
            await page.evaluate("document.querySelector('#mStats .btn-sub, #statsClose') && document.querySelector('#statsClose') ? document.querySelector('#statsClose').click() : 0"); await page.wait_for_timeout(500)
            await page.evaluate("document.querySelector('#devStats').click()"); await page.wait_for_timeout(1800)
            res['right'] = [await page.evaluate(q), await toast(page)]
            await page.screenshot(path='s34_admin.png')
            # 옛날폰(기록 2개)과 태블릿을 고르고 두 번 눌러 지워요
            names = await page.evaluate("[...document.querySelectorAll('#statsList .st-row')].map(li => li.querySelector('b').textContent)")
            for i, n in enumerate(names):
                if n in ('옛날폰', '태블릿'):
                    await page.evaluate(f"document.querySelectorAll('#statsList .st-pick input')[{i}].click()")
            await page.wait_for_timeout(200)
            res['picked'] = await page.evaluate(q)
            await page.evaluate("document.querySelector('#statsDel').click()"); await page.wait_for_timeout(200)
            res['confirm'] = await page.evaluate("document.querySelector('#statsDel').textContent")
            await page.screenshot(path='s34_confirm.png')
            await page.evaluate("document.querySelector('#statsDel').click()"); await page.wait_for_timeout(2000)
            res['after'] = [await page.evaluate(q), await toast(page)]
            res['server'] = sorted(dump()['forest']['stats'].keys())
            res['admins'] = list((dump()['forest'].get('admins') or {}).keys())
            res['errors'] = errs
            await ctx.close()
            # 관리자가 아닌 다른 기기는 지울 수 없어요
            ctx2, page2, errs2, _ = await device(b, seed=kinder(budget=10))
            await wait_cloud(page2)
            res['other'] = await page2.evaluate("""(async () => { try { await firebase.database().ref('forest/stats/uKeep').remove(); return 'removed'; } catch (e) { return 'blocked ' + (e.code || e.message); } })()""")
            res['other_server'] = sorted(dump()['forest']['stats'].keys())
            await ctx2.close(); await b.close()
    finally:
        srv.kill()
    print(json.dumps(res, ensure_ascii=False, indent=1))
    ok = (res['before']['del'] is None and not res['before']['key'] and res['notAdminDelete'] == 'blocked' and res['selfAdmin'] == 'blocked'
          and res['right'][0]['del'] is not None and res['right'][0]['picks'] > 0
          and 'uKeep' in res['server'] and 'uOld1' not in res['server'] and 'uTab' not in res['server']
          and res['other'].startswith('blocked') and 'uKeep' in res['other_server'] and not res['errors'])
    print('PASS' if ok else 'FAIL')
asyncio.run(main())
