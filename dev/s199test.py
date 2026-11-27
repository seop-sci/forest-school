# 시냇가 체험학습 경로, 새로고침과 단축/귀환, 예전 저장 및 관찰 기록 수집.
import asyncio

from playwright.async_api import async_playwright
from testlib import CLEAN, Checker, base, ctxpage


async def open_trip(page):
    await page.evaluate("window.__forest.openTrip()")
    await page.locator('#mTrip').wait_for(state='visible')


# 다시 읽기: 시험 틀이 처음 저장을 다시 심는 일이 가끔 있어(file 주소의 sessionStorage) 지금 저장을 window.name에 실어 다시 넣어요
KEEP = "if(window.name.startsWith('fs-keep:')){localStorage.setItem('forest-school-v1', window.name.slice(8)); window.name='';}"


async def reload_keep(page):
    await page.evaluate("() => { window.name = 'fs-keep:' + localStorage.getItem('forest-school-v1'); }")
    await page.reload()


async def main():
    check = Checker()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width, scheme, key, title, label in (
            (360, 'dark', 'stones', '징검다리 발자국', '징검다리를 건너는 중'),
            (390, 'light', 'bank', '갈대밭의 송사리', '갈대밭에서 송사리를 찾는 중'),
        ):
            ctx, page, errors = await ctxpage(browser, width, 780, scheme, base(tier=1, tg=2))
            await ctx.add_init_script(KEEP)
            if width == 390:
                await page.emulate_media(reduced_motion='reduce')
            await page.evaluate(CLEAN)
            await open_trip(page)
            entry = page.locator('[data-trip="creek"]')
            await entry.click()
            depart = page.locator('#tripCreekGo')
            check.ok(await depart.is_disabled(), f'{width}: 경로를 골라야 출발')
            await page.locator(f'input[name="creekRoute"][value="{key}"]').check()
            scene = page.locator('#tripCreekScene')
            check.ok(await scene.get_attribute('data-route') == key, f'{width}: 경로에 맞춰 장면 이동')
            bounds = await scene.bounding_box()
            check.ok(bounds['x'] >= 0 and bounds['x'] + bounds['width'] <= width,
                     f'{width}: 시냇가 그림이 화면 안에 있어요')
            check.ok(await scene.locator('img').evaluate('img => img.complete && img.naturalWidth > 0'),
                     f'{width}: 배경 그림이 실제로 표시돼요')
            await depart.click()
            await page.locator('#mTrip').wait_for(state='hidden')
            saved = await page.evaluate("""() => {
              const {S} = window.__forest;
              return [S.trip.cur, S.trip.creekRoute, S.trip.end - S.trip.start, S.trip.creekLog];
            }""")
            check.ok(saved == ['creek', key, 3600000, []], f'{width}: 출발 시간과 경로만 저장 {saved}')

            await reload_keep(page)
            await page.evaluate(CLEAN)
            await page.evaluate("""() => {
              const {S, rt4} = window.__forest;
              rt4.fakeNow = S.trip.start + 1800000;
            }""")
            await open_trip(page)
            phase = page.locator('#tripCreekPhase')
            check.ok(await phase.text_content() == label, f'{width}: 다시 읽기 뒤 경로별 이동 단계')
            check.ok(float(await scene.evaluate("el => el.style.getPropertyValue('--journey')")) == .5,
                     f'{width}: 버스와 풍경이 경과 시간에 맞춰 움직여요')
            if width == 390:
                check.ok(await page.locator('.tr-journey-light').evaluate('el => getComputedStyle(el).animationName') == 'none',
                         f'{width}: 모션 줄이기에서는 물빛 움직임도 멈춰요')

            await page.evaluate("""() => {
              const {S, rt4} = window.__forest;
              rt4.fakeNow = S.trip.end + 1;
            }""")
            await page.locator('#tripGet').wait_for(state='visible')
            check.ok(await page.locator('.tr-creek-record b').text_content() == title,
                     f'{width}: 돌아온 경로에 맞는 기록')
            await page.locator('#tripGet').click()
            result = await page.evaluate("""() => {
              const F = window.__forest, {S} = F;
              F.claimTrip(1);
              const d = JSON.parse(JSON.stringify(S));
              d.trip = {cur: 'creek', start: Date.now() - 60000, end: Date.now() + 360000,
                        souv: ['creek:0'], been: {creek: 3}};
              const old = F.sanitize(d).trip;
              d.trip.creekRoute = '__proto__';
              d.trip.creekLog = ['bank','bank','stones','bogus'];
              const clean = F.sanitize(d).trip;
              return {now:[S.trip.cur, S.trip.creekRoute, S.trip.creekLog, S.trip.souv.length, S.trip.been.creek],
                old:[old.cur, old.creekRoute, old.creekLog, old.souv, old.been.creek],
                clean:[clean.creekRoute, clean.creekLog]};
            }""")
            check.ok(result['now'] == ['', '', [key], 1, 1], f'{width}: 기록과 원래 귀환 보상은 한 번만 {result}')
            check.ok(result['old'] == ['creek', '', [], ['creek:0'], 3],
                     f'{width}: 옛 저장의 진행 중 여행과 기념품을 보존')
            check.ok(result['clean'] == ['', ['stones', 'bank']], f'{width}: 알 수 없는 경로와 중복 기록 제거')
            await reload_keep(page)
            await page.evaluate(CLEAN)
            await open_trip(page)
            await page.locator('.tr-creek-album summary').click()
            check.ok(await page.locator('.tr-creek-album .tr-creek-record b').text_content() == title,
                     f'{width}: 명확한 기록 제목으로 다시 열 수 있어요')
            check.ok(not errors, f'{width}: 브라우저 오류 {errors[:4]}')
            await ctx.close()
        await browser.close()
    check.done()


asyncio.run(main())
