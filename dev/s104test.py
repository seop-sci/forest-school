# 3.0.0 통합: 고등학교 자율학습 경계, 한 번 받기, 옛 저장, 휴대폰 창
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in [(390, 'light'), (360, 'dark')]:
            ctx, pg, errs = await ctxpage(b, w, 844, scheme, base(tier=3, tg=0))
            out = await pg.evaluate('''() => {
              const F=window.__forest,S=F.S,R=F.rt,out={};
              R.fakePerf=0;R.paused=false;
              const at=s=>F.setServerTime(Date.parse(s));
              S.f.dorm=1;S.ns={day:'',sub:'math',got:0,sec:0,done:false,n:0};
              at('2026-11-02T19:59:59+09:00');out.dayReserved=F.nsStart()===true&&!F.nsOn();
              at('2026-11-02T20:00:00+09:00');out.started=F.nsOn()&&F.nsStart()===false;
              out.twice=F.nsStart()===false&&S.ns.n===1;
              out.cap=F.nsExtraH()===0.5;
              out.overlap=F.nsOverlap(Date.parse('2026-11-02T19:00:00+09:00'),Date.parse('2026-11-03T07:00:00+09:00'))===36000;
              at('2026-11-03T05:59:59+09:00');out.before=F.nsOn()&&F.nightDayOf(F.gameNow())==='2026-11-02';
              const xp=S.ac.st.xp;at('2026-11-03T06:00:00+09:00');F.nsSettle(true);
              const got=S.ac.st.xp;F.nsSettle(true);out.once=S.ns.done&&got>xp&&S.ac.st.xp===got&&!F.nsOn();
              const old=JSON.parse(JSON.stringify(S));delete old.ns;const clean=F.sanitize(old);
              out.oldSave=!!clean.ns&&!clean.ns.day&&clean.ns.n===0;
              out.quests=F.MAIN.filter(q=>/^hs[0-9]+$/.test(q.id)).length===37;
              out.geometry=F.geoIdx()===3&&F.TIERS[3].name==='고등학교'&&!!F.FAC.dorm;
              F.openNs();return out;
            }''')
            assert all(out.values()), out
            await pg.wait_for_timeout(400)
            overflow = await pg.evaluate('''() => {const e=document.querySelector('#mNs');return e.scrollWidth>innerWidth+1;}''')
            assert not overflow, f'{w} 자율학습 창 넘침'
            await pg.screenshot(path=f'/tmp/s104-night-{w}.png')
            assert not errs, errs
            print(w, scheme, json.dumps(out,ensure_ascii=False), flush=True)
            await ctx.close()
        await b.close()
    print('PASS s104',flush=True)
asyncio.run(main())
