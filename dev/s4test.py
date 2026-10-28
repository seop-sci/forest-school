import asyncio, json, pathlib, time, datetime, sys
from playwright.async_api import async_playwright
URL = pathlib.Path('test.html').resolve().as_uri()
TODAY = datetime.date.today().isoformat()
SEL = sys.argv[1:]
want = lambda n: not SEL or n in SEL
BIG = dict(classroom=14, cafeteria=12, library=11, playground=8)

def base(**kw):
    s = {'v':4,'budget':1e6,'students':60,'f':dict(BIG),'t':{'squirrel':5,'owl':5,'bear':5},'grade':4,'best':4,'sound':False,'vibrate':False,
         'savedAt':int(time.time()*1000),'pending':0,'pendingSec':0,'certNo':5,'earned':9e7,'yearEarned':3e6,
         'st':{'picks':40,'ups':90,'trains':20,'claims':3,'grads':0,'perks':0},
         'p':{'dip':0,'species':0,'perk':{'schol':0,'rep':0,'start':0,'drop':0,'night':0}},'att':{'last':TODAY,'n':2},'ad':{'day':'','n':0},'u':{'boost':True},
         'tier':0,'tg':0,'tdip':0,'fund':0,'fp':{'schol':0,'rep':0,'dip':0},
         'q':{'init':True,'mid':'q22','m':22,'mb':0,'subs':[],'done':[],'gen':0,'subDone':5,'seen':22}}
    s.setdefault('rank', {'name': '', 'joined': False, 'sent': -1, 'by': '', 'asked': True})
    s.update(kw); return s

async def ctxpage(b, w, h, scheme, save):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    page = await ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append('console:'+m.text) if m.type=='error' and 'ERR_TUNNEL' not in m.text else None)
    await page.goto(URL); await page.wait_for_timeout(900)
    return ctx, page, errs

BOARD = """(() => { const q = s => document.querySelector(s);
  const over = [...document.querySelectorAll('.stat')].filter(e => !e.hidden).map(e => e.scrollWidth > e.clientWidth + 1);
  return { cols: getComputedStyle(q('#stats')).gridTemplateColumns, power: q('#vPower').textContent, rep: q('#vRep').textContent, budget: q('#vBudget').textContent, rate: q('#vRate').textContent,
    next: q('#vNext').textContent, quest: q('#qbTitle').textContent, over, pageOver: document.documentElement.scrollWidth > document.documentElement.clientWidth }; })()"""
GRAD = """(() => { const q = s => document.querySelector(s);
  return { lead: q('#gLead').textContent, card: !q('#gCard').hidden, year: q('#gYear').textContent, gbtn: q('#gBtn').textContent,
    reqs: q('#tierReqs').innerText.split('\\n'), tierNote: q('#tierNote').textContent, tierBtn: q('#tierBtn').textContent + ' ' + q('#tierBtn').getAttribute('aria-disabled'),
    tierFund: q('#tierFund').textContent, perkHave: q('#perkHave').innerText, fundHave: q('#fundHave').innerText,
    order: [...document.querySelectorAll('#panelGrad h3')].map(h => h.firstChild.textContent.trim()) }; })()"""
