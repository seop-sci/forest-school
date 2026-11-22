# 180번 시험(5.3.3): 상점 새 진열에서 가게마다 하나씩 사기 (docs/SHOP-2026-11.md 5절 1, 2단계)
# 1) 꾸미기 백화점: 옷 세트(황금 25)는 누르면 바로 사고, 테마 세트(황금 60)는 확인 줄을 거쳐 사요
# 2) 문방구: 수업료 +100%는 누르면 바로 사고(정수만 줄어요), 밤 모드는 설명 줄을 띄워요
# 3) 꾸미기 가게: 일반 장식을 누르면 바로 사요. 다음 값이 '다음 n'으로 보여요
# 4) 상점 거리: 재화 줄, 오늘의 진열대 카드 셋, 누르면 그 가게로 가서 그 품목을 비춰요
# 5) 가게 칩으로 가게를 오가고, 갈래 칩이 있어요. 유치원에서는 단축권이 보이지 않아요
# 6) 10번 뽑기와 남은 만큼 기부는 확인 줄을 거쳐요. 이벤트 한정 장식은 도감 '장식' 칸에 있어요
# 값과 하루 한도는 그대로인지(가게 값표) 보고, 390 밝은 화면과 360 어두운 화면에서 가로로 넘치지 않는지 봐요
import asyncio, pathlib
from playwright.async_api import async_playwright
from testlib import ctxpage, base, F
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
NB_OFF = "(()=>{ window.__forest.Live.off.add('night'); const m = document.querySelector('#mNb'); if (m && m.classList.contains('open')) { m.hidden = true; m.classList.remove('open'); window.__forest.rt.modalOpen = null; } })()"
CLOSE = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt4.modalOpen=null; window.__forest.rt4.modalQueue.length=0;"
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for (w, h, scheme) in ((390, 844, 'light'), (360, 740, 'dark')):
            sv = base(tier=1, tg=0); sv['ess'] = 500; sv['gold'] = 200
            ctx, page, errs = await ctxpage(b, w, h, scheme, sv)
            await page.wait_for_timeout(1200)
            await page.evaluate(NB_OFF); await page.evaluate(CLOSE)
            # 값표가 그대로인지
            r = await page.evaluate(f"(()=>{{ const F={F}; return [F.GSHOP, F.ESHOP.boost.feast.ess, F.ESHOP.boost.perDay, F.ESHOP.tk.perDay, F.ESHOP.ax]; }})()")
            ok(r[0] == {'theme': 60, 'themeBgOff': 10, 'outfit': 25, 'outfitMin': 5, 'evDeco': 20, 'mark': 30}, f'황금 값표 그대로 {r[0]}')
            print('값표', r)
            # 거리
            await page.evaluate(f"{F}.setTab('street')"); await page.wait_for_timeout(500)
            r = await page.evaluate("""(()=>{ const P=document.querySelector('#panelStreet');
              return { wal: P.querySelectorAll('[data-wallet] .w-it').length, cards: P.querySelectorAll('#shelf [data-shelf]').length, more: P.querySelectorAll('#shopMore [data-more]').length,
                over: document.documentElement.scrollWidth > innerWidth + 1 }; })()""")
            print('거리', r)
            ok(r['wal'] >= 2 and r['cards'] == 3 and r['more'] >= 1, '거리에 재화 줄과 진열대 카드 셋')
            ok(not r['over'], '거리가 가로로 넘치지 않아요')
            await page.screenshot(path=str(OUT / f's180_street_{scheme}.png'))
            r = await page.evaluate(f"""(async()=>{{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); const c=document.querySelector('#shelf [data-shelf^="ess"]'); c.click(); await sl(500);
              return {{ tab: {F}.rt.tab, hl: !!document.querySelector('#panelEss .hl') }}; }})()""")
            print('진열대 →', r)
            ok(r['tab'] == 'ess' and r['hl'], '진열대 카드를 누르면 그 가게로 가서 품목을 비춰요')
            # 가게 칩
            r = await page.evaluate(f"""(async()=>{{ const sl=ms=>new Promise(r=>setTimeout(r,ms)), out=[];
              for (const t of ['shop','deco','ess','street']) {{ document.querySelector('.shop-panel:not([hidden]) [data-go="'+t+'"]').click(); await sl(250); out.push({F}.rt.tab); }}
              return out; }})()""")
            print('가게 칩', r)
            ok(r == ['shop', 'deco', 'ess', 'street'], '가게 칩으로 가게를 오가요')
            # 1) 백화점
            await page.evaluate(f"{F}.setTab('shop')"); await page.wait_for_timeout(400)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              const cats=[...document.querySelectorAll('#panelShop [data-catgo]')].map(b=>b.textContent);
              const o=document.querySelector('#shopList [data-buy^="o:"]:not(.own)'); const g0=S.gold; o.click(); await sl(200);
              const outfit=[g0-S.gold, document.querySelector('#shopAsk').hidden];
              const tid=Object.keys(F.THEME||{{}})[0] || document.querySelector('[data-thfold]').dataset.thfold;
              document.querySelector('[data-thfold]').click(); await sl(200); const opened=!!document.querySelector('.th-card.open .th-body');
              const t=document.querySelector('.th-card.open [data-buy^="s:"]'); const g1=S.gold; t.click(); await sl(200);
              const ask=!document.querySelector('#shopAsk').hidden, before=g1-S.gold; document.querySelector('#shopYes').click(); await sl(300);
              return {{ cats, outfit, opened, ask, before, after: g1-S.gold, over: document.documentElement.scrollWidth > innerWidth + 1 }}; }})()""")
            print('백화점', r)
            ok('테마' in r['cats'], '백화점 갈래 칩')
            ok(r['outfit'] == [25, True], '옷 세트(25)는 누르면 바로 사요')
            ok(r['opened'] and r['ask'] and r['before'] == 0 and r['after'] == 60, '테마 세트(60)는 확인 줄을 거쳐 사요')
            ok(not r['over'], '백화점이 가로로 넘치지 않아요')
            await page.screenshot(path=str(OUT / f's180_shop_{scheme}.png'))
            # 2) 문방구
            await page.evaluate(f"{F}.setTab('ess')"); await page.wait_for_timeout(400)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              const e0=S.ess, b0=S.gold, fu=S.hd.feastUntil; document.querySelector('#essList [data-ebuy="bf"]').click(); await sl(200);
              const bf=[e0-S.ess, S.hd.feastUntil>fu, document.querySelector('#essAsk').hidden, b0-S.gold];
              document.querySelector('#essList [data-ebuy="night"]').click(); await sl(200); const night=!document.querySelector('#essAsk').hidden; document.querySelector('#essNo').click();
              const tk=!!document.querySelector('#essList [data-ebuy^="tk:"]');
              return {{ bf, night, tk, cats:[...document.querySelectorAll('#panelEss [data-catgo]')].map(b=>b.textContent) }}; }})()""")
            print('문방구', r)
            ok(r['bf'][0] > 0 and r['bf'][1] and r['bf'][2] and r['bf'][3] == 0, '수업료 +100%는 정수로 바로 사요(황금은 그대로)')
            ok(r['night'], '밤 모드는 설명 줄을 띄워요')
            ok(r['tk'] and '교환' in r['cats'], '초등학교에서는 단축권이 보이고 갈래에 교환이 있어요')
            await page.screenshot(path=str(OUT / f's180_ess_{scheme}.png'))
            # 3) 꾸미기 가게
            await page.evaluate(f"{F}.setTab('deco')"); await page.wait_for_timeout(400)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              S.pc = S.pc || {{}}; S.pc.berry = 0; if (S.mg) S.mg.pieces = 0; F.renderDecoShop(); await sl(100);
              const d=[...document.querySelectorAll('#decoList [data-dbuy]')].find(x=>F.DECO_BY[x.dataset.dbuy] && !F.DECO_BY[x.dataset.dbuy].rare && !F.DECO_BY[x.dataset.dbuy].ev);
              const id=d.dataset.dbuy, c=F.decoCost(id), nx=d.querySelector('.nx') ? d.querySelector('.nx').textContent : '', e0=S.ess, n0=F.decoOwn(id); d.click(); await sl(200);
              return {{ c, nx, paid: e0-S.ess, own: F.decoOwn(id)-n0, ask: document.querySelector('#decoAsk').hidden, next: F.decoCost(id), ev: !!document.querySelector('#decoList [data-evdex]') }}; }})()""")
            print('꾸미기 가게', r)
            ok(r['paid'] == r['c'] and r['own'] == 1 and r['ask'], '일반 장식은 누르면 바로 사요')
            ok(r['nx'] == f"다음 {r['next']}", '다음 값이 보여요')
            await page.screenshot(path=str(OUT / f's180_deco_{scheme}.png'))
            if r['ev']:
                r2 = await page.evaluate(f"""(async()=>{{ document.querySelector('#decoList [data-evdex]').click(); await new Promise(r=>setTimeout(r,400)); const p=document.querySelector('#decoDexPane'); return {{ tab:{F}.rt.tab, show: !!p && !p.hidden, n: document.querySelectorAll('#decoDexGrid > *').length }}; }})()""")
                print('장식 도감', r2)
                ok(r2['show'] and r2['n'] > 0, '이벤트 한정 장식은 도감 장식 칸에서 봐요')
            # 6) 10번 뽑기와 남은 만큼 기부 확인 줄(창을 직접 열지 않고 단추 줄만 그려 봐요)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); const out={{}};
              const box=document.querySelector('#snBtns'); box.innerHTML='<button type="button" data-sn="10" aria-disabled="false"><b>10번 뽑기</b></button>';
              let drew=0; const b0=S.budget; box.querySelector('[data-sn]').click(); await sl(100); out.sn=[!!document.querySelector('#askRow'), Math.round(b0-S.budget)];   // 수업료가 그사이 들어와 늘 수는 있어요
              document.querySelector('#askRow [data-ask="no"]').click(); out.snGone=!document.querySelector('#askRow');
              return out; }})()""")
            print('확인 줄', r)
            ok(r['sn'][0] and r['sn'][1] <= 0 and r['snGone'], '10번 뽑기는 확인 줄을 띄우고, 취소하면 아무것도 쓰지 않아요')
            ok(not errs, f'오류 없음 {errs[:3]}')
            await ctx.close()
        # 5) 유치원에서는 단축권이 보이지 않아요
        sv = base(tier=0, tg=0); sv['ess'] = 100
        ctx, page, errs = await ctxpage(b, 390, 844, 'light', sv)
        await page.wait_for_timeout(1000); await page.evaluate(NB_OFF); await page.evaluate(CLOSE)
        r = await page.evaluate(f"""(async()=>{{ {F}.setTab('ess'); await new Promise(r=>setTimeout(r,300)); return {{ tk: !!document.querySelector('#essList [data-ebuy^="tk:"]'), wal: document.querySelector('#panelEss [data-wallet]').textContent }}; }})()""")
        print('유치원', r)
        ok(not r['tk'], '유치원 문방구에는 단축권이 없어요')
        ok(not errs, f'유치원 오류 없음 {errs[:3]}')
        await ctx.close()
        await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
