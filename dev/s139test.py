# 4.4.2 시험: 체험학습 기념품이 곳마다 12종이에요. 처음 세 가지가 먼저 나오고, 수업료 배수는 옛 15종 몫이 그대로예요
# 쓰는 법: python3 wrap.py && python3 s139test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import base, ctxpage
bad = []
JS = """(async()=>{const F=window.__forest,S=F.S,T=F.TRIPS,out={};
  out.n=T.map(D=>D.souv.length); out.names=new Set(T.flatMap(D=>D.souv)).size;
  const all=T.flatMap(D=>D.souv.map((_,i)=>D.id+':'+i)), old=all.filter(k=>+k.split(':')[1]<3);
  S.trip.souv=[]; out.m0=F.tripMult();
  S.trip.souv=old.slice(); out.mOld=F.tripMult();
  // 처음 세 가지를 다 가진 곳에서 돌아오면 새 기념품(4번째부터)이 나와요
  S.trip.cur='hill'; S.trip.start=Date.now()-3600e3; S.trip.end=Date.now()-1000; S.trip.kids=0; F.claimTrip(1);
  out.got=S.trip.souv.filter(k=>!old.includes(k)); out.mNew=F.tripMult();
  // 처음 세 가지가 남아 있으면 그것부터
  S.trip.souv=['creek:0']; S.trip.cur='creek'; S.trip.start=Date.now()-3600e3; S.trip.end=Date.now()-1000; F.claimTrip(1);
  out.firstOld=+S.trip.souv[1].split(':')[1]<3;
  S.trip.souv=all.slice(); out.mAll=F.tripMult();
  const g0=S.ess||0; S.trip.cur='star'; S.trip.start=Date.now()-3600e3; S.trip.end=Date.now()-1000; F.claimTrip(1); out.full=S.trip.souv.length;
  await new Promise(r=>setTimeout(r,600)); document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0; F.rt4.paused=false; F.openTrip(); await new Promise(r=>setTimeout(r,500)); const b=document.querySelector('#tripBody'); out.cards=b.querySelectorAll('.tr-souv .sv').length; const g=b.querySelector('.tr-souv'); out.over=[...g.querySelectorAll('.sv')].some(e=>e.getBoundingClientRect().right>g.getBoundingClientRect().right+1||e.scrollWidth>e.clientWidth+1);
  return out;})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w in (360, 390):
            ctx, pg, errs = await ctxpage(b, w, 800, 'light', base(tier=4))
            r = await pg.evaluate(JS); print(w, r)
            if r['n'] != [12] * 5: bad.append(f'곳마다 12종이 아니에요: {r["n"]}')
            if r['names'] != 60: bad.append(f'이름이 겹쳐요: {r["names"]}')
            if abs(r['m0'] - 1) > 1e-9 or abs(r['mOld'] - 1.8) > 1e-9: bad.append(f'옛 15종 배수가 달라졌어요: {r["m0"]}, {r["mOld"]}')
            if len(r['got']) != 1 or int(r['got'][0].split(':')[1]) < 3 or abs(r['mNew'] - 1.81) > 1e-9: bad.append(f'새 기념품이 이상해요: {r["got"]}, {r["mNew"]}')
            if not r['firstOld']: bad.append('처음 세 가지보다 새 기념품이 먼저 나왔어요')
            if abs(r['mAll'] - 2.5) > 1e-9: bad.append(f'60종 배수가 2.5가 아니에요: {r["mAll"]}')
            if r['full'] != 60: bad.append('다 모은 뒤 기념품 수가 바뀌었어요')
            if r['cards'] != 60 or r['over']: bad.append(f'모음 화면: {r["cards"]}칸, 넘침 {r["over"]}')
            if errs: bad.append(f'{w} 오류 {errs[:2]}')
            await pg.evaluate("document.querySelector('.tr-souv .sv-h').scrollIntoView()")
            await pg.screenshot(path=f'/tmp/shot/souv_{w}.png'); await ctx.close()
    print('\n'.join(bad) if bad else 'PASS')
asyncio.run(main())
