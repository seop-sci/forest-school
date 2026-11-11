# 4.0.1 시험: 서버 학교가 이 앱보다 새 버전에서 저장됐으면 받지도 덮지도 않아요 (가짜 Firebase 서버, 3.3.2 분석에서 나온 것)
#  1) 서버 저장의 v가 더 큰 버전(9.9.0)이면: 묻는 창 없이 이 기기 학교 그대로, 서버 저장도 그대로, 설정에 업데이트 안내
#  2) 끝자리만 다른 버전(같은 앞자리와 가운데 자리)은 예전처럼 받아요
# 쓰는 법: python3 wrap.py && python3 build_gh.py gh && python3 s116test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, time, subprocess, re
from playwright.async_api import async_playwright
import s7test
from s7test import HERE, PORT, api, dump, mode, elem, device, wait_cloud, local, uid_of, INFO, NT_SEEN, push_now
VER = re.search(r"const VERSION = '([\d.]+)'", (HERE / 'forest-school.html').read_text(encoding='utf-8')).group(1)
PICK = "(() => { const m = document.querySelector('#mPick'); return !!m && !m.hidden; })()"
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    srv = subprocess.Popen(['node', str(HERE / 'fbtest' / 'fbserver.js'), str(HERE / 'gh'), str(PORT), str(HERE / 'gh_database.rules.json')],
                           cwd=str(HERE / 'fbtest'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    s7test.wait_server()
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            mode(config='set', authOff=False, denyAll=False); api('/__seed', {'reset': True})
            ctx, page, errs, navs = await device(b, seed=elem(budget=777777, nt=NT_SEEN))
            ok(await wait_cloud(page), '처음 연결')
            uid = await uid_of(page)
            cur = dump()['forest']['saves'][uid]; now = int(time.time() * 1000)
            # 1) 더 새 버전에서 저장한 학교가 서버에 있어요
            newer = {'d': json.dumps(elem(budget=4242, savedAt=now + 60000, nt=NT_SEEN)), 'at': now + 60000, 'v': '9.9.0', 'r': (cur.get('r') or 0) + 1}
            api('/__seed', {'path': f'/forest/saves/{uid}', 'value': newer})
            n0 = len(navs)
            await page.reload(); await page.wait_for_timeout(3500)
            info = await page.evaluate(INFO); loc = await local(page)
            print('새 버전 저장', info)
            ok(not await page.evaluate(PICK), '묻는 창이 뜨지 않아요')
            ok(loc['budget'] >= 777777, f'이 기기 학교 그대로 {loc["budget"]}')
            ok('업데이트' in info, f'설정에 업데이트 안내 {info}')
            await page.evaluate("window.__forest && window.__forest.save && window.__forest.save()"); await push_now(page); await page.wait_for_timeout(2500)
            sv = dump()['forest']['saves'][uid]
            ok(sv['v'] == '9.9.0' and json.loads(sv['d'])['budget'] == 4242, f'서버 저장 그대로 {sv["v"]}')
            # 2) 끝자리만 다른 버전은 예전처럼 받아요
            a = VER.split('.'); same = f'{a[0]}.{a[1]}.99'
            now = int(time.time() * 1000)
            api('/__seed', {'path': f'/forest/saves/{uid}', 'value': {'d': json.dumps(elem(budget=5151, savedAt=now + 120000, nt=NT_SEEN)), 'at': now + 120000, 'v': same, 'r': sv['r'] + 1}})
            await page.reload(); await page.wait_for_timeout(4500)
            info = await page.evaluate(INFO); loc = await local(page)
            print('끝자리만 다른 저장', info, loc['budget'], '묻는 창', await page.evaluate(PICK))
            ok('업데이트' not in info, f'끝자리만 다르면 안내 없음 {info}')
            ok(loc['budget'] == 5151 or await page.evaluate(PICK), '끝자리만 다르면 예전처럼 받거나 물어요')
            ok(not errs, f'페이지 오류 {errs[:2]}')
            await b.close()
    finally:
        srv.terminate()
    print('PASS' if not bad else f'FAIL ({len(bad)})')
asyncio.run(main())
