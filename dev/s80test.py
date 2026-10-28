# 2.1.0 시험: 학기(1학기 방학식과 2학기 종업식)
# 보는 것
#  1) 유치원은 그대로: 종업식 한 번에 다음 해
#  2) 초등학교 1학기: 앞 절반 퀘스트('1학기 방학식' 퀘스트)까지 와야 1학기 방학식. 수료증 절반, 학년(tg)과 전학생은 그대로, 시설 상한 +2, 2학기 동네 기준 반 단계라 대도시가 풀려요
#  3) 2학기 종업식: 학년이 오르고 1학기로, 새 친구, 시설 상한 +3(한 학년에 +5), 수료증은 한 해 몫에서 방학식 몫을 뺀 나머지
#  2.1.0 두 학기 2차: 시설 창 '더 올리려면' 글이 1학기면 방학식, 2학기면 종업식
#  4) 졸업반: 1학기에는 졸업식을 못 열고 방학식, 2학기에 졸업식
#  5) 저장: 학기가 없던 옛 저장은 초등학교부터 2학기, 유치원은 1학기. 망가진 값은 고쳐요
#  6) 390 밝은, 360 어두운 화면에서 졸업 탭과 방학식 창이 넘치지 않아요(캡처 s80_*). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s80test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'
CITY = f"(() => {{ const F = {F}, S = F.S; let n = 0; while (F.gradeOf(F.rep()) < 4 && n < 200) {{ S.f.library += 1; n++; }} F.checkGrade(); return S.grade; }})()"
SEMG = f"(() => {{ const F = {F}, S = F.S; const i = F.MAIN.findIndex(q => q.sy === S.tg + 1 && (q.yt || 1) === S.tier); if (i >= 0) S.q.m = i; return i; }})()"
GATE = f"(() => {{ const F = {F}, S = F.S; const i = F.MAIN.findIndex(q => q.ye === S.tg + 1 && (q.yt || 1) === S.tier); if (i >= 0) S.q.m = i; return i; }})()"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(T.SKIP)
            if w == 390:
                # 1) 유치원
                await pg.evaluate(CITY)
                r = await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; const a = [F.semOn(), F.canGraduate(), S.tg]; F.graduate(); return [...a, S.tg, S.sem]; }})()")
                print('유치원', r)
                if r != [False, True, 0, 1, 0]: bad.append(f'유치원 종업식이 바뀌었어요 {r}')
                await pg.evaluate(T.CLEAN)
                # 2) 초등학교 1학기
                await pg.evaluate(f"(() => {{ const S = {F}.S; S.tier = 1; S.tg = 1; S.sem = 0; S.yearEarned = 5e9; }})()")
                await pg.evaluate(CITY)
                await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; S.q.m = F.MAIN.findIndex(q => q.ch === 6); }})()")
                r = await pg.evaluate(f"(() => {{ const F = {F}; return [F.canGraduate(), F.facCap()]; }})()")
                if r[0]: bad.append(f'1학기 앞 절반 퀘스트 전에 방학식이 열려요 {r}')
                await pg.evaluate("(() => { const F = window.__forest, S = F.S; S.f.library = F.facCap(); S.fu.library = S.fu.library.map(() => S.f.library); F.openSheet('library'); })()")
                t = await pg.evaluate("document.querySelector('#sheetNeed').textContent")
                if '1학기 방학식을 열면 Lv.25까지' not in t: bad.append(f'1학기 상한 안내가 틀려요 {t}')
                await pg.evaluate("window.__forest.closeSheet()")
                await pg.evaluate(SEMG)
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const o = {{ locked: F.yearLocked(), can: F.canGraduate(), full: F.previewDip(), half: F.cereDip(), cap0: F.facCap(), sp0: S.p.species, dip0: S.p.dip }};
                  F.graduate(); o.tg = S.tg; o.sem = S.sem; o.grade = S.grade; o.cap = F.facCap(); o.sp = S.p.species; o.got = S.p.dip - o.dip0; o.sems = S.st.sems; o.label = F.semLabel();
                  return o; }})()""")
                print('1학기 방학식', r)
                if not r['locked'] or not r['can'] or r['grade'] >= 4 or r['half'] != -(-r['full'] // 2) or r['got'] != r['half'] or r['tg'] != 1 or r['sem'] != 1 or r['cap'] != r['cap0'] + 2 or r['sp'] != r['sp0'] or r['sems'] != 1 or r['label'] != '2학기':
                    bad.append(f'1학기 방학식이 틀려요 {r}')
                await pg.wait_for_timeout(500)
                r = await pg.evaluate("[document.querySelector('#gradTitle').textContent, document.querySelector('#gradOk').textContent]")
                print('방학식 창', r)
                if r != ['초등학교 2학년 1학기 방학식', '2학기 시작하기']: bad.append(f'방학식 창 글이 틀려요 {r}')
                await pg.screenshot(path=f's80_break_{w}.png')
                await pg.evaluate(T.CLEAN)
                # 3) 2학기: 대도시여도 퀘스트가 남으면 막히고, 마치면 종업식
                await pg.evaluate(f"(() => {{ const S = {F}.S; S.q.m = {F}.MAIN.findIndex(q => q.ch === 6); S.yearEarned = 5e9; }})()")
                t = await pg.evaluate("(() => { const F = window.__forest, S = F.S; S.f.library = F.facCap(); S.fu.library = S.fu.library.map(() => S.f.library); F.openSheet('library'); const t = document.querySelector('#sheetNeed').textContent; F.closeSheet(); return t; })()")
                if '2학기 종업식을 열면 Lv.28까지' not in t: bad.append(f'2학기 상한 안내가 틀려요 {t}')
                await pg.evaluate(CITY)
                r = await pg.evaluate(f"(() => {{ const F = {F}; return [F.semFirst(), F.yearLocked(), F.canGraduate()]; }})()")
                if r != [False, True, False]: bad.append(f'2학기 퀘스트 잠금이 틀려요 {r}')
                await pg.evaluate(GATE)
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const o = {{ can: F.canGraduate(), cap0: F.facCap(), sp0: S.p.species, full: F.previewDip(), semDip: S.semDip, d: F.cereDip(), dip0: S.p.dip }}; F.graduate();
                  return {{ ...o, tg: S.tg, sem: S.sem, cap: F.facCap(), sp: S.p.species, got: S.p.dip - o.dip0, semDip2: S.semDip }}; }})()""")
                print('2학기 종업식', r)
                if not r['can'] or r['tg'] != 2 or r['sem'] != 0 or r['cap'] != r['cap0'] + 3 or r['sp'] != r['sp0'] + 1 or r['d'] != max(0, r['full'] - r['semDip']) or r['got'] != r['d'] or r['semDip2'] != 0: bad.append(f'2학기 종업식이 틀려요 {r}')
                await pg.wait_for_timeout(500)
                t = await pg.evaluate("document.querySelector('#gradTitle').textContent")
                if t != '초등학교 2학년 종업식': bad.append(f'종업식 창 제목이 틀려요 {t}')
                await pg.evaluate(T.CLEAN)
                # 4) 졸업반
                await pg.evaluate(f"(() => {{ const S = {F}.S; S.tg = 5; S.sem = 0; S.q.m = {F}.MAIN.findIndex(q => q.t === 'tier' && q.n === 2); }})()")
                await pg.evaluate(CITY)
                r = await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; const a = [F.finalYear(), F.canPromote(), F.canGraduate()]; F.graduate(); return [...a, S.tg, S.sem, F.canGraduate()]; }})()")
                print('졸업반 1학기', r)
                if r != [True, False, True, 5, 1, False]: bad.append(f'졸업반 1학기가 틀려요 {r}')
                await pg.evaluate(T.CLEAN); await pg.evaluate(CITY)
                r = await pg.evaluate(f"{F}.canPromote()")
                if not r: bad.append('졸업반 2학기에 졸업식을 못 열어요')
                # 5) 저장
                r = await pg.evaluate(f"""(() => {{ const F = {F}; const d = JSON.parse(JSON.stringify(F.S)); delete d.sem; d.tier = 1; const a = F.sanitize(d).sem;
                  const d2 = JSON.parse(JSON.stringify(F.S)); delete d2.sem; d2.tier = 0; const b2 = F.sanitize(d2).sem;
                  const d3 = JSON.parse(JSON.stringify(F.S)); d3.sem = 7; d3.tier = 1; const c = F.sanitize(d3).sem;
                  const d4 = JSON.parse(JSON.stringify(F.S)); d4.sem = 0; d4.tier = 1; const e = F.sanitize(d4).sem; return [a, b2, c, e]; }})()""")
                print('저장', r)
                if r != [1, 0, 1, 0]: bad.append(f'학기 저장 읽기가 틀려요 {r}')
            # 6) 졸업 탭 화면
            await pg.evaluate(T.CLEAN)
            await pg.evaluate(f"(() => {{ const S = {F}.S; S.tier = 1; S.tg = 2; S.sem = 0; }})()")
            await pg.evaluate(CITY)
            await pg.evaluate("document.querySelector('[data-tab=\"grad\"]').click()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(() => { const b = document.querySelector('#gBtn'), r = b.getBoundingClientRect(), y = document.querySelector('#schoolYear').getBoundingClientRect();
              return { t: b.textContent, yr: document.querySelector('#gYear').textContent, note: document.querySelector('#yearNote').textContent, over: r.right > innerWidth + 1 || y.right > innerWidth + 1 }; })()""")
            print(w, '졸업 탭', r)
            if not r['t'].startswith('1학기 방학식 열기') or r['yr'] != '초등학교 3학년 1학기' or r['note'] != '1학기' or r['over']: bad.append(f'{w} 졸업 탭이 틀려요 {r}')
            await pg.screenshot(path=f's80_grad_{w}.png')
            await pg.evaluate("document.querySelector('[data-tab=\"home\"]') && document.querySelector('[data-tab=\"home\"]').click()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f's80_home_{w}.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
