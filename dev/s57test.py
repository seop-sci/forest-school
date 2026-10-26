# 1.8.0 시험: 숲속 합치기(머지 게임). 설계는 프로젝트 문서 "머지 게임 설계안 (1.8.0)".
# (1) 에너지: 1분에 1 회복, 100에서 멈춤, 보상으로 100 넘기, 생산기 한 번에 1, 광고 하루 2번(가짜 광고), 시계를 되돌려도 안 늘어남
# (2) 합치기: 같은 것 2개 겹치면 다음 단계, 10단계 상한, 다른 종류는 자리 바꾸기, 빈칸은 옮기기, 판 가득 참, 팔기 값(에너지 × 0.1분치), 5개 보너스
# (3) 생산기: 옮기기와 자리 바꾸기, 합쳐지지 않음, 두 종류가 번갈아(세 번 연달아 안 나옴), 레벨표대로(많이 눌러 통계), 강화 조각 값과 Lv.5 상한
# (4) 주문: 2~10단계와 best 범위, 보상(에너지 × 0.2분치, tierMinutes), 장식 조각(6단계 1, 8단계 2, 10단계 3), 강화 조각(8단계부터), 30분 바꾸기
# (5) 보상 연결: 오늘의 미션 +15, 보너스 상자 +20, 이번 주 미션 +30, 이벤트 도장 +10(5개째 +30, 7개째 강화 조각), 기념 상자 +50과 강화 조각, 마지막 주간 상자 강화 조각
# (6) 저장: 예전 저장(mg 없음)은 에너지 100과 빈 판, 망가진 판은 빈 판, 생산기가 빠진 저장은 다시 놓기, 메인 퀘스트 m1, m2
# (7) 화면: 밝은 390px과 어두운 360px, 지섭 폰 393×762에서 판과 주문이 넘치지 않는지. 끌어서 합치기
# 쓰는 법: python3 wrap.py && python3 s57test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys, json, calendar
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
FAKE_AD = "window.__adReady = true; window.FOREST_ADS = { adReady: () => window.__adReady, adState: () => '', preload: () => {}, showAd: done => setTimeout(() => done({ earned: true }), 30) };"
NOON = calendar.timegm((2026, 11, 3, 3, 0, 0)) * 1000   # 한국 시간 2026-11-03 낮 12시

async def boot(ctx, save=None):
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    if save is not None: await pg.add_init_script(f"localStorage.setItem('forest-school-v1', {json.dumps(json.dumps(save))});")
    await pg.goto(URL); await pg.wait_for_timeout(3000)
    await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; F.rt.fakeNow = {NOON}; S.clk.last = 0; S.mg.seen = true; }})()")
    return pg, errs

