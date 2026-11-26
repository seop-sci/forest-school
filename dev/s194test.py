# 194번 시험: 접기(퍼즐 쉬는 시간, 미션 겹, 빨간 점과 홈 단추, 다녀왔어요 창)
# 1) 퍼즐: 판 수 제한 없이 수학 XP만(하루 120까지), 정수와 도토리와 단축권은 없음, 소탕과 광고 줄 없음
# 2) 합치기 주문 정수: 주문 하나에 10, 하루 12개(120)까지, 합치기 5분권은 하루 2장
# 3) 패스: 오늘의 미션을 받으면 패스 점수 30(광고 날은 60), 이번 주 미션은 60. 패스 화면에 패스 미션 목록이 없음
#    옛 저장의 받을 수 있는 패스 미션은 그날 한 번 받고, 날이 바뀌면 사라짐
# 4) 다녀왔어요 창: 1시간 넘게 비우면 광고 단추가 큼, 광고 보면 도토리 두 배와 합치기 에너지 +30, 출석 도장 함께, 3분 동안 다른 광고 쉬기
#    출석만 있을 때도 창이 뜨고 광고 단추는 없음
# 5) z1, z2 퀘스트가 합치기로 바뀜, 옛 저장에서 그 퀘스트를 하던 중이면 끝난 것으로, 옛 저장은 '오늘 할 일'을 접음
# 6) 랭킹은 홈 오른쪽 단추(5.4.1.2에 다시 따로), 오늘 활동 단추(체험학습, 학교 행사)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, F, TODAY
c = Checker()
AD = """const sl=ms=>new Promise(r=>setTimeout(r,ms)); const watch=async()=>{ for(let i=0;i<90;i++){ await sl(100); const d=document.querySelector('#adDone'); if(!document.querySelector('#mAd').hidden && !d.hidden){ d.click(); await sl(500); return true; } } return false; };"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sv = base(tier=1, students=60)
        sv['f'] = dict(classroom=10, cafeteria=10, library=10, playground=6)
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', sv)
        await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
        # 1) 퍼즐
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, o={{}};
          S.ess = 0; const b0 = S.budget, tk0 = JSON.stringify(S.tk), n0 = S.pz.n; o.xs = [];
          for (let i = 0; i < 6; i++) {{ const cur = F.pzStart(); cur.score = 1500; const r = F.pzFinish(cur); o.xs.push(r.xp > 0 ? 1 : 0); }}
          o.xp = S.pz.xp; o.ess = S.ess; o.budget = S.budget === b0; o.tk = JSON.stringify(S.tk) === tk0; o.n = S.pz.n === n0;
          F.renderMini(); o.card = document.querySelector('#pzLeftTxt').textContent;
          o.sw = !!document.querySelector('#pzSwRow, #mPzSw, #pzAdBtn');
          return o; }})()""")
        c.ok(r['xs'] == [1, 1, 1, 1, 1, 0] and r['xp'] == 120, f'퍼즐 XP 하루 120 {r}')
        c.ok(r['ess'] == 0 and r['budget'] and r['tk'] and r['n'], f'퍼즐은 XP만 {r}')
        c.ok(r['card'] == '수학 XP 120/120' and not r['sw'], f'퍼즐 카드와 소탕 줄 {r}')
        # 2) 합치기 주문 정수와 5분권
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, o={{}};
          S.ess = 0; S.mg.ed = {{ day: '', n: 0 }}; o.gs = [];
          for (let i = 0; i < 13; i++) o.gs.push(F.mgOrderEss());
          o.ess = S.ess; o.left = F.mgEssLeft(); o.n = S.mg.ed.n;
          S.tkd = {{ day: '', pz: 0, mg: 0 }}; S.tk.m5 = 0; for (let i = 0; i < 3; i++) F.tkDaily('mg'); o.m5 = S.tk.m5;
          const d = JSON.parse(JSON.stringify(S)); d.mg.ed.n = 99; o.san = F.sanitize(d).mg.ed.n;
          return o; }})()""")
        c.ok(r['ess'] == 120 and r['gs'][-1] == 0 and r['left'] == 0 and r['n'] == 12, f'주문 정수 하루 120 {r}')
        c.ok(r['m5'] == 2, f'합치기 5분권 하루 2장 {r}')
        c.ok(r['san'] == 12, f'주문 정수 저장 읽기 {r}')
        # 3) 패스 점수는 미션에서
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, o={{}};
          F.psSync(); o.open = !!S.ps && S.ps.s >= 0; S.ps.pts = 0; S.ps.ad = '';
          F.dmDay(); S.dm.list = [{{ id: 'picks', b: S.st.picks - 100, done: false }}, {{ id: 'shakes', b: S.st.shakes - 100, done: false }}];
          F.claimMission(0); o.p1 = S.ps.pts;
          S.ps.ad = F.gameToday(); F.claimMission(1); o.p2 = S.ps.pts;
          F.wkWeek(); S.wk.list = [{{ id: 'picks', b: S.st.picks - 1000, done: false }}]; F.claimWeekMission(0); o.p3 = S.ps.pts;
          o.dl = S.ps.dl.length; o.wl = S.ps.wl.length;
          S.ps.ad = ''; S.ps.dl = [{{ id: 'picks', n: 30, b: S.st.picks - 50, done: false }}, {{ id: 'shakes', n: 20, b: S.st.shakes, done: false }}];
          o.can = F.psClaimable();
          F.rt4.evSeg = 'ps'; F.setTab('event'); return o; }})()""")
        await pg.wait_for_timeout(500); await pg.evaluate(CLEAN)
        r2 = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, o={{}}, body = document.querySelector('#psBody');
          o.heads = [...body.querySelectorAll('h4')].map(h => h.firstChild.textContent.trim());
          o.btn = !!body.querySelector('[data-ps="d0"]'); o.notReady = body.querySelectorAll('.dms .dm').length;
          const p0 = S.ps.pts; body.querySelector('[data-ps="d0"]').click(); o.got = S.ps.pts - p0;
          S.ps.day = '2000-01-01'; F.psSync(); o.after = S.ps.dl.length;
          o.rank = !document.querySelector('#evSeg [data-evseg="rank"]') && !!document.querySelector('.map-right [data-tab="rank"]');
          F.setTab('school'); document.querySelector('.map-right [data-tab="rank"]').click(); o.tab = F.rt4.tab;
          return o; }})()""")
        c.ok(r['open'] and r['p1'] == 30 and r['p2'] == 90 and r['p3'] == 150, f'미션에서 패스 점수 {r}')
        c.ok(r['dl'] == 0 and r['wl'] == 0 and r['can'], f'패스 미션을 새로 고르지 않음 {r}')
        c.ok('남은 패스 미션' in r2['heads'] and not any('오늘의 패스 미션' in h for h in r2['heads']) and r2['btn'] and r2['notReady'] == 1, f'패스 화면 {r2}')
        c.ok(r2['got'] == 30 and r2['after'] == 0, f'옛 패스 미션 받기 {r2}')
        c.ok(r2['rank'] and r2['tab'] == 'rank', f'랭킹은 홈 오른쪽 단추 {r2}')
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(300); await pg.evaluate(CLEAN)
        # 4) 다녀왔어요 창
        r = await pg.evaluate(f"""async()=>{{ {AD} const F={F}, S=F.S, o={{}};
          S.att.last = ''; S.pending = 1000; S.pendingSec = 7200; S.mg.e = 10; F.rt4.adRestUntil = 0;
          o.show = F.showOffline(); await sl(300);
          o.att = document.querySelector('#offMore').textContent.includes('출석'); o.en = document.querySelector('#offMore').textContent.includes('합치기 에너지');
          o.big = document.querySelector('#offDouble').className === 'cta' && document.querySelector('#offClaim').className === 'btn-sub';
          o.rest = F.rt4.adRestUntil - Date.now();
          const b0 = S.budget, a0 = S.att.n; document.querySelector('#offDouble').click(); o.w = await watch(); await sl(400);
          o.gain = Math.round(S.budget - b0); o.e = S.mg.e; o.stamp = S.att.last === F.gameToday() && S.att.n === a0 + 1; o.pend = S.pending;
          document.querySelectorAll('.overlay').forEach(x => {{ x.hidden = true; x.classList.remove('open'); }}); F.rt4.modalOpen = null; F.rt4.modalQueue.length = 0;
          S.pending = 500; S.pendingSec = 600; F.showOffline(); await sl(250);
          o.small = document.querySelector('#offDouble').className === 'btn-sub' && document.querySelector('#offClaim').className === 'cta';
          o.noAtt = !document.querySelector('#offMore').textContent.includes('출석');
          document.querySelector('#offClaim').click(); await sl(400);
          S.pending = 0; S.pendingSec = 0; S.att.last = '2000-01-01';
          o.attOnly = F.showOffline(); await sl(250);
          o.attOnlyBtn = document.querySelector('#offDouble').hidden && document.querySelector('#offAmtBox').hidden;
          document.querySelector('#offClaim').click(); await sl(400); o.stamp2 = S.att.last === F.gameToday();
          o.none = F.showOffline();
          o.attDot = document.querySelector('#attDot').hidden;
          return o; }}""")
        c.ok(r['show'] and r['att'] and r['en'] and r['big'] and 170000 < r['rest'] <= 180000, f'다녀왔어요 창 {r}')
        c.ok(r['w'] and r['gain'] >= 1999 and r['e'] >= 40 and r['stamp'] and r['pend'] == 0, f'광고 두 배와 에너지 {r}')
        c.ok(r['small'] and r['noAtt'], f'1시간 안이면 받기가 큼 {r}')
        c.ok(r['attOnly'] and r['attOnlyBtn'] and r['stamp2'] and r['none'] is False and r['attDot'], f'출석만 있는 창 {r}')
        # 5) z1, z2와 옛 저장
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, o={{}};
          const z1 = F.MAIN.find(q => q.id === 'z1'), z2 = F.MAIN.find(q => q.id === 'z2'); o.z1 = z1.t + z1.n; o.z2 = z2.t + z2.n;
          const d = JSON.parse(JSON.stringify(S)); d.q.m = F.MAIN.indexOf(z2); d.q.mid = "z2"; d.q.lat = ''; delete d.pz.xp; d.fold.td = 0;
          const s1 = F.sanitize(d); o.lat1 = s1.q.lat; o.td1 = s1.fold.td;
          d.pz.xp = 0; const s2 = F.sanitize(d); o.lat2 = s2.q.lat; o.td2 = s2.fold.td;
          o.fresh = F.sanitize(null).fold.td;
          return o; }})()""")
        c.ok(r['z1'] == 'mgOrders1' and r['z2'] == 'mgDo10', f'z1 z2 합치기 {r}')
        c.ok(r['lat1'] == 'z2' and r['td1'] == 1 and r['lat2'] == '' and r['td2'] == 0 and r['fresh'] == 1, f'옛 저장 {r}')
        # 6) 오늘 활동 단추
        r = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, o={{}}, sl=ms=>new Promise(r=>setTimeout(r,ms));
          F.setTab('school'); F.renderAffordance(); await sl(200);
          const vis = id => !document.querySelector(id).hidden;
          o.act = vis('#btnAct'); o.inPop = ['#btnTrip', '#btnSports'].map(id => !!document.querySelector('#actPop ' + id));
          document.querySelector('#btnAct').click(); await sl(150); o.pop = vis('#actPop');
          const bt = document.querySelector('#actPop .boost:not([hidden])'); o.btnIn = !!bt;
          const r1 = document.querySelector('#btnAct').getBoundingClientRect(), r2 = document.querySelector('#actPop').getBoundingClientRect(); o.right = r2.right <= innerWidth + 1 && r2.left >= r1.right;
          document.body.click(); await sl(100); o.closed = !vis('#actPop');
          return o; }}""")
        c.ok(r['act'] and all(r['inPop']) and r['pop'] and r['btnIn'] and r['right'] and r['closed'], f'오늘 활동 단추 {r}')
        await pg.screenshot(path='s194_home.png')
        c.ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    c.done()
asyncio.run(main())
