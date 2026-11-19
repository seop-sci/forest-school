# 5.2.0 시험: 논문과 숲속 학회, 연구 트리 심화 칸, 칭호, 퀘스트, 졸업생 후일담, 마을 기부 9단계 뒤, 저장 읽기, 논문 탭 화면
# 쓰는 법: python3 wrap.py && python3 s166test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, th in ((360, 'dark'), (390, 'light')):
            sv = base(tier=5, students=90)
            sv['f'] = {'classroom': 40, 'cafeteria': 40, 'library': 40, 'playground': 40, 'science': 40, 'store': 40, 'dorm': 40, 'union': 40, 'institute': 3, 'gradhall': 0}
            ctx, pg, errs = await ctxpage(b, w, 800, th, sv)
            await pg.wait_for_timeout(1200)
            await pg.evaluate(CLEAN)
            r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
              S.ess = 5000; S.budget = 1e40; S.rt5 = { lv: { class: 4, event: 2 }, cur: null };
              out.open = F.ppOpen(); out.day1 = F.ppDay(); out.day2 = F.ppDay(); out.dat0 = S.pp.dat;
              F.ppData(8); const e0 = S.ess;
              out.w1 = F.ppWrite('class'); out.dat1 = S.pp.dat; out.w2 = F.ppWrite('event');   // 한 번에 한 편
              S.pp.cur.end = Date.now() - 1; F.ppTick(); await sl(100);
              out.n1 = S.pp.n; out.cf1 = S.pp.cf; out.ess1 = S.ess - e0; out.t1 = F.achTitles().some(t => t.id === 'paperone');
              for (let i = 0; i < 2; i++) { F.ppData(3); F.ppWrite('class'); S.pp.cur.end = Date.now() - 1; F.ppTick(); }
              out.cf3 = S.pp.cf; out.n3 = S.pp.n;   // 30 + 30 + 15(3편째 절반)
              out.max = F.rtMax('class'); out.maxE = F.rtMax('event');
              const e1 = S.ess; out.rt5 = F.rtStart('class'); out.rtEss = e1 - S.ess; S.rt5.cur.end = Date.now() - 1; await sl(1500); out.lv5 = F.rtLv('class');
              out.rtEvent = F.rtStart('event') && (S.rt5.cur = null, true);
              // 학회가 바뀌면 메달
              S.pp.cm = F.ppPer() - 1; S.pp.cf = 350; const e2 = S.ess; F.ppSync(); await sl(100);
              out.med = JSON.stringify(S.pp.med); out.medEss = S.ess - e2; out.cfReset = S.pp.cf; out.cb = S.pp.cb;
              // 세미나
              const s0 = S.pp.sem, d0 = S.pp.dat; F.ppSemDone(); out.sem = S.pp.sem - s0; out.semDat = S.pp.dat - d0;
              // 퀘스트 셈
              out.q = ['pp1', 'pp2', 'pp3', 'pp4', 'pp7'].map(id => F.qMeasure(F.MAIN.find(q => q.id === id)));
              // 논문 탭
              F.openRx(); await sl(300); document.querySelector('#rxSeg [data-rseg="paper"]').click(); await sl(300);
              out.rows = document.querySelectorAll('#rxBody [data-pp^="w:"]').length; out.conf = !!document.querySelector('#rxBody .pp-conf');
              out.head = document.querySelector('#rxTitle').parentElement.classList.contains('art');
              const bd = document.querySelector('#rxBody').getBoundingClientRect(); out.over = document.documentElement.scrollWidth > window.innerWidth || [...document.querySelectorAll('#rxBody .dp-row')].some(x => x.getBoundingClientRect().right > bd.right + 1);
              F.ppData(3); document.querySelector('#rxBody [data-pp="w:tam"]').click(); await sl(200); out.tabWrite = !!S.pp.cur && S.pp.cur.k === 'tam';
              document.querySelector('#rxSeg [data-rseg="tree"]').click(); await sl(300);
              out.nodes = document.querySelectorAll('#rxBody .rt-node').length; out.art = document.querySelector('#rxBody .rt-tree').classList.contains('art');
              return out; })()""")
            if w == 390: await pg.screenshot(path='/home/claude/rv/s166_tree.png')
            print(w, th, json.dumps(r, ensure_ascii=False))
            c.ok(r['open'] and r['day1'] and not r['day2'] and r['dat0'] == 1, f'자료 정리 하루 한 번: {r}')
            c.ok(r['w1'] and not r['w2'] and r['dat1'] == 6, f'논문 쓰기: {r}')
            c.ok(r['n1'] == 1 and r['cf1'] == 30 and r['ess1'] >= 10 and r['t1'], f'첫 논문 점수와 칭호: {r}')
            c.ok(r['n3'] == 3 and r['cf3'] == 75, f'같은 주제 3편째 절반: {r}')
            c.ok(r['max'] == 5 and r['maxE'] == 4, f'심화 칸 열림(수업 3편): {r}')
            c.ok(r['rt5'] and r['rtEss'] == 800 and r['lv5'] == 5, f'심화 칸 연구: {r}')
            c.ok(r['med'] != '[]' and r['medEss'] >= 40 and r['cfReset'] == 0 and r['cb'] >= 75, f'학회 메달: {r}')
            c.ok(r['sem'] == 1 and r['semDat'] == 3, f'세미나 자료: {r}')
            c.ok(r['q'][0] == 3 and r['q'][1] == 3 and r['q'][2] >= 75 and r['q'][3] == 5, f'퀘스트 셈: {r["q"]}')
            c.ok(r['rows'] == 5 and r['conf'] and r['head'] and not r['over'] and r['tabWrite'], f'논문 탭: {r}')
            c.ok(r['nodes'] == 25 and r['art'], f'나무 칸 25개와 배경 그림: {r}')
            await pg.evaluate(CLEAN)
            r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
              F.setTab('rank'); await sl(300); document.querySelector('#rankView [data-rv="all"]').click(); await sl(200);
              out.seg = !document.querySelector('#rankSchSeg').hidden;
              document.querySelector('#rankSchSeg [data-rsc="conf"]').click(); await sl(200);
              out.mode = F.rt4.rankView; out.lab = document.querySelector('#rankScoreLab').textContent; out.top = document.querySelector('#rankView [aria-checked="true"]').dataset.rv;
              out.over = document.documentElement.scrollWidth > window.innerWidth;
              return out; })()""")
            print('학회 순위', r)
            c.ok(r['seg'] and r['mode'] == 'conf' and r['lab'] == '이번 학회 점수' and r['top'] == 'all' and not r['over'], f'학회 순위 칸: {r}')
            c.ok(not errs, f'오류 {errs[:2]}')
            await ctx.close()
        # 저장 읽기, 후일담, 마을 기부, 대학원 전에는 닫힘
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=4))
        await pg.wait_for_timeout(1000)
        r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, out = {};
          out.closed = F.ppOpen(); out.noData = F.ppData(5);
          const d = JSON.parse(JSON.stringify(S));
          d.pp = { dat: -4, cur: { k: 'nope', end: 1 }, n: 'x', by: { class: 3, bad: 9 }, day: 5, cm: 'q', cf: 1e9, cb: 20, ck: { tam: 2 }, med: [[1, 2], [2, 9], 'x'], sem: 4 };
          const z = F.sanitize(d).pp; out.z = z;
          const d2 = JSON.parse(JSON.stringify(S)); delete d2.pp; d2.tier = 5; d2.tg = 3; d2.sem = 1; out.old = F.sanitize(d2).pp;
          S.cs.done = { scientist: { nm: '도토리', sp: 'squirrel' }, doctor: { nm: '콩이', sp: 'rabbit' } };
          const L = F.alumniLines(); out.ep = L.length; out.txt = L.map(e => e.map(x => x.t).join(' ')).join(' | ');
          out.sideOk = F.SIDE.find(x => x.id === 'alumni').ok(); S.tier = 5; S.tg = 6; out.sideOk2 = F.SIDE.find(x => x.id === 'alumni').ok(); S.tier = 4; S.tg = 0;
          out.vd = [F.vdReward(8), F.vdReward(9), F.vdReward(10)];
          return out; })()""")
        print('저장', json.dumps(r, ensure_ascii=False)[:900])
        z = r['z']
        c.ok(not r['closed'] and r['noData'] == 0, f'대학교에서는 닫힘: {r["closed"]}')
        c.ok(z['dat'] == 0 and z['cur'] is None and z['n'] == 0 and z['by'] == {'class': 3} and z['cf'] == 99999 and z['cm'] == -1 and z['med'] == [[1, 2]] and z['sem'] == 4 and z['day'] == '', f'저장 바로잡기: {z}')
        c.ok(r['old']['sem'] == 7 and r['old']['n'] == 0, f'옛 저장 세미나 어림: {r["old"]}')
        c.ok(r['ep'] == 3 and '도토리' in r['txt'] and '과학자' in r['txt'] and '솜이' in r['txt'] and '·' not in r['txt'], f'후일담 글: {r["txt"][:200]}')
        c.ok(not r['sideOk'] and r['sideOk2'], '후일담은 박사 학위 뒤에')
        c.ok(r['vd'][0]['e'] == 40 and r['vd'][1] == {'e': 5, 'g': 0} and r['vd'][2] == {'e': 5, 'g': 1}, f'마을 기부 9단계 뒤: {r["vd"]}')
        c.ok(not errs, f'오류 {errs[:2]}')
        await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
