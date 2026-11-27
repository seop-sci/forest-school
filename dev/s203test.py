# 현장 관찰의 선택·저장·귀환, 구름 실험실, 심화 관문과 보스 연습.
import asyncio

from playwright.async_api import async_playwright
from testlib import CLEAN, OVER, Checker, base, ctxpage


async def close_reward(page):
    await page.locator('#rwOk').tap()
    await page.locator('#mReward').wait_for(state='hidden')


async def visit(page, dest, route, bit, c, wait_only=False):
    await page.evaluate("""() => {
      const F = window.__forest;
      F.rt4.fakeNow = Date.parse('2026-11-27T03:30:00Z');
      F.S.st.trips = 7;
      F.openTrip();
    }""")
    await page.locator(f'[data-trip="{dest}"]').tap()
    choices = page.locator('[data-trip-route]')
    depart = page.locator('[data-trip-depart]')
    c.ok(await choices.count() == 2 and await depart.is_disabled(), f'{dest}: 두 활동 중 하나를 고르는 준비 화면')
    await page.locator(f'[data-trip-route][value="{route}"]').check()
    await depart.tap()
    await page.locator('#mTrip').wait_for(state='hidden')

    def progress(p):
        return page.evaluate("""p => {
          const F = window.__forest, T = F.S.trip;
          F.rt4.fakeNow = T.start + (T.end - T.start) * p;
          F.openTrip();
        }""", p)

    await progress(.12)
    field = page.locator('#tripObservation')
    c.ok(not await field.is_visible(), f'{dest}: 현장에 도착하기 전에는 관찰 선택이 없어요')
    scene = page.locator(f'.tr-journey[data-dest="{dest}"]')
    c.ok(await scene.get_attribute('data-route') == route, f'{dest}: 고른 활동이 이동 중에도 표시돼요')
    if not wait_only:
        await progress(.5)
        await field.wait_for()
        c.ok(not await page.evaluate(OVER, '#tripObservation, .tr-field-choices'), f'{dest}: 관찰 선택이 화면 안에 보여요')
        await field.locator(f'[data-trip-observation="{bit}"]').tap()
        c.ok(not await field.locator('button').count(), f'{dest}: 관찰 결과를 바로 보여줘요')
        result = await page.evaluate("""() => {
          const F = window.__forest, saved = F.sanitize(JSON.parse(JSON.stringify(F.S)));
          return [saved.trip.route, saved.trip.observation];
        }""")
        c.ok(result == [route, bit], f'{dest}: 다시 열어도 현장 선택을 기억해요 {result}')
    await progress(1)
    await page.locator('#tripGet').tap()
    await page.locator('#mReward').wait_for()
    c.ok('관찰 기록:' in await page.locator('#rwList').inner_text(), f'{dest}: 귀환 보고서가 관찰 기록을 보여줘요')
    await page.evaluate('window.__forest.claimTrip(1)')
    await close_reward(page)


async def trips(browser, c):
    ctx, page, errors = await ctxpage(browser, 360, 780, 'dark', base(tier=1, tg=3))
    await page.emulate_media(reduced_motion='reduce')
    await page.evaluate(CLEAN)
    await page.evaluate('window.__forest.S.gfx = 0')
    session = await ctx.new_cdp_session(page)
    await session.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    await visit(page, 'hill', 'canopy', 1, c)
    await session.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    await visit(page, 'hill', 'canopy', 2, c)
    await visit(page, 'museum', 'coins', 2, c)
    await visit(page, 'beach', 'pools', 1, c)
    await visit(page, 'star', 'moon', 0, c, wait_only=True)
    await page.evaluate('window.__forest.openTrip()')
    await page.locator('.tr-field-album summary').tap()
    album = page.locator('.tr-field-album')
    c.ok(await album.locator('article').count() == 4 and await album.locator('.tr-extra-note').count() == 4,
         '되풀이 관찰은 같은 항목 안에 메모 두 개로 남고, 지나간 여행에도 기본 기록이 남아요')
    result = await page.evaluate("""() => {
      const F = window.__forest, {S} = F, d = JSON.parse(JSON.stringify(S));
      d.trip.records['bad:unknown'] = 1;
      d.trip.records['museum:fossils'] = 99;
      const safe = F.sanitize(d).trip;
      return [safe.records, safe.cur, safe.observation, safe.souv.filter(k => k.startsWith('hill:')).length];
    }""")
    c.ok(result == [{'hill:canopy': 3, 'museum:coins': 2, 'beach:pools': 1, 'star:moon': 0}, '', 0, 2],
         f'검증된 기록과 기념품만 저장해요 {result}')
    c.ok(not errors, f'체험학습 브라우저 오류 {errors[:4]}')
    await ctx.close()


