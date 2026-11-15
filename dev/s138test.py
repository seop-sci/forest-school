# 4.4.2 시험: 평소에는 학생이 지도 그림의 길(MAP_PATHS)로만 걷고, 탐험 자동 편성이 더 센 조합이면 단추가 강조돼요
# 쓰는 법: python3 wrap.py && python3 s138test.py   (마지막 줄이 PASS면 통과)
import asyncio, math, sys
from playwright.async_api import async_playwright
from s4test import base, ctxpage
bad = []
# 길 그래프의 선에서 얼마나 떨어졌는지(지도 칸). 자리 둘레 흩어짐(2.5)과 걸음 사이 여유를 더해 5칸까지 괜찮아요
FAR = 5
GRAPH = """() => { const F = window.__forest, G = F.geo(), gi = F.GEO.indexOf(G), E = F.MAP_PATHS[gi] || [], SP = G.spots, segs = [];
  for (const [a, b, mid] of E) { const p = [SP[a]].concat(mid, [SP[b]]); for (let i = 1; i < p.length; i++) segs.push([p[i-1][0], p[i-1][1], p[i][0], p[i][1]]); }
  return { gi, segs, kids: F.rt4.kids.length }; }"""
def dseg(x, y, s):
    x0, y0, x1, y1 = s; dx, dy = x1 - x0, y1 - y0; L = dx * dx + dy * dy or 1
    t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / L)); return math.hypot(x - x0 - t * dx, y - y0 - t * dy)
async def walk(b, name, sv):
    ctx, pg, errs = await ctxpage(b, 390, 844, 'light', sv)
    g = await pg.evaluate(GRAPH)
    if not g['segs']: bad.append(f'{name}: 길 자료가 없어요'); await ctx.close(); return
    worst = 0; n = 0
    for _ in range(30):
        await pg.wait_for_timeout(400)
        for x, y, pw in await pg.evaluate("()=>window.__forest.rt4.kids.map(k=>[k.x,k.y,!!(k.pw&&k.pw[0]===k.tx&&k.pw[1]===k.ty)])"):
            if not pw: continue
            d = min(dseg(x, y, s) for s in g['segs']); worst = max(worst, d); n += 1
    print(f'{name}: 지도 {g["gi"]}, 학생 {g["kids"]}명, 점 {n}개, 길에서 가장 먼 곳 {worst:.1f}칸')
    if n < 50: bad.append(f'{name}: 길로 걷는 학생 점이 너무 적어요({n})')
    if worst > FAR: bad.append(f'{name}: 길에서 {worst:.1f}칸 벗어났어요')
    if errs: bad.append(f'{name}: 오류 {errs[:2]}')
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await walk(b, '유치원', base(students=200))
        await walk(b, '고등학교', base(tier=3, students=200))
        await walk(b, '대학교 캠퍼스', base(tier=4, zone='', students=200))
        await walk(b, '대학교 학술 구역', base(tier=4, zone='academic', students=200))
        # 행사처럼 다른 곳을 정해 주면 길 대신 곧장 가요(k.pw와 갈 곳이 달라요)
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(students=60))
        r = await pg.evaluate("""() => { const F = window.__forest, k = F.rt4.kids[0]; k.tx = k.x + 30; k.ty = k.y; k.wait = 0; k.route = null; k.rx = null;
          return new Promise(res => setTimeout(() => res({ pw: !!(k.pw && k.pw[0] === k.tx), route: (k.route || []).length }), 300)); }""")
        print('행사 이동:', r)
        if r['pw']: bad.append('행사로 정한 곳을 길 걷기로 봤어요')
        # 자동 편성 강조
        g = await pg.evaluate("""() => { const F = window.__forest, S = F.S; const g0 = F.tamAutoGain(); return { g0, finite: isFinite(g0) && g0 >= 0 }; }""")
        print('자동 편성 이득:', g)
        if not g['finite']: bad.append(f'tamAutoGain 값이 이상해요: {g}')
        await ctx.close()
        ctx, pg, errs = await ctxpage(b, 360, 740, 'light', base(tier=4, budget=4.3e14, students=61))
        r = await pg.evaluate("""(async()=>{const F=window.__forest,S=F.S,sl=ms=>new Promise(r=>setTimeout(r,ms));
          document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
          S.tam.seen=1;S.tam.skSeen=1;S.tam.party=[]; F.setTab('tam'); await sl(800);
          document.querySelector('#tmNav [data-tnav="mem"]').click(); await sl(400);
          const q=()=>document.querySelector('[data-tauto]'), a={gain:F.tamAutoGain(),hot:q().classList.contains('tm-auto-hot'),txt:q().textContent,over:q().scrollWidth>q().clientWidth+1};
          q().click(); await sl(400); a.after=q().classList.contains('tm-auto-hot'); a.gain2=F.tamAutoGain(); return a;})()""")
        print('자동 편성 강조:', r)
        if not (r['gain'] > 0 and r['hot'] and '힘 +' in r['txt'] and not r['over']): bad.append(f'더 센 조합 강조가 안 보여요: {r}')
        if r['after'] or r['gain2']: bad.append(f'편성한 뒤에도 강조가 남아요: {r}')
        await ctx.close(); await b.close()
asyncio.run(main())
print('\n'.join(bad) if bad else 'PASS'); sys.exit(1 if bad else 0)
