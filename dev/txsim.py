# 탐험 원정 균형 재기: 학교급과 대원 세기마다 원정을 여러 번 떠나 큰 장난꾸러기까지 가는 비율, 멈춘 칸, 받은 재료(보고서 몇 시간치)를 재요
# 쓰는 법: cd dev && python3 wrap.py && python3 txsim.py [판 수] [rnd]
# 갈림길 고르기: 체력이 55%보다 적으면 가장 많이 채우는 카드, 아니면 힘, 응원, 큰 장난꾸러기 재료 순(사람이 고를 만한 쉬운 규칙)
import asyncio, sys
from playwright.async_api import async_playwright
from testlib import base, ctxpage, F
N = int(sys.argv[1]) if len(sys.argv) > 1 else 200
RND = 'rnd' in sys.argv   # 갈림길을 아무렇게나 고르면
JS = """(c)=>{ const F=window.__forest, S=F.S, T=F.TEX, out=[];
  S.tam.party=c.party; for (const sp of c.party) S.tam.mem[sp]={lv:c.lv,st:c.st,sh:0};
  S.tam.sg=[0,1,2,3,4].map(()=>({tool:c.g,bag:c.g,hat:c.g}));
  const team=F.tamTeam(); let lo=1, hi=5000; while (lo<hi) { const m=Math.ceil((lo+hi)/2); if (F.tamSim(m,team,7).win) lo=m; else hi=m-1; }
  S.tam.best=lo; S.tam.it=F.gameNow();
  const rep=F.tamIdle(); const per=(S.tam.best? (0.3+S.tam.best/200):0.3);
  let win=0, at=0, mat=0, hp=0;
  for (let k=0;k<c.n;k++) {
    S.tam.xp.d=''; S.tam.xp.run=null; F.txStart(0); const run=S.tam.xp.run;
    let g=0; while (!run.end && g++<40) {
      if (T.plan[run.at]==='fork' && run.pk[run.at]<0) {
        const cs=run.evs[run.at].map(i=>T.ev[i]); let j=0;
        const sc=E=> run.hp<550 ? (E.hp||0)*10+(E.mx||0)*3 : (E.atk||0)*10+(E.ch||0)*2+(E.boss||0)*2+(E.mx||0)*5+(E.hp||0)*(run.hp<800?3:0)+(E.pk||0)+(E.box?0.5:0);
        if (c.rnd) j=Math.floor(Math.random()*3); else cs.forEach((E,i)=>{ if (sc(E)>sc(cs[j])) j=i; }); F.txPick(j);
      } else F.txStep();
    }
    if (run.end>0) win++; at+=run.at; hp+=run.hp; mat+=run.got.m.reduce((a,b)=>a+b,0);
  }
  const pack60=60*per*(1+0.25*2)+2*(1+S.tam.best/100);
  return {...c, best:S.tam.best, fe:F.txRef().fe, fb:F.txRef().fb, win:win/c.n, at:at/c.n, matH:(mat/c.n)/pack60};
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        P3, P5 = ['bear', 'rabbit', 'fox'], ['bear', 'rabbit', 'fox', 'cat', 'chick']
        rows = []
        for tier, cfgs in [(0, [dict(party=P3, lv=lv, g=g, st=1) for lv, g in [(15, 3), (30, 8), (45, 12)]]),
                           (1, [dict(party=P5[:4], lv=lv, g=g, st=st) for lv, g, st in [(50, 15, 2), (70, 25, 3)]]),
                           (2, [dict(party=P5, lv=lv, g=g, st=st) for lv, g, st in [(260, 40, 4)]]),
                           (4, [dict(party=P5, lv=lv, g=g, st=st) for lv, g, st in [(560, 60, 5)]])]:
            ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=tier, tg=1))
            await pg.wait_for_timeout(800)
            for c in cfgs:
                c['n'] = N; c['tier'] = tier; c['rnd'] = RND
                rows.append(await pg.evaluate(JS, c))
            if errs: print('errs', errs[:3])
            await ctx.close()
        print('학교급 | 대원 | 레벨 | 장비 | 별 | 최고층 | 기준 층/큰 층 | 큰 장난꾸러기까지 | 평균 멈춘 칸(11이 끝) | 재료(보고서 몇 시간치)')
        for x in rows: print(f"{x['tier']} | {len(x['party'])} | {x['lv']} | {x['g']} | {x['st']} | {x['best']} | {x['fe']}/{x['fb']} | {x['win']*100:.0f}% | {x['at']:.1f} | {x['matH']:.2f}")
        await b.close()
asyncio.run(main())
