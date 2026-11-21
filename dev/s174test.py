# 5.3.1 시험: 자연 소리(src/js/07-sound-music.js의 AMB, ambWant, ambSync)
# 보는 것
#  1) 설정의 '자연 소리' 단추 넷(끄기, 작게, 보통, 크게)이 S.ambV와 맞고, 누르면 바뀌어 저장돼요
#  2) 옛 저장(ambV 없음)은 보통(2), 배경음악과 효과음을 다 꺼 둔 옛 저장은 끄기(0)
#  3) 홈 지도에서만 바탕 소리 한 겹(시각에 맞는 아침, 낮, 노을, 밤). 다른 탭과 끄기에서는 없음
#  4) 비(rt.ambWx='rain')는 빗소리가 겹치고 바탕이 줄어요. 물가(rt.ambWater)는 물소리
#  5) 소리를 켜면 그 겹이 실제로 풀려서 되풀이로 틀어져요(시험판에 글자로 넣은 amb_ 파일)
#  6) 앱 판에서는 웹에서 받는 소리(webAud)
#  7) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s174test.py   (마지막 줄이 PASS면 통과)
import asyncio, datetime, json
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base

def want_base():
    h = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)).hour
    return 'amb_night' if h >= 20 or h < 6 else 'amb_morning' if h < 9 else 'amb_evening' if h >= 17 else 'amb_day'

async def open_page(b, save):
    ctx = await b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(CLEAN)
    return ctx, pg, errs

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        # 2) 옛 저장
        s0 = base(tier=1); s0.pop('ambV', None)
        ctx, pg, errs = await open_page(b, s0)
        v = await pg.evaluate(f"{F}.S.ambV")
        if v != 2: bad.append(f'옛 저장 기본 {v}')
        r = await pg.evaluate(f"{F}.sanitize(Object.assign(JSON.parse(JSON.stringify({F}.S)), {{ ambV: undefined, sound: false, bgm: false }})).ambV")
        if r != 0: bad.append(f'소리를 다 끈 옛 저장 {r}')
        r = await pg.evaluate(f"{F}.sanitize(Object.assign(JSON.parse(JSON.stringify({F}.S)), {{ ambV: 3 }})).ambV")
        if r != 3: bad.append(f'저장된 크게 {r}')
        # 3) 홈 지도의 바탕 소리
        w = await pg.evaluate(f"{F}.ambWant()")
        print('홈', w, '기대', want_base())
        if list(w.keys()) != [want_base()] or w[want_base()] != 1: bad.append(f'홈 바탕 소리 {w}')
        # 4) 비와 물가
        w = await pg.evaluate(f"(() => {{ {F}.rt.ambWx = 'rain'; {F}.rt.ambWater = 0.5; const w = {F}.ambWant(); {F}.rt.ambWx = ''; {F}.rt.ambWater = 0; return w; }})()")
        print('비와 물가', w)
        if w.get('amb_rain') != 1 or abs(w.get(want_base(), 0) - 0.45) > 1e-9 or abs(w.get('amb_water', 0) - 0.4) > 1e-9: bad.append(f'비와 물가 {w}')
        # 1) 설정 단추
        await pg.evaluate(f"{F}.setTab('settings')")
        await pg.wait_for_timeout(300)
        r = await pg.evaluate("[...document.querySelectorAll('#optAmb [data-amb]')].map(b => b.getAttribute('aria-checked'))")
        if r != ['false', 'false', 'true', 'false']: bad.append(f'설정 단추 표시 {r}')
        ov = await pg.evaluate("(() => { const s = document.querySelector('#optAmb'), row = s.closest('.srow'); return s.getBoundingClientRect().right <= row.getBoundingClientRect().right + 0.5 && row.scrollWidth <= row.clientWidth + 1; })()")
        if not ov: bad.append('360px에서 자연 소리 줄이 넘쳐요')
        w = await pg.evaluate(f"{F}.ambWant()")
        if w: bad.append(f'설정 탭에서도 자연 소리 {w}')
        await pg.click('#optAmb [data-amb="0"]')
        r = await pg.evaluate(f"[{F}.S.ambV, JSON.parse(localStorage.getItem('forest-school-v1')).ambV, document.querySelector('#optAmb [data-amb=\"0\"]').getAttribute('aria-checked')]")
        if r != [0, 0, 'true']: bad.append(f'끄기 누름 {r}')
        await pg.evaluate(f"{F}.setTab('school')")
        w = await pg.evaluate(f"{F}.ambWant()")
        if w: bad.append(f'끄기인데 자연 소리 {w}')
        # 5) 실제로 틀기
        await pg.evaluate(f"{F}.setTab('settings')"); await pg.wait_for_timeout(200)
        await pg.click('#optAmb [data-amb="2"]')
        await pg.evaluate(f"{F}.setTab('school')")
        await pg.wait_for_timeout(2500)
        r = await pg.evaluate(f"(() => {{ const L = {F}.AMB.lay, k = Object.keys(L); return {{ k, src: k.map(x => !!(L[x].src && L[x].src.loop)), out: {F}.AMB.out ? +{F}.AMB.out.gain.value.toFixed(2) : -1 }}; }})()")
        print('틀기', r)
        if r['k'] != [want_base()] or r['src'] != [True]: bad.append(f'바탕 소리 틀기 {r}')
        # 6) 앱 판은 웹에서
        src = await pg.evaluate("document.documentElement.outerHTML.includes(\"'amb_water']), AUD_V\")")
        if not src: bad.append('WEB_AUD에 자연 소리가 없어요')
        bad += [f'오류 {e}' for e in errs[:3]]
        await ctx.close(); await b.close()
    print('\n'.join(bad) if bad else '')
    print('FAIL' if bad else 'PASS')

asyncio.run(main())
