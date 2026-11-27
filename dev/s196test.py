# 196번 시험: 탐험 2부 1단계 '학교가 기지' (건물이 탐험을 키워요, 숫자는 제안값 TAM.base)
# 1) 건물 비율 = 건물 레벨 / 이번 학기 최고 레벨(0~1), 안 지은 건물과 아직 없는 학교급 건물은 0
# 2) 교실: 대원 훈련 상한 = 기준 레벨 + 20 + 30 × 교실 비율, 교실이 최고 레벨이면 상한 없음. 상한에 닿으면 레벨 올리기와 고르게 올리기가 멈추고 '교실 키우기' 단추
# 3) 운동장: 체육 대원 힘과 체력 +20% × 비율(다른 역할은 그대로)
# 4) 급식실: 응원 층 5 + 5 × 비율 / 도서관: 탐험 보고서 12시간 + 4시간 × 비율 / 과학실: 장비 재료 -20% × 비율
# 5) 학기 상한 = 학기 상한 + 그 학교급 학기 폭의 50% × 건물 평균 비율. 레벨 값 기준과 심화 탐험은 학기 상한(건물 빼고)을 그대로 써요
# 6) 건물 창의 '탐험에서' 한 줄(교실, 급식실, 도서관, 운동장, 과학실만)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, F
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sv = base(tier=1, students=60); sv['f'] = dict(classroom=9, cafeteria=9, library=9, playground=9, science=0)
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', sv)
        await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, o={{}}, cap = F.facCap();
          o.cap = cap; S.f.classroom = Math.floor(cap / 2); S.f.science = 0; S.f.store = 5;
          o.fill = [F.tamFill('classroom'), F.tamFill('science'), F.tamFill('store')];
          o.tc = F.tamTrainCap(); o.tcWant = F.tamLvRef() + 20 + Math.round(30 * S.f.classroom / cap);
          // 훈련 상한에 닿은 대원은 더 못 올려요
          const sp = S.tam.party[0]; S.tam.mem[sp] = {{ lv: o.tc, st: 1, sh: 0 }}; S.budget = 1e30;
          o.buy = F.tamLvBuy(sp, 1); o.lvAfter = S.tam.mem[sp].lv;
          for (const k of S.tam.party) S.tam.mem[k] = {{ lv: o.tc, st: 1, sh: 0 }};
          o.all = F.tamLvAll();
          S.f.classroom = cap; o.tcMax = F.tamTrainCap(); o.buy2 = F.tamLvBuy(sp, 1);
          // 운동장: 체육 대원만
          S.f.playground = 0; const pe0 = F.tamStat('bear'), sci0 = F.tamStat('fox');
          S.f.playground = cap; const pe1 = F.tamStat('bear'), sci1 = F.tamStat('fox');
          o.pe = +(pe1.atk / pe0.atk).toFixed(3); o.peHp = +(pe1.hp / pe0.hp).toFixed(3); o.sci = +(sci1.atk / sci0.atk).toFixed(3);
          // 급식실, 과학실
          S.f.cafeteria = 0; o.ch0 = F.tamCheerFl(); S.f.cafeteria = cap; o.ch1 = F.tamCheerFl();
          S.tam.sg[0].tool = 10; S.f.science = 0; o.g0 = F.tamGearCost('tool', 0).n; S.f.science = cap; o.g1 = F.tamGearCost('tool', 0).n;
          // 도서관: 13시간 비운 보고서
          S.tam.best = Math.max(S.tam.best, 20); S.tam.it = F.gameNow() - 20 * 3600e3;
          S.f.library = 0; o.i0 = Math.round(F.tamIdle().sec / 3600); S.f.library = cap; o.i1 = Math.round(F.tamIdle().sec / 3600);
          // 학기 상한
          for (const k of ['classroom', 'cafeteria', 'library', 'playground', 'science']) S.f[k] = 0;
          o.c0 = [F.tamCap(), F.tamCapBase(), F.tamLvRef()];
          for (const k of ['classroom', 'cafeteria', 'library', 'playground', 'science']) S.f[k] = cap;
          o.c1 = [F.tamCap(), F.tamCapBase(), F.tamLvRef(), F.tamCapBonus()];
          return o; }})()""")
        c.ok(r['fill'][1] == 0 and r['fill'][2] == 0 and abs(r['fill'][0] - (r['cap'] // 2) / r['cap']) < 1e-9, f'건물 비율 {r}')
        c.ok(r['tc'] == r['tcWant'] and r['buy'] == 0 and r['lvAfter'] == r['tc'] and r['all'] == 0, f'교실 훈련 상한 {r}')
        c.ok(r['tcMax'] is None or r['tcMax'] > 1e300 or r['tcMax'] == float('inf'), f'교실 최고 레벨이면 상한 없음 {r}')
        c.ok(r['buy2'] == 1, f'상한이 없어지면 다시 올려요 {r}')
        c.ok(r['pe'] == 1.2 and r['peHp'] == 1.2 and r['sci'] == 1.0, f'운동장 체육 대원 {r}')
        c.ok(r['ch0'] == 5 and r['ch1'] == 10 and r['g0'] == 34 and r['g1'] == 28, f'급식실 응원, 과학실 재료 {r}')
        c.ok(r['i0'] == 12 and r['i1'] == 16, f'도서관 보고서 시간 {r}')
        c.ok(r['c0'][0] == r['c0'][1] and r['c1'][0] == r['c1'][1] + r['c1'][3] and r['c1'][3] == 5 and r['c1'][1] == r['c0'][1] and r['c1'][2] == r['c0'][2], f'학기 상한과 기준 {r}')
        # 건물 창 한 줄과 탐험 화면 '교실 키우기' 단추
        r = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, o={{}}, sl=ms=>new Promise(r=>setTimeout(r,ms)), cap = F.facCap();
          S.f.classroom = Math.floor(cap / 2);
          const txt = async k => {{ F.openSheet(k); await sl(350); const el = document.querySelector('#sheetTam'); const t = el.hidden ? '' : el.textContent; F.closeSheet(); await sl(260); return t; }};
          o.cls = await txt('classroom'); o.caf = await txt('cafeteria'); o.lib = await txt('library'); o.pg = await txt('playground');
          S.f.store = 3; o.store = await txt('store');
          const sp = S.tam.party[0]; S.tam.mem[sp].lv = F.tamTrainCap();
          F.setTab('tam'); await sl(800); document.querySelectorAll('.overlay').forEach(x => {{ x.hidden = true; x.classList.remove('open'); }}); F.rt4.modalOpen = null;
          const nb = document.querySelector('#tmNav [data-tnav="mem"]'); if (nb) nb.click();
          await sl(400); o.capBtn = !!document.querySelector('[data-tcap]'); o.tip = (document.querySelector('.tm-tips') || {{}}).textContent || '';
          F.setTab('school'); await sl(300);
          return o; }}""")
        c.ok(r['cls'].startswith('탐험에서') and '대원 훈련 Lv.' in r['cls'] and '응원이' in r['caf'] and '보고서' in r['lib'] and '체육 대원' in r['pg'] and r['store'] == '', f'건물 창 한 줄 {r}')
        c.ok(r['capBtn'] and '학교 기지' in r['tip'], f'탐험 화면 교실 키우기 단추와 학교 기지 줄 {r}')
        c.ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    c.done()
asyncio.run(main())
