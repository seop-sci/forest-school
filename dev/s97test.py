# 2.2.0 시험: 저장 안전 장치(가짜 Firebase 서버). 2026-10-30 중학교 3학년 학교가 초등 4학년 2학기 학교로 덮인 일을 그대로 재현해요
# 보는 것
#  1) 덮인 뒤: 이 기기에 중학교 학교, 서버에 더 늦게 저장된 초등 학교 → 묻는 창이 뜨고, 고르기 전에는 서버에 올리지 않아요
#  2) '이 기기 학교' → 서버가 중학교 학교로, 초등 학교는 이 기기와 서버 예전 학교 칸(forest/bak/<id>)에 남아요
#  3) '서버 학교' → 초등 학교로 이어 하고, 중학교 학교가 예전 학교 칸에 남아요. 설정 > 예전 학교 되돌리기로 다시 중학교 학교
#  4) 옛 기기: 이 기기에 초등 학교, 서버에 더 키운 중학교 학교(더 일찍 저장) → 덮어 올리지 않고 물어봐요
#  5) 진행이 같으면 예전처럼 묻지 않아요(s7 newer, older와 같음). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 build_gh.py gh && python3 s97test.py   (마지막 줄이 PASS면 통과, 가짜 서버 시험이라 다른 서버 시험과 따로 돌려요)
import asyncio, json, time, subprocess
from playwright.async_api import async_playwright
from s7test import HERE, PORT, api, dump, mode, elem, device, wait_cloud, wait_text, local, uid_of, toast, INFO, open_settings

def mid(**kw):
    return elem(tier=2, tg=2, sem=1, **kw)   # 중학교 3학년 2학기
def e4(**kw):
    return elem(tier=1, tg=3, sem=1, **kw)   # 초등 4학년 2학기

