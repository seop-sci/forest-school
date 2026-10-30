# GitHub 테스트판 시험: 가짜 Firebase 서버(규칙 검사 포함)와 가짜 SDK로 서버 저장, 복원, 이어하기, 랭킹, 테스트 현황, 오류를 확인해요
import asyncio, json, time, sys, subprocess, urllib.request, pathlib
from playwright.async_api import async_playwright
from s4test import base, TODAY
HERE = pathlib.Path(__file__).resolve().parent
PORT = 8765
ORIGIN = f'http://127.0.0.1:{PORT}'
SEL = sys.argv[1:]
want = lambda n: not SEL or n in SEL
MOCK = (HERE / 'fbtest' / 'mockfb.js').read_text(encoding='utf-8')
Q = lambda mid, m=0: {'init': True, 'mid': mid, 'm': m, 'mb': 0, 'subs': [], 'done': [], 'gen': 0, 'subDone': 5, 'seen': 40}

def api(path, body=None):
    req = urllib.request.Request(ORIGIN + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'content-type': 'application/json'}, method='POST' if body is not None else 'GET')
    return json.loads(urllib.request.urlopen(req, timeout=10).read())
mode = lambda **kw: api('/__mode', kw)
dump = lambda: api('/__dump')['data']

def elem(**kw):
    sv = base(tier=1, tg=2, tdip=60, fund=5, fp={'schol': 2, 'rep': 1, 'dip': 0}, grade=4, best=4, budget=3.2e11, students=60, yearEarned=6e9,
              f=dict(classroom=15, cafeteria=12, library=11, playground=9, science=8),
              st={'picks': 40, 'ups': 90, 'trains': 20, 'claims': 3, 'grads': 4, 'perks': 6, 'dips': 150, 'play': 5400, 'sess': 12, 'ads': 7},
              p={'dip': 24, 'species': 4, 'perk': {'schol': 2, 'rep': 1, 'start': 0, 'drop': 0, 'night': 0}}, q=Q('e14'))
    sv.update(kw); return sv
def kinder(**kw):
    sv = base(budget=5000, students=20, grade=2, best=2, f=dict(classroom=5, cafeteria=3, library=2, playground=2), t={'squirrel': 2, 'owl': 0, 'bear': 0},
              st={'picks': 10, 'ups': 12, 'trains': 2, 'claims': 1, 'grads': 0, 'perks': 0, 'dips': 0}, q=Q('q5', 5))
    sv.update(kw); return sv

import re as _re
_SRC = (HERE / 'forest-school.html').read_text(encoding='utf-8')
# 2026-10-30: 업데이트 공지 창이 늦게 떠서 단추를 가려요. 시험 저장은 이번 공지를 이미 본 것으로 넣어요
NT_SEEN = {'seen': _re.search(r"const NOTICES = \[[^{]*\{ id: '([^']+)'", _SRC).group(1), 'ver': _re.search(r"const VERSION = '([^']+)'", _SRC).group(1), 'hide': 4102444800000}
async def device(b, w=390, h=780, scheme='light', seed=None, sdk='mock', path='/'):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
    await ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=ORIGIN)
    if seed is not None:
        seed = dict(seed); seed.setdefault('nt', NT_SEEN)
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(seed)))
    await ctx.add_init_script("""document.addEventListener('DOMContentLoaded', () => {
      const t = document.querySelector('#toast'); if (!t) return;
      new MutationObserver(() => { if (!t.hidden && t.textContent) { const a = JSON.parse(sessionStorage.getItem('__toasts') || '[]');
        if (a[a.length - 1] !== t.textContent) { a.push(t.textContent); sessionStorage.setItem('__toasts', JSON.stringify(a)); } } })
        .observe(t, { childList: true, characterData: true, subtree: true, attributes: true }); });""")
    async def gstatic(route):
        if sdk == 'fail': return await route.abort()
        body = MOCK if route.request.url.endswith('firebase-app-compat.js') else '/* mock */'
        await route.fulfill(status=200, content_type='text/javascript', body=body)
    await ctx.route('https://www.gstatic.com/firebasejs/**', gstatic)
    await ctx.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    await ctx.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    page = await ctx.new_page(); errs = []; navs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    page.on('framenavigated', lambda f: navs.append(f.url) if f == page.main_frame else None)
    await page.goto(ORIGIN + path); await page.wait_for_timeout(700)
    return ctx, page, errs, navs

