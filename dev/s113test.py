# 3.2.5 시험: 체험학습 출발과 귀환 끊김, 버스 도착 뒤 장면
# 보는 것
#  1) 화면을 버스 쪽으로 당기고 돌아오는 동안 지도 크기(style.width)는 당기기마다 한 번만 바뀌어요(예전에는 매 프레임)
#  2) 떠날 때: 탈 친구가 모두 걸어서 버스 문에 닿은 뒤에 버스가 떠나요(걸어가다 사라지는 친구 없음)
#  3) 떠날 때: 장면이 끝나면 지도 학생 수가 '학생 수 - 떠난 친구'에 맞아요
#  4) 돌아올 때: 장면 동안 보상 창이 열리지 않고, 학생들이 다 내린 뒤에 열려요
#  5) 페이지 오류 없음 (390px, 360px)
# 쓰는 법: python3 wrap.py && python3 s113test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"

SETUP = f"""(async () => {{ const F = {F}, S = F.S, rt = F.rt; S.tier = 1; S.tg = 3; S.students = 60; S.st.trips = 9;
  for (const k of F.facKeys()) S.f[k] = Math.max(S.f[k] || 0, 8); S.bd = {{}}; S.trip.cur = ''; S.trip.kids = 0;
  F.setTab('school'); F.renderMap(); F.syncKids(true); await new Promise(r => setTimeout(r, 1500));
  window.__wch = 0; const mp = document.querySelector('#map'); let w = mp.style.width;
  window.__mo && window.__mo.disconnect();
  window.__mo = new MutationObserver(() => {{ if (mp.style.width !== w) {{ w = mp.style.width; window.__wch++; }} }});
  window.__mo.observe(mp, {{ attributes: true, attributeFilter: ['style'] }}); return true; }})()"""

GO = f"""(async () => {{ const F = {F}, S = F.S, rt = F.rt;
  const id = F.TRIPS[0].id; F.startTrip(id); const n = S.trip.kids;
  const seen = new Set(), t0 = performance.now(); let on = false, lost = [];
  while (performance.now() - t0 < 30000) {{
    await new Promise(r => setTimeout(r, 30));
    for (const k of rt.kids) if (k.rider) seen.add(k);
    for (const k of seen) if (!rt.kids.includes(k) && !k.gone && !lost.includes(k)) lost.push(k);
    const c = document.body.classList.contains('cam-scene'); if (c) on = true; else if (on) break; }}
  await new Promise(r => setTimeout(r, 1500));
  return {{ n, riders: seen.size, lost: lost.length, wch: window.__wch, kids: rt.kids.length, hold: rt.busHold || 0, trip: S.trip.kids, ended: on && !document.body.classList.contains('cam-scene') }}; }})()"""

BACK = f"""(async () => {{ const F = {F}, S = F.S, rt = F.rt; window.__wch = 0;
  S.trip.end = Date.now() - 1000; S.trip.start = S.trip.end - 60000; F.renderTripBtn && F.renderTripBtn();
  const rw = document.querySelector('#mReward'); const n = S.trip.kids;
  F.claimTrip(1);
  const t0 = performance.now(); let on = false, openDuring = false;
  while (performance.now() - t0 < 30000) {{
    await new Promise(r => setTimeout(r, 30));
    const c = document.body.classList.contains('cam-scene'); if (c) {{ on = true; if (!rw.hidden && rt.modalOpen === rw) openDuring = true; }} else if (on) break; }}
  await new Promise(r => setTimeout(r, 800));
  return {{ n, on, openDuring, openAfter: !rw.hidden && rt.modalOpen === rw, wch: window.__wch, trip: S.trip.kids }}; }})()"""


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg); print('  틀림:', msg)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in ((390, 844), (360, 780)):
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            await pg.evaluate(SETUP)
            r = await pg.evaluate(GO)
            print(w, '떠날 때', r)
            ok(r['ended'], f'{w} 떠나는 장면이 끝나지 않아요 {r}')
            ok(r['n'] > 0 and r['riders'] == r['n'], f'{w} 탈 친구 수 {r}')
            ok(r['lost'] == 0, f'{w} 걸어가다 사라진 친구가 있어요 {r}')
            ok(r['wch'] <= 4, f'{w} 지도 크기가 너무 자주 바뀌어요(끊김) {r}')
            ok(r['hold'] == 0, f'{w} busHold가 남아 있어요 {r}')
            await pg.evaluate(CLEAN)
            r2 = await pg.evaluate(BACK)
            print(w, '돌아올 때', r2)
            ok(r2['on'], f'{w} 돌아오는 장면이 없어요 {r2}')
            ok(not r2['openDuring'], f'{w} 장면 동안 보상 창이 열려요 {r2}')
            ok(r2['openAfter'], f'{w} 장면 뒤에 보상 창이 안 열려요 {r2}')
            ok(r2['wch'] <= 4, f'{w} 돌아올 때 지도 크기가 너무 자주 바뀌어요 {r2}')
            ok(r2['trip'] == 0, f'{w} 돌아온 뒤 S.trip.kids {r2}')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
