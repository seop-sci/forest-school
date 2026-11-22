# 184번 시험(5.4.0): 사진첩과 계절 사진 미션, 모은 것 한눈에 보기
# 1) 비 오는 가을 낮에 찰칵 → '가을비', '한낮의 운동장'이 채워지고 숲의 정수 +10
# 2) 사진 모드에서 실제와 다른 시간을 고르면 찰칵이 흐려지고 눌러도 기록이 안 생겨요
# 3) 12월 눈 오는 밤 → '눈 내리는 교정', '눈 오는 밤'. 크리스마스 이벤트 주 → '크리스마스 주간'
# 4) 가을 묶음을 다 찍으면 가을 액자와 지도 장식(한 번만). 언제나 8장은 금빛 액자
# 5) 자유 사진은 30장까지(오래된 것부터 빠져요)
# 6) 저장 다시 읽기: 같은 사진첩, 망가진 기록과 모르는 미션은 버려요
# 7) 빨간 점: 찍을 수 있을 때만, 그날 사진 칸을 열면 꺼져요
# 8) 시간 흐름 단추 '늘 낮'(S.nl 2)이어도 실제 밤이면 밤으로 판정해요
# 9) 처음 세 메인 퀘스트 동안은 사진 칸과 찰칵이 없고, 그 뒤 열려요
# 10) 360px, 390px, 밝은 화면과 어두운 화면에서 도감 칸 여섯 개와 사진첩, 모은 것 판이 넘치지 않아요. 사진 54장 저장 길이
import asyncio, pathlib
from playwright.async_api import async_playwright
from testlib import ctxpage, base, F, Checker
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
CLOSE = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt4.modalOpen=null; window.__forest.rt4.modalQueue.length=0;"
NIGHT = "Date.parse('2026-11-23T13:00:00Z')"    # KST 22시

