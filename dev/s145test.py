# 5.0.1 시험: 관리자 지표의 '오늘 본 광고'. 광고를 끝까지 보면 S.adx.all이 오르고, 테스트 현황(statsDoc)에 adsT, adsD가 실려요. 옛 저장은 0
# 쓰는 법: python3 wrap.py && python3 s145test.py   (마지막 줄이 PASS면 통과). 서버 규칙은 node fbtest/rules_test.js
import asyncio
from playwright.async_api import async_playwright
from s4test import base, ctxpage
bad = []
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sv = base(tier=2, students=40)
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', sv)
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate("""(async()=>{const F=window.__forest,S=F.S,sl=ms=>new Promise(r=>setTimeout(r,ms));
          document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
          const out={a0:S.adx.all, ads0:S.st.ads};
          const one=async()=>{ let got=0; F.showAd(()=>{got=1}, ()=>{}); await sl(300); F.rt4.adEarned=true; const d=document.querySelector('#adDone'); d.hidden=false; d.click(); await sl(300); return got; };
          out.g1=await one(); out.g2=await one();
          out.a2=S.adx.all; out.ads2=S.st.ads; const d=F.statsDoc(); out.adsT=d.adsT; out.adsD=d.adsD; out.day=S.adx.day;
          S.adx.day='2000-01-01'; out.oldDayT=F.statsDoc().adsT;
          const old=JSON.parse(JSON.stringify(S)); delete old.adx.all; out.san=F.sanitize(old).adx.all;
          return out;})()""")
        print(r)
        if r['a2'] - (r['a0'] or 0) != 2 or r['ads2'] - r['ads0'] != 2: bad.append(f"광고 수 {r}")
        if r['adsT'] != r['a2'] or r['adsD'] != r['day'] or len(r['adsD'] or '') != 10: bad.append(f"statsDoc {r}")
        if r['oldDayT'] != 0: bad.append('지난 날 광고 수가 오늘로 잡혀요')
        if r['san'] != 0: bad.append(f"옛 저장 {r['san']}")
        if errs: bad.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    print('FAIL' if bad else 'PASS', *bad, sep='\n')
asyncio.run(main())
