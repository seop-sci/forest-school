import asyncio, sys, base64, os, json, time
sys.path.insert(0,'/home/claude/promo'); sys.path.insert(0,'/home/claude/forest-school/dev')
from cap import page_for, CLEAN
from scenes import tam_setup, rich, FOLD, HIDE
from playwright.async_api import async_playwright
VD='/home/claude/promo/vid/'; SLOW=8
WARP="""(S=>{ if(window.__warp) return; window.__warp=S;
 const rn=performance.now.bind(performance), t0=rn(); performance.now=()=>t0+(rn()-t0)/S;
 const dn=Date.now, d0=dn(); Date.now=()=>d0+(dn()-d0)/S; const OD=Date;
 window.Date=class extends OD{constructor(...a){ if(a.length) super(...a); else super(Date.now()); } static now(){return d0+(dn()-d0)/S;}};
 const st=window.setTimeout, si=window.setInterval; window.setTimeout=(f,ms,...a)=>st(f,(ms||0)*S,...a); window.setInterval=(f,ms,...a)=>si(f,(ms||0)*S,...a);
 const raf=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=cb=>raf(()=>cb(performance.now()));
})(%d)"""
async def record(pg, name, secs, acts=None):
    d=VD+name+'/'; os.makedirs(d, exist_ok=True)
    for f in os.listdir(d): os.remove(d+f)
    cdp = await pg.context.new_cdp_session(pg)
    await cdp.send('Animation.enable'); await pg.evaluate(WARP % SLOW); await cdp.send('Animation.setPlaybackRate',{'playbackRate':1/SLOW})
    acts = sorted((acts or {}).items()); ts=[]; i=0; t0=time.time()
    while True:
        g=(time.time()-t0)/SLOW
        if g>secs: break
        while acts and acts[0][0] <= g: await pg.evaluate(acts.pop(0)[1])
        r=await cdp.send('Page.captureScreenshot',{'format':'jpeg','quality':92,'clip':{'x':0,'y':0,'width':390,'height':693,'scale':1080/390}})
        ts.append(g); open(f'{d}{i:05d}.jpg','wb').write(base64.b64decode(r['data'])); i+=1
    json.dump(ts, open(d+'ts.json','w')); print(name, i, 'frames', round(i/secs,1), 'fps', flush=True)
SKILL0="(()=>{const F=window.__forest,T=F.rt4.tam; if(T&&T.F) T.F.P.forEach(p=>p.g=999);})()"
SKILL1="(()=>{const b=document.querySelector('.tm-sk.ready')||document.querySelector('.tm-sk'); b&&b.click();})()"
SKILL2="(()=>{const bs=[...document.querySelectorAll('.tm-sk.ready')]; (bs[2]||bs[0])&&(bs[2]||bs[0]).click();})()"
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        async def go(name, save, setup, secs, acts=None):
            if which and name not in which: return
            ctx, pg, errs = await page_for(b, save); await pg.evaluate(FOLD)
            if setup: await setup(pg)
            await pg.evaluate(HIDE); await pg.wait_for_timeout(1200)
            await record(pg, name, secs, acts); await ctx.close()
        U=dict(tier=4, tg=3, sem=1, grade=4)
        await go('v_kinder', rich(), None, 3.0)
        async def campus(pg):
            await pg.evaluate("(async()=>{const F=window.__forest; F.uniPreview(); await new Promise(r=>setTimeout(r,1500)); F.setZone('academic');})()"); await pg.wait_for_timeout(2500); await pg.evaluate(CLEAN); await pg.evaluate(FOLD)
        await go('v_campus', rich(tier=3, tg=2, sem=1, grade=4), campus, 3.0)
        async def fight(pg): await tam_setup(pg, 116, 64)
        await go('v_fight', rich(**U), fight, 4.5, {2.0:SKILL0, 2.1:SKILL1, 3.3:SKILL0, 3.4:SKILL2})
        async def boss(pg): await tam_setup(pg, 249, 150)
        await go('v_boss', rich(**U), boss, 4.0, {2.6:SKILL0, 2.8:SKILL1})
        async def story(pg): await pg.evaluate("window.__forest.stPlay('o1', true)")
        await go('v_story', rich(tier=1, tg=0), story, 2.5, {1.6:"document.querySelector('#stNext').click()"})
        async def xmas(pg): await pg.evaluate("(()=>{const F=window.__forest; F.S.cos.th.bg='xmas'; F.applyCos();})()"); await pg.wait_for_timeout(2500)
        await go('v_xmas', rich(tier=1, tg=3, sem=1, grade=4), xmas, 2.5)
        await b.close()
if __name__=='__main__': asyncio.run(main(sys.argv[1:]))
