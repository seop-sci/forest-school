# 1.6.0 시험: 홈 지도에서 가장 위 건물(초등학교 과학실, 유치원 과학실 공사 자리)이 위쪽 칸(학교 정보, 퀘스트 칸, 오늘의 미션 줄)에 가려지지 않는지
# 긴 휴대폰에서는 지도가 화면보다 짧아서, 예전에는 지도를 아래로 끌어내릴 수 없어 과학실이 위쪽 칸 뒤에 숨었어요(1.5.6 구글 플레이 화면).
# 보는 것: 처음 열었을 때 가장 위 건물 이름표가 위쪽 칸 아래에 보이는지, 손가락으로 지도를 내리면 지붕까지 보이는지, 아래쪽 건물과 참나무가 아래 탭에 가려지지 않는지,
#          지도를 끝까지 올리고 내려도 빈 곳이 아래 탭 위로 보이지 않는지. 휴대폰 393×762, 360×800, 412×915, 390×844 (밝은 화면과 어두운 화면)
# 또 보는 것: 놀이터가 없으면 오늘의 미션과 이번 주 미션에 줍기, 흔들기가 나오지 않는지(놀이터가 있으면 나올 수 있는지), 미션이 3개보다 적을 때 보너스 상자 글이 맞는지
# 쓰는 법: python3 wrap.py && python3 s50test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

