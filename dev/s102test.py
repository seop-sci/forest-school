# 3.0.0: 재화 개편과 야간 저장, 미니게임 판 회귀
import asyncio
from playwright.async_api import async_playwright
from s4test import ctxpage, base

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base())
        r = await pg.evaluate('''() => {
          const F=window.__forest, S=F.S, d=JSON.parse(JSON.stringify(S)), out={};
          d.ns={day:'2026-11-02',sub:'math',got:12345,sec:3600,done:false,n:7};
          const n=F.sanitize(d).ns; out.night=[n.day,n.sub,n.got,n.sec,n.done,n.n];
          d.vd={lv:3,p:.2,lk:{day:'2026-11-02',lv:3,need:2e19}}; out.donation=F.sanitize(d).vd.lk.need;
          const bad=F.sanitize({...d,ns:{got:Infinity,sec:-5,n:Infinity}}).ns;
          out.nightBad=[bad.got,bad.sec,bad.n];
          S.tier=2; S.tk.m5=3; S.tk.m30=1; const now=F.gameNow();
          S.rd.cur='acorn'; S.rd.at=now; S.rd.m=0; const before=S.rd.st;
          F.readUseTicket('m30'); out.read=[S.rd.cur,S.rd.st-before,S.tk.m30];
          F.rt.pcSel=[]; F.rt.pcLunch=false; S.pc.at=F.gameNow(); S.pc.kids=[]; S.pc.lunch=false;
          const left0=F.pcRemain(); F.picnicUseTicket('m5'); out.picnic=[Math.round((left0-F.pcRemain())/60000),S.tk.m5];
          S.trip.cur=F.TRIPS[0].id; S.trip.start=F.gameNow(); S.trip.end=S.trip.start+3600000;
          const t0=S.trip.end; F.tripUseTicket('m5'); out.trip=[Math.round((t0-S.trip.end)/60000),S.tk.m5];
          S.mg.pieces=5; const item=F.DECO.find(x=>!x.rare&&!x.ev&&!F.decoSoldOut(x.id));
          F.rt.decoPick=item.id;const owned=S.deco.own[item.id]||0;F.buyDecoPieces();
          out.deco=[S.mg.pieces,(S.deco.own[item.id]||0)-owned];
          F.goldDay();S.gd.n=0;const gold=S.gold;for(let i=0;i<5;i++)F.adGold();out.ad=[S.gd.n,S.gold-gold];
          S.tier=2; S.mg.e=0; S.mg.eAt=F.gameNow(); S.tk.m5=0; S.st.ups=15;
          S.dm={day:F.gameToday(),list:[0,1,2].map(()=>({id:'ups',b:0,done:false})),bonus:false};
          const beforeGold=S.gold; for(let i=0;i<3;i++) F.claimMission(i); F.claimBonus(); F.claimBonus();
          out.daily=[S.gold-beforeGold,S.mg.e,S.tk.m5,S.dm.bonus];
          S.tier=2; S.f.store=1; S.sn.n=0; S.sn.got={}; S.q.m=F.MAIN.findIndex(q=>q.id==='sn1'); S.q.lat=''; out.saving=F.recommend()===null;
          S.tier=3; F.renderGradPanel(true); out.nextSchool=document.querySelector('#tierTo').textContent;
          return out;
        }''')
        print('재화와 저장:',r,flush=True)
        assert r['night']==['2026-11-02','math',12345,3600,False,7], '야간 저장 복구'
        assert r['nightBad']==[0,0,0], '잘못된 야간 저장'
        assert r['donation']==2e19, '큰 기부 목표 저장'
        assert r['read']==['',1,0], '책 읽기 단축권'
        assert r['picnic']==[5,2], '소풍 단축권'
        assert r['trip']==[5,1], '체험학습 단축권'
        assert r['deco']==[0,1], '합치기 조각 교환'
        assert r['ad']==[3,3], '광고 황금 도토리 상한'
        assert r['daily']==[1,45,3,True], '일일 임무 보상과 중복 수령 방지'
        assert r['saving'], '간식 목표 저축 중 시설 추천'
        assert r['nextSchool']=='숲속 대학교', '고등학교 다음 학교급 안내'
        assert not errs, f'화면 오류 {errs}'
        print('PASS',flush=True)
        await ctx.close(); await b.close()
if __name__=='__main__': asyncio.run(main())
