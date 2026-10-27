# 1.7.0 시험(2.0.0 매주 이벤트로 고침): 특별 이벤트 날짜 표. 수능 응원(2026-11-16~22), 크리스마스 파티(12-21~27), 설날 잔치(2027-02-01~07), 어린이날(05-03~09), 추석(09-13~19)이
# 그 주 월~일에 열리고, 다른 주에는 매주 이벤트 4가지가 순서대로 열리는지, 미션 3개가 겹치지 않고 놀이터 없는 새 학교도 할 수 있는지 봐요.
# 게임 시계를 수능 응원 기간으로 옮겨 이벤트 화면(배너 그림, 이름)도 확인해요.
# 쓰는 법: python3 wrap.py && python3 s56test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys, calendar
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
kst_noon = lambda y, m, d: calendar.timegm((y, m, d, 3, 0, 0)) * 1000

CASES = [   # 날짜, 열려 있어야 하는 이벤트 열쇠(없으면 None), 쉬는 매주 이벤트(없으면 None). 2.0.0: 특별 이벤트는 기념일이 든 주 월~일
    ('2026-11-03', 'harvest:2026-11-02', None), ('2026-11-12', 'friends:2026-11-09', None), ('2026-11-15', 'friends:2026-11-09', None),
    ('2026-11-16', 'exam:2026-11-16', None), ('2026-11-19', 'exam:2026-11-16', None), ('2026-11-22', 'exam:2026-11-16', None), ('2026-11-23', 'lunch:2026-11-23', None),
    ('2026-12-03', 'harvest:2026-11-30', None), ('2026-12-20', 'books:2026-12-14', None), ('2026-12-21', 'xmas:2026-12-21', None), ('2026-12-25', 'xmas:2026-12-21', None), ('2026-12-28', 'harvest:2026-12-28', None),
    ('2027-01-31', 'harvest:2027-01-25', None), ('2027-02-01', 'seollal:2027-02-01', None), ('2027-02-07', 'seollal:2027-02-01', None), ('2027-02-08', 'books:2027-02-08', None),
    ('2027-05-05', 'children:2027-05-03', None), ('2027-09-15', 'chuseok:2027-09-13', None), ('2027-09-03', 'lunch:2027-08-30', None),
]

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3500)
        await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; }})()")
        for day, want, skip in CASES:
            r = await pg.evaluate(f"""(()=>{{ const F={F}; const c = F.evCurrent('{day}'), s = F.evSkipped('{day}');
              const ms = c ? F.evMissions(c).map(m => m.t) : [];
              return {{ key: c ? c.key : null, skip: s ? s.def.id : null, ms, ok: ms.every(t => F.evOk(t)) }}; }})()""")
            if r['key'] != want: fails.append(f'{day} 열린 이벤트 {r["key"]} (기대 {want})')
            if r['skip'] != skip: fails.append(f'{day} 쉬는 반복 이벤트 {r["skip"]} (기대 {skip})')
            if want and (len(r['ms']) != 3 or len(set(r['ms'])) != 3 or not r['ok']): fails.append(f'{day} 미션 {r["ms"]} {r["ok"]}')
        # 다음 이벤트 안내: 11월 12일에는 수능 응원이 다음이에요
        nx = await pg.evaluate(f"(()=>{{ const n = {F}.evNext('2026-11-12'); return n ? n.key : null; }})()")
        if nx != 'exam:2026-11-16': fails.append(f'11월 12일의 다음 이벤트 {nx}')
        # 화면: 게임 시계를 11월 18일로
        await pg.evaluate(f"(()=>{{ const F={F}; F.rt.fakeNow = {kst_noon(2026, 11, 18)}; F.S.clk.last = 0; F.setServerTime && 0; F.evSync(); F.setTab('event'); }})()")
        await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"(()=>{{ const F={F}; const p=document.querySelector('#panelEvent'); const img=p.querySelector('img'); return {{ cur: F.S.ev.cur, today: F.gameToday(), txt: p.textContent.slice(0, 300), img: img ? img.getAttribute('src') === window.FS_IMG170.ev_banner_exam : false, doc: document.documentElement.scrollWidth - innerWidth }}; }})()")
        if r['cur'] != 'exam:2026-11-16' or '수능 응원' not in r['txt']: fails.append(f'수능 응원 화면 {r["cur"]} {r["today"]} {r["txt"][:80]}')
        if not r['img']: fails.append('수능 응원 배너 그림이 아니에요')
        if r['doc'] > 0: fails.append(f'이벤트 화면이 넘쳐요 {r["doc"]}')
        await pg.screenshot(path='s56_exam.png')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
