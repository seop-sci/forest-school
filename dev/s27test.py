import asyncio, json, subprocess, time
from playwright.async_api import async_playwright
import s7test as T
from s7test import device, api, dump, HERE, PORT
async def main():
    srv = subprocess.Popen(['node', str(HERE/'fbtest'/'fbserver.js'), str(HERE/'gh'), str(PORT), str(HERE/'gh_database.rules.json')], stdout=subprocess.PIPE)
    time.sleep(1); r = {}
    try:
        api('/__seed', {'reset': True})
        async with async_playwright() as p:
            b = await p.chromium.launch()
            sv = T.base(gold=40, rank={'name': '용감한 수달', 'joined': True, 'sent': -1, 'by': '', 'asked': True})
            ctx, pg, errs, _ = await device(b, seed=sv)
            await pg.wait_for_timeout(4000)
            await pg.evaluate("document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')})")
            d0 = dump().get('forest', {})
            r['before'] = {k: list(v.keys()) for k, v in d0.items()}
            await pg.evaluate("document.querySelector('.tab[data-tab=settings]').click()"); await pg.wait_for_timeout(600)
            r['row'] = await pg.evaluate("!document.querySelector('#delRow').hidden")
            await pg.evaluate("document.querySelector('#optDel').click()"); await pg.wait_for_timeout(200)
            await pg.screenshot(path='s27_del.png')
            await pg.evaluate("document.querySelector('#delYes').click()"); await pg.wait_for_timeout(5000)
            d1 = dump().get('forest', {})
            r['after'] = {k: list(v.keys()) for k, v in d1.items()}
            r['toasts'] = await pg.evaluate("sessionStorage.getItem('__toasts')")
            r['gold'] = await pg.evaluate("document.querySelector('#goldN').textContent")
            r['errors'] = errs; await b.close()
    finally:
        srv.kill()
    print(json.dumps(r, ensure_ascii=False, indent=1))
asyncio.run(main())
