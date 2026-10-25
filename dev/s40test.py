# 1.4.0 시험: 새 로딩 화면, 광고 전 확인 창, 행사 보상 문구, 2배 받기 빼기, 주간 상자 도토리, 시설 레벨 표시, 배경음악 3곡, 업데이트 알림 창
# 쓰는 법: python3 wrap.py && python3 s40test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIPTUT = "const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }"

async def run(b, dark, w, h, fails):
    tag = ('d' if dark else 'l') + str(w)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
    await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(900)
    # 로딩 화면: 그림과 진짜 진행 막대
    boot = await pg.evaluate("(()=>{const b=document.querySelector('#boot'), p=b.querySelector('.boot-pic'), r=p.getBoundingClientRect(), bar=document.querySelector('.boot-bar').getBoundingClientRect(); return [getComputedStyle(p).backgroundImage.startsWith('url(\"data:image/webp'), Math.round(r.height), Math.round(bar.bottom), innerHeight, document.querySelector('#bootVer').textContent, document.documentElement.scrollWidth<=innerWidth]})()")
    await pg.screenshot(path=f's40_boot_{tag}.png')
    if not boot[0]: fails.append(f'[{tag}] 로딩 그림이 없어요')
    if boot[1] < h * 0.5: fails.append(f'[{tag}] 로딩 그림이 너무 작아요 {boot[1]}')
    if boot[2] > h: fails.append(f'[{tag}] 진행 막대가 화면 밖이에요')
    if boot[4] != 'v1.4.1': fails.append(f'[{tag}] 로딩 버전 {boot[4]}')
    if not boot[5]: fails.append(f'[{tag}] 로딩 화면이 옆으로 넘쳐요')
    await pg.wait_for_timeout(2600); await pg.evaluate(SKIPTUT); await pg.evaluate(CLEAN)
    # 배경음악: 홈, 다른 탭, 행사
    mus = []
    mus.append(await pg.evaluate(f"(()=>{{ {F}.S.bgm = true; {F}.setTab('school'); return {F}.musicWant(); }})()"))
    for tb in ('quests', 'teachers', 'grad', 'shop', 'rank', 'settings'):
        mus.append(await pg.evaluate(f"(()=>{{ {F}.setTab('{tb}'); return {F}.musicWant(); }})()"))
    await pg.evaluate(f"{F}.setTab('school')")
    if mus[0] != 'home' or any(m != 'room' for m in mus[1:]): fails.append(f'[{tag}] 배경음악이 이상해요 {mus}')
    # 시설 레벨 표시
    sub = await pg.evaluate(f"(()=>{{ const S={F}.S; S.f.classroom = {F}.facCap(); S.fu.classroom = S.fu.classroom.map(()=>S.f.classroom); {F}.openSheet('classroom'); return [document.querySelector('#sheetSub').textContent, document.querySelector('#sheetNeed').textContent, document.querySelector('#sheetBuyLabel').textContent]; }})()")
    await pg.wait_for_timeout(400); await pg.screenshot(path=f's40_sheet_{tag}.png')
    await pg.evaluate(f"{F}.closeSheet()"); await pg.wait_for_timeout(300)
    if '다음 학년' not in sub[1]: fails.append(f'[{tag}] 최고 레벨 안내 {sub[1]}')
    if '올해 최고' in sub[0] or not sub[0].startswith('Lv.'): fails.append(f'[{tag}] 시설 레벨 표시 {sub[0]}')
    
    # 행사 바로 열기: 광고 전에 한 번 더 물어봐요
    await pg.evaluate(f"(()=>{{ const S={F}.S; S.tier = 1; S.tg = 0; S.f.playground = Math.max(1, S.f.playground); S.fest.next.picnic = Date.now() + 3600e3; {F}.startFest('picnic'); }})()"); await pg.wait_for_timeout(900)
    ask = await pg.evaluate("[!document.querySelector('#mAdAsk').hidden, document.querySelector('#adAskTitle').textContent, document.querySelector('#adAskText').textContent, !!document.querySelector('#adOverlay:not([hidden]), .ad-ov:not([hidden])')]")
    await pg.screenshot(path=f's40_adask_{tag}.png')
    if not ask[0]: fails.append(f'[{tag}] 광고 확인 창이 안 떠요')
    if '보물찾기' not in ask[2]: fails.append(f'[{tag}] 광고 확인 문구 {ask[2]}')
    await pg.evaluate("document.querySelector('#adAskNo').click()"); await pg.wait_for_timeout(600)
    ad_after_no = await pg.evaluate(f"[!!{F}.rt.adOpen, !!{F}.rtFest()]")
    if any(ad_after_no): fails.append(f'[{tag}] 그만두기를 눌렀는데 광고나 행사가 시작됐어요 {ad_after_no}')
    await pg.evaluate(CLEAN)
    # 보물찾기 끝: 알림 문구는 행사 이름, 2배 버튼 없음
    await pg.evaluate(f"(()=>{{ {F}.S.fest.next.picnic = 0; {F}.startFest('picnic', true); }})()"); await pg.wait_for_timeout(4500)
    await pg.evaluate(f"(()=>{{ const R={F}.rtFest(); if (R) {{ R.n = 99; }} {F}.endFest(); }})()"); await pg.wait_for_timeout(1200)
    end = await pg.evaluate("[!document.querySelector('#mSportsEnd').hidden, !!document.querySelector('#srDbl'), document.querySelector('#srGet').className, Math.round(document.querySelector('#srGet').getBoundingClientRect().width), Math.round(document.querySelector('#srGet').parentElement.getBoundingClientRect().width)]")
    if abs(end[3] - end[4]) > 2: fails.append(f'[{tag}] 받기 버튼이 줄을 꽉 채우지 않아요 {end[3]}/{end[4]}')
    await pg.screenshot(path=f's40_festend_{tag}.png')
    await pg.evaluate("document.querySelector('#srGet').click()"); await pg.wait_for_timeout(700)
    toast = await pg.evaluate("document.querySelector('#toast').textContent")
    if not end[0]: fails.append(f'[{tag}] 행사 끝 창이 안 떠요')
    if end[1]: fails.append(f'[{tag}] 행사 끝 2배 버튼이 남아 있어요')
    if '운동회' in toast or '보물찾기' not in toast: fails.append(f'[{tag}] 행사 보상 문구 {toast}')
    # 체험학습 끝: 2배 버튼 없음
    await pg.evaluate(CLEAN)
    trip = await pg.evaluate(f"(()=>{{ const S={F}.S; S.tg = 2; S.trip.open = true; {F}.startTrip('hill'); S.trip.end = Date.now() - 1; document.querySelector('#bTrip, [data-open=trip]') ; return true; }})()")
    await pg.wait_for_timeout(300)
    nodbl = await pg.evaluate("!document.body.innerHTML.includes('tripDbl')")
    if not nodbl: fails.append(f'[{tag}] 체험학습 2배 버튼이 남아 있어요')
    # 주간 상자에 도토리
    await pg.evaluate(CLEAN)
    b0 = await pg.evaluate(f"{F}.S.budget")
    await pg.evaluate(f"(()=>{{ {F}.addMP(1000); {F}.claimBox(0); }})()"); await pg.wait_for_timeout(900)
    box = await pg.evaluate(f"[{F}.S.budget, [...document.querySelectorAll('#rwList li')].map(l=>l.textContent)]")
    await pg.screenshot(path=f's40_box_{tag}.png')
    if not (box[0] > b0) or not any(t.startswith('도토리') for t in box[1]): fails.append(f'[{tag}] 주간 상자에 도토리가 없어요 {box}')
    await pg.evaluate(CLEAN)
    # 업데이트 알림 창 (안드로이드 판이 부르는 창)
    await pg.evaluate("window.__upd = null; window.FOREST_ASK({ title: '새 버전이 나왔어요', text: '지금 업데이트할까요?', yes: '업데이트', no: '나중에', done: v => window.__upd = v })"); await pg.wait_for_timeout(600)
    upd = await pg.evaluate("[!document.querySelector('#mAdAsk').hidden, document.querySelector('#adAskYes').textContent, document.querySelector('#adAskNo').textContent]")
    await pg.screenshot(path=f's40_update_{tag}.png')
    await pg.evaluate("document.querySelector('#adAskYes').click()"); await pg.wait_for_timeout(600)
    if not upd[0] or upd[1] != '업데이트' or upd[2] != '나중에' or await pg.evaluate("window.__upd") is not True: fails.append(f'[{tag}] 업데이트 알림 창 {upd}')
    # 광고 확인 창을 다시 열면 원래 글자로 돌아와요
    await pg.evaluate(f"{F}.askBox({{ text: '시험' }})"); await pg.wait_for_timeout(400)
    lab = await pg.evaluate("[document.querySelector('#adAskTitle').textContent, document.querySelector('#adAskYes').textContent]")
    if lab != ['광고를 볼까요?', '광고 보기']: fails.append(f'[{tag}] 확인 창 글자가 돌아오지 않아요 {lab}')
    over = await pg.evaluate("document.documentElement.scrollWidth <= innerWidth")
    if not over: fails.append(f'[{tag}] 화면이 옆으로 넘쳐요')
    fails += [f'[{tag}] 페이지 오류: {e}' for e in errs]
    await ctx.close()
    return {'boot': boot, 'music': mus, 'sheet': sub, 'ask': ask[:3], 'end': end, 'toast': toast, 'box': box, 'update': upd}

async def main():
    fails, out = [], {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for dark, w, h in ((False, 390, 844), (True, 360, 640)):
            out[('dark' if dark else 'light') + str(w)] = await run(b, dark, w, h, fails)
        await b.close()
    print(json.dumps(out, ensure_ascii=False, indent=1))
    if fails: print('FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
    print('PASS')
asyncio.run(main())