INFO = "document.querySelector('#infoSave').textContent"
async def wait_text(page, js, pred, ms=8000):
    t0 = time.time(); v = None
    while time.time() - t0 < ms / 1000:
        try: v = await page.evaluate(js)
        except Exception: v = None
        if v is not None and pred(v): return v
        await page.wait_for_timeout(150)
    return v
async def wait_cloud(page, ms=8000):
    return await wait_text(page, INFO, lambda t: t.startswith('서버 (') or t == '서버', ms)
async def push_now(page):
    # 앱을 내렸다가 다시 올린 것처럼 해서 바로 서버에 올려요
    await page.evaluate("""() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange')); }""")
    await page.wait_for_timeout(700)
    await page.evaluate("""() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange')); }""")
    await page.wait_for_timeout(300)
local = lambda page: page.evaluate("JSON.parse(localStorage.getItem('forest-school-v1') || 'null')")
uid_of = lambda page: page.evaluate("localStorage.getItem('__mockUid')")
toast = lambda page: page.evaluate("(JSON.parse(sessionStorage.getItem('__toasts') || '[]')).slice(-3).join(' / ')")
RANK = """(() => { const q = s => document.querySelector(s);
  return { pos: q('#rankPos').textContent, sub: q('#rankSub').textContent, join: q('#rankJoin').innerText.replace(/\\s+/g,' ').trim(),
    rows: [...document.querySelectorAll('#rankList .rk')].map(li => li.innerText.replace(/\\s+/g,' ').trim() + (li.classList.contains('me') ? ' [me]' : '')) }; })()"""
SETTINGS = """(() => { const q = s => document.querySelector(s);
  return { save: q('#infoSave').textContent, pid: q('#pidRow').hidden ? null : q('#infoPid').textContent, move: !!q('#optMove') || !!q('#mMove'),
    devStats: !q('#devStats').hidden, ver: q('#verRow dd').textContent,
    pageOver: document.documentElement.scrollWidth > document.documentElement.clientWidth }; })()"""

async def open_settings(page):
    await page.tap('.tab[data-tab="settings"]'); await page.wait_for_timeout(300)
