# 4.4.2 학생 걷는 길: 시험 페이지(test.html)에서 지도 자리 표(GEO)를 꺼내 paths/geo.json에 적어요. gen.py가 이 파일을 읽어요
import asyncio, json, sys
import pathlib; sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent)); import os; os.chdir(pathlib.Path(__file__).resolve().parent.parent)
from playwright.async_api import async_playwright
from s4test import URL
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();"); pg=await ctx.new_page()
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        d=await pg.evaluate("()=>window.__forest.GEO.map(G=>({map:G.map,campus:!!G.campus,spots:G.spots,b:G.b,next:G.next&&G.next.at,fount:G.fount,gate:G.gate}))")
        json.dump(d,open('paths/geo.json','w'))
        print(len(d),[g['map'] for g in d])
        await b.close()
asyncio.run(main())
