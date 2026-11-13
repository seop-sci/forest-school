# 128번 시험(4.3.0): 숲속 탐험대
# 1) 새 학교와 옛 저장(탐험 칸 없음)이 모두 탐험대를 받아요  2) 겨루기 셈이 층마다 유한하고, 대원을 키우면 더 깊이 가요
# 3) 층 통과 보상, 자리 비운 보고서(12시간까지), 2배속 광고(하루 3번)  4) 탭(가운데 탐험)과 위쪽 졸업 단추, 360px과 390px 밝은 화면과 어두운 화면
# 5) 랭킹 '탐험' 보기와 서버 규칙에 맞춘 층 올리기 폭
import asyncio, json, pathlib
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
OUT = pathlib.Path(__file__).resolve().parent / 'shots'
AD = """const sl=ms=>new Promise(r=>setTimeout(r,ms)); const watch=async()=>{ for(let i=0;i<60;i++){ await sl(100); const d=document.querySelector('#adDone'); if(!document.querySelector('#mAd').hidden && !d.hidden){ d.click(); await sl(400); return true; } } return false; };"""
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    OUT.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 옛 저장: tam 칸이 없어요
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=0, tg=0))
        r = await page.evaluate(f"(()=>{{ const S={F}.S; return {{ has: !!S.tam, best: S.tam.best, party: S.tam.party, wk: S.tam.wk, mat: S.tam.mat, sg: S.tam.sg.length }}; }})()")
        print('옛 저장', r)
        ok(r['has'] and r['best'] == 0 and len(r['party']) >= 1 and r['mat'] == [0, 0, 0, 0] and r['sg'] == 5, '옛 저장도 탐험대 칸과 칸 장비 다섯 자리를 받아요')
        # 겨루기 셈: 1층부터 몇 층까지 이기는지, 레벨을 올리면 더 깊이
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; const deep=()=>{{ let lo=1, hi=400; while(lo<hi){{ const m=(lo+hi+1)>>1; if(F.tamSim(m, F.tamTeam(), 3).win) lo=m; else hi=m-1; }} return lo; }};
          const d1=deep(); const t1=F.tamSim(1, F.tamTeam(), 3);
          S.tam.party.forEach(sp=>{{ S.tam.mem[sp]=Object.assign(S.tam.mem[sp]||{{}}, {{lv: 20, st: 0, sh: 0}}); }}); const d20=deep();
          const st=F.tamTeam().map(m=>[m.hp, m.atk]).flat(); return {{ d1, d20, t1, fin: st.every(Number.isFinite), pow: F.tamPow() }}; }})()""")
        print('겨루기', r)
        ok(r['t1']['win'] and 2 <= r['t1']['t'] <= 30, '1층은 짧게 이겨요')
        ok(5 <= r['d1'] <= 60, f"처음 대원으로 갈 수 있는 층이 알맞아요 {r['d1']}")
        ok(r['d20'] > r['d1'], '레벨을 올리면 더 깊이 가요')
        ok(r['fin'] and r['pow'] > 0, '능력치가 모두 유한해요')
        # 층 통과 보상
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; const b0=S.budget, g0=S.gold, m0=S.tam.mat.slice();
          for (let f=1; f<=100; f++) F.tamWin(f);
          return {{ best: S.tam.best, wk: S.tam.wk.best, da: S.budget-b0, dg: S.gold-g0, mat: S.tam.mat, m0 }}; }})()""")
        print('보상', r)
        ok(r['best'] == 100 and r['wk'] == 100, '가장 깊은 층과 이번 주 기록')
        ok(r['dg'] == 1, '100층에서 황금 도토리 1개')
        ok(0 < r['da'] < 1e15 and all(0 < v < 1e6 for v in r['mat']), '도토리와 재료가 유한하고 알맞아요')
        # 자리 비운 보고서: 12시간까지만
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tam.it = Date.now() - 30*3600e3; const a=F.tamIdle(); S.tam.it = Date.now() - 3600e3; const h=F.tamIdle();
          const m0=S.tam.mat.slice(); const c=F.tamCollect(1); return {{ a: a.sec, h: h.sec, hm: h.mat, got: S.tam.mat.map((v,i)=>v-m0[i]), c: !!c, fin: [...a.mat, a.acorn].every(Number.isFinite) }}; }})()""")
        print('보고서', r)
        ok(r['a'] == 12 * 3600, '보고서는 12시간까지 쌓여요'); ok(r['c'] and r['got'] == r['hm'], '받은 만큼 재료가 늘어요'); ok(r['fin'], '보고서 값이 유한해요')
        # 2배속 광고: 하루 3번
        r = await page.evaluate(f"""(async()=>{{ {AD} const F={F}, S=F.S; const out=[];
          for (let i=0;i<4;i++){{ F.tamAdSpd(); out.push(await watch()); }}
          return {{ out, n: S.tam.ad.spd, fl: S.tam.spd.fl, until: S.tam.spd.until - Date.now() }}; }})()""")
        print('2배속', r)
        ok(r['out'] == [True, True, True, False] and r['n'] == 3, '2배속 광고는 하루 세 번')
        ok(r['fl'] == 10 and 19 * 60000 < r['until'] <= 20 * 60000 + 1000, '다음 10층, 20분')
        # 4.3.0 둘째 판: 한 층의 흐름, 사건, 자동 편성, 강화 추천
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.setTab('tam'); await sl(200);
          const T=F.rt4.tam; F.tamPh(T,'walk'); const seen=new Set(); for(let i=0;i<60;i++){{ seen.add(T.ph); await sl(150); if(T.ph==='climb') break; }}
          T.F={{fl:S.tam.best,hard:false,ev:[],P:[],M:[]}}; T.ev={{k:'fork',ic:'ex_flag',t:'x',o:['큰길로 가기','숲길로 가기'],fl:3}}; F.tamPh(T,'event'); await sl(200);
          const card=!document.querySelector('#tmEv').hidden; document.querySelector('[data-tev="1"]').click(); await sl(100);
          const mod=T.mod, ph=T.ph, auto=F.tamAutoTeam(), rec=F.tamUpRec();
          return {{ seen:[...seen], card, mod, ph, auto, rec: !!rec.mem, tabs:[...document.querySelectorAll('#tmSeg [data-tseg]')].map(b=>b.dataset.tseg) }}; }})()""")
        print('흐름', r)
        ok({'walk', 'meet', 'fight'} <= set(r['seen']), '걷기, 만남, 겨루기 차례')
        ok(r['card'] and r['mod'] == {'hard': 1} and r['ph'] == 'climb', '갈림길에서 숲길을 고르면 다음 층이 어려워요')
        ok(len(r['auto']) >= 3 and r['rec'] and r['tabs'] == ['mem', 'gear', 'mat'], '자동 편성과 강화 추천, 대원 장비 재료 탭')
        # 곡: 탐험 화면이면 지역에 맞는 곡, 큰 장난꾸러기 층이면 보스 곡
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); S.bgm=true; F.setTab('tam'); await sl(100); const T=F.rt4.tam;
          const out=[]; for (const b of [0, 60, 160, 260]) {{ S.tam.best=b; F.tamPh(T,'walk'); out.push(F.musicWant()); }}
          S.tam.best=9; F.tamPh(T,'meet'); out.push(F.musicWant()); S.tam.best=100; F.tamPh(T,'walk'); return out; }})()""")
        print('곡', r); ok(r == ['exday', 'exday', 'excalm', 'exnight', 'exboss'], '탐험 곡 고르기')
        # 랭킹: 서버 규칙 폭에 맞춰 올려요
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S, R=F.Rank; S.tam.wk.best=500;
          R.stf=0; R.stfW=null; R.stfAt=0; R.lastPerf=null; S.rank.by=''; S.rank.sent=-1; const first=F.tamRankDoc();
          R.uid='me'; S.rank.by='me'; R.lastPerf=performance.now()-12000; R.stf=100; R.stfW=S.lg.week; R.stfAt=1; const later=F.tamRankDoc();
          R.lastPerf=performance.now()-2000; const soon=F.tamRankDoc();
          return {{ first, later, soon, week: S.lg.week, tf: F.tamTf() }}; }})()""")
        print('랭킹 폭', r)
        w = r['week']
        ok(r['first'] == {'tf': 10, 'tq': w * 1000000 + 10}, '처음은 10층까지')
        ok(r['later']['tf'] == 113 and r['later']['tq'] == w * 1000000 + 113, '12초 뒤에는 지난 층 + 13')
        ok(r['soon']['tf'] == 100, '2초 만에는 그대로')
        ok(r['tf'] == 500, '이번 주 가장 깊은 층')
        await page.evaluate(f"(()=>{{ const F={F}; F.Rank.stf=0; F.Rank.stfW=null; F.Rank.stfAt=0; F.Rank.lastPerf=null; F.Rank.uid=null; }})()")
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await ctx.close()
        # 화면: 탭 가운데 탐험, 위쪽 졸업 단추
        for w, scheme in [(360, 'light'), (390, 'dark'), (360, 'dark'), (390, 'light')]:
            ctx, page, errs = await ctxpage(b, w, 780, scheme, base(tier=1, tg=1))
            r = await page.evaluate(f"""(async()=>{{ const F={F}, sl=ms=>new Promise(r=>setTimeout(r,ms));
              const tabs=[...document.querySelectorAll('.tabs .tab, nav .tab')].filter(t=>t.offsetParent && !t.classList.contains('xgrad')).map(t=>t.dataset.tab);
              const g=document.querySelector('.xgrad'), gr=g.getBoundingClientRect(), top=document.querySelector('.board-top').getBoundingClientRect();
              g.click(); await sl(300); const onGrad=!document.querySelector('#panelGrad').hidden;
              document.querySelector('[data-tab=tam]').click(); await sl(1500); const onTam=!document.querySelector('#panelTam').hidden;
              const over=[...document.querySelectorAll('#panelTam *')].filter(e=>e.offsetParent && !e.closest('.tm-bgs, .tm-fxl') && e.getBoundingClientRect().right > innerWidth + 1).map(e=>e.id||e.className).slice(0,5);
              const fl=document.querySelector('#tmFl').textContent;
              return {{ tabs, gIn: gr.top >= top.top - 2 && gr.bottom <= top.bottom + 30 && gr.width > 20, onGrad, onTam, over, fl, sw: document.documentElement.scrollWidth }}; }})()""")
            print(w, scheme, r)
            ok(r['tabs'][2:3] == ['tam'] and len(r['tabs']) == 5, f'{w} {scheme} 탭 다섯 개, 가운데 탐험 {r["tabs"]}')
            ok(r['gIn'] and r['onGrad'], f'{w} {scheme} 위쪽 졸업 단추')
            ok(r['onTam'] and not r['over'] and r['sw'] <= w, f'{w} {scheme} 탐험 화면이 넘치지 않아요 {r["over"]}')
            await page.screenshot(path=str(OUT / f's128_{w}_{scheme}.png'))
            # 랭킹 탐험 보기
            r = await page.evaluate(f"""(async()=>{{ const sl=ms=>new Promise(r=>setTimeout(r,ms)); {F}.setTab('rank'); await sl(300);
              const v=document.querySelector('#rankView [data-rv=tam]'); v.click(); await sl(200);
              const seg=document.querySelector('#rankView'); return {{ lab: document.querySelector('#rankScoreLab').textContent, sc: document.querySelector('#rankScore').textContent,
              wrap: seg.scrollWidth <= seg.clientWidth + 1, h: [...seg.children].map(c=>c.getBoundingClientRect().top).every((t,i,a)=>Math.abs(t-a[0])<2) }}; }})()""")
            print(' 랭킹', r)
            ok(r['lab'] == '이번 주 가장 높은 층' and r['sc'].endswith('층'), f'{w} 랭킹 탐험 보기')
            ok(r['wrap'] and r['h'], f'{w} 랭킹 보기 단추가 한 줄에 들어가요')
            if w == 360 and scheme == 'light': await page.screenshot(path=str(OUT / 's128_rank.png'))
            ok(not errs, f'{w} {scheme} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == '__main__': asyncio.run(main())
