# 1.7.4 시험: 메인 퀘스트 '침입자 쫓아내기'(h1)
# 보는 것
#  1) 1장 부엉이 선생님 다음, 학생 30명 앞에 있어요. 퀘스트 글이 '매나 뱀 쫓아내기'
#  2) 이 퀘스트가 되면 홈에서 몇 초 안에 매나 뱀이 와요. 놓쳐도 40초 안에 다시 와요
#  3) 쫓아내면 퀘스트가 끝나고(받을 수 있음), 그 뒤로는 다시 드문드문(12분 넘게 뒤)
#  4) 퀘스트를 누르면(바로 가기) 곧 와요
#  5) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s64test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const t = document.querySelector('#tut'); if (t) t.hidden = true; S.tut.st = 'skip'; F.rt.tut = null; {CLEAN};
          const ids = F.MAIN.map(q => q.id), i = ids.indexOf('h1');
          S.q.m = i; S.q.mb = S.st.trials || 0; S.q.lat = ''; F.rt.trialT = 999; F.rt.trial && F.endTrial(true); F.setTab('school');
          const orig = j => {{ while (j >= 0 && j < ids.length && (F.MAIN[j].step || ids[j] === 'bf1')) j += j < i ? -1 : 1; return ids[j]; }};   // 2.1.1 한 단계 퀘스트와 단짝 퀘스트는 건너뛰고 봐요
          return {{ i, prev: orig(i - 1), next: orig(i + 1), ch: F.MAIN[i].ch, hunt: F.trialHunt() }}; }})()""")
        print('자리', r)
        if r['prev'] != 'q7' or r['next'] != 'z1' or r['ch'] != 1 or not r['hunt']: bad.append(f'자리 {r}')
        txt = await pg.evaluate("document.querySelector('#questBar') ? document.querySelector('#questBar').textContent : ''")
        if '매나 뱀' not in txt and '침입자' not in txt: bad.append(f'퀘스트 칸 글 {txt[:80]}')
        await pg.wait_for_timeout(4500)
        r = await pg.evaluate(f"(() => {{ const T = {F}.rt.trial; return T ? {{ kind: T.kind, hp: T.hp }} : null; }})()")
        print('바로 옴', r)
        if not r: bad.append('퀘스트가 되었는데 매나 뱀이 바로 오지 않아요')
        # 놓치기 → 40초 안에 다시
        if r:
            await pg.evaluate(f"(() => {{ {CLEAN}; {F}.endTrial(false); {CLEAN}; }})()")
            t = await pg.evaluate(f"{F}.rt.trialT")
            print('놓친 뒤 남은 시간', t)
            if not (0 <= t <= 40): bad.append(f'놓친 뒤 다시 오는 시간 {t}')
            await pg.evaluate(f"(() => {{ {F}.rt.trialT = 0.5; }})()"); await pg.wait_for_timeout(1500)
            # 쫓아내기
            r = await pg.evaluate(f"""(() => {{ const F = {F}; if (!F.rt.trial) return 'none'; let n = 0; while (F.rt.trial && n < 40) {{ F.hitTrial(); n++; }}
              {CLEAN}; return {{ n, trials: F.S.st.trials, ready: F.mainReady(), hunt: F.trialHunt() }}; }})()""")
            print('쫓아냄', r)
            if r == 'none' or not r['ready'] or r['hunt']: bad.append(f'쫓아낸 뒤 퀘스트 {r}')
            await pg.wait_for_timeout(1200)
            t = await pg.evaluate(f"{F}.rt.trialT")
            print('끝난 뒤 다음', t)
            if t < 600: bad.append(f'퀘스트를 마친 뒤에도 자주 와요 {t}')
        # 바로 가기
        await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.q.m = F.MAIN.findIndex(q => q.id === 'h1'); S.q.mb = S.st.trials; S.q.lat = ''; F.rt.trialT = 500; F.goTo(F.MAIN[S.q.m]); }})()""")
        has = await pg.evaluate(f"typeof {F}.goTo")
        if has == 'function':
            t = await pg.evaluate(f"{F}.rt.trialT")
            print('바로 가기 뒤', t)
            if t > 3: bad.append(f'바로 가기를 눌러도 곧 오지 않아요 {t}')
        if errs: bad.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    print('FAIL ' + ' | '.join(bad) if bad else 'PASS')

asyncio.run(main())
