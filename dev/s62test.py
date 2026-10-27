# 1.7.4 시험: 학교 꾸미기 (꾸미기 가게, 장식 놓기, 학교 이름과 마크, 업적)
# 보는 것
#  1) 장식 값: 일반은 기본값 x 1.5^(가진 수), 희귀는 하나만. 정수가 줄고 모자라면 안 사져요. 값이 유한하고 상식적인 크기
#  2) 놓기: 가진 수보다 많이 놓을 수 없고, 치우기가 돼요. 지도에 그림이 그려지고 꾸미기 중에는 빈 자리 표시가 나와요
#  3) 학교 이름(1~6글자)이 학교 카드와 간판에, 마크가 학교 카드에 보여요
#  4) 저장했다 불러와도 남고, 옛 저장(deco 없음)과 망가진 저장도 받아 줘요. 업적 '학교 꾸미기' 값
#  5) 꾸미기 가게 화면과 고르기 창이 넘치지 않아요(360 어두운, 390 밝은). 상점 거리의 가게 단추가 꾸미기 가게를 열어요. 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s62test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel) => { const W = innerWidth; const r = document.querySelector(sel); if (!r) return -1;
  return [...r.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && e.offsetParent !== null && (q.right > W + 1 || q.left < -1); }).length; }"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(SKIP)
            if w == 390:
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.ess = 100000; const out = [];
                  for (let i = 0; i < 3; i++) {{ const c = F.decoCost('bench'), e0 = S.ess; F.pickDeco('bench'); F.buyDeco(); out.push([c, e0 - S.ess]); }}
                  const r0 = F.decoCost('owl'); F.pickDeco('owl'); F.buyDeco(); const r1 = S.deco.own.owl; F.pickDeco('owl'); const e1 = S.ess; F.buyDeco(); const r2 = [S.deco.own.owl, e1 - S.ess, F.decoSoldOut('owl')];
                  S.ess = 5; const e2 = S.deco.own.pond || 0; F.pickDeco('pond'); F.buyDeco(); const poor = [(S.deco.own.pond || 0) - e2, S.ess];
                  F.setTab('school');
                  const maxCost = Math.max(...F.DECO.map(d => {{ const n = S.deco.own[d.id]; S.deco.own[d.id] = 11; const c = F.decoCost(d.id); if (n === undefined) delete S.deco.own[d.id]; else S.deco.own[d.id] = n; return c; }}));
                  return {{ out, r0, r1, r2, poor, maxCost, own: S.deco.own }}; }})()""")
                print('사기', json.dumps(r))
                if [x[0] for x in r['out']] != [40, 60, 90] or any(a != b2 for a, b2 in r['out']): bad.append(f'일반 장식 값 {r["out"]}')
                if r['r0'] != 250 or r['r1'] != 1 or r['r2'] != [1, 0, True]: bad.append(f'희귀 장식 {r}')
                if r['poor'] != [0, 5]: bad.append(f'모자랄 때 {r["poor"]}')
                if not (0 < r['maxCost'] < 1e6): bad.append(f'값이 너무 커요 {r["maxCost"]}')
                # 놓기
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, m = S.tier >= 1 ? 1 : 0;
                  const a = [F.decoPut(0, 'bench'), F.decoPut(1, 'bench'), F.decoPut(2, 'bench'), F.decoPut(3, 'bench'), F.decoPut(4, 'owl'), F.decoPut(5, 'owl'), F.decoPut(6, 'pond')];
                  const lay = S.deco.lay[m].slice(); F.decoPut(2, ''); F.decoPut(3, 'bench');
                  const imgs = document.querySelectorAll('#decoG image.deco-it').length;
                  F.decoEditStart(); const slots = document.querySelectorAll('#decoG [data-slot]').length, bar = !document.querySelector('#decoBar').hidden;
                  F.openDecoPick(7); const pick = document.querySelectorAll('#decoPickList [data-dput]').length;
                  F.achSync(true);
                  return {{ a, lay, after: S.deco.lay[m].slice(), imgs, slots, bar, pick, ach: S.ach.hit.deco || 0, all: F.decoPlacedAll() }}; }})()""")
                print('놓기', json.dumps(r, ensure_ascii=False))
                if r['a'] != [True, True, True, False, True, False, False]: bad.append(f'놓기 제한 {r["a"]}')
                if r['after'][:4] != ['bench', 'bench', '', 'bench'] or r['imgs'] != 4: bad.append(f'치우기/그림 {r}')
                if r['slots'] != 11 or not r['bar'] or r['pick'] != 2: bad.append(f'꾸미기 모드 {r}')
                if r['ach'] != 2 or r['all'] != 4: bad.append(f'업적 {r["ach"]} {r["all"]}')
                await pg.wait_for_timeout(400); await pg.screenshot(path='s62_pick.png')
                await pg.evaluate(CLEAN)
                # 이름과 마크, 저장
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; F.setSchoolNm('도토리<b>'); F.setMark([1, 5, 4, 2]);
                  const nm = document.querySelector('#schoolName').textContent, sign = [...document.querySelectorAll('#decoG .deco-sign-t')].map(t => t.textContent);
                  const crest = !!document.querySelector('#schoolCrest .mk img');
                  const back = F.sanitize(JSON.parse(JSON.stringify(S))).deco;
                  const old = JSON.parse(JSON.stringify(S)); delete old.deco; const o = F.sanitize(old).deco;
                  const bad = JSON.parse(JSON.stringify(S)); bad.deco = {{ own: {{ bench: 1e9, owl: 5, zzz: 3 }}, lay: [['bench', 'bench', 'zzz', 'owl'], 'x'], nm: 12345, mk: [9, 0, 0, 0] }}; const b2 = F.sanitize(bad).deco;
                  return {{ nm, sign, crest, back: [back.nm, back.mk, back.own, back.lay], old: o, b2 }}; }})()""")
                print('이름', json.dumps(r, ensure_ascii=False))
                if r['nm'] != '도토리b 유치원' or r['sign'] != ['도토리b', '유치원'] or not r['crest']: bad.append(f'이름/마크 {r["nm"]} {r["sign"]} {r["crest"]}')
                if r['back'][0] != '도토리b' or r['back'][1] != [1, 5, 4, 2]: bad.append(f'저장 {r["back"]}')
                o = r['old']
                if o['nm'] != '' or o['mk'] is not None or o['own'] != {} or any(any(x) for x in o['lay']) or [len(x) for x in o['lay']] != [11, 11, 11]: bad.append(f'옛 저장 {o}')
                b2 = r['b2']
                if b2['own'] != {'bench': 11, 'owl': 1} or b2['lay'][0][:4] != ['bench', 'bench', '', 'owl'] or b2['nm'] != '' or b2['mk'] is not None: bad.append(f'망가진 저장 {b2}')
            # 화면: 상점 거리 → 꾸미기 가게
            await pg.evaluate(f"(() => {{ {F}.S.ess = 300; {F}.setTab('street'); }})()"); await pg.wait_for_timeout(300)
            await pg.click('#sfDeco'); await pg.wait_for_timeout(500)
            r = await pg.evaluate("(() => ({ open: !document.querySelector('#panelDeco').hidden, items: document.querySelectorAll('#decoList [data-dbuy]').length, marks: document.querySelectorAll('#markRows [data-mk]').length, street: document.querySelector('.tab[data-tab=\"street\"]')?.getAttribute('aria-selected') }))()")
            r['over'] = await pg.evaluate(OVER, '#panelDeco')
            print(w, scheme, '가게', json.dumps(r))
            if not r['open'] or r['items'] != 16 or r['marks'] != 25 or r['over']: bad.append(f'{w} 가게 화면 {r}')
            await pg.screenshot(path=f's62_{w}.png')
            await pg.evaluate("document.querySelector('#panelDeco').scrollTop = 9999"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f's62_{w}b.png')
            await pg.evaluate(f"(() => {{ {F}.S.deco.own.bench = 2; {F}.decoEditStart(); }})()"); await pg.wait_for_timeout(600)
            await pg.screenshot(path=f's62_{w}map.png')
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('FAIL ' + ' | '.join(bad) if bad else 'PASS')

asyncio.run(main())
