# 2.2.0 검토 시험 (가짜 Firebase 서버): 저장 리비전, 계정 지우기, 학교 공개 끄기
# 보는 것
#  2) 두 기기(같은 계정, 같은 학교급 학년 학기)가 같은 리비전을 본 뒤 A가 도서관 Lv.12를 올리고 B가 옛 Lv.11을 올리면
#     B는 덮지 않고 묻는 창을 띄우고(자동 올리기 멈춤), 서버는 Lv.12 그대로. B가 '이 기기 학교'를 고르면 Lv.11, Lv.12는 예전 학교 칸에.
#     동시에 올려도 한 쪽만 들어가요. 리비전이 없는 옛 저장도 받아요(r 1부터). 오프라인에서 놀다 돌아와도 덮지 않고 물어요.
#     다른 기기가 학기를 올린 뒤 옛 기기가 올리면 물어요. 내렸다 켤 때 이 기기가 그대로면 묻지 않고 받아요
#  3) 계정 지우기: forest/saves, bak, rank, look, stats, admins와 이 기기 예전 학교(forest-school-bak)가 모두 지워지고,
#     새 익명 계정으로 예전 학교가 올라가지 않아요. 서버 지우기가 실패하면 완료라고 하지 않고, 그동안 올리지 않고, 다음에 열 때 이어서 지워요
#  6) 학교 공개 끄기: 서버에서 못 지우면 '지우지 못했어요'라고 알리고 표시를 남겨 다시 열면 지워요.
#     다른 기기의 옛 저장(공개 켬)은 서버에 내 학교가 없으면 다시 올리지 않고 꺼요. 랭킹에서 빼면 공개 모습도 지워요
# 쓰는 법: python3 wrap.py && python3 build_gh.py gh && python3 s98test.py   (마지막 줄이 PASS면 통과, 가짜 서버 시험이라 따로 돌려요)
import asyncio, json, time, subprocess
from playwright.async_api import async_playwright
from s7test import HERE, PORT, ORIGIN, MOCK, NT_SEEN, api, dump, mode, elem, wait_cloud, wait_text, local, uid_of, toast, INFO

PICK = "(() => { const m = document.querySelector('#mPick'); return { open: !!m && !m.hidden, loc: document.querySelector('#pickLoc').textContent, srv: document.querySelector('#pickSrv').textContent }; })()"
BAK = "JSON.parse(localStorage.getItem('forest-school-bak') || '[]').map(b => b.sum)"
F = 'window.__forest'


def fdata():
    return dump().get('forest', {}) or {}


def srv_save(uid):
    v = fdata().get('saves', {}).get(uid)
    return (json.loads(v['d']), v.get('r')) if v else (None, None)


def writes(uid, since, path='saves'):
    return [x for x in api('/__dump')['log'] if x.get('uid') == uid and x['t'] >= since and x['path'].startswith(f'/forest/{path}/') and x['op'] in ('set', 'update')]


async def dev(b, uid=None, seed=None, extra=''):
    ctx = await b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True)
    pre = "window.__FOREST_TEST = true; if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1');"
    if uid: pre += " localStorage.setItem('__mockUid', %s);" % json.dumps(uid)
    if seed is not None:
        sd = dict(seed); sd.setdefault('nt', NT_SEEN)
        pre += " localStorage.setItem('forest-school-v1', %s);" % json.dumps(json.dumps(sd))
    pre += extra + " }"
    await ctx.add_init_script(pre)
    await ctx.add_init_script("""document.addEventListener('DOMContentLoaded', () => {
      const t = document.querySelector('#toast'); if (!t) return;
      new MutationObserver(() => { if (!t.hidden && t.textContent) { const a = JSON.parse(sessionStorage.getItem('__toasts') || '[]');
        if (a[a.length - 1] !== t.textContent) { a.push(t.textContent); sessionStorage.setItem('__toasts', JSON.stringify(a)); } } })
        .observe(t, { childList: true, characterData: true, subtree: true, attributes: true }); });""")

    async def gstatic(route):
        body = MOCK if route.request.url.endswith('firebase-app-compat.js') else '/* mock */'
        await route.fulfill(status=200, content_type='text/javascript', body=body)
    await ctx.route('https://www.gstatic.com/firebasejs/**', gstatic)
    await ctx.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    await ctx.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    page = await ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    await page.goto(ORIGIN + '/'); await page.wait_for_timeout(700)
    return ctx, page, errs


