"""Read-only economic audit. All modifications/instrumentation are in served memory.
Run from dev: python3 balance_v300_sessions.py [--days N]
No production services, SDKs, builds or game source changes.
"""
import argparse, asyncio, hashlib, json, pathlib, re, subprocess
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
EXPORT='BT,BT_LG,btDay,btLeft,btMake,btRoster,btBest,btRoll,btWin,btOppCheer,btFinish,grantOffline,offlineEff,stampAtt,tkAd,acBuyBook,bookCost,DM,MP,TK_REW,GOLD,EV_STAMPS,EV_BOX,MG_DEX_MS,MG_DEX,GSHOP,COS,THEMES,MG_UP:MG.UPCOST,mgEMax,mgArtXp,tkGive,tkDaily,esExCost,esExLeft,conFree,conFreeLeft,facMaxed,furReady,furDone,rate,tierMinutes,minAcorns,libMult,addGold,addEss,addDip,PCN,showReady,festOpen,claimStamp,claimEvMission,claimEvBox,evSync,claimBox,claimWeekMission,dmReady,claimMission,claimBonus,rosterEnsure,renderClub,AC,AC_GAME,bookCost,esDay,ESHOP,LG_PRIZE,PS,psReward,CB,BOOST,BF,LAB,PL,RARE,DECO_MAX,thSetsDone'
MUTE=['save','renderMap','renderHUD','renderAffordance','renderGradPanel','renderMissions','renderEss','renderMini','renderShop','renderTeachers','renderSheet','renderEvent','renderBtCard','renderClub','renderPass','renderDex','mgRenderAll','mgRenderTop','mgRenderFoot','mgRenderBoard','mgRenderOrders','renderNs','renderNight','conRender','ffRender','showReward','toast','sfx','buzz','floatText','queueModal','checkQuests','syncKids','layoutMap','applyThemes','applyCos','musicSync']
async def run(args):
    raw=(ROOT/'dev/forest-school.html').read_text(); original=hashlib.sha256(raw.encode()).hexdigest()
    mute=';'.join(n+'=()=>{}' for n in MUTE if re.search(r'function '+n+r'\(',raw))
    code=f'if(window.__FOREST_TEST){{window.__audit={{ {EXPORT} }};window.__audit.mute=()=>{{{mute}}};}}\n'
    marker='  if (window.__FOREST_TEST) window.__forest = '
    html=raw.replace(marker,code+marker,1).replace('<head>','<head><base href="http://audit.local/">',1)
    assert html!=raw
    html='<!doctype html><html><head><meta charset="utf-8"><base href="http://audit.local/"></head><body>'+html+'</body></html>'
    engine=(ROOT/'dev/balance_v300_sessions.js').read_text()
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        # No network access: fulfill main HTML and block all other requests.
        cases=[(m,a,z,6,1500) for m in (10,15) for a in (0,3,5) for z in (41,42,43)]
        cases += [(15,3,42,fp,1500) for fp in (3,9)] + [(15,3,42,6,score) for score in (1000,2000)]
        if args.constants_only: cases=[]
        if args.quick: cases=[(15,0,41,6,1500)]
        for minutes,ads,seed,fp,score in cases:
          ctx=await browser.new_context(viewport={'width':390,'height':844})
          await ctx.add_init_script('''window.__FOREST_TEST=true;window._auditNow=Date.parse('2026-11-02T13:00:00+09:00');Date.now=()=>window._auditNow;window.requestAnimationFrame=()=>0;window.setInterval=()=>0;''')
          await ctx.route('**/*',lambda route: route.fulfill(status=200,content_type='text/html',body=html) if route.request.url=='http://audit.local/' else route.abort())
          pg=await ctx.new_page();errors=[];pg.on('pageerror',lambda e:(errors.append(str(e)),print('PAGEERROR',str(e),flush=True)))
          await pg.goto('http://audit.local/');await pg.wait_for_function('!!window.__forest&&!!window.__audit',polling=100)
          await pg.evaluate(engine)
          out=await pg.evaluate('o=>window.auditSessions(o)',dict(minutes=minutes,ads=ads,seed=seed,days=args.days,fp=fp,score=score))
          out['errors']=errors;results.append(out)
          print(json.dumps({k:out[k] for k in ['minutes','ads','seed','dormDay','milestones','endQuest','endDay','complete']},ensure_ascii=False),flush=True)
          await ctx.close()
        # Export live constants and prices; no hand-copied constants in report.
        ctx=await browser.new_context();await ctx.add_init_script('window.__FOREST_TEST=true;window.requestAnimationFrame=()=>0;window.setInterval=()=>0')
        await ctx.route('**/*',lambda route: route.fulfill(status=200,content_type='text/html',body=html) if route.request.url=='http://audit.local/' else route.abort())
        pg=await ctx.new_page();await pg.goto('http://audit.local/');await pg.wait_for_function('!!window.__forest',polling=100);await pg.evaluate(engine)
        constants=await pg.evaluate('window.auditConstants()')
        await browser.close()
    assert hashlib.sha256((ROOT/'dev/forest-school.html').read_bytes()).hexdigest()==original
    out={'sourceSha256':original,'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'days':args.days,'results':results,'constants':constants}
    if args.constants_only:
        (ROOT/'docs/balance-v300/constants.json').write_text(json.dumps(constants,ensure_ascii=False,indent=2))
        print('CONSTANTS COMPLETE',flush=True);return
    import gzip
    if args.quick:
        pathlib.Path('/tmp/forest-economy-quick-results.json').write_text(json.dumps(out,ensure_ascii=False));print('QUICK AUDIT COMPLETE',flush=True);return
    (ROOT/'docs/balance-v300/results.json.gz').write_bytes(gzip.compress(json.dumps(out,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
    (ROOT/'docs/balance-v300/constants.json').write_text(json.dumps(constants,ensure_ascii=False,indent=2))
    assert not any(x['errors'] for x in results), [x['errors'] for x in results if x['errors']]
    print('AUDIT COMPLETE',flush=True)
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--days',type=int,default=120);a.add_argument('--quick',action='store_true');a.add_argument('--constants-only',action='store_true',dest='constants_only');asyncio.run(run(a.parse_args()))
