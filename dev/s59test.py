# 1.7.2 시험: 숲속 퍼즐 부스터, 학교 행사 황금 도토리 하루 한 번, 상점 거리, 메뉴 화면 현황판
# 보는 것
#  1) 부스터: 보상 판을 새로 열면 부스터 창이 떠요. 값은 수업료 5, 3, 10분치. 사면 도토리가 줄고, 선생님 도움 +1, 첫 조각이 작은 조각(3칸 이하),
#     콤보 부스터는 첫 줄부터 ×1.5. 도토리가 모자라면 못 골라요. 그냥 시작하면 아무것도 안 줄어요. 연습 판(보상 판이 없을 때)에는 창이 안 떠요.
#     저장했다가 불러와도 콤보 부스터가 남아요. 보상 상한(정수 25, 도토리 15분치)은 그대로예요.
#  2) 행사 황금 도토리: 같은 행사는 하루 한 번만 +1, 다른 행사는 따로, 날이 바뀌면 다시
#  3) 상점 거리: 아래 상점 탭 → 상점 거리, 가게를 누르면 그 가게, 돌아가기, 오른쪽 메뉴에 정수 상점이 없어요
#  4) 메뉴 화면 현황판: 도감 탭에서 칭호가 잘리지 않고 화면 밖으로 넘치는 것이 없어요 (360, 390)
# 쓰는 법: python3 wrap.py && python3 s59test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for (w, h, scheme) in ((360, 800, 'light'), (390, 844, 'dark')):
            tag = f'{w}{scheme[0]}'
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(SKIP)

            # 1) 부스터 규칙
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.budget = 1e12; S.pz = {{ day: '', n: 0, adN: 0, best: 0, cur: null }};
              const costs = F.PZB && Object.keys(F.PZB).map(id => [id, F.pzbCost(id), Math.round(F.pzbCost(id) / (F.rate() * 60))]);
              const cur = F.pzStart(); const b0 = S.budget;
              F.pzApplyBoost(cur, ['teacher', 'small', 'combo']);
              const helps = Object.values(cur.helps).reduce((a, x) => a + x, 0), small = cur.tray.every(p => p && p.c.length <= 3);
              // 콤보: 첫 줄을 지우면 배수가 1.5여야 해요 → 한 줄 8칸을 직접 만들어 놓기
              cur.b.fill(0); for (let c = 0; c < 7; c++) cur.b[c] = 1; cur.tray[0] = {{ c: [[0, 0]], k: 1 }};
              const res = F.pzPlace(cur, 0, 0, 7);
              const plain = F.pzFreshGame(true); plain.b.fill(0); for (let c = 0; c < 7; c++) plain.b[c] = 1; plain.tray[0] = {{ c: [[0, 0]], k: 1 }};
              const res2 = F.pzPlace(plain, 0, 0, 7);
              // 상한은 그대로
              const fin = F.pzFinish(Object.assign(F.pzStart(), {{ score: 1e6, bst: {{ combo: true }} }}));
              return {{ costs, helps, small, gainBoost: res.gain, gainPlain: res2.gain, budgetSame: S.budget === b0, essCap: fin.ess <= 25 * 1.3 + 1, minCap: fin.mins <= 15 }}; }})()""")
            if not r['costs'] or [c[2] for c in r['costs']] != [5, 3, 10]: bad.append(f'[{tag}] 부스터 값(분치): ' + json.dumps(r['costs']))
            if r['helps'] != 1 or not r['small']: bad.append(f'[{tag}] 선생님 도움, 작은 조각: ' + json.dumps(r))
            if not (r['gainBoost'] > r['gainPlain']): bad.append(f'[{tag}] 콤보 부스터 점수가 더 높지 않아요: {r["gainBoost"]} vs {r["gainPlain"]}')
            if not (r['essCap'] and r['minCap']): bad.append(f'[{tag}] 보상 상한: ' + json.dumps(r))

            # 1-2) 화면: 퍼즐을 열면 부스터 창, 두 개 고르고 시작하면 도토리가 줄어요
            await pg.evaluate(f"{F}.S.pz = {{ day: '', n: 0, adN: 0, best: 0, cur: null }}; {F}.S.budget = 1e12; document.querySelector('.tab[data-tab=mini]').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(500)
            v = await pg.evaluate("[!document.querySelector('#pzBoost').hidden, document.querySelectorAll('#pzbList .pzb').length, [...document.querySelectorAll('#pzbList .pzb-ic')].every(e => getComputedStyle(e).backgroundImage.startsWith('url'))]")
            if v != [True, 3, True]: bad.append(f'[{tag}] 부스터 창: ' + json.dumps(v))
            await pg.screenshot(path=f's59_boost_{tag}.png')
            await pg.evaluate("document.querySelector('[data-pzb=teacher]').click(); document.querySelector('[data-pzb=combo]').click()"); await pg.wait_for_timeout(100)
            b0 = await pg.evaluate(f"{F}.S.budget")
            cost = await pg.evaluate(f"{F}.pzbCost('teacher') + {F}.pzbCost('combo')")
            await pg.evaluate("document.querySelector('#pzbGo').click()"); await pg.wait_for_timeout(300)
            v = await pg.evaluate(f"[document.querySelector('#pzBoost').hidden, {F}.S.pz.cur.bst, Object.values({F}.S.pz.cur.helps).reduce((a,x)=>a+x,0)]")
            b1 = await pg.evaluate(f"{F}.S.budget")
            if not v[0] or not v[1] or not v[1].get('combo') or not v[1].get('teacher') or v[2] != 1 or abs((b0 - b1) - cost) > 1: bad.append(f'[{tag}] 부스터 사고 시작: ' + json.dumps([v, b0 - b1, cost]))
            # 저장 뒤에도 콤보 부스터가 남아요
            await pg.evaluate(f"{F}.pzClose()")
            v = await pg.evaluate(f"(() => {{ const s = {F}.sanitize(JSON.parse(JSON.stringify({F}.S))); return s && s.pz && s.pz.cur && s.pz.cur.bst; }})()")
            if not v or not v.get('combo'): bad.append(f'[{tag}] 저장 뒤 부스터: ' + json.dumps(v))
            # 이미 부스터를 쓴 판을 다시 열면 창이 안 떠요
            await pg.evaluate("document.querySelector('.tab[data-tab=mini]').click()"); await pg.wait_for_timeout(200)
            await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(400)
            if not await pg.evaluate("document.querySelector('#pzBoost').hidden"): bad.append(f'[{tag}] 쓴 판에 부스터 창이 또 떠요')
            # 그냥 시작은 도토리가 그대로
            await pg.evaluate(f"{F}.pzClose(); {F}.S.pz.cur = null; {F}.S.budget = 5e11"); await pg.wait_for_timeout(100)
            await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(400)
            b0 = await pg.evaluate(f"{F}.S.budget")
            await pg.evaluate("document.querySelector('#pzbSkip').click()"); await pg.wait_for_timeout(200)
            b1 = await pg.evaluate(f"{F}.S.budget")
            if abs(b1 - b0) > 1e6 or b1 < b0 - 1 or not await pg.evaluate("document.querySelector('#pzBoost').hidden"): bad.append(f'[{tag}] 그냥 시작: {b0} → {b1}')
            # 도토리가 모자라면 못 골라요
            await pg.evaluate(f"{F}.pzClose(); {F}.S.pz.cur = null; {F}.S.budget = 1"); await pg.wait_for_timeout(100)
            await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('[data-pzb=small]').click()"); await pg.wait_for_timeout(100)
            if await pg.evaluate("document.querySelectorAll('#pzbList .pzb.on').length"): bad.append(f'[{tag}] 도토리가 모자란데 골라져요')
            await pg.evaluate("document.querySelector('#pzbSkip').click()")
            # 연습 판에는 창이 안 떠요
            await pg.evaluate(f"{F}.pzClose(); {F}.S.pz.cur = null; {F}.S.pz.n = 99; {F}.S.budget = 1e12"); await pg.wait_for_timeout(100)
            await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(400)
            if not await pg.evaluate("document.querySelector('#pzBoost').hidden"): bad.append(f'[{tag}] 연습 판에 부스터 창이 떠요')
            await pg.evaluate(f"{F}.pzClose()")

            # 2) 행사 황금 도토리 하루 한 번
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, rt = F.rt; S.fg = {{ day: '', got: [] }}; const g0 = S.gold; const out = [];
              const win = id => {{ rt.sportsWin = true; rt.prizeId = id; rt.prizeName = id; F.claimSports(1); out.push(S.gold - g0); }};
              win('picnic'); win('picnic'); win('show'); rt.sportsWin = false; rt.prizeId = 'photo'; F.claimSports(1); out.push(S.gold - g0);
              S.fg.day = '2000-01-01'; win('picnic');
              return [out, F.festGoldLeft('picnic'), F.festGoldLeft('welcome')]; }})()""")
            if r != [[1, 1, 2, 2, 3], False, True]: bad.append(f'[{tag}] 행사 황금 도토리: ' + json.dumps(r))

            # 3) 상점 거리
            await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(200)
            rail = await pg.evaluate("[...document.querySelectorAll('.map-right .sidebtn')].map(e => e.dataset.tab)")
            if 'ess' in rail: bad.append(f'[{tag}] 오른쪽 메뉴에 정수 상점이 남아 있어요: {rail}')
            await pg.tap('.tabs .tab[data-tab="street"]'); await pg.wait_for_timeout(300)
            v = await pg.evaluate("[!document.querySelector('#panelStreet').hidden, document.querySelectorAll('#panelStreet button.shopfront').length, document.querySelector('.tabs .tab[data-tab=street]').getAttribute('aria-selected')]")
            # 1.7.4: 꾸미기 가게가 열려 가게 단추 3개
            if v != [True, 3, 'true']: bad.append(f'[{tag}] 상점 거리 열기: ' + json.dumps(v))
            await pg.tap('#sfEss'); await pg.wait_for_timeout(300)
            v = await pg.evaluate(f"[{F}.rt.tab, !document.querySelector('#panelEss').hidden, document.querySelector('.tabs .tab[data-tab=street]').getAttribute('aria-selected')]")
            if v != ['ess', True, 'true']: bad.append(f'[{tag}] 정수 상점 들어가기: ' + json.dumps(v))
            await pg.tap('#panelEss .street-back'); await pg.wait_for_timeout(200)
            await pg.tap('#sfGold'); await pg.wait_for_timeout(300)
            v = await pg.evaluate(f"[{F}.rt.tab, !document.querySelector('#panelShop').hidden]")
            if v != ['shop', True]: bad.append(f'[{tag}] 황금 도토리 상점 들어가기: ' + json.dumps(v))

            # 5) 이벤트에서 받을 것이 있으면 퀘스트 점과 퀘스트 목록의 이벤트 줄, 학교 상세에는 평판 줄이 없어요
            await pg.evaluate(f"(() => {{ const F = {F}; F.setServerTime(Date.parse('2026-11-02T03:00:00Z')); F.evSync(); F.S.ev.stamp = {{ n: 0, last: '' }}; F.setTab('grad'); F.setTab('school'); }})()"); await pg.wait_for_timeout(1300)
            v = await pg.evaluate("[!document.querySelector('#qDot').hidden, getComputedStyle(document.querySelector('#stats .rep-row')).display]")
            if v != [True, 'none']: bad.append(f'[{tag}] 이벤트 점, 학교 상세: ' + json.dumps(v))
            await pg.evaluate(f"{F}.setTab('quests')"); await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('#qDaily .dm-ev') && document.querySelector('#qDaily .dm-ev').click()"); await pg.wait_for_timeout(300)
            if await pg.evaluate(f"{F}.rt.tab") != 'event': bad.append(f'[{tag}] 퀘스트 목록의 이벤트 줄')
            # 6) 뱀이 나타나면 빨간 테두리, 쫓아내면 사라져요
            await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(200)
            v = await pg.evaluate(f"(() => {{ const F = {F}; F.startTrial('snake'); const on = document.querySelector('.stage').classList.contains('danger') && getComputedStyle(document.querySelector('.danger-fx')).display === 'block'; F.rt.trial.hp = 1; F.hitTrial(); const off = !document.querySelector('.stage').classList.contains('danger'); {CLEAN.replace('{', '{{').replace('}', '}}') if False else ''} return [on, off]; }})()")
            if v != [True, True]: bad.append(f'[{tag}] 위기 빨간 테두리: ' + json.dumps(v))
            await pg.evaluate(CLEAN)
            # 4) 메뉴 화면 현황판과 칭호
            await pg.evaluate(f"(() => {{ const S = {F}.S; S.ach.hit.building = 5; S.ach.title = 'building'; {F}.setTab('dex'); }})()"); await pg.wait_for_timeout(1300)
            v = await pg.evaluate("""(() => { const W = innerWidth, t = document.querySelector('#hudTitle'); const r = t.getBoundingClientRect();
              const over = [...document.querySelectorAll('.board *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > W + 1 || b.left < -1); }).map(e => e.id || e.className);
              return [!t.hidden, t.scrollWidth <= t.clientWidth + 1, r.width > 60, over]; })()""")
            if v[:3] != [True, True, True] or v[3]: bad.append(f'[{tag}] 메뉴 화면 칭호와 현황판: ' + json.dumps(v, ensure_ascii=False))
            await pg.screenshot(path=f's59_dex_{tag}.png')
            if errs: bad.append(f'[{tag}] 페이지 오류 {errs[:2]}')
            await ctx.close()
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else 'FAIL')
    sys.exit(1 if bad else 0)

if __name__ == '__main__': asyncio.run(main())
