# 137번 시험(4.4.1): 탐험 화면 고침
# 1) 위 칸 도토리는 홈처럼 두 단위까지, 들썩임 없이, 칸 안에 들어가요(360, 390, 토스)
# 2) < 나가기 단추, 층 칸과 힘 칸이 겹치지 않아요, '학년이 오르면 더 가요' 글자는 흰색이 아니에요
# 3) 탐험 화면 밖에서는 마지막으로 넘은 층을 되풀이하고 층이 오르지 않아요(기본 보상은 받아요)
# 4) 빠른 스킵: 한 번 공격으로 모두 쓰러지는 층까지만, 상한을 넘지 않고, 누르면 그 층까지 넘어가요
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
        for w, h, sch, ait in [(360, 740, 'light', 0), (390, 844, 'dark', 0), (360, 740, 'light', 1)]:
            ctx, page, errs = await ctxpage(b, w, h, sch, base(tier=4, budget=4.3e14, students=61))
            await page.wait_for_timeout(900)
            r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
              if ({ait}) {{ const d=document.documentElement; d.classList.add('ait'); d.style.setProperty('--ait-top','44px'); d.style.setProperty('--ait-capw','112px'); }}
              document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true}}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
              S.budget=98765432109876543; S.tam.seen=1; S.tam.skSeen=1; S.tam.party=['bear','rabbit','fox','cat','otter']; S.tam.best=F.tamCap(); S.tam.hm=1; S.tam.hb=1188;
              F.setTab('tam'); await sl(800);
              const R=q=>document.querySelector(q).getBoundingClientRect(), n=document.querySelector('#tmAcN'), ac=R('#tmAc'), fl=R('#tmFl'), pw=R('#tmPow'), ex=R('#tmExit');
              const ov=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
              const S2=F.S; S2.tam.hm=0; F.tamRenderTop(); await sl(100); const cap=document.querySelector('.tm-cap');
              return {{ txt:n.textContent, fit:n.scrollWidth<=n.clientWidth+1, inView:ac.left>=0&&ac.right<=innerWidth, bump:/bump/.test(document.querySelector('#tmAc').className), svg:!!document.querySelector('#tmExit svg'), exIn:ex.left>=0&&ex.top>=0, flPw:ov(fl,pw), flAc:ov(fl,ac), capCol:cap?getComputedStyle(cap).color:'' }}; }})()""")
            print(w, sch, ait, json.dumps(r, ensure_ascii=False))
            ok(' ' in r['txt'] and r['fit'] and r['inView'] and not r['bump'], f'{w} {ait} 도토리 두 단위, 칸 안')
            ok(r['svg'] and r['exIn'], f'{w} < 단추')
            ok(not r['flPw'] and not r['flAc'], f'{w} {ait} 층 칸이 힘 칸, 도토리 칸과 안 겹쳐요')
            ok(r['capCol'] and r['capCol'] != 'rgb(255, 255, 255)', f'{w} 상한 글자 색 {r["capCol"]}')
            ok(not errs, f'{w} 오류 없음 {errs[:2]}')
            await ctx.close()
        ctx, page, errs = await ctxpage(b, 390, 844, 'light', base(tier=4, budget=4.3e14, students=61))
        await page.wait_for_timeout(900)
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
          document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true}}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
          S.tam.seen=1; S.tam.party=['bear','rabbit','fox','cat','otter']; S.tam.best=20; S.tam.hm=0;
          F.setTab('school'); await sl(200);
          // 화면 밖: 이긴 층이 몇이 되든 best는 그대로, 재료는 늘어요
          const T=F.rt4.tam||(F.rt4.tam={{ph:'',t:0,F:null}}); F.tamPh(T,'meet'); const repFl=T.F.fl, rep=T.F.rep;
          const m0=S.tam.mat.reduce((a,b)=>a+b,0), b0=S.tam.best; T.F.M.forEach(m=>m.hp=0); F.tamPh(T,'win'); const m1=S.tam.mat.reduce((a,b)=>a+b,0);
          const offOk = S.tam.best===b0 && m1>m0;
          // 화면에서는 층이 올라요
          F.setTab('tam'); await sl(300); F.tamPh(T,'meet'); const onFl=T.F.fl, onRep=T.F.rep; T.F.M.forEach(m=>m.hp=0); F.tamPh(T,'win'); const onUp=S.tam.best===21;
          // 빠른 스킵: 약하면 없음, 아주 세면 상한까지
          S.tam.best=20; F.TAM; const weak=F.tamSkipTo();
          for (const sp of S.tam.party) (S.tam.mem[sp]||(S.tam.mem[sp]={{lv:1,st:1,sh:0}})).lv=400; const to=F.tamSkipTo(), cap=F.tamCap();
          const one = F.tamTeam().reduce((m,p)=>Math.max(m,p.atk),0), mobOk = to ? F.tamMobs(to,false).every(m=>m.hp<=one) : true;
          F.tamRenderTop(); await sl(50); const btn=!document.querySelector('#tmSkip').hidden;
          if (to) F.tamSkipGo(); await sl(100);
          return {{ repFl, rep, offOk, onFl, onRep, onUp, weak, to, cap, mobOk, btn, best:S.tam.best }}; }})()""")
        print('되풀이와 스킵', json.dumps(r))
        ok(r['rep'] == 1 and r['repFl'] == 20 and r['offOk'], '화면 밖에서는 20층을 되풀이하고 층이 안 올라요')
        ok(r['onRep'] == 0 and r['onFl'] == 21 and r['onUp'], '화면에서는 21층에 가서 오르기')
        ok(r['weak'] == 0, '약하면 빠른 스킵 없음')
        ok(r['to'] >= 22 and r['to'] <= r['cap'] and r['mobOk'] and r['btn'] and r['best'] == r['to'], f'빠른 스킵은 상한 안에서 그 층까지 {r["to"]}')
        ok(not errs, f'오류 없음 {errs[:2]}')
        await ctx.close(); await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
