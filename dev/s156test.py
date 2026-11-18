# 5.0.1.3 시험(5.0.2.1 두 채씩 조각): 대학원 학기마다 목표 퀘스트(캠퍼스 건물 facAll, 박사 세미나 문). 목표가 그 학기 상한을 넘지 않는지, 문 퀘스트가 세미나를 막고 여는지,
# 옛 저장(퀘스트 id로 이어 감)이 제자리를 찾는지, 길잡이와 교감 선생님 지원 셈이 도는지, 대학원 공사비 4배
# 쓰는 법: python3 wrap.py && python3 s156test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker
c = Checker()
F35 = {k: 35 for k in ('classroom', 'cafeteria', 'library', 'playground', 'science', 'store', 'dorm', 'union')}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        f = dict(F35); f.update(institute=10, gradhall=5)
        q = {'init': True, 'mid': 'gr10', 'm': 0, 'mb': 0, 'subs': [], 'done': [], 'gen': 0, 'subDone': 5, 'seen': 0}
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=5, tg=2, sem=0, f=f, q=q, students=110, budget=1e40, t={'squirrel': 40, 'owl': 40, 'bear': 5}))
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate("""()=>{const F=window.__forest,S=F.S,M=F.MAIN,out={};
          // 1. 대학원 퀘스트를 차례로 걸으며 상한과 견줘요
          let tg=0,sem=0,bad=[],n=0,prev=33,pc=0; const ids=[];
          for(const q of M){ if(q.ch<24||q.id==='un42')continue; ids.push(q.id);
            if(q.t==='facAll'&&q.ks){ if(q.n!==prev+1)bad.push('조각 '+q.id+' n'+q.n); pc++; continue; }
            if(q.t==='facAll'){n++; const cap=40+5*tg+(sem?2:0); if(q.n>cap||q.n!==prev+1)bad.push(q.id+' n'+q.n+' cap'+cap); prev=q.n;}
            if(q.t==='semH'){ if(q.n!==tg+1||q.sy!==tg+1)bad.push('문 '+q.id); sem=1;}
            if(q.t==='tgrads'){ if(q.n!==tg+1||q.ye!==tg+1)bad.push('문 '+q.id); tg++; sem=0;} }
          out.bad=bad; out.n=n; out.pc=pc; out.tg=tg; out.last=prev;
          out.gates=['gsem3','gyr3','gsem4','gsem5','gyr5','gsem6'].map(id=>M.findIndex(q=>q.id===id)>=0);
          // 2. 옛 저장: gr10에 있던 사람(박사 1학기)은 그대로 gr10
          out.cur=F.curMain().id; S.f.gradhall=5; out.tgNow=S.tg;
          // 3. 문: 박사 1학기 세미나는 gsem3까지 와야 열려요
          out.locked=!F.canGraduate();
          const gi=M.findIndex(q=>q.id==='gsem3'); S.q.m=gi; S.q.mb=0; S.q.lat=''; S.grade=4;
          out.open=F.canGraduate();
          // 4. facAll 재기와 길잡이
          const fi=M.findIndex(q=>q.id==='gc47'); S.q.m=fi; const fq=M[fi];
          out.meas=F.qMeasure(fq); S.f.science=30; out.meas2=F.qMeasure(fq);
          const pk=F.questPick(fq); out.pick=pk&&pk.k;
          const ca=M.find(q=>q.id==='gc47c'); S.f.dorm=47; out.pm=F.qMeasure(ca); const pk2=F.questPick(ca); out.pick2=pk2&&pk2.k; out.g2=F.qGoal(ca);
          out.order=M.map(q=>q.id).filter(id=>/^gc3[4-7]/.test(id)).join(',');
          out.need=F.needCost(fq); out.goal=F.qGoal?F.qGoal(fq):'';
          // 5. 공사비 4배
          out.cs=F.costScale(); out.is=F.incomeScale?F.incomeScale():0;
          return out;}""")
        print(r)
        c.ok(not r['bad'], f"목표가 상한을 넘거나 차례가 틀려요 {r['bad']}")
        c.ok(r['n'] == 33 and r['pc'] == 93 and r['last'] == 66 and r['tg'] == 6, f"퀘스트 수 {r['n']}, 조각 {r['pc']}, 끝 Lv.{r['last']}, 해 {r['tg']}")
        c.ok(all(r['gates']), '세미나 문 퀘스트가 없어요')
        c.ok(r['cur'] == 'gr10', f"옛 저장이 {r['cur']}로 갔어요")
        c.ok(r['locked'] and r['open'], f"세미나 문: 막힘 {r['locked']}, 열림 {r['open']}")
        c.ok(r['meas'] == 35 and r['meas2'] == 30 and r['pick'] in F35, f"facAll {r['meas']} {r['meas2']} 길잡이 {r['pick']}")
        c.ok(r['pm'] == 35 and r['pick2'] == 'store' and r['g2'] == '매점과 기숙사 Lv.47', f"조각 재기 {r['pm']} {r['pick2']} {r['g2']}")
        c.ok(r['order'] == 'gc34,gc35,gc36a,gc36b,gc36c,gc36,gc37a,gc37b,gc37c,gc37', f"차례 {r['order']}")
        c.ok(r['need'] >= 0 and r['need'] < 1e60, f"지원 셈 {r['need']}")
        c.ok(r['cs'] == 2.4e17, f"공사비 배수 {r['cs']}")
        c.ok(not errs, f'오류 {errs[:2]}')
        await ctx.close()
asyncio.run(main())
c.done()