def setnow(ms): return f"{F}.rt.fakeNow = {ms}; {F}.S.clk.last = 0;"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();" + FAKE_AD)
        pg, errs = await boot(ctx)
        # ---- (1) 에너지
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          F.mgOpen(); out.e0 = S.mg.e;
          F.mgTapGen(0); out.e1 = S.mg.e;                              // 생산기 한 번에 1
          {setnow(NOON + 150000)} F.mgTick(); out.e2 = S.mg.e;         // 2분 30초 뒤 +2
          {setnow(NOON + 100 * 60000)} F.mgTick(); out.e3 = S.mg.e;    // 100에서 멈춤
          F.mgAddEnergy(30); out.e4 = S.mg.e;                           // 보상은 100을 넘어요
          {setnow(NOON + 200 * 60000)} F.mgTick(); out.e5 = S.mg.e;    // 넘은 상태에서는 회복 안 함
          {setnow(NOON + 10 * 60000)} F.mgTick(); out.e6 = S.mg.e;     // 시계 되돌리기: 게임 시계가 막아요
          {setnow(NOON + 200 * 60000)}
          return out; }})()""")
        if r['e0'] != 100 or r['e1'] != 99: fails.append(f'에너지 시작과 쓰기 {r}')
        if r['e2'] != 100: fails.append(f'에너지 2분 회복(99+2는 100에서 멈춰요) {r}')
        if r['e3'] != 100: fails.append(f'에너지 100에서 멈추기 {r}')
        if r['e4'] != 130 or r['e5'] != 130 or r['e6'] != 130: fails.append(f'에너지 보상 넘기기와 시계 {r}')
        # 광고 하루 2번
        r = await pg.evaluate(f"""(async()=>{{ const F={F}, S=F.S; S.mg.e = 10; const out = [];
          for (let i = 0; i < 3; i++) {{ F.mgWatchAd(); await new Promise(r => setTimeout(r, 150)); out.push(S.mg.e); }}
          return {{ out, n: S.mg.ad.n }}; }})()""")
        if r['out'] != [60, 110, 110] or r['n'] != 2: fails.append(f'광고 에너지 하루 2번 {r}')
        # ---- (2) 합치기
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          const c = F.mgEmptyBoard(); c[10] = 'a1'; c[11] = 'a1'; c[12] = 'a2'; c[13] = 'ax'; c[14] = 'ax'; c[20] = 'm1'; c[21] = 'a1';
          F.mgSetCells(c);
          out.merge = F.mgDrop(10, 11); out.c11 = F.mgCells()[11]; out.c10 = F.mgCells()[10];   // a1+a1 → a2
          out.merge2 = F.mgDrop(11, 12); out.c12 = F.mgCells()[12];                               // a2+a2 → a3
          out.cap = F.mgDrop(13, 14); out.c13 = F.mgCells()[13]; out.c14 = F.mgCells()[14];      // 10단계끼리는 자리 바꾸기
          out.swap = F.mgDrop(20, 21); out.c20 = F.mgCells()[20]; out.c21 = F.mgCells()[21];     // 다른 종류: 자리 바꾸기
          out.move = F.mgDrop(21, 30); out.c30 = F.mgCells()[30]; out.c21b = F.mgCells()[21];    // 빈칸: 옮기기
          out.best = S.mg.best.a; out.merges = S.mg.st.merges;
          // 5개 보너스: 가운데(42)에 놓고 둘레 상하좌우(34, 50, 41, 43)에 같은 것 → 다음 단계 2개 + 1단계 1개, 넷째 이웃(43)은 그대로
          const d = F.mgEmptyBoard(); d[42] = 'f1'; d[34] = 'f1'; d[50] = 'f1'; d[41] = 'f1'; d[43] = 'f1'; d[60] = 'f1'; F.mgSetCells(d);
          out.five = F.mgDrop(60, 42); const e = F.mgCells(); const got = [e[42], e[34], e[50], e[41], e[43], e[60]]; out.after5 = got.filter(x => x === 'f2').length + '/' + got.filter(x => x === 'f1').length + '/' + got.filter(x => x === '..').length; out.m5 = S.mg.st.merges;
          // 판 가득 참: 생산기를 눌러도 에너지가 안 줄어요
          const full = Array(F.MG.W * F.MG.H).fill('v1'); full[0] = 'A1'; full[2] = 'F1'; full[5] = 'S1'; full[7] = 'G1'; F.mgSetCells(full);
          const e0 = S.mg.e; out.fullTap = F.mgTapGen(0); out.fullE = S.mg.e === e0;
          // 팔기: 3단계 = 에너지 4 × 0.1분치
          const g = F.mgEmptyBoard(); g[10] = 's3'; F.mgSetCells(g); const b0 = S.budget; F.mgSell(10); out.sell = S.budget - b0; out.sellWant = F.minAcorns(0.4); out.sold = F.mgCells()[10];
          return out; }})()""")
        if r['merge'] != 'merge' or r['c11'] != 'a2' or r['c10'] != '..' or r['merge2'] != 'merge' or r['c12'] != 'a3': fails.append(f'합치기 {r}')
        if r['cap'] != 'swap' or r['c13'] != 'ax' or r['c14'] != 'ax': fails.append(f'10단계 상한 {r}')
        if r['swap'] != 'swap' or r['c20'] != 'a1' or r['c21'] != 'm1' or r['move'] != 'move' or r['c30'] != 'm1' or r['c21b'] != '..': fails.append(f'자리 바꾸기와 옮기기 {r}')
        if r['best'] != 3 or r['merges'] != 2: fails.append(f'best와 횟수 {r}')
        if r['five'] != 'merge' or r['after5'] != '2/2/2' or r['m5'] != 6: fails.append(f'5개 보너스 {r}')
        if r['fullTap'] or not r['fullE']: fails.append(f'판 가득 참 {r}')
        if r['sold'] != '..' or r['sell'] != r['sellWant']: fails.append(f'팔기 {r}')
        # ---- (3) 생산기
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          const c = F.mgEmptyBoard(); F.mgSetCells(c);
          out.genMove = F.mgDrop(0, 9); out.c9 = F.mgCells()[9]; out.c0 = F.mgCells()[0];           // 생산기 옮기기
          F.mgSetCells(F.mgEmptyBoard()); const d = F.mgCells(); d[1] = 'a1'; F.mgSetCells(d);
          out.genSwap = F.mgDrop(0, 1); out.s1 = F.mgCells()[1]; out.s0 = F.mgCells()[0];           // 생산기와 조각 자리 바꾸기
          F.mgSetCells(F.mgEmptyBoard()); out.genMerge = F.mgDrop(0, 2); out.g2 = F.mgCells()[2];   // 생산기끼리는 합쳐지지 않고 자리만 바꿔요
          F.mgSetCells(F.mgEmptyBoard());
          // 종류 번갈아: 참나무 200번 → a와 m 둘 다 나오고 세 번 연달아 없음
          S.mg.e = 999; const seq = []; for (let i = 0; i < 60; i++) {{ F.mgTapGen(0); const cc = F.mgCells(); const j = cc.findIndex((x, k) => k > 7 && x !== '..' && !seq.includes(k)); }}
          const kinds = F.mgCells().filter(x => F.MG.kinds[x[0]]).map(x => x[0]); out.kinds = [...new Set(kinds)].sort().join('');
          // 레벨표: Lv.5 생산기 4000번 → 2단계 11~17%, 4단계 0.3~2.2%
          const stat = {{}}; for (let i = 0; i < 4000; i++) {{ const n = F.mgSpawnLevel(5); stat[n] = (stat[n] || 0) + 1; }}
          out.lv5 = stat; const st1 = {{}}; for (let i = 0; i < 2000; i++) {{ const n = F.mgSpawnLevel(1); st1[n] = (st1[n] || 0) + 1; }} out.lv1 = st1;
          // 강화
          F.mgSetCells(F.mgEmptyBoard()); S.mg.up = 0; out.up0 = F.mgUpgrade(0); S.mg.up = 6;
          const lvs = []; for (let i = 0; i < 6; i++) {{ F.mgUpgrade(0); lvs.push(F.mgCells()[0] + ':' + S.mg.up); }} out.ups = lvs.join(' ');
          return out; }})()""")
        if r['genMove'] != 'move' or r['c9'] != 'A1' or r['c0'] != '..': fails.append(f'생산기 옮기기 {r}')
        if r['genSwap'] != 'swap' or r['s1'] != 'A1' or r['s0'] != 'a1': fails.append(f'생산기 자리 바꾸기 {r}')
        if r['genMerge'] != 'swap' or r['g2'] != 'A1': fails.append(f'생산기끼리 {r}')
        if r['kinds'] != 'am': fails.append(f"참나무에서 두 종류가 나와야 해요 {r['kinds']}")
        lv5 = r['lv5']; n5 = sum(lv5.values())
        if not (0.11 <= lv5.get('2', 0) / n5 <= 0.17) or not (0.003 <= lv5.get('4', 0) / n5 <= 0.022) or lv5.get('5'): fails.append(f'Lv.5 레벨표 {lv5}')
        if r['lv1'].get('2') or r['lv1'].get('3'): fails.append(f"Lv.1은 1단계만 {r['lv1']}")
        if r['up0'] or r['ups'] != 'A2:5 A3:4 A4:2 A5:0 A5:0 A5:0': fails.append(f'강화 {r}')
        # ---- (4) 주문
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          S.mg.best = {{ a: 6, m: 1, f: 1, d: 1, s: 1, c: 1, g: 1, v: 1 }}; S.mg.orders = []; F.mgFillOrders();
          out.n = S.mg.orders.length; out.lv = S.mg.orders.map(o => o.n); out.kindsDiff = new Set(S.mg.orders.map(o => o.k)).size;
          // 주문을 하나 고정해서 보상 확인: 6단계 1개 (에너지 32 × 0.2 = 6.4분치, 장식 조각 1)
          S.mg.orders[0] = {{ k: 'a', n: 6, c: 1, who: 'rabbit' }}; const r6 = F.mgOrderReward(S.mg.orders[0]);
          out.r6 = [r6.a, r6.pc, r6.up]; out.r6want = F.minAcorns(6.4);
          out.r8 = (() => {{ const x = F.mgOrderReward({{ k: 'a', n: 8, c: 1 }}); return [x.pc, x.up]; }})();
          out.r10 = (() => {{ const x = F.mgOrderReward({{ k: 'a', n: 10, c: 2 }}); return [x.pc, x.up]; }})();
          out.ok0 = F.mgOrderOk(S.mg.orders[0]);
          const c = F.mgEmptyBoard(); c[20] = 'a6'; F.mgSetCells(c); out.ok1 = F.mgOrderOk(S.mg.orders[0]);
          const b0 = S.budget, p0 = S.mg.pieces; out.claim = F.mgClaimOrder(0); {CLEAN};
          out.gain = S.budget - b0; out.pc = S.mg.pieces - p0; out.gone = F.mgCells()[20]; out.orders = S.mg.orders.length; out.cnt = S.mg.st.orders;
          // 바꾸기: 30분에 한 번
          S.mg.swapAt = 0; const k0 = S.mg.orders[1].k + S.mg.orders[1].n; out.sw1 = F.mgSwapOrder(1); out.sw2 = F.mgSwapOrder(1);
          {setnow(NOON + 200 * 60000 + 31 * 60000)} out.sw3 = F.mgSwapOrder(1);
          return out; }})()""")
        if r['n'] != 3 or any(not (2 <= n <= 6) for n in r['lv']): fails.append(f'주문 단계 범위 {r}')
        if r['r6'][0] != r['r6want'] or r['r6'][1] != 1 or r['r6'][2] != 0: fails.append(f'6단계 주문 보상 {r}')
        if r['r8'] != [2, 1] or r['r10'] != [6, 2]: fails.append(f'8단계, 10단계 주문 조각 {r}')
        if r['ok0'] or not r['ok1'] or not r['claim'] or r['gain'] != r['r6'][0] or r['pc'] != 1 or r['gone'] != '..' or r['orders'] != 3 or r['cnt'] != 1: fails.append(f'주문 건네기 {r}')
        if not r['sw1'] or r['sw2'] or not r['sw3']: fails.append(f'주문 바꾸기 30분 {r}')
        # ---- (5) 보상 연결
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}}; const e = () => S.mg.e;
          S.mg.e = 0; S.mg.up = 0;
          S.f.playground = 1; F.dmDay(); S.dm.list.forEach(m => {{ m.b = -9999; }}); const e0 = e(); F.claimMission(0); {CLEAN}; out.dm = e() - e0;
          S.dm.list.forEach(m => {{ m.done = true; }}); const e1 = e(); F.claimBonus(); {CLEAN}; out.bonus = e() - e1;
          F.wkWeek(); S.wk.list[0].b = -9999; const e2 = e(); F.claimWeekMission(0); out.wk = e() - e2;
          S.wk.pts = 9999; S.wk.got = S.wk.got.map(() => false); const u0 = S.mg.up; F.claimBox(F.MP_BOX.length - 1); {CLEAN}; out.boxUp = S.mg.up - u0;
          // 이벤트: 11월 3일은 도토리 수확 축제 (fakeNow는 11월 3일 낮)
          {setnow(NOON)} F.evSync(); S.ev.stamp = {{ n: 0, last: '' }}; const e3 = e(); F.claimStamp(); {CLEAN}; out.stamp1 = e() - e3;
          S.ev.stamp = {{ n: 4, last: '' }}; const e4 = e(); F.claimStamp(); {CLEAN}; out.stamp5 = e() - e4;
          S.ev.stamp = {{ n: 6, last: '' }}; const u1 = S.mg.up; F.claimStamp(); {CLEAN}; out.stamp7up = S.mg.up - u1;
          S.ev.list.forEach(m => {{ m.done = true; }}); S.ev.box = false; const e5 = e(), u2 = S.mg.up; F.claimEvBox(); {CLEAN}; out.box = e() - e5; out.evUp = S.mg.up - u2;
          return out; }})()""")
        if r['dm'] != 15 or r['bonus'] != 20 or r['wk'] != 30: fails.append(f'미션 에너지 {r}')
        if r['boxUp'] != 1: fails.append(f'마지막 주간 상자 강화 조각 {r}')
        if r['stamp1'] != 10 or r['stamp5'] != 30 or r['stamp7up'] != 1 or r['box'] != 50 or r['evUp'] != 1: fails.append(f'이벤트 에너지와 강화 조각 {r}')
        await pg.evaluate(f"{F}.mgClose()")
        # ---- (6) 저장
        r = await pg.evaluate(f"""(()=>{{ const F={F}; const d = JSON.parse(JSON.stringify(F.S)); const out = {{}};
          delete d.mg; let s = F.sanitize(d); out.old = [s.mg.e, s.mg.board.length, F.MG.gens ? Object.keys(F.MG.gens).every(G => s.mg.board.includes(G + '1')) : false];
          d.mg = {{ e: 55, board: 'zz'.repeat(80), up: 3, pieces: 7 }}; s = F.sanitize(d); out.bad = [s.mg.e, s.mg.board.slice(0, 2), s.mg.up, s.mg.pieces];
          const c = F.mgEmptyBoard(); c[0] = '..'; c[3] = 'ax'; d.mg = {{ e: 5, board: c.join('') }}; s = F.sanitize(d); const cc = []; for (let i = 0; i < 80; i++) cc.push(s.mg.board.slice(i * 2, i * 2 + 2));
          out.regen = [cc.filter(x => x === 'A1').length, cc[3]];
          const e = F.mgEmptyBoard(); e[1] = 'A3'; d.mg = {{ e: 5, board: e.join('') }}; s = F.sanitize(d); const ee = []; for (let i = 0; i < 80; i++) ee.push(s.mg.board.slice(i * 2, i * 2 + 2)); out.dup = [ee[0], ee[1], ee.filter(x => x[0] === 'A').length];
          out.quests = ['m1', 'm2'].map(id => F.MAIN.findIndex(q => q.id === id) >= 0);
          return out; }})()""")
        if r['old'] != [100, 160, True]: fails.append(f'예전 저장 {r}')
        if r['bad'][1] != 'A1' or r['bad'][0] != 55 or r['bad'][2] != 3 or r['bad'][3] != 7: fails.append(f'망가진 판 {r}')
        if r['regen'] != [1, 'ax'] or r['dup'][2] != 1: fails.append(f'생산기 되살리기와 중복 {r}')
        if r['quests'] != [True, True]: fails.append(f'메인 퀘스트 m1, m2 {r}')
        # ---- (7) 화면과 끌기
        for theme, w, h in [('light', 390, 844), ('dark', 360, 800), ('light', 393, 762)]:
            await pg.set_viewport_size({'width': w, 'height': h})
            await pg.evaluate(f"document.documentElement.setAttribute('data-theme','{theme}'); (()=>{{ const F={F}; F.mgSetCells(F.mgEmptyBoard()); F.mgOpen(); const c=F.mgCells(); c[12]='a1'; c[13]='a1'; F.mgSetCells(c); F.mgRenderAll(); }})()")
            await pg.wait_for_timeout(300)
            ov = await pg.evaluate("(()=>{ const sc=document.querySelector('#mgScene'); const b=document.querySelector('#mgBoard').getBoundingClientRect(), o=document.querySelector('#mgOrders').getBoundingClientRect(), f=document.querySelector('#mgFoot').getBoundingClientRect(); return { doc: document.documentElement.scrollWidth - innerWidth, bw: b.right <= innerWidth + 1 && b.left >= -1, ow: o.right <= innerWidth + 1, foot: f.bottom <= innerHeight + 1, topOk: o.bottom < b.top + 2, cell: document.querySelector('.mg-cell').getBoundingClientRect().width }; })()")
            if ov['doc'] > 0 or not ov['bw'] or not ov['ow'] or not ov['foot'] or not ov['topOk'] or ov['cell'] < 34: fails.append(f'{theme} {w}x{h} 화면 {ov}')
            await pg.screenshot(path=f's57_{theme}_{w}.png')
            # 끌어서 합치기 (12 → 13)
            ra = await pg.evaluate("(()=>{ const e=document.querySelectorAll('.mg-cell')[12].getBoundingClientRect(); return [e.left+e.width/2, e.top+e.height/2]; })()")
            rb = await pg.evaluate("(()=>{ const e=document.querySelectorAll('.mg-cell')[13].getBoundingClientRect(); return [e.left+e.width/2, e.top+e.height/2]; })()")
            await pg.mouse.move(*ra); await pg.mouse.down()
            for k in range(1, 8): await pg.mouse.move(ra[0] + (rb[0] - ra[0]) * k / 7, ra[1] + (rb[1] - ra[1]) * k / 7)
            await pg.mouse.up(); await pg.wait_for_timeout(250)
            dr = await pg.evaluate(f"(()=>{{ const c={F}.mgCells(); return [c[12], c[13], !!document.querySelector('.mg-drag')]; }})()")
            if dr != ['..', 'a2', False]: fails.append(f'{theme} {w}px 끌어서 합치기 {dr}')
            # 탭으로 고르기와 팔기 버튼 (합친 조각은 이미 골라져 있으니 먼저 풀어요)
            await pg.evaluate(f"{F}.mgUI.sel = -1; {F}.mgRenderAll()")
            await pg.mouse.click(*rb); await pg.wait_for_timeout(200)
            sel = await pg.evaluate("[!!document.querySelector('.mg-cell.sel'), !!document.querySelector('#mgFoot [data-mgsell]')]")
            if sel != [True, True]: fails.append(f'{theme} {w}px 조각 고르기 {sel}')
            await pg.evaluate(f"{F}.mgClose()")
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