async def main():
    srv = subprocess.Popen(['node', str(HERE / 'fbtest' / 'fbserver.js'), str(HERE / 'gh'), str(PORT), str(HERE / 'gh_database.rules.json')],
                           cwd=str(HERE / 'fbtest'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    time.sleep(0.8)
    res = {}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            # 0) config.js가 null인 체험판
            if want('demo'):
                mode(config='null'); api('/__seed', {'reset': True})
                ctx, page, errs, navs = await device(b, seed=elem())
                await page.wait_for_timeout(600)
                await open_settings(page)
                r = {'settings': await page.evaluate(SETTINGS)}
                await page.tap('.tab[data-tab="school"]'); await page.tap('.tab[data-tab="rank"]')  # 1.5.0: 랭킹은 홈 지도 오른쪽 단추; await page.wait_for_timeout(500)
                r['rank'] = await page.evaluate(RANK)
                r['server'] = dump(); r['errors'] = errs
                await page.screenshot(path='s7_demo_rank.png')
                res['demo'] = r; await ctx.close()
            mode(config='set', authOff=False, denyAll=False)
            api('/__seed', {'reset': True})
            # 1) 기기 A: 서버에 붙고, 저장과 테스트 현황이 올라가요. 랭킹에 이름을 올려요
            A = {}
            if want('flow'):
                ctx, page, errs, navs = await device(b, seed=elem())
                r = {'info': await wait_cloud(page)}
                uidA = await uid_of(page); A['uid'] = uidA
                d = dump(); sv = d['forest']['saves'][uidA]; stt = d['forest']['stats'][uidA]
                r['save'] = {'keys': sorted(sv), 'v': sv['v'], 'len': len(sv['d']), 'atIsLocal': sv['at'] == (await local(page))['savedAt']}
                r['stats'] = stt
                await open_settings(page)
                r['settings'] = await page.evaluate(SETTINGS)
                await page.screenshot(path='s7_settings_on.png')
                # 랭킹
                await page.tap('.tab[data-tab="school"]'); await page.tap('.tab[data-tab="rank"]')  # 1.5.0: 랭킹은 홈 지도 오른쪽 단추; await page.wait_for_timeout(700)
                await page.fill('#rankName', 'A 교장'); await page.evaluate("document.querySelector('#rankJoin .cta').click()"); await page.wait_for_timeout(1200)
                r['rank'] = await page.evaluate(RANK)
                r['rankServer'] = dump()['forest'].get('rank')
                await page.screenshot(path='s7_rank_on.png')
                # 2) 이 기기 저장이 지워져도 서버 학교를 다시 불러와요
                await page.tap('.tab[data-tab="school"]'); await page.wait_for_timeout(200)
                await push_now(page)
                before = await local(page)
                # 다음에 열 때 게임보다 먼저 이 기기 저장을 지워요 (닫힐 때 저장되는 것까지 지우려고)
                await ctx.add_init_script("if (sessionStorage.getItem('wipeOnce')) { sessionStorage.removeItem('wipeOnce'); localStorage.removeItem('forest-school-v1'); }")
                await page.evaluate("sessionStorage.setItem('wipeOnce', '1')")
                n0 = len(navs)
                await page.reload(); await page.wait_for_timeout(3500)
                after = await local(page)
                r['restore'] = {'navs': len(navs) - n0, 'pid': after['pid'] == before['pid'], 'tier': after['tier'], 'dips': after['st']['dips'],
                                'rank': after['rank'], 'sess': [before['st']['sess'], after['st']['sess']], 'info': await wait_cloud(page),
                                'toast': await toast(page), 'uidSame': await uid_of(page) == uidA}
                await page.wait_for_timeout(1500)
                r['restore']['navsLater'] = len(navs) - n0
                A['pid'] = after['pid']
                r['errors'] = errs; res['flow'] = r
                A['ctx'], A['page'] = ctx, page
            # 3) 1.5.6: 이어하기 코드를 뺐어요. 예전 이어하기 링크(?move=코드)로 열어도 그냥 게임이 열리고 주소에서 코드만 지워요
            if want('flow'):
                ctx, page, errs, navs = await device(b, seed=None, path='/?move=MNKC2345')
                await wait_cloud(page); await page.wait_for_timeout(1500)
                r = {'url': page.url, 'modal': await page.evaluate("[...document.querySelectorAll('.overlay.center')].filter(o => !o.hidden).map(o => o.id)"),
                     'moveUi': await page.evaluate("!!document.querySelector('#mMove, #optMove')"), 'moves': 'moves' in dump()['forest'],
                     'oldKey': await page.evaluate("localStorage.getItem('forest-move-code')"), 'errors': errs}
                await page.screenshot(path='s7_link.png')
                res['link'] = r; await ctx.close()
            # 5) 테스트 현황 (A 기기 개발자 메뉴)
            if want('flow'):
                ctx, page = A['ctx'], A['page']
                await push_now(page)
                await open_settings(page)
                for _ in range(5): await page.evaluate("document.querySelector('#verRow').click()")
                await page.wait_for_timeout(200)
                await page.evaluate("document.querySelector('#devStats').click()"); await page.wait_for_timeout(1200)
                r = await page.evaluate("""(() => ({ sum: document.querySelector('#statsSum').textContent,
                  rows: [...document.querySelectorAll('#statsList .st-row')].map(li => li.innerText.split('\\n').map(x => x.trim()).filter(Boolean).join(' | ')),
                  over: document.querySelector('.modal.wide').scrollWidth > document.querySelector('.modal.wide').clientWidth }))()""")
                await page.screenshot(path='s7_stats.png')
                res['stats'] = r
                await A['ctx'].close()
            # 5b) 이 기기 저장보다 서버 저장이 더 나중이면 서버 학교를 이어 해요
            if want('newer'):
                ctx, page, errs, navs = await device(b, seed=kinder())
                await wait_cloud(page)
                uid = await uid_of(page)
                newer = kinder(budget=424242, savedAt=int(time.time() * 1000))
                api('/__seed', {'path': f'/forest/saves/{uid}', 'value': {'d': json.dumps(newer), 'at': int(time.time() * 1000) + 60000, 'v': '1.0'}})
                n0 = len(navs)
                await page.reload(); await page.wait_for_timeout(3500)
                res['newer'] = {'navs': len(navs) - n0, 'budget': (await local(page))['budget'], 'toast': await toast(page), 'errors': errs}
                # 반대로 서버 저장이 더 오래됐으면 이 기기 학교를 서버에 올려요
                api('/__seed', {'path': f'/forest/saves/{uid}', 'value': {'d': json.dumps(kinder(budget=1)), 'at': 1000, 'v': '1.0'}})
                n0 = len(navs)
                await page.reload(); await page.wait_for_timeout(2500)
                srvb = json.loads(dump()['forest']['saves'][uid]['d'])['budget']
                res['older'] = {'navs': len(navs) - n0, 'localBudget': (await local(page))['budget'], 'serverBudget': srvb}
                await ctx.close()
            # 6) 오류: 익명 로그인 꺼짐 → 다시 연결, SDK를 못 불러옴, 규칙이 막음
            if want('err'):
                mode(authOff=True)
                ctx, page, errs, navs = await device(b, seed=elem())
                await page.wait_for_timeout(1500)
                r = {'info': await page.evaluate(INFO)}
                await page.tap('.tab[data-tab="school"]'); await page.tap('.tab[data-tab="rank"]')  # 1.5.0: 랭킹은 홈 지도 오른쪽 단추; await page.wait_for_timeout(500)
                r['rank'] = await page.evaluate(RANK)
                await page.screenshot(path='s7_err_rank.png')
                mode(authOff=False)
                await page.evaluate("document.querySelector('#rankJoin [data-rank=retry]').click()")
                r['retryInfo'] = await wait_cloud(page)
                await page.wait_for_timeout(800)
                r['rankAfter'] = await page.evaluate(RANK)
                r['errors'] = errs; res['authOff'] = r; await ctx.close()
                ctx, page, errs, navs = await device(b, seed=elem(), sdk='fail')
                await page.wait_for_timeout(1500)
                res['load'] = {'info': await page.evaluate(INFO), 'errors': [e for e in errs if 'gstatic' not in e and 'ERR_FAILED' not in e]}
                await ctx.close()
                mode(denyAll=True)
                ctx, page, errs, navs = await device(b, seed=elem())
                await page.wait_for_timeout(1500)
                res['rules'] = {'info': await page.evaluate(INFO), 'errors': errs}
                await ctx.close()
                mode(denyAll=False)
            await b.close()
    finally:
        srv.terminate()
    open('s7res.json', 'w').write(json.dumps(res, ensure_ascii=False, indent=1))
    # 2026-10-30: 통과 판정(결과 파일은 그대로 남겨요). 페이지 오류가 없고, 저장, 복원, 다시 연결이 제대로 됐는지
    errs = [e for v in res.values() if isinstance(v, dict) for e in (v.get('errors') or [])]
    ok = not errs
    if 'flow' in res: ok = ok and '서버' in res['flow'].get('info', '')
    if 'newer' in res: ok = ok and res['newer'].get('budget', 0) >= 424242 and res['older'].get('serverBudget', 0) > 1000
    if 'authOff' in res: ok = ok and '서버' in (res['authOff'].get('retryInfo') or '')
    print('PASS' if ok else 'FAIL ' + json.dumps(errs, ensure_ascii=False)[:300])
if __name__ == '__main__': asyncio.run(main())