async def main():
    c = Checker(); OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # ---- 기능: 초등학교 ----
        ctx, page, errs = await ctxpage(b, 390, 844, 'light', base(tier=1, tg=0))
        await page.wait_for_timeout(1500); await page.evaluate(CLOSE)
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, P=F.pa, sl=ms=>new Promise(r=>setTimeout(r,ms)), o={{}};
          await sl(1200); o.open = [P.open, !document.querySelector('#dsegPa').hidden];
          const shoot = async (fk, ph, wx) => {{ P.fake(fk); if (!F.rt4.photo) F.photoOpen(); await sl(60); if (ph) F.rt4.wldPh = ph; if (wx != null) F.rt4.wldWx = wx; return P.paShot(); }};
          const e0 = S.ess;
          o.r1 = await shoot({{ ph: 'day', wx: 'rain', m: 10, ev: '', fest: false, nb: false }});
          o.pre = [F.rt4.wldPh, F.rt4.wldWx];
          o.m1 = Object.keys(S.pa.ms).sort(); o.ess1 = S.ess - e0;
          o.snapOn = !document.querySelector('#phSnap').classList.contains('off');
          F.rt4.wldPh = 'night'; P.paSync(); o.snapOff = document.querySelector('#phSnap').classList.contains('off');
          const n0 = Object.keys(S.pa.ms).length + S.pa.fr.length; o.r2 = P.paShot(); o.n2 = Object.keys(S.pa.ms).length + S.pa.fr.length - n0;
          o.r3 = await shoot({{ ph: 'night', wx: 'snow', m: 12, ev: '', fest: false, nb: false }}, 'night', 'snow');
          o.m3 = ['wi_snow', 'wi_snight'].every(k => S.pa.ms[k]);
          o.r4 = await shoot({{ ph: 'day', wx: '', m: 12, ev: 'xmas', fest: false, nb: false }}, 'day', '');
          o.m4 = !!S.pa.ms.wi_xmas;
          await shoot({{ ph: 'day', wx: '', m: 10, ev: '', fest: false, nb: false }}, 'day', '');
          await shoot({{ ph: 'morning', wx: 'fog', m: 10, ev: '', fest: false, nb: false }}, 'morning', '');
          o.au = [S.pa.own.filter(x => x === 'autumn').length, S.deco.own.deco_pa_autumn || 0, ['au_leaf','au_rain','au_dfly','au_fog'].every(k => S.pa.ms[k])];
          await shoot({{ ph: 'morning', wx: 'fog', m: 10, ev: '', fest: false, nb: false }}, 'morning', '');
          o.au2 = S.pa.own.filter(x => x === 'autumn').length;
          for (const [ph, ext] of [['morning', {{}}], ['evening', {{}}], ['night', {{}}], ['day', {{ fest: true }}], ['night', {{ nb: true, tier: 3 }}]])
            await shoot(Object.assign({{ ph, wx: '', m: 5, ev: '', fest: false, nb: false }}, ext), ph, '');
          o.gold = S.pa.own.includes('gold'); o.al = P.PA_MS.filter(x => x.sea === 'al').every(x => S.pa.ms[x.id]);
          o.cnt = P.count(); o.ach = S.ach.hit.photo || 0;
          for (let i = 0; i < 31; i++) {{ S.clk.last = 0; F.rt4.fakeNow = Date.parse('2026-11-25T03:00:00Z') + i * 60000; await shoot({{ ph: 'day', wx: '', m: 6, ev: '', fest: false, nb: false }}, 'day', ''); }}
          o.fr = [S.pa.fr.length, S.pa.fr[0].at === Date.parse('2026-11-25T03:00:00Z') + 60000];
          F.rt4.fakeNow = 0; S.clk.last = 0;
          // 저장 다시 읽기
          F.save(); const raw = JSON.parse(localStorage.getItem('forest-school-v1')); const d1 = F.sanitize(raw);
          o.same = JSON.stringify(d1.pa) === JSON.stringify(S.pa);
          raw.pa.ms.bogus = {{ at: 1, t: 0, ph: 'day' }}; raw.pa.ms.al_morn = {{ at: 'x' }}; raw.pa.fr.push(null, {{ at: 5, t: 99, ph: 'day' }}); raw.pa.own.push('nope');
          const d2 = F.sanitize(raw); o.clean = [!d2.pa.ms.bogus, !d2.pa.ms.al_morn && !!d2.pa.ms.al_day, d2.pa.fr.length, d2.pa.own.includes('nope')];
          const d3 = F.sanitize(Object.assign({{}}, raw, {{ pa: undefined }})); o.old = [d3.pa.on, Object.keys(d3.pa.ms).length, d3.pa.own];
          // 빨간 점
          S.pa.seen = ''; P.fake({{ ph: 'day', wx: 'rain', m: 4, ev: '', fest: false, nb: false }}); o.dot1 = P.paDot();
          F.photoClose(); F.setTab('dex'); await sl(100); document.querySelector('#dsegPa').click(); await sl(150); o.dot2 = P.paDot();
          o.pane = !document.querySelector('#paPane').hidden && document.querySelectorAll('#paBody .pa-cell').length >= 24 + 30;
          S.pa.seen = ''; P.fake({{ ph: 'day', wx: '', m: 10, ev: '', fest: false, nb: false }}); o.dot3 = P.paDot();
          // 크게 보기와 액자 바꾸기
          document.querySelector('#paBody [data-pa="au_rain"]').click(); await sl(100);
          const fb = document.querySelector('.pa-big [data-pafx="autumn"]'); o.big = !!document.querySelector('.pa-big'); if (fb) fb.click(); await sl(100); o.fx = S.pa.ms.au_rain.fx;
          document.querySelector('#paBigX').click(); await sl(60);
          // 모은 것
          document.querySelector('#dexSeg [data-dseg="ach"]').click(); await sl(150);
          const rows = P.paAllRows(); o.all = [!document.querySelector('#paAll').hidden, rows.some(x => x.nm === '사진 미션' && x.n === P.count()), /완성도 \\d+%/.test(document.querySelector('#paAll h3').textContent)];
          // 저장 길이: 미션 24장 + 자유 30장
          for (const x of P.PA_MS) if (!S.pa.ms[x.id]) S.pa.ms[x.id] = Object.assign({{}}, S.pa.fr[0]);
          o.len = [JSON.stringify(S.pa).length, JSON.stringify(S).length];
          P.fake(null); return o; }})()""")
        print(r)
        c.ok(r['open'] == [True, True], '초등학교에서는 사진첩이 열려 있고 사진 칸이 보여요')
        c.ok(r['r1'] and r['m1'] == ['al_day', 'au_rain'] and r['ess1'] == 10, '비 오는 가을 낮: 가을비와 한낮의 운동장, 정수 +10')
        c.ok(r['pre'] == ['day', 'rain'], '사진 모드를 열면 실제 시간과 날씨가 골라져 있어요')
        c.ok(r['snapOn'] and r['snapOff'], '실제와 다른 시간을 고르면 찰칵이 흐려져요')
        c.ok(r['r2'] is False and r['n2'] == 0, '흐린 찰칵은 기록을 남기지 않아요')
        c.ok(r['r3'] and r['m3'], '12월 눈 오는 밤: 눈 내리는 교정, 눈 오는 밤')
        c.ok(r['r4'] and r['m4'], '크리스마스 주: 크리스마스 주간')
        c.ok(r['au'] == [1, 1, True] and r['au2'] == 1, '가을 4장: 가을 액자와 장식을 한 번만')
        c.ok(r['gold'] and r['al'], '언제나 8장: 금빛 액자')
        c.ok(r['ach'] >= 2, f"사진 업적 단계 {r['ach']} (미션 {r['cnt']}장)")
        c.ok(r['fr'] == [30, True], '자유 사진 30장, 가장 오래된 것부터 빠짐')
        c.ok(r['same'], '저장 다시 읽기 뒤 사진첩이 같아요')
        c.ok(r['clean'][0] and r['clean'][1] and r['clean'][2] == 30 and not r['clean'][3], '망가진 기록과 모르는 미션, 액자는 버려요')
        c.ok(r['old'] == [0, 0, ['plain']], '옛 저장은 빈 사진첩')
        c.ok(r['dot1'] and not r['dot2'] and not r['dot3'], '빨간 점: 찍을 수 있을 때만, 사진 칸을 열면 꺼짐')
        c.ok(r['pane'], '사진 칸에 미션 24칸과 자유 사진 30칸')
        c.ok(r['big'] and r['fx'] == 'autumn', '크게 보기에서 가진 액자로 바꿔요')
        c.ok(all(r['all']), '업적 칸 맨 위 모은 것 판과 완성도')
        c.ok(r['len'][0] < 15000 and r['len'][1] < 200000, f"사진 54장 저장 길이 {r['len']}")
        # 늘 낮 단추와 실제 밤
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, P=F.pa, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.setTab('school'); S.nl = 2; S.clk.last = 0; F.rt4.fakeNow = {NIGHT}; await sl(100);
          const o = [F.wldPhase(), P.paNow().ph]; F.photoOpen(); await sl(60); o.push(F.rt4.wldPh); F.photoClose(); S.nl = 0; F.rt4.fakeNow = 0; S.clk.last = 0; return o; }})()""")
        c.ok(r == ['day', 'night', 'night'], f'늘 낮이어도 실제 밤으로 판정 {r}')
        c.ok(not errs, f'오류 없음 {errs[:3]}')
        await ctx.close()
        # ---- 처음 세 퀘스트 ----
        ctx, page, errs = await ctxpage(b, 390, 844, 'light', base(tier=0, tg=0))
        await page.wait_for_timeout(1500); await page.evaluate(CLOSE)
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); S.q.m = 1; S.pa.on = 0; await sl(1200);   // 유치원 처음 학교, 첫 퀘스트를 막 마친 때
          const o = [S.pa.on, document.querySelector('#dsegPa').hidden]; F.photoOpen(); await sl(60); o.push(!document.querySelector('#phSnap')); F.photoClose();
          S.q.m = 3; await sl(1200); o.push(S.pa.on, document.querySelector('#dsegPa').hidden); return o; }})()""")
        c.ok(r == [0, True, True, 1, False], f'처음 세 퀘스트 동안 닫혀 있다가 열려요 {r}')
        c.ok(not errs, f'처음 학교 오류 없음 {errs[:3]}')
        await ctx.close()
        # ---- 화면 넓이 ----
        for (w, h, scheme) in ((360, 780, 'light'), (360, 780, 'dark'), (390, 844, 'dark')):
            sv = base(tier=3, tg=0)
            ctx, page, errs = await ctxpage(b, w, h, scheme, sv)
            await page.wait_for_timeout(1500); await page.evaluate(CLOSE)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, P=F.pa, sl=ms=>new Promise(r=>setTimeout(r,ms)); await sl(1100);
              document.querySelector('#dsegSn').hidden = false; document.querySelector('#dsegBx').hidden = false;   // 여섯 칸 모두
              P.fake({{ ph: 'day', wx: 'rain', m: 10, ev: '', fest: false, nb: false }}); F.photoOpen(); await sl(60); P.paShot(); F.photoClose();
              F.setTab('dex'); await sl(100); document.querySelector('#dsegPa').click(); await sl(200);
              const sg = document.querySelector('#dexSeg'), over = el => [...el.querySelectorAll('*')].filter(x => {{ const r = x.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }}).length;
              const o = {{ seg: sg.scrollWidth <= sg.clientWidth + 1, segBtn: [...sg.querySelectorAll('button')].filter(b => !b.hidden).every(b => b.scrollWidth <= b.clientWidth + 1), pa: over(document.querySelector('#paPane')), doc: document.documentElement.scrollWidth <= innerWidth + 1 }};
              await sl(50); return o; }})()""")
            await page.evaluate(CLOSE); await page.evaluate("document.querySelector('#paPane').scrollIntoView()"); await page.wait_for_timeout(100)
            await page.screenshot(path=str(OUT / f's184_pa_{w}_{scheme}.png'))
            r2 = await page.evaluate(f"""(async()=>{{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); document.querySelector('#dexSeg [data-dseg="ach"]').click(); await sl(200);
              const el = document.querySelector('#paAll'); return [!el.hidden, [...el.querySelectorAll('*')].filter(x => {{ const r = x.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }}).length]; }})()""")
            await page.evaluate(CLOSE); await page.evaluate("document.querySelector('#paAll').scrollIntoView()"); await page.wait_for_timeout(100)
            await page.screenshot(path=str(OUT / f's184_all_{w}_{scheme}.png'))
            print(w, scheme, r, r2)
            c.ok(r['seg'] and r['segBtn'], f'[{w} {scheme}] 도감 칸 여섯 개가 넘치지 않아요')
            c.ok(r['pa'] == 0 and r['doc'], f'[{w} {scheme}] 사진첩이 넘치지 않아요')
            c.ok(r2 == [True, 0], f'[{w} {scheme}] 모은 것 판이 넘치지 않아요')
            c.ok(not errs, f'[{w} {scheme}] 오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
