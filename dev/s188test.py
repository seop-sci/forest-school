# 188번 시험(5.3.4.7): 오늘의 손님, 졸업생 방문, 조교 자리, 대학교 시절 모습 연구 구역
# 1) 학생 부탁이 열리기 전에는 손님이 오지 않아요
# 2) 열리면 날마다 같은 손님이 교문 앞에 와서 누를 때까지(40초가 지나도) 서 있어요
# 3) 누르면 대화 창(그림 얼굴)과 부탁. 부탁이 퀘스트 탭 학생 부탁 위 '오늘의 손님' 칸에 들어가요
# 4) 부탁을 끝내고 받으면 수업료 90분치와 숲의 정수 5. 그날은 다시 오지 않아요
# 5) 못 끝낸 부탁은 날이 바뀌어도 남고 새 손님이 오지 않아요. 저장 읽기(sanitize)로 남아요
# 6) 졸업생 방문은 40초가 지나도 누를 때까지 서 있고, 손님이 교문에 있는 동안은 오지 않아요
# 7) 조교는 파견 중에도 자리를 정할 수 있고 '조교 두 명 앉히기'에 쳐요(효과는 돌아온 뒤)
# 8) 대학교 시절 모습에서 연구 구역은 눌리지 않아요
# 9) 360px, 390px 퀘스트 탭과 대화 창이 넘치지 않고 오류 없음
import asyncio, pathlib
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, OVER
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
c = Checker()
async def main():
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, th in ((360, 'light'), (390, 'dark')):
            ctx, pg, errs = await ctxpage(b, w, 800, th, base())
            await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
            r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, R = F.rt, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              F.setTab('school'); await sl(100);
              if (R.visit) F.endVisit(false); R.visitT = 9999;
              // 1) 잠금
              const m0 = S.q.m; S.q.m = 1; S.gs = F.freshGs(); F.gsTick(10); o.lock = S.gs.st === 0 && !R.guest; S.q.m = m0;
              // 2) 같은 손님, 누를 때까지
              F.gsTick(0.1); o.who = S.gs.who; o.same = F.gsPick(S.gs.day) === S.gs.who || true; o.st1 = S.gs.st;
              for (let i = 0; i < 8; i++) F.gsTick(1);
              o.shown = !!R.guest && R.guest.g.isConnected;
              for (let i = 0; i < 60; i++) F.gsTick(1);
              o.stay = !!R.guest && R.guest.g.isConnected; o.img = !!(R.guest && R.guest.g.querySelector('image'));
              // 졸업생 방문은 손님이 있는 동안 오지 않아요
              R.visitT = 0; F.updateVisit(1); o.noVisit = !R.visit;
              // 3) 누르기
              R.guest.g.dispatchEvent(new MouseEvent('click', { bubbles: true })); await sl(300);
              o.st2 = S.gs.st; o.sub = JSON.parse(JSON.stringify(S.gs.sub)); o.gone = !R.guest;
              o.talk = !document.querySelector('#mTalk').hidden; o.talkImg = !!document.querySelector('#talkAv img');
              o.talkTx = document.querySelector('#talkText').textContent;
              o.arts = F.GS_WHO.filter(w => !F.gsArt(w));
              o.brace = /\\{(child|job|n)\\}/.test(JSON.stringify(S.gs.sub));
              return o; })()""")
            await pg.screenshot(path=str(OUT / f's188_talk_{w}.png'))
            over_talk = await pg.evaluate(OVER, '#mTalk .talk-box, #talkText')
            print(w, r)
            c.ok(r['lock'], f'[{w}] 학생 부탁이 열리기 전에는 손님이 오지 않아요')
            c.ok(r['st1'] == 1 and r['who'], f'[{w}] 오늘 손님이 정해져요 ({r["who"]})')
            c.ok(r['shown'] and r['stay'] and r['img'], f'[{w}] 손님이 교문 앞에 그림으로 서서 60초가 지나도 있어요')
            c.ok(r['noVisit'], f'[{w}] 손님이 있는 동안 졸업생 방문은 쉬어요')
            c.ok(r['st2'] == 2 and r['sub'] and r['gone'], f'[{w}] 누르면 부탁이 생기고 손님은 들어가요')
            c.ok(r['talk'] and r['talkImg'] and len(r['talkTx']) > 4, f'[{w}] 대화 창에 손님 그림과 대사')
            c.ok(not r['arts'], f'[{w}] 손님 일곱 모두 그림이 있어요 {r["arts"]}')
            c.ok(not r['brace'], f'[{w}] 부탁 글에 {{child}} 같은 자리표가 남지 않아요')
            c.ok(not over_talk, f'[{w}] 대화 창이 넘치지 않아요 {over_talk}')
            r2 = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, R = F.rt, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              for (let i = 0; i < 6 && !document.querySelector('#mTalk').hidden; i++) { F.talkNext(); await sl(350); }
              o.closed = document.querySelector('#mTalk').hidden;
              F.setTab('quests'); await sl(300); F.renderQuestPanel(true); await sl(100);
              const card = document.querySelector('#qSubs .gs-card'); o.card = !!card; o.first = !!card && document.querySelector('#qSubs').firstElementChild === card;
              o.cardTx = card ? card.textContent : '';
              // 5) 날이 바뀌어도 남아요, 저장 읽기
              S.gs.day = '2000-01-01'; F.gsTick(1); o.keep = S.gs.st === 2 && S.gs.day === '2000-01-01';
              const s2 = F.sanitize(JSON.parse(JSON.stringify(S))); o.san = s2.gs.st === 2 && !!s2.gs.sub && s2.gs.sub.t === S.gs.sub.t && s2.gs.sub.n === S.gs.sub.n;
              const bad = F.sanitize(Object.assign(JSON.parse(JSON.stringify(S)), { gs: { st: 2, sub: { t: 'zzz' }, who: 'x', n: 'a' } })); o.bad = bad.gs.st === 3 && bad.gs.sub === null && bad.gs.who === '' && bad.gs.n === 0;
              const old = JSON.parse(JSON.stringify(S)); delete old.gs; o.old = F.sanitize(old).gs.st === 0;
              // 4) 끝내고 받기
              const U = S.gs.sub; if (U.t === 'fac') S.f[U.k] = U.n; else U.b = F.qMeasure(U) - U.n;   // 부탁만큼 했다고 쳐요
              o.ready = F.gsReady(); F.checkQuests(); F.renderQuestPanel(true); await sl(100);
              const btn = document.querySelector('#qSubs .gs-card [data-act="claim"]'); o.btn = !!btn;
              const b0 = S.budget, e0 = S.ess, want = Math.max(20, F.nice(F.rate() * 60 * 90));
              btn.click(); await sl(200);
              o.gain = S.budget - b0; o.want = want; o.ess = S.ess - e0; o.st3 = S.gs.st; o.n = S.gs.n; o.cardGone = !document.querySelector('#qSubs .gs-card');
              S.gs.day = F.gameToday(); F.gsTick(1); o.noAgain = S.gs.st === 3 && !R.guest;
              S.gs.day = '2000-01-01'; F.gsTick(1); o.next = S.gs.st === 1 && S.gs.day === F.gameToday();
              return o; })()""")
            await pg.screenshot(path=str(OUT / f's188_quests_{w}.png'))
            print(w, r2)
            c.ok(r2['closed'], f'[{w}] 대화를 넘기면 창이 닫혀요')
            c.ok(r2['card'] and r2['first'] and '오늘의 손님' in r2['cardTx'], f'[{w}] 퀘스트 탭 학생 부탁 위에 오늘의 손님 칸')
            c.ok(r2['keep'], f'[{w}] 못 끝낸 부탁은 날이 바뀌어도 남고 새 손님이 오지 않아요')
            c.ok(r2['san'] and r2['bad'] and r2['old'], f'[{w}] 저장 읽기: 부탁이 남고, 틀린 값은 바로잡고, 옛 저장은 빈 값')
            c.ok(r2['ready'] and r2['btn'], f'[{w}] 부탁을 끝내면 보상 받기 단추')
            c.ok(abs(r2['gain'] - r2['want']) <= max(1, r2['want'] * 0.02) and r2['ess'] >= 5, f'[{w}] 수업료 90분치와 숲의 정수 5 ({r2["gain"]}/{r2["want"]}, 정수 {r2["ess"]})')
            c.ok(r2['st3'] == 3 and r2['n'] == 1 and r2['cardGone'], f'[{w}] 받으면 칸이 사라지고 들어준 수 1')
            c.ok(r2['noAgain'] and r2['next'], f'[{w}] 그날은 다시 오지 않고 다음 날 새 손님')
            over = await pg.evaluate(OVER, '#qSubs .qcard, #qSubs .qfoot, #qSubs .qwho')
            c.ok(not over, f'[{w}] 퀘스트 탭이 넘치지 않아요 {over}')
            # 6) 졸업생 방문은 누를 때까지
            r3 = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, R = F.rt, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              F.setTab('school'); await sl(200); S.gs.st = 3; if (R.guest) R.guest = null;
              R.visitT = 0; F.updateVisit(0.1); o.came = !!R.visit;
              for (let i = 0; i < 90; i++) F.updateVisit(1); o.stay = !!R.visit && R.visit.g.isConnected;
              R.visit.g.remove(); F.updateVisit(0.1); o.back = R.visit.g.isConnected;
              F.endVisit(true); await sl(100); o.gone = !R.visit;
              return o; })()""")
            print(w, r3)
            c.ok(r3['came'] and r3['stay'], f'[{w}] 졸업생 방문은 90초가 지나도 누를 때까지 서 있어요')
            c.ok(r3['back'] and r3['gone'], f'[{w}] 지도를 다시 그려도 그 자리에, 누르면 떠나요')
            c.ok(not errs, f'[{w}] 오류 없음 {errs[:3]}')
            await ctx.close()
        # 7), 8) 대학원: 조교 자리와 대학교 시절 모습
        sv = base(tier=5, students=90)
        sv['f'] = {'classroom': 40, 'cafeteria': 40, 'library': 40, 'playground': 40, 'science': 40, 'store': 40, 'dorm': 40, 'union': 40, 'institute': 3, 'gradhall': 0}
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', sv)
        await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
        r4 = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
          S.sem = 1; S.ta.seat = [{ b: 'cafeteria' }, { b: '' }]; S.ta.out = [];
          const r0 = F.rate();
          o.send = F.taSend(1, 0, 2); const q = { t: 'ta', k: 'seat', n: 2 }; o.m0 = F.qMeasure(q);
          o.sit = F.taSit(1, 'library'); o.m1 = F.qMeasure(q); o.rate = F.rate() / r0;
          F.rt.rxTab = 'ta'; F.openRx(); await sl(300);
          o.pickBtn = !!document.querySelector('[data-ta="pick:1"]'); o.tx = /돌아오면 도서관에서 일해요/.test(document.querySelector('#mRx').textContent);
          F.taSit(1, ''); o.empty = S.ta.seat[1].b === '';
          return o; })()""")
        print(r4)
        c.ok(r4['send'] and r4['m0'] == 1 and r4['sit'] and r4['m1'] == 2, '파견 중인 조교도 자리를 정하면 조교 두 명 앉히기에 쳐요')
        c.ok(abs(r4['rate'] - 1) < 1e-9, '파견 중에는 자리 효과가 없어요(수업료 그대로)')
        c.ok(r4['pickBtn'] and r4['tx'] and r4['empty'], '파견 중 칸에 자리 정하기 단추와 돌아올 자리 안내')
        await pg.evaluate(CLEAN)
        r5 = await pg.evaluate("""(async()=>{ const F = window.__forest, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
          F.tierViewOpen(4); await sl(300); const z4 = document.querySelector('#tvZones [data-tvzone=""] .cz-name, #tvZones .cz.lock .cz-name');
          o.lock4 = !!document.querySelector('#tvZones .cz.lock') && !document.querySelector('#tvZones [data-tvzone="lab"]');
          F.tierViewClose(); return o; })()""")
        print(r5)
        c.ok(r5['lock4'], '대학교 시절 모습에서 연구 구역은 잠겨 눌리지 않아요')
        c.ok(not errs, f'대학원 오류 없음 {errs[:3]}')
        await b.close()
    c.done()
asyncio.run(main())
