# 205번 시험: 조작감과 알림 자리
# 1) 알림이 위 줄 숫자, 열린 창의 제목과 단추를 가리지 않는 곳에 떠요(홈, 퀘스트 창, 체험학습 창, 건물 창). 합치기는 원래 자리
# 2) 위 줄 도토리: 한 번에 많이 들어오면 굴러 올라가요(바로 끝 값이 아니고, 0.7초 뒤에는 끝 값). 쓸 때는 바로 줄어요. 움직임 줄이기면 바로
# 3) 보상 창이 떠 있는 동안 위 숫자는 그대로, '좋아요'를 누르면 도토리가 날아가고 닿은 뒤 끝 값
# 4) 이어 줍기: 1.2초 안에 또 주우면 연속 수가 늘어요
# 5) 누르는 순간 단추가 살짝 들어가요(scale), 움직임 줄이기면 그대로
# 6) 지도 안(참나무, 건물, 이름표, 도토리)은 누를 때 줄거나 움직이지 않아요
# 7) 360px 어두운 화면, 390px 밝은 화면, 페이지 오류 없음
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, F
c = Checker()
HIT = """(sel) => { const t = document.querySelector('#toast').getBoundingClientRect(); const bad = [];
  for (const e of document.querySelectorAll(sel)) { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const x = Math.max(0, Math.min(t.right, r.right) - Math.max(t.left, r.left)), y = Math.max(0, Math.min(t.bottom, r.bottom) - Math.max(t.top, r.top));
    if (x > 2 && y > 2) { const p = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (p && (p === e || e.contains(p) || p.closest('#toast'))) bad.push((e.id || e.className || e.tagName) + ''); } }
  return { bad: bad.slice(0, 5), top: Math.round(t.top), vis: !document.querySelector('#toast').hidden }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, sch in ((360, 'dark'), (390, 'light')):
            ctx, pg, errs = await ctxpage(b, w, 780, sch, base(tier=1, tg=2, students=60))
            await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
            sel = '#vBudget, #vRate, .board button, .modal h2, .modal button, .panel h2, .panel button, .sheet button, .sheet h2'
            for nm, js in (('홈', "F.setTab('school')"), ('퀘스트', "F.setTab('quests')"), ('체험학습', "F.setTab('school'); F.openTrip()"), ('건물 창', "F.setTab('school'); F.openSheet('classroom')")):
                await pg.evaluate(CLEAN)
                await pg.evaluate(f"()=>{{ const F={F}; {js}; }}"); await pg.wait_for_timeout(600)
                await pg.evaluate(f"()=>{{ const F={F}; F.rt4.tapT = performance.now(); F.toast('업적 달성!\\n학생 50명 모으기.\\n도감의 업적에서 받아요'); }}"); await pg.wait_for_timeout(250)
                r = await pg.evaluate(HIT, sel)
                c.ok(r['vis'] and not r['bad'], f'{w} {nm} 알림이 가리지 않아요 {r}')
                if nm == '체험학습': await pg.screenshot(path=f's205_{w}_{sch}_toast.png')
            await pg.evaluate(CLEAN); await pg.evaluate(f"()=>{{ const F={F}; F.setTab('school'); }}"); await pg.wait_for_timeout(300)
            r = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), o={{}}, num=()=>document.querySelector('#vBudget').textContent;
              F.renderHUD(); await sl(150); const b0 = S.budget; S.budget += 5e8; F.renderHUD(); await sl(120); o.mid = num(); o.end = F.fmt2(S.budget); o.midDiff = o.mid !== o.end;
              await sl(700); o.after = Math.abs(F.rt4.hudShown - S.budget) < S.budget * 0.002;
              S.budget -= 4e8; F.renderHUD(); o.spend = Math.abs(F.rt4.hudShown - S.budget) < S.budget * 0.002;
              F.showReward({{ title: '시험 보상', items: [{{ ic: 'acorn', t: '도토리 +1억' }}] }}); await sl(400); const b1 = num(); S.budget += 3e8; F.renderHUD(); await sl(300); o.freeze = num() === b1 || Math.abs(F.rt4.hudShown - S.budget) > 2e8;
              document.querySelector('#rwOk').click(); await sl(80); o.fly = document.querySelectorAll('body > .fly').length; await sl(1500); o.landed = Math.abs(F.rt4.hudShown - S.budget) < S.budget * 0.002;
              return o; }}""")
            c.ok(r['midDiff'] and r['after'] and r['spend'], f'{w} 도토리 숫자 굴러 오르기 {r}')
            c.ok(r['freeze'] and r['fly'] >= 3 and r['landed'], f'{w} 보상 창과 날아가기 {r}')
            r = await pg.evaluate(f"""async()=>{{ const F={F}, rt=F.rt4; rt.pickAt = performance.now() - 300; rt.pickN = 2; const a = rt.pickN;
              return {{ a }}; }}""")
            r2 = await pg.evaluate("""async()=>{ const b = document.querySelector('.tab[data-tab="quests"]'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }""")
            await pg.mouse.move(r2['x'], r2['y']); await pg.mouse.down(); await pg.wait_for_timeout(120)
            sc = await pg.evaluate("()=>getComputedStyle(document.querySelector('.tab[data-tab=\"quests\"]')).scale")
            await pg.mouse.up(); await pg.wait_for_timeout(200)
            c.ok(sc == '0.96', f'{w} 누르는 순간 반응 {sc}')
            # 지도 그림 안의 참나무와 건물은 눌러도 줄지 않아요(svg 안에서 줄면 지도가 움찔하고 참나무가 깨져 보였어요)
            cdp = await ctx.new_cdp_session(pg); await cdp.send('DOM.enable'); await cdp.send('CSS.enable')
            doc = await cdp.send('DOM.getDocument', {'depth': -1})
            for sel in ('#oak', '#b-classroom', '#pq-classroom'):
                nid = (await cdp.send('DOM.querySelector', {'nodeId': doc['root']['nodeId'], 'selector': sel}))['nodeId']
                r0 = await pg.evaluate("(s)=>JSON.stringify(document.querySelector(s).getBoundingClientRect())", sel)
                await cdp.send('CSS.forcePseudoState', {'nodeId': nid, 'forcedPseudoClasses': ['active']}); await pg.wait_for_timeout(150)
                r1 = await pg.evaluate("(s)=>[getComputedStyle(document.querySelector(s)).scale, JSON.stringify(document.querySelector(s).getBoundingClientRect())]", sel)
                await cdp.send('CSS.forcePseudoState', {'nodeId': nid, 'forcedPseudoClasses': []})
                c.ok(r1[0] == 'none' and r0 == r1[1], f'{w} 지도 {sel} 누를 때 그대로 {r1[0]}')
            r = await pg.evaluate("()=>{ const g=document.querySelector('#b-classroom'), b=g.querySelector('.built'); const a=JSON.stringify(b.getBoundingClientRect()); g.classList.add('press'); const t=getComputedStyle(b).transform; g.classList.remove('press'); return [t, a]; }")
            c.ok(r[0] in ('none', 'matrix(1, 0, 0, 1, 0, 0)'), f'{w} 건물을 눌러도 건물 그림이 줄지 않아요 {r[0]}')
            c.ok(not errs, f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        # 이어 줍기와 움직임 줄이기
        ctx, pg, errs = await ctxpage(b, 390, 780, 'light', base(tier=1, tg=2, students=60))
        await pg.emulate_media(reduced_motion='reduce')
        await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
        r = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, rt=F.rt4, sl=ms=>new Promise(r=>setTimeout(r,ms)), o={{}};
          F.setTab('school'); await sl(300); S.budget += 5e8; F.renderHUD(); o.now = Math.abs(F.rt4.hudShown - S.budget) < S.budget * 0.002 && !F.rt4.hudRoll;
          rt.pickAt = 0; rt.pickN = 0; const ns = [];
          for (let i = 0; i < 3; i++) {{ F.spawnDrop && F.spawnDrop(); const d = rt.drops[rt.drops.length - 1]; if (d) {{ F.collect ? F.collect(d) : d.g.dispatchEvent(new PointerEvent('pointerdown', {{ bubbles: true }})); }} ns.push(rt.pickN); await sl(150); }}
          o.ns = ns; await sl(1400); F.spawnDrop && F.spawnDrop(); const d = rt.drops[rt.drops.length - 1]; if (d && F.collect) F.collect(d); o.reset = rt.pickN;
          return o; }}""")
        c.ok(r['now'], f'움직임 줄이기면 숫자가 바로 {r}')
        c.ok(r['ns'] == [0, 1, 2] and r['reset'] == 0, f'이어 줍기 연속 수 {r}')
        r2 = await pg.evaluate("""()=>{ const b = document.querySelector('.tab[data-tab="quests"]'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }""")
        await pg.mouse.move(r2['x'], r2['y']); await pg.mouse.down(); await pg.wait_for_timeout(100)
        sc = await pg.evaluate("()=>getComputedStyle(document.querySelector('.tab[data-tab=\"quests\"]')).scale")
        await pg.mouse.up()
        c.ok(sc in ('none', '1'), f'움직임 줄이기면 단추가 그대로 {sc}')
        c.ok(not errs, f'페이지 오류 {errs[:3]}')
        await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
