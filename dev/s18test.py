import asyncio, json, subprocess, time
from playwright.async_api import async_playwright
import s7test as T
from s7test import device, api, dump, HERE, PORT
async def main():
    srv = subprocess.Popen(['node', str(HERE/'fbtest'/'fbserver.js'), str(HERE/'gh'), str(PORT), str(HERE/'gh_database.rules.json')], stdout=subprocess.PIPE)
    time.sleep(1); out = {}
    try:
        api('/__seed', {'reset': True, 'path': 'forest/rank/other1', 'value': {'name': '졸린 다람쥐', 'score': 50, 'at': 1, 'tier': 0, 'year': 1}})
        async with async_playwright() as p:
            b = await p.chromium.launch()
            # 3장을 막 마친 학교 (q16 차례), 황금 도토리 120
            sv = T.base(gold=120, q=T.Q('q16', 16), rank={'name': '', 'joined': False, 'sent': -1, 'by': ''})
            ctx, pg, errs, _ = await device(b, seed=sv)
            await pg.wait_for_timeout(2500)
            r = {'modal': await pg.evaluate("!document.querySelector('#mNick').hidden"), 'name0': await pg.evaluate("document.querySelector('#nickName').value")}
            await pg.screenshot(path='s18_nick.png')
            await pg.click('#nickDice'); await pg.wait_for_timeout(300)
            r['dice'] = await pg.evaluate("document.querySelector('#nickName').value")
            await pg.fill('#nickName', '졸린 다람쥐'); await pg.click('#nickOk'); await pg.wait_for_timeout(800)
            r['dup'] = await pg.evaluate("[!document.querySelector('#mNick').hidden, document.querySelector('#toast').textContent]")
            await pg.fill('#nickName', '용감한 수달'); await pg.click('#nickOk'); await pg.wait_for_timeout(1500)
            r['ok'] = await pg.evaluate("[!document.querySelector('#mNick').hidden, document.querySelector('#toast').textContent]")
            await pg.wait_for_timeout(1500)
            d = dump()['forest']['rank']
            r['server'] = {k: v['name'] for k, v in d.items()}
            await pg.tap('.tab[data-tab="school"]'); await pg.tap('.tab[data-tab="rank"]')  # 1.5.0: 랭킹은 홈 지도 오른쪽 단추; await pg.wait_for_timeout(600)
            await pg.evaluate("document.querySelector('[data-rank=edit]').click()"); await pg.wait_for_timeout(200)
            r['edit'] = await pg.evaluate("document.querySelector('#rankJoin').innerText")
            await pg.screenshot(path='s18_rank_edit.png')
            await pg.evaluate("document.querySelector('[data-rank=dice]').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('#rankJoin form').requestSubmit()"); await pg.wait_for_timeout(1500)
            r['renamed'] = await pg.evaluate("[document.querySelector('#rankJoin').innerText, document.querySelector('#goldN').textContent]")
            await pg.evaluate("document.querySelector('[data-rank=edit]').click()"); await pg.wait_for_timeout(200)
            r['price2'] = await pg.evaluate("document.querySelector('#rankJoin .cta').textContent")
            await pg.evaluate("document.querySelector('[data-rank=dice]').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('#rankJoin form').requestSubmit()"); await pg.wait_for_timeout(800)
            r['poor'] = await pg.evaluate("[document.querySelector('#toast').textContent, document.querySelector('#goldN').textContent]")
            await pg.reload(); await pg.wait_for_timeout(2500)
            r['noAskAgain'] = await pg.evaluate("document.querySelector('#mNick').hidden")
            r['errors'] = errs; out['gh'] = r; await ctx.close()
            # 아직 3장을 안 마친 학교는 묻지 않아요
            ctx, pg, errs, _ = await device(b, seed=T.base(q=T.Q('q12', 12), rank={'name': '', 'joined': False, 'sent': -1, 'by': ''}))
            await pg.wait_for_timeout(2500)
            out['early'] = [await pg.evaluate("document.querySelector('#mNick').hidden"), errs]
            await ctx.close(); await b.close()
    finally:
        srv.kill()
    print(json.dumps(out, ensure_ascii=False, indent=1))
    # 2026-10-30: 통과 판정(2.1.0부터 이름 바꾸기 값은 5, 6, 7 …)
    g = out.get('gh', {}); ok = g.get('modal') and g.get('dup', [0])[0] and g.get('ok', [1])[0] is False and '용감한 수달' in g.get('server', {}).values() and g.get('price2') == '6 바꾸기' and g.get('noAskAgain') and not g.get('errors') and out.get('early', [0])[0] and not out['early'][1]
    print('PASS' if ok else 'FAIL')
asyncio.run(main())
