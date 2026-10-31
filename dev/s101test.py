# 2.3.1 시험: 광고 중 배경음악 멈춤, 마을 기부 글자 자리, 숲속 퍼즐(하루 5판, 보상 두 배, 소탕), 숲속 합치기 배수(×2 3단계, ×3 5단계, ×4 7단계, 따로와 합쳐서),
#   과학실 비용, 전학생이 지도에 다 보이기, 공사 막대가 학생 위, 뱀과 매 침입자 액션(안전한 길, 칩 흐리게, 이기면 보상)
# 쓰는 법: python3 wrap.py && python3 s101test.py   (마지막 줄이 PASS면 통과. 밤 8시부터 자정 사이에는 PYTHONPATH=/tmp/noon)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for W in (360, 390):
            ctx = await b.new_context(viewport={'width': W, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S; {js} }})()")
            # 1) 광고 중 배경음악
            r = await ev("S.bgm = 1; F.rt.adOpen = true; const a = F.musicWant(); F.rt.adOpen = false; const b = F.musicWant(); return { a, b: typeof b };")
            if r['a'] != '': bad.append(f'광고 중 음악 {r}')
            # 2) 퍼즐
            r = await ev("return { pd: F.PZ.perDay, ad: F.PZ.adMore, rw: F.PZ.rw, e: F.pzEssOf(5000), x: F.pzXpOf(1000) };")
            print('퍼즐', r)
            if r['pd'] != 5 or r['ad'] != 2 or r['rw'] != 2 or r['e'] % 2 or r['x'] % 2: bad.append(f'퍼즐 값 {r}')
            r = await ev("S.pz.best = 0; S.pz.hand = ''; const a = F.pzSwOpen(); S.pz.best = 3000; S.pz.n = 1; S.pz.hand = F.gameToday(); const b = F.pzSwOpen(); const g0 = F.pzSwGain(2), e0 = S.ess; const g = F.pzSweep(2); " + CLEAN + "; return { a, b, n: S.pz.n, ess: S.ess - e0, g0e: g0.ess, ok: !!g, txt: document.querySelector('#pzSwTx') ? document.querySelector('#pzSwTx').textContent : '' };")
            print('소탕', r)
            if r['a'] or not r['b'] or r['n'] != 3 or r['ess'] != r['g0e'] or r['ess'] <= 0: bad.append(f'소탕 {r}')
            if '70' in r['txt'] or '%' in r['txt']: bad.append(f'소탕 비율이 보여요 {r}')
            # 소탕 줄은 퍼즐 카드 안, 시작하기 아래(2.3.1 지섭 요청)
            for st in ("S.pz.hand = ''; S.pz.n = 0;", "S.pz.hand = F.gameToday(); S.pz.best = 3000; S.pz.n = 1;"):
                r = await ev(st + " F.setTab('mini'); F.renderMini(); document.querySelector('#pzOpen').scrollIntoView({ block: 'center' }); const c = document.querySelector('#pzOpen').getBoundingClientRect(), p = document.querySelector('#pzCardTag').getBoundingClientRect(), w = document.querySelector('#pzSwRow'), q = w.getBoundingClientRect(), b = document.querySelector('#pzSwBtn'); const vis = b.hidden ? document.querySelector('#pzSwTx') : b, v = vis.getBoundingClientRect(); return { shown: !w.hidden, inside: v.left >= c.left && v.right <= c.right && v.bottom <= c.bottom + 0.5, below: v.top >= p.bottom, mid: Math.abs((v.left + v.right) / 2 - (p.left + p.right) / 2) < 3, btn: !b.hidden, tx: b.hidden ? vis.textContent : b.textContent };")
                print('소탕 자리', r)
                if not (r['shown'] and r['inside'] and r['below'] and r['mid']): bad.append(f'소탕 자리 {r}')
            await ev("F.setTab('school'); return 1;")
            # 3) 합치기 배수
            r = await ev("const mul = JSON.stringify(F.MG.MUL); const ks = Object.keys(F.MG.kinds); ks.forEach(k => S.mg.best[k] = 2); const m2 = F.mgMulMax(); ks.forEach(k => S.mg.best[k] = 3); const m3 = F.mgMulMax(); S.mg.best[ks[0]] = 5; const m5 = F.mgMulMax(); S.mg.best[ks[0]] = 7; const m7 = F.mgMulMax(); S.mg.mm = 1; const ok3 = F.mgMulOk(3), ok4 = F.mgMulOk(4); S.mg.mm = 0; return { mul, m2, m3, m5, m7, ok3, ok4, ok3b: F.mgMulOk(3) };")
            print('합치기', r)
            if r != {'mul': '[[3,2],[5,3],[7,4]]', 'm2': 1, 'm3': 2, 'm5': 3, 'm7': 4, 'ok3': False, 'ok4': True, 'ok3b': True}: bad.append(f'합치기 배수 {r}')
            # 4) 과학실 비용
            r = await ev("return { c15: F.FAC.science.cost(15), lib15: F.FAC.library ? F.FAC.library.cost(15) : 0 };")
            if abs(r['c15'] - 500 * 1.8 ** 15) > 1: bad.append(f'과학실 비용 {r}')
            # 5) 공사 막대 층, 마을 기부 글자
            r = await ev("const c = document.querySelector('#conUi'), pl = document.querySelector('#plaques'), k = document.querySelector('#kids'); return { c: !!c, after: !!(c && k && (k.compareDocumentPosition(c) & 4)), before: !!(c && pl && (c.compareDocumentPosition(pl) & 4)) };")
            if not all(r.values()): bad.append(f'공사 막대 층 {r}')
            r = await ev("S.tier = 1; S.tg = 1; S.budget = 1e12; S.vd = { lv: 0, p: 0, sum: 0, n: 0 }; F.renderMap(); F.openVd(); const h = document.querySelector('#vdHead').getBoundingClientRect(), t = document.querySelector('#vdTitle').getBoundingClientRect(); " + CLEAN + "; return { y: (t.top + t.height / 2 - h.top) / h.height, x: (t.left + t.width / 2 - h.left) / h.width };")
            print('마을 기부 글자', r)
            if not (0.35 < r['y'] < 0.55 and 0.2 < r['x'] < 0.33): bad.append(f'마을 기부 글자 자리 {r}')
            # 5-2) 마을 기부 그날 가격, 지도 층, 광고 30분, 업적 그림
            r = await ev("S.tier = 1; S.tg = 1; S.budget = 1e15; S.vd = { lv: 0, p: 0, sum: 0, n: 0, lk: { day: '', lv: 0, need: 0 } }; F.renderMap(); const a0 = F.vdLocked(), n0 = F.vdNeed(); F.vdGive(0.1); const a1 = F.vdLocked(), n1 = F.vdNeed(); S.students *= 3; const live = F.vdLive(), n2 = F.vdNeed(); S.vd.lk.day = '2000-01-01'; const n3 = F.vdNeed(); F.openVd(); S.vd.lk.day = F.gameToday(); F.vdRender(); const lk = document.querySelector('#vdLock'); const txt = lk.hidden ? '' : lk.textContent; " + CLEAN + "; const top = document.querySelector('#vdTop'), kids = document.querySelector('#kids'); return { a0, a1, same: n1 === n0 && n2 === n0, n3live: n3 === live, txt, layer: !!(top && top.querySelector('[data-vd]') && (kids.compareDocumentPosition(top) & 4)) };")
            print('마을 기부 가격', r)
            if r['a0'] or not r['a1'] or not r['same'] or not r['n3live'] or '23:59' not in r['txt'] or not r['layer']: bad.append(f'마을 기부 가격과 층 {r}')
            r = await ev("const b = F.boostAmount(), want = Math.max(100, F.nice ? F.nice(F.rate() * 60 * 30) : 0); return { b, want, tk: F.TKAD.n, t30: F.tripCut({ min: 30 }), t120: F.tripCut({ min: 120 }), t240: F.tripCut({ min: 240 }), am: F.achMedal(F.ACH.find(a => a.id === 'donate')).includes('am-sm'), am2: F.achMedal(F.ACH.find(a => F.IMG('ach_ic_' + a.id))).includes('am-sm') };")
            print('광고 30분', r)
            if r['tk'] != 6 or r['t30'] != 30 or r['t120'] != 30 or r['t240'] != 60 or not r['am'] or r['am2']: bad.append(f'광고 30분, 업적 그림 {r}')
            if r['want'] and r['b'] != r['want']: bad.append(f'보충수업 30분치 {r}')
            # 6) 전학생: 종류마다 하나씩은 지도에
            r = await ev("S.tier = 1; S.p.species = 9; S.students = 40; F.syncKids(); F.syncKids(); const sp = F.rt.kids.map(k => k.sp), list = new Set(sp); return { n: sp.length, kinds: list.size };")
            print('지도 학생', r)
            if r['kinds'] < min(r['n'], 16) and r['kinds'] < 14: bad.append(f'지도 학생 종류 {r}')
            # 7) 침입자
            await ev("S.tier = 0; S.tg = 0; F.renderMap(); F.setTab('school'); return 1;")
            await pg.wait_for_timeout(400)
            for kind in ('snake', 'hawk'):
                await ev(f"F.rt.trialT = 999; F.startTrial('{kind}'); return 1;")
                await pg.wait_for_timeout(2600)
                r = await ev("const T = F.rt.trial, s = T.safe, d = document.querySelector('.stage').classList.contains('danger'); const ch = document.querySelector('#ffChip'); ch.hidden = false; const pe = getComputedStyle(ch).pointerEvents; ch.hidden = true; return { in: T.x >= s[0] - 1 && T.x <= s[2] + 1 && T.y >= s[1] - 90 && T.y <= s[3] + 1, d, pe, cur: T.cur, x: T.x, y: T.y, s };")
                print(kind, r)
                if not r['in'] or not r['d'] or r['pe'] != 'none' or not r['cur'].startswith('trl_' + kind): bad.append(f'침입자 {kind} {r}')
                r = await ev("const t0 = S.st.trials || 0, b0 = S.budget; let n = 0; while (F.rt.trial && !F.rt.trial.out && n < 80) { F.hitTrial(); n++; } return { n, won: (S.st.trials || 0) - t0, gain: S.budget - b0, out: !!(F.rt.trial && F.rt.trial.out), d: document.querySelector('.stage').classList.contains('danger') };")
                if r['won'] != 1 or r['gain'] <= 0 or r['d']: bad.append(f'침입자 {kind} 이기기 {r}')
                await pg.wait_for_timeout(3400); await pg.evaluate(CLEAN)
                r = await ev("return !!F.rt.trial;")
                if r: bad.append(f'침입자 {kind} 남아 있어요')
            # 지면 도토리를 가져가요
            await ev("F.startTrial('snake'); return 1;"); await pg.wait_for_timeout(500)
            r = await ev("const b0 = S.budget; F.rt.trial.left = 0; return b0;")
            await pg.wait_for_timeout(300)
            r2 = await ev(f"return {{ lost: {r} - S.budget, max: Math.floor({r} * 0.1) }};")
            if not (0 <= r2['lost'] <= r2['max']): bad.append(f'침입자 지기 {r2}')
            await pg.wait_for_timeout(3400)
            if errs: bad.append(f'{W} 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('FAIL' if bad else 'PASS', *bad, sep='\n')

asyncio.run(main())
