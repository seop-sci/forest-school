# 3.0.0 낮 자율학습 예약: 보상/저장/퀘스트/한국 시각 경계 회귀
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,scheme in [(390,'light'),(360,'dark')]:
            ctx,pg,errs=await ctxpage(b,w,844,scheme,base(tier=3,tg=1))
            result=await pg.evaluate('''() => {
              const F=window.__forest,S=F.S,R=F.rt,ok={};R.fakePerf=0;R.paused=false;
              const at=t=>F.setServerTime(Date.parse(t)), ms=t=>Date.parse(t);
              const clean=()=>{const d=JSON.parse(JSON.stringify(S));return F.sanitize(d)};
              S.f.dorm=1;S.ns={day:'',sub:'math',got:0,sec:0,done:true,n:0,at:0,fin:0};S.st.nsAway=0;
              at('2026-11-03T13:00:00+09:00');F.openNs();
              ok.dayButton=document.querySelector('#nsGo').textContent==='오늘 밤 예약하기';
              const xp=S.ac.st.xp;ok.reserve=F.nsStart()&&!F.nsOn()&&S.ns.day==='2026-11-03'&&S.ac.st.xp===xp;
              F.renderNs();ok.bookedUI=document.querySelector('#nsGo').textContent==='예약했어요';
              ok.twice=!F.nsStart()&&S.ns.n===1;
              const origSub=S.ns.sub;document.querySelector('#nsSubs button[data-ns="sci"]').click();ok.locked=S.ns.sub===origSub;
              const saved=clean();S.ns=saved.ns;ok.restore=S.ns.at===ms('2026-11-03T13:00:00+09:00')&&S.ns.fin===0;
              ok.noDayBonus=F.nsOverlap(ms('2026-11-03T13:00:00+09:00'),ms('2026-11-03T19:59:59+09:00'))===0;
              const quest=id=>F.MAIN.find(q=>q.id===id);
              ok.hs9=F.qMeasure(quest('hs9'))===1;
              ok.hs22Before=F.qMeasure(quest('hs22'))===0;
              F.openNs(); // 예약 화면에서 시간 경계도 확인해요
              at('2026-11-03T20:00:00+09:00');ok.autoStart=F.nsOn();
              at('2026-11-04T05:59:59+09:00');F.nsSettle(true);ok.beforeDawn=S.ac.st.xp===xp&&!S.ns.done;
              at('2026-11-04T13:00:00+09:00');S.pending=0;S.pendingSec=0;F.applyAway(86400);F.nsSettle(true);
              ok.away=Number.isFinite(S.pending)&&S.pending>0&&S.ns.sec>0&&S.ns.sec<=36000;
              const xp1=S.ac.st.xp;F.nsSettle(true);ok.resultOnce=S.ns.fin===1&&xp1>xp&&S.ac.st.xp===xp1;
              ok.hs22=F.qMeasure(quest('hs22'))>=1;
              at('2026-11-04T21:00:00+09:00');ok.noRepeat=!F.nsOn();
              // 낮 접속만으로 서로 다른 날 세 번 준비할 수 있어요
              at('2026-11-05T13:00:00+09:00');ok.second=F.nsStart();
              at('2026-11-06T13:00:00+09:00');ok.third=F.nsStart()&&S.ns.n===3&&F.qMeasure(quest('hs26'))>=3;
              // 밤중에 시작하면 시작 전으로 거슬러 보상을 주지 않아요
              at('2026-11-07T23:00:00+09:00');ok.late=F.nsStart();
              ok.noBackdate=F.nsOverlap(ms('2026-11-07T20:00:00+09:00'),ms('2026-11-08T06:00:00+09:00'))===25200;
              const keep=clean();ok.atRestore=keep.ns.at===S.ns.at&&keep.ns.fin===S.ns.fin;
              const old=JSON.parse(JSON.stringify(S));delete old.ns.at;delete old.ns.fin;
              const legacy=F.sanitize(old);ok.legacy=legacy.ns.at===0&&legacy.ns.fin===0&&legacy.ns.day===S.ns.day;
              old.ns.day='2026-02-30';ok.badDay=F.sanitize(old).ns.day==='';
              S.f.dorm=0;ok.lockedDorm=!F.nsStart();S.f.dorm=1;S.tier=2;ok.lockedTier=!F.nsStart();S.tier=3;
              at('2026-11-09T13:00:00+09:00');F.openNs();F.nsStart();F.renderNs();
              return ok;
            }''')
            assert all(result.values()), result
            await pg.wait_for_function("JSON.parse(localStorage.getItem('forest-school-v1')).ns.day==='2026-11-09'")
            # 2026-11-11: 다시 열 때 가끔 sessionStorage 표시가 안 보여 처음 저장이 다시 깔렸어요(흔들린 까닭). 방금 저장한 학교를 다시 열 때 그대로 넣어 줘요
            kept=await pg.evaluate("localStorage.getItem('forest-school-v1')")
            await ctx.add_init_script("localStorage.setItem('forest-school-v1', %s);" % json.dumps(kept))
            await pg.reload()
            await pg.wait_for_function('window.__forest && window.__forest.S && window.__forest.S.tier===3')   # 2026-11-11: 저장을 다 읽은 뒤에 읽어요. 켜는 중에는 S가 새 학교(유치원)라서, 기계가 느리면 저장을 읽기 전 값을 봐서 흔들렸어요
            restored=await pg.evaluate('''() => {
              const F=window.__forest;F.rt.fakePerf=0;F.setServerTime(Date.parse('2026-11-09T13:00:00+09:00'));
              F.openNs();return F.S.ns.day==='2026-11-09'&&F.S.ns.n===5&&F.S.ns.fin===4&&document.querySelector('#nsGo').textContent==='예약했어요';
            }''')
            assert restored, '예약을 저장하고 다시 연 뒤 유지돼야 해요'
            await pg.wait_for_timeout(350)
            assert await pg.evaluate("document.querySelector('#mNs').scrollWidth<=innerWidth+1")
            await pg.screenshot(path=f'/tmp/s105-reserved-{w}.png')
            assert not errs,errs
            print(w,scheme,json.dumps(result,ensure_ascii=False),flush=True)
            await ctx.close()
        await b.close()
    print('PASS s105',flush=True)
asyncio.run(main())
