# 1.5.4 시험 (가짜 Firebase): 구글 계정 바꾸기가 끊겼을 때, 계정 지우기가 거절됐을 때, 이어하기 코드 정리
# 쓰는 법: python3 build_gh.py gh && NODE_PATH=<targaryen 폴더> python3 s44test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, sys, subprocess, time
from playwright.async_api import async_playwright
from s7test import HERE, PORT, ORIGIN, api, mode, dump, device, wait_cloud, elem, kinder, local, uid_of, toast, push_now
F = 'window.__forest'
fails = []
def check(name, ok, info=''):
    if not ok: fails.append(f'{name} {info}')

async def acct_switch(b):
    # 이미 학교가 있는 구글 계정 acctB를 만들어 둬요
    mode(config='set', authOff=False, denyAll=False)
    api('/__seed', {'reset': True})
    g = api('/__fb', {'op': 'gsignin', 'token': 'acctB'})['uid']
    acct_save = kinder(rank={'name': '구글학교', 'joined': False})
    api('/__seed', {'path': f'/forest/saves/{g}', 'value': {'d': json.dumps(acct_save), 'at': int(time.time() * 1000) - 5000, 'v': '1.5.3'}})
    ctx, page, errs, navs = await device(b, seed=elem())
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    await page.reload(); await page.wait_for_timeout(800)
    await wait_cloud(page)
    anon = await uid_of(page)
    # 구글 로그인 창 대신 acctB 토큰을 바로 줘요 (웹 판이 넣는 진짜 구글 로그인을 덮어써요)
    await page.evaluate("window.FOREST_GOOGLE = { login: async () => ({ idToken: 'acctB' }) }")
    # 계정을 바꾸는 순간 서버가 응답하지 않아요 (권한 거절로 흉내)
    mode(denyAll=True)
    await page.evaluate(f"{F}.linkGoogle()"); await page.wait_for_timeout(1500)
    st = await page.evaluate(f"[{F}.Cloud.state, {F}.Cloud.err, {F}.rt.adopting, {F}.acctPending(), {F}.Cloud.uid]")
    check('계정 바꾸기 실패 뒤 상태', st[:4] == ['error', 'acct', False, True] and st[4] is None, str(st))
    # 이 기기 학교는 계속 저장돼요
    before = (await local(page))['savedAt']
    await page.wait_for_timeout(50)
    await page.evaluate(f"{F}.S.budget += 12345")
    await push_now(page)   # 앱을 내렸다가 올리면 저장해요
    after = (await local(page))['savedAt']
    check('끊긴 뒤에도 이 기기에 저장돼요', after > before, f'{before} -> {after}')
    # 구글 계정의 학교는 덮어쓰지 않았어요
    srv = dump().get('forest', {}).get('saves', {}).get(g, {})
    check('구글 계정 학교 그대로', json.loads(srv.get('d', '{}')).get('rank', {}).get('name') == '구글학교')
    # 다시 이어지면 어느 학교로 할지 물어봐요 (예전 id로 올리지 않아요)
    mode(denyAll=False)
    await page.evaluate(f"{F}.retryCloud()"); await page.wait_for_timeout(2000)
    ask = await page.evaluate("!document.querySelector('#mAcct').hidden")
    check('다시 시도하면 학교를 고르는 창', ask)
    srv2 = dump().get('forest', {}).get('saves', {}).get(g, {})
    check('고르기 전에는 계정 학교를 덮어쓰지 않아요', json.loads(srv2.get('d', '{}')).get('rank', {}).get('name') == '구글학교')
    await page.screenshot(path='s44_acct.png')
    if errs: fails.append(f'계정 바꾸기 페이지 오류 {errs[:3]}')
    await ctx.close()

async def delete_retry(b):
    mode(config='set', authOff=False, denyAll=False)
    api('/__seed', {'reset': True})
    ctx, page, errs, navs = await device(b, seed=elem())
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    await page.reload(); await page.wait_for_timeout(800)
    await wait_cloud(page)
    uid = await uid_of(page)
    # 이어하기 코드를 만들어 둬요 (계정을 지우면 함께 지워져야 해요)
    await page.evaluate("document.querySelector('.tab[data-tab=settings]').click()"); await page.wait_for_timeout(300)
    await page.evaluate("document.querySelector('#optMove').click()"); await page.wait_for_timeout(300)
    await page.evaluate("document.querySelector('#moveMake').click()"); await page.wait_for_timeout(1200)
    code = await page.evaluate(f"{F}.Cloud.moveCode")
    check('이어하기 코드를 만들었어요', bool(code), str(code))
    # Firebase가 '최근에 로그인해야 해요'로 계정 지우기를 거절해요
    await page.evaluate("localStorage.setItem('__delFail', '1')")
    await page.evaluate("document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')})")
    await page.evaluate("document.querySelector('#delYes').click()"); await page.wait_for_timeout(2500)
    d = dump().get('forest', {})
    check('서버 저장 지움', uid not in d.get('saves', {}))
    check('이어하기 코드 지움', code not in d.get('moves', {}), str(list(d.get('moves', {}).keys())))
    pend = await page.evaluate("localStorage.getItem('forest-del-pending')")
    check('계정을 못 지운 표시', pend == '1', str(pend))
    t = await toast(page)
    check('계정이 남았다고 알려요', '다음에 열 때' in t, t)
    # 다시 열었는데 또 거절되면 서버에 새로 올리지 않아요
    await page.wait_for_timeout(1500); await push_now(page)
    left = await page.evaluate(f"[{F}.Cloud.delLeft, document.querySelector('#infoSave').textContent]")
    check('다시 열어도 남은 계정이면 올리지 않아요', left[0] is True and uid not in dump().get('forest', {}).get('saves', {}), str(left))
    # 거절이 풀리면 다음에 열 때 계정을 지우고 새 익명 계정으로 시작해요
    await page.evaluate("localStorage.removeItem('__delFail')")
    await page.reload(); await page.wait_for_timeout(1000); await wait_cloud(page)
    now = await uid_of(page)
    pend2 = await page.evaluate("localStorage.getItem('forest-del-pending')")
    check('다시 열면 남은 계정까지 지워요', pend2 is None and now and now != uid, f'{pend2} {uid} -> {now}')
    if errs: fails.append(f'계정 지우기 페이지 오류 {errs[:3]}')
    await ctx.close()

async def main():
    srv = subprocess.Popen(['node', str(HERE / 'fbtest' / 'fbserver.js'), str(HERE / 'gh'), str(PORT), str(HERE / 'gh_database.rules.json')],
                           cwd=str(HERE / 'fbtest'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            await acct_switch(b)
            await delete_retry(b)
            await b.close()
    finally:
        srv.terminate()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else f'FAIL ({len(fails)})')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
