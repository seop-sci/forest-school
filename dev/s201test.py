# 화면별 일괄 받기, 탐험 지도, 체험학습 이동과 귀환.
import asyncio

from playwright.async_api import async_playwright
from testlib import CLEAN, OVER, Checker, base, ctxpage


async def close_reward(page):
    await page.locator('#rwOk').click()
    await page.locator('#mReward').wait_for(state='hidden')


async def batches(page, c, width):
    await page.evaluate("""() => {
      const F = window.__forest, {S, rt4} = F;
      rt4.fakeNow = Date.parse('2026-11-27T03:30:00Z');
      S.q.subs = [
        {id:'g90', who:'bear', t:'picks', n:1, b:0, r:75, say:'도토리를 주워요'},
        {id:'g91', who:'fox', t:'picks', n:1000, b:0, r:175, say:'도토리를 더 주워요'}
      ];
      Object.assign(S.gs, {st:2, who:F.GS_WHO[0], day:F.gameToday(), sub:{t:'picks',b:0,n:1,say:'부탁해요',lab:'오늘 손님'}});
      F.missionGo('subs');
    }""")
    students = page.locator('[data-collect="students"]')
    if c.ok(await students.count() == 1, f'{width}: 학생과 손님 보상 단추가 있어요'):
        c.ok('받을 보상 2개' in await students.inner_text(), f'{width}: 완료된 부탁만 세어요')
        before = await page.evaluate('window.__forest.S.q.subDone')
        await students.click(timeout=3000)
        await page.locator('#mReward').wait_for(timeout=3000)
        result = await page.evaluate("""() => {
          const F = window.__forest, {S, rt4} = F;
          return [S.q.subDone, S.gs.st, S.q.subs.some(s => s.id === 'g91'), rt4.modalQueue.length];
        }""")
        c.ok(result == [before + 1, 3, True, 0] and not await students.count(),
             f'{width}: 학생과 손님만 한 번씩 받고 미완료 부탁과 메인은 남아요 {result}')
        c.ok('숲의 정수 +5' in await page.locator('#rwList').inner_text(), f'{width}: 손님의 정수도 보상 창에 보여요')
        await close_reward(page)

    await page.evaluate("""() => {
      const F = window.__forest, {S} = F;
      F.evSync();
      S.ev.list = ['picks','claims','dmDone'].map(t => ({ t, n:1, b:F.evVal(t)-1, done:false, m:5, g:1 }));
      F.setTab('event'); F.setEvSeg('ev');
    }""")
    event = page.locator('[data-collect="event"]')
    if c.ok(await event.count() == 1, f'{width}: 이벤트 일괄 받기 단추가 있어요'):
        c.ok('받을 보상 5개' in await event.inner_text(), f'{width}: 이벤트 도장, 미션 셋, 기념 상자')
        await event.click(timeout=3000)
        await page.locator('#mReward').wait_for(timeout=3000)
        result = await page.evaluate("""() => {
          const {S,rt4} = window.__forest;
          return [S.ev.stamp.n, S.ev.list.every(m => m.done), S.ev.box, rt4.modalQueue.length];
        }""")
        c.ok(result == [1, True, True, 0] and not await event.count(), f'{width}: 이벤트를 한 창에서 받고 반복 수령이 없어요 {result}')
        c.ok('보상 5개' in await page.locator('#rwSub').inner_text(), f'{width}: 실제로 받은 보상 수도 맞아요')
        await close_reward(page)

    await page.evaluate("""() => {
      const F = window.__forest, {S} = F;
      F.psSync();
      S.ps.pts = F.PS.per * 2 - 10; S.ps.got = 0;
      S.ps.dl = [{id:'picks', n:1, b:0, done:false}];
      F.setEvSeg('ps');
    }""")
    ps = page.locator('[data-collect="pass"]')
    if c.ok(await ps.count() == 1, f'{width}: 패스 일괄 받기 단추가 있어요'):
        c.ok('받을 보상 3개' in await ps.inner_text(), f'{width}: 미션으로 열리는 패스 단계도 표시해요')
        await ps.click(timeout=3000)
        await page.locator('#mReward').wait_for(timeout=3000)
        result = await page.evaluate("""() => {
          const F = window.__forest, {S, rt4} = F;
          return [S.ps.dl[0].done, F.psGot(1), F.psGot(2), F.psGot(3), rt4.modalQueue.length];
        }""")
        c.ok(result == [True, True, True, False, 0] and not await ps.count(),
             f'{width}: 아직 열린 단계까지만 한 창에서 받아요 {result}')
        await close_reward(page)


