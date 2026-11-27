# 197번 시험: 탐험 2부 2단계 원정(숫자는 제안값 TEX)
# 1) 10층 큰 장난꾸러기 전에는 잠김, 아래 메뉴 '원정' 칸에 안내 줄
# 2) 원정권 하루 3장(날이 바뀌면 다시), 떠나면 칸 열두 개 지도와 갈림길 카드 셋(겹치지 않고, 마지막 갈림길에는 지름길 없음)
# 3) 싸움 칸은 자동으로 겨루고 체력이 이어져요. 갈림길 사건(샘물 체력, 무지개 힘, 지름길 건너뛰기, 별똥별 응원)
# 4) 큰 장난꾸러기를 달래면 그 지역 못 찾은 보물 하나, 받기를 누르면 재료, 도토리, 정수, 보물이 들어와요. 다 모으면 별 조각
# 5) 지거나 돌아와도 모은 것은 가져와요
# 6) 저장 읽기: 옛 저장(원정 없음), 망가진 원정 값 바로잡기, 다시 읽어도 원정이 남음
# 7) 화면: 360px 어두운 화면, 390px 밝은 화면에서 지도, 카드, 넘침 없음(캡처 s197_*), 건물 창 그림
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, F, OVER
c = Checker()
SETUP = """(lv)=>{ const F=window.__forest, S=F.S; S.tam.party=['bear','rabbit','fox']; for (const sp of S.tam.party) S.tam.mem[sp]={lv,st:1,sh:0}; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sv = base(tier=1, students=60)
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', sv)
        await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN)
        await pg.evaluate(SETUP, 60)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, T=F.TEX, o={{}};
          S.tam.best = 9; o.lock = F.txRender(); o.st0 = F.txStart(0);
          S.tam.best = 40; o.regs = F.txRegs().length; o.left = F.txLeft(); o.dot0 = F.txDot();
          o.st1 = F.txStart(0); const run = S.tam.xp.run; o.n = S.tam.xp.n; o.dot1 = F.txDot();
          o.forks = T.plan.map((k, i) => k === 'fork' ? run.evs[i] : null).filter(Boolean);
          o.distinct = o.forks.every(a => a.length === 3 && new Set(a).size === 3);
          o.lastNoSkip = !run.evs[10].some(i => T.ev[i].skip);
          o.ref = F.txRef(); o.fe = run.fe; o.fb = run.fb;
          // 첫 칸 싸움
          const m0 = run.got.m.slice(); const s1 = F.txStep(); o.s1 = s1; o.hp1 = run.hp; o.got1 = run.got.m.reduce((a, b) => a + b, 0) > m0.reduce((a, b) => a + b, 0) && run.got.a > 0;
          // 갈림길: 카드를 고르기 전에는 앞으로 못 가요
          const s2 = F.txStep(); o.atFork = T.plan[run.at] === 'fork'; o.block = F.txStep() === null;
          // 사건 효과 확인: 카드를 샘물, 무지개, 별똥별로 바꿔 보기
          const ix = k => T.ev.findIndex(e => e.k === k);
          run.hp = 300; run.evs[run.at] = [ix('spring'), ix('rainbow'), ix('star')]; F.txPick(0); o.spring = run.hp;
          F.txStep(); F.txStep(); run.evs[run.at] = [ix('rainbow'), ix('star'), ix('firefly')]; F.txPick(0); F.txStep(); o.atk = run.atk;
          F.txStep(); run.evs[run.at] = [ix('star'), ix('firefly'), ix('spring')]; F.txPick(0); o.ch = run.ch;
          // 지름길: 다음 싸움 건너뛰기(보상 없음)
          F.txStep(); F.txStep(); run.evs[run.at] = [ix('firefly'), ix('spring'), ix('owl')]; F.txPick(0); const g0 = JSON.stringify(run.got); const sk = F.txStep(); o.skip = sk && sk.skip === 1 && JSON.stringify(run.got) === g0;
          o.at = run.at; o.plan = T.plan[run.at];
          return o; }})()""")
        c.ok('10층' in r['lock'] and r['st0'] is False, f'10층 전에는 잠김 {r["lock"][:60]} {r["st0"]}')
        c.ok(r['regs'] == 1 and r['left'] == 3 and r['dot0'] and r['st1'] and r['n'] == 1 and not r['dot1'], f'원정권과 빨간 점 {r}')
        c.ok(r['distinct'] and r['lastNoSkip'] and len(r['forks']) == 5, f'갈림길 카드 {r["forks"]}')
        c.ok(r['fe'] == r['ref']['fe'] and r['fb'] == r['ref']['fb'] and r['fb'] % 10 == 0 and 1 <= r['fe'] <= 40, f'기준 층 {r["ref"]} {r["fe"]} {r["fb"]}')
        c.ok(r['s1'] and r['s1']['k'] == 'fight' and r['s1']['win'] and 0 < r['hp1'] <= 1000 and r['got1'], f'첫 싸움 {r["s1"]} {r["hp1"]}')
        c.ok(r['atFork'] and r['block'], '갈림길에서는 고르기 전에 못 가요')
        c.ok(r['spring'] == 700 and r['atk'] == 200 and r['ch'] >= 1 and r['skip'], f'사건 효과 {r}')
        # 큰 장난꾸러기까지 가서 받기(센 대원)
        await pg.evaluate(SETUP, 200)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, T=F.TEX, o={{}}; const run = S.tam.xp.run;
          let g = 0; while (!run.end && g++ < 30) {{ if (T.plan[run.at] === 'fork' && run.pk[run.at] < 0) F.txPick(0); else F.txStep(); }}
          o.end = run.end; o.at = run.at; o.t = run.got.t;
          const m0 = S.tam.mat.slice(), b0 = S.budget, e0 = S.ess, got = JSON.parse(JSON.stringify(run.got));
          const tk = F.txTake(); o.mat = [0, 1, 2, 3].every(i => S.tam.mat[i] === Math.min(1e12, m0[i] + got.m[i])); o.ac = S.budget - b0 === got.a && got.a > 0;
          o.ess = got.e; o.tr = S.tam.xp.tr[0]; o.w = S.tam.xp.w; o.run = S.tam.xp.run;
          o.fin = [S.budget, ...S.tam.mat].every(v => isFinite(v) && v < 1e15 * F.incomeScale());
          // 보물을 다 모은 지역은 별 조각을 더 받아요
          S.tam.xp.tr[0] = 31; F.txStart(0); const r2 = S.tam.xp.run; g = 0; while (!r2.end && g++ < 30) {{ if (T.plan[r2.at] === 'fork' && r2.pk[r2.at] < 0) F.txPick(0); else F.txStep(); }}
          o.end2 = r2.end; o.t2 = r2.got.t; F.txTake();
          // 셋째 원정은 돌아오기, 넷째는 원정권이 없어요
          F.txStart(0); const r3 = S.tam.xp.run; F.txStep(); const before = JSON.stringify(r3.got.m); F.txQuit(); o.quit = r3.end === -1; const m1 = S.tam.mat.slice(); F.txTake(); o.quitKeep = S.tam.mat.some((v, i) => v > m1[i]) || before === '[0,0,0,0]';
          o.left = F.txLeft(); o.st4 = F.txStart(0);
          S.tam.xp.d = '2000-01-01'; o.leftNew = F.txLeft();
          return o; }})()""")
        c.ok(r['end'] == 1 and r['at'] == 11 and 0 <= r['t'] <= 4, f'큰 장난꾸러기 달래기 {r}')
        c.ok(r['mat'] and r['ac'] and r['ess'] == 5 and r['tr'] == 1 << r['t'] and r['w'] == 1 and r['run'] is None and r['fin'], f'받기 {r}')
        c.ok(r['end2'] == 1 and r['t2'] == -1, f'보물을 다 모은 지역 {r}')
        c.ok(r['quit'] and r['quitKeep'] and r['left'] == 0 and r['st4'] is False and r['leftNew'] == 3, f'돌아오기와 원정권 {r}')
        # 지는 원정: 약한 대원
        await pg.evaluate(SETUP, 1)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, T=F.TEX, o={{}}; S.tam.best = 400;
          F.txStart(0); const run = S.tam.xp.run; run.fe = 400; run.fb = 400;
          const s = F.txStep(); o.win = s.win; o.end = run.end; o.hp = run.hp; o.step = F.txStep(); F.txTake(); o.run = S.tam.xp.run; o.w = S.tam.xp.w;
          return o; }})()""")
        c.ok(r['win'] is False and r['end'] == -1 and r['hp'] == 0 and r['step'] is None and r['run'] is None, f'지는 원정 {r}')
        # 저장 읽기
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, o={{}};
          const d0 = JSON.parse(JSON.stringify(S)); delete d0.tam.xp; o.old = JSON.stringify(F.sanitize(d0).tam.xp);
          const d1 = JSON.parse(JSON.stringify(S)); d1.tam.xp = {{ d: 5, n: 'x', tr: [99, -3, 'a'], c: -1, w: 1e99, run: {{ r: 99, at: 50, hp: 5000, evs: [[1, 2], 'x'], pk: 'q', got: {{ m: [1e99, -5], a: NaN, t: 9 }} }} }};
          const x = F.sanitize(d1).tam.xp; o.bad = x;
          S.tam.best = 40; S.tam.xp.d = ''; F.txStart(0); F.txStep(); o.keep = JSON.stringify(F.sanitize(JSON.parse(JSON.stringify(S))).tam.xp.run) === JSON.stringify(S.tam.xp.run);
          return o; }})()""")
        x = r['bad']; R = x['run']
        c.ok(r['old'] == '{"d":"","n":0,"run":null,"tr":[0,0,0,0,0,0,0],"c":0,"w":0}', f'옛 저장 {r["old"]}')
        c.ok(x['d'] == '' and x['n'] == 0 and x['tr'][:3] == [31, 0, 0] and x['w'] == 10**7 and R['r'] == 6 and R['at'] == 11 and R['hp'] == 1000 and R['got']['m'][0] == 10**12 and R['got']['m'][1] == 0 and R['got']['a'] == 0 and R['got']['t'] == 4 and all(len(R['evs'][i]) == 3 for i in (2, 4, 6, 8, 10)) and R['pk'] == [-1] * 12, f'망가진 값 {x}')
        c.ok(r['keep'], '다시 읽어도 원정이 남아요')
        await ctx.close()
        # 화면
        for w, sch in ((360, 'dark'), (390, 'light')):
            sv = base(tier=1, students=60)
            ctx, pg, errs2 = await ctxpage(b, w, 800, sch, sv)
            await pg.wait_for_timeout(1200); await pg.evaluate(CLEAN); await pg.evaluate(SETUP, 60)
            r = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, o={{}}, sl=ms=>new Promise(r=>setTimeout(r,ms));
              S.tam.best = 40; S.tam.seen = 1;
              F.setTab('tam'); await sl(900); document.querySelectorAll('.overlay').forEach(x => {{ x.hidden = true; x.classList.remove('open'); }}); F.rt4.modalOpen = null;
              const nb = document.querySelector('#tmNav [data-tnav="exp"]'); o.nav = !!nb && !nb.hidden; o.dot = nb.classList.contains('dot'); nb.click(); await sl(500);
              o.title = document.querySelector('#tmShT').textContent; o.tabsHid = document.querySelector('#tmSeg').hidden;
              o.nodes = document.querySelectorAll('#tmBody .tx-map .tx-n').length; o.mapBg = (document.querySelector('#tmBody .tx-map').getAttribute('style') || '').includes('url');
              o.tr = document.querySelectorAll('#tmBody .tx-tr span').length;
              const navR = nb.getBoundingClientRect(); o.navW = navR.width;
              document.querySelector('[data-txgo]').click(); await sl(400); o.running = !!S.tam.xp.run;
              document.querySelector('[data-txstep]').click(); await sl(300); document.querySelector('[data-txstep]').click(); await sl(400);
              o.cards = document.querySelectorAll('#tmBody .tx-card').length; o.cardImg = document.querySelectorAll('#tmBody .tx-card img').length;
              return o; }}""")
            await pg.screenshot(path=f's197_{w}_{sch}_fork.png')
            over = await pg.evaluate(OVER, '#tmBody *, #tmNav button, .tm-sheet')
            r2 = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelector('#tmBody .tx-card').click(); await sl(300);
              const run = S.tam.xp.run; let g = 0; while (!run.end && g++ < 30) {{ if (F.TEX.plan[run.at] === 'fork' && run.pk[run.at] < 0) F.txPick(0); else F.txStep(); }}
              F.tamRenderBody(); await sl(300); return {{ take: !!document.querySelector('[data-txtake]'), end: run.end }}; }}""")
            await pg.screenshot(path=f's197_{w}_{sch}_end.png')
            r3 = await pg.evaluate(f"""async()=>{{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); document.querySelector('[data-txtake]').click(); await sl(400);
              return {{ run: window.__forest.S.tam.xp.run, go: !!document.querySelector('[data-txgo]') }}; }}""")
            c.ok(r['nav'] and r['dot'] and r['title'] == '원정' and r['tabsHid'] and r['nodes'] == 12 and r['mapBg'] and r['tr'] == 5 and r['navW'] >= 50, f'{w} 원정 화면 {r}')
            c.ok(r['running'] and r['cards'] == 3 and r['cardImg'] == 3, f'{w} 갈림길 카드 {r}')
            c.ok(r2['take'] and r3['run'] is None and r3['go'], f'{w} 받기 {r2} {r3}')
            c.ok(not over, f'{w} {sch} 넘침 {over}')
            if w == 390:
                r = await pg.evaluate(f"""async()=>{{ const F={F}, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.setTab('school'); await sl(300); F.openSheet('library'); await sl(400);
                  const im = document.querySelector('#sheetTam img'); return im ? im.getAttribute('src') : ''; }}""")
                c.ok('ex7_bf_map' in r or r.startswith('data:'), f'건물 창 그림 {r[:60]}')
            c.ok(not errs2, f'페이지 오류 {errs2[:3]}')
            await ctx.close()
        c.ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    c.done()
asyncio.run(main())
