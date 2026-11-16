# 147번 시험(5.0.2 편의): 첫 책 바로 읽기, 책 예약, 모두 받기, 문제집과 선물 여러 번, 오늘 할 일 판
#  1) 첫 책: 한 권도 안 읽은 학교는 책을 고르면 바로 다 읽어요(메인 퀘스트 rd1이 세요). 하루 권수와 XP는 그대로. 둘째 권부터는 15분
#  2) 예약: 읽는 중에 다른 책을 고르면 예약, 하루 권수는 예약할 때 세고 취소하면 돌려줘요. 앞 책이 끝난 때부터 이어서 읽어요(꺼 둔 동안도)
#  3) 모두 받기: 하나씩 받을 때와 재화가 똑같이 늘어요(도토리, 황금 도토리, 수료증, 미션 포인트, 합치기 에너지). 보상 창은 하나
#  4) 문제집 남은 권 모두, 선물 남은 번 모두: 하나씩 살 때와 같은 값
#  5) 오늘 할 일 판: 열린 활동만, 남은 횟수, 바로 가기, 접기(저장), 360px에서 넘치지 않음
#  6) 옛 저장(rd.q, fold.td 없음)과 엉뚱한 값
# 쓰는 법: python3 wrap.py && python3 s147test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, sys
from playwright.async_api import async_playwright
from testlib import ctxpage, base, F, CLEAN
WAIT = """async (sel, title) => { const F = window.__forest, sl = ms => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 40; i++) { const t = document.querySelector(sel); if (t && !t.hidden && (!title || document.querySelector('#rwTitle').textContent === title)) return true;
    const o = [...document.querySelectorAll('.overlay')].find(x => !x.hidden); if (o) { o.hidden = true; o.classList.remove('open'); F.rt.modalOpen = null; const fn = F.rt.modalQueue.shift(); if (fn) fn(); }
    await sl(100); } return false; }"""