PICK = "(() => { const m = document.querySelector('#mPick'); return { open: !!m && !m.hidden, loc: document.querySelector('#pickLoc').textContent, srv: document.querySelector('#pickSrv').textContent }; })()"
BAK = "JSON.parse(localStorage.getItem('forest-school-bak') || '[]').map(b => [b.sum, b.why])"
srv_save = lambda uid: json.loads(dump()['forest']['saves'][uid]['d'])
srv_bak = lambda uid: {k: v.get('sum') for k, v in (dump()['forest'].get('bak', {}).get(uid) or {}).items()} if isinstance((dump()['forest'].get('bak', {}) or {}).get(uid), dict) else [x and x.get('sum') for x in (dump()['forest'].get('bak', {}).get(uid) or [])]


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg); print('  틀림:', msg)

    srv = subprocess.Popen(['node', str(HERE / 'fbtest' / 'fbserver.js'), str(HERE / 'gh'), str(PORT), str(HERE / 'gh_database.rules.json')],
                           cwd=str(HERE / 'fbtest'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            mode(config='set', authOff=False, denyAll=False); api('/__seed', {'reset': True})
            # 0) 중학교 3학년 학교가 서버에 올라가요
            ctx, page, errs, navs = await device(b, seed=mid(budget=777777))
            ok(await wait_cloud(page), '처음 연결')
            uid = await uid_of(page)
            ok(srv_save(uid)['tier'] == 2, '서버에 중학교 학교')
            # 1) 다른 기기의 초등 4학년 2학기 학교가 서버를 덮었어요(더 늦게 저장)
            now = int(time.time() * 1000)
            api('/__seed', {'path': f'/forest/saves/{uid}', 'value': {'d': json.dumps(e4(budget=4242, savedAt=now + 60000)), 'at': now + 60000, 'v': '2.1.3'}})
            n0 = len(navs)
            await page.reload(); await page.wait_for_timeout(3000)
            r = await page.evaluate(PICK); info = await page.evaluate(INFO)
            print('덮인 뒤', r, info)
            ok(r['open'] and '중학교 3학년 2학기' in r['loc'] and '초등학교 4학년 2학기' in r['srv'] and '골라' in info, f'묻는 창 {r} {info}')
            await page.wait_for_timeout(2500)
            ok(srv_save(uid)['tier'] == 1 and (await local(page))['tier'] == 2, '고르기 전에는 서버도 이 기기도 그대로')
            await page.screenshot(path='s97_pick.png')
            # 2) 이 기기 학교
            await page.click('#pickKeep'); await page.wait_for_timeout(2500)
            sv = srv_save(uid); bk = await page.evaluate(BAK)
            print('이 기기 학교', sv['tier'], bk, srv_bak(uid))
            ok(sv['tier'] == 2 and sv['budget'] >= 777777, f'서버가 중학교 학교로 {sv["tier"]}')
            ok(any('초등학교 4학년' in s for s, _ in bk), f'이 기기 예전 학교 칸 {bk}')
            ok(any(s and '초등학교 4학년' in s for s in (srv_bak(uid).values() if isinstance(srv_bak(uid), dict) else srv_bak(uid))), f'서버 예전 학교 칸 {srv_bak(uid)}')
            # 3) 서버 학교를 고르면 이어 하고, 되돌리기로 다시 중학교
            now = int(time.time() * 1000)
            api('/__seed', {'path': f'/forest/saves/{uid}', 'value': {'d': json.dumps(e4(budget=4242, savedAt=now + 60000)), 'at': now + 60000, 'v': '2.1.3'}})
            await page.reload(); await page.wait_for_timeout(3000)
            ok((await page.evaluate(PICK))['open'], '다시 묻는 창')
            await page.click('#pickLoad'); await page.wait_for_timeout(3500)
            lc = await local(page); bk = await page.evaluate(BAK)
            ok(lc['tier'] == 1 and lc['budget'] < 777777 and any('중학교 3학년' in s for s, _ in bk), f'서버 학교로 이어 하기 {lc["tier"]} {bk}')
            await wait_cloud(page)
            await open_settings(page)
            await page.click('#optBak'); await page.wait_for_timeout(1500)
            rows = await page.evaluate("[...document.querySelectorAll('#bakList .bak-row b')].map(x => x.textContent)")
            print('되돌리기 목록', rows)
            await page.screenshot(path='s97_bak.png')
            i = next((k for k, s in enumerate(rows) if '중학교 3학년' in s), -1)
            ok(i >= 0, f'목록에 중학교 학교 {rows}')
            if i >= 0:
                btn = f'#bakList [data-bak="{i}"]'
                await page.click(btn); await page.wait_for_timeout(300); await page.click(btn); await page.wait_for_timeout(3500)
                lc = await local(page)
                ok(lc['tier'] == 2 and lc['budget'] >= 777777, f'되돌린 학교 {lc["tier"]} {lc["budget"]}')
                await wait_cloud(page); await page.wait_for_timeout(1500)
                ok(srv_save(uid)['tier'] == 2, '되돌린 학교가 서버에')
            ok(not errs, f'페이지 오류 {errs[:3]}')
            await ctx.close()
            # 4) 옛 기기: 이 기기 초등 학교(오래 안 켬), 서버에 중학교 학교 → 묻기
            api('/__seed', {'reset': True})
            ctx, page, errs, navs = await device(b, seed=mid(budget=888888))
            await wait_cloud(page); uid = await uid_of(page)
            await page.wait_for_timeout(6500)   # 서버에 올린 때보다 이 기기 학교가 더 늦게 저장된 상황(오프라인에서 한 옛 학교)
            old = e4(budget=11, savedAt=int(time.time() * 1000))
            await ctx.add_init_script("if (sessionStorage.getItem('oldOnce')) { sessionStorage.removeItem('oldOnce'); localStorage.setItem('forest-school-v1', %s); }" % json.dumps(json.dumps(old)))
            await page.evaluate("sessionStorage.setItem('oldOnce', '1')")   # 다음에 열 때 게임보다 먼저 옛 학교를 넣어요
            await page.reload(); await page.wait_for_timeout(3000)
            r = await page.evaluate(PICK)
            print('옛 기기', r)
            ok(r['open'] and '초등학교 4학년' in r['loc'] and '중학교 3학년' in r['srv'], f'옛 기기 묻는 창 {r}')
            await page.wait_for_timeout(1500)
            ok(srv_save(uid)['tier'] == 2, '옛 기기가 서버를 덮지 않아요')
            await page.click('#pickLoad'); await page.wait_for_timeout(3500)
            ok((await local(page))['tier'] == 2, '서버 중학교 학교로')
            ok(not errs, f'페이지 오류 {errs[:3]}')
            await ctx.close()
            await b.close()
    finally:
        srv.terminate()
    print('PASS' if not bad else f'FAIL {len(bad)}')

if __name__ == '__main__':
    asyncio.run(main())