saved = lambda page: page.evaluate("JSON.parse(localStorage.getItem('forest-school-v1'))")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); res = {}
        # 1) 유치원 1년째 대도시 → 첫 졸업식 → 2년째
        if want('k1'):
            ctx, page, errs = await ctxpage(b, 390, 780, 'light', base())
            r = {'board0': await page.evaluate(BOARD)}
            await page.screenshot(path='s4_k1_board.png')
            await page.tap('.tab[data-tab="grad"]'); await page.wait_for_timeout(400)
            r['grad0'] = await page.evaluate(GRAD)
            await page.screenshot(path='s4_k1_grad.png')
            await page.tap('#gBtn'); await page.wait_for_timeout(250)
            r['confirm'] = await page.evaluate("document.querySelector('#gConfirmText').textContent")
            await page.tap('#gYes'); await page.wait_for_timeout(800)
            r['ceremony'] = await page.evaluate("[document.querySelector('#gradTitle').textContent, document.querySelector('#gradText').textContent, document.querySelector('#gradOk').textContent, document.querySelector('#gradDip').textContent]")
            await page.screenshot(path='s4_k1_ceremony.png')
            await page.tap('#gradOk'); await page.wait_for_timeout(600); await page.evaluate("(()=>{ for (let i = 0; i < 6 && !document.querySelector('#mTalk').hidden; i++) document.querySelector('#talkNext').click(); })()"); await page.wait_for_timeout(400)   # 2.0.0 전학 대화 넘기기
            r['grad1'] = await page.evaluate(GRAD)
            await page.evaluate("window.scrollTo(0,0); document.querySelector('#panelGrad').scrollTop = 0")
            await page.screenshot(path='s4_k2_grad.png')
            await page.tap('.tab[data-tab="school"]'); await page.wait_for_timeout(400)
            r['board1'] = await page.evaluate(BOARD)
            await page.screenshot(path='s4_k2_board.png')
            # 퀘스트: 첫 졸업식 받기 → 명예 교장실 → 진학 퀘스트
            await page.tap('#questBar'); await page.wait_for_timeout(600)
            r['reward_after_claim'] = await page.evaluate("!document.querySelector('#mReward').hidden && document.querySelector('#rwTitle').textContent")
            await page.evaluate("if (!document.querySelector('#mReward').hidden) document.querySelector('#rwOk').click()"); await page.wait_for_timeout(400)
            r['q_after_claim'] = await page.evaluate("[document.querySelector('#qbTitle').textContent, document.querySelector('#qbHow').textContent]")
            # 칠판 졸업장 칸을 누르면 졸업 탭 명예 교장실로
            await page.tap('.tab[data-tab="grad"]'); await page.wait_for_timeout(700)
            r['statTap'] = await page.evaluate("[document.querySelector('.tab[aria-selected=true]').dataset.tab, Math.round(document.querySelector('#perkList').getBoundingClientRect().top)]")
            await page.screenshot(path='s4_k2_perks.png')
            btn = await page.query_selector('#perkList button[data-perk="schol"]')
            await btn.tap(); await page.wait_for_timeout(400)
            await page.tap('.tab[data-tab="school"]'); await page.wait_for_timeout(300)
            await page.tap('#questBar'); await page.wait_for_timeout(700)
            r['q_k1'] = await page.evaluate("[document.querySelector('#qbTitle').textContent, document.querySelector('#qbHow').textContent]")
            st = await saved(page); r['state'] = {k: st[k] for k in ('tier','tg','tdip','fund')}; r['dip'] = st['p']['dip']; r['mid'] = st['q']['mid']
            r['board2'] = await page.evaluate(BOARD)
            await page.screenshot(path='s4_k2_quest.png')
            r['errors'] = errs; res['k1'] = r
            await ctx.close()
        # 2) 유치원 2년째 대도시 → 진학 (밤, 360)
        if want('k2'):
            sv = base(tg=1, tdip=20, yearEarned=2e6, st={'picks':40,'ups':90,'trains':20,'claims':3,'grads':1,'perks':2},
                      p={'dip':6,'species':1,'perk':{'schol':2,'rep':0,'start':0,'drop':0,'night':0}},
                      q={'init':True,'mid':'k1','m':24,'mb':0,'subs':[],'done':[],'gen':0,'subDone':5,'seen':24})
            ctx, page, errs = await ctxpage(b, 360, 640, 'dark', sv)
            r = {'board': await page.evaluate(BOARD)}
            await page.screenshot(path='s4_final_board_dark.png')
            await page.tap('.tab[data-tab="grad"]'); await page.wait_for_timeout(400)
            r['grad'] = await page.evaluate(GRAD)
            await page.screenshot(path='s4_final_grad_dark.png')
            await page.evaluate("document.querySelector('#tierBtn').scrollIntoView({block:'center'})"); await page.wait_for_timeout(300)
            await page.tap('#tierBtn'); await page.wait_for_timeout(250)
            r['confirm'] = await page.evaluate("document.querySelector('#tierConfirmText').textContent")
            await page.tap('#tierYes'); await page.wait_for_timeout(800)
            r['entrance'] = await page.evaluate("[document.querySelector('#tierTitle').textContent, document.querySelector('#tierFundAmt').textContent, document.querySelector('#tierOk').textContent]")
            await page.tap('#tierOk'); await page.wait_for_timeout(700); await page.evaluate("(()=>{ for (let i = 0; i < 6 && !document.querySelector('#mTalk').hidden; i++) document.querySelector('#talkNext').click(); })()"); await page.wait_for_timeout(400)   # 2.0.0 전학 대화 넘기기
            if await page.evaluate("!document.querySelector('#mGrade').hidden"):
                await page.tap('#certOk'); await page.wait_for_timeout(500)
            await page.tap('.tab[data-tab="school"]'); await page.wait_for_timeout(400)
            r['boardElem'] = await page.evaluate(BOARD)
            await page.screenshot(path='s4_elem_board_dark.png')
            await page.tap('.tab[data-tab="grad"]'); await page.wait_for_timeout(400)
            r['gradElem'] = await page.evaluate(GRAD)
            st = await saved(page); r['state'] = {k: st[k] for k in ('tier','tg','tdip','fund')}
            r['errors'] = errs; res['k2'] = r
            await ctx.close()
        # 3) 초등학교 5학년(2.0.0부터 6학년은 졸업식이라 5학년), 큰 숫자 (360 낮, 390 밤): 칠판 네 칸이 넘치지 않는지
        if want('e6'):
            for scheme, w, h, fn in (('light',360,640,'s4_e6_360.png'),('dark',390,780,'s4_e6_dark.png')):
                sv = base(tier=1, tg=4, tdip=150, fund=4, fp={'schol':2,'rep':1,'dip':0}, budget=3.2e11, students=118, f=dict(classroom=28,cafeteria=14,library=13,playground=10,science=11),
                          st={'picks':40,'ups':90,'trains':20,'claims':3,'grads':7,'perks':9}, p={'dip':87,'species':6,'perk':{'schol':4,'rep':2,'start':1,'drop':1,'night':0}},
                          yearEarned=2e11, hd={'day':TODAY,'n':1,'feastUntil':int(time.time()*1000)+200000,'album':False,'seen':True},
                          q={'init':True,'mid':'e34','m':31,'mb':0,'subs':[],'done':[],'gen':0,'subDone':5,'seen':31,'qv':2})
                ctx, page, errs = await ctxpage(b, w, h, scheme, sv)
                r = {'board': await page.evaluate(BOARD)}
                await page.screenshot(path=fn)
                await page.tap('.tab[data-tab="grad"]'); await page.wait_for_timeout(400)
                r['grad'] = await page.evaluate(GRAD)
                await page.screenshot(path=fn.replace('.png','_grad.png'))
                if w == 390:
                    await page.tap('#gBtn'); await page.wait_for_timeout(250)
                    r['confirm'] = await page.evaluate("document.querySelector('#gConfirmText').textContent")
                    await page.tap('#gYes'); await page.wait_for_timeout(800)
                    r['ceremony'] = await page.evaluate("[document.querySelector('#gradText').textContent, document.querySelector('#gradOk').textContent]")
                    await page.tap('#gradOk'); await page.wait_for_timeout(500); await page.evaluate("(()=>{ for (let i = 0; i < 6 && !document.querySelector('#mTalk').hidden; i++) document.querySelector('#talkNext').click(); })()"); await page.wait_for_timeout(400)   # 2.0.0 전학 대화 넘기기
                    r['yearAfter'] = await page.evaluate("document.querySelector('#gYear').textContent")
                r['errors'] = errs; res[fn] = r
                await ctx.close()
        # 4) 0.6 저장: '졸업식 세 번'(q24) 중이고 졸업식 2번을 연 유치원
        if want('mig'):
            sv = base(tg=2, tdip=30, grade=1, best=4, st={'picks':40,'ups':90,'trains':20,'claims':3,'grads':2,'perks':3},
                      p={'dip':9,'species':2,'perk':{'schol':2,'rep':1,'start':0,'drop':0,'night':0}},
                      q={'init':True,'mid':'q24','m':24,'mb':0,'subs':[],'done':[],'gen':0,'subDone':5,'seen':24})
            ctx, page, errs = await ctxpage(b, 390, 780, 'light', sv)
            r = {'board': await page.evaluate(BOARD)}
            await page.tap('.tab[data-tab="grad"]'); await page.wait_for_timeout(400)
            r['grad'] = await page.evaluate(GRAD)
            st = await saved(page); r['mid'] = st['q']['mid']
            r['errors'] = errs; res['mig'] = r
            await ctx.close()
        out = json.dumps(res, ensure_ascii=False, indent=1)
        open('s4res.json', 'w').write(out)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
