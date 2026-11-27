# 160·210·260층의 자동·수동 대응, 대상 범위, 미대응과 되풀이/심화.
import asyncio

from playwright.async_api import async_playwright
from testlib import CLEAN, OVER, Checker, base, ctxpage


async def simulate(page, c):
    cases = await page.evaluate("""() => {
      const F = window.__forest;
      const team = F.tamTeam().map(p => ({ ...p, hp: 1e50, atk: 1 }));
      function play(floor, auto, party=team, hm=false, rep=false) {
        const B = F.tamFight(floor, party, 1, null, hm, rep);
        const out = {tells:0, answer:0, counter:0, links:0, hits:[], guarded:false};
        for (let i=0; i<130; i++) {
          F.tamStep(B, .1, auto, () => .1);
          for (const e of B.ev) {
            if (e.k === 'wind') out.tells++;
            if (e.k === 'wind-answer') out.answer++;
            if (e.counter) out.counter++;
            if (e.k === 'wind-link') out.links++;
            if (e.k === 'wind-hit') out.guarded = e.braced;
            if (e.k === 'hurt' && e.wind) out.hits.push([e.p,e.d]);
          }
          B.ev.length = 0;
        }
        return out;
      }
      return {book:play(160,true), bookMiss:play(160,false), frost:play(210,true), frostMiss:play(210,false),
        stars:play(260,true), starsMiss:play(260,false), solo:play(260,true,team.slice(0,1)),
        old:[play(160,true,team,true),play(210,true,team,false,true),play(270,true)]};
    }""")
    book, frost, stars = (cases[k] for k in ('book', 'frost', 'stars'))
    c.ok(book['tells'] == 1 and book['answer'] == 1 and not book['hits'] and
         [x[0] for x in cases['bookMiss']['hits']] == [0], '책 표식 자동 정답, 미대응은 앞줄 한 명 피격')
    damage = sum(x[1] for x in frost['hits']) / sum(x[1] for x in cases['frostMiss']['hits'])
    c.ok(frost['tells'] == 1 and frost['guarded'] and len(frost['hits']) == 3 and abs(damage - .35) <= .0001 and
         not cases['frostMiss']['guarded'], '눈보라 자동 방어, 팀 전체 피해가 65% 줄어요')
    c.ok(stars['tells'] == 1 and stars['counter'] == 1 and stars['links'] == 1 and not stars['hits'] and
         [x[0] for x in cases['starsMiss']['hits']] == [2], '별똥별은 두 대원이 끊어요. 미대응이면 뒷줄 한 명 피격')
    c.ok(cases['solo']['counter'] == 1 and not cases['solo']['links'] and not cases['solo']['hits'],
         '혼자 출전하면 필살기 하나로 별똥별을 막아요')
    c.ok(all(not x['tells'] for x in cases['old']), '되풀이와 심화, 일반 270층의 전투는 기존과 같아요')


async def enter(page, floor, key, solo=False):
    await page.evaluate("""([floor, key, solo]) => {
      const F = window.__forest, {S,rt4} = F;
      rt4.paused = false;
      rt4.fakeNow = Date.parse('2026-11-27T03:30:00Z');
      Object.assign(S, {tier: floor === 160 ? 1 : 2, tg: floor === 160 ? 5 : floor === 210 ? 1 : 2, sem: floor === 260 ? 0 : 1});
      Object.assign(S.tam, {best:floor-1, seen:1, auto:0, hm:0, it:F.gameNow(), party:solo ? ['bear'] : ['bear','rabbit','fox']});
      F.setTab('tam');
      const battle = rt4.tam;
      battle.pend = 0; battle.ev = null; battle.mod = null;
      F.tamPh(battle, 'meet');
      battle.F.P.forEach(p => { p.atk = battle.F.M[0].mx / 60; p.hp = p.mx = 8 * battle.F.M[0].atk; });
      battle.F.M[0].c = .05; battle.F.t = 3;
      const card = document.querySelector('#tmWind');
      const pause = new MutationObserver(() => {
        if (card.hidden || card.dataset.trial !== key) return;
        rt4.paused = true;
        pause.disconnect();
      });
      pause.observe(card, {attributes:true});
    }""", [floor, key, solo])
    card = page.locator(f'#tmWind[data-trial="{key}"]')
    await card.wait_for(timeout=8000)
    return card