async def expedition(browser, c):
    seed = base(tier=5, tg=0)
    ctx, page, errors = await ctxpage(browser, 390, 820, 'light', seed)
    await page.evaluate(CLEAN)
    results = await page.evaluate("""() => {
      const F = window.__forest, {S} = F;
      S.tam.hc = F.tamCap();
      const checkpoints = [50,100,150,200,250,300,350].map(fl => F.tamFight(fl, [],1,null,true,false).wind?.spec.key);
      const skipped = [[310,false,true],[340,true,false],[350,true,true]].map(([fl,hm,rep]) => !F.tamFight(fl,[],1,null,hm,rep).wind);
      skipped.push(!F.tamFight(310, [], 1, {trial:false}).wind);
      const matches = [1,3,5].flatMap(size => [false,true].map(hm => {
        const fl = hm ? 350 : 310, boss = F.tamMobs(fl,hm)[0];
        const team = [1,0,3,4,2].slice(0,size).map(ri => {
          const r = F.TAM.role[ri];
          return {ri, atk:boss.hp * r.atk/(12+10*size), hp:boss.atk*(12+size)*r.hp, cd:r.cd, gg:1};
        });
        const fight = F.tamFight(fl,team,1,null,hm,false);
        const trace = {size,hm,tell:false,answer:false,hit:false,r:0};
        for (let i=0; i<530 && !trace.r; i++) {
          trace.r = F.tamStep(fight,.1,true,() => .3);
          for (const e of fight.ev) {
            if(e.k==='wind') trace.tell=true;
            if(e.k==='wind-answer') trace.answer=true;
            if(e.k==='wind-hit') trace.hit=true;
          }
          fight.ev.length=0;
        }
        return trace;
      }));
      return {checkpoints,skipped,matches};
    }""")
    c.ok(results['checkpoints'] == ['wind', 'spore', 'wave', 'book', 'frost', 'stars', 'circuit'] and
         all(results['skipped']), f'심화는 각 지역 끝에서만 예고가 나오고 자동 되풀이와 원정에는 예고가 없어요 {results}')
    c.ok(all(x['tell'] and x['answer'] and not x['hit'] and x['r'] == 1 for x in results['matches']),
         f'대표 능력치에서 1·3·5명 자동 대응과 승리 {results["matches"]}')

    await page.evaluate("""() => {
      const F = window.__forest, {S,rt4} = F;
      rt4.fakeNow = Date.parse('2026-11-27T03:30:00Z');
      S.gfx = 0;
      Object.assign(S.tam,{best:309,hm:0,seen:1,auto:0,it:F.gameNow()});
      F.setTab('tam');
      const b = rt4.tam;
      F.tamPh(b,'meet');
      b.F.t = 3; b.F.M[0].c = .05;
      b.F.P.forEach(p => { p.hp = p.mx = b.F.M[0].atk * 15; p.atk = b.F.M[0].mx / 60; });
      const card = document.querySelector('#tmWind');
      const pause = new MutationObserver(() => {
        if (!card.hidden && card.dataset.trial === 'circuit') {rt4.paused=true;pause.disconnect();}
      });
      pause.observe(card,{attributes:true});
    }""")
    card = page.locator('#tmWind[data-trial="circuit"]')
    await card.wait_for(timeout=10000)
    hint = await card.locator('#tmWindHint').inner_text()
    order = ['cloud', 'sun'] if hint.startswith('구름') else ['sun', 'cloud']
    c.ok('0/2' in hint and not await page.evaluate(OVER, '#tmWind,#tmWindSigns'), '구름·해 순서와 이동 단추가 표시돼요')
    await card.locator(f'[data-tam-sign="{order[0]}"]').tap()
    c.ok('1/2' in await card.locator('#tmWindHint').inner_text(), '첫 스위치에서 회로 진행이 표시돼요')
    await card.locator(f'[data-tam-sign="{order[1]}"]').tap()
    await page.get_by_text('회로를 멈췄어요!', exact=True).wait_for()
    await page.evaluate('window.__forest.rt4.paused = false')

    await page.locator('#tmMapOpen').tap()
    await page.locator('.tm-practice-list summary').tap()
    await page.locator('[data-tam-practice="160"]').tap()
    await page.locator('#tmPracticeExit').wait_for()
    c.ok('연습 160층' == await page.locator('#tmFl').inner_text() and not await page.evaluate(OVER, '#tmPractice'),
         '이미 끝낸 보스를 탐험 지도에서 선택해 연습할 수 있어요')
    report = await page.evaluate("""() => {
      const F = window.__forest, {S,rt4}=F, T=rt4.tam;
      const snap=()=>JSON.stringify([S.tam.best,S.tam.hb,S.tam.mat,S.gold,S.ess,S.budget]);
      F.tamPh(T,'meet');
      const before=snap();
      F.tamPh(T,'win');
      return [T.ph,before===snap(), T.F.fl, T.F.rep, T.F.wind.spec.key];
    }""")
    c.ok(report == ['practiceEnd', True, 160, 0, 'book'], f'연습은 예고를 연습하며 보상과 최고층은 그대로예요 {report}')
    await page.locator('#tmPracticeRetry').tap()
    await page.locator('#tmPracticeExit').tap()
    c.ok('310층' == await page.locator('#tmFl').inner_text() and not await page.locator('#tmPractice').is_visible(),
         '연습을 나가면 일반 탐험의 다음 층으로 돌아와요')
    await page.locator('#tmNav [data-tnav="exp"]').tap()
    await page.locator('#txFull').wait_for()
    elapsed = await page.evaluate('window.__forest.rt4.tam.t')
    await page.wait_for_timeout(350)
    c.ok(await page.evaluate('window.__forest.rt4.tam.t') == elapsed, '원정 지도 화면에서 일반 전투의 예고 시계가 멈춰요')
    await page.locator('#txFull [data-txx]').tap()
    await page.wait_for_function('elapsed => window.__forest.rt4.tam.t > elapsed', arg=elapsed, timeout=3000)
    c.ok(not errors, f'탐험 브라우저 오류 {errors[:4]}')
    await ctx.close()


async def main():
    c = Checker()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await trips(browser, c)
        await expedition(browser, c)
        await browser.close()
    c.done()


asyncio.run(main())
