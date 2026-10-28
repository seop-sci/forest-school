# 2.0.1 시험: 졸업식 장면과 전학 대화 화면 깜빡임
# 보는 것
#  1) 창(.overlay)은 누를 때 강조색이 투명하고, 전학 대화와 졸업식 장면은 글자 선택이 막혀 있어요(테스터 제보: 다음을 누르면 화면이 잠깐 어두워짐)
#  2) 유치원 졸업식: 졸업식 장면이 먼저 뜨고(졸업생 5명, 학사모 5개, 현수막 "숲속 유치원 졸업식"), 누르면 입학 창, 입학 창을 닫으면 전학 대화
#  3) 초등학교 졸업식: 장면이 5.2초 뒤 저절로 입학 창으로 넘어가요. 뜨자마자 누른 손(0.35초 안)은 넘기지 않아요
#  4) 장면 동안 알림(현장체험학습이 열렸어요)은 장면이 끝난 뒤에 떠요. 뒤로 가기(Escape)로도 넘어가요. 동작 줄이기 설정이면 꽃가루를 숨기고 2.6초 뒤 넘어가요
#  5) 390 밝은 화면과 360 어두운 화면에서 넘치지 않아요(캡처 s73_390.png, s73_360.png). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s73test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel) => { const W = innerWidth; const r = document.querySelector(sel); if (!r) return -1;
  return [...r.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > W + 1 || q.left < -1); }).map(e => e.tagName + '.' + (e.getAttribute('class') || '')); }"""
KG = f"""(() => {{ const F = {F}, S = F.S; S.tier = 0; S.tg = 1; S.p.species = 1; Object.assign(S.f, {{ classroom: 20, cafeteria: 16, library: 14, playground: 14 }});
  for (const k in S.fu) S.fu[k] = S.fu[k].map(() => S.f[k]); S.students = 60; S.tdip = 20; S.grade = 4; S.best = 4;
  S.q.m = F.MAIN.findIndex(q => q.id === 'k1'); S.q.lat = ''; F.checkGrade();
  const can = F.canPromote(); F.promote(); return {{ can, tier: S.tier }}; }})()"""
EL = f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 5; S.p.species = 6; Object.assign(S.f, {{ classroom: 38, cafeteria: 30, library: 28, playground: 28, science: 18 }});
  for (const k in S.fu) S.fu[k] = S.fu[k].map(() => S.f[k]); S.students = 158; S.tdip = 250; S.grade = 4; S.best = 4;
  S.q.m = F.MAIN.findIndex(q => q.id === 'e39'); S.q.lat = ''; F.checkGrade();
  const can = F.canPromote(); F.promote(); return {{ can, tier: S.tier }}; }})()"""
