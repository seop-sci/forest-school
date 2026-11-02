"""Read-only economic audit. All modifications/instrumentation are in served memory.
Run from dev: python3 balance_v300_sessions.py [--days N]
No production services, SDKs, builds or game source changes.
"""
import argparse, asyncio, hashlib, json, pathlib, re, subprocess
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/balance-v300b'
EXPORT='acBkLeft,BT,BT_LG,btDay,btLeft,btMake,btRoster,btBest,btRoll,btWin,btOppCheer,btFinish,grantOffline,offlineEff,stampAtt,tkAd,acBuyBook,bookCost,DM,MP,TK_REW,GOLD,EV_STAMPS,EV_BOX,MG_DEX_MS,MG_DEX,GSHOP,COS,THEMES,MG_UP:MG.UPCOST,mgEMax,mgArtXp,tkGive,tkDaily,esExCost,esExLeft,conFree,conFreeLeft,facMaxed,furReady,furDone,rate,tierMinutes,minAcorns,libMult,addGold,addEss,addDip,PCN,showReady,festOpen,claimStamp,claimEvMission,claimEvBox,evSync,claimBox,claimWeekMission,dmReady,claimMission,claimBonus,rosterEnsure,renderClub,AC,AC_GAME,bookCost,esDay,ESHOP,LG_PRIZE,PS,psReward,CB,BOOST,BF,LAB,PL,RARE,DECO_MAX,thSetsDone'
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
        browser=await p.chromium.launch(args=['--no-sandbox'])
        # No network access: fulfill main HTML and block all other requests.
        # 2026-11-02: start states mid/high, one seed, 10/15 minutes, ads 0/3/5
        cases=[(st,m,a,42,None,1500) for st in ('mid','high') for m in (10,15) for a in (0,3,5)]
        if args.start2: cases=[c for c in cases if c[0]==args.start2 and c[1]==args.minutes]
        if args.constants_only: cases=[]
        if args.quick: cases=[(args.start,15,0,41,None,1500)]
        for start,minutes,ads,seed,fp,score in cases:
          ctx=await browser.new_context(viewport={'width':390,'height':844})
          await ctx.add_init_script('''window.__FOREST_TEST=true;window._auditNow=Date.parse('2026-11-02T13:00:00+09:00');Date.now=()=>window._auditNow;window.requestAnimationFrame=()=>0;window.setInterval=()=>0;''')
          await ctx.route('**/*',lambda route: route.fulfill(status=200,content_type='text/html',body=html) if route.request.url=='http://audit.local/' else route.abort())
          pg=await ctx.new_page();errors=[];pg.on('pageerror',lambda e:(errors.append(str(e)),print('PAGEERROR',str(e),flush=True)))
          await pg.goto('http://audit.local/');await pg.wait_for_function('!!window.__forest&&!!window.__audit',polling=100)
          await pg.evaluate(engine)
          out=await pg.evaluate('o=>window.auditSessions(o)',dict(start=start,minutes=minutes,ads=ads,seed=seed,days=args.days,fp=fp,score=score))
          out['errors']=errors;results.append(out)
          print(json.dumps({k:out[k] for k in ['start','minutes','ads','seed','dormDay','milestones','endQuest','endDay','complete']},ensure_ascii=False),flush=True)
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
        (OUT/'constants.json').write_text(json.dumps(constants,ensure_ascii=False,indent=2))
        print('CONSTANTS COMPLETE',flush=True);return
    import gzip
    OUT.mkdir(parents=True,exist_ok=True)
    if args.quick:
        pathlib.Path('/tmp/forest-economy-quick-results.json').write_text(json.dumps(out,ensure_ascii=False));print('QUICK AUDIT COMPLETE',flush=True);return
    (OUT/f'results-{args.start2 or "all"}-{args.minutes or 0}.json.gz').write_bytes(gzip.compress(json.dumps(out,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
    (OUT/'constants.json').write_text(json.dumps(constants,ensure_ascii=False,indent=2))
    assert not any(x['errors'] for x in results), [x['errors'] for x in results if x['errors']]
    print('AUDIT COMPLETE',flush=True)
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--days',type=int,default=120);a.add_argument('--quick',action='store_true');a.add_argument('--start',default='high');a.add_argument('--start2',default='');a.add_argument('--minutes',type=int,default=0);a.add_argument('--constants-only',action='store_true',dest='constants_only');asyncio.run(run(a.parse_args()))
