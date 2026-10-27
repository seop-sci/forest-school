# 1.7.4 시험: 지도 확대(손가락 두 개, 휠), 선생님 탭 배경음악, 로딩창
# 보는 것
#  1) 휠로 키우면 커지고(최대 ZOOM_MAX), 줄이기는 처음 크기까지만. 휠 자리는 그대로 남아요
#  2) 손가락 두 개를 벌리면 커지고 모으면 줄어요(처음 크기까지). 손가락을 뗀 뒤 건물이 눌리지 않아요
#  3) 키운 채로 지도를 밀어도 빈 곳이 보이지 않아요(지도 끝이 화면 안으로 들어오지 않아요)
#  4) 선생님 탭은 홈 곡(home), 졸업 탭은 쉬는 시간 곡(room)
#  5) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s63test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
SKIP = f"(()=>{{ document.querySelectorAll('.overlay.center').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); {F}.rt.modalOpen=null; const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {F}.setTab('school'); }})()"
ST = f"(() => {{ const r = {F}.rt; return {{ z: r.zoom || 1, s: r.mapS, x: r.panX, y: r.panY, w: r.mapW, h: r.mapH }}; }})()"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 컴퓨터: 휠
        ctx = await b.new_context(viewport={'width': 420, 'height': 860})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP); await pg.wait_for_timeout(400)
        s0 = await pg.evaluate(ST)
        fr = await pg.evaluate("(() => { const r = document.querySelector('.frame').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
        cx, cy = fr[0] + fr[2] / 2, fr[1] + fr[3] * 0.55
        mx0 = await pg.evaluate(f"(() => {{ const r = {F}.rt, f = document.querySelector('.frame').getBoundingClientRect(); return [({cx} - f.left - r.panX) / r.mapS, ({cy} - f.top - r.panY) / r.mapS]; }})()")
        await pg.mouse.move(cx, cy)
        for _ in range(4): await pg.mouse.wheel(0, -120); await pg.wait_for_timeout(60)
        s1 = await pg.evaluate(ST)
        mx1 = await pg.evaluate(f"(() => {{ const r = {F}.rt, f = document.querySelector('.frame').getBoundingClientRect(); return [({cx} - f.left - r.panX) / r.mapS, ({cy} - f.top - r.panY) / r.mapS]; }})()")
        for _ in range(30): await pg.mouse.wheel(0, -240); await pg.wait_for_timeout(20)
        s2 = await pg.evaluate(ST)
        for _ in range(60): await pg.mouse.wheel(0, 240); await pg.wait_for_timeout(20)
        s3 = await pg.evaluate(ST)
        print('휠', json.dumps([s0, s1, s2, s3]), mx0, mx1)
        if not (s1['z'] > 1.3 and s1['s'] > s0['s'] * 1.3): bad.append(f'휠로 커지지 않아요 {s1}')
        if abs(mx0[0] - mx1[0]) > 3 or abs(mx0[1] - mx1[1]) > 3: bad.append(f'휠 자리가 움직였어요 {mx0} {mx1}')
        if abs(s2['z'] - await pg.evaluate(f'{F}.ZOOM_MAX')) > 1e-6: bad.append(f'최대 확대 {s2}')
        if s3['z'] != 1 or abs(s3['s'] - s0['s']) > 1e-6: bad.append(f'처음 크기보다 작아졌거나 덜 돌아왔어요 {s3} / {s0}')
        # 키운 채로 끝까지 밀기: 지도 끝이 화면 안으로 들어오지 않아요
        await pg.mouse.move(cx, cy)
        for _ in range(8): await pg.mouse.wheel(0, -240); await pg.wait_for_timeout(20)
        tgt = await pg.evaluate(f"(() => {{ const e = document.elementFromPoint({cx}, {cy}); return e ? e.tagName + '.' + (e.getAttribute('class') || '') + '#' + e.id : ''; }})()")
        print('누른 곳', tgt)
        for _ in range(6): await pg.mouse.move(cx - 150, cy - 250); await pg.mouse.down(); await pg.mouse.move(cx + 150, cy + 250, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(400)
        e = await pg.evaluate(f"(() => {{ const r = {F}.rt; return [r.panX, r.panY]; }})()")
        for _ in range(8): await pg.mouse.move(cx + 150, cy + 250); await pg.mouse.down(); await pg.mouse.move(cx - 150, cy - 250, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(400)
        e2 = await pg.evaluate(f"(() => {{ const r = {F}.rt, f = document.querySelector('.frame'); return [r.panX + r.mapW - f.clientWidth, r.panY + r.mapH - f.clientHeight]; }})()")
        print('끝', e, e2)
        if abs(e[0]) > 0.5 or abs(e2[0]) > 0.5 or e2[1] < -0.5: bad.append(f'지도 끝이 화면 안으로 들어와요 {e} {e2}')
        # 배경음악
        m = await pg.evaluate(f"(() => {{ const F = {F}; F.S.bgm = true; const out = []; F.setTab('teachers'); out.push(F.musicWant()); F.setTab('grad'); out.push(F.musicWant()); F.setTab('school'); out.push(F.musicWant()); return out; }})()")
        print('곡', m)
        if m != ['home', 'room', 'home']: bad.append(f'배경음악 {m}')
        if errs: bad.append(f'페이지 오류 {errs[:3]}')
        await ctx.close()
        # 휴대폰: 손가락 두 개 (CDP 터치)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP); await pg.wait_for_timeout(400)
        cdp = await ctx.new_cdp_session(pg)
        async def touch(kind, pts):
            await cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
        t0 = await pg.evaluate(ST)
        await pg.evaluate(f"window.__taps = 0; document.querySelectorAll('#map [id^=\"b-\"]').forEach(g => g.addEventListener('click', () => window.__taps++))")
        cx, cy = 195, 520
        await touch('touchStart', [(cx - 20, cy), (cx + 20, cy)])
        for k in range(1, 9): await touch('touchMove', [(cx - 20 - 12 * k, cy), (cx + 20 + 12 * k, cy)]); await pg.wait_for_timeout(16)
        await touch('touchEnd', [])
        t1 = await pg.evaluate(ST)
        await touch('touchStart', [(cx - 120, cy), (cx + 120, cy)])
        for k in range(1, 11): await touch('touchMove', [(cx - 120 + 11 * k, cy), (cx + 120 - 11 * k, cy)]); await pg.wait_for_timeout(16)
        await touch('touchEnd', [])
        await pg.wait_for_timeout(100)
        t2 = await pg.evaluate(ST)
        taps = await pg.evaluate("window.__taps")
        print('손가락', json.dumps([t0, t1, t2]), taps)
        if not (t1['z'] > 1.5): bad.append(f'벌려도 커지지 않아요 {t1}')
        if t2['z'] != 1 or abs(t2['s'] - t0['s']) > 1e-6: bad.append(f'모으면 처음 크기까지만 {t2} / {t0}')
        if taps: bad.append(f'손가락을 뗀 뒤 건물이 눌렸어요 {taps}')
        if errs: bad.append(f'폰 페이지 오류 {errs[:3]}')
        await b.close()
    print('FAIL ' + ' | '.join(bad) if bad else 'PASS')

asyncio.run(main())