MEASURE = """(() => { const F = window.__forest, rt = F.rt, fr = document.querySelector('.frame').getBoundingClientRect();
  const top = rt.hudTop + fr.top, bot = document.querySelector('.tabs').getBoundingClientRect().top;
  const r = sel => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? [b.top, b.bottom] : null; };
  const k = F.S.tier >= 1 ? 'science' : null;
  const tag = k ? r('#pq-science .c-plaque') : r('#b-next .next-tag');
  const roof = k ? r('#b-science .built .bimg') : r('#b-next .bimg');
  const lowTags = ['#pq-library .c-plaque', '#pq-playground .c-plaque'].map(r).filter(Boolean);
  const map = document.querySelector('#map').getBoundingClientRect();
  return { top, bot, tag, roof, lowTags, oak: r('#oak .oak-img'), panY: rt.panY, mapTop: map.top, mapBot: map.bottom }; })()"""

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for (w, h, dark) in ((393, 762, False), (360, 800, True), (412, 915, False), (390, 844, True)):
            tag = f"{'d' if dark else 'l'}{w}x{h}"
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(3800)
            await pg.evaluate(f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()")
            for tier in (1, 0):
                await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier={tier}; S.budget=1e9; S.tips.rep = true;   // 1.8.0: 평판 도움말 창이 끌기를 막지 않게
                  for (const k of ['classroom','cafeteria','library','playground','science']) S.f[k]=Math.max(5,S.f[k]||0);
                  if ({tier}===0) S.f.science=0;
                  S.q.m = Math.min(F.MAIN.length - 2, {tier} ? 40 : 12); S.q.mb = 0; S.q.subs = []; F.fillSubs();
                  F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); F.renderHUD(); F.renderAffordance(); F.rt.panX=null; F.setTab('grad'); F.setTab('school'); }})()""")
                await pg.wait_for_timeout(700)
                m = await pg.evaluate(MEASURE)
                t = f'[{tag} t{tier}]'
                if not m['tag']: fails.append(f'{t} 가장 위 건물 이름표를 못 찾았어요'); continue
                if m['tag'][0] < m['top'] - 1: fails.append(f"{t} 처음 열었을 때 가장 위 건물 이름표가 위쪽 칸에 가려져요 (이름표 {m['tag'][0]:.0f}, 위쪽 칸 끝 {m['top']:.0f})")
                for lt in m['lowTags']:
                    if lt[1] > m['bot'] + 1: fails.append(f"{t} 처음 열었을 때 아래쪽 건물 이름표가 아래 탭에 가려져요 ({lt[1]:.0f} > {m['bot']:.0f})")
                if m['oak'] and m['oak'][0] + (m['oak'][1] - m['oak'][0]) * 0.5 > m['bot']: fails.append(f"{t} 참나무가 아래 탭에 반 넘게 가려져요")
                await pg.screenshot(path=f's50_{tag}_t{tier}.png')
                # 손가락으로 지도를 아래로 끝까지 내리면 지붕 꼭대기까지 위쪽 칸 아래로 보여요
                cx = w // 2; y0 = int(m['bot'] - 40)
                await pg.mouse.move(cx, int(m['top'] + 60)); await pg.mouse.down()
                for i in range(1, 13): await pg.mouse.move(cx, int(m['top'] + 60 + i * 40))
                await pg.mouse.up(); await pg.wait_for_timeout(300)
                d = await pg.evaluate(MEASURE)
                if d['roof'][0] + (d['roof'][1] - d['roof'][0]) * 0.12 < d['top'] - 1: fails.append(f"{t} 지도를 끝까지 내려도 가장 위 건물 지붕이 가려져요 (지붕 {d['roof'][0]:.0f}, 위쪽 칸 끝 {d['top']:.0f})")
                if d['mapTop'] > d['top'] + 1: fails.append(f"{t} 지도를 내렸을 때 지도 위 끝이 위쪽 칸 아래로 내려와 빈 곳이 보여요 ({d['mapTop']:.0f} > {d['top']:.0f})")
                await pg.screenshot(path=f's50_{tag}_t{tier}_down.png')
                # 끝까지 올리면 지도 아래 끝이 아래 탭 위로 올라오지 않아요
                await pg.mouse.move(cx, y0); await pg.mouse.down()
                for i in range(1, 16): await pg.mouse.move(cx, y0 - i * 40)
                await pg.mouse.up(); await pg.wait_for_timeout(300)
                u = await pg.evaluate(MEASURE)
                if u['mapBot'] < u['bot'] - 1 and u['mapTop'] < u['top'] - 1: fails.append(f"{t} 지도를 올렸을 때 지도 아래 끝이 아래 탭 위로 올라와요 ({u['mapBot']:.0f} < {u['bot']:.0f})")
                sub = await pg.evaluate("!document.querySelector('#subBar').hidden")
                if not sub: fails.append(f'{t} 시험 준비: 학생 부탁 줄이 안 보여요')
                print(tag, tier, 'start', [round(x) for x in m['tag']], round(m['top']), 'down roof', round(d['roof'][0]), 'panY', round(m['panY']), round(d['panY']), round(u['panY']))
            if w == 393:
                r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=0; const out={{none:new Set(), withPg:new Set(), wk:new Set(), short:''}};
                  for (const pg of [0, 1]) {{ S.f.playground = pg; S.q.m = pg ? 20 : 0;
                    for (let i = 0; i < 60; i++) {{ S.pid = 'p' + i + 'x'; S.dm.day = ''; F.dmDay(); S.dm.list.forEach(m => (pg ? out.withPg : out.none).add(m.id));
                      if (!pg) {{ S.wk.week = -1; F.wkWeek(); S.wk.list.forEach(m => out.wk.add(m.id)); }}
                      if (!pg && S.dm.list.length < 3 && !out.short) {{ F.setTab('quests'); F.renderAffordance(); const b=document.querySelector('.dm.bonus'); out.short = b ? b.textContent : 'none'; F.setTab('school'); }} }} }}
                  return {{none:[...out.none], withPg:[...out.withPg], wk:[...out.wk], short: out.short}}; }})()""")
                if {'picks', 'shakes'} & set(r['none']): fails.append(f"[{tag}] 놀이터가 없는데 오늘의 미션에 줍기나 흔들기가 나와요 {r['none']}")
                if 'picks' in r['wk']: fails.append(f"[{tag}] 놀이터가 없는데 이번 주 미션에 줍기가 나와요 {r['wk']}")
                if not ({'picks', 'shakes'} & set(r['withPg'])): fails.append(f"[{tag}] 놀이터가 있어도 줍기, 흔들기가 안 나와요 {r['withPg']}")
                if r['short'] and ('셋 다' in r['short'] or '/3' in r['short']): fails.append(f"[{tag}] 미션이 3개보다 적은데 보너스 상자 글이 셋 기준이에요 {r['short']}")
                print('missions', r)
            if errs: fails.append(f'[{tag}] 페이지 오류 {errs[:2]}')
            await ctx.close()
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
