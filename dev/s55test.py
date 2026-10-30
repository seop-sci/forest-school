# 1.7.0 시험: 고슴도치 교감 선생님. 선생님 탭 맨 아래 카드, 연수 값은 곰 선생님 연수 곡선, 레벨마다 학교 행사 상품 +10%, 최고 Lv.10,
# 연수 횟수(S.st.trains)에 더해지고 수업료(rate)는 그대로. 도감 선생님 칸에 처음부터 등록되고 도감은 17종(1.7.1부터, 완성 목표도 17종). 예전 저장(vp 없음)은 Lv.0.
# 밝은 화면 390px과 어두운 화면 360px에서 카드가 넘치지 않는지 봐요.
# 쓰는 법: python3 wrap.py && python3 s55test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3500)
        await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; S.budget=1e15; }})()")
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          out.lv0 = F.vpLv(); out.mult0 = F.vpMult(); out.rate0 = F.rate(); out.prize0 = F.festPrize(true); out.sp0 = F.sportsPrize(false); out.tr0 = S.st.trains;
          // 값: 곰 선생님 연수 곡선과 같아요 (곰 Lv.1 → 2 값 = 교감 Lv.0 → 1 값)
          const bt = S.t.bear; S.t.bear = 1; out.bearCost = F.teaCost('bear'); S.t.bear = bt; out.vpCost = F.vpCost();
          F.setTab('teachers'); const cards = [...document.querySelectorAll('#teacherList .tcard')].map(c => c.dataset.k); out.cards = cards;
          document.querySelector('.tcard[data-k="vp"] button').click();
          out.lv1 = F.vpLv(); out.tr1 = S.st.trains; out.rate1 = F.rate(); out.mult1 = F.vpMult();
          for (let i = 0; i < 15; i++) F.vpAct();
          out.lvMax = F.vpLv(); out.multMax = F.vpMult(); out.btn = document.querySelector('.tcard[data-k="vp"] .lbl').textContent;
          out.prizeMax = F.festPrize(true); out.rateMax = F.rate();
          return out; }})()""")
        if r['lv0'] != 0 or r['mult0'] != 1: fails.append(f"처음 교감 레벨 {r['lv0']} {r['mult0']}")
        if r['vpCost'] != r['bearCost']: fails.append(f"교감 연수 값이 곰 곡선과 달라요 {r['vpCost']} {r['bearCost']}")
        if r['cards'] != ['squirrel', 'bear', 'owl', 'kor', 'art', 'vp', 'diet', 'lib', 'snack']:   # 1.7.1: 교감 선생님 밑에 영양, 사서 선생님. 2.3.0 곰과 부엉이 순서, 국어 미술(교감 위), 매점(맨 밑)
            fails.append(f"선생님 카드 순서 {r['cards']}")
        if r['lv1'] != 1 or r['tr1'] != r['tr0'] + 1 or abs(r['mult1'] - 1.1) > 1e-9: fails.append(f"연수 1번 {r}")
        if r['lvMax'] != 10 or abs(r['multMax'] - 2) > 1e-9 or r['btn'] != '최고 레벨': fails.append(f"최고 레벨 {r['lvMax']} {r['multMax']} {r['btn']}")
        rr = r['rateMax'] / r['rate0'] if r['rate0'] else 0
        if not (0.99 < rr < 1.01): fails.append(f"교감 연수가 수업료를 바꿨어요 {r['rate0']} {r['rateMax']}")
        if not (1.9 < r['prizeMax'] / r['prize0'] < 2.1): fails.append(f"행사 상품이 2배가 아니에요 {r['prize0']} {r['prizeMax']}")
        # 화면
        for theme, w in [('light', 390), ('dark', 360)]:
            await pg.set_viewport_size({'width': w, 'height': 844})
            await pg.evaluate(f"document.documentElement.setAttribute('data-theme','{theme}'); {F}.setTab('school'); {F}.setTab('teachers'); document.querySelector('#panelTeachers, .panel:not([hidden])').scrollTop = 99999")
            await pg.wait_for_timeout(300)
            ov = await pg.evaluate("(()=>{ const c=document.querySelector('.tcard[data-k=\"vp\"]').getBoundingClientRect(); return { right: c.right - innerWidth, doc: document.documentElement.scrollWidth - innerWidth }; })()")
            if ov['right'] > 0 or ov['doc'] > 0: fails.append(f'{theme} {w}px 교감 카드가 넘쳐요 {ov}')
            await pg.screenshot(path=f's55_{theme}_teachers.png')
        # 도감
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.setTab('dex'); const head = document.querySelector('#dexHead').textContent;
          const card = document.querySelector('#dexBody .dex-card[data-dex="tea_hedgehog"]');
          const goal = F.DEX_REWARD.goals.find(g => g.key === 's14');
          return {{ n: F.DEX_KEYS.length, got: !!S.dex.got.tea_hedgehog, on: card && card.classList.contains('on'), head, need: goal.need }}; }})()""")
        if r['n'] != 26 or not r['got'] or not r['on'] or r['need'] != 26 or '/ 26종' not in r['head']: fails.append(f"도감 교감 선생님 {r}")
        # 예전 저장
        r = await pg.evaluate(f"(()=>{{ const F={F}; const d = JSON.parse(JSON.stringify(F.S)); delete d.vp; const a = F.sanitize(d).vp; d.vp = 99; const b = F.sanitize(d).vp; d.vp = -3; const c = F.sanitize(d).vp; return [a, b, c]; }})()")
        if r != [0, 10, 0]: fails.append(f'예전 저장 교감 레벨 {r}')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
