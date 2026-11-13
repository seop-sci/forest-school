# 123번 시험(4.2.0): 광고 볼 이유 1~3번과 새 곡 자리
# 오늘의 광고 도장(6개, 3개와 6개 보상), 고등학교부터 광고 보상 고르기(자리 비운 동안, 보충수업), 한 판 더(하루 한 번씩), 졸업식과 학위수여식 곡, 옛 저장
import asyncio
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
AD = """const sl=ms=>new Promise(r=>setTimeout(r,ms)); const watch=async()=>{ for(let i=0;i<40;i++){ await sl(100); const d=document.querySelector('#adDone'); if(!document.querySelector('#mAd').hidden && !d.hidden){ d.click(); await sl(400); return true; } } return false; };"""
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=3, tg=1, adx={'day': 'x', 'n': 99, 'got': [1], 'fv': 'y', 'cs': 1}))
        r = await page.evaluate(f"""(()=>{{ const S={F}.S; return S.adx; }})()""")
        print('옛 저장', r); ok(r['n'] == 6 and r['got'] == [1, 0] and r['fv'] == 1 and r['xg'] == 0, '옛 저장 바로잡기')
        r = await page.evaluate(f"""(async()=>{{ {AD} const F={F}, S=F.S; S.adx=null; F.adxDay(); const e0=S.ess, m5=S.tk.m5, m30=S.tk.m30, out=[];
          for(let i=0;i<7;i++) out.push(F.adStamp().length); return {{out, n:S.adx.n, got:S.adx.got, ess:S.ess-e0, m5:S.tk.m5-m5, m30:S.tk.m30-m30}}; }})()""")
        print('도장', r); ok(r['out'] == [0, 0, 1, 0, 0, 1, 0] and r['n'] == 6 and r['got'] == [1, 1] and r['ess'] == 30 and r['m5'] == 2 and r['m30'] == 1, '도장 3개와 6개 보상, 하루 6개까지')
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.adx.day='2000-01-01'; F.setTab('shop'); F.renderAdStamp(); const b=document.querySelector('#adStamp');
          return [S.adx.n, b.querySelectorAll('.ads-row i').length, b.querySelectorAll('.ads-row i.on').length, b.scrollWidth>b.clientWidth+1]; }})()""")
        print('상점 줄', r); ok(r == [0, 6, 0, False], '날이 바뀌면 새 도장 줄, 상점에 여섯 칸')
        await page.wait_for_timeout(300); await page.screenshot(path='s123_shop.png')
        # 보충수업: 숲의 정수 고르기
        r = await page.evaluate(f"""(async()=>{{ {AD} const F={F}, S=F.S; F.BOOST.adSec=1; F.setTab('school'); S.bd={{}}; const e0=S.ess, b0=S.budget, n0=S.adx.n;
          F.openBoost(); await sl(300); const pk=document.querySelector('#boostPick'); const vis=!pk.hidden, btn=pk.querySelectorAll('.ad-pk').length, dis=pk.querySelector('[data-adpk=con]').disabled;
          pk.querySelector('[data-adpk=ess]').click(); const amtHid=document.querySelector('#boostAmtBox').hidden;
          document.querySelector('#boostGo').click(); const w=await watch(); await sl(300);
          return {{vis, btn, dis, amtHid, w, ess:S.ess-e0, acorn:(S.budget-b0)/F.rate(), adn:S.ad.n, st:S.adx.n-n0}}; }})()""")
        print('보충수업', r); ok(r['vis'] and r['btn'] == 3 and r['dis'] and r['amtHid'] and r['w'], '고르기 세 개, 공사가 없으면 공사 단축 흐림')
        ok(r['ess'] == 10 and r['acorn'] < 60 and r['adn'] == 1 and r['st'] == 1, '정수 +10, 도토리는 안 받음, 보충수업 1번, 광고 도장 1개')
        # 자리 비운 동안: 공사 30분 단축 고르기
        r = await page.evaluate(f"""(async()=>{{ {AD} const F={F}, S=F.S; const now=Date.now(); S.bd={{library:{{s:now, e:now+3600e3, L:(S.f.library||0)+1}}}};
          const L0=F.conLeft('library'); S.pending=F.rate()*1e5; S.pendingSec=7200; const b0=S.budget; F.rt4.adPick='con'; F.showOffline(); await sl(300);
          const tx=document.querySelector('#offDouble').textContent; document.querySelector('#offDouble').click(); const w=await watch(); await sl(300);
          return {{L0, L1:F.conLeft('library'), tx, w, got:(S.budget-b0)/(F.rate()*1e5), pend:S.pending}}; }})()""")
        print('자리 비운 동안', r); ok(r['w'] and abs((r['L0'] - r['L1']) - 1800) < 30 and 0.95 <= r['got'] < 1.05 and r['pend'] == 0, '도토리 한 배와 공사 30분 단축')
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=2; S.pending=100; S.pendingSec=7200; F.showOffline(); const h=document.querySelector('#offPick').hidden, t=document.querySelector('#offDouble').textContent, k=F.adPickNow(); S.tier=3; return [h, t, k]; }})()""")
        print('중학교', r); ok(r == [True, '광고 보고 +100%', 'acorn'], '중학교에서는 고르기 없음')
        await page.evaluate("document.querySelector('#offClaim').click()"); await page.wait_for_timeout(400)
        # 한 판 더: 하루 한 번, 진로 상담 한 번 더
        r = await page.evaluate(f"""(async()=>{{ {AD} const F={F}, S=F.S; S.adx.cs=0; const m0=F.csMax(); let n=0;
          F.adxMore('cs', ()=>{{ n++; return true; }}); const w=await watch(); const m1=F.csMax(), c1=F.adxCan('cs');
          const again=F.adxMore('cs', ()=>{{ n++; return true; }}); await sl(200);
          F.adxMore('xg', ()=>false); const w2=await watch(); return {{m0, m1, w, c1, again, n, xg:S.adx.xg, adOpen:!document.querySelector('#mAd').hidden, w2}}; }})()""")
        print('한 판 더', r); ok(r['w'] and r['m1'] == r['m0'] + 1 and not r['c1'] and r['again'] is False and r['n'] == 1, '상담 한 번 더, 하루 한 번')
        ok(r['w2'] and r['xg'] == 0 and not r['adOpen'], '시작하지 못하면 그날 쓴 것으로 치지 않음')
        # 곡
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S, rt=F.rt4; S.bgm=true; const a=F.musicWant(); rt.cereOn=true; const g=F.musicWant(); rt.cereOn=false;
          rt.uniGrad=true; rt.modalOpen=document.querySelector('#mGrad'); const u=F.musicWant(); rt.modalOpen=null; rt.uniGrad=false; return [a, g, u]; }})()""")
        print('곡', r); ok(r[1] == 'grad' and r[2] == 'unigrad' and r[0] not in ('grad', 'unigrad'), '졸업식과 학위수여식 곡')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