OPEN = "(() => { const m = window.__forest.rt.modalOpen; return m ? m.id : null; })()"
SCENE = """(() => { const a = document.querySelector('#cereArt');
  return { kids: a.querySelectorAll('.cere-kid').length, caps: a.querySelectorAll('.cere-cap').length, cf: a.querySelectorAll('.cere-cf').length,
    ban: (a.querySelector('.cere-ban') || {}).textContent, sub: document.querySelector('#cereSub').textContent,
    cfShown: getComputedStyle(a.querySelector('.cere-cf')).display !== 'none', capAnim: getComputedStyle(a.querySelector('.cere-cap')).animationName }; })()"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            if w == 390:
                # 1) 강조색과 글자 선택
                r = await pg.evaluate("""(() => { const g = (s, p) => getComputedStyle(document.querySelector(s)).getPropertyValue(p);
                  return { tap: g('#mTalk', '-webkit-tap-highlight-color'), tapC: g('#mGrad', '-webkit-tap-highlight-color'), tapBox: g('#talkText', '-webkit-tap-highlight-color'),
                    sel: g('#talkText', 'user-select') || g('#talkText', '-webkit-user-select'), selC: g('#cereSub', 'user-select') || g('#cereSub', '-webkit-user-select') }; })()""")
                print('강조색', json.dumps(r))
                if any(r[k] != 'rgba(0, 0, 0, 0)' for k in ('tap', 'tapC', 'tapBox')): bad.append(f'창 강조색이 투명하지 않아요 {r}')
                if r['sel'] != 'none' or r['selC'] != 'none': bad.append(f'대화 글자 선택이 막히지 않았어요 {r}')
                # 2) 유치원 졸업식
                r = await pg.evaluate(KG); m = await pg.evaluate(OPEN); sc = await pg.evaluate(SCENE)
                print('유치원', json.dumps(r), m, json.dumps(sc, ensure_ascii=False))
                if not r['can'] or r['tier'] != 1: bad.append(f'유치원 졸업식을 열지 못했어요 {r}')
                if m != 'mCere': bad.append(f'졸업식 장면이 먼저 떠야 해요 {m}')
                if sc['kids'] != 5 or sc['caps'] != 5 or sc['cf'] < 20: bad.append(f'장면 그림 {sc}')
                if sc['ban'] != '숲속 유치원 졸업식' or '숲속 초등학교' not in sc['sub']: bad.append(f'장면 글 {sc}')
                if sc['capAnim'] != 'cereCap' or not sc['cfShown']: bad.append(f'움직임 {sc}')
                if not await pg.evaluate("document.querySelector('#toast').hidden"): bad.append('장면 동안 알림이 떠 있어요')
                await pg.wait_for_timeout(50)
                await pg.mouse.click(w / 2, 300); await pg.wait_for_timeout(300)
                if await pg.evaluate(OPEN) != 'mCere': bad.append('뜨자마자 누른 손이 장면을 넘겼어요')
                await pg.wait_for_timeout(2400)
                await pg.screenshot(path='s73_390.png')
                o = await pg.evaluate(OVER, '#mCere')
                if o: bad.append(f'390 장면이 넘쳐요 {o}')
                await pg.mouse.click(w / 2, 300); await pg.wait_for_timeout(400)
                m = await pg.evaluate(OPEN)
                if m != 'mTier': bad.append(f'누르면 입학 창이 떠야 해요 {m}')
                await pg.wait_for_timeout(200)
                tt = await pg.evaluate("document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent")
                if not tt: bad.append('장면 뒤에 미룬 알림이 떠야 해요')
                print('미룬 알림', tt)
                await pg.click('#tierOk'); await pg.wait_for_timeout(400)
                m = await pg.evaluate(OPEN)
                if m != 'mTalk': bad.append(f'입학 창 다음은 전학 대화 {m}')
                # 전학 대화를 끝까지 눌러도 오류 없이 닫혀요
                for _ in range(6):
                    if await pg.evaluate(OPEN) != 'mTalk': break
                    await pg.click('#talkNext'); await pg.wait_for_timeout(250)
                if await pg.evaluate(OPEN): bad.append('전학 대화가 닫히지 않았어요')
            else:
                # 3) 초등학교 졸업식: 저절로 넘어가요
                r = await pg.evaluate(EL); sc = await pg.evaluate(SCENE)
                print('초등학교', json.dumps(r), json.dumps(sc, ensure_ascii=False))
                if not r['can'] or r['tier'] != 2: bad.append(f'초등학교 졸업식을 열지 못했어요 {r}')
                if sc['ban'] != '숲속 초등학교 졸업식' or '숲속 중학교' not in sc['sub'] or sc['kids'] != 5: bad.append(f'초등학교 장면 {sc}')
                await pg.wait_for_timeout(2700)
                await pg.screenshot(path='s73_360.png')
                o = await pg.evaluate(OVER, '#mCere')
                if o: bad.append(f'360 장면이 넘쳐요 {o}')
                if await pg.evaluate(OPEN) != 'mCere': bad.append('2.7초에는 아직 장면이어야 해요')
                if not await pg.evaluate("document.querySelector('#toast').hidden"): bad.append('초등학교 장면 동안 알림이 떠 있어요')
                await pg.wait_for_timeout(2900)
                m = await pg.evaluate(OPEN)
                if m != 'mTier': bad.append(f'5.2초 뒤 입학 창으로 넘어가야 해요 {m}')
                seen = []
                for _ in range(8):
                    seen.append(await pg.evaluate("document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent")); await pg.wait_for_timeout(800)
                print('미룬 알림', seen)
                if not any('현장체험학습' in x for x in seen): bad.append(f'현장체험학습 알림이 장면 뒤에 떠야 해요 {seen}')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        # 4) 뒤로 가기, 동작 줄이기
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
        await pg.evaluate(KG); sc = await pg.evaluate(SCENE)
        print('동작 줄이기', json.dumps(sc, ensure_ascii=False))
        if sc['cfShown'] or sc['capAnim'] != 'none': bad.append(f'동작 줄이기인데 움직여요 {sc}')
        await pg.wait_for_timeout(2900)
        if await pg.evaluate(OPEN) != 'mTier': bad.append('동작 줄이기면 2.6초 뒤 넘어가야 해요')
        await pg.evaluate(CLEAN)
        await pg.evaluate(f"(() => {{ const S = {F}.S; S.tier = 0; }})()")
        await pg.evaluate(EL.replace('S.tier = 1;', 'S.tier = 1;'))
        await pg.wait_for_timeout(100)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        m = await pg.evaluate(OPEN)
        if m != 'mTier': bad.append(f'뒤로 가기로 넘어가야 해요 {m}')
        if errs: bad.append(f'동작 줄이기 페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad) if bad else '', 'FAIL' if bad else 'PASS')

if __name__ == "__main__": asyncio.run(main())
