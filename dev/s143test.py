# 5.0.0 시험: 펠리컨 지도교수님(XT.adv). 연구소를 지으면 오시고, 연수 한 레벨에 연구 트리 연구 시간 -3%. 메인 퀘스트 gr16, 도감, 옛 저장
# 쓰는 법: python3 wrap.py && python3 s143test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import base, ctxpage
bad = []
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, mode in ((360, 'light'), (390, 'dark')):
            sv = base(tier=5, students=90)
            sv['f'] = {'classroom': 35, 'cafeteria': 35, 'library': 35, 'playground': 35, 'science': 35, 'store': 35, 'dorm': 35, 'union': 35, 'institute': 0}
            ctx, pg, errs = await ctxpage(b, w, 800, mode, sv)
            await pg.wait_for_timeout(1200)
            r = await pg.evaluate("""(async()=>{const F=window.__forest,S=F.S,sl=ms=>new Promise(r=>setTimeout(r,ms));
              document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
              const out={}; out.away=!F.xtAct('adv');
              S.f.institute=1; S.budget=1e40; S.ess=5000;
              out.lv=[]; for(let i=0;i<10;i++){F.xtAct('adv'); out.lv.push(F.xtLv('adv'));} out.max=F.xtAct('adv');
              S.rt5={lv:{},cur:null}; const t0=Date.now(); F.rtStart('class'); out.sec=Math.round((S.rt5.cur.end-t0)/1000);
              F.setTab('teachers'); await sl(500); const c=document.querySelector('.tcard[data-k="adv"]');
              out.card=c?c.textContent.replace(/\\s+/g,' ').slice(0,120):null; out.cardW=c?c.getBoundingClientRect().width:0; out.vw=innerWidth;
              const i10=F.MAIN.findIndex(q=>q.id==='gr10'), i16=F.MAIN.findIndex(q=>q.id==='gr16'); out.qpos=i16>i10&&i16<F.MAIN.findIndex(q=>q.id==='gr11'); out.qtype=F.MAIN[i16]&&F.MAIN[i16].t;
              S.q.m=i16; out.qMeasure=F.qMeasure(F.MAIN[i16]);
              out.dex=F.DEX_KEYS.includes('tea_pelican');
              const old=JSON.parse(JSON.stringify(S)); delete old.xt.adv; old.q.m=F.MAIN.findIndex(q=>q.id==='gr11'); old.q.mid='gr11';
              const s2=F.sanitize(old); out.oldAdv=s2.xt.adv; out.oldQ=F.MAIN[s2.q.m]&&F.MAIN[s2.q.m].id;
              return out;})()""")
            print(w, mode, r)
            if not r['away']: bad.append('연구소 전에 연수가 돼요')
            if r['lv'] != list(range(1, 11)) or r['max']: bad.append(f"연수 레벨 {r['lv']} {r['max']}")
            if r['sec'] != round(3600 * 0.7): bad.append(f"연구 시간 {r['sec']}초 (바라는 것 2520)")
            if not r['card'] or '펠리컨' not in r['card'] or r['cardW'] > r['vw']: bad.append(f"교직원 카드 {r['card']} {r['cardW']}")
            if not r['qpos'] or r['qtype'] != 'xt' or r['qMeasure'] != 10: bad.append(f"퀘스트 {r['qpos']} {r['qtype']} {r['qMeasure']}")
            if not r['dex']: bad.append('도감에 없음')
            if r['oldAdv'] != 0 or r['oldQ'] != 'gr11': bad.append(f"옛 저장 {r['oldAdv']} {r['oldQ']}")
            if w == 390: await pg.screenshot(path='/tmp/s143.png', full_page=False)
            if errs: bad.append(f'페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('FAIL' if bad else 'PASS', *bad, sep='\n')
asyncio.run(main())
