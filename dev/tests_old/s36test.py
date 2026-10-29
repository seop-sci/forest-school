# 36번 묶음(1.3.0) 시험: 교감 지원 상한, 9-5 바로잡기, ★ 설명, 시설 창 한 화면, 보상 창, 전학생 레벨, 시련과 졸업생, 핫딜, 미션
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
SKIPTUT = "const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }"

async def run(b, dark, w, h):
    tag = ('d' if dark else 'l') + str(w)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
    await ctx.add_init_script("window.__FOREST_TEST = true; if (!sessionStorage.getItem('s36')) { localStorage.clear(); sessionStorage.setItem('s36', '1'); }")
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(2600); await pg.evaluate(SKIPTUT)
    r = {}
    # 시설 창: 가진 도토리, 한 화면
    await pg.evaluate(f"{F}.S.budget = 1234; {F}.S.f.classroom = 6; {F}.S.fu.classroom = [6,5,6,5]")
    await pg.evaluate("document.querySelector('#b-classroom').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(500)
    r['sheet'] = await pg.evaluate("(() => { const s = document.querySelector('#sheetWrap .sheet'); return [s.classList.contains('is-room'), s.scrollHeight <= s.clientHeight + 1, s.scrollHeight, s.clientHeight, document.querySelector('#sheetHaveN').textContent]; })()")
    await pg.screenshot(path=f's36_sheet_{tag}.png')
    await pg.evaluate("document.querySelector('[data-close-sheet]').click()"); await pg.wait_for_timeout(300)
    # 처음 지을 때 창이 닫혀요
    await pg.evaluate(f"{F}.S.budget = 1e6; document.querySelector('#b-cafeteria').dispatchEvent(new MouseEvent('click',{{bubbles:true}}))"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.querySelector('#sheetBuy').click()"); await pg.wait_for_timeout(500)
    r['build_closes'] = await pg.evaluate(f"[{F}.S.f.cafeteria, {F}.rt.sheetKey]")
    # 9-5 (q26)와 ★ 설명
    r['q26'] = await pg.evaluate(f"(() => {{ const q = {F}.MAIN.find(x => x.id === 'q26'); return [q.t, q.n, q.title]; }})()")
    await pg.evaluate(f"(() => {{ const S = {F}.S; S.tg = 1; S.q.m = {F}.MAIN.findIndex(q => q.id === 'q21'); S.q.mb = 0; }})()"); await pg.wait_for_timeout(600)
    r['rep_text'] = await pg.evaluate("document.querySelector('#qbHow').textContent")
    # 교감 지원: 못 이루는 퀘스트는 0, 상한
    r['need'] = await pg.evaluate(f"[{F}.needCost({F}.MAIN.find(q => q.id === 'q18')), {F}.needCost({F}.MAIN.find(q => q.id === 'k5'))]")
    # 미션에 광고 없음
    r['ads_mission'] = await pg.evaluate(f"{F}.S.dm.list.map(m => m.id).includes('ads')")
    # 보상 창: 체험학습 기념품
    await pg.evaluate(f"(() => {{ const S = {F}.S; S.tier = 1; S.tg = 2; S.trip.open = true; {F}.startTrip('hill'); S.trip.end = Date.now() - 1; {F}.claimTrip(1); }})()"); await pg.wait_for_timeout(1400)
    r['reward'] = await pg.evaluate("[!document.querySelector('#mReward').hidden, document.querySelector('#rwTitle').textContent, !document.querySelector('#rwArt').hidden, document.querySelector('#rwArt b') && document.querySelector('#rwArt b').textContent, document.querySelectorAll('#rwList li').length]")
    await pg.screenshot(path=f's36_reward_{tag}.png')
    await pg.evaluate("document.querySelector('#rwOk').click()"); await pg.wait_for_timeout(400)
    # 전학생 레벨
    await pg.evaluate(f"(() => {{ const S = {F}.S; S.p.species = 6; S.p.ticket = 2; }})()")
    await pg.evaluate("document.querySelector('.tab[data-tab=grad]').click()"); await pg.wait_for_timeout(500)
    rate0 = await pg.evaluate(f"{F}.rate()")
    await pg.evaluate("document.querySelector('#friendList [data-grow=\"3\"]').click()"); await pg.wait_for_timeout(500)
    r['grow'] = await pg.evaluate(f"[{F}.S.p.nl.join(','), {F}.S.p.ticket, {F}.rate() > {rate0}, document.querySelector('#rwTitle').textContent]")
    await pg.evaluate("document.querySelector('#rwOk').click()"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.querySelector('#friendNote').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(200)
    await pg.screenshot(path=f's36_friends_{tag}.png')
    await pg.evaluate("document.querySelector('.tab[data-tab=school]').click()"); await pg.wait_for_timeout(400)
    # 시련: 뱀
    await pg.evaluate(f"{F}.startTrial('snake')"); await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f's36_snake_{tag}.png')
    need = await pg.evaluate(f"{F}.rt.trial.hp")
    for _ in range(need): await pg.evaluate(f"{F}.hitTrial()")
    await pg.wait_for_timeout(900)
    r['trial_win'] = await pg.evaluate("[document.querySelector('#rwTitle').textContent, !document.querySelector('#mReward').hidden]")
    await pg.evaluate("document.querySelector('#rwOk').click()"); await pg.wait_for_timeout(400)
    # 시련: 매, 시간 초과
    await pg.evaluate(f"{F}.startTrial('hawk')"); await pg.wait_for_timeout(1200)
    await pg.screenshot(path=f's36_hawk_{tag}.png')
    b0 = await pg.evaluate(f"{F}.S.budget")
    await pg.evaluate(f"{F}.rt.trial.left = 0.01"); await pg.wait_for_timeout(500)
    r['trial_lose'] = [await pg.evaluate(f"{F}.S.budget <= {b0}"), await pg.evaluate("document.querySelector('#toast').textContent")]
    # 졸업생
    await pg.evaluate(f"{F}.startVisit()"); await pg.wait_for_timeout(2500)
    await pg.screenshot(path=f's36_visit_{tag}.png')
    await pg.evaluate("document.querySelector('#fx .visit').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(500)
    r['visit'] = await pg.evaluate("document.querySelector('#rwTitle').textContent")
    await pg.evaluate("document.querySelector('#rwOk').click()"); await pg.wait_for_timeout(300)
    # 학교 행사 중 핫딜 없음
    await pg.evaluate(f"{F}.rt.deal = null; {F}.rt.dealT = 0; {F}.rt.fest = {{ id: 'picnic', t: 999, n: 0, spawn: 999, items: [], perf: 0, intro: 999 }}"); await pg.wait_for_timeout(1500)
    r['deal_in_fest'] = await pg.evaluate(f"[!!{F}.rtFest(), !!{F}.rt.deal]")
    await pg.evaluate(f"{F}.rt.fest = null")
    # 졸업 조건 채우기로 건너뛴 저장 바로잡기
    await pg.evaluate(f"(() => {{ const S = {F}.S; {F}.rt.adopting = true; const d = JSON.parse(JSON.stringify(S)); d.tier = 1; d.tg = 3; d.st.grads = 4; d.p.species = 4; localStorage.setItem('forest-school-v1', JSON.stringify(d)); }})()")
    await pg.reload(); await pg.wait_for_timeout(2800)
    r['repair'] = await pg.evaluate(f"[{F}.S.st.grads, {F}.S.p.species]")
    r['errors'] = errs
    await ctx.close()
    return r

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); out = {}
        for dark, w, h in ((False, 390, 844), (True, 360, 640)):
            out[('dark' if dark else 'light') + str(w)] = await run(b, dark, w, h)
        await b.close(); print(json.dumps(out, ensure_ascii=False, indent=1))
asyncio.run(main())