async def expedition(page, c, width):
    await page.evaluate("""() => {
      const F = window.__forest;
      Object.assign(F.S.tam, {best:109, seen:1, it:F.gameNow()});
      F.setTab('tam'); F.tamPh(F.rt4.tam, 'walk');
    }""")
    await page.locator('#tmMapOpen').tap(timeout=4000)
    await page.locator('#mTamMap').wait_for(timeout=3000)
    c.ok('110층' in await page.locator('.tm-map-goal').inner_text() and
         '몸을 낮춰' in await page.locator('.tm-map-goal').inner_text(), f'{width}: 110층 보스와 대응 방법이 보여요')
    c.ok(await page.locator('.tm-map-regions li').count() == 6 and
         '안개 연못' in await page.locator('.tm-map-regions [aria-current]').inner_text() and
         await page.locator('.tm-map-regions li').filter(has_text='학기 상한 이후').count() >= 1,
         f'{width}: 현재 지역, 전체 지역, 학기 상한')
    elapsed = await page.evaluate('window.__forest.rt4.tam.t')
    await page.wait_for_timeout(350)
    c.ok(await page.evaluate('window.__forest.rt4.tam.t') == elapsed and not
         await page.evaluate(OVER, '.tm-map-modal, .tm-map-regions li'), f'{width}: 지도가 화면 안에 있고 보는 동안 전투 정지')
    await page.keyboard.press('Escape')
    await page.locator('#mTamMap').wait_for(state='hidden')
    await page.wait_for_function('elapsed => window.__forest.rt4.tam.t > elapsed', arg=elapsed, timeout=2500)


async def travel(page, c, width):
    frozen = '2026-11-27T03:30:00Z'
    for dest in ('hill', 'museum', 'beach', 'star'):
        await page.evaluate("""([id, date]) => {
          const F = window.__forest, {S,rt4} = F;
          F.setTab('school'); S.st.trips = 7; rt4.fakeNow = Date.parse(date);
          F.startTrip(id); rt4.busHold = 0;
          F.openTrip();
        }""", [dest, frozen])
        scene = page.locator(f'.tr-journey[data-dest="{dest}"]')
        await scene.wait_for(timeout=4000)
        c.ok(await scene.locator('img.tr-journey-land').evaluate('img => img.decode().then(() => img.naturalWidth >= 760)'),
             f'{width}: {dest} 새 풍경이 표시돼요')
        c.ok(await page.locator('.tr-legs [aria-current]').inner_text() == '가는 길', f'{width}: {dest} 출발 표시')
        for progress, leg in ((.5, '현장 활동'), (.9, '귀환')):
            await page.evaluate("""progress => {
              const {S,rt4} = window.__forest;
              rt4.fakeNow = S.trip.start + (S.trip.end - S.trip.start) * progress;
            }""", progress)
            await page.locator('.tr-legs [aria-current]').filter(has_text=leg).wait_for(timeout=4000)
        await page.evaluate('window.__forest.rt4.fakeNow = window.__forest.S.trip.end + 1')
        button = page.locator('#tripGet')
        await button.wait_for(timeout=4000)
        bounds = await scene.bounding_box()
        overflow = await page.evaluate(OVER, '.tr-legs, .tr-return')
        c.ok('체험학습 보고서' in await page.locator('.tr-return').inner_text() and
             await scene.get_attribute('data-mode') == 'back' and not overflow and
             bounds['x'] >= 0 and bounds['x'] + bounds['width'] <= width,
             f'{width}: {dest} 귀환 보고서가 화면 안에 있어요 {overflow}')
        await button.tap()
        await page.locator('#mReward').wait_for(timeout=4000)
        c.ok(await page.evaluate("""id => {
          const F = window.__forest, {S} = F;
          F.claimTrip(1);
          return !S.trip.cur && S.trip.been[id] === 1 && S.trip.souv.filter(k => k.startsWith(id + ':')).length === 1;
        }""", dest), f'{width}: {dest} 귀환 보상은 한 번만 받아요')
        await close_reward(page)


async def assistants(browser, c):
    seed = base(tier=5, tg=0, sem=1)
    seed['f']['institute'] = 1
    ctx, page, errors = await ctxpage(browser, 390, 800, 'light', seed)
    await page.evaluate(CLEAN)
    await page.evaluate("""() => {
      const F = window.__forest, {S,rt4} = F;
      rt4.fakeNow = Date.parse('2026-11-27T03:30:00Z');
      S.ta.out = [0,1].map(i => ({i, to:0, h:0, end:F.gameNow()-100}));
      F.openRx();
    }""")
    await page.locator('[data-rseg="ta"]').click()
    button = page.locator('[data-ta="claim"]')
    if c.ok(await button.count() == 1, '조교 탭에서 받기 단추가 하나만 보여요'):
        c.ok('모두 받기' in await button.inner_text(), '조교가 여럿 돌아오면 모두 받기 단추')
        await button.click()
        c.ok(await page.evaluate('window.__forest.S.ta.out.length === 0 && !window.__forest.taClaim()'),
             '마친 파견만 한 번에 정산해요')
    c.ok(not errors, f'조교 탭 오류 {errors[:4]}')
    await ctx.close()


async def main():
    c = Checker()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width, theme in ((360, 'dark'), (390, 'light')):
            ctx, page, errors = await ctxpage(browser, width, 800, theme, base(tier=1, tg=3))
            await page.emulate_media(reduced_motion='reduce')
            await page.evaluate(CLEAN)
            await batches(page, c, width)
            await expedition(page, c, width)
            await travel(page, c, width)
            c.ok(not errors, f'{width}: 브라우저 오류 {errors[:4]}')
            await ctx.close()
        await assistants(browser, c)
        await browser.close()
    c.done()


asyncio.run(main())
