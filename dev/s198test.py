# 들꽃 운동장 10층: 경고를 읽고 필살기로 막기, 자동 대응, 일반 공격과 반복 탐험.
import asyncio

from playwright.async_api import async_playwright
from testlib import CLEAN, Checker, base, ctxpage


async def play_and_sample(page, kind, actor):
    return await page.evaluate("""async ([kind, actor]) => {
      const F = window.__forest;
      if (kind === 'run') document.querySelector('#tmSk button.ready').click();
      else {
        Object.assign(F.S.tam, {best: 9, party: [actor]});
        F.tamPh(F.rt4.tam, 'meet');
      }
      const selector = `#tmP [data-actor="${actor}"][data-frames="${kind}"] [data-atlas="${kind}"] img`;
      const deadline = performance.now() + (kind === 'run' ? 900 : 9000);
      const positions = new Set();
      while (performance.now() < deadline && positions.size < 2) {
        const sprite = document.querySelector(selector);
        if (sprite) positions.add(getComputedStyle(sprite).transform);
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      return [...positions];
    }""", [kind, actor])


async def main():
    c = Checker()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width, scheme, motion in ((360, 'dark', 'no-preference'), (390, 'light', 'reduce')):
            ctx, page, errors = await ctxpage(browser, width, 740, scheme, base())
            await page.emulate_media(reduced_motion=motion)
            await page.evaluate(CLEAN)
            normal_motion = motion == 'no-preference'
            running = await page.evaluate("""async motion => {
              const F = window.__forest;
              Object.assign(F.S.tam, { best: 9, seen: 1, auto: 0 });
              F.setTab('tam');
              F.tamPh(F.rt4.tam, 'walk');
              if (!motion) return [];
              const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
              const seen = Object.fromEntries(['bear', 'rabbit', 'fox'].map(sp => [sp, new Set()]));
              for (let i = 0; i < 25 && F.rt4.tam.ph === 'walk'; i++) {
                for (const pic of document.querySelectorAll('#tmP [data-frames="run"] [data-atlas="run"] img')) {
                  seen[pic.closest('[data-actor]').dataset.actor].add(getComputedStyle(pic).transform);
                }
                if (Object.values(seen).every(frames => frames.size >= 2)) break;
                await sleep(22);
              }
              return Object.fromEntries(Object.entries(seen).map(([sp, frames]) => [sp, frames.size]));
            }""",normal_motion)
            if normal_motion:
                c.ok(all(count >= 2 for count in running.values()), f'세 대원이 진입할 때 각자 발 자세가 바뀌어요 {running}')
            else:
                c.ok(not await page.locator('#tmP .tm-frame-art').first.is_visible(), '모션 줄이기에서는 정지 그림으로 보여요')
            warning = page.locator('#tmWind')
            await warning.wait_for(state='visible')
            skill = page.locator('#tmSk button.ready').first
            c.ok(await skill.count() == 1, f'{width}: 쓸 수 있는 필살기')
            c.ok(await page.locator('#tmP .wind-target').count() == 1, f'{width}: 앞줄 발밑 표시')
            bounds = await warning.bounding_box()
            skill_bounds = await skill.bounding_box()
            c.ok(bounds['x'] >= 0 and bounds['x'] + bounds['width'] <= width
                 and bounds['y'] + bounds['height'] < skill_bounds['y'], f'{width}: 경고와 조작 버튼 배치')
            if normal_motion:
                c.ok(len(await play_and_sample(page, 'run', 'bear')) >= 2, '꽃바람 대응을 위해 돌진할 때도 달리기 그림이 나와요')
            else:
                await skill.click()
            await page.get_by_text('꽃바람을 막았어요!', exact=True).wait_for(state='visible')
            c.ok(await warning.is_hidden() and not await page.locator('#tmP .wind-target').count(),
                 f'{width}: 대응 후 경고 제거')
            c.ok(await page.locator('#tmCut').is_hidden(), f'{width}: 대응 연출 중 전장 유지')
            results = await page.evaluate("""() => {
              const F = window.__forest, rnd = () => .5;
              const check = (floor, auto, hm, rep) => {
                const fight = F.tamFight(floor, F.tamTeam(), 1, null, hm, rep);
                const events = [];
                let result = 0;
                while (!result) {
                  result = F.tamStep(fight, .1, auto, rnd);
                  events.push(...fight.ev);
                  fight.ev.length = 0;
                }
                return [events.filter(e => e.k === 'wind').length,
                  events.filter(e => e.counter).length,
                  events.filter(e => e.k === 'hurt' && e.wind).length, result];
              };
              return [check(10, false), check(10, true),
                check(9, true), check(20, true), check(10, true, true), check(10, true, false, true)];
            }""")
            c.ok(results[0][:3] == [1, 0, 1], f'{width}: 대응하지 않으면 꽃바람이 한 번 닿아요')
            c.ok(results[1][:3] == [1, 1, 0], f'{width}: 자동은 꽃바람을 한 번 막아요')
            c.ok(all(r[:3] == [0, 0, 0] for r in results[2:]),
                 f'{width}: 일반 층, 다른 보스, 심화, 반복에는 꽃바람이 없어요')
            c.ok(all(r[3] in (1, -1) for r in results), f'{width}: 모든 경우 결판')
            if normal_motion:
                await page.wait_for_function('!window.__forest.tamSkBusy()')
                for actor in ('bear', 'rabbit', 'fox'):
                    c.ok(len(await play_and_sample(page, 'recoil', actor)) >= 2, f'맞은 {actor}가 움츠린 뒤 다시 자세를 잡아요')
                    await page.locator(f'#tmP [data-actor="{actor}"][data-frames="recoil"]').wait_for(state='hidden', timeout=1200)
            c.ok(not errors, f'{width}: 브라우저 오류 {errors}')
            await ctx.close()
        await browser.close()
    c.done()


asyncio.run(main())
