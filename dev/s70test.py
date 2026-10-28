# 2.0.0 시험(2026-10-27 지섭 요청 묶음)
# (1) 이벤트 중의 고치기 미션(2.0.0 전에 받은 것)이나 못 하게 된 미션은 할 수 있는 미션으로 바뀌고, 바뀐 미션은 지금부터 다시 세요
# (1-2) 이벤트 미션에 고치기와 연수가 없어요. (2-2) 도장 7개째에 이벤트 한정 학생 모자
# (2) 이벤트 정수: 도장 5개째 +5, 기념 상자 +10. 이벤트 한정 장식은 그림이 있을 때 그 이벤트 상자에서 처음 한 번만 받고, 가게에서는 살 수 없어요
# (3) 동아리 발표회: 월~금 하루 한 번, 그 주에 못 연 날이 있으면 주말에 2번까지(못 연 날 수까지) 보충
# (4) 황금 상점 부스터 세 가지 묶음 10% 할인(11 → 10), 한꺼번에 써요
# (5) 명예 교장실과 장학재단 추천 표시
# (6) 상점과 출석부 화면에 '분치'가 없고, 상점 위에 도토리 안내 한 줄
# 쓰는 법: python3 wrap.py && python3 s70test.py   (마지막 줄이 PASS면 통과)
import asyncio, calendar, json, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
kst = lambda y, m, d: calendar.timegm((y, m, d, 3, 0, 0)) * 1000
NOTE = '도토리 양은 학교가 성장할수록 커져요'
PROMOTE = f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 5; S.sem = 1; S.p.species = 6; Object.assign(S.f, {{ classroom: 38, cafeteria: 30, library: 28, playground: 28, science: 18 }});
  for (const k in S.fu) S.fu[k] = S.fu[k].map(() => S.f[k]); S.students = 158; S.tdip = 250; S.grade = 4; S.best = 4;
  S.q.m = F.MAIN.findIndex(q => q.id === 'e39'); S.q.lat = ''; F.checkGrade(); F.promote(); {CLEAN}; F.clubAuto(true); return S.tier; }})()"""

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 360, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3000); await pg.evaluate(SKIP)

        # (1) 미션 바꾸기
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.rt.fakeNow={kst(2026, 11, 3)}; S.clk.last=0; F.evSync();
          S.f.playground = 1; S.ev.list = [{{ t: 'ups', n: 40, b: S.st.ups || 0, m: 10, g: 1, done: false }}, {{ t: 'claims', n: 3, b: 0, m: 10, g: 1, done: false }}, {{ t: 'dmDone', n: 4, b: 0, m: 10, g: 1, done: false }}];
          S.st.shakes = 500; const ch = F.evFix(); const m = S.ev.list[0]; const again = F.evFix();
          return {{ ch, again, t: S.ev.list.map(x => x.t), b: m.b, st: F.evVal(m.t), ok: S.ev.list.every(x => F.evOk(x.t)) }}; }})()""")
        if r['again'] or not r['ch'] or r['t'][0] == 'ups' or len(set(r['t'])) != 3 or not r['ok'] or r['b'] != r['st']: fails.append(f'미션 바꾸기 {r}')

        # (2) 정수와 한정 장식
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const real = !!(window.FS_IMG200 && window.FS_IMG200.evd_harvest && window.FS_IMG200.evd_friends);   // 작업지시서 26 그림 23장이 들어 있어요
          S.ess = 0; S.ev.stamp = {{ n: 4, last: '' }}; F.claimStamp(); {CLEAN}; const e5 = S.ess;
          S.ev.list.forEach(m => m.done = true); S.ev.box = false; const g0 = S.ess; F.claimEvBox(); {CLEAN};
          const own1 = F.decoOwn('ev_harvest'), e10 = S.ess - g0;
          // 4주 뒤 다시 수확 축제: 장식은 그대로 하나, 정수만
          F.rt.fakeNow={kst(2026, 12, 1)}; S.clk.last=0; F.evSync(); S.ev.list.forEach(m => m.done = true); S.ev.box = false; const g1 = S.ess; F.claimEvBox(); {CLEAN};
          const own2 = F.decoOwn('ev_harvest'), e10b = S.ess - g1;
          // 그림이 없는 이벤트(친구 주간 그림을 일부러 뺐어요) 상자에서는 장식이 안 나와요
          const keep = window.FS_IMG200.evd_friends; delete window.FS_IMG200.evd_friends;
          F.rt.fakeNow={kst(2026, 11, 10)}; S.clk.last=0; F.evSync(); S.ev.list.forEach(m => m.done = true); S.ev.box = false; F.claimEvBox(); {CLEAN};
          const fr = F.decoOwn('ev_friends');
          // 그림을 되돌리면 같은 이벤트 상자에서 장식이 나와요
          window.FS_IMG200.evd_friends = keep; S.ev.box = false; S.ev.list.forEach(m => m.done = true); F.claimEvBox(); {CLEAN}; const fr2 = F.decoOwn('ev_friends');
          // 가게: 이벤트 한정 장식 칸이 보이고, 살 수 없어요
          F.rt.decoPick = 'ev_lunch'; const bought = F.buyDeco(); F.renderDecoShop();
          const sec = document.querySelector('#decoList').textContent.includes('이벤트 한정 장식');
          return {{ real, e5, e10, own1, own2, e10b, fr, fr2, bought, sec, lunch: F.decoOwn('ev_lunch'), n: F.EV_DECO.length }}; }})()""")
        if r['e5'] != 5 or r['e10'] != 10 or r['e10b'] != 10: fails.append(f'이벤트 정수 {r}')
        if r['own1'] != 1 or r['own2'] != 1 or r['fr'] != 0 or r['fr2'] != 1 or not r['real'] or r['bought'] is not False or r['lunch'] != 0 or not r['sec'] or r['n'] != 23: fails.append(f'이벤트 한정 장식 {r}')

        # (1-2) 이벤트 미션 표에는 고치기와 연수가 없고(2026-10-27 지섭: 어려워서 빼요), 합치기 주문 미션은 S.mg.st.orders로 세요
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const rows = [];
          for (let mo = 1; mo <= 12; mo++) for (const e of F.EV_WEEKLY) rows.push({{ def: e, start: `2026-${{String(mo).padStart(2,'0')}}-01` }});
          for (const e of F.EV_SPECIAL) rows.push({{ def: e, start: e.start || '2026-12-24' }});
          const hard = rows.filter(r => F.evMissions(r).some(m => m.t === 'ups' || m.t === 'trains')).map(r => r.def.id);
          const fb = F.EV_FALLBACK.map(x => x[0]); const o0 = F.evVal('mgOrd'); S.mg.st.orders += 3;
          return {{ hard, fb, d: F.evVal('mgOrd') - o0 }}; }})()""")
        if r['hard'] or 'ups' in r['fb'] or 'trains' in r['fb'] or r['d'] != 3: fails.append(f'어려운 미션 빼기 {r}')
        # (2-2) 도장 7개째에 그 이벤트 한정 학생 모자(그림이 있을 때), 상점에서는 살 수 없어요
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.rt.fakeNow={kst(2026, 11, 24)}; S.clk.last=0; F.evSync();
          const art = F.EV_HAT.filter(([k]) => (window.FS_IMG200 || {{}})['cos_hat_ev_' + k]).length;   // 작업지시서 27 그림 23개(2026-10-28 넣음)
          const key = 'hat:ev_lunch';
          const shop0 = F.pickShop('c:hat:ev_lunch'); const own0 = S.cos.own.includes(key);
          S.ev.stamp = {{ n: 6, last: '' }}; F.claimStamp(); {CLEAN}; const own1 = S.cos.own.includes(key);
          F.setTab('shop'); const shown = document.querySelector('#shopList').textContent.includes('요리사 모자');
          F.pickShop('c:hat:ev_lunch'); const on = S.cos.hat; F.setTab('school');
          return {{ cur: S.ev.cur, own0, own1, shown, on, n: F.EV_HAT.length, art }}; }})()""")
        if r['own0'] or not r['own1'] or not r['shown'] or r['on'] != 'ev_lunch' or r['n'] != 23 or r['art'] != 23: fails.append(f'이벤트 한정 모자 {r}')
        # (4) 2.1.0: 황금 도토리 부스터 묶음은 빼고(황금은 꾸미기에만), 수업료 2배는 문방구 정수 부스터로
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.setTab('shop'); const t = document.querySelector('#panelShop').textContent; {CLEAN};
          return {{ item: F.shopItem('b:all'), boost: !!document.querySelector('#shopList [data-buy^="b:"]'), feast: !!F.essItem('bf'), txt: t }}; }})()""")
        if r['item'] is not None or r['boost'] or not r['feast']: fails.append(f'부스터 자리 {dict((k, r[k]) for k in r if k != "txt")}')
        if '부스터 세 가지 묶음' in r['txt'] or '분치' in r['txt']: fails.append('꾸미기 백화점 글자')
        await pg.screenshot(path='s70_shop.png')
        r = await pg.evaluate(f"""(()=>{{ const F={F}; F.setTab('ess'); F.renderEssShop(); return document.querySelector('#panelEss').textContent; }})()""")
        if NOTE not in r or '분치' in r: fails.append('문방구 글자')
        r = await pg.evaluate(f"""(()=>{{ const F={F}; F.setTab('school'); const g = document.querySelector('#attGrid'); if (g) F.renderAtt && F.renderAtt(); return g ? g.textContent : ''; }})()""")
        if '분치' in r: fails.append(f'출석부에 분치 {r[:80]}')

        # (5) 추천
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; for (const k in S.p.perk) S.p.perk[k] = 0; for (const k in S.fp) S.fp[k] = 0;
          const a = F.perkRec().k; S.p.perk.schol = 10; const b = F.perkRec().k; S.p.perk.night = 1; const c = F.perkRec().k; S.p.perk.night = 4; S.p.perk.drop = 6; S.p.perk.rep = 6; S.p.perk.start = 6; const d = F.perkRec().k;
          const fa = F.fpRec().k; S.fp.schol = 6; const fb = F.fpRec().k;
          S.fund = 5; S.p.dip = 3; F.setTab('grad'); F.renderGradPanel(true);
          return {{ a, b, c, d, fa, fb, tags: document.querySelectorAll('#perkList .p-rec').length + document.querySelectorAll('#fundList .p-rec').length }}; }})()""")
        if [r['a'], r['b'], r['c'], r['d'], r['fa'], r['fb']] != ['schol', 'night', 'drop', 'schol', 'schol', 'dip'] or r['tags'] != 2: fails.append(f'추천 {r}')
        await pg.evaluate("document.querySelector('#perkList').scrollIntoView()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='s70_perk.png')

        # (3) 발표회 (중학교)
        t = await pg.evaluate(PROMOTE)
        if t != 2: fails.append(f'중학교로 못 갔어요 {t}')
        async def day(y, m, d):
            return await pg.evaluate(f"(()=>{{ const F={F}; F.rt.fakeNow={kst(y, m, d)}; F.S.clk.last=0; return {{ ready: F.showReady(), wait: F.showWait(), note: F.showNote() }}; }})()")
        async def go():
            return await pg.evaluate(f"(()=>{{ const F={F}; const c=[0,1,2,3].find(i=>F.clubMembers(i).length); const ok=F.clubShowGo(c); {CLEAN}; return ok; }})()")
        log = []
        # 11월 2일 주: 월화수에 열고 목금은 쉼 → 토, 일 보충 2번
        for d in (2, 3, 4):
            a = await day(2026, 11, d); ok = await go(); again = await go(); log.append((d, a['ready'], ok, again))
        th = await day(2026, 11, 5); fr = await day(2026, 11, 6)
        sa = await day(2026, 11, 7); sa_ok = await go(); sa2 = await go()
        su = await day(2026, 11, 8); su_ok = await go()
        if any(not (x[1] and x[2] and not x[3]) for x in log) or not th['ready'] or not fr['ready']: fails.append(f'월~금 하루 한 번 {log} {th} {fr}')
        if not (sa['ready'] and sa_ok and not sa2 and su['ready'] and su_ok) or '보충' not in sa['note']: fails.append(f'주말 보충 {sa} {sa_ok} {sa2} {su} {su_ok}')
        # 11월 9일 주: 월~금 다 열면 주말에는 못 열고 월요일 안내
        for d in range(9, 14):
            await day(2026, 11, d); await go()
        s14 = await day(2026, 11, 14); s15 = await day(2026, 11, 15)
        if s14['ready'] or s14['wait'] != 2 or '월요일' not in s14['note'] or s15['ready']: fails.append(f'다 연 주의 주말 {s14} {s15}')
        # 11월 16일 주: 월~목 4번 → 토 1번만, 일요일은 못 열어요
        for d in range(16, 20):
            await day(2026, 11, d); await go()
        a21 = await day(2026, 11, 21); ok21 = await go(); a22 = await day(2026, 11, 22)
        if not (a21['ready'] and ok21) or a22['ready']: fails.append(f'못 연 날 수까지만 {a21} {ok21} {a22}')
        r = await pg.evaluate(f"(()=>{{ const S={F}.S; return {{ wk: S.club.wk, wd: S.club.wd, we: S.club.we, n: S.club.n }}; }})()")
        if r['wd'] != 4 or r['we'] != 1 or r['n'] != 15: fails.append(f'발표회 기록 {r}')
        # 저장을 다시 읽어도 그대로(옛 저장에는 없는 칸)
        r = await pg.evaluate(f"(()=>{{ const F={F}; const s = F.sanitize(JSON.parse(JSON.stringify(F.S))); const o = JSON.parse(JSON.stringify(F.S)); delete o.club.wk; delete o.club.wd; delete o.club.we; const s2 = F.sanitize(o); return [s.club.wk === F.S.club.wk && s.club.wd === 4 && s.club.we === 1, s2.club.wk, s2.club.wd, s2.club.we]; }})()")
        if r != [True, -1, 0, 0]: fails.append(f'발표회 저장 {r}')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