async def manual(page, c, width):
    card = await enter(page, 160, 'book')
    c.ok(not await page.evaluate(OVER, '#tmWind,#tmWindSigns') and
         await page.locator('#tmP .wind-target').count() == 1, f'{width}: 책 예고와 앞줄 표시가 보여요')
    hint = await card.locator('#tmWindHint').inner_text()
    sign = 'leaf' if '‘잎’' in hint else 'star'
    if width == 360:
        wrong = 'star' if sign == 'leaf' else 'leaf'
        await card.locator(f'[data-tam-sign="{wrong}"]').tap(timeout=2500)
        c.ok(await card.locator(f'[data-tam-sign="{sign}"]').is_disabled(), '틀린 표식을 고르면 두 번째 선택은 닫혀요')
        await page.evaluate('window.__forest.rt4.paused = false')
        await page.get_by_text('책장이 앞줄을 덮쳤어요', exact=True).wait_for(timeout=7000)
        card = await enter(page, 160, 'book')
        sign = 'leaf' if '‘잎’' in await card.locator('#tmWindHint').inner_text() else 'star'
    await card.locator(f'[data-tam-sign="{sign}"]').tap(timeout=2500)
    await page.get_by_text('책장이 제자리로 돌아갔어요!', exact=True).wait_for(timeout=4500)

    card = await enter(page, 210, 'frost')
    brace = card.locator('#tmBrace')
    if width == 360:
        await brace.evaluate('b => b.click()')
        c.ok(await brace.inner_text() == '발 맞추기', '금빛 구간에 들기 전에 누르면 아직 방어하지 않아요')
    await card.evaluate("""card => {
      const rt = window.__forest.rt4;
      const pause = new MutationObserver(() => {
        if (!card.classList.contains('in-time')) return;
        rt.paused = true;
        pause.disconnect();
      });
      pause.observe(card, {attributes:true, attributeFilter:['class']});
      rt.paused = false;
    }""")
    await card.get_by_text('지금 발을 맞춰요!', exact=True).wait_for(timeout=3500)
    await brace.tap(timeout=2500)
    c.ok(not await page.evaluate(OVER, '#tmWind') and await page.locator('#tmP .wind-guarded').count() == 3,
         f'{width}: 눈보라 시간에 맞춰 대원 모두가 방어해요')
    await page.evaluate('window.__forest.rt4.paused = false')
    await page.get_by_text('눈보라를 버텼어요!', exact=True).wait_for(timeout=5500)

    solo = width == 390
    card = await enter(page, 260, 'stars', solo)
    c.ok(not await page.evaluate(OVER, '#tmWind') and
         await page.locator('#tmP .tm-f').last.evaluate("el => el.classList.contains('wind-target')"),
         f'{width}: 별똥별 예고는 뒤에 있는 대원을 가리켜요')
    await page.locator('#tmSk [data-tsk="0"].ready').tap(timeout=2500)
    if not solo:
        await card.get_by_text('필살기 1/2', exact=False).wait_for(timeout=1500)
        c.ok(await page.locator('#tmP .wind-linked').count() == 1, '첫 번째 필살기와 연결된 대원이 표시돼요')
        await page.locator('#tmSk [data-tsk="1"].ready').tap(timeout=1900)
    result = '필살기로 별똥별을 흩뜨렸어요!' if solo else '필살기를 이어 별똥별을 흩뜨렸어요!'
    await page.evaluate('window.__forest.rt4.paused = false')
    await page.get_by_text(result, exact=True).wait_for(timeout=6000)


async def main():
    c = Checker()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width, theme in ((360, 'dark'), (390, 'light')):
            ctx, page, errors = await ctxpage(browser, width, 790, theme, base(tier=2, tg=1))
            if width == 390:
                await page.emulate_media(reduced_motion='reduce')
            await page.evaluate(CLEAN)
            if width == 360:
                await simulate(page, c)
            await manual(page, c, width)
            c.ok(not errors, f'{width}: 브라우저 오류 {errors[:5]}')
            await ctx.close()
        await browser.close()
    c.done()


asyncio.run(main())
