# 2.1.1 시험: 학생과 추억(단짝 친구와 친밀도, 생일 잔치, 졸업 앨범과 편지)
# 보는 것
#  1) 단짝: 처음 만난 종류마다 한 명(유치원 5명), 이름이 겹치지 않고 생일이 다른 달에 퍼져요. 옛 저장에도 만들어 줘요
#  2) 쓰다듬기 하루 한 번(+1), 선물 정수 5 하루 3번(+3), 하트 보상(♥1~4 정수, ♥5 황금), 이름 바꾸기(1~4글자)
#  3) 생일: 단짝 생일 날 잔치(케이크 하루 한 번, +5), 단짝 생일이 없는 주에는 반 친구 생일이 딱 하루
#  4) 앨범: 종업식과 졸업식마다 한 쪽, 졸업식에 하트가 높은 단짝 편지(♥5면 황금 1), 옛 저장은 졸업식 사진으로 졸업 쪽
#  5) 건물 창 '여기 있는 친구', 도감 단짝 칸, 지도에서 학생 누르기(말풍선과 쓰다듬기), 반장 후보 이름, 퀘스트 bf1 bf2 al1
#  6) 390 밝은, 360 어두운 화면에서 앨범, 편지, 도감, 건물 창이 넘치지 않아요(캡처 s83_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s83test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'
CITY = f"(() => {{ const F = {F}, S = F.S; let n = 0; while (F.gradeOf(F.rep()) < 4 && n < 200) {{ S.f.library += 1; n++; }} F.checkGrade(); return S.grade; }})()"
GATE = f"(() => {{ const F = {F}, S = F.S; const i = F.MAIN.findIndex(q => q.ye === S.tg + 1 && (q.yt || 1) === S.tier); if (i >= 0) S.q.m = i; return i; }})()"
OVER = """(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)) out.push((el.id || el.className) + ' ' + Math.round(r.left) + '~' + Math.round(r.right)); }); return out; })"""


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg)
            print('  틀림:', msg)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; window.__FOREST_KIDTAP = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(T.SKIP)
            ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S; {js} }})()")
            # 1) 단짝
            r = await ev("F.frSync(); const L = F.frList(); return { n: L.length, names: L.map(sp => S.fr[sp].nm), bm: L.map(sp => S.fr[sp].bm), bd: L.map(sp => S.fr[sp].bd) };")
            print(w, '단짝', r)
            ok(r['n'] == 5, f'유치원 단짝 5명 ({r["n"]})')
            ok(len(set(r['names'])) == r['n'], '단짝 이름이 겹쳐요')
            ok(len(set(r['bm'])) == r['n'], f'생일 달이 고르게 퍼지지 않았어요 {r["bm"]}')
            ok(all(1 <= d <= 28 for d in r['bd']), '생일 날이 1~28이 아니에요')
            # 2) 쓰다듬기, 선물, 하트
            r = await ev("const a = F.frPat('rabbit'), b = F.frPat('rabbit'); S.ess = 20; const g = [1, 2, 3, 4].map(() => F.frGift('rabbit')); F.T_closeAll && F.T_closeAll();"
                         "return { a, b, pat: S.frc.pat, p: S.fr.rabbit.p, g, ess: S.ess, gift: S.frc.gift, h: F.frHeart(S.fr.rabbit.p) };")
            print(w, '친밀도', r)
            await pg.evaluate(T.CLEAN)
            ok(r['a'] is True and r['b'] is False, '쓰다듬기가 하루 한 번이 아니에요')
            ok(r['g'] == [True, True, True, False], f'선물 하루 3번 {r["g"]}')
            ok(r['p'] == 10 and r['h'] == 2, f'친밀도 1 + 3×3 = 10, 하트 2칸 ({r["p"]}, {r["h"]})')
            ok(r['ess'] == 20 - 15 + 2 + 3, f'정수: 선물 15 쓰고 하트 보상 2 + 3 ({r["ess"]})')
            r = await ev("S.fr.fox.p = 54; const g0 = S.gold; const it = F.frAddP('fox', 1, true); return { g: S.gold - g0, n: it.length, h: F.frHeart(S.fr.fox.p) };")
            ok(r['g'] == 1 and r['h'] == 5, f'하트 5칸 황금 도토리 1 ({r})')
            r = await ev("return [F.frRename('rabbit', '콩콩'), F.frRename('rabbit', '너무긴이름'), F.frRename('rabbit', S.fr.fox.nm), S.fr.rabbit.nm];")
            ok(r[:3] == [True, False, False] and r[3] == '콩콩', f'이름 바꾸기 {r}')
            # 3) 생일
            r = await ev("const t = F.gameToday(), [y, m, d] = t.split('-').map(Number); S.fr.chick.bm = m; S.fr.chick.bd = Math.min(28, d); F.rt.bdMemo = null;"
                         "const p = F.bdParty(); const p0 = S.fr.chick.p; const a = F.bdClaim(), b = F.bdClaim(); return { p, a, b, dp: S.fr.chick.p - p0, cake: S.frc.cake, n: S.fr.chick.n.bd, today: d };")
            await pg.evaluate(T.CLEAN)
            print(w, '생일', r)
            if r['today'] > 28:   # 생일은 1~28일이라 29~31일에는 정해 둔 날로 잔치를 봐요
                r2 = await ev("const t = F.gameToday(); S.fr.chick.bd = 28; F.rt.bdMemo = null; const d = t.slice(0, 8) + '28'; return F.bdParty(d);")
                ok(r2 and r2['fr'] and r2['sp'] == 'chick', f'단짝 생일 잔치(28일) {r2}')
            else:
                ok(r['p'] and r['p']['fr'] and r['p']['sp'] == 'chick', '단짝 생일 잔치가 안 열려요')
                ok(r['a'] is True and r['b'] is False and r['dp'] == 5 and r['cake'] == 1 and r['n'] == 1, f'케이크 하루 한 번, 친밀도 +5 {r}')
            # 단짝 생일이 없는 주: 반 친구 생일이 딱 하루
            r = await ev("const t = F.gameToday(), [y, m, d] = t.split('-').map(Number); const far = ((m + 5) % 12) + 1; F.frList().forEach(sp => { S.fr[sp].bm = far; }); F.rt.bdMemo = null;"
                         "const base = Date.UTC(y, m - 1, d), wd = (new Date(base).getUTCDay() + 6) % 7, mon = base - wd * 864e5; const out = [];"
                         "for (let i = 0; i < 7; i++) { const dd = new Date(mon + i * 864e5).toISOString().slice(0, 10); const v = F.bdParty(dd); if (v) out.push([dd, v.fr, v.sp, v.nm]); } return out;")
            ok(len(r) == 1 and r[0][1] is False, f'반 친구 생일이 한 주에 하루가 아니에요 {r}')
            # 5) 건물 창, 도감, 지도
            await pg.evaluate(T.CLEAN)
            await ev("S.f.cafeteria = Math.max(1, S.f.cafeteria); F.setTab('school'); F.openSheet('classroom');")
            await pg.wait_for_timeout(500)
            r = await ev("const row = document.querySelector('#sheetFriend'); return { hid: row.hidden, nm: document.querySelector('#sheetFriendNm').textContent, tx: document.querySelector('#sheetFriendTx').textContent };")
            ok(not r['hid'] and len(r['tx']) > 3, f'건물 창 친구 줄 {r}')
            await pg.screenshot(path=f's83_sheet_{w}.png')
            o = await pg.evaluate(OVER + "('#sheetFriend, #sheetFriend *')")
            ok(not o, f'{w} 건물 창 친구 줄이 넘쳐요 {o}')
            await ev("F.closeSheet();"); await pg.wait_for_timeout(300)
            await ev("F.setTab('dex'); F.rt.dexPick = 'rabbit'; F.renderDex();")
            await pg.wait_for_timeout(400)
            r = await ev("const b = document.querySelector('.fr-box'); return b ? b.textContent : '';")
            ok('콩콩' in r and '선물' in r, f'도감 단짝 칸 {r[:80]}')
            await pg.screenshot(path=f's83_dex_{w}.png')
            o = await pg.evaluate(OVER + "('.fr-box, .fr-box *')")
            ok(not o, f'{w} 도감 단짝 칸이 넘쳐요 {o}')
            await ev("F.setTab('school');"); await pg.wait_for_timeout(600)
            r = await ev("const k = F.rt.kids.find(k => k.g.style.display !== 'none'); if (!k) return null; const sp = k.sp, p0 = S.fr[sp].p, was = S.fr[sp].pat === F.gameToday(); F.frKidTap(k);"
                         "return { sp, was, dp: S.fr[sp].p - p0, bub: !!document.querySelector('.fr-bub'), tap: document.querySelector('#kids').classList.contains('tap') };")
            print(w, '지도', r)
            ok(r and r['bub'] and r['tap'] and (r['was'] or r['dp'] >= 1), f'지도에서 학생 누르기 {r}')
            # 반장 후보(초등학교 흉내): 단짝 이름
            r = await ev("const c = F.elMake(); return c.map(x => [x.sp, x.nm, S.fr[x.sp] ? S.fr[x.sp].nm : '']);")
            ok(all(x[1] == x[2] for x in r), f'반장 후보 이름이 단짝 이름이 아니에요 {r}')
            # 퀘스트
            r = await ev("return ['bf1', 'bf2', 'al1'].map(id => { const q = F.MAIN.find(m => m.id === id); return q ? [q.ch, F.qMeasure(q)] : null; });")
            ok(all(r) and r[0][0] == 1 and r[1][0] == 2 and r[2][0] == 5 and r[0][1] >= 1 and r[1][1] >= 3, f'퀘스트 bf1 bf2 al1 {r}')
            # 4) 앨범: 유치원 종업식 → 졸업식
            await pg.evaluate(T.CLEAN)
            r = await ev("S.fr.bear.p = 60; S.fr.bear.n.pc = 2; return 1;")
            await pg.evaluate(CITY); await pg.evaluate(GATE)
            r = await ev("const a = F.canGraduate(); F.graduate(); return { a, n: S.alb.length, pg: S.alb[S.alb.length - 1] };")
            await pg.evaluate(T.CLEAN)
            print(w, '종업식', r['a'], r['n'], r['pg'] and {k: r['pg'][k] for k in ('t', 'y', 'k', 'st', 'kids')})
            ok(r['a'] and r['n'] == 1 and r['pg']['k'] == 'y' and r['pg']['y'] == 1 and len(r['pg']['kids']) >= 5, f'종업식 앨범 쪽 {r["n"]}')
            await pg.evaluate(CITY); await pg.evaluate(GATE)
            r = await ev("const a = F.canPromote(); const g0 = S.gold; F.promote(); const pg = S.alb[S.alb.length - 1]; return { a, n: S.alb.length, k: pg.k, t: pg.t, ltr: pg.ltr, tier: S.tier, q: F.rt.modalQueue.length };")
            print(w, '졸업식', {k: r[k] for k in ('a', 'n', 'k', 't', 'tier')}, (r['ltr'] or {}).get('nm'), (r['ltr'] or {}).get('gold'))
            ok(r['a'] and r['n'] == 2 and r['k'] == 'g' and r['tier'] == 1, f'졸업식 앨범 쪽 {r["n"]}, {r["k"]}')
            ok(r['ltr'] and r['ltr']['sp'] == 'bear' and r['ltr']['gold'] == 1 and '올림' in r['ltr']['txt'], f'졸업 편지 {r["ltr"]}')
            await pg.evaluate(T.CLEAN)
            # 앨범 창
            await ev("F.openAlbum();"); await pg.wait_for_timeout(400)
            await pg.click('#albNext'); await pg.click('#albNext'); await pg.wait_for_timeout(300)
            r = await ev("return { pg: document.querySelector('#albPg').textContent, slots: document.querySelectorAll('.alb-slot svg').length, lt: !document.querySelector('#albLetter').hidden, alb: S.frc.alb };")
            ok(r['slots'] >= 5 and r['lt'] and r['alb'] >= 1, f'앨범 창 {r}')
            await pg.screenshot(path=f's83_album_{w}.png')
            o = await pg.evaluate(OVER + "('#mAlbum .modal, #mAlbum .modal *')")
            ok(not o, f'{w} 앨범 창이 넘쳐요 {o}')
            await pg.click('#albLetter'); await pg.wait_for_timeout(500)
            r = await ev("return { open: !document.querySelector('#mLetter').hidden, t: document.querySelector('#ltText').textContent };")
            ok(r['open'] and '교장 선생님께' in r['t'], '편지 창이 안 열려요')
            await pg.screenshot(path=f's83_letter_{w}.png')
            o = await pg.evaluate(OVER + "('#mLetter .modal, #mLetter .modal *')")
            ok(not o, f'{w} 편지 창이 넘쳐요 {o}')
            await pg.evaluate(T.CLEAN)
            # 저장 읽기: 옛 저장(단짝 없음, 초등학교, 유치원 졸업식 사진만) → 졸업 쪽 하나, 단짝은 틱에서 만들어요
            r = await ev("const d = JSON.parse(JSON.stringify(S)); delete d.fr; delete d.alb; delete d.frc; d.tier = 1; d.snap = { 0: { f: { classroom: 9 }, bs: {}, st: 40, at: 1, roster: [] } };"
                         "const s = F.sanitize(d); return { alb: s.alb.length, k: s.alb[0] && s.alb[0].k, old: s.alb[0] && s.alb[0].old, fr: Object.keys(s.fr).length, frc: s.frc };")
            ok(r['alb'] == 1 and r['k'] == 'g' and r['old'] and r['fr'] == 0, f'옛 저장 앨범 {r}')
            r = await ev("const d = JSON.parse(JSON.stringify(S)); const s = F.sanitize(d); return [Object.keys(s.fr).length, s.alb.length, s.fr.rabbit && s.fr.rabbit.nm];")
            ok(r[0] >= 5 and r[1] == 2 and r[2] == '콩콩', f'저장 되읽기 {r}')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
