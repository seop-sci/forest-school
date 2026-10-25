# 1.5.6 시험: 이어하기 코드 화면이 없는지, 행사 카운트다운 알림판이 행사 자리를 가리지 않는지, 위쪽 줄 도토리 칸 두 단위 표시
# 쓰는 법: python3 wrap.py && python3 s47test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
FMT2 = [(0, '0'), (9999, '9,999'), (10000, '1만'), (25438, '2만 5438'), (254380000, '2억 5438만'), (254380123, '2억 5438만'),
        (200000000, '2억'), (3340200000000, '3조 3402억'), (3340200000001, '3조 3402억'), (12345678901234567, '1경 2345조'), (1.5e30, '150양'), (2.5e33, '250,000양')]

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, dark in ((344, False), (360, True), (390, False)):
            tag = ('d' if dark else 'l') + str(w)
            ctx = await b.new_context(viewport={'width': w, 'height': 780 if w == 344 else 844}, device_scale_factor=2, color_scheme='dark' if dark else 'light')
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear(); localStorage.setItem('forest-move-code', 'K7QM2XPA');")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500)
            await pg.evaluate(f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {F}.S.tips.rep=true; {CLEAN}; }})()")
            # 1) 이어하기 코드: 설정 단추도 창도 없어요
            if await pg.evaluate("!!document.querySelector('#optMove, #mMove, #moveMake')"): fails.append(f'[{tag}] 이어하기 화면이 남아 있어요')
            if w == 344:
                # 2) 두 단위 표시 (도토리 칸에만)
                got = await pg.evaluate(f"{[n for n, _ in FMT2]}.map(n => {F}.fmt2(n))")
                for (n, want), g in zip(FMT2, got):
                    if g != want: fails.append(f'fmt2({n}) = {g}, 바라는 값 {want}')
                short = await pg.evaluate(f"{F}.fmt(254380000)")
                if short != '2.54억': fails.append(f'다른 곳의 짧은 표시가 바뀌었어요 {short}')
            # 위쪽 줄 도토리 칸이 넘치지 않아요
            for n in (254380123, 3340200000000, 987654321098765432, 1.5e30):
                r = await pg.evaluate(f"""(()=>{{ const F={F}; F.S.budget={n}; F.renderHUD(); const e=document.querySelector('#vBudget'), pill=e.closest('.pill, .hud-res > *') || e.parentElement;
                  const a=e.getBoundingClientRect(), q=pill.getBoundingClientRect();
                  return [e.textContent, e.scrollWidth <= e.clientWidth + 1, a.left >= q.left - 1 && a.right <= q.right + 1, document.documentElement.scrollWidth <= innerWidth, parseFloat(getComputedStyle(e).fontSize)]; }})()""")
                if not (r[1] and r[2] and r[3]): fails.append(f'[{tag}] 도토리 칸이 넘쳐요 {r}')
                if r[4] < 12: fails.append(f'[{tag}] 도토리 글자가 너무 작아요 {r}')
            await pg.screenshot(path=f's47_top_{tag}.png', clip={'x': 0, 'y': 0, 'width': w, 'height': 140})
            # 3) 행사 카운트다운 알림판이 행사 자리(광장, 운동장) 아래에 떠요
            await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; S.budget=1000; S.tier=1; S.tg=5; S.students=30; S.f.playground=Math.max(1,S.f.playground); F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); F.renderHUD(); }})()")
            for fid in ('welcome', 'show', 'photo', 'sports'):
                await pg.evaluate(f"(()=>{{ const F={F}; for (const k in F.S.fest.next) F.S.fest.next[k]=0; F.S.sports.next=0; {CLEAN}; F.startFest('{fid}', true); }})()")
                await pg.wait_for_timeout(2500)   # 카운트다운 끝 무렵: 학생들이 행사 자리에 다 모였을 때
                r = await pg.evaluate(f"""(()=>{{ const F={F}, ban=document.querySelector('#feverBan'), br=ban.getBoundingClientRect();
                  const ks=[...document.querySelectorAll('#kids > g')].map(g=>g.getBoundingClientRect()).filter(q=>q.width>0);
                  const hit=ks.filter(q => q.right>br.left+2 && q.left<br.right-2 && q.bottom>br.top+2 && q.top<br.bottom-2).length;
                  const tabs=document.querySelector('.tabs').getBoundingClientRect().top;
                  return [!ban.hidden, Math.round(br.top), Math.round(br.bottom), Math.round(tabs), hit, ks.length]; }})()""")
                await pg.screenshot(path=f's47_{fid}_{tag}.png')
                if not r[0]: fails.append(f'[{tag} {fid}] 카운트다운 알림판이 안 보여요')
                elif r[2] > r[3] + 1: fails.append(f'[{tag} {fid}] 알림판이 아래 탭에 걸려요 {r}')
                elif fid != 'sports' and r[4] > 2: fails.append(f'[{tag} {fid}] 알림판이 행사 중인 학생 {r[4]}명을 가려요 {r}')
                await pg.evaluate(f"(()=>{{ const F={F}; if (F.rtFest()) F.endFest(); if (F.rtSports()) F.endSports(); {CLEAN}; }})()")
                await pg.wait_for_timeout(300)
            if errs: fails.append(f'[{tag}] 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else f'FAIL ({len(fails)})')
    sys.exit(1 if fails else 0)

asyncio.run(main())
