# 5.3.0.1 시험: 탐험 겹 배경, 전환과 보상, 졸업 연출(설계안 '5.3.0 효과층 마무리')
# 보는 것
#  1) 탐험은 겹 배경(.tm-lay 하늘, 먼 풍경, 바닥)과 앞 장식(#tmFg.lay), 대학원 밖 여섯 지역 모두 겹 그림(작업지시서 104-2)
#  2) 체력 막대에 흰 꼬리(s)가 있고 막대와 같은 너비로 따라가요
#  3) 탭을 빨리 열 번 바꿔도 오류가 없고, 날아가는 잎사귀는 1.5초 안에 모두 사라져요. 탐험 들어갈 때 잎사귀 무리가 쓸려 나가요
#  4) 보상 창: 빛살이 생기고, 받기로 닫으면 도토리가 날아가요. 도토리 값은 연출과 상관없이 그대로
#  5) 졸업식 새 장면이면 꽃잎 층(.cere-fx)이 생기고 식이 끝나면 지워져요
#  6) 움직임 줄이기면 잎사귀, 빛살, 도토리 날기, 꽃잎 모두 없어요
#  7) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s171test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

ROOT = pathlib.Path(__file__).resolve().parent.parent
TABS = ['quests', 'teachers', 'school', 'mini', 'school', 'quests', 'street', 'school', 'teachers', 'school']

async def open_page(b, reduced=False):
    s = base(tier=1, tg=5); s['q']['m'] = 120; s['q']['seen'] = 120
    s['tam'] = {'best': 3, 'party': ['bear', 'rabbit', 'fox'], 'mem': {k: {'lv': 20, 'st': 2, 'sh': 0} for k in ['bear', 'rabbit', 'fox']}, 'seen': 1}
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True, reduced_motion='reduce' if reduced else 'no-preference')
    await ctx.add_init_script("window.__FOREST_TEST = true; window.FS_IMG_BASE = %s;" % json.dumps((ROOT / 'img').as_uri() + '/'))
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(s)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(3600); await pg.evaluate(CLEAN)
    await pg.evaluate(f"(() => {{ document.querySelectorAll('.overlay').forEach(o => o.hidden = true); {F}.rt4.modalOpen = null; }})()")
    return ctx, pg, errs

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--allow-file-access-from-files'])
        ctx, pg, errs = await open_page(b)
        # 3) 탭 빨리 바꾸기
        for t in TABS:
            await pg.evaluate(f"{F}.setTab('{t}')"); await pg.wait_for_timeout(40)
        n0 = await pg.evaluate("document.querySelectorAll('#uiFx img').length")
        await pg.wait_for_timeout(1500)
        n1 = await pg.evaluate("document.querySelectorAll('#uiFx img').length")
        print('잎사귀', n0, n1)
        if n0 < 1 or n1: bad.append(f'탭 넘김 잎사귀 {n0} {n1}')
        # 1) 탐험 겹 배경
        await pg.evaluate(f"{F}.setTab('tam')")
        w = await pg.evaluate("!!document.querySelector('#uiFx .ui-wipe')")
        await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"""(() => {{ const st = document.querySelector('#tmStage'), c = st.querySelector('.tm-bg.cur'); return {{ wipe: {str(w).lower()}, lay: st.classList.contains('lay'), ly: c.querySelectorAll('.tm-lay .ly').length, fg: document.querySelector('#tmFg').classList.contains('lay'), g: !!{F}.tamLay(1), all6: [60, 110, 160, 210, 260].every(f => !!{F}.tamLay(f)), hp: document.querySelectorAll('#tmP .tm-hp s').length }}; }})()""")
        print('탐험', r)
        if not (r['wipe'] and r['lay'] and r['ly'] == 3 and r['fg'] and r['g']): bad.append(f'탐험 겹 배경 {r}')
        if not r['all6']: bad.append('다른 지역 겹 그림이 빠짐')
        if r['hp'] < 1: bad.append(f'체력 흰 꼬리 {r}')
        # 2) 체력 막대와 꼬리 너비(겨루기 중)
        for _ in range(40):
            if await pg.evaluate("document.querySelectorAll('#tmM .tm-f').length > 0"): break
            await pg.wait_for_timeout(250)
        r = await pg.evaluate("(() => { const h = [...document.querySelectorAll('#tmM .tm-hp, #tmP .tm-hp')]; return h.map(e => [e.querySelector('b').style.width, (e.querySelector('s') || {style:{}}).style.width]); })()")
        print('막대', r[:3])
        if not r or any(a != c for a, c in r if a and c): bad.append(f'체력 꼬리 너비 {r}')
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(600)
        # 4) 보상 창
        v0 = await pg.evaluate(f"{F}.S.budget")
        await pg.evaluate(f"{F}.openModalT(document.querySelector('#mSportsEnd'))"); await pg.wait_for_timeout(600)
        bu = await pg.evaluate("!!document.querySelector('#mSportsEnd .rw-burst')")
        await pg.evaluate(f"{F}.closeModalT(document.querySelector('#mSportsEnd'))"); await pg.wait_for_timeout(80)
        ac = await pg.evaluate("document.querySelectorAll('#uiFx .ui-acorn').length")
        v1 = await pg.evaluate(f"{F}.S.budget")
        print('보상', bu, ac, v1 - v0)
        if not bu or ac < 1: bad.append(f'보상 빛살과 도토리 {bu} {ac}')
        if v1 < v0: bad.append(f'도토리 값이 줄어듦 {v0} {v1}')
        await pg.wait_for_timeout(1500)
        # 5) 졸업식
        await pg.evaluate(f"{F}.cere3Load()")
        for _ in range(30):
            if await pg.evaluate(f"{F}.cere3.st") != 'wait': break
            await pg.wait_for_timeout(300)
        st = await pg.evaluate(f"{F}.cere3.st")
        if st == 'ok':
            await pg.evaluate(f"(() => {{ const F = {F}; const crew = F.cereCrew(); crew.c3 = F.cere3Info(); F.showCere({{ school: '유치원' }}, crew); }})()")
            await pg.wait_for_timeout(2500)
            c = await pg.evaluate("[!!document.querySelector('#mCere .cere-fx'), document.querySelectorAll('#mCere .cere-fx img').length]")
            await pg.evaluate(f"{F}.cereEnd(true)"); await pg.wait_for_timeout(300)
            c2 = await pg.evaluate("!!document.querySelector('#mCere .cere-fx')")
            print('졸업식', c, c2)
            if not c[0] or c[1] < 1 or c2: bad.append(f'졸업식 꽃잎 {c} {c2}')
        else: print('졸업식 그림을 못 받아 건너뜀', st)
        bad += [f'(보통) {e}' for e in errs[:3]]; await ctx.close()
        # 6) 움직임 줄이기
        ctx, pg, errs = await open_page(b, reduced=True)
        for t in TABS[:4]:
            await pg.evaluate(f"{F}.setTab('{t}')"); await pg.wait_for_timeout(40)
        await pg.evaluate(f"{F}.openModalT(document.querySelector('#mSportsEnd'))"); await pg.wait_for_timeout(400)
        await pg.evaluate(f"{F}.closeModalT(document.querySelector('#mSportsEnd'))"); await pg.wait_for_timeout(60)
        r = await pg.evaluate("[document.querySelectorAll('#uiFx img').length, !!document.querySelector('#mSportsEnd .rw-burst')]")
        print('움직임 줄이기', r)
        if r != [0, False]: bad.append(f'움직임 줄이기 {r}')
        bad += [f'(움직임 줄이기) {e}' for e in errs[:3]]; await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else 'PASS')

asyncio.run(main())
