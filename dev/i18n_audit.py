# 다국어 점검: 가짜 사전(열쇠의 한글을 ㅁ으로 바꾼 것)을 넣고 화면을 돌며, 바뀌지 않고 남은 한국어 글을 모아요
# 열쇠 모양(dev/i18n_keys.json)이 화면 글과 맞는지 보는 도구예요. python3 i18n_audit.py [학교급] [--json 파일]
import asyncio, functools, http.server, json, pathlib, re, sys, threading
from playwright.async_api import async_playwright
from testlib import base, CLEAN, F
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
LANG = next((a.split('=')[1] for a in sys.argv if a.startswith('--lang=')), None)   # --lang=ja: 가짜 사전 대신 진짜 사전으로 보고 화면을 찍어요
URL = f'http://127.0.0.1:{srv.server_address[1]}/dev/test.html?lang=' + (LANG or 'en')
tier = int(next((a for a in sys.argv[1:] if a.isdigit()), '1'))
out = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
keys = json.loads((ROOT / 'dev/i18n_keys.json').read_text())
pseudo = {k: re.sub(r'[가-힣]', 'ㅁ', k) for k in keys}
LEFT = """() => { const o = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) { const n = tw.currentNode, p = n.parentElement; if (!p || !/[가-힣]/.test(n.nodeValue) || p.closest('script,style,[data-i18n-skip]')) continue;
    if (!p.getClientRects().length) continue; o.push(n.nodeValue.trim().slice(0, 90)); }
  return o; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=1, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(base(tier=tier, tg=2, students=60))))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
        if not LANG: await pg.evaluate("(d)=>{ const F=window.__forest; F.setLangTest('en', d); F.i18nMissClear(); F.trEl(document.body); }", pseudo)
        else: await pg.evaluate("()=>window.__forest.i18nMissClear()")
        tabs = await pg.evaluate("()=>[...document.querySelectorAll('.tab[data-tab]')].map(t=>t.dataset.tab)")
        left = {}
        screens = [('tab ' + t, f"F.setTab('{t}')") for t in tabs] + [('건물 교실', "F.setTab('school'); F.openSheet('classroom')")]
        for nm, js in screens:
            try:
                await pg.evaluate(f"()=>{{ const F={F}; {js}; }}"); await pg.wait_for_timeout(700)
            except Exception as e:
                print(nm, '열지 못함', str(e)[:80]); continue
            for x in await pg.evaluate(LEFT): left.setdefault(x, nm)
            if LANG and '--shot' in sys.argv: await pg.screenshot(path=f'/tmp/shot_{LANG}_{nm.replace(" ", "_")}.png')
            await pg.evaluate(CLEAN)
        miss = await pg.evaluate("()=>window.__forest.i18nMiss()")
        print('화면에 남은 한국어', len(left), '놓친 글', len(miss), '오류', errs[:3])
        for x, nm in list(left.items())[:80]: print(' ', nm, '|', x)
        if out: pathlib.Path(out).write_text(json.dumps({'left': left, 'miss': miss}, ensure_ascii=False, indent=1))
        await b.close()
asyncio.run(main())
