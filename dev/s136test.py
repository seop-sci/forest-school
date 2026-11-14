# 136번 시험(4.4.0): 탐험 전체 화면
# 1) 탐험 탭을 열면 위 재화 칸과 아래 탭이 숨고 탐험이 화면 전체(360px, 390px, 밝은 화면과 어두운 화면에서 단추가 화면 안)
# 2) 위 칸 도토리, 나가기 단추로 학교 화면, 아래 메뉴로 창이 올라오고 닫기, 랭킹 단추는 탐험 순위로
# 3) 새 그림(세로 배경, 화면 틀)을 써요
# 4) 11-5 졸업 여행(tripat)은 보내면 바로 완료
# 5) 행사가 열린 동안 광장 둘레에 선 선생님은 바깥으로 비켜요(평소에는 제자리)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, sch in [(360, 740, 'light'), (390, 844, 'dark')]:
            ctx, page, errs = await ctxpage(b, w, h, sch, base(tier=0, tg=0))
            await page.wait_for_timeout(1000)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true}}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
              S.tam.seen=1; S.tam.best=3; S.tam.skSeen=1; F.setTab('tam'); await sl(500);
              const vis = el => {{ const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1; }};
              const full = document.querySelector('#app').classList.contains('tam-full'), boardOff = getComputedStyle(document.querySelector('.board')).display === 'none', tabsOff = getComputedStyle(document.querySelector('.tabs')).display === 'none';
              const pr = document.querySelector('#panelTam').getBoundingClientRect();
              const inView = ['#tmExit', '#tmAc', '#tmSpd', '#tmSk .tm-sk', '#tmNav [data-tnav="rep"]', '#tmNav [data-tnav="mem"]'].map(q => [q, vis(document.querySelector(q))]);
              const ac = document.querySelector('#tmAcN').textContent;
              const bgOk = F.tamBg(1) === F.IMG('ex4_bg_ground') && !!F.IMG('ex4_bg_ground'), btn = getComputedStyle(document.querySelector('#panelTam')).getPropertyValue('--x4-btn').includes('url');
              document.querySelector('[data-tnav="mem"]').click(); await sl(400);
              const sheet = !document.querySelector('#tmSheet').hidden, sheetIn = vis(document.querySelector('#tmSheet')), body = document.querySelector('#tmBody').children.length > 0;
              document.querySelector('#tmShX').click(); await sl(100);
              const sheetOff = document.querySelector('#tmSheet').hidden;
              document.querySelector('[data-tnav="rank"]').click(); await sl(300);
              const rank = F.rt4.tab === 'rank' && F.rt4.rankView === 'tam' && !document.querySelector('#app').classList.contains('tam-full');
              F.setTab('tam'); await sl(300); document.querySelector('#tmExit').click(); await sl(200);
              const back = F.rt4.tab === 'school' && getComputedStyle(document.querySelector('.tabs')).display !== 'none';
              return {{ full, boardOff, tabsOff, pw: Math.round(pr.width), ph: Math.round(pr.height), inView, ac, bgOk, btn, sheet, sheetIn, body, sheetOff, rank, back }}; }})()""")
            print(w, sch, json.dumps(r, ensure_ascii=False))
            ok(r['full'] and r['boardOff'] and r['tabsOff'] and r['pw'] == w and r['ph'] == h, f'{w} 탐험은 화면 전체')
            ok(all(v for _, v in r['inView']), f'{w} 단추가 모두 화면 안 {r["inView"]}')
            ok(r['ac'] not in ('', '0'), f'{w} 위 칸 도토리')
            ok(r['bgOk'] and r['btn'], f'{w} 새 그림(세로 배경, 둥근 단추 틀)')
            ok(r['sheet'] and r['sheetIn'] and r['body'] and r['sheetOff'], f'{w} 아래 메뉴로 창 열고 닫기')
            ok(r['rank'] and r['back'], f'{w} 랭킹 단추와 나가기 단추')
            ok(not errs, f'{w} 오류 없음 {errs[:2]}')
            await ctx.close()
        ctx, page, errs = await ctxpage(b, 390, 844, 'light', base(tier=0, tg=0))
        await page.wait_for_timeout(800)
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S, q={{ t: 'tripat', k: 'star', n: 1 }};
          const k0 = F.qMeasure(q); S.trip.cur = 'star'; const k1 = F.qMeasure(q); S.trip.cur = '';
          const [cx, cy] = F.geo().plaza, calm = F.teaOff([cx - 50, cy, 0.6]); F.rt4.fest = {{ id: 'x' }}; const inside = F.teaOff([cx - 50, cy, 0.6]), outside = F.teaOff([cx - 150, cy, 0.6]); F.rt4.fest = null;
          const dIn = Math.sqrt(((inside[0]-cx)/76)**2 + ((inside[1]-cy-10)/44)**2);
          return {{ k0, k1, dIn, outside, ox: cx - 150, oy: cy, calm: calm[0] === cx - 50 }}; }})()""")
        print('퀘스트와 선생님', json.dumps(r))
        ok(r['k1'] == r['k0'] + 1, '졸업 여행은 보내면 바로 셈')
        ok(r['dIn'] >= 1 and r['outside'][0] == r['ox'] and r['calm'], '행사 동안 광장 둘레 안 선생님만 바깥으로, 평소에는 제자리')
        ok(not errs, f'오류 없음 {errs[:2]}')
        await ctx.close(); await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
