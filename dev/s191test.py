# 191번 시험(5.4.0.3): 컴팩트 키우기 0단계 시제품(개발자 스위치 'forest-proto')
# 1) 꺼 두면(기본) 홈에 키우기 띠가 없고 탐험 이름은 종 이름 그대로
# 2) 켜면 홈 아래 키우기 띠: 탐험 대원 얼굴과 단짝 이름, 도전 층, 추천 강화, 합치기. 홈 UI 아래 기준(--bot-h)이 띠 위로 올라가요
# 3) 추천 강화를 누르면 탐험 화면의 추천 강화와 같은 대원이 한 레벨 올라요(도토리가 줄고), 모자라면 올라가지 않아요
# 4) 얼굴을 누르면 탐험 탭, 탐험 화면에서도 단짝 이름. 합치기를 누르면 합치기 화면
# 5) 다른 탭과 합치기 안에서는 띠가 숨어요. 360px, 390px 넘침 없음
import asyncio
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, OVER
c = Checker()
FR = lambda nm: {'nm': nm, 'bm': 3, 'bd': 4, 'p': 0, 'pat': '', 'n': {'pc': 0, 'bd': 0, 'el': 0}}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, th in ((360, 'light'), (390, 'dark')):
            ctx, pg, errs = await ctxpage(b, w, 800, th, base(tier=1, students=110))
            await pg.wait_for_timeout(1300); await pg.evaluate(CLEAN)
            r0 = await pg.evaluate("""async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              S.fr.bear = { nm: '꿀떡', bm: 3, bd: 4, p: 0, pat: '', n: { pc: 0, bd: 0, el: 0 } };
              await sl(700); o.band = !document.querySelector('#kbBand').hidden; o.nm = F.tamNm('bear'); o.bot = parseInt(getComputedStyle(document.querySelector('#app')).getPropertyValue('--bot-h'));
              localStorage.setItem('forest-proto', '1'); await sl(900);
              const k = document.querySelector('#kbBand'); o.on = !k.hidden; o.kids = [...k.querySelectorAll('.kb-kid b')].map(x => x.textContent); o.fl = k.querySelector('.kb-fl').textContent;
              o.bot2 = parseInt(getComputedStyle(document.querySelector('#app')).getPropertyValue('--bot-h')); o.bandH = Math.round(k.getBoundingClientRect().height);
              o.nm2 = F.tamNm('bear');
              // 추천 강화: 모자라면 그대로
              const R = F.tamUpRec().mem; o.rsp = R.sp; const lv0 = F.tamMem(R.sp).lv;
              S.budget = 0; await sl(700); k.querySelector('[data-kb=up]').click(); await sl(100); o.poor = F.tamMem(R.sp).lv === lv0;
              S.budget = R.c * 3; await sl(700); const b0 = S.budget; k.querySelector('[data-kb=up]').click(); await sl(200);
              o.up = F.tamMem(R.sp).lv === lv0 + 1 && (b0 - S.budget) > R.c * 0.5;   // 그 사이 수업료가 들어와서 줄어든 양은 값보다 조금 작아요
              return o; }""")
            await pg.screenshot(path=f'shots/s191_home_{w}.png')
            over = await pg.evaluate(OVER, '#kbBand, #kbBand *')
            print(w, r0)
            c.ok(not r0['band'] and r0['nm'] != '꿀떡', f'[{w}] 꺼 두면 띠가 없고 이름은 종 이름 {r0["nm"]}')
            c.ok(r0['on'] and '꿀떡' in r0['kids'] and '도전' in r0['fl'] and r0['nm2'] == '꿀떡', f'[{w}] 켜면 띠와 단짝 이름 {r0["kids"]}')
            c.ok(r0['bot2'] >= r0['bot'] + r0['bandH'] - 4, f'[{w}] 홈 아래 기준이 띠 위로 ({r0["bot"]} → {r0["bot2"]}, 띠 {r0["bandH"]})')
            c.ok(r0['poor'] and r0['up'], f'[{w}] 추천 강화: 모자라면 그대로, 있으면 한 레벨과 그 값')
            c.ok(not over, f'[{w}] 띠가 넘치지 않아요 {over}')
            r1 = await pg.evaluate("""async()=>{ const F = window.__forest, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
              document.querySelector('#kbBand [data-kb=tam]').click(); await sl(900);
              o.tab = F.rt.tab; o.hid = document.querySelector('#kbBand').hidden; o.tm = document.querySelector('#tmBody') ? document.querySelector('#tmBody').textContent.includes('꿀떡') : false;
              F.setTab('school'); await sl(800); o.back = !document.querySelector('#kbBand').hidden;
              document.querySelector('#kbBand [data-kb=mg]').click(); await sl(700);
              o.mg = !document.querySelector('#mgScene').hidden; o.hidMg = document.querySelector('#kbBand').hidden;
              document.querySelector('#mgBack').click(); await sl(700); o.back2 = !document.querySelector('#kbBand').hidden;
              localStorage.setItem('forest-proto', '0'); await sl(800); o.off = document.querySelector('#kbBand').hidden && F.tamNm('bear') !== '꿀떡';
              return o; }""")
            print(w, r1)
            c.ok(r1['tab'] == 'tam' and r1['hid'] and r1['tm'], f'[{w}] 얼굴을 누르면 탐험 탭, 띠는 숨고 탐험 화면에 단짝 이름')
            c.ok(r1['back'] and r1['mg'] and r1['hidMg'] and r1['back2'], f'[{w}] 홈으로 오면 띠, 합치기 단추로 합치기 화면(띠는 숨음)')
            c.ok(r1['off'], f'[{w}] 다시 끄면 띠가 없고 종 이름')
            c.ok(not errs, f'[{w}] 오류 없음 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
