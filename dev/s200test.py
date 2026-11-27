# 퀘스트 탭, 전투 설정, 지역 보스의 대응과 원래 전투 호환.
import asyncio

from playwright.async_api import async_playwright
from testlib import CLEAN, Checker, base, ctxpage


async def main():
    c = Checker()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((360, 'dark'), (390, 'light')):
            ctx, page, errors = await ctxpage(b, w, 790, scheme, base(tier=1, tg=3))
            await page.evaluate(CLEAN)
            await page.evaluate("window.__forest.setTab('quests')")
            c.ok(await page.locator('#qViewMain .qcard').first.is_visible() and
                 not await page.locator('#qViewDaily').is_visible(), f'{w}: 처음에는 메인 목표가 보여요')
            await page.locator('[data-q-view="subs"]').click()
            c.ok(await page.locator('#qViewSubs').is_visible() and not await page.locator('#qViewMain').is_visible(),
                 f'{w}: 학생 부탁을 따로 열어요')
            await page.evaluate("window.__forest.missionGo('daily')")
            c.ok(await page.locator('#qViewDaily').is_visible() and not await page.locator('#qViewSubs').is_visible(),
                 f'{w}: 미션 바로 가기가 미션을 열어요')
            c.ok(await page.locator('.q-switch').evaluate('el => el.scrollWidth <= el.clientWidth'),
                 f'{w}: 퀘스트 종류 칸이 넘치지 않아요')
            results = await page.evaluate("""() => {
              const F = window.__forest, team = F.tamTeam().map(p => ({...p, hp: 1e20, atk: 1}));
              const sample = (fl, auto, hm=false, rep=false) => {
                const battle = F.tamFight(fl, team, 1, null, hm, rep);
                const stats = { cues: 0, interrupted: false, hits: [], delay: 0, braced: false };
                for (let i=0; i<160; i++) {
                  const a = battle.P[0], before = a.c;
                  F.tamStep(battle, .1, auto, () => .5);
                  stats.cues += battle.ev.filter(e => e.k === 'wind').length;
                  if (battle.ev.some(e => e.counter)) stats.interrupted = true;
                  const result = battle.ev.find(e => e.k === 'wind-hit');
                  if (result) {
                    stats.braced = result.braced;
                    stats.hits = battle.ev.filter(e => e.k === 'hurt' && e.wind).map(e => e.d);
                    stats.delay = a.c - (before - .1 + (before <= .1 ? a.cd : 0));
                    return stats;
                  }
                  battle.ev.length = 0;
                }
                return stats;
              };
              return [sample(60,false),sample(60,true),sample(110,false),sample(110,true),
                sample(60,false,true),sample(110,false,false,true),sample(70,false)];
            }""")
            spores, interrupt, wave, guard, *old = results
            c.ok(spores['cues'] == 1 and len(spores['hits']) == 1 and abs(spores['delay'] - 1.2) < .01,
                 f'{w}: 포자는 앞줄을 잠깐 느리게 해요 {spores}')
            c.ok(interrupt['cues'] == 1 and interrupt['interrupted'] and not interrupt['hits'],
                 f'{w}: 자동 필살기는 포자를 끊어요 {interrupt}')
            c.ok(wave['cues'] == 1 and len(wave['hits']) == 3 and not wave['braced'] and
                 guard['braced'] and len(guard['hits']) == 3 and abs(sum(guard['hits']) / sum(wave['hits']) - .35) < .01,
                 f'{w}: 물결은 여러 대원을 맞히고 받아내면 피해를 줄여요')
            c.ok(all(not r['cues'] for r in old), f'{w}: 심화·되풀이·나머지 층은 원래 전투')
            await page.evaluate("""() => {
              const F=window.__forest;
              Object.assign(F.S.tam,{best:109,seen:1,auto:0,it:F.gameNow(),party:['bear','rabbit','fox']});
              for(const p of F.tamTeam()) F.tamMem(p.sp).lv=155;
              F.setTab('tam');
              F.tamPh(F.rt4.tam,'meet');
            }""")
            control = page.locator('#tmControls')
            c.ok(not await page.locator('#tmSpd').is_visible(), f'{w}: 배속은 기본으로 접혀 있어요')
            await control.click()
            c.ok(await page.locator('#tmSpd').is_visible(), f'{w}: 전투 설정에서 배속에 접근할 수 있어요')
            warning = page.locator('#tmWind[data-trial="wave"]')
            await warning.wait_for(timeout=12000)
            c.ok(not await page.locator('#tmActions').is_visible(), f'{w}: 공격 예고가 열리면 설정이 닫혀요')
            c.ok(await page.locator('#tmP .wind-target').count() == 3, f'{w}: 물결 범위가 대원 셋에게 표시돼요')
            await page.locator('#tmBrace').click()
            await page.get_by_text('물결을 받아냈어요!', exact=True).wait_for(timeout=5000)
            c.ok(not errors, f'{w}: 브라우저 오류 {errors}')
            await ctx.close()
        await b.close()
    c.done()


asyncio.run(main())
