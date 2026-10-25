# 1.5.4 시험: 가구 모습은 학교급마다 한 단계(같은 학교급에서는 개수만), 까치 핫딜 값어치, 미니게임 탭 문구
# 쓰는 법: python3 wrap.py && python3 s45test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()")
        # 1) 가구 모습: 유치원은 레벨이 올라도 낡은 모습, 초등학교는 첫 가구부터 튼튼한 모습
        st = await pg.evaluate(f"(()=>{{ const F={F}; F.S.tier=0; const a=[1,5,10,16].map(F.furStage); F.S.tier=1; const b=[1,5,18].map(F.furStage); F.S.tier=5; const c=F.furStage(1); F.S.tier=0; return [a,b,c,F.furStage(0)]; }})()")
        if st[0] != [1, 1, 1, 1]: fails.append(f'유치원 가구 모습이 레벨마다 바뀌어요 {st[0]}')
        if st[1] != [2, 2, 2]: fails.append(f'초등학교 가구 모습 {st[1]}')
        if st[2] != 4 or st[3] != 0: fails.append(f'높은 학교급이나 없는 가구 {st[2:]}')
        # 같은 학교급에서는 레벨이 오르면 개수가 늘어요 (방 안 책상 수)
        cnt = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=0; S.f.classroom=12; const out=[];
          for (const n of [1, 6, 12]) {{ S.fu.classroom=[n,n,n,n]; F.openSheet('classroom'); out.push(document.querySelectorAll('#furScene image').length); F.closeSheet(); }}
          return out; }})()""")
        await pg.wait_for_timeout(300)
        if not (cnt[0] < cnt[1] < cnt[2]): fails.append(f'레벨이 올라도 가구 수가 안 늘어요 {cnt}')
        hint = await pg.evaluate(f"(()=>{{ const F={F}; F.openSheet('classroom'); const t=document.querySelector('#furList').textContent; F.closeSheet(); return t; }})()")
        await pg.wait_for_timeout(300)
        if '다음 학교급에서 새 모습' not in hint or 'Lv.5에 새 모습' in hint: fails.append(f'가구 안내 문구 {hint[:80]}')
        # 학교급이 오른 뒤 처음 놓은 가구: 새 모습 알림 한 번
        tst = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=1; S.hd.furNew=false; S.f.cafeteria=Math.max(1,S.f.cafeteria); S.fu.cafeteria=[0,0,0,0]; S.budget=1e12;
          F.buyFur('cafeteria',0); const a=document.querySelector('#toast').textContent; F.buyFur('cafeteria',1); const b=S.hd.furNew; return [a,b]; }})()""")
        if '튼튼한 모습' not in tst[0] or tst[1] is not True: fails.append(f'새 학교급 첫 가구 알림 {tst}')
        # 2) 까치 핫딜: 특식 데이 20분, 반값은 수업료 30분치보다 많이 아낄 때만
        d = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=0; S.hd.feastUntil=0; S.f.classroom=3; S.fu.classroom=[3,3,3,3];
          const c=F.facCost('classroom'); const out={{feastMin: F.DEAL.feastMin}};
          // 도토리가 반값과 정가 사이이고, 반값이 수업료 30분치보다 작으면 반값 대신 특식이 나와요
          S.budget = c*0.75; S.students=F.capacity();
          const r = F.rate(); out.small = c/2 < r*1800; out.pick = (F.makeDeal()||{{}}).type; out.half = c/2; out.r30 = r*1800;
          return out; }})()""")
        if d['feastMin'] != 20: fails.append(f"특식 데이가 20분이 아니에요 {d['feastMin']}")
        if d['small'] and d['pick'] in ('fac', 'tea'): fails.append(f'아끼는 도토리가 30분치보다 작은데 반값 핫딜이 나왔어요 {d}')
        big = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.hd.feastUntil=0; S.students=1; const c=F.facCost('classroom'); S.budget=c*0.75;
          const ok = c/2 >= F.rate()*1800; const k=F.makeDeal(); return [ok, k && k.type, k && k.k]; }})()""")
        if big[0] and big[1] not in ('fac', 'tea'): fails.append(f'아끼는 도토리가 충분한데 반값 핫딜이 안 나와요 {big}')
        # 3) 미니게임 탭과 준비 중 단추에 버전 번호가 없어요
        txt = await pg.evaluate("[document.querySelector('#panelMini').textContent, [...document.querySelectorAll('[data-soon]')].map(b => b.dataset.soon).join('|')]")
        import re
        if re.search(r'\d+\.\d+\.\d+', txt[0] + txt[1]): fails.append(f'버전 번호가 남아 있어요 {txt}')
        if '숲속 교육부에서 열심히 준비 중이에요' not in txt[0]: fails.append('미니게임 준비 문구가 없어요')
        await pg.evaluate(f"{F}.setTab('mini')"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='s45_mini.png')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else f'FAIL ({len(fails)})')
    sys.exit(1 if fails else 0)

asyncio.run(main())
