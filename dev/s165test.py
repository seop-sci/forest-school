# 5.1.1.4 시험: 연구 트리 나무 화면과 랭킹 네 칸, 테마마다 새로 그린 지붕과 트랙(thr_)
# 연구 트리 탭이 가지 5개 × 칸 4개 나무로 보이고, 칸을 누르면 아래 칸 창이 바뀌고, '연구하기'로 연구가 시작되고 끝나면 칸이 차요.
# 랭킹은 리그, 학교, 대결, 탐험 네 칸이고 리그 안에 이번 주와 시즌. 360px과 390px, 밝은 화면과 어두운 화면에서 넘치지 않아요
# 쓰는 법: python3 wrap.py && python3 s165test.py   (마지막 줄이 PASS면 통과)
import asyncio, os, sys
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN
c = Checker()
SHOT = os.environ.get('SHOT')   # 사진을 남길 폴더(없으면 안 남겨요)
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
              S.ess = 5000; S.budget = 1e40; S.rt5 = { lv: { class: 2, event: 4 }, cur: null };
              F.openRx(); await sl(300); document.querySelector('#rxSeg [data-rseg="tree"]').click(); await sl(300);
              const q = s => document.querySelectorAll('#rxBody ' + s).length;
              out.nodes = q('.rt-node'); out.done = q('.rt-node.done'); out.next = q('.rt-node.next'); out.names = q('.rt-nm');
              const tree = document.querySelector('#rxBody .rt-tree').getBoundingClientRect(), body = document.querySelector('#rxBody').getBoundingClientRect();
              out.fit = tree.left >= body.left - 1 && tree.right <= body.right + 1;
              out.inTree = [...document.querySelectorAll('#rxBody .rt-node')].every(n => { const r = n.getBoundingClientRect(); return r.left >= tree.left - 1 && r.right <= tree.right + 1 && r.top >= tree.top - 1 && r.bottom <= tree.bottom + 1; });
              out.over = document.documentElement.scrollWidth > window.innerWidth;
              out.card0 = document.querySelector('#rxBody .rt-card b').textContent;
              document.querySelector('#rxBody [data-rts="tam"]').click(); await sl(200);
              out.card1 = document.querySelector('#rxBody .rt-card b').textContent;
              const e0 = S.ess; document.querySelector('#rxBody [data-rt="tam"]').click(); await sl(200);
              out.run = !!S.rt5.cur && S.rt5.cur.k === 'tam'; out.spent = e0 - S.ess; out.runNode = q('.rt-node.run'); out.other = document.querySelector('#rxBody .rt-card .fe-lock') ? document.querySelector('#rxBody .rt-card .fe-lock').textContent : '';
              out.shot1 = 1;
              return out; })()""")
            if SHOT: await pg.locator('#mRx .modal, #mRx').first.screenshot(path=f'{SHOT}/tree_{w}_{th}.png')
            r2 = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
              S.rt5.cur.end = Date.now() - 1; await sl(1600); out.lv = F.rtLv('tam');
              document.querySelector('#rxSeg [data-rseg="tree"]').click(); await sl(200);
              out.done = document.querySelectorAll('#rxBody .rt-node.done').length;
              return out; })()""")
            print(w, th, r, r2)
            c.ok(r['nodes'] == 25 and r['names'] == 5, f'칸 수: {r}')
            c.ok(r['done'] == 6 and r['next'] == 4, f'칸 상태(완성 6, 열 수 있음 4): {r}')
            c.ok(r['fit'] and r['inTree'] and not r['over'], f'나무가 넘쳐요: {r}')
            c.ok(r['card0'].startswith('수업') and r['card1'].startswith('탐험'), f'칸 창: {r}')
            c.ok(r['run'] and r['spent'] == 50 and r['runNode'] == 1, f'연구 시작: {r}')
            c.ok(r2['lv'] == 1 and r2['done'] == 7, f'연구 끝: {r2}')
            # 랭킹 네 칸
            await pg.evaluate(CLEAN)
            r3 = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
              F.setTab('rank'); await sl(400);
              const vis = s => { const e = document.querySelector(s); return !!e && !e.hidden; };
              out.top = [...document.querySelectorAll('#rankView [data-rv]')].map(b => b.textContent);
              out.lg0 = vis('#rankLgSeg'); out.lab0 = document.querySelector('#rankScoreLab').textContent;
              document.querySelector('#rankLgSeg [data-rlg="sea"]').click(); await sl(200);
              out.sea = F.rt4.rankView; out.lab1 = document.querySelector('#rankScoreLab').textContent;
              out.topOn = document.querySelector('#rankView [aria-checked="true"]').dataset.rv;
              document.querySelector('#rankView [data-rv="all"]').click(); await sl(200);
              out.lg1 = vis('#rankLgSeg'); out.lab2 = document.querySelector('#rankScoreLab').textContent;
              document.querySelector('#rankView [data-rv="week"]').click(); await sl(200);
              out.back = F.rt4.rankView;
              document.querySelector('#rankView [data-rv="tam"]').click(); await sl(200);
              out.tamSeg = vis('#rankTamSeg'); out.lg2 = vis('#rankLgSeg');
              const segs = ['#rankView', '#rankLgSeg', '#rankTamSeg'].map(s => document.querySelector(s));
              out.wrap = [...document.querySelectorAll('#rankView button')].every(b => b.scrollWidth <= b.clientWidth + 1);
              out.over = document.documentElement.scrollWidth > window.innerWidth;
              return out; })()""")
            if SHOT:
                await pg.evaluate("document.querySelector('#rankView [data-rv=\"week\"]').click()"); await pg.wait_for_timeout(300)
                await pg.screenshot(path=f'{SHOT}/rank_{w}_{th}.png')
            print(w, th, r3)
            c.ok(r3['top'] == ['리그', '학교', '대결', '탐험'], f'랭킹 칸: {r3["top"]}')
            c.ok(r3['lg0'] and r3['sea'] == 'sea' and r3['topOn'] == 'week' and '시즌' in r3['lab1'], f'리그 안 시즌: {r3}')
            c.ok(not r3['lg1'] and '학교 파워' in r3['lab2'], f'학교 칸: {r3}')
            c.ok(r3['back'] == 'sea', f'리그를 다시 누르면 고른 작은 칸으로: {r3}')
            c.ok(r3['tamSeg'] and not r3['lg2'], f'탐험 칸: {r3}')
            c.ok(r3['wrap'] and not r3['over'], f'랭킹 칸이 넘쳐요: {r3}')
            c.ok(not errs, f'오류 {errs[:2]}')
            await ctx.close()
        # 테마 지붕: 유치원 교실과 급식실 봄은 새 그림을 색 곱하기 없이, 처마 띠 없음
        for w, th in ((390, 'light'),):
            ctx, pg, errs = await ctxpage(b, w, 800, th, base())
            await pg.wait_for_timeout(1200)
            await pg.evaluate(CLEAN)
            r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
              const ro = (k, want) => { const im = document.querySelector('#b-' + k + ' .roofimg'); return { href: (im.getAttribute('href') || '') === F.IMG170(want), want, f: im.getAttribute('filter') || '', on: im.style.display !== 'none', deco: document.querySelector('#b-' + k + ' .th-deco').innerHTML.length }; };
              Object.assign(S.cos.th, { classroom: 'spring', cafeteria: 'spring' }); F.applyThemes(); await sl(200);
              out.k = F.thrKey('classroom'); out.cl = ro('classroom', out.k); out.cfk = F.thrKey('cafeteria'); out.cf = ro('cafeteria', out.cfk);
              S.cos.th.classroom = 'winter'; F.applyThemes(); await sl(200); out.w = ro('classroom', F.thrKey('classroom'));
              S.cos.th.classroom = ''; F.applyThemes(); await sl(200); out.off = ro('classroom', '');
              return out; })()""")
            print('지붕', r)
            c.ok(r['k'] == 'thr_classroom_on_spring' and r['cl']['href'] and r['cl']['f'] == 'none' and r['cl']['on'] and r['cl']['deco'] == 0, f'새 테마 지붕: {r["cl"]}')
            c.ok(r['cfk'] == 'thr_cafeteria_on_spring' and r['cf']['href'] and r['cf']['f'] == 'none' and r['cf']['deco'] == 0, f'급식실도 새 테마 지붕(작업지시서 97): {r["cf"]}')
            c.ok(r['w']['want'] == 'thr_classroom_on_winter' and r['w']['href'] and r['w']['f'] == 'none', f'겨울 새 지붕: {r["w"]}')
            c.ok(not r['off']['on'], f'테마를 빼면 지붕 조각을 숨겨요: {r["off"]}')
            c.ok(not errs, f'오류 {errs[:2]}')
            await ctx.close()
        # 겨울 운동장: 새 트랙이 있으면 겨울에도 켜요(중학교 운동장 3단계)
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=2))
        await pg.wait_for_timeout(1200)
        await pg.evaluate(CLEAN)
        r = await pg.evaluate("""(async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
          S.bs = Object.assign(S.bs || {}, { playground: 2 }); S.cos.th.playground = 'winter'; F.applyThemes(); await sl(200);
          const im = document.querySelector('#b-playground .roofimg'); out.b = F.bldImg('playground'); out.k = F.thrKey('playground'); out.href = (im.getAttribute('href') || '') === F.IMG170(out.k); out.on = im.style.display !== 'none';
          return out; })()""")
        print('운동장', r)
        c.ok(r['k'] == 'thr_field_s3_winter' and r['href'] and r['on'], f'겨울 운동장 새 트랙: {r}')
        c.ok(not errs, f'오류 {errs[:2]}')
        await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
