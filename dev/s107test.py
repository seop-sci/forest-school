# 3.0.0 시험: 숨은 생물 자리와 체험학습 배웅, 마중
# 보는 것
#  1) 초등학교, 중학교, 고등학교 지도의 생물 자리 6곳 모두 누르는 칸 다섯 점이 건물 누르는 칸이나 이름표에 가리지 않아요(390px, 360px)
#  2) 생물 자리가 위쪽 칸(.board)보다 아래에 있어요
#  3) 체험학습 떠날 때와 돌아올 때: 배웅, 마중 친구가 다 모인 뒤에 장면이 끝나요(마지막 순간 남은 거리 4 아래)
#  4) 장면 동안 화면이 1.5배 넘게 당겨졌다가 원래 확대와 자리로 돌아오고, 아래 칩 숨김(cam-scene)이 풀려요
#  5) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s107test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"


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
            for tier, tg in ((1, 3), (2, 0), (3, 0))[:await pg.evaluate(f"{F}.BX_SPOT.length - 1")]:   # 3.0.0 전에는 고등학교가 없어요
                r = await pg.evaluate(f"""(async () => {{ const F = {F}, S = F.S; S.tier = {tier}; S.tg = {tg}; S.sem = 0;
                  for (const k of F.facKeys()) S.f[k] = Math.max(S.f[k] || 0, 8); S.bd = {{}};
                  S.bx.m = {tier}; S.bx.sp = F.BX_SPOT[{tier}].map((_, i) => ({{ i, id: 'bio_ladybug', t: 0 }})); S.bx.next = Date.now() + 9e9;
                  F.setTab('school'); F.renderMap(); F.renderDeco(true); await new Promise(r => setTimeout(r, 600));
                  const sc = document.querySelector('#scroller'); if (sc) sc.scrollTop = 0;
                  const hud = document.querySelector('.board').getBoundingClientRect().bottom, out = [];
                  for (let i = 0; i < 6; i++) {{ const el = document.querySelector('.bx-hit[data-bx="' + i + '"]'); if (!el) {{ out.push([i, 'none']); continue; }}
                    el.scrollIntoView({{ block: 'center' }}); await new Promise(r => setTimeout(r, 120));
                    const rc = el.getBoundingClientRect(); let n = 0;
                    for (const [fx, fy] of [[.5, .5], [.25, .3], [.75, .3], [.25, .75], [.75, .75]]) if (document.elementFromPoint(rc.left + rc.width * fx, rc.top + rc.height * fy) === el) n++;
                    if (sc) sc.scrollTop = 0; await new Promise(r => setTimeout(r, 60));
                    const top = el.getBoundingClientRect().top;
                    if (n < 5 || top < hud) out.push([i, F.BX_SPOT[{tier}][i], n, Math.round(top - hud)]); }}
                  S.bx.sp = []; F.renderDeco(true); return out; }})()""")
                print(w, '생물 자리', tier, r)
                ok(not r, f'{w} 학교급 {tier} 생물 자리가 가려져요 {r}')
            for mode in ('go', 'back'):
                r = await pg.evaluate(f"""(async () => {{ const F = {F}, S = F.S, rt = F.rt; S.tier = 1; S.tg = 2; S.students = 60; for (const k of F.facKeys()) S.f[k] = Math.max(S.f[k] || 0, 8);
                  F.setTab('school'); F.renderMap(); F.syncKids(true); await new Promise(r => setTimeout(r, 1500));
                  const z0 = rt.zoom || 1, p0 = [rt.panX, rt.panY]; let zmax = z0, last = null, done = false, hid = false;
                  if ('{mode}' === 'back') S.trip.kids = 3;
                  F.busScene('{mode}', 3, () => {{ done = true; }});
                  const t0 = performance.now();
                  while (!done && performance.now() - t0 < 20000) {{ await new Promise(r => setTimeout(r, 50)); zmax = Math.max(zmax, rt.zoom || 1); hid = hid || document.body.classList.contains('cam-scene');
                    const tr = rt.kids.filter(k => k.trip); if (tr.length) last = Math.max(...tr.map(k => Math.hypot(k.x - k.tx, k.y - k.ty))); }}
                  await new Promise(r => setTimeout(r, 1000));
                  return {{ done, zmax: +zmax.toFixed(2), z: +(rt.zoom || 1).toFixed(2), z0, pan: [Math.round(rt.panX - p0[0]), Math.round(rt.panY - p0[1])], last: last == null ? null : +last.toFixed(1), hid, cls: document.body.classList.contains('cam-scene') }}; }})()""")
                print(w, '체험학습', mode, r)
                ok(r['done'] and r['last'] is not None and r['last'] < 4, f'{w} {mode} 친구들이 다 모이기 전에 끝나요 {r}')
                ok(r['zmax'] >= 1.5 and r['z'] == r['z0'] and r['pan'] == [0, 0], f'{w} {mode} 화면 당기기와 돌아오기 {r}')
                ok(r['hid'] and not r['cls'], f'{w} {mode} 아래 칩 숨김 {r}')
            ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

asyncio.run(main())
