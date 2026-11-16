# 146번 시험(5.0.2 끊김 줄이기): 화면을 쓸데없이 다시 쓰지 않는지 세어요
# 시간(ms)은 기계마다 흔들려서 출력만 하고, PASS 기준은 1초 동안 화면이 바뀐 횟수(MutationObserver)예요
#  1) 지도가 가려진 탭(퀘스트)에서 지도 학생(.kid)의 transform 바뀜 0회/초 (홈에서는 움직여요)
#  2) 건물 창에서 걷는 친구들(#roomWalk)의 자식 바뀜 5회/초 아래
#  3) 숲속 합치기에서 가만히 있을 때 광고 단추(#mgAdBtn) 바뀜 0회/초
#  4) 선생님 탭의 글자와 속성 바뀜 20회/초 아래
#  5) 켤 때 지금 지도가 아닌 지도와 졸업식 그림은 받지 않아요(마지막 학년이 아니면)
# 쓰는 법: python3 wrap.py && python3 s146test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from testlib import ctxpage, base, F, CLEAN
COUNT = """async (a) => { const [sel, opt, ms, pick] = a; const root = document.querySelector(sel); let n = 0;
  const mo = new MutationObserver(rs => { for (const r of rs) { if (pick && !(r.target.closest && r.target.closest(pick)) && !(r.target.parentElement && r.target.parentElement.closest(pick))) continue; n++; } });
  mo.observe(root, opt); const t0 = performance.now(); let frames = 0, busy = 0, last = t0;
  await new Promise(res => { const f = t => { frames++; const d = t - last; if (d > 20) busy += d - 16.7; last = t; if (t - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  mo.disconnect(); const sec = (performance.now() - t0) / 1000; return { per: +(n / sec).toFixed(1), fps: Math.round(frames / sec), late: Math.round(busy / sec) }; }"""
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, page, errs = await ctxpage(b, 390, 800, 'light', base(tier=1, tg=1, students=40))
        await page.evaluate(CLEAN); await page.wait_for_timeout(1500)
        kidOpt = {'attributes': True, 'subtree': True, 'attributeFilter': ['transform']}
        r = await page.evaluate(COUNT, ['#map', kidOpt, 2000, '.kid']); print('홈: 학생 transform', r)
        ok(r['per'] > 20, '홈에서는 학생이 걸어요')
        await page.evaluate(f"{F}.setTab('quests')"); await page.wait_for_timeout(400)
        r = await page.evaluate(COUNT, ['#map', kidOpt, 2000, '.kid']); print('퀘스트 탭: 학생 transform', r)
        ok(r['per'] == 0, f"지도가 가려진 탭에서 학생 transform 0회/초 {r['per']}")
        await page.evaluate(f"{F}.setTab('school')"); await page.wait_for_timeout(400)
        r = await page.evaluate(COUNT, ['#map', kidOpt, 1000, '.kid']); ok(r['per'] > 20, '홈으로 돌아오면 다시 걸어요')
        # 2) 건물 창
        await page.evaluate(f"(()=>{{ const F={F}; F.S.t.squirrel = Math.max(1, F.S.t.squirrel); F.openSheet('classroom'); }})()"); await page.wait_for_timeout(900)
        n = await page.evaluate("document.querySelectorAll('#roomWalk .wk').length")
        # 방을 새로 그릴 때(레벨, 추천 가구가 바뀔 때) 걷는 친구를 새로 만드는 것은 세지 않고, 이미 있던 친구를 다시 붙이는 것(줄 세우기)만 세요
        r = await page.evaluate("""async (ms) => { const g = document.querySelector('#roomWalk'); let seen = new Set(g.children), n = 0;
          const mo = new MutationObserver(rs => { for (const r of rs) for (const x of r.addedNodes) { if (seen.has(x)) n++; else seen.add(x); } });
          mo.observe(g, { childList: true }); await new Promise(res => setTimeout(res, ms)); mo.disconnect(); return { per: +(n / (ms / 1000)).toFixed(1) }; }""", 2500); print('건물 창: 걷는 친구', n, '명, 다시 붙임', r)
        ok(n >= 2 and r['per'] < 5, f"건물 창 #roomWalk 자식 바뀜 5회/초 아래 {r['per']}")
        r2 = await page.evaluate(COUNT, ['#roomWalk', {'attributes': True, 'subtree': True, 'attributeFilter': ['transform']}, 1000, '']); print('  걷기 transform', r2)
        ok(0 < r2['per'] <= 40 * n, '걷기는 1초에 30번쯤')
        await page.evaluate(f"(()=>{{ const F={F}; if (F.closeSheet) F.closeSheet(); else document.querySelector('#sheetClose') && document.querySelector('#sheetClose').click(); {CLEAN}; F.rt.sheetKey = null; }})()"); await page.wait_for_timeout(300)
        # 3) 합치기
        await page.evaluate(f"(()=>{{ const F={F}; F.S.tier = Math.max(F.S.tier, 1); F.setTab('mini'); F.mgOpen(); }})()"); await page.wait_for_timeout(800)
        r = await page.evaluate(COUNT, ['#mgAdBtn', {'childList': True, 'attributes': True, 'subtree': True, 'characterData': True}, 2000, '']); print('합치기: 광고 단추 바뀜', r)
        ok(r['per'] == 0, f"합치기에서 가만히 있을 때 #mgAdBtn 바뀜 0회/초 {r['per']}")
        r = await page.evaluate(COUNT, ['#mgScene', {'childList': True, 'attributes': True, 'subtree': True, 'characterData': True}, 2000, '']); print('  합치기 화면 전체 바뀜', r)
        await page.evaluate(f"(()=>{{ const F={F}; F.mgUI.open = false; const s = document.querySelector('#mgScene'); if (s) s.hidden = true; {CLEAN}; }})()")
        # 4) 선생님 탭
        await page.evaluate(f"{F}.setTab('teachers')"); await page.wait_for_timeout(500)
        r = await page.evaluate(COUNT, ['#panelTeachers', {'childList': True, 'attributes': True, 'subtree': True, 'characterData': True}, 2000, '']); print('선생님 탭: 바뀜', r)
        ok(r['per'] < 20, f"선생님 탭 글자 바뀜 20회/초 아래 {r['per']}")
        ok(not errs, f'오류 없음 {errs[:2]}')
        await ctx.close()
        # 5) 켤 때 받는 그림: 지도는 지금 것만, 졸업식 그림은 마지막 학년에
        for tg, want in ((1, False), (5, True)):
            ctx = await b.new_context(viewport={'width': 390, 'height': 800})
            import json
            await ctx.add_init_script("window.__FOREST_TEST = true; window.FS_IMG_BASE = '../img/'; localStorage.setItem('forest-school-v1', %s);" % json.dumps(json.dumps(base(tier=1, tg=tg, sem=1))))
            page = await ctx.new_page(); reqs = []
            page.on('request', lambda q: reqs.append(q.url.split('/img/')[-1].split('?')[0]) if '/img/' in q.url else None)
            from s4test import URL
            await page.goto(URL); await page.wait_for_timeout(3500)
            fin = await page.evaluate(f"{F}.S && ({F}.finalYear ? {F}.finalYear() : null)")
            maps = sorted(u for u in reqs if u.startswith('maps/map_')); c3 = [u for u in reqs if u.startswith('cere3/')]
            print(f'켤 때(초등학교 {tg + 1}학년): 지도 {maps}, 졸업식 그림 {len(c3)}장, 마지막 학년 {fin}')
            ok(maps == ['maps/map_elem.webp'], f'켤 때 지금 지도만 받아요 {maps}')
            ok((len(c3) > 0) == want, f'졸업식 그림은 마지막 학년에만 미리 받아요 (학년 {tg + 1}, {len(c3)}장)')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')
    sys.exit(1 if bad else 0)
asyncio.run(main())