def ev(page, js):
    return page.evaluate(f"(async () => {{ const F = {F}, S = F.S; {js} }})()")


async def hide(page, h=True):
    await page.evaluate("""h => { Object.defineProperty(document, 'hidden', { value: h, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: h ? 'hidden' : 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange')); }""", h)


async def lib_push(page, lv, sem=None):
    # 도서관 레벨을 바꾸고 저장해서 바로 올려요(트랜잭션이 끝날 때까지 기다려요)
    return await ev(page, f"""S.f.library = {lv}; {'S.sem = %d;' % sem if sem is not None else ''} F.save(); await F.cloudPush(true);
      return {{ rev: F.Cloud.rev, hold: !!F.Cloud.hold, state: F.Cloud.state }};""")


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg); print('  틀림:', msg)

    srv = subprocess.Popen(['node', str(HERE / 'fbtest' / 'fbserver.js'), str(HERE / 'gh'), str(PORT), str(HERE / 'gh_database.rules.json')],
                           cwd=str(HERE / 'fbtest'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    time.sleep(0.8)
    allerr = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            mode(config='set', authOff=False, denyAll=False, delay=0); api('/__seed', {'reset': True})
            # ---------- 2-0) 리비전 없는 옛 저장
            uid = 'uOLD1'
            now = int(time.time() * 1000)
            old = elem(budget=1234, savedAt=now - 3600e3)
            api('/__seed', {'path': f'/forest/saves/{uid}', 'value': {'d': json.dumps(old), 'at': now - 3600e3, 'v': '2.2.0'}})
            ctxA, A, eA = await dev(b, uid=uid, seed=elem(budget=999999, savedAt=now))
            ok(await wait_cloud(A), '옛 저장: 연결')
            await A.wait_for_timeout(800)
            sv, r = srv_save(uid)
            print('옛 저장 뒤 서버', r, sv and sv['budget'])
            ok(r == 1 and sv['budget'] >= 999999, f'옛 저장(리비전 없음)을 받고 r=1로 올려요 {r}')
            # ---------- 2-1) 두 기기 동시 실행: A Lv.12, B 옛 Lv.11
            ctxB, B, eB = await dev(b, uid=uid, seed=None)   # 새 기기: 서버 학교를 받아요
            await B.wait_for_timeout(2500)
            ok(await wait_cloud(B), '두 기기: B 연결')
            await B.wait_for_timeout(800)
            # 둘이 같은 리비전을 본 상태로 맞춰요(둘 다 지금 서버를 막 읽었다고 봐요)
            _, r0 = srv_save(uid)
            for pg in (A, B):
                await ev(pg, f"F.Cloud.rev = {r0}; F.Cloud.fresh = true; S.f.library = 11; F.save();")
            ra = await lib_push(A, 12)
            t0 = int(time.time() * 1000)
            rb = await lib_push(B, 11)
            await B.wait_for_timeout(600)
            sv, r = srv_save(uid); pk = await B.evaluate(PICK)
            print('A', ra, 'B', rb, '서버', r, sv['f']['library'], '묻는 창', pk)
            ok(ra['rev'] == r0 + 1 and not ra['hold'], f'A Lv.12가 올라가요 {ra}')
            ok(sv['f']['library'] == 12 and r == r0 + 1, f'B의 옛 Lv.11이 서버를 덮지 않아요 {sv["f"]["library"]} r={r}')
            ok(rb['hold'] and pk['open'], f'B에 묻는 창이 떠요 {rb} {pk}')
            await B.wait_for_timeout(1500)
            await ev(B, "F.save(); await F.cloudPush(true); await F.cloudPush();")
            ok(not writes(uid, t0), f'묻는 동안 B가 올리지 않아요 {writes(uid, t0)}')
            # B가 이 기기 학교를 고르면 Lv.11, Lv.12는 예전 학교 칸에
            await B.click('#pickKeep'); await B.wait_for_timeout(2000)
            sv, r = srv_save(uid); bk = await B.evaluate(BAK)
            print('B 이 기기 학교', sv['f']['library'], r, bk)
            ok(sv['f']['library'] == 11 and r == r0 + 2 and len(bk) >= 1, f'고른 학교가 올라가고 다른 학교는 남아요 {sv["f"]["library"]} {r} {bk}')
            # ---------- 2-2) 동시에 올리기: 한 쪽만 들어가요
            _, r1 = srv_save(uid)
            for pg in (A, B):
                await ev(pg, f"F.Cloud.rev = {r1}; F.Cloud.hold = false; F.Cloud.state = 'on'; F.Cloud.fresh = true; F.Cloud.pushing = false;")
            res = await asyncio.gather(lib_push(A, 13), lib_push(B, 14))
            sv, r = srv_save(uid)
            print('동시에', res, '서버', sv['f']['library'], r)
            ok(r == r1 + 1 and sorted(x['hold'] for x in res) == [False, True], f'동시에 올리면 하나만 들어가고 다른 쪽은 물어요 {res} r={r}')
            for pg in (A, B):
                await pg.evaluate("document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; o.classList.remove('open'); })")
            # ---------- 2-3) 오프라인에서 놀다 돌아오기
            _, r2 = srv_save(uid)
            for pg in (A, B):
                await ev(pg, f"F.Cloud.rev = {r2}; F.Cloud.hold = false; F.Cloud.state = 'on'; F.Cloud.fresh = true; F.Cloud.pushing = false; F.rt.pickSave = null;")
            await ctxB.set_offline(True)
            ob = await ev(B, "S.f.library = 20; F.save(); const p = F.cloudPush(true); await new Promise(r => setTimeout(r, 800)); return { rev: F.Cloud.rev, dirty: F.Cloud.dirty };")
            ra = await lib_push(A, 15)
            await ctxB.set_offline(False)
            rb = await ev(B, "F.Cloud.pushing = false; await F.cloudPush(true); return { hold: !!F.Cloud.hold };")
            sv, r = srv_save(uid)
            print('오프라인', ob, ra, rb, sv['f']['library'], r)
            ok(sv['f']['library'] == 15 and rb['hold'], f'오프라인에서 돌아와도 덮지 않고 물어요 {sv["f"]["library"]} {rb}')
            await B.evaluate("document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; o.classList.remove('open'); })")
            # ---------- 2-4) 학기: A가 2학기로, B 옛 1학기
            _, r3 = srv_save(uid)
            for pg in (A, B):
                await ev(pg, f"F.Cloud.rev = {r3}; F.Cloud.hold = false; F.Cloud.state = 'on'; F.Cloud.fresh = true; F.Cloud.pushing = false; F.rt.pickSave = null; S.sem = 0; F.save();")
            ra = await lib_push(A, 15, sem=1)
            rb = await lib_push(B, 15, sem=0)
            sv, r = srv_save(uid); pk = await B.evaluate(PICK)
            print('학기', ra, rb, sv['sem'], pk)
            ok(sv['sem'] == 1 and rb['hold'] and '2학기' in pk['srv'], f'다른 기기가 학기를 올린 뒤 옛 기기는 물어요 {sv["sem"]} {pk}')
            await B.evaluate("document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; o.classList.remove('open'); })")
            # ---------- 2-5) 내렸다 켜기: 이 기기가 그대로면 묻지 않고 받아요
            _, r4 = srv_save(uid)
            await ev(A, f"F.Cloud.rev = {r4}; F.Cloud.hold = false; F.Cloud.state = 'on'; F.Cloud.fresh = true; F.Cloud.pushing = false; F.rt.pickSave = null;")
            await ev(B, f"F.Cloud.rev = {r4}; F.Cloud.hold = false; F.Cloud.state = 'on'; F.Cloud.fresh = true; F.Cloud.pushing = false; F.rt.pickSave = null; F.Cloud.syncSv = S.savedAt;")
            await hide(B, True); await B.wait_for_timeout(800)   # 내릴 때 B가 올려요(맞춘 상태)
            hb = await ev(B, "return { rev: F.Cloud.rev, same: F.Cloud.syncSv === S.savedAt, hold: !!F.Cloud.hold };")
            await ev(A, "F.Cloud.rev = %s;" % json.dumps(srv_save(uid)[1]))
            await lib_push(A, 16)
            await hide(B, False); await B.wait_for_timeout(3500)
            print('내린 B', hb)
            lb = await local(B)
            print('내렸다 켜기', lb and lb['f']['library'])
            ok(lb and lb['f']['library'] == 16 and not (await B.evaluate(PICK))['open'], '켤 때 이 기기가 그대로면 다른 기기 학교를 받아요')
            allerr += eA + eB
            await ctxA.close(); await ctxB.close()

            # ---------- 6) 학교 공개 끄기
            api('/__seed', {'reset': True})
            now = int(time.time() * 1000)
            seedR = elem(budget=5e11, savedAt=now, rank={'name': '용감한 수달', 'joined': True, 'sent': -1, 'by': '', 'asked': True}, lk={'on': True, 'at': 0})
            ctx, P, eP = await dev(b, seed=seedR)
            ok(await wait_cloud(P), '공개: 연결')
            u6 = await uid_of(P)
            await wait_text(P, "window.__forest.Rank.state", lambda v: v == 'on')
            await ev(P, "S.lk.h = ''; S.lk.at = 0; await F.lookPush(true);")
            await P.wait_for_timeout(500)
            ok(u6 in (fdata().get('look') or {}), '공개: 내 학교 모습이 올라가요')
            mode(denyAll=True)
            await ev(P, "await F.lookSet(false);")
            await P.wait_for_timeout(300)
            t = await toast(P); st = await ev(P, "return { on: S.lk.on, del: S.lk.del };")
            print('끄기 실패', t, st)
            ok('지우지 못했어요' in t and st['del'] and not st['on'], f'못 지우면 성공이라고 하지 않고 표시를 남겨요 {t} {st}')
            mode(denyAll=False)
            await P.reload(); await P.wait_for_timeout(3500)
            st = await ev(P, "return { on: S.lk.on, del: S.lk.del };")
            print('다시 열기', st, u6 in (fdata().get('look') or {}))
            ok(not st['del'] and u6 not in (fdata().get('look') or {}), f'다시 열면 지워요 {st}')
            # 다른 기기의 옛 저장(공개 켬, 올린 적 있음): 서버에 없으면 다시 올리지 않고 꺼요
            await ev(P, "S.lk.on = true; S.lk.pub = true; S.lk.h = ''; S.lk.at = 0; await F.lookPush();")
            st = await ev(P, "return { on: S.lk.on, pub: S.lk.pub };")
            print('옛 저장', st, u6 in (fdata().get('look') or {}))
            ok(not st['on'] and u6 not in (fdata().get('look') or {}), f'다른 곳에서 끈 공개를 다시 켜지 않아요 {st}')
            # 랭킹에서 빼면 공개 모습도 지워요
            await ev(P, "await F.lookSet(true);")
            await P.wait_for_timeout(300)
            ok(u6 in (fdata().get('look') or {}), '다시 켜면 올라가요')
            await ev(P, "S.lk.at = Date.now() - 120000;")
            await P.evaluate("document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; o.classList.remove('open'); })")
            await ev(P, "if (F.leaveRank) await F.leaveRank();")
            await P.wait_for_timeout(500)
            ok(u6 not in (fdata().get('look') or {}), '랭킹에서 빼면 공개 모습도 지워요')
            allerr += eP
            await ctx.close()

            # ---------- 3) 계정 지우기
            api('/__seed', {'reset': True})
            now = int(time.time() * 1000)
            ctx, D, eD = await dev(b, seed=dict(seedR, savedAt=now))
            ok(await wait_cloud(D), '지우기: 연결')
            u3 = await uid_of(D)
            await wait_text(D, "window.__forest.Rank.state", lambda v: v == 'on')
            await ev(D, "F.bakAdd(JSON.stringify(Object.assign({}, S, { tier: 1, tg: 1, pid: 'OLDBAK1' })), '시험'); S.lk.h = ''; await F.lookPush(true); F.Cloud.fresh = true; await F.cloudPush(true);")
            api('/__seed', {'path': f'/forest/admins/{u3}', 'value': 'key'})
            await D.wait_for_timeout(2500)
            have = {k: u3 in (fdata().get(k) or {}) for k in ('saves', 'bak', 'rank', 'look', 'stats', 'admins')}
            print('지우기 전', have)
            ok(all(have.values()), f'지우기 전 서버에 모두 있어요 {have}')
            # 서버 지우기가 실패하면
            mode(denyAll=True)
            t0 = int(time.time() * 1000)
            await D.evaluate("document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; o.classList.remove('open'); })")
            await ev(D, "await F.deleteAccount();")
            await D.wait_for_timeout(300)
            t = await toast(D); mk = await D.evaluate("localStorage.getItem('forest-del-data')")
            mode(denyAll=False)
            await ev(D, "F.save(); await F.cloudPush(true);")
            await D.wait_for_timeout(1500)
            print('지우기 실패', t, mk, writes(u3, t0))
            ok('다 지우지 못했어요' in t and mk == u3 and not writes(u3, t0) and not writes(u3, t0, 'bak'), f'실패하면 완료라고 하지 않고, 올리지 않고, 표시를 남겨요 {t} {mk}')
            # 다시 열면 이어서 지우고 새 학교로
            await D.reload(); await D.wait_for_timeout(5000)
            gone = {k: u3 not in (fdata().get(k) or {}) for k in ('saves', 'bak', 'rank', 'look', 'stats', 'admins')}
            lb = await D.evaluate(BAK); u3b = await uid_of(D); mk = await D.evaluate("localStorage.getItem('forest-del-data')")
            await D.wait_for_timeout(3000)
            nb = (fdata().get('bak') or {}).get(u3b)
            print('다시 열어 지우기', gone, lb, u3b, mk, nb)
            ok(all(gone.values()), f'서버 칸이 모두 지워져요 {gone}')
            ok(not lb and not mk, f'이 기기 예전 학교와 표시가 지워져요 {lb} {mk}')
            ok(u3b != u3 and not nb, f'새 계정으로 예전 학교가 올라가지 않아요 {u3b} {nb}')
            allerr += eD
            await ctx.close()
            # 바로 지우기(성공)
            api('/__seed', {'reset': True})
            ctx, D, eD = await dev(b, seed=dict(seedR, savedAt=int(time.time() * 1000)))
            ok(await wait_cloud(D), '지우기 2: 연결')
            u4 = await uid_of(D)
            await wait_text(D, "window.__forest.Rank.state", lambda v: v == 'on')
            await ev(D, "F.bakAdd(JSON.stringify(Object.assign({}, S, { tier: 1, tg: 1, pid: 'OLDBAK2' })), '시험'); S.lk.h = ''; await F.lookPush(true); F.Cloud.fresh = true; await F.cloudPush(true);")
            await D.wait_for_timeout(2500)
            had4 = all(u4 in (fdata().get(k) or {}) for k in ('saves', 'bak', 'rank', 'look', 'stats'))
            await D.evaluate("document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; o.classList.remove('open'); })")
            await ev(D, "F.deleteAccount();")
            await D.wait_for_timeout(5000)
            gone = {k: u4 not in (fdata().get(k) or {}) for k in ('saves', 'bak', 'rank', 'look', 'stats', 'admins')}
            lb = await D.evaluate(BAK); u4b = await uid_of(D)
            await D.wait_for_timeout(2500)
            nb = (fdata().get('bak') or {}).get(u4b)
            print('바로 지우기', gone, lb, u4b, nb)
            ok(all(gone.values()) and not lb and u4b != u4 and not nb and had4, f'바로 지우기 {gone} {lb} {nb} {had4}')
            allerr += eD
            await ctx.close()
            await b.close()
    finally:
        srv.terminate()
    allerr = [e for e in allerr if 'Failed to fetch' not in e and 'ERR_INTERNET_DISCONNECTED' not in e]
    ok(not allerr, f'페이지 오류 {allerr[:3]}')
    print('FAIL' if bad else 'PASS')
    if bad: raise SystemExit(1)

if __name__ == "__main__":
    asyncio.run(main())
