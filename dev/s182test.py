# 182번 시험(5.3.3): 상점 값 다시 맞추기와 이달의 꾸미기 (docs/SHOP-2026-11.md 4.3, 4.4, woodani 결정)
# 1) 값표: 5분권 10장 25, 30분권 15, 1시간권 28, 3시간권 70, 즉시 완료 10분마다 5(5분 이하 2), 수업료 +100% 12, 도시락 5, 문제집 10+Lv(30에서 멈춤)
#    처음 장식 셋(벤치, 꽃밭, 이정표)은 정수 10 그대로, 모자 120, 가구 200, 밤 모드 150, 황금 품목 값 그대로
# 2) 황금 60개 뒤에는 황금 1개 대신 정수 10
# 3) 광고 황금 한도를 따로 세요: 일반 광고 3번(1개씩)과 상점 광고 3번(3개씩)이 서로 막지 않아요. 옛 저장(gd.a 없음)은 전체에서 상점 몫을 빼서 읽어요
# 4) 이달의 꾸미기: 그달 깃발(20)은 바로, 아치(30)는 확인 줄, 모자(25)는 바로 사서 입혀요. 산 것은 다시 눌러 벗어요. 지난 달 것은 놓친 장식에 같은 값
#    저장 다시 읽기 뒤에도 가진 것이 남아요. 값과 재화가 유한해요. 390 밝은 화면과 360 어두운 화면에서 넘치지 않아요
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
            sv = base(tier=2, tg=0); sv['ess'] = 500; sv['gold'] = 300
            ctx, page, errs = await ctxpage(b, w, h, scheme, sv)
            await page.wait_for_timeout(1200); await page.evaluate(NB_OFF); await page.evaluate(CLOSE)
            # 1) 값표
            r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S;
              const tk = F.ESHOP.tk.list.map(x => [x.k, x.n, x.ess]), lv = k => {{ const o = S.ac[k].lv; return o; }};
              const book = []; for (const L of [1, 15, 20, 21, 40, 60]) {{ S.ac.kor.lv = L; book.push(F.bookCost('kor')); }} S.ac.kor.lv = 1;
              const ces = [F.conEssCost ? F.conEssCost(200) : null, F.conEssCost ? F.conEssCost(601) : null];
              return {{ tk, feast: F.ESHOP.boost.feast.ess, lunch: F.PCN.lunch, book, ces, hat: F.ESHOP.hat, fur: F.ESHOP.fur, night: F.ESHOP.night,
                first3: ['bench', 'flowerbed', 'signpost'].map(id => F.DECO_BY[id] ? F.DECO_BY[id].ess : null), gshop: F.GSHOP, essPer: F.GOLD.essPer }}; }})()""")
            print('값표', r)
            ok(r['tk'] == [['m5', 10, 25], ['m30', 1, 15], ['h1', 1, 28], ['h3', 1, 70]], '단축권 값 25, 15, 28, 70')
            ok(r['feast'] == 12 and r['lunch'] == 5, '수업료 +100% 12, 도시락 5')
            ok(r['book'] == [11, 25, 30, 30, 30, 30], '문제집 10 + Lv, 30에서 멈춰요')
            ok(r['ces'] in ([2, 10], [None, None]), f"즉시 완료 5분 이하 2, 10분마다 5 {r['ces']}")
            ok(r['hat'] == 120 and r['fur'] == 200 and r['night'] == 150, '모자, 가구, 밤 모드 그대로')
            ok(r['first3'] == [10, 10, 10], '처음 장식 셋은 정수 10 그대로')
            ok(r['gshop'] == {'theme': 60, 'themeBgOff': 10, 'outfit': 25, 'outfitMin': 5, 'evDeco': 20, 'mark': 30}, '황금 품목 값 그대로')
            ok(r['essPer'] == 10, '황금 60개 뒤 바뀌는 정수 10')
            # 2) 60개 뒤
            r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.st.gold = 100; const e0 = S.ess, g0 = S.gold; F.goldOr(1); return [S.ess - e0, S.gold - g0]; }})()""")
            ok(r == [10, 0], f'60개 뒤에는 황금 1 대신 정수 10 {r}')
            # 3) 광고 한도 따로
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              S.gd = {{ day: '', n: 0, shop: 0, a: 0 }}; const g0 = S.gold;
              S.gd.day = F.gameToday(); S.gd.shop = 3; S.gd.n = 3;   // 상점 광고를 다 본 날
              for (let i = 0; i < 4; i++) F.adGold();
              const a = [S.gold - g0, S.gd.a, S.gd.n];
              S.gd = {{ day: F.gameToday(), n: 3, shop: 0, a: 3 }}; F.setTab('shop'); await sl(200);
              const left = document.querySelector('#shopAdLeft').textContent, dis = document.querySelector('#shopAd').getAttribute('aria-disabled');
              return {{ a, left, dis }}; }})()""")
            print('광고', r)
            ok(r['a'] == [3, 3, 6], '상점 광고를 다 본 날에도 일반 광고 황금 3번(1개씩), 네 번째는 없어요')
            ok(r['dis'] == 'false' and '3번' in r['left'], '일반 광고를 다 본 날에도 상점 광고 3번이 남아요')
            # 4) 이달의 꾸미기
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.setTab('shop'); await sl(300);
              const cats = [...document.querySelectorAll('#panelShop [data-catgo]')].map(b => b.textContent);
              const m = +F.gameToday().slice(5, 7), k = String(m).padStart(2, '0'), q = s => document.querySelector(`#shopList [data-buy="g:${{k}}:${{s}}"]`);
              const tiles = ['flag', 'gate', 'hat'].map(s => !!q(s));
              let g = S.gold; q('flag').click(); await sl(150); const flag = [g - S.gold, document.querySelector('#shopAsk').hidden, F.decoOwn(`deco_mon_${{k}}_flag`)];
              g = S.gold; q('gate').click(); await sl(150); const askG = !document.querySelector('#shopAsk').hidden, before = g - S.gold; document.querySelector('#shopYes').click(); await sl(200);
              const gate = [askG, before, g - S.gold, F.decoOwn(`deco_mon_${{k}}_gate`)];
              g = S.gold; q('hat').click(); await sl(150); const hat = [g - S.gold, S.cos.hat, S.cos.own.includes('hat:mon' + k)];
              q('hat').click(); await sl(150); const off = S.cos.hat;
              const past = F.gmPast ? F.gmPast() : null;
              return {{ cats, tiles, flag, gate, hat, off, k, fin: [S.gold, S.ess].every(Number.isFinite), over: document.documentElement.scrollWidth > innerWidth + 1 }}; }})()""")
            print('이달의 꾸미기', r)
            k = r['k']
            ok('이번 달' in r['cats'] and all(r['tiles']), '이번 달 갈래와 깃발, 아치, 모자 칸')
            ok(r['flag'] == [20, True, 1], '깃발 20은 누르면 바로 사요')
            ok(r['gate'] == [True, 0, 30, 1], '아치 30은 확인 줄을 거쳐 사요')
            ok(r['hat'] == [25, 'mon' + k, True] and r['off'] == '', '모자 25는 바로 사서 입히고, 다시 누르면 벗어요')
            ok(r['fin'] and not r['over'], '재화가 유한하고 가로로 넘치지 않아요')
            await page.evaluate("document.querySelector('[data-buy^=\"g:\"]').scrollIntoView({block:'center'})")
            await page.screenshot(path=str(OUT / f's182_month_{scheme}.png'))
            # 저장 다시 읽기
            r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.save && F.save(); const raw = localStorage.getItem('forest-school-v1'); const d = F.sanitize(JSON.parse(raw));
              const k = String(+F.gameToday().slice(5, 7)).padStart(2, '0'); return [d.deco.own[`deco_mon_${{k}}_flag`], d.deco.own[`deco_mon_${{k}}_gate`], d.cos.own.includes('hat:mon' + k), d.gd.a]; }})()""")
            print('다시 읽기', r)
            ok(r[0] == 1 and r[1] == 1 and r[2] is True and isinstance(r[3], int), '저장 다시 읽기 뒤에도 이달의 꾸미기와 gd.a가 남아요')
            ok(not errs, f'오류 없음 {errs[:3]}')
            await ctx.close()
        # 옛 저장: gd.a 없이 n 3, shop 1이면 일반 광고 2번 본 것으로
        sv = base(tier=1, tg=0); sv['gd'] = {'day': '2099-01-01', 'n': 3, 'shop': 1}
        ctx, page, errs = await ctxpage(b, 390, 844, 'light', sv)
        await page.wait_for_timeout(1000)
        r = await page.evaluate(f"{F}.S.gd")
        print('옛 저장', r)
        ok(r.get('a') == 2 and r.get('n') == 3 and r.get('shop') == 1, '옛 저장의 gd.a는 전체에서 상점 몫을 빼요')
        # 지난 달: 날짜를 2027-02로 돌리면 11월, 12월, 1월 것이 놓친 장식에(값 그대로)
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S; F.rt.fakeNow = Date.parse('2027-02-10T03:00:00Z'); S.gold = 100; F.setTab('shop'); await new Promise(r=>setTimeout(r,300));
          const past = F.gmPast(), tiles = [...document.querySelectorAll('#shopList [data-buy^="g:"]')].map(b => b.dataset.buy);
          const g = S.gold; document.querySelector('#shopList [data-buy="g:11:flag"]').click(); await new Promise(r=>setTimeout(r,150)); const paid = g - S.gold; F.rt.fakeNow = 0; return {{ past, n: tiles.length, cur: tiles.filter(t => t.startsWith('g:02')).length, paid }}; }})()""")
        print('지난 달', r)
        ok(r['past'] == [1, 12, 11] and r['cur'] == 3 and r['n'] == 12 and r['paid'] == 20, '지난 달 것은 놓친 장식에 같은 값(가까운 달부터)')
        ok(not errs, f'옛 저장 오류 없음 {errs[:3]}')
        await ctx.close()
        await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
