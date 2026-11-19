# 5.1.0 시험: 조교 파견. 석사 2학기에 열리고, 조교가 앉으면 수업료 +10%와 그 건물 가구 -10%, 파견 중에는 효과가 꺼지고
# 돌아오면 칩으로 정수와 추억 조각을 받고, 기념비 3단계에 칭호 '모교의 자랑'. 연구 트리 조교 가지, 퀘스트, 저장 읽기, 화면 넘침
# 쓰는 법: python3 wrap.py && python3 s161test.py   (마지막 줄이 PASS면 통과)
import asyncio
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
              S.tg = 0; S.sem = 0; S.ess = 0; S.budget = 1e40; out.open0 = F.taOpen();
              S.sem = 1; out.open1 = F.taOpen(); out.seats = F.taSeats();
              S.fu.cafeteria = S.fu.cafeteria.map(() => 0); S.fu.library = S.fu.library.map(() => 0); const r0 = F.rate(), f0 = F.furCost('cafeteria', 0);
              out.sit = F.taSit(0, 'cafeteria'); out.r1 = F.rate() / r0; out.f1 = F.furCost('cafeteria', 0) / f0; out.fOther = F.furCost('library', 0) > 0;
              out.sit2 = F.taSit(1, 'cafeteria'); out.seat0 = S.ta.seat[0].b; out.r2 = F.rate() / r0;   // 한 건물에 한 명: 0번은 비켜요
              F.taSit(0, 'library'); out.r3 = F.rate() / r0;
              out.send = F.taSend(0, 0, 2); out.r4 = F.rate() / r0; out.twice = F.taSend(0, 1, 0); out.n = S.ta.n;
              F.taSend(1, 4, 0); S.ta.out.forEach(o => o.end = 0);
              F.rt4.tab = 'school'; F.taRender(true); await sl(100); const ch = document.querySelector('#taChip'); out.chip = !ch.hidden;
              S.budget = 0; const e0 = S.ess, b0 = S.budget; ch.click(); await sl(200); out.ess = S.ess - e0; out.mem = S.ta.mem; out.ac = S.budget > b0; out.back = S.ta.out.length; out.chip2 = !ch.hidden;
              out.r5 = F.rate() / r0;
              S.ta.mem = 300; out.mon = [F.taMonUp(), F.taMonUp(), F.taMonUp(), F.taMonUp(), S.ta.mon, S.ta.mem];
              out.alma = F.achTitles().some(t => t.id === 'alma');
              S.rt5.lv.ta = 3; out.seats3 = F.taSeats(); S.rt5.lv.ta = 0;
              out.q = ['ta1', 'ta2', 'ta5'].map(id => F.qMeasure(F.MAIN.find(q => q.id === id)));
              // 저장 읽기
              const d = JSON.parse(JSON.stringify(S)); const a = F.sanitize(d).ta;
              d.ta = { seat: [{ b: 'nope' }, null, { b: 'library' }, 5, 6], out: [{ i: 0, to: 9, h: 0, end: 1 }, { i: 1, to: 2, h: 1, end: 5 }, { i: 1, to: 2, h: 1, end: 6 }], mem: -3, mon: 99, n: 'x' };
              const z = F.sanitize(d).ta; const d2 = JSON.parse(JSON.stringify(S)); delete d2.ta; const y = F.sanitize(d2).ta;
              out.sv = [a.mon, z.seat.length, z.seat[0].b, z.seat[2].b, z.out.length, z.mem, z.mon, z.n, JSON.stringify(y)];
              // 연구소 창 조교 탭
              S.ta.out = []; F.openRx(); await sl(300); document.querySelector('#rxSeg [data-rseg="ta"]').click(); await sl(200);
              document.querySelector('#rxBody [data-ta="go:0"]').click(); await sl(200);
              const m = document.querySelector('#mRx .modal'), mr = m.getBoundingClientRect();
              out.rows = document.querySelectorAll('#rxBody .dp-row').length; out.goBtns = document.querySelectorAll('#rxBody [data-ta^="send:0:"]').length; out.hrBtns = document.querySelectorAll('#rxBody [data-ta^="hr:0:"]').length;
              out.over = [...m.querySelectorAll('#rxBody *')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > mr.right + 1 || r.left < mr.left - 1); }).map(el => el.className || el.tagName).slice(0, 3);
              document.querySelector('#rxBody [data-ta="hr:0:1"]').click(); await sl(150); out.hrOn = !!document.querySelector('#rxBody .ta-hr.on[data-ta="hr:0:1"]');
              document.querySelector('#rxBody [data-ta="send:0:2:1"]').click(); await sl(200); out.uiSend = S.ta.out.length === 1 && S.ta.out[0].to === 2 && S.ta.out[0].h === 1;
              // 지도: 연구 구역에 조교 둘과 기념비
              S.ta.out = []; S.f.gradhall = 3; F.taSit(0, 'institute'); F.taSit(1, 'gradhall'); document.querySelectorAll('.overlay').forEach(o => { o.hidden = true; }); F.rt4.modalOpen = null;
              F.setZone('lab'); await sl(800); F.renderDeco(true); await sl(200);
              out.figs = document.querySelectorAll('#vdTop .ta-fig').length; out.monMap = document.querySelectorAll('#vdTop .ta-mon').length;
              F.taSend(1, 3, 0); await sl(100); out.figs2 = document.querySelectorAll('#vdTop .ta-fig').length;
              return out; })()""")
            print(w, r)
            await pg.screenshot(path=f's161_map_{w}.png')
            c.ok(r['figs'] == 2 and r['monMap'] == 1 and r['figs2'] == 1, f'지도 조교와 기념비 {r}')
            c.ok(not r['open0'] and r['open1'] and r['seats'] == 2, f'열리는 때 {r}')
            c.ok(r['sit'] and abs(r['r1'] - 1.1) < 1e-6 and abs(r['f1'] - 0.9) < 0.01 and r['fOther'], f'자리 효과 {r}')
            c.ok(r['sit2'] and r['seat0'] == '' and abs(r['r2'] - 1.1) < 1e-6 and abs(r['r3'] - 1.2) < 1e-6, f'한 건물에 한 명 {r}')
            c.ok(r['send'] and abs(r['r4'] - 1.1) < 1e-6 and not r['twice'] and r['n'] == 1, f'파견 중 효과 꺼짐 {r}')
            c.ok(r['chip'] and r['ess'] == 35 and r['mem'] == 5 and r['ac'] and r['back'] == 0 and not r['chip2'] and abs(r['r5'] - 1.2) < 0.01, f'돌아와서 받기 {r}')
            c.ok(r['mon'][:4] == [True, True, True, False] and r['mon'][4] == 3 and r['mon'][5] == 300 - 270 and r['alma'], f'기념비 {r["mon"]} {r["alma"]}')
            c.ok(r['seats3'] == 4, f'연구 트리 조교 가지 {r}')
            c.ok(r['q'] == [2, 2, 3], f'퀘스트 {r["q"]}')
            c.ok(r['sv'][:8] == [3, 4, '', 'library', 1, 0, 3, 0] and '"mon":0' in r['sv'][8], f'저장 읽기 {r["sv"]}')
            c.ok(r['rows'] >= 3 and r['goBtns'] == 5 and r['hrBtns'] == 3 and r['hrOn'] and not r['over'] and r['uiSend'], f'조교 탭 {r}')
            c.ok(not errs, f'{w}px 오류 {errs[:2]}')
            await ctx.close()
asyncio.run(main())
c.done()
