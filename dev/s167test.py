# 5.2.0.1 시험: 퀘스트 15-6 '동아리 두 곳 발표회'(j25)와 공사장 비버 선생님 크기
# 보는 것
#  1) j25를 하는 동안 오늘 이미 발표회를 열었어도, 아직 무대에 안 선 동아리는 바로 열 수 있어요(단추도 눌려요). 연 동아리는 내일까지 못 열어요
#  2) 두 곳을 열면 퀘스트가 끝나고, 그 뒤로는 다시 하루 한 번 규칙이에요
#  3) j25가 아닐 때는 예전처럼 하루 한 번(다른 동아리도 못 열어요)
#  4) 공사 중 비버 선생님 크기는 건물 그림 너비(110까지)의 0.30, 건물 오른쪽 아래 모서리
#  5) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s167test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, time
from playwright.async_api import async_playwright
from testlib import URL, F, CLEAN, base, ctxpage
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
PROMOTE = f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 5; S.sem = 1; S.p.species = 6; Object.assign(S.f, {{ classroom: 38, cafeteria: 30, library: 28, playground: 28, science: 18 }});
  for (const k in S.fu) S.fu[k] = S.fu[k].map(() => S.f[k]); S.students = 158; S.tdip = 250; S.grade = 4; S.best = 4;
  S.q.m = F.MAIN.findIndex(q => q.id === 'e39'); S.q.lat = ''; F.checkGrade(); F.promote(); {CLEAN}; F.clubAuto(true);
  F.rt.fakeNow = Date.now() + 10 * 86400000; return S.tier; }})()"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
        if await pg.evaluate(PROMOTE) != 2: bad.append('중학교로 올라가지 못했어요')
        # 1), 2) j25 동안
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S;
          S.q.m = F.MAIN.findIndex(q => q.id === 'j25'); S.q.mb = 0; S.q.lat = ''; S.club.shown = [0, 0, 0, 0, 0];
          const ok0 = F.clubShowGo(0); {CLEAN};
          const day = F.showReady(), c0 = F.showReadyC(0), c1 = F.showReadyC(1), free = F.showQuestFree();
          F.setTab('club'); F.renderClub();
          const dis = [...document.querySelectorAll('#clubBody .club-show')].map(x => x.getAttribute('aria-disabled'));
          const note = document.querySelector('#clubShowNote').textContent;
          const again0 = F.clubShowGo(0); const ok1 = F.clubShowGo(1); {CLEAN};
          const ready = F.mainReady(), c2 = F.showReadyC(2), free2 = F.showQuestFree(), third = F.clubShowGo(2);
          return {{ ok0, day, c0, c1, free, dis, note, again0, ok1, ready, c2, free2, third, shown: S.club.shown, m: F.curMain().id }}; }})()""")
        print('j25 동안', json.dumps(r, ensure_ascii=False))
        if not r['ok0'] or r['day'] or r['c0'] or not r['c1'] or not r['free']: bad.append(f'오늘 연 뒤 안 연 동아리 열기 {r}')
        if r['dis'][0] != 'true' or r['dis'][1] != 'false': bad.append(f'단추 {r["dis"]}')
        if '퀘스트' not in r['note']: bad.append(f'안내 글 {r["note"]}')
        if r['again0'] or not r['ok1'] or not r['ready']: bad.append(f'두 곳 열기와 퀘스트 {r}')
        if r['c2'] or r['free2'] or r['third'] or r['shown'] != [1, 1, 0, 0, 0]: bad.append(f'퀘스트를 마친 뒤에는 하루 한 번 {r}')
        # 3) 다른 퀘스트일 때
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; F.rt.fakeNow += 86400000;
          S.q.m = F.MAIN.findIndex(q => q.id === 'j27'); S.club.shown = [0, 0, 0, 0, 0];
          const ok = F.clubShowGo(3); {CLEAN}; return {{ ok, c4: F.showReadyC(4), go4: F.clubShowGo(4) }}; }})()""")
        print('다른 퀘스트', json.dumps(r))
        if not r['ok'] or r['c4'] or r['go4']: bad.append(f'j25가 아니면 하루 한 번 {r}')
        await ctx.close()
        # 4) 비버 선생님 크기
        now = int(time.time() * 1000)
        s = base(tier=1, bd={k: {'L': v + 1, 's': now - 3600e3, 'e': now + 5 * 3600e3} for k, v in [('classroom', 14), ('playground', 8)]})
        s['q']['m'] = 120; s['q']['mid'] = ''; s['q']['seen'] = 120
        ctx, page, errs2 = await ctxpage(b, 390, 844, 'light', s)
        await page.evaluate(CLEAN); await page.wait_for_timeout(600)
        r = await page.evaluate("""(() => { const out = {}; for (const k of ['classroom', 'playground']) { const g = document.querySelector('#b-' + k), bi = g && g.querySelector('.built .bimg'), h = document.querySelector('#cu-' + k + ' .con-bv .bv-hit');
          if (!bi || !h) { out[k] = null; continue; } const w = +bi.getAttribute('width'), x = +bi.getAttribute('x'), y = +bi.getAttribute('y'), s = +h.getAttribute('width');
          out[k] = { w, s, want: Math.min(w, 110) * 0.3, cx: (+h.getAttribute('x') + s / 2 - x) / w, foot: (+h.getAttribute('y') + s - y) / w }; } return out; })()""")
        print('비버', json.dumps(r))
        for k, v in r.items():
            if not v: bad.append(f'{k} 비버가 없어요'); continue
            if abs(v['s'] - v['want']) > 0.2 or abs(v['cx'] - 0.9) > 0.01 or abs(v['foot'] - 0.84) > 0.01: bad.append(f'{k} 비버 크기와 자리 {v}')
        errs += errs2
        await b.close()
    if errs: bad.append(f'페이지 오류 {errs[:3]}')
    print('\n'.join(bad) if bad else 'PASS')

asyncio.run(main())
