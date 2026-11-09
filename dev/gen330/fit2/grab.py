import asyncio, json, sys, base64
sys.path.insert(0, '/home/claude/work/forest-school/dev'); sys.path.insert(0,'/home/claude/prof')
from playwright.async_api import async_playwright
from s4test import URL
F='window.__forest'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        out={}
        for t, yr in ((0,1),(1,6),(2,3),(3,3)):
            r = await pg.evaluate(f"""() => {{ const F = {F}, S = F.S; S.tier = {t}; S.year = {yr}; S.bs = {{}};
              for (const k of F.facKeys()) {{ S.f[k] = 30; S.bs[k] = {t}; }} S.bd = {{}}; F.setTab('school'); F.renderMap();
              const o={{}}; document.querySelectorAll('[id^="b-"]').forEach(g=>{{ const im=g.querySelector('.built .bimg')||g.querySelector('.bimg'); if(!im||g.style.display==='none') return;
                o[g.id]={{href:im.getAttribute('href'),x:+im.getAttribute('x'),y:+im.getAttribute('y'),w:+im.getAttribute('width')}}; }}); return o; }}""")
            out[t]=r
        json.dump(out,open('grab.json','w'))
        await b.close()
asyncio.run(main())
