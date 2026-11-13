# 129번 시험(4.2.1): 지섭 제보 고침
# 1) 운동회 트랙이 학교급마다 운동장 그림의 달리기 길 위에 있어요(초, 중, 고)
# 2) 시간만 오래 걸리던 퀘스트: 체험학습 1번, 운동회 1번, 기념품 3종과 5종, 자율학습 2번
# 3) 도감 업적 '모두 받기': 받을 업적이 둘 이상이면 보이고, 한 번에 모두 받아요
# 4) 숲속 대결: 가장 좋게 고르고 응원을 채우면 리그마다 이기는 판이 알맞게 많아요
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
        ctx, page, errs = await ctxpage(b, 390, 844, 'light', base(tier=2, tg=1))
        # 1) 운동회 트랙: 운동장 그림(400칸)의 달리기 길 가운데(48%, 52%) 근처, 반지름은 그림 너비의 30~40%, 15~20%
        r = await page.evaluate(f"""(()=>{{ const F={F}; return [1,2,3].map(t=>{{ const G=F.GEO[t], im=G.b.playground, sc=+(/scale\\(1 ([\\d.]+)\\)/.exec(im[3])||[0,1])[1], py=+(/translate\\(([\\d.]+) ([\\d.]+)\\)/.exec(im[3])||[0,0,0])[2];
          const cx=im[0], cy=py+(im[1]+0.02*im[2]-py)*sc, [sx,sy,rx,ry]=G.sports; return {{t, dx: sx-cx, dy: sy-cy, rx: rx/im[2], ry: ry/im[2]/sc}}; }}); }})()""")
        for x in r:
            print('운동회 트랙', x)
            ok(abs(x['dx']) < 9 and abs(x['dy']) < 9 and 0.3 <= x['rx'] <= 0.4 and 0.13 <= x['ry'] <= 0.2, f"{x['t']} 운동회 트랙이 운동장 위에 있어요")
        # 2) 퀘스트
        r = await page.evaluate(f"(()=>{{ const M={F}.MAIN; return Object.fromEntries(['e27','j18','e31','e36','hs26'].map(id=>{{ const q=M.find(q=>q.id===id); return [id, [q.n, q.title]]; }})); }})()")
        print('퀘스트', r)
        ok(r == {'e27': [1, '체험학습 다녀오기'], 'j18': [1, '숲속 운동회 열기'], 'e31': [3, '기념품 3종 모으기'], 'e36': [5, '기념품 5종 모으기'], 'hs26': [2, '자율학습 두 번 준비']}, '시간 허들 퀘스트 낮춤')
        # 3) 업적 모두 받기
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.setTab('dex'); await sl(200); document.querySelector('[data-dseg=ach]').click(); await sl(300);
          const ids=F.ACH.slice(0,3).map(a=>a.id); ids.forEach(id=>{{ S.ach.hit[id]=2; S.ach.got[id]=0; }}); F.ACH.slice(3).forEach(a=>{{ S.ach.hit[a.id]=S.ach.got[a.id]||0; }});
          window.__forest.renderDex && 0; document.querySelector('[data-dseg=ach]').click(); await sl(300);
          const btn=document.querySelector('#achAll'), shown=!btn.hidden, txt=btn.textContent, top=btn.getBoundingClientRect().top < document.querySelector('#achList').getBoundingClientRect().top;
          const g0=S.gold; btn.click(); await sl(400); const got=ids.map(id=>S.ach.got[id]);
          document.querySelectorAll('.modal:not([hidden]) [data-close], #rwOk').forEach(x=>{{ try{{x.click()}}catch(e){{}} }}); await sl(300);
          return {{shown, txt, top, dg: S.gold-g0, got, after: !document.querySelector('#achAll').hidden, left: F.ACH.filter(a=>S.ach.hit[a.id]>(S.ach.got[a.id]||0)).length}}; }})()""")
        print('모두 받기', r)
        ok(r['shown'] and r['txt'] == '모두 받기 (3개)' and r['top'], '받을 업적이 셋이면 맨 위에 모두 받기 (3개)')
        ok(r['got'] == [2, 2, 2] and r['dg'] > 0 and r['after'] == (r['left'] >= 2), '한 번에 모두 받고 단추가 사라져요')
        # 4) 숲속 대결 승률(가장 좋은 배치, 응원 10점)
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; const out=[];
          for (let L=0; L<6; L++){{ S.bt.lg=L; let w=0, N=3000;
            for (let n=0;n<N;n++){{ const M=F.btMake(), mine=F.btRoster(), best=F.btBest(M.evs, mine); let k=0;
              for (let i=0;i<3;i++){{ const me=mine.find(x=>x.id===best.pick[i]); const r=F.btRoll(me.st[M.evs[i]], M.opp[i].st, F.btOppCheer()); if (F.btWin(r,10)) k++; }}
              if (k>=2) w++; }}
            out.push(Math.round(w/N*100)); }}
          return out; }})()""")
        print('대결 승률', r)
        ok(r[0] >= 85 and r[2] >= 70 and r[5] >= 54 and all(r[i] >= r[i + 1] - 4 for i in range(5)) and r[5] <= 75, f'리그마다 알맞은 승률 {r}')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
