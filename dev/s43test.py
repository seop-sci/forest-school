# 1.5.3 시험: 지도 연하게, 도토리 테두리, 평판 아래 학생 수, 평판 퀘스트 첫 안내, 건물 이름표가 캐릭터 위에 보이는지
# 쓰는 법: python3 wrap.py && python3 s43test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, dark in ((360, True), (390, False)):
            tag = ('d' if dark else 'l') + str(w)
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, color_scheme='dark' if dark else 'light')
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(3800)
            await pg.evaluate(f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()")
            if await pg.evaluate(f"{F}.S.tips.rep") is not False: fails.append(f'[{tag}] 새 저장의 tips.rep 기본값이 false가 아니에요')
            for tier in (0, 1):
                r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier={tier}; S.budget=1e9; S.tips.rep=true;
                  for (const k of ['classroom','cafeteria','library','playground','science']) S.f[k]=Math.max(3,S.f[k]||0);
                  for (const k in S.t) S.t[k]=Math.max(1,S.t[k]); S.students=17.6;
                  F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); F.renderHUD(); F.renderAffordance(); F.spawnDrop();
                  const svg=document.querySelector('#map'), kids=document.querySelector('#kids'), pqs=document.querySelector('#plaques');
                  const order = [...svg.querySelectorAll(':scope > g, :scope > * > g')].indexOf(pqs) > [...svg.querySelectorAll(':scope > g, :scope > * > g')].indexOf(kids);
                  const inLayer = [...document.querySelectorAll('.plaque[id^=pq-]')].every(p => p.parentNode === pqs);
                  const filt = getComputedStyle(document.querySelector('.mapimg')).filter;
                  const drop = document.querySelector('#fx .drop [filter]');
                  // 선생님 발 자리가 이름표 안에 있지 않아요
                  const tags = [...document.querySelectorAll('.plaque[id^=pq-]')].filter(p => p.getBoundingClientRect().width > 0).map(p => p.querySelector('.c-plaque').getBoundingClientRect());
                  const hidden = [];
                  document.querySelectorAll('#teachers > g').forEach(t => {{ const r=t.getBoundingClientRect(); if(!r.width) return; const x=r.left+r.width/2, y=r.bottom-2;
                    if (tags.some(q => x>q.left-4 && x<q.right+14 && y>q.top && y<q.bottom+8)) hidden.push(t.id || t.getAttribute('class')); }});
                  return [order, inLayer, filt, drop ? drop.getAttribute('filter') : '', document.querySelector('#vKidsTop').textContent, hidden,
                    getComputedStyle(document.querySelector('#pq-science')).display]; }})()""")
                if not r[0]: fails.append(f'[{tag} t{tier}] 이름표 층이 학생 층 아래에 있어요')
                if not r[1]: fails.append(f'[{tag} t{tier}] 이름표가 이름표 층에 다 들어가지 않았어요')
                if 'saturate' not in r[2]: fails.append(f'[{tag} t{tier}] 지도 그림이 연하지 않아요 {r[2]}')
                if r[3] != 'url(#nutLine)': fails.append(f'[{tag} t{tier}] 떨어진 도토리 테두리가 없어요 {r[3]}')
                if r[4] != '17명': fails.append(f'[{tag} t{tier}] 학생 수 표시 {r[4]}')
                if r[5]: fails.append(f'[{tag} t{tier}] 이름표에 가려진 선생님 {r[5]}')
                if tier == 0 and r[6] != 'none': fails.append(f'[{tag}] 유치원에서 과학실 이름표가 보여요')
                if tier == 1 and r[6] == 'none': fails.append(f'[{tag}] 초등학교에서 과학실 이름표가 안 보여요')
            await pg.screenshot(path=f's43_home_{tag}.png')
            # 이름표를 누르면 건물 창이 열려요
            await pg.evaluate(f"{CLEAN}")
            await pg.evaluate("document.querySelector('#pq-library').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
            await pg.wait_for_timeout(400)
            if not await pg.evaluate(f"{F}.rt.sheetKey === 'library'"): fails.append(f'[{tag}] 이름표를 눌러도 도서관 창이 안 열려요')
            await pg.evaluate(f"{F}.closeSheet()"); await pg.wait_for_timeout(300)
            # 평판 퀘스트 첫 안내: 한 번만
            q6 = await pg.evaluate(f"{F}.MAIN.findIndex(q => q.id === 'q6')")
            await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; S.tier=0; F.rt.mapLaid=-1; F.layoutMap(); S.q.m={q6}; S.q.mb=0; S.grade=0; S.tips.rep=false; {CLEAN}; F.setTab('school'); F.repTipCheck(); }})()")
            await pg.wait_for_timeout(500)
            tip = await pg.evaluate("[!document.querySelector('#tut').hidden, document.querySelector('#tutTitle').textContent, document.querySelector('#tutSkip').hidden, document.querySelector('#tutLater').hidden, document.querySelector('#tutNext').textContent, document.querySelector('#tutStep').textContent]")
            await pg.screenshot(path=f's43_tip_{tag}.png')
            if not tip[0] or tip[1] != '평판 모으기': fails.append(f'[{tag}] 평판 안내가 안 떠요 {tip}')
            if not (tip[2] and tip[3]) or tip[4] != '알겠어요' or tip[5]: fails.append(f'[{tag}] 안내 상자 단추가 이상해요 {tip}')
            await pg.evaluate("document.querySelector('#tutNext').click()"); await pg.wait_for_timeout(300)
            after = await pg.evaluate(f"[document.querySelector('#tut').hidden, {F}.S.tips.rep, {F}.rt.tut, {F}.S.tut.st]")
            if not after[0] or after[1] is not True or after[2] is not None or after[3] != 'skip': fails.append(f'[{tag}] 안내를 닫은 뒤 상태 {after}')
            await pg.evaluate(f"{F}.repTipCheck()"); await pg.wait_for_timeout(300)
            if not await pg.evaluate("document.querySelector('#tut').hidden"): fails.append(f'[{tag}] 평판 안내가 두 번 떠요')
            # 첫 튜토리얼은 그대로: 건너뛰기, 나중에가 보여요
            await pg.evaluate("document.querySelector('#tutReplay, [data-act=tut], #btnTut') && document.querySelector('#tutReplay, [data-act=tut], #btnTut').click()")
            if errs: fails.append(f'[{tag}] 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else f'FAIL ({len(fails)})')
    sys.exit(1 if fails else 0)

asyncio.run(main())
