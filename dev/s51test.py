# 1.6.0 시험: 정수 상점(2.1.0부터 문방구와 꾸미기 가게). 상점 거리에서 문방구가 열리는지(도토리 묶음과 황금 묶음은 없어요),
# 꾸미기 가게에서 한정 모자와 특별 가구를 숲의 정수로 사고 입고 놓는지, 모자라면 공부 탭으로, 산 모자가 학생 머리에 그림으로 보이는지, 특별 가구가 방에 놓이는지,
# 저장했다 다시 불러와도 그대로인지, 옛 저장(es, cos.sp 없음)을 받아 주는지. 밝은 화면 390px과 어두운 화면 360px에서 넘침 없음.
# 쓰는 법: python3 wrap.py && python3 s51test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, dark in ((390, False), (360, True)):
            tag = ('d' if dark else 'l') + str(w)
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(3800)
            await pg.evaluate(f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()")
            # 준비: 학교를 조금 키우고 정수를 넉넉히
            await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; S.tier=1; S.budget=1e6; for (const k of ['classroom','cafeteria','library','playground','science']) S.f[k]=Math.max(3,S.f[k]||0); S.students=20; S.ess=1000; F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); F.renderHUD(); F.renderAffordance(); }})()")
            # 1) 정수 상점으로 가는 길이 보이고 눌리는지 (1.7.2: 아래 상점 탭 → 상점 거리 → 정수 상점)
            await pg.evaluate("document.querySelector('.tabs .tab[data-tab=street]').click()"); await pg.wait_for_timeout(300)
            vis = await pg.evaluate("(()=>{ const b=document.querySelector('#sfEss'); return b && !b.hidden && b.getBoundingClientRect().width>0; })()")
            if not vis: fails.append(f'[{tag}] 상점 거리의 정수 상점 가게가 안 보여요')
            await pg.evaluate("document.querySelector('#sfEss').click()"); await pg.wait_for_timeout(400)
            r = await pg.evaluate(f"(()=>{{ const p=document.querySelector('#panelEss'); return [!p.hidden, document.querySelector('#essHave2').textContent, document.querySelectorAll('#essList .si').length, !document.querySelector('[data-ebuy=acorn],[data-ebuy=gold]'), p.scrollWidth<=p.clientWidth+1, document.querySelectorAll('#essList [data-ebuy^=tk]').length]; }})()")
            if not r[0]: fails.append(f'[{tag}] 문방구 패널이 안 열려요')
            if r[1] != '1,000': fails.append(f'[{tag}] 정수 표시 {r[1]}')
            if r[2] != 0 or not r[3] or r[5] != 4: fails.append(f'[{tag}] 문방구 상품(모자 가구 없음, 묶음 없음, 단축권 넷) {r}')
            if not r[4]: fails.append(f'[{tag}] 문방구가 가로로 넘쳐요')
            await pg.screenshot(path=f's51_shop_{tag}.png')
            # 2) 꾸미기 가게에서 모자 사기: 묻는 창 → 사기 → 정수 120 줄고 입혀짐
            await pg.evaluate(f"{F}.setTab('deco')"); await pg.wait_for_timeout(200)
            await pg.evaluate(f"{F}.pickDeco('hat:wizard')"); await pg.wait_for_timeout(200)
            ask = await pg.evaluate("[!document.querySelector('#decoAsk').hidden, document.querySelector('#decoAskText').textContent, document.querySelector('#decoYes').textContent]")
            if not ask[0] or '120' not in ask[1] or ask[2] != '사기': fails.append(f'[{tag}] 모자 묻는 창 {ask}')
            await pg.evaluate("document.querySelector('#decoYes').click()"); await pg.wait_for_timeout(300)
            r = await pg.evaluate(f"(()=>{{ const S={F}.S; return [S.ess, S.cos.hat, S.cos.own.includes('hat:wizard'), document.querySelector('#decoList .si.on .nm') && document.querySelector('#decoList .si.on .nm').textContent]; }})()")
            if r != [880, 'wizard', True, '마법사 모자']: fails.append(f'[{tag}] 모자 사기 뒤 상태 {r}')
            # 학생 머리에 그림 모자
            kid = await pg.evaluate(f"(()=>{{ const F={F}; F.rt.kids.forEach(k => {{ k.g.innerHTML = F.kidSVG ? '' : k.g.innerHTML; }}); const svg = document.querySelector('#kids image[href*=\"webp\"]'); const hats = document.querySelectorAll('#kids g[transform*=scale] image'); return hats.length; }})()")
            if kid < 1: fails.append(f'[{tag}] 학생 머리에 그림 모자가 안 보여요 ({kid})')
            # 한 번 더 누르면 벗어요, 또 누르면 입어요
            await pg.evaluate(f"{F}.pickDeco('hat:wizard')"); await pg.wait_for_timeout(150)
            if await pg.evaluate(f"{F}.S.cos.hat") != '': fails.append(f'[{tag}] 산 모자를 다시 눌러도 안 벗어요')
            await pg.evaluate(f"{F}.pickDeco('hat:wizard')"); await pg.wait_for_timeout(150)
            # 꾸미기 백화점 옷장에는 산 한정 모자만 보여요
            gs = await pg.evaluate(f"(()=>{{ {F}.setTab('shop'); const names=[...document.querySelectorAll('#shopList .si .nm')].map(e=>e.textContent); {F}.setTab('deco'); return names; }})()")
            if '마법사 모자' not in gs or '산타 모자' in gs: fails.append(f'[{tag}] 꾸미기 백화점 옷장의 한정 모자 표시 {gs}')
            # 3) 특별 가구 사기 → 방에 놓임
            await pg.evaluate(f"{F}.pickDeco('sp:aquarium')"); await pg.wait_for_timeout(150)
            await pg.evaluate("document.querySelector('#decoYes').click()"); await pg.wait_for_timeout(300)
            r = await pg.evaluate(f"(()=>{{ const S={F}.S; return [S.ess, S.cos.sp.classroom, S.cos.own.includes('sp:aquarium')]; }})()")
            if r != [680, 'aquarium', True]: fails.append(f'[{tag}] 가구 사기 뒤 상태 {r}')
            room = await pg.evaluate(f"(()=>{{ const F={F}; F.setTab('school'); F.openSheet('classroom'); const n=document.querySelectorAll('#furBox .fur-sp image').length; const vb=document.querySelector('#furBox svg'); F.closeSheet(); return n; }})()")
            if room != 1: fails.append(f'[{tag}] 교실 방에 어항이 안 놓여요 ({room})')
            await pg.evaluate(f"(()=>{{ const F={F}; F.setTab('school'); F.openSheet('classroom'); }})()"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f's51_room_{tag}.png')
            await pg.evaluate(f"(()=>{{ const F={F}; F.closeSheet(); F.setTab('deco'); }})()"); await pg.wait_for_timeout(300)
            # 치우기, 다시 놓기
            await pg.evaluate(f"{F}.pickDeco('sp:aquarium')"); await pg.wait_for_timeout(100)
            if await pg.evaluate(f"{F}.S.cos.sp.classroom") != '': fails.append(f'[{tag}] 산 가구를 다시 눌러도 안 치워져요')
            await pg.evaluate(f"{F}.pickDeco('sp:aquarium')"); await pg.wait_for_timeout(100)
            # 4) 5) 도토리 묶음과 황금 도토리 묶음은 2.1.0에서 뺐어요(s82에서 없는지 봐요)
            # 6) 모자라면 미니게임으로
            await pg.evaluate(f"(()=>{{ const F={F}; F.S.ess = 5; F.pickDeco('hat:santa'); }})()"); await pg.wait_for_timeout(100)
            t = await pg.evaluate("[document.querySelector('#decoAskText').textContent, document.querySelector('#decoYes').textContent]")
            if '모자라요' not in t[0] or t[1] != '공부 가기': fails.append(f'[{tag}] 모자랄 때 안내 {t}')
            await pg.evaluate("document.querySelector('#decoYes').click()"); await pg.wait_for_timeout(200)
            if await pg.evaluate(f"{F}.rt.tab") != 'mini': fails.append(f'[{tag}] 모자랄 때 공부 탭으로 안 가요')
            # 7) 저장했다 다시 불러오기
            await pg.evaluate(f"(()=>{{ const F={F}; F.S.ess = 77; F.sanitize && 0; }})()")
            await pg.evaluate("window.__forest.rt.fakeNow = 0")
            sv = await pg.evaluate("(()=>{ const S=window.__forest.S; S.ess=77; S.es.n=3; S.es.g=2; return JSON.parse(JSON.stringify(S)); })()")
            s2 = await pg.evaluate("(d)=>{ const s=window.__forest.sanitize(d); return [s.ess, s.cos.hat, s.cos.sp.classroom, s.cos.own.filter(x=>x.startsWith('hat:w')||x.startsWith('sp:')), s.es.n, s.es.g]; }", sv)
            if s2[0] != 77 or s2[1] != 'wizard' or s2[2] != 'aquarium' or sorted(s2[3]) != ['hat:wizard', 'sp:aquarium']: fails.append(f'[{tag}] 저장 다시 읽기 {s2}')
            # 옛 저장(es, cos.sp 없음)에 산 가구가 있으면 바로 놓아요
            old = dict(sv); old.pop('es', None); old['cos'] = dict(sv['cos']); old['cos'].pop('sp', None)
            s3 = await pg.evaluate("(d)=>{ const s=window.__forest.sanitize(d); return [s.es.n, s.es.g, s.cos.sp.classroom, s.cos.sp.library]; }", old)
            if s3 != [0, 0, 'aquarium', '']: fails.append(f'[{tag}] 옛 저장 받아 주기 {s3}')
            if errs: fails.append(f'[{tag}] 페이지 오류 {errs[:2]}')
            await ctx.close()
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
