import asyncio, sys, json
sys.path.insert(0,'/home/claude/promo'); sys.path.insert(0,'/home/claude/forest-school/dev')
from cap import page_for, CLEAN
from s4test import base
from playwright.async_api import async_playwright
OUT='/home/claude/promo/raw/'
HIDE="(()=>{const t=document.querySelector('#toast'); if(t) t.hidden=true;})()"
FOLD="(()=>{for(const id of ['qFold']){const b=document.querySelector('#'+id); if(b&&b.getAttribute('aria-expanded')==='true') b.click();}})()"
async def shot(pg, name, wait=600):
    await pg.wait_for_timeout(wait); await pg.evaluate(HIDE); await pg.screenshot(path=OUT+name+'.png'); print('shot', name)
def rich(**kw):
    return base(budget=1e14, **kw)
async def tam_setup(pg, best, lv=None):
    await pg.evaluate(f"""(async()=>{{const F=window.__forest,S=F.S; S.tam.seen=1; S.tam.best={best}; S.budget=1e18; S.tam.it=Date.now();
      let at=F.tamAutoTeam(); at=(at||[]).map(p=>p&&p.sp?p.sp:p).filter(Boolean); if(at.length) S.tam.party=at;
      for (const sp of S.tam.party) {{ S.tam.mem[sp]=Object.assign(S.tam.mem[sp]||{{}},{{lv:{lv or max(1,best)},st:3,sh:0}}); }}
      F.setTab('tam'); await new Promise(r=>setTimeout(r,200)); const T=F.rt4.tam; F.tamPh(T,'walk'); }})()""")
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        async def run(name, save, js=None, wait=1500, tab=None):
            if which and name not in which: return
            ctx, pg, errs = await page_for(b, save)
            await pg.evaluate(FOLD)
            if js: await pg.evaluate(js)
            await pg.wait_for_timeout(wait)
            await shot(pg, name, 300); 
            if errs: print(name, errs[:2])
            await ctx.close()
        await run('campus', rich(tier=3, tg=2, sem=1, grade=4), "(async()=>{const F=window.__forest; F.uniPreview(); await new Promise(r=>setTimeout(r,1500)); F.setZone('academic');})()", 3500)
        await run('campus_life', rich(tier=3, tg=2, sem=1, grade=4), "(async()=>{const F=window.__forest; F.uniPreview(); await new Promise(r=>setTimeout(r,1500)); F.setZone('life');})()", 3500)
        await run('kinder', rich(), None, 1500)
        await run('elem', rich(tier=1, tg=3, sem=1, grade=4), None, 2000)
        await run('teachers', rich(tier=2, tg=1, grade=4), "window.__forest.setTab('teachers')", 1500)
        await run('story', rich(tier=1, tg=0), "window.__STORY_AUTO=true; window.__forest.stPlay('o1', true)", 2500)
        await run('story2', rich(tier=3, tg=0), "window.__forest.stPlay('o16', true)", 2500)
        await run('puzzle', rich(tier=2, tg=1), "(async()=>{const F=window.__forest; F.setTab('mini'); await new Promise(r=>setTimeout(r,400)); F.pzOpen(true);})()", 2500)
        await run('fest', rich(tier=3, tg=2, sem=1, grade=4), "(async()=>{const F=window.__forest; F.uniPreview(); await new Promise(r=>setTimeout(r,1200)); F.openFest();})()", 3000)
        async def tam(name, save, best, skill=False, wait=0, lv=None, burst=0):
            if which and name not in which: return
            ctx, pg, errs = await page_for(b, save)
            await tam_setup(pg, best, lv)
            for _ in range(60):
                ph = await pg.evaluate("window.__forest.rt4.tam && window.__forest.rt4.tam.ph")
                if ph == 'fight': break
                await pg.wait_for_timeout(250)
            await pg.wait_for_timeout(700 + wait)
            if skill:
                await pg.evaluate("(()=>{const F=window.__forest,T=F.rt4.tam; if(T&&T.F) T.F.P.forEach(p=>p.g=999);})()")
                await pg.wait_for_timeout(300)
                await pg.evaluate("(()=>{const b=document.querySelector('.tm-sk.ready')||document.querySelector('.tm-sk'); b&&b.click();})()")
                if burst:
                    for k in range(burst):
                        await pg.evaluate(HIDE); await pg.screenshot(path=OUT+f'{name}_{k:02d}.png'); await pg.wait_for_timeout(120)
                await pg.wait_for_timeout(skill if isinstance(skill,int) else 450)
            await pg.evaluate(HIDE); await pg.screenshot(path=OUT+name+'.png'); print('shot', name, errs[:1])
            await ctx.close()
        U = dict(tier=4, tg=3, sem=1, grade=4)
        await tam('tam_fight', rich(**U), 66)
        await tam('tam_skill', rich(**U), 116, 500)
        await tam('tam_skill2', rich(**U), 166, 900)
        await tam('tam_boss', rich(**U), 249, False, 600)
        await tam('tam_ground', rich(tier=2, tg=1, grade=4), 36)
        await tam('sk_sci', rich(**U), 116, 300, 0, 70, 14)
        await tam('sk_art', rich(**U), 26, 300, 0, 16, 14)
        await run('fest_game', rich(tier=3, tg=2, sem=1, grade=4), "(async()=>{const F=window.__forest; F.uniPreview(); await new Promise(r=>setTimeout(r,1200)); F.startFest('lantern');})()", 4000)
        await run('fest_game2', rich(tier=3, tg=2, sem=1, grade=4), "(async()=>{const F=window.__forest; F.uniPreview(); await new Promise(r=>setTimeout(r,1200)); F.startFest('meteor');})()", 4000)
        await run('study', rich(tier=2, tg=1, grade=4), "window.__forest.setTab('mini')", 1500)
        await run('mg', rich(tier=2, tg=1, grade=4), "(async()=>{const F=window.__forest; F.setTab('mini'); await new Promise(r=>setTimeout(r,400)); F.mgOpen();})()", 2500)
        await run('shop', rich(tier=4, tg=1, grade=4), "window.__forest.setTab('shop')", 1500)
        await run('th_xmas', rich(tier=1, tg=3, sem=1, grade=4), "(()=>{const F=window.__forest; F.S.cos.th.bg='xmas'; F.applyCos();})()", 3500)
        await run('th_spring', rich(tier=2, tg=1, sem=1, grade=4), "(()=>{const F=window.__forest; F.S.cos.th.bg='spring'; F.applyCos();})()", 3500)
        await run('th_autumn', rich(tier=1, tg=3, sem=1, grade=4), "(()=>{const F=window.__forest; F.S.cos.th.bg='autumn'; F.applyCos();})()", 3500)
        await b.close()
if __name__ == '__main__': asyncio.run(main(sys.argv[1:]))
