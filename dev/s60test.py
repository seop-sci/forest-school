# 1.7.3 시험: 배경음악 파일 곡(Suno)
# 보는 것
#  1) 곡 4개(bgm_home, bgm_room, bgm_festival, bgm_play)가 들어 있고, 모두 풀려요. 길이가 잘라 둔 반복 구간과 같아요(앞뒤에 빈 소리가 붙으면 이음매에서 끊겨요)
#  2) 상황마다 곡: 홈 → home, 선생님 탭 → room, 퍼즐과 합치기 → play, 학교 행사 → festival. 파일 곡은 되풀이(loop)로 틀어요
#  3) 배경음악을 끄면 파일 곡이 멈춰요. 1.7.3에서는 테마 곡이 쉬어서 배경 테마를 골라도 홈 곡이 나오고, 상점의 '테마 곡 듣기'는 숨어요(1.8.0에서 테마 곡을 넣으면 다시 고쳐요)
#  4) 파일이 없으면 코드 곡으로 돌아가요(미니게임은 쉬는 시간 곡). 페이지 오류가 없어요
# 쓰는 법: python3 wrap.py && python3 s60test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
LEN = {'bgm_home': 79.5, 'bgm_room': 93.81, 'bgm_festival': 60.46, 'bgm_play': 74.15}

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(SKIP)
        await pg.evaluate(f"(() => {{ const F = {F}; F.S.bgm = true; F.S.cos.th.bg = ''; F.ensureAudio(true); }})()")

        # 1) 곡 풀기와 길이
        r = await pg.evaluate(f"""(async () => {{ const F = {F}, out = {{}};
          for (const k of ['bgm_home', 'bgm_room', 'bgm_festival', 'bgm_play']) {{ const buf = await F.bgmLoad(k); out[k] = buf ? [+buf.duration.toFixed(3), buf.numberOfChannels] : null; }}
          return out; }})()""")
        print('곡 길이', r)
        for k, want in LEN.items():
            if not r.get(k): bad.append(f'{k} 못 풂')
            elif abs(r[k][0] - want) > 0.06: bad.append(f'{k} 길이 {r[k][0]} (기대 {want})')

        async def state(prep):
            await pg.evaluate(f"(() => {{ const F = {F}; {prep}; F.musicSync(); }})()")
            await pg.wait_for_timeout(900)
            return await pg.evaluate(f"(() => {{ const M = {F}.Music; return {{ cur: M.cur, file: !!M.src, loop: !!(M.src && M.src.loop), dur: M.src && M.src.buffer ? +M.src.buffer.duration.toFixed(2) : 0, synth: !!M.track }}; }})()")

        # 2) 상황마다 곡
        cases = [
            ('홈', "F.setTab('school')", 'home', LEN['bgm_home']),
            ('선생님 탭', "F.setTab('teachers')", 'room', LEN['bgm_room']),
            ('퍼즐', "F.pzUI.open = true", 'play', LEN['bgm_play']),
            ('합치기', "F.pzUI.open = false; F.mgUI.open = true", 'play', LEN['bgm_play']),
            ('행사', "F.pzUI.open = false; F.mgUI.open = false; F.setTab('school'); F.rt.fest = { id: 'picnic', t: 30, n: 0, spawn: 0.6, items: [], perf: 0, intro: 3 }", 'festival', LEN['bgm_festival']),
        ]
        for name, prep, want, dur in cases:
            s = await state(prep)
            print(name, s)
            if s['cur'] != want or not s['file'] or not s['loop'] or abs(s['dur'] - round(dur, 2)) > 0.06:
                bad.append(f'{name}: {s}')
        await pg.evaluate(f"{F}.rt.fest = null")

        # 3) 끄기와 테마 곡
        s = await state("F.S.bgm = false")
        if s['cur'] != '' or s['file']: bad.append(f'끄기: {s}')
        s = await state("F.S.bgm = true; F.S.cos.th.bg = 'spring'; F.setTab('school')")
        print('테마 곡', s)
        if s['cur'] != 'home' or not s['file']: bad.append(f'테마를 골라도 홈 곡: {s}')
        hid = await pg.evaluate(f"(() => {{ {F}.setTab('shop'); const b = document.querySelector('.th-play'); const r = b ? b.hidden : 'none'; {F}.setTab('school'); return r; }})()")
        print('테마 곡 듣기 숨김', hid)
        if hid is not True and hid != 'none': bad.append(f'테마 곡 듣기 단추가 보여요: {hid}')

        # 4) 파일이 없을 때
        s = await state("F.S.cos.th.bg = ''; window.__fsAudKeep = window.FS_AUD; window.FS_AUD = null; F.setTab('teachers'); F.pzUI.open = true")
        print('파일 없음', s)
        if s['cur'] != 'play' or s['file'] or not s['synth']: bad.append(f'파일 없음: {s}')
        await pg.evaluate(f"(() => {{ window.FS_AUD = window.__fsAudKeep; {F}.pzUI.open = false; }})()")
        if errs: bad.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    print('FAIL ' + ' | '.join(bad) if bad else 'PASS')

asyncio.run(main())