SNAP = "(S => ({ b: Math.round(S.budget), g: S.gold, d: S.tdip + ':' + S.p.dip, mp: S.wk.pts, mg: S.mg.e, ess: S.ess, dm: S.dm.list.map(m => m.done ? 1 : 0).join('') + (S.dm.bonus ? 'B' : ''), wk: S.wk.list.map(m => m.done ? 1 : 0).join('') + S.wk.got.map(x => x ? 1 : 0).join(''), subs: S.q.subDone, sk: S.sk ? S.sk.n + ':' + (S.sk.have || 0) : '', tk: JSON.stringify(S.tk), lg: S.lg.pts }))"
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 1) 첫 책과 2) 예약
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=0, f=dict(classroom=6, cafeteria=3, library=2, playground=2)))
        await page.evaluate(CLEAN)
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), out={{}};
          F.rt.fakeNow = Date.now(); S.rd = {{ day: '', n: 0, cur: '', at: 0, got: {{}}, st: 0, q: [] }}; const xp0 = S.ac.kor.xp + S.ac.kor.lv * 1e6;
          const ks = F.BOOKS.map(x => x.k); out.per = F.rdLeft();
          out.first = F.rdStart(ks[0]); out.st1 = S.rd.st; out.cur1 = S.rd.cur; out.n1 = S.rd.n; out.xp = (S.ac.kor.xp + S.ac.kor.lv * 1e6) > xp0;
          out.toast = (document.querySelector('#toast').textContent || '').slice(0, 14);
          out.q = F.qMeasure({{ t: 'rdBooks' }});
          out.second = F.rdStart(ks[1]); out.cur2 = S.rd.cur; out.st2 = S.rd.st; out.rem = Math.round(F.rdRemain() / 60000);
          out.res = F.rdStart(ks[2]); out.qv = S.rd.q.slice(); out.n3 = S.rd.n; out.left3 = F.rdLeft();
          out.full = F.rdStart(ks[3]);
          F.openRead(); await sl(300); out.qRow = document.querySelectorAll('#rdTickets .rd-q').length; out.over = document.querySelector('#mRead .modal').scrollWidth > document.querySelector('#mRead .modal').clientWidth + 1;
          document.querySelector('[data-rd-unq]').click(); out.unq = [S.rd.q.length, S.rd.n];
          F.rdStart(ks[2]);   // 다시 예약
          F.rt.fakeNow += 40 * 60000; F.rdSettle(); out.after = {{ st: S.rd.st, cur: S.rd.cur, q: S.rd.q.length }};   // 40분 뒤: 둘째와 셋째(예약) 모두 끝
          return out; }})()""")
        print('책', r)
        ok(r['first'] and r['st1'] == 1 and r['cur1'] == '' and r['n1'] == 1 and r['xp'] and r['q'] == 1, '첫 책은 바로 다 읽고 하루 권수 1권, XP를 받고 퀘스트가 세요')
        ok('첫 책은 바로' in r['toast'], f"첫 책 알림 {r['toast']}")
        ok(r['second'] and r['cur2'] and r['st2'] == 1 and r['rem'] in (10, 15), '둘째 권부터는 기다려요')
        ok(r['res'] and len(r['qv']) == 1 and r['n3'] == 3 and r['left3'] == r['per'] - 3, '읽는 중에 고르면 예약, 하루 권수는 예약할 때 세요')
        ok(r['full'] is False if r['per'] == 3 else True, '하루 권수를 넘으면 예약도 안 돼요')
        ok(r['qRow'] == 1 and not r['over'] and r['unq'] == [0, 2], f"예약 줄과 취소 {r['qRow']} {r['unq']}")
        ok(r['after'] == {'st': 3, 'cur': '', 'q': 0}, f"예약한 책은 앞 책이 끝난 때부터 이어서 {r['after']}")
        ok(not errs, f'오류 없음 {errs[:2]}'); await ctx.close()
        # 3) 모두 받기: 같은 저장으로 하나씩 받기와 모두 받기를 견줘요
        res = {}
        for mode in ('one', 'all'):
            ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=1, tg=3, pid='TESTPID1'))
            await page.evaluate(CLEAN)
            res[mode] = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.rt.paused = false;
              F.renderMissions();
              // 오늘의 미션과 이번 주 미션을 모두 채우고, 부탁도 받을 수 있게
              S.dm.list.forEach(m => {{ m.b = -1e9; }}); S.wk.list.forEach(m => {{ m.b = -1e9; }}); S.wk.pts = 80;
              const subs0 = S.q.subs.filter(F.subReady || (() => false)).length;
              F.setTab('quests'); F.renderMissions(); await sl(200);
              const n0 = F.claimables(), bar = document.querySelector('[data-claim-all]'), over = document.querySelector('#panelQuests').scrollWidth > document.querySelector('#panelQuests').clientWidth + 1;
              const rate0 = F.rate(), b0 = S.budget;
              if ('{mode}' === 'all') {{ bar.click(); }}
              else {{ S.dm.list.forEach((m, i) => F.claimMission(i)); F.claimBonus(); S.wk.list.forEach((m, i) => F.claimWeekMission(i)); [0,1,2,3,4].forEach(i => F.claimBox(i)); }}
              const mins = (S.budget - b0) / rate0 / 60;   // 받은 도토리를 수업료 몇 분치로(학생 수가 달라도 견줄 수 있게)
              const queue0 = F.rt.modalQueue.length + (F.rt.modalOpen ? 1 : 0);
              if ('{mode}' === 'all') await (WAITJS)('#mReward', '모두 받았어요!'); else await sl(400);
              const win = [...document.querySelectorAll('#mReward:not([hidden]) #rwList li')].map(li => li.textContent.trim());
              return {{ mins, n0, bar: !!bar, barTx: bar ? bar.textContent.replace(/\\s+/g, ' ').trim() : '', over, snap: {SNAP}(S), win, title: document.querySelector('#rwTitle').textContent, queue: queue0, left: F.claimables() }}; }})()""".replace('WAITJS', WAIT))
            ok(not errs, f'{mode} 오류 없음 {errs[:2]}'); await ctx.close()
        a, c = res['one'], res['all']
        print('하나씩', a['snap'], '창 대기', a['queue']); print('모두  ', c['snap'], '창 대기', c['queue'], c['title'], c['win'])
        ok(c['bar'] and c['n0'] >= 7 and f"받을 보상 {c['n0']}개" in c['barTx'] and not c['over'], f"모두 받기 띠 {c['barTx']}")
        sa, sc = dict(a['snap']), dict(c['snap'])
        sa.pop('b'); sc.pop('b'); print('받은 도토리(수업료 분)', round(a['mins'], 2), round(c['mins'], 2))
        ok(abs(a['mins'] - c['mins']) <= 0.02 * a['mins'] and a['mins'] > 30, '모두 받기와 하나씩 받기의 도토리가 같아요(수업료 분으로)')
        ok(sa == sc, f'모두 받기와 하나씩 받기의 재화와 진행이 같아요 {sa} {sc}')
        ok(c['title'] == '모두 받았어요!' and c['queue'] <= 2 and len(c['win']) >= 3 and c['left'] == 0, f"보상 창은 하나, 남은 것 없음 {c['queue']}")
        ok(a['queue'] >= c['queue'] + 3, f"하나씩 받으면 보상 창이 여러 개 줄을 서요(견줌) {a['queue']} {c['queue']}")
        ok(sum(1 for t in c['win'] if t.startswith('도토리')) == 1 and sum(1 for t in c['win'] if '미션 포인트' in t) == 1 and sum(1 for t in c['win'] if '칭찬 스티커' in t) <= 1, f"같은 보상은 한 줄로 {c['win']}")
        # 4) 문제집과 선물
        res = {}
        for mode in ('one', 'all'):
            ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=1, tg=3, ess=400))
            await page.evaluate(CLEAN)
            res[mode] = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), out={{}};
              S.ess = 400; const k = 'kor', left = F.acBkLeft(k);
              if ('{mode}' === 'all') {{ {CLEAN}; F.openBook(k); await sl(300); out.btn = !document.querySelector('#bkAll').hidden; out.btx = document.querySelector('#bkAll').textContent; document.querySelector('#bkAll').click(); await sl(500); }}
              else for (let i = 0; i < left; i++) F.acBuyBook(k);
              out.bk = {{ left0: left, left: F.acBkLeft(k), ess: S.ess, lv: S.ac[k].lv, xp: S.ac[k].xp, n: S.ac.st.bk }}; out.toast = document.querySelector('#toast').textContent;
              // 정수가 모자라면 살 수 있는 만큼만
              S.ess = F.bookCost('math') + 1; const m0 = F.acBkLeft('math'); out.part = '{mode}' === 'all' ? F.acBuyBookAll('math') : (F.acBuyBook('math') ? 1 : 0); out.partLeft = m0 - F.acBkLeft('math');
              // 선물
              S.ess = 100; F.frSync(); const sp = F.S.fr ? Object.keys(F.S.fr)[0] : ''; out.sp = sp;
              if (sp) {{ {CLEAN}; const g0 = F.frGiftLeft(), p0 = S.fr[sp].p;
                if ('{mode}' === 'all') out.gn = F.frGiftAll(sp); else {{ let n = 0; while (F.frGiftLeft() > 0 && F.frGift(sp)) n++; out.gn = n; }}
                out.queue = F.rt.modalQueue.length + (F.rt.modalOpen ? 1 : 0); if ('{mode}' === 'all') await (WAITJS)('#mReward', `선물을 ${{out.gn}}번 줬어요!`); else await sl(300);
                out.gift = {{ g0, left: F.frGiftLeft(), ess: S.ess, p: S.fr[sp].p - p0, gc: S.frc.gift }}; out.gt = document.querySelector('#rwTitle').textContent; }}
              return out; }})()""".replace('WAITJS', WAIT))
            ok(not errs, f'{mode} 오류 없음 {errs[:2]}'); await ctx.close()
        a, c = res['one'], res['all']
        print('문제집 하나씩', a['bk'], '모두', c['bk'], c.get('btx'), '|', c['toast'].replace('\n', ' '))
        ok(c['btn'] and a['bk'] == c['bk'] and c['bk']['left'] == 0, '문제집 남은 권 모두 사기는 하나씩 살 때와 같아요')
        ok(c['part'] == 1 and c['partLeft'] == 1, '정수가 모자라면 살 수 있는 만큼만')
        if c['sp'] and a.get('gift') and c.get('gift'):
            print('선물 하나씩', a['gift'], '모두', c['gift'], c['gt'])
            ok(a['gift'] == c['gift'] and c['gn'] == c['gift']['g0'] and c['queue'] == 1 and a['queue'] == 3 and '번 줬어요' in c['gt'], f"선물 남은 번 모두 주기는 하나씩 줄 때와 같고 창은 하나 {a['queue']} {c['queue']}")
        else: print('  단짝이 없는 저장이라 선물은 건너뛰어요')
        # 5) 오늘 할 일 판
        for w in (360, 390):
            ctx, page, errs = await ctxpage(b, w, 740, 'dark' if w == 390 else 'light', base(tier=1, tg=3))
            await page.evaluate(CLEAN)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), q=s=>document.querySelector(s);
              F.setTab('quests'); F.renderMissions(); await sl(200);
              const rows = [...document.querySelectorAll('#qDaily .td-row')].map(e => e.textContent.replace(/\\s+/g, ' ').trim());
              const data = F.todoRows().map(r => [r.T.k, r.left]);
              const over = [...document.querySelectorAll('#qDaily .td-row')].some(e => e.scrollWidth > e.clientWidth + 1) || q('#panelQuests').scrollWidth > q('#panelQuests').clientWidth + 1;
              const tabs = document.querySelectorAll('.tabs .tab').length;
              {CLEAN}; q('[data-todo="rd"]') && q('[data-todo="rd"]').click(); await sl(400); const read = !q('#mRead').hidden; {CLEAN};
              F.setTab('quests'); q('[data-td-fold]').click(); await sl(100); const folded = document.querySelectorAll('#qDaily .td-row').length, fv = S.fold.td;
              const keep = F.sanitize(JSON.parse(JSON.stringify(S))).fold.td;
              q('[data-td-fold]').click();
              // 다 쓴 활동은 '다 했어요'
              S.rd.n = 99; F.renderMissions(); const done = (q('#qDaily .td-row.done') || {{}}).textContent || '';
              return {{ rows, data, over, tabs, read, folded, fv, keep, done }}; }})()""")
            print(w, '오늘 할 일', r['rows'][:4], r['data'])
            ok(len(r['rows']) >= 3 and not r['over'], f'{w} 오늘 할 일 줄이 넘치지 않아요')
            ok(any('책 읽기' in t and '남음' in t for t in r['rows']) and r['read'], f'{w} 책 읽기 줄을 누르면 책 읽기 창')
            ok(r['folded'] == 0 and r['fv'] == 1 and r['keep'] == 1, f'{w} 접으면 줄이 사라지고 저장돼요')
            ok('다 했어요' in r['done'], f'{w} 다 쓴 활동 표시')
            ok(not errs, f'{w} 오류 없음 {errs[:2]}')
            await page.evaluate(f"{F}.setTab('quests')"); await page.screenshot(path=f's147_todo_{w}.png')
            await ctx.close()
        # 6) 옛 저장과 엉뚱한 값
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=1, tg=1))
        j = await page.evaluate(f"""(()=>{{ const F={F}; const d = JSON.parse(JSON.stringify(F.S)); delete d.rd.q; delete d.fold.td; const a = F.sanitize(d);
          d.rd.cur = F.BOOKS[0].k; d.rd.at = Date.now(); d.rd.q = ['zz', F.BOOKS[1].k, 7, null, F.BOOKS[2].k, F.BOOKS[0].k, F.BOOKS[0].k, F.BOOKS[0].k, F.BOOKS[0].k]; d.fold.td = 'x'; const b2 = F.sanitize(d);
          d.rd.cur = ''; const c = F.sanitize(d);
          return [a.rd.q, a.fold.td, b2.rd.q.length, b2.fold.td, c.rd.q.length]; }})()""")
        print('옛 저장', j); ok(j == [[], 0, 5, 1, 0], '옛 저장과 엉뚱한 값을 받아 줘요')
        await ctx.close(); await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')
    sys.exit(1 if bad else 0)
asyncio.run(main())
